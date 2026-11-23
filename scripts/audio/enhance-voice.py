#!/usr/bin/env python3
"""Mejora profesional de voz grabada con celular (`enhance-voice.py`).

El usuario graba la VO de su marca personal con el CELULAR y necesita
que suene como grabada con micrófono profesional. Este módulo aplica
una cadena de procesado de voz broadcast (todo local, ffmpeg +
numpy, sin nube ni coste por uso) y deja la VO lista para `mix.py`
(objetivo: -18 LUFS / TP -2, el mismo `voice_lufs` de `mix.py`).

Uso:

    ~/workspace/remotion-hub/.venv/bin/python scripts/audio/enhance-voice.py \\
        --in vo-celular.m4a --out vo-limpia.wav [--preset phone|clean|pro] \\
        [--compare] [--report informe.json] [--force]

    # Solo ver qué haría, sin escribir nada:
    ... --dry-run

    # Comparación A/B (antes/después a la misma sonoridad):
    ... --compare   # escribe <out-stem>-ab.wav

Cadena (preset `phone`, orden pensado para voz de celular en
entorno doméstico):

    1. aresample 48 kHz + mono (la VO del hub es mono 48 kHz)
    2. highpass 80 Hz — ruido de manejo, vibraciones, graves de la
       habitación que el micrófono del celular no reproduce bien
    3. afftdn (nr=12, nf=-55) — reducción espectral de ruido de fondo
    4. compand (expansor descendente suave) — empuja hacia abajo el
       tono de sala y las colas de reverberación en las pausas SIN
       tocar la voz (por encima de -40 dB es 1:1). Es el control de
       reverberación que ffmpeg puede hacer sin artefactos: no
       elimina el eco dentro de la palabra, solo limpia las pausas
    5. EQ: corte de barro -2 dB @ 250 Hz, presencia +3 dB @ 3,5 kHz,
       aire +1,5 dB @ 10 kHz (shelf) — el micrófono del celular es
       pobre en graves y apagado en agudos; esto devuelve cuerpo y
       claridad sin sonar procesado
    6. acompressor 3:1 (thr -20 dB, att 8 ms, rel 200 ms, knee 6 dB,
       makeup +4 dB) — volumen irregular de grabar a mano alzada
    7. deesser (i=0.5, f=0.7) — las sibilancias que el EQ de presencia
       realza; después del compresor, que también las sube
    8. alimiter 0.95 con level=false — techo real (misma lección que
       en audit-audio.py: con level=true el limitador aplica ganancia
       de maquillaje y NO limita)
    9. loudnorm en DOS PASES (lineal) a -18 LUFS / TP -2 / LRA 9 —
       el pase único de loudnorm es DINÁMICO y deshace la dinámica
       que el compresor acaba de fijar (lección de mix.py). Si el
       lineal no puede alcanzar el objetivo (factor de cresta alto:
       la ganancia choca con el techo de TP), run_chain repite con
       loudnorm dinámico de un pase para llegar al objetivo
       (23-nov-2026: la salida de DF tiene cresta ~19 dB y el
       lineal la dejaba en −19,8 LUFS).

Preset `clean` (audio ya bueno, solo pulir): sin denoise, sin
expansor ni compresor; highpass 70 Hz, presencia ligera (+1,5 dB
@ 3,5 kHz), deesser ligero, limitador y loudnorm.

Preset `pro` (23-nov-2026, aprobado por el usuario de oído):
DeepFilterNet (binario `deep-filter` 0.5.6, modelo DeepFilterNet3
embebido) ANTES de la cadena ffmpeg. Es la receta de la muestra
A/B aprobada: DF quita el tono de sala y la reverberación que
delatan «celular en un cuarto» (ruido en huecos −10 dB medido en
la VO de Messi YT, voz intacta, pausas intactas) y la cadena
pulida pone el color: highpass 80 Hz, afftdn nr=12, EQ (−2 dB @
250 Hz, +3 dB @ 3,5 kHz, aire +1,5 dB @ 10 kHz), compresor
ligero 2:1 (thr −20 dB, makeup +2 dB), deesser, limitador y
loudnorm dos pases a −18 LUFS. SIN expansor: el compand del
preset phone recortó pausas en la VO de Messi FB (2 FAIL) y DF
ya limpia las pausas mejor que él. El binario se busca en
`--deepfilter-bin`, `DEEPFILTER_BIN`, `~/workspace/.voice-env/bin/
deep-filter` o el PATH; sin él, el preset `pro` falla con
instrucciones de instalación (no cae a `phone` en silencio: el
usuario pidió el sonido DF y un fallback silencioso lo traicionaría).
DF recorta ~30 ms de cola: la salida se rellena con silencio
hasta la duración exacta de la entrada (la cadena NUNCA recorta).
La verificación de pausas del preset `pro` es por envolventes RMS
relativas (check_pauses_envelope), no por VAD: DF cambia la SNR
tanto que el VAD desplaza los bordes ~0,1 s y da FAIL espurios
(la versión aprobada por el usuario fallaba 4-5 pausas con el
VAD; con envolventes, 30/30 huecos en su sitio). Ambas
verificaciones toleran 0,02 s de desplazamiento de borde
(resolución de la medida en ventanas de 10 ms).

REGLAS DURAS (heredadas del repo):
  - NUNCA se recorta nada: ningún silenceremove, trim ni fade. La
    cadena es muestra a muestra y preserva la duración exacta y las
    pausas naturales. El informe verifica la regla del 18-nov-2026:
    ninguna pausa intra-línea < 0,25 s ni perder > 50% (check con
    VAD por energía + periodicidad, la misma regla `voiced_span`
    de audit-audio.py: sin el criterio de periodicidad el loudnorm
    sube el tono de sala y falsea la medida).
  - Salida: WAV mono 48 kHz s16le, lista para mix.py.

Herramientas evaluadas (22-nov-2026) y por qué la cadena es ffmpeg:
  - afftdn: sin modelo, determinista, transparente con nr<=12.
    Elegido como denoiser por defecto.
  - arnndn (RNNoise): necesita un modelo .rnnn externo (esta build
    de ffmpeg no trae modelo embebido); suena bien con ruido
    estacionario pero puede dejar la voz «acuosa». Opcional con
    --denoiser arnndn --rnnoise-model <modelo.rnnn>.
  - DeepFilterNet: el mejor denoise/dereverb local. La ruta pip
    NO funciona en esta VM (deepfilterlib no tiene wheel para
    Python 3.12, solo cp38–cp311; compilarlo pide toolchain Rust),
    pero el binario estático oficial `deep-filter` 0.5.6 (musl,
    GitHub releases de Rikorose/DeepFilterNet) SÍ funciona:
    modelo DeepFilterNet3 embebido, offline, RTF 0,22. Instalado
    23-nov-2026 en `~/workspace/.voice-env/bin/deep-filter` y
    cableado como preset `pro` (ver arriba). La nota del 22-nov
    («no instalable») quedó corregida.
  - pedalboard / noisereduce / pyloudnorm: no instalados; no añaden
    nada que ffmpeg no haga ya para esta cadena.
  - speechnorm: normalizador de voz de ffmpeg; menos predecible que
    acompressor para nivelar volumen irregular. No usado.

Limitaciones honestas (lo que NO puede arreglar):
  - Eco fuerte de habitación vacía dentro de la palabra (la cola
    que se oye MIENTRAS se habla). El expansor solo limpia pausas;
    DeepFilterNet (preset `pro`) lo reduce mucho, pero no lo
    elimina del todo. La solución real sigue siendo grabar en un
    cuarto con cortinas/ropa cerca, no en un baño o cocina vacía.
  - Ruido que tapa la voz (TV alta, calle, ventilador pegado):
    afftdn lo baja, pero si la SNR de entrada es < ~5 dB la voz
    sale con artefactos («burbujeo» espectral).
  - Distorsión por saturación (grabar demasiado cerca o gritando):
    el recorte es irreversible.
  - Respiraciones fuertes y ruidos de boca: se atenúan algo con el
    expansor, no desaparecen.
  - Mala dicción, ritmo o entonación: eso es interpretación, no
    procesado.

Salida: WAV + informe JSON (por defecto <out>.json) con medidas
antes/después (LUFS, TP, LRA, SNR estimada, suelo de ruido),
verificación de pausas y veredicto.
Código: 0 = PASS, 1 = FAIL (pausas o sonoridad fuera de tolerancia),
2 = error.
"""

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

