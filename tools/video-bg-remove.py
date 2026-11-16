#!/usr/bin/env python3
"""Quitar fondo en VIDEO con Robust Video Matting (RVM) -> alfa o fondo sustituido.

A diferencia de rembg (foto a foto, con parpadeo entre fotogramas), RVM
es recurrente: mantiene un estado temporal entre fotogramas y produce un
mate estable, sin parpadeo grave. Es la herramienta oficial del hub para
recortar personas en movimiento (entrevistas, presentadoras a cámara,
inserts) antes de componer en Remotion.

Implementación: inferencia ONNX con onnxruntime (MIT) + OpenCV, con
código propio escrito para este hub. NO se copia ni se importa código
de RVM: solo se usan los pesos publicados del modelo MobileNetV3
(14 MB, descargados una vez a assets/models/rvm/ del hub).

LICENCIA (verificado 16-nov-2026): el código de RVM es GPL-3.0, NO MIT
(ver https://github.com/PeterL1n/RobustVideoMatting/blob/master/LICENSE).
Por eso RVM se usa aquí solo como herramienta local de procesado (igual
que ffmpeg, también GPL), nunca vendida ni importada en el repo público.
Los pesos se descargan en tiempo de ejecución, fuera del repo.

Uso:
  ~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
      clip.mp4 -o clip-alpha.webm --mode alpha
  ~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
      clip.mp4 -o clip-verde.mp4 --mode replace --bg-color 00FF00
  ~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
      clip.mp4 -o clip-fondo.mp4 --mode replace --bg-image fondo.jpg
  ~/workspace/remotion-hub/.venv/bin/python tools/video-bg-remove.py \
      clip.mp4 -o clip-mate.mp4 --mode matte

Modos de salida:
  alpha   WebM VP9 con canal alfa (o ProRes 4444 con --alpha-codec prores).
          Usable directamente en Remotion como video transparente.
  replace MP4 H.264 con el fondo sustituido por un color o una imagen.
  matte   MP4 H.264 en escala de grises con el mate alfa (para QA).

Rendimiento orientativo (CPU de esta VM, 4 hilos, modelo MobileNetV3):
  640x360, downsample-ratio 1: ~0,6-0,7 s/fotograma.
  Un clip de 4 s a 30 fps tarda ~1-2 min. Para previews rápidas usa
  --width 480.

  OJO: downsample-ratio DISTINTO de 1 es patológicamente lento en este
  modelo ONNX con onnxruntime (medido 16-nov-2026: 640x352 con d=4 tarda
  11-30 s/fotograma frente a 0,6-0,7 s con d=1; a 448x256, 5-10 s frente
  a 0,15-0,18 s). Por eso el defecto es 1, que además da el mejor borde.
  No subas el ratio buscando velocidad: aquí hace justo lo contrario.

Límites conocidos (documentados; ver tools/README.md):
  - Personas pequeñas o lejanas (multitud, plano general): el mate sale
    vacío o parcial. RVM está entrenado para una persona prominente.
  - Pelo fino y bordes con movimiento rápido: algo de sangrado de color;
    el foreground del modelo ya viene descontaminado, pero no es perfecto.
  - Varias personas: las recorta a todas, sin distinguirlas.
  - Fondos con personas en pantallas/carteles: puede recortarlas también.
  - El primer fotograma arranca con el estado recurrente en cero: el
    mate se estabiliza en ~0,5 s; corta ese arranque si se nota.
"""
import argparse
import os
import subprocess
import sys
import time
import urllib.request

import cv2
import numpy as np

HUB_DIR = os.path.expanduser("~/workspace/remotion-hub")
DEFAULT_MODEL = os.path.join(
    HUB_DIR, "assets/models/rvm/rvm_mobilenetv3_fp32.onnx"
)
MODEL_URL = (
    "https://github.com/PeterL1n/RobustVideoMatting/releases/download/"
    "v1.0.0/rvm_mobilenetv3_fp32.onnx"
)
REC_CHANNELS = (16, 20, 40, 64)  # r1..r4 del modelo MobileNetV3


def ensure_model(path: str) -> str:
    """Descarga los pesos ONNX si no están en el hub (14 MB, una sola vez)."""
    if os.path.isfile(path):
        return path
    print(f"Modelo RVM no encontrado en {path}; descargando (14 MB)...")
    print("Origen: release oficial v1.0.0 de PeterL1n/RobustVideoMatting.")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".download"
    urllib.request.urlretrieve(MODEL_URL, tmp)
    os.replace(tmp, path)
    print(f"Modelo guardado en {path}")
    return path


