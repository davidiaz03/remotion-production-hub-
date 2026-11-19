#!/usr/bin/env python3
"""Transcribe la VO (faster-whisper, word_timestamps) y alinea las palabras
de Whisper con las palabras del GUION (el texto que se muestra es el guion,
no lo que Whisper cree oír: Whisper normaliza números —"veintiuno"->"21"—,
parte nombres —"Yuraldi"->"Yural de"— y no entiende las iniciales
deletreadas —"O.F.A.C."->"ovf"/"oréfea").

Migración genérica de projects/marabana-v1/scripts/transcribe-vo.py: el
guion (fragmentos + cortes de chunk + keywords) viene de un JSON.

Alineación por fragmento (los límites vienen de vo-lines.json, que son
exactos porque la VO se sintetizó línea por línea): SequenceMatcher sobre
palabras normalizadas + interpolación lineal para las palabras sin ancla.

Salidas:
- captions.ts en el formato de Pilar V30 (CapWord / CapChunk / CapSegment
  / CAPTIONS) — lo que leen los proyectos actuales y capSegmentsToLines.
- Con --out-json, además, el JSON de HubCaption[] (texto con espacio
  inicial salvo la primera palabra, kw, pageBreakAfter en los fines de
  chunk) para el flujo nuevo de shared/captions (whisperWordsToCaptions
  hace lo mismo desde palabras crudas; este JSON es el atajo cuando ya
  se alineó al guion).

Uso:
  ~/workspace/.stt-env/bin/python scripts/audio/transcribe-vo.py \\
      --vo public/audio/vo-preview.wav \\
      --lines-json public/audio/vo-lines.json \\
      --script vo-captions.json --out src/captions.ts
  # vo-captions.json: {"fragments": [{"words": ["¿Sabías", ...],
  #   "chunks": [[0, 4, [3]], [4, 8, [7]]]}]} — chunks = [inicio, fin,
  #   [índices de keywords]] relativos a las palabras del fragmento.
"""
import argparse
import difflib
import json
import os
import re
import sys
import unicodedata

from faster_whisper import WhisperModel

DEFAULT_MODEL = "/home/hatch/workspace/.stt-models/faster-whisper-small"

# Whisper normaliza números a dígitos; el guion los tiene en palabras
# (solo para español).
NUM_MAP_ES = {
    "21": "veintiuno", "14": "catorce", "3": "tres", "3000": "tres",
    "3.000": "tres", "5": "cinco", "10": "diez", "40": "cuadragesima",
    "40a": "cuadragesima",  # "40ª" normaliza a "40a" (NFKD de ª es "a")
    "2012": "2012",
}


def make_norm(num_map: dict):
    def norm(w: str) -> str:
        w = w.lower()
        w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode()
        w = re.sub(r"[^a-z0-9]", "", w)
        return num_map.get(w, w)
    return norm


