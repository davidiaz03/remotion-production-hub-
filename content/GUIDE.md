# Guía de decisión — qué herramienta usar según el producto

La misma idea que la guía de video (`scripts/editing/README.md`): cada
producto tiene una ruta principal y el resto son apoyo. La regla de oro:
**la identidad y los datos exactos mandan en código; la editabilidad
manda en Canva; la imagen protagonista manda en generación**.

## Matriz

| Producto | Ruta principal | Apoyo | Por qué |
|---|---|---|---|
| Post con datos o cita exacta | Plantilla de código (`post`) | Imagen generada o foto real | El texto debe ser exacto al carácter; el código lo garantiza |
| Carrusel informativo | Plantilla de código (`carousel`) | Iconos Lucide, fotos | Numeración, consistencia entre láminas y datos exactos |
| Infografía con cifras | Plantilla de código (`infographic`) | — | Cifras y fuente al pie, sin riesgo de que la IA las cambie |
| Story de anuncio | Plantilla de código (`story`) | Imagen generada/foto | Rápida, con identidad estricta |
| Miniatura de reel | Plantilla de código (`thumbnail`) | Foto del reel, recorte rembg | Titular gigante legible en el feed; la cara/objeto recortado encima |
| Tarjeta de cita | Plantilla de código (`quote`) | — | La cita debe ser textual; nunca dejar que una IA la reescriba |
| Última hora / reacción a una noticia | Plantilla de código (`breaking`) | Foto real (`image`, fondo o banda) | Banda roja + titular + fecha/fuente; la foto va de fondo con velo o en banda bajo la roja (v3) |
| Un solo dato o cifra | Plantilla de código (`stat`) | Foto real (`image`) | Una cifra protagonista gigante; la infografía es para 2–4 cifras; la foto va de fondo con velo plano (v3) |
| Portada 16:9 (Facebook/YouTube) | Plantilla de código (`cover`) | Foto real (`image`) | Único formato apaisado del hub; contenido clave centrado; la foto va de fondo con degradado horizontal (v3) |
| Línea de tiempo (3–4 hechos) | Plantilla de código (`timeline`) | Foto real por hecho (`image`) | Año en rojo + hecho + fuente; para la memoria histórica del museo; cada hecho admite miniatura (v3) |
| Carrusel desde un texto | **Constructor** (`build-carousel.mjs`) | — | Titular + viñetas/Markdown → pieza completa con densidad validada |
| Post que el usuario quiere retocar en el teléfono | **Canva** (`create-design`) | — | La editabilidad manda sobre el control |
| Presentación / deck | **Canva** (`create-design` con `outline`) | — | El código no compite en decks multipágina editables |
| Pieza para imprimir (cartel, volante) | **Canva** + revisión en el editor | Plantilla de código si es solo texto | Canva exporta PDF de imprenta; el código no gestiona sangrías ni CMYK |
| Imagen protagonista o estilo exacto | **Gemini Pro** (cuenta del usuario) | Pollinations si basta una ilustración | Gemini Pro da más control de estilo; Pollinations es la ruta automática |
| Ilustración decorativa / fondo | **Pollinations** (`scripts/gen-image.py`) | Duotono de marca | Rápida, sin marca, reproducible con seed fija |
| Foto de archivo real | **Foto real** (Drive / archivo del Memorial) | Duotono o recorte | Nunca generar una foto que se presente como archivo real |

## v3 — foto protagonista y gráficos (21-nov-2026)

El usuario vio las 5 piezas v2 y las consideró «muy básicas»: casi solo
tipografía sobre negro. La v3 hace la foto protagonista de primera clase
en las 5 plantillas (rama `work/content-hub-v3-2026-11-21`):

- **Carrusel**: portada con foto (`cover_image` a nivel de pieza, con
  velo fuerte) y gráfico de barras por lámina (`bars`: `[{label, value,
  pct, highlight?}]`, escala honesta calculada en `data.json` — p. ej. %
  de los 193 Estados miembros — y la barra destacada en rojo). La lámina
  con gráfico se centra verticalmente (`with-bars`). En 4:5, la banda
  mide 680 px (la foto ocupa medio lienzo) y el texto de fondo arranca
  en y=780.
