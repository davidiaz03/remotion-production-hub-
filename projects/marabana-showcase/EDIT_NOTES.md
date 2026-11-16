# EDIT_NOTES.md — Reel escaparate Marabana 40

**Proyecto:** `projects/marabana-showcase/` · **Rama:** `work/marabana-showcase`
**Fecha:** 16-nov-2026 · **Duración:** 55,9 s (1.677 f, 1080×1920, 30 fps)

## Pipeline (en orden)

1. **Guion** (`VO_SCRIPT.md`, `vo-script.json`): 15 fragmentos, 148
   palabras, ángulo «Los que se fueron, los que vinieron» (RESEARCH.md).
2. **VO** (`scripts/audio/gen-vo-kokoro.py`, em_alex, speed 1.1):
   `public/audio/vo-preview.wav` (24 kHz mono, 52,47 s) +
   `vo-lines.json`. A 1.0 salía en 55,13 s (demasiado largo); a 1.1
   queda en el punto dulce. Kokoro es determinista.
3. **Karaoke** (`scripts/audio/transcribe-vo.py`, faster-whisper
   small): `src/captions.ts` (34 chunks, 156 palabras) +
   `public/audio/captions.json` (HubCaption[]). Alineación al guion
   (el texto es el guion, no lo que Whisper cree oír). Export SRT:
   `node scripts/export-srt.mjs marabana-showcase`.
4. **Música** (Flow, stems a −16 LUFS en dos pases): A = shadows
   0–15,8 s @0@14,3; B = shadows 30–63,5 s @12,8@44,2; C = weight
   15–28,7 s @42,7@55,9. Recortes en `public/audio/music-sections/`.
   Beats: shadows BPM 93,0 (122 beats, `beats.py`).
5. **Mezcla** (`scripts/audio/mix.py`, ducking sidechain):
   `public/audio/mix.wav` — **−15,4 LUFS / TP −1,5**, 55,9 s exactos.
   Nota: el objetivo −14,5 no se alcanza con loudnorm en un pase
   (el techo TP −1,5 limita la ganancia; con target −13,1 mide
   −15,4; subir `--music-volume` a 0,5 solo da −15,3 y se descartó
   por inteligibilidad). −15,4 pasa el gate [−16,5, −12,0] con
   1,1 dB de margen; 1,1 LUFS por debajo de la V1.3 (−14,28).
6. **Render** por tramos de 150 f (`scripts/render-chunks.mjs`,
   `--concurrency 2 --timeout 120000 --resume`), 12 tramos.
7. **Máster + ligera** (`scripts/audio/master.py`, receta V1.3:
   trim 40 ms, realce +6 dB/100 ms, alimiter 0,79).
8. **QA** (`scripts/qa-media.mjs --mode full`): gate LUFS/TP +
   silencios + fotogramas.

## Decisiones de mezcla y render

- **SFX en Remotion (`<Sfx>`), no en la mezcla:** 21 SFX del kit CC0
  por sync point (whoosh/pop/boom/riser/sting), todos `underVO`. Los
  posteriores al f1000 van adelantados 7 f (deriva del render por
  tramos, +0,3 s al final; lección V1.3).
- **Audio del sting adelantado 9 f** (local 3 de la secuencia del
  sting; el video arranca en el corte nominal, local 12).
- **Transiciones solo DOM** (slide, waveWipe, whipPan, irisWipe,
  fade): las WebGL (filmBurn, emberBurn…) degradan a corte duro si
  la escena saliente no fue capturada por una transición canvas
  previa, y sus fotogramas tardan 2–8 s bajo SwiftShader. El
  movimiento lo ponen los componentes, no las transiciones.
- **Motion blur solo en el countdown** (`<CameraMotionBlur
  samples={4}>` alrededor del número 1.449→70): multiplica el costo
  del subárbol, pero es solo texto.
- **Karaoke y marca de agua en Sequence acotadas:** el karaoke termina
  en el corte del sting (1587) y la marca hace fade antes (1569–1578).
