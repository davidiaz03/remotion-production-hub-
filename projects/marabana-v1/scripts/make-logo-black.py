#!/usr/bin/env python3
"""Construye la marca de agua NEGRA del Memorial (V1.2).

Regla del Manual de Identidad (págs. 11 y 13): el identificador SIEMPRE
aparece sobre fondo ROJO o NEGRO corporativo, y sobre imágenes SIEMPRE
sobre un área de color sólida (en versión monocromática: NEGRO), con
áreas de seguridad. La marca anterior (estrella roja + texto blanco,
transparente, flotando sobre el video) es uso incorrecto.

Versión negra: estrella BLANCA (con la salpicadura negra del centro
intacta, como en el manual) + texto blanco, sobre placa NEGRA sólida
con margen de seguridad (~15% del ancho del lockup por cada lado,
esquinas rectas).

Fuente: ~/workspace/marabana/assets/MARCA_AGUA_OFICIAL_MEMORIAL.png
Salida: public/img/logo-black.png (745×1079, placa negra opaca).

Recoloreado rojo→blanco con umbral suave por "rojez" (R - max(G,B))
y puerta de luminancia (los píxeles oscuros — salpicadura — no se tocan),
para no dejar halos en los bordes anti-aliasing.
"""
import numpy as np
from PIL import Image
import os

SRC = os.path.expanduser("~/workspace/marabana/assets/MARCA_AGUA_OFICIAL_MEMORIAL.png")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "img", "logo-black.png")
OUT = os.path.normpath(OUT)

MARGIN_FRAC = 0.15  # del ancho del lockup, por cada lado


def smoothstep(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def recolor_red_to_white(rgba: np.ndarray) -> np.ndarray:
    """Píxeles rojos → blanco con transición suave; resto intacto."""
    f = rgba.astype(np.float32)
    r, g, b = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    redness = r - np.maximum(g, b)
    maxchan = np.maximum(np.maximum(r, g), b)
    # Peso por rojez: 0 por debajo de 25, 1 por encima de 90.
    w = smoothstep(redness, 25.0, 90.0)
    # Puerta de luminancia: los píxeles oscuros (salpicadura negra,
    # max < 60) no se tocan; los brillantes (max > 140) van completos.
    w *= smoothstep(maxchan, 60.0, 140.0)
    w = w[:, :, None]
    white = np.full_like(f[:, :, :3], 255.0)
    out = f.copy()
    out[:, :, :3] = f[:, :, :3] * (1 - w) + white * w
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    im = Image.open(SRC).convert("RGBA")
    print("fuente:", im.size, im.mode)
    arr = np.array(im)
    rec = recolor_red_to_white(arr)

    # Diagnóstico: ¿cuánto rojo queda?
    op = rec[rec[:, :, 3] > 200]
    left_red = ((op[:, 0] > 150) & (op[:, 1] < 100) & (op[:, 2] < 100)).sum()
    print("píxeles rojos restantes (opacos):", left_red)

    logo = Image.fromarray(rec, "RGBA")
    w, h = logo.size
    m = round(w * MARGIN_FRAC)
    plate = Image.new("RGBA", (w + 2 * m, h + 2 * m), (0, 0, 0, 255))
    plate.paste(logo, (m, m), logo)
    print("placa:", plate.size, "| margen:", m, "px")
    plate.save(OUT)
    print("guardado:", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
