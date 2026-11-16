#!/usr/bin/env python3
"""Recorte de fondo por lotes con rembg (MIT) -> PNG con canal alfa.

Es el recorte oficial del hub para ilustraciones y fotos que van a
flotar sobre el escenario (look del estilo de referencia): la imagen
recortada se compone en Remotion con GlowStage / PhoneFrame / etc.

Modelo por defecto: u2net (~176 MB, se descarga solo en el primer uso
a ~/.u2net/ y queda cacheado). Para bordes finos (pelo) se puede usar
--alpha-matting (más lento) o el modelo isnet-general-use.

Uso:
  ~/workspace/remotion-hub/.venv/bin/python tools/bg-remove.py \
      ilustracion.png -o public/img/
  ~/workspace/remotion-hub/.venv/bin/python tools/bg-remove.py \
      assets/raw/ -o public/img/cutouts/ --model u2net

Licencia: rembg es MIT (verificado: pip show rembg). NO usar
@imgly/background-removal-node: es AGPL-3.0 y está prohibido por la
política del hub (auditoría 15-nov-2026, §0).
"""
import argparse
import os
import sys
import time

from PIL import Image

EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}


def alpha_stats(img: Image.Image) -> tuple[float, float]:
    """Fracción de píxeles opacos y semitransparentes (0-1)."""
    if img.mode != "RGBA":
        return 1.0, 0.0
    a = img.getchannel("A")
    hist = a.histogram()
    total = sum(hist)
    opaque = sum(hist[250:]) / total
    semi = sum(hist[10:250]) / total
    return opaque, semi


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("input", help="Imagen o carpeta con imágenes")
    p.add_argument("-o", "--out-dir", required=True,
                   help="Carpeta de salida (PNG con alfa)")
    p.add_argument("--model", default="u2net",
                   help="Modelo rembg (u2net por defecto)")
    p.add_argument("--alpha-matting", action="store_true",
                   help="Matting de bordes (mejor pelo, más lento)")
    p.add_argument("--force", action="store_true",
                   help="Reprocesar aunque la salida ya exista")
    args = p.parse_args()

    # Import tardío: rembg/onnxruntime tardan varios segundos en cargar.
    from rembg import new_session, remove

    if os.path.isdir(args.input):
        files = sorted(
            os.path.join(args.input, f)
            for f in os.listdir(args.input)
            if os.path.splitext(f)[1].lower() in EXTS
        )
    elif os.path.isfile(args.input):
        files = [args.input]
    else:
        print(f"ERROR: no existe {args.input}", file=sys.stderr)
        return 1
    if not files:
        print("ERROR: no hay imágenes de entrada", file=sys.stderr)
        return 1

    os.makedirs(args.out_dir, exist_ok=True)
    session = new_session(args.model)
    print(f"Modelo {args.model} listo; {len(files)} imagen(es)")

    ok = skipped = 0
    for src in files:
        base = os.path.splitext(os.path.basename(src))[0]
        dst = os.path.join(args.out_dir, base + ".png")
        if os.path.exists(dst) and not args.force:
            print(f"  salta {base} (ya existe; --force para reprocesar)")
            skipped += 1
            continue
        t0 = time.perf_counter()
        with Image.open(src) as im:
            out = remove(
                im, session=session, alpha_matting=args.alpha_matting
            )
        out.save(dst, format="PNG")
        dt = time.perf_counter() - t0
        opaque, semi = alpha_stats(out)
        print(f"  {base}: {dt:.1f}s, {out.size[0]}x{out.size[1]}, "
              f"opaco {opaque:.0%}, borde {semi:.1%} -> {dst}")
        if opaque > 0.98:
            print("    AVISO: casi sin fondo recortado; revisa la imagen")
        if opaque < 0.05:
            print("    AVISO: casi todo transparente; el modelo pudo fallar")
        ok += 1
    print(f"OK: {ok} procesadas, {skipped} saltadas -> {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
