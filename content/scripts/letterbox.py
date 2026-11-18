#!/usr/bin/env python3
"""
Letterbox: acolcha una foto con negro para que la cara quepa en la zona libre.

Los retratos muy ajustados no caben en el layout `background` del carrusel:
la cara ocupa más que la zona libre (entre el kicker y el texto) y ningún
`image_position` la salva. Este script añade barras negras para que la cara
entera quede por encima del texto. El contenido de la foto NO se altera:
solo se añade negro, que se funde con el fondo negro de la plantilla.

Modos:
  --auto (defecto): detecta la cara (YuNet multiescala, como face-frame.py)
    y calcula el acolchado mínimo:
      * si la cara cabe a la escala actual, acolcha solo arriba/abajo para
        crear recorrido vertical y subirla hasta que la barbilla (+ margen
        del 25%) quede 10 px sobre el texto;
      * si la cara es demasiado alta, achica la foto acolchando por los
        cuatro lados hasta que la cara + margen quepa en la zona libre.
  --pad L,T,R,B: acolchado manual en px de imagen (sin detección).
  --face-box x,y,w,h: cara manual en vez de detectada (con --auto).

Uso:
  letterbox.py foto.jpg --out foto-lb.jpg
  letterbox.py foto.jpg --out foto-lb.jpg --canvas 1080x1350 --text-top 780
  letterbox.py foto.jpg --out foto-lb.jpg --pad 0,428,0,428
  letterbox.py foto.jpg --out foto-lb.jpg --face-box 576,590,828,1152

Requiere el venv del hub (cv2 5.x; el python3 del sistema no tiene cv2):
  ~/workspace/remotion-hub/.venv/bin/python content/scripts/letterbox.py ...

Al terminar verifica el resultado con face-frame.py e imprime la posición
sugerida. Sale con código 1 si el resultado sigue teniendo avisos de
encuadre (el aviso de "N caras" es informativo y no cuenta).

Geometría (debe coincidir con templates/carousel/template.html):
  formato square (1080x1080): texto desde y=640, kicker 0-130
  formato 4:5   (1080x1350): texto desde y=780, kicker 0-130
"""
import argparse
import importlib.util
import json
import math
import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent


