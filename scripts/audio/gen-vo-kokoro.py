#!/usr/bin/env python3
"""Genera la voz en off de PREVISUALIZACIÓN con Kokoro TTS (Fase B, R6).

Kokoro-82M (Apache-2.0, ~330 MB, CPU): mucho más natural que Piper y
con 3 voces españolas. La VO definitiva la sigue grabando el usuario;
Kokoro es la previsualización recomendada a partir de ahora (Piper queda
como respaldo en gen-vo-piper.py).

Voces españolas (lang_code 'e'): em_alex (masculina, defecto),
em_santa (masculina), ef_dora (femenina).

Misma interfaz que gen-vo-piper.py: el guion (fragmentos + pausas) viene
de un JSON y la salida es el WAV concatenado + vo-lines.json con los
tiempos de cada línea (para re-timing de beats y transcribe-vo.py).

Uso:
  .venv/bin/python scripts/audio/gen-vo-kokoro.py --script vo-script.json \\
      --out public/audio/vo-preview.wav [--voice em_alex] [--speed 1.0]
  # vo-script.json: {"fragments": [{"text": "...", "pause_after": 0.2}, ...]}
  # Salida: <out> (24.000 Hz mono, sin normalizar) + <out-dir>/vo-lines.json
  # con los tiempos de cada línea. prep-vo.sh lo pasa a 48 kHz y -14 LUFS.

Notas:
- El modelo vive en ~/workspace/remotion-hub/.hf-cache (HF_HOME fijado
  aquí si no está en el entorno): sobrevive a reemplazos de VM.
- Requiere espeak-ng instalado (apt; .deb cacheado en ../debs/) para la
  fonemización española (misaki), y torch CPU en el venv.
- Velocidad real en esta VM: RTF ≈ 2 con 2 hilos y sin otra
  producción compitiendo (2,07 medido en el módulo podcast, 19-nov-2026;
  con 4 hilos por defecto y 2 workers en paralelo el RTF se degradó a
  8-12 en modern-wisdom-aprende — la caja tiene 1,5 CPU efectivas y
  el paralelismo de workers EMPEORA el tiempo total; ver
  docs/SPEED-2026-11-19.md). Para video largo: UN solo worker,
  --threads 2, capítulos en secuencia (o scripts/audio/vo-batch.py,
  que carga el modelo una sola vez para todos los capítulos).
  La carga del pipeline (~30 s) se paga una vez por ejecución.
- Kokoro ES determinista: regenerar una línea da el mismo audio, así
  que empalmar fragmentos es seguro (a diferencia de Piper).
- Trucos de guion: igual que Piper — "O.F.A.C." con puntos para
  deletrear; pause_after mayor tras el giro (0.45 s) y antes del
  remate (0.65 s); 0.2 s de respiración entre líneas normales.
"""
import argparse
import json
import os
import sys
import wave

# Antes de importar kokoro: modelo dentro del hub (durable) y proxy
# sano para Hugging Face (ver AGENTS.md: NO_PROXY con IPv6 entre
# corchetes rompe httpx).
_HUB = os.path.expanduser("~/workspace/remotion-hub")
os.environ.setdefault("HF_HOME", os.path.join(_HUB, ".hf-cache"))
os.environ.setdefault("NO_PROXY", "localhost,127.0.0.1")
os.environ.setdefault("no_proxy", "localhost,127.0.0.1")
# Hilos de torch ANTES de importar kokoro/torch: sin límite, torch
# usa nproc (4) y en esta caja de 1,5 CPU eso degrada el RTF (ver
# docstring). KOKORO_THREADS permite afinarlo; --threads lo pisa.
os.environ.setdefault("OMP_NUM_THREADS",
                      os.environ.get("KOKORO_THREADS", "2"))
os.environ.setdefault("MKL_NUM_THREADS",
                      os.environ.get("KOKORO_THREADS", "2"))

import numpy as np  # noqa: E402

SAMPLE_RATE = 24000
SPANISH_VOICES = ("em_alex", "em_santa", "ef_dora")


