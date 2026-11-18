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
(VO definitiva editada 0,03–45,70 s + hold + sting 2x 3,04 s; el
montaje es el de V1.2, sin re-temporizar — V1.3 edita el audio, no el
video). Motion graphics documental oscuro + acento rojo + retratos de
archivo. Sin presentador (no hay material): los gráficos y el dato
hacen el trabajo de atención.

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

## V1.3 (17-nov-2026) — voz en off DEFINITIVA (audio editado) + fix S3

La locutora grabó la voz definitiva (`reel_Mart__y_Fidel_1_sp3v.aac`,
52,8 s, AAC 48 kHz estéreo) siguiendo el guion de
`GUION-VOZ-EN-OFF.md` y respetando las pausas dramáticas (pausa tras
«Ganamos», silencio tras «Martí dijo…», «Leer. Pensar.» como dos
golpes separados). Habla de 1,02 s a 52,48 s: **6,8 s más larga que
la previsualización Kokoro (45,69 s)**.

**Redirección del usuario (19:16): NO re-temporizar el montaje.** El
primer enfoque (alargar el video a 56,30 s con todas las escenas
desplazadas) se descartó antes de entregar: el video SE QUEDA en
**1507 fotogramas = 50,23 s** con los límites de escena, la música y
los SFX de la V1.2. Lo que se adapta es EL AUDIO: la VO definitiva
se edita línea por línea para encajar en los huecos de la
previsualización (esos tiempos MANDAN; `git diff b2845fa` en
`Video.tsx` confirma que solo cambiaron el karaoke y el fix S3).

**Edición de la VO** (`research/edit-vo-definitiva.py` →
`public/audio/vo-definitiva-editada.wav`, 48 kHz estéreo, 50,23 s):
primero se recortan silencios (las pausas entre sub-frases, de
0,3–0,57 s naturales, quedan en 0,10–0,52 s según la línea) y después
se comprime el tempo con ffmpeg atempo (pitch preservado), solo lo
necesario y sin pasar de 1,12x en ninguna línea. 6 de las 10 líneas
van a 1,00x (sin tocar el tempo): el ahorro viene casi todo de los
silencios. Pausas dramáticas PRESERVADAS: tras «Ganamos» (0,44 s),
tras «Martí dijo…» (0,54 s) y «Leer. Pensar.» como dos golpes
separados (0,14 s entre ambas; la previsualización tenía 0,16 s).
Cada sub-frase se corta con 0,03 s de guarda de silencio a cada lado
y fades de 5 ms. Verificación de onda: huecos a silencio digital, sin
clics en las uniones (los mayores saltos entre muestras están dentro
del habla, no en los cortes). Fondo limpio: **sin DeepFilterNet**. El
usuario CONFIRMÓ que todo está bien dicho: la palabra es
«abstenciones» (Whisper la oyó mal como «extensiones»).

| Línea | Original | Editada | atempo | En el video |
|---|---|---|---|---|
| L1 «El 28 de octubre…» | 3,38 s | 3,25 s | 1,00 | 0,03–3,28 |
| L2 «Ganamos.» | 0,60 s | 0,60 s | 1,00 | 3,55–4,15 |
| L3 «Pero con 35 votos…» | 2,42 s | 2,42 s | 1,00 | 4,59–7,01 |
| L4 «130 a favor…» | 4,34 s | 3,57 s | 1,08 / 1,05 / 1,00 | 7,91–11,49 |
| L5 «Y en nuestra América…» | 7,46 s | 6,63 s | 1,08 / 1,08 / 1,00 / 1,00 | 12,17–18,80 |
| L6 «19 gobiernos…» | 6,40 s | 6,06 s | 1,00 | 19,21–25,27 |
| L7 «Pero esto ya estaba…» | 4,18 s | 4,16 s | 1,00 | 25,57–29,73 |
| L8 «Trincheras de ideas…» | 3,12 s | 3,12 s | 1,00 | 30,27–33,39 |
| L9 «Y en 2005, Fidel…» | 6,86 s | 6,43 s | 1,00 / 1,00 / 1,05 | 33,89–40,32 |
| L10 «130 países exigen…» | 7,02 s | 4,99 s | 1,12 (toda la línea) | 40,71–45,70 |

(«Original» = habla de la línea en el archivo; «editada» = habla en
el video; los tiempos «En el video» son la predicción analítica del
editor — la transcripción Whisper de la VO editada los confirma con
desviación media 0,026 s.)

