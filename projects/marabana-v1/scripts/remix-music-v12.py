#!/usr/bin/env python3
"""V1.2 — REMEZCLA la música existente (NO regenera: el usuario ya aprobó
estas tres secciones de MusicGen).

La línea nueva de VO (+3.067 s) desplaza el beat de Ernesto de 32.91 s a
35.976 s, así que la sección B (enérgica) debe cubrir más tiempo:
  A tensa     0–13.27 s      (sin cambio; crossfade 11.77–13.27)
  B enérgica  11.77–36.916 s (estirada con atempo 0.9122: 22.94 -> 25.15 s;
                             ~9% más lenta, misma melodía aprobada, sin
                             cortes ni bucles audibles)
  C emotiva   35.416–44.57 s (primeros 9.15 s del crudo de 9.94 s;
                             crossfade 35.416–36.916 centrado en Ernesto,
                             igual que en V1.1)
Fade-out final de 1 s; la mezcla termina 0.4 s antes del sting (44.97 s),
igual que en V1.1 (41.5 -> 41.90).

Receta idéntica a gen-music.py: mezcla numpy a 32 kHz, resampleo a 48 kHz
con ffmpeg, sonoridad a -16 LUFS. La música sigue en mono (decisión
documentada en EDIT_NOTES.md: MusicGen genera mono y el paso a estéreo
no aporta nada bajo el ducking de la VO).

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/remix-music-v12.py
Salida: public/audio/music-ai.wav (48 kHz mono, -16 LUFS).
"""
import json
import os
import shutil
import subprocess

import numpy as np
import soundfile as sf

PROJECT = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1")
SECTIONS_DIR = os.path.join(PROJECT, "public/audio/music-sections")
OUT_WAV = os.path.join(PROJECT, "public/audio/music-ai.wav")
SR = 32000
CROSSFADE = 1.5
END_FADE = 1.0
TARGET_LUFS = -16.0
TOTAL = 44.57  # s (0.4 s antes del sting, como en V1.1)

# (archivo, inicio en el mix, fin en el mix, atempo o None)
SECTIONS = [
    ("A-tensa.wav", 0.0, 13.27, None),
    ("B-energica.wav", 11.77, 36.916, 0.9122),
    ("C-emotiva.wav", 35.416, TOTAL, None),
]


def lufs_of(path: str) -> float:
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    js = out[out.index("{", out.index("Parsed_loudnorm")):out.index("}", out.index("Parsed_loudnorm")) + 1]
    return float(json.loads(js)["input_i"])


def load(path: str, atempo: float | None) -> np.ndarray:
    if atempo is None:
        audio, rate = sf.read(path, dtype="float32")
        assert rate == SR
        return audio
    tmp = "/tmp/b-stretched.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-af",
                    f"atempo={atempo}", "-ar", str(SR), tmp], check=True)
    audio, rate = sf.read(tmp, dtype="float32")
    print(f"  B estirada con atempo {atempo}: {len(audio) / SR:.3f} s")
    return audio


def main():
    total = int(TOTAL * SR)
    mix = np.zeros(total, dtype=np.float32)
    for name, start, end, atempo in SECTIONS:
        audio = load(os.path.join(SECTIONS_DIR, name), atempo)
        s0, s1 = int(start * SR), int(end * SR)
        seg = audio[: s1 - s0]
        if len(seg) < s1 - s0:
            seg = np.pad(seg, (0, s1 - s0 - len(seg)))
        if start > 0:
            n = int(CROSSFADE * SR)
            seg[:n] *= np.linspace(0, 1, n, dtype=np.float32)
        if end < TOTAL:
            n = int(CROSSFADE * SR)
            seg[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
        mix[s0:s1] += seg
        print(f"  {name}: {start:.3f}-{end:.3f} s")
    n = int(END_FADE * SR)
    mix[-n:] *= np.linspace(1, 0, n, dtype=np.float32)

    tmp32 = os.path.join(SECTIONS_DIR, "_mix32-v12.wav")
    tmp48 = os.path.join(SECTIONS_DIR, "_mix48-v12.wav")
    sf.write(tmp32, mix, SR)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp32,
                    "-ar", "48000", tmp48], check=True)
    measured = lufs_of(tmp48)
    gain_db = TARGET_LUFS - measured
    print(f"Mezcla medida: {measured:.2f} LUFS -> ganancia {gain_db:+.2f} dB "
          f"para {TARGET_LUFS} LUFS")
    backup = os.path.join(PROJECT, "public/audio/music-ai-v11.wav")
    if not os.path.exists(backup):
        shutil.copy(OUT_WAV, backup)
        print("copia de seguridad:", backup)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp48, "-af",
                    f"volume={gain_db}dB", "-ar", "48000", OUT_WAV],
                   check=True)
    final = lufs_of(OUT_WAV)
    print(f"OK {OUT_WAV} — {final:.2f} LUFS, "
          f"{os.path.getsize(OUT_WAV) / 1e6:.1f} MB")
    for f in (tmp32, tmp48):
        os.remove(f)


if __name__ == "__main__":
    main()
