#!/usr/bin/env bash
# Construye los stems de audio del reel El Libreto — 156,8M (YouTube).
# 1) VO colocada (public/audio/voice-placed.wav): la toma limpia
#    completa (43,73 s; 0,41 s de sala tras «libreto?») + pad de
#    silencio hasta 46,5 s. Fundidos de 5 ms en los bordes (solo tocan
#    tono de sala: la voz está a >=0,53 s de cada borde).
# 2) Cama musical (public/audio/music-bed.wav): la que define
#    research/timeline.json (bed.id, FUENTE ÚNICA), construida con
#    build-bed.sh. NUNCA hardcodear otra cama (incidente V4,
#    23-nov-2026). run-mix.py verifica la identidad del stem con
#    bed_identity (NCC >= 0,99) antes de mezclar.
# 3) SFX con ganancia/recorte (public/audio/sfx-mix/): los 11 de
#    research/timeline.json, TODOS generados desde ahí. El directorio
#    se limpia primero: el paso audio es dueño exclusivo de sfx-mix/.
#    Los clips recortados llevan fundidos de 5 ms en los bordes nuevos
#    (el riser se corta en seco al llegar, pero sin clic).
# La mezcla final (mix.py) va aparte: scripts/run-mix.py.
set -euo pipefail
cd "$(dirname "$0")/.."
HUB_PY="${HUB_PY:-$HOME/workspace/remotion-hub/.venv/bin/python}"
export TMPDIR="${TMPDIR:-$HOME/workspace/.tmp}"
mkdir -p "$TMPDIR" public/audio

echo "== 1) VO colocada =="
ffmpeg -y -v error -i public/audio/real/vo-yt-limpia-clean.wav \
  -af "atrim=0:43.73,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.005,afade=t=out:st=43.725:d=0.005,apad=whole_dur=46.5,atrim=0:46.5" \
  -ac 1 -ar 48000 -c:a pcm_s16le public/audio/voice-placed.wav
echo "   voice-placed.wav OK"

echo "== 2) Cama musical =="
# La cama la define research/timeline.json (bed.id): FUENTE ÚNICA.
# 23-nov-2026: este paso tenía hardcodeado el tono de sala
# amb-room-tone en bucle (la mezcla intermedia no llevaba música).
# La v1 lleva la cama nueva de Flow Music creada para este proyecto;
# build-bed.sh la resuelve del registro y run-mix.py verifica la
# identidad del stem (NCC).
BED_ID=$(python3 -c "import json; print(json.load(open('research/timeline.json'))['bed']['id'])")
bash scripts/build-bed.sh "$BED_ID"
echo "   music-bed.wav OK (cama '$BED_ID')"

echo "== 3) SFX con ganancia/recorte =="
mkdir -p public/audio/sfx-mix
rm -f public/audio/sfx-mix/*.wav
"$HUB_PY" - << 'PYEOF'
import json, subprocess
t = json.load(open("research/timeline.json"))
for s in t["sfx"]:
    if not s.get("underVO"):
        continue
    filt = []
    if "trim_start_s" in s and "trim_dur_s" in s:
        end = s["trim_start_s"] + s["trim_dur_s"]
        filt.append(f"atrim={s['trim_start_s']}:{end}")
        filt.append("asetpts=PTS-STARTPTS")
        # Fundidos de 5 ms en los bordes creados por el recorte.
        filt.append("afade=t=in:st=0:d=0.005")
        filt.append(f"afade=t=out:st={s['trim_dur_s'] - 0.005:.3f}:d=0.005")
    filt.append(f"volume={s['gain_db']}dB")
    subprocess.run(["ffmpeg", "-y", "-v", "error",
                    "-i", f"public/{s['file']}",
                    "-af", ",".join(filt), "-c:a", "pcm_s16le",
                    f"public/audio/sfx-mix/{s['id']}.wav"], check=True)
    print(f"   {s['id']}.wav OK ({s['gain_db']:+d} dB"
          + (f", recorte {s['trim_start_s']}-{end:.3f} s" if "trim_start_s" in s else "")
          + ")")
PYEOF
echo "TODO OK"