**Sincronía palabra–visual:** las palabras clave caen sobre sus
acentos fijos con ≤0,12 s de desviación («GANAMOS»/sello,
«35»/badge, contadores 130/17/25, grupos del mapa 6/7/6,
«WASHINGTON»/tarjeta Browne, «1891»/nodo, «FIDEL»/«NO»/líneas de la
cita, «LEER.»/«PENSAR.»). Única excepción aceptada: en L10 el título
«LA TRINCHERA ES ÉSTA» aparece 0,46 s después de que la voz empiece
la frase (la locutora dice «La trinchera es ésta» mucho más despacio
que Kokoro: 1,50 s vs 1,02 s); alinear el título habría roto los
golpes finales «LEER.»/«PENSAR.», que son el clímax y quedan exactos
(±0,06 s). La línea más ajustada es L10 (1,12x, al tope admitido);
encaja sin forzar: sus pausas internas (1,90 s) se comprimen a 0,42 s
y el tempo aporta el resto.

**Karaoke regenerado** desde la VO editada: transcripción
faster-whisper small (`research/transcribe-vo-editada.py` →
`vo-editada-transcripcion.json`, 117 palabras) +
`research/align-vo-editada.py` (120 palabras, 37 chunks, mismos
cortes y keywords que V1.2; «130» partido por la mitad; «a» astilla
de 0,04 s; erratas corregidas al texto del guion). Corrección de
bordes: Whisper desplaza 18 límites >0,08 s (peor: «Fidel» 0,53 s;
el «130» de L4 empieza en silencio digital, imposible); esos bordes
se toman de la predicción analítica del editor
(`research/vo-editada-prediccion.json`), exacta por construcción
(cortes a nivel de muestra + factores atempo conocidos). Líneas
vacías recalculadas: CLEAR_BROWNE 23,03 s, CLEAR_1891 27,36 s,
callback 41,84 s (local 1,154 s) y clearLeer 44,82 s (local 4,134 s,
nueva en V1.3 — ver fix LEER/PENSAR abajo). Los umbrales del bucle de inserción
ahora referencian las constantes en vez de números fijos.

**Fix S3 (reporte del usuario con captura):** el karaoke a 2 líneas
(«VEINTICINCO / ABSTENCIONES.», 10,28–11,46 s; borde superior y≈1543:
bottom 235 + 2 líneas de 60 px × 1,18) tapaba la nota «193 ESTADOS
MIEMBROS · 21 NO VOTARON» (top:1575) y rozaba la tarjeta «25». Se
compacta el bloque: foto 860→800 px, título a 825, tarjetas top 890 +
i·195 con altura 180 (la 3ª termina en 1460) y la nota a top:1480
(termina ≈1511, 32 px libres hasta el karaoke). La cara de Bruno no
cambia: el recorte de la foto solo quita 60 px de la zona del
fundido inferior (objectPosition 50% 12% intacto).

**Mapa: NO TOCADO.** Verificado país por país contra los overlays
fuente y el compuesto (los 19 correctos; Venezuela oscura + anillo
ART. 19). Los 1–2 píxeles rojos sueltos en Galápagos son invisibles
a escala de render; se dejan.

**Música y SFX: SIN CAMBIOS de timing** (el video dura lo mismo):
Shadows 0–27 s + Weight 25,5–50,23 s, crossfade 1,5 s; los 21 SFX
en sus tiempos V1.2 (recalculados desde los mismos anclas visuales
y offsets de `sounds.json`; los sincronizados a palabras usan los
tiempos reales de la VO editada — difieren ≤0,08 s de la
previsualización). El sting suena a 47,20 s; el disparo cae dentro
de la ventana de rotura de la estrella (f1436–1442), como en V1.2.

**Mezcla V1.3** (`mix.py`, misma receta): PASS_REAL, 50,23 s,
**−15,1 LUFS / TP −1,5 dBTP**, 21 SFX. (El objetivo es −14,5; la
medida −15,1 está dentro del gate de QA [−16,5, −12,0]; la V1 medía
−15,9 con el mismo objetivo.)

**Re-render V1.3:** COMPLETO (los 11 tramos de 150 f — el karaoke y
el fix S3 tocan casi todas las escenas; tramos del intento
re-temporizado borrados antes de renderizar). Máster + ligera
regenerados con `master.py` (receta V1.3). Máster V1.3: 9.549.578
bytes, SHA-256 `0124b101…dfbb6` (1507 f, −15,2 LUFS, TP −1,5 dBTP);
ligera: 2.787.655 bytes, SHA-256 `e9fa6f1b…b0c7f` (1507 f, −15,2
LUFS, TP −0,5 dBTP — la re-codificación AAC de la ligera sube el TP;
sin clipping, TP < 0). QA `qa-media.mjs --mode full`: **passed**
(1507/1507 f, 1080×1920, −15,2 LUFS, TP −1,5 dBTP, silencio inicial
y final 0 s, sin fallos; los 2 intervalos oscuros son los conocidos
de V1/V1.2: fundido del mapa 12,23–12,33 s y corte sepia
25,71–26,21 s).
Verificación visual en 19 fotogramas del máster nuevo
(`audit-frames/v13/`): gancho 1,5 s (tablero real, sin remate
adelantado); barras 6,3 s (valores finales, badge «−35»);
**S3 10,8 / 11,35 / 12,0 s — nota visible bajo la tarjeta «25» y
sobre el karaoke a 2 líneas, separación limpia en los tres**; mapa
17,5 s (los 3 grupos + ART. 19, sin solapes); Browne 24,0 s
(tarjeta sin partir el micrófono, karaoke apagado); interrupt 28,0 s
(«1891» gigante, karaoke apagado); Martí 31,5 s (cita limpia);
transición S7→S8 34,0 s (sin fantasma de Martí); Fidel 37,0 s
(frente limpia); callback 41,0 s (tablero final legible + «130»);
**45,0 / 45,4 s — ver fix LEER/PENSAR abajo**; CTA 46,5 s
(delegados + «GUARDA ESTE DATO»); sting 48,5 s (logo animado).

