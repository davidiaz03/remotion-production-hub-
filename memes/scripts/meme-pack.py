#!/usr/bin/env python3
"""
Render por lotes de memes — un tema, un pack completo en un comando.

  python3 meme-ideas.py "el apagón" --json pack-apagon.json
  python3 meme-pack.py pack-apagon.json
  python3 meme-pack.py pack-apagon.json --dry-run     # ver los comandos
  python3 meme-pack.py pack-apagon.json --skip-video  # solo imagen
  python3 meme-pack.py pack-apagon.json --only 2,5    # re-renderizar piezas

Manifiesto JSON:

  {"name": "pack-apagon", "topic": "el apagón", "items": [
    {"type": "image", "template": "drake-hotline-bling",
     "texts": ["DORMIR 8 HORAS", "PENSAR EN PECES"]},
    {"type": "image", "template": "waiting-skeleton",
     "top": "YO ESPERANDO", "bottom": "QUE VUELVA EL WIFI"},
    {"type": "text", "text": "chiste de una línea"},
    {"type": "comic", "panels": ["waiting-skeleton", "disaster-girl"],
     "texts": ["LA ESPERA", "EL DESASTRE"]},
    {"type": "chat", "chat": "yo: oye|María: cuál"},
    {"type": "video", "video_template": "gta-wasted",
     "top": "CUANDO EL PLAN FALLA", "punch_at": 3, "sfx": "fail",
     "freeze_end": 2}
  ]}

Cada pieza se nombra 01-<plantilla>.jpg (o .mp4) dentro de
../out/<nombre-del-pack>/ (o --out-dir). Al final escribe
pack-manifest.json con el estado de cada pieza y, con --sheet, una hoja
de contacto sheet.jpg con todas las salidas (de los vídeos, el fotograma
central) para revisar el pack de un vistazo.

Los renders se hacen en serie (la caja tiene poca CPU); con --flock RUTA
los vídeos se envuelven en flock para no chocar con otros trabajos
pesados que usen la misma cerradura.
"""
import argparse
import json
import os
import shlex
import subprocess
import sys
import tempfile
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MEME_PY = os.path.join(HERE, 'meme.py')
MEME_VIDEO_PY = os.path.join(HERE, 'meme-video.py')
OUT_ROOT = os.path.join(ROOT, 'out')

# Claves del manifiesto -> flag del CLI (None = booleano sin valor).
IMAGE_OPTS = {
    'template': '--template', 'image': '--image', 'top': '--top',
    'bottom': '--bottom', 'caption': '--caption', 'font': '--font',
    'text_region': '--text-region', 'boxes_dir': '--boxes-dir',
    'deep_fry': '--deep-fry', 'png': '--png',
    'no_face_check': '--no-face-check',
}
VIDEO_OPTS = {
    'video_template': '--video-template', 'template': '--template',
    'input': '--input', 'top': '--top', 'bottom': '--bottom',
    'pov': '--pov', 'caption': '--caption', 'format': '--format',
    'duration': '--duration', 'punch_at': '--punch-at',
    'punch_scale': '--punch-scale', 'shake': '--shake', 'sfx': '--sfx',
    'sfx_at': '--sfx-at', 'freeze_end': '--freeze-end',
    'freeze_at': '--freeze-at', 'freeze_dur': '--freeze-dur',
    'music': '--music', 'music_volume': '--music-volume',
    'speed': '--speed', 'chroma_bg': '--chroma-bg',
    'text_bg': '--text-bg', 'font': '--font',
    'zoom': '--zoom', 'chroma_key': '--chroma-key',
    'allow_green': '--allow-green', 'draft': '--draft',
    'no_face_check': '--no-face-check',
}
BOOL_OPTS = {'--deep-fry', '--png', '--no-face-check', '--zoom',
             '--chroma-key', '--allow-green', '--draft'}


def slugify(text):
    keep = [c if c.isalnum() or c in '-_' else '-' for c in text.lower()]
    return ''.join(keep).strip('-') or 'meme'


