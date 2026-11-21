#!/usr/bin/env python3
"""
Generador de memes de vídeo — ecosistema de memes rápidos (uso personal).

Los 4 movimientos clásicos (ExpoCut, sep-2026): captions grandes estilo
Impact + zoom punch en la reacción + SFX en el golpe + freeze en el remate.
Todo con ffmpeg; sin renders de Remotion.

Uso:
  # Caption sobre un clip, vertical:
  python3 meme-video.py --input clip.mp4 --top "YO" --bottom "A LAS 3 AM"

  # POV (forma dominante del vídeo corto actual):
  python3 meme-video.py --input clip.mp4 --pov "cuando el profe dice que hay examen sorpresa"

  # El combo completo: punch + SFX + freeze en el remate:
  python3 meme-video.py --input clip.mp4 --top "CUANDO DICEN 'SOLO 5 MINUTOS'" \\
      --punch-at 2.5 --sfx boing --freeze-end 3

  # Freeze a mitad de clip (el audio se pausa con la imagen):
  python3 meme-video.py --input clip.mp4 --top "…" \\
      --freeze-at 2.5 --freeze-dur 1.5 --sfx scratch

  # Cama musical (mezcla baja, sin tapar el SFX):
  python3 meme-video.py --input clip.mp4 --top "…" \\
      --music sneaky-snitch --music-volume 0.25

  # Desde una imagen (plantilla o foto) con zoom lento:
  python3 meme-video.py --template waiting-skeleton --top "YO ESPERANDO EL WIFI" \\
      --duration 6 --zoom --punch-at 3 --sfx slam --freeze-end 3

  # Reacción: clip corto + caption:
  python3 meme-video.py --input reaccion.mp4 --caption "yo viendo el grupo a las 2 AM"

  # Desde una plantilla de vídeo real del catálogo:
  python3 meme-video.py --video-template dicaprio-pointing \\
      --top "CUANDO VES EL MEME ANTES QUE TUS AMIGOS" --punch-at 0.7 \\
      --sfx vine-boom --freeze-end 2

  # Plantilla green screen compuesta sobre fondo negro:
  python3 meme-video.py --video-template coffin-dance --chroma-key \\
      --top "YO" --punch-at 1 --sfx vine-boom

  # Cuadrado, más rápido:
  python3 meme-video.py --input clip.mp4 --top "..." --format square --speed 1.5

SFX incluidos (en ../assets/sfx/, todos CC0):
  boing, slam, pop, zoom (SFX Kit de Wyzowl)
  airhorn, scratch, sad-trombone, censor, buzzer (sintetizados aquí
  con ffmpeg; ver synth-sfx.py)
  vine-boom, metal-pipe, sting, fail, error, ping, applause, riser,
  bonk, bass-drop, glitch, deflate, coin, thunder, alarm (SFX Kit)
  ... o una ruta a cualquier .wav/.mp3 con --sfx.

Música (en ../assets/music/, ver music.json):
  sneaky-snitch, monkeys-spinning, carefree, fluffing-a-duck
  (Kevin MacLeod, CC BY 4.0) y shadows-evidence,
  historical-investigation, weight-of-memory (Flow Music del usuario).
  ... o una ruta a cualquier audio con --music.

Caras: si el venv del hub tiene cv2, se detectan las caras de la imagen
base (o de un fotograma del clip) y se avisa si el texto las tapa; cuando
hay un solo texto y el lado opuesto está libre, el texto se desplaza solo.
YuNet no es perfectamente estable entre escalas: la verificación visual
final sigue siendo obligatoria. --no-face-check lo desactiva.

Fuente: Archivo Black (SIL OFL 1.1) — sustituta libre de Impact.
Salida por defecto: ../out/<base>-<fecha-hora>.mp4
"""
import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
from datetime import datetime

from PIL import Image, ImageChops, ImageFont, ImageColor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, 'templates', 'catalog.json')
IMAGES = os.path.join(ROOT, 'templates', 'images')
FONT = os.path.join(ROOT, 'assets', 'fonts', 'ArchivoBlack-Regular.ttf')
# Fuentes disponibles (todas SIL OFL 1.1, en ../assets/fonts/):
# archivo-black = Impact clásica (def.); anton = condensada, para textos
# largos; bangers = de cómic, para chistes absurdos.
FONTS = {
    'archivo-black': FONT,
    'anton': os.path.join(ROOT, 'assets', 'fonts', 'Anton-Regular.ttf'),
    'bangers': os.path.join(ROOT, 'assets', 'fonts', 'Bangers-Regular.ttf'),
}
SFX_DIR = os.path.join(ROOT, 'assets', 'sfx')
MUSIC_DIR = os.path.join(ROOT, 'assets', 'music')
MUSIC_CATALOG = os.path.join(MUSIC_DIR, 'music.json')
VIDEO_CATALOG = os.path.join(ROOT, 'video-templates', 'catalog.json')
VIDEO_CLIPS = os.path.join(ROOT, 'video-templates', 'clips')
FACE_FRAME = os.path.join(HERE, 'face-frame.py')
VENV_PYTHON = os.path.expanduser('~/workspace/remotion-hub/.venv/bin/python')
OUT_DIR = os.path.join(ROOT, 'out')

