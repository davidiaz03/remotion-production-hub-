#!/usr/bin/env python3
"""
Encuadre con detección de caras para el hub de contenido estático.

Detecta la cara protagonista de una foto (YuNet, OpenCV) y:
  (a) sugiere el `image_position` CSS para que la cara quede en la zona
      libre de texto del layout `background` del carrusel: cara en los
      dos tercios superiores, texto en el tercio inferior (regla universal
      de la investigación en Instagram, ver content/RESEARCH.md);
  (b) avisa si una cara detectada se solapa con el bloque de texto o con
      la banda del kicker, o si queda cortada o demasiado pequeña.

Uso:
  # Una foto: informe humano + JSON
  face-frame.py foto.jpg --canvas 1080x1350 --text-top 780
  # Una pieza entera (usa la geometría de la plantilla y el formato de data.json)
  face-frame.py --piece trump-cuba-noviembre [--format 4:5] [--apply] [--json]

Una lámina con `"face_check": false` en data.json se omite del chequeo
(solo para planos generales sin retrato: un tablero de votación con
público de fondo hace fallar el detector en falso con caras diminutas
de fondo). La omisión es explícita por lámina y la revisión visual del
PNG sigue siendo obligatoria.

Requiere el venv del hub (cv2 5.x; el python3 del sistema no tiene cv2):
  ~/workspace/remotion-hub/.venv/bin/python content/scripts/face-frame.py ...

El modelo YuNet (face_detection_yunet_2023mar.onnx, 232 KB, Apache-2.0,
OpenCV Zoo) se descarga solo la primera vez a
~/workspace/remotion-hub/.yunet/ (o la ruta de $YUNET_MODEL).

Criterio de encuadre: la cara COMPLETA (caja detectada + margen de
barbilla del 25% de su altura) debe quedar por encima de la zona de
texto, y los ojos por debajo de la banda del kicker. Los landmarks de
YuNet NO se usan: en cv2 5.0 salen incoherentes (valores fuera de la
caja); la caja + margen es lo fiable. Detección multiescala (1.0, 0.5,
0.33): a escala completa YuNet subestima las caras grandes (el retrato
oficial de Trump de enero-2025 da 420x515 a escala 1.0 pero 828x1152
a escala 0.33). Si la cara no cabe entera en la zona libre (retratos
muy ajustados), el script avisa: cambiar de foto (plano más abierto),
de layout, o acolcharla con letterbox.py (barras negras).

Geometría (debe coincidir con templates/carousel/template.html):
  formato square (1080x1080): texto desde y=640, kicker 0-130
  formato 4:5   (1080x1350): texto desde y=780, kicker 0-130
La cara protagonista es la de mayor área; si hay más caras en el encuadre
se informa pero no se encuadra por ellas.

--face-box x,y,w,h (solo para pruebas): inyecta una cara sintética en
coordenadas de imagen y salta la detección.
"""
import argparse
import json
import math
import os
import sys
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------- constantes

MODEL_URL = ("https://github.com/opencv/opencv_zoo/raw/main/models/"
             "face_detection_yunet/face_detection_yunet_2023mar.onnx")
MODEL_NAME = "face_detection_yunet_2023mar.onnx"
DEFAULT_MODEL_DIR = Path.home() / "workspace" / "remotion-hub" / ".yunet"

# Geometría del layout `background` del carrusel por formato.
# text_top = y (px) donde empieza el bloque de texto; kicker_h = altura de
# la banda superior (kicker + numeración). Deben coincidir con el CSS.
GEOMETRY = {
    "carousel": {
        "square": {"canvas": (1080, 1080), "text_top": 640, "kicker_h": 130},
        "4:5": {"canvas": (1080, 1350), "text_top": 780, "kicker_h": 130},
    },
}