def build_command(item, out_path):
    """Manifiesto -> comando [meme.py|meme-video.py ...]."""
    kind = item.get('type')
    if kind == 'image':
        cmd = ['python3', MEME_PY]
        opts = IMAGE_OPTS
    elif kind == 'video':
        cmd = ['python3', MEME_VIDEO_PY]
        opts = VIDEO_OPTS
    elif kind == 'text':
        cmd = ['python3', MEME_PY, '--text-only', item['text']]
        return cmd + ['--out', out_path]
    elif kind == 'comic':
        cmd = ['python3', MEME_PY,
               '--comic', '|'.join(item['panels'])]
        if item.get('texts'):
            cmd += ['--texts', '|'.join(item['texts'])]
        if item.get('font'):
            cmd += ['--font', item['font']]
        return cmd + ['--out', out_path]
    elif kind == 'chat':
        cmd = ['python3', MEME_PY, '--fake-chat', item['chat']]
        return cmd + ['--out', out_path]
    elif kind == 'grid':
        cmd = ['python3', MEME_PY, '--grid', ','.join(item['images'])]
        if item.get('texts'):
            cmd += ['--texts', '|'.join(item['texts'])]
        return cmd + ['--out', out_path]
    else:
        raise ValueError(f"tipo de pieza desconocido: {kind!r} "
                         f"(image|video|text|comic|chat|grid)")

    for key, flag in opts.items():
        if key not in item or item[key] is None:
            continue
        if flag in BOOL_OPTS:
            if item[key]:
                cmd.append(flag)
        else:
            cmd += [flag, str(item[key])]
    if item.get('texts') and kind in ('image',):
        cmd += ['--texts', '|'.join(item['texts'])]
    return cmd + ['--out', out_path]


def item_base_name(item):
    for k in ('video_template', 'template'):
        if item.get(k):
            return slugify(item[k])
    if item.get('image'):
        return slugify(os.path.splitext(
            os.path.basename(item['image']))[0])
    if item.get('input'):
        return slugify(os.path.splitext(
            os.path.basename(item['input']))[0])
    return slugify(item.get('type', 'meme'))


def video_frame(path, out_path):
    """Fotograma central de un vídeo para la hoja de contacto."""
    r = subprocess.run(['ffprobe', '-v', 'error',
                        '-show_entries', 'format=duration',
                        '-of', 'csv=p=0', path],
                       capture_output=True, text=True)
    try:
        dur = float(r.stdout.strip())
    except ValueError:
        dur = 2
    r = subprocess.run(['ffmpeg', '-y', '-v', 'error',
                        '-ss', str(max(0.05, dur / 2)), '-i', path,
                        '-frames:v', '1', out_path],
                       capture_output=True, text=True)
    return r.returncode == 0 and os.path.exists(out_path)