import numpy as np

try:
    import soundfile as sf
except ImportError:  # pragma: no cover - el venv del hub la trae
    sf = None

# Objetivo de sonoridad de la VO: el mismo que mix.py aplica a la voz
# (DEFAULT_VOICE_LUFS). La mezcla final la lleva a -14,5 LUFS.
DEFAULT_TARGET_LUFS = -18.0
DEFAULT_TARGET_TP = -2.0
DEFAULT_TARGET_LRA = 9.0
DEFAULT_SR = 48000

# Tolerancias del veredicto.
LUFS_TOLERANCE = 1.0
TP_TOLERANCE = 0.3
DURATION_TOLERANCE_S = 0.01

# Regla de pausas (18-nov-2026): ninguna pausa natural intra-línea
# puede quedar < 0,25 s ni perder > 50%.
PAUSE_MIN_S = 0.25
PAUSE_MAX_LOSS = 0.50
# Tolerancia de medida de la regla: la duración de una pausa se mide
# en ventanas de 10 ms y cada borde puede moverse una ventana por el
# cambio de perfil energético del procesado (DF desplaza el cruce de
# umbral ~10-20 ms sin recortar nada: VO de Messi FB 23-nov-2026,
# 0,26 → 0,24 s). Un recorte real (el expansor comiéndose 100 ms o
# más, o una pausa que desaparece) supera con mucho esta tolerancia.
PAUSE_MEASURE_TOL_S = 0.02

# VAD por energía para el check de pausas y la SNR estimada:
# ventana de 10 ms; voz si RMS > -40 dBFS (misma regla que
# voiced_span en audit-audio.py, sin el criterio de armonicidad
# porque aquí no hay Whisper de por medio).
VAD_WINDOW_S = 0.01
VAD_THRESHOLD_DBFS = -40.0
VAD_MERGE_GAP_S = 0.15   # une cierres de plosivas dentro de palabra
VAD_MIN_SEGMENT_S = 0.08  # descarta respiros y clics aislados

PRESETS = ("phone", "clean", "pro")
DENOISERS = ("afftdn", "arnndn", "off")

# Binario DeepFilterNet (preset `pro`): ruta instalada 23-nov-2026.
# La ruta pip no existe en esta VM (sin wheel de deepfilterlib para
# Python 3.12); el binario estático oficial es la única vía.
DEEPFILTER_BIN_DEFAULT = os.path.expanduser(
    "~/workspace/.voice-env/bin/deep-filter")
DEEPFILTER_BIN_ENV = "DEEPFILTER_BIN"
DEEPFILTER_INSTALL_HINT = (
    "descarga deep-filter 0.5.6 (musl x86_64) de github.com/"
    "Rikorose/DeepFilterNet/releases a ~/workspace/.voice-env/bin/ "
    "o define DEEPFILTER_BIN con su ruta")


# ----------------------------- utilidades ffmpeg -----------------------------

def run(cmd, timeout=600):
    """Ejecuta ffmpeg/ffprobe; RuntimeError con la cola de stderr."""
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if p.returncode != 0:
        tail = (p.stderr or "").strip().splitlines()[-5:]
        raise RuntimeError(
            f"falló {' '.join(cmd[:3])}...: " + " | ".join(tail))
    return p


def probe(path):
    """(sample_rate, channels, duration_s) con ffprobe."""
    p = run(["ffprobe", "-hide_banner", "-v", "error",
             "-show_entries", "stream=sample_rate,channels",
             "-show_entries", "format=duration",
             "-of", "json", path])
    d = json.loads(p.stdout)
    st = d["streams"][0]
    return (int(st["sample_rate"]), int(st["channels"]),
            float(d["format"]["duration"]))


