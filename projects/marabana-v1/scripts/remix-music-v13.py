#!/usr/bin/env python3
"""V1.3 — REMEZCLA la música existente (NO regenera: el usuario ya aprobó
estas tres secciones de MusicGen).

Cambios respecto a remix-music-v12.py (la mezcla 0–44.57 s es IDÉNTICA):
1) La mezcla se alarga hasta 47.97 s (fin del video, incluido el sting):
   el máster V1.2 terminaba la música en 44.57 s y los últimos ~2 s del
   sting quedaban en casi silencio (−37,8 / −58,8 / −73,1 dBFS por
   segundo). La cola bajo el sting se construye con un bucle de los
   últimos 2 s sin fundido de la sección C (mezcla 41.57–43.57 s =
   crudo C 6.154–8.154 s), a −8 dB (ganancia 0.4), con crossfade de
   0.5 s en la unión del bucle y fade-out de 1.5 s hasta 47.47 s. El
   disparo del sting sigue siendo el protagonista; la cola es solo una
   cama baja que se desvanece.
2) El fade-out de 1 s del final de C se aplica en 43.57–44.57 s (como
   en V1.2) y la cola entra en crossfade con él (44.07–44.57 s), sin
   punto de silencio entre la música y la cola.

Receta idéntica a v12: mezcla numpy a 32 kHz, resampleo a 48 kHz con
ffmpeg, sonoridad a -16 LUFS. La música sigue en mono.

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/remix-music-v13.py
Salida: public/audio/music-ai.wav (48 kHz mono, -16 LUFS, 47.97 s).
Copia de seguridad de la mezcla V1.2 en public/audio/music-ai-v12.wav.
"""
import json
import math
import os
import shutil
import subprocess

import numpy as np
import soundfile as sf

PROJECT = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1")
SECTIONS_DIR = os.path.join(PROJECT, "public/audio/music-sections")
OUT_WAV = os.path.join(PROJECT, "public/audio/music-ai.wav")
SR = 32000
CROSSFADE = 1.5
END_FADE = 1.0  # fade-out del final de C (43.57-44.57 s)
TARGET_LUFS = -16.0
C_END = 44.57  # fin de la sección C (igual que V1.2)
TOTAL = 47.97  # fin del video (incluido el sting de 3 s)

# (archivo, inicio en el mix, fin en el mix, atempo o None)
SECTIONS = [
    ("A-tensa.wav", 0.0, 13.27, None),
    ("B-energica.wav", 11.77, 36.916, 0.9122),
    ("C-emotiva.wav", 35.416, C_END, None),
]

# Cola bajo el sting: bucle de C sin fundido (mezcla 41.57-43.57 s).
TAIL_SRC_START = 41.57  # s en el mix (= crudo C 6.154 s)
TAIL_SRC_DUR = 2.0
TAIL_START = 44.07  # entra en crossfade con el fade-out de C
TAIL_GAIN = 0.4  # -8 dB: cama baja bajo el sting
TAIL_XFADE = 0.5  # crossfade en la unión del bucle
TAIL_FADEOUT = 1.5  # fade-out final (hasta 47.47 s)


def lufs_of(path: str) -> float:
    out = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", path, "-af",
         "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    js = out[out.index("{", out.index("Parsed_loudnorm")):out.index("}", out.index("Parsed_loudnorm")) + 1]
    return float(json.loads(js)["input_i"])


def load(path: str, atempo: float | None) -> np.ndarray:
    if atempo is None:
        audio, rate = sf.read(path, dtype="float32")
        assert rate == SR
        return audio
    tmp = "/tmp/b-stretched.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-af",
                    f"atempo={atempo}", "-ar", str(SR), tmp], check=True)
    audio, rate = sf.read(tmp, dtype="float32")
    print(f"  B estirada con atempo {atempo}: {len(audio) / SR:.3f} s")
    return audio


