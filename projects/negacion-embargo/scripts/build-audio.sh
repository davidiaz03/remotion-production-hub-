#!/usr/bin/env bash
# Construye los stems de audio del reel «Dicen que no hay bloqueo».
# 1) VO colocada (public/audio/voice-placed.wav): las 8 líneas con
#    recorte de sala + adelay según research/timeline.json.
# 2) Segmentos del panel normalizados (public/video/panel-t*.mp4):
#    loudnorm two-pass I=-16 TP=-2 (la voz del panel debe sonar al
#    nivel de la VO en la mezcla final, ~-15,5 LUFS efectivos).
#    Video re-codificado (crf 18) para cortes exactos al fotograma.
# 3) Still de freeze de T3 (public/img/waltz-27oct-freeze.jpg).
# 4) Cama bucleada con dips horneados (public/audio/music-bed.wav).
# 5) Copias de SFX con el uvo aplicado (public/audio/sfx-mix/).
# La mezcla final (mix.py) va aparte: scripts/run-mix.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
HUB_PY="${HUB_PY:-$HOME/workspace/remotion-hub/.venv/bin/python}"
export TMPDIR="${TMPDIR:-$HOME/workspace/.tmp}"
mkdir -p "$TMPDIR" public/audio public/video public/img

echo "== 1) VO colocada =="
ffmpeg -y -v error \
  -i public/audio/real/lines/L1.wav -i public/audio/real/lines/L2.wav \
  -i public/audio/real/lines/L3.wav -i public/audio/real/lines/L4.wav \
  -i public/audio/real/lines/L5.wav -i public/audio/real/lines/L6.wav \
  -i public/audio/real/lines/L7.wav -i public/audio/real/lines/L8.wav \
  -filter_complex "\
[0:a]atrim=0.95:6.32,asetpts=PTS-STARTPTS,aresample=48000,adelay=350:all=1[l1];\
[1:a]atrim=0:2.90,asetpts=PTS-STARTPTS,aresample=48000,adelay=23600:all=1[l2];\
[2:a]atrim=0.95:3.28,asetpts=PTS-STARTPTS,aresample=48000,adelay=26350:all=1[l3];\
[3:a]atrim=0.75:10.08,asetpts=PTS-STARTPTS,aresample=48000,adelay=28850:all=1[l4];\
[4:a]atrim=0.63:9.76,asetpts=PTS-STARTPTS,aresample=48000,adelay=40350:all=1[l5];\
[5:a]atrim=1.17:10.96,asetpts=PTS-STARTPTS,aresample=48000,adelay=50850:all=1[l6];\
[6:a]atrim=1.21:7.72,asetpts=PTS-STARTPTS,aresample=48000,adelay=61350:all=1[l7];\
[7:a]atrim=0.51:5.64,asetpts=PTS-STARTPTS,aresample=48000,adelay=68350:all=1[l8];\
[l1][l2][l3][l4][l5][l6][l7][l8]amix=inputs=8:duration=longest:normalize=0,aresample=48000,apad=whole_dur=77.5,atrim=0:77.5[a]" \
  -map "[a]" -c:a pcm_s16le public/audio/voice-placed.wav
echo "   voice-placed.wav OK"

echo "== 2) Segmentos del panel (loudnorm two-pass, I=-16 TP=-2) =="
norm_segment() { # $1=in $2=start $3=dur $4=out
  local meas
  # El JSON de loudnorm sale por stderr a nivel info (-v error lo suprime).
  meas=$(ffmpeg -hide_banner -ss "$2" -i "$1" -t "$3" -vn \
    -af "loudnorm=I=-16:TP=-2:LRA=11:print_format=json" -f null - 2>&1 \
    | python3 -c "
import json, re, sys
txt = sys.stdin.read()
m = re.search(r'\{[^{}]*\"input_i\"[^{}]*\}', txt)
d = json.loads(m.group(0))
print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true\")")
  ffmpeg -y -v error -ss "$2" -i "$1" -t "$3" \
    -af "loudnorm=I=-16:TP=-2:LRA=11:$meas" \
    -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart "$4"
  echo "   $4 OK"
}
norm_segment public/video/rubio-bloqueo-petrolero.mp4 5.9 4.0 public/video/panel-t1.mp4
norm_segment public/video/waltz-7jul-its-fake.mp4 10.9 5.6 public/video/panel-t2.mp4
norm_segment public/video/waltz-27oct-no-blockade-soundbite33.mp4 0.3 2.5 public/video/panel-t3.mp4