def render_fragments(pipe, fragments, voice, speed, log=None):
    """Sintetiza fragmentos con un pipeline ya cargado.

    Devuelve (audio_float32_24k, lines, total_s). Extraído para que
    vo-batch.py cargue el modelo UNA vez y sintetice todos los
    capítulos en secuencia (15 cargas de ~30 s ahorradas + sin
    contención entre workers: ver docs/SPEED-2026-11-19.md).
    """
    parts: list[np.ndarray] = []
    lines: list[dict] = []
    t = 0.0
    for i, frag in enumerate(fragments):
        text, pause_after = frag["text"], frag.get("pause_after", 0.0)
        chunks = []
        for _, _, audio in pipe(text, voice=voice, speed=speed):
            chunks.append(audio)
        audio = np.concatenate(chunks).astype(np.float32)
        # Recorta silencio inicial/final (umbral bajo).
        nonzero = np.nonzero(np.abs(audio) > 0.005)[0]
        if len(nonzero):
            audio = audio[nonzero[0]:nonzero[-1] + 1]
        dur = len(audio) / SAMPLE_RATE
        lines.append({"index": i, "text": text, "start": round(t, 3),
                      "end": round(t + dur, 3), "duration": round(dur, 3)})
        if log:
            log(f"frag {i:02d} {t:6.2f}-{t + dur:6.2f}s ({dur:5.2f}s) "
                f"{text[:60]}")
        parts.append(audio)
        t += dur
        if pause_after > 0:
            parts.append(np.zeros(int(pause_after * SAMPLE_RATE),
                                  dtype=np.float32))
            t += pause_after
    full = np.concatenate(parts) if parts else np.zeros(0, dtype=np.float32)
    return full, lines, t


def write_wav24(path: str, audio: np.ndarray) -> tuple[float, float]:
    """Escribe WAV 24 kHz mono int16. Devuelve (duración_s, pico)."""
    peak = float(np.abs(audio).max()) if len(audio) else 0.0
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm.tobytes())
    return len(pcm) / SAMPLE_RATE, peak


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--script", required=True,
                   help='JSON {"fragments": [{"text", "pause_after"}]}')
    p.add_argument("--out", required=True, help="WAV de salida")
    p.add_argument("--lines-json",
                   help="JSON de tiempos (por defecto <out-dir>/vo-lines.json)")
    p.add_argument("--voice", default="em_alex",
                   help=f"Voz española {SPANISH_VOICES} (defecto em_alex)")
    p.add_argument("--speed", type=float, default=1.0,
                   help="Velocidad de habla (1.0 = normal; >1 más rápido)")
    p.add_argument("--threads", type=int, default=2,
                   help="Hilos torch (defecto 2; en esta caja de 1,5 CPU, "
                   "más hilos o más workers en paralelo EMPEORA el RTF)")
    p.add_argument("--force", action="store_true")
    a = p.parse_args()
    if a.voice not in SPANISH_VOICES:
        p.error(f"voz española desconocida: {a.voice} (usa {SPANISH_VOICES})")

    with open(a.script, encoding="utf-8") as f:
        fragments = json.load(f)["fragments"]
    if not fragments:
        p.error("sin fragmentos en el guion")
    lines_json = a.lines_json or os.path.join(
        os.path.dirname(os.path.abspath(a.out)), "vo-lines.json")
    if os.path.exists(a.out) and not a.force:
        p.error(f"la salida ya existe: {a.out} (usa --force)")

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)

    from kokoro import KPipeline  # noqa: PLC0415 — tras fijar HF_HOME
    import torch  # noqa: PLC0415
    torch.set_num_threads(max(1, a.threads))
    torch.set_num_interop_threads(max(1, a.threads))
    pipe = KPipeline(lang_code="e")
    full, lines, _t = render_fragments(pipe, fragments, a.voice, a.speed,
                                       log=print)
    total, peak = write_wav24(a.out, full)
    with open(lines_json, "w", encoding="utf-8") as f:
        json.dump({"sample_rate": SAMPLE_RATE, "voice": a.voice,
                   "speed": a.speed, "peak": round(peak, 3),
                   "total_duration": round(total, 3), "lines": lines},
                  f, ensure_ascii=False, indent=2)
    print(f"\nOK {a.out} — duración total {total:.2f} s "
          f"({len(lines)} fragmentos, voz {a.voice}, pico {peak:.2f})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
