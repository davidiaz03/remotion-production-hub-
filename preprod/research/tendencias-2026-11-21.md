# Tendencias de video corto 2026: ganchos y edición para reels de documental/denuncia/historia

**Fecha de la investigación:** 21-nov-2026. **Investigador:** subagente de investigación (Alberto).
**Propósito:** investigación con fuentes reales para el ecosistema del Memorial de la Denuncia —
qué funciona HOY en reels de documental, denuncia, historia y política en español, con foco en
ganchos y patrones de edición. **Idioma:** español (es-419).

**Cómo leer este documento:** cada ejemplo lleva su fuente y su fecha. Se distingue entre
**[VERIFICADO]** (visto directamente: video descargado y analizado, fotogramas leídos,
transcripción propia con faster-whisper) y **[SEGÚN FUENTE]** (dato que viene de un
estudio o artículo consultado, no medido por nosotros). Las métricas de Instagram son
likes/comentarios leídos el 21-nov-2026 con `instagram-cli` (Instagram no expone vistas
por post en esa vía); las de YouTube son vistas públicas leídas con yt-dlp el mismo día.
Si una métrica no es visible, se escribe «no visible en la fuente». Nada está inventado:
lo que no se pudo verificar está en la §6.

**Método de esta investigación (21-nov-2026):**
1. Relectura del estudio previo del 19-nov-2026 (`social-trends-v3-2026-11-19.md`,
   fuera del repo: `~/workspace/remotion-hub/projects/marti-fidel/research/`) y del
   artículo original de EditorOP (leído completo el 21-nov-2026).
2. Búsqueda de cuentas homólogas en Instagram con `instagram-cli` (posts recientes,
   ordenados por engagement) y en YouTube con yt-dlp (vistas públicas de Shorts).
3. Descarga de 15 videos (12 reels de Instagram + 3 Shorts de YouTube), transcripción
   completa con faster-whisper-small (español), extracción de fotogramas a 0,5 / 1,5 /
   3,0 s para leer el gancho visual, y conteo de cambios de escena con ffmpeg
   (`select='gt(scene,0.4)'`).
4. Lectura del estudio de ganchos de Scrptly (4.385 reels, publicado 8-nov-2026).

**Limitación del conteo de cortes:** la detección de escenas con umbral 0,4 registra
cambios de plano, no jump cuts dentro de un mismo plano fijo ni cambios de overlay.
En talking heads de plano fijo el número real de cortes de edición puede ser mayor
que el detectado. Se indica como «cambios de escena detectados», no como «cortes».

---

## 0. Limitaciones de esta investigación

- **vidIQ sin créditos:** igual que el 19-nov, la búsqueda de outliers en
  Instagram/TikTok en español no pudo ejecutarse (0 créditos; renovación el
  2-dic-2026). Se compensó con el estudio de EditorOP (que sí usó vidIQ el
  25-oct-2026 y publicó sus 75 casos con cifras), con `instagram-cli`, con
  yt-dlp y con descarga y análisis directo de 15 videos.
- **Vistas en Instagram:** el CLI de Instagram devuelve likes y comentarios por
  post, no vistas. Las vistas citadas son solo de YouTube. Para Instagram, la
  señal de rendimiento usada es likes (y su ratio frente a seguidores).
- **La transcripción automática (ASR) puede errar en palabras sueltas** (ver
  lección del 18-nov en AGENTS.md). Los ganchos transcritos se contrastaron con
  los subtítulos visibles en los fotogramas cuando había discrepancia; los dos
  casos corregidos se señalan en su ficha.
- **RT en Español y DW Documental no pudieron documentarse** (ver §6).
- **VisualPolitik:** sus Shorts recientes son todos anuncios de su máster, no
  documentales; su Instagram no se pudo localizar de forma fiable (ver §6).

---

## 1. Estudios con muestras publicadas (base cuantitativa)

### 1.1 EditorOP — «How to Make Documentary-Style Reels» [SEGÚN FUENTE]

Fuente: https://editorop.com/blog/documentary-style-reels (datos leídos el 25-oct-2026;
artículo releído completo el 21-nov-2026). Método: dos búsquedas de outliers en
vidIQ (Instagram + TikTok) devolvieron 80 posts del 25-sep al 23-oct-2026 con al
menos 100.000 vistas y subtítulos en inglés; tras filtrar a mano quedaron **75**
(38 de Instagram, 37 de TikTok). Muestra de ganadores, no aleatoria: muestra qué
tienen en común los que ganan, no qué causa la victoria.

**Cifras generales (75 posts):**
- Mediana de vistas: **1,2M**. Mediana del múltiplo sobre las vistas habituales
  del creador: **35,9x**.
- Con narrador o voz: **71/75**. Con texto en pantalla: **74/75**.
- Duración (37 TikToks): mediana **72 s**; 19 entre 45–90 s; 25 de 90 s o menos;
  7 de más de 3 min (el más largo, 6:58). De Instagram solo hay 4 duraciones
  (24–43 s).
- Por app: Instagram mediana 1,4M vistas y múltiplo 21,6x; TikTok mediana 1,1M
  vistas y múltiplo 173,2x (los creadores de TikTok solían tener ~7.100 vistas
  por post frente a ~107.900 los de Instagram). El post más visto: 12,8M
  (cuenta de medio con 42M de seguidores).
- Cuentas pequeñas (<10.000 vistas habituales, n=26): múltiplo mediano **398,1x**.
  Cuentas grandes (≥100.000, n=26): **6,5x**. El múltiplo mayor, 11.365,7x, fue
  un post sobre el pueblo más frío de la Tierra de una cuenta con 273 vistas
  habituales.

**Cuatro formas de construir la imagen (75 posts):**

| Build | Posts | Vistas medianas | Múltiplo mediano | Vistas habituales medianas |
|---|---|---|---|---|
| Narrador sobre metraje/fotos, nadie en cámara | 38 | 1,2M | **134,6x** | 10.850 |
| Creador en cámara con el material | 24 | 1,15M | 20,8x | 98.100 |
| Narrador sobre animación/3D | 9 | 1,4M | 79,6x | 17.500 |
| Texto sobre metraje, sin narrador | 4 | 1,25M | 80,3x | 144.400 |

La propia EditorOP advierte que el múltiplo se mueve con el tamaño de la cuenta
(los creadores con cara tenían ~9x más vistas habituales), así que no es prueba
de que «sin cara» gane; pero **sí desmonta que sin cara no se pueda romper**: el
formato documental faceless es el grupo ganador más numeroso. Tiempo de
producción estimado por vidIQ: 7 de 9 animaciones llevaron más de una semana;
los 24 posts con creador, un día o menos; el metraje se dividió (20 en un día o
menos, 18 en más).

**Temas (75 posts):** historia **25**; ciencia/naturaleza/cómo funcionan las
cosas 16; desastres y accidentes 13; personas y cultura 11; crimen y noticias 10.
vidIQ etiquetó 65/75 como educativos.

**Aperturas (75 posts):**
- **73/75 tenían texto en pantalla en los primeros 3 segundos**; la primera
  línea mediana era de **7 palabras**.
- 13 ponían una **fecha, año o época** en la línea de apertura («IN 1946.»,
  «92 million years ago,», «This is a story that starts in 1945.»).
- 8 empezaban con «This is / These are» sobre la cosa misma. 6 preguntaban.
- En **58/75 la voz empezaba dentro de los primeros 3 s**.

**Sonido y texto (75 posts):** 58 con música bajo la voz, 12 solo voz, 1 sonido
original del metraje; los 4 sin narrador eran texto sobre metraje (3 con música,
1 con el sonido del archivo). Narrador de IA señalado en 3 posts. Estilos de
texto: karaoke palabra por palabra **33**, texto guía que etiqueta cada paso
**26**, texto estático **15**.

**Ritmo (75 posts):** cambio visual alto en 41, moderado en 26, bajo en 8;
ritmo moderado en 50, rápido en 22, lento en 3. Los de cambio bajo sostenían
mayormente una sola toma (dron, vitrina de museo, cámara de seguridad).

**12 ejemplos del estudio** (vistas y múltiplos leídos el 25-oct-2026):

