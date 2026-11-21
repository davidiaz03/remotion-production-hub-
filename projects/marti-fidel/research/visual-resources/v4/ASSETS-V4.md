# Recursos visuales — proyecto marti-fidel (V4/V5/V6)

Inventario de fotos reales con licencia verificada para el reel
«Martí-Fidel: leer, pensar». Cada entrada indica fuente, autor, licencia
exacta y por qué sirve para su escena. Regla permanente del proyecto:
**prohibido usar IA para retratos/fotos de Martí, Fidel o Browne o
«archivo» sintético presentado como real**; los recortes con rembg (MIT)
sobre foto real están permitidos.

> Nota: este archivo se creó el 20-nov-2026 para la V6; no existía un
> ASSETS-V4.md previo en el repo. Las secciones V4/V5 quedan pendientes
> de documentar aquí si el coordinador lo pide; lo de V6 está completo.

Convención de rutas (relativas a `projects/marti-fidel/`):
- Original descargado: `research/visual-resources/v4/<nombre>`
- Copia de trabajo: `public/img/v4/ai/<nombre>` (árboles) o
  `public/img/v4/<nombre>` (Fidel).

---

## V6 (20-nov-2026) — cambios pedidos por Suleris tras ver el máster V5

### TAREA 1 — Árboles para S5 (reemplazan las palmas)

La voz dice «¡los árboles se han de poner en fila…!» y en V5 se veían
palmas. Tres árboles reales individuales, cada uno apto para recorte
con rembg (isnet): árbol entero contra cielo/fondo limpio, sin otros
objetos tocando la copa. El recorte lo hace el trabajador de
composición; aquí solo van los originales.

**Nota de encuadre para el trabajador de composición:** los árboles
reales son mucho MÁS ANCHOS que las palmas (aspecto ancho/alto del
árbol recortado ≈ 1,2–1,5 frente a 0,60–0,71 de `palma-s5-*`). Con
`height={660}` y `TREE_CX` separados 140 px, la fila quedará mucho más
densa (casi un muro de follaje). Valorar bajar la altura por variante
o abrir la separación; los aspectos de abajo son aproximados (medidos
a ojo sobre la previsualización) — medir el aspecto real tras el
recorte con rembg y actualizar `PALM_VARIANTS_S5` (o su equivalente).

#### arbol-s5-a.jpg — PRIMARIA (la frondosa, tipo ceiba)

- **Archivo:** `research/visual-resources/v4/arbol-s5-a.jpg`
  (copia de trabajo: `public/img/v4/ai/arbol-s5-a.jpg`)
- **Dimensiones:** 4802 × 3201 px · **Tamaño:** 3.094.418 bytes
- **Fuente (página):** https://www.pexels.com/photo/30082053/
  («Solitary Tree Under Blue Sky Landscape»)
- **Autor:** Bob Jenkin (cámara Fujifilm X100F; tomada 13-jun-2020;
  publicada 4-ene-2025). El autor pide crédito en su bio de Pexels
  («Please credit me if you use them») — es un ruego, no una
  condición de la licencia; si hay créditos, incluirlo.
- **Licencia:** Licencia Pexels (uso libre, comercial incluido, sin
  atribución obligatoria; «License: Free» en la página).
- **Contenido:** árbol de copa redonda y densa, tronco recto, solo en
  un campo verde bajo cielo azul intenso con nubes blancas. La copa es
  la más «ceiba» de las tres: ancha, redondeada y frondosa.
- **Por qué sirve para S5:** contraste máximo follaje verde oscuro /
  cielo azul y nubes blancas → máscara rembg limpia; el árbol ocupa
  el centro del encuadre con la base en la línea del horizonte (el
  tronco toca hierba, sin objetos pegados). Aspecto del árbol
  recortado ≈ 1,25. El árbol en sí mide ≈ 1680 × 1320 px dentro del
  original: sobra resolución para 660 px de alto en el render.

#### arbol-s5-b.jpg — PRIMARIA (tronco nudoso, luz cálida)

- **Archivo:** `research/visual-resources/v4/arbol-s5-b.jpg`
  (copia de trabajo: `public/img/v4/ai/arbol-s5-b.jpg`)
- **Dimensiones:** 3456 × 5184 px (vertical 2:3) · **Tamaño:**
  1.120.342 bytes
- **Fuente (página):** https://www.pexels.com/photo/6756837/
  («Green Tree on Brown Grass Field»)
- **Autor:** Ana vê Ana Fotografa (Lagarto, Sergipe, Brasil; Canon
  EOS Rebel T5; tomada 20-oct-2020; publicada 8-feb-2021).
