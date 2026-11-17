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

## V1.2 (17-nov-2026) — auditoría densa V1.1 + fondos reales de la ONU

Auditoría densa en `AUDIT-V1.1-DENSA.md` (51 fotogramas, 1/s): el
usuario tenía razón — había superposiciones reales que la auditoría de
17 fotogramas no vio. Las 10 correcciones aplicadas:

1. **S8 Fidel — frente limpia:** «2005» + «FIDEL ADVIRTIÓ:» en UNA
   línea centrada sobre la cita (top:1035, sobre la chaqueta oscura),
   fuera de la cara. Chip más pequeño (34 px, borde rojo) + rótulo
   (36 px); tiempos originales (chip f12, rótulo f44).
2. **Transición S7→S8 — sin fantasma:** el texto de la cita de Martí
   sale con fade-out en local f95–108, ANTES de que empiece el fundido
   de foto S7→S8 (S8 entra en global f1010 = local f108). La foto sí
   puede fundirse con la siguiente; el texto, nunca.
3. **Mapa:** (a) la etiqueta «ART. 19» sale del mapa — va sobre el
   Pacífico vacío (left:320) con una línea guía fina hasta el anillo
   de Venezuela; antes tapaba el rojo de Colombia y la zona de
   Venezuela. (b) Puntos del Caribe dispersos (`MAP_DOT_OFFSETS` en
   `src/mapDots.ts`, en px de pantalla): todos los centros quedan a
   ≥39 px, cada uno con línea guía fina hasta su centroide real y un
   ancla de 8 px en el centroide; anillo pulsante reducido 2,8×→2,0×.
   El racimo gris ya no tapa el punto rojo de Trinidad.
4. **Tarjeta Browne:** achicada (cita 44→38 px, paddings y atribución
   reducidos) y bajada (top 1010→1240): la cabeza del micrófono queda
   íntegra y visible; la tarjeta solo cubre el pie del micrófono. El
   karaoke que duplicaba la cita se apaga con línea vacía (ver abajo).
5. **Interrupt:** suprimido el chunk de karaoke «1891, MARTÍ DIJO…»
   (27,44 s) + línea vacía: «1891» ya no aparece tres veces a la vez.
   Nada se pierde: el numeral gigante entra a las 27,43 s y el título
   «MARTÍ DIJO…» a las 29,03 s, ambos sincronizados con la voz.
6. **Barras:** números con su valor FINAL desde el primer fotograma de
   cada fila (sin count-up: a medio contar se leían datos falsos,
   «2026: 127»); la fila no existe antes de su `at` (antes mostraba
   «0»); solo la barra crece. Pop en el número al aparecer.
7. **Contadores:** números ESTÁTICOS con pop, sincronizados con el
   golpe de voz (at: 0/30/70 = «ciento treinta» / «diecisiete» /
   «veinticinco»); el count-up marcaba 55 y 7 mientras la voz ya decía
   el número final.
8. **Gancho:** ELIMINADO «35 VOTOS MENOS QUE EN 2025» de S1 (y su
   divisor rojo): la voz no lo dice hasta S2 (4,56 s) y no hay forma de
   escalonarlo dentro de S1 (la escena termina a las 3,23 s). El
   mensaje lo dan las barras + el badge «−35 EN UN AÑO» en su golpe
   de voz. (La auditoría pedía escalonarlo; la eliminación es la
   forma correcta de cumplirlo.)
9. **Callback (opcional, aplicada):** suprimido el chunk de karaoke
   «EXIGEN EL FIN DEL» (41,66 s) + línea vacía: el título ya muestra
   esas palabras.
10. **Fondos reales de la ONU** (ver `REAL-UN-ASSETS.md`): S1 →
    `un-hall-wide-vert.jpg` (tablero con el escrutinio EN CURSO);
    S3 → `un-bruno-podium-vert.jpg` (Bruno presentando la resolución);
    S9 → `un-voteboard-result-vert.jpg` (RESULTADO FINAL 130-17-25
    en el tablero) + fundido a `un-delegates-after-vert.jpg` al
    entrar el CTA (local f150–165). Los fotogramas reales son CLAROS
    (pared dorada), así que cada escena lleva scrim oscuro graduado
    (ligero arriba para que el tablero se vea, fuerte abajo para el
    texto) y el «130» gigante va BAJO el tablero en S1 (top:950) y
    S9 (top:850), sin taparlo nunca. Crédito obligatorio por licencia
    en S1: «Imágenes: UN Web TV / Naciones Unidas» (abajo derecha,
    fade f10–18). **No usados:** `un-voteboard-fullscreen.jpg` (sin
    hueco limpio: S1/S9 ya muestran el tablero; una tarjeta horizontal
    taparía información) y `un-podium-president-vert.jpg` (Bruno es
    editorialmente más fuerte: presentó la resolución).
    **Layout S3 partido (nuevo):** la foto ocupa el tercio superior
    (860 px, cara íntegra, fundido a NAVY en el borde inferior) y las
    tres tarjetas van abajo sobre fondo NAVY (altura 190, número
    120 px); la foto a pantalla completa con tarjetas encima cortaba
    la cara de Bruno. **Scrim del logo extendido** a S1 (f0–97) y S9
    (f1221–1416): la pared dorada lava el blanco; S3 no lo necesita
    (mármol verde oscuro detrás del logo).

