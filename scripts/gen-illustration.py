#!/usr/bin/env python3
"""Genera ilustraciones con Pollinations (Fase B, R11).

Uso:
  python3 scripts/gen-illustration.py --prompt "una mano sacando un chip"
      --style-prompt "Flat 3D illustration, soft studio lighting, ..."
      --out public/img/illustrations/chip.png [--seed 42] [--model flux]
      [--width 768] [--height 1344]

El prompt final es "<style-prompt>, <prompt>". La seed fija hace la
imagen reproducible: misma seed + mismo prompt = misma imagen.

LICENCIA Y MARCA DE AGUA (importante):
- El tier ANÓNIMO (sin token) funciona pero estampa la marca de agua
  "pollinations.ai" abajo a la derecha (verificado 15-nov-2026): esas
  imágenes NO son publicables. Sirven para componer y probar el look.
- El tier Seed (registro gratuito en pollinations.ai) quita la marca de
  agua. Pasa el token con --token o la variable POLLINATIONS_TOKEN
  (nunca lo escribas en el repo ni en un commit).
- Sin token, el script avisa en stderr y sigue (imagen con marca).

Calidad: Flux es bueno para ilustración plana; la consistencia de estilo
entre imágenes es menor que con un modelo local + LoRA — por eso el
style prompt BLOQUEADO es obligatorio (ver skill motion_graphics_reels
§2). Si una imagen sale mal, cambia la seed antes que el style prompt.

Emparejar con rembg (tools/bg-remove.py) para recortar el fondo.
"""
import argparse
import os
import sys
import time
import urllib.parse
import urllib.request

API = "https://image.pollinations.ai/prompt/{prompt}"


def build_url(prompt, model, seed, width, height, token):
    params = {
        "model": model,
        "seed": str(seed),
        "width": str(width),
        "height": str(height),
    }
    if token:
        params["token"] = token
    return API.format(prompt=urllib.parse.quote(prompt)) + "?" + urllib.parse.urlencode(params)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--prompt", required=True, help="Descripción del sujeto")
    ap.add_argument("--style-prompt", default="",
                    help="Style prompt bloqueado del proyecto")
    ap.add_argument("--out", required=True, help="Archivo de salida (.jpg/.png)")
    ap.add_argument("--model", default="flux", help="Modelo (defecto flux)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--width", type=int, default=768)
    ap.add_argument("--height", type=int, default=1344)
    ap.add_argument("--token", default=os.environ.get("POLLINATIONS_TOKEN", ""),
                    help="Token Seed (o variable POLLINATIONS_TOKEN)")
    ap.add_argument("--retries", type=int, default=3)
    args = ap.parse_args()

    full = f"{args.style_prompt}, {args.prompt}" if args.style_prompt else args.prompt
    if not args.token:
        print("AVISO: sin token Seed — la imagen llevará la marca de agua "
              "'pollinations.ai' y NO es publicable (ver cabecera).",
              file=sys.stderr)
    url = build_url(full, args.model, args.seed, args.width, args.height,
                    args.token or None)
    last = None
    for attempt in range(1, args.retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "remotion-hub/1.0"})
            with urllib.request.urlopen(req, timeout=180) as r:
                data = r.read()
            break
        except Exception as e:  # noqa: BLE001 — reintento con backoff
            last = e
            print(f"intento {attempt} falló ({e}); reintento...", file=sys.stderr)
            time.sleep(5 * attempt)
    else:
        print(f"ERROR: Pollinations no respondió tras {args.retries} intentos: {last}",
              file=sys.stderr)
        return 1
    if len(data) < 1024 or data[:3] not in (b"\xff\xd8\xff", b"\x89PN"):
        print(f"ERROR: respuesta no es una imagen válida ({len(data)} bytes)",
              file=sys.stderr)
        return 1
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "wb") as fh:
        fh.write(data)
    print(f"OK {args.out} ({len(data)} bytes, seed={args.seed}, "
          f"model={args.model}, watermark={'sí' if not args.token else 'no'})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
