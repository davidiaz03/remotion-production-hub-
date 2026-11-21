#!/usr/bin/env python3
"""
Generador de ideas de memes — tema -> ideas con plantilla y textos.

  python3 meme-ideas.py "el apagón"                  # 8 ideas en texto
  python3 meme-ideas.py "el apagón" --n 12 --json pack-apagon.json
  python3 meme-ideas.py "el apagón" --image          # solo imagen
  python3 meme-ideas.py "el apagón" --video          # solo vídeo
  python3 meme-ideas.py "el apagón" --roles rechazo,dilema,plan

Cada idea trae plantilla sugerida + textos listos (borradores: el usuario
los afina antes de renderizar). Las estructuras de chiste y los patrones
viven en ../templates/roles.json (editables sin tocar código); {T} es el
tema en minúsculas y {TMAY} en mayúsculas.

Con --json escribe un manifiesto de pack que renderiza meme-pack.py tal
cual (o editado a mano):

  python3 meme-ideas.py "el apagón" --json pack.json
  python3 meme-pack.py pack.json

Determinista: sin --seed, la semilla es el tema (mismo tema, mismas
ideas, para poder reproducir un pack). Con --seed N, otra tirada.
"""
import argparse
import hashlib
import json
import os
import random
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ROLES = os.path.join(ROOT, 'templates', 'roles.json')
VIDEO_CATALOG = os.path.join(ROOT, 'video-templates', 'catalog.json')
BOXES = os.path.join(ROOT, 'templates', 'boxes.json')


def load_roles():
    with open(ROLES, encoding='utf-8') as f:
        return json.load(f)


def load_video_catalog():
    with open(VIDEO_CATALOG, encoding='utf-8') as f:
        return {t['slug']: t for t in json.load(f)['templates']}


def load_boxes():
    try:
        with open(BOXES, encoding='utf-8') as f:
            return json.load(f).get('templates', {})
    except (OSError, ValueError):
        return {}


def fill(text, topic):
    """Sustituye {T} y {TMAY} en un patrón.

    Contrae «de el» -> «del» y «a el» -> «al» para que los patrones no
    suelten «HABLAR DE EL APAGÓN» cuando el tema empieza por «el».
    """
    out = text.replace('{TMAY}', topic.upper()).replace('{T}', topic.lower())
    for pat, rep in ((r'\bDE EL\b', 'DEL'), (r'\bde el\b', 'del'),
                     (r'\bA EL\b', 'AL'), (r'\ba el\b', 'al')):
        out = re.sub(pat, rep, out)
    return out


def mock_case(text):
    """Mayúsculas/minúsculas alternas (formato mocking-spongebob)."""
    out, upper = [], True
    for ch in text:
        if ch.isalpha():
            out.append(ch.upper() if upper else ch.lower())
            upper = not upper
        else:
            out.append(ch)
    return ''.join(out)


def pick_templates_with_boxes(templates, boxes, rng):
    """Plantillas con cajas medidas primero (el texto cae en su sitio)."""
    with_boxes = [t for t in templates if t in boxes]
    rest = [t for t in templates if t not in boxes]
    rng.shuffle(with_boxes)
    rng.shuffle(rest)
    return with_boxes + rest


def make_image_idea(topic, role, spec, boxes, rng):
    templates = pick_templates_with_boxes(spec['templates'], boxes, rng)
    template = templates[0]
    # Un patrón puede restringirse a ciertas plantillas
    # ({"texts": [...], "templates": [...]}): solo valen los que encajan
    # con la plantilla elegida; sin restricción, valen todos.
    usable = []
    for p in spec['patterns']:
        if isinstance(p, dict):
            if template in p.get('templates', []):
                usable.append(p['texts'])
        else:
            usable.append(p)
    if not usable:  # la plantilla no tiene patrones propios: usar todos
        usable = [p['texts'] if isinstance(p, dict) else p
                  for p in spec['patterns']]
    pattern = rng.choice(usable)
    texts = [fill(p, topic) for p in pattern]
    # Mocking SpongeBob: el segundo texto va en caso burlón.
    if template == 'mocking-spongebob' and len(texts) > 1:
        texts[1] = mock_case(texts[1].lower())
    # Change My Mind: la caja 1 es el cartel y la 2 el texto de arriba,
    # pero se LEE arriba primero; los patrones vienen en orden de
    # lectura, así que se invierten para mapear a las cajas.
    if template == 'change-my-mind' and len(texts) > 1:
        texts = list(reversed(texts))
    n_boxes = len(boxes.get(template, {}).get('boxes', []))
    item = {'type': 'image', 'template': template, 'texts': texts}
    note = spec['desc']
    if n_boxes:
        note += f" ({n_boxes} cajas medidas: el texto cae en su zona)"
    return {'role': role, 'kind': 'imagen', 'template': template,
            'texts': texts, 'note': note, 'item': item}