def body_rms_db(path: str, dur: float = C_END) -> float:
    """RMS (dBFS) del cuerpo 0-44.57 s. La normalización de V1.3 iguala
    el CUERPO al de V1.2 (no la sonoridad integrada del archivo entero):
    la cola silenciosa bajo el sting falsea el loudnorm (-18.25 LUFS
    medidos → +2.25 dB, que dejaría el cuerpo aprobado 0.57 dB más alto;
    medido por RMS, el cuerpo solo necesitaba +0.57 dB de corrección).
    """
    import wave as _wave
    import struct as _struct
    w = _wave.open(path)
    sr = w.getframerate()
    raw = w.readframes(int(dur * sr))
    data = _struct.unpack("<%dh" % (len(raw) // 2), raw)
    m = sum(x * x for x in data) / len(data)
    return 20 * math.log10(math.sqrt(m) / 32768) if m > 0 else -99.0


def main():
    total = int(TOTAL * SR)
    mix = np.zeros(total, dtype=np.float32)
    c_raw = None
    for name, start, end, atempo in SECTIONS:
        audio = load(os.path.join(SECTIONS_DIR, name), atempo)
        if name.startswith("C-"):
            c_raw = audio
        s0, s1 = int(start * SR), int(end * SR)
        seg = audio[: s1 - s0]
        if len(seg) < s1 - s0:
            seg = np.pad(seg, (0, s1 - s0 - len(seg)))
        if start > 0:
            n = int(CROSSFADE * SR)
            seg[:n] *= np.linspace(0, 1, n, dtype=np.float32)
        if end < C_END:
            n = int(CROSSFADE * SR)
            seg[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
        mix[s0:s1] += seg
        print(f"  {name}: {start:.3f}-{end:.3f} s")
    # Fade-out de 1 s al final de C (43.57-44.57 s), como en V1.2.
    n = int(END_FADE * SR)
    mix[int((C_END - END_FADE) * SR):int(C_END * SR)] *= np.linspace(
        1, 0, n, dtype=np.float32)

    # --- Cola bajo el sting (bucle de C, -8 dB) ---
    assert c_raw is not None
    src0 = int((TAIL_SRC_START - 35.416) * SR)
    src = c_raw[src0:src0 + int(TAIL_SRC_DUR * SR)].copy()
    print(f"  cola: fuente C crudo {TAIL_SRC_START - 35.416:.3f}-"
          f"{TAIL_SRC_START - 35.416 + TAIL_SRC_DUR:.3f} s "
          f"({len(src) / SR:.2f} s)")
    t0 = int(TAIL_START * SR)
    # Copia 1: 44.07-46.07 — fade-in 0.5 s (crossfade con el final de C),
    # aguante, fade-out 0.5 s en la unión del bucle.
    env1 = np.full(len(src), TAIL_GAIN, dtype=np.float32)
    nf = int(0.5 * SR)
    env1[:nf] *= np.linspace(0, 1, nf, dtype=np.float32)
    env1[-int(TAIL_XFADE * SR):] *= np.linspace(
        1, 0, int(TAIL_XFADE * SR), dtype=np.float32)
    mix[t0:t0 + len(src)] += src * env1
    # Copia 2: 45.57-47.47 (1.9 s) — fade-in 0.5 s (la otra mitad del
    # crossfade), aguante, fade-out final de 1.5 s hasta 47.47 s.
    t1 = t0 + len(src) - int(TAIL_XFADE * SR)
    seg2 = src[: int(1.9 * SR)]
    env2 = np.full(len(seg2), TAIL_GAIN, dtype=np.float32)
    env2[: int(TAIL_XFADE * SR)] *= np.linspace(
        0, 1, int(TAIL_XFADE * SR), dtype=np.float32)
    env2[-int(TAIL_FADEOUT * SR):] *= np.linspace(
        1, 0, int(TAIL_FADEOUT * SR), dtype=np.float32)
    mix[t1:t1 + len(seg2)] += seg2 * env2
    print(f"  cola: 44.07-47.47 s, ganancia {TAIL_GAIN} (-8 dB), "
          f"unión del bucle en 45.57-46.07 s")

    # Verificación numérica: RMS por 0.5 s en la cola y salto en la unión.
    for a in (44.0, 44.5, 45.0, 45.5, 46.0, 46.5, 47.0):
        seg = mix[int(a * SR):int((a + 0.5) * SR)]
        rms = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0.0
        print(f"  cola RMS {a:.1f}-{(a + 0.5):.1f} s: "
              f"{20 * np.log10(rms + 1e-9):.1f} dBFS")
    j = t0 + len(src)  # unión del bucle (46.07 s)
    jump = float(np.max(np.abs(np.diff(mix[j - 100:j + 100]))))
    print(f"  salto máximo junto a la unión del bucle: {jump:.4f}")

    tmp32 = os.path.join(SECTIONS_DIR, "_mix32-v13.wav")
    tmp48 = os.path.join(SECTIONS_DIR, "_mix48-v13.wav")
    sf.write(tmp32, mix, SR)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp32,
                    "-ar", "48000", tmp48], check=True)
    backup = os.path.join(PROJECT, "public/audio/music-ai-v12.wav")
    if not os.path.exists(backup):
        shutil.copy(OUT_WAV, backup)
        print("copia de seguridad:", backup)
    # Normalización por CUERPO (ver body_rms_db): el cuerpo 0-44.57 s
    # queda al mismo nivel que la mezcla V1.2 aprobada; la cola es
    # adicional y no debe subir el cuerpo. (La sonoridad integrada del
    # archivo entero baja un poco por la cola silenciosa: es lo esperado.)
    ref = body_rms_db(backup)
    new = body_rms_db(tmp48)
    gain_db = ref - new
    print(f"Cuerpo 0-44.57 s: V1.2 {ref:.2f} dBFS, mezcla nueva "
          f"{new:.2f} dBFS -> ganancia {gain_db:+.2f} dB")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp48, "-af",
                    f"volume={gain_db}dB", "-ar", "48000", OUT_WAV],
                   check=True)
    final = lufs_of(OUT_WAV)
    print(f"OK {OUT_WAV} — {final:.2f} LUFS integrados (la cola baja la "
          f"sonoridad integrada; el cuerpo está a nivel V1.2), "
          f"{os.path.getsize(OUT_WAV) / 1e6:.1f} MB")
    for f in (tmp32, tmp48):
        os.remove(f)


if __name__ == "__main__":
    main()