- **QuoteCard:** su contenedor se renderiza siempre (sin opacidad de
  entrada); en Denuncia y Cierre va envuelto en un fundido para no
  mostrar la tarjeta vacía antes de su `delay` (hallazgo QA f950).
  En Cerco-fase-2 el envoltorio de fase ya lo cubre.

## Assets y procedencia

| Asset | Fuente | Archivo |
|---|---|---|
| Foto héroe (abanderada, Malecón) | CubaNoticias360 / RL Hevia, 1600×844 | `img/cn360-hero.jpg` + recorte vertical `img/hero-vertical.jpg` (474×844, x520–994) y versión oscurecida `img/hero-vertical-dim.jpg` |
| Fotos 1–5 (multitud, noche, MINREX, carrera, meta) | Cubadebate / INDER, 580 px | `img/cubadebate-marabana-{1..5}.jpg` |
| Foto ganadores 21K | Tiempo21, 784×442 | `img/tiempo21-tunas.jpg` (NO usada en el montaje final: las entrevistas en video cubren a los tuneros) |
| Abanderado recortado (parallax 2.5D) | rembg u2net (MIT) sobre foto 1 + recorte al sujeto | `img/cutouts/flag-runner-full.png` (580×490, solo el abanderado en su posición) |
| Video salida + 3 entrevistas | Canal Caribe, 15-nov-2026 (640×360) | `video/cc-start.mp4` (43,5–48 s), `cc-estevez.mp4` (140–145 s), `cc-lopez.mp4` (185–190 s), `cc-tameron.mp4` (215–220 s), `cc-arch-night.mp4` (99–104 s, NO usado) |
| Marca de agua | PNG oficial del Memorial, estrella roja→blanca | `img/logo-white.png` (copia verificada de la V1.3; el original vive en `~/workspace/marabana/assets/`) |
| Sting | Cierre animado oficial, versión negra a 2x | `video/sting-black-2x.mp4` + `audio/sting-2x.wav` (copias verificadas de la V1.3) |
| Música | Google Flow Music (Lyria 3.5), biblioteca del usuario | Stems en `~/workspace/remotion-hub/assets/music/flow/`; secciones en `public/audio/music-sections/` |
| SFX | wyzowl/sfx-kit (CC0), 6 sonidos | `public/audio/sfx/` (copia vía `add-sfx.mjs`) |
| VO | Kokoro-82M (Apache-2.0), voz em_alex | `public/audio/vo-preview.wav` (previsualización) |

## QA de stills (16-nov-2026, ronda 1 — 13 fotogramas)

| Fotograma | Veredicto |
|---|---|
| f30 (gancho) | OK. Héroe + 1.449 + karaoke con DIECINUEVE en rojo. **Fix:** «1449» sin separador → formato manual «1.449» (toLocaleString es-ES no separa 4 cifras). |
| f170 (70) | OK. El 70 rojo aterriza sobre la bandera; karaoke «HOY, SETENTA.» |
| f250 (cerco 1) | **FALLO:** escena vacía 2,5 s (la foto esperaba a «Meliá»). **Fix:** la foto entra en local 20. |
| f350 (cerco 2) | OK (QuoteCard a medio revelar en el still; completa a f380). |
| f480 (vinieron) | OK. Parallax del abanderado + «70 VINIERON IGUAL». |
| f640 (amanecer) | **FALLO:** «ANTES DEL AMANECER» duplicaba el karaoke. **Fix:** «EL SOL SALÍA A LAS 6:43» (dato nuevo, weather.com). |
| f780 (bucle) | **FALLO:** el titular duplicaba el karaoke. **Fix:** «¿QUIÉN ERA?» |
| f950 (denuncia) | **FALLO:** QuoteCard vacía visible antes de su delay. **Fix:** envoltorio con fundido de entrada (también en Cierre). |
| f1130 (ganadores) | OK (3 entrevistas + tarjeta). **Fix:** stagger de filas 41/60/80/90 → 41/52/63/74 (la tarjeta completa se veía solo 1,7 s). |
| f1260 (zapato) | OK (−1:00 + Timer). **Fix:** «PERDIÓ UN MINUTO» → «EN LA PRIMERA VUELTA»; «CAMBIANDO DE ZAPATOS…» → «ESO ME ROMPIÓ LA ESTRATEGIA» (Estévez a Granma, no está en la VO). |
| f1400 (Sardiñas) | OK. **Fix:** «LA COMPLETÓ» → «TIEMPO OFICIAL». |
| f1500 (cierre) | OK. Cita de Gattorno sobre el héroe oscurecido (bookend). |
| f1600 (sting) | OK. Estrella blanca sobre negro; sin marca ni karaoke. |

