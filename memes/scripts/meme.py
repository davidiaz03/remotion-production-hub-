#!/usr/bin/env python3
"""
Generador de memes de imagen — ecosistema de memes rápidos (uso personal).

Modos:
  # 1. Clásico superior/inferior sobre una plantilla:
  python3 meme.py --template drake-hotline-bling \\
      --top "DORMIR 8 HORAS" \\
      --bottom "QUEDARME DESPIERTO PENSANDO EN QUE LOS PECES NO SABEN QUE ESTÁN MOJADOS"

  # 2b. Texto a la derecha de cada panel (plantillas tipo Drake, con la
  #     imagen a la izquierda y el hueco a la derecha):
  python3 meme.py --template drake-hotline-bling --texts "DORMIR 8 HORAS|..." \\
      --boxes-dir v --text-region right
  python3 meme.py --template distracted-boyfriend \\
      --texts "MI NOVIA|YO|EL WIFI DEL VECINO" --boxes-dir h

  # 3. Sobre una foto propia:
  python3 meme.py --image ~/fotos/gato.jpg --top "YO" --bottom "A LAS 3 AM"

  # 4. Solo texto (fondo blanco + texto negro, chiste de una línea):
  python3 meme.py --text-only "mi mayor miedo es que el grupo de la familia descubra mis stickers"

  # 5. Multipanel 2x2:
  python3 meme.py --grid a.jpg,b.jpg,c.jpg,d.jpg --texts "LUNES|MARTES|MIÉRCOLES|YO"

  # 6. Chat falso (yo: = derecha/verde; otro nombre = izquierda/blanco):
  python3 meme.py --fake-chat "yo: oye viste el meme|María: cuál|yo: el del pez|María: ..."

  # 7. Deep-fry (imagen frita, estilo dank) — combina con cualquier modo:
  python3 meme.py --template disaster-girl --top "YO" --deep-fry

  # Pie de foto en barra inferior (combina con 1-3):
  python3 meme.py --template waiting-skeleton --top "YO ESPERANDO" \\
      --caption "el router lleva parpadeando desde 2019"

  # Listar plantillas:
  python3 meme.py --list

Fuente: Archivo Black (SIL OFL 1.1, en ../assets/fonts/) — sustituta libre
de Impact. Texto blanco con borde negro, tamaño ajustado automáticamente.
Salida por defecto: ../out/<base>-<fecha-hora>.jpg
"""
import argparse
import io
import json
import os
import subprocess
import sys
from datetime import datetime

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, 'templates', 'catalog.json')
IMAGES = os.path.join(ROOT, 'templates', 'images')
FONT = os.path.join(ROOT, 'assets', 'fonts', 'ArchivoBlack-Regular.ttf')
FACE_FRAME = os.path.join(HERE, 'face-frame.py')
VENV_PYTHON = os.path.expanduser('~/workspace/remotion-hub/.venv/bin/python')
OUT_DIR = os.path.join(ROOT, 'out')

# Fuente de cuerpo para el chat falso (DejaVu del sistema; si falta, Archivo Black).
FONT_BODY = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
FONT_BODY_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
if not os.path.exists(FONT_BODY):
    FONT_BODY = FONT_BODY_BOLD = FONT

NAME_COLORS = ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#009688']


def load_catalog():
    with open(CATALOG, encoding='utf-8') as f:
        return json.load(f)['templates']


def detect_faces(image_path, face_box=None):
    """Caras [(x, y, w, h)] en px de imagen.

    Usa face-frame.py con el python del venv del hub (único con cv2).
    Devuelve None si la detección no está disponible: quien llama sigue
    sin chequeo de caras.
    """
    if face_box is not None:
        return [tuple(face_box)]
    py = VENV_PYTHON if os.path.exists(VENV_PYTHON) else sys.executable
    try:
        r = subprocess.run([py, FACE_FRAME, '--boxes-only', image_path],
                           capture_output=True, text=True, timeout=180)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if r.returncode != 0:
        return None
    try:
        return [tuple(float(v) for v in b)
                for b in json.loads(r.stdout).get('faces', [])]
    except (ValueError, KeyError, TypeError):
        return None


