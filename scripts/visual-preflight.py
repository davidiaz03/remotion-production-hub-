#!/usr/bin/env python3
"""
Pre-vuelo visual automático (hub-speed-v5).

Detecta errores de composición ANTES del render completo: en la V4.1 de
marti-fidel, el fotograma muerto de S5 (f020), el punto de «EN VIVO»
recortado (f016) y el masthead tapado (f011) solo se vieron DESPUÉS de
~14 min de render + máster. Este pre-vuelo renderiza 1 still por escena
con `remotion still`, aplica chequeos por píxeles y reporta SOLO los
fotogramas con flags; el humano lee esos + una muestra de limpios.

Chequeos (umbrales calibrados sobre los 69 fotogramas V4.1 de
marti-fidel; ver docs/HUB-SPEED-V5-PREFLIGHT.md):

  dead-frame    WARN   >70% del fotograma vacío (rejilla 6x10: celda
                       vacía = std luminancia < 8 y densidad de bordes
                       < 0,005). Detecta la CONDICIÓN (fotograma casi
                       vacío); que sea defecto o pausa intencional
                       (tesis S9) lo decide el humano.
  edge-clipped  WARN   Elemento recortado por el borde: (a) fragmento
                       rojizo compacto en la banda superior junto al
                       borde izquierdo/derecho, sobre fondo oscuro
                       (el punto de «EN VIVO»); (b) componente
                       brillante que TOCA el borde con contraste
                       >= 40 respecto a su entorno (texto blanco
                       cortado). La zona del logo se excluye.
  text-on-face  BLOQ   Texto de overlay sobre una cara: caras YuNet
                       (mismo método que el ecosistema de memes, solo
                       score >= 0,6) + blobs de texto brillante/rojo
                       nítidos (gradiente medio en el borde >= 150)
                       agrupados en líneas de >= 3 letras, con solape
                       > 30% del blob sobre la cara (+25% barbilla).
  duplicate     BLOQ   Misma imagen entre escenas distintas (pHash
                       DCT 8x8): Hamming <= 6 bloqueante, 7-12 aviso.
                       Solo se comparan escenas DISTINTAS: fotogramas
                       consecutivos de la misma escena son casi
                       idénticos por naturaleza.
  logo-missing  BLOQ   El logotipo completo no está en su zona
                       (arriba derecha): plantilla-máscara del logo
                       construida desde un fotograma de referencia;
                       score = fracción de píxeles de la máscara
                       > fondo local + 15. Umbral 0,5. Las escenas
                       de logo/sting se excluyen por manifiesto.

Límites honestos (no se fingen):
  - El masthead tapado de f011 (retrato oval sobre la «L» de «LA
    REVISTA ILUSTRADA») es un problema de LAYOUT RELATIVO entre dos
    elementos: ningún chequeo por píxeles lo detecta. PENDIENTE:
    requeriría OCR + geometría de elementos declarada en el TSX.
  - El punto de «EN VIVO» en f014-f015 (a medio fundido) es demasiado
    tenue para el umbral rojo; se detecta desde f016. El still de
    pre-vuelo se toma en el punto medio de la escena, no en el
    fundido de entrada.
  - La cara tapada por el mapa en f036 (transición S6→S7, 1 fotograma)
    no se detecta: YuNet no ve cara tapada y el mapa no es texto.
    PENDIENTE: consistencia temporal (cara presente en los stills
    vecinos y ausente en este).

Uso:
  # Fotogramas ya extraídos (validación / auditoría post-render):
  visual-preflight.py --frames-dir projects/marti-fidel/out/frames-v41 \
      --manifest tests/fixtures/preflight-scenes-marti-fidel.json \
      --logo-ref projects/marti-fidel/out/frames-v41/f001.jpg

  # Stills por escena ANTES del render completo (usa el candado
  # compartido /tmp/hub-speed-v5-render.lock; ver docs):
  visual-preflight.py --stills --project marti-fidel \
      --manifest tests/fixtures/preflight-scenes-marti-fidel.json \
      --logo-ref <fotograma-con-logo.jpg>

  # Re-corrida incremental (solo las escenas cuyos insumos cambiaron;
  # ver docs/LONGFORM-PIPELINE-P0.md § P0-4):
  visual-preflight.py --stills --incremental --project marti-fidel \
      --manifest tests/fixtures/preflight-scenes-marti-fidel.json

  # Salida JSON máquina + informe legible:
  visual-preflight.py --frames-dir ... --json --out preflight.json

Códigos de salida: 0 = sin flags bloqueantes (avisos permitidos),
1 = hay flags bloqueantes, 2 = error de uso/entorno.

Manifiesto de escenas (JSON):
  {"project": "marti-fidel", "fps": 30,
   "scenes": [{"name": "S1", "start": 0, "end": 166, "frame": 83}, ...],
   "logo_skip_scenes": ["STING"]}
  `frame` es opcional: por defecto, punto medio de [start, end].
  En modo --frames-dir, cada fotograma fNNN se asigna a la escena que
  contiene el fotograma (NNN-1)*fps.

Requiere el venv del hub (cv2 5.x; el python3 del sistema no tiene cv2):
  ~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py ...
El modelo YuNet se descarga solo la primera vez a
~/workspace/remotion-hub/.yunet/ (o la ruta de $YUNET_MODEL).
"""
import argparse
import json
import math
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

# ---------------------------------------------------------------- constantes

# Candado compartido para trabajo pesado (renders incl. stills).
RENDER_LOCK = "/tmp/hub-speed-v5-render.lock"

# Fotograma muerto: fracción de celdas vacías en rejilla 6x10.
DEAD_GRID_COLS, DEAD_GRID_ROWS = 6, 10
DEAD_CELL_STD = 8.0
DEAD_CELL_EDGE = 0.005
DEAD_THRESHOLD = 0.70