def build_sheet(results, out_path, cols=3):
    """Hoja de contacto del pack: miniaturas + etiqueta de cada pieza."""
    thumbs = []
    for res in results:
        if res['status'] != 'ok':
            continue
        path = res['file']
        try:
            if path.endswith('.mp4'):
                # Fotograma temporal (antes se dejaba un .sheet.jpg
                # junto al vídeo, 21-nov-2026).
                with tempfile.NamedTemporaryFile(suffix='.jpg',
                                                 delete=False) as tmp:
                    frame = tmp.name
                try:
                    if not video_frame(path, frame):
                        continue
                    im = Image.open(frame).convert('RGB')
                finally:
                    if os.path.exists(frame):
                        os.remove(frame)
            else:
                im = Image.open(path).convert('RGB')
            im.thumbnail((360, 360), Image.LANCZOS)
            thumbs.append((res['label'], im))
        except OSError:
            continue
    if not thumbs:
        return False
    try:
        font = ImageFont.truetype(
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
    except OSError:
        font = ImageFont.load_default()
    cell_w, cell_h, label_h = 368, 368, 26
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell_w + 8, rows * (cell_h + label_h) + 8),
                      (245, 245, 245))
    draw = ImageDraw.Draw(sheet)
    for i, (label, im) in enumerate(thumbs):
        x = 8 + (i % cols) * cell_w
        y = 8 + (i // cols) * (cell_h + label_h)
        sheet.paste(im, (x + (cell_w - im.width) // 2,
                         y + (cell_h - im.height) // 2))
        draw.text((x + 4, y + cell_h + 4), label[:44], font=font,
                  fill=(30, 30, 30))
    sheet.save(out_path, 'JPEG', quality=88)
    return True


def main():
    ap = argparse.ArgumentParser(description='Render por lotes de memes')
    ap.add_argument('manifiesto', help='manifiesto JSON del pack')
    ap.add_argument('--out-dir', help='carpeta de salida '
                    '(def. ../out/<nombre-del-pack>-<fecha-hora>)')
    ap.add_argument('--dry-run', action='store_true',
                    help='mostrar los comandos sin renderizar')
    ap.add_argument('--skip-video', action='store_true',
                    help='saltar las piezas de vídeo')
    ap.add_argument('--only', help='solo las piezas N,M… (1-based)')
    ap.add_argument('--sheet', action='store_true',
                    help='hoja de contacto sheet.jpg al final')
    ap.add_argument('--flock', help='cerradura flock para los vídeos '
                    '(p. ej. /tmp/noche-ecosistemas-heavy.lock)')
    ap.add_argument('--no-face-check', action='store_true',
                    help='desactivar la detección de caras en todo el pack')
    args = ap.parse_args()

    with open(args.manifiesto, encoding='utf-8') as f:
        pack = json.load(f)
    items = pack.get('items', [])
    if not items:
        sys.exit('el manifiesto no tiene piezas')
    name = slugify(pack.get('name', 'pack'))
    out_dir = args.out_dir or os.path.join(
        OUT_ROOT, f"{name}-{datetime.now():%Y%m%d-%H%M%S}")
    only = None
    if args.only:
        only = {int(x) for x in args.only.split(',')}

    results = []
    for i, item in enumerate(items, 1):
        label = f"{i:02d}-{item_base_name(item)}"
        if only is not None and i not in only:
            results.append({'index': i, 'label': label, 'status': 'saltado',
                            'item': item})
            continue
        if args.skip_video and item.get('type') == 'video':
            results.append({'index': i, 'label': label, 'status': 'saltado',
                            'item': item})
            continue
        ext = 'mp4' if item.get('type') == 'video' else 'jpg'
        if item.get('png'):
            ext = 'png'
        out_path = os.path.join(out_dir, f"{label}.{ext}")
        try:
            cmd = build_command(item, out_path)
        except (KeyError, ValueError) as e:
            print(f"[{i}/{len(items)}] {label}: ERROR en el manifiesto: {e}",
                  file=sys.stderr)
            results.append({'index': i, 'label': label, 'status': 'error',
                            'error': str(e), 'item': item})
            continue
        if args.no_face_check:
            cmd.insert(-2, '--no-face-check')
        if args.dry_run:
            print(f"[{i}/{len(items)}] {label}:")
            print('  ' + ' '.join(shlex.quote(c) for c in cmd))
            results.append({'index': i, 'label': label, 'status': 'dry-run',
                            'item': item})
            continue
        os.makedirs(out_dir, exist_ok=True)
        run_cmd = cmd
        if args.flock and item.get('type') == 'video':
            run_cmd = ['flock', args.flock, '-c',
                       ' '.join(shlex.quote(c) for c in cmd)]
        print(f"[{i}/{len(items)}] {label} …", flush=True)
        r = subprocess.run(run_cmd, capture_output=True, text=True)
        if r.returncode != 0 or not os.path.exists(out_path):
            err = (r.stderr or r.stdout or 'sin salida').strip().splitlines()
            print(f"  FALLÓ: {err[-1] if err else 'sin detalle'}",
                  file=sys.stderr)
            results.append({'index': i, 'label': label, 'status': 'error',
                            'error': err[-1] if err else 'sin detalle',
                            'item': item})
        else:
            kb = os.path.getsize(out_path) // 1024
            print(f"  OK {out_path} ({kb} KB)")
            results.append({'index': i, 'label': label, 'status': 'ok',
                            'file': out_path, 'item': item})

    ok = sum(1 for r in results if r['status'] == 'ok')
    failed = sum(1 for r in results if r['status'] == 'error')
    skipped = sum(1 for r in results if r['status'] == 'saltado')
    print(f"\npack «{name}»: {ok} OK, {failed} fallos, {skipped} saltados "
          f"de {len(items)} piezas")

    if not args.dry_run:
        manifest = {'name': name, 'topic': pack.get('topic'),
                    'out_dir': out_dir, 'results': results}
        with open(os.path.join(out_dir, 'pack-manifest.json'), 'w',
                  encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"manifiesto: {os.path.join(out_dir, 'pack-manifest.json')}")
        if args.sheet:
            sheet_path = os.path.join(out_dir, 'sheet.jpg')
            if build_sheet(results, sheet_path):
                print(f"hoja de contacto: {sheet_path}")
            else:
                print('hoja de contacto: sin piezas válidas', file=sys.stderr)
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
