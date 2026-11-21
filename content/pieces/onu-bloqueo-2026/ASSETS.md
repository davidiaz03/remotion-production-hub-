# Manifiesto de assets — La ONU contra el bloqueo por 34.º año (v3)

Fotos reales reutilizadas del reel «Martí-Fidel: leer, pensar» (fotogramas
UN Web TV + dos fotos de Wikimedia Commons). Licencias verificadas el
21-nov-2026 (metadatos estructurados de la API de Commons + comparación
por píxeles contra las miniaturas de Commons; términos UN Web TV en
`REAL-UN-ASSETS.md` del proyecto marti-fidel). Ninguna imagen generada
por IA.

Mapeo propuesto a láminas (la v3 lo confirma al rediseñar): portada y
láminas 2–3 con fotogramas reales de la sesión del 28-oct-2026; lámina 5
con el retrato de Browne; lámina 6 con Fidel en la ONU en 1960. La
lámina 4 (El contraste, datos 2025 vs 2026) queda sin foto.

## Fotos

| Lámina | Archivo en uso (v3) | Contenido | Fuente | Autor | Fecha | Licencia | Atribución obligatoria |
|---|---|---|---|---|---|---|---|
| Portada | `img/un-hall-wide-vert.jpg` (1080×1920) | Plano general del salón, escrutinio en curso (Item 37 – A/81/L.5) | UN Web TV / Biblioteca Audiovisual de la ONU — [asset d3671892](https://media.un.org/avlibrary/en/asset/d367/d3671892) (28ª sesión plenaria, 81º período; acta A/81/PV.28) | Naciones Unidas | 28-oct-2026 | © ONU — uso editorial no comercial | Crédito «Imágenes: UN Web TV / Naciones Unidas» (en el pie de la publicación) |
| 2 · El voto | `img/un-voteboard-result-vert.jpg` (1080×1920) | Los dos tableros con el RESULTADO FINAL 130-17-25; delegados de pie | UN Web TV — [asset d3671892](https://media.un.org/avlibrary/en/asset/d367/d3671892) | Naciones Unidas | 28-oct-2026 | © ONU — uso editorial no comercial | Crédito «Imágenes: UN Web TV / Naciones Unidas» |
| 3 · La presión | `img/un-bruno-podium.jpg` (1920×1080) | Bruno Rodríguez Parrilla en el podio presentando la resolución | UN Web TV — [asset d3671892](https://media.un.org/avlibrary/en/asset/d367/d3671892) | Naciones Unidas | 28-oct-2026 | © ONU — uso editorial no comercial | Crédito «Imágenes: UN Web TV / Naciones Unidas» |
| 5 · La confesión | `img/browne-cumbre-2015.jpg` (1565×1047) | Gaston Browne, primer ministro de Antigua y Barbuda, con letrero «ANTIGUA Y BARBUDA» y micrófono | [File:Gaston Browne 2015.jpg](https://commons.wikimedia.org/wiki/File:Gaston_Browne_2015.jpg) — fotograma recortado del vídeo de la VII Cumbre de las Américas ([YouTube Cumbre Panamá](https://www.youtube.com/watch?v=VZkhAjL_H3w)) | Cumbre Panamá | 16-abr-2015 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | **Sí** — «Foto: Cumbre Panamá / VII Cumbre de las Américas (CC BY 3.0)» |
| 6 · El contexto | `img/fidel-onu-1960.jpg` (2460×3672) | Fidel Castro en grupo en la Asamblea General (B/N) | [File:Fidel Castro - UN General Assembly 1960.jpg](https://commons.wikimedia.org/wiki/File:Fidel_Castro_-_UN_General_Assembly_1960.jpg) — Biblioteca del Congreso de EE. UU. (Prints & Photographs) | Warren K. Leffler | 22-sep-1960 | Dominio público | No (crédito recomendado: «Warren K. Leffler / Library of Congress») |

## Verificación (21-nov-2026)

- **Browne y Fidel, identidad confirmada por píxeles**: las copias locales
  se compararon contra las miniaturas servidas por Wikimedia Commons
  (diferencia media por píxel 1,05 y 1,73 sobre 255 → misma imagen,
  re-codificada). Los hashes SHA-256 difieren por la re-compresión JPEG:
  el archivo local de Browne lleva además el EXIF `Artist: benel_000`,
  resto del uploader de Commons, no del autor (el autor es Cumbre Panamá).
- **UN Web TV**: fotogramas extraídos del VOD oficial (Kaltura
  `1_8dylozhm`, 1080p) y verificados por transcripción contra la
  transcripción oficial; ver `REAL-UN-ASSETS.md` en el proyecto
  marti-fidel. Términos: material informativo oficial © ONU; uso
  editorial no comercial por institución pública, con crédito.

## Encuadre (YuNet, lienzo 1080×1350, texto desde y=780; 21-nov-2026)

- **Browne**: ⚠️ **NO cabe como fondo 4:5** — primer plano ajustado
  (cara 54% del alto de la foto); con el mejor encuadre (`63% 50%`) la
  barbilla llega a y=984 px, dentro de la zona de texto. Soluciones:
  acolchar con `letterbox.py` (como los retratos de la pieza
  trump-cuba-noviembre) o usar layout de banda (foto arriba, texto abajo
  sobre negro), no `background` a sangre completa.
- **Bruno**: ✅ sin avisos — cara 47% x 35%, alto 30%;
  `image_position` sugerido `44% 50%`.
- **Fidel (grupo, 8 caras)**: sin avisos de ajuste, pero la cara mayor
  detectada es un acompañante (22% x). La de Fidel es la de 60% x 35%
  (alto 10%): para centrarla a él, `image_position` `50% 20%` (la
  sugerencia automática `50% 28%` centra la cara mayor). Verificar a ojo
  que Fidel se lee bien en el recorte.

## Notas de uso

- **Contexto de las fotos**: Browne 2015 es retrato de identificación
  (VII Cumbre de las Américas, Panamá), NO foto de la confesión
  radiofónica del 9-nov-2026 — no presentarla como tal. Fidel 1960 sí
  es del año en que empieza el bloqueo que narra la lámina 6. Los tres
  fotogramas UN son de la sesión narrada (28-oct-2026).
- **Tratamiento**: solo el velo degradado del layout `background` y el
  recorte de encuadre (`object-fit: cover`); sin duotono, sin filtros
  ni retoques. Las personas siguen siendo reconocibles.
- **Créditos (v3)**: SOLO en el pie de la publicación (regla 6 de
  `content/RESEARCH.md`); ya no van en la imagen. Pie sugerido:
  «Imágenes: UN Web TV / Naciones Unidas. Foto de Browne: Cumbre
  Panamá / VII Cumbre de las Américas (CC BY 3.0). Foto de Fidel:
  Warren K. Leffler / Library of Congress (dominio público).»
- **Descarga**: copias sin modificar desde
  `projects/marti-fidel/public/img/` (real-un/ y v4/). Los originales
  de Commons no se re-descargaron: `upload.wikimedia.org` devolvía
  error desde esta VM (y luego 429 por límite de peticiones); la
  identidad se verificó con las miniaturas de `thumb.wikimedia.org`.

## Alternativas verificadas NO usadas

- **Martí (sustituto de Fidel, no hizo falta)**: `marti-retrato-clasico.jpg`
  (1220×2035, en `public/img/v4/` del reel) es un retrato de 1891,
  **dominio público** (Martí falleció en 1895). Su proporción
  (0,5995) coincide exactamente con la del archivo CC0 de Commons
  «José Martí retrato hecho posiblemente 1891.jpg» (380×634, autor:
  Cuba. Secretaría de Instrucción Pública y Bellas Artes, 1891). La
  comparación por píxeles quedó **pendiente** por el 429 de Wikimedia.
  Encuadre 4:5: NO cabe como fondo (cara 46% del alto; con `50% 100%`
  la barbilla llega a y=820 y la cara se corta por arriba 219 px) —
  si se usa algún día, con letterbox.
- **Browne en la coronación (plan B, no hizo falta)**: la foto de
  Browne con Catalina de Gales en la recepción de Buckingham Palace
  (5-may-2023, Ian Jones / Foreign Office, Flickr
  `foreignoffice/52873156666`) es **CC BY 2.0** (verificado en su
  página de Commons, revisada por FlickreviewR 2, ticket VRT
  2023050910013168; la página de Flickr devolvió 403 al lector de
  texto). En Commons existe ya un recorte solo-Browne en alta
  resolución: «Gaston Browne Buckingham Palace reception (3x4
  cropped).jpg» (1706×2274, CC BY 2.0) — mejor que recortar la copia
  local de 1024 px si algún día hace falta un retrato de Browne.