# Fragmento rojizo junto al borde (punto de badge recortado).
EDGE_TOP_BAND = 0.12       # banda superior (fracción de alto)
EDGE_NEAR = 0.06           # «junto al borde» (fracción de ancho)
EDGE_RED_MIN_AREA = 30
EDGE_RED_MAX_AREA = 400
EDGE_RED_MIN_SIDE = 8
EDGE_RED_MAX_ASPECT = 2.0
EDGE_RED_MAX_FILL = 0.9
EDGE_RED_MAX_RING_LUM = 80  # fondo oscuro = gráfico; papel claro = textura
# Componente brillante tocando el borde.
EDGE_BRIGHT_MIN_AREA = 30
EDGE_BRIGHT_MAX_AREA = 2000
EDGE_BRIGHT_MIN_CONTRAST = 40

# Texto sobre cara.
FACE_MIN_SCORE = 0.6
FACE_CHIN_MARGIN = 0.25
TEXT_MIN_SHARPNESS = 150.0
TEXT_MIN_LINE_BLOBS = 3
TEXT_MIN_OVERLAP = 0.30

# Duplicados entre escenas (distancia de Hamming del pHash).
DUP_BLOCK = 6
DUP_WARN = 12

# Logo: zona por defecto (fracciones x0, y0, x1, y1) y umbral de score.
LOGO_ZONE_DEFAULT = (0.78, 0.015, 0.98, 0.135)
LOGO_BRIGHT = 200
LOGO_MIN_DELTA = 15
LOGO_MIN_SCORE = 0.5

# YuNet (mismo modelo/escalas/umbrales que memes/scripts/face-frame.py,
# rama work/meme-ecosystem-2026-11-18; aquí se exponen los scores para
# filtrar alucinaciones: ver _yunet_detect).
YUNET_URL = ("https://github.com/opencv/opencv_zoo/raw/main/models/"
             "face_detection_yunet/face_detection_yunet_2023mar.onnx")
YUNET_NAME = "face_detection_yunet_2023mar.onnx"
YUNET_SCALES = (1.0, 0.5, 0.33)
YUNET_THRESHOLDS = (0.6, 0.4, 0.3)
YUNET_MAX_FACE_HEIGHT_FRAC = 0.25  # caja mayor + score bajo = textura


def yunet_model_path():
    if os.environ.get("YUNET_MODEL"):
        return Path(os.environ["YUNET_MODEL"])
    return Path.home() / "workspace" / "remotion-hub" / ".yunet" / YUNET_NAME


def ensure_yunet_model():
    p = yunet_model_path()
    if p.exists() and p.stat().st_size > 100_000:
        return p
    p.parent.mkdir(parents=True, exist_ok=True)
    print(f"Descargando modelo YuNet a {p} ...", file=sys.stderr)
    try:
        urllib.request.urlretrieve(YUNET_URL, p)
    except Exception as e:  # noqa: BLE001
        raise SystemExit(
            f"No se pudo descargar el modelo YuNet ({e}). Descárgalo a mano:\n"
            f"  curl -L -o {p} {YUNET_URL}") from e
    if p.stat().st_size < 100_000:
        raise SystemExit(f"Descarga incompleta del modelo YuNet ({p.stat().st_size} bytes)")
    return p


# ------------------------------------------------------------------ caras
# Detección YuNet vendorizada de memes/scripts/face-frame.py (misma
# librería cv2.FaceDetectorYN, mismo modelo, mismas escalas y escalera
# de umbrales). Diferencias documentadas: (1) devuelve scores; (2) el
# pre-vuelo solo acepta score >= 0.6 (primer peldaño): con el coste
# asimétrico del pre-vuelo, una cara alucinada (bandera de Trinidad
# en f003, score 0,31; estrella del logo en f020, 0,53; palmeras en
# f067-f068, 0,31-0,49) genera falsos positivos en cascada, mientras
# que perder caras de 11 px en una multitud no cambia ningún veredicto
# (las protagonistas reales puntúan 0,91-0,93). Ver el doc de validación.

def _iou(a, b):
    ax2, ay2 = a[0] + a[2], a[1] + a[3]
    bx2, by2 = b[0] + b[2], b[1] + b[3]
    iw = max(0.0, min(ax2, bx2) - max(a[0], b[0]))
    ih = max(0.0, min(ay2, by2) - max(a[1], b[1]))
    inter = iw * ih
    union = a[2] * a[3] + b[2] * b[3] - inter
    return inter / union if union else 0.0


