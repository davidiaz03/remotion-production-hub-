#!/usr/bin/env python3
"""Genera la música ORIGINAL del reel con MusicGen (Meta) vía transformers.

Tres secciones alineadas a los tres actos (re-timing por la VO):
  A tensa     0–11.77 s  (giro)      -> genera 14 s
  B enérgica  11.77–32.35 s (Ernesto) -> genera 23 s
  C emotiva   32.35–41.5 s (cierre)  -> genera 10 s
Crossfades de 1.5 s en los dos giros dramáticos (11.77 y 32.35 s) y
fade-out de 1 s hacia el sting. Mezcla final a -16 LUFS (2 dB por debajo
de la VO, para que ni a pleno volumen compita con la narración; el
ducking de Video.tsx la baja a 0.25 bajo la voz).

Modelo: facebook/musicgen-small (300M, CPU). transformers, NO audiocraft:
audiocraft no se pudo instalar en este entorno (su dependencia `av` pide
una versión sin wheel para Python 3.12 y compilarla exige las librerías
de desarrollo de FFmpeg, ausentes). Los pesos son los mismos.

Uso: ~/workspace/.musicgen-env/bin/python scripts/gen-music.py
Salida: public/audio/music-ai.wav (48 kHz, -16 LUFS) + las 3 secciones
crudas en public/audio/music-sections/ (por si hay que remezclar).
"""
import json
import os
import subprocess

import numpy as np
import soundfile as sf
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration

PROJECT = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1")
SECTIONS_DIR = os.path.join(PROJECT, "public/audio/music-sections")
OUT_WAV = os.path.join(PROJECT, "public/audio/music-ai.wav")
# Modelo local (NO el ID de HF): el snapshot_download de huggingface_hub
# se quedó atascado descargando los pesos (~67 MB y sin avanzar) a través
# del proxy de egreso; los pesos se bajaron con curl (con resume) a este
# directorio. El resto de archivos se copiaron del caché de HF.
MODEL_ID = os.path.expanduser("~/workspace/.musicgen-models/facebook/musicgen-small")
SR = 32000  # MusicGen genera a 32 kHz

# (nombre, prompt, segundos a generar, inicio en el mix, fin en el mix)
SECTIONS = [
    ("A-tensa",
     "tense cinematic underscore, low pulsing synth bass, sparse somber "
     "piano notes, restrained anger, dark minimal atmosphere, slow steady "
     "pulse, no vocals, no drums, moody",
     14, 0.0, 13.27),
    ("B-energica",
     "driving defiant sports anthem, powerful drums, energetic bassline, "
     "rising orchestral strings, triumphant brass stabs, building "
     "intensity, motivational cinematic trailer music, no vocals",
     23, 11.77, 33.85),
    ("C-emotiva",
     "emotional uplifting cinematic finale, warm strings and piano, "
     "hopeful triumphant resolution, gentle build to a soaring peak, "
     "no vocals",
     10, 32.35, 41.5),
]
CROSSFADE = 1.5  # s, en los dos giros
END_FADE = 1.0   # s, hacia el sting
TARGET_LUFS = -16.0
SEED = 20261115


def lufs_of(path: str) -> float:
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    js = out[out.index("{", out.index("Parsed_loudnorm")):out.index("}", out.index("Parsed_loudnorm")) + 1]
    return float(json.loads(js)["input_i"])


def main() -> None:
    os.makedirs(SECTIONS_DIR, exist_ok=True)
    torch.manual_seed(SEED)
    torch.set_num_threads(2)

    print("Cargando MusicGen-small (CPU)...")
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_ID)
    model.eval()

    audios = []
    for name, prompt, seconds, start, end in SECTIONS:
        print(f"\n== Sección {name}: {seconds} s ==")
        inputs = processor(text=[prompt], padding=True, return_tensors="pt")
        with torch.no_grad():
            out = model.generate(
                **inputs,
                do_sample=True,
                guidance_scale=3.0,
                max_new_tokens=seconds * 50,
                temperature=1.0,
                top_k=250,
            )
        audio = out[0, 0].numpy().astype(np.float32)
        # Normalización suave por sección (pico -1 dB) antes de mezclar.
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak * 0.89
        path = os.path.join(SECTIONS_DIR, f"{name}.wav")
        sf.write(path, audio, SR)
        rms = float(np.sqrt(np.mean(audio ** 2)))
        print(f"  {path}: {len(audio) / SR:.2f} s, RMS {rms:.4f}, pico "
              f"{np.max(np.abs(audio)):.3f}")
        if rms < 0.01:
            print("  AVISO: sección casi silenciosa (RMS < 0.01)")
        audios.append((name, audio, start, end))

    # --- Mezcla con crossfades ---
    total = int(41.5 * SR)
    mix = np.zeros(total, dtype=np.float32)
    for name, audio, start, end in audios:
        s0, s1 = int(start * SR), int(end * SR)
        seg = audio[: s1 - s0]
        if len(seg) < s1 - s0:  # por si la generación salió corta
            seg = np.pad(seg, (0, s1 - s0 - len(seg)))
        # Fade-in en el crossfade inicial (salvo la sección A)
        if start > 0:
            n = int(CROSSFADE * SR)
            seg[:n] *= np.linspace(0, 1, n, dtype=np.float32)
        # Fade-out en el crossfade final (salvo la sección C)
        if end < 41.5:
            n = int(CROSSFADE * SR)
            seg[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
        mix[s0:s1] += seg
    # Fade-out final hacia el sting
    n = int(END_FADE * SR)
    mix[-n:] *= np.linspace(1, 0, n, dtype=np.float32)

    # A 48 kHz con ffmpeg (mejor resampleo que numpy) y medida de LUFS.
    tmp48 = os.path.join(SECTIONS_DIR, "_mix48.wav")
    sf.write(os.path.join(SECTIONS_DIR, "_mix32.wav"), mix, SR)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i",
                    os.path.join(SECTIONS_DIR, "_mix32.wav"),
                    "-ar", "48000", tmp48], check=True)
    measured = lufs_of(tmp48)
    gain_db = TARGET_LUFS - measured
    print(f"\nMezcla medida: {measured:.2f} LUFS -> ganancia {gain_db:+.2f} dB "
          f"para {TARGET_LUFS} LUFS")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp48, "-af",
                    f"volume={gain_db}dB", "-ar", "48000", OUT_WAV],
                   check=True)
    final = lufs_of(OUT_WAV)
    print(f"OK {OUT_WAV} — {final:.2f} LUFS, "
          f"{os.path.getsize(OUT_WAV) / 1e6:.1f} MB")
    for f in ("_mix32.wav", "_mix48.wav"):
        os.remove(os.path.join(SECTIONS_DIR, f))


if __name__ == "__main__":
    main()
