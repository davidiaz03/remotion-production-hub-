#!/usr/bin/env bash
# Render + máster + QA + auditoría del reel «Dicen que no hay bloqueo».
# Uso: bash scripts/run-render.sh [--tag v1] [--skip-audit] [--resume]
#   --tag: etiqueta del máster y de la auditoría (defecto v1).
#   --skip-audit: solo render + máster + QA (la auditoría va aparte).
#   --resume: reanuda los tramos ya renderizados y verificados.
# Requisitos: composición MainReel registrada (src/Root.tsx),
# project.json con durationInFrames 2325, public/audio/mix.wav.
# Tramos PCM (nunca AAC): el concat es exacto a la muestra y
# master.py usa --clean-audio (sin atempo, sin trim, sin boost).
set -euo pipefail
cd "$(dirname "$0")/.."
source ~/workspace/remotion-hub/activate.sh
export TMPDIR="${TMPDIR:-$HOME/workspace/.tmp}"
mkdir -p "$TMPDIR"
TAG="v1"; SKIP_AUDIT=0; RESUME=""
for a in "$@"; do
  case "$a" in
    --tag) shift; TAG="$1";;
    --tag=*) TAG="${a#--tag=}";;
    --skip-audit) SKIP_AUDIT=1;;
    --resume) RESUME="--resume";;
  esac
  shift || true
done
HUB_PY="${HUB_PY:-$HOME/workspace/remotion-hub/.venv/bin/python}"
REPO="$HOME/workspace/remotion-hub/repo"

echo "== 1) Render por tramos PCM (2325 f, 16 tramos de 150) =="
cd "$REPO"
node scripts/render-chunks.mjs negacion-embargo --composition MainReel \
  --frames 0-2324 --chunk 150 --concurrency 2 --timeout 120000 --crf 19 \
  --out "projects/negacion-embargo/out/chunks" \
  --concat-out "projects/negacion-embargo/out/negacion-embargo-chunks.mkv" \
  --audio-codec pcm-16 $RESUME

echo "== 2) Máster + ligera (master.py --clean-audio) =="
cd "$REPO/projects/negacion-embargo"
"$HUB_PY" ../../scripts/audio/master.py \
  --input out/negacion-embargo-chunks.mkv \
  --out-master "out/MASTER-${TAG}.mp4" \
  --out-light "out/LIGERA-${TAG}.mp4" \
  --clean-audio --force

echo "== 3) QA (qa-media full) =="
cd "$REPO"
node scripts/qa-media.mjs negacion-embargo \
  --file "projects/negacion-embargo/out/MASTER-${TAG}.mp4" --mode full
# La ligera (720x1280) no pasa qa-media (exige la resolución de
# project.json): verificación directa con ffprobe + decode.
echo "-- ligera: ffprobe + decode --"
ffprobe -v error -count_frames -select_streams v:0 \
  -show_entries stream=width,height,nb_read_frames -of csv=p=0 \
  "projects/negacion-embargo/out/LIGERA-${TAG}.mp4"
ffprobe -v error -select_streams a:0 \
  -show_entries stream=codec_name -of csv=p=0 \
  "projects/negacion-embargo/out/LIGERA-${TAG}.mp4"
ffmpeg -hide_banner -v error -xerror \
  -i "projects/negacion-embargo/out/LIGERA-${TAG}.mp4" -f null - \
  && echo "ligera decodifica sin errores"

if [ "$SKIP_AUDIT" -eq 0 ]; then
  echo "== 4) Auditoría de audio (FAIL = no entregar) =="
  cd "$REPO/projects/negacion-embargo"
  TMPDIR="$TMPDIR" python3 scripts/run-audit.py "out/MASTER-${TAG}.mp4" --tag "$TAG"
fi
echo "TODO OK — máster: out/MASTER-${TAG}.mp4, ligera: out/LIGERA-${TAG}.mp4"
