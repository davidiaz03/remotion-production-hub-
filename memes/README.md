# Ecosistema de memes rápidos

El tercer ecosistema del hub, junto al de vídeo (Remotion) y el de contenido
estático (`content/`). Para hacer memes en un comando: imagen, vídeo, o
ambos. **Uso personal, no del Memorial: sin logo ni marca institucional.**

## Arranque rápido

```bash
cd memes
python3 scripts/meme.py --list            # ver las 100 plantillas
```

## Meme de imagen — `scripts/meme.py`

```bash
# Clásico superior/inferior
python3 scripts/meme.py --template one-does-not-simply \
    --top "UNO NO SIMPLEMENTE" --bottom "HACE UN MEME EN UN COMANDO"

# Texto por panel (Drake: imagen a la izquierda, texto a la derecha)
python3 scripts/meme.py --template drake-hotline-bling \
    --texts "DORMIR 8 HORAS|PENSAR EN PECES" --boxes-dir v --text-region right

# Etiquetas lado a lado (Distracted Boyfriend)
python3 scripts/meme.py --template distracted-boyfriend \
    --texts "EL WIFI|YO|MI NOVIA" --boxes-dir h

# Sobre una foto propia (+ pie en barra inferior)
python3 scripts/meme.py --image ~/fotos/gato.jpg --top "YO" --bottom "A LAS 3 AM"

# Solo texto (fondo blanco + texto negro, chiste de una línea)
python3 scripts/meme.py --text-only "si los zombies comen cerebros, un apagón es su ayuno intermitente"

# Rejilla 2x2 (4 imágenes, etiquetas opcionales con --texts)
python3 scripts/meme.py --grid a.jpg,b.jpg,c.jpg,d.jpg --texts "LUNES|MARTES|MIÉRCOLES|YO"

# Chat falso (yo: = derecha/verde; otro nombre = izquierda/blanco)
python3 scripts/meme.py --fake-chat "yo: oye viste el meme|María: cuál|yo: el del pez"

# Deep-fry (imagen frita, estilo dank) — combina con cualquier modo
python3 scripts/meme.py --template disaster-girl --top "YO" --deep-fry
```

Salida por defecto: `memes/out/<base>-<fecha-hora>.jpg`. Con `--png`, PNG.
Texto blanco con borde negro en Archivo Black (sustituta libre de Impact),
tamaño ajustado automáticamente.

## Meme de vídeo — `scripts/meme-video.py`

Los 4 movimientos clásicos: captions grandes + zoom punch en la reacción +
SFX en el golpe + freeze en el remate. Todo con ffmpeg.

```bash
# Caption sobre un clip (vertical 1080x1920 por defecto)
python3 scripts/meme-video.py --input clip.mp4 --top "YO" --bottom "A LAS 3 AM"

# POV
python3 scripts/meme-video.py --input clip.mp4 \
    --pov "cuando el profe dice que hay examen sorpresa"

# El combo completo: punch + SFX + freeze de 3 s en el remate
python3 scripts/meme-video.py --input clip.mp4 --top "CUANDO DICEN 'SOLO 5 MINUTOS'" \
    --punch-at 2.5 --sfx boing --freeze-end 3

# Desde una plantilla o foto, con zoom lento
python3 scripts/meme-video.py --template waiting-skeleton \
    --top "YO ESPERANDO A QUE VUELVA EL WIFI" \
    --duration 6 --zoom --punch-at 3 --sfx slam --freeze-end 3

# Reacción: clip corto + caption con barra
python3 scripts/meme-video.py --input reaccion.mp4 --caption "yo viendo el grupo a las 2 AM"

# Cuadrado y más rápido
python3 scripts/meme-video.py --input clip.mp4 --top "..." --format square --speed 1.5
```

Opciones clave: `--format vertical|square|original`, `--duration` (solo para
imagen base), `--punch-at` (segundo del golpe), `--punch-scale` (def. 1.35),
`--shake` (def. 6 px), `--sfx-at` (si el SFX no va en el punch), `--speed`.

### SFX incluidos (CC0, en `assets/sfx/`)

| Nombre | Archivo | Uso |
| --- | --- | --- |
| `boing` | move-spring.wav | golpe cómico, resorte |
| `slam` | cinematic-slam-big.wav | golpe seco, remate |
| `pop` | pop-large-bubble.wav | aparición, burbuja |
| `zoom` | move-zoom-in.wav | acompañar el punch |

