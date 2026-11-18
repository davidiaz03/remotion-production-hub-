# Investigación — cómo hacen los carruseles informativos en Instagram

Observación en vivo en Instagram, 17-nov-2026. Cinco medios revisados
con carruseles reales publicados: **AJ+**, **Brut**, **BBC News**,
**Al Jazeera English** y **Granma**. El objetivo: extraer las reglas de
calidad que el hub debe cumplir para que sus carruseles estén al nivel
de los medios de referencia. Las reglas se implementaron en la plantilla
`carousel` (v3, 17-nov-2026) y se resumen en `GUIDE.md`.

## Lo observado

| Medio | Formato | Portada | Texto | Contraste | Créditos |
|---|---|---|---|---|---|
| AJ+ | 4:5 | Foto + titular de 15 palabras | Una idea por lámina, cuerpo corto | Banda amarilla tras el texto; palabra clave en amarillo | En el pie |
| Brut | 4:5 | Foto + titular | Cita en panel gris sobre fondo negro | Fondo negro; palabra clave en amarillo | REUTERS, en el pie |
| BBC News | 4:5 | Foto + titular de 11 palabras | Un dato por lámina | Degradado negro inferior; palabra clave en rojo | Getty, en el pie |
| Al Jazeera English | 4:5 | Foto + titular de 9 palabras | Una pregunta o dato por lámina | Degradado negro inferior; palabra clave en rojo | En el pie |
| Granma | 4:5 | Foto + titular de 8 palabras | Cuerpo corto | Degradado / panel sólido | En el pie |

## Reglas extraídas

1. **Cara libre (universal, sin excepciones en los 5 medios).** Ningún
   medio cruza el titular sobre la cara. La cara va en los dos tercios
   superiores; el texto, en el tercio inferior, sobre torso, fondo oscuro
   o panel sólido. Nunca texto sobre ojos o boca.
2. **Titular abajo**, en negrita, de 8 a 15 palabras en portada (Granma
   8, Al Jazeera 9, BBC 11, AJ+ 15). Subtítulo o dato justo debajo, en
   color de marca o más pequeño.
3. **Contraste: tres mecanismos, nunca texto directo sobre foto clara.**
   (a) Degradado negro inferior (AJ+, BBC, Al Jazeera). (b) Banda o panel
   sólido tras el texto (banda amarilla de AJ+, panel gris de cita de
   Brut, fondo negro de Brut). (c) Palabra clave resaltada en color de
   marca (amarillo AJ+/Brut, rojo Al Jazeera/BBC). **Sin duotono en
   ningún caso observado.**
4. **Densidad.** Una idea por lámina; cuerpo de desarrollo de ~18–30
   palabras; techo de 30–50 palabras por lámina. Tipografía mínima:
   24 pt el cuerpo, 36 pt+ los títulos. Máximo 2 fuentes y 2–3 colores
   de marca.
5. **Estructura.** Portada con foto y titular completo; desarrollo con
   una pregunta, un dato o una cita por lámina; cierre con una cita o un
   dato, **sin CTA gráfico** (el CTA va en el pie de la publicación).
6. **Créditos en el pie, no en la imagen.** BBC (Getty), Brut (REUTERS)
   y Granma ponen el crédito en el pie de la publicación, nunca sobre la
   lámina. (La atribución de licencias CC BY sigue siendo obligatoria:
   va en el pie y en el manifiesto `ASSETS.md` de la pieza.)
7. **Formato 4:5 vertical (1080×1350)** es el estándar de estos
   carruseles, no el cuadrado.
8. **Número de láminas: 5–10 óptimo.** 2 láminas funcionan para última
   hora. Alargar reutilizando la misma foto penaliza: el carrusel de
   Al Jazeera con 10 láminas obtuvo 528 me gusta con 10,4 M de
   seguidores.

## Qué NO se pudo ver

- **NowThis**: ya solo publica Reels; no tiene carruseles estáticos que
  observar.
- **Cubadebate**: no está en Instagram.
- **El País**: no se localizó la cuenta oficial en Instagram.
- **Facebook**: devolvió página de error durante la observación; la
  investigación se limitó a Instagram.

## Cómo se aplican en el hub

- La plantilla `carousel` (layout `background`) pone la cara en los dos
  tercios superiores y el texto en el tercio inferior con degradado negro
  fuerte; el titular admite palabra clave resaltada en rojo de marca
  (`*palabra*`, sintaxis `{{hl:}}`).
- `scripts/face-frame.py` detecta la cara (YuNet, multiescala 1.0/0.5/0.33)
  y calcula el encuadre para que quede en la zona libre; avisa si el texto
  se solapa con una cara. Criterio: la cara COMPLETA (caja + margen de
  barbilla del 25%) por encima del texto.
- `scripts/letterbox.py` acolcha con negro los retratos demasiado ajustados
  para que la cara quepa en la zona libre (sin alterar el contenido).
  Verificado en la v3 del carrusel Trump–Cuba: los tres retratos oficiales
  lo necesitaron en 4:5.
- `scripts/density.mjs` avisa si una lámina supera los techos (titular
  15 palabras, cuerpo 30, total 50); `render.mjs` lo ejecuta en cada
  render de carrusel.
- El crédito de foto va por defecto en el pie de la publicación
  (`image_credit` solo se imprime en la lámina con `show_credit: true`).
- La plantilla `carousel` tiene variante 4:5 (`data.format: "4:5"`).