def yunet_detect(img):
    """[(x, y, w, h, score)] en px de imagen, mayor área primero."""
    import cv2

    model = str(ensure_yunet_model())
    h, w = img.shape[:2]
    best = None
    most_faces = []
    for scale in YUNET_SCALES:
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        small = img if scale == 1.0 else cv2.resize(img, (nw, nh))
        for th in YUNET_THRESHOLDS:
            det = cv2.FaceDetectorYN.create(model, "", (nw, nh))
            det.setScoreThreshold(th)
            _, faces = det.detect(small)
            if faces is not None and len(faces):
                boxes = sorted(
                    (tuple(float(v) / scale for v in f[:4]) + (float(f[-1]),)
                     for f in faces),
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


def filter_faces(faces, img_w, img_h, logo_zone):
    """Descarta alucinaciones: score bajo, centro en la zona del logo
    (la estrella se confunde con una cara sobre fondo claro), y cajas
    enormes de score bajo (texturas/llamas). Devuelve (aceptadas, dudosas)."""
    lx0, ly0, lx1, ly1 = logo_zone
    good, dubious = [], []
    for (x, y, w, h, s) in faces:
        cx, cy = (x + w / 2) / img_w, (y + h / 2) / img_h
        in_logo = lx0 <= cx <= lx1 and ly0 <= cy <= ly1
        huge_low = h > YUNET_MAX_FACE_HEIGHT_FRAC * img_h and s < FACE_MIN_SCORE
        if s < FACE_MIN_SCORE or in_logo or huge_low:
            dubious.append((x, y, w, h, s))
        else:
            good.append((x, y, w, h, s))
    return good, dubious


# ------------------------------------------------------------------- hash

def phash(gray):
    """pHash DCT 8x8 (64 bits, int). Sin dependencias extra."""
    import cv2
    import numpy as np

    small = cv2.resize(gray, (32, 32)).astype(np.float32)
    dct = cv2.dct(small)
    low = dct[:8, :8]
    med = float(np.median(low[1:, 1:]))
    h = 0
    for b in (low > med).flatten():
        h = (h << 1) | int(b)
    return h


def hamming(a, b):
    return bin(a ^ b).count("1")


# ---------------------------------------------------------------- chequeos

def check_dead_frame(gray, edges):
    """Fracción de celdas vacías en la rejilla."""
    h, w = gray.shape
    empty = 0
    for r in range(DEAD_GRID_ROWS):
        for c in range(DEAD_GRID_COLS):
            y0, y1 = r * h // DEAD_GRID_ROWS, (r + 1) * h // DEAD_GRID_ROWS
            x0, x1 = c * w // DEAD_GRID_COLS, (c + 1) * w // DEAD_GRID_COLS
            cell = gray[y0:y1, x0:x1]
            ed = edges[y0:y1, x0:x1]
            if cell.std() < DEAD_CELL_STD and (ed > 0).mean() < DEAD_CELL_EDGE:
                empty += 1
    return empty / (DEAD_GRID_COLS * DEAD_GRID_ROWS)


def _components(mask, lo, hi):
    import cv2

    n, _lab, stats, _c = cv2.connectedComponentsWithStats(
        mask.astype("uint8"), 8)
    return [(int(stats[i, 0]), int(stats[i, 1]), int(stats[i, 2]),
             int(stats[i, 3]), int(stats[i, 4]))
            for i in range(1, n) if lo <= stats[i, 4] <= hi]


def _in_logo_zone(x, y, w, h, img_w, img_h, logo_zone):
    lx0, ly0, lx1, ly1 = logo_zone
    cx, cy = (x + w / 2) / img_w, (y + h / 2) / img_h
    return lx0 <= cx <= lx1 and ly0 <= cy <= ly1


def check_edge_clipped(bgr, gray, logo_zone):
    """Fragmento rojizo junto al borde (banda sup.) o brillo tocando el
    borde con contraste. Devuelve lista de detalles legibles."""
    import cv2
    import numpy as np

    H, W = gray.shape
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    b, g, r = (bgr[:, :, i].astype(int) for i in (0, 1, 2))
    reddish = (r - g > 8) & (r - b > 8) & (hsv[:, :, 1] > 60)
    hits = []
    for (x, y, w, h, a) in _components(reddish, EDGE_RED_MIN_AREA,
                                       EDGE_RED_MAX_AREA):
        if (y + h / 2) > EDGE_TOP_BAND * H:
            continue
        if _in_logo_zone(x, y, w, h, W, H, logo_zone):
            continue
        if w < EDGE_RED_MIN_SIDE or h < EDGE_RED_MIN_SIDE:
            continue
        if max(w, h) / min(w, h) > EDGE_RED_MAX_ASPECT:
            continue
        if a / (w * h) >= EDGE_RED_MAX_FILL:
            continue  # bloque JPEG macizo, no un punto
        near_left = x < EDGE_NEAR * W
        near_right = x + w > (1 - EDGE_NEAR) * W
        if not (near_left or near_right):
            continue
        # Anillo: fondo oscuro = elemento gráfico; papel claro = textura.
        x0, y0 = max(0, x - 15), max(0, y - 15)
        x1, y1 = min(W, x + w + 15), min(H, y + h + 15)
        ring = gray[y0:y1, x0:x1].astype(float)
        m = np.ones(ring.shape, bool)
        m[y - y0:y + h - y0, x - x0:x + w - x0] = False
        if len(ring[m]) and float(np.median(ring[m])) > EDGE_RED_MAX_RING_LUM:
            continue
        side = "izquierdo" if near_left else "derecho"
        hits.append(
            f"fragmento rojizo junto al borde {side} "
            f"(x={x}-{x + w}, y={y}-{y + h}, {a}px) — posible elemento "
            f"recortado (p. ej. punto de badge)")
    bright = (gray > 200)
    for (x, y, w, h, a) in _components(bright, EDGE_BRIGHT_MIN_AREA,
                                       EDGE_BRIGHT_MAX_AREA):
        if _in_logo_zone(x, y, w, h, W, H, logo_zone):
            continue
        if not (x <= 0 or x + w >= W or y <= 0 or y + h >= H):
            continue
        x0, y0 = max(0, x - 12), max(0, y - 12)
        x1, y1 = min(W, x + w + 12), min(H, y + h + 12)
        ring = gray[y0:y1, x0:x1].copy()
        ring[y - y0:y + h - y0, x - x0:x + w - x0] = 0
        vals = ring[ring > 0]
        comp = gray[y:y + h, x:x + w][bright[y:y + h, x:x + w]]
        if not len(vals) or not len(comp):
            continue
        if float(np.median(comp)) - float(np.median(vals)) < EDGE_BRIGHT_MIN_CONTRAST:
            continue  # isla de papel claro, no texto cortado
        side = ("izquierdo" if x <= 0 else
                "derecho" if x + w >= W else
                "superior" if y <= 0 else "inferior")
        hits.append(
            f"elemento brillante tocando el borde {side} "
            f"(x={x}-{x + w}, y={y}-{y + h}, {a}px) — posible texto "
            f"cortado")
    return hits


def _text_blobs(bgr, gray, logo_zone):
    """Blobs de texto de overlay: componentes brillantes o rojo-texto
    con geometría de letra, nítidas (gradiente en el borde), agrupadas
    en líneas de >= 3. Devuelve [(x, y, w, h)]."""
    import cv2
    import numpy as np

    H, W = gray.shape
    b, g, r = (bgr[:, :, i].astype(int) for i in (0, 1, 2))
    bright = (gray > 210).astype(np.uint8)
    redtext = ((r > 150) & (r - g > 60) & (r - b > 40)).astype(np.uint8)
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx * gx + gy * gy)
    cands = []
    for mask in (bright, redtext):
        for (x, y, w, h, a) in _components(mask, 100, 6000):
            if not (15 <= h <= 110 and 8 <= w <= 700
                    and 0.15 <= w / h <= 8):
                continue
            if _in_logo_zone(x, y, w, h, W, H, logo_zone):
                continue
            # Nitidez: gradiente medio en el anillo de 1 px del borde de
            # la caja (dilatación 3x3 menos la caja). Un anillo más
            # ancho diluye la media con fondo plano y el texto real
            # (karaoke 377-822, sintético con contorno 178-357) caería
            # bajo el umbral; el contenido de foto mide 60-107.
            x0, y0 = max(0, x - 1), max(0, y - 1)
            x1, y1 = min(W, x + w + 1), min(H, y + h + 1)
            sub = mag[y0:y1, x0:x1]
            edge = np.ones(sub.shape, bool)
            edge[y - y0:y + h - y0, x - x0:x + w - x0] = False
            sharp = float(sub[edge].mean()) if edge.any() else 0.0
            if sharp < TEXT_MIN_SHARPNESS:
                continue  # contenido de foto (camisa, luces), no overlay
            cands.append((x, y, w, h))
    # Deduplicar (mismo objeto en ambas máscaras).
    dedup = []
    for c in sorted(cands, key=lambda b: b[2] * b[3], reverse=True):
        if all(_iou(c, d) <= 0.5 for d in dedup):
            dedup.append(c)
    # Agrupar en líneas horizontales: mismo centro-y (±15 px), altura
    # parecida (±30%), hueco horizontal < 3x altura.
    lines = []
    for c in sorted(dedup, key=lambda b: (b[1] + b[3] / 2, b[0])):
        placed = False
        for line in lines:
            lx, ly, lw, lh = line[-1]
            same_row = abs((c[1] + c[3] / 2) - (ly + lh / 2)) <= 15
            same_h = abs(c[3] - lh) <= 0.3 * max(c[3], lh)
            gap = c[0] - (lx + lw)
            if same_row and same_h and -5 <= gap <= 3 * max(c[3], lh):
                line.append(c)
                placed = True
                break
        if not placed:
            lines.append([c])
    text = []
    for line in lines:
        if len(line) >= TEXT_MIN_LINE_BLOBS:
            text.extend(line)
    return text


