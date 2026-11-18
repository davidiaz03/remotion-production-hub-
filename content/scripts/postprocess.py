#!/usr/bin/env python3
"""Post-proceso de renders: PNG máster -> JPG ligero para el móvil.

El máster PNG es la versión de publicación (sin pérdida). La versión ligera
es el mismo tamaño en JPG calidad 80 (~5-10x menos peso), para revisar en
el teléfono y enviar por WhatsApp sin gastar datos.

Uso:
  python3 scripts/postprocess.py <master.png> [<light.jpg>] [--quality 80]
  Por defecto el JPG se llama igual que el PNG con sufijo -light.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image


def to_light(src: Path, dst: Path | None = None, quality: int = 80) -> Path:
    if dst is None:
        dst = src.with_name(f"{src.stem}-light.jpg")
    img = Image.open(src)
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = bg
    else:
        img = img.convert("RGB")
    img.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
    return dst


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst", nargs="?")
    ap.add_argument("--quality", type=int, default=80)
    args = ap.parse_args()
    src = Path(args.src)
    if not src.exists():
        print(f"no existe: {src}", file=sys.stderr)
        sys.exit(1)
    dst = to_light(src, Path(args.dst) if args.dst else None, args.quality)
    print(f"{dst}  ({dst.stat().st_size // 1024} KB, desde {src.stat().st_size // 1024} KB)")