**Fix LEER/PENSAR (hallado en la verificación visual de V1.3,
defecto de diseño preexistente de V1.2, misma clase que la
duplicación de «EXIGEN»):** en 44,87–45,48 s el karaoke
«LEER. PENSAR.» se mostraba a la vez que las palabras del título
(que aparecen con los golpes de voz en 44,87/45,20 s), apiladas 34 px
más abajo. La auditoría densa de V1.1 no lo vio: muestrea cada
segundo y a las 44 s aún no había aparecido nada y a las 46 s el
karaoke ya había terminado. Fix: se suprime el chunk 4 del seg 10
(`CAPTIONS_B` filtra `i !== 1 && i !== 4`) + línea vacía clearLeer
en 44,82 s (local 4,134 s) hasta el fin de karaoke-B (45,70 s).
Re-render SOLO de los tramos 9–10 (f1200–1499), re-concat manual
verificado 1507/1507, máster + ligera regenerados y QA repetido
(passed). Fotogramas de verificación del fix: `s_45.0_fix.jpg` y
`s_45.4_fix.jpg` (solo las palabras del título, sin karaoke);
`s_41.0_fix.jpg` es byte-idéntico al original (sin regresión).

**Etiqueta de contenido IA de Meta al publicar:** con la voz real,
aplica SOLO por el fondo del micrófono generado (Pollinations, S5).
Los fondos de la ONU son reales y la voz es humana grabada.

**Archivos del intento descartado:** `vo-definitiva-trim.wav`
(52,08 s, recorte −0,72 s) y `research/align-vo-definitiva.py`
pertenecen al enfoque re-temporizado (56,30 s) y NO se usan en V1.3;
se conservan como referencia.

## V1.4 (17-nov-2026) — corrección de AUDIO: fluidez (microcortes y pausas)

**Disparador:** feedback del usuario tras escuchar V1.3 (19:52–19:53):
«audí audio hay microcortes y pausas que no deberían ser» y «no puede
ser que de pronto se quede un espacio vacío entre audios, la música
tiene que ir acompañando». El VIDEO no cambia: mismas escenas,
fondos, mapa, logo y títulos; solo el audio y el karaoke que dependa
de él.

**Diagnóstico verificado (padre):** (1) la mezcla no tenía silencio
literal, pero el ducking sidechain (release 420 ms) dejaba un agujero
percibido tras cada frase — la música tardaba ~0,4 s en volver;
(2) los «microcortes» eran las costuras de tempo de V1.3 (L4
1,08/1,05/1,00, L5 1,08/1,08/1,00/1,00, L9 1,00/1,00/1,05 —
cambios de velocidad en medio de la frase). Las pausas DRAMÁTICAS
(tras «Ganamos» ~0,44 s y tras «Martí dijo…» ~0,55 s) son
intencionales y SE CONSERVAN.

**VO reconstruida desde el ORIGINAL** (`vo-definitiva.aac`,
NO reutiliza la editada de V1.3; script
`research/edit-vo-definitiva-v14.py`): UN SOLO factor atempo
uniforme por línea, mismas duraciones por línea y mismos tiempos de
inicio que V1.3, crossfades equal-power de ~15 ms en cada empalme,
pads de silencio de 30 ms. Ninguna línea superó el tope de 1,12x.

| Línea | atempo V1.4 | atempo V1.3 (mixto) |
|-------|-------------|----------------------|
| L1 | 1.0000 | 1.00 |
| L2 | 1.0000 | 1.00 |
| L3 | 1.0000 | 1.00 |
| L4 | 1.0406 | 1,08/1,05/1,00 |
| L5 | 1.0225 | 1,08/1,08/1,00/1,00 |
| L6 | 1.0000 | 1.00 |
| L7 | 1.0000 | 1.00 |
| L8 | 1.0000 | 1.00 |
| L9 | 1.0340 | 1,00/1,00/1,05 |
| L10 | 1.1200 | 1,12 |

VO V1.4: 9.644.204 bytes, SHA-256
`d8324d869087e2c1513e36684788721e3d5de0c68ea2c1586da7decf3478927f`.