| Cuenta | Historia | Vistas | Múltiplo | Fecha | Build | Texto de apertura |
|---|---|---|---|---|---|---|
| @psychopoly_official (IG) | La caminata de 28 años de Karl Bushby, parte 1 | 5,2M | 6,9x | 6-oct | Pantalla dividida: mapa de ruta + archivo arriba, creador abajo | «He walked around the world» |
| @matt_forrest (IG) | Una costa antigua que aún moldea EE.UU. | 3,1M | 21,5x | 1-oct | Pantalla dividida: globo con zoom a capas de mapa | «92 million years ago,» |
| @thevothex (TikTok, 46 s) | Por qué las granjas de atún disparan la comida con cañones | 2,9M | 174,8x | 26-sep | Metraje + animación 3D, karaoke palabra por palabra | «when bluefin tuna are fed on farms» |
| @agensea.studio (IG, 40 s) | La Spartakiáda, gimnasia masiva en Praga | 1,7M | 13,1x | 4-oct | Pantalla dividida, archivo del estadio, cortes rápidos | «We FORGOT how to film this» |
| @corimanaka (TikTok, 53 s) | Nigel Richards gana Scrabble en idiomas que no habla | 1,7M | 164,9x | 14-oct | Archivo + entrevistas, karaoke | «Mind you, he's playing against literal grandmasters» |
| @map_sody (IG) | Por qué cuatro ciudades de la costa este están en una línea | 1,4M | 79,6x | 15-oct | Mapa animado: las ciudades aparecen y se unen | «WHY ARE PHILADELPHIA BALTIMORE WASHINGTON AND RICHMOND LINED UP» |
| @pastifact (TikTok, 32 s) | El impuesto a las ventanas en Inglaterra | 1,2M | 442,5x | 17-oct | Animación 3D: un albañil tapia una ventana | «In old England» |
| @60sechistoryofficial (IG) | La Unidad 2 de Chernóbil siguió operando tras 1986 | 940,5K | 152,7x | 10-oct | Una sola toma lenta de dron + texto; solo música, sin narrador | «Did you know Chernobyl's Unit 2 returned to operation after the 1986 disaster?» |
| @novapbs (IG) | Las pinturas de la cueva de Chauvet | 914,6K | 35,9x | 2-oct | Paneo lento sobre las pinturas, karaoke | «Stone Age Masterpiece» |
| @extreme_w3ather (TikTok, 75 s) | Tres huracanes a la vez en el Pacífico | 705K | 6,1x | 26-sep | Mapas de satélite con flechas rojas, narrador rápido | «September 26, 2026 3 hurricanes are spinning in the Pacific at once...» |
| @moviestocry (TikTok, 94 s) | Una caja fuerte recuperada del Titanic | 642,3K | 5,8x | 27-sep | Archivo de un brazo robot izando la caja | «Lost for Over 100 Years Recovered from Titanic» |
| @bungustore (TikTok, 72 s) | Antes se borraba con pan, no con goma | 631,6K | 3,2x | 29-sep | Creador en cámara + primeros planos | «People used to erase with bread» |

**Reglas de edición de EditorOP** (juicio editorial suyo, no dato): una imagen
por hecho; cortar en la palabra que nombra lo nuevo, no en la pausa posterior;
mover los stills (push-in o paneo lento); fijar los lugares (pin o ruta en el
mapa al nombrarlos); volver a la cara para el giro y el cierre (build con
presentador); mantener el texto el tiempo de leerlo dos veces. Guion en 5
tiempos (gancho, setup, giro, pago, cierre) para 45–90 s, ~150 palabras/minuto
(110–225 palabras). **Zona segura de Meta** (specs de Reels): libres el 14%
superior, el 35% inferior y el 6% de cada lado; en 1080×1920, banda de y≈270 a
y≈1250. Instagram dice buscar hacer menos visibles los reels «mayoritariamente
texto» y penaliza marcas de agua de terceros y contenido reutilizado sin
transformación material (reglas de abril 2024, extendidas a fotos y carruseles
en abril 2026). Meta exige su herramienta de divulgación para video fotorrealista
o audio realista creado/alterado digitalmente (etiqueta «AI info» desde julio
2024); YouTube renombró en julio 2025 su política a contenido no auténtico
(slideshows de imágenes, plantillas genéricas y contenido IA masivo entre los
ejemplos no permitidos para monetizar).

### 1.2 Scrptly — «The Reel Hook Study: 4,385 Reels analysed» [SEGÚN FUENTE]

Fuente: https://scrptly.io/learn/reel-hook-study (publicado 8-nov-2026; leído el
21-nov-2026). Método: 4.385 reels de Instagram analizados fotograma a fotograma,
publicados del 31-mar-2022 al 3-nov-2026; mediana de 143.800 vistas; 4.365 con
línea de apertura y vistas. Todas las cifras son medianas. Correlación, no
causalidad (lo advierte el propio estudio); no midieron curvas de retención.

- **Ganchos cortos ganan:** 1–4 palabras → mediana **342.814** vistas, 32,8%
  superan 1M; 19+ palabras → 110.350 vistas, 18,2% superan 1M. **3,1x** entre
  ambos extremos. La caída es una pendiente, no un acantilado (5–8 palabras:
  140.437; 9–12: 162.507; 13–18: 135.935).
- **Pero los videos de menos de 10 s colapsan:** <10 s → mediana **30.836**
  vistas, 10,7% superan 1M; 10–20 s → 203.801, 27,4%; 20–30 s → 160.492, 27,2%;
  30–60 s → 189.245, 27,7%; 60 s o más → 143.713, 21,3%. «Gancho corto, no
  video corto.»
- **Números en el gancho, peor:** con dígito → 106.208 vistas medianas (425
  videos); sin dígito → 150.236 (**−29%**). Hipótesis del estudio: el número
  anticipa la estructura y permite decidir que ya se sabe suficiente.
- **Consejos estándar que no hacen nada:** decir «you» → sin efecto (143.713 vs
  143.890); decir «I» → ligeramente peor (136.879 vs 152.812); **preguntar →
  +21%** (170.447 vs 141.286), el único que rinde.
- La ventaja del gancho corto se invierte en dos categorías (contenido de redes
  sociales y fitness).

### 1.3 Otros estudios citados en la investigación del 19-nov [SEGÚN FUENTE]

- **Revid** (análisis de 176.367 TikToks, oct-2025–oct-2026; solo videos con
  1.000+ likes): faceless mediana 114K vistas frente a 67K con persona en
  cámara; tutoriales faceless 156K vs 52K. Muestra qué tienen en común los
  exitosos, no causalidad.
- **Andrés Rangel**, «Estudio de reels virales 2026: 30 casos» (vistas tomadas
  el 6-nov-2026, 53,9M en total, 9 cuentas): método común — gancho que nombra
  el problema, una sola idea por video, cortes sin silencios y subtítulos, y
  cierre con una acción. Muestra elegida por el autor; psicología y finanzas
  suman el 80% de las vistas (nicho distinto al nuestro).
- **Hook Studio** (26-oct-2026, guía para LATAM): el gancho son tres capas
  simultáneas — primer cuadro (visual), texto en pantalla (una sola línea
  legible en menos de 2 s) y frase hablada (que **suma** al texto, no lo
  repite). El primer cuadro debe mostrar algo pasando.
- **RE/UGC**, «Instagram Reels Hooks: What Works in 2026» (actualizado
  6-nov-2026): el gancho debe entenderse con el sonido apagado; menos de 8
  palabras; el primer fotograma se ve como imagen fija antes de reproducirse
  (Explorar, perfil), así que debe leerse como un still.
- **BoostMaus**, «3-Second Hook & Retention Blueprint 2026» (revisado
  18-nov-2026): stack de 3 capas; cambio visual cada 1,8–2,5 s. Sus umbrales de
  algoritmo de Meta no tienen fuente verificable (afirmación de vendedor).

### 1.4 El dato propio del Memorial (contexto, no estudio externo)

De MEMORY.md (sección del Memorial): los 2 reels virales de referencia (14K y
9,1K reacciones; 115K/119K vistas) son presentadoras **A CÁMARA en diálogo**,
subtítulo karaoke grande con palabra clave en rojo, overlays de evidencia, tema
indignante. Los reels sin presentadora rinden 32–69 reacciones. Reglas de
identidad vigentes: marca de agua = LOGOTIPO COMPLETO, nunca solo la estrella;
en video, identificador BLANCO y TRANSPARENTE, SIN placa de fondo; el logo
animado del cierre SÍ conserva fondo negro. Prohibido IA para retratos/fotos de
Martí, Fidel o Browne o «archivo» sintético. Toda cama generada se escanea con
Whisper+VAD antes de usarla.

**Tensión aparente con EditorOP:** en la muestra global, el build sin cara es el
grupo ganador más grande (38/75) y el múltiplo mediano más alto (134,6x); en
ESTA cuenta, sin cara rinde 32–69 reacciones y con cara 14K/9,1K. La lectura
honesta (ya recogida el 19-nov): la brecha es de ejecución (evidencia visual,
ritmo, sourcing), no una condena del formato sin cara — pero el dato propio
manda para esta cuenta: **la presentadora a cámara es el multiplicador probado
del Memorial**, y el build sin cara solo compite si la evidencia visual y el
ritmo están al nivel de los ganadores de la muestra.

---

## 2. Ejemplos reales recientes en español (15 fichas)

