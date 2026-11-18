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
| `carousel` | 1080×1080 ×N (variante 4:5: 1080×1350) | Carrusel (portada + contenido + cierre) | 3–6 páginas; 2–3 ítems por página; foto opcional por lámina (ver abajo); densidad: titular ≤15, cuerpo ≤30, total ≤50 palabras |
| `infographic` | 1080×1350 | Infografía 4:5 | 2–4 cifras; fuente obligatoria |
| `thumbnail` | 1080×1920 | Portada/miniatura de reel | Titular ≤ 30 car.; acento ≤ 20 car. |
| `quote` | 1080×1080 | Tarjeta de cita | Cita ≤ 200 car., textual y con fuente |

## Formato 4:5 (carrusel)

El estándar de los carruseles informativos en Instagram es el vertical
4:5 (1080×1350), no el cuadrado. La plantilla `carousel` lo admite con
`data.format: "4:5"` (cuadrado por defecto). En 4:5 la portada baja el
titular, el texto con foto arranca en y=780 y los layouts `band`/`side`
crecen. Verificado con la pieza `trump-cuba-noviembre` (v3).

## Fotos por lámina en el carrusel

Las páginas de contenido del carrusel admiten foto (campos por página en
`data.pages[]`; la portada y el cierre son solo de diseño):

| Campo | Qué hace |
|---|---|
| `image` | Ruta de la foto (relativa a la pieza; `render.mjs` la copia a `out/assets/`). Sin `image`, la página renderiza como antes (retrocompatible). |
| `image_layout` | `background` (por defecto): foto a sangre completa, **cara en los dos tercios superiores y texto en el tercio inferior** sobre degradado negro fuerte. `band`: banda superior bajo la cabecera (solo fotos apaisadas y cuerpo corto, ≤2 ítems). `side`: columna derecha de retrato (solo retratos verticales y cuerpo corto). |
| `image_position` | Encuadre CSS, p. ej. `50% 25%`. Por defecto `50% 30%`. Calcular con `scripts/face-frame.py` (ver abajo); ajustar tras el QA visual si hace falta. |
| `image_credit` | Crédito corto, p. ej. `Foto: Autor (CC BY 4.0)`. **Por defecto NO se imprime en la lámina**: el crédito va en el pie de la publicación (regla de investigación Instagram). Se imprime solo con `show_credit: true`. La atribución completa va siempre en `ASSETS.md` y en el pie. |
| `show_credit` | Si es `true`, imprime `image_credit` en el pie de la lámina. Por defecto `false`. |

### Cara libre (regla universal)

Ningún medio de referencia cruza el titular sobre la cara (ver
`content/RESEARCH.md`). En el layout `background`:

- La cara va en los dos tercios superiores; el texto, en el tercio
  inferior (cuadrado: desde y=640; 4:5: desde y=780).
- El velo tiene scrim superior (para el kicker) y degradado fuerte hacia
  abajo: la zona de la cara queda con velo ligero (≤0.30) y el texto
  arranca donde el velo ya es ≥0.70.
- Nunca texto sobre ojos o boca. Si una foto no permite encuadrar la
  cara fuera del texto, cambiar de foto, de layout (`band`/`side`) o
  acolcharla con `scripts/letterbox.py` (abajo), no forzar el encuadre.

### Encuadre con detección de caras

`scripts/face-frame.py` (YuNet, OpenCV; requiere el venv del hub) detecta
la cara protagonista y sugiere el `image_position` para que quede en la
zona libre; avisa si el texto se solapa con una cara, si la cara queda
cortada o si es demasiado pequeña:

```bash
~/workspace/remotion-hub/.venv/bin/python content/scripts/face-frame.py --piece <slug> [--format 4:5] [--apply]
~/workspace/remotion-hub/.venv/bin/python content/scripts/face-frame.py foto.jpg --canvas 1080x1350 --text-top 780
```

La cara protagonista es la de mayor área. El modelo YuNet (232 KB) se
descarga solo la primera vez a `~/workspace/remotion-hub/.yunet/`. La
geometría (texto desde y=640 en cuadrado, y=780 en 4:5; kicker 0–130)
vive en el script y **debe coincidir con el CSS de la plantilla**.
Detección multiescala (1.0, 0.5, 0.33): a escala completa YuNet
subestima las caras grandes. El criterio es la cara COMPLETA (caja +
margen de barbilla del 25%) por encima del texto; los landmarks de YuNet
no se usan (en cv2 5.0 salen incoherentes).

### Letterbox (retratos demasiado ajustados)

Cuando `face-frame.py` avisa de que la cara «NO cabe entera en la zona
libre», `scripts/letterbox.py` acolcha la foto con negro para que quepa:
si la cara cabe a la escala actual, acolcha solo arriba/abajo para crear
recorrido vertical; si es demasiado alta, achica la foto acolchando por
los cuatro lados. El contenido no se altera (solo negro, que se funde
con el fondo de la plantilla). Guarda el derivado como `foto-lb.jpg`,
conserva el original y registra el acolchado en el `ASSETS.md` de la
pieza. Verifica el resultado con face-frame y sale con código 1 si sigue
sin caber.

```bash
~/workspace/remotion-hub/.venv/bin/python content/scripts/letterbox.py foto.jpg --out foto-lb.jpg
~/workspace/remotion-hub/.venv/bin/python content/scripts/letterbox.py foto.jpg --out foto-lb.jpg --pad 0,428,0,428
```

Verificado con la pieza `trump-cuba-noviembre` (v3): los tres retratos
oficiales (Trump enero/junio 2025, Díaz-Canel 2023) necesitaban
letterbox en 4:5; tras acolchar, las 4 láminas con foto pasan face-frame
sin avisos y el QA visual confirma la cara libre.

### Resaltado de palabra clave

En titulares (portada, contenido y cierre), `*palabra*` entre asteriscos
resalta en rojo de marca (sintaxis `{{hl:}}` del motor). Una sola palabra
o frase corta por titular; es el mecanismo (c) de contraste de la
investigación (palabra clave en color de marca).

### Densidad

Una idea por lámina; titular ≤15 palabras, cuerpo ≤30, total por lámina
≤50. `scripts/density.mjs` lo comprueba (`node scripts/density.mjs
<pieza>/data.json`, sale con código 1 si hay avisos) y `render.mjs` avisa
en cada render de carrusel sin bloquear. Verificado con la pieza
`trump-cuba-noviembre` (v3): las 4 láminas de contenido quedaron en
33–43 palabras.

Reglas:

- **Foto real primero** (Wikimedia Commons, archivo del Memorial). Nunca
  generar una foto de una persona real con IA.
- **Licencia verificada por imagen** en su página de Commons; procedencia
  (URL, autor, licencia) en el `ASSETS.md` de la pieza y en el brief.
- **Atribución completa** (autor + enlace a la licencia) en el manifiesto
  y en el pie de la publicación; en la lámina no se imprime nada por
  defecto (`show_credit: true` solo si el producto lo pide).
- **Sin tratamientos que engañen**: el velo del layout `background` y el
  recorte de encuadre son los únicos admitidos; la persona debe seguir
  siendo reconocible. No aplicar duotono a fotos de personas reales que se
  presenten como documento.
- Verificado con la pieza `pieces/trump-cuba-noviembre/` (v3, 17-nov-2026):
  `background` en 4 láminas en formato 4:5, con encuadre por detección de
  caras; `band` y `side` verificados con render de prueba. El ejemplo de
  la plantilla sigue sin foto a propósito: es la prueba de
  retrocompatibilidad.

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