**Escaneo de empalmes (método adecuado, no umbral global):**
50 bordes de segmento revisados en ventanas de ±3 ms — LIMPIO.
Peor |Δ| en un empalme: 621, frente a p99,9 del habla = 5360
(p50 = 86, p99 = 2495, máx. del archivo = 12311); cero muestras
>3× p99,9 en todo el archivo. No hay clics de edición.

**Transcripción y karaoke:** faster-whisper small falló en la
segmentación de L7 (omitió 8 palabras consecutivas, «esto ya estaba
escrito. En 1891, Martí dijo,» y puso «Pero» en 29,42 s en vez de
25,57 s; solo devolvió 109/117 palabras) aunque el audio de L7 es
idéntico al de V1.3 (1,00x). Fix: `research/patch-transcripcion-v14.py`
inserta las 8 palabras con los tiempos de la predicción analítica
(exactos por construcción — mismo criterio que el alineador usa para
bordes >0,08 s); `research/align-vo-editada.py` corrigió 17 bordes
con la predicción (incluido «Pero», 3,85 s). Resultado: 117 palabras,
37 chunks, 120 captions; mismas 4 supresiones con línea vacía
(Browne 23,03 / 1891 27,36 / callback 41,84 / LEER 44,82).

**Cambios de karaoke V1.4 vs V1.3:** 17 palabras >0,05 s (máx.
0,094 s), todas en L5 (mapa, 13,3–17,9 s) y L9 (36,3–37,3 s);
L4 ≤0,048 s. Tramos re-renderizados: **02, 03, 04, 06, 09**
(06 por seguro: «ESCRITO.» Δfin +0,050 exacto). 07 y 08 NO se
re-renderizan: no hay karaoke visible entre 29,87–40,70 s
(`Video.tsx`: karaoke-a f0–896, karaoke-b f1221–1371).

**Anclas del mapa NO movidas** (el video no cambia por tarea):
rojo 14,033 s, amarillo 15,567 s, gris 16,967 s. Las desviaciones
grupo-palabra crecen de ~0,07–0,09 s (V1.3) a ~0,14–0,18 s
(V1.4) — el grupo aparece antes que la palabra; aceptable para un
reveal gráfico, se reporta honestamente.

**Re-mezcla** (`scripts/audio/mix.py`, nuevo argumento
`--duck-release`, default 420 preservado para otros proyectos):
release 420 → **150 ms**, music volume 0,32 → **0,38**
(intento 1: 180 ms / 0,37 — peor ventana −35,8 dBFS; intento 2:
150 ms / 0,38 — adoptado). SFX y sus tiempos SIN cambios.
PASS_REAL, −15,0 LUFS, TP −1,5 dBTP. Mix: 38.576.742 bytes,
SHA-256 `fd15465e7a3a6ccd569b7b4744d15ce8107f46817c240ac66901fac683d758a0`.

RMS por ventana de pausa (0,25 s), V1.4 vs V1.3 (medido en mix.wav):

| Pausa | V1.4 | V1.3 |
|-------|------|------|
| 7,04–7,99 s (la larga, 0,96 s) | −32,0 / −32,0 / −36,2 | −33,3 / −37,6 / −37,9 |
| 11,52–12,14 s | −21,7 / −22,4 | −28,8 / −25,2 |
| 33,41–34,00 s | −33,3 / −26,9 | −42,1 / −28,5 |
| 26,73–27,26 s | −22,2 / −23,1 | −30,8 / −27,2 |
| 4,15–4,59 s (dramática, tras «Ganamos») | −36,9 | −37,2 |
| 29,73–30,27 s (dramática, tras «Martí dijo») | −25,4 / −24,4 | −30,1 / −28,0 |
| 25,27–25,57 s | −31,2 | −37,9 |

**Nota honesta sobre el objetivo −32 dBFS:** el suelo se cumple en
185/188 ventanas de 0,25 s en 0–47 s. Las 3 excepciones
(7,50–7,75: −35,5; 4,25–4,50: −33,7; 3,25–3,50: −32,5) son
pasajes quietos PROPIOS del stem «Shadows & Evidence» (medido:
stem a −41,7 dBFS en 3,25 s, −39,0 en 4,15 s, −31,9 en 7,50 s),
no artefactos de ducking. Llegar a −32 en todas partes exigiría
volumen de música ~0,55+ (taparía la voz) o comprimir el bus de
música (aplanaría la dinámica del intro). El agujero de ducking
diagnosticado SÍ está corregido: +6–9 dB en las ventanas
post-frase (7,25 s: −38,2 → −31,4; 11,50 s: −28,6 → −21,7;
25,25 s: −37,9 → −31,2; 26,73 s: −30,8 → −22,2;
33,50 s: −42,1 → −33,3). Verificado en el audio del máster:
7,25 s −31,3; 11,50 s −22,0; 26,73 s −22,3.