Cada ficha: cuenta y handle, plataforma, URL, fecha, tema, duración, métricas
visibles, EL GANCHO (primeros 3 segundos, transcrito con brevedad), estructura,
y patrones de edición observables. Las transcripciones son propias
(faster-whisper-small, español) sobre el video descargado; los textos en
pantalla se leyeron en fotogramas a 0,5 / 1,5 / 3,0 s. Los cambios de escena se
contaron con ffmpeg (umbral 0,4; ver limitación en el encabezado). Métricas de
Instagram leídas el 21-nov-2026; vistas de YouTube leídas el 21-nov-2026.

### 2.1 AJ+ Español (@ajplusespanol, Instagram, 845.664 seguidores) — Estudiante cuestiona la campaña antidrogas en Oaxaca [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df-5JYsKMbS/
- **Fecha:** 20-nov-2026 (hecho: 18-nov-2026, Oaxaca, México). **Duración:** 44 s.
- **Métricas:** 20.216 likes, 481 comentarios (el reel más fuerte de AJ+ en la
  ventana consultada). Vistas: no visible en la fuente.
- **Tema:** denuncia — un estudiante de preparatoria cuestiona en plena campaña
  escolar al secretario de Gobierno de Oaxaca por la colusión del poder con el
  narcotráfico.
- **EL GANCHO (0–3 s):** tarjeta amarilla en pantalla — «Estudiante cuestiona
  las políticas antidrogas en plena campaña contra las adicciones» — + etiqueta
  de lugar y fecha «OAXACA, MÉXICO / 18 NOV 26» + voz del estudiante en vivo:
  «Nos piden a los jóvenes que no consumamos, pero ellos no detienen a los que
  venden». Plano general del acto escolar; el gancho es texto + voz + contexto,
  no el rostro.
- **Estructura:** denuncia en vivo → argumento central («la prevención no va a
  funcionar mientras el partido del poder esté coludido con quien vende la
  droga»; «no somos tontos») → giro conceptual («no es un problema de salud,
  es un problema de poder», según resumen de contenido) → cierre con llamada:
  «nosotros tenemos que romperla: no comprando, no consumiendo y no quedarnos
  callados» + «¿Tú qué opinas?».
- **Patrones de edición:** una sola toma fija (4 cambios de escena detectados);
  subtítulos blancos abajo; tarjeta amarilla de título; etiqueta de lugar/fecha;
  sin presentador, sin música (audio en vivo del acto). El metraje ES la
  denuncia: la cámara no se mueve y el contenido lo lleva la voz.
- **Por qué funciona aquí:** contradicción en vivo + protagonista inesperado
  (un adolescente frente a las autoridades) + frase citable. Los comentarios
  son mayoritariamente de apoyo y admiración («cuiden a este muchacho»).

### 2.2 AJ+ Español (@ajplusespanol, Instagram) — «¿Qué Venezuela es qué?» Trump en Filipinas [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df8bN8boHy0/
- **Fecha:** 19-nov-2026 (hecho: 18-nov-2026, Filipinas). **Duración:** 33 s.
- **Métricas:** 5.937 likes, **1.010 comentarios** (ratio comentario/like muy
  alto: tema polarizante). Vistas: no visible en la fuente.
- **Tema:** Trump llama a Venezuela «our new acquisition» en una reunión en
  Filipinas; contexto del acuerdo de agosto (EE.UU. control de ~20% del
  petróleo venezolano).
- **EL GANCHO (0–3 s):** tarjeta amarilla — «¿Qué Venezuela es qué? Esto es lo
  que dijo Donald Trump.» — + «FILIPINAS / 18 NOV 26» + Trump hablando en
  inglés con subtítulo en español: «Si sumas a Rusia y Arabia Saudita…».
  (La transcripción ASR del inglés es poco fiable; el gancho se describe por
  el texto en pantalla y los subtítulos visibles.)
- **Estructura:** cita textual del protagonista → overlay de contexto (acuerdo
  histórico de agosto) → cierre con la afirmación de EE.UU. como mayor
  productor de petróleo y gas.
- **Patrones de edición:** una sola toma de la reunión (2 cambios de escena);
  subtítulos en español sobre audio en inglés; overlay de contexto a mitad;
  sin presentador. Formato «cita + contexto», 33 s.

### 2.3 AJ+ Español (@ajplusespanol, Instagram) — La tribu Awá contacta con el pueblo por comida [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df8UWoQJPxB/
- **Fecha:** 19-nov-2026 (Maranhão, Brasil). **Duración:** 77 s.
- **Métricas:** 6.858 likes, 96 comentarios. Vistas: no visible en la fuente.
- **Tema:** ~20 miembros de los Awá (pueblo en aislamiento voluntario) se
  acercan a una aldea guajajara buscando comida.
- **EL GANCHO (0–3 s):** tarjeta amarilla — «Esta tribu aislada en Brasil hizo
  contacto con el pueblo por comida…» — sobre metraje de selva con el grupo +
  narración: «Esta tribu aislada en Brasil hizo contacto con el pueblo por
  comida. ¿Fue esto un acto de desesperación?». Afirmación + pregunta.
- **Estructura:** hecho → pregunta abierta → contexto (196 comunidades no
  contactadas en el mundo, 95% en la Amazonía) → riesgos (enfermedades,
  violencia, deforestación, minería) → los Guardianes del Bosque guajajara →
  cierre en la amenaza («una isla rodeada de destrucción»).
- **Patrones de edición:** 18 cambios de escena (metraje variado de selva y
  comunidad); narración en off sobre el metraje, nadie en cámara; texto guía;
  sin presentador. Es el build documental faceless clásico, 77 s — dentro de
  la mediana de 72 s de EditorOP.

### 2.4 Ac2ality (@ac2ality, Instagram, 530.307 seguidores) — Sánchez anuncia el Bono Deporte [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df7DKC_uxEE/
- **Fecha:** 19-nov-2026. **Duración:** 19 s.
- **Métricas:** 5.609 likes, 843 comentarios. Vistas: no visible en la fuente.
- **Tema:** propuesta electoral — bono de 200 €/año para deporte juvenil
  (18–25 años), elecciones del 29-nov-2026.
- **EL GANCHO (0–3 s):** Sánchez a cámara con camiseta de baloncesto y balón:
  «Si tienes entre 18 y 25 años tengo una propuesta para ti.» + rótulo
  «Sánchez ofrece un Bono Deporte de 200 euros al año para jóvenes de 18 a 25
  años». El gancho es apelación directa por edad + el propio protagonista.
- **Estructura:** apelación → propuesta (200 €/año «para que nada te impida la
  práctica de tu deporte favorito») → CTA electoral («el próximo 29 de
  noviembre todo el mundo votando»).
- **Patrones de edición:** pantalla dividida (plano medio hablando arriba,
  foto fija con el balón abajo); 2 cambios de escena; subtítulos; 19 s — el
  más corto del conjunto, y aun así con 843 comentarios. El formato «el
  político se dirige a ti» funciona sin B-roll.

### 2.5 Ac2ality (@ac2ality, Instagram) — Parodia IA: tráiler de GTA VI con Pedro Sánchez [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df64NZ8ujer/
- **Fecha:** 19-nov-2026. **Duración:** 78 s.
- **Métricas:** 7.394 likes, 109 comentarios. Vistas: no visible en la fuente.
- **Tema:** parodia creada con IA por GARABATRÓN («GTA 29N: Anotop AT consigue
  la absoluta. Pedro nunca se rinde»): Sánchez pierde las elecciones del 29N
  y huye a República Dominicana.
- **EL GANCHO (0–3 s):** metraje estilo GTA (cartel «Bienvenidos a República
  Dominicana») + voz: «Tuve unos problemitas en España. Anotop AT ganó con
  mayoría absoluta. Tuve que dejarlo todo atrás y empezar de cero.» + rótulo
  «Crean con IA una versión del tráiler de GTA VI protagonizada por Pedro
  Sánchez después de perder las elecciones del 29N.» (El ASR transcribió
  «A lo top, Ate»; se corrige por «Anotop AT» según el resumen de contenido y
  la caption.)
- **Estructura:** arco de tráiler de videojuego (huida → nueva vida → acción)
  → cierre emocional-paródico: «Hemos pasado por muchas cosas. Esta es
  simplemente otra más.»
- **Patrones de edición:** pantalla dividida (metraje IA arriba, primer plano
  del Sánchez-IA con francotirador abajo, fijo); 6 cambios de escena;
  subtítulos; música pop animada. Es el formato «animación IA como narrativa
  política» ya señalado el 19-nov (anime de Sánchez de André Rocha): el
  público político hispano está viendo animación de alto esfuerzo.
- **Nota para el Memorial:** NO transferible como formato (rompe el pacto de
  evidencia y la regla de no-IA para personas reales), pero marca el listón de
  ambición visual del entorno.

