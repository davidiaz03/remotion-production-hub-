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
# afade 5 ms en cada borde de línea (auditoría v3 FAIL (c) §2: 3
# discontinuidades de empalme — el atrim cortaba el tono de sala sin
# fundido; el salto L8 fin era 10,8x el baseline). El fundido solo
# toca tono de sala: la voz está a >=0,15 s de cada borde.
ffmpeg -y -v error \
  -i public/audio/real/lines/L1.wav -i public/audio/real/lines/L2.wav \
  -i public/audio/real/lines/L3.wav -i public/audio/real/lines/L4.wav \
  -i public/audio/real/lines/L5.wav -i public/audio/real/lines/L6.wav \
  -i public/audio/real/lines/L7.wav -i public/audio/real/lines/L8.wav \
  -filter_complex "\
[0:a]atrim=0.95:6.32,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=5.365:d=0.005,adelay=350:all=1[l1];\
[1:a]atrim=0:2.90,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=2.895:d=0.005,adelay=23600:all=1[l2];\
[2:a]atrim=0.95:3.28,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=2.325:d=0.005,adelay=26350:all=1[l3];\
[3:a]atrim=0.75:10.08,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=9.325:d=0.005,adelay=28850:all=1[l4];\
[4:a]atrim=0.63:9.76,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=9.125:d=0.005,adelay=40350:all=1[l5];\
[5:a]atrim=1.17:10.96,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=9.785:d=0.005,adelay=50850:all=1[l6];\
[6:a]atrim=1.21:7.72,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=6.505:d=0.005,adelay=61350:all=1[l7];\
[7:a]atrim=0.51:5.64,asetpts=PTS-STARTPTS,aresample=48000,afade=t=in:st=0:d=0.005,afade=t=out:st=5.125:d=0.005,adelay=68350:all=1[l8];\
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
# La cama la define research/timeline.json (bed.id): FUENTE ÚNICA.
# 23-nov-2026: este paso tenía hardcodeado --bed documentary-flow-a
# (la cama temporal) y un duplicado del código de dips con solo 3
# transiciones; el V4 salió con la cama vieja y sin los micro-drops
# de v3 aunque timeline.json pedía memorial-cama-documental. Se
# delega en build-bed.sh: buclea a nivel nativo del registro y
# aplica TODOS los dips de timeline.json (apply-bed-dips.py). No
# volver a hardcodear una cama ni a duplicar los dips aquí.
BED_ID=$(python3 -c "import json; print(json.load(open('research/timeline.json'))['bed']['id'])")
bash scripts/build-bed.sh "$BED_ID"
echo "== 5) SFX con uvo (bajo VO) =="
# Los SFX bajo VO llevan su ganancia en research/timeline.json (uvo_db,
# tabla SFX_SYNC de scripts/build-timeline.py): se generan TODOS desde
# ahí. La lista fija anterior tenía 14 de 29 y los otros 15 solo
# existían por copias a mano — un --force del orquestador (P0-1) los
# borró y la mezcla falló. El directorio se limpia primero: el paso
# audio es dueño exclusivo de sfx-mix/ (si un SFX sale de la
# timeline, su copia no debe quedar).
# El obturador usa la vía uvo por NIVEL (-6 dB: cae en el silencio del
# freeze), no por ducking; los risers NO underVO van a ganancia 1
# (pico -18,1 dB, ya bajo la mitad de la VO) y usan el original.
mkdir -p public/audio/sfx-mix
rm -f public/audio/sfx-mix/*.wav
"$HUB_PY" - << 'PYEOF'
import json, subprocess
t = json.load(open("research/timeline.json"))
seen = {}
for s in t["sfx"]:
    if s.get("underVO"):
        seen[s["id"]] = (s["file"], s["uvo_db"])
for sid, (f, db) in sorted(seen.items()):
    subprocess.run(["ffmpeg", "-y", "-v", "error",
                    "-i", f"public/{f}",
                    "-af", f"volume={db}dB", "-c:a", "pcm_s16le",
                    f"public/audio/sfx-mix/{sid}.wav"], check=True)
print(f"   {len(seen)} SFX con uvo en public/audio/sfx-mix/")
PYEOF
echo "TODO OK"
