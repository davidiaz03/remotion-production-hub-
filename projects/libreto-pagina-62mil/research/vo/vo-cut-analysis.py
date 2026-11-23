#!/usr/bin/env python3
"""Análisis de envolvente RMS para refinar los puntos de corte de la VO.

Lee vo-original-16k.wav (16 kHz mono), calcula RMS por ventana de
10 ms en dBFS e imprime los intervalos de silencio (>=120 ms bajo
el umbral) dentro de las regiones de interés, para localizar el
onset real de cada toma conservada (los tiempos de palabra de
Whisper absorben la pausa previa: la palabra empieza demasiado
pronto tras un silencio).

Uso: python3 vo-cut-analysis.py
"""
import math
import wave

import numpy as np

WAV = "vo-original-16k.wav"
THRESH_DB = -45.0   # por debajo = silencio (tono de sala)
MIN_SIL_MS = 120    # duración mínima de silencio
HOP_MS = 10

with wave.open(WAV, "rb") as w:
    sr = w.getframerate()
    n = w.getnframes()
    raw = w.readframes(n)
pcm = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
dur = len(pcm) / sr
print(f"wav: {sr} Hz, {dur:.2f} s, pico {20*math.log10(np.max(np.abs(pcm))+1e-12):.1f} dBFS")

hop = int(sr * HOP_MS / 1000)
nframes = len(pcm) // hop
rms = np.sqrt(np.mean(pcm[: nframes * hop].reshape(nframes, hop) ** 2, axis=1))
db = 20 * np.log10(rms + 1e-9)
silent = db < THRESH_DB

# Intervalos de silencio contiguos >= MIN_SIL_MS
min_frames = MIN_SIL_MS // HOP_MS
intervals = []
start = None
for i, s in enumerate(silent):
    if s and start is None:
        start = i
    elif not s and start is not None:
        if i - start >= min_frames:
            intervals.append((start * HOP_MS / 1000, i * HOP_MS / 1000))
        start = None
if start is not None and nframes - start >= min_frames:
    intervals.append((start * HOP_MS / 1000, nframes * HOP_MS / 1000))

print(f"\n{len(intervals)} intervalos de silencio >= {MIN_SIL_MS} ms bajo {THRESH_DB} dBFS")

REGIONS = {
    "LEAD-IN (0-10s)": (0.0, 10.0),
    "R1 la página x2 (88-96s)": (88.0, 97.0),
    "R2 tuit inglés x2 (219-228s)": (219.0, 229.0),
    "R3 peligroso x2 (392-398s)": (392.0, 399.0),
    "R4 confirmación x2 (418-424s)": (418.0, 424.0),
    "R5 tres comprobaciones x2 (495-506s)": (495.0, 506.0),
    "R6 segundo/segunda (517-523s)": (517.0, 523.0),
    "R7 imagen que parece real x3 (555-563s)": (555.0, 563.0),
    "R8 la única defensa x2 (562-568s)": (562.0, 568.0),
    "TRAILING (584-590.5s)": (584.0, 590.51),
}
for name, (a, b) in REGIONS.items():
    print(f"\n--- {name} ---")
    for s, e in intervals:
        if e > a and s < b:
            print(f"  silencio {s:7.2f} - {e:7.2f}  ({e-s:5.2f}s)")
    # Nivel medio en la región (para calibrar el umbral)
    i0, i1 = int(a * 1000 / HOP_MS), int(b * 1000 / HOP_MS)
    seg = db[i0:i1]
    print(f"  nivel: mediana {np.median(seg):.1f} dBFS, p10 {np.percentile(seg,10):.1f}, p90 {np.percentile(seg,90):.1f}")

# Nivel del tono de sala en el lead-in (primeros 8 s)
seg = db[0 : int(8 * 1000 / HOP_MS)]
print(f"\nTono de sala (0-8s): mediana {np.median(seg):.1f} dBFS, p90 {np.percentile(seg,90):.1f}")
