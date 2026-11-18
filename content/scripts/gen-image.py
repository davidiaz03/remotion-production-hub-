#!/usr/bin/env python3
"""Genera imágenes con Pollinations desde el hub de contenido.

Envoltorio fino sobre scripts/gen-illustration.py (repo raíz, rama
work/gap-closing-2026-11-16): misma API, mismo gateway
(gen.pollinations.ai, Bearer + nologo + private), mismo token
(POLLINATIONS_TOKEN desde ~/workspace/remotion-hub/.env vía activate.sh).

Uso:
  python3 content/scripts/gen-image.py --prompt "..." --out pieces/<slug>/img/x.png [--seed 17] [--width 1024] [--height 1024]

El style prompt de ilustración sobria del Memorial es el de defecto; se
puede cambiar con --style-prompt. Ver GUIDE.md § «Imágenes generadas»
para cuándo usar Pollinations, Gemini Pro o foto real.
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CONTENT = HERE.parent
REPO = CONTENT.parent

DEFAULT_STYLE = (
    "Sober flat vector illustration, deep black background, "
    "muted red (#ED1C24) accents, subtle grain texture, minimalist, "
    "no text, no watermark"
)


def find_gen_script() -> Path:
    candidates = [
        REPO / "scripts" / "gen-illustration.py",
        Path.home() / "workspace" / "remotion-hub" / "repo" / "scripts" / "gen-illustration.py",
    ]
    env = __import__("os").environ.get("HUB_REPO")
    if env:
        candidates.insert(0, Path(env) / "scripts" / "gen-illustration.py")
    for c in candidates:
        if c.exists():
            return c
    raise SystemExit(
        "No se encontró scripts/gen-illustration.py (rama work/gap-closing-2026-11-16). "
        "Fusiónala o genera desde el checkout principal."
    )


def main() -> None:
    argv = sys.argv[1:]
    if "--style-prompt" not in argv:
        argv += ["--style-prompt", DEFAULT_STYLE]
    if "--model" not in argv:
        argv += ["--model", "flux"]
    script = find_gen_script()
    print(f"generando con {script} …")
    subprocess.run([sys.executable, str(script), *argv], check=True)


if __name__ == "__main__":
    main()
