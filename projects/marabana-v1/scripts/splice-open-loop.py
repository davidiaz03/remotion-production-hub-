#!/usr/bin/env python3
"""V1.2 — inserta la línea de BUCLE ABIERTO en la VO (open loop).

Línea nueva (después del giro, antes del mecanismo):
  «Quédate hasta el final. Hay una historia que lo resume todo.»
No revela a Ernesto: promete una historia al final del reel.

Procedimiento (igual que la línea 5 en V1.1 — Piper NO es determinista
entre ejecuciones, así que NO se regenera la VO completa: solo se
sintetiza el fragmento nuevo y se empalma):
  1. Sintetiza el fragmento con Piper (es_MX-ald-medium, length_scale
     0.75, igual que el resto de la VO).
  2. Recorta el silencio propio de Piper y lo pasa a 48 kHz estéreo.
  3. Iguala su nivel por RMS al de las líneas vecinas (L4+L5).
  4. Lo empalma en vo-preview.wav en 13.224 s (donde empezaba L5),
     con 0,2 s de respiración después (antes de L5). La pausa dramática
     de 0,45 s tras «Pero a pesar de ello…» se conserva intacta.
  5. Actualiza vo-lines.json: la línea nueva es el índice 4; las
     siguientes se desplazan +D y reindexan.

Salida: public/audio/vo-preview.wav + vo-lines.json actualizados.
Imprime D (el desplazamiento) y los nuevos tiempos de cada línea.
"""
import json
import os
import subprocess
import wave

import numpy as np

PROJECT = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1")
MODEL = os.path.expanduser("~/workspace/.piper-voices/es_MX-ald-medium/es_MX-ald-medium.onnx")
PIPER = os.path.expanduser("~/workspace/remotion-hub/.venv/bin/piper")
VO = os.path.join(PROJECT, "public/audio/vo-preview.wav")
LINES_JSON = os.path.join(PROJECT, "public/audio/vo-lines.json")
TMP = "/tmp/vo-v12"

NEW_TEXT = "Quédate hasta el final. Hay una historia que lo resume todo."
NEW_TEXT_TTS = NEW_TEXT  # sin siglas ni números: se sintetiza tal cual
INSERT_AT = 13.224       # donde empezaba L5 (tras la pausa de 0,45 s de L4)
PAUSE_AFTER = 0.20       # respiración entre la línea nueva y L5
SR = 48000


def read_wav_stereo(path):
    with wave.open(path, "rb") as w:
        n, rate, ch = w.getnframes(), w.getframerate(), w.getnchannels()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)
    if ch == 2:
        data = data.reshape(-1, 2)
    else:
        data = data.reshape(-1, 1)
    return data, rate


def write_wav_stereo(path, data, rate):
    pcm = np.clip(data, -32768, 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(pcm.shape[1])
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())


def rms(x):
    return float(np.sqrt(np.mean(x.astype(np.float64) ** 2)))


def main():
    os.makedirs(TMP, exist_ok=True)
    raw = os.path.join(TMP, "frag-openloop-raw.wav")
    print("sintetizando con Piper:", NEW_TEXT)
    r = subprocess.run(
        [PIPER, "--model", MODEL, "--output_file", raw,
         "--sentence-silence", "0.0", "--length-scale", "0.75"],
        input=NEW_TEXT_TTS.encode("utf-8"), capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f"piper falló: {r.stderr.decode()}")
    frag, rate = read_wav_stereo(raw)
    frag = frag[:, 0]  # mono
    # Recorta silencio inicial/final propio de Piper (mismo umbral que gen-vo-piper.py)
    nz = np.nonzero(np.abs(frag) > 100)[0]
    frag = frag[nz[0]:nz[-1] + 1]
    print(f"fragmento crudo: {len(frag) / rate:.3f} s a {rate} Hz")

    # Resample a 48 kHz con ffmpeg (misma calidad que prep-vo.sh)
    tmp_trim = os.path.join(TMP, "frag-openloop-trim.wav")
    write_wav_stereo(tmp_trim, frag.reshape(-1, 1), rate)
    tmp48 = os.path.join(TMP, "frag-openloop-48k.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp_trim,
                    "-ar", "48000", "-ac", "1", tmp48], check=True)
    frag48, _ = read_wav_stereo(tmp48)
    frag48 = frag48[:, 0]
    dur = len(frag48) / SR
    print(f"fragmento a 48 kHz: {dur:.3f} s")

    # Carga la VO actual y mide el RMS de las líneas vecinas (L4+L5)
    vo, _ = read_wav_stereo(VO)
    with open(LINES_JSON, encoding="utf-8") as f:
        meta = json.load(f)
    lines = meta["lines"]
    l4, l5 = lines[3], lines[4]
    assert abs(l5["start"] - INSERT_AT) < 0.001, "L5 ya no empieza en 13.224"
    n0 = int(l4["start"] * SR)
    n1 = int(l5["end"] * SR)
    ref_rms = rms(vo[n0:n1, 0])
    frag_rms = rms(frag48)
    gain_db = 20 * np.log10(ref_rms / frag_rms)
    print(f"RMS vecinos: {ref_rms:.1f} | RMS fragmento: {frag_rms:.1f} "
          f"-> ganancia {gain_db:+.2f} dB")
    frag48 = frag48 * (ref_rms / frag_rms)

    # Empalma: VO[0:INSERT_AT] + fragmento + 0,2 s silencio + VO[INSERT_AT:]
    frag_st = np.stack([frag48, frag48], axis=1)
    pause = np.zeros((int(PAUSE_AFTER * SR), 2), dtype=np.float32)
    cut = int(INSERT_AT * SR)
    new_vo = np.concatenate([vo[:cut], frag_st, pause, vo[cut:]], axis=0)
    d = dur + PAUSE_AFTER
    total = len(new_vo) / SR
    print(f"D = {d:.3f} s (línea {dur:.3f} + pausa {PAUSE_AFTER}) | "
          f"nueva duración total VO: {total:.3f} s")

    # Guarda copia de seguridad de la VO de V1.1 y escribe la nueva
    backup = os.path.join(PROJECT, "public/audio/vo-preview-v11.wav")
    if not os.path.exists(backup):
        import shutil
        shutil.copy(VO, backup)
        print("copia de seguridad:", backup)
    write_wav_stereo(VO, new_vo, SR)

    # Actualiza vo-lines.json
    new_lines = []
    for i, ln in enumerate(lines):
        if i < 4:
            new_lines.append(ln)
        elif i == 4:
            new_lines.append({"index": 4, "text": NEW_TEXT,
                              "start": round(INSERT_AT, 3),
                              "end": round(INSERT_AT + dur, 3),
                              "duration": round(dur, 3)})
            new_lines.append({"index": 5, "text": ln["text"],
                              "start": round(ln["start"] + d, 3),
                              "end": round(ln["end"] + d, 3),
                              "duration": ln["duration"]})
        else:
            new_lines.append({"index": i + 1, "text": ln["text"],
                              "start": round(ln["start"] + d, 3),
                              "end": round(ln["end"] + d, 3),
                              "duration": ln["duration"]})
    meta["lines"] = new_lines
    meta["total_duration"] = round(total, 3)
    with open(LINES_JSON, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    print("\nNuevos tiempos:")
    for ln in new_lines:
        print(f"  [{ln['index']:02d}] {ln['start']:6.3f}-{ln['end']:6.3f}  "
              f"{ln['text'][:55]}")
    print(f"\nD_FRAMES = {round(d * 30)} (a 30 fps)")


if __name__ == "__main__":
    main()
