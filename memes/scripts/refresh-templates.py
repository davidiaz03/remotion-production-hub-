#!/usr/bin/env python3
"""
Actualiza la biblioteca de plantillas desde la API pública de Imgflip.

  python3 refresh-templates.py [--dry-run] [--contact-sheet]

- Descarga get_memes (100 más populares, sin clave).
- Añade las plantillas nuevas, actualiza los conteos de uso de las que ya
  están y elimina del catálogo las que Imgflip ya no lista (las imágenes
  locales se conservan; solo salen del catálogo).
- Las entradas con source distinto de 'imgflip' (añadidas a mano) se conservan.
- Con --contact-sheet regenera templates/contact-sheet.jpg.
"""
import argparse
import json
import os
import re
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CATALOG = os.path.join(ROOT, 'templates', 'catalog.json')
IMAGES = os.path.join(ROOT, 'templates', 'images')
API = 'https://api.imgflip.com/get_memes'


def slug(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')
    return s or 'meme'


def fetch(m, used):
    s = slug(m['name'])
    if s in used and used[s] != str(m['id']):
        s = f"{s}-{m['id']}"
    ext = os.path.splitext(m['url'])[1].lower() or '.jpg'
    if ext not in ('.jpg', '.jpeg', '.png'):
        ext = '.jpg'
    fn = f"{s}{ext}"
    path = os.path.join(IMAGES, fn)
    if os.path.exists(path):
        return m, s, fn, True
    req = urllib.request.Request(m['url'], headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r, open(path, 'wb') as f:
            f.write(r.read())
        return m, s, fn, True
    except Exception as e:
        print(f"  FAIL {m['name']}: {e}")
        return m, s, fn, False


def main():
    ap = argparse.ArgumentParser(description='Actualizar plantillas desde Imgflip')
    ap.add_argument('--dry-run', action='store_true', help='no escribe nada')
    ap.add_argument('--contact-sheet', action='store_true',
                    help='regenerar la hoja de contacto')
    args = ap.parse_args()

    with open(CATALOG, encoding='utf-8') as f:
        old = json.load(f)
    old_by_id = {str(t['id']): t for t in old['templates']}
    manual = [t for t in old['templates'] if t.get('source') != 'imgflip']

    req = urllib.request.Request(API, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if not data.get('success'):
        raise SystemExit('Imgflip devolvió success=false')
    memes = data['data']['memes']
    used = {t['slug']: str(t['id']) for t in old['templates']}

    catalog, added, updated = [], 0, 0
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(lambda m: fetch(m, used), memes))
    for m, s, fn, ok in results:
        if not ok:
            continue
        prev = old_by_id.get(str(m['id']))
        if prev is None:
            added += 1
        elif prev.get('captions') != m['captions']:
            updated += 1
        catalog.append({
            'id': m['id'], 'name': m['name'], 'slug': s, 'file': f"images/{fn}",
            'url': m['url'], 'width': m['width'], 'height': m['height'],
            'box_count': m['box_count'], 'captions': m['captions'],
            'source': 'imgflip', 'fetched': str(date.today()),
        })
    removed = [t for t in old['templates']
               if t.get('source') == 'imgflip'
               and str(t['id']) not in {str(m['id']) for m in memes}]
    catalog += manual
    catalog.sort(key=lambda c: -c.get('captions', 0))

    print(f"Imgflip: {len(memes)} plantillas · nuevas: {added} · "
          f"actualizadas: {updated} · fuera del top 100: {len(removed)}")
    for t in removed:
        print(f"  sale del catálogo (imagen conservada): {t['slug']}")
    if args.dry_run:
        print('(dry-run: catálogo sin escribir)')
        return 0
    with open(CATALOG, 'w', encoding='utf-8') as f:
        json.dump({'generated': str(date.today()), 'source': API,
                   'count': len(catalog), 'templates': catalog},
                  f, indent=1, ensure_ascii=False)
    print(f"catálogo escrito: {len(catalog)} plantillas")
    if args.contact_sheet:
        import subprocess
        import sys
        subprocess.run([sys.executable,
                        os.path.join(HERE, 'contact-sheet.py')], check=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