def ebur128(path):
    """(I LUFS, TP dBTP, LRA LU) medidos con ebur128.

    En silencio digital ffmpeg imprime Peak -inf: se devuelve
    float('-inf') (misma convención que mix.py).
    """
    out = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path,
               "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    summary = out[out.rfind("Summary:"):]

    def val(key):
        m = re.search(key + r"\s*:\s*(-inf|[-+]?[\d.]+)", summary)
        if not m:
            raise RuntimeError(f"ebur128: no se encontró {key} en {path}")
        return float(m.group(1))

    return val("I"), val("Peak"), val("LRA")


def loudnorm_measure(chain, path, target_lufs, target_tp, target_lra):
    """Pase de medida del loudnorm: devuelve el dict Parsed_loudnorm.

    Necesita -v info (con -v error no se imprime el bloque).
    """
    filt = ",".join(chain) + (
        f",loudnorm=I={target_lufs}:TP={target_tp}:LRA={target_lra}:"
        "print_format=json")
    p = run(["ffmpeg", "-y", "-hide_banner", "-v", "info", "-nostdin",
             "-i", path, "-af", filt, "-f", "null", "-"])
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr)
    if not m:
        raise RuntimeError("loudnorm: no se pudo medir la entrada")
    return json.loads(m.group(0))


# ----------------------------- cadena de filtros -----------------------------

def build_chain(preset, denoiser="afftdn", rnnoise_model=None,
                channels=1):
    """Devuelve la lista de filtros (sin loudnorm) del preset.

    `channels` decide el downmix a mono: si la entrada ya es mono
    no se toca; si es estéreo se promedia (0.5*L + 0.5*R).
    """
    if preset not in PRESETS:
        raise ValueError(f"preset desconocido {preset!r}")
    if denoiser not in DENOISERS:
        raise ValueError(f"denoiser desconocido {denoiser!r}")
    if denoiser == "arnndn" and not rnnoise_model:
        raise ValueError("arnndn necesita --rnnoise-model <modelo.rnnn>")

    chain = [f"aresample={DEFAULT_SR}"]
    if channels > 1:
        chain.append("pan=mono|c0=0.5*c0+0.5*c1")

    if preset == "pro":
        # Receta aprobada 23-nov-2026 (muestra A/B con DeepFilterNet):
        # igual que `phone` pero SIN expansor (DF ya limpia las
        # pausas; el compand recortó pausas en la VO de Messi FB)
        # y compresor ligero 2:1 con makeup +2 (no 3:1/+4).
        chain.append("highpass=f=80")
        if denoiser == "afftdn":
            chain.append("afftdn=nr=12:nf=-55")
        elif denoiser == "arnndn":
            chain.append(f"arnndn=m={rnnoise_model}:mix=0.85")
        chain.append("equalizer=f=250:width_type=o:width=1.2:g=-2")
        chain.append("equalizer=f=3500:width_type=o:width=1:g=3")
        chain.append("highshelf=f=10000:g=1.5")
        chain.append(
            "acompressor=threshold=-20dB:ratio=2:attack=8:release=200:"
            "knee=6:makeup=2")
        chain.append("deesser=i=0.5:f=0.7:m=0.5")
    elif preset == "phone":
        chain.append("highpass=f=80")
        if denoiser == "afftdn":
            chain.append("afftdn=nr=12:nf=-55")
        elif denoiser == "arnndn":
            chain.append(f"arnndn=m={rnnoise_model}:mix=0.85")
        # Expansor descendente suave: empuja hacia abajo lo que esté
        # por debajo de -55 dB (tono de sala, colas de reverb en las
        # pausas); la voz por encima de -40 dB es 1:1. Decay lento
        # (250 ms) para no cortar las colas de forma audible.
        chain.append(
            "compand=attacks=0.005:decays=0.25:"
            "points=-80/-95|-55/-62|-40/-40|0/0:soft-knee=6")
        chain.append("equalizer=f=250:width_type=o:width=1.2:g=-2")
        chain.append("equalizer=f=3500:width_type=o:width=1:g=3")
        chain.append("highshelf=f=10000:g=1.5")
        chain.append(
            "acompressor=threshold=-20dB:ratio=3:attack=8:release=200:"
            "knee=6:makeup=4")
        chain.append("deesser=i=0.5:f=0.7:m=0.5")
    else:  # clean: solo pulir, sin tocar el ruido de fondo ni la
        # dinámica. Sin compresor: el makeup levanta el suelo de
        # ruido en las pausas de un audio ya limpio (L3
        # negacion-embargo: -5,2 dB de SNR estimada con ratio 2:1 y
        # makeup +2) sin beneficio audible; el loudnorm ya nivela.
        chain.append("highpass=f=70")
        chain.append("equalizer=f=3500:width_type=o:width=1:g=1.5")
        chain.append("deesser=i=0.3:f=0.7:m=0.5")

    # Techo real: level=false (con el default level=true el
    # limitador aplica ganancia de maquillaje y NO limita).
    chain.append("alimiter=limit=0.95:level=false")
    return chain


def loudnorm_filter(target_lufs, target_tp, target_lra, measured=None):
    """Filtro loudnorm: lineal en dos pases si hay medida, si no
    pase único (dinámico, con aviso del llamador)."""
    base = f"loudnorm=I={target_lufs}:TP={target_tp}:LRA={target_lra}"
    if measured is None:
        return base
    return (base + f":measured_I={measured['input_i']}"
            f":measured_TP={measured['input_tp']}"
            f":measured_LRA={measured['input_lra']}"
            f":measured_thresh={measured['input_thresh']}"
            ":linear=true")


