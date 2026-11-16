#!/usr/bin/env python3
"""Genera un LUT .cube (17^3 por defecto) a partir de parámetros de etalonaje.

Es la forma reproducible de crear los LUT de ejemplo del hub
(tools/luts/): el .cube es solo la tabla; la receta vive en los
parámetros de este script, así que cualquiera puede regenerar o
variar un LUT sin software de etalonaje.

Uso:
  ~/workspace/remotion-hub/.venv/bin/python tools/make-lut.py \
      --saturation 1.15 --contrast 1.08 --temperature 0.04 \
      -o tools/luts/warm-contrast.cube

Parámetros:
  --saturation  1.0 = sin cambio; >1 más saturado (1.1-1.2 típico).
  --contrast    Curva S alrededor del gris medio; 1.0 = sin cambio.
  --temperature Desplazamiento cálido/frío: +0.05 cálido (más rojo,
                menos azul), -0.05 frío. Rango sensato: -0.08..0.08.
  --lift        Suma a las sombras (0.0-0.05 aclara negros).
  --gain        Multiplica las luces (0.95-1.05).
  --gamma       Gamma por canal (0.9-1.1).
  --size        Lado del cubo (17 por defecto; 33 para máster fino).
"""
import argparse

import numpy as np


def build_lut(size, saturation, contrast, temperature, lift, gain, gamma):
    """Devuelve el cubo (size^3, 3) con el etalonaje aplicado."""
    x = np.linspace(0.0, 1.0, size, dtype=np.float64)
    # Orden .cube: R varía más rápido, luego G, luego B (el más lento).
    # meshgrid 'ij' con ejes (B, G, R): al aplanar en orden C, el último
    # eje (R) varía más rápido. Primera línea = negro (0,0,0).
    b, g, r = np.meshgrid(x, x, x, indexing="ij")
    rgb = np.stack([r, g, b], axis=-1).reshape(-1, 3)

    # 1. Lift / gain / gamma por canal.
    rgb = np.clip(rgb * gain + lift, 0.0, 1.0)
    rgb = np.clip(rgb, 0.0, 1.0) ** gamma

    # 2. Contraste: curva S suave alrededor de 0.5.
    if contrast != 1.0:
        rgb = np.clip((rgb - 0.5) * contrast + 0.5, 0.0, 1.0)

    # 3. Saturación: interpolación hacia/desde la luminancia.
    luma = rgb @ np.array([0.2126, 0.7152, 0.0722])
    rgb = np.clip(luma[:, None] + (rgb - luma[:, None]) * saturation,
                  0.0, 1.0)

    # 4. Temperatura: ganancia por canal (multiplicativa, para que el
    # negro siga siendo negro). Cálido sube R y baja B; frío al revés.
    rgb[:, 0] = np.clip(rgb[:, 0] * (1.0 + 2.0 * temperature), 0.0, 1.0)
    rgb[:, 2] = np.clip(rgb[:, 2] * (1.0 - 2.0 * temperature), 0.0, 1.0)
    return np.clip(rgb, 0.0, 1.0)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("-o", "--output", required=True, help="Archivo .cube")
    p.add_argument("--size", type=int, default=17, help="Lado del cubo")
    p.add_argument("--saturation", type=float, default=1.0)
    p.add_argument("--contrast", type=float, default=1.0)
    p.add_argument("--temperature", type=float, default=0.0)
    p.add_argument("--lift", type=float, default=0.0)
    p.add_argument("--gain", type=float, default=1.0)
    p.add_argument("--gamma", type=float, default=1.0)
    args = p.parse_args()

    lut = build_lut(args.size, args.saturation, args.contrast,
                    args.temperature, args.lift, args.gain, args.gamma)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write("# LUT generado con tools/make-lut.py\n")
        f.write(f"# saturation={args.saturation} contrast={args.contrast} "
                f"temperature={args.temperature} lift={args.lift} "
                f"gain={args.gain} gamma={args.gamma}\n")
        f.write(f"LUT_3D_SIZE {args.size}\n")
        f.write("DOMAIN_MIN 0.0 0.0 0.0\nDOMAIN_MAX 1.0 1.0 1.0\n")
        for r, g, b in lut:
            f.write(f"{r:.6f} {g:.6f} {b:.6f}\n")
    print(f"OK: {args.size}^3 = {len(lut)} entradas -> {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
