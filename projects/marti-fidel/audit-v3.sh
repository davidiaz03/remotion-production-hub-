#!/bin/bash
# Auditoría de audio V3 del reel marti-fidel (VO Kokoro ef_dora de
# PREVISUALIZACIÓN; guion PROVISIONAL pendiente de confirmación por
# Suleris; la VO real de Adriana se sincroniza al recibirla).
# Uso: bash audit-v3.sh   (tras el render + master.py)
# La VO es Kokoro generada (no hay original vs editada), así que
# --voice-orig y --voice-edited apuntan al mismo archivo; la
# transcripción y la predicción son V3 (palabras Whisper con tiempos
# de los captions corregidos — los slots de línea de vo-lines.json
# son exactos porque la VO se sintetizó línea por línea) y el
# edit-plan V3 declara las pausas diseñadas (7 entre-líneas + 4
# intra-línea). OJO: pasar SIEMPRE las rutas V3 explícitas — el
# audit descubre por defecto los archivos V2 (vo-editada-
# transcripcion.json) y la primera corrida de V3 dio 46 FAIL espurios
# de alineación por comparar los captions V3 con la transcripción V2.
# La música es una sola sección: la cama calm-documentary-a con el
# dip de silencio en la tesis L7 (31,01–36,45 s;
# music-bed-dipped.wav, hallazgo redes #6). Los 9 SFX ligados a
# palabras usan los onsets de captions-v3.ts +80 ms (pop «RECUENTO»
# 8.56, pop «MARCHA» 9.60, pop «WASHINGTON» 13.54, data «FILA» 19.64,
# boom «GIGANTE» 21.08, boom «PENSAR.» L6 29.42, pop «CONDENADO»
# 33.38, pop «LEER.» 36.53, boom «PENSAR.» L8 36.80); el resto son
# fijos de la estructura V3 (ver mix-v3.sh).
# --transcription (original) usa la transcripción CORREGIDA (bordes
# Whisper sustituidos por la predicción donde el desvío > 0,08 s,
# misma regla que el alineador de (g)): la VO es Kokoro sin editar
# (orig == edited), y con los bordes crudos de Whisper los checks
# (c) §4 y (i2) comparaban el mismo audio en posiciones distintas
# (la 2ª corrida dio 1 FAIL (c) + 3 (i2) + 1 (i4) espurios por eso;
# la forma de onda está limpia: sin huecos, corr 1,00). La
# transcripción EDITADA sigue siendo la Whisper cruda (la alineación
# (g) la necesita tal cual). Novena corrección (corrida 6): el borde
# de «Es» (L3) también en la PREDICCIÓN (7.82→7.88, el onset medido
# por RMS — silencio digital hasta 7.875, voz desde 7.880): con el
# borde Whisper en 7.82, los primeros 60 ms del span caían en el
# hueco entre segmentos del plan y (i2) reportaba un dip falso de
# 154 dB. La predicción es la referencia acústica de (g): 7.88 es
# el onset real, no el estimado de Whisper.
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
  --tag v3 \
  --master "$PROJ/out/marti-fidel-v3_MASTER.mp4" \
  --mix "$PROJ/public/audio/v3/mix-v3.wav" \
  --voice-orig "$PROJ/public/audio/v3/vo-preview-v3.wav" \
  --voice-edited "$PROJ/public/audio/v3/vo-preview-v3.wav" \
  --transcription "$PROJ/public/audio/v3/vo-preview-v3-transcripcion-corregida.json" \
  --transcription-edited "$PROJ/public/audio/v3/vo-preview-v3-transcripcion.json" \
  --prediction "$PROJ/research/vo-editada-prediccion-v3.json" \
  --edit-plan "$PROJ/research/edit-plan-v3.json" \
  --captions "$PROJ/public/audio/v3/captions.json" \
  --vo-lines "$PROJ/public/audio/v3/vo-lines.json" \
  --section "$PROJ/public/audio/v3/music-bed-dipped.wav@0@41.83" \
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
  --music-volume 0.38 --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 --end-fade 1.0 \
  --seconds 41.83 --expected-frames 1255