def run_chain(in_path, out_path, chain, target_lufs, target_tp,
              target_lra):
    """Aplica la cadena + loudnorm en dos pases (lineal).

    Devuelve (modo, medida): modo 'two-pass (linear)' o
    'single-pass (dynamic)' si la medida falla o la entrada es
    demasiado silenciosa para el modo lineal (input_i < -65 LUFS:
    el loudnorm lineal no converge y ffmpeg lo rechaza).
    """
    try:
        measured = loudnorm_measure(chain, in_path, target_lufs,
                                    target_tp, target_lra)
    except RuntimeError:
        measured = None
    if measured is not None and float(measured["input_i"]) < -65:
        measured = None
    mode = ("two-pass (linear)" if measured is not None
            else "single-pass (dynamic)")
    filt = ",".join(chain) + "," + loudnorm_filter(
        target_lufs, target_tp, target_lra, measured)
    run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
         "-i", in_path, "-af", filt, "-ac", "1",
         "-ar", str(DEFAULT_SR), "-c:a", "pcm_s16le", out_path])
    if measured is not None:
        # El lineal es solo ganancia: no puede alcanzar el objetivo
        # cuando el factor de cresta es alto, porque la ganancia
        # choca con el techo de TP (caso del preset `pro`: la salida
        # de DF es silenciosa, factor de cresta ~19 dB; medido
        # 23-nov-2026: el lineal dejó la VO de Messi YT en −19,8
        # LUFS). Si queda >0,5 dB por debajo, repetir con loudnorm
        # dinámico de un pase, que comprime los picos para llegar
        # al objetivo (la misma vía del fallback sin medición).
        lufs_out, _, _ = ebur128(out_path)
        if lufs_out < target_lufs - 0.5:
            mode = "single-pass (dynamic, linear no alcanzó)"
            filt = ",".join(chain) + "," + loudnorm_filter(
                target_lufs, target_tp, target_lra, None)
            run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
                 "-i", in_path, "-af", filt, "-ac", "1",
                 "-ar", str(DEFAULT_SR), "-c:a", "pcm_s16le",
                 out_path])
    return mode, measured


def correct_loudness(path, target_lufs, target_tp):
    """Corrección fina de sonoridad tras el loudnorm lineal.

    El loudnorm en modo lineal puede quedar ±0,5 dB fuera del
    objetivo en clips cortos (la ganancia se calcula con la medida
    con gating y la integrada difiere). Si el error supera 0,3 dB,
    una pasada de ganancia fija + limitador lo acerca al objetivo
    sin tocar la dinámica. La ganancia positiva se limita para no
    superar el TP objetivo. Devuelve la ganancia aplicada (dB).
    """
    lufs, tp, _ = ebur128(path)
    err = target_lufs - lufs
    if abs(err) <= 0.3:
        return 0.0
    gain = err
    if gain > 0 and math.isfinite(tp):
        gain = min(gain, target_tp - tp - 0.1)
    if gain <= 0.05 and err > 0:
        return 0.0
    tmp = path + ".corr.wav"
    run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
         "-i", path, "-af",
         f"volume={gain:.2f}dB,alimiter=limit=0.95:level=false",
         "-ac", "1", "-ar", str(DEFAULT_SR), "-c:a", "pcm_s16le",
         tmp])
    os.replace(tmp, path)
    return round(gain, 2)


# ----------------------------- DeepFilterNet (preset pro) -----------------------------

def find_deepfilter(explicit=None):
    """Localiza el binario `deep-filter` o devuelve None.

    Orden: argumento explícito, variable DEEPFILTER_BIN, ruta
    instalada 23-nov-2026, PATH. Una ruta explícita que no existe
    es un error (no se cae a otra en silencio: el usuario pidió
    ESE binario).
    """
    if explicit:
        if os.path.isfile(explicit) and os.access(explicit, os.X_OK):
            return explicit
        raise ValueError(
            f"deep-filter no encontrado en la ruta indicada: {explicit}")
    cands = []
    env = os.environ.get(DEEPFILTER_BIN_ENV)
    if env:
        cands.append(env)
    cands.append(DEEPFILTER_BIN_DEFAULT)
    for c in cands:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return shutil.which("deep-filter")


def run_deepfilter(in_wav, out_wav, binary):
    """Aplica DeepFilterNet a un WAV 48 kHz mono.

    `deep-filter -D` compensa el retardo del STFT y del lookahead
    del modelo para no desplazar la voz. El binario escribe
    `<stem>_DeepFilterNet3.wav` en el directorio de salida.
    DF recorta ~30 ms de cola: la salida se rellena con silencio
    hasta la duración exacta de la entrada (la cadena NUNCA
    recorta). Devuelve info para el informe.
    """
    p = subprocess.run([binary, "--version"], capture_output=True,
                       text=True, timeout=30)
    version = (p.stdout or "").strip().splitlines()
    version = version[0] if version else "?"
    _, _, dur_in = probe(in_wav)
    with tempfile.TemporaryDirectory() as td:
        run([binary, "-D", "-o", td, in_wav], timeout=900)
        outs = [f for f in os.listdir(td) if f.endswith(".wav")]
        if len(outs) != 1:
            raise RuntimeError(
                f"deep-filter: se esperaba 1 salida, hay {len(outs)}")
        df_raw = os.path.join(td, outs[0])
        _, _, dur_df = probe(df_raw)
        run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
             "-i", df_raw, "-af", f"apad,atrim=0:{dur_in:.3f}",
             "-ac", "1", "-ar", str(DEFAULT_SR),
             "-c:a", "pcm_s16le", out_wav])
    return {"binary": binary, "version": version,
            "df_duration_s": round(dur_df, 3),
            "df_delta_s": round(dur_df - dur_in, 3)}


# ----------------------------- análisis (numpy) -----------------------------

def read_mono(path):
    """Audio -> (muestras float32 mono, sr).

    Decodifica con ffmpeg los formatos que libsndfile no lee (m4a/mp3/ogg
    de grabadoras de celular): sin esto, la entrada natural del módulo
    (una grabación de teléfono) fallaba en el análisis. (Bug encontrado
    22-nov-2026 con la primera prueba real del usuario.)
    """
    if sf is None:
        raise RuntimeError("soundfile no disponible en este venv")
    try:
        data, sr = sf.read(path, always_2d=False)
    except Exception:
        tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        tmp.close()
        try:
            run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
                 "-i", path, "-ac", "1", "-ar", str(DEFAULT_SR),
                 "-c:a", "pcm_s16le", tmp.name])
            data, sr = sf.read(tmp.name, always_2d=False)
        finally:
            os.unlink(tmp.name)
    if data.ndim > 1:
        data = data.mean(axis=1)
    return np.asarray(data, dtype=np.float32), sr