# Dónde debe quedar el centro de la cara (fracción de la altura del lienzo)
# cuando la cara cabe holgada en la zona libre.
TARGET_FACE_Y = 0.38
# Margen de barbilla: la caja de YuNet corta a veces la mandíbula; se exige
# este margen extra por debajo de la caja antes de la zona de texto.
CHIN_MARGIN = 0.25
# Umbrales de YuNet a probar, del más estricto al más laxo (el retrato
# oficial de Trump de enero-2025 solo se detecta con 0.3).
SCORE_THRESHOLDS = (0.6, 0.4, 0.3)
# Escalas de detección: YuNet a escala completa subestima las caras que
# ocupan gran parte del encuadre (ver nota en la cabecera).
DETECT_SCALES = (1.0, 0.5, 0.33)


def model_path():
    if os.environ.get("YUNET_MODEL"):
        return Path(os.environ["YUNET_MODEL"])
    return DEFAULT_MODEL_DIR / MODEL_NAME


def ensure_model():
    """Descarga el modelo YuNet si no está; devuelve su ruta o lanza error."""
    p = model_path()
    if p.exists() and p.stat().st_size > 100_000:
        return p
    p.parent.mkdir(parents=True, exist_ok=True)
    print(f"Descargando modelo YuNet a {p} ...", file=sys.stderr)
    try:
        urllib.request.urlretrieve(MODEL_URL, p)
    except Exception as e:  # noqa: BLE001 - el mensaje explica la salida manual
        raise SystemExit(
            f"No se pudo descargar el modelo YuNet ({e}). Descárgalo a mano:\n"
            f"  curl -L -o {p} {MODEL_URL}") from e
    if p.stat().st_size < 100_000:
        raise SystemExit(f"Descarga incompleta del modelo YuNet ({p.stat().st_size} bytes)")
    return p


def _iou(a, b):
    """Intersección sobre unión de dos cajas (x, y, w, h)."""
    ax2, ay2 = a[0] + a[2], a[1] + a[3]
    bx2, by2 = b[0] + b[2], b[1] + b[3]
    iw = max(0.0, min(ax2, bx2) - max(a[0], b[0]))
    ih = max(0.0, min(ay2, by2) - max(a[1], b[1]))
    inter = iw * ih
    union = a[2] * a[3] + b[2] * b[3] - inter
    return inter / union if union else 0.0


def detect_faces(img):
    """Devuelve [(x, y, w, h)] en px de imagen, ordenadas por área (mayor primero).

    Detección multiescala: se detecta a escala 1.0, 0.5 y 0.33 (con la
    escalera de umbrales en cada una) y la protagonista es la caja de
    mayor área de todas las escalas. Las demás caras son las de la escala
    con más detecciones, sin duplicar la protagonista (IoU > 0.5).
    """
    import cv2  # importado aquí: solo existe en el venv del hub

    model = str(ensure_model())
    h, w = img.shape[:2]
    best = None
    most_faces = []
    for scale in DETECT_SCALES:
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        small = img if scale == 1.0 else cv2.resize(img, (nw, nh))
        for th in SCORE_THRESHOLDS:
            det = cv2.FaceDetectorYN.create(model, "", (nw, nh))
            det.setScoreThreshold(th)
            _, faces = det.detect(small)
            if faces is not None and len(faces):
                boxes = sorted(
                    (tuple(float(v) / scale for v in f[:4]) for f in faces),
                    key=lambda b: b[2] * b[3], reverse=True)
                if len(boxes) > len(most_faces):
                    most_faces = boxes
                if best is None or boxes[0][2] * boxes[0][3] > best[2] * best[3]:
                    best = boxes[0]
                break
    if best is None:
        return []
    others = [b for b in most_faces if _iou(b, best) <= 0.5]
    return [best] + others


# ------------------------------------------------------------ geometría cover

def cover_map(iw, ih, cw, ch, px, py):
    """object-fit: cover. Devuelve (escala, offset_x, offset_y) en px de lienzo."""
    s = max(cw / iw, ch / ih)
    return s, (cw - iw * s) * px, (ch - ih * s) * py