### 2.6 Memorias de Pez (@memoriasdepez, Instagram, 79.530 seguidores) — Clip de la entrevista a Pedro Sánchez [VERIFICADO]

- **URL:** https://www.instagram.com/reel/DfacfyeInQR/
- **Fecha:** 6-nov-2026. **Duración:** 109 s.
- **Métricas:** 5.276 likes, 503 comentarios (la más comentada de la cuenta en
  la ventana). Vistas: no visible en la fuente.
- **Tema:** adelanto de la entrevista de Borja Fernández (Memorias de Pez) a
  Pedro Sánchez: Ceuta, Marruecos y el Sáhara; Gaza, Israel, Irán, Ucrania;
  crisis demográfica; problemas de Europa.
- **EL GANCHO (0–3 s):** Sánchez hablando, a mitad de frase: «Yo no me puedo
  basar en suposiciones para redefinir una relación bilateral.» **Sin texto en
  pantalla en los primeros 3 s** — el único de los 15 sin gancho textual. El
  gancho es la persona (un presidente en un podcast) + el corte a mitad de
  frase. Las tarjetas de tema («CEUTA, MARRUECOS Y EL SÁHARA», etc.) aparecen
  después.
- **Estructura:** montaje de respuestas por temas con tarjetas → cierre con
  gráfica promocional («ENTREVISTA COMPLETA EN MEMORIAS DE PEZ / DOMINGO 8 DE
  NOVIEMBRE 12:00»).
- **Patrones de edición:** 14 cambios de escena; estudio de podcast (luz
  rosa/morada, dos micrófonos, logo neón de pez globo); tarjetas de tema;
  **formato CUADRADO 1080×1080, no vertical** — y aun así es su reel más
  comentado del período, porque el contenido (acceso al presidente) pesa más
  que el formato. Los comentarios están polarizados (felicitaciones vs.
  acusaciones de sesgo/pago).
- **Lección:** el acceso exclusivo compensa la ausencia de gancho textual;
  sin acceso, un clip sin texto en 0–3 s no tiene ese colchón.

### 2.7 La Base (@labase_tv, Instagram, 211.027 seguidores) — Delcy Rodríguez presenta a Hegseth: «alto y joven» [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df73mM5MSAg/
- **Fecha:** 19-nov-2026. **Duración:** 52 s.
- **Métricas:** 1.514 likes, 266 comentarios. Vistas: no visible en la fuente.
- **Tema:** Hegseth entra en Miraflores y llama terrorista a Maduro; Delcy
  Rodríguez lo presenta como «alto, joven y con una gran responsabilidad»;
  cronología del desmantelamiento petrolero venezolano en 2026.
- **EL GANCHO (0–3 s):** pantalla dividida (presentadora arriba, metraje de
  Hegseth abajo) + voz: «Ayer, Pete Hegseth, el secretario de Guerra de Trump,
  entró en el Palacio de Miraflores, y allí, frente a las autoridades
  venezolanas…» + subtítulos. Gancho de actualidad con fecha («ayer») y lugar
  cargado (Miraflores).
- **Estructura:** hecho → cita de Delcy → cronología (enero: nueva ley de
  hidrocarburos; agosto: EE.UU. control mayoritario de reservas) → cierre
  valorativo: «asistimos al desguase pieza a pieza de lo que construyó alguna
  vez la revolución bolivariana».
- **Patrones de edición:** 2 cambios de escena (pantalla dividida fija);
  subtítulos; logo (R) de Canal Red; presentadora a cámara + archivo. El clip
  es un recorte del podcast; el gancho lo pone la actualidad, no la edición.

### 2.8 Pablo Iglesias (@iglesiasturrionpablo, Instagram, 528.993 seguidores) — «¿Centros clandestinos en Ucrania donde torturan a desertores?» [VERIFICADO]

- **URL:** https://www.instagram.com/reel/DfXpjv9oPMr/
- **Fecha:** 5-nov-2026. **Duración:** 94 s.
- **Métricas:** 2.543 likes, 131 comentarios. Vistas: no visible en la fuente.
- **Tema:** denuncia — vecinos cerca de Kiev asaltan una vivienda donde
  presuntamente se retenía y torturaba a desertores; lectura sobre la guerra
  de desgaste y la OTAN.
- **EL GANCHO (0–3 s):** talking head a cámara, fondo rojo, karaoke gigante
  palabra por palabra («DEL / NOVIEMBRE / A…») + voz: «La noche del 2 de
  noviembre en una localidad cercana a Kiev, un centenar de personas se
  congregaron de forma espontánea para asaltar lo que parecía una vivienda
  particular…». Gancho narrativo con fecha exacta y escena en curso.
- **Estructura:** hecho con fecha → descripción (sótano, torturas a quienes se
  niegan a morir) → análisis (la guerra de desgaste borró el nacionalismo
  inicial) → cierre acusatorio («la defensa de la OTAN queda retratada…
  el Club de Amigos Progres de la OTAN»).
- **Patrones de edición:** 2 cambios de escena (un solo plano fijo, 94 s);
  karaoke de palabra única gigante en el centro (el formato más agresivo del
  conjunto); taza «LA BASE» en plano; sin B-roll, sin música audible. El peso
  lo llevan la voz, la fecha y el karaoke.
- **Nota:** la afirmación central se presenta con cautela («según se
  rumoreaba», «se especulaba») — denuncia con atribución, no como hecho
  cerrado.

### 2.9 Rafa Borrego (@rafaborregop, Instagram, 129.493 seguidores) — «Zarpamos en la Global Sumud Flotilla rumbo a Gaza» [VERIFICADO]

- **URL:** https://www.instagram.com/reel/DOB20ooiiPO/
- **Fecha:** 31-ago-2025. **Duración:** 68 s.
- **Métricas:** **95.404 likes, 5.074 comentarios** — de lejos el mayor
  engagement absoluto del conjunto (con 129K seguidores: ratio likes/seguidor
  ≈ 0,74). Vistas: no visible en la fuente.
- **Tema:** denuncia/acción — salida de la flotilla humanitaria a Gaza para
  romper el asedio.
- **EL GANCHO (0–3 s):** selfie en primer plano en el barco, mar detrás:
  «Pues ya está, ya hemos salido a Gaza, cargados de ayuda humanitaria y
  dispuestos a romper el asedio.» (El ASR transcribió «a cazar»; se corrige
  por «a Gaza» según el subtítulo visible en el fotograma y la caption.)
  Gancho de acción en presente + lugar + misión, dicho por el protagonista
  en el lugar de los hechos.
- **Estructura:** anuncio → desmarque («esto no es una misión para decir mira
  qué máquina somos») → quiénes van («jóvenes, jubilados, médicos, taxistas,
  estudiantes… gente de 50 países») → cierre desafiante: «Porque temen
  represalias de Israel o de Estados Unidos. Pero si los gobiernos tienen
  miedo, nosotros no.»
- **Patrones de edición:** 2 cambios de escena (una sola toma selfie, 68 s);
  subtítulos; sin B-roll, sin música, sin gráficos. El formato más simple del
  conjunto y el de mayor rendimiento: el gancho es la acción real + el
  testigo-protagonista.
- **Lección para el Memorial:** el testimonio en primera persona desde el lugar
  de los hechos supera a cualquier edición. Equivalente en nuestro terreno:
  archivo real de la persona hablando (ver §2.6 del estudio del 19-nov: el
  archivo real de Fidel rindió ratios extremos).

### 2.10 «No es el fin de la ciencia» / El Orden Mundial (@noeselfindelaciencia.podcast, Instagram, 1.115 seguidores) — «¿Franco no quiso la bomba nuclear?» [VERIFICADO]

- **URL:** https://www.instagram.com/reel/Df7SBLrkeQm/
- **Fecha:** 19-nov-2026. **Duración:** 52 s.
- **Métricas:** 352 likes, 21 comentarios — con solo 1.115 seguidores, ratio
  likes/seguidor ≈ 0,32 (el segundo más alto del conjunto tras Borrego).
  Vistas: no visible en la fuente.
- **Tema:** historia — el Proyecto Islero: Franco encargó en secreto diseñar
  una bomba atómica española y luego lo abandonó.
- **EL GANCHO (0–3 s):** tarjeta roja en pantalla — «¿Franco no quiso la bomba
  nuclear?» — sobre el estudio de podcast. **La voz arranca a mitad de
  conversación** («la bomba tenía que cumplir esas características…»): el
  gancho lo hace la tarjeta, no la voz. Pregunta contraintuitiva (Franco +
  bomba atómica) + cohete emoji.
- **Estructura:** pregunta → debate entre 3 presentadores (Velarde, el
  ministro de Industria, 60.000 millones de pesetas frente a 10.000) →
  cierre con el dato del coste («esos 60.000 millones serían si volvieran a
  empezar»).
