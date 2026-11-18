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

  # Cuadrado, más rápido:
  python3 meme-video.py --input clip.mp4 --top "..." --format square --speed 1.5

SFX incluidos (en ../assets/sfx/):
  boing, slam, pop, zoom (CC0, SFX Kit de Wyzowl)
  airhorn, scratch (sintetizados aquí con ffmpeg, CC0; ver synth-sfx.py)
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

from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, 'templates', 'catalog.json')
IMAGES = os.path.join(ROOT, 'templates', 'images')
FONT = os.path.join(ROOT, 'assets', 'fonts', 'ArchivoBlack-Regular.ttf')
SFX_DIR = os.path.join(ROOT, 'assets', 'sfx')
MUSIC_DIR = os.path.join(ROOT, 'assets', 'music')
MUSIC_CATALOG = os.path.join(MUSIC_DIR, 'music.json')
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
}

FORMATS = {'vertical': (1080, 1920), 'square': (1080, 1080)}
FPS = 30


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
    """Tamaño y líneas con las que el texto cabe en max_w x max_h."""
    size = start_size
    while size > 16:
        lines = wrap_for_width(text, size, max_w)
        if len(lines) * size * 1.15 <= max_h:
            return size, lines
        size -= 4
    return 16, wrap_for_width(text, 16, max_w)


def drawtext_filter(text, size, y_expr, tmpdir, tag):
    """drawtext con el texto en archivo (evita problemas de escape)."""
    path = os.path.join(tmpdir, f'text-{tag}.txt')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    border = max(2, size // 14)
    return (f"drawtext=textfile='{path}':fontfile='{FONT}':fontsize={size}:"
            f"fontcolor=white:borderw={border}:bordercolor=black:"
            f"x=(w-text_w)/2:y={y_expr}")


# ------------------------------------------------------------------- música

def load_music_catalog():
    try:
        with open(MUSIC_CATALOG, encoding='utf-8') as f:
            return {t['name']: t for t in json.load(f)['tracks']}
    except (OSError, ValueError, KeyError):
        return {}


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
    ap.add_argument('--sfx', help='SFX en el golpe: boing|slam|pop|zoom|airhorn|scratch o ruta')
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
    ap.add_argument('--no-face-check', action='store_true',
                    help='no detectar caras ni desplazar el texto')
    ap.add_argument('--face-box', help='cara sintética x,y,w,h (pruebas)')
    ap.add_argument('--out', help='archivo de salida')
    args = ap.parse_args()

    # --- Resolver la base ---
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
    else:
        ap.error('falta --input o --template')

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

    # --- Caras (antes de colocar los textos) ---
    face_box = None
    if args.face_box:
        try:
            face_box = [float(v) for v in args.face_box.split(',')]
            assert len(face_box) == 4
        except (ValueError, AssertionError):
            ap.error('--face-box necesita x,y,w,h')
    faces_out = []  # caras en coordenadas de salida
    tmpdir = tempfile.mkdtemp(prefix='meme-video-')
    try:
        if not args.no_face_check and (args.top or args.bottom or args.pov):
            if still:
                iw, ih = info['width'], info['height']
                faces = detect_faces(base, face_box)
            else:
                iw, ih = info['width'], info['height']
                t_frame = min(1.0, max(0.05, dur / 2))
                frame = os.path.join(tmpdir, 'frame.jpg')
                r = subprocess.run(['ffmpeg', '-y', '-v', 'error',
                                    '-ss', str(t_frame), '-i', base,
                                    '-frames:v', '1', frame],
                                   capture_output=True, text=True)
                faces = (detect_faces(frame, face_box)
                         if r.returncode == 0 else None)
            if faces is None:
                print('nota: sin detección de caras (falta el venv del hub '
                      'con cv2); el texto se coloca sin chequeo',
                      file=sys.stderr)
            elif faces and iw and ih:
                # Mapeo cover (igual que scale+crop del filtro).
                s = max(tw / iw, th / ih)
                ox, oy = (tw - iw * s) / 2, (th - ih * s) / 2
                for (x, y, w, h) in faces:
                    faces_out.append(face_rect(
                        (x * s + ox, y * s + oy, w * s, h * s)))

        # --- Cadena de filtros de vídeo (hasta el texto) ---
        vf = []
        if still and args.zoom:
            # Zoom lento sobre la imagen (zoompan), sale ya al tamaño destino.
            frames = max(1, int(dur * FPS))
            vf.append(
                f"zoompan=z='min(zoom+0.0012,1.25)':d={frames}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={tw}x{th}:fps={FPS}")
        else:
            vf.append(f'scale={tw}:{th}:force_original_aspect_ratio=increase,'
                      f'crop={tw}:{th}')
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

        # --- Textos: calcular rects, chequear caras, desplazar si hace falta ---
        max_w = int(tw * 0.92)
        # specs: (tag, texto, size, lines, y_expr, rect)
        specs = []

        def text_rect(y_expr, size, lines):
            h_txt = len(lines) * size * 1.15
            if y_expr == 'top':
                return (int(tw * 0.04), 40, int(tw * 0.96), 40 + h_txt)
            if y_expr == 'pov':
                return (int(tw * 0.04), 60, int(tw * 0.96), 60 + h_txt)
            if y_expr == 'bottom':
                return (int(tw * 0.04), th - 40 - h_txt, int(tw * 0.96), th - 40)
            return None

        def y_expr_of(kind, size, lines):
            return {'top': '40', 'pov': '60',
                    'bottom': 'h-text_h-40'}[kind]

        def overlaps_face(rect):
            return any(rects_overlap(rect, f, pad=8) for f in faces_out)

        if args.pov:
            text = f"POV: {args.pov}"
            size, lines = fit_text(text, max_w, int(th * 0.2), int(tw * 0.075))
            specs.append(['pov', text, size, lines, 'pov'])
        if args.top:
            size, lines = fit_text(args.top, max_w, int(th * 0.22), int(tw * 0.085))
            specs.append(['top', args.top, size, lines, 'top'])
        if args.bottom:
            size, lines = fit_text(args.bottom, max_w, int(th * 0.22), int(tw * 0.085))
            specs.append(['bottom', args.bottom, size, lines, 'bottom'])

        if faces_out:
            # Solo se desplaza si hay un único texto arriba/abajo y el lado
            # opuesto está libre; con varios textos solo se avisa.
            for s in specs:
                rect = text_rect(s[4], s[2], s[3])
                if rect and overlaps_face(rect):
                    if len(specs) == 1 and s[0] in ('top', 'pov'):
                        alt = text_rect('bottom', s[2], s[3])
                        if not overlaps_face(alt):
                            s[4] = 'bottom'
                            print(f"aviso: el texto {s[0]} tapaba una cara; "
                                  f"movido abajo", file=sys.stderr)
                            continue
                    if len(specs) == 1 and s[0] == 'bottom':
                        alt = text_rect('top', s[2], s[3])
                        if not overlaps_face(alt):
                            s[4] = 'top'
                            print("aviso: el texto inferior tapaba una cara; "
                                  "movido arriba", file=sys.stderr)
                            continue
                    print(f"aviso: el texto {s[0]} tapa una cara; "
                          f"verificar a ojo", file=sys.stderr)

        for tag, text, size, lines, kind in specs:
            vf.append(drawtext_filter('\n'.join(lines), size,
                                      y_expr_of(kind, size, lines),
                                      tmpdir, tag))
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
        cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
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

    out_info = probe(out)
    print(out)
    print(f"{tw}x{th} px, {out_info['duration']:.1f} s, "
          f"{os.path.getsize(out) // 1024} KB")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
