#!/usr/bin/env python3
"""Recorte de fondo con rembg (MIT) para colocar personas/objetos sobre
fondos de marca (miniaturas, posts con retrato).

Usa la API de rembg (el `python -m rembg` NO existe en rembg 2.0.87:
«No module named rembg.__main__», verificado 17-nov-2026) con el modelo
u2net que ya está en el hub (<hub>/.u2net, descargado en el cierre de
huecos R3). Usa el Python del hub (HUB_PY) si está disponible.

Uso:
  python3 scripts/cutout.py entrada.jpg salida.png [--model u2net] [--alpha-matting]
  --alpha-matting: bordes más limpios (cabello), ~2,5x más lento.

Límites conocidos (verificados 16-nov-2026): en multitudes lejanas el
mate sale casi vacío; recorta a TODAS las personas del encuadre.
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path


def find_python() -> str:
    hub_py = Path.home() / "workspace" / "remotion-hub" / ".venv" / "bin" / "python"
    for cand in [os.environ.get("HUB_PY"), str(hub_py), sys.executable]:
        if not cand:
            continue
        r = subprocess.run([cand, "-c", "import rembg"], capture_output=True)
        if r.returncode == 0:
            return cand
    raise SystemExit("rembg no está instalado en ningún Python del hub (ver README de recuperación).")


RUNNER = """
import os, sys
os.environ.setdefault("U2NET_HOME", os.path.expanduser("~/workspace/remotion-hub/.u2net"))
from rembg import remove, new_session
from PIL import Image
src, dst, model, alpha = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4] == "1"
img = Image.open(src)
session = new_session(model)
out = remove(img, session=session, alpha_matting=alpha)
out.save(dst)
print(f"OK {dst} {out.size} {out.mode}")
"""


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--model", default="u2net")
    ap.add_argument("--alpha-matting", action="store_true")
    args = ap.parse_args()
    src = Path(args.src)
    if not src.exists():
        print(f"no existe: {src}", file=sys.stderr)
        sys.exit(1)
    py = find_python()
    print(f"rembg con {py} (modelo {args.model})…")
    subprocess.run(
        [py, "-c", RUNNER, str(src), str(Path(args.dst)), args.model, "1" if args.alpha_matting else "0"],
        check=True,
    )


if __name__ == "__main__":
    main()
