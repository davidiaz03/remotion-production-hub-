#!/bin/bash
# Mezcla V6.1 («toque final») del reel marti-fidel (VO REAL de
# Adriana, guion V4.3, 11 líneas, 71,23 s = 2137 f). CAMBIOS vs V5/V6:
# - DURACIÓN +2 s (69,23 -> 71,23 s): el cierre aguanta 2 s más por
#   orden de Suleris (nota de voz 21-nov ~10:09: «me parece excelente»,
#   «un último detallito»: al salir «Memorial» se acababa todo de golpe
#   y el final se veía atropellado; la música se truncaba brusca).
# - CAMA EXTENDIDA 88,00-159,23 s (misma ventana V5 + 2 s; la pista
#   Flow dura 179,56 s). Ventana re-escaneada con scan-bed.py: PASS
#   (0 segmentos VOICE en 88-159,23 s; 1 UNCERTAIN = alucinación
#   «Subtítulos...» con nsp 0,596, no voz). GANANCIA IDÉNTICA A V5
#   (-0,20 dB, medida sobre la ventana V5 88-157,23 s: input -15,80
#   LUFS): la cama es byte-idéntica a la V5 hasta el fade-out, así que
#   la mezcla no cambia en 0-63,85 s. Fade-in 0,3 s; fade-out final
#   de 2 s (st=69,23) en vez de 1 s: el final respira.
# - STING RESINCRONIZADO (el «toque final» pedido por el usuario):
#   en V4/V4.1/V5/V6 el audio del sting (sting-2x.wav) sonaba a 63,85 s
#   (arranque de S11) mientras el logo animado entraba a 67,53 s: el
#   disparo caía a ~64,5 s SOBRE LA VO del grito y el logo aparecía en
#   silencio (solo la cama). El cierre estándar del Memorial («la del
#   disparo», como en Marabana y en marti-fidel V2.5/V3) sincroniza
#   audio y vídeo del sting: disparo a sting +0,65 s, en la ventana
#   de rotura de la estrella. Ahora sting-2x.wav@67,53 s (= inicio del
#   sting visual, f2026): disparo a ~68,18 s, logo resuelto a ~69,3 s,
#   aguante del logo completo ~2,4 s hasta el final (71,23 s).
# - PAD DE TESIS (53,01-57,04 s) y RAMPA DE CIERRE (+3,5 dB,
#   57,54-68,0 s) idénticos a V5; la rampa mantiene el nivel hasta el
#   fade-out (69,23 s). VO (v41, sin tocar), resto de SFX (19, mismos
#   archivos y tiempos), ducking (1500 ms / 0,12 / 2), music-volume
#   0,38 y niveles (-14,5 LUFS / TP -2,0 dBTP objetivo) idénticos a V5.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
A61=$PROJ/public/audio/v61
mkdir -p $A61
cd $HUB/repo
# 1. Cama: ventana 88,00-159,23 s, ganancia V5 (-0,20 dB), mono 48 kHz,
# fade-in 0,3 s y fade-out final de 2 s (st=69,23). -map 0:a:0 salta la
# carátula mjpeg del MP3.
BED_IN=$PROJ/public/audio/flow-documentary-underscore.mp3
BED_TRIM=$A61/music-bed-trimmed.wav
test -f "$BED_IN" || { echo "FALTA LA CAMA: $BED_IN"; exit 1; }
echo "cama Flow (ventana 88-159,23 s): ganancia V5 -0,20 dB, fade-out 2 s"
ffmpeg -v error -y -ss 88 -i "$BED_IN" -map 0:a:0 -t 71.23 -ac 1 -ar 48000 \
  -af "volume=-0.20dB,afade=t=in:st=0:d=0.3,afade=t=out:st=69.23:d=2.0" "$BED_TRIM"
~/workspace/remotion-hub/.venv/bin/python scripts/audio/thesis-pad.py \
  --in projects/marti-fidel/public/audio/v61/music-bed-trimmed.wav \
  --out projects/marti-fidel/public/audio/v61/music-bed-padded.wav \
  --pad 53.01 57.04 --source 20.0 4.0 --fade 0.5 --lowpass 300 \
  --target-rms-db -23.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/ramp-bed.py \
  --in projects/marti-fidel/public/audio/v61/music-bed-padded.wav \
  --out projects/marti-fidel/public/audio/v61/music-bed-ramped.wav \
  --ramp 57.54 68.0 3.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/v41/vo-real-v41.wav \
  --music projects/marti-fidel/public/audio/v61/music-bed-ramped.wav \
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
  --sfx "$PROJ/public/audio/sting-2x.wav@67.53" \
  --seconds 71.23 \
  --target-lufs -14.5 --target-tp -2.0 \
  --duck-release 1500 --duck-threshold 0.12 --duck-ratio 2 \
  --music-volume 0.38 --end-fade 2.0 \
  --out projects/marti-fidel/public/audio/v61/mix-v61.wav \
  --report projects/marti-fidel/public/audio/v61/mix-v61.json --force
