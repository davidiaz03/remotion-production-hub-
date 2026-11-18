#!/usr/bin/env python3
"""Tratamiento duotono de marca para fotografías (Memorial de la Denuncia).

Convierte una foto a duotono negro->rojo corporativo (o gris->rojo),
el tratamiento gráfico sobrio del Memorial para imágenes de apoyo:
el rojo de marca tiñe las luces y el negro las sombras. Útil para
fondos de post/story/miniatura cuando la foto original desentona con
la identidad, o para unificar varias fotos en un carrusel.

NO usar sobre fotos de archivo que deban presentarse como documento:
el duotono es un tratamiento gráfico evidente, no una falsificación,
pero el pie debe decirlo cuando la foto es de archivo.

Uso:
  python3 scripts/duotone.py entrada.jpg salida.jpg [--shadow 000000 --mid 7A1216 --highlight ED1C24]
  python3 scripts/duotone.py entrada.jpg salida.jpg --preset red   # negro -> rojo (defecto)
  python3 scripts/duotone.py entrada.jpg salida.jpg --preset gray  # negro -> gris #77787B
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

PRESETS = {
    "red": ("#000000", "#A61E24", "#ED1C24"),
    "gray": ("#000000", "#3A3A3A", "#77787B"),
    "paper": ("#1A1A1A", "#905745", "#F4F1EC"),
}


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def duotone(src: Path, dst: Path, shadow: str, mid: str, highlight: str) -> dict:
    # Tono = canal V (máximo RGB), no luminancia: la luminancia Rec.601
    # aplasta los rojos (el rojo corporativo tiene luminancia ~91) y el
    # duotono salía casi negro (verificado 17-nov-2026). Con V, un cielo
    # rojo vivo sigue siendo rojo vivo.
    img = Image.open(src).convert("RGB").convert("HSV").split()[2]
    # Mapa de tonos: 0 -> shadow, 128 -> mid, 255 -> highlight (interpolado).
    s, m, h = hex_to_rgb(shadow), hex_to_rgb(mid), hex_to_rgb(highlight)
    lut = []
    for ch in range(3):
        chan = []
        for i in range(256):
            if i < 128:
                t = i / 128
                chan.append(round(s[ch] + (m[ch] - s[ch]) * t))
            else:
                t = (i - 128) / 127
                chan.append(round(m[ch] + (h[ch] - m[ch]) * t))
        lut.extend(chan)
    out = Image.merge("RGB", [img.point(lut[i * 256:(i + 1) * 256]) for i in range(3)])
    out.save(dst)
    return {"size": list(out.size), "preset": (shadow, mid, highlight)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--preset", choices=list(PRESETS), default="red")
    ap.add_argument("--shadow", default=None)
    ap.add_argument("--mid", default=None)
    ap.add_argument("--highlight", default=None)
    args = ap.parse_args()
    shadow, mid, highlight = PRESETS[args.preset]
    shadow = args.shadow or shadow
    mid = args.mid or mid
    highlight = args.highlight or highlight
    src = Path(args.src)
    if not src.exists():
        print(f"no existe: {src}", file=sys.stderr)
        sys.exit(1)
    print(duotone(src, Path(args.dst), shadow, mid, highlight))
    print(f"escrito: {args.dst}")