def proc_size(width_in: int, height_in: int, width: int) -> tuple[int, int]:
    """Tamaño de procesado: ancho pedido, alto proporcional en múltiplo de 32."""
    h = max(32, int(round(height_in * width / width_in / 32.0)) * 32)
    return width, h


def load_background(args, width: int, height: int) -> np.ndarray:
    """Fondo BGR (uint8) del tamaño del video de salida."""
    if args.bg_image:
        bg = cv2.imread(args.bg_image)
        if bg is None:
            raise SystemExit(f"ERROR: no se puede leer {args.bg_image}")
        # Recorte central con la proporción del video, luego escala.
        bh, bw = bg.shape[:2]
        target = width / height
        if bw / bh > target:  # sobra ancho
            nw = int(bh * target)
            x0 = (bw - nw) // 2
            bg = bg[:, x0:x0 + nw]
        else:  # sobra alto
            nh = int(bw / target)
            y0 = (bh - nh) // 2
            bg = bg[y0:y0 + nh, :]
        return cv2.resize(bg, (width, height), interpolation=cv2.INTER_AREA)
    hexcol = args.bg_color.lstrip("#")
    if len(hexcol) != 6:
        raise SystemExit("ERROR: --bg-color debe ser RRGGBB, p. ej. 00FF00")
    r, g, b = (int(hexcol[i:i + 2], 16) for i in (0, 2, 4))
    return np.full((height, width, 3), (b, g, r), dtype=np.uint8)


