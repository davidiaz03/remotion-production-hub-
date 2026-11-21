#!/usr/bin/env python3
"""Re-temporiza captions desde los onsets acústicos de la VO.

Causa raíz del hallazgo V5 de marti-fidel (adjudicación V5 § (g)):
los tiempos de palabra de Whisper adelantan sistemáticamente los
bordes tras pausa (mediana firmada −0,21 s; hasta −0,56 s), así
que el karaoke muestra la primera palabra de cada línea 0,20–0,56 s
antes de oírse. Este script corrige los inicios de palabra tras
silencio con el onset acústico real de la VO (envolvente de 10 ms,
`envelope.envelope_onset` — el mismo método que usó el auditor V5
para demostrar el adelanto).

Solo se tocan palabras TRAS SILENCIO (energía ≤ −50 dBFS en los
0,15 s previos, mismo criterio que el check (g) de la auditoría):
en medio de habla continua no hay onset definible por energía y
los tiempos de Whisper ahí no tienen el sesgo post-pausa. Solo se
mueve el INICIO (`s` / `startMs`): BottomKaraoke solo lee `s`, y
los fines quedan como están (el check (b) de fin de caption es
WARN, no FAIL). Los inicios corregidos se acotan para no cruzar
el inicio de la palabra anterior (+0,05 s) ni el fin de la propia
palabra (−0,05 s).

Pausa puenteada (hub-v6): Whisper a veces termina la palabra
anterior tarde Y empieza esta pronto, así que el inicio del
caption cae dentro de la cola de la palabra anterior y el criterio
de silencio previo no dispara (la energía en los 0,15 s previos
es la cola, no silencio). Caso real E2E 21-nov-2026: «MARTÍ» con
s=3,66 s cuando la voz real arranca en 4,12 s (silencio digital
3,7–4,1 s). Segunda oportunidad: si tras `s` hay una racha de
silencio ≥0,15 s seguida de un onset DENTRO de esta palabra
(antes de su fin), ese onset es el inicio real
(`envelope.onset_after_silence`). Sin esa guarda del fin, el
onset podría ser el de la palabra SIGUIENTE.

Formatos: JSON plano de captions (`[{text, startMs, endMs, ...}]`,
el que consume la auditoría) y TS de Remotion (`export const
CAPTIONS: CapSegment[] = [...]`, el que consume el render). El
formato se detecta por extensión; `--out-format` lo fuerza. En TS,
además del `s` de cada palabra, se actualiza el `start` del chunk
cuando la palabra corregida es la primera del chunk (el `start`
del segmento NO se toca: es el slot de la línea, no el inicio de
la primera palabra).

Uso:
  python3 scripts/audio/align-captions.py \\
      --voice projects/marti-fidel/public/audio/v41/vo-real-v41.wav \\
      --captions projects/marti-fidel/public/audio/v41/captions-v41.json \\
      --out /tmp/captions-v51.json --report /tmp/align-v51.json

  python3 scripts/audio/align-captions.py \\
      --voice .../vo-real-v41.wav \\
      --captions projects/marti-fidel/src/captions-v41.ts \\
      --out /tmp/captions-v51.ts

Verificación: `--verify` re-mide los desvíos con los tiempos
corregidos y falla (código 2) si alguno supera SYNC_MAX_S
(0,15 s). El informe JSON (`--report`) lista cada palabra
tras silencio con su desvío antes/después.
"""

import argparse
import json
import math
import os
import re
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import envelope as env  # noqa: E402

SR = 48000
SYNC_MAX_S = 0.15     # (b,g) desvío máximo karaoke/voz (FAIL) — audit-audio.py
CORRECT_MIN_S = 0.05  # corrección mínima: por debajo es ruido de rejilla
PRE_SILENCE_S = 0.15  # ventana previa para decidir "tras silencio"
PRE_SILENCE_DB = -50.0
SEARCH_AFTER_S = 0.6  # búsqueda del onset hasta 0,6 s tras el caption
MIN_GAP_S = 0.05      # separación mínima con la palabra anterior / fin propio


def load_audio_fast(path: str, sr: int = SR) -> np.ndarray:
    """WAV PCM16 mono rápido; si no, ffmpeg (como audit-audio)."""
    import wave
    try:
        with wave.open(path, "rb") as w:
            if w.getframerate() == sr and w.getsampwidth() == 2:
                n, ch = w.getnframes(), w.getnchannels()
                a = np.frombuffer(w.readframes(n),
                                  dtype=np.int16).astype(
                                      np.float32) / 32768.0
                if ch > 1:
                    a = a.reshape(-1, ch).mean(axis=1)
                return a
    except Exception:
        pass
    import subprocess
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vn", "-ar", str(sr),
           "-ac", "1", "-f", "f32le", "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32)


