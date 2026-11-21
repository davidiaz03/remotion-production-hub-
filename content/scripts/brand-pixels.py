#!/usr/bin/env python3
"""Mide la presencia del rojo corporativo (#ED1C24) en un PNG renderizado.

Uso: brand-pixels.py imagen.png [--tolerance 12] [--json]

Muestra píxeles (con paso para no pasar de ~200.000 muestras) y cuenta
cuántos caen dentro de la tolerancia del rojo de marca por canal. El
rojo corporativo debe aparecer en TODA pieza del Memorial (logo, barra,
cifra o banda): si no aparece, algo falló en el render (logo ausente,
CSS roto, imagen en blanco).

Salida JSON: {width, height, sampled, red_pixels, red_fraction}.
Requiere Pillow (python3 del sistema la tiene).
"""
import argparse
import json
import sys

from PIL import Image

BRAND_RED = (237, 28, 36)
MAX_SAMPLES = 200_000


def red_fraction(img_path, tolerance=12):
    with Image.open(img_path) as im:
        im = im.convert("RGB")
        w, h = im.size
        # Paso de muestreo para acotar el trabajo en imágenes grandes.
        total = w * h
        stride = max(1, int((total / MAX_SAMPLES) ** 0.5))
        px = im.load()
        sampled = 0
        red = 0
        r0, g0, b0 = BRAND_RED
        for y in range(0, h, stride):
            for x in range(0, w, stride):
                r, g, b = px[x, y]
                sampled += 1
                if (abs(r - r0) <= tolerance and abs(g - g0) <= tolerance
                        and abs(b - b0) <= tolerance):
                    red += 1
        return {
            "width": w,
            "height": h,
            "sampled": sampled,
            "red_pixels": red,
            "red_fraction": (red / sampled) if sampled else 0.0,
        }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("image", help="PNG a analizar")
    ap.add_argument("--tolerance", type=int, default=12,
                    help="Tolerancia por canal respecto a #ED1C24 (def. 12)")
    ap.add_argument("--json", action="store_true", help="Salida JSON")
    args = ap.parse_args(argv)
    try:
        result = red_fraction(args.image, args.tolerance)
    except FileNotFoundError:
        print(f"Archivo no encontrado: {args.image}", file=sys.stderr)
        return 1
    if args.json:
        print(json.dumps(result))
    else:
        print(f"{args.image}: {result['width']}x{result['height']}, "
              f"rojo de marca en {result['red_fraction'] * 100:.2f}% "
              f"de {result['sampled']} píxeles muestreados")
    return 0


if __name__ == "__main__":
    sys.exit(main())
