#!/usr/bin/env python3
"""
Busca plantillas de vídeo meme nuevas en las fuentes de tendencias y,
con --apply, las descarga y las añade al catálogo.

  python3 refresh-video-templates.py               # dry-run: solo informa
  python3 refresh-video-templates.py --apply       # descarga y añade
  python3 refresh-video-templates.py --apply --limit 5

Fuentes:
- Know Your Meme trending (knowyourmeme.com/trending): entradas nuevas.
  KYM no ofrece vídeo directo en la mayoría de entradas, así que con
  --apply solo se intenta descargar si la página de la entrada contiene
  un MP4; si no, se informa para revisarla a mano.
- MemeScreens (memescreens.com, portada): clips green screen con MP4
  directo en media.memescreens.com; con --apply se descargan, se
  verifican con ffprobe y se añaden al catálogo con trend='nuevo' y
  los campos de uso pendientes de revisar por un humano.

El catálogo vive en ../video-templates/catalog.json y los clips en
../video-templates/clips/. Por defecto NO escribe nada (dry-run).
"""
import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.request
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, 'video-templates', 'catalog.json')
CLIPS = os.path.join(ROOT, 'video-templates', 'clips')
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}

KYM_TRENDING = 'https://knowyourmeme.com/trending'
KYM_NAV = {'memes', 'cultures', 'events', 'people', 'sites', 'subcultures'}
MEMESCREENS_HOME = 'https://memescreens.com/'
MAX_BYTES = 100 * 1024 * 1024  # 100 MB por clip; más que eso, revisar a mano


def slugify(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s or 'meme'


def fetch_text(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', 'replace')


def fetch_bytes(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def kym_candidates():
    """Entradas en tendencia de Know Your Meme: [(slug, url)]."""
    html = fetch_text(KYM_TRENDING)
    slugs = sorted(set(re.findall(r'href="/memes/([a-z0-9-]+)"', html)))
    return [(s, f'https://knowyourmeme.com/memes/{s}')
            for s in slugs if s not in KYM_NAV]


def memescreens_candidates():
    """Clips de la portada de MemeScreens: [(slug, url)]."""
    html = fetch_text(MEMESCREENS_HOME)
    paths = sorted(set(re.findall(r'href="(/clips/[a-z0-9-]+)"', html)))
    out = []
    for p in paths:
        # /clips/coffin-dance-e8aaeeab -> slug 'coffin-dance'
        base = p.rsplit('/', 1)[-1]
        slug = re.sub(r'-[0-9a-f]{8}$', '', base)
        out.append((slug, f'https://memescreens.com{p}'))
    return out


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                        '-show_entries', 'stream=width,height',
                        '-show_entries', 'format=duration', '-of', 'json', path],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return None
    d = json.loads(r.stdout)
    if not d.get('streams'):
        return None
    a = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a',
                        '-show_entries', 'stream=codec_name',
                        '-of', 'csv=p=0', path],
                       capture_output=True, text=True)
    return (d['streams'][0]['width'], d['streams'][0]['height'],
            round(float(d['format']['duration']), 2), bool(a.stdout.strip()))


def download_memescreens(slug, page_url):
    """Descarga el MP4 directo de una página de clip de MemeScreens."""
    html = fetch_text(page_url)
    m = re.search(r'https://media\.memescreens\.com/[^"\'\\ ]+\.mp4', html)
    if not m:
        return None, 'sin MP4 directo en la página'
    data = fetch_bytes(m.group(0))
    if len(data) > MAX_BYTES:
        return None, f'demasiado grande ({len(data) // 1024 // 1024} MB)'
    if len(data) < 10000:
        return None, 'archivo sospechosamente pequeño'
    path = os.path.join(CLIPS, f'{slug}.mp4')
    with open(path, 'wb') as f:
        f.write(data)
    info = probe(path)
    if not info:
        os.remove(path)
        return None, 'ffprobe no lo reconoce como vídeo'
    green = 'green-screen' in m.group(0).lower() or 'green' in html.lower()
    return (path, m.group(0), info, green), None