El pack SFX del hub no trae bocina de aire ni rayadura de vinilo; los
equivalentes más cercanos son `slam` y `zoom`. Puedes soltar tus propios
WAV/MP3 en `assets/sfx/` y referenciarlos por nombre o ruta con `--sfx`.

## Vía IA

### Imagen absurda con Pollinations — `scripts/gen-absurd.py`

```bash
python3 scripts/gen-absurd.py --prompt "una paloma con casco de obra mirando un plano" \
    --out assets/ai/paloma.png
# Sin --out: guarda en out/absurd-<fecha-hora>.png
```

Usa el gateway `gen.pollinations.ai` del hub (modelo flux, sin marca de
agua). El token se lee de `~/workspace/remotion-hub/.env` automáticamente.
La imagen generada entra luego a `meme.py --image …` o a `meme-video.py
--input …` como cualquier foto propia. Ver `examples/demo-ia-paloma.png`.

### Vídeo meme con IA — receta (no automatizada)

El usuario tiene autorización permanente para Gemini Pro. Flujo:

1. **Idea + referencia**: elige el formato (remake con estilo fijo + tu
   cara/mascota, animal humanizado, escena absurda). Busca un referente en
   TikTok/Reels y anota qué lo hace funcionar (gancho en el primer
   fotograma, regla de los 3 segundos).
2. **Generar el clip**: en Flow (Veo 3.1) o gemini.google.com (Gemini Omni),
   prompt corto y visual, 5–8 s, vertical. Si el formato es «remake»,
   sube la foto de referencia (cara/mascota) como imagen inicial.
3. **Rematar en el ecosistema**: el clip generado entra a `meme-video.py`
   como `--input` para añadirle caption, zoom punch, SFX y freeze:
   `python3 scripts/meme-video.py --input clip-ia.mp4 --top "…" --punch-at 2 --sfx boing --freeze-end 3`.
4. **Etiqueta de contenido IA** al publicar, como con los reels del hub.

Por qué no está automatizado: Veo/Flow no tienen API pública estable para
este uso; la generación es manual en el navegador y el remate es local.

## Biblioteca de plantillas

100 plantillas actuales de Imgflip (top 100 por uso, 18-nov-2026) en
`templates/images/`, con catálogo en `templates/catalog.json` (slug, id,
URL origen, dimensiones, nº de cajas, usos) y hoja de contacto visual en
`templates/contact-sheet.jpg`.

```bash
# Actualizar: vuelve a tirar de Imgflip, descarga las nuevas y actualiza el catálogo
python3 scripts/refresh-templates.py --contact-sheet
python3 scripts/refresh-templates.py --dry-run   # ver qué cambiaría, sin tocar nada
```

Los formatos de vídeo se revisan contra Know Your Meme, Imgflip trending y
ppl.studio/viral-formats — ver `TRENDS.md`.

## Estructura

```
memes/
  README.md            este archivo
  TRENDS.md            qué funciona hoy (oct–nov 2026) y dónde re-chequear
  LICENSES.md          licencias de plantillas, fuente, SFX e IA
  templates/           biblioteca Imgflip (images/ + catalog.json + contact-sheet.jpg)
  assets/fonts/        Archivo Black (OFL)
  assets/sfx/          4 SFX CC0 para el golpe
  assets/ai/           imágenes absurdas generadas (vacío; gen-absurd.py)
  scripts/             meme.py, meme-video.py, gen-absurd.py,
                       refresh-templates.py, contact-sheet.py
  examples/            demos de prueba (imagen, texto, vídeo, IA)
  out/                 salidas (ignorado por git)
```

## Pruebas

```bash
node --test tests/meme-ecosystem.test.mjs   # 13 pruebas (imagen + vídeo + catálogo)
```

## Pendiente (v1.1)

- Freeze a mitad de clip (`--freeze-at`): hoy solo `--freeze-end` (el
  remate). El freeze intermedio necesita re-sincronizar el audio.
- Bocina de aire y rayadura de vinilo como SFX (no están en el pack CC0).
- Vídeo con IA automatizado (ver receta arriba).
- Detección de caras para no taparlas con el texto (existe `face-frame.py`
  en el content hub; aún no conectado aquí).
