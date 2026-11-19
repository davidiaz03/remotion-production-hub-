#!/usr/bin/env python3
"""Genera música ORIGINAL por secciones con MusicGen (Meta) vía transformers.

Migración genérica de projects/marabana-v1/scripts/gen-music.py: las
secciones (prompt, duración, posición en el mix) vienen de un JSON en vez
de estar cableadas para Marabana.

Modelo: facebook/musicgen-small (300M, CPU). transformers, NO audiocraft:
audiocraft no se pudo instalar en este entorno (su dependencia `av` pide
una versión sin wheel para Python 3.12 y compilarla exige las librerías
de desarrollo de FFmpeg, ausentes). Los pesos son los mismos.

El modelo local es ~/workspace/.musicgen-models/facebook/musicgen-small
(NO el ID de HF): el snapshot_download de huggingface_hub se quedó
atascado descargando los pesos a través del proxy de egreso; los pesos
se bajaron con curl (con resume) a ese directorio.

La música es MONO (MusicGen-small) y se mezcla a -16 LUFS como STEM
(2 dB por debajo de la VO; el ducking de mix.py la baja bajo la voz).
El objetivo final del REEL es -14,5 LUFS (ver mix.py); no confundir.

Uso:
  ~/workspace/.musicgen-env/bin/python scripts/audio/gen-music.py \\
      --sections sections.json --out public/audio/music-ai.wav
  # sections.json: [{"name": "A-tensa", "prompt": "...", "generate": 14,
  #   "start": 0.0, "end": 13.27}, ...]
  # Salida: <out> (48 kHz, -16 LUFS) + secciones crudas en
  # <out-dir>/music-sections/ (por si hay que remezclar).

OJO: la generación en CPU es el paso más lento del reel. Velocidad
REAL medida en esta caja (1,5 CPU): ~30 min por sección de 60 s
(modern-wisdom-aprende, 19-nov-2026: probe + 3×60 s = 1 h 46 min).
Para video largo NO regeneres la cama en cada proyecto: usa la
biblioteca de camas pregeneradas (assets/music-beds/ + registry.json,
ver scripts/audio/bed-loop.py) y reserva MusicGen para camas nuevas
que la biblioteca no cubra. Avisar al usuario del tiempo antes de
lanzar una generación nueva.

Acelerante medido (19-nov-2026, 10 s de audio): --guidance-scale 1.0
(sin classifier-free guidance: 1 pase por token en vez de 2) tarda
120 s frente a 201 s con el defecto 3.0 (1,7x). NO es el defecto
porque no se verificó de oído si la música sigue el prompt igual de
bien; para una cama ambiental bajo narración es probablemente
aceptable, pero la primera cama con gs=1.0 debe escucharse antes de
usarla en un video serio.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration

DEFAULT_MODEL = os.path.expanduser(
    "~/workspace/.musicgen-models/facebook/musicgen-small")
SR = 32000  # MusicGen genera a 32 kHz


def lufs_of(path: str) -> float:
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    js = out[out.index("{", out.index("Parsed_loudnorm")):out.index("}", out.index("Parsed_loudnorm")) + 1]
    return float(json.loads(js)["input_i"])


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--sections", required=True,
                   help="JSON con las secciones [{name, prompt, generate, start, end}]")
    p.add_argument("--out", required=True, help="WAV mezclado (48 kHz)")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--seed", type=int, default=20261115)
    p.add_argument("--xfade", type=float, default=1.5,
                   help="Crossfade entre secciones (s)")
    p.add_argument("--end-fade", type=float, default=1.0,
                   help="Fade-out final (s)")
    p.add_argument("--target-lufs", type=float, default=-16.0,
                   help="Sonoridad del STEM de música (no del reel)")
    p.add_argument("--guidance-scale", type=float, default=3.0)
    p.add_argument("--threads", type=int, default=2)
    p.add_argument("--force", action="store_true")
    a = p.parse_args()

    with open(a.sections, encoding="utf-8") as f:
        sections = json.load(f)
    if not sections:
        p.error("sin secciones en el JSON")
    total_end = max(s["end"] for s in sections)
    out_dir = os.path.dirname(os.path.abspath(a.out))
    sections_dir = os.path.join(out_dir, "music-sections")
    os.makedirs(sections_dir, exist_ok=True)
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")

    torch.manual_seed(a.seed)
    torch.set_num_threads(a.threads)
    print("Cargando MusicGen-small (CPU)...")
    processor = AutoProcessor.from_pretrained(a.model)
    model = MusicgenForConditionalGeneration.from_pretrained(a.model)
    model.eval()

    audios = []
    for s in sections:
        name, prompt = s["name"], s["prompt"]
        seconds, start, end = s["generate"], s["start"], s["end"]
        print(f"\n== Sección {name}: {seconds} s ==")
        inputs = processor(text=[prompt], padding=True, return_tensors="pt")
        with torch.no_grad():
            out = model.generate(
                **inputs,
                do_sample=True,
                guidance_scale=a.guidance_scale,
                max_new_tokens=seconds * 50,
                temperature=1.0,
                top_k=250,
            )
        audio = out[0, 0].numpy().astype(np.float32)
        # Normalización suave por sección (pico -1 dB) antes de mezclar.
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak * 0.89
        path = os.path.join(sections_dir, f"{name}.wav")
        sf.write(path, audio, SR)
        rms = float(np.sqrt(np.mean(audio ** 2)))
        print(f"  {path}: {len(audio) / SR:.2f} s, RMS {rms:.4f}, "
              f"pico {np.max(np.abs(audio)):.3f}")
        if rms < 0.01:
            print("  AVISO: sección casi silenciosa (RMS < 0.01)")
        audios.append((name, audio, start, end))

    # --- Mezcla con crossfades ---
    total = int(total_end * SR)
    mix = np.zeros(total, dtype=np.float32)
    for name, audio, start, end in audios:
        s0, s1 = int(start * SR), int(end * SR)
        seg = audio[: s1 - s0]
        if len(seg) < s1 - s0:
            seg = np.pad(seg, (0, s1 - s0 - len(seg)))
        if start > 0:
            n = int(a.xfade * SR)
            seg[:n] *= np.linspace(0, 1, n, dtype=np.float32)
        if end < total_end:
            n = int(a.xfade * SR)
            seg[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
        mix[s0:s1] += seg
    if a.end_fade > 0:
        n = int(a.end_fade * SR)
        mix[-n:] *= np.linspace(1, 0, n, dtype=np.float32)

    tmp32 = os.path.join(sections_dir, "_mix32.wav")
    tmp48 = os.path.join(sections_dir, "_mix48.wav")
    sf.write(tmp32, mix, SR)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp32,
                    "-ar", "48000", tmp48], check=True)
    measured = lufs_of(tmp48)
    gain_db = a.target_lufs - measured
    print(f"\nMezcla medida: {measured:.2f} LUFS -> ganancia {gain_db:+.2f} dB "
          f"para {a.target_lufs} LUFS")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp48, "-af",
                    f"volume={gain_db}dB", "-ar", "48000", a.out],
                   check=True)
    final = lufs_of(a.out)
    print(f"OK {a.out} — {final:.2f} LUFS, "
          f"{os.path.getsize(a.out) / 1e6:.1f} MB")
    for f in (tmp32, tmp48):
        os.remove(f)
    return 0


if __name__ == "__main__":
    sys.exit(main())
