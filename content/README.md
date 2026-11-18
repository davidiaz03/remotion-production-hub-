# Hub de contenido estático — Memorial de la Denuncia

Sistema de producción de contenido **estático** (posts, carruseles,
infografías, miniaturas, stories), paralelo al hub de video Remotion.
Misma filosofía: **sistema, no piezas sueltas** — marca en tokens,
plantillas versionadas, renders reproducibles y cada pieza con su estado.

Construido 17-nov-2026, rama `work/content-hub-2026-11-17`.

## Estrategia (por qué así)

| Decisión | Razón |
|---|---|
| Plantillas de **código** (HTML/CSS → PNG) como ruta principal | Control al píxel, datos exactos, reproducibilidad: los mismos datos dan siempre el mismo PNG. Una IA generativa no debe reescribir cifras ni citas. |
| **Canva** como vía editable | El usuario puede retocar en el teléfono. Es el complemento, no el sustituto: Canva no da control preciso ni reproducibilidad. |
| **Pollinations** para ilustración decorativa, **Gemini Pro** para protagonista | Coste y control: lo automático para fondos, lo bueno para lo que manda. Foto real siempre primero. |
| Marca en `brand/tokens.json` | Una sola fuente de verdad; cambiar un color ahí y re-renderizar. |
| Piezas con `STATE.json` | Igual que los reels: un agente en frío sabe dónde quedó cada pieza. |

Ver la matriz completa en [`GUIDE.md`](GUIDE.md).

## Qué hay

```
content/
  README.md / BRAND.md / GUIDE.md / CANVA.md / WORKFLOW.md / COPY.md / RESEARCH.md
  brand/            tokens.json, logo-color.png, fonts/ (Barlow OFL), textures/
  lib/              base.css (estilos compartidos), icons/ (31 Lucide, ISC)
  templates/        post, story, carousel, infographic, thumbnail, quote
  scripts/          render.mjs, cdp.mjs, template.mjs, state.mjs, new-piece.mjs,
                    make-logo-white.py, duotone.py, cutout.py, gen-image.py,
                    postprocess.py, contact-sheet.py, face-frame.py, letterbox.py, density.mjs
  pieces/           piezas en curso (cada una: brief.md, data.json, STATE.json, out/)
  examples/out/     renders de ejemplo (ignorado por git)
```

## Uso rápido

```bash
source ~/workspace/remotion-hub/activate.sh   # Node 22.16 del hub, obligatorio

# 1. Nueva pieza (crea pieces/<slug>/ con brief, data y STATE)
node content/scripts/new-piece.mjs mi-post --template post --title "Mi post"

# 2. Editar pieces/mi-post/brief.md (hechos verificados, copy) y data.json

# 3. Renderizar (PNG máster + JPG ligero; actualiza STATE.json)
node content/scripts/render.mjs --piece mi-post

# 4. Revisión visual: leer el PNG (nunca entregar sin mirarlo)
# 5. Hoja de contacto de todos los ejemplos:
node content/scripts/render.mjs --all-examples
python3 content/scripts/contact-sheet.py
```

## Flujo de una pieza

`brief → borrador → revisión → exportar → entrega`, con `STATE.json` por
pieza. Detalle y checklist de QA en [`WORKFLOW.md`](WORKFLOW.md). La
entrega es siempre en **dos versiones**: PNG máster (publicación) + JPG
ligero (móvil/WhatsApp), igual que los reels.

## Imágenes

- **Real primero**: foto de archivo del Memorial o de Drive.
- **Generada**: `python3 content/scripts/gen-image.py --prompt "..." --out
  pieces/<slug>/img/x.png` (Pollinations, seed fija, sin marca).
  Al publicar con imagen generada: **etiqueta de contenido IA de Meta**.
- **Duotono de marca**: `python3 content/scripts/duotone.py in.jpg out.jpg`.
- **Recorte**: `python3 content/scripts/cutout.py in.jpg out.png` (rembg).
- **Canva**: ver [`CANVA.md`](CANVA.md) (cuándo, cómo, límites verificados).

## Recuperación (si algo falta)

- **Chromium**: el render usa `chrome-headless-shell` de
  `node_modules/.remotion/` del checkout principal. Si no existe, instalar
  dependencias del repo (`npm ci` en el checkout principal) o definir
  `$CHROME_HEADLESS_SHELL`. El modo CLI `--screenshot` se cuelga en esta
  VM; el render usa CDP (ver `scripts/cdp.mjs`).
- **rembg**: `pip install rembg` en el venv del hub; el modelo u2net vive
  en `~/workspace/remotion-hub/.u2net` (si falta, rembg lo descarga solo).
- **YuNet (detección de caras)**: el modelo vive en
  `~/workspace/remotion-hub/.yunet/`; `scripts/face-frame.py` lo descarga
  solo si falta (232 KB, OpenCV Zoo). Requiere el venv del hub
  (`~/workspace/remotion-hub/.venv/bin/python`); el python3 del sistema
  no tiene cv2.
- **Pollinations**: token en `~/workspace/remotion-hub/.env`
  (`POLLINATIONS_TOKEN`); sin token el gateway responde 401.
- **Fuentes/logo**: versionados en `brand/` (las fuentes son OFL; el logo
  es el oficial de Drive, SHA-256 en `brand/tokens.json`).

## Reglas

- Rama `work/*`, sin force-push, no tocar `main` (ver `AGENTS.md`).
- El logo es siempre el **completo** (nunca solo la estrella); sobre rojo
  va la variante blanca (ver `BRAND.md`).
- Prohibido: `@imgly/background-removal-node` (AGPL), código RVM (GPL).
- Nunca copiar tokens/secretos al repo.
- Ninguna pieza se entrega sin QA visual del PNG renderizado.
