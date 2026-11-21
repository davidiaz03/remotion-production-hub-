# Scripts del hub (`scripts/`)

Herramientas de línea de comandos del hub de producción. El módulo de
audio tiene su propio README (`audio/README.md`); los scripts `.mjs`
son el orquestador (proyectos, renders, Drive, checkpoints).

## Pre-vuelo visual (`visual-preflight.py`, hub-speed-v5)

Detecta errores de composición **antes** del render completo: renderiza
1 still por escena con `remotion still` y aplica chequeos automáticos
(fotograma muerto, elemento recortado por el borde, texto sobre cara,
imagen duplicada entre escenas, logotipo ausente). Reporta SOLO los
fotogramas con flags; el humano lee esos + una muestra.

```bash
# Antes del render completo (usa el candado compartido de renders):
~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py \
    --stills --project marti-fidel \
    --manifest tests/fixtures/preflight-scenes-marti-fidel.json \
    --logo-ref <fotograma-con-logo.jpg>

# Sobre fotogramas ya extraídos (validación / auditoría):
~/workspace/remotion-hub/.venv/bin/python scripts/visual-preflight.py \
    --frames-dir projects/marti-fidel/out/frames-v41 \
    --manifest tests/fixtures/preflight-scenes-marti-fidel.json \
    --logo-ref projects/marti-fidel/out/frames-v41/f001.jpg
```

Salida 0 = sin flags bloqueantes; 1 = hay bloqueantes (corregir el
layout y repetir). El manifiesto de escenas (`preflight-scenes.json`)
declara las fronteras por escena y el fotograma a muestrear (por
defecto, el punto medio).

Documentación completa, validación sobre V4.1 (precisión/recall) y
límites conocidos: `docs/HUB-SPEED-V5-PREFLIGHT.md`. Tests:
`scripts/test_visual_preflight.py` (25 tests; `python -m unittest
scripts.test_visual_preflight`).

Requiere el venv del hub (cv2 5.x) y el modelo YuNet
(`~/workspace/remotion-hub/.yunet/`, se descarga solo la primera vez).
