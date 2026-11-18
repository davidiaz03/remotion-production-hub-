#!/usr/bin/env python3
"""Genera imágenes absurdas con Pollinations (vía IA) para memes.

Envoltorio fino sobre scripts/gen-illustration.py del hub (misma API,
mismo gateway gen.pollinations.ai, mismo token POLLINATIONS_TOKEN desde
~/workspace/remotion-hub/.env). El token nunca se muestra ni se registra.

Uso:
  python3 gen-absurd.py --prompt "un tiburón con traje dando una conferencia" \\
      --out ../assets/ai/tiburon.png

  # Sin --out, guarda en ../out/absurd-<fecha-hora>.png
  python3 gen-absurd.py --prompt "paloma con casco de obra mirando un plano"

El style prompt por defecto es estética de meme absurdo; se puede cambiar
con --style-prompt. Ver README.md § «Vía IA» para cuándo usar Pollinations
(imagen) o Gemini Pro (vídeo).
"""
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

DEFAULT_STYLE = (
    "Absurd internet meme aesthetic, surreal, chaotic, hyper-detailed, "
    "funny, unexpected juxtaposition, no text, no watermark"
)


def find_gen_script() -> Path:
    candidates = []
    env = os.environ.get("HUB_REPO")
    if env:
        candidates.append(Path(env) / "scripts" / "gen-illustration.py")
    candidates += [
        Path.home() / "workspace" / "remotion-hub" / "repo"
        / "scripts" / "gen-illustration.py",
        Path.home() / "workspace" / "remotion-hub" / "worktrees"
        / "content-hub" / "scripts" / "gen-illustration.py",
    ]
    for c in candidates:
        if c.exists():
            return c
    raise SystemExit(
        "No se encontró scripts/gen-illustration.py del hub. "
        "Genera desde el checkout principal (~/workspace/remotion-hub/repo)."
    )


def load_env_token():
    """Carga POLLINATIONS_TOKEN desde ~/workspace/remotion-hub/.env si no
    está ya en el entorno (lo que hace activate.sh). El token nunca se
    muestra ni se registra."""
    if os.environ.get("POLLINATIONS_TOKEN"):
        return
    env_file = Path.home() / "workspace" / "remotion-hub" / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        if key.strip() == "POLLINATIONS_TOKEN":
            os.environ["POLLINATIONS_TOKEN"] = val.strip().strip('"').strip("'")


def main() -> int:
    load_env_token()
    argv = sys.argv[1:]
    if "--style-prompt" not in argv:
        argv += ["--style-prompt", DEFAULT_STYLE]
    if "--model" not in argv:
        argv += ["--model", "flux"]
    if "--out" not in argv:
        out = ROOT / "out" / f"absurd-{datetime.now():%Y%m%d-%H%M%S}.png"
        argv += ["--out", str(out)]
    script = find_gen_script()
    print(f"generando con {script} …")
    subprocess.run([sys.executable, str(script), *argv], check=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
