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

## V2 (18-nov-2026) — REENFOQUE POR FEEDBACK DE LA DIRECTORA

**Disparador:** nota de voz de Suleris Coss Díaz (18-nov, 2:24, transcrita
con faster-whisper small local; transcripción limpia + lectura en
`~/workspace/remotion-hub/projects/marti-fidel/research/feedback-suleris-2026-11-18.md`).
**No aprueba el enfoque V1.5.1:** las cifras de la votación ONU como
espina se pueden manipular y el reel se puede virar al revés; la mayor
parte del reel habla de la ONU y muy poco de la esencia del ensayo; las
primeras imágenes (Asamblea de la ONU) se leen como «de nuevo lo mismo».
Pide: el RETROCESO en Latinoamérica entrelazado con Martí, y que se
pondere la tesis «cuando uno olvida su historia está condenado a
volverla a vivir». La idea de David «no está mal»: el material
verificado se reutiliza, reordenado bajo la nueva tesis.

**Espina nueva:** el retroceso latinoamericano + Martí entrelazado +
«quien olvida su historia está condenado a volverla a vivir» como tesis
y cierre. El ensayo manda; la votación ONU queda como contexto breve
del retroceso, no como protagonista.

**PROHIBIDO en V2 (por la directora):** abrir con la Asamblea de la ONU;
contadores 130/17/25 como protagonistas; barras de caída; callback al
130. **El mapa SÍ se queda**, reenmarcado como EL RETROCESO (países que
se apartaron de la posición común), no como inventario de la votación:
la VO nunca dice «no votaron» / «no se presentaron»; los tres grupos
son la evidencia visual del retroceso y la nota de Venezuela (art. 19)
se mantiene.

**La tesis es formulación de Suleris** (idea de Santayana), NO cita de
Martí: se presenta como tesis del reel (voz en off + texto propio),
NUNCA atribuida a Martí. Adaptación documentada: «uno» → «un pueblo»
(«Cuando un pueblo olvida su historia, está condenado a volverla a
vivir»): el sujeto del reel son los pueblos de América Latina; la idea
es idéntica a la formulación de Suleris.

**Guion V2 (9 líneas, 110 palabras, ~47 s de VO + sting 3,04 s):**

> L1 «En 1891, Martí escribió una advertencia.»
> L2 «Es la hora del recuento, y de la marcha unida.» (Martí, Nuestra
> América 1891 — primera cláusula de la oración verificada; la oración
> completa continúa «y hemos de andar en cuadro apretado, como la plata
> en las raíces de los Andes»)
> L3 «Hoy, en nuestra América, el mapa cambió: diecinueve gobiernos se
> apartaron de la posición común.»
> L4 «Por primera vez en treinta y tres años, el Caribe dejó de votar
> unido.» (verificado §7.1: Trinidad y Tobago, primer país del CARICOM
> en contra; fin de 33 años de unanimidad caribeña)
> L5 «Y un primer ministro lo contó en la radio: Washington lo llamó
> para que cambiara su voto.» (confesión de Browne, radio 9-nov-2026)
> L6 «Martí ya lo había dicho: ¡los árboles se han de poner en fila,
> para que no pase el gigante de las siete leguas!» (Martí, texto exacto)
> L7 «Y en 2005, Fidel advirtió: No es lo mismo estar desinformado que
> haber perdido la capacidad de pensar.» (texto exacto, Cien horas)
> L8 «Cuando un pueblo olvida su historia, está condenado a volverla a
> vivir.» (TESIS del reel — voz en off / texto propio, SIN atribución)
> L9 «Leer. Pensar.»

**«Posición común» (L3):** la región votó a favor casi unánime durante
décadas (2024: 187-2-1 en la AGNU — solo EE. UU. e Israel en contra,
toda América Latina a favor; 2025: 165-7-12). En 2026, 19 gobiernos de
la región no votaron a favor (6 en contra + 7 abstenciones + 6
ausentes por decisión; Venezuela aparte, suspendida por mora art. 19).
La caracterización «se apartaron de la posición común» es, por tanto,
factual, no retórica.

**Estructura V2 (1447 f = 48,23 s; tiempos de la VO Kokoro medida,
`public/audio/v2/vo-lines.json`):**

| Escena | Fotogramas | Segundos | Contenido |
|---|---|---|---|
| S1 Gancho Martí | 0–122 | 0,00–4,06 | Retrato busto Martí (Jamaica 1892), sepia + «1891» gigante (L1). Gancho desde el ensayo, NUNCA la ONU. Karaoke L1. |
| S2 Cita 1 — el recuento | 122–232 | 4,06–7,74 | Martí Temple Hall cuerpo entero + cita estática «Es la hora del recuento, y de la marcha unida» (L2, sin karaoke). |
| S3 Mapa — EL RETROCESO | 232–401 | 7,74–13,36 | Mapa Natural Earth: título «EL RETROCESO» + grupos 6/7/6 (rojo local f63 al decirse «diecinueve», amarillo f95, gris f125) + lista + nota Venezuela art. 19 (f145). Karaoke L3. |
| S4 «33 AÑOS» | 401–536 | 13,36–17,86 | Tarjeta gráfica: «33» gigante (local f28, «treinta») + «AÑOS DE UNANIMIDAD CARIBEÑA» + sello rojo «ROTA» (local f87, «dejó»). Karaoke L4. |
| S5 Evidencia Browne | 536–701 | 17,86–23,36 | Micrófono + «19 GOBIERNOS» + tarjeta de la confesión (local f77, «Washington»). Karaoke L5 con línea vacía en 20,42 s. |
| S6 Cita 2 — los árboles | 701–913 | 23,36–30,43 | Retrato busto Martí (encuadre más cerrado, 50% 12%) + cita estática «¡los árboles se han de poner en fila…!» (L6, sin karaoke; «GIGANTE» en rojo). |
| S7 Cita 3 — Fidel | 913–1135 | 30,43–37,84 | Retrato Fidel MATS 1959 + «2005 · FIDEL ADVIRTIÓ:» + cita estática (L7, sin karaoke; mismo layout V1 S8). |
| S8 Tesis + título | 1135–1356 | 37,84–45,20 | Fondo oscuro, tesis en texto grande SIN atribución (L8; «OLVIDA» y «CONDENADO» en rojo) + «MARTÍ-FIDEL: LEER, PENSAR» (local f157/f166, golpes de voz) + CTA «GUARDA ESTE REEL» (f185). Sin karaoke. |
| S9 Sting | 1356–1447 | 45,20–48,23 | Cierre animado oficial a 2x. |

**Karaoke:** solo en las líneas habladas (L1, L3, L4, L5); las citas
(L2, L6, L7), la tesis (L8) y «Leer. Pensar.» (L9) van como texto
estático, sin karaoke (mismo patrón V1: las citas no se karaokean).
`src/captions.ts` contiene los 9 segmentos completos (la auditoría
exige guion↔karaoke 1:1); `VideoV2.tsx` filtra los segmentos hablados
para BottomKaraoke.

