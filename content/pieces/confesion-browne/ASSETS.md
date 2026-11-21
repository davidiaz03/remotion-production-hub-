# Manifiesto de assets — Un primer ministro contó la llamada de Washington (v3)

Tarjeta de última hora (plantilla `breaking`, cuadrada). La v2 no llevaba
foto; la v3 incorpora el retrato de Gaston Browne reutilizado del reel
«Martí-Fidel». Licencia verificada el 21-nov-2026 (API de Commons +
comparación por píxeles). Ninguna imagen generada por IA.

## Fotos

| Uso | Archivo en uso (v3) | Persona | Fuente | Autor | Fecha | Licencia | Atribución obligatoria |
|---|---|---|---|---|---|---|---|
| Foto de la tarjeta | `img/browne-cumbre-2015.jpg` (1565×1047) | Gaston Browne, primer ministro de Antigua y Barbuda, con letrero «ANTIGUA Y BARBUDA» y micrófono | [File:Gaston Browne 2015.jpg](https://commons.wikimedia.org/wiki/File:Gaston_Browne_2015.jpg) — fotograma recortado del vídeo de la VII Cumbre de las Américas ([YouTube Cumbre Panamá](https://www.youtube.com/watch?v=VZkhAjL_H3w)) | Cumbre Panamá | 16-abr-2015 | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | **Sí** — «Foto: Cumbre Panamá / VII Cumbre de las Américas (CC BY 3.0)» |

## Verificación (21-nov-2026)

- **Identidad confirmada por píxeles**: la copia local se comparó contra
  la miniatura servida por Wikimedia Commons (diferencia media 1,05
  sobre 255 → misma imagen, re-codificada). El hash difiere por la
  re-compresión JPEG y por el EXIF `Artist: benel_000` que lleva el
  archivo local (resto del uploader de Commons, no del autor).
- El origen se desconocía en el repo (sin fuente documentada en
  `ASSETS-V4.md` ni en el manifiesto del reel); se localizó por las
  dimensiones exactas (1565×1047) y el contenido en la categoría de
  Gaston Browne de Commons.

## Encuadre (YuNet; 21-nov-2026)

- **Cuadrado 1080×1080, texto desde y=640** (geometría de referencia
  del formato square): ⚠️ **la cara NO cabe como fondo** — primer plano
  ajustado (cara 54% del alto de la foto); con el mejor encuadre
  (`68% 50%`) la barbilla llega a y=787 px, dentro de la zona de texto.
  Soluciones: acolchar con `letterbox.py` o usar la foto en banda
  superior con el texto debajo sobre negro, no a sangre completa.
- La geometría exacta de la plantilla `breaking` v3 la define el
  rediseño; re-verificar el encuadre con esa geometría antes de
  entregar.

## Notas de uso

- **Contexto**: la foto es de la VII Cumbre de las Américas (Panamá,
  2015), retrato de identificación de Browne — NO es foto de la
  confesión radiofónica del 9-nov-2026. No presentarla como tal.
- **Tratamiento**: solo velo y recorte de encuadre; sin filtros ni
  retoques. La persona sigue siendo reconocible.
- **Créditos (v3)**: SOLO en el pie de la publicación (regla 6 de
  `content/RESEARCH.md`). Pie sugerido: «Foto: Cumbre Panamá / VII
  Cumbre de las Américas (CC BY 3.0).»
- **Descarga**: copia sin modificar desde
  `projects/marti-fidel/public/img/v4/browne-cumbre-2015.jpg`.