- **Breaking / stat / cover**: campo `image` de fondo con velo
  (gradiente en breaking, plano 0.82 en stat, horizontal en cover).
  Breaking admite además `image_layout: "band"` (foto en banda bajo la
  roja, texto debajo sin solaparse) para retratos que no caben como
  fondo; la banda exige copy corto (titular ≤2 líneas, cuerpo ≤2
  líneas) y con retrato ajustado se prefiere el formato 4:5 (banda de
  480 px, cabe la cara entera).
- **Timeline**: cada hecho admite `image` (miniatura 260×150 a la
  derecha del texto); los hechos sin foto conservan el marcador rojo.
- **`face_check: false`** por lámina omite el chequeo de caras (solo
  para planos generales sin retrato, p. ej. un tablero con público de
  fondo: el detector caza caras diminutas y el QA falla en falso). La
  revisión visual del PNG sigue siendo obligatoria.
- **La pieza de Browne perdió la etiqueta «última hora»**: la confesión
  es del 9-nov-2026, hace 12 días; el sello es «LA CONFESIÓN» y el slug
  pasó de `ultima-hora-browne` a `confesion-browne`. No resucitar la
  etiqueta: una «última hora» de hace 12 días no es última hora.
- **Lección CSS (bug latente de la v2)**: `format-45`, `with-photo`,
  `layout-band` y `layout-side` van en el MISMO elemento (el div
  `.page`); los selectores 4:5 deben ser compuestos
  (`.format-45.layout-band .photo`), sin combinador descendiente. Con
  espacio (`.format-45 .layout-band .photo`) la regla no casa nunca y
  la variante 4:5 hereda los valores cuadrados — la suite lo comprueba
  (test «selectores 4:5 compuestos»).

## v4 — imagen integrada y pulido de redacción (21-nov-2026)

El usuario vio la v3 («Mejora, no publiques es probar el ecosistema»):
va por buen camino, sigue iterando en fase de pruebas. La v4 empuja la
calidad hacia tarjetas de redacción profesional (rama
`work/content-hub-v4-2026-11-21`):

- **Timeline**: los 4 hechos llevan foto (1974 Embajada de Cuba en Lima
  y 1980 exterior de la sede ONU, ambas de Commons con licencia
  verificada). Miniatura de 300×180 (v3: 260×150), centrada
  verticalmente en su hecho, con marco fino y filete rojo al pie.
  Tipografía reequilibrada (año 54, título 34, texto 25 px) para que
  cada texto quepa en 3 líneas a 545 px; los textos largos hay que
  recortarlos en `data.json`, no forzar el CSS. Nuevo `image_fit:
  "contain"` por hecho: la foto entera sin recortar los laterales
  (para fotos muy apaisadas cuyo contenido está en los bordes, p. ej.
  los tableros de la votación ONU); las bandas negras se funden con el
  fondo. Nuevo `image_position` por hecho.
- **Stat**: nuevo `veil: "vignette"` (el plano 0.82 sigue siendo el
  valor por defecto): la foto respira en los bordes y el centro queda
  oscuro para la cifra y el texto — degradado lineal reforzado arriba
  (kicker) y abajo (pie) + viñeta radial centrada. La tarjeta 73 lo
  usa: el mar de Barbados por fin se ve sin que el 73 pierda
  protagonismo.
- **Carrusel (barras)**: la cifra de la fila destacada va en rojo
  (`.bar-row.hot .bar-label b`), atada visualmente a su barra; barras
  de 48 px (v3: 40 px).
- **Breaking (dato, no plantilla)**: la fuente de la tarjeta Browne ya
  no repite la fecha (está en la banda roja): se cortaba «9-nov-2026»
  al final de línea.
- **Criterio de foto de época**: la foto de la embajada es la sede
  actual (Choquehuanca 137), no la de 1974 — la pieza no afirma que la
  foto sea de 1974, igual que el mar de Barbados 2025 ilustra 1976.
  Documentado en el `ASSETS.md` de la pieza, con la alternativa
  verificada (antigua sede, sin letrero reconocible).

## Reglas de imágenes (importantes)

1. **Real primero**: si existe la foto real del hecho, se usa esa. Las
   recreaciones sintéticas nunca se presentan como archivo real.
2. **Ilustración = ilustración**: lo generado con IA se usa como fondo
   gráfico o ilustración evidente, nunca como «foto» del hecho. Al publicar
   en Meta, **etiqueta de contenido IA** cuando la pieza lleva imagen
   generada (misma regla que en los reels).