**Mecanismo karaoke de V1.2 (reutilizable):** BottomKaraoke es «sticky»
— la línea activa es la última cuyo primer word-start ya pasó y queda
visible hasta que empieza la siguiente, sin corte al final de la línea.
Suprimir un chunk sin más dejaría la línea anterior visible y obsoleta.
Por eso cada supresión va acompañada de una línea VACÍA (una palabra
con `t: ''`) en el instante del chunk suprimido: `CLEAR_BROWNE`
(22,98 s), `CLEAR_1891` (27,44 s) y la de callback (41,66 s, local
0,974 s). Ver el bloque comentado en `src/Video.tsx` (LINES_A/LINES_B).

**Nota — count-up del «19» en S5:** se mantiene (la auditoría densa no
lo marcó y el SFX de la mezcla está sincronizado con él; cambiar el
visual sin tocar el audio crearía un desajuste nuevo). Mismo patrón
que los fixes 6–7, pero fuera del alcance de la auditoría.

**Re-render V1.2:** tramos 01–10 re-renderizados con
`render-chunks.mjs --resume` (concat 1507/1507 f ✓); tramo 11
(f1500–1506, sting) reutilizado de V1.1 sin cambios. Máster + ligera
regenerados con `master.py` (receta V1.3). Máster V1.2: 9.595.094
bytes, SHA-256 `8adfaf28…cb4b5`; ligera: 2.724.782 bytes, SHA-256
`df0facd0…29f`. QA `qa-media.mjs --mode full`: **passed** (1507/1507 f,
1080×1920, −15,9 LUFS, TP −2,1 dBTP, sin silencio inicial/final; las
2 advertencias de intervalos oscuros son las mismas aceptadas en V1).
Verificación visual en 12 fotogramas del máster nuevo
(`audit-frames/v12/`, 2/5/6/8/9/19/25/28/34/36/41/42 s): las 10
correcciones confirmadas (tablero legible y 130 debajo en 2/41 s,
crédito ONU en 2 s, barras sin ceros ni «127» en 5/6 s, contadores
finales con la voz en 8/9 s, ART. 19 sobre el Pacífico y puntos
dispersos en 19 s, micrófono íntegro y karaoke apagado en 25 s, «1891»
sin triplicar en 28 s, transición sin fantasma en 34 s, frente de
Fidel limpia en 36 s, karaoke «EXIGEN» apagado en 42 s).

## Escenas (tiempos = VO real Kokoro, ver public/audio/vo-lines.json)