**Música:** misma biblioteca Flow local, re-temporizada al nuevo corte
de actos: Shadows & Evidence (tensión) 0–~29 s (gancho, mapa, Browne)
+ Weight of Memory (emotivo) ~27,5–50 s (citas, tesis, cierre),
crossfade 1,5 s. Sin pistas nuevas de Flow. Ducking V1.5 (threshold
0,08 / ratio 5 / release 250 ms, music volume 0,38).

**Código:** composición nueva `MainReelV2` en `src/VideoV2.tsx`
(`Root.tsx` y `project.json` apuntan a ella en esta rama);
`src/Video.tsx` (V1) queda intacto en el árbol como referencia (no se
compila: Root ya no lo importa). Los másteres V1.5.1
(`out/marti-fidel_MASTER.mp4` y `_LIGERO.mp4`) NO se tocan; los
entregables V2 son `out/marti-fidel-v2_MASTER.mp4` y
`out/marti-fidel-v2_LIGERO.mp4`, con chunks en `out/chunks-v2/`.

**Voz:** previsualización Kokoro em_alex (como V1). La definitiva la
graba la locutora SOLO cuando Suleris apruebe el nuevo enfoque;
el guion listo para grabar está en `GUION-VOZ-EN-OFF-V2.md`.

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

## V2.1 (18-nov-2026) — AUDITORÍA DE OFICIO vs. REELS DE 2026 + MEJORAS

