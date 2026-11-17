# CREATIVE BRIEF — «Martí-Fidel: leer, pensar»

**Proyecto:** `marti-fidel` · **Rama:** `work/marti-fidel` · **Fecha:** 17-nov-2026
**Encargo:** propuesta de David Manuel a la directora Suleris Coss Díaz
(ella pidió propuestas por separado a Adriana y a David Manuel, a partir
del ensayo «Martí-Fidel: leer, pensar»). El video terminado ES la propuesta.
**Estrategia y guion (verificados, no modificar):**
`~/workspace/remotion-hub/projects/marti-fidel/research/STRATEGY.md`
**Guía de edición viral:**
`.../research/guia-edicion-reels-virales-2025-2026.md`

## Concepto

**Ángulo:** «Ya estaba escrito en 1891» — la votación ONU del 28-oct-2026
(130 a favor, 35 menos que en 2025) como prueba en cifras de lo que Martí
advirtió en «Nuestra América» (1891) y Fidel en 2005. Estructura:
cifra → caída → cita. Tono: indignación contenida + orgullo de archivo.
Diseñado para guardado (datos del mapa) y envío (confesión + contraste
1891→2026).

**Formato:** vertical 1080×1920, 30 fps, **1507 fotogramas = 50,23 s**
(VO real 45,69 s + hold 1,5 s + sting 2x 3,04 s). Motion graphics
documental oscuro + acento rojo + retratos de archivo. Sin presentador
(no hay material): los gráficos y el dato hacen el trabajo de atención.

## V1.1 (17-nov-2026) — correcciones de la auditoría V1

Auditoría independiente en `AUDIT-V1.md` (17 fotogramas + transcripción
completa): veredicto «a la altura del estándar de redes 2026», 6 pulidos.
Aplicados los 6 (5 en código/assets, 1 no aplicable):

1. **Logo sobre sepia (S6/S7):** scrim radial oscuro suave detrás del
   logo, solo f768–1018, con fade de entrada/salida (8 f). Degradado
   radial a transparente, sin bordes: NO es una placa (regla de marca
   intacta). Verificado en stills: «MEMORIAL DE LA DENUNCIA» legible.
2. **Título del interrupt:** «PERO ESTO YA ESTABA ESCRITO» bajado BAJO
   la línea de tiempo (top:1530). Por encima de la cabeza no cabe: la
   cabeza de Martí roza el borde superior del fotograma. Entrada
   retrasada a f60 local: ya no coincide con el chunk de karaoke
   «ESTABA ESCRITO.» (local f16–55) y coincide con el fin del trazado
   de la línea de tiempo. (La auditoría decía «~1 s»; el chunk real
   termina en f55, así que el retraso efectivo es de 2 s.)
3. **Callback:** 130 ESTÁTICO con pop desde el fotograma 0 de la escena.
   La voz dice «ciento» en f0; el count-up marcaba 91 y contradecía a
   la voz. Sin count-up en el callback (el del gancho se mantiene: ahí
   la voz aún no dice el número).
4. **Título del mapa:** «EL MAPA CAMBIÓ» (línea roja) entra en f60
   local, tras el chunk de karaoke idéntico «EL MAPA CAMBIÓ:» (local
   f33–56). «NUESTRA AMÉRICA» sigue entrando al inicio de la escena.
5. **Fondo del salón ONU — NO APLICADO:** tercer intento de descarga de
   la foto real de Patrick Gruban (Wikimedia Commons, CC BY-SA 2.0)
   devolvió de nuevo HTTP 429 (17-nov, ~22:15 UTC). Por regla de parada
   no se reintentó: se mantiene el fondo Pollinations. La etiqueta de
   contenido IA de Meta sigue aplicando al publicar (fondos generados).
6. **Galápagos:** fuera del overlay rojo (borrado en `map-red.png`,
   ambas copias, 196 px incl. halo antialiasing; Costa Rica intacto).
   El Ecuador continental sigue en rojo. Regla documentada en
   `research/map-build.py` (saltar anillos de Ecuador con centroide
   lon < −85 en overlays) para que un futuro re-run reproduzca la V1.1.
   (Nota: `/tmp/ne50.geojson` ya no existe; el re-run exigiría volver a
   descargar Natural Earth 50m.)

