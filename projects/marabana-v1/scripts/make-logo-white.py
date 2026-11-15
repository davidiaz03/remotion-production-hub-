#!/usr/bin/env python3
"""Construye la marca de agua BLANCA TRANSPARENTE del Memorial (V1.3).

CORRECCIÓN del usuario (15-nov-2026, tras ver la V1.2): la marca de agua
NO lleva placa negra — «el logo tiene que ser transparentado, no va a ser
que salga con fondo». La placa negra de la V1.2 se retira; el sting del
final SÍ conserva su fondo negro (versión negra del manual, pág. 11).

Versión V1.3: estrella BLANCA (con la salpicadura negra del centro
intacta) + letras blancas, sobre TRANSPARENCIA ORIGINAL, flotando sobre
el video — sin componer sobre ningún fondo. La legibilidad sobre fotos
claras se asegura con una sombra suave en la composición (Video.tsx),
que no es un fondo.

Fuente: ~/workspace/marabana/assets/MARCA_AGUA_OFICIAL_MEMORIAL.png
Salida: public/img/logo-white.png (573×907, RGBA, transparencia real).

Recoloreado rojo→blanco con umbral suave por "rojez" (R - max(G,B))
y puerta de luminancia (los píxeles oscuros — salpicadura — no se tocan),
más neutralización del residuo rojizo a gris (misma técnica que
make-sting-black.py v3, para no dejar halos en los bordes anti-aliasing).
El canal alfa no se toca.
"""
import numpy as np
from PIL import Image
import os

SRC = os.path.expanduser("~/workspace/marabana/assets/MARCA_AGUA_OFICIAL_MEMORIAL.png")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "img", "logo-white.png")
OUT = os.path.normpath(OUT)


def smoothstep(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def recolor_red_to_white(rgba: np.ndarray) -> np.ndarray:
    """Píxeles rojos → blanco con transición suave; resto intacto; el alfa
    no se toca (la transparencia original se conserva)."""
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
    # Neutralización: lo que aún quede rojizo (rojez > 12) pasa a gris
    # por luminancia — un filo gris de 1 px se lee como anti-aliasing
    # normal, no como halo rojo.
    r2, g2, b2 = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    red2 = r2 - np.maximum(g2, b2)
    lum = 0.299 * r2 + 0.587 * g2 + 0.114 * b2
    m = red2 > 12.0
    out[m, 0] = lum[m]
    out[m, 1] = lum[m]
    out[m, 2] = lum[m]
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    im = Image.open(SRC).convert("RGBA")
    print("fuente:", im.size, im.mode)
    arr = np.array(im)
    rec = recolor_red_to_white(arr)

    # Diagnóstico: ¿cuánto rojo queda? ¿la transparencia sigue intacta?
    op = rec[rec[:, :, 3] > 200]
    left_red = ((op[:, 0] > 150) & (op[:, 1] < 100) & (op[:, 2] < 100)).sum()
    print("píxeles rojos restantes (opacos):", left_red)
    n_transp = int((rec[:, :, 3] == 0).sum())
    print("píxeles totalmente transparentes:", n_transp,
          f"({100 * n_transp / rec.shape[0] / rec.shape[1]:.1f}%)")
    assert np.array_equal(rec[:, :, 3], arr[:, :, 3]), "el alfa cambió"

    Image.fromarray(rec, "RGBA").save(OUT)
    print("guardado:", OUT, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
