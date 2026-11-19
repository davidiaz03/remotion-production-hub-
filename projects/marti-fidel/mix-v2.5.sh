#!/bin/bash
# Mezcla V2.5 del reel marti-fidel (VO real + ducking V1.5).
# Generado por build-vo-real-v25.py: misma música y mismos SFX
# que V2, con los 5 SFX ligados a palabras re-sincronizados
# a los onsets de la voz real (el resto sigue a eventos de
# vídeo fijos y conserva su tiempo V2).
# V2.4: 3 de esos SFX van +80 ms tras el onset (boom
# «pensar.», pop «Leer.», boom «Pensar.»): en el onset
# enterraban el ataque de la palabra (check (i5)).
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/real25/vo-real.wav \
  --section "$HUB/assets/music/flow/shadows-and-evidence-flow-stem.wav@0@24.11" \
  --section "$HUB/assets/music/flow/weight-of-memory-flow-stem.wav@22.61@51.23" \
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
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@37.13" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@40.81" \
  --sfx "$SFX/pops/pop-medium-in.wav@43.38" \
  --sfx "$SFX/pops/pop-medium-in.wav@46.25" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@47.51" \
  --sfx "$PROJ/public/audio/sting-2x.wav@48.2" \
  --seconds 51.23 \
  --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 \
  --music-volume 0.38 --xfade 1.5 --end-fade 1.0 \
  --out projects/marti-fidel/public/audio/real25/mix-v2.5.wav \
  --report projects/marti-fidel/public/audio/real25/mix-v2.5.json --force