| Escena | Fotogramas | Segundos | Contenido |
|---|---|---|---|
| S1 Gancho | 0–97 | 0,00–3,23 | Salón ONU REAL (UN Web TV, tablero con el escrutinio EN CURSO) + «130» gigante con count-up BAJO el tablero + «28 OCT 2026 · ONU» + crédito «Imágenes: UN Web TV / Naciones Unidas» (V1.2: sin «35 VOTOS MENOS», va en S2) |
| S2 Ganamos + barras | 97–237 | 3,23–7,89 | Sello «GANAMOS.» + barras horizontales 191 (2015/17) → 187 (2024) → 165 (2025) → 130 (2026, rojo) + badge «−35» (V1.2: números finales desde el primer fotograma, sin «0» ni valores intermedios) |
| S3 Contadores | 237–365 | 7,89–12,16 | Layout partido V1.2: Bruno en el podio (UN Web TV, tercio superior, cara íntegra) + tres tarjetas abajo sobre NAVY: 130 A FAVOR / 17 EN CONTRA / 25 ABSTENCIONES, estáticos con pop al ritmo de la voz |
| S4 Mapa | 365–576 | 12,16–19,18 | Mapa Natural Earth: base pizarra + overlays rojo/amarillo/gris al decirse cada grupo + puntos luminosos en islas (V1.2: dispersos con líneas guía) + lista en 3 columnas + nota Venezuela art. 19 (V1.2: etiqueta «ART. 19» sobre el Pacífico, fuera del mapa) |
| S5 Evidencia | 576–768 | 19,18–25,60 | «19 GOBIERNOS» + micrófono vintage (Pollinations) + tarjeta de cita de Gaston Browne (radio, 9-nov-2026, CMC) (V1.2: tarjeta achicada y bajada, cabeza del micrófono visible; karaoke apagado mientras la tarjeta está en pantalla) |
| S6 Interrupt 1891 | 768–910 | 25,60–30,32 | Corte duro a paleta sepia + línea de tiempo 1891→2026 + «1891» + retrato cuerpo entero de Martí (Temple Hall) (V1.2: chunk de karaoke «1891, MARTÍ DIJO…» suprimido) |
| S7 Cita Martí | 902–1018 | 30,32–33,93 | Retrato busto Martí (Jamaica 1892) + cita estática «Trincheras de ideas…» (sin karaoke) (V1.2: el texto sale con fade-out antes del fundido a S8) |
| S8 Cita Fidel | 1010–1221 | 33,93–40,69 | Retrato Fidel MATS 1959 + «2005 · FIDEL ADVIRTIÓ:» en una línea sobre la cita (V1.2: fuera de la cara) + cita estática «No es lo mismo estar desinformado…» (sin karaoke) |
| S9 Callback + CTA | 1221–1416 | 40,69–47,20 | Tablero REAL con el RESULTADO FINAL 130-17-25 (UN Web TV) + «130» bajo el tablero + «PAÍSES EXIGEN EL FIN DEL BLOQUEO» + «MARTÍ-FIDEL: LEER, PENSAR» + «GUARDA ESTE DATO» (V1.2: fundido a delegados al entrar el CTA; karaoke «EXIGEN» suprimido) |
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
| bg-radio-mic.png | Pollinations Flux (token Seed, sin marca de agua), style prompt bloqueado abajo. Fondo decorativo, NO presentado como archivo real. (V1.2: único fondo generado que queda en el corte.) |
| bg-un-hall.png | Pollinations Flux (seed 42). **V1.2: SIN USO** — S1/S3/S9 usan fotogramas reales de UN Web TV. Se conserva en `public/img/` por si hace falta. |
| img/real-un/un-hall-wide-vert.jpg (S1) · un-bruno-podium-vert.jpg (S3) · un-voteboard-result-vert.jpg + un-delegates-after-vert.jpg (S9) | UN Web TV, 28ª plenaria AGNU 28-oct-2026 (Kaltura VOD 1_8dylozhm), © Naciones Unidas — uso editorial no comercial; crédito en pantalla obligatorio (S1). Verticales 1080×1920 recortadas con Lanczos. Ver `REAL-UN-ASSETS.md`. `un-voteboard-fullscreen.jpg` y `un-podium-president-vert.jpg` extraídos pero NO usados (ver §V1.2). |
| logo-white.png | Marca oficial del Memorial (copia de marabana-v1). |
| sting-black-2x.mp4 + sting-2x.wav | Cierre animado oficial, versión negra a 2x (copia de marabana-v1). |

**Wikimedia Commons: NO USADO.** La descarga de los 7 archivos pendientes
devolvió HTTP 429 dos veces (17-nov); por regla de parada se detuvo ese
frente y se recuperaron los retratos por vías primarias alternativas (LoC
para Fidel; libro de iconografía del CEM para Martí). El salón de la ONU
de Patrick Gruban (CC BY-SA 2.0) no pudo descargarse; se sustituyó por
fondo generado (Pollinations). **V1.1:** un tercer intento (17-nov,
~22:15 UTC) devolvió de nuevo 429; se mantiene el fondo generado.
**V1.2 — FRENTE CERRADO:** el salón real ya está en el corte, extraído
de UN Web TV (ver `REAL-UN-ASSETS.md`); no hace falta reintentar
Wikimedia.

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
   **V1.2 — DESVIACIÓN CERRADA:** el gancho, los contadores y el
   callback usan fotogramas reales de UN Web TV (ver §V1.2).
5. **Sin fotograma del tablero de votación de UN Web TV** (opción de
   ASSETS.md): la tarjeta de evidencia de Browne + los contadores cubren
   la función de evidencia; se evitó una extracción Kaltura adicional.
   **V1.2 — DESVIACIÓN CERRADA:** el tablero real aparece en S1
   (escrutinio en curso) y S9 (resultado final 130-17-25).
6. **Venezuela:** sin relleno; anillo blanco + nota al pie (art. 19),
   como indica la estrategia.
7. **Etiqueta de contenido IA de Meta al publicar:** SÍ aplica — hay
   fondos generados (Pollinations) y voz de IA en esta previsualización.
   **V1.2:** sigue aplicando — voz de IA (previsualización) + el fondo
   del micrófono (Pollinations, S5). Los fondos de la ONU ya son reales
   y no cuentan; con la voz definitiva grabada, la etiqueta seguiría
   aplicando solo por el micrófono generado.

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
