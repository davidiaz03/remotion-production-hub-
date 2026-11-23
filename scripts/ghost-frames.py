#!/usr/bin/env python3
"""Check de fotogramas fantasma en los cortes (P0-4).

Un «fantasma» son 1-4 fotogramas al inicio de una escena que no
pertenecen a ella: la cola del plano anterior o el inicio sin recortar
del clip fuente. El muestreo a 0,5 s y la detección de escenas de
ffmpeg NO los cazan; hay que extraer denso alrededor de cada corte.

Caso real (22-nov-2026, borrador v2 de negacion-embargo): Bruno
Rodríguez en f465–f468, primeros 4 fotogramas de T3 — la cola del
plano anterior en el soundbite UNifeed. El usuario lo vio a ojo; este
check lo caza por programa antes de entregar el borrador.

Método por corte B (primer fotograma de la escena nueva):
  - Referencia previa: mediana de B-6..B-3 (escena anterior estable).
  - Referencia nueva: mediana de B+4..B+7 (escena nueva estable).
  - Se examinan los 4 primeros fotogramas (B..B+3) con la diferencia
    media absoluta (MAD en color BGR, 160 px de ancho) contra ambas
    refs. En color, no en gris: dos planos con la misma luminancia
    pero distinto matiz (rojo #F00 y verde CSS #008000 difieren solo
    0,004 en gris) serían indistinguibles en gris.
  La extracción es de UNA pasada: un solo ffmpeg extrae la unión de
  todas las ventanas (decodificar desde el inicio por cada corte
  tardaba ~25 s/corte; la pasada única tarda ~1 min en total).
      OK      d_nueva < 0,07   (el fotograma es de la escena nueva;
                               el morph B1, el más fuerte del reel,
                               da 0,065 en f297)
      GHOST   d_previa < 0,03 y d_nueva >= 0,07 (resto del plano anterior)
      REVISAR en otro caso (contenido ajeno a ambas, como Bruno:
              d_previa 0,141 y d_nueva 0,141 en el caso real).
  La ventana de referencia nueva empieza en B+4 para que un fantasma
  de hasta 4 fotogramas no la contamine; un fantasma de 5+ fotogramas
  (167 ms) ya es visible en revisión normal y queda fuera de alcance.

Umbrales calibrados con el caso real (ver scripts/test_ghost_frames.py):
  - Borrador v2 (con fantasma): f465-468 REVISAR.
  - Máster v4 (sin fantasma): f465 d_nueva 0,022 (morph ligero) -> OK.
  - v3/v4 idénticos en f459-472: el fantasma se corrigió antes de v3.

Salida: informe JSON + (con --mark-dir) tiras PNG [fotograma | ref
previa | ref nueva] de cada hallazgo para revisión humana. El ojo
humano solo ve lo marcado, no el video entero.

Códigos de salida: 0 limpio; 1 hay hallazgos (GHOST o REVISAR);
2 error de uso. Ante la duda el check es conservador: un REVISAR
puede ser un efecto de transición legítimo (flash, glitch), y lo
resuelve el ojo humano mirando la tira marcada, no el programa.

Uso:
  ghost-frames.py VIDEO --scenes ESCENAS.json --out INFORME.json
      [--mark-dir DIR] [--fps 30]
  ghost-frames.py VIDEO --cuts 465,585,705 --out INFORME.json
El manifiesto de escenas es el mismo formato que visual-preflight.py
({scenes: [{name, start, end}]}; también acepta start_f/end_f).
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

# Ventanas (en fotogramas, relativas al corte B).
PREV_REF = (-6, -3)   # mediana de B-6..B-3 (escena anterior)
NEW_REF = (4, 7)      # mediana de B+4..B+7 (escena nueva)
CHECK = 4             # fotogramas examinados: B..B+3
# Umbrales de MAD (0-1) calibrados con el caso real (ver docstring).
# OK_NEW 0,07: el morph B1 (T1→T2, el más fuerte del reel: escala
# 1,12→1 + 72 px) da d_nueva 0,065 en f297; el fantasma Bruno daba
# 0,141. El umbral queda entre ambos, con 2x de margen al fantasma.
OK_NEW = 0.07
GHOST_PREV = 0.03
# Ancho de análisis (la altura se ajusta a la proporción del video).
ANALYSIS_W = 160
# Ancho de las tiras marcadas para revisión humana.
MARK_W = 360


def mad(a, b):
    return float(np.mean(np.abs(a - b)))


def frame_verdict(d_prev, d_new):
    """Veredicto de un fotograma a partir de sus distancias."""
    if d_new < OK_NEW:
        return "OK"
    if d_prev < GHOST_PREV:
        return "GHOST"
    return "REVISAR"


def load_scenes(path):
    with open(path) as f:
        data = json.load(f)
    scenes = data.get("scenes") or []
    cuts = []
    for s in scenes[1:]:
        start = s.get("start", s.get("start_f"))
        if start is None:
            continue
        cuts.append({"cut_f": int(start), "scene": s.get("name", "")})
    return cuts, data.get("fps", 30)


def extract_frames(video, wanted, tmpdir):
    """Extrae los fotogramas `wanted` (lista ordenada) a PNG en UNA
    pasada de ffmpeg.

    Devuelve {n_fotograma: ruta}. ffmpeg emite en orden de
    decodificación, así que el i-ésimo archivo es el i-ésimo
    fotograma pedido que existe (los pedidos más allá del final del
    video simplemente no se emiten; el mapeo sigue siendo correcto
    porque los fotogramas existen en rango contiguo desde 0)."""
    if not wanted:
        return {}
    # Rangos contiguos (una ventana por corte; los cortes cercanos se
    # fusionan): 11 términos between() en vez de 154 eq() — la cadena
    # de eq() supera el parser de expresiones de ffmpeg.
    runs = []
    start = prev = wanted[0]
    for n in wanted[1:]:
        if n == prev + 1:
            prev = n
        else:
            runs.append((start, prev))
            start = prev = n
    runs.append((start, prev))
    sel = "+".join(f"between(n\\,{a}\\,{b})" for a, b in runs)
    pat = os.path.join(tmpdir, "f%04d.png")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", video,
         "-vf", f"select='{sel}'", "-vsync", "0", pat],
        check=True)
    out = {}
    for i, n in enumerate(wanted, start=1):
        p = os.path.join(tmpdir, f"f{i:04d}.png")
        if os.path.isfile(p):
            out[n] = p
        else:
            break
    return out


def read_frame(path, width):
    """Fotograma en color (BGR, float 0-1) reescalado al ancho dado."""
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"no se pudo leer {path}")
    if img.shape[1] != width:
        h = max(1, round(img.shape[0] * width / img.shape[1]))
        img = cv2.resize(img, (width, h), interpolation=cv2.INTER_AREA)
    return img.astype(np.float32) / 255.0


def median_ref(frames, lo, hi, width):
    """Mediana por píxel de los fotogramas [lo..hi] del dict frames."""
    arrs = [read_frame(frames[n], width) for n in range(lo, hi + 1)
            if n in frames]
    if not arrs:
        return None
    return np.median(arrs, axis=0)


def mark_strip(frame_path, prev_ref, new_ref, out_path, label):
    """Tira [fotograma | ref previa | ref nueva] para revisión humana."""
    imgs = []
    for src in (frame_path, prev_ref, new_ref):
        if isinstance(src, str):
            img = cv2.imread(src)
        else:
            # Referencia: array BGR float 0-1.
            img = (np.clip(src, 0, 1) * 255).astype("uint8")
        h = round(img.shape[0] * MARK_W / img.shape[1])
        imgs.append(cv2.resize(img, (MARK_W, h)))
    h = max(i.shape[0] for i in imgs)
    strip = np.zeros((h + 28, MARK_W * 3, 3), dtype="uint8")
    for i, img in enumerate(imgs):
        strip[28:28 + img.shape[0], i * MARK_W:(i + 1) * MARK_W] = img
    cv2.putText(strip, label, (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                (255, 255, 255), 1, cv2.LINE_AA)
    cv2.imwrite(out_path, strip)


def analyze_boundary(frames, cut_f, scene, mark_dir=None):
    """Analiza un corte con los fotogramas ya extraídos (dict
    {n_fotograma: ruta}). Devuelve el dict del informe para ese corte."""
    need = [cut_f + i for i in range(CHECK)]
    if any(n not in frames for n in need):
        return {"cut_f": cut_f, "scene": scene, "verdict": "SKIP",
                "note": "fotogramas fuera del video"}
    prev_ref = median_ref(frames, cut_f + PREV_REF[0], cut_f + PREV_REF[1],
                          ANALYSIS_W)
    new_ref = median_ref(frames, cut_f + NEW_REF[0], cut_f + NEW_REF[1],
                         ANALYSIS_W)
    if prev_ref is None or new_ref is None:
        return {"cut_f": cut_f, "scene": scene, "verdict": "SKIP",
                "note": "sin referencia suficiente"}
    rows = []
    worst = "OK"
    for n in need:
        fr = read_frame(frames[n], ANALYSIS_W)
        d_prev = mad(fr, prev_ref)
        d_new = mad(fr, new_ref)
        v = frame_verdict(d_prev, d_new)
        if v == "GHOST":
            worst = "GHOST"
        elif v == "REVISAR" and worst != "GHOST":
            worst = "REVISAR"
        row = {"f": n, "d_prev": round(d_prev, 4),
               "d_new": round(d_new, 4), "verdict": v}
        if v != "OK" and mark_dir:
            mp = os.path.join(mark_dir, f"ghost-f{n:04d}-{v.lower()}.png")
            mark_strip(frames[n], prev_ref, new_ref, mp,
                       f"f{n} {v} d_prev={d_prev:.3f} d_new={d_new:.3f}")
            row["mark"] = mp
        rows.append(row)
    return {"cut_f": cut_f, "scene": scene, "verdict": worst, "frames": rows}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("--scenes", help="manifiesto de escenas (JSON)")
    ap.add_argument("--cuts",
                    help="cortes sueltos, p. ej. 465,585 (sin --scenes)")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--out", required=True, help="informe JSON")
    ap.add_argument("--mark-dir", help="directorio para las tiras marcadas")
    args = ap.parse_args(argv)

    if bool(args.scenes) == bool(args.cuts):
        ap.error("pasar --scenes o --cuts (uno solo)")
    if args.scenes:
        cuts, fps_manifest = load_scenes(args.scenes)
        fps = fps_manifest or args.fps
    else:
        cuts = [{"cut_f": int(c), "scene": ""} for c in args.cuts.split(",")]
        fps = args.fps
    if not cuts:
        print("sin cortes que analizar", file=sys.stderr)
        return 2
    if args.mark_dir:
        os.makedirs(args.mark_dir, exist_ok=True)

    findings = []
    bounds = []
    with tempfile.TemporaryDirectory(prefix="ghost-frames-") as td:
        wanted = sorted({n for c in cuts
                         for n in range(c["cut_f"] + PREV_REF[0],
                                        c["cut_f"] + NEW_REF[1] + 1)
                         if n >= 0})
        frames = extract_frames(args.video, wanted, td)
        for c in cuts:
            b = analyze_boundary(frames, c["cut_f"], c["scene"],
                                 args.mark_dir)
            b["cut_s"] = round(c["cut_f"] / fps, 3)
            bounds.append(b)
            for row in b.get("frames", []):
                if row["verdict"] != "OK":
                    findings.append({"cut_f": c["cut_f"], **row})
    verdict = "OK"
    if any(f["verdict"] == "GHOST" for f in findings):
        verdict = "GHOST"
    elif findings:
        verdict = "REVISAR"
    report = {"video": os.path.abspath(args.video), "fps": fps,
              "thresholds": {"ok_new": OK_NEW, "ghost_prev": GHOST_PREV},
              "windows": {"prev_ref": list(PREV_REF),
                          "new_ref": list(NEW_REF), "check": CHECK},
              "verdict": verdict, "boundaries": bounds,
              "findings": findings}
    with open(args.out, "w") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    n_ghost = sum(1 for f in findings if f["verdict"] == "GHOST")
    n_rev = len(findings) - n_ghost
    print(f"ghost-frames: {verdict} — {len(cuts)} cortes, "
          f"{n_ghost} GHOST, {n_rev} REVISAR")
    for f in findings:
        print(f"  f{f['f']} {f['verdict']} (corte f{f['cut_f']}): "
              f"d_prev={f['d_prev']} d_new={f['d_new']}"
              + (f" mark={f['mark']}" if "mark" in f else ""))
    return 0 if verdict == "OK" else 1


if __name__ == "__main__":
    raise SystemExit(main())
