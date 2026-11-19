# Modern Wisdom: aprender — montaje (Remotion)

Video didáctico HORIZONTAL 1920×1080, 30 fps, PERSONAL (no publicable,
no del Memorial). Dirección creativa e identidad en `CREATIVE_BRIEF.md`.

## Estructura

| Pieza | Descripción |
|---|---|
| `scripts/build-timeline.mjs` | Genera `src/timeline.json` + actualiza `project.json` |
| `src/timeline.json` | Tiempos por línea/capítulo/escena (generado, no editar a mano) |
| `src/Video.tsx` | Composición `MainReel`: 134 escenas + karaoke + barra + cierre |
| `src/components/` | Los 13 tipos de escena de `scenes.json` |
| `src/components/diagrams/` | Los 8 diagramas dibujados en código (divs/SVG) |
| `src/karaoke.ts` | Karaoke placeholder (ver § Karaoke) |
| `src/theme.ts` | Paleta bloqueada + área segura de contenido |

## Timeline: cómo re-ejecutar con la VO real

```bash
cd projects/modern-wisdom-aprende
node scripts/build-timeline.mjs            # mezcla VO real + estimado
node scripts/build-timeline.mjs --real-only  # falla si falta algún capítulo
```

- Los capítulos con `vo-chapters/chNN-lines.json` usan los tiempos reales
  de la VO (verifica que el nº de líneas y el texto coincidan con
  `vo-script.json`; si no, el script aborta con el error exacto).
- Los capítulos sin VO se reparten con `estimated_s` de `chapters.json`,
  proporcional al peso de cada línea (caracteres/800 por min + `pause_after`).
- La duración total es fin del capítulo 14 + 90 fotogramas de cola
  (pantalla final «Éxito es haber actuado.»).
- El script actualiza `project.json` `durationInFrames` (lo lee `Root.tsx`).
- Estado actual: modo `mixed` (VO real ch00–ch03; resto estimado, 38,6 min).

## Decisiones de montaje (documentadas)

- **Transiciones:** fundidos simples de 10 fotogramas entre escenas (el
  fondo es plano `#12100E`, así que fundir a fondo equivale a un fundido
  cruzado limpio); **cortes directos** en los cambios de capítulo
  (title-cards). Sin `TransitionSeries`, sin WebGL, sin motion-blur:
  el render es de ~39 min y debe ser ligero.
- **Barra de progreso:** en el **borde superior** (el inferior lo ocupa
  el karaoke). 15 segmentos proporcionales a la duración de cada capítulo;
  completados en ámbar, activo con relleno parcial, pendientes en gris.
  Debajo, el capítulo activo («CAPÍTULO 4 · ANSIEDAD», 28 px) a la
  izquierda y el contador «5 / 15» a la derecha.
- **Karaoke:** `<BottomKaraoke>` inferior centrado (size 44, longSize 38,
  bottom 90, sideMargin 140, palabra clave ámbar). Se corta al final del
  habla para no quedar sobre la pantalla final.
- **Área segura de contenido:** y 104–884, márgenes laterales 140 px.
  Titulares ≥64 px, cuerpo ≥36 px, nada por debajo de 28 px.
- **Diagramas:** dibujados en código; los peldaños/etapas/nodos se
  iluminan o aparecen repartidos por el avance de la escena.

## Karaoke (pendiente de transcripción real)

`src/karaoke.ts` genera líneas placeholder desde `vo-script.json`:
cada línea de VO es un chunk (partido en dos si pasa de 8 palabras) y
las palabras se reparten uniformemente en el tiempo de habla de la
línea. Sirve para verificar layout y ritmo, NO para el máster final.

Para el karaoke real (TODO marcado en `src/Video.tsx` y `src/karaoke.ts`):
transcribir con `scripts/audio/transcribe-vo.py` (faster-whisper
`word_timestamps`) y usar `whisperWordsToCaptions()` +
`captionsToLines()` del módulo `shared/captions`.

## Verificación

```bash
npx tsc --noEmit   # desde la raíz del repo
# Still de una escena (ejemplo: fotograma 244):
node node_modules/@remotion/cli/remotion-cli.js still \
  projects/modern-wisdom-aprende/src/index.ts MainReel --frame 244 \
  --public-dir projects/modern-wisdom-aprende/public /tmp/still.png
# Tramo de prueba (máx. 90 fotogramas):
npm run preview -- modern-wisdom-aprende --frames 0-89
```

Nota: el primer render compila el bundle (~3 min); los siguientes usan
la caché de webpack y son mucho más rápidos.
