#!/bin/bash
# Auditoría de audio del reel marti-fidel (módulo scripts/audio/audit-audio.py).
# Uso: bash audit-marti-fidel.sh <TAG> [args extra para audit-audio.py]
# Ejemplo: bash audit-marti-fidel.sh v141
set -e
TAG="${1:-vX}"
shift || true
PLAN="${PLAN:-v15}"
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
RES=$HUB/projects/marti-fidel/research
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
python3 scripts/audio/audit-audio.py \
  --project projects/marti-fidel \
  --tag "$TAG" \
  --prediction "$RES/vo-editada-prediccion.json" \
  --edit-plan "$RES/edit-plan-$PLAN.json" \
  --section "$HUB/assets/music/flow/shadows-and-evidence-flow-stem.wav@0@27" \
  --section "$HUB/assets/music/flow/weight-of-memory-flow-stem.wav@25.5@50.23" \
  --sfx "$SFX/data/data-countup-medium.wav@0" \
  --sfx "$SFX/data/data-number-land.wav@1.19" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@3.5" \
  --sfx "$SFX/data/data-bar-grow.wav@4.27" \
  --sfx "$SFX/data/data-number-land.wav@4.95" \
  --sfx "$SFX/data/data-number-land.wav@7.87" \
  --sfx "$SFX/data/data-number-land.wav@9.06" \
  --sfx "$SFX/data/data-number-land.wav@10.33" \
  --sfx "$SFX/data/data-number-land.wav@11.94" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@14.02" \
  --sfx "$SFX/pops/pop-medium-in.wav@15.56" \
  --sfx "$SFX/pops/pop-medium-in.wav@16.96" \
  --sfx "$SFX/pops/pop-medium-in.wav@19.17" \
  --sfx "$SFX/data/data-number-land.wav@22.94" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@25.15" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@27.42" \
  --sfx "$SFX/data/data-tick.wav@30.21" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@33.63" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@36.37" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@40.68" \
  --sfx "$PROJ/public/audio/sting-2x.wav@47.2" \
  --music-volume 0.38 --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 --xfade 1.5 --end-fade 1.0 \
  --seconds 50.23 --expected-frames 1507 \
  "$@"
