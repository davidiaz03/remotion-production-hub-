#!/bin/bash
# Mezcla V5 («next level definitiva») del reel marti-fidel (VO REAL de
# Adriana, guion V4.3, 11 líneas, 69,23 s = 2077 f). CAMBIOS vs V4.1:
# - VENTANA NUEVA 88,00-157,23 s de la cama Flow. La ventana V4.1
#   (72-141,23 s) empezaba DENTRO de la zona contaminada 60-88 s de la
#   pista «instrumental»: Whisper con VAD oye frases fantasma ahí
#   (80,69-87,99 s: «¡Claro que no está en el cuerpo de nadie!»...),
#   así que los primeros ~16 s del reel V4.1 llevaban susurros bajo
#   la VO. La ventana 88-157,23 s está LIMPIA (Whisper+VAD: 0
#   segmentos en 88-179,56 s; el tramo 147-179,56 s, sin verificar
#   antes, también es limpio). Arco RMS medido: 10 s iniciales
#   -19,2 dBFS, meseta 88-141 s ~-17/-20 dBFS, coda 142-157 s
#   ~-22/-29 dBFS (10 s finales -24,4 dBFS); sin agujeros
#   (mín -29,8 dBFS, un respiro de frase). NINGUNA ventana >=88 s
#   tiene crecimiento al cierre (el tema desciende desde 142 s);
#   88-157,23 s es la mejor disponible: maximiza la meseta (54 s),
#   media más alta (-20,1 dBFS) y menos segundos bajo -26 dBFS (7),
#   y la coda coincide con el cierre reflexivo del reel (S10/S11).
#   La cama se normaliza a -16 LUFS (dos pasadas, como bed-loop.py),
#   mono 48 kHz, fade-in 0,3 s y fade-out final de 1 s.
# - TESIS CON PAD, NO CON SILENCIO: dip-bed.py llevaba la música a
#   silencio total 53,01-57,04 s y el usuario lo sentía como un
#   agujero. Ahora thesis-pad.py sustituye ese tramo por un pad grave
#   tenido (fuente: cama v5 20-24 s, track 108-112 s, LF-ratio 0,66,
#   RMS -17,7 dBFS, el pasaje grave más estable; lowpass 300 Hz;
#   RMS -23,5 dBFS en la cama = ~-20 dB bajo los picos de VO en la
#   mezcla final, según la transferencia MEDIDA cama->mezcla de
#   -6,8 dB; la primera calibración teórica, -17,8 dBFS, midió
#   -14,3 dB y se corrigió), con crossfades
#   de igual potencia de 0,5 s. Salida: music-bed-padded.wav (el
#   nombre «dipped» NO se reutiliza).
# - RAMPA DE CIERRE +3,5 dB (21-nov-2026, decisión del coordinador):
#   la coda descendente (10 s finales -24,4 dBFS, ~5 dB bajo la
#   meseta) se desviaba del arco especificado (leve crecimiento al
#   cierre) y la música se apagaba bajo el clímax (S10/S11 + sting).
#   ramp-bed.py sube la ganancia linealmente en dB de 0 a +3,5 dB
#   entre 57,54 s (fin del crossfade del pad: el pad NO sube con la
#   rampa) y 68,0 s (antes del fade-out final de 1 s), y la mantiene
#   hasta el final. Pendiente 0,33 dB/s: inaudible como escalón.
#   Cadena de la cama: trimmed -> padded (pad) -> ramped (rampa);
#   la mezcla usa music-bed-ramped.wav.
# - REGLA PERMANENTE NUEVA (21-nov-2026): toda cama generada se
#   escanea con Whisper antes de usarla (scripts/audio/scan-bed.py).
# VO (v41, sin tocar), SFX (20, mismos archivos y tiempos), ducking
# (1500 ms / 0,12 / 2), music-volume 0,38 y niveles (-16 LUFS /
# TP -2 dBTP, target -14,5 por el techo de TP) idénticos a V4.1.
set -e
HUB=~/workspace/remotion-hub
PROJ=$HUB/repo/projects/marti-fidel
SFX=$HUB/assets/sfx/sounds
A5=$PROJ/public/audio/v5
A41=$PROJ/public/audio/v41
mkdir -p $A5
cd $HUB/repo
# 1. Normaliza la ventana 88,00-157,23 s de la cama Flow a -16 LUFS
# (medición + ganancia lineal), mono 48 kHz, fade-in 0,3 s y
# fade-out final de 1 s. -map 0:a:0 salta la carátula mjpeg del MP3.
BED_IN=$PROJ/public/audio/flow-documentary-underscore.mp3
BED_TRIM=$A5/music-bed-trimmed.wav
test -f "$BED_IN" || { echo "FALTA LA CAMA: $BED_IN"; exit 1; }
IN_I=$(ffmpeg -v info -ss 88 -t 69.23 -i "$BED_IN" -map 0:a:0 -af "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | python3 -c "import sys,json; s=sys.stdin.read(); js=s[s.index('{',s.index('Parsed_loudnorm')):s.index('}',s.index('Parsed_loudnorm'))+1]; print(json.loads(js)['input_i'])")
GAIN=$(python3 -c "print(-16.0 - float('$IN_I'))")
echo "cama Flow (ventana 88-157,23 s): input ${IN_I} LUFS -> ganancia ${GAIN} dB"
ffmpeg -v error -y -ss 88 -i "$BED_IN" -map 0:a:0 -t 69.23 -ac 1 -ar 48000 \
  -af "volume=${GAIN}dB,afade=t=in:st=0:d=0.3,afade=t=out:st=68.23:d=1.0" "$BED_TRIM"
~/workspace/remotion-hub/.venv/bin/python scripts/audio/thesis-pad.py \
  --in projects/marti-fidel/public/audio/v5/music-bed-trimmed.wav \
  --out projects/marti-fidel/public/audio/v5/music-bed-padded.wav \
  --pad 53.01 57.04 --source 20.0 4.0 --fade 0.5 --lowpass 300 \
  --target-rms-db -23.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/ramp-bed.py \
  --in projects/marti-fidel/public/audio/v5/music-bed-padded.wav \
  --out projects/marti-fidel/public/audio/v5/music-bed-ramped.wav \
  --ramp 57.54 68.0 3.5 --force
~/workspace/remotion-hub/.venv/bin/python scripts/audio/mix.py \
  --voice projects/marti-fidel/public/audio/v41/vo-real-v41.wav \
  --music projects/marti-fidel/public/audio/v5/music-bed-ramped.wav \
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
  --out projects/marti-fidel/public/audio/v5/mix-v5.wav \
  --report projects/marti-fidel/public/audio/v5/mix-v5.json --force