def face_to_canvas(box, s, ox, oy):
    x, y, w, h = box
    return (x * s + ox, y * s + oy, w * s, h * s)


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def suggest_position(box, iw, ih, cw, ch, text_top, kicker_h):
    """image_position (px, py) en [0,1] para la cara en la zona libre.

    Estrategia: centrar la cara en el 38% de la altura, salvo que eso deje
    la barbilla (caja + margen) dentro de la zona de texto; entonces subir
    la cara hasta que la barbilla quede 10 px por encima del texto. Si no
    hay recorrido vertical para conseguirlo, devuelve la mejor posición
    posible y fit=False (hay que cambiar de foto o de layout).
    """
    cx, cy = box[0] + box[2] / 2, box[1] + box[3] / 2
    s = max(cw / iw, ch / ih)
    dw, dh = iw * s, ih * s
    # Menos de 1 px de recorrido = sin recorrido (evita posiciones extremas
    # por redondeo cuando la foto casi coincide con el lienzo).
    px = 0.5 if dw <= cw + 1 else (0.5 * cw - cx * s) / (cw - dw)
    px = clamp(px)
    if dh <= ch + 1:
        # Sin recorrido vertical (la foto tiene la misma proporción que el
        # lienzo): la posición vertical no cambia nada. Comprobar si la
        # cara cabe tal cual (oy = 0).
        chin_canvas = ((box[1] + box[3]) + CHIN_MARGIN * box[3]) * s
        eyes_canvas = (box[1] + 0.30 * box[3]) * s
        fit = chin_canvas <= text_top and eyes_canvas >= kicker_h + 10
        return px, 0.5, fit
    # py que centra la cara en TARGET_FACE_Y.
    py_center = (TARGET_FACE_Y * ch - cy * s) / (ch - dh)
    # py que deja la barbilla (caja + margen) 10 px sobre el texto.
    chin_img = (box[1] + box[3]) + CHIN_MARGIN * box[3]
    py_fit = ((text_top - 10) - chin_img * s) / (ch - dh)
    # py mayor = cara más arriba en el lienzo. Si el centrado ya cumple,
    # usarlo; si no, subir hasta el ajuste (sin pasar de 1).
    py = clamp(max(py_center, py_fit))
    # Comprobar el resultado: barbilla y ojos.
    oy = (ch - dh) * py
    chin_canvas = chin_img * s + oy
    eyes_canvas = (box[1] + 0.30 * box[3]) * s + oy
    fit = chin_canvas <= text_top and eyes_canvas >= kicker_h + 10
    return px, py, fit


def check_face(fc, cw, ch, text_top, kicker_h):
    """Avisos de una cara ya mapeada a coordenadas de lienzo."""
    x, y, w, h = fc
    warnings = []
    chin = y + h + CHIN_MARGIN * h
    eyes = y + 0.30 * h
    if chin > text_top:
        warnings.append(
            f"cara en la zona de texto (la barbilla llega a y={chin:.0f}px, "
            f"texto desde y={text_top}px)")
    if eyes < kicker_h:
        warnings.append(
            f"ojos bajo la banda del kicker (ojos a y={eyes:.0f}px, "
            f"kicker hasta y={kicker_h}px)")
    if x < 0 or y < 0 or x + w > cw or y + h > ch:
        clipped = []
        if x < 0:
            clipped.append(f"izquierda {-x:.0f}px")
        if x + w > cw:
            clipped.append(f"derecha {x + w - cw:.0f}px")
        if y < 0:
            clipped.append(f"arriba {-y:.0f}px")
        if y + h > ch:
            clipped.append(f"abajo {y + h - ch:.0f}px")
        warnings.append(f"cara cortada por el borde ({', '.join(clipped)})")
    if h < 0.12 * ch:
        warnings.append(f"cara pequeña ({h / ch:.0%} de la altura del lienzo)")
    return warnings


def parse_position(text, default=(0.5, 0.3)):
    """'50% 25%' -> (0.5, 0.25)."""
    if not text:
        return default
    try:
        parts = text.replace("%", "").split()
        return (float(parts[0]) / 100, float(parts[1]) / 100)
    except (ValueError, IndexError):
        return default