**Re-render V1.1:** solo los tramos afectados (chunk_03, 04, 06, 07, 09,
10 de 150 f) con `render-chunks.mjs --resume`; tramos 01, 02, 05, 08 y
11 reutilizados de V1 (sin cambios en esas escenas). Máster + ligera
regenerados con `master.py` (receta V1.3). QA `qa-media.mjs --mode full`:
**passed** (1507/1507 f, 1080×1920, −15,8 LUFS, TP −2,2 dBTP, sin
silencio inicial/final; las 2 advertencias de intervalos oscuros son las
mismas aceptadas en V1). Máster V1.1: 7.995.119 bytes, SHA-256
`f07d203d…91f03`; ligera: 2.384.031 bytes. Verificación visual en 10
stills del máster nuevo (`audit-frames/v11/`): las 5 correcciones
aplicables confirmadas (scrim+logo legible a 31/33 s, título bajo la
línea de tiempo a 27/28 s, 130 estático a 41 s, título del mapa a
14/15 s, mapa sin Galápagos a 17/18.5 s).

## Escenas (tiempos = VO real Kokoro, ver public/audio/vo-lines.json)

| Escena | Fotogramas | Segundos | Contenido |
|---|---|---|---|
| S1 Gancho | 0–97 | 0,00–3,23 | Salón ONU (fondo Pollinations, oscurecido) + «130» gigante con count-up + «35 VOTOS MENOS QUE EN 2025» + «28 OCT 2026 · ONU» |
| S2 Ganamos + barras | 97–237 | 3,23–7,89 | Sello «GANAMOS.» + barras horizontales 191 (2015/17) → 187 (2024) → 165 (2025) → 130 (2026, rojo) + badge «−35» |
| S3 Contadores | 237–365 | 7,89–12,16 | Tres tarjetas: 130 A FAVOR / 17 EN CONTRA / 25 ABSTENCIONES, al ritmo de la voz |
| S4 Mapa | 365–576 | 12,16–19,18 | Mapa Natural Earth: base pizarra + overlays rojo/amarillo/gris al decirse cada grupo + puntos luminosos en islas + lista en 3 columnas + nota Venezuela art. 19 |
| S5 Evidencia | 576–768 | 19,18–25,60 | «19 GOBIERNOS» + micrófono vintage (Pollinations) + tarjeta de cita de Gaston Browne (radio, 9-nov-2026, CMC) |
| S6 Interrupt 1891 | 768–910 | 25,60–30,32 | Corte duro a paleta sepia + línea de tiempo 1891→2026 + «1891» + retrato cuerpo entero de Martí (Temple Hall) |
| S7 Cita Martí | 902–1018 | 30,32–33,93 | Retrato busto Martí (Jamaica 1892) + cita estática «Trincheras de ideas…» (sin karaoke) |
| S8 Cita Fidel | 1010–1221 | 33,93–40,69 | Retrato Fidel MATS 1959 + «2005» + cita estática «No es lo mismo estar desinformado…» (sin karaoke) |
| S9 Callback + CTA | 1221–1416 | 40,69–47,20 | Vuelve «130» + «PAÍSES EXIGEN EL FIN DEL BLOQUEO» + «MARTÍ-FIDEL: LEER, PENSAR» + «GUARDA ESTE DATO» |
| S10 Sting | 1416–1507 | 47,20–50,23 | Cierre animado oficial a 2x (sting-black-2x.mp4, decisión de auditoría Marabana: el sting de 6 s lastraba la finalización) |

**Karaoke:** BottomKaraoke (patrón Pilar V30 / Marabana V1.3), híbrido
2–4 palabras por chunk, palabra clave en rojo #ED1C24. Ventanas: 0–29,87 s
y 40,69–45,69 s. Las dos citas van como texto estático, sin karaoke.
**Marca:** logotipo COMPLETO blanco/transparente (logo-white.png, 115 px,
arriba derecha) desde el fotograma 0; nunca solo la estrella. Cierre con
el logo animado oficial con fondo negro.