def check_text_on_face(bgr, gray, faces, logo_zone):
    """Blobs de texto que solapan una cara (>30% del blob)."""
    if not faces:
        return []
    blobs = _text_blobs(bgr, gray, logo_zone)
    hits = []
    for (fx, fy, fw, fh, _s) in faces:
        fh2 = fh * (1 + FACE_CHIN_MARGIN)
        n = 0
        for (x, y, w, h) in blobs:
            ix = max(0, min(fx + fw, x + w) - max(fx, x))
            iy = max(0, min(fy + fh2, y + h) - max(fy, y))
            if ix * iy > TEXT_MIN_OVERLAP * w * h:
                n += 1
        if n:
            hits.append(
                f"{n} letra(s) de overlay sobre la cara "
                f"(x={fx:.0f}-{fx + fw:.0f}, y={fy:.0f}-{fy + fh:.0f})")
    return hits


def build_logo_mask(ref_path, logo_zone):
    """Máscara del logo desde un fotograma de referencia: píxeles
    brillantes dentro de la zona. Devuelve (mask bool, zone px)."""
    import cv2

    g = cv2.imread(str(ref_path), cv2.IMREAD_GRAYSCALE)
    if g is None:
        raise SystemExit(f"No se pudo leer el fotograma de referencia: {ref_path}")
    H, W = g.shape
    x0, y0, x1, y1 = (int(logo_zone[0] * W), int(logo_zone[1] * H),
                      int(logo_zone[2] * W), int(logo_zone[3] * H))
    zone = g[y0:y1, x0:x1]
    mask = zone > LOGO_BRIGHT
    if mask.sum() < 200:
        raise SystemExit(
            f"La referencia {ref_path} no tiene logo brillante en la zona "
            f"{logo_zone} ({int(mask.sum())} px): revisa --logo-ref/--logo-zone")
    return mask, (x0, y0, x1, y1)


def check_logo(gray, logo_mask, logo_box):
    """Score = fracción de píxeles de la máscara > fondo local + 15.
    El fondo local (mediana fuera de la máscara) hace el chequeo
    robusto a logos atenuados por el etalonaje de la escena."""
    import numpy as np

    x0, y0, x1, y1 = logo_box
    z = gray[y0:y1, x0:x1].astype(float)
    bg = float(np.median(z[~logo_mask]))
    vals = z[logo_mask]
    return float((vals > bg + LOGO_MIN_DELTA).mean()), bg


# ---------------------------------------------------------------- manifiesto