def window_rms_db(samples, sr):
    """RMS por ventana de 10 ms, en dBFS."""
    n = int(VAD_WINDOW_S * sr)
    n_win = len(samples) // n
    if n_win == 0:
        return np.array([], dtype=np.float64)
    w = samples[:n_win * n].reshape(n_win, n)
    rms = np.sqrt(np.mean(w.astype(np.float64) ** 2, axis=1))
    return 20 * np.log10(np.maximum(rms, 1e-9))


def _periodicity(frame, sr):
    """Periodicidad (0-1) de un tramo: máximo de la autocorrelación
    normalizada en el rango de f0 humano (70-400 Hz).

    Distingue voz de tono de sala/reverb: el ruido de fondo no es
    periódico aunque suba de nivel tras el loudnorm. Autocorrelación
    por FFT (np.correlate directo es ~10x más lento y el check de
    pausas corre sobre cada línea).
    """
    f = frame - frame.mean()
    n = 1 << int(np.ceil(np.log2(2 * len(f))))
    spec = np.fft.rfft(f, n)
    ac = np.fft.irfft(spec * np.conj(spec), n)[:len(f)]
    if ac[0] <= 0:
        return 0.0
    lo, hi = int(sr / 400), int(sr / 70)
    return float(np.max(ac[lo:hi + 1]) / ac[0])


def speech_mask(samples, sr):
    """Máscara de voz por ventana de 10 ms.

    Misma regla que `voiced_span` en audit-audio.py: voz si
    RMS > -40 dBFS Y periodicidad > 0,4, o RMS > -28 dBFS (captura
    consonantes sordas fuertes, que no son periódicas). Sin el
    criterio de periodicidad, el loudnorm sube el tono de sala en
    las pausas por encima de -40 dBFS y el check de pausas da FAIL
    espurios (L4 negacion-embargo, 22-nov-2026: pausa de 0,27 s
    «recortada» a 0,19 s que en realidad estaba intacta).
    """
    n = int(VAD_WINDOW_S * sr)
    n_win = len(samples) // n
    if n_win == 0:
        return np.array([], dtype=bool)
    db = window_rms_db(samples, sr)
    frame_len = int(0.04 * sr)
    padded = np.concatenate(
        [samples, np.zeros(frame_len, dtype=np.float32)])
    per = np.array([_periodicity(padded[i * n:i * n + frame_len], sr)
                    for i in range(n_win)])
    return ((db > VAD_THRESHOLD_DBFS) & (per > 0.4)) | (db > -28.0)


def speech_segments(samples, sr):
    """Segmentos de voz [(inicio, fin)] por VAD de energía +
    periodicidad.

    Une huecos < 0,15 s (cierres de plosivas) y descarta segmentos
    < 0,08 s (respiros, clics).
    """
    is_speech = speech_mask(samples, sr)
    if len(is_speech) == 0:
        return []
    segs = []
    start = None
    for i, v in enumerate(is_speech):
        if v and start is None:
            start = i
        elif not v and start is not None:
            segs.append((start, i))
            start = None
    if start is not None:
        segs.append((start, len(is_speech)))
    # Une huecos cortos y descarta segmentos mínimos.
    merged = []
    for s, e in segs:
        if merged and (s - merged[-1][1]) * VAD_WINDOW_S < VAD_MERGE_GAP_S:
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return [(s * VAD_WINDOW_S, e * VAD_WINDOW_S) for s, e in merged
            if (e - s) * VAD_WINDOW_S >= VAD_MIN_SEGMENT_S]


def snr_estimate(samples, sr):
    """SNR estimada (dB) y suelo de ruido (dBFS).

    Nivel de voz = percentil 90 de las ventanas sonoras; suelo =
    percentil 10 de todas las ventanas. Es una estimación robusta
    para comparar antes/después, no una SNR de laboratorio.
    """
    db = window_rms_db(samples, sr)
    if len(db) == 0:
        return 0.0, -90.0
    voiced = db[db > VAD_THRESHOLD_DBFS]
    speech_db = float(np.percentile(voiced, 90)) if len(voiced) else -90.0
    noise_db = float(np.percentile(db, 10))
    return round(speech_db - noise_db, 1), round(noise_db, 1)


def check_pauses(orig_samples, out_samples, sr):
    """Verifica la regla de pausas (18-nov-2026) entre original y
    procesado. Devuelve (ok, hallazgos, fiable, stats).

    Para cada pausa original >= 0,25 s entre segmentos de voz, busca
    la pausa correspondiente en el procesado (la más cercana en
    tiempo, dentro de 0,2 s del punto medio): FAIL si desaparece,
    queda < 0,25 s o pierde > 50%.

    Solo se verifican las pausas MEDIBLES en el original: el
    interior de la pausa (recortando 50 ms por borde) debe tener
    una mediana < -45 dBFS. Una pausa llena de ruido o eco en el
    original no se puede medir: el VAD no distingue dónde termina
    la palabra y empieza la pausa, y además el denoise deja el eco
    residual MÁS limpio (más periódico) en la salida, con lo que
    el VAD lo cuenta como voz y la pausa «se acorta» sin que la
    cadena haya recortado nada (L1 degradada, 22-nov-2026: falso
    FAIL por eco expuesto por afftdn). Las pausas no medibles se
    saltan y se cuentan en stats; si no queda ninguna verificable,
    fiable=False y el veredicto no falla por pausas.
    """
    orig_segs = speech_segments(orig_samples, sr)
    out_segs = speech_segments(out_samples, sr)
    db_orig = window_rms_db(orig_samples, sr)
    findings = []
    stats = {"verified_gaps": 0, "skipped_gaps": 0}

    def gaps(segs):
        return [(segs[i][1], segs[i + 1][0])
                for i in range(len(segs) - 1)]

    orig_gaps = [(s, e) for s, e in gaps(orig_segs)
                 if e - s >= PAUSE_MIN_S]
    out_gaps = gaps(out_segs)
    for s, e in orig_gaps:
        # Nivel mediano del INTERIOR de la pausa en el original.
        i0 = int((s + 0.05) / VAD_WINDOW_S)
        i1 = int((e - 0.05) / VAD_WINDOW_S)
        interior = db_orig[i0:max(i0 + 1, i1)]
        if len(interior) == 0 or float(np.median(interior)) > -45.0:
            stats["skipped_gaps"] += 1
            continue
        stats["verified_gaps"] += 1
        dur = e - s
        mid = (s + e) / 2
        best = None
        for os_, oe in out_gaps:
            if abs((os_ + oe) / 2 - mid) < 0.2:
                if best is None or abs((os_ + oe) / 2 - mid) < abs(
                        (best[0] + best[1]) / 2 - mid):
                    best = (os_, oe)
        if best is None:
            findings.append(
                {"pause_at_s": round(s, 2), "orig_s": round(dur, 2),
                 "out_s": 0.0, "verdict": "FAIL",
                 "reason": "la pausa desapareció en el procesado"})
            continue
        out_dur = best[1] - best[0]
        loss = 1 - out_dur / dur
        if (out_dur < PAUSE_MIN_S - PAUSE_MEASURE_TOL_S
                or loss > PAUSE_MAX_LOSS + PAUSE_MEASURE_TOL_S / dur):
            findings.append(
                {"pause_at_s": round(s, 2), "orig_s": round(dur, 2),
                 "out_s": round(out_dur, 2), "verdict": "FAIL",
                 "reason": f"pausa recortada: {loss * 100:.0f}% de "
                           f"pérdida"})
    reliable = stats["verified_gaps"] > 0
    return len(findings) == 0, findings, reliable, stats


