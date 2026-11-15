#!/usr/bin/env python3
"""Recolorea el sting oficial a la versión NEGRA (V1.2).

El sting original (CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4, 6 s, 720x1280,
24 fps, 144 fotogramas) ya tiene fondo negro, pero la estrella es ROJA.
Según el Manual de Identidad (pág. 11: identificador sobre fondo NEGRO),
la versión negra lleva la ESTRELLA BLANCA (con la salpicadura negra
intacta) y el texto blanco.

Proceso: extrae los 144 fotogramas, recolorea rojo→blanco con umbral
suave por "rojez" + puerta de luminancia (misma función que
make-logo-black.py), re-codifica a 6 s y deriva la versión 2x.

Salidas (en public/video/):
  sting-black.mp4    — 6 s, 24 fps, con el audio original (copiado)
  sting-black-2x.mp4 — 3 s a 2x, solo vídeo (el audio del sting en la
                       composición sigue siendo sting-2x.wav, sin tocar)

Si el recoloreado produce artefactos visibles (halos, bordes sucios,
parpadeo), NO se usa: se mantiene el sting original y se reporta.
"""
import numpy as np
from PIL import Image
import os
import subprocess
import sys

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser("~/workspace/marabana/assets/CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4")
FRAMES_DIR = "/tmp/sting-black/frames"
OUT6 = os.path.join(PROJ, "public", "video", "sting-black.mp4")
OUT2X = os.path.join(PROJ, "public", "video", "sting-black-2x.mp4")


def smoothstep(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def recolor_red_to_white(rgb: np.ndarray) -> np.ndarray:
    """Píxeles rojos → blanco, con transición suave y neutralización del
    residuo rojizo (el sangrado de croma del H.264 deja un filo rojo
    oscuro de 1 px en los bordes de la estrella: la v1 lo dejaba visible
    en zoom; la v3 lo elimina).

    1) Peso por rojez (R - max(G,B)): 0 por debajo de 15, 1 por encima
       de 70; puerta de luminancia (max < 40 no se toca: salpicadura).
    2) Neutralización: los píxeles que aún quedan rojizos (rojez > 12)
       pasan a gris por luminancia — un filo gris de 1 px se lee como
       anti-aliasing normal, no como halo.
    Verificado en fotograma de prueba a 720×1280: 0 píxeles rojos, 0 de
    filo rojo oscuro; bordes de la estrella limpios en zoom.
    """
    f = rgb.astype(np.float32)
    r, g, b = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    redness = r - np.maximum(g, b)
    maxchan = np.maximum(np.maximum(r, g), b)
    w = smoothstep(redness, 15.0, 70.0) * smoothstep(maxchan, 40.0, 120.0)
    out = f * (1 - w[:, :, None]) + 255.0 * w[:, :, None]
    r2, g2, b2 = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    red2 = r2 - np.maximum(g2, b2)
    lum = 0.299 * r2 + 0.587 * g2 + 0.114 * b2
    m = red2 > 12.0
    out[m] = np.stack([lum[m], lum[m], lum[m]], axis=1)
    return np.clip(out, 0, 255).astype(np.uint8)


def run(cmd):
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    # 1) Extraer los 144 fotogramas a PNG (resolución completa)
    run(["ffmpeg", "-y", "-v", "error", "-i", SRC,
         os.path.join(FRAMES_DIR, "f-%03d.png")])
    frames = sorted(f for f in os.listdir(FRAMES_DIR) if f.endswith(".png"))
    print(f"{len(frames)} fotogramas extraídos")
    assert len(frames) == 144, f"se esperaban 144 fotogramas, hay {len(frames)}"

    # 2) Recolorear fotograma a fotograma (in-place)
    for i, fn in enumerate(frames):
        p = os.path.join(FRAMES_DIR, fn)
        arr = np.array(Image.open(p).convert("RGB"))
        Image.fromarray(recolor_red_to_white(arr), "RGB").save(p)
        if (i + 1) % 36 == 0:
            print(f"  recoloreados {i + 1}/{len(frames)}")

    # 3) Re-codificar 6 s a 24 fps + audio original copiado
    run(["ffmpeg", "-y", "-v", "error", "-framerate", "24",
         "-i", os.path.join(FRAMES_DIR, "f-%03d.png"),
         "-i", SRC, "-map", "0:v", "-map", "1:a",
         "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-shortest", OUT6])
    print("guardado:", OUT6, os.path.getsize(OUT6), "bytes")

    # 4) Versión 2x, solo vídeo (igual que sting-2x.mp4 en V1.1)
    run(["ffmpeg", "-y", "-v", "error", "-i", OUT6,
         "-vf", "setpts=0.5*PTS", "-an",
         "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", OUT2X])
    print("guardado:", OUT2X, os.path.getsize(OUT2X), "bytes")


if __name__ == "__main__":
    main()