- **Patrones de edición:** 4 cambios de escena; estudio con 3 micrófonos;
  tarjeta de pregunta fija; logo del podcast arriba a la derecha. Clip de
  podcast con gancho de tarjeta — el modelo «pregunta en pantalla + debate»
  funciona incluso con cuentas diminutas si la pregunta es buena.

### 2.11 teleSUR (@telesurtv, Instagram, 850.465 seguidores) — «Francia vive nueva oleada de protestas» [VERIFICADO — EJEMPLO NEGATIVO]

- **URL:** https://www.instagram.com/reel/DgBKrIGCYP3/
- **Fecha:** 21-nov-2026. **Duración:** 34 s.
- **Métricas:** 252 likes, 13 comentarios — con 850K seguidores (ratio
  ≈ 0,0003). Los reels recientes de teleSUR en la ventana consultada oscilan
  entre 8 y 252 likes. Vistas: no visible en la fuente.
- **Tema:** protestas en Francia por el alto costo de vida (París, Burdeos,
  Lyon, Rennes).
- **EL GANCHO (0–3 s):** metraje nocturno de humo/gas + rótulo «FRANCIA VIVE /
  NUEVA OLEADA DE PROTESTAS / POR EL ALTO COSTO DE VIDA». **Sin narración y
  sin subtítulos.** La transcripción ASR solo detectó dos segmentos en todo el
  video: «¡Suscríbete!» (0–2 s) y «¡Muchas gracias!» (30–34 s) — es decir,
  el audio es una CTA de suscripción, no contenido.
- **Estructura:** montaje de metraje (noche: enfrentamientos; día: marcha en
  Rennes) sin voz que lo articule.
- **Patrones de edición:** 10 cambios de escena; música; rótulo de titular;
  logo teleSUR arriba a la derecha. El metraje es bueno (gas, multitudes,
  vehículo blindado) pero no hay voz, no hay dato, no hay pregunta: es un
  telediario mudo recortado a vertical.
- **Lección:** el formato institucional sin gancho no compite: 850K seguidores
  y 252 likes. El contraste con AJ+ (misma temática, voz + tarjeta + fecha)
  es la diferencia entre informar y retener.

### 2.12 Con Filo (@confilo_cuba, Instagram, 1.848 seguidores) — «Chávez, como todo gran líder, parece que nos habla hoy» [VERIFICADO — EJEMPLO NEGATIVO DE FORMATO]

- **URL:** https://www.instagram.com/reel/DSdeAm5iVqh/
- **Fecha:** 19-dic-2025. **Duración:** 148 s.
- **Métricas:** 25 likes, 35 comentarios. Vistas: no visible en la fuente.
  Los reels recientes de la cuenta oscilan entre 10 y 25 likes, con duraciones
  de 145–197 s.
- **Tema:** compilación de archivo de Hugo Chávez (narcoestado, medios y el
  «imperio yanqui», dignidad latinoamericana).
- **EL GANCHO (0–3 s):** Chávez en archivo: «Ahora dicen que nosotros somos un
  narcoestado. Ellos son el narcoestado.» La frase es un gran gancho — pero
  el video es **horizontal 852×480 con barras negras laterales** (no vertical),
  con karaoke pequeño y difícil de leer, y dura 148 s.
- **Estructura:** tres discursos de archivo encadenados (narcoestado →
  medios/EE.UU. → «defendemos y defenderemos la dignidad de nuestros
  pueblos… hasta las últimas consecuencias»).
- **Patrones de edición:** 46 cambios de escena (montaje de TV); karaoke
  pequeño rojo/blanco; gráficos de TV; formato horizontal pillarbox. Es un
  recorte de televisión subido tal cual a Reels.
- **Lección:** el material (archivo real de Chávez con una frase-gancho
  excelente) no compensa el formato: horizontal, 148 s, texto ilegible. El
  mismo archivo, en vertical 9:16, con la frase como tarjeta grande en 0–3 s
  y 45–60 s de duración, sería otro producto. (Compárese con §2.9: el archivo
  real + formato vertical simple rinde; el archivo real + formato TV, no.)

### 2.13 Memorias de Pez (YouTube) — «¿Por qué ESTADOS UNIDOS le debe su independencia a ESPAÑA?» [VERIFICADO]

- **URL:** https://www.youtube.com/shorts/3KtVaN5E_4c
- **Fecha:** 4-jul-2026. **Duración:** 96 s.
- **Métricas:** **172.096 vistas** (YouTube, leídas 21-nov-2026). Es el Short
  con más vistas de los consultados de esta cuenta en la ventana.
- **Tema:** historia — la ayuda española (Bernardo de Gálvez, dinero, Pensacola)
  a la independencia de EE.UU.
- **EL GANCHO (0–3 s):** Borja a cámara, gesto enfático, karaoke grande con
  palabra clave en amarillo: «¿SABÍAS QUE ESTADOS UNIDOS LE DEBE SU
  INDEPENDENCIA A ESPAÑA? Ahora te lo cuento.» Pregunta + promesa inmediata.
- **Estructura:** pregunta → setup con fecha («Corría el año 1776. Los rebeldes
  americanos están sin blanca, sin pólvora…») → desarrollo (Gálvez, Pensacola,
  «un jaque mate estratégico») → giro (el dinero) → cierre con recuerdo
  («el origen de la mayor potencia del mundo lleva grabada la huella de
  España») + «Os dejamos toda la información en la descripción».
- **Patrones de edición:** 24 cambios de escena; talking head + B-roll/mapas;
  karaoke con highlight amarillo por palabra; ritmo de ~1 cambio cada 4 s;
  presentador a cámara todo el tiempo. El modelo «presentador + evidencia
  visual» en su versión más pulida del conjunto hispano.

### 2.14 Memorias de Pez (YouTube) — «¿Por qué CUBA ha COLAPSADO?» [VERIFICADO]

- **URL:** https://www.youtube.com/shorts/kX8hi41Aj34
- **Fecha:** 17-jun-2026. **Duración:** 82 s.
- **Métricas:** 30.899 vistas (YouTube, leídas 21-nov-2026).
- **Tema:** las cinco razones del colapso cubano (energía, … sanciones de
  EE.UU. como factor nº 4).
- **EL GANCHO (0–3 s):** Borja a cámara, mano levantada mostrando 5 dedos:
  «Las cinco razones por las que Cuba ha colapsado. Uno, se quedó sin
  energía.» Lista numerada + gesto + primer ítem inmediato (no espera al
  segundo 10 para dar contenido).
- **Estructura:** lista 1–5 con un dato por ítem (energía: centrales viejas y
  petróleo venezolano; … cuatro: las sanciones «empeoran la asfixia») →
  cierre «Os dejo toda la información en la descripción. Hasta la próxima.»
- **Patrones de edición:** **52 cambios de escena en 82 s (~1 cada 1,6 s)** —
  el corte más rápido del conjunto; talking head + gráficos/mapas que cambian
  con cada ítem; karaoke con highlight. Es el extremo «cambio por hecho» de
  EditorOP llevado al máximo.
- **Nota:** el tema es directamente el nicho del Memorial (Cuba, sanciones,
  energía). El video existe y rinde; la lectura editorial del Memorial sobre
  el mismo tema sería otra, pero el formato (lista numerada + gesto + dato
  inmediato) es reutilizable.

### 2.15 La Hiperactina (YouTube + Instagram, 600.341 seguidores en IG) — «Por qué prefiero no pedir el ticket en papel» [VERIFICADO]

- **URLs:** https://www.youtube.com/shorts/gq0kZogoyVQ ·
  https://www.instagram.com/reel/DeuOfm_Abiv/
- **Fecha:** 20-oct-2026. **Duración:** 64 s.
- **Métricas:** **272.429 vistas** en YouTube; 12.583 likes y 167 comentarios
  en Instagram (mismo contenido en ambas plataformas).
- **Tema:** divulgación — los tickets térmicos llevan bisfenoles; mejor pedir
  el ticket digital.
- **EL GANCHO (0–3 s):** Sandra a cámara, sonriendo, con el ticket en la mano
  como objeto: «¿Eres de las que siempre pide el ticket en papel? Te cuento
  por qué es mejor que lo evites.» Pregunta personal (segunda persona) +
  objeto en mano + promesa.
- **Estructura:** pregunta → mecanismo («muchos tickets no se imprimen con
  tinta») → dato («en 2020 la Unión Europea restringió el bisfenol A en los
  tickets») → consecuencia personal («parte de esos bisfenoles pueden pasar a
  tu piel, lo que seguramente esté ocurriendo ahora mismo») → cierre con
  acción («pide que te envíen el ticket al móvil… si no lo necesitas, no lo
  pidas»).
- **Patrones de edición:** 16 cambios de escena; talking head + objeto +
  gráficos; subtítulos; ritmo de ~1 cambio cada 4 s. El formato «pregunta
  personal + objeto + dato + acción» es el más replicable del conjunto para
  temas de denuncia con un objeto físico (documento, foto, libro).

