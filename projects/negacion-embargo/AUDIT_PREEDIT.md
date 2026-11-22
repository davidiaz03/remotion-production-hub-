# Auditoría pre-edición — «Dicen que no hay bloqueo»

> Fecha: 22-nov-2026 · Proyecto: `negacion-embargo` · Rama:
> `work/preprod-2026-11-21`.
> Alcance: auditar estrategia, métodos y estudio de referencias ANTES
> del montaje, para que al llegar la VO de Adriana la edición arranque
> directo y con calidad. **NO se editó ni renderizó nada**: falta el
> visto bueno final de Suleris (puerta dura) y la VO definitiva.
>
> Método: lectura de la estrategia, el dossier, el panel de
> negaciones, el brief, el manifiesto y el handoff; medición real de
> los tiempos del panel con faster-whisper small (timecodes por
> palabra, 22-nov-2026; JSON crudo en
> `research/panel-word-times.json`); verificación de los componentes
> reutilizables del hub (`shared/`, `shared/motion/`) y del índice
> SFX (`shared/motion/sfx/index.ts`, 320 sonidos CC0).
>
> **Regla de oro de esta auditoría: ninguna corrección toca el guion
> de Adriana** (está grabando; Suleris aprobó el texto). Todas las
> correcciones son visuales, sonoras o de estructura.

## Veredicto general

**APROBADO CON CORRECCIONES.** El arco es sólido (panel en ráfaga +
documento protagonista, con la tesis en una frase) y los materiales
alcanzan. Pero el plan tal cual tiene tres fallos que costarían
retención: (1) el gancho abre con texto sobre negro, sin cara;
(2) la sección de la realidad (L4–L6, ~32 s) tiene tramos de más de
10 s sin un cambio visual fuerte; (3) las tarjetas del panel no
pueden llevar la cita completa como texto (ilegible en 4 s). Las 12
correcciones (C1–C12, §7) son obligatorias antes de montar; ninguna
requiere regrabar ni reescribir.

| Dimensión | Veredicto | Correcciones |
|---|---|---|
| a. Retención | CONDICIONAL | C1, C3, C4, C5, C6, C7, C8, C10 |
| b. Técnicas | BUENO CON HUECOS | C2, C3, C6, C7, C11 |
| c. Mensaje | SÓLIDO | C6 (visual de L6), nota de terminología L4 |
| d. Recursos gráficos | SUFICIENTE | C9, C12, descarga NOAA |
| e. Preparación | LISTO PARA PRECONSTRUIR | Checklist §8 |

**Tiempos corregidos (medidos, no estimados):** el panel dura ~18 s
(no 12 s), L1 dura ~5 s (no 3 s) y el reel queda en **~75 s**
(rango 73–78 s según el ritmo real de Adriana), no 70 s. Ver el plan
escena por escena actualizado (§6) y C10.

## a. Retención — curva de atención segundo a segundo

Base de cálculo: VO a ~155 palabras/min (2,58 palabras/s) para
L1–L6 y L8; L7 más lenta (~130 palabras/min, dirección del brief).
Panel medido con Whisper (ver §6). Todos los tiempos son
provisionales hasta la VO real: **la edición sigue a la voz**.

| Tramo | Tiempo | Qué pasa | Riesgo | Interruptor |
|---|---|---|---|---|
| Gancho | 0–5 s | L1 (13 palabras, ~5 s) + título | **ALTO**: el plan abría con tarjeta sobre fondo negro, sin cara ni metraje — el primer fotograma decide el swipe | C1: cara en el fotograma 0 (Waltz en primer plano, still + Ken Burns) + título cinético con slam en los primeros 0,5 s |
| Panel T1 | 5–9 s | Rubio, cola de la frase (3,2 s de audio) | Medio: subtítulos quemados en inglés distraen | C9: punch-in 120–130% sobre la cara + banda de cita |
| Panel T2 | 9–15 s | Waltz «It's fake» (ráfaga 5,0 s medida) | Medio: pausa de 1,44 s antes de «Period.» puede leerse como hueco | «PUNTO.» entra con slam + impacto en la pausa (el silencio es el efecto) |
| Panel T3 | 15–19 s | Waltz «There is no blockade» (audio 2,2 s) + texto | Medio: la frase completa dura 10,9 s; no cabe | C2: solo la primera frase en audio + freeze-frame + texto corto |
| Panel T4 | 19–23 s | Fox, tarjeta diseñada (4 s) | Bajo: rompe el patrón (foto + texto, sin video) | Es el interruptor de patrón del panel; traducción completa legible en 4 s |
| Giro | 23–28 s | L2–L3 (~4,5 s), música cortada | Medio: pantalla casi vacía + silencio = riesgo en espectadores sin sonido | C4: rejilla 2×2 de las 4 tarjetas en L2 + texto cinético |
| L4 state.gov | 28–40 s | 25 palabras (~10 s) + documento | **ALTO**: 12 s de un solo plano sobre una captura = el tramo más largo sin cambio fuerte | C5: dos planos (página → punch al párrafo) + subrayado palabra por palabra + overlay en español |
| L5 5-nov | 40–50 s | 21 palabras (~8 s) + contador 1→10 | Bajo: el contador cambia cada ~0,8 s | Contador + nodos sincronizados + chip «5 BUQUES BLOQUEADOS» |
| L6 EAR | 50–60 s | 25 palabras (~10 s) + sello | Medio: tercer documento seguido; cero caras en 32 s de realidad | C6: cara de Waltz (muda) + 4 tiempos + imagen NOAA |
| Cierre L7 | 60–68 s | 17 palabras (~8 s), pantalla dividida | Medio: 6 s de pantalla dividida estática antes del sello | C7: las 4 mini-tarjetas de la izquierda ciclan cada ~1,5 s |
| Pregunta L8 | 68–73 s | 15 palabras (~6 s) + botones A/B | Bajo | C8: botones A/B + «Comenta A o B» (opcional) |
| Logo | 73–76 s | Logo animado, ~3 s | Bajo si es corto | Sin cola larga: 3 s y corte |

