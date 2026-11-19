#!/bin/bash
# Auditoría de audio V2.4 del reel marti-fidel (voz real de la locutora).
# Uso: bash audit-v2.4.sh   (tras el render + master.py)
# Rutas real/ explícitas: los valores por defecto del módulo apuntan a
# V1 y darían FAIL espurios. La VO original es la concatenación de los
# 9 archivos grabados (sin solapes); el edit-plan expresa sus
# coordenadas originales en esa concatenación (ver build-vo-real.py).
# Los 5 SFX ligados a palabras usan los onsets reales de la voz
# (boom «gigante» 27.96, boom «pensar.» 37.13, pop «condenado» 40.38,
# pop «Leer.» 43.25, boom «Pensar.» 44.51); el resto son fijos de V2.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
RES=$HUB/projects/marti-fidel/research
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
python3 scripts/audio/audit-audio.py \
  --project projects/marti-fidel \
  --tag v2.4 \
  --master "$PROJ/out/marti-fidel-v2.4_MASTER.mp4" \
  --mix "$PROJ/public/audio/real24/mix-v2.4.wav" \
  --voice-orig "$PROJ/public/audio/real24/vo-real-raw.wav" \
  --voice-edited "$PROJ/public/audio/real24/vo-real.wav" \
  --captions "$PROJ/public/audio/real24/captions.json" \
  --vo-lines "$PROJ/public/audio/real24/vo-lines.json" \
  --transcription "$PROJ/public/audio/real24/vo-real-transcripcion-orig.json" \
  --transcription-edited "$PROJ/public/audio/real24/vo-real-transcripcion-editada.json" \
  --prediction "$RES/vo-real-prediccion-v2.4.json" \
  --edit-plan "$RES/edit-plan-v2.4.json" \
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
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@27.96" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@32.20" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@37.13" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@37.81" \
  --sfx "$SFX/pops/pop-medium-in.wav@40.38" \
  --sfx "$SFX/pops/pop-medium-in.wav@43.25" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@44.51" \
  --sfx "$PROJ/public/audio/sting-2x.wav@45.2" \
  --music-volume 0.38 --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 --xfade 1.5 --end-fade 1.0 \
  --seconds 48.23 --expected-frames 1447