def download_kym(slug, entry_url):
    """Intenta descargar un MP4 directo de una entrada de KYM.

    La mayoría de entradas solo enlazan YouTube; en ese caso devuelve
    (None, motivo) para revisarla a mano.
    """
    html = fetch_text(entry_url)
    m = re.search(r'https?://[^"\'\\ ]+\.mp4', html)
    if not m:
        return None, 'sin vídeo directo (revisar a mano)'
    data = fetch_bytes(m.group(0))
    if len(data) > MAX_BYTES or len(data) < 10000:
        return None, 'tamaño fuera de rango'
    path = os.path.join(CLIPS, f'{slug}.mp4')
    with open(path, 'wb') as f:
        f.write(data)
    info = probe(path)
    if not info:
        os.remove(path)
        return None, 'ffprobe no lo reconoce como vídeo'
    return (path, m.group(0), info, False), None


def main():
    ap = argparse.ArgumentParser(
        description='Buscar plantillas de vídeo nuevas en tendencias')
    ap.add_argument('--apply', action='store_true',
                    help='descargar los candidatos nuevos y añadirlos')
    ap.add_argument('--limit', type=int, default=10,
                    help='máximo de candidatos a descargar con --apply (def. 10)')
    ap.add_argument('--kym-only', action='store_true')
    ap.add_argument('--memescreens-only', action='store_true')
    args = ap.parse_args()

    with open(CATALOG, encoding='utf-8') as f:
        catalog = json.load(f)
    known_slugs = {t['slug'] for t in catalog['templates']}
    known_urls = {t['url'] for t in catalog['templates']}

    sources = []
    if not args.memescreens_only:
        sources.append(('Know Your Meme', kym_candidates, download_kym))
    if not args.kym_only:
        sources.append(('MemeScreens', memescreens_candidates,
                        download_memescreens))

    new_entries, applied = [], 0
    for label, lister, downloader in sources:
        try:
            cands = lister()
        except Exception as e:
            print(f'{label}: no se pudo consultar ({e}); se sigue con lo demás')
            continue
        fresh = [(s, u) for s, u in cands
                 if s not in known_slugs and u not in known_urls]
        print(f'{label}: {len(cands)} en lista · {len(fresh)} nuevos')
        for slug, url in fresh:
            print(f'  NUEVO {slug} — {url}')
            if not args.apply or applied >= args.limit:
                continue
            try:
                got, err = downloader(slug, url)
            except Exception as e:
                print(f'    FAIL al descargar: {e}')
                continue
            if not got:
                print(f'    sin descargar: {err}')
                continue
            path, file_url, (w, h, dur, has_audio), green = got
            name = slug.replace('-', ' ').title()
            new_entries.append({
                'slug': slug, 'name': name, 'file': f'clips/{slug}.mp4',
                'url': url, 'file_url': file_url, 'source': label,
                'origin': 'Pendiente de revisar (añadido por refresh).',
                'use': 'Pendiente de revisar (añadido por refresh).',
                'caption_tip': 'Pendiente de revisar (añadido por refresh).',
                'punch_at': None, 'duration': dur, 'width': w, 'height': h,
                'green_screen': green, 'has_audio': has_audio,
                'trend': 'nuevo', 'added': str(date.today()),
                'notes': 'Añadido automáticamente por refresh-video-templates.py; verificar el clip a ojo y completar origen/uso antes de usarlo.',
            })
            known_slugs.add(slug)
            applied += 1
            print(f'    añadido ({dur}s, {w}x{h}, green_screen={green})')

    if not args.apply:
        print('(dry-run: catálogo sin escribir)')
        return 0
    if new_entries:
        catalog['templates'] += new_entries
        catalog['templates'].sort(key=lambda t: t['slug'])
        catalog['count'] = len(catalog['templates'])
        catalog['generated'] = str(date.today())
        with open(CATALOG, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=1, ensure_ascii=False)
        print(f'catálogo escrito: {catalog["count"]} plantillas '
              f'(+{len(new_entries)} nuevas)')
    else:
        print('nada que añadir')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
