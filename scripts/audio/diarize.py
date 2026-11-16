#!/usr/bin/env python3
"""Diarización (quién habla cuándo) con sherpa-onnx, 100 % local.

Caso real: los reels virales del Memorial son dos presentadoras en
diálogo; este script etiqueta cada tramo de voz con su hablante
(SPEAKER_00, SPEAKER_01, ...) para poder repartir subtítulos,
planos y mezclas por presentadora.

Por qué sherpa-onnx y no pyannote directo: pyannote exige cuenta de
Hugging Face + token (modelo gated) y torch; sherpa-onnx usa los
mismos modelos exportados a ONNX, descargados como archivos públicos
de GitHub Releases, sin cuenta ni token, y corre solo con
onnxruntime (sin torch). Licencias: sherpa-onnx Apache-2.0,
segmentación pyannote-3.0 MIT, embedding 3D-Speaker Apache-2.0.

Modelos (46 MB, descargados una vez, durables en <hub>/.sherpa-models/):
  - segmentación: sherpa-onnx-pyannote-segmentation-3-0/model.onnx
    (https://github.com/k2-fsa/sherpa-onnx/releases/tag/speaker-segmentation-models)
  - embedding: 3dspeaker_speech_eres2net_base_sv_zh-cn_3dspeaker_16k.onnx
    (https://github.com/k2-fsa/sherpa-onnx/releases/tag/speaker-recongition-models)

Entrada: cualquier audio que ffmpeg lea (wav/mp3/mp4); se remuestrea
a 16 kHz mono. Salida: JSON con segmentos {start, end, speaker} +
líneas legibles por stdout.

Uso:
  .venv/bin/python scripts/audio/diarize.py dialogo.wav --speakers 2 \\
      --out diarizacion.json
  .venv/bin/python scripts/audio/diarize.py testimonio.mp4 --out d.json

Notas:
- --speakers N cuando se sabe cuántos hablantes hay (2 en el diálogo
  del Memorial): mejora mucho el clustering. Sin él, el número se
  detecta solo con --threshold (0,5 por defecto; más bajo = más
  hablantes).
- Los IDs de hablante son relativos a cada audio (SPEAKER_00 en un
  audio no es la misma persona que SPEAKER_00 en otro).
- Verificado 16-nov-2026: audio de control con dos voces conocidas
  (VO Marabana + testimonio de Pilar, frontera en el s 16) ->
  2 hablantes, frontera detectada en su sitio; audio real del reel
  de Pilar V30 (75 s, dos presentadoras + testimonio): --speakers 2
  separa testimonio de presentadoras (<0,3 s del EDL); --speakers 3
  y autodetección con --threshold 0.7 convergen en el mismo
  resultado de 3 hablantes. El umbral por defecto (0,5)
  sobresegmenta en este material (5 hablantes). Ver
  scripts/audio/README.md.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import time

MODELS_SUBDIR = ".sherpa-models"
SEGMENTATION_MODEL = (
    "sherpa-onnx-pyannote-segmentation-3-0/model.onnx"
)
EMBEDDING_MODEL = (
    "3dspeaker_speech_eres2net_base_sv_zh-cn_3dspeaker_16k.onnx"
)


def default_models_dir() -> str:
    """<hub>/.sherpa-models, derivado de la ubicación del script."""
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__))))
    return os.path.join(os.path.dirname(repo_root), MODELS_SUBDIR)


def resample_16k_mono(src: str, tmpdir: str) -> str:
    """Cualquier audio -> WAV 16 kHz mono f32 (lo que pide sherpa)."""
    out = os.path.join(tmpdir, "input-16k.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-v", "error", "-nostdin",
         "-i", src, "-ac", "1", "-ar", "16000", "-c:a", "pcm_f32le", out],
        check=True, timeout=300,
    )
    return out


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("input", help="Audio o video con audio (wav/mp3/mp4)")
    p.add_argument("--out", help="JSON de salida (por defecto stdout "
                   "legible + JSON a <entrada>.diarization.json)")
    p.add_argument("--speakers", type=int, default=-1,
                   help="Número de hablantes si se conoce (2 en el "
                        "diálogo del Memorial); -1 = autodetectar")
    p.add_argument("--threshold", type=float, default=0.5,
                   help="Umbral de clustering con autodetección "
                        "(más bajo = más hablantes)")
    p.add_argument("--models-dir", default=None,
                   help="Carpeta con los modelos ONNX (por defecto "
                        "<hub>/.sherpa-models)")
    p.add_argument("--min-duration-on", type=float, default=0.3,
                   help="Duración mínima de un tramo de voz (s)")
    p.add_argument("--min-duration-off", type=float, default=0.5,
                   help="Silencio mínimo entre tramos (s)")
    a = p.parse_args()

    if not os.path.isfile(a.input):
        p.error(f"falta el archivo {a.input}")
    models_dir = a.models_dir or os.environ.get("SHERPA_MODELS") \
        or default_models_dir()
    seg_model = os.path.join(models_dir, SEGMENTATION_MODEL)
    emb_model = os.path.join(models_dir, EMBEDDING_MODEL)
    for path in (seg_model, emb_model):
        if not os.path.isfile(path):
            print(f"ERROR: falta el modelo {path}", file=sys.stderr)
            print("Descargar los modelos (sin cuenta ni token) a "
                  f"{models_dir}:", file=sys.stderr)
            print("  curl -fsSL -O https://github.com/k2-fsa/sherpa-onnx/"
                  "releases/download/speaker-segmentation-models/"
                  "sherpa-onnx-pyannote-segmentation-3-0.tar.bz2",
                  file=sys.stderr)
            print("  curl -fsSL -O https://github.com/k2-fsa/sherpa-onnx/"
                  "releases/download/speaker-recongition-models/"
                  "3dspeaker_speech_eres2net_base_sv_zh-cn_3dspeaker_16k.onnx",
                  file=sys.stderr)
            return 1

    try:
        import sherpa_onnx
    except ImportError:
        print("ERROR: falta sherpa-onnx en este Python. Instalar en el "
              "venv del hub: ~/workspace/remotion-hub/.venv/bin/pip "
              "install sherpa-onnx", file=sys.stderr)
        return 1
    import soundfile as sf

    t0 = time.perf_counter()
    config = sherpa_onnx.OfflineSpeakerDiarizationConfig(
        segmentation=sherpa_onnx.OfflineSpeakerSegmentationModelConfig(
            pyannote=sherpa_onnx.OfflineSpeakerSegmentationPyannoteModelConfig(
                model=seg_model)),
        embedding=sherpa_onnx.SpeakerEmbeddingExtractorConfig(
            model=emb_model),
        clustering=sherpa_onnx.FastClusteringConfig(
            num_clusters=a.speakers, threshold=a.threshold),
        min_duration_on=a.min_duration_on,
        min_duration_off=a.min_duration_off,
    )
    if not config.validate():
        print("ERROR: configuración sherpa-onnx inválida (revisa los "
              "modelos)", file=sys.stderr)
        return 1
    sd = sherpa_onnx.OfflineSpeakerDiarization(config)

    with tempfile.TemporaryDirectory(prefix="diarize-") as tmpdir:
        wav16 = resample_16k_mono(a.input, tmpdir)
        audio, sr = sf.read(wav16, dtype="float32", always_2d=True)
        audio = audio[:, 0]
    if sr != sd.sample_rate:
        print(f"ERROR: se esperaba {sd.sample_rate} Hz, ffmpeg dio "
              f"{sr} Hz", file=sys.stderr)
        return 1
    duration = len(audio) / sr
    result = sd.process(audio).sort_by_start_time()
    segments = [
        {"start": round(r.start, 3), "end": round(r.end, 3),
         "speaker": f"SPEAKER_{r.speaker:02d}"}
        for r in result
    ]
    n_speakers = len({s["speaker"] for s in segments})
    res = {
        "audio": os.path.abspath(a.input),
        "duration_seconds": round(duration, 3),
        "num_speakers": n_speakers,
        "speakers_requested": a.speakers,
        "cluster_threshold": a.threshold,
        "segmentation_model": SEGMENTATION_MODEL,
        "embedding_model": EMBEDDING_MODEL,
        "sherpa_onnx_version": sherpa_onnx.__version__,
        "segments": segments,
        "elapsed_seconds": round(time.perf_counter() - t0, 3),
    }
    out = a.out or (a.input + ".diarization.json")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2, ensure_ascii=False)
    for s in segments:
        print(f"{s['start']:7.3f} -- {s['end']:7.3f}  {s['speaker']}")
    print(f"{n_speakers} hablante(s), {len(segments)} segmentos, "
          f"{duration:.1f} s de audio en {res['elapsed_seconds']:.1f} s "
          f"-> {out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