**Mux máster + ligera:** video del concat por tramos (`-c:v copy`)
+ mix.wav nuevo DIRECTO (sin trim de 0,04 s ni boost de +6 dB:
el audio de los tramos es el mix sin retardo — correlación 1,0 a
0 ms —, así que el trim cortaría audio real y el boost compensa
una atenuación del pipeline de render que el mux directo no tiene;
`master.py --chunks-dir` NO se puede usar tal cual: el audio de los
tramos mezclaría mezcla vieja y nueva). Cadena: alimiter 0,79 +
AAC 192k / 48 kHz / faststart; ligera desde el máster
(720×1280, CRF 26, AAC 128k).

- Máster V1.4: 9.561.922 bytes, SHA-256
  `d839d9f3cd997a74f11c26157a8779d6a3cfb10d40e1794b5aafd5d23875cfb0`
- Ligera V1.4: 2.774.907 bytes, SHA-256
  `d6baa9cb65d3f7cd6710d2b8daaf05d27f2e7c240d6f7d07e0888391ecea8371`
- QA full: **passed** — 1507/1507 f, 1080×1920, −15,1 LUFS,
  TP −2,0 dBTP (ligera −15,1 LUFS, TP −1,9), sin intervalos de
  silencio, decodificación OK; los 2 intervalos oscuros son los
  conocidos de V1 (fundido del mapa 12,23–12,33 s; corte sepia
  25,71–26,17 s).

**Verificación visual** (`audit-frames/v14/`): 7 fotogramas de los
tramos re-renderizados revisados — S3 11,35 s (nota al pie completa
y limpia del karaoke, fix V1.3 preservado), mapa 14,5/17,5 s
(karaoke en sync con los nuevos tiempos), «ESTABA ESCRITO.» 26,5 s,
callback 44,0 s y cierre 45,4 s (fix LEER/PENSAR preservado, sin
duplicación de karaoke). Tramos NO tocados: f_2, f_32, f_47
**byte-idénticos** a `audit-frames/v13-final/` — nada visual cambió
fuera de los tramos re-renderizados.

**Etiqueta de contenido IA de Meta al publicar:** sin cambios —
aplica SOLO por el fondo del micrófono generado (Pollinations, S5).

## V1.4.1 (17-nov-2026) — parche final: último hueco de música (7,50–7,75 s)

Auditoría independiente del padre sobre V1.4 encontró UNA ventana
residual bajo el suelo −32 dBFS: 7,50–7,75 s a −35,6 dBFS (centro del
gap largo 7,04–7,99 s; pasaje quieto del stem «Shadows & Evidence»).
Parche: +4 dB con rampas coseno de 100 ms en 7,40–7,90 s, aplicado
SOBRE EL AUDIO DEL MÁSTER V1.4 (ya limitado/normalizado a −15,2 LUFS,
TP −2,0) — NO sobre mix.wav: dos intentos de re-mux desde mix.wav con
`alimiter=limit=0.79` subieron el máster a −13,3 LUFS / TP +0,2
(el alimiter no limitó como se esperaba; causa no investigada a fondo;
NO reutilizar esa cadena sin verificar). Remux: video stream-copy del
máster V1.4 + audio parcheado, AAC 192k, faststart; ligera desde el
máster (720×1280, CRF 26, AAC 128k).

- Máster: 9.565.967 B, SHA-256
  `c3ac92908ba59f4c46dfa9b19289ac793ea71a4e98a6960eea772c80f0a84964`
- Ligera: 2.770.945 B, SHA-256
  `671497bf54d26af96d3392d36128b8fadda05a17dabf942110feae10cc767aa0`
- QA full: **passed** — 1507/1507 f, 1080×1920, −15,1 LUFS,
  TP −2,0 dBTP, sin intervalos de silencio, decodificación OK
  (los 2 intervalos oscuros son los conocidos de V1).
- Escaneo RMS final del máster (ventanas 0,25 s, 0–47 s): **0/188**
  por debajo de −32 dBFS, salvo la pausa dramática tras «Ganamos»
  (4,25–4,50 s, −34,0 dBFS — silencio intencional, por diseño).
  Ventana 7,50–7,75 s: −35,6 → **−31,6 dBFS**; gap largo −30,5 dBFS.
- Sincronía karaoke vs voz del máster (Whisper independiente):
  media 0,023 s, mediana 0,020 s. El único desvío (+0,54 s en
  «fidel») es inestabilidad de Whisper en un caption NO visible
  (sin karaoke en pantalla 29,87–40,70 s); sin efecto.
- Transcripción del máster final: guion completo y en orden,
  palabras de L7 presentes (el parche analítico de V1.4 verificado).

**V1.4.1 es la ENTREGA FINAL.** Enlaces Muse (expiran
2026-11-20T00:15 UTC): ligera `muse.ai/files/.../marti-fidel_LIGERO.mp4`,
máster `muse.ai/files/.../marti-fidel_MASTER.mp4` (ver URLs completas
en el chat de entrega).

## V1.5 (17-nov-2026, noche) — AUDITORÍA COMPLETA DE AUDIO + MÓDULO PERMANENTE + MÁSTER DEFINITIVO