def ffmpeg_cmd(args, width: int, height: int, fps: float) -> list[str]:
    """Codificador ffmpeg que recibe fotogramas crudos por stdin.

    El audio se copia del original (segunda entrada) cuando existe.
    """
    if args.mode == "alpha" and args.alpha_codec == "prores":
        pix_fmt, codec, extra = "bgra", "prores_ks", ["-profile:v", "4444"]
        audio = ["-c:a", "copy"]
    elif args.mode == "alpha":
        pix_fmt, codec, extra = "bgra", "libvpx-vp9", [
            "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30",
            "-deadline", "good", "-cpu-used", "2",
            "-auto-alt-ref", "0",
        ]
        # WebM no admite AAC: el audio se recodifica a Opus.
        audio = ["-c:a", "libopus", "-b:a", "128k"]
    else:
        pix_fmt, codec, extra = "bgr24", "libx264", [
            "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium",
        ]
        audio = ["-c:a", "copy"]
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-f", "rawvideo", "-pix_fmt", pix_fmt,
        "-s", f"{width}x{height}", "-r", str(fps), "-i", "pipe:0",
        "-i", args.input,
        "-map", "0:v:0", "-map", "1:a?", "-c:v", codec, *extra,
        *audio, "-shortest", args.output,
    ]
    return cmd


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("input", help="Clip de entrada (mp4, mov, webm...)")
    p.add_argument("-o", "--output", required=True, help="Video de salida")
    p.add_argument("--mode", choices=["alpha", "replace", "matte"],
                   default="alpha", help="Modo de salida (alpha por defecto)")
    p.add_argument("--bg-color", default="00FF00",
                   help="Color de fondo en modo replace, RRGGBB (verde)")
    p.add_argument("--bg-image", help="Imagen de fondo en modo replace")
    p.add_argument("--alpha-codec", choices=["vp9", "prores"], default="vp9",
                   help="Códec para modo alpha (vp9 WebM por defecto)")
    p.add_argument("--model", default=DEFAULT_MODEL,
                   help="Pesos ONNX de RVM")
    p.add_argument("--width", type=int, default=640,
                   help="Ancho de procesado del modelo (640 por defecto)")
    p.add_argument("--downsample-ratio", type=float, default=1.0,
                   help="Reducción interna del modelo. Defecto 1: en este "
                        "ONNX, cualquier valor distinto de 1 es 15-40x más "
                        "lento en onnxruntime CPU (medido 16-nov-2026). "
                        "No lo subas buscando velocidad.")
    p.add_argument("--threads", type=int, default=2,
                   help="Hilos de onnxruntime (2 por defecto: en esta VM "
                        "compartida más hilos giran en vacío bajo carga)")
    args = p.parse_args()

    if not os.path.isfile(args.input):
        print(f"ERROR: no existe {args.input}", file=sys.stderr)
        return 1
    if args.mode == "replace" and args.bg_image and not os.path.isfile(args.bg_image):
        print(f"ERROR: no existe {args.bg_image}", file=sys.stderr)
        return 1
    ensure_model(args.model)

    # Import tardío: onnxruntime tarda ~1 s en cargar.
    import onnxruntime as ort

    so = ort.SessionOptions()
    if args.threads > 0:
        so.intra_op_num_threads = args.threads
    # Sin esto, la arena de onnxruntime crece sin control con las formas
    # dinámicas de este grafo y puede comerse 3 GB en esta VM (medido
    # 16-nov-2026: dos arenas de 2,0 GB + 1,0 GB). Desactivarla acota la
    # memoria a ~0,5-1 GB sin coste de velocidad apreciable.
    so.enable_cpu_mem_arena = False
    session = ort.InferenceSession(
        args.model, sess_options=so, providers=["CPUExecutionProvider"]
    )

    cap = cv2.VideoCapture(args.input)
    if not cap.isOpened():
        print(f"ERROR: no se puede abrir {args.input}", file=sys.stderr)
        return 1
    w_in = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h_in = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    pw, ph = proc_size(w_in, h_in, args.width)
    bg = load_background(args, w_in, h_in) if args.mode == "replace" else None

    proc = subprocess.Popen(ffmpeg_cmd(args, w_in, h_in, fps),
                            stdin=subprocess.PIPE)
    rec = [np.zeros((1, c, 1, 1), dtype=np.float32) for c in REC_CHANNELS]
    dsr = np.array([args.downsample_ratio], dtype=np.float32)

    t0 = time.perf_counter()
    n = 0
    alpha_sum = 0.0
    print(f"RVM {os.path.basename(args.model)} | {w_in}x{h_in} @{fps:.2f}fps "
          f"-> procesado {pw}x{ph}, downsample {args.downsample_ratio:g}, "
          f"modo {args.mode}")
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        small = cv2.resize(frame, (pw, ph), interpolation=cv2.INTER_AREA)
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        src = np.transpose(rgb, (2, 0, 1))[None]
        fgr, pha, *rec = session.run(
            None,
            {"src": src, "r1i": rec[0], "r2i": rec[1],
             "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dsr},
        )
        pha_full = cv2.resize(pha[0, 0], (w_in, h_in),
                              interpolation=cv2.INTER_LINEAR)
        alpha_sum += float(pha_full.mean())
        if args.mode == "matte":
            out = (np.clip(pha_full, 0, 1) * 255).astype(np.uint8)
            out = cv2.cvtColor(out, cv2.COLOR_GRAY2BGR)
        else:
            fgr_full = cv2.resize(np.transpose(fgr[0], (1, 2, 0)),
                                  (w_in, h_in),
                                  interpolation=cv2.INTER_LINEAR)
            fgr_bgr = cv2.cvtColor(
                (np.clip(fgr_full, 0, 1) * 255).astype(np.uint8),
                cv2.COLOR_RGB2BGR)
            a = np.clip(pha_full, 0, 1)[..., None]
            if args.mode == "replace":
                out = (fgr_bgr * a + bg * (1.0 - a)).astype(np.uint8)
            else:  # alpha: BGRA
                alpha_ch = (np.clip(pha_full, 0, 1) * 255).astype(np.uint8)
                out = np.dstack([fgr_bgr, alpha_ch])
        try:
            proc.stdin.write(out.tobytes())
        except BrokenPipeError:
            proc.wait()
            print("ERROR: ffmpeg cerró el pipe (código "
                  f"{proc.returncode}); revisa el mensaje de ffmpeg arriba",
                  file=sys.stderr)
            return 1
        n += 1
        if n % 30 == 0:
            el = time.perf_counter() - t0
            print(f"  {n}/{total} fotogramas ({n / el:.2f} fps)", flush=True)
    cap.release()
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        print("ERROR: ffmpeg falló al codificar la salida", file=sys.stderr)
        return 1

    dt = time.perf_counter() - t0
    mean_alpha = alpha_sum / max(n, 1)
    size_mb = os.path.getsize(args.output) / 1e6
    print(f"OK: {n} fotogramas en {dt:.0f}s ({n / dt:.2f} fps), "
          f"alfa medio {mean_alpha:.1%}, {size_mb:.1f} MB -> {args.output}")
    if mean_alpha < 0.02:
        print("AVISO: alfa medio <2%: casi no hay persona en el clip; "
              "revisa que haya una persona prominente en plano.")
    if mean_alpha > 0.98:
        print("AVISO: alfa medio >98%: casi todo es persona; el fondo "
              "puede no haberse separado.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
