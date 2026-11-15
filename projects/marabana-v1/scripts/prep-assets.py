#!/usr/bin/env python3
"""Prepara los assets de marabana-v1: recortes, motion blur, copias a public/.
Uso: python3 scripts/prep-assets.py
Requiere: PIL, numpy. ffmpeg se invoca aparte (ver prep-media.sh).
"""
import os, shutil
import numpy as np
from PIL import Image

SRC = os.path.expanduser("~/workspace/marabana/assets")
V30 = os.path.expanduser("~/workspace/remotion-hub/repo/projects/pilar-v30/public")
DST = os.path.expanduser("~/workspace/remotion-hub/repo/projects/marabana-v1/public")

os.makedirs(f"{DST}/img", exist_ok=True)
os.makedirs(f"{DST}/video", exist_ok=True)
os.makedirs(f"{DST}/audio", exist_ok=True)

def copy(src, dst):
    shutil.copyfile(src, dst)
    print(f"copy {os.path.basename(src)} -> {dst} ({os.path.getsize(dst)} B)")

# --- 1. Fotos tal cual (las tarjetas las recortan en Remotion) ---
copy(f"{SRC}/photos/cn360-hero.jpg", f"{DST}/img/hero.jpg")
for i in range(1, 7):
    copy(f"{SRC}/photos/cubadebate-marabana-{i}.jpg", f"{DST}/img/photo-{i}.jpg")
copy(f"{SRC}/photos/tiempo21-tunas.jpg", f"{DST}/img/tunas.jpg")

# --- 2. Marca: estrella recortada (reutilizada de V30, verificada 573x530 RGBA) ---
copy(f"{V30}/img/logo-star.png", f"{DST}/img/logo-star.png")
copy(f"{SRC}/MARCA_AGUA_OFICIAL_MEMORIAL.png", f"{DST}/img/logo-full.png")

# --- 3. Héroe vertical: recorte 474x844 con la corredora centrada ---
# Centroide del rojo de la camiseta-bandera: x=758 (medido). Ventana 520-994:
# la corredora queda centrada, su puño (~x950) dentro del encuadre.
hero = Image.open(f"{SRC}/photos/cn360-hero.jpg")
w, h = hero.size
assert (w, h) == (1600, 844), (w, h)
crop = hero.crop((520, 0, 994, 844))  # 474x844 = ratio 9:16
crop.save(f"{DST}/img/hero-vertical.jpg", quality=92)
print(f"hero-vertical: {crop.size} (ratio {crop.size[0]/crop.size[1]:.4f}, objetivo 0.5625)")

# --- 4. Motion-blur trail para photo-4 (corredores, dorsal 870) ---
# Método final (verificado visualmente): desenfoque de movimiento horizontal
# (kernel 31px, OpenCV) mezclado 55% nítido / 45% desenfocado. Los fantasmas
# discretos no se leían sobre el fondo concurrido; el blur horizontal sí se lee
# como paneo de velocidad y mantiene las caras legibles. Requiere el venv del hub
# (tiene OpenCV): ~/workspace/remotion-hub/.venv/bin/python scripts/prep-assets.py
import cv2
_img = cv2.imread(f"{SRC}/photos/cubadebate-marabana-4.jpg")
_k = np.zeros((31, 31), np.float32); _k[15, :] = 1 / 31
_blur = cv2.filter2D(_img, -1, _k)
_out = cv2.addWeighted(_img, 0.55, _blur, 0.45, 0)
cv2.imwrite(f"{DST}/img/photo-4-trail.jpg", _out, [cv2.IMWRITE_JPEG_QUALITY, 92])
print(f"photo-4-trail: {_out.shape} (motion blur horizontal 31px, 55/45)")

print("OK prep-assets.py")