SFX = {
    'boing': 'move-spring.wav',
    'slam': 'cinematic-slam-big.wav',
    'pop': 'pop-large-bubble.wav',
    'zoom': 'move-zoom-in.wav',
    'airhorn': 'airhorn.wav',
    'scratch': 'record-scratch.wav',
    # Clásicos de memes (19-nov-2026): del SFX Kit CC0 del hub, salvo
    # los tres últimos, sintetizados aquí (ver synth-sfx.py).
    'vine-boom': 'vine-boom.wav',
    'metal-pipe': 'metal-pipe.wav',
    'sting': 'dramatic-sting.wav',
    'fail': 'fail-womp.wav',
    'error': 'error-chime.wav',
    'ping': 'ping.wav',
    'applause': 'applause.wav',
    'riser': 'riser.wav',
    'bonk': 'bonk.wav',
    'bass-drop': 'bass-drop.wav',
    'glitch': 'glitch.wav',
    'deflate': 'deflate.wav',
    'coin': 'coin.wav',
    'thunder': 'thunder.wav',
    'alarm': 'alarm.wav',
    'sad-trombone': 'sad-trombone.wav',
    'censor': 'censor-beep.wav',
    'buzzer': 'wrong-buzzer.wav',
}

FORMATS = {'vertical': (1080, 1920), 'square': (1080, 1080)}
FPS = 30


def resolve_font(name):
    """Nombre de fuente (archivo-black|anton|bangers) o ruta .ttf."""
    if name in FONTS:
        path = FONTS[name]
    else:
        path = os.path.expanduser(name)
    if not os.path.exists(path):
        sys.exit(f"fuente no encontrada: {name} "
                 f"({'|'.join(FONTS)} o ruta a un .ttf)")
    return path


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"falló: {' '.join(cmd[:3])}…\n{r.stderr[-1500:]}")
    return r


def probe(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries',
             'stream=codec_type,width,height,channels',
             '-show_entries', 'format=duration', '-of', 'json', path])
    d = json.loads(r.stdout)
    video = next((s for s in d.get('streams', [])
                  if s['codec_type'] == 'video'), {})
    audio = next((s for s in d.get('streams', [])
                  if s['codec_type'] == 'audio'), {})
    return {
        'duration': float(d.get('format', {}).get('duration') or 0),
        'has_video': bool(video),
        'has_audio': bool(audio),
        'width': int(video.get('width') or 0),
        'height': int(video.get('height') or 0),
        'channels': int(audio.get('channels') or 0),
    }


def is_image(path):
    return os.path.splitext(path)[1].lower() in ('.jpg', '.jpeg', '.png', '.webp')


def wrap_for_width(text, font_size, max_w):
    """Envuelve el texto midiendo con la fuente real (PIL)."""
    font = ImageFont.truetype(FONT, font_size)
    lines, cur = [], ''
    for w in text.split():
        trial = f'{cur} {w}'.strip()
        if font.getlength(trial) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or ['']


