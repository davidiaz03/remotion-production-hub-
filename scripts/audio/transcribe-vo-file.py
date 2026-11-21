#!/usr/bin/env python3
"""Transcribe una VO de UN SOLO ARCHIVO y la alinea con el guion.

Hermano de `transcribe-vo.py` para el caso que ese script NO cubre:
una voz en off grabada en un solo archivo (p. ej. la locutora real
graba las 11 líneas seguidas), sin `vo-lines.json` de límites exactos
por línea. Aquí los límites de línea se DESCUBREN desde la propia
transcripción: un solo SequenceMatcher entre todas las palabras de
Whisper y todas las del guion, con interpolación para las palabras
sin ancla (misma idea que `transcribe-vo.py:align`, pero sobre el
documento completo y devolviendo qué palabras quedaron ancladas para
el informe por línea).

El texto que se muestra es el GUION, no lo que Whisper cree oír
(misma razón que en transcribe-vo.py: Whisper normaliza números,
parte nombres y no entiende iniciales deletreadas).

Salidas (idénticas a transcribe-vo.py):
- captions.ts en el formato de Pilar V30 (CapWord / CapChunk /
  CapSegment / CAPTIONS) — lo que leen los proyectos y
  capSegmentsToLines.
- Con --out-json, además, el JSON de HubCaption[].

Chunks: hasta 4 palabras, con corte tras puntuación fuerte
(.,;:!?¡¿…). Las keywords (--key-words, coma) marcan kw.

Uso (trabajo pesado: Whisper; envolver con el candado de la noche
o el de render si otros trabajadores renderizan a la vez):
  ~/workspace/.stt-env/bin/python scripts/audio/transcribe-vo-file.py \\
      --vo public/audio/vo.wav --script GUION.md \\
      --out src/captions.ts --out-json research/captions.json
  # GUION.md: una línea de VO por línea de texto; las líneas vacías
  # y las que empiezan por # se ignoran.
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata

# Normalización de palabras para la alineación: COPIA de
# transcribe-vo.py:make_norm (no se importa ese módulo porque su
# import de faster_whisper a nivel superior impediría probar las
# funciones puras de este script en el venv del hub, que no tiene
# faster-whisper; el modelo solo se necesita en main()). Si cambia
# la normalización, cambiarla en los dos sitios.
NUM_MAP_ES = {
    "21": "veintiuno", "14": "catorce", "3": "tres", "3000": "tres",
    "3.000": "tres", "5": "cinco", "10": "diez", "40": "cuadragesima",
    "40a": "cuadragesima",
    "2012": "2012",
}


def make_norm(num_map):
    def norm(w):
        w = w.lower()
        w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode()
        w = re.sub(r"[^a-z0-9]", "", w)
        return num_map.get(w, w)
    return norm

DEFAULT_MODEL = "/home/hatch/workspace/.stt-models/faster-whisper-small"
MAX_CHUNK_WORDS = 4
STRONG_PUNCT = set(".,;:!?¡¿…")


def parse_script(path):
    """Líneas de VO: no vacías, sin las que empiezan por #."""
    lines = []
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            lines.append(line)
    if not lines:
        raise SystemExit(f"guion sin líneas: {path}")
    return lines


def words_of(line):
    return line.split()


def chunk_words(n_words, punct_breaks):
    """Cortes de chunk: hasta MAX_CHUNK_WORDS, con corte tras
    puntuación fuerte. Devuelve [(inicio, fin_exclusivo)]."""
    chunks = []
    start = 0
    for i in range(n_words):
        last_in_chunk = (i - start + 1) >= MAX_CHUNK_WORDS
        if i in punct_breaks or last_in_chunk:
            chunks.append((start, i + 1))
            start = i + 1
    if start < n_words:
        chunks.append((start, n_words))
    return chunks


def align_words(script_words, whisper_words, start, end, norm):
    """Alinea palabras del guion con las de Whisper (SequenceMatcher
    + interpolación). Devuelve (times, anchored): times[i] = (s, e)
    por palabra del guion; anchored[i] = True si tiene ancla real
    (no interpolada). Misma idea que transcribe-vo.align, sobre el
    documento completo."""
    sw = [norm(w) for w in script_words]
    ww = [norm(w["word"]) for w in whisper_words]
    sm = difflib.SequenceMatcher(None, ww, sw, autojunk=False)
    anchors = {}
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                anchors[j1 + k] = (whisper_words[i1 + k]["start"],
                                   whisper_words[i1 + k]["end"])
    n = len(script_words)
    times = [None] * n
    anchored = [False] * n
    for idx, t in anchors.items():
        times[idx] = t
        anchored[idx] = True
    known = sorted(anchors)
    bounds = [(-1, start, start)] + [
        (i, anchors[i][0], anchors[i][1]) for i in known
    ] + [(n, end, end)]
    for b in range(len(bounds) - 1):
        i0, _, e0 = bounds[b]
        i1, s1, _ = bounds[b + 1]
        gap = i1 - i0 - 1
        if gap <= 0:
            continue
        step = (s1 - e0) / gap
        for k in range(gap):
            idx = i0 + 1 + k
            times[idx] = (e0 + k * step, e0 + (k + 1) * step)
    return times, anchored