def check_pauses_envelope(orig_samples, out_samples, sr):
    """Verifica la regla de pausas por envolventes RMS RELATIVAS.

    Alternativa a check_pauses para el preset `pro`: DeepFilterNet
    cambia la SNR tanto (suelo −56 → −82 dBFS en la VO de Messi
    YT) que el VAD por energía+periodicidad desplaza los bordes de
    las pausas ~0,1 s y alucina voz en el ruido del arranque del
    original — medido 23-nov-2026: el VAD fallaba 4-5 pausas en la
    versión APROBADA por el usuario de oído, mientras las
    envolventes relativas mostraban 30/30 huecos en las mismas
    posiciones con la misma duración o más.

    Método: envolvente RMS por ventanas de 10 ms, normalizada por
    el percentil 90 de cada archivo (nivel de voz propio); hueco =
    tramo ≥0,15 s por debajo de −20 dB relativos. Solo se verifican
    pausas originales ≥0,25 s (la regla del 18-nov es sobre pausas
    naturales; lo más corto es intersilábico) y DENTRO del tramo de
    voz (entre el primer y el último tramo sonoro sostenido ≥0,5 s):
    el silencio inicial/final no es una pausa, y el ruido de
    manipulación del arranque fragmenta el lead-in en «huecos»
    falsos que la limpieza hace desaparecer sin haber recortado
    nada (VO de Messi YT, 23-nov-2026). Misma forma de retorno que
    check_pauses. Si el original es tan ruidoso que sus pausas no
    bajan de −20 dB relativos, o no hay tramo sonoro sostenido, no
    hay huecos verificables y fiable=False: no se falla lo que no
    se puede medir.
    """
    def gaps_rel(samples):
        db = window_rms_db(samples, sr)
        level = float(np.percentile(db, 90))
        quiet = db < level - 20.0
        out = []
        a = None
        for i, v in enumerate(quiet):
            if v and a is None:
                a = i
            elif not v and a is not None:
                if (i - a) * VAD_WINDOW_S >= 0.15:
                    out.append((a * VAD_WINDOW_S, i * VAD_WINDOW_S))
                a = None
        if a is not None and (len(quiet) - a) * VAD_WINDOW_S >= 0.15:
            out.append((a * VAD_WINDOW_S, len(quiet) * VAD_WINDOW_S))
        return out, quiet

    def speech_span(quiet):
        """(inicio, fin) del tramo de voz: primer y último tramo
        sonoro sostenido (≥0,5 s). Los ruidos cortos del arranque
        (manipulación del teléfono) no cuentan como voz."""
        runs = []
        a = None
        for i, v in enumerate(quiet):
            if not v and a is None:
                a = i
            elif v and a is not None:
                if (i - a) * VAD_WINDOW_S >= 0.5:
                    runs.append((a * VAD_WINDOW_S, i * VAD_WINDOW_S))
                a = None
        if a is not None and (len(quiet) - a) * VAD_WINDOW_S >= 0.5:
            runs.append((a * VAD_WINDOW_S, len(quiet) * VAD_WINDOW_S))
        if not runs:
            return None
        return runs[0][0], runs[-1][1]

    orig_gaps, orig_quiet = gaps_rel(orig_samples)
    out_gaps, _ = gaps_rel(out_samples)
    span = speech_span(orig_quiet)
    if span is None:
        return True, [], False, {"verified_gaps": 0,
                                 "skipped_gaps": 0}
    orig_gaps = [(s, e) for s, e in orig_gaps
                 if e - s >= PAUSE_MIN_S
                 and s >= span[0] and e <= span[1]]
    findings = []
    stats = {"verified_gaps": len(orig_gaps), "skipped_gaps": 0}
    for s, e in orig_gaps:
        dur = e - s
        mid = (s + e) / 2
        best = None
        for os_, oe in out_gaps:
            if os_ - 0.15 <= mid <= oe + 0.15:
                if best is None or abs((os_ + oe) / 2 - mid) < abs(
                        (best[0] + best[1]) / 2 - mid):
                    best = (os_, oe)
        if best is None:
            findings.append(
                {"pause_at_s": round(s, 2), "orig_s": round(dur, 2),
                 "out_s": 0.0, "verdict": "FAIL",
                 "reason": "la pausa desapareció en el procesado"})
            continue
        out_dur = best[1] - best[0]
        loss = 1 - out_dur / dur
        if (out_dur < PAUSE_MIN_S - PAUSE_MEASURE_TOL_S
                or loss > PAUSE_MAX_LOSS + PAUSE_MEASURE_TOL_S / dur):
            findings.append(
                {"pause_at_s": round(s, 2), "orig_s": round(dur, 2),
                 "out_s": round(out_dur, 2), "verdict": "FAIL",
                 "reason": f"pausa recortada: {loss * 100:.0f}% de "
                           f"pérdida"})
    reliable = stats["verified_gaps"] > 0
    return len(findings) == 0, findings, reliable, stats