def energy_db(a: np.ndarray, sr: int, t0: float, t1: float) -> float:
    i0, i1 = max(0, int(t0 * sr)), min(len(a), int(t1 * sr))
    if i1 <= i0:
        return -120.0
    seg = a[i0:i1]
    return 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9)


def detect_format(path: str) -> str:
    if path.endswith(".ts"):
        return "ts"
    if path.endswith(".json"):
        return "json"
    raise SystemExit(f"formato no reconocido (usar .json o .ts): {path}")


def load_captions(path: str):
    """-> (formato, datos, texto_original_para_TS).

    JSON: lista plana de palabras. TS: lista de segmentos
    CapSegment (con chunks y words)."""
    fmt = detect_format(path)
    raw = open(path, encoding="utf-8").read()
    if fmt == "json":
        return fmt, json.loads(raw), raw
    m = re.search(r"export const CAPTIONS[^=]*=\s*(\[.*\]);\s*$",
                  raw, re.DOTALL)
    if not m:
        raise SystemExit(f"no se encontró `export const CAPTIONS` en {path}")
    return fmt, json.loads(m.group(1)), raw


def flatten_words(data, fmt: str):
    """Palabras en orden: [{text, s, e, ref}].

    `ref` es la referencia mutable al dict de la palabra (JSON) o
    a la tupla (segmento, chunk, palabra) en TS, para escribir el
    nuevo inicio sin reconstruir la estructura.
    """
    out = []
    if fmt == "json":
        for c in data:
            out.append({"text": c["text"].strip(),
                        "s": c["startMs"] / 1000,
                        "e": c["endMs"] / 1000,
                        "ref": c})
        return out
    for seg in data:
        for ch in seg["chunks"]:
            for w in ch["words"]:
                out.append({"text": w["t"], "s": w["s"], "e": w["e"],
                            "ref": (seg, ch, w)})
    return out


def measure_deviations(words, voice, sr: int):
    """Desvíos caption-vs-onset para palabras tras silencio.

    Devuelve [{word, s, onset, dev}] con dev = s - onset (negativo
    = el karaoke se adelanta a la voz). Las palabras sin silencio
    previo o sin onset detectable no aparecen (sin onset definible
    no hay nada que corregir).
    """
    out = []
    for w in words:
        s = w["s"]
        if energy_db(voice, sr, max(0.0, s - PRE_SILENCE_S), s) \
                > PRE_SILENCE_DB:
            # Segunda oportunidad (hub-v6, pausa puenteada): el
            # inicio cae dentro de la cola de la palabra anterior
            # porque Whisper puenteó la pausa. Si tras s hay una
            # racha de silencio seguida de un onset DENTRO de esta
            # palabra, ese onset es el inicio real. La ventana llega
            # hasta el fin de la palabra (tope 1,5 s): un puente
            # puede superar los 0,6 s de SEARCH_AFTER_S (el inicio
            # puede caer 0,5 s antes de que empiece la pausa), y la
            # guarda del fin impide robar el onset siguiente.
            on = env.onset_after_silence(
                voice, sr, s, min(w["e"], s + 1.5))
            if (on is None or on - s <= CORRECT_MIN_S
                    or on >= w["e"] - MIN_GAP_S):
                continue  # habla continua: sin onset definible
            out.append({"word": w["text"], "s": round(s, 3),
                        "onset": on, "dev": round(s - on, 3),
                        "bridged": True})
            continue
        on = env.envelope_onset(voice, sr, s - 0.05,
                                s + SEARCH_AFTER_S)
        if on is None:
            continue
        out.append({"word": w["text"], "s": round(s, 3),
                    "onset": on, "dev": round(s - on, 3)})
    return out


def align(words, voice, sr: int):
    """Corrige los inicios tras silencio. Devuelve el informe.

    Cada palabra corregida mueve su `s` al onset acústico, acotado
    a [anterior.s + MIN_GAP_S, propia.e - MIN_GAP_S] para no romper
    la monotonía ni vaciar la palabra. En TS también se actualiza
    el `start` del chunk si la palabra es la primera del chunk.
    """
    devs = measure_deviations(words, voice, sr)
    by_s = {(d["word"], d["s"]): d for d in devs}
    report_words = []
    n_corr = 0
    prev_s = -1.0
    for w in words:
        d = by_s.get((w["text"], round(w["s"], 3)))
        entry = {"word": w["text"], "s": round(w["s"], 3),
                 "onset": d["onset"] if d else None,
                 "dev_before": d["dev"] if d else None,
                 "bridged": bool(d.get("bridged")) if d else False,
                 "corrected": False, "s_new": round(w["s"], 3),
                 "dev_after": None}
        if d and abs(d["dev"]) > CORRECT_MIN_S:
            lo = prev_s + MIN_GAP_S
            hi = w["e"] - MIN_GAP_S
            new_s = min(max(d["onset"], lo), hi)
            clamped = new_s != d["onset"]
            w["s"] = round(new_s, 3)
            ref = w["ref"]
            if isinstance(ref, tuple):  # TS: (seg, chunk, word)
                seg, ch, wd = ref
                wd["s"] = w["s"]
                if ch["words"][0] is wd:
                    ch["start"] = w["s"]
            else:  # JSON
                ref["startMs"] = int(round(w["s"] * 1000))
                ref["timestampMs"] = ref["startMs"]
            entry["corrected"] = True
            entry["s_new"] = w["s"]
            entry["clamped"] = clamped
            n_corr += 1
        if d:
            entry["dev_after"] = round(w["s"] - d["onset"], 3)
        report_words.append(entry)
        prev_s = w["s"]
    return {"words": report_words, "n_after_silence": len(devs),
            "n_bridged": sum(1 for d in devs if d.get("bridged")),
            "n_corrected": n_corr}


