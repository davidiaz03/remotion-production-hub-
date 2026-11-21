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
| Última hora / reacción a una noticia | Plantilla de código (`breaking`) | — | Banda roja + titular + fecha/fuente; sin foto, para salir rápido |
| Un solo dato o cifra | Plantilla de código (`stat`) | — | Una cifra protagonista gigante; la infografía es para 2–4 cifras |
| Portada 16:9 (Facebook/YouTube) | Plantilla de código (`cover`) | — | Único formato apaisado del hub; contenido clave centrado |
| Línea de tiempo (3–4 hechos) | Plantilla de código (`timeline`) | — | Año en rojo + hecho + fuente; para la memoria histórica del museo |
| Carrusel desde un texto | **Constructor** (`build-carousel.mjs`) | — | Titular + viñetas/Markdown → pieza completa con densidad validada |
| Post que el usuario quiere retocar en el teléfono | **Canva** (`create-design`) | — | La editabilidad manda sobre el control |
| Presentación / deck | **Canva** (`create-design` con `outline`) | — | El código no compite en decks multipágina editables |
| Pieza para imprimir (cartel, volante) | **Canva** + revisión en el editor | Plantilla de código si es solo texto | Canva exporta PDF de imprenta; el código no gestiona sangrías ni CMYK |
| Imagen protagonista o estilo exacto | **Gemini Pro** (cuenta del usuario) | Pollinations si basta una ilustración | Gemini Pro da más control de estilo; Pollinations es la ruta automática |
| Ilustración decorativa / fondo | **Pollinations** (`scripts/gen-image.py`) | Duotono de marca | Rápida, sin marca, reproducible con seed fija |
| Foto de archivo real | **Foto real** (Drive / archivo del Memorial) | Duotono o recorte | Nunca generar una foto que se presente como archivo real |

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