## Assets y procedencia

| Asset | Procedencia / licencia |
|---|---|
| marti-jamaica-1892.jpg (busto, 1039×1576) | *Iconografía Martiana 1853–1895* (Soc. Cultural José Martí / CEM), foto Juan Bautista Valdés, Kingston 1892 — dominio público. Extraído del PDF (p. 46) por recorte del escaneo de página. |
| marti-temple-hall-1892.jpg (cuerpo entero, 712×1110) | Misma fuente (imagen embebida standalone del PDF). |
| fidel-mats-1959-cropped.jpg (1720×2400) | Biblioteca del Congreso (LoC), foto Warren K. Leffler, MATS Terminal Washington, 15-abr-1959 — dominio público. Descargado el TIFF máster (3909×4000) y recortado a retrato. |
| fidel-camilo-barbudos-1959.jpg | Wikimedia Commons (Luis Korda, 1959) — dominio público/CC0. Secundario, no usado en el corte final. |
| map-base/red/yellow/gray.png + map-dots.json | Natural Earth 50m admin_0_countries (dominio público), render propio con `research/map-build.py` (proyección equirectangular, lon −125..−28, lat −58..33). **V1.1:** Galápagos fuera del overlay rojo (ver §V1.1). |
| bg-un-hall.png, bg-radio-mic.png | Pollinations Flux (token Seed, sin marca de agua), style prompt bloqueado abajo. Fondos decorativos, NO presentados como archivo real. |
| logo-white.png | Marca oficial del Memorial (copia de marabana-v1). |
| sting-black-2x.mp4 + sting-2x.wav | Cierre animado oficial, versión negra a 2x (copia de marabana-v1). |

**Wikimedia Commons: NO USADO.** La descarga de los 7 archivos pendientes
devolvió HTTP 429 dos veces (17-nov); por regla de parada se detuvo ese
frente y se recuperaron los retratos por vías primarias alternativas (LoC
para Fidel; libro de iconografía del CEM para Martí). El salón de la ONU
de Patrick Gruban (CC BY-SA 2.0) no pudo descargarse; se sustituyó por
fondo generado (Pollinations). **V1.1:** un tercer intento (17-nov,
~22:15 UTC) devolvió de nuevo 429; se mantiene el fondo generado.

## Style prompt bloqueado (Pollinations, no tocar)

> Moody cinematic digital painting, dark charcoal and deep blue tones,
> soft dramatic light, painterly texture, no text, no watermark,
> vertical 9:16 composition, subject centered with empty dark space
> around it.

- bg-un-hall.png (seed 42): vast empty assembly hall with curved rows
  of delegate seats and a large central podium, seen from a high angle,
  dark and solemn, deep blue shadows.
- bg-radio-mic.png (seed 43): vintage 1950s broadcast microphone on a
  wooden desk in a dark radio studio, warm amber rim light, moody
  atmosphere.

## Audio

- **VO:** previsualización Kokoro `em_alex` (45,69 s, 10 fragmentos,
  guion exacto de STRATEGY.md §4; L2 partida en «Ganamos.» + resto para
  la pausa dramática). La voz definitiva la graba el usuario tras la
  aprobación de la directora; entonces se re-sincroniza el karaoke.
- **Música:** biblioteca local Flow Music (stems a −16 LUFS):
  «Shadows & Evidence» (tensión, 93 BPM) 0–27 s para los actos 1–2;
  «Weight of Memory» (emotivo, 124,8 BPM) 25,5–50,23 s para 1891–cierre;
  crossfade 1,5 s. Sin pista nueva de Flow: no hizo falta.
- **Mezcla:** `scripts/audio/mix.py` (VO + 2 secciones + 21 SFX CC0 del
  kit + sting), objetivo −14,5 LUFS / TP −1,5 dBTP. SFX por sync point
  (tiempo de evento menos `sync` del kit): count-up, number-land ×6,
  bar-grow, boom-hit-soft ×3, pop-medium-in ×3, whoosh-medium-soft ×2,
  whoosh-slow-soft (interrupt 1891), data-tick (1891).