---

## 3. Ejemplos adicionales con datos parciales (no descargados)

Estos no se analizaron fotograma a fotograma, pero sus métricas y temas se
leyeron directamente en las fuentes el 21-nov-2026 y sirven como referencia de
rendimiento por cuenta. [VERIFICADO] en métricas; gancho no transcrito.

| # | Cuenta / handle | Plataforma | URL | Fecha | Tema | Duración | Métricas |
|---|---|---|---|---|---|---|---|
| A1 | La Hiperactina @lahiperactina | YouTube / IG | https://www.instagram.com/reel/Deyv6tXDOOA/ | 22-oct-2026 | ¿Cómo consigue el cáncer llegar a otros órganos? (metástasis) | 89 s | 165.960 vistas (YT); 11.966 likes (IG) |
| A2 | Memorias de Pez @memoriasdepez | YouTube / IG | https://www.instagram.com/reel/DdwtaNUI3zG/ | 26-sep-2026 | Etiopía vuelve a la guerra | 66 s | 70.245 vistas (YT); 658 likes (IG) |
| A3 | Memorias de Pez | YouTube | https://www.youtube.com/shorts/vBaP4cuDYVg | 6-may-2026 | El día que Maradona le devolvió la dignidad a un país | 68 s | 46.634 vistas (YT) |
| A4 | La Hiperactina | YouTube | https://www.youtube.com/shorts/JhVhfC_i20Y | 14-oct-2026 | ¿Por qué cuando estás malo no quieres hablar con nadie? | 58 s | 120.475 vistas (YT) |
| A5 | Ac2ality @ac2ality | IG | https://www.instagram.com/reel/Df67_xEutHN/ | 19-nov-2026 | (video sin caption descriptiva) | 11 s | 7.932 likes |
| A6 | Ac2ality @ac2ality | IG | https://www.instagram.com/reel/Df7Ede_u35S/ | 19-nov-2026 | Aitana lanza un mensaje ante las elecciones generales | 16 s | 4.663 likes, 468 comentarios |
| A7 | AJ+ Español @ajplusespanol | IG | https://www.instagram.com/reel/Df_N2voTgRf/ | 20-nov-2026 | Abrazo colectivo nacido de una pregunta | 91 s | 6.175 likes, 220 comentarios |
| A8 | AJ+ Español @ajplusespanol | IG | https://www.instagram.com/reel/DgAnGHTM5We/ | 21-nov-2026 | ¿Por qué Israel quema y arranca los olivos en Palestina? | 63 s | 3.274 likes, 43 comentarios |
| A9 | AJ+ Español @ajplusespanol | IG | https://www.instagram.com/reel/DgA0wFSCeVa/ | 21-nov-2026 | La mayoría de edad en México bajó de 21 a 18 tras Tlatelolco | 57 s | 496 likes, 4 comentarios |
| A10 | La Base @labase_tv | IG | https://www.instagram.com/reel/Df7o5ASMScu/ | 19-nov-2026 | Ni una nueva Yalta, ni un frente común (cumbre de Shenzhen) | 169 s | 873 likes, 21 comentarios |
| A11 | Pablo Iglesias @iglesiasturrionpablo | IG | https://www.instagram.com/reel/Dfh5XIWI3Q5/ | 9-nov-2026 | 3 millones de trabajadores paraguayos sin acceso a sus depósitos | 62 s | 2.313 likes, 104 comentarios |
| A12 | Pablo Iglesias @iglesiasturrionpablo | IG | https://www.instagram.com/reel/Dfp5gc4oY59/ | 12-nov-2026 | ¿Quiénes son los responsables de las cargas policiales? | 125 s | 2.374 likes, 162 comentarios |
| A13 | El Orden Mundial @elordenmundial | IG | https://www.instagram.com/reel/Df92XsiikIn/ | 20-nov-2026 | Los símbolos de Los Juegos del Hambre en las protestas | 88 s | 568 likes, 3 comentarios |
| A14 | Cañones o Mantequilla @canonesomantequilla.podcast (3.274 seguidores) | IG | https://www.instagram.com/reel/Df6_PazJOSm/ | 19-nov-2026 | Anthropic: la mayor salida a bolsa de la historia | 65 s | 1.078 likes, 16 comentarios |
| A15 | No es el fin de la ciencia @noeselfindelaciencia.podcast (1.115 seguidores) | IG | https://www.instagram.com/reel/Df4rr-PCKiW/ | 18-nov-2026 | Cada noche duermes con un pato y no lo sabías (edredón) | 52 s | 934 likes, 6 comentarios |
| A16 | No es el fin de la ciencia @noeselfindelaciencia.podcast | IG | https://www.instagram.com/reel/Df7sR67j0bC/ | 19-nov-2026 | Han desaparecido medio millón de pingüinos; el sospechoso, un volcán | 73 s | 470 likes, 4 comentarios |
| A17 | David Escribano @david12re (Memorias de Pez/Dolly, 1.028 seguidores) | IG | https://www.instagram.com/reel/DaIjiwJMRIk/ | 28-jun-2026 | Sykes-Picot 1916: el acuerdo que dibujó Oriente Medio | 42 s | 1.045 likes, 28 comentarios |
| A18 | David Escribano @david12re | IG | https://www.instagram.com/reel/Daa8EG-Maum/ | 5-jul-2026 | Países que nunca fueron colonizados por Europa | 65 s | 568 likes, 13 comentarios |
| A19 | teleSUR @telesurtv | IG | https://www.instagram.com/reel/DgBRZ5mioHT/ | 21-nov-2026 | FILVEN 2026: fotolibro «Kueka» (Abuela Kueka, pueblo pemón) | 37 s | 10 likes, 0 comentarios |
| A20 | Con Filo @confilo_cuba | IG | https://www.instagram.com/reel/DR-ziigCeLq/ | 7-dic-2025 | Liu Mok: «La ilusión del mercado» (tasa cambiaria, Granma) | 195 s | 15 likes, 4 comentarios |

**Lecturas rápidas de esta tabla:**
- Los podcasts pequeños de El Orden Mundial (A14, A15: 1.078 y 934 likes con
  3.274 y 1.115 seguidores) superan en ratio a la cuenta principal (A13: 568
  likes con 220.940 seguidores). El gancho-pregunta + clip corto funciona
  mejor que la marca grande con edición plana.
- AJ+ rinde de forma muy desigual según el tema: 20.216 likes (denuncia en
  vivo, §2.1) frente a 496 (historia de Tlatelolco, A9) el mismo fin de
  semana. El tema y el protagonista pesan más que la cuenta.
- La Base en 169 s (A10) rinde menos (873 likes) que sus clips de ~52 s
  (1.514, §2.7): en clips de podcast, la duración larga sin edición diluye.
- teleSUR (A19: 10 likes con 850K seguidores) y Con Filo (A20: 15 likes,
  195 s) confirman el patrón institucional: sin gancho, sin voz que articule
  o sin formato vertical, el contenido no sale de la red propia.

---

## 4. Patrones de edición observados (15 videos analizados)

Mediciones propias sobre los 15 videos descargados. Duraciones por ffprobe;
cambios de escena por ffmpeg (umbral 0,4); texto en 0–3 s y voz en 0–3 s por
lectura de fotogramas y transcripción.

### 4.1 El gancho: texto + voz en 0–3 s es la norma, no la excepción

| Video | Texto en 0–3 s | Voz en 0–3 s | Tipo de gancho |
|---|---|---|---|
| aj_oaxaca | Sí (tarjeta + lugar/fecha) | Sí | Denuncia en vivo + contradicción |
| aj_venezuela | Sí (tarjeta + lugar/fecha) | Sí (Trump, inglés) | Cita textual del protagonista |
| aj_awa | Sí (tarjeta) | Sí | Afirmación + pregunta |
| ac_bono | Sí (rótulo) | Sí | Apelación directa por edad |
| ac_gta | Sí (rótulo) | Sí | Frase en primera persona + metraje IA |
| pez_sanchez | **No** | Sí | Persona (acceso exclusivo) |
| base_delcy | Sí (subtítulos) | Sí | Actualidad con fecha + lugar |
| iglesias_ucrania | Sí (karaoke gigante) | Sí | Narración con fecha exacta |
| borrego_flotilla | Sí (subtítulos) | Sí | Acción en presente + misión |
| eom_franco | Sí (tarjeta de pregunta) | Sí (a mitad de frase) | Pregunta contraintuitiva |
| telesur_francia | Sí (rótulo) | **No** (música + «¡Suscríbete!») | Titular de telediario |
| confilo_chavez | Sí (karaoke pequeño) | Sí | Frase de archivo |
| yt_pez_eeuu | Sí (karaoke) | Sí | Pregunta + promesa |
| yt_pez_cuba | Sí (karaoke) | Sí | Lista numerada + gesto |
| yt_hiper_ticket | Sí (subtítulos) | Sí | Pregunta personal + objeto |

