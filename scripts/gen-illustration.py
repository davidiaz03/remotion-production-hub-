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
- La API actual es el gateway `gen.pollinations.ai` (la antigua
  `image.pollinations.ai/prompt/...` está deprecada y YA NO respeta
  ni el token ni `nologo`: verificado 16-nov-2026, tres generaciones
  con token salieron con marca en el host viejo).
- El gateway exige autenticación: token Seed (registro gratuito en
  pollinations.ai, clave `sk_`) en el header `Authorization: Bearer`.
  Pásalo con --token o la variable POLLINATIONS_TOKEN — `activate.sh`
  la carga automáticamente desde `~/workspace/remotion-hub/.env`
  (fuera del repo, cubierto por .gitignore). Nunca escribas el token
  en el repo, en un commit ni en una URL (va en el header, no en la
  query, para que no quede en logs).
- Con token, el script pide `nologo=true` (sin la marca
  "pollinations.ai") y `private=true` (fuera del feed público):
  imágenes publicables, verificado 16-nov-2026.
- Sin token el gateway responde 401: el script falla con un error
  claro en vez de devolver una imagen con marca.

Calidad: Flux es bueno para ilustración plana; la consistencia de estilo

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

API = "https://gen.pollinations.ai/image/{prompt}"


def build_url(prompt, model, seed, width, height, nologo=True):
    params = {
        "model": model,
        "seed": str(seed),
        "width": str(width),
        "height": str(height),
    }
    if nologo:
        # Sin nologo=true el gateway estampa la marca "pollinations.ai"
        # aunque el token esté presente (verificado 16-nov-2026).
        params["nologo"] = "true"
        params["private"] = "true"
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
        print("ERROR: el gateway gen.pollinations.ai exige autenticación. "
              "Configura POLLINATIONS_TOKEN (token Seed gratuito en "
              "pollinations.ai) en ~/workspace/remotion-hub/.env y "
              "reactiva con `source activate.sh`; sin token no hay "
              "generación.", file=sys.stderr)
        return 1
    url = build_url(full, args.model, args.seed, args.width, args.height)
    headers = {"User-Agent": "remotion-hub/1.0",
               "Authorization": "Bearer " + args.token}
    last = None
    for attempt in range(1, args.retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
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
          f"model={args.model}, watermark=no)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