def rects_overlap(a, b, pad=0):
    """¿Se solapan los rects (x0, y0, x1, y1)? pad expande el segundo."""
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad
    return ax0 < bx1 and ax1 > bx0 and ay0 < by1 and ay1 > by0


def face_rect(box, chin_margin=0.25):
    """Caja de cara (x, y, w, h) -> rect con margen de barbilla."""
    x, y, w, h = box
    return (x, y, x + w, y + h * (1 + chin_margin))


def find_template(templates, key):
    for t in templates:
        if t['slug'] == key or str(t['id']) == str(key):
            return t
    return None


def list_templates(templates):
    print(f"{'slug':42} {'cajas':>5}  {'usos':>8}  nombre")
    for t in templates:
        print(f"{t['slug']:42} {t['box_count']:>5}  {t['captions']:>8}  {t['name']}")


def wrap(draw, text, font, max_w):
    """Envuelve el texto por palabras midiendo el ancho real."""
    words = text.split()
    lines, cur = [], ''
    for w in words:
        trial = f'{cur} {w}'.strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or ['']


def fit_font(draw, text, max_w, max_h, start_size, font_path=FONT):
    """Mayor tamaño de fuente con el que el texto (envuelto) cabe en max_w x max_h."""
    size = start_size
    while size > 8:
        font = ImageFont.truetype(font_path, size)
        lines = wrap(draw, text, font, max_w)
        heights = [draw.textbbox((0, 0), ln, font=font)[3] for ln in lines]
        total_h = sum(heights) + int(size * 0.15) * (len(lines) - 1)
        if total_h <= max_h:
            return font, lines
        size -= 2
    font = ImageFont.truetype(font_path, 8)
    return font, wrap(draw, text, font, max_w)


