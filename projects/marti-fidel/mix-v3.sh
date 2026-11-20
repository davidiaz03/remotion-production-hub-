#!/bin/bash
# Mezcla V3 del reel marti-fidel (VO Kokoro ef_dora de previsualización
# + cama calm-documentary-a de la biblioteca + SFX re-temporizados a la
# estructura V3 de 8 líneas). Ducking V1.5 (threshold 0,08 / ratio 5 /
# release 250 ms), música 0,38. Los SFX ligados a palabras van +80 ms
# tras el onset (lección V2.4, check (i5) — el ataque de la palabra
# suena primero y el SFX la acentúa sin enterrarla): pop «RECUENTO»,
# pop «MARCHA», pop «WASHINGTON», data «FILA», boom «GIGANTE»,
# boom «PENSAR.» (L6), pop «CONDENADO», pop «LEER.» y boom «PENSAR.»
# (L8). Los booms de estructura (0,00 / 2,90 / 23,53 / 31,01) quedan
# en el onset: sus palabras tienen ataque fuerte (oclusivas/vocal)
# y el check (i5) no los marca.
# Tiempos según vo-lines.json + captions-v3.ts (L2 revisada:
# «Martí lo vio venir en 1891.»). Total 41,83 s (1255 f).
# Hallazgo redes V3 #6: la música CAE A SILENCIO en la tesis L7
# (31,01–36,45 s, rampas de 0,5 s) y vuelve solo en «Leer. Pensar.»
# (dip-bed.py; la mezcla recibe la cama con el dip aplicado).
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
~/workspace/remotion-hub/.venv/bin/python scripts/audio/dip-bed.py \
  --in projects/marti-fidel/public/audio/v3/music-bed.wav \
  --out projects/marti-fidel/public/audio/v3/music-bed-dipped.wav \
  --silence 31.01 36.45 --fade 0.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/v3/vo-preview-v3.wav \
  --music projects/marti-fidel/public/audio/v3/music-bed-dipped.wav \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@0.00" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@2.90" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@4.63" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@7.87" \
  --sfx "$SFX/pops/pop-medium-in.wav@8.56" \
  --sfx "$SFX/pops/pop-medium-in.wav@9.60" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@10.90" \
  --sfx "$SFX/pops/pop-medium-in.wav@13.54" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@16.47" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@18.22" \
  --sfx "$SFX/data/data-number-land.wav@19.64" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@21.08" \
  --sfx "$SFX/booms-and-bass/boom-hit-strong.wav@23.53" \
  --sfx "$SFX/pops/pop-medium-in.wav@24.98" \
  --sfx "$SFX/pops/pop-medium-in.wav@26.06" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@29.42" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@31.01" \
  --sfx "$SFX/pops/pop-medium-in.wav@33.38" \
  --sfx "$SFX/pops/pop-medium-in.wav@36.53" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@36.80" \
  --sfx "$PROJ/public/audio/sting-2x.wav@38.80" \
  --seconds 41.83 \
  --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 \
  --music-volume 0.38 --end-fade 1.0 \
  --out projects/marti-fidel/public/audio/v3/mix-v3.wav \
  --report projects/marti-fidel/public/audio/v3/mix-v3.json --force
