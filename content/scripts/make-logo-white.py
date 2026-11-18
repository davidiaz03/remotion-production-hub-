#!/usr/bin/env python3
"""Deriva la variante BLANCA del logo desde el original a color.

Regla (determinista, verificada 17-nov-2026):
  - Rojo brillante (estrella): píxeles de tono rojo con valor > 0.35
    pasan a blanco puro (255,255,255). El alfa NO se toca: los bordes
    anti-aliasing se conservan.
  - Rojo oscuro (textura del impacto de bala dentro de la estrella):
    pasa a gris por luminancia, para que el detalle del impacto siga
    visible sobre fondo rojo o blanco (en rojo oscuro sobre rojo
    corporativo desaparecería).
  - Todo lo demás (texto blanco, transparencias) queda intacto.

Uso:
  python3 scripts/make-logo-white.py [entrada] [salida]
  Por defecto: brand/logo-color.png -> <out>/assets/logo-white.png
  (render.mjs lo llama solo; este script es para regenerarlo a mano).

Nota: la rama work/paper-edit-workflow versiona su propia variante blanca
en shared/brand/logo-white.png, generada con otro método. Ambas son
visualmente equivalentes (estrella blanca, texto intacto, impacto visible);
difieren en algunos píxeles de borde anti-aliasing. No intentar igualarlas
byte a byte: cada hub deriva la suya desde el mismo original a color.
"""
import sys
from pathlib import Path

from PIL import Image
import numpy as np

HERE = Path(__file__).resolve().parent.parent
SRC = HERE / "brand" / "logo-color.png"


def make_white(src: Path, dst: Path) -> dict:
    img = Image.open(src).convert("RGBA")
    a = np.asarray(img).astype(np.float64)
    rgb = a[:, :, :3] / 255.0
    alpha = a[:, :, 3]
    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    diff = mx - mn
    # Tono (0-1) solo donde hay saturación.
    h = np.zeros_like(mx)
    m = (mx == rgb[:, :, 0]) & (diff > 0)
    h[m] = (((rgb[:, :, 1] - rgb[:, :, 2])[m] / diff[m]) % 6) / 6
    m = (mx == rgb[:, :, 1]) & (diff > 0)
    h[m] = (2 + (rgb[:, :, 2] - rgb[:, :, 0])[m] / diff[m]) / 6
    m = (mx == rgb[:, :, 2]) & (diff > 0)
    h[m] = (4 + (rgb[:, :, 0] - rgb[:, :, 1])[m] / diff[m]) / 6
    s = np.where(mx > 0, diff / np.maximum(mx, 1e-9), 0.0)
    is_red = ((h < 0.05) | (h > 0.95)) & (s > 0.25) & (alpha > 0)
    bright = is_red & (mx > 0.35)
    dark = is_red & (mx <= 0.35)
    out = a.copy()
    out[bright, 0] = 255
    out[bright, 1] = 255
    out[bright, 2] = 255
    # Rojo oscuro -> gris por luminancia (Rec. 601).
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    gray = (lum * 255).clip(0, 255)
    out[dark, 0] = gray[dark]
    out[dark, 1] = gray[dark]
    out[dark, 2] = gray[dark]
    Image.fromarray(out.astype(np.uint8), "RGBA").save(dst)
    return {
        "size": list(img.size),
        "white_pixels": int(bright.sum()),
        "dark_gray_pixels": int(dark.sum()),
    }


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else SRC
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "brand" / "logo-white.derived.png"
    print(make_white(src, dst))
    print(f"escrito: {dst}")