def load_manifest(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    scenes = data.get("scenes") or []
    if not scenes:
        raise SystemExit(f"Manifiesto sin escenas: {path}")
    fps = data.get("fps", 30)
    for s in scenes:
        s.setdefault("frame", (s["start"] + s["end"]) // 2)
    return data


def scene_of_frame(frame_no, scenes):
    for s in scenes:
        if s["start"] <= frame_no <= s["end"]:
            return s["name"]
    return "?"


# ------------------------------------------------------- incremental
# Pre-vuelo incremental (23-nov-2026, LONGFORM-PIPELINE-P0 P0-4): una
# re-corrida tras corregir UNA escena re-renderizaba los 28 stills
# (~4-5 min). Con --incremental, cada escena tiene un hash de sus
# insumos (componente, entrada de timeline, captions de su rango,
# assets referenciados, archivos compartidos, configuración de
# análisis); si el hash coincide con la caché y el still en disco
# sigue intacto, se reutilizan still + análisis. CONSERVADOR: ante
# cualquier duda (un insumo no resoluble, un archivo ausente, un
# formato inesperado) el hash es None y la escena se re-renderiza
# siempre. Un still rancio que ocultara un defecto nuevo sería peor
# que un pre-vuelo lento.

CACHE_VERSION = 1
CACHE_NAME = ".preflight-cache.json"


def sha256_file(path):
    import hashlib

    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _canon(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"))


def kebab_to_pascal(name):
    return "".join(p[:1].upper() + p[1:]
                   for p in name.replace("_", "-").split("-") if p)


def scene_type_of(manifest_scene, timeline_scenes, idx):
    """Tipo de escena: el de la entrada de timeline (misma posición),
    o el sufijo del nombre del manifiesto ("S13-document-quote")."""
    if (timeline_scenes is not None and 0 <= idx < len(timeline_scenes)
            and isinstance(timeline_scenes[idx], dict)
            and timeline_scenes[idx].get("type")):
        return str(timeline_scenes[idx]["type"])
    name = manifest_scene.get("name", "")
    parts = name.split("-", 1)
    return parts[1] if len(parts) == 2 and parts[1] else None


def _collect_src_files(src_dir, exclude_names):
    exts = {".ts", ".tsx", ".js", ".jsx", ".mts", ".json"}
    out = []
    if not src_dir.is_dir():
        return out
    for p in sorted(src_dir.rglob("*")):
        if not p.is_file() or p.suffix not in exts:
            continue
        if p.name in exclude_names or p.suffix == ".bak":
            continue
        out.append(p)
    return out


def collect_shared_hash(project_dir, per_type_files):
    """Hash de los archivos src/ que afectan a TODAS las escenas
    (Video.tsx, theme, SceneShell, Watermark...): todo src/ menos los
    componentes por tipo y menos timeline/captions (que se hashean
    por escena). None si src/ no existe."""
    src_dir = Path(project_dir) / "src"
    if not src_dir.is_dir():
        return None
    import hashlib

    exclude = {p.name for p in per_type_files}
    exclude |= {"timeline.json", "captions.json", "captions.ts"}
    parts = []
    for p in _collect_src_files(src_dir, exclude):
        parts.append([str(p.relative_to(src_dir)), sha256_file(p)])
    return hashlib.sha256(_canon(parts).encode()).hexdigest()


def captions_in_range(captions_path, fps, start_frame, end_frame):
    """Palabras de captions.json (HubCaption[]) cuyo inicio cae en el
    rango de fotogramas de la escena. None si no hay captions.json."""
    if not captions_path.is_file():
        return None
    try:
        caps = json.loads(captions_path.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return None
    if not isinstance(caps, list):
        return None
    lo, hi = start_frame / fps * 1000, end_frame / fps * 1000
    return [[c.get("text"), c.get("startMs"), c.get("endMs"),
             bool(c.get("kw"))] for c in caps
            if isinstance(c, dict)
            and c.get("startMs") is not None
            and lo <= float(c["startMs"]) <= hi]


def referenced_assets(project_dir, timeline_entry):
    """(ruta, tamaño, mtime) de los assets bajo public/ que la entrada
    de timeline menciona. None si un asset mencionado no existe."""
    if not isinstance(timeline_entry, dict):
        return []
    public_dir = Path(project_dir) / "public"
    found = []
    missing = []

    def walk(obj):
        if isinstance(obj, str):
            cand = obj.strip().lstrip("/")
            for base in ("images/", "video/", "audio/", "public/"):
                if cand.startswith(base):
                    rel = cand[len("public/"):] if cand.startswith(
                        "public/") else cand
                    p = public_dir / rel
                    if not p.is_file():
                        missing.append(rel)
                    else:
                        st = p.stat()
                        found.append([rel, st.st_size, st.st_mtime_ns])
                    return
            return
        if isinstance(obj, dict):
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)

    walk(timeline_entry)
    if missing:
        return None
    found.sort()
    return found


def scene_input_hash(project_dir, manifest_scene, idx, timeline_scenes,
                     shared_hash, captions_path, captions_ts_path,
                     fps, logo_skip, logo_ref_hash, skip_faces,
                     logo_zone):
    """Hash de los insumos de UNA escena, o None si alguno no se puede
    resolver (entonces la escena se re-renderiza siempre)."""
    import hashlib

    if shared_hash is None:
        return None
    scene_type = scene_type_of(manifest_scene, timeline_scenes, idx)
    if not scene_type:
        return None
    comp = (Path(project_dir) / "src" / "components"
            / (kebab_to_pascal(scene_type) + ".tsx"))
    if not comp.is_file():
        return None
    timeline_entry = (timeline_scenes[idx]
                      if timeline_scenes is not None
                      and 0 <= idx < len(timeline_scenes) else None)
    assets = referenced_assets(project_dir, timeline_entry)
    if assets is None:
        return None
    caps = captions_in_range(captions_path, fps,
                             manifest_scene["start"], manifest_scene["end"])
    if caps is None:
        # Sin captions.json: el archivo captions.ts entero como insumo
        # compartido de la escena (un cambio de captions re-renderiza
        # todas las escenas, pero un cambio de componente sigue
        # reutilizando). Sin ninguno de los dos, no se puede hashear.
        if captions_ts_path.is_file():
            caps = ["ts", sha256_file(captions_ts_path)]
        else:
            return None
    parts = {
        "manifest": manifest_scene,
        "timeline": timeline_entry,
        "component": sha256_file(comp),
        "shared": shared_hash,
        "captions": caps,
        "assets": assets,
        "logo_skip": manifest_scene.get("name") in logo_skip,
        "logo_ref": logo_ref_hash,
        "skip_faces": bool(skip_faces),
        "logo_zone": list(logo_zone),
    }
    return hashlib.sha256(_canon(parts).encode()).hexdigest()


def load_cache(stills_dir):
    path = Path(stills_dir) / CACHE_NAME
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"version": CACHE_VERSION, "scenes": {}}
    if not isinstance(data, dict) or data.get("version") != CACHE_VERSION:
        return {"version": CACHE_VERSION, "scenes": {}}
    if not isinstance(data.get("scenes"), dict):
        data["scenes"] = {}
    return data


def save_cache(stills_dir, cache):
    path = Path(stills_dir) / CACHE_NAME
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=1)
                    + "\n", encoding="utf-8")