**Disparador:** el usuario (18-nov 13:15) pidió auditar la V2 contra los
reels de hoy en día, buscar referencias propias y más recursos visuales;
pasó como referencia @unkindtruth_ «Eight pages»
(https://www.instagram.com/reel/Df317YHBF8C/ — 58,7K likes, 76 s).
**El enfoque editorial aprobado por Suleris NO se toca:** mismo guion,
misma estructura, misma tesis. Solo oficio visual/sonoro.
Referencias completas en
`~/workspace/remotion-hub/projects/marti-fidel/research/ref-audit-2026-11-18.md`
(5 casos vistos: Unkind Truth + NOVA/PBS Chauvet + MapSody Fall Line +
60SecHistory Chernobyl + Agensea Spartakiáda).

### Auditoría de la V2 (16 stills del máster, 0,5–47 s)

**A la altura de 2026:**
- Sistema documental oscuro coherente; logotipo completo legible desde
  el fotograma 0; ningún texto cruza caras; karaoke con palabra clave
  en rojo, sincronizado.
- Gancho fuerte (Martí + «1891» gigante) y tesis tipográfica limpia.
- El mapa con reveal secuencial por grupos y la tarjeta «33 / ROTA»
  como evidencia son recursos de nivel (patrón MapSody/Agensea).

**Lo que se queda corto (priorizado):**
1. **Sin motivo visual sostenido:** 9 escenas sin hilo — retrato →
   retrato → mapa → tarjeta numérica → micrófono → retrato → retrato →
   texto → sting. Las 5 referencias sostienen UN mundo visual todo el
   reel (libro, cueva, mapa, estadio, reactor). La V2 es un collage.
2. **Retratos y mapa estáticos:** los push-ins 1→1,04/1,06 existen pero
   son solo escala, sin deriva, y a simple vista los planos parecen
   fijos (0,5 s vs 2 s idénticos). El mapa no se mueve en absoluto.
   NOVA/MapSody demuestran que la cámara debe derivar siempre.
3. **Fondos planos sin textura:** NAVY/NAVY2 lisos en mapa, «33» y
   tesis; sin grano, sin viñeta, sin atmósfera. El archivo se presenta
   en crudo, sin tratamiento cinematográfico.
4. **Transiciones duras en todos los actos:** 8 cortes secos, incluidos
   los saltos de paleta sepia↔navy (S2→S3, S5→S6), que se sienten como
   cambio de video.
5. **Tipografía sin jerarquía de objeto:** las citas van como rótulo
   con sombra sobre la foto (S2/S6/S7); la lista del mapa (27 px) es
   densa y pequeña; la tarjeta de Browne compite con el «19 GOBIERNOS»
   y el micrófono en el mismo fotograma.
6. **Sonido:** la mezcla V2 ya pone la voz por encima (ducking
   0,08/5/250 ms, música 0,38; auditoría 0 FAIL). La medición del
   máster confirma voz dominante (ver §V2.1 mezcla). No se re-abre la
   cadena de audio: el cambio sería marginal y obligaría a re-validar
   los parches.

### Mejoras V2.1 (aplicadas; mismo guion, mismos tiempos, misma tesis)

1. **Motivo recurrente — «el manuscrito»:** el reel trata de un
   ensayo, así que el ensayo es el objeto: las citas (S2/S6/S7) van
   sobre una tarjeta de papel envejecido (textura procedural propia,
   crema, con regla de margen roja a la izquierda y folio «NUESTRA
   AMÉRICA · 1891» / «CIEN HORAS · 2005»); el «1891» del gancho va
   sobre una banda-folio de papel; la tesis (S8) va sobre la misma
   textura oscurecida (la página de cierre del ensayo); S4 lleva la
   regla de margen roja como eco. NO es el libro de Unkind Truth: no
   hay libro, ni páginas que pasan, ni escritorio — es un sistema de
   textura + margen, tratamiento propio.
2. **Movimiento cinematográfico lento:** deriva (translate ±10–15 px)
   añadida a los push-ins de todos los retratos (rango a 1,08 en
   S1/S6/S7); cámara de mapa en movimiento continuo (zoom 1,0→1,07 +
   paneo hacia el Caribe durante S3, con overlays/puntos/anillo dentro
   del mismo contenedor para no desalinear nada); deriva en el
   micrófono de S5.
3. **Paso de textura global:** grano de película procedural (8 tiles,
   ciclo 12 fps, opacidad 0,05, blend overlay) + viñeta sutil en
   f0–1356 (no en el sting, que es la animación oficial).
4. **Transiciones:** fundidos cruzados de 12 f en S1→S2, S2→S3,
   S5→S6, S6→S7 y S7→S8 (la escena entrante hace fade-in sobre la
   saliente, que se extiende 12 f). Cortes duros solo donde la voz da
   un golpe: S3→S4 y S4→S5 (tarjetas numéricas).
5. **Tipografía con más jerarquía y calma:** citas sobre papel (mejor
   contraste, sin sombra sobre foto), interlineado 1,35; lista del
   mapa a 29 px con scrim suave detrás; tarjeta de Browne con la cita
   a 40 px.
6. **Sonido:** se conserva la mezcla V2 íntegra (misma VO, misma
   música, mismos SFX, mismos parches). Verificación: la auditoría de
   audio se re-corre sobre el máster V2.1 (obligatorio) y el escaneo
   RMS del máster confirma los parches.

**Descartado (con motivo):**
- Re-mezclar con la música más baja (0,38→0,33): la voz ya domina por
  el ducking; bajar la música empuja ventanas de pausa bajo el suelo
  −32 dBFS y obligaría a re-parchear y re-validar toda la cadena por
  una ganancia marginal.
- Presentador a cámara: no hay material; las referencias sin
  presentador (NOVA, MapSody, 60SecHistory) demuestran que el formato
  faceless rinde.
- Libro animado como motivo: sería copiar el referente del usuario.
- Viñetas ilustradas estilo MapSody para el retroceso: el mapa real
  con datos verificados es más creíble que una ilustración y la
  directora prohibió que las cifras dominen; el mapa ya es la
  evidencia.

### Recursos visuales nuevos V2.1 (procedencia y licencia)

| Asset | Procedencia / licencia | Uso |
|---|---|---|
| `img/paper-manuscript.png` (1080×1920) + `img/paper-manuscript-dark.png` | Textura procedural generada con PIL/numpy (base crema + fibras + manchas + grano; creación propia, sin licencia de terceros) | Tarjetas de citas S2/S6/S7, banda-folio S1, fondo tesis S8 |
| `img/grain/grain-0..7.png` (270×480) | Ruido procedural generado con PIL/numpy (creación propia) | Grano de película global, ciclo 12 fps, opacidad 0,05 |
| `img/marti-loc-half.jpg` (3110×3934) | Library of Congress, LC-USZ62-113376: «José Martí, national hero of Cuba, half-length portrait, facing left», halftone 1890–1920; `unrestricted: true`, sin aviso de derechos — dominio público. Máster TIFF 3272×4096 descargado de tile.loc.gov; recortado el borde del negativo y contraste +8%. Sepia 0,35 en el reel para unificar con S1/S2. | Retrato de S6 (sustituye al busto de Jamaica, que se repetía de S1) |
| `img/revista-ilustrada-1891.jpg` (900×1348) | Portada de *La Revista Ilustrada de Nueva York*, Vol. 5 No. 1, NUEVA YORK, ENERO DE 1891 — «Nuestra América» primera en el SUMARIO. Facsímil del Portal José Martí (josemarti.cu/album/facsimiles, Imagen 35), Colección Memorial José Martí; obra de 1891 = dominio público. Original 450×674, upscale 2× Lanczos + sharpen leve. | Documento que asoma en S2 (arriba derecha, inclinado −3°) |

## V2.1 — ENTREGA (18-nov-2026, rama `work/marti-fidel-v2`)

Máster V2.1 + ligera, renderizados desde `MainReelV21`
(`src/VideoV21.tsx`, 1447 f = 48,23 s; `src/VideoV2.tsx` intacta).
Misma VO Kokoro, misma mezcla `audio/v2/mix-v2.wav`, mismo guion y
misma tesis que V2. Render por tramos: 10 chunks de 150 f
(`out/chunks-v21/`, concat 1447/1447 f ✓).

- Máster: `out/marti-fidel-v2.1_MASTER.mp4` — 19.788.669 B, SHA-256
  `7820801260386ae6cada5d7daf759cf5de68483e7f017f98205aa9e55b6aa37e`
  (mayor que V2 por el grano de película: el ruido no comprime).
- Ligera: `out/marti-fidel-v2.1_LIGERO.mp4` — 2.991.034 B, SHA-256
  `aebecf9c989b737dad95c1a77729259bd0d0689c0c66e6dfbec6329badde1969`
- Los másteres V2 (`bf82f772…2e78` / `d854f2c8…6e0d`) y V1.5.1
  (`75adcbc8…b9a8` / `b2884c31…337`) quedan INTACTOS (hashes
  verificados antes de renderizar).
- QA full `qa-media.mjs --mode full`: **passed** — 1447/1447 f,
  1080×1920, −15,8 LUFS, TP −2,3 dBTP, sin silencio inicial/final,
  sin intervalos negros, **0 advertencias** (la V2 tenía 1: el
  intervalo oscuro 7,79–7,89 s del corte S2→S3, eliminado por los
  fundidos).
- Verificación visual: 10 stills pre-render (f60–f1400: gancho,
  disolución S1→S2, recuento, mapa, 33/ROTA, Browne, árboles LoC,
  Fidel, tesis, sting) + 10 fotogramas del máster
  (`audit-frames/v21/`, 2–47 s) — todos correctos; logo completo
  legible desde el fotograma 0; sin texto sobre caras; puntos del
  mapa alineados con la cámara en movimiento.
- Escaneo RMS del máster (ventanas 0,25 s): **sin parche** — la
  ventana 7,50–7,75 s mide −31,5 dBFS (sobre el suelo −32; la V2
  necesitó +4 dB ahí porque medía −33,1). La única ventana bajo
  el suelo es 3,75 s (−35,3), idéntica a la del máster V2
  entregado (−35,5): pausa diseñada entre L1 y L2, no regresión.
- Auditoría de audio `audit-v21.sh` (`--tag v2.1`): **0 FAIL**
  (9 PASS, 135 WARN, 26 INFO; `reports/audio-audit-v2.1.{json,md}`).
  PASS en (a) guion↔karaoke 1:1 (117 palabras), (c) VO íntegra,
  (d) sin stretch, (e) 13 pausas diseñadas, (f) suelo −32 dBFS en
  la mezcla, (g) alineación karaoke/onset acústico media 0,027 s,
  máx 0,11 s (idéntica a V2) y máster −15,8 LUFS / TP −2,3 dBTP
  sin silencios, (h). Los 135 WARN son los benignos conocidos:
  56 de duraciones cortas de caption (igual que V2), 1 de bombeo
  del ducking 6,6 dB (igual que V2, misma mezcla) y 78 de desvío
  karaoke/voz en el máster según Whisper (±0,16–0,28 s; la
  alineación autoritativa es la acústica, que pasa con los mismos
  valores que V2 — Whisper sobre el máster mezclado tiene sesgo
  de bordes; en V2 fueron 3, aquí 78 por la variabilidad de la
  transcripción, sin cambio en la evidencia acústica).

**Corrección de auditoría V2.1 (primera corrida: 127 FAIL):**
- La primera corrida no pasaba `--transcription-edited`, así que
  el chequeo (g) cargó por defecto la transcripción V1
  («El 28 de octubre, la ONU votó…») contra la predicción V2 →
  127 FAIL espurios. En V2.1 hay que pasar AMBAS transcripciones
  con la ruta V2 (orig == edited, sin edición). `audit-v21.sh`
  ya lo hace; no usar `audit-marti-fidel.sh` (apunta a V1).

## V2 — ENTREGA (18-nov-2026, rama `work/marti-fidel-v2`)

Máster V2 + ligera, renderizados desde `MainReelV2` (`src/VideoV2.tsx`,
1447 f = 48,23 s). VO Kokoro em_alex de previsualización (43,98 s);
la definitiva la graba la locutora SOLO cuando Suleris apruebe el
enfoque. Guion listo para grabar: `GUION-VOZ-EN-OFF-V2.md`.

- Máster: `out/marti-fidel-v2_MASTER.mp4` — 8.469.881 B, SHA-256
  `bf82f7728f99b5391bd93d4344de04150cbd7b49e1b7bf460c9a5a1804b22e78`
- Ligera: `out/marti-fidel-v2_LIGERO.mp4` — 2.232.795 B, SHA-256
  `d854f2c85212e635b60504b54ec6f9d2846ac9e5635de1d6ae58447aced46e0d`
- Los másteres V1.5.1 (`marti-fidel_MASTER.mp4` / `_LIGERO.mp4`) quedan
  INTACTOS (hashes verificados: `75adcbc8…b9a8` / `b2884c31…337`).
- QA full `qa-media.mjs --mode full`: **passed** — 1447/1447 f,
  1080×1920, −15,8 LUFS, TP −2,0 dBTP, sin silencio inicial/final.
  1 advertencia: intervalo oscuro 7,79–7,89 s (0,1 s, fade-in del mapa
  en la transición S2→S3; mismo tipo que los aceptados en V1).
- Verificación visual: 9 stills pre-render + 10 fotogramas del máster
  (`audit-frames/v2/`: gancho, recuento, mapa completo, ROTA, Browne,
  árboles, Fidel, tesis, título, sting) — todos correctos; logo
  completo legible desde el fotograma 0; sin texto sobre caras.
- Auditoría de audio `audit-audio.py --tag v2`: **0 FAIL**
  (8 PASS, 60 WARN, 27 INFO; `reports/audio-audit-v2.{json,md}`).
  PASS en (a) guion↔karaoke 1:1 (117 palabras), (c) VO íntegra,
  (d) sin stretch, (e) 13 pausas todas diseñadas, (f) suelo −32 dBFS
  respetado (crossfade 2,5 dB; recuperación del ducking OK),
  (g) alineación karaoke/onset acústico media 0,027 s, máx 0,11 s;
  máster −15,8 LUFS / TP −2,0 dBTP sin silencios. Los 60 WARN son los
  benignos conocidos: 56 de duraciones cortas de caption (sin efecto
  visual en BottomKaraoke, que solo lee `s`), 3 de sesgo de Whisper
  sobre el máster (la alineación autoritativa es la acústica) y 1 de
  bombeo del ducking (6,6 dB; la receta V1.5 documenta ~9 dB).

**Parches de audio V2 (precedente V1.4.1):**
- Mezcla: +4 dB con rampas coseno 100 ms en 32,45–32,90 s (la pausa
  tras «2005,» dejaba la ventana 32,50–32,75 a −33,9 dBFS; tras el
  parche −30,3 dBFS). Original conservado en `/tmp/mix-v2-orig.wav`
  (no en el repo: `public/` está ignorado por git).
- Máster: +4 dB en 7,40–7,90 s (el pasaje quieto de Shadows; en el
  máster la ventana 7,50–7,75 medía −33,1 dBFS RMS; tras el parche
  −28,7 dBFS), aplicado SOBRE el audio del máster con remux
  (video stream-copy) + `alimiter=limit=0.79:level=false` — el
  remux sin limitador subió el TP a −0,6 dBTP (la re-codificación
  AAC→AAC añade sobreimpulso inter-muestra); con `level=false` el
  máster quedó en TP −2,0 dBTP. Lección: NUNCA re-codificar el audio
  del máster sin limitador de techo real.
- NOTA mezcla↔máster: la mezcla y el máster difieren en ~60–100 ms
  (la deriva de audio del render por tramos, ya documentada en V1:
  ≈+0,12 s al final), lo que desplaza la energía entre ventanas RMS
  vecinas: la mezcla tiene el hueco en 32,5 s (el máster no: −24,4
  dBFS) y el máster lo tiene en 7,5 s (la mezcla no: −28,0 dBFS).
  Por eso cada parche va donde hace falta; NO se re-renderizó para
  unificarlos (el máster entregado ya está verificado por QA,
  auditoría y escaneo RMS propio).

**Correcciones de auditoría V2 (primera corrida: 66 FAIL):**
- La primera corrida usó por defecto la transcripción V1
  (`public/audio/vo-editada-transcripcion.json`) → 50 FAIL de (g)
  espurios. En V2 hay que pasar rutas explícitas: transcripción y
  predicción V2 + plan V2 (ver el comando en `reports/`).
- Transcripción V2 = tiempos del alineador (Whisper + 3 palabras
  interpoladas documentadas); predicción V2 = identidad (sin
  edición, orig == edited). Plan V2 (`research/edit-plan-v2.json`,
  fuera del repo como el V1.5): 9 líneas de un solo segmento,
  factor 1.0, pausas de coma en `merged_gaps`.
- Fines de palabra corregidos a su offset acústico real (Whisper
  cortaba las colas): «1891,» 1,38→1,65 s; «2005,» 31,26→31,47 s
  (en `captions.json` y `captions.ts`; `e` no afecta al render).

## V2.2 (18-nov-2026) — VOZ REAL DE LA LOCUTORA (visuales V2.1)

La locutora grabó las 9 líneas V2 (originales `.aac` en
`~/workspace/user/files/`; wavs + transcripciones faster-whisper con
word timestamps en `~/workspace/remotion-hub/projects/marti-fidel/
research/vo-real-transcripts-2026-11-18.json`). V2.2 = visuales V2.1
intactos + voz real. El montaje NO se re-temporiza (regla del
usuario: el audio se edita para encajar en el montaje).

### Lección 18-nov-2026: el ASR no declara errores (falsos positivos)
La primera verificación pidió regrabar las líneas 1 y 8 por
«errores» que NO existían: faster-whisper small y base + la
transcripción automática oyeron «pertenencia/vertencia» en vez de
«advertencia», «el pueblo» en vez de «un pueblo», y tragaron la «a»
de «condenado a volverla». El usuario escuchó los audios: las dos
líneas estaban bien. Causa: habla rápida cubana («a'vertencia» con
d suave, vocales tragadas entre palabras). El acuerdo entre sistemas
ASR NO es evidencia de error real. REGLA: la verificación por
transcripción contra un guion conocido solo señala SOSPECHAS; una
discrepancia de una sola palabra es «verificar de oído», nunca un
veredicto de regrabar; el oído humano desempata. Implementado en
`scripts/audio/verify-vo-lines.py` (MATCH / INCIERTO /
DISCREPANCIA, coincidencia difusa + números en español + detección
de fusiones; self-test 9/9 con los casos del 18-nov). Sobre la voz
real: 5 MATCH, 4 INCIERTO (L1, L6, L7, L8 — exactamente los casos
que el usuario ya verificó de oído), 0 DISCREPANCIA.

### Medidas de la voz real (sobre acústico, no Whisper)
- Los tiempos de Whisper NO son fiables: pone la primera palabra en
  0,0 (el habla real empieza ~0,9–1,4 s después del inicio del
  archivo en todas las líneas), funde palabras («Martí ya»→
  «Martilla», «Fidel advirtió»→«Fidelad virtió», «33»→una palabra,
  «Y en»→«yen»). Los tiempos del manifiesto son Whisper CORREGIDOS
  por sobre acústico; el texto es SIEMPRE el guion.
- La «voz total 44,86 s» inicial era la suma de spans Whisper
  (incluye ~1 s de tono de sala previo por línea). El habla real
  medida por sobre es ~39,65 s; tras recortes, ~39,54 s.
- Niveles: medias −19,7 a −24,6 dB, picos −2,8 a −7,0 dB, sin
  clipping; 48 kHz estéreo dual-mono (max|L−R| ≈ 0). Piso de ruido
  ~−40 a −48 dB RMS en huecos; cola L9: pico espectral 145 Hz, sin
  hum 50/60 Hz dominante. Decisión: NO DeepFilterNet (SNR ~20–25 dB,
  tono de sala normal, sin ruido intrusivo).

### Plan de ajuste de tiempos (manifiesto `vo-real-manifest.json`)
Inicios = V2 (vídeo no re-temporizado). Limpieza por línea: downmix
mono, highpass 70 Hz, loudnorm I=−18 TP=−2 LRA=9 (misma cadena VO
de `mix.py`), fundidos de 5 ms en cada empalme.

| L | head–tail (archivo) | cortes internos | stretch | span | inicio→fin | holgura |
|---|---|---|---|---|---|---|
| 1 | 1,00–4,75 | [2,75, 2,95] | 1,00 | 3,55 | 0,00→3,55 | 0,51 |
| 2 | 1,05–4,25 | [2,80, 3,00] | 1,00 | 3,00 | 4,06→7,06 | 0,68 |
| 3 | 1,05–7,35 | [1,55,1,70],[2,85,3,05],[4,05,4,30] | 1,05 | 5,43 | 7,74→13,17 | 0,20 |
| 4 | 0,85–4,85 | — | 1,00 | 4,00 | 13,36→17,36 | 0,50 |
| 5 | 0,60–5,55 | — | 1,00 | 4,95 | 17,86→22,81 | 0,55 |
| 6 | 1,30–7,30 | — | 1,00 | 6,00 | 23,36→29,36 | 1,08 |
| 7 | 1,25–8,65 | [3,95,4,20],[6,20,6,35] | 1,00 | 7,00 | 30,43→37,43 | 0,40 |
| 8 | 1,00–5,20 | [3,05,3,20] | 1,00 | 4,05 | 37,84→41,89 | 1,18 |
| 9 | 0,80–3,10 | [1,80,2,20] | 1,03 | 1,84 | 43,07→44,91 | 0,29 (sting 45,20) |

Huecos entre líneas: 0,51 / 0,68 / 0,20 / 0,50 / 0,85 / 1,08 / 0,40 /
1,18 s (todos ≥0,20 s). Solo dos stretches suaves (máx autorizado
~1,08x): L3 1,05x y L9 1,03x. Tres puntos de corte se corrigieron
antes del manifiesto por FAIL-RISK de la auditoría (cola L3
7,15→7,35; cabeza L5 0,90→0,60; cola L8 5,05→5,20). El constructor
`build-vo-real.py` re-verifica todos los cortes con las funciones de
la auditoría y aborta si hay FAIL-RISK (corrida final: 0 errores).

### Mezcla V2.2 (`mix-v2.2.sh`, generada por el constructor)
Misma música (Shadows & Evidence 0–24,11 + Weight of Memory
22,61–48,23, xfade 1,5 s, end-fade 1,0 s) y mismos SFX fijos que V2.
Los 5 SFX ligados a palabras se re-sincronizaron a los onsets
reales: boom «gigante» 27,96 · boom «pensar.» 36,90 · pop
«condenado» 40,33 · pop «Leer.» 43,17 · boom «Pensar.» 44,24.
Mezcla: PASS_REAL, −15,8 LUFS, TP −1,5, 48,23 s.

### Deriva vídeo↔voz (reveals fijos vs onsets reales)
El karaoke (audio-driven) queda sincronizado en cualquier caso.
Derivas mayores que en V2 (el vídeo NO se re-temporiza por orden
expresa; informe completo en
`public/audio/real/sync-drift-v2.2.json`): S2 l2 +0,68 · S7 chip
ADVIRTIÓ +0,73 / tarjeta +1,10 / l1 +0,90 / l3 +0,66 · S8 título
PENSAR +0,87 (el outlier: el título aparece ~0,9 s antes de la
palabra). Seguimiento propuesto (NO hecho en V2.2): retocar 3
constantes de fotograma (S2 l2, S8 leerIn/pensarIn).

### Auditoría V2.2
`bash audit-v2.2.sh` (rutas `real/` explícitas). La VO original es
la concatenación de los 9 archivos grabados (54,12 s, sin solapes):
si se colocaran en los slots, las colas/cabezas con tono de sala se
solaparían y el check (c) mediría la voz de la línea vecina en los
puntos de corte (eso dio un FAIL espurio en la primera corrida del
constructor: L7 corte fin @ 39,13 s). El edit-plan expresa las
coordenadas originales en esa concatenación.

## V2.2 — ENTREGA (18-nov-2026, rama `work/marti-fidel-v2`)

Render por tramos (10 tramos, 1447/1447 f) + `master.py`:
- Máster `out/marti-fidel-v2.2_MASTER.mp4`: 19.796.494 B, SHA-256
  `222a1cb8cac60af49639e94ed8ff913bfdc17d33b74ba0ad447f3a6bee1fa651`,
  1080×1920, 1447 f, −15,8 LUFS, TP −3,7 dBTP.
- Ligera `out/marti-fidel-v2.2_LIGERO.mp4`: 3.002.943 B, SHA-256
  `a58f2bdeaeb28acbc122349fc517773c1648fd410bb3f7613426b621efd3a0f9`,
  720×1280, 1447 f, −15,9 LUFS, TP −3,8 dBTP.
- Mezcla `public/audio/real/mix-v2.2.wav`: SHA-256
  `692e9bbc03f1b27b8b210f5f5fb5cd536f03c4c62504c02807631a9b3d8d0723`
  (PASS_REAL, −15,8 LUFS, TP −1,5). VO editada SHA-256
  `03ca692224255316992b4ad67d566678d1287214bf7972993a5432d6eff0481e`.

QA técnico (`qa-media.mjs --mode full`): passed, 0 advertencias, 0
fallos (1447 f, fps 29,93, audio presente, decodificación OK, sin
intervalos negros; deriva de duración 0,159 s, la conocida del
render por tramos).

Auditoría de audio (`bash audit-v2.2.sh`, informe
`reports/audio-audit-v2.2.*`): **0 FAIL, 131 WARN, 9 PASS, 36 INFO**
— mismo veredicto que V2.1 (0 FAIL, 135 WARN). Alineación
karaoke/onset acústico: media 0,057 s, máx 0,091 s (límite 0,15 s);
karaoke/voz limpia 0,000 s. WARNs benignos: 71 (g) sesgo Whisper
sobre el máster (media +0,22 s, sistemático conocido), 57 (b)
captions cortos del habla rápida natural (sin efecto visual en
BottomKaraoke), 2 (c) «Y»/«EN» de L7 sin energía sostenida sobre
−40 dB (la fusión «yen» tragada, tal como la grabó la locutora;
línea aprobada de oído por el usuario), 1 (f) bombeo del ducking
12,4 dB (la voz real tiene más rango dinámico que Kokoro; V1.5
entregó con 9,1 dB; es WARN, sin umbral FAIL).

Correcciones tras la primera corrida (3 FAIL → 0 FAIL, sin
re-render: ningún inicio de caption cambió):
1. (b) Hueco 0,40 s entre «2005,» y «FIDEL» con voz encima: Whisper
   cortó la cola «-cinco» (la voz real llega a ~31,95 s editado, con
   harmonicidad 0,64 en el hueco). Fin de «2005,» 2,60→2,75 en el
   manifiesto; hueco resultante 0,25 s.
2. (c) «EL» exprimida (0,10 s vs 0,13 s esperados): artefacto de
   umbral −40 dB entre el archivo crudo y el normalizado (el onset
   cruza 22 ms más tarde tras loudnorm; la palabra está íntegra,
   factor 1,0, sin cortes cerca). Fin de «el» 3,38→3,44 (offset
   acústico incl. la transición a «Caribe»); ratio 0,82 > 0,80.
   Añade 1 solape WARN (b) de 0,06 s, sin efecto visual.
3. (e) Pausa inesperada 0,39 s @ 24,75–25,14 (la pausa de dos puntos
   tras «dicho:» en L6). El constructor ahora registra TODAS las
   pausas naturales intra-línea ≥0,20 s como `merged_gaps` del plan
   (antes solo las que rodeaban un corte); el umbral 0,20 s cubre el
   desliz entre bordes Whisper y detector de silencio.

## V2.3 (18-nov-2026) — CORRECCIÓN DEL MICROCOTE DE VOZ + DERIVA DE REVEALS

El usuario escuchó la V2.2 y reportó errores de corte de voz al
principio (primeras frases). Precisión: el microcorte está en L2,
en la transición «...es la hora del recuento, y de la marcha
unida».

### Diagnóstico (medido por RMS 10 ms + armonicidad, no Whisper)
- **El bug:** la pausa natural entre «recuento,» y «y» es 0,420 s
  (offset de voz 2,73 → onset 3,15 en el original); el plan V2.2
  cortó 2,80–3,00 s (0,20 s) del medio, dejando 0,220 s en la
  editada. La «y» entra demasiado pronto y «recuento» suena
  cortado/choppeado, aunque el empalme caiga en silencio (sin clic).
- **Hipótesis refutadas:** la cola de «advertencia» (L1) NO está
  cortada (la palabra decae a tono de sala ~4,66 s; el corte en
  4,75 deja 0,08–0,10 s de tono); la cabeza de L1 está INTACTA (voz
  desde ~1,16 s; el segmento empieza en 1,0 s); todas las colas de
  palabra decaen naturalmente antes de su punto de corte; sin clics
  en ningún empalme (saltos 0,0007–0,0066 vs p99 global 0,0785).
- **Revisión total de pausas (el usuario tenía razón: había más):**
  5 pausas intra-línea más estaban por debajo de 0,25 s o con
  pérdida >50% en V2.2: L1 1891,→Martí 0,380→0,180 · L3 Hoy,→en
  0,350→0,229 · L3 América,→el 0,390→0,181 · L3 cambió:→diecinueve
  0,360→0,086 (la peor, −76%) · L9 Leer.→Pensar. 0,720→0,311 (−57%).
- **REGLA NUEVA (permanente):** ninguna pausa intra-línea natural
  puede quedar por debajo de ~0,25 s ni perder >50% de su duración;
  si el slot no da, se compensa con stretch suave o con el hueco
  entre líneas, NUNCA recortando la pausa. Codificada como check
  (c) §4 en `scripts/audio/audit-audio.py` (`voiced_span`: la pausa
  se mide entre voz sonora, no energía pura — los respiros superan
  −40 dB y no son voz). Validación: V2.2 da 6 FAIL (exactamente las
  6 pausas malas), V2.3 da 0.

### Plan V2.3 (manifiesto `vo-real-manifest-v23.json`, audio en `public/audio/real23/`)
| L | cambio vs V2.2 | pausa(s) editada(s) | hueco sig. |
|---|---|---|---|
| 1 | sin corte interno; tail 4,85 | 0,380 intacta | 0,209 |
| 2 | sin corte interno; tail 4,36 | 0,420 intacta (el bug) | 0,369 |
| 3 | cortes 0,050/0,093/0,063 s; head 1,08; tail 7,32; **stretch 1,11x** | 0,271/0,268/0,268 | 0,164 |
| 4 | tail 4,95 | 0,310 intacta | 0,395 |
| 5 | sin cambios | 0,280 intacta | 0,547 |
| 6 | sin cambios | 0,480/0,220 intactas | 1,076 |
| 7 | cortes 0,15/0,10 s | 0,370/0,360 | 0,254 |
| 8 | head 0,95; tail 5,29 | 0,270 | 1,043 |
| 9 | corte 0,20 s (descarta el respiro 1,90–1,95) | 0,507 | sting 45,20 |

L3 1,11x está por encima del ~1,08x autorizado: sin ella no caben
las 3 pausas naturales ≥0,25 s en el slot 7,738–13,364 sin recortar
cabezas/colas por debajo de la guía (keep ≥0,15–0,20 s). atempo
1,11x es inaudible como artefacto y el check (d) lo verifica
(flujo espectral + periodicidad WSOLA vs baseline sin stretch).
Constructor: `build-vo-real-v23.py` (0 errores, 14 avisos benignos:
2 huecos cortos + 12 respiros descartados en cortes).

### Deriva vídeo↔voz V2.3 (reveals re-sincronizados, `sync-drift-v2.3.json`)
Los onsets se desplazaron al restaurar pausas (L2 «y» +0,20 s; L7
«No» +0,10 s, «que» +0,15 s; L9 «Pensar.» +0,19 s). Nueva
composición `src/VideoV23.tsx` (captions `src/captions-real23.ts`,
mezcla `audio/real23/mix-v2.3.wav`):

| reveal | V2.2 (vídeo) | voz V2.3 | V2.3 (fotograma local) |
|---|---|---|---|
| S2 l2 «Y DE LA MARCHA UNIDA» | 5,23 | 6,11 | f61 (antes f35) |
| S7 chip «FIDEL ADVIRTIÓ:» | 31,90 | 32,63 | f66 (antes f44) |
| S7 tarjeta Fidel | 32,23 | 33,43 | f90 (antes f54) |
| S7 l1 «NO ES LO MISMO» | 32,43 | 33,43 | f90 (antes f60) |
| S7 l2 «ESTAR DESINFORMADO» | 33,60 | 34,05 | f108 (antes f95) |
| S7 l3 «QUE HABER PERDIDO» | 34,77 | 35,58 | f154 (antes f130) |
| S7 l4 «LA CAPACIDAD DE PENSAR» | 35,93 | 36,35 | f177 (antes f165) |
| S8 título «LEER.» | 43,07 | 43,17 | f160 (antes f157) |
| S8 título «PENSAR.» | 43,37 | 44,43 | f198 (antes f166) |

Sin tocar: S6 l2 (−0,45 s) y S8 l4 (−0,48 s), derivas negativas
heredadas del diseño V2 (el reveal llega después de la palabra, se
lee como énfasis); S5/S6 l1/S8 l1–l3, derivas <0,25 s; el karaoke
(ya sincronizado). Los 5 SFX ligados a palabras se re-sincronizaron
a los onsets V2.3: boom «gigante» 27,96 · boom «pensar.» 37,05 ·
pop «condenado» 40,38 · pop «Leer.» 43,17 · boom «Pensar.» 44,43.

### Deriva A/V del render por tramos (hallazgo de la comparativa V2.2 vs V2.3)
La comparativa fotograma a fotograma confirmó que los únicos cambios
visuales son los buscados (karaoke L1/L3 + reveals S2/S7/S8; el resto
idéntico salvo ruido de codificación x264 ~0,5/255). Pero la
comparación mezcla↔máster reveló una **deriva audio-vídeo del
pipeline, idéntica en V2.2 y V2.3**: cada frontera de chunk añade
~57 ms de audio (escalera, no línea continua — el lag es plano dentro
de cada chunk y salta en las fronteras de 5 s). El audio del máster
quedaba detrás del vídeo hasta **+0,35 s al final** (medido por
correlación de forma de onda en 8 puntos, corr 0,72–1,18): los
reveals re-sincronizados a la mezcla seguían apareciendo ~0,3 s antes
de la palabra en S7/S8. La métrica g_align_master de la auditoría
(0,221 s de media) ya lo mostraba, atribuido erróneamente al sesgo de
Whisper — el sesgo real de Whisper es ~0,06 s.
**Corrección (sin re-render):** `scripts/audio/master.py` acepta ahora
`--atempo` (1,0 = sin cambio; tempo > 1 = más rápido). Con
`--atempo 1.0082` (ajuste por mínimos cuadrados de los 8 puntos) el
residual queda en **±0,02 s** en los 8 puntos y el audio dura 48,341 s
frente a 48,350 s de vídeo. OJO: el primer intento usó 0,9918 (al
revés: atempo < 1 ALARGA) y se detectó por la duración 49,152 s.
**Pendiente para el pipeline:** la causa raíz está en el render por
tramos (`render-chunks.mjs` — cada chunk sale con ~57 ms de audio de
más); el atempo es una compensación por render, no una cura. Medir el
lag en cada render nuevo antes de elegir el factor.

### Entrega V2.3 (18-nov-2026, noche)
- Máster `out/marti-fidel-v2.3_MASTER.mp4`: 19.788.148 B, SHA-256
  `5daa7aa90c79bec2b7983f0abaf8b96b7b23ef92fcc151c64ac73eac62146916`,
  1080×1920, 1447 f, −15,9 LUFS, TP −3,7 dBTP.
- Ligera `out/marti-fidel-v2.3_LIGERO.mp4`: 2.994.114 B, SHA-256
  `a1866492b15b54ea8d72b8b97458c0bbc0c64a8a14d5d90ce8a76890913dfb97`,
  720×1280, 1447 f, −15,9 LUFS, TP −3,5 dBTP.
- Mezcla `public/audio/real23/mix-v2.3.wav` sin cambios tras la
  corrección del fin de «1891,» (SHA-256 `b64d0983…a0e5925`); la VO
  es byte-idéntica (`53f38a43…27e031ac`).
- QA full: **passed, 0 advertencias, 0 fallos** (deriva de duración
  0,159 s, la conocida del render por tramos).
- Auditoría de audio: **0 FAIL, 67 WARN, 9 PASS** (los WARN: 56
  captions cortos por habla rápida — sin efecto visual —, 8 de
  alineación Whisper en máster, 2 fusión «Y»/«EN» en L7, 1 bombeo
  de ducking 12,4 dB; mismo patrón benigno que V2.2, que tenía 131
  WARN). c_pause_fails 0 · c_cuts 0 · c_splice 0 · c_squeezed 0 ·
  e_unexpected 0 · f_below_floor 0 · alineación acústica media
  0,057 s (máx 0,091) · alineación en máster 0,064 s (antes de la
  corrección A/V: 0,221 s).
- Fixes al módulo de auditoría en esta versión: check (b) acepta el
  hueco si la fracción sonora es ≤30% (tono de sala ≠ voz); check
  (e) tolerancia de inicio 0,12→0,35 s (keeps de cola); check (f)
  exime ventanas bajo el suelo si la cama también lo está (pasaje
  silencioso del stem). Dato corregido: fin acústico de «1891,»
  2,60→2,74 (Whisper lo cortaba 0,14 s antes; medido con
  `voiced_span`).
- **Veredicto comparativo:** V2.3 corrige el microcorte reportado
  (pausa L2 0,220→0,420 s) y 5 pausas más (L1, L3×3, L9), re-sincroniza
  9 reveals (errores de 0,68–1,10 s → ≤0,05 s en la mezcla) y elimina
  la deriva A/V del pipeline (residual ≤0,02 s). No queda nada claro
  por mejorar en esta versión: los WARN restantes son benignos y las
  dos derivas negativas heredadas (S6 l2, S8 l4) se leen como énfasis.
  Lo que NO vale la pena: re-masterizar V2.2 (superseded); afinar el
  atempo por chunk (el residual ±0,02 s es imperceptible).

### Entrega V2.4 (18-nov-2026, noche — solo audio, mismo vídeo V2.3)
El usuario pidió corregir la mezcla YA porque Suleris aún no había
visto la V2.3. El detector nuevo (sección (i), rama
`work/audio-microcut-detection`, fusionada aquí) había localizado lo
que el oído notaba en V2.3: 3 SFX que enterraban el ataque de palabras
en la mezcla + huecos de fundido de ~10 ms en los empalmes internos.
- **VO reconstruida** con `edit_line_safe` (`scripts/audio/vo_build.py`:
  crossfades de igual potencia, cruces por cero): los 7 empalmes
  internos (L3×3, L7×2, L8, L9) ya no tienen hueco. Timings idénticos
  a V2.3 (captions: máx. 8 ms de diferencia por el snap a cruce por
  cero; duraciones por línea ±5 ms; LUFS/TP iguales).
- **3 SFX movidos +80 ms tras el onset** (mover, no bajar: el exceso
  era +23/+28/+24 dB y bajar 6–10 dB no bastaba): boom «pensar.»
  37,05→37,13 · pop «Leer.» 43,17→43,25 · boom «Pensar.» 44,43→44,51.
  Los otros 2 SFX ligados a palabras (boom «gigante» 27,96, pop
  «condenado» 40,38) quedaban en PASS y no se tocaron.
- **Máster sin re-render de vídeo**: vídeo copiado de
  `marti-fidel-v2.3-chunks.mp4` + mezcla nueva, vía `master.py
  --input` con `--no-trim --no-boost` y **sin atempo**. OJO: el atempo
  1,0082 de V2.3 compensaba la deriva del audio RENDERIZADO POR
  TRAMOS; la mezcla fresca nunca pasa por ese pipeline y va 1:1 con
  la línea de tiempo del vídeo (ambos 48,23 s). Aplicar atempo a la
  mezcla fresca la habría adelantado hasta −0,36 s al final.
  Verificado por correlación mezcla↔máster en 5 puntos: lag constante
  +5 ms (priming AAC), corr 0,996–1,000, sin deriva progresiva.
- Máster `out/marti-fidel-v2.4_MASTER.mp4`: 19.794.215 B, SHA-256
  `532bb7d221aab5a50a33e36196162879aa884c5f2eebb6052f4dbe57bb4b824c`,
  1080×1920, 1447 f, −16,0 LUFS, TP −2,0 dBTP.
- Ligera `out/marti-fidel-v2.4_LIGERO.mp4`: 3.019.861 B, SHA-256
  `f8565fccd77cafda69d9e27ea00c6122efeb59234373515309c362c28fa025f5`,
  720×1280, 1447 f, −16,0 LUFS, TP −1,8 dBTP.
- QA full: **passed, 0 advertencias, 0 fallos**.
- Auditoría de audio: **0 FAIL, 66 WARN, 13 PASS** (V2.3: 0 FAIL, 67
  WARN, 9 PASS). Sección (i) entera en PASS: (i1) empalmes limpios
  (peor dip 10,1 dB, bajo el umbral WARN de 12 dB), (i2) sin dips en
  palabras, (i4) 16/16 segmentos contiguos, (i5) 0 enmascaramientos.
  Alineación en máster 0,044 s de media (V2.3: 0,064 s). Los 66 WARN
  son el patrón benigno conocido (56 captions cortos, 7 Whisper en
  máster, 2 fusiones «Y»/«EN» en L7, 1 bombeo de ducking 12,4 dB).

### Entrega V2.5 (19-nov-2026, madrugada — TARJETA DE GANCHO DE SULERIS)
Suleris vio la V2.4 («quedó muchísimo mejor, está casi lista») y pide
una frase de gancho que deje claro que los que están olvidando su
historia son los países latinoamericanos que votaron en contra y se
separaron de la mayoría, enlazando la apertura con Martí y Fidel
(transcripción y decisión en
`research/feedback-suleris-2026-11-19.md`). La frase elegida, con sus
propias palabras: **«Los que se separaron de la mayoría son los que
están olvidando su historia.»**
- **Tarjeta de texto** con el motivo «el manuscrito» (papel envejecido
  procedural a pantalla completa, regla roja a borde, folio
  «MARTÍ-FIDEL · 2026»), **SIN voz** — la locutora no puede grabar
  una línea 10 esta noche. La frase queda lista aquí por si el
  usuario la quiere con voz después. 4 líneas reveladas escalonadas
  (l1 0–10 f, l2 15–25 f, l3 30–40 f, l4 50–58 f), «OLVIDANDO SU
  HISTORIA.» en rojo. Componente `HookCardScene` en
  `src/VideoV25.tsx`; composición `MainReelV25`, 1537 f = 51,23 s.
- **Ubicación:** entre S7 (Fidel) y S8 (tesis), f1135–1225 (90 f =
  3,0 s) + fundido de 12 f; punto de inserción en audio 37,836 s.
  La pausa silenciosa de 3,43 s antes de la tesis es intencional
  (respira antes del golpe): la auditoría la clasifica «dramática,
  entre-líneas», no como defecto. La cama musical continúa bajo la
  tarjeta; el ducking no produce nada raro (f_duck_pump_max 12,4 dB,
  mismo que V2.4; 0 ventanas bajo el suelo).
- **Desplazamientos (+3,0 s tras el punto de inserción):** slots de
  VO L8 37,836→40,836 y L9 43,069→46,069 (manifiesto
  `vo-real-manifest-v25.json`); reveals de S8 y karaoke de L8/L9
  (`src/captions-real25.ts`); SFX: boom de entrada a S8
  37,81→40,81 · pop «condenado» 40,38→43,38 · pop «Leer.»
  43,25→46,25 · boom «Pensar.» 44,51→47,51 · sting 45,2→48,2.
  **El boom «pensar.» 37,13 NO se mueve:** está anclado a la última
  palabra de L7, ANTES del punto de inserción; moverlo lo dejaría
  sonando en medio de la tarjeta muda (el encargo inicial lo listaba
  para desplazar, pero era un error — corregido con evidencia).
  VIDEO_EVENTS corregidos a los tiempos V2.3 reales derivados de
  fotograma (en V2.4 el builder conservaba tiempos V2.2).
  Scrim del logo extendido a la ventana de la tarjeta (f1135–1237,
  papel claro); fade-out del logo f1436–1446; grano f0–1446.
- **Vídeo:** chunks 01–07 (f0–1049) reutilizados de `out/chunks-v23/`
  (idénticos por construcción: el fotograma a 20,0 s es el mismo que
  en V2.4); chunks 08–11 re-renderizados; concat
  `out/marti-fidel-v2.5-chunks.mp4` 1537/1537 f.
  OJO: al muxear la mezcla fresca NO usar `-shortest` — la mezcla
  mide 51,23 s y el vídeo 51,36 s (deriva de timestamps del contenedor
  por tramos), y `-shortest` recortó 9 fotogramas en el primer
  intento. Sin `-shortest`: 1537 f intactos.
- **Máster SIN atempo** (misma razón que V2.4: mezcla fresca 1:1 con
  la línea de tiempo). Verificado por correlación mezcla↔máster en
  6 puntos (2/12/22/32/42/48 s): lag constante +5,0 ms (priming AAC),
  corr 0,994–0,999, sin deriva progresiva.
- Máster `out/marti-fidel-v2.5_MASTER.mp4`: 21.103.604 B, SHA-256
  `9c1c8528711449265e421061924e5a8ad081e3053c093e1476b0e617d116cbaa`,
  1080×1920, 1537 f, −16,0 LUFS, TP −2,0 dBTP.
- Ligera `out/marti-fidel-v2.5_LIGERO.mp4`: 3.185.576 B, SHA-256
  `ff18a00f22d839a2a7622941332fc2a06feb67ad22096ce44e5f6beb0203020d`,
  720×1280, 1537 f, −16,0 LUFS, TP −1,8 dBTP.
- Mezcla `public/audio/real25/mix-v2.5.wav` (PASS_REAL, −15,9 LUFS,
  TP −1,5, SHA-256 `1a281ac1…22dda3c`).
- QA full: **passed, 0 advertencias, 0 fallos** (1537/1537 f; deriva
  de duración 0,172 s, la conocida del render por tramos; sin
  intervalos de silencio ni de negro).
- Auditoría de audio (`reports/audio-audit-v2.5`): **0 FAIL, 65 WARN,
  13 PASS, 41 INFO**. Sección (i) entera en PASS: (i1) empalmes
  limpios, (i2) sin dips en palabras, (i4) 16/16 segmentos contiguos,
  (i5) 0 enmascaramientos. (c) 0 cortes/empalmes/palabras exprimidas/
  pausas en mal estado · (e) 12 pausas, todas diseñadas · (f) 0
  ventanas bajo el suelo · alineación acústica media 0,057 s (máx
  0,091) · alineación en máster 0,041 s (V2.4: 0,044 s). Los 65 WARN
  son el patrón benigno conocido (56 captions cortos, 6 Whisper en
  máster, 2 fusiones «Y»/«EN» en L7, 1 bombeo de ducking 12,4 dB).
- Verificación visual del máster (fotogramas en `audit-frames/v25/`):
  tarjeta completa a 40,5 s (4 líneas, última en rojo, scrim del logo
  sobre el papel), reveal escalonado a 39,5 s (l1–l3), tesis a 42,0 s
  y 47,6 s («LEER.» + «PENSAR.» en fundido + CTA), sting a 50,0 s,
  sin regresión pre-inserción a 20,0 s. La tesis sigue SIN atribución
  en pantalla. Mapa y hechos verificados intactos.
