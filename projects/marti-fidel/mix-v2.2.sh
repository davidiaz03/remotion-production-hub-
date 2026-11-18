#!/bin/bash
# Mezcla V2.2 del reel marti-fidel (VO real + ducking V1.5).
# Generado por build-vo-real.py: misma música y mismos SFX
# que V2, con los 5 SFX ligados a palabras re-sincronizados
# a los onsets de la voz real (el resto sigue a eventos de
# vídeo fijos y conserva su tiempo V2).
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/real/vo-real.wav \
  --section "$HUB/assets/music/flow/shadows-and-evidence-flow-stem.wav@0@24.11" \
  --section "$HUB/assets/music/flow/weight-of-memory-flow-stem.wav@22.61@48.23" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@0.00" \
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
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@27.96" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@32.20" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@36.90" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@37.81" \
  --sfx "$SFX/pops/pop-medium-in.wav@40.33" \
  --sfx "$SFX/pops/pop-medium-in.wav@43.17" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@44.24" \
  --sfx "$PROJ/public/audio/sting-2x.wav@45.2" \
  --seconds 48.23 \
  --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 \
  --music-volume 0.38 --xfade 1.5 --end-fade 1.0 \
  --out projects/marti-fidel/public/audio/real/mix-v2.2.wav \
  --report projects/marti-fidel/public/audio/real/mix-v2.2.json --force
