#!/usr/bin/env python3
"""Render del mapa LatAm + EE. UU. para S6 (V4) — «Martí-Fidel».

Por qué existe: `public/img/map-base.png` (V1, bbox lon -125..-28 /
lat -58..33, solo Latinoamérica) NO contiene EE. UU.: el chip
«ESTADOS UNIDOS» de S6 señalaba fuera de cuadro, al norte del mapa.
Este script regenera el mapa con un bbox que incluye el EE. UU.
continental completo (frontera norte 49°N) desde la misma fuente
(Natural Earth 50m admin_0_countries, dominio público), con el mismo
estilo que map-base.png (relleno #22364C, bordes #0C1722, fondo
transparente) y la misma técnica (supersample 2x + LANCZOS).

NO sobrescribe map-base.png: V1/V2/V21-V25 lo usan y quedan intactos.
Salida: public/img/map-latam-usa.png (1400x2200).

Proyección equirectangular uniforme (20 px/grado en ambos ejes):
  bbox lon -125..-55 (70°) / lat -60..50 (110°)
  x = (lon + 125) * 20 ; y = (50 - lat) * 20
Punto EE. UU. (Florida, lon -81.5, lat 28) -> canvas (870, 440).
Verificado visualmente en research/map-latam-usa-check.png.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
GEOJSON = ROOT / 'research' / 'ne50m-admin0.geojson'
OUT = ROOT / 'public' / 'img' / 'map-latam-usa.png'
CHECK = ROOT / 'research' / 'map-latam-usa-check.png'

LON_MIN, LON_MAX = -125.0, -55.0
LAT_MIN, LAT_MAX = -60.0, 50.0
PX_DEG = 20  # px por grado (uniforme en ambos ejes)
SS = 2  # supersample
W = int((LON_MAX - LON_MIN) * PX_DEG)  # 1400
H = int((LAT_MAX - LAT_MIN) * PX_DEG)  # 2200
FILL = (34, 54, 76)  # #22364C, igual que map-base.png
EDGE = (12, 23, 34)  # #0C1722, bordes de map-base.png
SKIP = {'Antarctica'}


def project(lon, lat):
    return ((lon - LON_MIN) * PX_DEG * SS, (LAT_MAX - lat) * PX_DEG * SS)


def iter_polys(geom):
    """Yield (exterior_ring, holes) en coords proyectadas."""
    t = geom['type']
    if t == 'Polygon':
        rings = geom['coordinates']
        yield rings[0], rings[1:]
    elif t == 'MultiPolygon':
        for poly in geom['coordinates']:
            yield poly[0], poly[1:]


def main():
    data = json.loads(GEOJSON.read_text())
    mask = Image.new('L', (W * SS, H * SS), 0)
    md = ImageDraw.Draw(mask)
    borders = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    bd = ImageDraw.Draw(borders)
    n_feat = n_poly = 0
    for feat in data['features']:
        name = feat['properties'].get('NAME') or feat['properties'].get('ADMIN')
        if name in SKIP:
            continue
        geom = feat['geometry']
        if geom is None:
            continue
        drew = False
        for ext, holes in iter_polys(geom):
            pts = [project(lon, lat) for lon, lat in ext]
            xs = [p[0] for p in pts]
            ys = [p[1] for p in pts]
            # Rechazo rápido fuera del canvas.
            if max(xs) < 0 or min(xs) > W * SS or max(ys) < 0 or min(ys) > H * SS:
                continue
            md.polygon(pts, fill=255)
            bd.line(pts + [pts[0]], fill=EDGE + (255,), width=2)
            for hole in holes:
                hpts = [project(lon, lat) for lon, lat in hole]
                md.polygon(hpts, fill=0)
                bd.line(hpts + [hpts[0]], fill=EDGE + (255,), width=2)
            n_poly += 1
            drew = True
        if drew:
            n_feat += 1
    mask = mask.resize((W, H), Image.LANCZOS)
    base = Image.new('RGBA', (W, H), FILL + (0,))
    base.putalpha(mask)
    borders = borders.resize((W, H), Image.LANCZOS)
    out = Image.alpha_composite(base, borders)
    out.save(OUT)
    # Check visual: fondo azul noche + punto Florida marcado.
    check = Image.new('RGBA', (W, H), (10, 20, 32, 255))
    check.alpha_composite(out)
    cd = ImageDraw.Draw(check)
    fx, fy = int((-81.5 - LON_MIN) * PX_DEG), int((LAT_MAX - 28) * PX_DEG)
    cd.ellipse([fx - 14, fy - 14, fx + 14, fy + 14], outline=(237, 28, 36), width=4)
    check.convert('RGB').save(CHECK, quality=92)
    print(f'{OUT.name}: {W}x{H}, {n_feat} features, {n_poly} polígonos')
    print(f'Punto Florida (lon -81.5, lat 28) -> canvas ({fx}, {fy})')


if __name__ == '__main__':
    sys.exit(main())