def draw_block(draw, lines, font, box, fill='white', stroke=True):
    """Dibuja líneas centradas dentro de box = (x0, y0, x1, y1)."""
    x0, y0, x1, y1 = box
    sw = max(1, font.size // 12) if stroke else 0
    line_h = [draw.textbbox((0, 0), ln, font=font)[3] for ln in lines]
    gap = int(font.size * 0.15)
    total = sum(line_h) + gap * (len(lines) - 1)
    y = y0 + (y1 - y0 - total) // 2
    for ln, h in zip(lines, line_h):
        w = draw.textlength(ln, font=font)
        x = x0 + (x1 - x0 - w) // 2
        draw.text((x, y), ln, font=font, fill=fill,
                  stroke_width=sw, stroke_fill='black')
        y += h + gap


def draw_caption_bar(img, draw, text):
    """Barra negra inferior con texto blanco centrado."""
    w, h = img.size
    bar_h = max(60, int(h * 0.14))
    draw.rectangle([0, h - bar_h, w, h], fill='black')
    font, lines = fit_font(draw, text, int(w * 0.92), int(bar_h * 0.8), bar_h // 2)
    draw_block(draw, lines, font, (int(w * 0.04), h - bar_h, int(w * 0.96), h))


def deep_fry(img):
    """Filtro «imagen frita»: saturación y contraste altos + artefactos JPEG."""
    img = ImageEnhance.Color(img).enhance(2.2)
    img = ImageEnhance.Contrast(img).enhance(1.6)
    img = ImageEnhance.Sharpness(img).enhance(2.5)
    img = ImageEnhance.Brightness(img).enhance(1.05)
    noise = Image.effect_noise(img.size, 40).convert('L')
    img = Image.blend(img, Image.merge('RGB', (noise, noise, noise)), 0.05)
    for q in (18, 28):
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=q)
        buf.seek(0)
        img = Image.open(buf).convert('RGB')
    return img


def cover_crop(img, w, h):
    """Recorta la imagen al centro para cubrir w x h."""
    iw, ih = img.size
    scale = max(w / iw, h / ih)
    img = img.resize((int(iw * scale) + 1, int(ih * scale) + 1), Image.LANCZOS)
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    return img.crop((x, y, x + w, y + h))


def make_text_only(text, size=(1080, 1080)):
    img = Image.new('RGB', size, 'white')
    draw = ImageDraw.Draw(img)
    font, lines = fit_font(draw, text, int(size[0] * 0.88), int(size[1] * 0.8),
                           int(size[0] * 0.09))
    draw_block(draw, lines, font, (int(size[0] * 0.06), int(size[1] * 0.1),
                                   int(size[0] * 0.94), int(size[1] * 0.9)),
               fill='black', stroke=False)
    return img


def make_grid(paths, labels=None, size=1080, gap=6):
    if len(paths) != 4:
        sys.exit(f'la rejilla 2x2 necesita 4 imágenes (diste {len(paths)})')
    cell = (size - gap) // 2
    img = Image.new('RGB', (size, size), 'black')
    draw = ImageDraw.Draw(img)
    for i, p in enumerate(paths):
        p = os.path.expanduser(p)
        if not os.path.exists(p):
            sys.exit(f'no existe: {p}')
        tile = cover_crop(Image.open(p).convert('RGB'), cell, cell)
        x, y = (i % 2) * (cell + gap), (i // 2) * (cell + gap)
        img.paste(tile, (x, y))
        if labels and i < len(labels) and labels[i]:
            font, lines = fit_font(draw, labels[i], cell - 24, cell // 3, 54)
            draw_block(draw, lines, font, (x + 12, y + 8, x + cell - 12,
                                           y + cell // 3 + 8))
    return img


def make_fake_chat(spec, width=1080):
    """Hilo de mensajes simulado. Formato: 'yo: texto|Nombre: texto|…'."""
    msgs = []
    for part in spec.split('|'):
        part = part.strip()
        if not part:
            continue
        if ':' in part:
            who, text = part.split(':', 1)
            msgs.append((who.strip(), text.strip()))
        else:
            msgs.append(('', part))
    if not msgs:
        sys.exit('el chat falso necesita al menos un mensaje')
    if len(msgs) > 14:
        sys.exit('el chat falso admite hasta 14 mensajes')

    pad, gap = 36, 18
    max_bubble = int(width * 0.78)
    font_size, name_size = 34, 28
    body = ImageFont.truetype(FONT_BODY, font_size)
    name_font = ImageFont.truetype(FONT_BODY_BOLD, name_size)

    # Medir primero para calcular la altura total.
    probe = Image.new('RGB', (10, 10))
    pdraw = ImageDraw.Draw(probe)
    blocks = []
    total_h = pad
    colors = {}
    for who, text in msgs:
        mine = who.lower() in ('yo', 'me', 'yop')
        inner = max_bubble - 48
        lines = wrap(pdraw, text, body, inner)
        lh = pdraw.textbbox((0, 0), 'Ag', font=body)[3] + 8
        bh = len(lines) * lh + 36
        if not mine and who:
            bh += name_size + 10
        bw = max(pdraw.textlength(ln, font=body) for ln in lines) + 48
        if not mine and who:
            bw = max(bw, pdraw.textlength(who, font=name_font) + 48)
        blocks.append((who, text, lines, mine, min(bw, max_bubble), bh, lh))
        total_h += bh + gap
    total_h += pad - gap

    img = Image.new('RGB', (width, total_h), '#ECE5DD')
    draw = ImageDraw.Draw(img)
    y = pad
    for who, text, lines, mine, bw, bh, lh in blocks:
        x = width - pad - bw if mine else pad
        fill = '#DCF8C6' if mine else 'white'
        draw.rounded_rectangle([x, y, x + bw, y + bh], radius=26, fill=fill)
        tx = x + 24
        ty = y + 18
        if not mine and who:
            if who not in colors:
                colors[who] = NAME_COLORS[len(colors) % len(NAME_COLORS)]
            draw.text((tx, ty), who, font=name_font, fill=colors[who])
            ty += name_size + 10
        for ln in lines:
            draw.text((tx, ty), ln, font=body, fill='#111B21')
            ty += lh
        y += bh + gap
    return img


def save(img, args, name):
    os.makedirs(OUT_DIR, exist_ok=True)
    ext = 'png' if args.png else 'jpg'
    out = args.out or os.path.join(
        OUT_DIR, f"{name}-{datetime.now():%Y%m%d-%H%M%S}.{ext}")
    if args.deep_fry:
        img = deep_fry(img)
    if args.png:
        img.save(out, 'PNG')
    else:
        img.save(out, 'JPEG', quality=90)
    print(out)
    print(f"{img.width}x{img.height} px, {os.path.getsize(out) // 1024} KB")
    return 0


def main():
    ap = argparse.ArgumentParser(description='Generador de memes de imagen')
    ap.add_argument('--template', help='slug o id de plantilla (ver --list)')
    ap.add_argument('--image', help='foto propia como base (en vez de plantilla)')
    ap.add_argument('--top', help='texto superior')
    ap.add_argument('--bottom', help='texto inferior')
    ap.add_argument('--texts', help='textos por panel, separados por |')
    ap.add_argument('--boxes-dir', choices=['v', 'h'], default='v',
                    help='dirección de los paneles: v = apilados, h = lado a lado')
    ap.add_argument('--text-region', choices=['full', 'left', 'right'],
                    default='full',
                    help='con --boxes-dir v: zona horizontal del texto '
                         '(right = plantillas tipo Drake)')
    ap.add_argument('--caption', help='pie de foto en barra inferior')
    ap.add_argument('--text-only', help='meme de solo texto (fondo blanco)')
    ap.add_argument('--grid', help='rejilla 2x2: 4 rutas separadas por coma')
    ap.add_argument('--fake-chat', help='chat falso: "yo: …|Nombre: …|…"')
    ap.add_argument('--deep-fry', action='store_true', help='filtro imagen frita')
    ap.add_argument('--no-face-check', action='store_true',
                    help='no detectar caras ni desplazar el texto')
    ap.add_argument('--face-box', help='cara sintética x,y,w,h (pruebas)')
    ap.add_argument('--out', help='archivo de salida (por defecto ../out/...)')
    ap.add_argument('--png', action='store_true', help='salida PNG en vez de JPG')
    ap.add_argument('--list', action='store_true', help='listar plantillas y salir')
    args = ap.parse_args()

    templates = load_catalog()
    if args.list:
        list_templates(templates)
        return 0

    if args.text_only:
        return save(make_text_only(args.text_only), args, 'texto')
    if args.grid:
        labels = ([p.strip() for p in args.texts.split('|')]
                  if args.texts else None)
        return save(make_grid([p.strip() for p in args.grid.split(',')],
                              labels), args, 'rejilla-2x2')
    if args.fake_chat:
        return save(make_fake_chat(args.fake_chat), args, 'chat-falso')

    if not (args.top or args.bottom or args.texts or args.caption):
        ap.error('falta texto: usa --top/--bottom, --texts o --caption')

    if args.image:
        base_path = os.path.expanduser(args.image)
        name = os.path.splitext(os.path.basename(base_path))[0]
        if not os.path.exists(base_path):
            sys.exit(f'no existe la imagen: {base_path}')
    else:
        if not args.template:
            ap.error('falta --template, --image, --text-only, --grid o --fake-chat')
        t = find_template(templates, args.template)
        if not t:
            sys.exit(f"plantilla no encontrada: {args.template} (usa --list)")
        base_path = os.path.join(IMAGES, os.path.basename(t['file']))
        name = t['slug']

    img = Image.open(base_path).convert('RGB')
    w, h = img.size
    draw = ImageDraw.Draw(img)
    pad = max(12, int(w * 0.03))
    max_text_w = w - 2 * pad

    # --- Caras: avisar si el texto las tapa; desplazar si se puede ---
    face_box = None
    if args.face_box:
        try:
            face_box = [float(v) for v in args.face_box.split(',')]
            assert len(face_box) == 4
        except (ValueError, AssertionError):
            ap.error('--face-box necesita x,y,w,h')
    faces = []
    if not args.no_face_check:
        detected = detect_faces(base_path, face_box)
        if detected is None:
            print('nota: sin detección de caras (falta el venv del hub '
                  'con cv2); el texto se coloca sin chequeo', file=sys.stderr)
        else:
            faces = [face_rect(b) for b in detected]

    def overlaps_face(rect):
        return any(rects_overlap(rect, f, pad=8) for f in faces)

    if args.texts:
        parts = [p.strip() for p in args.texts.split('|') if p.strip()]
        n = len(parts)
        rx0, rx1 = pad, w - pad
        if args.boxes_dir == 'v' and args.text_region == 'right':
            rx0 = w // 2
        elif args.boxes_dir == 'v' and args.text_region == 'left':
            rx1 = w // 2
        for i, part in enumerate(parts):
            if args.boxes_dir == 'v':
                box = (rx0, h * i // n + pad // 2, rx1, h * (i + 1) // n - pad // 2)
                start = min(int((rx1 - rx0) * 0.16), int((h // n) * 0.45))
            else:
                box = (w * i // n + pad // 2, pad, w * (i + 1) // n - pad // 2, h - pad)
                start = min(int((w // n) * 0.16), int(h * 0.09))
            if faces and overlaps_face(box):
                print(f'aviso: el texto del panel {i + 1} tapa una cara; '
                      f'verificar a ojo', file=sys.stderr)
            font, lines = fit_font(draw, part, box[2] - box[0], box[3] - box[1], start)
            draw_block(draw, lines, font, box)
    else:
        # Calcular primero ambos textos; colocar después (permite desplazar).
        jobs = []  # (kind, text, font, lines, height)
        if args.top:
            font, lines = fit_font(draw, args.top, max_text_w, int(h * 0.32), int(w * 0.09))
            jobs.append(['top', args.top, font, lines])
        if args.bottom:
            font, lines = fit_font(draw, args.bottom, max_text_w, int(h * 0.32), int(w * 0.09))
            jobs.append(['bottom', args.bottom, font, lines])

        def job_rect(kind, font, lines):
            # Mismo centrado vertical que draw_block usa al dibujar.
            heights = [draw.textbbox((0, 0), ln, font=font)[3] for ln in lines]
            total = sum(heights) + int(font.size * 0.15) * (len(lines) - 1)
            if kind == 'top':
                y0, y1 = pad, int(h * 0.34)
            else:
                y0, y1 = int(h * 0.66), h - pad
            y_start = y0 + (y1 - y0 - total) // 2
            return (pad, y_start, w - pad, y_start + total)

        if faces and len(jobs) == 1:
            kind, _, font, lines = jobs[0]
            if overlaps_face(job_rect(kind, font, lines)):
                other = 'bottom' if kind == 'top' else 'top'
                if not overlaps_face(job_rect(other, font, lines)):
                    jobs[0][0] = other
                    print(f"aviso: el texto {kind} tapaba una cara; "
                          f"movido {'abajo' if other == 'bottom' else 'arriba'}",
                          file=sys.stderr)
                else:
                    print(f'aviso: el texto {kind} tapa una cara; '
                          f'verificar a ojo', file=sys.stderr)
        elif faces:
            for kind, _, font, lines in jobs:
                if overlaps_face(job_rect(kind, font, lines)):
                    print(f'aviso: el texto {kind} tapa una cara; '
                          f'verificar a ojo', file=sys.stderr)

        for kind, _, font, lines in jobs:
            if kind == 'top':
                draw_block(draw, lines, font, (pad, pad, w - pad, int(h * 0.34)))
            else:
                draw_block(draw, lines, font, (pad, int(h * 0.66), w - pad, h - pad))

    if args.caption:
        if faces:
            bar_h = max(60, int(h * 0.14))
            if overlaps_face((0, h - bar_h, w, h)):
                print('aviso: la barra del caption tapa una cara; '
                      'verificar a ojo', file=sys.stderr)
        draw_caption_bar(img, draw, args.caption)

    return save(img, args, name)


if __name__ == '__main__':
    raise SystemExit(main())
