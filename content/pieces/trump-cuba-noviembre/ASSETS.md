# Manifiesto de assets — Trump y Cuba (v3)

Fotos reales de Wikimedia Commons. Licencia verificada en la página de
Commons de cada imagen el 17-nov-2026 (metadatos estructurados de la API
+ página del archivo). Las 4 fotos están versionadas en `img/` (con
`git add -f`: el `.gitignore` del repo ignora `*.jpg`).

## Fotos

| Lámina | Archivo en uso (v3) | Persona | Fuente (Commons) | Autor | Fecha | Licencia | Atribución obligatoria |
|---|---|---|---|---|---|---|---|
| 2 | `img/bruno-rodriguez.jpg` (1920×1194) | Bruno Rodríguez Parrilla | [File:Bruno Rodríguez Parrilla.jpg](https://commons.wikimedia.org/wiki/File:Bruno_Rodr%C3%ADguez_Parrilla.jpg) | Presidencia El Salvador | 2-may-2017 | [CC0 1.0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | No (crédito corto por trazabilidad) |
| 3 | `img/trump-enero-2025-lb.jpg` (2965×3706) | Donald Trump | [File:January 2025 Official Presidential Portrait of Donald J. Trump.jpg](https://commons.wikimedia.org/wiki/File:January_2025_Official_Presidential_Portrait_of_Donald_J._Trump.jpg) | Daniel Torok (Casa Blanca) | 15-ene-2025 | Dominio público (obra del gobierno federal de EE. UU.) | No |
| 4 | `img/trump-junio-2025-lb.jpg` (2556×3195) | Donald Trump | [File:Official Presidential Portrait of President Donald J. Trump (2025).jpg](https://commons.wikimedia.org/wiki/File:Official_Presidential_Portrait_of_President_Donald_J._Trump_(2025).jpg) | Daniel Torok (Casa Blanca) | 2-jun-2025 | Dominio público (obra del gobierno federal de EE. UU.) | No |
| 5 | `img/diaz-canel-2023-lb.jpg` (1442×1802) | Miguel Díaz-Canel | [File:Visit by Cuban President Miguel Díaz-Canel to Khamenei's office in 2023 (8) (cropped).jpg](https://commons.wikimedia.org/wiki/File:Visit_by_Cuban_President_Miguel_D%C3%ADaz-Canel_to_Khamenei%27s_office_in_2023_(8)_(cropped).jpg) | Khamenei.ir | 4-dic-2023 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | **Sí** (atribución completa en el pie de la publicación; ver `brief.md`) |

## Derivados letterbox (v3)

Los tres retratos oficiales eran demasiado ajustados para el layout
`background` en 4:5: la cara ocupaba más que la zona libre (entre el
kicker y el texto) y ningún `image_position` la salvaba (verificado con
`scripts/face-frame.py`, que avisaba de barbilla en la zona de texto en
las tres láminas). Se acolcharon con negro con
`scripts/letterbox.py --auto` (modo `shrink` en los tres casos). El
contenido de las fotos NO se alteró: solo se añadió negro, que se funde
con el fondo negro de la plantilla. Los originales se conservan en `img/`.

| Derivado | Original | Acolchado L,T,R,B (px) | Verificación |
|---|---|---|---|
| `img/trump-enero-2025-lb.jpg` (2965×3706) | `img/trump-enero-2025.jpg` (1920×2485) | 492, 0, 553, 1221 | face-frame: OK |
| `img/trump-junio-2025-lb.jpg` (2556×3195) | `img/trump-junio-2025.jpg` (1638×2048) | 388, 0, 530, 1147 | face-frame: OK |
| `img/diaz-canel-2023-lb.jpg` (1442×1802) | `img/diaz-canel-2023.jpg` (1176×1536) | 68, 0, 198, 266 | face-frame: OK |

Búsqueda de fotos alternativas (17-nov-2026): se buscaron en Commons
planos más abiertos de Trump (firma de órdenes ejecutivas 20-ene-2025,
sesión conjunta del Congreso 4-mar-2025, Rose Garden 2-abr-2025, mitin
de Míchigan 29-abr-2025) y de Díaz-Canel (BRICS Río 7-jul-2025, Kremlin
may-2025, 9 de mayo Moscú 2025). Ninguno sirvió: planos con otra
persona protagonista, de espaldas, de grupo o con la cara demasiado
pequeña. El letterbox fue la solución correcta para estos retratos.

## Notas de uso

- **Contexto de las fotos**: Bruno en la reunión extraordinaria de la CELAC
  en El Salvador (2017); Trump en sus dos retratos oficiales de 2025
  (enero y junio); Díaz-Canel en su visita a la oficina de Jameneí en
  Teherán (dic-2023). Ninguna foto es del hecho narrado en su lámina
  (noviembre de 2026): son retratos de identificación de cada protagonista,
  no archivo del hecho. No se presentan como fotos de noviembre de 2026.
- **Tratamiento**: solo el velo degradado del layout `background` y el
  recorte de encuadre (`object-fit: cover`); en las láminas 3–5, además,
  el acolchado negro del letterbox (ver arriba). Sin duotono, sin filtros
  ni retoques. Las personas siguen siendo reconocibles.
- **Díaz-Canel**: se eligió el retrato de 2023 (1176×1536) sobre el de
  2025 de Kremlin.ru (442×608, CC BY 4.0) por resolución: el de 2025
  quedaría borroso a sangre completa. El de 2025 sigue disponible en
  Commons si un uso futuro admite menor resolución.
- **Trump**: dos retratos distintos (enero y junio de 2025) para no repetir
  la misma foto en las dos láminas.
- **Créditos (v3)**: SOLO en el pie de la publicación (regla 6 de
  `content/RESEARCH.md`); ya no van en la imagen. La atribución completa
  está en este manifiesto y en el pie sugerido del `brief.md`. (En la v2
  iban también en la lámina: «Foto: Presidencia de El Salvador (CC0)»,
  «Foto: Daniel Torok / Casa Blanca», «Foto: Khamenei.ir (CC BY 4.0)».)
- **Descarga**: las fotos de Trump (enero) y Bruno se descargaron como
  miniaturas de 1920 px desde `thumb.wikimedia.org` (el original directo
  devolvía error 400 de Wikimedia para esos dos archivos); Díaz-Canel y
  Trump (junio) son los originales. Resolución suficiente para 1080×1350
  (4:5); el letterbox reduce la escala efectiva, así que la resolución
  original sobra.