def clear_cache(stills_dir):
    try:
        (Path(stills_dir) / CACHE_NAME).unlink()
    except OSError:
        pass


def partition_scenes(manifest, stills_dir, hashes, cache):
    """(a_renderizar, reutilizadas): una escena se reutiliza solo si
    su hash coincide con la caché Y el still en disco sigue intacto
    (mismo sha256)."""
    to_render, reused = [], []
    cached = (cache or {}).get("scenes", {})
    for s in manifest["scenes"]:
        name = s["name"]
        entry = cached.get(name)
        still = Path(stills_dir) / f"{name}.jpg"
        if (hashes.get(name) is not None and entry is not None
                and entry.get("input_hash") == hashes[name]
                and still.is_file()
                and sha256_file(still) == entry.get("still_sha256")):
            reused.append(name)
        else:
            to_render.append(name)
    return to_render, reused


# ------------------------------------------------------------------- stills

def acquire_lock():
    """Candado compartido hub-speed-v5 (mkdir atómico). Sin timeout:
    el protocolo del proyecto es esperar al hermano que renderiza."""
    lock = Path(RENDER_LOCK)
    waited = 0
    while True:
        try:
            lock.mkdir()
            return
        except FileExistsError:
            if waited % 60 == 0:
                print(f"[preflight] esperando candado {RENDER_LOCK} "
                      f"({waited}s)...", file=sys.stderr)
            time.sleep(20)
            waited += 20


def release_lock():
    try:
        Path(RENDER_LOCK).rmdir()
    except OSError:
        pass


def render_stills(repo_root, project_id, manifest, stills_dir,
                  bundle_cache=True):
    """1 still por escena con `remotion still` (CLI, como render-chunks).
    Devuelve [(scene_name, frame_no, path)]."""
    import json as _json

    project_dir = Path(repo_root) / "projects" / project_id
    project_json = _json.loads((project_dir / "project.json").read_text())
    composition = project_json["compositionId"]
    entry = project_dir / "src" / "index.ts"
    public_dir = project_dir / "public"
    cli = Path(repo_root) / "node_modules" / "@remotion" / "cli" / "remotion-cli.js"
    for p, label in ((entry, "entry"), (public_dir, "public"),
                     (cli, "CLI de Remotion")):
        if not p.exists():
            raise SystemExit(f"Modo stills: falta {label}: {p}")
    stills_dir = Path(stills_dir)
    stills_dir.mkdir(parents=True, exist_ok=True)
    out = []
    acquire_lock()
    try:
        for s in manifest["scenes"]:
            target = stills_dir / f"{s['name']}.jpg"
            cmd = ["node", str(cli), "still", str(entry), composition,
                   str(target), "--frame", str(s["frame"]),
                   "--public-dir", str(public_dir),
                   "--image-format", "jpeg", "--jpeg-quality", "85",
                   "--log", "warn", "--overwrite"]
            if bundle_cache:
                cmd.append("--bundle-cache")
            print(f"[preflight] still {s['name']} (fotograma {s['frame']})...",
                  file=sys.stderr)
            r = subprocess.run(cmd, cwd=str(repo_root),
                               capture_output=True, text=True)
            if r.returncode != 0 or not target.exists():
                raise SystemExit(
                    f"Falló el still de {s['name']} (fotograma {s['frame']}):\n"
                    f"{r.stdout[-2000:]}\n{r.stderr[-2000:]}")
            out.append((s["name"], s["frame"], target))
    finally:
        release_lock()
    return out


# ------------------------------------------------------------------ análisis

