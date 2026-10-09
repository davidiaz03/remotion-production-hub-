#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  echo 'ATENCION: falta package-lock.json. Se requiere fijar el lockfile antes de renderizar.'
  echo 'Ejecuta bash scripts/bootstrap-lock.sh y confirma el archivo resultante en Git.'
fi
command -v ffmpeg >/dev/null || echo 'Instala ffmpeg: sudo apt-get update && sudo apt-get install -y ffmpeg'
command -v rclone >/dev/null || echo 'Para Drive instala rclone (consulta docs/DRIVE.md).'
