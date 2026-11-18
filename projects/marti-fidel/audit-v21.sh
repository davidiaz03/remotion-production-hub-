#!/bin/bash
# Auditoría de audio V2.1 del reel marti-fidel (misma mezcla V2).
# Uso: bash audit-v21.sh
# Reutiliza la receta V2 (mix-v2.sh): mismas secciones de música y
# mismos SFX con los mismos tiempos. Rutas V2 explícitas: los
# valores por defecto del módulo apuntan a V1 y darían FAIL espurios.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
RES=$HUB/projects/marti-fidel/research
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
python3 scripts/audio/audit-audio.py \
  --project projects/marti-fidel \
  --tag v2.1 \
  --master "$PROJ/out/marti-fidel-v2.1_MASTER.mp4" \
  --mix "$PROJ/public/audio/v2/mix-v2.wav" \
  --voice-orig "$PROJ/public/audio/v2/vo-preview-v2.wav" \
  --voice-edited "$PROJ/public/audio/v2/vo-preview-v2.wav" \
  --captions "$PROJ/public/audio/v2/captions.json" \
  --vo-lines "$PROJ/public/audio/v2/vo-lines.json" \
  --transcription "$PROJ/public/audio/v2/vo-preview-v2-transcripcion.json" \
  --transcription-edited "$PROJ/public/audio/v2/vo-preview-v2-transcripcion.json" \
  --prediction "$RES/vo-preview-v2-prediccion.json" \
  --edit-plan "$RES/edit-plan-v2.json" \
  --section "$HUB/assets/music/flow/shadows-and-evidence-flow-stem.wav@0@24.11" \
  --section "$HUB/assets/music/flow/weight-of-memory-flow-stem.wav@22.61@48.23" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@0" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@3.88" \
  --sfx "$SFX/pops/pop-medium-in.wav@9.82" \
  --sfx "$SFX/pops/pop-medium-in.wav@10.89" \
  --sfx "$SFX/pops/pop-medium-in.wav@11.89" \
  --sfx "$SFX/data/data-tick.wav@12.56" \
  --sfx "$SFX/data/data-number-land.wav@14.29" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@16.25" \
  --sfx "$SFX/data/data-countup-medium.wav@17.86" \
  --sfx "$SFX/data/data-number-land.wav@20.41" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@24.57" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@28.03" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@32.20" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@36.31" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@37.81" \
  --sfx "$SFX/pops/pop-medium-in.wav@40.17" \
  --sfx "$SFX/pops/pop-medium-in.wav@43.06" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@43.33" \
  --sfx "$PROJ/public/audio/sting-2x.wav@45.2" \
  --music-volume 0.38 --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 --xfade 1.5 --end-fade 1.0 \
  --seconds 48.23 --expected-frames 1447