El usuario siguió oyendo microcortes, pausas inesperadas y frases
incompletas en V1.4.1. Sus mediciones anteriores (RMS, silencedetect,
escaneo de clics global) NO detectaban lo que su oído sí capta: el hub
carecía de auditoría de audio real. Encargo en dos partes: (1) construir
el módulo permanente, (2) auditar y corregir TODO.

### Módulo permanente: `scripts/audio/audit-audio.py` (hub-level)

Chequeos (a)–(h), cada uno PASS/WARN/FAIL con timestamps exactos:
guion↔karaoke 1:1; tiempos de caption (duración, solapes, huecos
clasificados contra el mapa de silencios de la VO, duración de
VISUALIZACIÓN inicio-a-inicio — lo que BottomKaraoke realmente muestra);
integridad de la VO (energía en el lado DESCARTADO de cada corte,
clasificada por RMS + armonicidad; duración acústica por palabra;
discontinuidades SOLO en empalmes por método de borde); artefactos de
time-stretch (energía en el hueco adyacente al segmento; periodicidad
vs baseline sin stretch); mapa de silencios clasificado; música (suelo
RMS −32 dBFS, crossfade, recuperación y BOMBEO del ducking); máster
(loudness/TP, silencedetect, alineación karaoke vs ONSETS ACÚSTICOS —
autoritaria — y vs Whisper, detección de fallos de transcripción);
espectrogramas (completo + por línea). Informes JSON + Markdown en
`reports/`. **Regla en `repo/AGENTS.md`: ningún reel se entrega sin
pasar este módulo.** Documentado en `scripts/audio/README.md`.

Lecciones codificadas (verificadas 17-nov-2026):
- `alimiter=limit=X` con `level` por defecto (auto-level=true) aplica
  ganancia de maquillaje 1/X: **NO es un limitador de techo**. Un techo
  real es `alimiter=limit=X:level=false` (verificado: pico 0,841→0,790).
  Esto RESUELVE el misterio de V1.4.1 (el alimiter «no limitaba»).
  `master.py` ya usaba `level=false`; la V1.4.1 lo descubrió por el
  camino difícil.
- Whisper adelanta los inicios ~0,1–0,2 s tras cada pausa (0,55 s en la
  primera palabra) y sobre la mezcla tiene sesgo ~+0,2 s. La alineación
  autoritaria es contra los onsets acústicos de la VO limpia.
- BottomKaraoke solo lee los inicios (`s`): la duración (e−s) NO afecta
  a la visualización.
- El escaneo de clics por umbral global es inútil (los ataques de
  plosivas lo saturan).

### Auditoría V1.4.1 (reporte `reports/audio-audit-v141d`): 34 FAIL

Hallazgo principal — **29 cortes descartaban habla audible**: la V1.4
cortaba en bordes de Whisper ±30 ms, pero Whisper desplaza los bordes
50–100 ms. Colas truncadas a −8/−14 dBFS (la caída natural de la vocal
final cortada de golpe) y cabezas truncadas (la «l» de «la» perdida).
Eso ERA el «microcorte» y la «frase incompleta». Además: bombeo del
ducking 20,1 dB (la música «respiraba» con las sílabas); «El» revelado
0,55 s antes de oírse (Whisper ponía la primera palabra en 0,00 s pero
suena en 0,58 s); manchado atempo en las 17 guardas con stretch; fallo
de transcripción L7 persistente en el archivo («Pero» en 29,42 s);
24 captions <0,15 s + 1 solape. Hipótesis REFUTADAS por el módulo: la
periodicidad WSOLA (0,77 con stretch vs 0,80 sin stretch — es la
periodicidad natural del habla) y las «pausas inesperadas» (todas
diseñadas; lo que se oía era la cola cortada + el bombeo).

### Correcciones V1.5

1. **Cortes acústicos** (`research/edit-vo-definitiva-v15.py`): cada
   corte se coloca en SILENCIO REAL (tramo de 50 ms <−40 dBFS); se
   conserva la caída/onset completos y solo se descarta silencio.
   Cuando NO hay silencio entre sub-frases, se FUSIONAN (L1 f1
   «octubre,»/«la», L7 f2 «Martí»/«dijo», L9 f1 «2005,»/«Fidel»).
   Colas de línea extendidas hasta 0,30 s (L3 «pasado.» necesitó 0,27 s
   de caída). Clasificación por armonicidad: los respiros descartados
   (L6 f1, −17 dB, harm 0,08) NO son voz — descartarlos es correcto.
2. **Rubber Band** en vez de atempo en L4/L5/L9/L10 (mismos factores
   uniformes V1.4). Manchado en guardas: 17 → 0.
3. **Cama de tono de sala** (2,26 s de 23 tramos limpios de la propia
   grabación, en bucle con crossfades) en los huecos: el suelo de
   ruido es continuo, sin agujeros digitales.
