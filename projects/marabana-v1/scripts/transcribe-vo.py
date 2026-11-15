#!/usr/bin/env python3
"""Transcribe la VO (faster-whisper, word_timestamps) y alinea las palabras
de Whisper con las palabras del GUION (el texto que se muestra es el guion,
no lo que Whisper cree oír: Whisper normaliza números —"veintiuno"->"21"—,
parte nombres —"Yuraldi"->"Yural de"— y no entiende las iniciales
deletreadas —"O.F.A.C."->"ovf"/"oréfea").

Alineación por fragmento (los límites vienen de vo-lines.json, que son
exactos porque la VO se sintetizó línea por línea): SequenceMatcher sobre
palabras normalizadas + interpolación lineal para las palabras sin ancla.

Salida: src/captions.ts en el formato de Pilar V30
(CapWord {t, s, e, kw} / CapChunk / CapSegment / CAPTIONS).
También imprime los tiempos de las palabras-clave de montaje ("canceló",
"casi") que usa timeline.ts.

Uso: ~/workspace/.stt-env/bin/python scripts/transcribe-vo.py
"""
import difflib
import json
import os
import re
import unicodedata

from faster_whisper import WhisperModel

PROJECT = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1")
VO = os.path.join(PROJECT, "public/audio/vo-preview.wav")
LINES_JSON = os.path.join(PROJECT, "public/audio/vo-lines.json")
OUT_TS = os.path.join(PROJECT, "src/captions.ts")
MODEL = "/home/hatch/workspace/.stt-models/faster-whisper-small"

# Palabras del guion por fragmento (TEXTO A MOSTRAR, en mayúsculas como
# en V30) + cortes de chunk (índices de palabra) + keywords (índices).
# Los índices son relativos a las palabras del fragmento.
FRAGMENTS = [
    # L1 gancho
    dict(words="¿Sabías que el bloqueo llegó hasta el maratón?".split(),
         chunks=[(0, 4, {3}), (4, 8, {7})]),
    # L2 2012 — "OFAC" se muestra así (el TTS deletreó O.F.A.C.)
    dict(words="En 2012, la OFAC canceló el programa que traía corredores de Estados Unidos a Marabana.".split(),
         chunks=[(0, 4, {1}), (4, 7, {4}), (7, 10, {9}), (10, 15, {14})]),
    # L3 21
    dict(words="Un año antes, veintiuno habían corrido en La Habana.".split(),
         chunks=[(0, 4, {3}), (4, 9, {8})]),
    # L4 giro
    dict(words="Pero a pesar de ello…".split(),
         chunks=[(0, 5, {4})]),
    # L5 bucle abierto (V1.2: insertada tras el giro, antes del mecanismo;
    # promete una historia al final sin revelar a Ernesto)
    dict(words="Quédate hasta el final. Hay una historia que lo resume todo.".split(),
         chunks=[(0, 4, {0, 3}), (4, 11, {6})]),
    # L5 3.000 (V1.1: "cuadragésima", no "cuarenta" — corrección de auditoría)
    dict(words="Hoy, catorce años después, casi tres mil corredores tomaron las calles de La Habana en la cuadragésima edición de Marabana.".split(),
         chunks=[(0, 4, {0}), (4, 8, {5, 6}), (8, 14, {10}), (14, 20, {19})]),
    # L6 5K
    dict(words="Y los cinco kilómetros se llamaron Carrera contra el Bloqueo y por la Paz.".split(),
         chunks=[(0, 4, {2}), (4, 8, {6}), (8, 14, {9})]),
    # L7 cita
    dict(words="Como dijo el corredor Yuraldi Cava: «El bloqueo asfixia al pueblo cubano».".split(),
         chunks=[(0, 6, {4}), (6, 9, {7}), (9, 12, {11})]),
    # L8 ganadores
    dict(words="En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas.".split(),
         chunks=[(0, 4, {2}), (4, 7, {4}), (7, 12, {11}), (12, 15, {14})]),
    # L9a Ernesto
    dict(words="Y Ernesto Javier Consuegra completó los diez kilómetros…".split(),
         chunks=[(0, 4, {1}), (4, 8, {7})]),
    # L9b bastón
    dict(words="con un bastón.".split(),
         chunks=[(0, 3, {2})]),
    # L10 cierre
    dict(words="Hoy La Habana corrió. Y cada paso fue una denuncia.".split(),
         chunks=[(0, 4, {3}), (4, 10, {9})]),
]

