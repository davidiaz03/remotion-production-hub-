# Dirección creativa — Modern Wisdom: aprender

**Proyecto:** `modern-wisdom-aprende` · **Rama:** `work/modern-wisdom-aprende`
**Tipo:** video didáctico largo PERSONAL (no para publicar, no del Memorial).
**Plantilla:** motion-reel (explainer animado, módulo `shared/motion/`).
Flujo completo: skill `motion_graphics_reels`.

## Brief

- **Tema y objetivo comunicativo:** que el usuario APRENDA las enseñanzas del podcast
  Modern Wisdom (Chris Williamson) a partir de la investigación propia de ~30
  episodios. No es un reel viral ni un resumen para consumir: es material de estudio
  en video, con 1 acción por capítulo y repetición de la idea clave al final de cada
  capítulo (memoria).
- **Duración y estructura:** ~40 min (30.262 caracteres de VO, 373 líneas),
  15 capítulos numerados 0–14 (ver `chapters.json`): 0 Apertura · 1 El podcast ·
  2 No-necesidad · 3 Confianza · 4 Ansiedad · 5 Conversar · 6 Conectar · 7 Sin mitos ·
  8 Manosfera · 9 Mentalidad · 10 Filtro crítico · 11 Traducción cubana ·
  12 Advertencia · 13 Plan 4 semanas · 14 Cierre. Barra de progreso con los 15
  capítulos visible todo el video.
- **Guion de VO:** `vo-script.json` (formato `gen-vo-kokoro.py`: `{"fragments":
  [{"text", "pause_after", "chapter"}]}`; el campo `chapter` permite generar la voz
  por capítulos). Fuente editable: `vo-script.txt`. Guion legible con notas
  visuales, tarjetas-resumen y preguntas de reflexión: `script.md`.
- **Tono de la VO:** claro, pausado, didáctico, en segunda persona («tú»), español
  neutro con naturalidad cubana leve. Sin hype, sin tono de reel viral, sin
  «suscríbete», sin CTA de ningún tipo.