4. **Ducking**: threshold 0,018→0,08, ratio 7→5, release 150→250 ms
   (`mix.py` gana `--duck-threshold`/`--duck-ratio`). Bombeo 20,1 →
   9,1 dB; profundidad media −11,8 → −3,4 dB (la música acompaña de
   verdad); recuperación perfecta (0 lentas).
5. **Karaoke** (`research/align-vo-editada-v15.py`): corrección
   acústica de bordes («El» 0,00→0,55 s; «Y» L5 12,17→12,30 s; «Y» L6
   20,73→20,88 s); cada palabra dura hasta el inicio de la siguiente
   (solapes: 1 → 0); la astilla «a» toma sus 0,04 s del final de
   «treinta». L7 transcribió BIEN en V1.5 (sin parche analítico).
6. **Re-timing por los cortes acústicos**: tarjetas S3 «17»/«25»
   (at 30/70 → 33/73; las palabras se retrasan 0,09/0,11 s) y SFX
   number-land 8,97→9,06 y 10,23→10,33. El resto de escenas, mapa,
   logo y títulos SIN cambios (la fusión L1 desplaza «la ONU…» +0,13 s
   sin visual anclada; «Leer»/«Pensar» +0,07 s, dentro de tolerancia
   de los pops del título).
7. Re-render tramos 01–05, 08, 09 (karaoke V15a) + 02–04 (ajuste final
   L4/L5); re-mezcla; re-mux con `alimiter=limit=0.79:level=false`
   (techo real verificado).

### Resultados V1.5 (reporte `reports/audio-audit-v15`)

- **Veredicto del módulo: WARN — 0 FAIL** (V1.4.1: 34 FAIL).
  Cortes con voz descartada 29→0; palabras exprimidas 1→0; empalmes
  con clic 0; manchado stretch 17→0; pausas inesperadas 0; solapes 0;
  fallos de transcripción 0; alineación karaoke/onset acústico máx
  0,11 s (media 0,06 s); bombeo 9,1 dB; suelo RMS respetado (0
  ventanas bajo −32 dBFS); crossfade 0,3 dB.
- WARN restantes (60, todos aceptables y documentados): 33 captions
  cortos por habla rápida (palabras a 0,04–0,16 s; BottomKaraoke las
  mantiene visibles una vez reveladas — no hay parpadeo); 10
  visualizaciones cortas (misma causa); 11 fines de caption vs fin
  acústico (las +0,15/+0,26 s CONFIRMAN las caídas preservadas);
  bombeo residual 9,1 dB (incluye el duck inicial de cada frase);
  4 desvíos Whisper-sobre-mezcla (ruido de Whisper; el chequeo
  acústico autoritativo pasa).
- Máster: 9.557.193 B, SHA-256
  `654b4ec0df7a1320051c849eba228659f19d1adf2a6a609553bbf2576e96bfe1`
- Ligera: 2.780.369 B, SHA-256
  `68f68b394d06226444feac09f047ecc0784e23eb4a1e986de1552e460543fa3c`
- Mix: PASS_REAL, −15,0 LUFS, TP −1,5 dBTP (SHA
  `1e824eaf45ca06bb381fcf2212b47642a731fca30564dfec67764ae43115b6ef`)
- QA full: **passed** — 1507/1507 f, 1080×1920, −15,0 LUFS,
  TP −1,9 dBTP, sin intervalos de silencio, decodificación OK
  (1 intervalo oscuro: la transición del interrupt 1891, conocido).
- Verificación visual (`audit-frames/v15/`, 11 fotogramas): «EL»
  aparece en 0,60 s (no en 0,00 s); tarjeta «17» + karaoke
  «DIECISIETE» en sync a 9,44 s; mapa intacto («SEIS VOTARON» a
  14,50 s); título «LEER. PENSAR.» en sync a 45,40 s.

**V1.5 es el MÁSTER DEFINITIVO.** Pendiente (no defectos de video):
juicio creativo del usuario, visto bueno de Suleris, términos
comerciales de Flow Music, etiqueta IA de Meta al publicar (solo por
el fondo del micrófono generado, S5).

## V1.5.1 (17-nov-2026) — parche final del padre: hueco 7,50–7,75 s

Auditoría independiente del padre sobre V1.5: la re-mezcla desde cero
no incluía el parche +4 dB de V1.4.1 y la ventana 7,50–7,75 s volvió a
−35,7 dBFS (pasaje quieto del stem «Shadows & Evidence», centro del
gap largo). El módulo no lo marcó como FAIL (mide sobre la mezcla y
acepta el gap como beat diseñado), pero la medición sobre el MÁSTER
FINAL es la que oye el usuario: se aplicó el mismo parche de V1.4.1
(+4 dB, 7,40–7,90 s, rampas coseno 100 ms) sobre el audio YA limitado
del máster V1.5; remux video stream-copy, AAC 192k; ligera desde el
máster (720×1280, CRF 26, AAC 128k).

