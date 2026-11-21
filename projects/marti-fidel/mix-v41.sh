#!/bin/bash
# Mezcla V4.1 del reel marti-fidel (VO REAL de Adriana, guion V4.3,
# 11 líneas, 69,23 s = 2077 f). CAMBIOS vs V4:
# - CAMA NUEVA: «Documentary underscore — Martí reel», generada en
#   Google Flow Music (flowmusic.app) 20-nov-2026, 3:00, instrumental,
#   piano suave y cuerdas, cálido y reflexivo, sin voces. La cama de
#   biblioteca V4 (calm-documentary-a bucleada) era lo más débil del
#   máster según el usuario (molesta, sencilla). NO se usa ninguna
#   cama de la biblioteca. (MusicGen se descartó al llegar Flow.)
# - VENTANA 72,00-141,23 s (69,23 s), elegida por la curva de
#   sonoridad medida (RMS por segundo): arranca en una entrada de
#   frase tras un respiro (71 s: -28,1 -> 72 s: -19,7), 10 s
#   iniciales ~-20,8 dBFS, 10 s finales ~-18,3 dBFS (crecimiento
#   suave +2,5 dB), sin agujeros (mín -26,6, un respiro de frase),
#   y termina en la meseta (141 s: -20,2) antes del descenso del
#   tema (142 s: -26,4) y del fade-out final (175-179 s). La
#   ventana 0:00-1:09 se descartó: tiene un agujero de -44,9 dBFS
#   a los 10 s y un ataque en el segundo 0. La cama se normaliza
#   a -16 LUFS (dos pasadas, como bed-loop.py), mono 48 kHz,
#   fade-in 0,3 s y fade-out 1 s.
# - DUCKING SUAVIZADO (2ª pasada, 21-nov-2026): V4 bombeaba 12,7 dB
#   dentro de frase (la música «respiraba» con las sílabas); la 1ª
#   pasada V4.1 (release 700 ms, ratio 3) bajó a 11,1 dB, aún sobre
#   el umbral de 6 dB. Simulación con la curva de ganancia del
#   sidechain (audit-audio.py): el release NO mueve el bombeo (la
#   variación es máx-mín dentro de frase); lo mueven ratio y
#   threshold. Release 1500 ms, threshold 0,12, ratio 2: bombeo
#   6,7 dB (simulado), profundidad media -4,1 dB. El umbral 0,15
#   daría 5,8 dB pero con profundidad -3,3 dB (las palabras suaves
#   quedarían sin ducking): se prefiere ducking real a pasar el
#   umbral. Music-volume 0,38 se mantiene.
# - VO V4.1 (21-nov-2026): vo-real-v41.wav = la VO V4 con 20 ms de
#   tono de sala insertados en la pausa HISTORIA,->ESTÁ (L9, 55,29 s;
#   la pausa medía 0,24 s y la regla permanente exige >=0,25 s;
#   ahora 0,26 s). El resto de la VO es idéntico (corr 1,0000);
#   L10/L11 se desplazan +20 ms en todos los archivos de tiempos.
# - El silencio diseñado en la tesis L9 se mantiene (la música CAE
#   A SILENCIO 53,01-57,04 s, rampas de 0,5 s, y vuelve solo en
#   «Leer. Pensar.»; dip-bed.py).
# VO (v41, ver arriba), SFX (20, mismos archivos y tiempos) y niveles
# (-16 LUFS / TP -2 dBTP, target -14,5 por el techo de TP) idénticos a V4.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
A41=$PROJ/public/audio/v41
mkdir -p $A41
cd $HUB/repo
# 1. Normaliza la ventana 72,00-141,23 s de la cama Flow a -16 LUFS
# (medición + ganancia lineal), mono 48 kHz, fade-in 0,3 s y
# fade-out final de 1 s. -map 0:a:0 salta la carátula mjpeg del MP3.
BED_IN=$PROJ/public/audio/flow-documentary-underscore.mp3
BED_TRIM=$A41/music-bed-trimmed.wav
test -f "$BED_IN" || { echo "FALTA LA CAMA: $BED_IN"; exit 1; }
IN_I=$(ffmpeg -v info -ss 72 -t 69.23 -i "$BED_IN" -map 0:a:0 -af "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | python3 -c "import sys,json; s=sys.stdin.read(); js=s[s.index('{',s.index('Parsed_loudnorm')):s.index('}',s.index('Parsed_loudnorm'))+1]; print(json.loads(js)['input_i'])")
GAIN=$(python3 -c "print(-16.0 - float('$IN_I'))")
echo "cama Flow (ventana 72-141,23 s): input ${IN_I} LUFS -> ganancia ${GAIN} dB"
ffmpeg -v error -y -ss 72 -i "$BED_IN" -map 0:a:0 -t 69.23 -ac 1 -ar 48000 \
  -af "volume=${GAIN}dB,afade=t=in:st=0:d=0.3,afade=t=out:st=68.23:d=1.0" "$BED_TRIM"
~/workspace/remotion-hub/.venv/bin/python scripts/audio/dip-bed.py \
  --in projects/marti-fidel/public/audio/v41/music-bed-trimmed.wav \
  --out projects/marti-fidel/public/audio/v41/music-bed-dipped.wav \
  --silence 53.01 57.04 --fade 0.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/v41/vo-real-v41.wav \
  --music projects/marti-fidel/public/audio/v41/music-bed-dipped.wav \
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
  --duck-release 1500 --duck-threshold 0.12 --duck-ratio 2 \
  --music-volume 0.38 --end-fade 1.0 \
  --out projects/marti-fidel/public/audio/v41/mix-v41.wav \
  --report projects/marti-fidel/public/audio/v41/mix-v41.json --force