def fmt_position(px, py):
    return f"{round(px * 100)}% {round(py * 100)}%"


# ------------------------------------------------------------------ análisis

def analyse_image(img_path, canvas, text_top, kicker_h, face_box=None,
                  current_pos=None):
    """Análisis de una foto. Devuelve un dict con caras, sugerencia y avisos."""
    import cv2  # noqa: F401 - necesario para leer la imagen (y el detector)

    img = cv2.imread(str(img_path))
    if img is None:
        raise SystemExit(f"No se pudo leer la imagen: {img_path}")
    ih, iw = img.shape[:2]
    cw, ch = canvas
    if face_box is not None:
        boxes = [tuple(float(v) for v in face_box)]
    else:
        boxes = detect_faces(img)
    result = {
        "image": str(img_path),
        "size": [iw, ih],
        "faces_found": len(boxes),
        "faces": [],
        "subject": None,
        "suggested_position": None,
        "warnings": [],
    }
    if not boxes:
        result["warnings"].append(
            "sin cara detectada: encuadre manual (image_position por defecto "
            "50% 30%; verificar a ojo)")
        return result
    for box in boxes:
        result["faces"].append({
            "box": [round(v, 1) for v in box],
            "center_frac": [round((box[0] + box[2] / 2) / iw, 3),
                            round((box[1] + box[3] / 2) / ih, 3)],
            "height_frac": round(box[3] / ih, 3),
        })
    subject = boxes[0]
    result["subject"] = result["faces"][0]
    if len(boxes) > 1:
        result["warnings"].append(
            f"{len(boxes)} caras en el encuadre; se encuadra por la mayor "
            f"(las demás son fondo)")
    px, py, fit = suggest_position(subject, iw, ih, cw, ch, text_top, kicker_h)
    result["suggested_position"] = fmt_position(px, py)
    if not fit:
        result["warnings"].append(
            "la cara NO cabe entera en la zona libre ni con el mejor encuadre "
            "(retrato demasiado ajustado): cambiar de foto (plano más abierto), "
            "de layout, o acolcharla con letterbox.py")
    # Comprobación con la posición actual (si se dio) y con la sugerida.
    positions = [("sugerida", (px, py))]
    if current_pos is not None:
        positions.insert(0, ("actual", current_pos))
    for label, (qx, qy) in positions:
        if qx is None:
            continue
        s, ox, oy = cover_map(iw, ih, cw, ch, qx, qy)
        fc = face_to_canvas(subject, s, ox, oy)
        ws = check_face(fc, cw, ch, text_top, kicker_h)
        for w in ws:
            result["warnings"].append(f"[{label} {fmt_position(qx, qy)}] {w}")
    return result


def report_human(result, label=""):
    lines = [f"{label} {result['image']} ({result['size'][0]}x{result['size'][1]})"
             .strip()]
    if result["faces_found"] == 0:
        lines.append("  cara: NO DETECTADA")
    else:
        sub = result["subject"]
        lines.append(
            f"  cara: centro {sub['center_frac'][0]:.0%} x "
            f"{sub['center_frac'][1]:.0%} de la foto, alto {sub['height_frac']:.0%}"
            + (f" ({result['faces_found']} caras en total)" if result["faces_found"] > 1 else ""))
        lines.append(f"  sugerencia image_position: {result['suggested_position']}")
    for w in result["warnings"]:
        lines.append(f"  ! {w}")
    return "\n".join(lines)


# ---------------------------------------------------------------------- main