**Tramos de más de ~5 s sin cambio visual o sonoro (los 3 que
importan):**
1. **L4 (28–40 s, 12 s):** un solo zoom lento sobre la captura. Sin
   C5 es el punto de caída más probable del reel. Con C5 hay un
   cambio cada ~3–4 s (plano 1 → punch → subrayado continuo →
   overlay en español).
2. **Cierre (60–68 s, 8 s):** pantalla dividida estática. Sin C7
   (ciclo de mini-tarjetas) hay ~6 s sin cambio. Con C7 hay un
   cambio cada ~1,5 s.
3. **Panel T2 (9–15 s, 5,6 s):** la pausa de 1,44 s antes de
   «Period.» es el único silencio dentro del panel. Se convierte en
   efecto con el slam de «PUNTO.» (no es un fallo: es el latido
   dramático de la tarjeta).

**Chequeo en silencio (la mayoría ve sin sonido):** el reel funciona
mudo si se aplican C1 (cara + título), C4 (rejilla + texto cinético
en el giro), C5 (overlay en español de la cita) y C6 (el sello, el
tachado y «CONTROL» cuentan la lógica de L6 sin oír la VO). Sin C5,
un espectador mudo no entiende la cita de state.gov (está en
inglés).

## b. Técnicas — qué se usa de verdad de las referencias

Chequeo referencia por referencia (dossier, § Referencias y
§ Tendencias adaptables):