def write_captions(path: str, fmt: str, data, raw_ts: str = None):
    if fmt == "json":
        json.dump(data, open(path, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        return
    # TS: sustituir solo el literal del array; el resto del archivo
    # (comentario de cabecera, tipos) queda byte-idéntico.
    body = json.dumps(data, ensure_ascii=False, separators=(", ", ": "))
    new = re.sub(r"(export const CAPTIONS[^=]*=\s*)\[.*\];\s*$",
                 lambda m: m.group(1) + body + ";\n", raw_ts,
                 flags=re.DOTALL)
    open(path, "w", encoding="utf-8").write(new)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--voice", required=True, help="VO (WAV)")
    p.add_argument("--captions", required=True,
                   help="captions.json o captions-v41.ts")
    p.add_argument("--out", required=True, help="captions corregidos")
    p.add_argument("--out-format", choices=["json", "ts"],
                   help="formato de salida (por defecto, el de entrada)")
    p.add_argument("--report", help="informe JSON de desvíos")
    p.add_argument("--verify", action="store_true",
                   help="re-medir tras corregir y fallar si algún "
                   "desvío supera SYNC_MAX_S (0,15 s)")
    p.add_argument("--dry-run", action="store_true",
                   help="medir sin escribir la salida")
    a = p.parse_args()

    fmt, data, raw_ts = load_captions(a.captions)
    out_fmt = a.out_format or fmt
    if out_fmt != fmt:
        raise SystemExit("la conversión json<->ts no está soportada: "
                         "la salida usa el formato de entrada")
    voice = load_audio_fast(a.voice)
    words = flatten_words(data, fmt)
    rep = align(words, voice, SR)

    devs_before = [abs(w["dev_before"]) for w in rep["words"]
                   if w["dev_before"] is not None]
    devs_after = [abs(w["dev_after"]) for w in rep["words"]
                  if w["dev_after"] is not None]
    n_bad_before = sum(1 for d in devs_before if d > SYNC_MAX_S)
    n_bad_after = sum(1 for d in devs_after if d > SYNC_MAX_S)
    rep["summary"] = {
        "n_words": len(words),
        "n_after_silence": rep["n_after_silence"],
        "n_bridged": rep["n_bridged"],
        "n_corrected": rep["n_corrected"],
        "max_abs_dev_before": round(max(devs_before), 3)
        if devs_before else None,
        "max_abs_dev_after": round(max(devs_after), 3)
        if devs_after else None,
        "n_over_threshold_before": n_bad_before,
        "n_over_threshold_after": n_bad_after,
    }
    print(f"palabras: {len(words)}; tras silencio: "
          f"{rep['n_after_silence']} "
          f"(puenteadas: {rep['n_bridged']}); "
          f"corregidas: {rep['n_corrected']}")
    print(f"desvío máx: {rep['summary']['max_abs_dev_before']}s -> "
          f"{rep['summary']['max_abs_dev_after']}s "
          f"(umbral {SYNC_MAX_S}s)")
    print(f"sobre el umbral: {n_bad_before} -> {n_bad_after}")
    for w in rep["words"]:
        if w["corrected"]:
            print(f"  {w['word']}: {w['s']:.3f}s -> {w['s_new']:.3f}s "
                  f"(desvío {w['dev_before']:+.3f}s -> "
                  f"{w['dev_after']:+.3f}s)"
                  f"{' [puenteada]' if w.get('bridged') else ''}"
                  f"{' [acotado]' if w.get('clamped') else ''}")

    if a.report:
        json.dump(rep, open(a.report, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print(f"informe: {a.report}")
    if not a.dry_run:
        write_captions(a.out, fmt, data, raw_ts)
        print(f"captions corregidos: {a.out}")
    if a.verify and n_bad_after:
        print(f"VERIFY FAIL: {n_bad_after} desvíos sobre {SYNC_MAX_S}s",
              file=sys.stderr)
        return 2
    if a.verify:
        print("VERIFY PASS: todos los desvíos bajo el umbral")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