def main(argv=None):
    ap = argparse.ArgumentParser(description="Encuadre con detección de caras (YuNet).")
    ap.add_argument("image", nargs="?", help="Foto a analizar (modo foto suelta).")
    ap.add_argument("--canvas", default="1080x1350",
                    help="Lienzo WxH (defecto 1080x1350, formato 4:5).")
    ap.add_argument("--text-top", type=int, default=780,
                    help="Y (px) donde empieza el bloque de texto (defecto 780).")
    ap.add_argument("--kicker", type=int, default=130,
                    help="Altura de la banda del kicker (defecto 130).")
    ap.add_argument("--position", default=None,
                    help="Posición actual a comprobar, p. ej. '50% 30%%'.")
    ap.add_argument("--face-box", default=None,
                    help="Cara sintética x,y,w,h (solo pruebas; salta la detección).")
    ap.add_argument("--piece", default=None,
                    help="Analizar todas las fotos de una pieza (pieces/<slug>/).")
    ap.add_argument("--format", dest="fmt", default=None,
                    help="Formato del carrusel: square o 4:5 (defecto: el de data.json).")
    ap.add_argument("--apply", action="store_true",
                    help="Escribir image_position sugerido en data.json (modo --piece).")
    ap.add_argument("--json", action="store_true", help="Salida JSON.")
    args = ap.parse_args(argv)

    if args.piece:
        return piece_mode(args)
    if not args.image:
        ap.error("falta la foto o --piece")
    cw, ch = (int(v) for v in args.canvas.lower().split("x"))
    face_box = None
    if args.face_box:
        face_box = [float(v) for v in args.face_box.split(",")]
        if len(face_box) != 4:
            ap.error("--face-box necesita x,y,w,h")
    current = parse_position(args.position) if args.position else None
    result = analyse_image(args.image, (cw, ch), args.text_top, args.kicker,
                           face_box=face_box, current_pos=current)
    print(json.dumps(result, indent=2, ensure_ascii=False) if args.json
          else report_human(result))
    return 0


def piece_mode(args):
    root = Path(__file__).resolve().parent.parent
    piece_dir = root / "pieces" / args.piece
    data_file = piece_dir / "data.json"
    if not data_file.exists():
        raise SystemExit(f"Pieza sin data.json: {args.piece}")
    data = json.loads(data_file.read_text(encoding="utf-8"))
    fmt = args.fmt or data.get("format", "square")
    geo = GEOMETRY["carousel"].get(fmt)
    if not geo:
        raise SystemExit(f"Formato desconocido: {fmt} (square o 4:5)")
    cw, ch = geo["canvas"]
    results = []
    changed = False
    for i, page in enumerate(data.get("pages", [])):
        if i == 0 or i == len(data["pages"]) - 1:
            continue  # portada y cierre no llevan foto de fondo
        image = page.get("image")
        if not image:
            continue
        if page.get("image_layout") not in (None, "background"):
            continue  # band/side no ponen texto sobre la foto
        if page.get("face_check") is False:
            # Plano general sin retrato (p. ej. tablero de votación con
            # público de fondo): el detector caza caras diminutas de fondo
            # y falla en falso. La omisión es explícita por lámina y la
            # revisión visual del PNG sigue siendo obligatoria.
            results.append({"page": i + 1,
                            "skipped": "face_check: false — plano general sin retrato"})
            continue
        img_path = piece_dir / image
        current = parse_position(page.get("image_position"))
        result = analyse_image(img_path, (cw, ch), geo["text_top"],
                               geo["kicker_h"], current_pos=current)
        result["page"] = i + 1
        results.append(result)
        if args.apply and result["suggested_position"]:
            new_pos = result["suggested_position"]
            if page.get("image_position") != new_pos:
                page["image_position"] = new_pos
                changed = True
    if args.json:
        print(json.dumps({"format": fmt, "pages": results}, indent=2, ensure_ascii=False))
    else:
        print(f"Pieza {args.piece} — formato {fmt} ({cw}x{ch}), texto desde y={geo['text_top']}")
        for r in results:
            print(report_human(r, label=f"Lámina {r['page']}:"))
    if args.apply and changed:
        data_file.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        print("data.json actualizado con las posiciones sugeridas.")
    elif args.apply:
        print("data.json sin cambios (las posiciones ya eran las sugeridas).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
