#!/bin/bash
# Auditoría de audio V4.1 del reel marti-fidel (VO REAL de Adriana;
# guion V4.3 confirmado de oído por el usuario 20-nov 17:14, 11 líneas
# APROBADAS; video 69,23 s = 2077 f).
# Uso: bash audit-v41.sh   (tras el render + master.py; NO ejecutar
# antes: el máster marti-fidel-v41_MASTER.mp4 aún no existe).
# CAMBIOS vs audit-v4.sh: tag v41; máster/mix/cama V4.1; edit-plan
# V4.1 (añade las 6 pausas naturales verificadas en la adjudicación
# V4, medidas en vo-real-v4.wav con el detector del audit: L3 10,81,
# L5 22,68, L6 31,54, L7 41,96, L8 45,04, L11 65,51); ducking
# suavizado (release 700 / threshold 0,08 / ratio 3, igual que
# mix-v41.sh). VO, transcripciones, predicción, captions y vo-lines
# son los V4 (la VO NO cambia en V4.1). La lista --sfx es
# EXACTAMENTE la de mix-v41.sh: mismos archivos y tiempos.
# OJO: NUNCA poner comentarios DENTRO de la invocación continuada
# con `\` — en bash, la línea `# ...` corta la continuación y el
# resto de los argumentos se ejecuta como comando.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
python3 scripts/audio/audit-audio.py \
  --project projects/marti-fidel \
  --tag v41 \
  --master "$PROJ/out/marti-fidel-v41_MASTER.mp4" \
  --mix "$PROJ/public/audio/v41/mix-v41.wav" \
  --voice-orig "$PROJ/public/audio/v4/vo-real-v4-raw.wav" \
  --voice-edited "$PROJ/public/audio/v4/vo-real-v4.wav" \
  --transcription "$PROJ/public/audio/v4/vo-real-transcripcion-orig.json" \
  --transcription-edited "$PROJ/public/audio/v4/vo-real-transcripcion-editada.json" \
  --prediction "$HUB/projects/marti-fidel/research/vo-real-prediccion-v4.json" \
  --edit-plan "$HUB/projects/marti-fidel/research/edit-plan-v41.json" \
  --captions "$PROJ/public/audio/v4/captions.json" \
  --vo-lines "$PROJ/public/audio/v4/vo-lines.json" \
  --section "$PROJ/public/audio/v41/music-bed-dipped.wav@0@69.23" \
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
  --music-volume 0.38 --duck-release 700 --duck-threshold 0.08 --duck-ratio 3 --end-fade 1.0 \
  --seconds 69.23 --expected-frames 2077