- **Licencia:** Licencia Pexels («License: Free» en la página).
- **Contenido:** árbol grande de tronco grueso y nudoso, copa ancha y
  densa, en campo dorado bajo cielo azul pálido con nubes sueltas.
  Foto vertical: el árbol llena el encuadre.
- **Por qué sirve para S5:** silueta distinta a la (a) — tronco viejo
  y retorcido, copa más irregular; la luz dorada encaja con el mundo
  Archivo (papel). El fondo es cielo limpio en los 2/3 superiores; la
  base del tronco queda tras hierba alta desenfocada — recortar la
  base a la altura de la hierba (el corte queda sobre la línea de
  suelo de la escena, no se nota). Aspecto del árbol recortado
  ≈ 1,20. El árbol en sí mide ≈ 2440 × 2030 px.

#### arbol-s5-c.jpg — PRIMARIA (tronco doble en Y)

- **Archivo:** `research/visual-resources/v4/arbol-s5-c.jpg`
  (copia de trabajo: `public/img/v4/ai/arbol-s5-c.jpg`)
- **Dimensiones:** 3762 × 4702 px (vertical) · **Tamaño:** 3.252.874
  bytes
- **Fuente (página):**
  https://www.pexels.com/photo/tree-on-a-grassy-field-10761002/
  («Tree on a Grassy field»)
- **Autor:** Ata Ebem, fotógrafo y arquitecto de Estambul
  («jpg_ata»; Canon EOS 200D; tomada 20-jun-2020 en Tekirdağ,
  Turquía; publicada 5-ene-2022).
- **Licencia:** Licencia Pexels («License: Free» en la página).
- **Contenido:** árbol de doble tronco en forma de Y, copa abierta
  con ramas visibles, en campo de trigo dorado bajo cielo pálido
  limpio. Foto vertical.
- **Por qué sirve para S5:** la silueta más distinta de las tres —
  el tronco en Y se reconoce al instante y rompe la monotonía de la
  fila; la copa abierta deja ver el cielo entre ramas (rembg isnet
  conserva las ramas finas; si alguna rama fina se pierde, no afecta
  al conjunto porque la copa es ancha). Base del tronco visible
  sobre el trigo, sin objetos pegados. Aspecto del árbol recortado
  ≈ 1,20. El árbol en sí mide ≈ 3440 × 2870 px.

#### arbol-s5-alt.jpg — ALTERNATIVA (copa muy ancha, campo seco)

- **Archivo:** `research/visual-resources/v4/arbol-s5-alt.jpg`
  (copia de trabajo: `public/img/v4/ai/arbol-s5-alt.jpg`)
- **Dimensiones:** 6240 × 4160 px · **Tamaño:** 3.483.406 bytes
- **Fuente (página):**
  https://www.pexels.com/photo/lone-tree-in-a-sunny-field-landscape-30358021/
  («Lone Tree in a Sunny Field Landscape»)
- **Autor:** Meriç Tuna (publicada 22-ene-2025).
- **Licencia:** Licencia Pexels («License: Free» en la página).
- **Contenido:** árbol de copa muy ancha y densa, tronco corto y
  bifurcado, en campo seco dorado bajo cielo pálido.
- **Por qué sirve / por qué es alternativa:** copa densa ideal para
  rembg y máxima resolución de las cuatro, pero es la MÁS ANCHA
  (aspecto del árbol recortado ≈ 1,55) y el tronco es corto: en la
  fila de S5 dominaría demasiado. Útil si alguna primaria falla en
  el recorte o si el trabajador quiere una cuarta variante para el
  fondo (`PalmBackdropRow`).

#### Hilera de árboles («en fila») — buscada, NO descargada

Se buscó una foto fuerte de hilera lateral de árboles como
alternativa a la vía uno-a-uno. Solo se encontró una candidata
lateral: hilera de chopos desnudos en una colina verde con una
masía blanca a la izquierda (Pixabay, foto 8458466, «trees»,
19-dic-2023, licencia Pixabay). Descartada: árboles SIN hojas
(invierno, contradicen la imagen de árboles vivos que «se ponen en
fila») y la casa obliga a un recorte que deja solo chopos pelados.
El resto de resultados eran avenidas en perspectiva (igual que
ocurrió con las palmas en V4: sin fila lateral con licencia libre).
La vía uno-a-uno (tres árboles recortados) sigue siendo la
principal; la hilera queda como idea no resuelta, no como asset.

#### Árboles revisados y descartados

- **Pexels 32279327** («Lone tree against a clear blue sky in
  Taiwan»): tronco cortado por el borde inferior del encuadre y copa
  rala; más débil que (c) para el hueco «aireado».
