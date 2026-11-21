#!/bin/bash
# Auditoría de audio V4 del reel marti-fidel (VO REAL de Adriana;
# guion V4.3 confirmado de oído por el usuario 20-nov 17:14, 11 líneas
# APROBADAS; video 69,23 s = 2077 f).
# Uso: bash audit-v4.sh   (tras el render + master.py; NO ejecutar
# antes: el máster marti-fidel-v4_MASTER.mp4 aún no existe).
# La VO real tiene original vs editada distintos (vo-real-v4-raw.wav
# vs vo-real-v4.wav, normalizada a -18 LUFS por línea); las
# transcripciones y la predicción son V4 (tiempos reales de la VO de
# Adriana) y el edit-plan V4 declara las pausas diseñadas (10
# entre-líneas + 9 intra-línea naturales). OJO: pasar SIEMPRE las
# rutas V4 explícitas — el audit descubre por defecto los archivos V2
# (ver la advertencia en audit-v3.sh: la primera corrida de V3 dio
# 46 FAIL espurios por comparar captions V3 con transcripción V2).
# La música es una sola sección: la cama calm-documentary-a bucleada
# a 69,23 s con el dip de silencio en la tesis L9 (53,01-57,02 s;
# music-bed-dipped.wav, hallazgo redes #6). Los 11 SFX ligados a
# palabras usan los onsets de sfx-anchors-v4.json +80 ms (latido
# «AÑOS,» 2.43, pop «RECUENTO» 10.23, pop «MARCHA» 11.53, pop
# «WASHINGTON» 15.79, data «FILA» 22.32, boom «GIGANTE» L5 23.84,
# boom «GIGANTE,» L6 26.61, boom «PENSAR.» L7 43.95, pop «CONDENADO»
# 55.71, pop «LEER.» 57.63, boom «PENSAR.» L10 59.69); el resto son
# fijos de la estructura V4 (ver mix-v4.sh). La lista --sfx de este
# script es EXACTAMENTE la de mix-v4.sh: mismos archivos y tiempos.
# OJO: NUNCA poner comentarios DENTRO de la invocación continuada
# con `\` — en bash, la línea `# ...` corta la continuación y el
# resto de los argumentos se ejecuta como comando (la 3ª corrida
# de V3 perdió --transcription/--edit-plan/--sfx por eso y dio
# 17 FAIL espurios: 11 (e) sin plan + 5 (g) contra la V2).
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
python3 scripts/audio/audit-audio.py \
  --project projects/marti-fidel \
  --tag v4 \
  --master "$PROJ/out/marti-fidel-v4_MASTER.mp4" \
  --mix "$PROJ/public/audio/v4/mix-v4.wav" \
  --voice-orig "$PROJ/public/audio/v4/vo-real-v4-raw.wav" \
  --voice-edited "$PROJ/public/audio/v4/vo-real-v4.wav" \
  --transcription "$PROJ/public/audio/v4/vo-real-transcripcion-orig.json" \
  --transcription-edited "$PROJ/public/audio/v4/vo-real-transcripcion-editada.json" \
  --prediction "$HUB/projects/marti-fidel/research/vo-real-prediccion-v4.json" \
  --edit-plan "$HUB/projects/marti-fidel/research/edit-plan-v4.json" \
  --captions "$PROJ/public/audio/v4/captions.json" \
  --vo-lines "$PROJ/public/audio/v4/vo-lines.json" \
  --section "$PROJ/public/audio/v4/music-bed-dipped.wav@0@69.23" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@0.00" \
  --sfx "$SFX/booms-and-bass/bass-808-short.wav@2.43" \
  --sfx "$SFX/booms-and-bass/bass-808-short.wav@3.23" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@5.57" \
  --sfx "$SFX/foley/foley-paper-slide.wav@8.97" \
  --sfx "$SFX/pops/pop-medium-in.wav@10.23" \
  --sfx "$SFX/pops/pop-medium-in.wav@11.53" \
  --sfx "$SFX/mechanical/mechanical-switch-light.wav@12.73" \
  --sfx "$SFX/pops/pop-medium-in.wav@15.79" \
  --sfx "$SFX/whooshes/whoosh-medium-soft.wav@18.74" \
  --sfx "$SFX/data/data-number-land.wav@22.32" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@23.84" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@26.61" \
  --sfx "$SFX/whooshes/whoosh-slow-soft.wav@35.43" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@43.95" \
  --sfx "$SFX/digital/digital-static.wav@44.84" \
  --sfx "$SFX/pops/pop-medium-in.wav@55.71" \
  --sfx "$SFX/pops/pop-medium-in.wav@57.63" \
  --sfx "$SFX/booms-and-bass/boom-hit-soft.wav@59.69" \
  --sfx "$PROJ/public/audio/sting-2x.wav@63.85" \
  --music-volume 0.38 --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 --end-fade 1.0 \
  --seconds 69.23 --expected-frames 2077