def load_face_frame():
    """Importa face-frame.py (el guion impide el import normal)."""
    spec = importlib.util.spec_from_file_location(
        "face_frame", SCRIPTS_DIR / "face-frame.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def compute_padding_auto(ff, box, iw, ih, cw, ch, text_top, kicker_h):
    """Acolchado (L, T, R, B) en px de imagen + modo ('pad' o 'shrink').

    Geometría: con object-fit: cover, la escala es s = max(cw/iw, ch/ih).
    La cara (caja + margen de barbilla del 25%) debe quedar entre
    kicker_h + 10 y text_top - 10 en el lienzo. Se calcula con 40 px de
    margen de seguridad en ambos extremos: la detección multiescala no es
    perfectamente estable y la caja re-detectada sobre la imagen acolchada
    puede salir algo mayor que la usada para calcular.
    """
    bx, by, bw, bh = box
    cx, cy = bx + bw / 2, by + bh / 2
    s = max(cw / iw, ch / ih)
    chin = ff.CHIN_MARGIN
    zone = text_top - kicker_h
    top_lim = kicker_h + 40
    bottom_lim = text_top - 40
    # ¿La cara cabe a la escala actual?
    if (1 + chin) * bh * s + 80 <= zone:
        # Acolchado vertical: con py=1 (cara lo más arriba posible), la
        # barbilla queda en (by+bh+P)*s + chin*bh*s + ch - (ih+2P)*s.
        p_min = ((by + bh) * s + chin * bh * s + ch - ih * s
                 - bottom_lim) / s
        # ... y los ojos (30% de la caja) no deben subir bajo el kicker.
        p_max = (((by + 0.30 * bh) * s + ch - ih * s
                  - top_lim)) / s
        if p_min <= p_max:
            p = max(0, math.ceil(p_min))
            return (0, p, 0, p), "pad"
    # Achicar: nueva escala para que cara + margen quepa en la zona, con la
    # cara colocada entre el kicker y el texto.
    s2 = min(s,
             (bottom_lim - top_lim) / ((1 + chin) * bh),
             bottom_lim / (by + (1 + chin) * bh))
    pad_top = max(0, math.ceil(top_lim / s2 - by))
    iw2 = math.ceil(cw / s2)
    ih2 = math.ceil(ch / s2)
    pad_left = round(0.5 * cw / s2 - cx)
    pad_left = max(0, min(pad_left, iw2 - iw))
    pad_top = min(pad_top, ih2 - ih)
    pad_right = iw2 - iw - pad_left
    pad_bottom = ih2 - ih - pad_top
    return (pad_left, pad_top, pad_right, pad_bottom), "shrink"


def pad_image(img, pad):
    """Acolcha con negro. Devuelve la imagen acolchada."""
    import cv2  # importado aquí: solo existe en el venv del hub

    left, top, right, bottom = pad
    return cv2.copyMakeBorder(img, top, bottom, left, right,
                              cv2.BORDER_CONSTANT, value=(0, 0, 0))


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Acolcha una foto con negro para que la cara quepa "
                    "en la zona libre del carrusel.")
    ap.add_argument("image", help="Foto de entrada.")
    ap.add_argument("--out", required=True, help="Foto de salida (p. ej. foto-lb.jpg).")
    ap.add_argument("--canvas", default="1080x1350",
                    help="Lienzo WxH (defecto 1080x1350, formato 4:5).")
    ap.add_argument("--text-top", type=int, default=780,
                    help="Y (px) donde empieza el bloque de texto (defecto 780).")
    ap.add_argument("--kicker", type=int, default=130,
                    help="Altura de la banda del kicker (defecto 130).")
    ap.add_argument("--pad", default=None,
                    help="Acolchado manual L,T,R,B en px (sin detección).")
    ap.add_argument("--face-box", default=None,
                    help="Cara manual x,y,w,h (con --auto; salta la detección).")
    ap.add_argument("--json", action="store_true", help="Salida JSON.")
    args = ap.parse_args(argv)

    import cv2  # noqa: F401 - necesario para leer/escribir la imagen

    ff = load_face_frame()
    cw, ch = (int(v) for v in args.canvas.lower().split("x"))
    img = cv2.imread(args.image)
    if img is None:
        raise SystemExit(f"No se pudo leer la imagen: {args.image}")
    ih, iw = img.shape[:2]

    if args.pad:
        try:
            pad = tuple(int(v) for v in args.pad.split(","))
        except ValueError:
            ap.error("--pad necesita L,T,R,B enteros")
        if len(pad) != 4 or min(pad) < 0:
            ap.error("--pad necesita L,T,R,B enteros >= 0")
        mode = "manual"
        face = None
    else:
        if args.face_box:
            face = tuple(float(v) for v in args.face_box.split(","))
            if len(face) != 4:
                ap.error("--face-box necesita x,y,w,h")
        else:
            boxes = ff.detect_faces(img)
            if not boxes:
                raise SystemExit(
                    "sin cara detectada: usa --face-box x,y,w,h o --pad L,T,R,B")
            face = boxes[0]
        pad, mode = compute_padding_auto(ff, face, iw, ih, cw, ch,
                                         args.text_top, args.kicker)

    out = pad_image(img, pad)
    out_path = Path(args.out)
    params = [cv2.IMWRITE_JPEG_QUALITY, 95] if out_path.suffix.lower() in (
        ".jpg", ".jpeg") else []
    if not cv2.imwrite(str(out_path), out, params):
        raise SystemExit(f"No se pudo escribir: {out_path}")

    # Verificación con face-frame sobre el resultado. Si la cara se dio a
    # mano (--face-box), se verifica esa misma cara desplazada por el
    # acolchado; si se detectó, se vuelve a detectar sobre el resultado
    # (medida independiente: la detección multiescala no es perfectamente
    # estable y la caja puede salir algo mayor).
    if args.face_box:
        shifted = (face[0] + pad[0], face[1] + pad[1], face[2], face[3])
        result = ff.analyse_image(out_path, (cw, ch), args.text_top,
                                  args.kicker, face_box=shifted)
    else:
        result = ff.analyse_image(out_path, (cw, ch), args.text_top,
                                  args.kicker)
    report = {
        "input": args.image,
        "input_size": [iw, ih],
        "output": str(out_path),
        "output_size": [out.shape[1], out.shape[0]],
        "pad": list(pad),
        "mode": mode,
        "face_box": [round(v, 1) for v in face] if face else None,
        "suggested_position": result["suggested_position"],
        "warnings": result["warnings"],
    }
    # El aviso de "N caras" es informativo; los demás son fallos de encuadre.
    blocking = [w for w in result["warnings"]
                if not w.startswith(tuple(f"{n} caras" for n in range(2, 30)))]
    report["ok"] = not blocking
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        print(f"{args.image} ({iw}x{ih}) -> {out_path} "
              f"({out.shape[1]}x{out.shape[0]})")
        print(f"  modo {mode}, acolchado L,T,R,B = {list(pad)} px")
        if face:
            print(f"  cara: caja {[round(v, 1) for v in face]}")
        print(f"  sugerencia image_position: {result['suggested_position']}")
        for w in result["warnings"]:
            print(f"  ! {w}")
        print("  OK: la cara cabe en la zona libre" if report["ok"]
              else "  SIGUE SIN CABER: revisar a ojo o cambiar de foto")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
