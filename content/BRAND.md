# Sistema de marca — Memorial de la Denuncia

Fuente: **Manual de Identidad Corporativa MD, ver. 01/2012** (Drive
`1eWYHgyf8c6LQVXgrUAWCL87HIh8BLSPG`, PDF 33 págs.), extraído el 17-nov-2026.
Los valores máquina-vivibles están en [`brand/tokens.json`](brand/tokens.json):
**esa es la única fuente de verdad**. Este documento es la lectura humana.

## Colores corporativos

| Color | HEX | RGB | Pantone | Uso |
|---|---|---|---|---|
| Rojo corporativo | `#ED1C24` | 237-28-36 | 485 C | Acentos, barras, cifras, fondo de la pastilla del logo sobre fotos |
| Negro | `#000000` | 0-0-0 | Black C | Fondos, franja de luto, texto sobre claro |
| Blanco | `#FFFFFF` | 255-255-255 | — | Texto sobre oscuro, logo monocromo |
| Gris | `#77787B` | 119-120-123 | Cool Gray 9 C | Textos secundarios, líneas |

**Colores de apoyo** (armonía cromática, nunca como protagonistas):
`#624D45`, `#905745`, `#BE4F38` (marrones) y la escala de tintes del rojo
`#F15B40`, `#F58466`, `#F9AA8F`, `#FCD3C1` (para gráficos e infografías).

**Fondos**: negro puro para piezas solemnes; blanco/papel `#F4F1EC` para
piezas de lectura larga. El rojo **nunca** es fondo de texto corrido.

## El identificador (logo)

Archivo canónico: [`brand/logo-color.png`](brand/logo-color.png)
(573×907, SHA-256 `a6236f15…e1f50`) — copia byte a byte del oficial de Drive
`MARCA_AGUA_OFICIAL_MEMORIAL.png` (id `1rHsQLfVRUeJE435hYDXGu_x8FBG7zIQy`).
Estrella roja con impacto de bala + texto `MEMORIAL DE LA DENUNCIA`.

### Reglas (manual + usuario; el usuario prevalece)

1. **Siempre el logotipo COMPLETO.** Nunca solo la estrella. (Regla del
   usuario, 15-nov-2026; prevalece sobre la excepción del manual que permite
   solo el imagotipo por debajo de 15 mm de altura.)
2. Escalar siempre manteniendo proporciones; nunca deformar, recortar ni
   separar imagotipo de logotipo.
3. **Sobre negro u oscuro**: versión a color (estrella roja + texto blanco).
4. **Sobre rojo corporativo**: versión **blanca** (la estrella roja
   desaparecería sobre rojo). Se genera en cada render con
   `scripts/make-logo-white.py`; no se versiona un segundo binario.
5. **Sobre fotografías**: el manual (p. 13) exige el identificador sobre un
   área de color rojo corporativo, en blanco. Las plantillas con foto de
   fondo llevan la pastilla roja con el logo blanco.
6. Altura mínima legible en digital: **120 px**. Por debajo, no usar el logo:
   usar crédito en texto (`Memorial de la Denuncia`).
7. Zona de seguridad: dejar libre alrededor al menos el alto de la estrella.

> Nota de coordinación: la rama `work/paper-edit-workflow` versiona el mismo
> logo en `shared/brand/logo-white.png` (variante blanca, derivada del
> original cambiando la estrella a blanco). Cuando ambas ramas se fusionen,
> `content/brand/logo-color.png` y `shared/brand/logo-white.png` son
> complementarios (color vs. blanco), no duplicados: no borrar ninguno.

## Tipografía

- **Oficial (manual)**: Amplitude — Condensed para titulares, Regular y Comp
  para apoyo. Comercial, no disponible en el hub.
- **Sustituta (hub)**: **Barlow + Barlow Condensed** (OFL, en
  `brand/fonts/`, 9 pesos + licencia). Humanista condensada de espíritu
  equivalente a Amplitude Condensed; elegida 17-nov-2026.
- Titulares: Barlow Condensed ExtraBold/Bold, mayúsculas, interlineado 0.95.
- Cuerpo: Barlow Regular/Medium. Citas: Barlow Italic.
- Cifras protagonistas en infografías: Barlow Condensed ExtraBold en rojo.

## Motivos gráficos

- **Franja negra**: elemento de apoyo del manual, símbolo de luto. En las
  plantillas es la banda inferior (o superior) que porta el logo o el crédito.
- **Barra roja**: acento vertical (8–14 px) junto a titulares o separando
  bloques.
- **Grano**: `brand/textures/grain.png` en overlay (opacidad 0.04–0.08) sobre
  fondos planos; nunca sobre fotos de archivo sin revisar.
- **Halftone**: `brand/textures/halftone.png`, patrón de puntos sutil para
  fondos de carrusel/infografía.

## Iconos

`lib/icons/` — 31 iconos Lucide (licencia ISC, ver `LICENSE-ISC.txt`):
quote, calendar, map-pin, clock, eye, megaphone, book-open, newspaper,
camera, play, arrow-right, arrow-up-right, check, info, heart, share-2,
globe, users, mic, audio-lines, image, external-link, chevron-right, star,
flag, landmark, scale, shield, flame, file-text, siren. Se incrustan como
SVG inline con `stroke="currentColor"`.

## Contacto institucional (del manual)

Ave 5ta Nro. 1402 e/ 12 y 14, Miramar, La Habana, Cuba ·
(53) 7 204 5075 al 77 · www.cubadenuncia.cu · info@cubadenuncia.cu ·
facebook.com/memorialdenuncia · @memorialdenuncia
