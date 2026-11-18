#!/usr/bin/env python3
"""Hoja de contacto: monta todos los PNG de examples/out (o de un dir dado)
en una sola imagen para revisión visual rápida.

Uso:
  python3 scripts/contact-sheet.py [dir] [--out hoja.png] [--cols 3] [--width 540]
  Por defecto: content/examples/out -> content/examples/out/contact-sheet.png
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent.parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("dir", nargs="?", default=str(HERE / "examples" / "out"))
    ap.add_argument("--out", default=None)
    ap.add_argument("--cols", type=int, default=3)
    ap.add_argument("--width", type=int, default=540, help="ancho de cada miniatura")
    args = ap.parse_args()
    root = Path(args.dir)
    pngs = sorted(p for p in root.rglob("*.png") if "assets" not in p.parts and p.name != "contact-sheet.png")
    if not pngs:
        print(f"sin PNG en {root}", file=sys.stderr)
        sys.exit(1)
    cols = args.cols
    rows = (len(pngs) + cols - 1) // cols
    thumb_w = args.width
    # Altura por fila: la máxima entre sus miniaturas (hay 1080x1080 y 1080x1920).
    thumbs = []
    for p in pngs:
        im = Image.open(p).convert("RGB")
        scale = thumb_w / im.width
        thumbs.append((p, im.resize((thumb_w, round(im.height * scale)))))
    row_h = []
    for r in range(rows):
        row = thumbs[r * cols:(r + 1) * cols]
        row_h.append(max(t.height for _, t in row) + 34)
    sheet = Image.new("RGB", (cols * (thumb_w + 16) + 16, sum(row_h) + 16), (24, 24, 24))
    draw = ImageDraw.Draw(sheet)
    y = 16
    for r in range(rows):
        row = thumbs[r * cols:(r + 1) * cols]
        x = 16
        for p, t in row:
            sheet.paste(t, (x, y))
            label = str(p.relative_to(root))
            draw.text((x + 4, y + t.height + 8), label, fill=(220, 220, 220))
            x += thumb_w + 16
        y += row_h[r]
    out = Path(args.out) if args.out else root / "contact-sheet.png"
    sheet.save(out)
    print(f"{out}  ({sheet.width}x{sheet.height}, {len(pngs)} imágenes)")


if __name__ == "__main__":
    main()