def fit_text(text, max_w, max_h, start_size):
    """Tamaño y líneas con las que el texto cabe en max_w x max_h.

    Verifica ancho (con borde) y alto: una palabra sola más ancha que
    max_w no se puede envolver, así que hay que achicar hasta que quepa.
    Mismo fallo que en meme.py (texto pegado al borde, 19-nov-2026).
    """
    size = start_size
    while size > 16:
        border = max(2, size // 14)
        lines = wrap_for_width(text, size, max_w - 2 * border)
        font = ImageFont.truetype(FONT, size)
        widest = max(font.getlength(ln) + 2 * border for ln in lines)
        if widest <= max_w and len(lines) * size * 1.15 <= max_h:
            return size, lines
        size -= 4
    return 16, wrap_for_width(text, 16, max_w)


def drawtext_filter(text, size, y_expr, tmpdir, tag, pill=False):
    """drawtext con el texto en archivo (evita problemas de escape).

    Con pill=True, una caja negra semitransparente detrás del texto
    (legibilidad sobre fondos claros).
    """
    path = os.path.join(tmpdir, f'text-{tag}.txt')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    border = max(2, size // 14)
    filt = (f"drawtext=textfile='{path}':fontfile='{FONT}':fontsize={size}:"
            f"fontcolor=white:borderw={border}:bordercolor=black:"
            f"x=(w-text_w)/2:y={y_expr}")
    if pill:
        filt += f":box=1:boxcolor=black@0.45:boxborderw={max(8, size // 3)}"
    return filt


def parse_bg_color(name):
    """Color de fondo (nombre ffmpeg/PIL o #hex) -> (r, g, b)."""
    try:
        return ImageColor.getrgb(name)
    except ValueError:
        return (0, 0, 0)


def extract_frame(clip, t, out_path, width=None):
    """Un fotograma del clip en out_path (opcionalmente escalado)."""
    cmd = ['ffmpeg', '-y', '-v', 'error', '-ss', str(t), '-i', clip,
           '-frames:v', '1']
    if width:
        cmd += ['-vf', f'scale={width}:-2']
    cmd.append(out_path)
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode == 0 and os.path.exists(out_path)


def is_screen_green(px):
    """¿Píxel (r, g, b) de verde de chroma (saturado, no hierba)?"""
    r, g, b = px
    return g > 140 and g - r > 50 and g - b > 50


def looks_green_screen(clip, dur):
    """¿Los bordes del clip son mayoritariamente verde de chroma?

    Dos fotogramas (25% y 75%): si en alguno más del 40% de la banda
    exterior es verde saturado, es una plantilla green screen.
    """
    tmp = tempfile.mkdtemp(prefix='meme-green-')
    try:
        for frac in (0.25, 0.75):
            frame = os.path.join(tmp, f'g{int(frac * 100)}.jpg')
            if not extract_frame(clip, max(0.05, dur * frac), frame, 320):
                continue
            im = Image.open(frame).convert('RGB')
            w, h = im.size
            band = max(2, int(min(w, h) * 0.06))
            border = []
            for x in range(w):
                for y in list(range(band)) + list(range(h - band, h)):
                    border.append(im.getpixel((x, y)))
            for y in range(band, h - band):
                for x in list(range(band)) + list(range(w - band, w)):
                    border.append(im.getpixel((x, y)))
            green = sum(1 for p in border if is_screen_green(p))
            if border and green / len(border) > 0.4:
                return True
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)
    return False


def content_bbox(clip, bg_rgb, dur, fractions=(0.1, 0.3, 0.5, 0.7, 0.9)):
    """Bbox (x, y, w, h) del contenido no-fondo de un clip con fondo sólido.

    Une las cajas de varios fotogramas. Devuelve None si el contenido
    llena casi todo el fotograma (no hay recorte útil) o si no se puede
    medir. Con esto, un WASTED (letras en una banda fina sobre negro)
    se recorta a las letras y llena el formato en vez de dejar vacío.
    """
    info = probe(clip)
    iw, ih = info['width'], info['height']
    if not iw or not ih:
        return None
    tmp = tempfile.mkdtemp(prefix='meme-bbox-')
    try:
        boxes = []
        scaled_h = None
        for i, frac in enumerate(fractions):
            frame = os.path.join(tmp, f'b{i}.png')
            if not extract_frame(clip, max(0.05, dur * frac), frame, 320):
                continue
            im = Image.open(frame).convert('RGB')
            scaled_h = im.size[1]
            bg = Image.new('RGB', im.size, bg_rgb)
            diff = ImageChops.difference(im, bg).convert('L')
            mask = diff.point(lambda v: 255 if v > 30 else 0)
            b = mask.getbbox()
            if b:
                boxes.append(b)
        if not boxes or not scaled_h:
            return None
        x0 = min(b[0] for b in boxes)
        y0 = min(b[1] for b in boxes)
        x1 = max(b[2] for b in boxes)
        y1 = max(b[3] for b in boxes)
        # Volver a la resolución real (los fotogramas son de 320 px).
        sw = iw / 320.0
        sh = ih / scaled_h
        x0, x1 = int(x0 * sw), int(x1 * sw)
        y0, y1 = int(y0 * sh), int(y1 * sh)
        pad_x, pad_y = int(iw * 0.04), int(ih * 0.04)
        x0, y0 = max(0, x0 - pad_x), max(0, y0 - pad_y)
        x1, y1 = min(iw, x1 + pad_x), min(ih, y1 + pad_y)
        # Par (yuv420p) y dentro del fotograma.
        x0, y0 = x0 // 2 * 2, y0 // 2 * 2
        x1, y1 = min(iw, x1 // 2 * 2 + 2), min(ih, y1 // 2 * 2 + 2)
        if (x1 - x0) * (y1 - y0) > 0.92 * iw * ih:
            return None
        return (x0, y0, x1 - x0, y1 - y0)
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)
    return None


# ------------------------------------------------------------------- música

def load_music_catalog():
    try:
        with open(MUSIC_CATALOG, encoding='utf-8') as f:
            return {t['name']: t for t in json.load(f)['tracks']}
    except (OSError, ValueError, KeyError):
        return {}


def load_video_templates():
    """Plantillas de vídeo del catálogo (lista de dicts)."""
    if not os.path.exists(VIDEO_CATALOG):
        sys.exit(f'no existe el catálogo de vídeo: {VIDEO_CATALOG}')
    with open(VIDEO_CATALOG, encoding='utf-8') as f:
        return json.load(f)['templates']


def list_video_templates(templates):
    print(f"{'slug':28} {'dur':>6}  nombre / uso")
    for t in templates:
        dur = f"{t.get('duration', 0):.1f}s"
        print(f"{t['slug']:28} {dur:>6}  {t['name']} — {t.get('use', '')}")


def resolve_music(name):
    """Nombre del catálogo, archivo en assets/music/ o ruta. None si no existe."""
    catalog = load_music_catalog()
    if name in catalog:
        p = os.path.join(MUSIC_DIR, catalog[name]['file'])
        return p if os.path.exists(p) else None
    p = os.path.join(MUSIC_DIR, name)
    if os.path.exists(p):
        return p
    p = os.path.expanduser(name)
    return p if os.path.exists(p) else None


# -------------------------------------------------------------------- caras

def detect_faces(image_path, face_box=None):
    """Caras [(x, y, w, h)] en px de imagen.

    Usa face-frame.py con el python del venv del hub (único con cv2).
    Devuelve None si la detección no está disponible (sin venv/cv2 o
    error): quien llama sigue sin chequeo de caras.
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


def main():
    ap = argparse.ArgumentParser(description='Generador de memes de vídeo')
    ap.add_argument('--input', help='clip (.mp4/.mov/…) o imagen de base')
    ap.add_argument('--template', help='plantilla como imagen base (slug o id)')
    ap.add_argument('--video-template', help='clip del catálogo de vídeo (slug)')
    ap.add_argument('--list-video-templates', action='store_true',
                    help='listar las plantillas de vídeo y salir')
    ap.add_argument('--chroma-key', action='store_true',
                    help='quitar el fondo verde (plantillas green screen) '
                         'y componer sobre un fondo sólido')
    ap.add_argument('--chroma-bg', default='black',
                    help='color de fondo con --chroma-key (def. black)')
    ap.add_argument('--allow-green', action='store_true',
                    help='no activar el chroma-key automático aunque la '
                         'plantilla sea green screen')
    ap.add_argument('--text-bg', choices=['auto', 'on', 'off'],
                    default='auto',
                    help='píldora oscura tras el texto: auto (solo si el '
                         'fondo tras el texto es claro), on, off '
                         '(def. auto)')
    ap.add_argument('--top', help='texto superior')
    ap.add_argument('--bottom', help='texto inferior')
    ap.add_argument('--pov', help='texto POV (se antepone «POV: »)')
    ap.add_argument('--caption', help='caption inferior con barra')
    ap.add_argument('--format', choices=['vertical', 'square', 'original'],
                    default='vertical', help='formato de salida')
    ap.add_argument('--duration', type=float, default=5,
                    help='duración en segundos si la base es imagen')
    ap.add_argument('--zoom', action='store_true',
                    help='zoom lento sobre imagen base (zoompan)')
    ap.add_argument('--punch-at', type=float,
                    help='segundo del zoom punch (reacción)')
    ap.add_argument('--punch-scale', type=float, default=1.35,
                    help='escala máxima del punch (def. 1.35)')
    ap.add_argument('--shake', type=float, default=6,
                    help='amplitud del shake en px durante el punch (def. 6)')
    ap.add_argument('--sfx', help='SFX en el golpe: nombre del catálogo '
                    '(boing, vine-boom, sad-trombone…; ver README) o ruta')
    ap.add_argument('--sfx-at', type=float,
                    help='segundo del SFX (def.: el del punch, o 0)')
    ap.add_argument('--freeze-end', type=float, default=0,
                    help='congelar el último fotograma N segundos (remate)')
    ap.add_argument('--freeze-at', type=float,
                    help='congelar el fotograma del segundo T a mitad de clip')
    ap.add_argument('--freeze-dur', type=float, default=1.5,
                    help='duración del freeze a mitad (def. 1.5 s)')
    ap.add_argument('--music', help='cama musical: nombre del catálogo o ruta')
    ap.add_argument('--music-volume', type=float, default=0.25,
                    help='volumen de la música (def. 0.25)')
    ap.add_argument('--speed', type=float, default=1.0,
                    help='velocidad del clip (0.5 lento, 2 rápido)')
    ap.add_argument('--font', default='archivo-black',
                    help='fuente: archivo-black (def.), anton, bangers '
                    'o ruta a un .ttf')
    ap.add_argument('--draft', action='store_true',
                    help='borrador rápido: mitad de resolución (540p) y '
                    'preset veryfast, para iterar antes del render final')
    ap.add_argument('--no-face-check', action='store_true',
                    help='no detectar caras ni desplazar el texto')
    ap.add_argument('--face-box', help='cara sintética x,y,w,h (pruebas)')
    ap.add_argument('--out', help='archivo de salida')
    args = ap.parse_args()

    if args.list_video_templates:
        list_video_templates(load_video_templates())
        return 0

    global FONT
    FONT = resolve_font(args.font)

    # --- Resolver la base ---
    vt_green = False  # la plantilla de vídeo del catálogo es green screen
    if args.input:
        base = os.path.expanduser(args.input)
        if not os.path.exists(base):
            sys.exit(f'no existe: {base}')
        name = os.path.splitext(os.path.basename(base))[0]
    elif args.template:
        with open(CATALOG, encoding='utf-8') as f:
            templates = json.load(f)['templates']
        t = next((x for x in templates
                  if x['slug'] == args.template or str(x['id']) == str(args.template)),
                 None)
        if not t:
            sys.exit(f"plantilla no encontrada: {args.template}")
        base = os.path.join(IMAGES, os.path.basename(t['file']))
        name = t['slug']
    elif args.video_template:
        templates = load_video_templates()
        t = next((x for x in templates if x['slug'] == args.video_template),
                 None)
        if not t:
            sys.exit(f"plantilla de vídeo no encontrada: {args.video_template} "
                     f"(usa --list-video-templates)")
        base = os.path.join(VIDEO_CLIPS, os.path.basename(t['file']))
        if not os.path.exists(base):
            sys.exit(f"falta el clip de la plantilla: {base}")
        name = t['slug']
        vt_green = bool(t.get('green_screen'))
    else:
        ap.error('falta --input, --template o --video-template')

    # --- Guarda green screen: una plantilla green screen sin --chroma-key
    # saldría con el fondo verde entero (pasó con Messi y el 6-7, 19-nov).
    # Se activa el chroma automáticamente y se avisa; --allow-green lo evita.
    if not args.chroma_key and not args.allow_green and not is_image(base):
        if vt_green:
            args.chroma_key = True
            print(f"nota: '{name}' es green screen; activando --chroma-key "
                  f"automáticamente (usa --allow-green para conservar el verde)",
                  file=sys.stderr)
        elif args.input:
            idur = probe(base)['duration'] or 5
            if looks_green_screen(base, idur):
                args.chroma_key = True
                print('nota: el clip parece green screen (bordes verdes); '
                      'activando --chroma-key automáticamente '
                      '(usa --allow-green para conservar el verde)',
                      file=sys.stderr)

    # --- Chroma key (pre-paso): las plantillas green screen se componen
    # sobre un fondo sólido antes de entrar en la cadena normal. Se hace
    # en un pase aparte para no complicar el filtergraph principal.
    # Despill + suavizado del alfa para no dejar halo verde en los bordes.
    key_tmpdir = None
    content_crop = None  # (x, y, w, h) del contenido no-fondo, si recorta
    if args.chroma_key:
        if is_image(base):
            ap.error('--chroma-key solo tiene sentido con un clip de vídeo')
        key_tmpdir = tempfile.mkdtemp(prefix='meme-chroma-')
        keyed = os.path.join(key_tmpdir, 'keyed.mp4')
        kinfo = probe(base)
        kdur = kinfo['duration'] or args.duration
        run(['ffmpeg', '-y', '-v', 'error',
             '-i', base,
             '-f', 'lavfi', '-i',
             f"color=c={args.chroma_bg}:s={kinfo['width']}x{kinfo['height']}:d={kdur}",
             '-filter_complex',
             '[0:v]chromakey=0x00FF00:0.12:0.18,'
             'despill=type=green:mix=0.65:expand=1,'
             'format=yuva420p,split=2[fg][fga];'
             '[fga]alphaextract,boxblur=1:1[al];'
             '[fg][al]alphamerge[fgf];'
             '[1:v][fgf]overlay=0:0[v]',
             '-map', '[v]', '-map', '0:a?',
             '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p',
             '-c:a', 'copy', '-shortest', keyed])
        base = keyed
        # Recorte al contenido: el sujeto llena el formato en vez de
        # flotar en un mar de fondo sólido (el caso del WASTED).
        content_crop = content_bbox(base, parse_bg_color(args.chroma_bg), kdur)
        if content_crop:
            print(f"nota: recorte al contenido "
                  f"{content_crop[2]}x{content_crop[3]} (sin el fondo vacío)",
                  file=sys.stderr)

    still = is_image(base)
    info = probe(base)
    dur = args.duration if still else (info['duration'] or args.duration)
    dur = dur / args.speed
    if args.freeze_at is not None and not (0 <= args.freeze_at < dur):
        sys.exit(f"--freeze-at {args.freeze_at} fuera del clip (0–{dur:.1f} s)")
    freeze_dur = args.freeze_dur if args.freeze_at is not None else 0
    total_dur = dur + freeze_dur + args.freeze_end

    tw, th = FORMATS.get(args.format, (0, 0))
    if args.format == 'original' and not still:
        tw, th = info['width'], info['height']
    elif args.format == 'original':
        tw, th = 1080, 1080
    if args.draft:
        # Borrador: mitad de resolución (par, por yuv420p) y preset rápido.
        tw, th = (tw // 2) // 2 * 2, (th // 2) // 2 * 2

    # --- SFX ---
    sfx_path = None
    if args.sfx:
        if args.sfx in SFX:
            sfx_path = os.path.join(SFX_DIR, SFX[args.sfx])
        elif os.path.exists(os.path.join(SFX_DIR, args.sfx)):
            sfx_path = os.path.join(SFX_DIR, args.sfx)
        elif os.path.exists(os.path.expanduser(args.sfx)):
            sfx_path = os.path.expanduser(args.sfx)
        else:
            sys.exit(f"SFX no encontrado: {args.sfx} "
                     f"({'|'.join(SFX)} o ruta)")
    sfx_at = args.sfx_at if args.sfx_at is not None else (args.punch_at or 0)
    # El SFX vive en la línea de tiempo final: si va después del freeze,
    # se desplaza lo que dura el freeze.
    if args.freeze_at is not None and sfx_at >= args.freeze_at:
        sfx_at += freeze_dur

    # --- Música ---
    music_path = None
    if args.music:
        music_path = resolve_music(args.music)
        if not music_path:
            sys.exit(f"música no encontrada: {args.music} "
                     f"(ver assets/music/music.json o una ruta)")
        if not (0 < args.music_volume <= 1):
            sys.exit('--music-volume debe estar entre 0 y 1')

    # --- Caras + fotograma de muestra (antes de colocar los textos) ---
    face_box = None
    if args.face_box:
        try:
            face_box = [float(v) for v in args.face_box.split(',')]
            assert len(face_box) == 4
        except (ValueError, AssertionError):
            ap.error('--face-box necesita x,y,w,h')
    faces_out = []  # caras en coordenadas de salida
    sample_img = None  # fotograma de muestra (PIL) para la píldora
    tmpdir = tempfile.mkdtemp(prefix='meme-video-')
    try:
        need_sample = bool(args.top or args.bottom or args.pov or args.caption)
        faces = None
        iw, ih = info['width'], info['height']
        if need_sample:
            if still:
                faces = None if args.no_face_check else detect_faces(base, face_box)
                try:
                    sample_img = Image.open(base).convert('RGB')
                except OSError:
                    sample_img = None
            else:
                # Varias muestras: el sujeto se mueve durante el clip
                # (el bebé 6-7 se acerca a cámara); la unión de las
                # caras de 3 fotogramas cubre todo el clip.
                frame_times = sorted({max(0.05, dur * f)
                                      for f in (0.1, 0.5, 0.9)})
                faces = []
                any_detection = False
                for i, tf in enumerate(frame_times):
                    frame = os.path.join(tmpdir, f'frame{i}.jpg')
                    if not extract_frame(base, tf, frame):
                        continue
                    if sample_img is None or i == 1:
                        try:
                            sample_img = Image.open(frame).convert('RGB')
                        except OSError:
                            pass
                    if args.no_face_check:
                        continue
                    det = detect_faces(frame, face_box)
                    if det is not None:
                        any_detection = True
                        faces.extend(det)
                if args.no_face_check or not any_detection:
                    faces = None
            if faces is None and not args.no_face_check:
                print('nota: sin detección de caras (falta el venv del hub '
                      'con cv2); el texto se coloca sin chequeo',
                      file=sys.stderr)

        # Tamaño efectivo tras el recorte al contenido (chroma).
        eff_w, eff_h = iw, ih
        crop_ox, crop_oy = 0, 0
        if content_crop:
            crop_ox, crop_oy, eff_w, eff_h = content_crop
        faces_src = []  # caras en coords del fotograma efectivo
        if faces:
            for (x, y, w, h) in faces:
                faces_src.append((x - crop_ox, y - crop_oy, w, h))

        # --- Encuadre: con cara, recorte centrado en ella; sin cara,
        # fondo difuminado (nunca bandas negras muertas ni recorte ciego).
        zoom_still = still and args.zoom
        if args.format == 'original' or zoom_still or not eff_w or not eff_h:
            # Cover centrado (el de siempre); en zoompan el encuadre lo
            # hace el zoom y esto solo sirve para mapear las caras.
            s = max(tw / eff_w, th / eff_h) if eff_w and eff_h else 1
            sw = max(tw, int(eff_w * s + 0.5) // 2 * 2)
            sh = max(th, int(eff_h * s + 0.5) // 2 * 2)
            framing = {'mode': 'cover', 's': s, 'sw': sw, 'sh': sh,
                       'cx': max(0, (sw - tw) // 2),
                       'cy': max(0, (sh - th) // 2)}
        elif faces_src:
            # Cara principal = la mayor; el recorte se centra en ella.
            px, py, pw, ph = max(faces_src, key=lambda b: b[2] * b[3])
            s = max(tw / eff_w, th / eff_h)
            sw = max(tw, int(eff_w * s + 0.5) // 2 * 2)
            sh = max(th, int(eff_h * s + 0.5) // 2 * 2)
            fcx, fcy = (px + pw / 2) * s, (py + ph / 2) * s
            cx = int(min(max(fcx - tw / 2, 0), max(0, sw - tw))) // 2 * 2
            cy = int(min(max(fcy - th / 2, 0), max(0, sh - th))) // 2 * 2
            framing = {'mode': 'cover', 's': s, 'sw': sw, 'sh': sh,
                       'cx': cx, 'cy': cy, 'face_centered': True}
        else:
            s = min(tw / eff_w, th / eff_h)
            fw = max(2, int(eff_w * s) // 2 * 2)
            fh = max(2, int(eff_h * s) // 2 * 2)
            framing = {'mode': 'blur', 's': s, 'fw': fw, 'fh': fh,
                       'ox': (tw - fw) // 2, 'oy': (th - fh) // 2}

        def src_to_out(x, y):
            """Fuente efectiva -> salida, según el encuadre."""
            if framing['mode'] == 'cover':
                return (x * framing['s'] - framing['cx'],
                        y * framing['s'] - framing['cy'])
            return (x * framing['s'] + framing['ox'],
                    y * framing['s'] + framing['oy'])

        def out_to_src(x, y):
            """Salida -> fuente efectiva, según el encuadre."""
            if framing['mode'] == 'cover':
                return ((x + framing['cx']) / framing['s'],
                        (y + framing['cy']) / framing['s'])
            return ((x - framing['ox']) / framing['s'],
                    (y - framing['oy']) / framing['s'])

        def bg_out_to_src(x, y):
            """Salida -> fuente para el FONDO tras el texto: en modo blur
            el fondo es una copia cover centrada; en cover, el recorte."""
            if framing['mode'] == 'cover':
                return out_to_src(x, y)
            s = max(tw / eff_w, th / eff_h)
            return ((x - (tw - eff_w * s) / 2) / s,
                    (y - (th - eff_h * s) / 2) / s)

        def bg_luminance(rect):
            """Luminancia media (0-255) del fondo tras un rect de salida,
            medida en el fotograma de muestra. None sin muestra."""
            if sample_img is None:
                return None
            x0, y0, x1, y1 = rect
            sx0, sy0 = bg_out_to_src(x0, y0)
            sx1, sy1 = bg_out_to_src(x1, y1)
            sx0, sy0 = sx0 + crop_ox, sy0 + crop_oy
            sx1, sy1 = sx1 + crop_ox, sy1 + crop_oy
            iw0, ih0 = sample_img.size
            sx0, sy0 = max(0, int(sx0)), max(0, int(sy0))
            sx1, sy1 = min(iw0, int(sx1)), min(ih0, int(sy1))
            if sx1 <= sx0 or sy1 <= sy0:
                return None
            region = sample_img.crop((sx0, sy0, sx1, sy1)).convert('L')
            px = list(region.getdata())
            mean = sum(px) / len(px)
            if framing['mode'] == 'blur':
                # El fondo difuminado se oscurece (eq brightness -0.4),
                # pero solo donde el texto cae fuera del sujeto: sobre
                # el sujeto el fondo es el clip sin oscurecer.
                fx0, fy0 = framing['ox'], framing['oy']
                fx1, fy1 = fx0 + framing['fw'], fy0 + framing['fh']
                cxm, cym = (x0 + x1) / 2, (y0 + y1) / 2
                if not (fx0 <= cxm <= fx1 and fy0 <= cym <= fy1):
                    mean = max(0, mean - 100)
            return mean

        for (x, y, w, h) in faces_src:
            ox0, oy0 = src_to_out(x, y)
            ox1, oy1 = src_to_out(x + w, y + h)
            faces_out.append(face_rect((ox0, oy0, ox1 - ox0, oy1 - oy0)))

        # --- Cadena de filtros de vídeo (hasta el texto) ---
        vf = []
        if content_crop:
            cx0, cy0, cw, ch = content_crop
            vf.append(f'crop={cw}:{ch}:{cx0}:{cy0}')
        if zoom_still:
            # Zoom lento sobre la imagen (zoompan), sale ya al tamaño destino.
            frames = max(1, int(dur * FPS))
            vf.append(
                f"zoompan=z='min(zoom+0.0012,1.25)':d={frames}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={tw}x{th}:fps={FPS}")
        elif framing['mode'] == 'blur':
            # Fondo difuminado: copia borrosa y oscurecida detrás del
            # sujeto escalado para encajar (sin bandas negras).
            vf.append(
                f"split=2[bg][fg];"
                f"[bg]scale={tw}:{th}:force_original_aspect_ratio=increase,"
                f"crop={tw}:{th},gblur=sigma=30,"
                f"eq=brightness=-0.4:saturation=0.8[bgf];"
                f"[fg]scale={framing['fw']}:{framing['fh']}[fgf];"
                f"[bgf][fgf]overlay={framing['ox']}:{framing['oy']}")
        else:
            vf.append(f"scale={framing['sw']}:{framing['sh']},"
                      f"crop={tw}:{th}:{framing['cx']}:{framing['cy']}")
        if args.speed != 1.0 and not still:
            # En imágenes la velocidad ya está en la duración (-t / zoompan);
            # aplicar setpts aquí la duplicaría.
            vf.append(f'setpts=PTS/{args.speed}')
        if args.punch_at is not None:
            # Zoom punch: gaussiana de escala + shake gating por la misma envolvente.
            amp = args.punch_scale - 1.0
            sigma = 0.12
            t0 = args.punch_at
            g = f"exp(-pow(t-{t0},2)/(2*pow({sigma},2)))"
            z = f"(1+{amp}*{g})"
            vf.append(f"scale=w='iw*{z}':h='ih*{z}':eval=frame")
            sh = args.shake
            vf.append(
                f"crop={tw}:{th}:"
                f"x='(in_w-{tw})/2+{sh}*sin(2*PI*35*t)*{g}':"
                f"y='(in_h-{th})/2+{sh}*cos(2*PI*29*t)*{g}'")
        vf.append(f'fps={FPS},format=yuv420p')

        # --- Textos: calcular rects, chequear caras, desplazar/achicar ---
        max_w = int(tw * 0.92)
        # specs: [tag, texto, size, lines, kind_final, pill]
        specs = []

        def text_rect(kind, size, lines):
            h_txt = len(lines) * size * 1.15
            if kind == 'top':
                return (int(tw * 0.04), 40, int(tw * 0.96), 40 + h_txt)
            if kind == 'pov':
                return (int(tw * 0.04), 60, int(tw * 0.96), 60 + h_txt)
            if kind == 'bottom':
                return (int(tw * 0.04), th - 40 - h_txt, int(tw * 0.96), th - 40)
            return None

        def y_expr_of(kind, size, lines):
            return {'top': '40', 'pov': '60',
                    'bottom': 'h-text_h-40'}[kind]

        def overlaps_face(rect):
            return any(rects_overlap(rect, f, pad=8) for f in faces_out)

        raw = []
        if args.pov:
            raw.append(('pov', f"POV: {args.pov}", int(th * 0.2), int(tw * 0.075)))
        if args.top:
            raw.append(('top', args.top, int(th * 0.22), int(tw * 0.085)))
        if args.bottom:
            raw.append(('bottom', args.bottom, int(th * 0.22), int(tw * 0.085)))

        for kind, text, max_h, start in raw:
            size, lines = fit_text(text, max_w, max_h, start)
            place_kind = kind
            note = None
            if faces_out:
                # Lado opuesto y luego achicar; con varios textos, cada
                # uno se queda en su lado (no se cruzan).
                other = 'bottom' if kind in ('top', 'pov') else 'top'
                sides = [kind] if len(raw) > 1 else [kind, other]
                placed = False
                for scale in (1.0, 0.8, 0.64, 0.5):
                    if scale < 1.0:
                        s2, l2 = fit_text(text, max_w, max_h,
                                          max(16, int(start * scale)))
                    else:
                        s2, l2 = size, lines
                    for side in sides:
                        if not overlaps_face(text_rect(side, s2, l2)):
                            if side != kind or scale < 1.0:
                                cambios = []
                                if side != kind:
                                    cambios.append('movido ' + ('abajo' if side == 'bottom'
                                                                else 'arriba'))
                                if scale < 1.0:
                                    cambios.append(f'achicado al {int(scale * 100)}%')
                                note = (f"aviso: el texto {kind} tapaba una cara; "
                                        + ', '.join(cambios))
                            place_kind, size, lines = side, s2, l2
                            placed = True
                            break
                    if placed:
                        break
                if not placed:
                    note = (f"aviso: el texto {kind} tapa una cara; "
                            f"verificar a ojo")
            if note:
                print(note, file=sys.stderr)
            # Píldora de legibilidad: en auto, solo si el fondo tras el
            # texto es claro (luminancia > 140).
            pill = False
            if args.text_bg == 'on':
                pill = True
            elif args.text_bg == 'auto':
                lum = bg_luminance(text_rect(place_kind, size, lines))
                pill = lum is not None and lum > 140
            specs.append([kind, text, size, lines, place_kind, pill])

        for tag, text, size, lines, kind, pill in specs:
            vf.append(drawtext_filter('\n'.join(lines), size,
                                      y_expr_of(kind, size, lines),
                                      tmpdir, tag, pill=pill))
        if args.caption:
            bar_h = int(th * 0.11)
            size, lines = fit_text(args.caption, max_w, int(bar_h * 0.75),
                                   int(tw * 0.055))
            if faces_out:
                bar_rect = (0, th - bar_h, tw, th)
                if overlaps_face(bar_rect):
                    print('aviso: la barra del caption tapa una cara; '
                          'verificar a ojo', file=sys.stderr)
            vf.append(f"drawbox=y=ih-{bar_h}:w=iw:h={bar_h}:color=black@0.65:t=fill")
            vf.append(drawtext_filter('\n'.join(lines), size,
                                      f'h-{bar_h}+({bar_h}-text_h)/2',
                                      tmpdir, 'caption'))

        # --- Armar el comando ---
        cmd = ['ffmpeg', '-y', '-v', 'error']
        if still and args.zoom:
            # Una sola imagen: el zoompan genera todos los fotogramas.
            cmd += ['-i', base]
        elif still:
            cmd += ['-loop', '1', '-t', str(dur), '-i', base]
        else:
            cmd += ['-i', base]
        sfx_idx = music_idx = None
        if sfx_path:
            sfx_idx = 1
            cmd += ['-i', sfx_path]
        if music_path:
            music_idx = (2 if sfx_idx is not None else 1)
            cmd += ['-stream_loop', '-1', '-i', music_path]

        need_fc = (args.freeze_at is not None or sfx_path is not None
                   or music_path is not None)
        filtergraph = ','.join(vf)

        if not need_fc:
            # Camino simple de siempre: -vf + atempo si hace falta.
            if args.freeze_end > 0:
                filtergraph += f",tpad=stop_mode=clone:stop_duration={args.freeze_end}"
            cmd += ['-vf', filtergraph]
            if info['has_audio'] and not still and args.speed != 1.0:
                cmd += ['-af', f'atempo={args.speed}']
            has_out_audio = info['has_audio'] and not still
        else:
            parts = [f"[0:v]{filtergraph}[vpre]"]
            vcur = 'vpre'
            if args.freeze_at is not None:
                # Freeze a mitad: pre + fotograma congelado + resto.
                # Si el freeze es en t=0 no hay segmento previo (n=2).
                fa, fd = args.freeze_at, freeze_dur
                if fa <= 0.001:
                    parts.append(f"[{vcur}]split=2[vs1][vs2]")
                    parts.append(
                        f"[vs1]trim={fa}:{fa + 1 / FPS + 0.001},"
                        f"setpts=PTS-STARTPTS,"
                        f"tpad=stop_mode=clone:stop_duration={fd}[vfz]")
                    parts.append(f"[vs2]trim={fa}:,setpts=PTS-STARTPTS[vp2]")
                    parts.append("[vfz][vp2]concat=n=2:v=1:a=0[vfrz]")
                else:
                    parts.append(f"[{vcur}]split=3[vs0][vs1][vs2]")
                    parts.append(f"[vs0]trim=0:{fa},setpts=PTS-STARTPTS[vp1]")
                    parts.append(
                        f"[vs1]trim={fa}:{fa + 1 / FPS + 0.001},"
                        f"setpts=PTS-STARTPTS,"
                        f"tpad=stop_mode=clone:stop_duration={fd}[vfz]")
                    parts.append(f"[vs2]trim={fa}:,setpts=PTS-STARTPTS[vp2]")
                    parts.append("[vp1][vfz][vp2]concat=n=3:v=1:a=0[vfrz]")
                vcur = 'vfrz'
            if args.freeze_end > 0:
                parts.append(
                    f"[{vcur}]tpad=stop_mode=clone:"
                    f"stop_duration={args.freeze_end}[vout]")
                vcur = 'vout'

            # --- Audio ---
            audio_inputs = []
            if info['has_audio'] and not still:
                tempo = f"[0:a]atempo={args.speed}[abase]" \
                    if args.speed != 1.0 else "[0:a]anull[abase]"
                parts.append(tempo)
                if args.freeze_at is not None:
                    # El audio se pausa con la imagen: pre + silencio + resto.
                    fa, fd = args.freeze_at, freeze_dur
                    parts.append(
                        "[abase]aresample=48000,"
                        "aformat=channel_layouts=stereo[abn]")
                    parts.append(
                        "anullsrc=r=48000:cl=stereo,"
                        f"atrim=0:{fd}[asil]")
                    if fa <= 0.001:
                        parts.append(
                            f"[abn]atrim={fa}:,asetpts=PTS-STARTPTS[apost]")
                        parts.append(
                            "[asil][apost]concat=n=2:v=0:a=1[amain]")
                    else:
                        parts.append("[abn]asplit=2[ab1][ab2]")
                        parts.append(
                            f"[ab1]atrim=0:{fa},asetpts=PTS-STARTPTS[apre]")
                        parts.append(
                            f"[ab2]atrim={fa}:,asetpts=PTS-STARTPTS[apost]")
                        parts.append(
                            "[apre][asil][apost]concat=n=3:v=0:a=1[amain]")
                else:
                    parts.append("[abase]anull[amain]")
                audio_inputs.append('[amain]')
            if sfx_idx is not None:
                delay_ms = int(sfx_at * 1000)
                parts.append(
                    f"[{sfx_idx}:a]adelay={delay_ms}:all=1[sfx]")
                audio_inputs.append('[sfx]')
            if music_idx is not None:
                parts.append(
                    f"[{music_idx}:a]aresample=48000,"
                    f"volume={args.music_volume},"
                    f"atrim=0:{total_dur:.2f}[mus]")
                audio_inputs.append('[mus]')
            if audio_inputs:
                if len(audio_inputs) == 1:
                    parts.append(
                        f"{audio_inputs[0]}alimiter=limit=0.95:level=false,"
                        f"apad,atrim=0:{total_dur:.2f}[aout]")
                else:
                    ins = ''.join(audio_inputs)
                    parts.append(
                        f"{ins}amix=inputs={len(audio_inputs)}:"
                        f"duration=longest:normalize=0,"
                        f"alimiter=limit=0.95:level=false,"
                        f"apad,atrim=0:{total_dur:.2f}[aout]")
                cmd += ['-filter_complex', ';'.join(parts),
                        '-map', f'[{vcur}]', '-map', '[aout]']
                has_out_audio = True
            else:
                cmd += ['-filter_complex', ';'.join(parts),
                        '-map', f'[{vcur}]']
                has_out_audio = False

        os.makedirs(OUT_DIR, exist_ok=True)
        out = args.out or os.path.join(
            OUT_DIR, f"{name}-{datetime.now():%Y%m%d-%H%M%S}.mp4")
        cmd += ['-c:v', 'libx264',
                '-preset', 'veryfast' if args.draft else 'medium',
                '-crf', '23' if args.draft else '20',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
        if has_out_audio:
            cmd += ['-c:a', 'aac', '-b:a', '128k']
        cmd += [out]

        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(f"ffmpeg falló:\n{r.stderr[-2000:]}")
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)
        if key_tmpdir:
            shutil.rmtree(key_tmpdir, ignore_errors=True)

    out_info = probe(out)
    print(out)
    print(f"{tw}x{th} px, {out_info['duration']:.1f} s, "
          f"{os.path.getsize(out) // 1024} KB")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