- **Texto en 0–3 s: 14/15** (solo pez_sanchez no lo tiene, y lo compensa con
  acceso exclusivo). Coincide con EditorOP: 73/75.
- **Voz en 0–3 s: 14/15** (solo telesur_francia no la tiene — y es el peor
  rendimiento del conjunto). Coincide con EditorOP: 58/75.
- **Longitud de la primera frase hablada:** entre 5 y ~20 palabras; la
  mediana del conjunto ronda las 10–12 palabras. Los ganchos más cortos
  («Tuve unos problemitas en España», 5 palabras; «Las cinco razones por las
  que Cuba ha colapsado», 8) son de los videos con más tracción relativa.
  Las tarjetas de texto en pantalla son más cortas que la voz (6–12 palabras)
  — la tarjeta hace el trabajo de Scrptly (gancho corto) mientras la voz
  puede ser más larga.
- **Fechas en el gancho:** 5/15 la llevan explícita (Oaxaca 18 NOV 26,
  Filipinas 18 NOV 26, «ayer» + Miraflores, «la noche del 2 de noviembre»,
  «Corría el año 1776» en el setup inmediato). Es el patrón de EditorOP
  (13/75) en versión hispana: la fecha ancla y da credibilidad.
- **Preguntas como gancho:** 5/15 (Awá, Franco, Pez EE.UU., Hiperactina
  ticket, y la tarjeta «¿Qué Venezuela es qué?»). Scrptly: +21% para
  preguntas. EditorOP: solo 6/75 abrieron con pregunta en documental
  anglófono. En el conjunto hispano la pregunta es más frecuente — y en los
  5 casos va acompañada de afirmación o promesa inmediata, nunca sola.

### 4.2 Duración

Duraciones de los 15: 19, 33, 34, 44, 52, 52, 64, 68, 77, 78, 82, 94, 96, 109,
148 s. **Mediana: 68 s.** Solo IG (12 videos): mediana 60 s. Rango útil
observado: 19–109 s; los dos peores rendimientos relativos (teleSUR aparte)
son los más largos sin edición (Con Filo 148 s, La Base 169 s en la tabla
adicional). Ningún video del conjunto baja de 10 s (Scrptly: <10 s colapsa).
El rango 45–90 s de EditorOP (mediana TikTok 72 s) se confirma en el conjunto
hispano: 10/15 caen en 44–96 s.

### 4.3 Cadencia de cortes (cambios de escena detectados, umbral 0,4)

| Video | Duración | Cambios | Ritmo aprox. |
|---|---|---|---|
| yt_pez_cuba | 82 s | 52 | ~1 cada 1,6 s |
| confilo_chavez | 148 s | 46 | ~1 cada 3,2 s |
| yt_pez_eeuu | 96 s | 24 | ~1 cada 4,0 s |
| aj_awa | 77 s | 18 | ~1 cada 4,3 s |
| yt_hiper_ticket | 64 s | 16 | ~1 cada 4,0 s |
| pez_sanchez | 109 s | 14 | ~1 cada 7,8 s |
| telesur_francia | 34 s | 10 | ~1 cada 3,4 s |
| ac_gta | 79 s | 6 | ~1 cada 13 s |
| aj_oaxaca | 44 s | 4 | ~1 cada 11 s |
| eom_franco | 52 s | 4 | ~1 cada 13 s |
| ac_bono | 20 s | 2 | plano fijo |
| aj_venezuela | 33 s | 2 | plano fijo |
| base_delcy | 52 s | 2 | plano fijo (split) |
| borrego_flotilla | 68 s | 2 | plano fijo (selfie) |
| iglesias_ucrania | 94 s | 2 | plano fijo |

**Dos regímenes claros, ambos con ganadores:**
1. **Corte rápido (1 cambio cada 1,6–4,3 s):** el modelo Memorias de Pez en
   YouTube (52 y 24 cambios), AJ+ documental (18), Hiperactina (16),
   montajes de noticias (10). La imagen cambia con cada hecho (regla de
   EditorOP).
2. **Plano fijo con karaoke/subtítulos (2–6 cambios):** 8/15 videos. El
   movimiento lo ponen el texto (karaoke palabra por palabra, tarjetas) y la
   voz, no el plano. Incluye al mayor éxito absoluto (Borrego, 95K likes, una
   sola toma selfie) y al mayor éxito de AJ+ (Oaxaca, toma fija del acto).
   **Conclusión: el corte rápido no es obligatorio; lo obligatorio es que
   algo cambie cada pocos segundos — plano, texto o idea.** El plano fijo
   sin texto ni voz (teleSUR) es lo que no funciona.

### 4.4 Subtítulos y karaoke

- **Subtítulos/karaoke presentes: 15/15.** Sin excepción.
- **Karaoke palabra por palabra (o por grupos de 1–3 palabras):** 7/15
  (Iglesias — palabra única gigante; Pez EE.UU. y Pez Cuba — highlight
  amarillo; Hiperactina; Con Filo — pequeño; La Base/Delcy — subtítulos
  clásicos; Borrego — subtítulos clásicos). EditorOP: 33/75.
- **Tarjeta de título (texto guía fijo):** AJ+ (tarjeta amarilla en los 3),
  EOM Franco (tarjeta roja), teleSUR (rótulo azul/blanco), Ac2ality (rótulo
  blanco). Es el equivalente hispano del «guiding text» de EditorOP (26/75).
- **Palabra clave destacada en color:** Pez (amarillo), Memorial (rojo, dato
  propio). El patrón es el mismo: una palabra por frase lleva el color de
  marca.
- **El karaoke gigante de palabra única** (Iglesias) es el extremo: legible
  en silencio a 2 metros, pero fatiga en 94 s. El híbrido 2–4 palabras del
  Memorial (decisión ya tomada el 19-nov) sigue siendo el punto medio
  sensato para tono serio.

### 4.5 Presentador a cámara vs. solo voz

- **Presentador a cámara: 9/15** (Bono, Sánchez-Pez, Delcy, Iglesias,
  Borrego, Franco, Pez EE.UU., Pez Cuba, Hiperactina). **Solo voz / metraje:
  4/15** (Awá, GTA, Oaxaca — voz en vivo del acto, Venezuela — voz de Trump).
  **Sin voz: 1/15** (teleSUR). **Archivo: 1/15** (Con Filo — Chávez).
- En este conjunto hispano el presentador domina más que en la muestra de
  EditorOP (24/75 con cara). Pero los dos mayores éxitos por ratio son un
  selfie (Borrego) y un acto en vivo sin presentador profesional (Oaxaca):
  **lo que multiplica es el testigo, no el presentador en abstracto.** En el
  Memorial, las presentadoras a cámara son el multiplicador probado (dato
  propio); el equivalente «testigo» es el archivo real de la persona hablando.

### 4.6 Música

- **Música bajo la voz: minoría visible** en este conjunto (GTA — pop;
  teleSUR — música sin voz; Hiperactina — cama ligera). La mayoría de los
  videos de denuncia/análisis van **solo con voz** (Iglesias, Borrego,
  Oaxaca, Delcy, Pez) o con audio en vivo. EditorOP: 58/75 con música bajo
  la voz — en el conjunto hispano de denuncia la proporción es menor. La
  regla «música baja y que se retire en la frase de pago» (EditorOP) no se
  pudo medir aquí; se mantiene como juicio editorial, no como dato.

### 4.7 Pantalla dividida y formatos

- **Pantalla dividida: 3/15** (Bono, Delcy, GTA). En los tres, una mitad es
  el presentador o el metraje principal y la otra el contexto (foto fija,
  archivo, primer plano). Es el build de @psychopoly_official y
  @matt_forrest (EditorOP: 5,2M y 3,1M vistas).
- **Cuadrado 1080×1080: 1/15** (Pez Sánchez) — rinde por el acceso, no por el
  formato. **Horizontal pillarbox: 1/15** (Con Filo) — no rinde. **Vertical
  1080×1920: 13/15.**

### 4.8 Cierres observados

- **Pregunta al espectador:** Oaxaca («¿Tú qué opinas?»).
- **Llamada a la acción:** Oaxaca (no comprar/no consumir/no callar),
  Hiperactina (pide el ticket digital), Bono (votar el 29N).
- **Frase de cierre valorativa:** Delcy («el desguase pieza a pieza»),
  Borrego («si los gobiernos tienen miedo, nosotros no»), Iglesias («el Club
  de Amigos Progres de la OTAN»), Con Filo («hasta las últimas
  consecuencias»).
- **«Toda la información en la descripción»:** Pez EE.UU. y Pez Cuba (los dos
  Shorts de YouTube). En Instagram ese cierre no aparece: allí el cierre es
  pregunta o frase.