def analyze(path):
    """Medidas de un archivo: duración, LUFS/TP/LRA, SNR, suelo."""
    sr_in, ch, dur = probe(path)
    lufs, tp, lra = ebur128(path)
    samples, sr = read_mono(path)
    snr, noise = snr_estimate(samples, sr)
    return {
        "path": path,
        "duration_s": round(dur, 3),
        "sample_rate": sr_in,
        "channels": ch,
        "lufs": round(lufs, 2),
        "true_peak_dbtp": (round(tp, 2) if math.isfinite(tp) else None),
        "lra": round(lra, 2),
        "snr_db": snr,
        "noise_floor_dbfs": noise,
    }


# ----------------------------- entrada principal -----------------------------

def enhance(in_path, out_path, preset="phone", denoiser="afftdn",
            rnnoise_model=None, target_lufs=DEFAULT_TARGET_LUFS,
            target_tp=DEFAULT_TARGET_TP,
            target_lra=DEFAULT_TARGET_LRA, compare=False,
            verify=True, deepfilter_bin=None):
    """Procesa in_path -> out_path. Devuelve el informe (dict)."""
    t0 = time.perf_counter()
    sr_in, ch, _ = probe(in_path)
    df_info = None
    chain_input = in_path
    tmpdir = None
    try:
        if preset == "pro":
            binary = find_deepfilter(deepfilter_bin)
            if binary is None:
                raise RuntimeError(
                    "preset pro necesita el binario deep-filter: "
                    + DEEPFILTER_INSTALL_HINT)
            # DF solo lee WAV: decodificar primero (m4a/mp3 de
            # grabadoras de celular) a 48 kHz mono.
            tmpdir = tempfile.TemporaryDirectory()
            decoded = os.path.join(tmpdir.name, "decoded.wav")
            run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
                 "-i", in_path, "-ac", "1", "-ar", str(DEFAULT_SR),
                 "-c:a", "pcm_s16le", decoded])
            df_wav = os.path.join(tmpdir.name, "df.wav")
            df_info = run_deepfilter(decoded, df_wav, binary)
            chain_input = df_wav
        # La cadena se construye sobre la entrada REAL de la cadena:
        # con `pro` es la salida de DF (siempre mono), no el
        # original (que puede ser estéreo). Construirla con los
        # canales del original metía un pan=mono sobre audio ya
        # mono que atenuaba ~6 dB (23-nov-2026: la salida de la
        # cadena quedó en −26,7 LUFS en vez de −22,4).
        _, ch_chain, _ = probe(chain_input)
        chain = build_chain(preset, denoiser, rnnoise_model, ch_chain)
        mode, measured = run_chain(chain_input, out_path, chain,
                                   target_lufs, target_tp, target_lra)
    finally:
        if tmpdir is not None:
            tmpdir.cleanup()
    corr_db = correct_loudness(out_path, target_lufs, target_tp)
    report = {
        "preset": preset,
        "denoiser": denoiser,
        "deepfilter": df_info,
        "chain": chain,
        "loudness_correction_db": corr_db,
        "loudnorm": {
            "mode": mode,
            "target_lufs": target_lufs,
            "target_tp": target_tp,
            "target_lra": target_lra,
            "measured_input_i": (measured or {}).get("input_i"),
            "measured_input_tp": (measured or {}).get("input_tp"),
        },
        "input": analyze(in_path),
        "output": analyze(out_path),
        "elapsed_s": round(time.perf_counter() - t0, 1),
    }
    # Verificación de duración y pausas.
    verdicts = []
    dur_in = report["input"]["duration_s"]
    dur_out = report["output"]["duration_s"]
    if abs(dur_out - dur_in) > DURATION_TOLERANCE_S:
        verdicts.append(
            f"FAIL duración: entrada {dur_in} s, salida {dur_out} s")
    lufs_out = report["output"]["lufs"]
    if abs(lufs_out - target_lufs) > LUFS_TOLERANCE:
        verdicts.append(
            f"FAIL sonoridad: salida {lufs_out} LUFS, objetivo "
            f"{target_lufs} ± {LUFS_TOLERANCE}")
    tp_out = report["output"]["true_peak_dbtp"]
    if tp_out is not None and tp_out > target_tp + TP_TOLERANCE:
        verdicts.append(
            f"FAIL true peak: salida {tp_out} dBTP, objetivo "
            f"<= {target_tp}")
    pause_ok, pause_findings, pause_reliable, pause_stats = (
        True, [], True, {"verified_gaps": 0, "skipped_gaps": 0})
    pause_method = "vad"
    if verify:
        orig, sr = read_mono(in_path)
        out, _ = read_mono(out_path)
        if preset == "pro":
            # DF cambia la SNR tanto que el VAD desplaza los bordes
            # de las pausas y da FAIL espurios (ver docstring de
            # check_pauses_envelope); la verificación es por
            # envolventes relativas.
            pause_method = "envelope"
            (pause_ok, pause_findings, pause_reliable,
             pause_stats) = check_pauses_envelope(orig, out, sr)
        else:
            (pause_ok, pause_findings, pause_reliable,
             pause_stats) = check_pauses(orig, out, sr)
        if pause_reliable and not pause_ok:
            verdicts.append(
                f"FAIL pausas: {len(pause_findings)} pausa(s) "
                f"recortada(s)")
    report["pauses"] = {"checked": verify, "method": pause_method,
                        "ok": pause_ok,
                        "reliable": pause_reliable,
                        "verified_gaps": pause_stats["verified_gaps"],
                        "skipped_gaps": pause_stats["skipped_gaps"],
                        "findings": pause_findings}
    report["verdict"] = "PASS" if not verdicts else "FAIL"
    report["verdict_reasons"] = verdicts

    if compare:
        ab_path = re.sub(r"\.wav$", "", out_path) + "-ab.wav"
        with tempfile.TemporaryDirectory() as td:
            matched = os.path.join(td, "before.wav")
            # El «antes» solo se iguala en sonoridad (sin EQ ni
            # compresión) para que la comparación A/B sea justa.
            before_chain = [f"aresample={DEFAULT_SR}"]
            if ch > 1:
                before_chain.append("pan=mono|c0=0.5*c0+0.5*c1")
            run_chain(in_path, matched, before_chain,
                      target_lufs, target_tp, target_lra)
            run(["ffmpeg", "-y", "-hide_banner", "-nostats", "-nostdin",
                 "-i", matched, "-i", out_path,
                 "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                 "-filter_complex",
                 "[2:a]atrim=0:0.5[sil];"
                 "[0:a][sil][1:a]concat=n=3:v=0:a=1",
                 "-ac", "1", "-ar", str(DEFAULT_SR),
                 "-c:a", "pcm_s16le", ab_path])
        report["compare_ab"] = ab_path
    return report


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--in", dest="inp", required=True,
                   help="Audio de entrada (m4a, mp3, wav, ogg...)")
    p.add_argument("--out", required=True,
                   help="WAV de salida (mono 48 kHz s16le)")
    p.add_argument("--preset", default="phone", choices=PRESETS,
                   help="phone = grabación de celular (defecto); "
                   "clean = audio ya bueno, solo pulir; "
                   "pro = DeepFilterNet + cadena pulida (necesita "
                   "el binario deep-filter)")
    p.add_argument("--deepfilter-bin",
                   help="Ruta al binario deep-filter (preset pro). "
                   "Por defecto busca DEEPFILTER_BIN, "
                   "~/workspace/.voice-env/bin/deep-filter y el PATH")
    p.add_argument("--denoiser", default="afftdn", choices=DENOISERS,
                   help="afftdn (defecto), arnndn (necesita modelo) u off")
    p.add_argument("--rnnoise-model",
                   help="Modelo .rnnn para --denoiser arnndn")
    p.add_argument("--target-lufs", type=float,
                   default=DEFAULT_TARGET_LUFS,
                   help="Objetivo de sonoridad de la VO "
                   f"(defecto {DEFAULT_TARGET_LUFS}, el voice_lufs "
                   "de mix.py)")
    p.add_argument("--target-tp", type=float, default=DEFAULT_TARGET_TP)
    p.add_argument("--target-lra", type=float, default=DEFAULT_TARGET_LRA)
    p.add_argument("--compare", action="store_true",
                   help="Genera <out-stem>-ab.wav con antes/después "
                   "a la misma sonoridad (0,5 s de silencio entre "
                   "ambos)")
    p.add_argument("--dry-run", action="store_true",
                   help="Muestra la cadena y las medidas de entrada "
                   "sin escribir nada")
    p.add_argument("--no-verify", action="store_true",
                   help="Omite la verificación de pausas")
    p.add_argument("--report",
                   help="Informe JSON (por defecto <out>.json)")
    p.add_argument("--force", action="store_true",
                   help="Sobrescribir la salida si existe")
    a = p.parse_args()

    if not os.path.isfile(a.inp):
        p.error(f"falta el archivo {a.inp}")
    report_path = a.report or (a.out + ".json")
    if not a.force and not a.dry_run and (
            os.path.exists(a.out) or os.path.exists(report_path)):
        p.error("la salida ya existe; usa --force para sobrescribir")

    sr_in, ch, _ = probe(a.inp)
    # Con `pro` la cadena corre sobre la salida de DF (mono), no
    # sobre el original: la vista previa se construye igual.
    chain = build_chain(a.preset, a.denoiser, a.rnnoise_model,
                        1 if a.preset == "pro" else ch)
    print(f"Entrada: {a.inp} ({sr_in} Hz, {ch} canal(es))")
    print(f"Preset: {a.preset} · denoiser: {a.denoiser}")
    if a.preset == "pro":
        binary = find_deepfilter(a.deepfilter_bin)
        if binary is None:
            p.error("preset pro necesita el binario deep-filter: "
                    + DEEPFILTER_INSTALL_HINT)
        print(f"DeepFilterNet: {binary}")
    print("Cadena:")
    if a.preset == "pro":
        print("  deep-filter -D (DeepFilterNet3, antes de ffmpeg)")
    for f in chain:
        print(f"  {f}")
    print(f"  loudnorm=I={a.target_lufs}:TP={a.target_tp}:"
          f"LRA={a.target_lra} (dos pases, lineal)")
    info_in = analyze(a.inp)
    print(f"Entrada: {info_in['duration_s']} s, "
          f"{info_in['lufs']} LUFS, TP {info_in['true_peak_dbtp']} dBTP, "
          f"SNR ~{info_in['snr_db']} dB, suelo "
          f"{info_in['noise_floor_dbfs']} dBFS")
    if a.dry_run:
        return 0

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    try:
        report = enhance(a.inp, a.out, preset=a.preset,
                         denoiser=a.denoiser,
                         rnnoise_model=a.rnnoise_model,
                         target_lufs=a.target_lufs,
                         target_tp=a.target_tp,
                         target_lra=a.target_lra,
                         compare=a.compare,
                         verify=not a.no_verify,
                         deepfilter_bin=a.deepfilter_bin)
    except (RuntimeError, ValueError) as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    o = report["output"]
    print(f"Salida: {a.out} ({o['duration_s']} s, {o['lufs']} LUFS, "
          f"TP {o['true_peak_dbtp']} dBTP, SNR ~{o['snr_db']} dB, "
          f"suelo {o['noise_floor_dbfs']} dBFS)")
    print(f"Mejora de SNR: "
          f"{o['snr_db'] - report['input']['snr_db']:+.1f} dB · "
          f"loudnorm: {report['loudnorm']['mode']} · "
          f"{report['elapsed_s']} s")
    if report.get("compare_ab"):
        print(f"A/B: {report['compare_ab']}")
    print(f"Veredicto: {report['verdict']}")
    for r in report["verdict_reasons"]:
        print(f"  {r}")
    print(f"Informe: {report_path}")
    return 0 if report["verdict"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