def analyse_frame(path, scene, logo_mask, logo_box, logo_zone, skip_faces,
                  skip_logo):
    """Aplica los chequeos por fotograma. Devuelve (flags, métricas)."""
    import cv2

    bgr = cv2.imread(str(path))
    if bgr is None:
        raise SystemExit(f"No se pudo leer el fotograma: {path}")
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    H, W = gray.shape
    flags = []
    metrics = {"phash": "%016x" % phash(gray)}

    empty = check_dead_frame(gray, edges)
    metrics["grid_empty"] = round(empty, 3)
    if empty >= DEAD_THRESHOLD:
        flags.append(("dead-frame", "WARN",
                      f"fotograma {empty:.0%} vacío — revisar si es pausa "
                      f"intencional o arranque muerto de escena"))

    for detail in check_edge_clipped(bgr, gray, logo_zone):
        flags.append(("edge-clipped", "WARN", detail))

    faces = []
    if not skip_faces:
        raw = yunet_detect(bgr)
        faces, dubious = filter_faces(raw, W, H, logo_zone)
        metrics["faces"] = [[round(v, 1) for v in f[:4]] + [round(f[4], 2)]
                            for f in faces]
        metrics["faces_dubious"] = len(dubious)
        for detail in check_text_on_face(bgr, gray, faces, logo_zone):
            flags.append(("text-on-face", "BLOCK", detail))

    if logo_mask is not None and not skip_logo:
        score, bg = check_logo(gray, logo_mask, logo_box)
        metrics["logo_score"] = round(score, 2)
        metrics["logo_bg"] = round(bg, 1)
        if score < LOGO_MIN_SCORE:
            flags.append(("logo-missing", "BLOCK",
                          f"logotipo ausente o ilegible en su zona "
                          f"(score {score:.2f}, fondo {bg:.0f})"))
    return flags, metrics


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Pre-vuelo visual: 1 still por escena + chequeos "
                    "automáticos antes del render completo.")
    ap.add_argument("--frames-dir", help="Carpeta con fotogramas fNNN.jpg "
                    "(modo validación/auditoría).")
    ap.add_argument("--stills", action="store_true",
                    help="Renderizar 1 still por escena con Remotion "
                    "antes de analizar (usa el candado compartido).")
    ap.add_argument("--project", help="Id del proyecto (modo --stills).")
    ap.add_argument("--manifest", required=True,
                    help="Manifiesto de escenas JSON (ver docstring).")
    ap.add_argument("--stills-dir", help="Dónde guardar los stills "
                    "(defecto: projects/<id>/out/preflight-stills).")
    ap.add_argument("--repo-root", help="Raíz del repo con node_modules "
                    "y assets (defecto: la del script). Útil cuando el "
                    "worktree de trabajo no tiene dependencias "
                    "instaladas.")
    ap.add_argument("--no-bundle-cache", action="store_true",
                    help="No reutilizar la caché del bundle de webpack "
                    "entre stills (más lento; evita escribir caché en "
                    "el repo raíz).")
    ap.add_argument("--incremental", action="store_true",
                    help="Re-renderizar solo las escenas cuyos insumos "
                    "cambiaron (hash por escena) y reutilizar el still "
                    "y el análisis de las demás (caché en "
                    ".preflight-cache.json dentro de la carpeta de "
                    "stills). Conservador: ante la duda se re-renderiza.")
    ap.add_argument("--force", action="store_true",
                    help="Con --incremental: limpiar la caché y "
                    "re-renderizar todas las escenas.")
    ap.add_argument("--logo-ref", help="Fotograma con el logo visible "
                    "para construir la plantilla-máscara. Sin él, el "
                    "chequeo de logo se omite.")
    ap.add_argument("--logo-zone", default=",".join(str(v) for v in LOGO_ZONE_DEFAULT),
                    help="Zona del logo x0,y0,x1,y1 en fracciones "
                    "(defecto: %(default)s).")
    ap.add_argument("--logo-skip", default=None,
                    help="Escenas sin chequeo de logo, separadas por "
                    "comas (defecto: las del manifiesto).")
    ap.add_argument("--skip-faces", action="store_true",
                    help="Omitir la detección de caras (más rápido).")
    ap.add_argument("--json", action="store_true", help="Salida JSON.")
    ap.add_argument("--out", help="Escribir el informe JSON aquí "
                    "(implica --json).")
    args = ap.parse_args(argv)

    if bool(args.frames_dir) == bool(args.stills):
        ap.error("usa --frames-dir O --stills (uno de los dos)")
    if args.stills and not args.project:
        ap.error("--stills necesita --project")
    if args.incremental and not args.stills:
        ap.error("--incremental solo tiene sentido con --stills")
    manifest = load_manifest(args.manifest)
    scenes = manifest["scenes"]
    fps = manifest.get("fps", 30)
    logo_zone = tuple(float(v) for v in args.logo_zone.split(","))
    if len(logo_zone) != 4:
        ap.error("--logo-zone necesita x0,y0,x1,y1")
    logo_skip = set(args.logo_skip.split(",")) if args.logo_skip else set(
        manifest.get("logo_skip_scenes") or [])

    repo_root = (Path(args.repo_root) if args.repo_root else
                 Path(__file__).resolve().parent.parent)

    # --- obtener los fotogramas ---
    items = []  # (nombre, escena, path)
    cached_analysis = {}  # escena -> (flags, métricas) reutilizadas
    hashes = {}  # escena -> hash de insumos (modo incremental)
    cache = None
    stills_dir = None
    if args.stills:
        stills_dir = (Path(args.stills_dir) if args.stills_dir else
                      repo_root / "projects" / args.project
                      / "out" / "preflight-stills")
        if args.incremental:
            if args.force:
                clear_cache(stills_dir)
            project_dir = repo_root / "projects" / args.project
            tl_path = project_dir / "src" / "timeline.json"
            try:
                timeline_scenes = json.loads(
                    tl_path.read_text(encoding="utf-8")).get("scenes")
            except (OSError, ValueError):
                timeline_scenes = None
            types = {scene_type_of(s, timeline_scenes, i)
                     for i, s in enumerate(scenes)}
            per_type = [Path(project_dir) / "src" / "components"
                        / (kebab_to_pascal(t) + ".tsx")
                        for t in types if t]
            shared_hash = collect_shared_hash(project_dir, per_type)
            logo_ref_hash = (sha256_file(args.logo_ref)
                             if args.logo_ref and Path(args.logo_ref).is_file()
                             else None)
            for i, s in enumerate(scenes):
                hashes[s["name"]] = scene_input_hash(
                    project_dir, s, i, timeline_scenes, shared_hash,
                    project_dir / "src" / "captions.json",
                    project_dir / "src" / "captions.ts", fps, logo_skip,
                    logo_ref_hash, args.skip_faces, logo_zone)
            cache = load_cache(stills_dir)
            to_render, reused = partition_scenes(
                manifest, stills_dir, hashes, cache)
            for name in reused:
                p = stills_dir / f"{name}.jpg"
                items.append((p.name, name, p))
                entry = cache["scenes"][name]
                cached_analysis[name] = (
                    [tuple(f) for f in entry.get("flags", [])],
                    entry.get("metrics", {}))
                print(f"[preflight] reutilizo still {name} "
                      f"(sin cambios)", file=sys.stderr)
            if reused:
                print(f"[preflight] {len(reused)}/{len(scenes)} stills "
                      f"reutilizados de la caché", file=sys.stderr)
            if to_render:
                sub = dict(manifest)
                sub["scenes"] = [s for s in scenes
                                 if s["name"] in set(to_render)]
                for name, _frame, path in render_stills(
                        repo_root, args.project, sub, stills_dir,
                        bundle_cache=not args.no_bundle_cache):
                    items.append((path.name, name, path))
            if not items:
                raise SystemExit("Sin stills: ni caché ni render")
        else:
            for name, _frame, path in render_stills(
                    repo_root, args.project, manifest, stills_dir,
                    bundle_cache=not args.no_bundle_cache):
                items.append((path.name, name, path))
    else:
        frames_dir = Path(args.frames_dir)
        for p in sorted(frames_dir.glob("f*.jpg")) + sorted(
                frames_dir.glob("f*.png")):
            try:
                second = int(p.stem[1:]) - 1
            except ValueError:
                continue
            scene = scene_of_frame(second * fps, scenes)
            items.append((p.name, scene, p))
        if not items:
            raise SystemExit(f"Sin fotogramas fNNN.jpg en {frames_dir}")
    items.sort(key=lambda t: t[0])

    # --- plantilla del logo ---
    logo_mask = logo_box = None
    if args.logo_ref:
        logo_mask, logo_box = build_logo_mask(args.logo_ref, logo_zone)

    # --- chequeos por fotograma ---
    results = []
    for name, scene, path in items:
        if scene in cached_analysis:
            flags, metrics = cached_analysis[scene]
        else:
            skip_logo = scene in logo_skip
            flags, metrics = analyse_frame(
                path, scene, logo_mask, logo_box, logo_zone,
                skip_faces=args.skip_faces, skip_logo=skip_logo)
        results.append({"frame": name, "scene": scene,
                        "path": str(path), "flags": flags,
                        "metrics": metrics})

    # --- guardar la caché incremental (ANTES del chequeo de
    # duplicados: los flags de duplicado se calculan en cada corrida
    # desde los pHash y no deben acumularse en la caché) ---
    if args.stills and args.incremental and cache is not None:
        new_scenes = {}
        for r in results:
            h = hashes.get(r["scene"])
            if h is None:
                continue  # insumo no resoluble: sin caché, re-render
            new_scenes[r["scene"]] = {
                "input_hash": h,
                "still_sha256": sha256_file(r["path"]),
                "frame": next((s["frame"] for s in scenes
                               if s["name"] == r["scene"]), None),
                "flags": [list(f) for f in r["flags"]],
                "metrics": r["metrics"],
            }
        cache["scenes"] = new_scenes
        save_cache(stills_dir, cache)

    # --- duplicados entre escenas ---
    dup_notes = []
    for i in range(len(results)):
        for j in range(i + 1, len(results)):
            a, b = results[i], results[j]
            if a["scene"] == b["scene"] or a["scene"] == "?" or b["scene"] == "?":
                continue
            d = hamming(int(a["metrics"]["phash"], 16),
                        int(b["metrics"]["phash"], 16))
            if d <= DUP_WARN:
                sev = "BLOCK" if d <= DUP_BLOCK else "WARN"
                detail = (f"imagen casi idéntica a {b['frame']} "
                          f"[{b['scene']}] (pHash Hamming {d})")
                a["flags"].append(("duplicate", sev, detail))
                b["flags"].append(("duplicate", sev,
                                   f"imagen casi idéntica a {a['frame']} "
                                   f"[{a['scene']}] (pHash Hamming {d})"))
                dup_notes.append((a["frame"], b["frame"], d))

    flagged = [r for r in results if r["flags"]]
    blocking = [r for r in flagged
                if any(f[1] == "BLOCK" for f in r["flags"])]
    n_scenes = len({r["scene"] for r in results})

    # Muestreo sugerido: 1 fotograma limpio por escena (el humano lee
    # los flags + esta muestra, no los 69 fotogramas).
    sample = []
    seen = set()
    for r in results:
        if r["scene"] not in seen and not r["flags"]:
            sample.append(f"{r['frame']} [{r['scene']}]")
            seen.add(r["scene"])

    report = {
        "frames": len(results),
        "scenes": n_scenes,
        "flagged_frames": len(flagged),
        "blocking_frames": len(blocking),
        "logo_check": "skip" if logo_mask is None else "on",
        "faces_check": "skip" if args.skip_faces else "on",
        "sample_clean_per_scene": sample,
        "results": [
            {"frame": r["frame"], "scene": r["scene"],
             "flags": [{"check": c, "severity": s, "detail": d}
                       for c, s, d in r["flags"]],
             "metrics": r["metrics"]}
            for r in results
        ],
    }

    if args.json or args.out:
        text = json.dumps(report, indent=2, ensure_ascii=False)
        if args.out:
            Path(args.out).write_text(text, encoding="utf-8")
            print(f"Informe JSON: {args.out}")
        else:
            print(text)
    if not args.json or args.out:
        print(f"PRE-VUELO VISUAL — {len(results)} fotograma(s), "
              f"{n_scenes} escena(s)")
        print(f"BLOQUEANTES: {len(blocking)} fotograma(s) · "
              f"AVISOS: {len(flagged) - len(blocking)} fotograma(s) · "
              f"limpios: {len(results) - len(flagged)}")
        if logo_mask is None:
            print("(chequeo de logo omitido: sin --logo-ref)")
        if args.skip_faces:
            print("(chequeo de caras omitido: --skip-faces)")
        print()
        if not flagged:
            print("Sin flags: el pre-vuelo no encontró nada que revisar.")
        for r in flagged:
            for c, s, d in r["flags"]:
                tag = "BLOQ" if s == "BLOCK" else "AVISO"
                print(f"  {r['frame']} [{r['scene']}] {tag} {c}: {d}")
        print()
        print("Muestra sugerida (1 limpio por escena, para el ojo humano):")
        print("  " + ", ".join(sample) if sample else "  (ninguna: todas "
              "las escenas tienen flags)")
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