echo "== 3) Still de freeze T3 (2,7 s del soundbite) =="
ffmpeg -y -v error -ss 2.7 -i public/video/waltz-27oct-no-blockade-soundbite33.mp4 \
  -frames:v 1 -q:v 2 public/img/waltz-27oct-freeze.jpg
echo "   waltz-27oct-freeze.jpg OK"

echo "== 4) Cama: bucle + dips horneados =="
"$HUB_PY" ../../scripts/audio/bed-loop.py --bed documentary-flow-a \
  --seconds 77.5 --xfade 3.0 --target-lufs -19.74 --force \
  --out public/audio/music-bed-loop.wav
"$HUB_PY" - << 'PYEOF'
# Aplica los dips de timeline.json al stem bucleado con rampas de
# coseno alzado (sin clics): panel -6 dB (5,7-23,5 s), giro -12 dB
# (23,5-28,7 s). El giro NO llega a silencio digital: el check (g)
# de la auditoría falla con >=0,3 s bajo -45 dB.
import wave
import numpy as np

SR = 48000
with wave.open("public/audio/music-bed-loop.wav", "rb") as w:
    assert w.getframerate() == SR and w.getnchannels() == 1, "stem debe ser mono 48k"
    n = w.getnframes()
    a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64)

# Transiciones (centro, duración, ganancia antes -> después).
TRANS = [
    (5.7, 0.3, 1.0, 10 ** (-6 / 20)),    # entrada al panel
    (23.5, 0.3, 10 ** (-6 / 20), 10 ** (-12 / 20)),  # panel -> giro
    (28.7, 0.5, 10 ** (-12 / 20), 1.0),  # giro -> documento (subida)
]
t = np.arange(n) / SR
gain = np.ones(n)
# Nivel por tramo (antes de suavizar): 1.0 | 0.5012 | 0.2512 | 1.0
gain[(t >= 5.7) & (t < 23.5)] = 10 ** (-6 / 20)
gain[(t >= 23.5) & (t < 28.7)] = 10 ** (-12 / 20)
for c, d, g0, g1 in TRANS:
    m = (t >= c - d / 2) & (t <= c + d / 2)
    x = (t[m] - (c - d / 2)) / d  # 0..1
    gain[m] = g0 + (g1 - g0) * 0.5 * (1 - np.cos(np.pi * x))

out = np.clip(a * gain, -32768, 32767).astype(np.int16)
with wave.open("public/audio/music-bed.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(out.tobytes())
print(f"   music-bed.wav OK ({n / SR:.1f} s, dips aplicados)")
PYEOF
echo "== 5) SFX con uvo (bajo VO) =="
mkdir -p public/audio/sfx-mix
gain_sfx() { # $1=cat $2=id $3=db
  ffmpeg -y -v error -i "public/audio/sfx/$1/$2.wav" \
    -af "volume=${3}dB" -c:a pcm_s16le "public/audio/sfx-mix/$2.wav"
}
gain_sfx cinematic-hits cinematic-drum-big -8
gain_sfx whooshes whoosh-medium-hard -4
gain_sfx impacts impact-medium-hard -3
gain_sfx impacts impact-heavy-hard -4
gain_sfx pops pop-medium-in -2
gain_sfx bounce-spin-zoom move-zoom-in -3
gain_sfx whooshes whoosh-medium-soft -2
gain_sfx impacts impact-light-soft -2
gain_sfx interface click-hover-medium -1
gain_sfx swishes-and-zips swish-hard -4
gain_sfx booms-and-bass bass-808-short -8
gain_sfx cinematic-hits cinematic-slam-big -8
gain_sfx writing-and-drawing writing-marker-draw -1
# El obturador usa la vía uvo por NIVEL (-6 dB: cae en el silencio del
# freeze), no por ducking; los risers van a ganancia 1 (pico -18,1 dB,
# ya bajo la mitad de la VO) y usan el original.
gain_sfx mechanical mechanical-shutter-light -6
echo "   12 SFX con uvo en public/audio/sfx-mix/"
echo "TODO OK"
