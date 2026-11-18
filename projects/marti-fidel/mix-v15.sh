#!/bin/bash
# Mezcla V1.5 del reel marti-fidel (VO editada V1.5 + ducking corregido).
# Cambios vs V1.4: duck-threshold 0.018 -> 0.08, duck-ratio 7 -> 5,
# duck-release 150 -> 250 ms (bombeo 20,1 -> 9,0 dB, verificado);
# SFX de «17» 8,97 -> 9,06 y de «25» 10,23 -> 10,33 (cortes acústicos
# de L4 retrasan las palabras 0,09/0,11 s).
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
python3 scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/vo-definitiva-editada.wav \
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
  --seconds 50.23 \
  --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 \
  --music-volume 0.38 --xfade 1.5 --end-fade 1.0 \
  --out projects/marti-fidel/public/audio/mix.wav --force