- **Criterio de contenido (fijo):** CERO pickup, CERO «psicología oscura». Todo el
  contenido viene de la investigación (`investigacion-modern-wisdom.md` +
  `plan-visionado-modern-wisdom.md`); nada inventado. Lo marcado como mito, dudoso,
  preliminar o no verificado se presenta COMO TAL. Cifras que NUNCA se citan como
  datos: control de impulsos Harden (#540), limerencia 64%/32% y autosabotaje 63%
  (#1092), «2 de 5 hombres sin amigos» (#540), Gottman >90% (#1093),
  «Anorexic Hermit Crab» (#1034, sin definición).
- **Fotos/video reales y su procedencia:** ninguno. Video 100% gráfico: tarjetas,
  diagramas simples e ilustraciones generadas. No se usan fotos del podcast ni de
  los invitados.
- **Música:** cama tenue opcional solo en apertura y cierre (Flow: revisar catálogo
  antes de generar; o MusicGen por acto). El cuerpo del video va sin música o con
  cama casi inaudible: es material de estudio, la voz manda. Sin SFX de reel viral;
  como mucho, un pulso suave en los cambios de capítulo.
- **Carpeta de Drive de entrega:** PENDIENTE (definir al montar; proyecto personal,
  no del Memorial).

## Identidad visual de aprendizaje (bloqueada)

- **Fondo:** oscuro limpio, tinta cálida casi negra `#12100E`. Sin texturas, sin
  degradados llamativos, sin resplandor emocional de reel. El fondo no compite con
  el texto.
- **Texto:** hueso `#F2EDE4` para el texto principal; gris cálido `#A8A099` para el
  texto secundario (fuentes de episodios, notas). Tipografía grande y legible:
  titulares ≥90 px, cuerpo de tarjeta ≥54 px, nada por debajo de 44 px a 1920.
  Máximo 2–3 líneas por tarjeta; una idea por tarjeta.
- **UN solo color de acento:** ámbar sobrio `#F0A832`. Un solo significado: «esto es
  lo importante» (palabra clave, capítulo activo en la barra de progreso, sello
  MITO/NO CITAR, fila destacada de una tabla). Todo lo demás es neutro.
  **NO usar el rojo Memorial `#ED1C24`** (este proyecto no es del Memorial).
- **Tarjetas de ideas:** superficie `#1E1B18` con borde fino `#33302B` y radio
  amplio; la tarjeta-resumen de fin de capítulo lleva borde ámbar y el rótulo
  «EN RESUMEN». Las tarjetas de advertencia («No copies la dosis», «NO CITAR»)
  usan borde ámbar, nunca rojo.
- **Diagramas simples:** líneas y nodos en hueso/gris, con el nodo clave en ámbar.
  Sin 3D, sin sombras duras. Ejemplos: jerarquía de 10 peldaños, input → output →
  outcome, estatus vs. creación, looping en 3 pasos, anatomía del mito 80/20.
- **Karaoke:** subtítulo superior palabra a palabra (TopKaraoke), líneas ≤8
  palabras, palabra activa en blanco, palabra clave con recuadro ámbar (1 por
  frase como mucho). Ritmo pausado: la imagen cambia por bloque de ideas
  (~10–15 s), no por frase.
- **SIN logo ni marca del Memorial.** Sin marca de agua. Sin CTA final, sin
  «suscríbete», sin sting de cierre. El video termina en pantalla limpia con la
  métrica: «Éxito es haber actuado.»

## Style prompt BLOQUEADO (ilustraciones)

Adaptación de la plantilla de la skill `motion_graphics_reels` §2 a esta paleta.
Repetir palabra por palabra en cada imagen; solo cambia el sujeto.

```text
Flat 3D illustration, soft studio lighting, smooth matte surfaces,
rounded shapes, warm dark palette: deep charcoal background, bone-white
subjects, single amber accent #F0A832, clean background, no text,
no watermark, vertical 9:16 composition, centered subject with empty
space around it.
```

Reglas: una ilustración por capítulo señalado, literal a lo que dice la VO.
Fondo recortable (rembg vía `tools/bg-remove.py` si la herramienta no da alfa;
NO usar `@imgly/background-removal-node`, AGPL-3.0 prohibido). Animar en Remotion
(flotar suave, parallax, escala con spring); una ilustración quieta más de 2 s es
un póster, no un video. Nunca presentar una ilustración como foto real.

## Ilustraciones de capítulo (6, sujeto literal)

| # | Capítulo | Sujeto (literal a la VO) |
|---|---|---|
| 1 | 2 · No-necesidad | A balance scale: on one pan, a calm person standing; on the other pan, many small reaction faces. The person weighs more. |
| 2 | 3 · Confianza | A stack of stone blocks forming a staircase; a person stepping up one step. |
| 3 | 4 · Ansiedad | A staircase of ten steps climbing a hill; a person standing on the first step. |
| 4 | 5 · Conversar | Two people sitting face to face; one speaks while the other listens attentively; a circular arrow looping between them. |
| 5 | 6 · Conectar | Two cups of coffee on a table; two people laughing together beside it. |
| 6 | 12 · Advertencia | A person surrounded by tall piles of unread books, looking at a clock; beside them, an open door with warm light. |

Los capítulos 7, 8, 10, 11 y 13 usan diagramas y tablas, no ilustración.
Capítulos 0, 1, 9 y 14 usan tarjetas tipográficas.

## Checklist de producción

- [ ] VO de previsualización por capítulos (`scripts/audio/gen-vo-kokoro.py`,
      voz `em_alex`, `--speed 0.95`) desde `vo-script.json` (filtrar por `chapter`).
- [ ] Karaoke desde `transcribe-vo.py` (faster-whisper + `vo-script.json`).
- [ ] Ilustraciones (6) con el style prompt bloqueado + recorte si hace falta.
- [ ] Montaje por capítulos en Remotion (módulo `shared/motion/`: `StepCard`,
      `QuoteCard`, `DiagramFlow`, `TopKaraoke`, barra de progreso de capítulos).
- [ ] Render por tramos (`scripts/render-chunks.mjs`) + máster con
      `scripts/audio/master.py`. OJO: ~40 min de video = render largo; valorar
      render por capítulos y concatenación.
- [ ] QA (`scripts/qa-media.mjs --mode full`: sonoridad, TP, fotogramas) +
      auditoría de audio (`scripts/audio/audit-audio.py`) antes de entregar.
- [ ] Juicio creativo del usuario antes de darlo por terminado (proyecto
      personal: sin publicación).
- [ ] SIN marca de agua y SIN logo del Memorial (proyecto personal).

## Historial editorial

- **19-nov-2026:** guion completo (VO + legible + capítulos) entregado por el
  guionista. 373 líneas, 30.262 caracteres, ~39,9 min estimados. Identidad visual
  de aprendizaje bloqueada (ámbar `#F0A832`, sin rojo Memorial, sin logo).
  Contenido dejado fuera deliberadamente: ver informe del guionista (Armstrong
  #1026, Senra #1126, recopilatorios #800/#900/#1036 salvo ideas integradas,
  Robertson #864/#497, cifras secundarias por espacio/verificación).