- **Promo del contenido largo:** Pez Sánchez (entrevista completa el domingo).
- Ninguno de los 15 cierra con «sígueme» o «dale like» hablado. La CTA es
  contenido (opinar, actuar, ver el largo), no crecimiento.

---

## 5. Mapa de cuentas homólogas: utilidad para el Memorial

| Cuenta | Seguidores (IG) | Utilidad principal | Estado |
|---|---|---|---|
| **AJ+ Español** @ajplusespanol | 845.664 | **La más útil.** Formato «tarjeta amarilla + lugar/fecha + voz» replicable tal cual; denuncia con archivo y contexto; 3 fichas completas. | Activa, 3–5 reels/día |
| **Memorias de Pez** @memoriasdepez | 79.530 (IG) | **La más útil en YouTube.** Presentador + evidencia, karaoke con highlight, corte rápido (52 cambios/82 s); el Short sobre Cuba es referencia directa de nicho. | Activa; IG secundario, YT principal |
| **La Hiperactina** @lahiperactina | 600.341 | **La más útil en formato.** Pregunta personal + objeto + dato + acción; el formato más replicable para denuncia con objeto físico. 272K vistas en YT. | Activa |
| **Ac2ality** @ac2ality | 530.307 | Noticia en 1 minuto; rótulo + protagonista a cámara; red de cuentas hermanas (r3vista, dep0rtess) con gran alcance. | Activa, varios reels/día |
| **La Base** @labase_tv / Pablo Iglesias @iglesiasturrionpablo | 211.027 / 528.993 | Clip de podcast político con karaoke gigante; denuncia con fecha exacta; la cuenta personal rinde más que la del programa. | Activa |
| **El Orden Mundial** @elordenmundial + podcasts | 220.940 (+3.274 / +1.115) | Gancho-pregunta + debate; los podcasts pequeños superan en ratio a la cuenta principal. La historia (Franco/Islero) es el tema más cercano al Memorial. | Activa |
| **Rafa Borrego** @rafaborregop | 129.493 | El testimonio en primera persona desde el lugar: 95K likes con una sola toma selfie. Referencia de techo, no de formato diario. | Activa |
| **teleSUR** @telesurtv | 850.465 | **Referencia negativa.** 8–252 likes con 850K seguidores: institucional sin gancho, sin voz, sin subtítulos. Lo que NO hay que hacer. | Activa, muchos reels/día |
| **Con Filo** @confilo_cuba | 1.848 | **Referencia negativa de formato** (horizontal, 145–197 s, texto ilegible) con material de archivo excelente. Lo que NO hay que hacer con buen material. | Poco activa en IG (último reel dic-2025) |
| **DW Documental** @dwdocumentales | — | No documentada (ver §6). | — |
| **RT en Español** | — | No localizada en Instagram (ver §6). | — |
| **VisualPolitik** | — | Shorts recientes = anuncios de máster; IG no localizado (ver §6). | — |

**Las 3–5 cuentas más útiles para el Memorial:** AJ+ Español (formato de
denuncia replicable), Memorias de Pez (presentador + evidencia + corte rápido,
y nicho Cuba), La Hiperactina (formato pregunta + objeto + acción),
La Base / Pablo Iglesias (denuncia con fecha + karaoke) y El Orden Mundial /
«No es el fin de la ciencia» (gancho-pregunta de historia con cuentas pequeñas).

---

## 6. Qué NO se pudo verificar

- **RT en Español en Instagram:** la búsqueda de cuentas no devolvió la cuenta
  oficial y `posts --username actualidadrt` devolvió 0 resultados. No se pudo
  documentar ningún reel suyo. Pendiente: localizar su handle real o su
  presencia en TikTok/YouTube.
- **DW Documental (@dwdocumentales):** la cuenta existe en Instagram, pero
  `posts` devolvió 0 resultados. No se pudo documentar ningún reel suyo.
  Pendiente: revisar su YouTube (DW Documental en español) en la próxima
  actualización.
- **VisualPolitik:** sus 6 Shorts más recientes (10–17 nov-2026) son todos
  anuncios de su «Máster en IA y optimización de procesos productivos»
  (12.455–86.707 vistas), no contenido documental. En Instagram, el handle
  @visualpolitik resolvió a una cuenta sin relación (35 seguidores, Estonia);
  la búsqueda devolvió @visualpolitik_innovamun y @jvisualpolitik sin
  confirmación de cuál es la oficial. No se documentó ningún ejemplo suyo.
- **«Nota»:** mencionada en el encargo como cuenta a buscar; no se identificó
  a qué medio/cuenta se refiere (hay varios «Nota» en el mundo hispano).
  Pendiente de aclaración.
- **Vistas en Instagram:** no visibles por post en la vía usada (ver §0).
- **Curvas de retención:** ningún estudio consultado las publica (Scrptly lo
  advierte explícitamente). Todo lo aquí afirmado sobre «retención» es
  inferencia desde vistas/likes y desde los patrones comunes de los ganadores,
  no medición directa del segundo en que la gente abandona.
- **El archivo v3 no estaba en la ruta indicada** (`repo/projects/marti-fidel/
  research/social-trends-v3-2026-11-19.md` no existe); se leyó en
  `~/workspace/remotion-hub/projects/marti-fidel/research/` (fuera del repo).
  Las cifras del estudio EditorOP se re-verificaron contra el artículo
  original el 21-nov-2026, así que la §1 no depende de esa ruta.

---

## 7. Fuentes

| Fuente | Fecha | Qué aporta |
|---|---|---|
| EditorOP, «How to Make Documentary-Style Reels» (https://editorop.com/blog/documentary-style-reels) | Datos 25-oct-2026; releído 21-nov-2026 | 75 reels breakout (vidIQ outlier search), medianas, builds, aperturas, reglas de edición, zona segura, sourcing. **Fuente principal.** |
| Scrptly, «The Reel Hook Study: 4,385 Reels analysed» (https://scrptly.io/learn/reel-hook-study) | Publicado 8-nov-2026; leído 21-nov-2026 | Ganchos cortos 3,1x; <10 s colapsa; dígitos −29%; preguntas +21%. |
| Estudio previo del 19-nov-2026 (`social-trends-v3-2026-11-19.md`, fuera del repo) | 19-nov-2026 | Hallazgos EditorOP ya extraídos; Revid; Rangel; Hook Studio; RE/UGC; BoostMaus; señal negativa del nicho cubano; anime político IA. |
| instagram-cli (`posts`, `media-understanding`, `account-search`) | Lecturas 21-nov-2026 | Métricas (likes/comentarios), fechas, duraciones y resúmenes de contenido de los reels de IG. Sin vistas por post. |
| yt-dlp (metadatos + descarga) | 21-nov-2026 | Vistas públicas de Shorts de YouTube; descarga de los 15 videos analizados. |
| faster-whisper-small (local) + ffmpeg | 21-nov-2026 | Transcripciones propias de los 15 videos; conteo de cambios de escena; fotogramas 0,5/1,5/3,0 s. |
| MEMORY.md (sección del Memorial) | Vigente a 21-nov-2026 | Receta viral propia (14K/9,1K reacciones; 115K/119K vistas), reglas de identidad, prohibiciones de IA. |
| Zella, «Mejores ganchos para videos cortos» (https://zellahq.com/es/blog/best-hooks-for-short-form-video/) | Actualizado ~12-nov-2026 | 10 fórmulas de gancho; ~71% decide en los primeros segundos (cifra de terceros, no de plataformas). Señal direccional. |
| Viralkey, «Ganchos virales para Instagram Reels (2026)» (https://viralkey.ai/es/blog/viral-hooks-for-instagram-reels-2026) | Actualizado ~17-nov-2026 | Fallos del primer fotograma (intro «hola chicos», plano estático, subtítulo desconectado). Señal direccional. |
| ShortGenius, «10 tendencias de vídeo en formato corto 2026» (https://shortgenius.com/es/blog/tendencias-video-formato-corto-2026) | ~20-sep-2026 | Vídeo sin rostro, ingeniería de ganchos, benchmark Kapwing (~30% de videos cortos superan 81% de visualización media). Señal direccional. |
| EditorOP, «How to Go Viral on Instagram Reels (2026)» (https://editorop.com/blog/how-to-go-viral-on-instagram-reels) | Datos oct-2026 | 117 reels breakout: mediana 1,5M vistas, 23,4x; 96% con texto en pantalla; primera línea mediana 7 palabras; 95% hechos en un día o menos. |

---

*Investigación del 21-nov-2026. Próxima actualización: con vidIQ (créditos desde
el 2-dic-2026) para outliers en español + revisión de RT en Español, DW
Documental y VisualPolitik. Ver `preprod/FORMATOS.md` para la síntesis viva.*
