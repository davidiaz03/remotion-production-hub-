#!/usr/bin/env python3
"""Genera la voz en off de PREVISUALIZACIÓN con Piper (TTS neuronal local,
100% offline tras descargar el modelo).

Voz: es_MX-ald-medium (masculina, español de México, calidad media).
Modelo: ~/workspace/.piper-voices/es_MX-ald-medium/

NOTA: la primera voz probada, es_MX-claude-high, resultó ser FEMENINA
(F0 mediana 184 Hz, verificada 15-nov-2026). No existe voz masculina
"high" en español en Piper; ald-medium es la mejor masculina
latinoamericana disponible (verificación de F0 tras sintetizar).

¿Por qué Piper y no edge-tts? edge-tts (es-MX-JorgeNeural) era la primera
opción, pero su síntesis usa WebSocket contra speech.platform.bing.com y
desde este entorno el endpoint NO responde de forma utilizable: la lista
de voces (HTTPS GET) funciona, pero el WS de síntesis devuelve de forma
inconsistente timeout de 60 s, HTTP 400, o 101 con el header Connection
mutilado por el proxy de egreso (aiohttp lo rechaza). Verificado 15-nov-2026
con pruebas directas (echo WS genérico SÍ funciona; el problema es
específico de Bing). El script gen-vo.py queda en el repo por si se
ejecuta fuera de este proxy.

Estrategia: se sintetiza línea por línea (11 fragmentos: la línea 9 se
parte en dos para la pausa dramática) y se concatenan con silencios
exactos en los puntos dramáticos. Esto da, además, la duración de cada
línea para el re-timing de los beats.

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/gen-vo-piper.py
Salida: public/audio/vo-preview.wav (22.050 Hz mono, sin normalizar;
prep-vo.sh lo pasa a 48 kHz y -14 LUFS) + public/audio/vo-lines.json
con los tiempos de cada línea.
"""
import json
import os
import subprocess
import wave

import numpy as np

PROJECT = os.path.expanduser(
    "~/workspace/remotion-hub/repo/projects/marabana-v1"
)
MODEL = os.path.expanduser(
    "~/workspace/.piper-voices/es_MX-ald-medium/es_MX-ald-medium.onnx"
)
# length_scale < 1 acelera el habla. ald es ~16% más lento que claude en
# natural, así que 0.88 dejaba la VO en 46,6 s; con 0.75 queda en ~40 s
# (ritmo de reel; verificado: 1.0 -> 4,10 s vs 0,7 -> 3,15 s en la frase
# de cierre). La F0 no cambia con length_scale (solo duraciones).
LENGTH_SCALE = "0.75"
OUT_WAV = os.path.join(PROJECT, "public/audio/vo-preview.wav")
OUT_JSON = os.path.join(PROJECT, "public/audio/vo-lines.json")
TMP_DIR = "/tmp/vo-piper"

# (texto para TTS, silencio DESPUÉS del fragmento en segundos)
# Notas:
# - "O.F.A.C." con puntos: espeak deletrea las iniciales (OFAC se lee
#   letra por letra). Verificado en la transcripción: Whisper oyó "oréfea",
#   es decir, las letras sueltas O-F-A-C.
# - La pausa de 0.45 s tras "Pero a pesar de ello..." y 0.65 s tras
#   "diez kilómetros..." son los dos puntos dramáticos del guion.
# - Entre líneas normales, 0.2 s de respiración (ritmo de reel).
FRAGMENTS = [
    ("¿Sabías que el bloqueo llegó hasta el maratón?", 0.20),
    ("En 2012, la O.F.A.C. canceló el programa que traía corredores de Estados Unidos a Marabana.", 0.20),
    ("Un año antes, veintiuno habían corrido en La Habana.", 0.20),
    ("Pero a pesar de ello…", 0.45),
    # V1.2 — línea nueva de BUCLE ABIERTO (scripts/splice-open-loop.py):
    # se sintetizó SOLO este fragmento y se empalmó; Piper no es
    # determinista entre ejecuciones, así que NO se regenera la VO
    # completa (este FRAGMENTS es documentación del guion final).
    ("Quédate hasta el final. Hay una historia que lo resume todo.", 0.20),
    ("Hoy, catorce años después, casi tres mil corredores tomaron las calles de La Habana en la cuadragésima edición de Marabana.", 0.20),
    ("Y los cinco kilómetros se llamaron Carrera contra el Bloqueo y por la Paz.", 0.20),
    ("Como dijo el corredor Yuraldi Cava: El bloqueo asfixia al pueblo cubano.", 0.20),
    ("En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas.", 0.20),
    ("Y Ernesto Javier Consuegra completó los diez kilómetros…", 0.65),
    ("con un bastón.", 0.25),
    ("Hoy La Habana corrió. Y cada paso fue una denuncia.", 0.0),
]


def synth_line(text: str, out_path: str) -> None:
    """Sintetiza una línea con el CLI de piper."""
    result = subprocess.run(
        [
            os.path.expanduser("~/workspace/remotion-hub/.venv/bin/piper"),
            "--model", MODEL,
            "--output_file", out_path,
            "--sentence-silence", "0.0",
            "--length-scale", LENGTH_SCALE,
        ],
        input=text.encode("utf-8"),
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"piper falló para {text!r}: {result.stderr.decode()}"
        )


def read_wav(path: str) -> tuple[np.ndarray, int]:
    with wave.open(path, "rb") as w:
        n = w.getnframes()
        rate = w.getframerate()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32)
    return data, rate


def main() -> None:
    os.makedirs(TMP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_WAV), exist_ok=True)

    parts: list[np.ndarray] = []
    lines: list[dict] = []
    t = 0.0
    sample_rate = 22050

    for i, (text, pause_after) in enumerate(FRAGMENTS):
        frag_path = os.path.join(TMP_DIR, f"frag-{i:02d}.wav")
        synth_line(text, frag_path)
        audio, sample_rate = read_wav(frag_path)
        # Recorta silencio inicial/final propio de Piper (umbral bajo).
        nonzero = np.nonzero(np.abs(audio) > 100)[0]
        if len(nonzero):
            audio = audio[nonzero[0]:nonzero[-1] + 1]
        dur = len(audio) / sample_rate
        lines.append({
            "index": i,
            "text": text,
            "start": round(t, 3),
            "end": round(t + dur, 3),
            "duration": round(dur, 3),
        })
        print(f"frag {i:02d} {t:6.2f}-{t + dur:6.2f}s ({dur:5.2f}s) {text[:60]}")
        parts.append(audio)
        t += dur
        if pause_after > 0:
            parts.append(np.zeros(int(pause_after * sample_rate), dtype=np.float32))
            t += pause_after

    full = np.concatenate(parts).astype(np.int16)
    with wave.open(OUT_WAV, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(full.tobytes())

    total = len(full) / sample_rate
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump({"sample_rate": sample_rate, "total_duration": round(total, 3),
                   "lines": lines}, f, ensure_ascii=False, indent=2)
    print(f"\nOK {OUT_WAV} — duración total {total:.2f} s ({len(lines)} fragmentos)")


if __name__ == "__main__":
    main()