def build_segments(lines, times, fps, vo_duration, key_words, norm):
    """Guion + tiempos por palabra -> CapSegment[]. Cada línea del
    guion es un segmento; su `frames` cubre hasta el inicio de la
    siguiente línea (la última, hasta el fin de la VO)."""
    segments = []
    offset = 0
    line_words = [words_of(line) for line in lines]
    for li, words in enumerate(line_words):
        n = len(words)
        wtimes = times[offset:offset + n]
        offset += n
        seg_start = wtimes[0][0]
        if li + 1 < len(line_words):
            next_start = times[offset][0]
        else:
            next_start = vo_duration
        punct = {i for i, w in enumerate(words)
                 if w and w[-1] in STRONG_PUNCT}
        chunks = []
        for (s, e) in chunk_words(n, punct):
            cwords = [
                {"t": words[i].upper(),
                 "s": round(wtimes[i][0], 3), "e": round(wtimes[i][1], 3),
                 "kw": norm(words[i]) in key_words}
                for i in range(s, e)
            ]
            chunks.append({"start": cwords[0]["s"], "end": cwords[-1]["e"],
                           "words": cwords})
        segments.append({
            "id": li + 1, "start": round(seg_start, 3),
            "frames": max(1, round((next_start - seg_start) * fps)),
            "chunks": chunks,
        })
    return segments


def to_typescript(segments, header_note=""):
    out = ["// Auto-generated from the VO wav "
           "(scripts/audio/transcribe-vo-file.py). Do not edit by hand.",
           "// Texto = guion; tiempos = faster-whisper word_timestamps "
           "alineados al guion (VO de un solo archivo)."]
    if header_note:
        out.append(f"// {header_note}")
    out.append("export type CapWord = {t: string; s: number; e: number; "
               "kw: boolean};")
    out.append("export type CapChunk = {start: number; end: number; "
               "words: CapWord[]};")
    out.append("export type CapSegment = {id: number; start: number; "
               "frames: number; chunks: CapChunk[]};")
    out.append("export const CAPTIONS: CapSegment[] = "
               + json.dumps(segments, ensure_ascii=False) + ";")
    return "\n".join(out) + "\n"


def to_hub_captions(segments):
    """CapSegment[] -> HubCaption[] (misma forma que transcribe-vo.py
    --out-json: mayúsculas, espacio inicial salvo la primera palabra,
    pageBreakAfter al fin de cada chunk)."""
    caps = []
    for seg in segments:
        for ch in seg["chunks"]:
            for j, w in enumerate(ch["words"]):
                gi = len(caps)
                caps.append({
                    "text": w["t"] if gi == 0 else " " + w["t"],
                    "startMs": round(w["s"] * 1000),
                    "endMs": round(w["e"] * 1000),
                    "timestampMs": round(w["s"] * 1000),
                    "confidence": None,
                    **({"kw": True} if w["kw"] else {}),
                    **({"pageBreakAfter": True}
                       if j == len(ch["words"]) - 1 else {}),
                })
    return caps


def vo_duration_seconds(vo_path, fallback):
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries",
             "format=duration", "-of", "csv=p=0", vo_path],
            capture_output=True, text=True, timeout=30)
        d = float(r.stdout.strip())
        if d > 0:
            return d
    except (ValueError, OSError, subprocess.SubprocessError):
        pass
    return fallback


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--vo", required=True, help="VO (un solo archivo)")
    p.add_argument("--script", required=True,
                   help="Guion: una línea de VO por línea de texto")
    p.add_argument("--out", required=True, help="captions.ts de salida")
    p.add_argument("--out-json", help="JSON de HubCaption[]")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--language", default="es")
    p.add_argument("--threads", type=int, default=2)
    p.add_argument("--fps", type=int, default=30)
    p.add_argument("--key-words", default="",
                   help="Palabras clave (coma) que marcan kw")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    lines = parse_script(a.script)
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")
    norm = make_norm(NUM_MAP_ES if a.language == "es" else {})

    from faster_whisper import WhisperModel
    import time as _time
    _t0 = _time.perf_counter()
    model = WhisperModel(a.model, device="cpu", compute_type="int8",
                         cpu_threads=max(1, a.threads), num_workers=1,
                         local_files_only=True)
    segments, _ = model.transcribe(a.vo, language=a.language,
                                   word_timestamps=True)
    all_words = []
    for seg in segments:
        all_words.extend({"word": w.word.strip(), "start": w.start,
                          "end": w.end} for w in seg.words)
    print(f"Whisper: {len(all_words)} palabras "
          f"({_time.perf_counter() - _t0:.0f} s)")

    script_words = [w for line in lines for w in words_of(line)]
    last_end = all_words[-1]["end"] if all_words else 0.0
    duration = vo_duration_seconds(a.vo, last_end)
    times, anchored = align_words(script_words, all_words, 0.0, duration,
                                  norm)
    key_words = {norm(w) for w in a.key_words.split(",") if w.strip()}
    cap_segments = build_segments(lines, times, a.fps, duration,
                                  key_words, norm)

    # Informe por línea: una línea con pocas anclas es una línea que
    # Whisper oyó distinto (o que la locutora dijo distinto del guion).
    offset = 0
    for li, line in enumerate(lines):
        n = len(words_of(line))
        n_anch = sum(anchored[offset:offset + n])
        offset += n
        flag = "" if n_anch >= n * 0.5 else "  AVISO: alineación pobre"
        print(f"línea {li + 1:02d}: guion={n} palabras, "
              f"anclas={n_anch}{flag}")
        if flag:
            print(f"  guion: {line}")

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(to_typescript(cap_segments))
    n_chunks = sum(len(s["chunks"]) for s in cap_segments)
    print(f"\nOK {a.out} ({len(cap_segments)} segmentos, "
          f"{n_chunks} chunks)")
    if a.out_json:
        with open(a.out_json, "w", encoding="utf-8") as f:
            json.dump(to_hub_captions(cap_segments), f,
                      ensure_ascii=False, indent=1)
        print(f"OK {a.out_json}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