def align(script_words, whisper_words, frag_start, frag_end, norm):
    """Devuelve [(s, e)] por cada palabra del guion + nº de anclas."""
    sw = [norm(w) for w in script_words]
    ww = [norm(w["word"]) for w in whisper_words]
    sm = difflib.SequenceMatcher(None, ww, sw, autojunk=False)
    anchors = {}  # script_idx -> (s, e)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                anchors[j1 + k] = (whisper_words[i1 + k]["start"],
                                   whisper_words[i1 + k]["end"])
    n = len(script_words)
    times = [None] * n
    for idx, t in anchors.items():
        times[idx] = t
    # Interpolación para palabras sin ancla: entre anclas vecinas (o los
    # bordes del fragmento), repartiendo el hueco por igual.
    known = sorted(anchors)
    bounds = [(-1, frag_start, frag_start)] + [
        (i, anchors[i][0], anchors[i][1]) for i in known
    ] + [(n, frag_end, frag_end)]
    for b in range(len(bounds) - 1):
        i0, _, e0 = bounds[b]
        i1, s1, _ = bounds[b + 1]
        gap = i1 - i0 - 1
        if gap <= 0:
            continue
        span_start, span_end = e0, s1
        step = (span_end - span_start) / gap
        for k in range(gap):
            idx = i0 + 1 + k
            times[idx] = (span_start + k * step, span_start + (k + 1) * step)
    return times, len(anchors)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--vo", required=True)
    p.add_argument("--lines-json", required=True,
                   help="vo-lines.json de gen-vo-piper.py")
    p.add_argument("--script", required=True,
                   help='JSON {"fragments": [{"words": [...], "chunks": [[a, b, [kw]]]}]}')
    p.add_argument("--out", required=True, help="captions.ts de salida")
    p.add_argument("--out-json", help="JSON de HubCaption[] (flujo nuevo)")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--language", default="es")
    p.add_argument("--threads", type=int, default=2,
                   help="Hilos CPU de faster-whisper (defecto 2; la "
                   "caja tiene 1,5 CPU efectivas y más hilos no ayuda)")
    p.add_argument("--fps", type=int, default=30,
                   help="fps para el campo frames de cada segmento")
    p.add_argument("--key-words", default="",
                   help="Palabras de montaje (coma) cuyos tiempos se imprimen")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    with open(a.script, encoding="utf-8") as f:
        fragments = json.load(f)["fragments"]
    if not fragments:
        p.error("sin fragmentos en el guion")
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")
    norm = make_norm(NUM_MAP_ES if a.language == "es" else {})

    # Validación: los chunks de cada fragmento cubren todas sus palabras
    # exactamente una vez, en orden.
    for fi, frag in enumerate(fragments):
        covered = [i for (s, e, _) in frag["chunks"] for i in range(s, e)]
        assert covered == list(range(len(frag["words"]))), \
            f"frag {fi}: chunks no cubren todas las palabras: {covered}"
    with open(a.lines_json, encoding="utf-8") as f:
        lines = json.load(f)["lines"]
    assert len(lines) == len(fragments), "vo-lines.json y el guion difieren"

    import time as _time
    _t0 = _time.perf_counter()
    model = WhisperModel(a.model, device="cpu", compute_type="int8",
                         cpu_threads=max(1, a.threads), num_workers=1,
                         local_files_only=True)
    segments, _ = model.transcribe(a.vo, language=a.language,
                                   word_timestamps=True)
    all_words = []
    for seg in segments:
        all_words.extend({"word": w.word.strip(), "start": w.start, "end": w.end}
                         for w in seg.words)
    print(f"Whisper: {len(all_words)} palabras en total "
          f"({_time.perf_counter() - _t0:.0f} s)")

    key_words = {norm(w) for w in a.key_words.split(",") if w.strip()}
    key_times = {}
    ts_segments = []
    hub_captions = []
    for fi, (frag, meta) in enumerate(zip(fragments, lines)):
        fs, fe = meta["start"], meta["end"]
        ww = [w for w in all_words if fs - 0.15 <= w["start"] <= fe + 0.15]
        times, n_anchored = align(frag["words"], ww, fs, fe, norm)
        print(f"frag {fi:02d}: guion={len(frag['words'])} palabras, "
              f"whisper={len(ww)}, anclas={n_anchored}")
        if n_anchored < len(frag["words"]) * 0.5:
            print(f"  AVISO: alineación pobre en frag {fi}: "
                  f"whisper={[w['word'] for w in ww]}")
        for i, w in enumerate(frag["words"]):
            if norm(w) in key_words:
                key_times[norm(w)] = round(times[i][0], 3)
        chunks = []
        for (s, e, kws) in frag["chunks"]:
            kws = set(kws)
            words = [
                {"t": frag["words"][i].upper(),
                 "s": round(times[i][0], 3), "e": round(times[i][1], 3),
                 "kw": i in kws}
                for i in range(s, e)
            ]
            chunks.append({"start": words[0]["s"], "end": words[-1]["e"],
                           "words": words})
            # HubCaption[]: mismo texto en mayúsculas, espacio inicial
            # salvo la primera palabra del documento, pageBreakAfter en
            # el fin de cada chunk.
            for j, w in enumerate(words):
                gi = len(hub_captions)
                hub_captions.append({
                    "text": w["t"] if gi == 0 else " " + w["t"],
                    "startMs": round(w["s"] * 1000),
                    "endMs": round(w["e"] * 1000),
                    "timestampMs": round(w["s"] * 1000),
                    "confidence": None,
                    **({"kw": True} if w["kw"] else {}),
                    **({"pageBreakAfter": True}
                       if j == len(words) - 1 else {}),
                })
        ts_segments.append({
            "id": fi + 1, "start": fs,
            "frames": round((fe - fs) * a.fps),
            "chunks": chunks,
        })

    if key_times:
        print("\nTiempos clave de montaje:", key_times)

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write("// Auto-generated from the VO wav "
                "(scripts/audio/transcribe-vo.py). Do not edit by hand.\n"
                "// Texto = guion; tiempos = faster-whisper word_timestamps "
                "alineados al guion.\n")
        f.write("export type CapWord = {t: string; s: number; e: number; "
                "kw: boolean};\n")
        f.write("export type CapChunk = {start: number; end: number; "
                "words: CapWord[]};\n")
        f.write("export type CapSegment = {id: number; start: number; "
                "frames: number; chunks: CapChunk[]};\n")
        f.write("export const CAPTIONS: CapSegment[] = ")
        json.dump(ts_segments, f, ensure_ascii=False)
        f.write(";\n")
    print(f"\nOK {a.out} "
          f"({sum(len(s['chunks']) for s in ts_segments)} chunks)")
    if a.out_json:
        with open(a.out_json, "w", encoding="utf-8") as f:
            json.dump(hub_captions, f, ensure_ascii=False, indent=1)
        print(f"OK {a.out_json} ({len(hub_captions)} captions)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