3. **Recorte**: personas u objetos sobre fondo de marca con
   `scripts/cutout.py` (rembg, MIT). Límites: multitudes lejanas salen
   vacías; recorta a todas las personas del encuadre.
4. **Duotono**: `scripts/duotone.py` unifica fotos con la identidad
   (negro → rojo corporativo). No usar sobre fotos de archivo que deban
   presentarse como documento sin tratar.
5. **Pollinations**: ruta automática por defecto; token en
   `~/workspace/remotion-hub/.env`, nunca en el repo. Seed fija para
   reproducibilidad. Si una imagen sale mal, cambiar la seed antes que el
   style prompt (el style prompt del Memorial está bloqueado en
   `scripts/gen-image.py`).
6. **Gemini Pro**: para imágenes protagonistas o estilo exacto (autorización
   permanente del usuario, 15-nov-2026). Límites por cómputo.
7. **Licencias y créditos**: cada foto real lleva su licencia verificada en
   su página de Commons (o su fuente) y su procedencia registrada en el
   `ASSETS.md` de la pieza (URL, autor, licencia, fecha). El crédito va
   **en el pie de la publicación**, no en la lámina (regla de investigación
   Instagram); en la lámina solo se imprime con `show_credit: true` si el
   producto lo pide. Las fotos CC BY exigen atribución (en el pie y en el
   manifiesto); las CC0 y de dominio público no, pero el crédito se pone
   igual en el pie por trazabilidad. Nunca usar una foto con licencia sin
   verificar ni recortarla de forma que engañe.

## Reglas de calidad para contenido estático (investigación Instagram, 17-nov-2026)

Observación en vivo de carruseles de AJ+, Brut, BBC News, Al Jazeera
English y Granma (detalle en [`RESEARCH.md`](RESEARCH.md)). Reglas
obligatorias para carruseles del hub:

1. **Cara libre**: nunca cruzar el titular sobre la cara. Cara en los
   dos tercios superiores, texto en el tercio inferior. Verificar con
   `scripts/face-frame.py` antes del render y a ojo después. Si la cara
   no cabe (retrato demasiado ajustado), cambiar de foto, de layout o
   acolcharla con `scripts/letterbox.py`.
2. **Titular abajo**, en negrita, 8–15 palabras en portada; subtítulo o
   dato justo debajo.
3. **Contraste** por degradado negro inferior, panel sólido o palabra
   clave resaltada en rojo de marca (`*palabra*` en titulares). Nunca
   texto directo sobre foto clara; sin duotono en carruseles informativos.
4. **Densidad**: una idea por lámina; cuerpo 18–30 palabras; techo 50
   palabras por lámina; titular ≤15 palabras. `scripts/density.mjs` avisa.
5. **Estructura**: portada con titular completo; desarrollo con una
   pregunta, un dato o una cita por lámina; cierre con cita o dato, **sin
   CTA gráfico** (el CTA va en el pie de la publicación).
6. **Créditos en el pie**, no en la imagen.
7. **Formato 4:5** (1080×1350) como estándar de carrusel.
8. **5–10 láminas** óptimo; no alargar reutilizando la misma foto.

## Combinaciones habituales

- **Post con imagen**: ilustración Pollinations → duotono → plantilla
  `post` con `image` (probado en `pieces/prueba-hero/`).
- **Miniatura con persona**: foto real → `cutout.py` → plantilla
  `thumbnail` con el recorte en `cutout` (la plantilla lo coloca a la
  derecha y desplaza el titular a la izquierda).
- **Carrusel con fotos**: foto real por lámina (campo `image` por página;
  `image_layout`: `background` por defecto, `band` o `side`; encuadre con
  `scripts/face-frame.py`; crédito en el pie, no en la lámina). Formato
  4:5 (`data.format: "4:5"`). Ver `templates/README.md`, `RESEARCH.md` y
  la pieza `trump-cuba-noviembre` (v3).
- **Canva + código**: si el usuario pide retocar en Canva una pieza hecha
  en código, exportar el PNG y subirlo a Canva como base, o recrear el
  brief en Canva. No hay conversión automática código → diseño editable.

## Cuándo NO usar el hub

- El usuario pide algo fuera de la identidad del Memorial (otro proyecto):
  no forzar los tokens; crear tokens propios o usar Canva libre.
- Urgencia extrema y pieza de una sola vez sin reutilización: Canva
  directo puede ser más rápido que montar una pieza con brief y STATE.
- Video: eso es el hub de video (Remotion), no este.
