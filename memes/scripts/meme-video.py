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

  # Desde una imagen (plantilla o foto) con zoom lento:
  python3 meme-video.py --template waiting-skeleton --top "YO ESPERANDO EL WIFI" \\
      --duration 6 --zoom --punch-at 3 --sfx slam --freeze-end 3

  # Reacción: clip corto + caption:
  python3 meme-video.py --input reaccion.mp4 --caption "yo viendo el grupo a las 2 AM"

  # Cuadrado, más rápido:
  python3 meme-video.py --input clip.mp4 --top "..." --format square --speed 1.5

SFX incluidos (CC0, SFX Kit de Wyzowl, en ../assets/sfx/):
  boing, slam, pop, zoom — o una ruta a cualquier .wav/.mp3 con --sfx.
  El pack no trae bocina de aire ni rayadura de vinilo; los equivalentes
  más cercanos son slam (golpe) y zoom. Puedes soltar tus propios WAV en
  ../assets/sfx/ y referenciarlos por nombre o ruta.

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
OUT_DIR = os.path.join(ROOT, 'out')

SFX = {
    'boing': 'move-spring.wav',
    'slam': 'cinematic-slam-big.wav',
    'pop': 'pop-large-bubble.wav',
    'zoom': 'move-zoom-in.wav',
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
             'stream=codec_type,width,height', '-show_entries',
             'format=duration', '-of', 'json', path])
    d = json.loads(r.stdout)
    streams = {s['codec_type'] for s in d.get('streams', [])}
    return {
        'duration': float(d.get('format', {}).get('duration') or 0),
        'has_video': 'video' in streams,
        'has_audio': 'audio' in streams,
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
    ap.add_argument('--sfx', help='SFX en el golpe: boing|slam|pop|zoom o ruta')
    ap.add_argument('--sfx-at', type=float,
                    help='segundo del SFX (def.: el del punch, o 0)')
    ap.add_argument('--freeze-end', type=float, default=0,
                    help='congelar el último fotograma N segundos (remate)')
    ap.add_argument('--speed', type=float, default=1.0,
                    help='velocidad del clip (0.5 lento, 2 rápido)')
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
    total_dur = dur + args.freeze_end

    tw, th = FORMATS.get(args.format, (0, 0))
    if args.format == 'original' and not still:
        r = run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                 '-show_entries', 'stream=width,height', '-of', 'csv=p=0', base])
        tw, th = (int(x) for x in r.stdout.strip().split(','))
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
            sys.exit(f"SFX no encontrado: {args.sfx} (boing|slam|pop|zoom o ruta)")
    sfx_at = args.sfx_at if args.sfx_at is not None else (args.punch_at or 0)

    # --- Cadena de filtros de vídeo ---
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

    # --- Textos (con archivos temporales para el escape) ---
    tmpdir = tempfile.mkdtemp(prefix='meme-video-')
    try:
        max_w = int(tw * 0.92)
        if args.pov:
            text = f"POV: {args.pov}"
            size, lines = fit_text(text, max_w, int(th * 0.2), int(tw * 0.075))
            vf.append(drawtext_filter('\n'.join(lines), size, '60', tmpdir, 'pov'))
        if args.top:
            size, lines = fit_text(args.top, max_w, int(th * 0.22), int(tw * 0.085))
            vf.append(drawtext_filter('\n'.join(lines), size, '40', tmpdir, 'top'))
        if args.bottom:
            size, lines = fit_text(args.bottom, max_w, int(th * 0.22), int(tw * 0.085))
            vf.append(drawtext_filter('\n'.join(lines), size,
                                      f'h-text_h-40', tmpdir, 'bottom'))
        if args.caption:
            bar_h = int(th * 0.11)
            size, lines = fit_text(args.caption, max_w, int(bar_h * 0.75),
                                   int(tw * 0.055))
            vf.append(f"drawbox=y=ih-{bar_h}:w=iw:h={bar_h}:color=black@0.65:t=fill")
            vf.append(drawtext_filter('\n'.join(lines), size,
                                      f'h-{bar_h}+({bar_h}-text_h)/2',
                                      tmpdir, 'caption'))

        # Freeze del remate (después del texto: el texto queda congelado también).
        if args.freeze_end > 0:
            vf.append(f'tpad=stop_mode=clone:stop_duration={args.freeze_end}')

        # --- Armar el comando ---
        cmd = ['ffmpeg', '-y', '-v', 'error']
        if still and args.zoom:
            # Una sola imagen: el zoompan genera todos los fotogramas.
            cmd += ['-i', base]
        elif still:
            cmd += ['-loop', '1', '-t', str(dur), '-i', base]
        else:
            cmd += ['-i', base]
        if sfx_path:
            cmd += ['-i', sfx_path]

        filtergraph = ','.join(vf)
        if sfx_path:
            # Mezclar el SFX en su segundo con el audio original (si lo hay).
            delay_ms = int(sfx_at * 1000)
            if info['has_audio'] and not still:
                tempo = f"[0:a]atempo={args.speed}[a0];" if args.speed != 1.0 else ""
                src = "[a0]" if args.speed != 1.0 else "[0:a]"
                af = (f"{tempo}[1:a]adelay={delay_ms}:all=1,volume=1.0[sfx];"
                      f"{src}[sfx]amix=inputs=2:duration=longest:normalize=0,"
                      f"atrim=0:{total_dur:.2f}[aout]")
                cmd += ['-filter_complex',
                        f"[0:v]{filtergraph}[vout];{af}",
                        '-map', '[vout]', '-map', '[aout]']
            else:
                af = (f"[1:a]adelay={delay_ms}:all=1,"
                      f"apad,atrim=0:{total_dur:.2f}[aout]")
                cmd += ['-filter_complex',
                        f"[0:v]{filtergraph}[vout];{af}",
                        '-map', '[vout]', '-map', '[aout]']
        else:
            cmd += ['-vf', filtergraph]
            if info['has_audio'] and not still and args.speed != 1.0:
                cmd += ['-af', f'atempo={args.speed}']

        os.makedirs(OUT_DIR, exist_ok=True)
        out = args.out or os.path.join(
            OUT_DIR, f"{name}-{datetime.now():%Y%m%d-%H%M%S}.mp4")
        cmd += ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
        if sfx_path or (info['has_audio'] and not still):
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
