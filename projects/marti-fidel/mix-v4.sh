#!/bin/bash
# Mezcla V4 del reel marti-fidel (VO REAL de Adriana, guion V4.3,
# 11 líneas, 69,23 s = 2077 f). Cama calm-documentary-a de la
# biblioteca (la misma de V3): de las 5 candidatas medidas es la más
# pareja (RMS por ventanas std 5,6 dB, rango 19,6 dB) y la más oscura
# (centroide 812 Hz, pads cálidos) — tono de ENSAYO TRANQUILO, lo que
# pidió Suleris. La «b» es más grave y menos pareja (std 8,2 dB); la
# «c» tiene pasajes casi en silencio (rango 76 dB, inutilizable como
# cama); shadows-and-evidence es tensión con crescendos (rango 60 dB,
# centroide 2209 Hz: alerta, no ensayo); weight-of-memory es más
# brillante (1314 Hz) y menos pareja (rango 33,8 dB). La cama de
# 59,94 s se buclea a 69,23 s con bed-loop.py (xfade 3 s de potencia
# igual; el empalme 56,94-59,94 s cae casi entero dentro del dip de
# la tesis, así que queda enmascarado; verificado sin agujero).
# Ducking V1.5 (threshold 0,08 / ratio 5 / release 250 ms), música
# 0,38. Los SFX ligados a palabras van +80 ms tras el onset (lección
# V2.4, check (i5)); los de estructura quedan en el onset.
# Hallazgo redes V3 #6: la música CAE A SILENCIO en la tesis L9
# (53,01-57,02 s, rampas de 0,5 s) y vuelve solo en «Leer. Pensar.»
# (dip-bed.py; la mezcla recibe la cama con el dip aplicado).
# Niveles: objetivo -16 LUFS / TP -2 dBTP. mix.py usa loudnorm de un
# solo pase con techo de TP: en V3 el target -14,5 midió -16,0
# (el techo de TP recorta la ganancia ~1,5 LUFS), así que se pasa
# --target-lufs -14.5 --target-tp -2.0 y se verifica lo medido en
# mix-v4.json (si cae fuera de [-16,5, -15,5], ajustar el target y
# re-correr; la mezcla tarda ~10 s). El end-fade de 1,0 s lo aplica
# bed-loop.py a la cama (mix.py ignora --end-fade con --music, solo
# lo aplica a --section); se pasa igual por simetría con V3 y porque
# audit-v4.sh lo modela así.
# SFX (20): boom de estructura 0,00; latido grave bajo el gancho
# (bass-808-short, lo más cercano a un latido en el pack CC0: no hay
# latido ni corazón; dos pulsos a 0,8 s en «años,» + pausa); whoosh
# al entrar al archivo S2; roce de papel S3; pops «RECUENTO» y
# «MARCHA»; chasquido de radio al entrar S4 (mechanical-switch-light,
# 32 ms, en la pausa antes de «Un») + pop «WASHINGTON»; whoosh S5 +
# data «FILA» + boom «GIGANTE» L5; boom «GIGANTE,» L6 (el gigante es
# la imagen central del reel, se repite en L5/L6/L11); whoosh al
# entrar S7 (Fidel 2005); boom «PENSAR.» L7 (fin de la cita);
# estática digital al entrar S8 (corte duro; 0,65 s, se corta en seco
# mucho antes de la tesis); pop «CONDENADO» L9; pop «LEER.» + boom
# «PENSAR.» L10; sting de cierre al arrancar S11.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
cd $HUB/repo
~/workspace/remotion-hub/.venv/bin/python scripts/audio/bed-loop.py \
  --bed calm-documentary-a --seconds 69.23 --xfade 3.0 --target-lufs -16 \
  --out projects/marti-fidel/public/audio/v4/music-bed.wav --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/dip-bed.py \
  --in projects/marti-fidel/public/audio/v4/music-bed.wav \
  --out projects/marti-fidel/public/audio/v4/music-bed-dipped.wav \
  --silence 53.01 57.02 --fade 0.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/v4/vo-real-v4.wav \
  --music projects/marti-fidel/public/audio/v4/music-bed-dipped.wav \
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
  --seconds 69.23 \
  --target-lufs -14.5 --target-tp -2.0 \
  --duck-release 250 --duck-threshold 0.08 --duck-ratio 5 \
  --music-volume 0.38 --end-fade 1.0 \
  --out projects/marti-fidel/public/audio/v4/mix-v4.wav \
  --report projects/marti-fidel/public/audio/v4/mix-v4.json --force
