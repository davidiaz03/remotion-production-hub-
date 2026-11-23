#!/usr/bin/env bash
# Construye los stems de audio del reel El Libreto — Messi P1 (Facebook).
# 1) VO colocada (public/audio/voice-placed.wav): la toma limpia
#    recortada a 25,70 s (0,58 s de sala tras «libreto?») + pad de
#    silencio hasta 30 s. Fundidos de 5 ms en los bordes (solo tocan
#    tono de sala: la voz está a >=0,18 s de cada borde).
# 2) Tono de sala (public/audio/music-bed.wav): amb-room-tone de la
#    biblioteca, convertido a mono 48k. SIN MÚSICA en este reel.
#    Identidad verificada por hash del PCM decodificado contra la
#    biblioteca (la puerta NCC de bed_identity no aplica: no hay cama
#    musical que confundir; run-mix.py re-verifica antes de mezclar).
# 3) SFX con ganancia/recorte (public/audio/sfx-mix/): los 6 de
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
LIB_SFX="$HOME/workspace/remotion-hub/assets/sfx"

echo "== 1) VO colocada =="
ffmpeg -y -v error -i public/audio/real/vo-fb-limpia-clean.wav \
  -af "atrim=0:25.7,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.005,afade=t=out:st=25.695:d=0.005,apad=whole_dur=30,atrim=0:30" \
  -ac 1 -ar 48000 -c:a pcm_s16le public/audio/voice-placed.wav
echo "   voice-placed.wav OK"

echo "== 2) Tono de sala =="
ffmpeg -y -v error -i public/audio/amb-room-tone.wav \
  -ac 1 -ar 48000 -c:a pcm_s16le public/audio/music-bed.wav
# Identidad: el hash del PCM decodificado (mono 48k) del stem debe ser
# el del archivo de biblioteca (inmune a diferencias de cabecera WAV).
stem_hash=$(ffmpeg -v error -i public/audio/music-bed.wav -ac 1 -ar 48000 -f hash -hash sha256 - | cut -d= -f2)
lib_hash=$(ffmpeg -v error -i "$LIB_SFX/sounds-extra/ambience/amb-room-tone.wav" -ac 1 -ar 48000 -f hash -hash sha256 - | cut -d= -f2)
if [ "$stem_hash" != "$lib_hash" ]; then
  echo "ERROR: music-bed.wav NO es amb-room-tone de la biblioteca" >&2
  echo "  stem: $stem_hash" >&2
  echo "  lib:  $lib_hash" >&2
  exit 1
fi
echo "   music-bed.wav OK (amb-room-tone verificado)"

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
