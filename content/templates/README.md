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
| `carousel` | 1080×1080 ×N | Carrusel (portada + contenido + cierre) | 3–6 páginas; 2–3 ítems por página |
| `infographic` | 1080×1350 | Infografía 4:5 | 2–4 cifras; fuente obligatoria |
| `thumbnail` | 1080×1920 | Portada/miniatura de reel | Titular ≤ 30 car.; acento ≤ 20 car. |
| `quote` | 1080×1080 | Tarjeta de cita | Cita ≤ 200 car., textual y con fuente |

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