# Whisper normaliza números a dígitos; el guion los tiene en palabras.
NUM_MAP = {
    "21": "veintiuno", "14": "catorce", "3": "tres", "3000": "tres",
    "3.000": "tres", "5": "cinco", "10": "diez", "40": "cuadragesima",
    "40a": "cuadragesima",  # "40ª" normaliza a "40a" (NFKD de ª es "a")
    "2012": "2012",
}


def norm(w: str) -> str:
    w = w.lower()
    w = unicodedata.normalize("NFKD", w).encode("ascii", "ignore").decode()
    w = re.sub(r"[^a-z0-9]", "", w)
    return NUM_MAP.get(w, w)


def align(script_words, whisper_words, frag_start, frag_end):
    """Devuelve [(s, e)] por cada palabra del guion."""
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


def main():
    # Validación: los chunks de cada fragmento cubren todas sus palabras
    # exactamente una vez, en orden.
    for fi, frag in enumerate(FRAGMENTS):
        covered = [i for (a, b, _) in frag["chunks"] for i in range(a, b)]
        assert covered == list(range(len(frag["words"]))), \
            f"frag {fi}: chunks no cubren todas las palabras: {covered}"
    with open(LINES_JSON, encoding="utf-8") as f:
        lines = json.load(f)["lines"]
    assert len(lines) == len(FRAGMENTS), "vo-lines.json y FRAGMENTS difieren"

    model = WhisperModel(MODEL, device="cpu", compute_type="int8",
                         local_files_only=True)
    segments, _ = model.transcribe(VO, language="es", word_timestamps=True)
    all_words = []
    for seg in segments:
        all_words.extend({"word": w.word.strip(), "start": w.start, "end": w.end}
                         for w in seg.words)
    print(f"Whisper: {len(all_words)} palabras en total")

    ts_segments = []
    key_times = {}
    for fi, (frag, meta) in enumerate(zip(FRAGMENTS, lines)):
        fs, fe = meta["start"], meta["end"]
        ww = [w for w in all_words if fs - 0.15 <= w["start"] <= fe + 0.15]
        times, n_anchored = align(frag["words"], ww, fs, fe)
        print(f"frag {fi:02d}: guion={len(frag['words'])} palabras, "
              f"whisper={len(ww)}, anclas={n_anchored}")
        if n_anchored < len(frag["words"]) * 0.5:
            print(f"  AVISO: alineación pobre en frag {fi}: "
                  f"whisper={[w['word'] for w in ww]}")
        # Palabras-clave de montaje
        for i, w in enumerate(frag["words"]):
            if norm(w) in ("cancelo", "casi"):
                key_times[norm(w)] = round(times[i][0], 3)
        chunks = []
        for (a, b, kws) in frag["chunks"]:
            words = [
                {"t": frag["words"][i].upper(),
                 "s": round(times[i][0], 3), "e": round(times[i][1], 3),
                 "kw": i in kws}
                for i in range(a, b)
            ]
            chunks.append({"start": words[0]["s"], "end": words[-1]["e"],
                           "words": words})
        ts_segments.append({
            "id": fi + 1, "start": fs,
            "frames": round((fe - fs) * 30),
            "chunks": chunks,
        })

    print("\nTiempos clave de montaje:", key_times)

    with open(OUT_TS, "w", encoding="utf-8") as f:
        f.write("// Auto-generated from public/audio/vo-preview.wav "
                "(scripts/transcribe-vo.py). Do not edit by hand.\n"
                "// Texto = guion (VO_SCRIPT.md); tiempos = faster-whisper "
                "word_timestamps alineados al guion.\n")
        f.write("export type CapWord = {t: string; s: number; e: number; "
                "kw: boolean};\n")
        f.write("export type CapChunk = {start: number; end: number; "
                "words: CapWord[]};\n")
        f.write("export type CapSegment = {id: number; start: number; "
                "frames: number; chunks: CapChunk[]};\n")
        f.write("export const CAPTIONS: CapSegment[] = ")
        json.dump(ts_segments, f, ensure_ascii=False)
        f.write(";\n")
    print(f"\nOK {OUT_TS} ({sum(len(s['chunks']) for s in ts_segments)} chunks)")


if __name__ == "__main__":
    main()