- Máster: 9.548.823 B, SHA-256
  `75adcbc85a8b643862ab324a8595cf74f48d2b927c39f37affa4cddac075b9a8`
- Ligera: 2.778.003 B, SHA-256
  `b2884c31be1bf8522f4924bbb4a666084d9f89960d01e984b56333cf7db06337`
- QA full: **passed** — 1507/1507 f, 1080×1920, −15,1 LUFS,
  TP −1,9 dBTP, sin intervalos de silencio, decodificación OK
  (1 intervalo oscuro: corte sepia 25,7 s, conocido).
- Escaneo RMS final del máster (0,25 s, 0–47 s): **1/188** bajo
  −32 dBFS — solo la pausa dramática tras «Ganamos» (4,25–4,50 s,
  −34,0 dBFS, intencional). Ventana 7,50–7,75 s: −35,7 → **−31,7**;
  gap largo −23,4 dBFS.
- Transcripción del máster final: guion completo y en orden
  (Whisper lo lee con puntuación correcta — señal de que las palabras
  ya no están truncadas). Visual: S3 8,99 s y cierre 45,40 s
  verificados por el padre.

**V1.5.1 es la ENTREGA DEFINITIVA.** Enlaces Muse (expiran
2026-11-20T01:16 UTC): ligera `muse.ai/files/.../marti-fidel_LIGERO.mp4`,
máster `muse.ai/files/.../marti-fidel_MASTER.mp4` (URLs completas en
el chat de entrega).

## Escenas (tiempos V1.2 = montaje vigente, ver public/audio/vo-lines.json)

| Escena | Fotogramas | Segundos | Contenido |
|---|---|---|---|
| S1 Gancho | 0–97 | 0,00–3,23 | Salón ONU REAL (UN Web TV, tablero con el escrutinio EN CURSO) + «130» gigante con count-up BAJO el tablero + «28 OCT 2026 · ONU» + crédito «Imágenes: UN Web TV / Naciones Unidas» (V1.2: sin «35 VOTOS MENOS», va en S2) |
| S2 Ganamos + barras | 97–237 | 3,23–7,89 | Sello «GANAMOS.» + barras horizontales 191 (2015/17) → 187 (2024) → 165 (2025) → 130 (2026, rojo) + badge «−35» (V1.2: números finales desde el primer fotograma, sin «0» ni valores intermedios) |
| S3 Contadores | 237–365 | 7,89–12,16 | Layout partido V1.2: Bruno en el podio (UN Web TV, tercio superior, cara íntegra) + tres tarjetas abajo sobre NAVY: 130 A FAVOR / 17 EN CONTRA / 25 ABSTENCIONES, estáticos con pop al ritmo de la voz (V1.3: bloque compactado — nota «193 ESTADOS MIEMBROS · 21 NO VOTARON» fuera de la zona del karaoke) |
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

- **VO:** **V1.3 — DEFINITIVA grabada por locutora, EDITADA para el
  montaje V1.2** (`vo-definitiva-editada.wav`, 50,23 s, 48 kHz
  estéreo; guion exacto de STRATEGY.md §4; edición en
  `research/edit-vo-definitiva.py`; transcripción Whisper de la VO
  editada en `vo-editada-transcripcion.json`; alineación al guion en
  `research/align-vo-editada.py`). La grabación original
  (`vo-definitiva.aac`, 52,8 s) y su transcripción
  (`vo-definitiva-transcripcion.json`) se conservan. La
  previsualización Kokoro `em_alex` (45,69 s, 10 fragmentos) queda
  archivada en `vo-preview.wav` (V1–V1.2).
- **Música:** biblioteca local Flow Music (stems a −16 LUFS):
  «Shadows & Evidence» (tensión, 93 BPM) 0–27 s para los actos 1–2;
  «Weight of Memory» (emotivo, 124,8 BPM) 25,5–50,23 s para 1891–cierre;
  crossfade 1,5 s. Sin pista nueva de Flow: no hizo falta. (V1.3: sin
  cambios de timing respecto a V1.2.)
- **Mezcla:** `scripts/audio/mix.py` (VO + 2 secciones + 21 SFX CC0 del
  kit + sting), objetivo −14,5 LUFS / TP −1,5 dBTP. SFX por sync point
  (tiempo de evento menos `sync` del kit): count-up, number-land ×7,
  bar-grow, boom-hit-soft ×4, pop-medium-in ×3, whoosh-medium-soft ×2,
  whoosh-slow-soft (interrupt 1891), data-tick (1891). V1.3: −15,1 LUFS
  / TP −1,5 dBTP. (Conteo corregido en V1.3: la V1.2 decía ×6/×3;
  el `mix.json` muestra 7 number-land y 4 boom.)
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
   **V1.3 — CONFIRMADO:** la voz ya es real (grabada); la etiqueta
   aplica SOLO por el fondo del micrófono generado (S5).

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