- **Pexels 27913842** («A lone tree on a hill with a blue sky»,
  Mehmet Ali, 3456 × 4608, Licencia Pexels,
  https://www.pexels.com/photo/27913842/): árbol correcto pero
  pequeño en el encuadre y con una ruina/techo y un arbusto en la
  misma colina (recortables, pero (a) cubre el mismo hueco sin
  distracciones). Documentada aquí por si hace falta una quinta.
- **Wikimedia Commons, 6 candidatas revisadas** («Haltern am See,
  Westruper Heide, Solitärbaum 2025», «Tunku Sabah Kapok-Tree-01»,
  «Neudenau Birnbaum», «A solitary tree at Parham Park»,
  «Dülmen Wildpark 3427», «Junger Kapokbaum»): ninguna supera a las
  de Pexels para recorte — copas caladas con otros árboles detrás,
  árbol diminuto en el encuadre, carretera/caseta/señal pegadas, o
  primer plano de vainas (kapok) sin árbol entero. La ceiba entera
  contra cielo limpio no apareció en Commons.

---

### TAREA 2 — Foto de Fidel para S7 (reemplaza La Habana 2003)

La foto actual (`fidel-la-habana-2003-crop.jpg`, 404 × 1310) está
bonita pero Fidel mira HACIA ABAJO. La sustituta debe mirarlo AL
FRENTE o HACIA ARRIBA, con el rostro visible en un encuadre
vertical equivalente (S7 usa `objectFit: cover` a 1080 × 1920 con
el rostro en la zona superior; chip de lugar/fecha + tarjeta de la
cita en la mitad inferior).

#### fidel-onu-1979-crop.jpg — PRIMARIA

- **Archivo:** `research/visual-resources/v4/fidel-onu-1979-crop.jpg`
  (copia de trabajo: `public/img/v4/fidel-onu-1979-crop.jpg`)
- **Dimensiones:** 1434 × 1803 px (vertical) · **Tamaño:** 368.255
  bytes
- **Fuente (página del archivo en Commons):**
  https://commons.wikimedia.org/wiki/File:Fidel_Castro,_Prime_Minister_of_Cuba._Castro_at_the_United_Nations,_New_York._(cropped).jpg
- **Autor:** Bernard Gotfryd (1924–2016), fotógrafo
  polaco-estadounidense. Fuente: Biblioteca del Congreso de EE. UU.,
  división de Grabados y Fotografías, ID digital **gtfy.00954**.
- **Licencia:** **Dominio público** — plantilla `{{PD-Gotfryd}}` en
  la página del archivo (las fotografías de Gotfryd en la Library of
  Congress son de dominio público). Sin obligación de atribución
  (recomendable citar «Bernard Gotfryd / Library of Congress» en
  créditos si hay).
- **Fecha y lugar:** **12 de octubre de 1979, sede de las Naciones
  Unidas, Nueva York** (día de su discurso ante la Asamblea General
  como presidente del Movimiento de Países No Alineados).
- **Verificación de identidad (explícita):** la descripción de la
  página de Commons dice, en inglés y español: «Fidel Castro, Prime
  Minister of Cuba. Castro at Headquarters of the United Nations,
  New York» / «Fidel Castro, Primer Ministro de Cuba. Castro en la
  sede de las Naciones Unidas, Nueva York». Fecha 1979-10-12, fuente
  Library of Congress (ID gtfy.00954), autor Bernard Gotfryd.
  Además: el archivo es un recorte («extracted from») del original
  sin recortar de 4921 × 3332 del mismo autor y fecha, y la foto se
  usa en Wikipedia (en: «History of Cuba (1959–present)»,
  «Cultural Marxism conspiracy theory»; hy: «Ֆիդել Կաստրո»). No hay
  ambigüedad de homónimo: es el Fidel Castro, Primer Ministro de
  Cuba, en la ONU en 1979.
- **Contenido y mirada:** plano medio vertical, Fidel en uniforme
  verde oliva con charreteras (bandera cubana y laurel), a media
  frase (boca abierta), **mirada AL FRENTE, directamente a cámara,
  ligeramente hacia arriba**, mano derecha señalando al espectador.
  Fondo negro limpio. El rostro ocupa el centro-superior (ojos a
  ≈ y 30%).
- **Por qué sirve para S7:** es el encuadre que pide la escena —
  vertical, rostro grande y al frente, gesto de advertencia («FIDEL
  ADVIRTIÓ:») con el dedo señalando, fondo oscuro que se funde con
  el tratamiento navy/papel de S7. En `cover` 1080 × 1920 la escala
  es ×1,065 (1434 → 1527 de ancho mostrado; se recortan los lados,
  el rostro queda intacto). **El trabajador de composición debe
  cambiar el chip de «LA HABANA / 2003» a «NUEVA YORK / 1979»** y
  ajustar `objectPosition` (≈ 50% 10–15%; la actual es 42% 8% para
  el recorte 2003). Resonancia temática: Fidel en la ONU en 1979
  dialoga con la votación de la ONU de S1/S2.

#### fidel-la-habana-2014.jpg — ALTERNATIVA

- **Archivo:** `research/visual-resources/v4/fidel-la-habana-2014.jpg`
  (copia de trabajo: `public/img/v4/fidel-la-habana-2014.jpg`)
- **Dimensiones del archivo guardado:** 1920 × 1213 px ·
  **Tamaño:** 282.922 bytes. **OJO:** es la miniatura de 1920 px
  servida por Commons (`Special:FilePath…?width=1600`, redondeada a
  1920 por el servidor); el original en Commons es de **2035 ×
  1286 px (1,23 MB)**. El endpoint de alta resolución se quedó
  colgado desde esta VM (dos intentos, 0 bytes); si el 6% extra de
  resolución importa, re-descargar el original desde la página del
  archivo. Para un render a 1080 de ancho, 1920 px sobra.
- **Fuente (página del archivo en Commons):**
  https://commons.wikimedia.org/wiki/File:Fidel_Castro_in_2014.jpg
- **Autor:** Presidential Press and Information Office (Kremlin).
  Fuente: http://www.kremlin.ru/events/president/news/46198/photos/37377
  (visita de Putin a La Habana).
- **Licencia:** **CC BY 4.0** — uso libre con **atribución
  obligatoria** (si se usa esta foto, acreditar «Presidential Press
  and Information Office / kremlin.ru, CC BY 4.0» en créditos o
  descripción; no sugerir respaldo del licenciante).
- **Fecha y lugar:** **11 de julio de 2014, La Habana**
  (descripción de Commons: «Fidel Castro (Havana, 11.07.2014)»).
- **Verificación de identidad:** foto oficial del Kremlin de la
  reunión Putin–Fidel en La Habana, 11-jul-2014; la descripción de
  Commons y la fuente kremlin.ru la identifican como Fidel Castro.
- **Contenido y mirada:** primer plano apaisado, Fidel anciano con
  chándal blanco Adidas y camisa de cuadros rojos, **mirada AL
  FRENTE a cámara**, dedo índice levantado, a media frase. Rostro
  grande, centrado a la izquierda.
- **Por qué es alternativa y no primaria:** la mirada cumple, pero
  el chándal blanco + camisa de cuadros es visualmente más ruidoso
  que el uniforme y choca con la paleta navy/papel de S7; además es
  apaisada (el recorte vertical para `cover` 1080 × 1920 tomaría
  ≈ 680 px de ancho del original, con `objectPosition` ≈ 35% para
  centrar el rostro). Válida si la dirección prefiere un Fidel
  anciano y cercano en el tiempo a la cita de 2005.

#### Candidatas de Fidel revisadas y descartadas (8 en total)

1. **MATS Terminal Washington 1959** (4300 × 4792, PD-USGov):
   Fidel ante los micrófonos a su llegada a Washington (abr-1959),
   pero mira hacia abajo y a un lado. Descartada por la mirada.
2. **Fidel Castro in Washington.jpg** (1454 × 1939): mismo momento
   que (1), mismo problema.
3. **Fidel Castro, Havana, 1978** (5549 × 3640): perfil hablando al
   micrófono, mirada de lado. Descartada (no es al frente/arriba).
4. **Fidel Castro 1972 (SOA Prague)** (3762 × 2584): en un podio
   con otras personas, mirando hacia abajo a la derecha; Fidel
   pequeño en el encuadre. Descartada.
5. **Fidel Castro and Christian Herter** (5173 × 3474, PD-USGov):
   Fidel sonriendo mirando a Herter (de lado); foto de dos personas.
   Descartada.
6. **Fidel Castro12.jpeg** (2271 × 1654): Fidel con Lula, tocándose
   la nariz, mirada hacia abajo. Descartada.
7. **Fidel Castro9729.jpeg** (1311 × 1967, de la categoría
   principal): revisada en lista; sin descripción clara de evento en
   el título y con dos candidatas mejores ya verificadas, no se
   priorizó su descarga.
8. **Fidel Castro 1950s.jpg** (692 × 1024): retrato joven, pero
   resolución baja para `cover` 1080 × 1920 (se vería blando) y sin
   evento documentado en el título; no se priorizó.

Nota: la foto **fidel-onu-1960.jpg** que ya está en `public/img/`
muestra a Fidel mirando hacia arriba a la izquierda, pero es un
plano de grupo en B/N (ONU, 1960) donde Fidel no está solo; se
descartó como sustituta porque la V6 pedía otra foto y la de 1979
es superior en encuadre (vertical, solo, fondo limpio, color).
