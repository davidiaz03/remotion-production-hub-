#!/usr/bin/env python3
"""
Hoja de contacto visual de la biblioteca de plantillas.

  python3 contact-sheet.py [--out templates/contact-sheet.jpg]

Rejilla de 10 columnas con miniatura + slug de cada plantilla del catálogo.
"""
import argparse
import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, 'templates', 'catalog.json')
DEFAULT_OUT = os.path.join(ROOT, 'templates', 'contact-sheet.jpg')

COLS = 10
THUMB_W, THUMB_H = 200, 150
LABEL_H = 22
BG = (245, 245, 245)


def main():
    ap = argparse.ArgumentParser(description='Hoja de contacto de plantillas')
    ap.add_argument('--out', default=DEFAULT_OUT)
    args = ap.parse_args()

    with open(CATALOG, encoding='utf-8') as f:
        templates = json.load(f)['templates']
    try:
        font = ImageFont.truetype(
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    except OSError:
        font = ImageFont.load_default()

    rows = (len(templates) + COLS - 1) // COLS
    cell_w, cell_h = THUMB_W + 8, THUMB_H + LABEL_H + 8
    sheet = Image.new('RGB', (COLS * cell_w + 8, rows * cell_h + 8), BG)
    draw = ImageDraw.Draw(sheet)
    for i, t in enumerate(templates):
        x = 8 + (i % COLS) * cell_w
        y = 8 + (i // COLS) * cell_h
        path = os.path.join(ROOT, 'templates', t['file'])
        try:
            thumb = Image.open(path).convert('RGB')
            thumb.thumbnail((THUMB_W, THUMB_H), Image.LANCZOS)
        except Exception:
            thumb = Image.new('RGB', (THUMB_W, THUMB_H), (200, 200, 200))
        ox = x + (THUMB_W - thumb.width) // 2 + 4
        oy = y + (THUMB_H - thumb.height) // 2 + 4
        sheet.paste(thumb, (ox, oy))
        label = t['slug'][:28]
        draw.text((x + 4, y + THUMB_H + 8), label, font=font, fill=(30, 30, 30))
    sheet.save(args.out, 'JPEG', quality=88)
    print(f"{args.out} — {len(templates)} plantillas, "
          f"{sheet.width}x{sheet.height} px")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