Ronda 2 (tras los fixes): stills v2-f250, v2-f640, v2-f780, v2-f950,
v2-f1130, v2-f1290 (verificar antes del render completo).

## Sustitución por la voz del usuario

1. Reemplazar `public/audio/vo-preview.wav` por la grabación
   (48 kHz, mono o estéreo; limpiar con DeepFilterNet si hay ruido).
2. Re-transcribir: `transcribe-vo.py --vo <nueva> --lines-json
   <nuevo vo-lines.json>` — ojo: si la grabación no viene línea por
   línea, hay que segmentarla primero (o alinear con los tiempos de
   faster-whisper directamente).
3. Regenerar `src/captions.ts` y re-temporizar los beats si la
   duración cambia (los cortes están en `src/timeline.ts`).
4. Re-mezclar (`mix.py`, mismos `--section`) y re-renderizar.

## Entrega (16-nov-2026)

- **Render:** 12 tramos de 150 f, 1.677/1.677 fotogramas, ~50 min
  (`render-chunks.mjs --concurrency 2 --timeout 120000 --resume`).
- **Máster:** `REEL_MARABANA_SHOWCASE_ALBERTO_20261116.mp4`, 17.460.166 B,
  1080×1920, 56,09 s, **−15,40 LUFS / TP −2,00 dBTP**, sha256
  `1a012c5432c39a565759cedde622b71a1138ffe69ca68fcecb3c33805c0df67f`.
- **Ligera:** `…_LIGERO.mp4`, 4.487.223 B, 720×1280, 56,10 s,
  **−15,50 LUFS / TP −2,10 dBTP**.
- **QA (`qa-media.mjs --mode full`):** technicalStatus passed, sin
  fallos; silencios inicial/final 0 s; deriva de duración 0,185 s
  (tolerancia 0,5 s). Revisión visual del máster: 6 fotogramas
  (f170, f640, f1130, f1400, f1560, f1650) — todos correctos;
  el karaoke final y el logo del sting resuelto verificados.
- **Drive** (carpeta Marabana `1L374oa6XKnlENwy3Xb_54TQ-04t2OnEy`,
  V1–V1.3 intactos): máster `1lL-0YKodvooeCWnPYFDzSqIm6FJyEAkF`,
  ligera `1H-6qZ2lPtqvsNJC2yNnHR6vK9TtiYSOS`,
  `STRATEGY_SHOWCASE.md` `1jIA0CmHpmq32ctLo-CFlno9TLlr7UKxP`,
  `EDIT_NOTES_SHOWCASE.md` `1SK-5P9pJlfvykf1yI6Q2ag27g3JkXHD4`,
  `VO_SCRIPT_SHOWCASE.md` `1bypaOnb1xLwSJQOVwln-rmmuGsQ5V--Z`,
  SRT `1xbqCKOJm2NIAkOashNoFZhMZKrcRgV4r`. Los docs llevan sufijo
  `_SHOWCASE` porque `STRATEGY.md`/`EDIT_NOTES.md` ya existían
  (son los de la V1.3).
- **Commit:** `6c82bff` en `work/marabana-showcase` (+ este registro).

## Pendientes

- **Derechos Flow Music:** leer los términos de Google y registrar
  la comprobación (pista + fecha + qué dicen) en CREATIVE_BRIEF.md
  antes de publicar (FLOW_MUSIC.md lo exige; la página de precios
  no declara derechos comerciales por plan).
- **Etiqueta de contenido IA de Meta** al publicar (voz TTS +
  música Flow + gráfico vectorial).
- **Juicio creativo del usuario** antes de publicar (ritmo, tarjetas,
  entrevistas, voz, música, cierre — ver STRATEGY.md §10).
