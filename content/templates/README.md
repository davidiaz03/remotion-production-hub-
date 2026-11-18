# Plantillas

Cada plantilla es un directorio con:

| Archivo | Qué es |
|---|---|
| `template.html` | Maquetación (HTML + CSS; usa `assets/base.css` y la sintaxis de `scripts/template.mjs`) |
| `template.json` | Metadatos: tamaño, `multi`, campos con límites de caracteres |
| `data.example.json` | Datos de ejemplo reales y verificados (sirven de prueba y de referencia) |

El render es compartido: `node content/scripts/render.mjs --example <plantilla>`.

## Las 6 plantillas

| Plantilla | Tamaño | Uso | Límites clave |
|---|---|---|---|
| `post` | 1080×1080 | Post cuadrado FB/IG | Titular ≤ 60 car.; cuerpo ≤ 280 car. |
| `story` | 1080×1920 | Story vertical | Titular ≤ 45 car.; cuerpo ≤ 220 car. |
| `carousel` | 1080×1080 ×N | Carrusel (portada + contenido + cierre) | 3–6 páginas; 2–3 ítems por página; foto opcional por lámina (ver abajo) |
| `infographic` | 1080×1350 | Infografía 4:5 | 2–4 cifras; fuente obligatoria |
| `thumbnail` | 1080×1920 | Portada/miniatura de reel | Titular ≤ 30 car.; acento ≤ 20 car. |
| `quote` | 1080×1080 | Tarjeta de cita | Cita ≤ 200 car., textual y con fuente |

## Fotos por lámina en el carrusel

Las páginas de contenido del carrusel admiten foto (campos por página en
`data.pages[]`; la portada y el cierre son solo de diseño):

| Campo | Qué hace |
|---|---|
| `image` | Ruta de la foto (relativa a la pieza; `render.mjs` la copia a `out/assets/`). Sin `image`, la página renderiza como antes (retrocompatible). |
| `image_layout` | `background` (por defecto): foto a sangre completa + velo degradado; admite cualquier longitud de texto. `band`: banda superior de 340 px bajo la cabecera (solo fotos apaisadas y cuerpo corto, ≤2 ítems). `side`: columna derecha de retrato 408×720 (solo retratos verticales y cuerpo corto). |
| `image_position` | Encuadre CSS, p. ej. `50% 25%`. Por defecto `50% 30%`. Ajustar tras el QA visual si la cara queda cortada. |
| `image_credit` | Crédito corto, p. ej. `Foto: Autor (CC BY 4.0)`. Se imprime en el pie, bajo la web. Obligatorio cuando la licencia lo exige. |

Reglas:

- **Foto real primero** (Wikimedia Commons, archivo del Memorial). Nunca
  generar una foto de una persona real con IA.
- **Licencia verificada por imagen** en su página de Commons; procedencia
  (URL, autor, licencia) en el `ASSETS.md` de la pieza y en el brief.
- **Atribución completa** (autor + enlace a la licencia) en el manifiesto y
  en el pie de la publicación; en la lámina basta el crédito corto.
- **Sin tratamientos que engañen**: el velo del layout `background` y el
  recorte de encuadre son los únicos admitidos; la persona debe seguir
  siendo reconocible. No aplicar duotono a fotos de personas reales que se
  presenten como documento.
- Verificado con la pieza `pieces/trump-cuba-noviembre/` (v2, 17-nov-2026):
  `background` en 4 láminas; `band` y `side` verificados con render de
  prueba. El ejemplo de la plantilla sigue sin foto a propósito: es la
  prueba de retrocompatibilidad.

## Pendiente (documentado, no dispersarse)

- `quote` e `infographic` no admiten imagen: la tarjeta de cita es un
  producto de texto puro y la infografía es densa en datos; añadir foto ahí
  exige rediseñar la maquetación, no es el mismo mecanismo. Si un producto
  futuro lo pide, se diseña entonces.

## Reglas de diseño (todas)

- Los valores de marca (colores, fuentes) vienen de `assets/base.css` y
  `brand/tokens.json`. No escribir hex sueltos en una plantilla nueva.
- El logo es vertical (573:907): dimensionar por **alto**, nunca por ancho.
  Una sola aparición del logo por pieza.
- Sobre foto: pastilla roja + logo blanco (norma del manual). Sobre negro:
  logo a color.
- Sin `overflow: hidden` en bloques de texto: si el texto se desborda, el QA
  visual debe verlo, no esconderlo. Respetar los límites de caracteres.
- Imágenes: `data.image` (o `background`/`photo`) acepta una ruta local;
  render.mjs la copia a `out/assets/`. Nunca inventar una foto de archivo:
  ver `GUIDE.md` (ruta de imagen real vs. generada).

## Añadir una plantilla nueva

1. Copiar la más parecida (`cp -r templates/post templates/<nueva>`).
2. Editar `template.json` (tamaño, campos), `template.html` y
   `data.example.json` (datos reales).
3. Renderizar el ejemplo y hacer QA visual antes de commitear:
   `node content/scripts/render.mjs --example <nueva>`.
4. Añadirla a la tabla de arriba y a `TEMPLATES` en `scripts/render.mjs`.