| Referencia | Qué se toma | Estado en el plan | Hueco / corrección |
|---|---|---|---|
| Jayapal 160K (confrontación pregunta-respuesta; la contradicción se VE en vivo) | Arco «afirmación → documento que la desmiente» | El arco existe (panel → state.gov) | Falta el momento de COLISIÓN visual: la transición panel → documento es un corte seco sin gesto. **C3**: WhipPan + whoosh en el límite L3→L4 (el documento barre a la negación). El hub tiene `WhipPan` en `shared/motion/transitions/`. |
| CUBANO MEDIA 38K (la negación como titular sobre el podio; el argumento cabe en una línea) | Titular-eslogan en pantalla + primer plano del podio | Las tarjetas del panel lo aplican | La TESIS no recibe el mismo tratamiento: L7 iba solo con karaoke. **C7**: L7 como eslogan en dos tiempos («EL BLOQUEO NO ES UN RELATO.» → «ES UN DOCUMENTO OFICIAL.» + sello). |
| Portavoz china 26K (voz de autoridad + B-roll que muestra) | Invertido: las voces niegan, el documento muestra | El documento muestra (L4–L5) | El lado «imagen que muestra» es solo documentos durante 32 s. **C6**: imagen satelital NOAA/CIRA de Cuba a oscuras al final de L6 (la consecuencia visible) + cara de Waltz en L6. |
| Graham Allen 14K (metraje crudo de confrontación; gancho de una línea) | Primer plano del podio + cita de una línea como tarjeta | Las tarjetas lo aplican | El GANCHO no: abría con texto sobre negro. **C1**: cara + título en el fotograma 0. |
| Reel Pilar 222 likes, 10,09x (caso + documento, sin cara; prueba de que el formato rinde en la propia cuenta) | Caso + documento como espina | El reel sigue esa espina | Sin hueco. Es la prueba de formato: no hay que justificar el sin-cara. |
| VisualPolitik 398K, 16,35x (ángulo del combustible: la tendencia #1 del dossier) | «El pivote del reel es la paradoja del combustible — EE. UU. es hoy el proveedor de gasolina de Cuba (231,7 M) mientras niega el embargo» | **AUSENTE del guion**: L6 menciona los 876 M totales, no los 231,7 M de combustible | **C6**: overlay visual (sin tocar la VO): bajo «$876 M», segunda línea «incluye $231,7 M en combustible» (Waltz, ONU 27-oct, vía Noticias ONU — ver nota de cifras en §c). La tendencia más caliente del dossier no puede quedarse fuera del reel. |
| DailyEduTalk (estructura: documento desclasificado como protagonista; tesis primero) | Tesis primero + documento protagonista | Se sigue (L1 tesis; L4–L5 documentos) | Sin hueco. (OJO: su rendimiento era 1.196 vistas; solo su ESTRUCTURA es la referencia, como anota el dossier.) |
| Belly of the Beast (sucesión de voces en ráfaga; la repetición hace el argumento) | Panel de 4 negaciones en ráfaga | Se sigue | Sin hueco, salvo C2 (citas cortas) y C3 (barra de tiempo). |

**Técnicas que el plan no nombraba y la auditoría añade:**
- **Interruptor de patrón en el panel:** las 4 tarjetas comparten
  estructura (video + cita + traducción). La barra de línea de
  tiempo (MAY 20 → JUL 7 → OCT 27 → NOV 16, con el punto que avanza
  en cada tarjeta) rompe la monotonía Y visualiza el argumento
  («campaña sostenida», no desliz). **C3**.
- **Ritmo del texto en pantalla:** el brief decía «la cita va
  completa». Imposible: la cita de Rubio tiene 28 palabras y la de
  Waltz (7-jul) ~30; a velocidad de lectura media (~200–250
  palabras/min) una tarjeta de 4 s admite ~13–17 palabras leídas.
  **C2**: cita CORTA en pantalla (las «tarjetas cortas sugeridas»
  de `panel-negaciones.md`), cita completa en el audio (tarjetas
  1–3) y en la descripción del video.
- **Diseño de sonido:** el plan nombraba «golpe por tarjeta» y
  «whoosh» sin mapa. **C11**: mapa SFX por escena con IDs reales
  del índice del hub (§8).

**Considerado y rechazado (para que no se reabra):**
- Choque Waltz–Bruno (UNifeed julio, 120–192 s, «You can pound
  away, my friend, this is not Havana»): introduce un segundo
  conflicto (la bronca en el podio) que distrae de la tesis.
- Línea «luxury goods» (27-oct, 1:05:54): Waltz dice «this embargo,
  I guess, doesn't apply to luxury goods» — inyectaría «embargo»
  en voz de Waltz y embarraría la tesis. Posible activo de la
  segunda parte.
- «The only embargo in Cuba is the guillotine…» (7-jul): mismo
  motivo.
- Recortar la frase de la tarjeta 3 por el medio (quitar la
  definición «A blockade is a ring of military ships…»): elipsis
  deshonesta — la definición ES el juego semántico de Waltz.
  O la primera frase o la frase completa; se elige la primera
  frase + texto (C2).

## c. Mensaje — ¿aterriza la tesis?

**Sí, con dos refuerzos visuales (C5, C6).** La tesis («ellos lo
niegan, sus documentos lo confirman») tiene un arco limpio:
L1 la enuncia, el panel la ilustra, L2–L3 la cuentan («Cuatro
veces. En seis meses.»), L4–L6 la prueban con tres documentos y L7
la sentencia. El guion no necesita cambios.

### Terminología BLOQUEO — auditoría completa

Regla de Suleris (22-nov, PERMANENTE): en la voz del Memorial se
dice BLOQUEO; «embargo» solo dentro de citas textuales de fuentes
de EE. UU. Verificación línea por línea (guion + todo el texto en
pantalla previsto):

| Dónde | Texto | Veredicto |
|---|---|---|
| L1, L2, L3, L5, L6, L7, L8 (VO) | «bloqueo» (L1, L7); resto sin el término | ✅ Correcto |
| L4 (VO) | «y cito, un embargo económico integral…» | ✅ Correcto: cita textual de state.gov, marcada con «y cito» |
| Título del reel | «Dicen que no hay bloqueo» | ✅ Correcto |
| Tarjeta 1 (Rubio) | «NO SE DEBE A UN “BLOQUEO” PETROLERO» | ✅ Es la palabra de Rubio (habló en español) |
| Tarjeta 2 (Waltz 7-jul) | «IT'S FAKE…» / «ES FALSO. ES MENTIRA. PUNTO.» | ✅ Sin el término |
| Tarjeta 3 (Waltz 27-oct) | «THERE IS NO BLOCKADE» / «NO HAY BLOQUEO» | ✅ Correcto |
| Tarjeta 4 (Fox) | «…naval cordon…» / «…cordón naval…» | ✅ Sin el término |
| Captura state.gov (documento) | «comprehensive economic embargo…» | ✅ Correcto: es el documento mismo, no nuestra voz |
| Overlay en español de L4 (C5) | «un embargo económico integral contra Cuba, que sigue vigente hoy» | ✅ Correcto — **y aquí está la trampa**: es la TRADUCCIÓN FIEL de la cita textual, así que conserva «embargo». El editor NO debe «corregirlo» a «bloqueo» (falsearía la cita). Va entrecomillado. |
| Sello L6 | «PERMISO REQUERIDO — EAR» | ✅ Sin el término |
| Sello final L7 | «ES UN DOCUMENTO OFICIAL» | ✅ Sin el término |
| Nodos L5 | «red de petróleo», «entidades estatales», «proveedores chinos» | ✅ Sin el término |
| Botones L8 | «NO EXISTE» / «NO LES CONVIENE» | ✅ Sin el término |

**Cifras (no inventar):** 876 M atribuido a Waltz (ONU 27-oct,
corroborado por Noticias ONU) — nunca como dato propio. Combustible:
la transcripción oficial del 27-oct dice $230 M; Noticias ONU y Fox
News dicen $231,7 M. El overlay de C6 usa **$231,7 M atribuido a
Waltz vía Noticias ONU** (regla del dossier: si la tarjeta cita la
transcripción oficial, usar $230 M; el overlay no cita la
transcripción, cita a Waltz vía Noticias ONU). 10 designaciones y 5
buques: comunicado del 5-nov (OE 14404), verificado.

### L6 — ¿se entiende o confunde?

«Waltz presume de 876 millones en ventas a Cuba. Pero cada venta
necesita un permiso del gobierno. Eso no es comercio libre, eso es
control.» La lógica es sólida pero el oyente puede quedarse con el
número grande (que suena a favor de Waltz) y perder el giro. El
giro depende de una sola palabra («Pero»). **C6** hace que la
imagen cuente la lógica paso a paso, en 4 tiempos sincronizados con
la VO: (1) «$876 M» grande + atribución «WALTZ · ONU 27-OCT» (+
línea secundaria «incluye $231,7 M en combustible»); (2) al «Pero»,
el sello «PERMISO REQUERIDO — EAR» cae sobre el número; (3) en «Eso
no es comercio libre», «COMERCIO LIBRE» aparece y se tacha en rojo;
(4) en «eso es control», «CONTROL» en rojo lo sustituye y la imagen
satelital de Cuba a oscuras entra detrás. Si el espectador solo mira
(sin oír), entiende lo mismo que si solo oye. «Presume» y «Eso es
control» son comentario editorial del narrador (nuestra voz), no
hechos citados: correcto así.

### L8 — ¿invita a comentar?

«¿Tú qué crees, que lo niegan porque no existe o porque no les
conviene admitirlo?» Sí: es una pregunta binaria (A/B) y las
binarias invitan a elegir bando en comentarios. **C8** la refuerza
visualmente con dos botones («A · NO EXISTE» / «B · NO LES
CONVIENE») y la línea «Comenta A o B» (opcional; el usuario o
Suleris pueden vetarla). La segunda opción es retórica (implica la
respuesta), lo cual es coherente con la voz editorial del Memorial;
no se cambia el guion.

## d. Recursos gráficos e imágenes — ¿alcanzan?

**Sí, con una descarga pendiente y dos límites.** Inventario contra
plan (manifiesto verificado):

| Pieza del plan | Asset | Estado |
|---|---|---|
| Gancho: cara + título | `real-un/waltz-27oct-podium.jpg` (1920×1080, primer plano verificado) | ✅ Listo |
| Panel T1: Rubio a cámara | `rubio-bloqueo-petrolero.mp4` (10,05 s; frase 6,34–9,56 s) | ✅ Listo, con C9 |
| Panel T2: Waltz «It's fake» | `waltz-7jul-its-fake.mp4` (17,02 s; ráfaga 11,18–16,16 s) | ✅ Listo (la cola «aid.» 0–0,24 s queda fuera del rango usado) |
| Panel T3: Waltz «There is no blockade» | `waltz-27oct-no-blockade-soundbite33.mp4` (26,6 s; frase 0,6–2,8 s) | ✅ Listo, con C2 |
| Panel T4: Fox | `waltz-foxnews-16nov.jpg` (1280×720) | ⚠️ Límite: usar como fondo con degradado + texto dominante, no como foto nítida a pantalla completa (el recorte vertical 9:16 la escala ~2,7×). Verificar crédito original al publicar. |
| L4: state.gov | `img/docs/statedept-cuba-sanctions.png` (1920×1080, párrafo completo legible) | ✅ Listo; C5 exige dos encuadres (página ~65% → punch al párrafo ~150–180%) para que la frase clave se lea en el móvil |
| L5: comunicado 5-nov | `img/docs/statedept-5nov-2026.png` (1920×1080) | ✅ Listo |
| L6: cara de Waltz (muda) | Soundbite 33, 19,3–25,2 s («did American companies export more than 876 million…», medido) o ventana UN Web TV 90,5 s (1:16:53–1:17:05) | ✅ Listo (preferir el soundbite: primer plano limpio) |
| L6: Cuba a oscuras | `Cuba_blackout_NOAA_CIRA_2026.png` (Drive, NO descargado) | ⏳ **Descargar AHORA** (preparación, §8): verificar resolución y crédito NOAA/CIRA al bajarla. Es la única imagen de «consecuencia» del reel. |
| L2: rejilla 2×2 | Los 4 stills (Rubio + 2 podios ONU + Fox) | ✅ Listos |
| Cierre: mini-tarjetas | Los 4 stills / tarjetas del panel | ✅ Listos |
| Contador 1→10 | `shared/motion/CountUp.tsx` | ✅ Componente del hub |
| Nodos red petrolera | `shared/motion/DiagramFlow.tsx` | ✅ Componente del hub, con C12 |
| Karaoke | `shared/motion/TopKaraoke.tsx` + `shared/Caption.tsx` | ✅ Componentes del hub |
| Título / titulares | `shared/AnimatedTitle.tsx`, `shared/motion/KineticHeadline.tsx` | ✅ Componentes del hub |
| Transiciones | `WhipPan`, `WaveWipe` (`shared/motion/transitions/`) | ✅ Componentes del hub |
| Zoom documento | `shared/motion/CameraMove.tsx`, `shared/motion/Magnifier.tsx` | ✅ Componentes del hub |
| Tarjeta de cita | `shared/motion/QuoteCard.tsx`, `shared/LowerThird.tsx` | ✅ Componentes del hub |

**Piezas gráficas a preparar ahora (sin VO, sin render del reel):**
tarjeta de título; plantilla de tarjeta del panel (4 instancias:
video + cita corta + traducción + nombre/cargo/fecha/fuente + barra
de tiempo); rejilla 2×2; tratamiento de documento (zoom + subrayado
+ overlay); contador + nodos; sello (componente nuevo o estilo de
`AlertBanner`: escala con spring + rotación −8° + golpe); tachado;
botones A/B; fondo oscuro con textura sutil para gancho/giro/
pregunta (con `ShaderGrainGradient` o textura IA — IA solo para
fondos/texturas/transiciones, nunca personas ni archivo sintético,
R21). **Ninguna pieza gráfica inventa personas, lugares ni
documentos.**

**Límites que el editor debe respetar:**
- **C12 — nodos sin inventar:** el dossier NO da el desglose de las
  10 designaciones por categoría (solo nombra 3 tipos: red de
  petróleo, entidades estatales, proveedores chinos). El gráfico
  muestra 10 nodos en 3 grupos por NOMBRE, sin cifras por grupo. El
  contador cuenta el total (1→10, verificado). Los 5 buques van en
  chip aparte («5 BUQUES BLOQUEADOS», verificado en el comunicado).
- **Rubio a 23,976 fps** en una composición de 30 fps: verificar en
  la composición que el punch-in no produce judder visible (el resto
  del metraje es 29,97 fps).
- **Fox 1280×720:** fondo con degradado, nunca foto hero a pantalla
  completa.

## e. Preparación para el montaje

### Se puede preconstruir AHORA (sin VO, sin render del reel)

1. Plantilla de tarjeta del panel (4 instancias) con los in/out
   medidos (§6); verificar con stills de Remotion (no con renders
   del reel).
2. Gancho: still + Ken Burns + título cinético + karaoke L1 (timing
   provisional).
3. Rejilla 2×2 (L2) + texto cinético «CUATRO VECES.» / «EN SEIS
   MESES.».
4. Tratamiento de documento L4 (dos planos + subrayado + overlay en
   español) y L5 (contador + nodos + chip de buques).
5. Secuencia L6 (sello + tachado + CONTROL + overlay combustible +
   ventana de Waltz muda).
6. Cierre: pantalla dividida + ciclo de mini-tarjetas + eslogan en
   dos tiempos + sello final.
7. Pregunta: botones A/B + línea «Comenta A o B» (opcional).
8. Estilo de karaoke + mapa de palabras clave en rojo (§8); el
   timing por palabra espera a la VO.
9. Mapa de sonido (§8): copiar los SFX al proyecto con
   `node shared/motion/sfx/add-sfx.mjs negacion-embargo <ids...>`
   (copiar archivos es preparación, no render).
10. Descargar la imagen NOAA/CIRA de Drive y verificar crédito y
    resolución.
11. Cama: elegir la candidata (familia `documentary-flow-a` o nueva
    generación Flow Music con brief documental, pulso bajo, sin
    voces). **NO generar ni escanear hasta el visto bueno de
    Suleris**; `scan-bed.py` (Whisper+VAD) obligatorio antes de
    usarla.

### Espera a la VO de Adriana (y al visto bueno de Suleris)

- El montaje ensamblado (cualquier render del reel, incluso
  borrador): puerta dura de Suleris.
- Timing exacto de cada bloque: la edición sigue a la voz. Al
  llegar la VO: transcribir con faster-whisper (timecodes por
  palabra), re-timbrar el plan (§6) y actualizar `durationInFrames`
  (2100 → ~2250 para ~75 s).
- Karaoke con timecodes reales por palabra.
- Mezcla (ducking de la cama bajo la VO, niveles de SFX) y máster.
- **Auditoría de audio obligatoria (`scripts/audio/audit-audio.py`)
  antes de entregar** (FAIL = no entregar). Reglas permanentes:
  ninguna pausa natural intra-línea <0,25 s ni perder >50%; la
  transcripción solo señala sospechas, el oído desempata; tramos
  PCM (`render-chunks.mjs --audio-codec pcm-16`); pre-vuelo visual
  obligatorio antes de cada render.

## 6. Plan escena por escena actualizado (tiempos corregidos)

Tiempos provisionales (VO a ~155 palabras/min; panel medido con
Whisper). El total real se fija con la VO de Adriana.

| # | Escena | Tiempo | Visual | Sonido | Asset / componente |
|---|---|---|---|---|---|
| 0 | Gancho | 0–5 s | Waltz primer plano (still + Ken Burns lento); título «DICEN QUE NO HAY BLOQUEO» con slam a 0,3 s; L1 karaoke; logo Memorial blanco desde f0 | `cinematic-drum-big` + `whoosh-medium-hard`; cama con pulso | `waltz-27oct-podium.jpg`; `KineticHeadline`; `TopKaraoke` |
| 1 | Panel T1 Rubio | 5–9 s | Video Rubio (clip 5,9–9,9 s; punch-in 120–130% sobre la cara); «NO SE DEBE A UN “BLOQUEO” PETROLERO»; nombre/cargo/fecha/fuente; punto 1 de la línea de tiempo | Voz original Rubio; `impact-medium-hard` al entrar | `rubio-bloqueo-petrolero.mp4` |
| 2 | Panel T2 Waltz 7-jul | 9–15 s | Video Waltz (clip 10,9–16,5 s); «IT'S FAKE. IT'S FALSE. IT'S A LIE. PERIOD.» + «ES FALSO. ES MENTIRA. PUNTO.»; «PUNTO.» con slam tras la pausa; punto 2 de la línea de tiempo | Voz original Waltz; `impact-heavy-hard` en «PUNTO.» | `waltz-7jul-its-fake.mp4` |
| 3 | Panel T3 Waltz 27-oct | 15–19 s | Video Waltz (clip 0,3–2,8 s) + freeze-frame; «THERE IS NO BLOCKADE» / «NO HAY BLOQUEO» (grande) + definición en pequeño; punto 3 de la línea de tiempo | Voz original («There is no blockade»); `impact-medium-hard` | `waltz-27oct-no-blockade-soundbite33.mp4` |
| 4 | Panel T4 Fox | 19–23 s | Tarjeta diseñada sobre foto Fox + degradado; «THERE IS NO AMERICAN NAVAL CORDON AROUND CUBA» + traducción completa; punto 4 de la línea de tiempo | `impact-medium-hard`; sin voz original | `waltz-foxnews-16nov.jpg` |
| 5 | Giro | 23–28 s | L2: rejilla 2×2 de las 4 tarjetas + «CUATRO VECES.» / «EN SEIS MESES.» cinético; L3: casi negro + «Vale. Ahora mira esto.»; la captura de state.gov empieza a entrar | Música CORTADA a casi-silencio; `reverse-whoosh-short-strong` antes del corte; `pop-medium-in` ×4 en la rejilla | 4 stills; `KineticHeadline` |
| 6 | L4 state.gov | 28–40 s | Plano 1 (0–4 s): página completa ~65% (URL + «Cuba Sanctions»); WhipPan → plano 2: punch al párrafo ~150–180% + subrayado palabra por palabra sobre «comprehensive economic embargo… remains in place today» + overlay en español entrecomillado; sello de fuente | `move-zoom-in` + `whoosh-medium-soft` en el punch; `impact-light-soft` al caer el overlay; cama baja | `statedept-cuba-sanctions.png`; `CameraMove`/`Magnifier` |
| 7 | L5 5-nov | 40–50 s | Captura del comunicado + contador 1→10 sincronizado con 10 nodos en 3 grupos por nombre (sin cifras por grupo); chip «5 BUQUES BLOQUEADOS» al final | `click-hover-medium` por paso; `impact-medium-hard` en el «10» | `statedept-5nov-2026.png`; `CountUp`; `DiagramFlow` |
| 8 | L6 EAR | 50–60 s | (1) Waltz mudo (soundbite 19,3–25,2 s) + «$876 M» + «WALTZ · ONU 27-OCT» + «incluye $231,7 M en combustible»; (2) sello «PERMISO REQUERIDO — EAR» sobre el número; (3) «COMERCIO LIBRE» tachado en rojo; (4) «CONTROL» en rojo + imagen NOAA/CIRA de Cuba a oscuras | `impact-heavy-hard` (sello); `swish-hard` (tachado); `bass-808-short` («CONTROL») | Soundbite 33; `Cuba_blackout_NOAA_CIRA_2026.png` |
| 9 | Cierre L7 | 60–68 s | Pantalla dividida: 4 mini-tarjetas ciclando (izq.) + 2 documentos (der.); eslogan en dos tiempos; sello «ES UN DOCUMENTO OFICIAL» + hold 0,5 s | `cinematic-slam-big` en el sello; cama sube levemente | Stills + capturas |
| 10 | Pregunta L8 | 68–73 s | Karaoke L8 + botones «A · NO EXISTE» / «B · NO LES CONVIENE» + «Comenta A o B» (opcional) | `pop-medium-in` ×2 | `TopKaraoke` |
| 11 | Logo | 73–76 s | Logo animado del Memorial (fondo negro) + sting | Sting del hub (`cinematic-drum-big`) | Logo animado del hub |

**Total: ~75 s** (73–78 s según el ritmo real de Adriana).
`durationInFrames` actual: 2100 (70 s) → actualizar a ~2250 al
llegar la VO. Si el total debe quedar ≤75 s, el ajuste es la
respiración de L4 (12→11 s) y la cola del logo (3→2,5 s); nunca
recortar el panel ni L7.

## 7. Correcciones (C1–C12)

| # | Qué cambiar | Dónde | Por qué |
|---|---|---|---|
| C1 | Gancho con CARA en el fotograma 0: Waltz en primer plano (still + Ken Burns) + título cinético con slam en 0,5 s; L1 dura ~5 s, no 3 s | 0–5 s | Todas las referencias top abren con cara (CUBANO MEDIA 38K, Graham Allen 14K, Jayapal 160K). Texto sobre negro = swipe. |
| C2 | Citas CORTAS en pantalla (tarjetas cortas de `panel-negaciones.md`); cita completa en el audio y en la descripción. T3: solo «There is no blockade» en audio + freeze-frame | Panel | Una tarjeta de 4 s admite ~13–17 palabras leídas; las citas completas tienen 28–30. La frase completa de T3 mide 10,9 s; cortarla por el medio sería deshonesto. |
| C3 | Barra de línea de tiempo en el panel (MAY 20 → JUL 7 → OCT 27 → NOV 16) + WhipPan entre tarjetas y en el límite panel → documento | Panel + giro | Interruptor de patrón + visualiza «campaña sostenida». El WhipPan al documento es la colisión Jayapal (la prueba barre a la negación). |
| C4 | L2 con rejilla 2×2 de las 4 tarjetas + texto cinético; el silencio del giro tiene ancla visual | 23–28 s | «Cuatro veces» se VE. Sin ancla visual, el silencio + pantalla vacía pierde a quien ve sin sonido. |
| C5 | L4 en DOS planos (página ~65% → punch al párrafo ~150–180%) + overlay en español de la cita (con «embargo», traducción fiel entrecomillada) | 28–40 s | 12 s de un solo plano es el punto de caída más probable. Sin overlay en español, el espectador mudo no entiende la cita (está en inglés). |
| C6 | L6: cara de Waltz (muda) + 4 tiempos (número → sello → tachado → CONTROL) + imagen NOAA al final + overlay «incluye $231,7 M en combustible» | 50–60 s | Tercer documento seguido y cero caras en 32 s. El overlay rescata la tendencia #1 del dossier (VisualPolitik 398K), ausente del guion, sin tocar la VO. |
| C7 | L7 como eslogan en dos tiempos + sello con slam; mini-tarjetas de la izquierda ciclan cada ~1,5 s | 60–68 s | La tesis merece el tratamiento CUBANO MEDIA (eslogan a pantalla completa). Sin ciclo, 6 s de pantalla dividida estática. |
| C8 | Botones A/B en L8 («NO EXISTE» / «NO LES CONVIENE») + «Comenta A o B» (opcional, a veto del usuario/Suleris); logo ~3 s | 68–76 s | La pregunta binaria rinde más como elección visible. La cola larga del logo sangra retención al final. |
| C9 | Rubio: punch-in 120–130% sobre la cara (los subtítulos quemados salen del encuadre vertical) + banda de cita como respaldo; verificar el clip 23,976 fps en la composición de 30 fps | Panel T1 | Sin fotograma limpio de subtítulos; el punch-in es más limpio que el recorte del tercio inferior (que cortaría barbilla/cuello). |
| C10 | Tiempos: panel ~18 s (medido), total ~75 s; `durationInFrames` 2100 → ~2250 al llegar la VO | Plan | L1 dura ~5 s (13 palabras a 155 ppm) y las tarjetas 2–3 con voz original duran 4–5,6 s (medido). El plan de 70 s no cabe. |
| C11 | Mapa de sonido por escena con IDs reales del índice SFX (§8); cama documental tras la aprobación + `scan-bed.py` | Todo | El plan nombraba golpes sin mapa. Cada SFX tiene su `sync` y su `uvo` en el índice; el editor no diseña el sonido desde cero. |
| C12 | Nodos: 10 nodos en 3 grupos por NOMBRE, sin cifras por grupo; chip «5 BUQUES BLOQUEADOS» aparte | L5 | El dossier no da el desglose por categoría. Inventarlo sería fabricar un dato. |

## 8. Checklist pre-edición + mapa de sonido + karaoke

### Listo para construir AHORA (sin VO, sin render del reel)

- [ ] Plantilla de tarjeta del panel (4 instancias, in/out medidos §6) — verificar con stills
- [ ] Gancho (still + Ken Burns + título + karaoke L1 provisional)
- [ ] Rejilla 2×2 + texto cinético L2–L3
- [ ] Tratamiento L4 (dos planos + subrayado + overlay) y L5 (contador + nodos + chip)
- [ ] Secuencia L6 (sello + tachado + CONTROL + overlay combustible + ventana Waltz)
- [ ] Cierre (pantalla dividida + ciclo + eslogan + sello)
- [ ] Botones A/B L8
- [ ] Estilo de karaoke + mapa de palabras clave (abajo)
- [ ] Copiar SFX al proyecto (`add-sfx.mjs`, IDs abajo)
- [ ] Descargar imagen NOAA/CIRA de Drive + verificar crédito y resolución
- [ ] Cama: elegir candidata (NO generar ni escanear hasta la aprobación)

### Espera a la VO / al visto bueno

- [ ] Visto bueno FINAL de Suleris (puerta dura: sin él no hay montaje ni render del reel)
- [ ] VO de Adriana → transcripción Whisper con timecodes por palabra → re-timing del plan §6 → `durationInFrames` ~2250
- [ ] Karaoke con timecodes reales
- [ ] Cama: generar/elegir ventana + `scan-bed.py` + mezcla (ducking bajo VO)
- [ ] Auditoría `audit-audio.py` obligatoria antes de entregar (FAIL = no entregar)
- [ ] Al publicar: crédito «Imágenes: UN Web TV / Naciones Unidas»; verificar crédito original de la foto Fox News

### Mapa de sonido (IDs reales de `shared/motion/sfx/index.ts`, CC0)

| Momento | SFX | Nota |
|---|---|---|
| Título gancho | `cinematic-drum-big` + `whoosh-medium-hard` | Slam del título a 0,3 s |
| Entrada de cada tarjeta del panel (×4) | `impact-medium-hard` | Golpe por tarjeta |
| Transición entre tarjetas (×3) + panel→documento | `whoosh-fast-hard` | WhipPan |
| «PUNTO.» (tarjeta 2) | `impact-heavy-hard` | Extra, tras la pausa de 1,44 s |
| Giro (corte de música) | `reverse-whoosh-short-strong` | Succión antes del silencio |
| Rejilla L2 (4 pops) | `pop-medium-in` ×4 | Escalonados |
| Punch al párrafo L4 | `move-zoom-in` + `whoosh-medium-soft` | |
| Overlay en español L4 | `impact-light-soft` | |
| Contador L5 (×10) | `click-hover-medium` por paso; `impact-medium-hard` en el «10» | Un tick cada ~0,8 s, ganancia baja |
| Sello EAR L6 | `impact-heavy-hard` | |
| Tachado «COMERCIO LIBRE» | `swish-hard` | |
| «CONTROL» | `bass-808-short` | |
| Sello final L7 | `cinematic-slam-big` | «Algo final: decidido, cerrado» |
| Botones A/B L8 | `pop-medium-in` ×2 | |
| Logo | `cinematic-drum-big` | Sting del hub |

Copiar con: `node shared/motion/sfx/add-sfx.mjs negacion-embargo
cinematic-drum-big whoosh-medium-hard impact-medium-hard
whoosh-fast-hard impact-heavy-hard reverse-whoosh-short-strong
pop-medium-in move-zoom-in whoosh-medium-soft impact-light-soft
click-hover-medium swish-hard bass-808-short cinematic-slam-big`

### Karaoke — mapa de palabras clave en rojo (#ED1C24)

2–4 palabras por golpe, solo sobre la VO (no sobre el panel). La
palabra clave en rojo es la que lleva el argumento, no la más
llamativa:

| Línea | Palabra(s) en rojo | Por qué |
|---|---|---|
| L1 | «bloqueo» | La afirmación negada |
| L2 | «Cuatro» | El conteo |
| L3 | «mira esto» | La invitación al documento |
| L4 | «sigue vigente hoy» | Lo operativo de la cita (NO «embargo»: es la palabra de ellos; el rojo marca nuestro énfasis) |
| L5 | «10 sanciones nuevas» | El número |
| L6 | «permiso» → «control» | Las dos palabras del giro |
| L7 | «documento oficial» | La tesis |
| L8 | «no existe» / «no les conviene» | Las dos opciones (a juego con los botones A/B) |