def make_video_idea(topic, role, spec, video_catalog, rng):
    templates = list(spec['templates'])
    rng.shuffle(templates)
    template = templates[0]
    pattern = dict(rng.choice(spec['patterns']))
    item = {'type': 'video', 'video_template': template}
    for k, v in pattern.items():
        item[k] = fill(v, topic) if isinstance(v, str) else v
    vt = video_catalog.get(template, {})
    if vt.get('punch_at') is not None and 'punch_at' not in item:
        item['punch_at'] = vt['punch_at']
    text = item.get('top') or item.get('pov') or item.get('caption') or ''
    note = spec['desc']
    if vt.get('green_screen'):
        note += ' (green screen: meme-video.py activa el chroma solo)'
    return {'role': role, 'kind': 'vídeo', 'template': template,
            'texts': [text], 'note': note, 'item': item}


def generate(topic, n=8, kinds=('image', 'video'), roles=None, seed=None):
    roles_data = load_roles()
    video_catalog = load_video_catalog()
    boxes = load_boxes()
    if seed is None:
        seed = int(hashlib.sha256(topic.encode('utf-8')).hexdigest()[:8], 16)
    rng = random.Random(seed)

    pool = []  # (role, spec, kind)
    if 'image' in kinds:
        for role, spec in roles_data['roles'].items():
            if roles and role not in roles:
                continue
            pool.append((role, spec, 'image'))
    if 'video' in kinds:
        for role, spec in roles_data.get('video_roles', {}).items():
            if roles and role not in roles:
                continue
            pool.append((role, spec, 'video'))
    if not pool:
        sys.exit('ningún rol coincide con el filtro '
                 f"({', '.join(roles or [])})")
    rng.shuffle(pool)

    ideas, used_templates, used_combos = [], set(), set()
    i = 0
    # Primera vuelta: un rol distinto por idea, sin repetir plantilla.
    # Si n supera los roles, se repiten roles con otro patrón/plantilla,
    # pero nunca la misma combinación plantilla+textos dos veces.
    while len(ideas) < n:
        role, spec, kind = pool[i % len(pool)]
        idea = None
        for _attempt in range(10):
            if kind == 'image':
                cand = make_image_idea(topic, role, spec, boxes, rng)
            else:
                cand = make_video_idea(topic, role, spec, video_catalog, rng)
            combo = (cand['template'], tuple(cand['texts']))
            if combo not in used_combos:
                idea = cand
                break
            idea = cand  # último recurso: aceptar la repetición
        combo = (idea['template'], tuple(idea['texts']))
        if idea['template'] in used_templates and len(ideas) < len(pool):
            i += 1
            continue
        used_templates.add(idea['template'])
        used_combos.add(combo)
        ideas.append(idea)
        i += 1
        if i > len(pool) * 4 and len(ideas) < n:
            break
    return ideas[:n]


def print_ideas(topic, ideas):
    print(f"ideas para «{topic}» ({len(ideas)}):\n")
    for j, idea in enumerate(ideas, 1):
        print(f"{j}. [{idea['kind']}] {idea['template']} "
              f"(rol: {idea['role']})")
        for t in idea['texts']:
            print(f"   «{t}»")
        print(f"   — {idea['note']}")
    print('\nEdita los textos en el pack JSON y renderiza con meme-pack.py.')


def main():
    ap = argparse.ArgumentParser(
        description='Generador de ideas de memes a partir de un tema')
    ap.add_argument('tema', help='tema del meme, p. ej. "el apagón"')
    ap.add_argument('--n', type=int, default=8,
                    help='número de ideas (def. 8)')
    ap.add_argument('--image', action='store_true', help='solo imagen')
    ap.add_argument('--video', action='store_true', help='solo vídeo')
    ap.add_argument('--roles', help='roles a usar, separados por coma '
                    '(ver templates/roles.json)')
    ap.add_argument('--seed', type=int, default=None,
                    help='semilla aleatoria (def.: el tema, determinista)')
    ap.add_argument('--json', help='escribir el manifiesto de pack en JSON')
    args = ap.parse_args()

    kinds = ('image', 'video')
    if args.image and not args.video:
        kinds = ('image',)
    elif args.video and not args.image:
        kinds = ('video',)
    roles = ([r.strip() for r in args.roles.split(',')]
             if args.roles else None)

    ideas = generate(args.tema, n=args.n, kinds=kinds, roles=roles,
                     seed=args.seed)
    print_ideas(args.tema, ideas)

    if args.json:
        pack = {'name': f"pack-{args.tema.lower().replace(' ', '-')}",
                'topic': args.tema,
                'items': [i['item'] for i in ideas]}
        with open(args.json, 'w', encoding='utf-8') as f:
            json.dump(pack, f, indent=2, ensure_ascii=False)
        print(f"\nmanifiesto escrito: {args.json} "
              f"({len(ideas)} piezas; renderiza con "
              f"python3 scripts/meme-pack.py {args.json})")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