- **Derechos Flow:** pendiente general del ecosistema — leer los términos
  de Google sobre derechos comerciales antes de publicar.

## Desviaciones de STRATEGY.md (con motivo)

1. **Mapa:** Natural Earth 50m en vez del raster latam-blank.png. Las
   fronteras del raster son inconsistentes (unas gris 176, otras gris
   215 = igual que las divisiones internas): el flood-fill fusionaba
   Perú/Bolivia, Colombia/Ecuador, Guatemala/Honduras y Paraguay con
   Brasil (verificado). Con polígonos vectoriales cada país es exacto.
2. **Lista del mapa debajo en 3 columnas** en vez de lateral: el mapa
   vectorial equirectangular es casi cuadrado (1000×1000); la lista
   lateral no cabía sin achicar el mapa. Misma información, misma
   sincronía por grupos.
3. **Duración 50,23 s** (margen 50–55 s ✓): la VO real midió 45,69 s
   (estimación: 48 s) y el sting va a 2x (3,04 s) por la decisión de
   auditoría de Marabana.
4. **Fondo del gancho generado** (Pollinations) en vez de la foto real
   del salón de la ONU (Wikimedia 429, ver arriba). Es fondo decorativo
   oscurecido tras el «130», no se presenta como foto del acto.
5. **Sin fotograma del tablero de votación de UN Web TV** (opción de
   ASSETS.md): la tarjeta de evidencia de Browne + los contadores cubren
   la función de evidencia; se evitó una extracción Kaltura adicional.
6. **Venezuela:** sin relleno; anillo blanco + nota al pie (art. 19),
   como indica la estrategia.
7. **Etiqueta de contenido IA de Meta al publicar:** SÍ aplica — hay
   fondos generados (Pollinations) y voz de IA en esta previsualización.
   Con la voz real del usuario, la etiqueta seguiría aplicando por los
   dos fondos generados.

## QA visual (17-nov-2026, máster V1)

QA técnico `qa-media.mjs --mode full`: **passed** (1507/1507 f, 1080×1920,
−15,8 LUFS, TP −2,2 dBTP, sin silencio inicial/final). 2 advertencias de
intervalos oscuros, inspeccionadas y aceptadas: 12,23–12,33 s (fade-in del
mapa, 3 f) y 25,71–26,17 s (corte intencional a sepia; el texto «PERO ESTO
YA ESTABA ESCRITO» y la línea de tiempo están visibles desde el primer
fotograma del corte).

Revisión por escenas en 20 stills del máster:
- Gancho, barras, mapa (los 19 países correctos, 3 grupos + anillo
  Venezuela/art. 19), evidencia, interrupt 1891, citas Martí/Fidel,
  callback y sting: correctos. Karaoke sincronizado en todos los puntos
  muestreados; logo completo legible desde el fotograma 0 (en la cita de
  Martí el fondo sepia claro baja el contraste, pero las letras se leen).
- **Defecto encontrado y corregido:** en las tarjetas de contadores, el
  número «130» (150 px Archivo Black, ~324 px de ancho) chocaba con la
  etiqueta «A FAVOR» (minWidth 300). Corregido a minWidth 370 +
  flexShrink: 0 en `src/Video.tsx`; re-renderizados solo los tramos 2–3
  (f150–449) y regenerados máster/ligera.
- **Sincronía del sting verificada por medición:** el disparo del audio
  cae a 0,68 s dentro de `sting-2x.wav` (47,88 s en la mezcla); la deriva
  de audio del render por tramos en este proyecto es de ≈+0,12 s al final
  (menor que los +0,31 s documentados en Marabana), así que el disparo
  suena a ~48,00 s en el máster, dentro de la ventana en que la estrella
  se quiebra en el video (f1436 intacta → f1442 quebrada). Sincronía
  dentro de ±0,1 s: aceptada.
