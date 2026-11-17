# AUDITORÍA V1 — Reel «Martí-Fidel: leer, pensar» (17-nov-2026)

Auditoría independiente del máster V1 (`out/marti-fidel_MASTER.mp4`,
50,23 s, 1080×1920), hecha por Alberto a petición del usuario: 17 fotogramas
revisados + transcripción completa del audio con faster-whisper (small, es).
Fotogramas en `audit-frames/`.

## Veredicto

**Sí está a la altura del estándar de redes 2026.** Gancho con dato y
contraste en los primeros 3 s, datos verificados contra fuente primaria,
overlay de evidencia con atribución completa, interrupt deliberado a los
~26 s, citas con retrato, CTA de guardado y QA técnico pasado. Ningún punto
débil es fatal: son 6 pulidos, 2 de ellos de marca/composición que sí hay
que corregir antes de enseñarle el video a la directora. La limitación
estructural conocida sigue ahí: sin presentadora a cámara el techo de
alcance es menor que el de los virales del Memorial (14K/9,1K reacciones);
eso no se corrige en edición.

## Verificado correcto (con evidencia)

- **Voz = guion exacto.** Transcripción completa: las 9 líneas coinciden
  palabra por palabra, incluidos los números (130/17/25, 35 menos, 19
  gobiernos). Sin errores de pronunciación detectables en la transcripción.
- **Datos en pantalla correctos.** Barras 191/187/165/130; contadores
  130/17/25; mapa 6 en contra + 7 abstenciones + 6 ausentes con los 19
  nombres correctos; nota al pie de Venezuela (art. 19, mora).
- **Citas exactas.** Martí «Trincheras de ideas valen más que trincheras
  de piedra» (IDEAS en rojo, atribución «Nuestra América, 1891»);
  Fidel «No es lo mismo estar desinformado que haber perdido la capacidad
  de pensar» (PENSAR en rojo, badge 2005).
- **Tarjeta de evidencia Browne completa.** «Washington lo llamó para que
  cambiara su voto», Gaston Browne, primer ministro de Antigua y Barbuda,
  radio, 9-nov-2026, CMC.
- **Marca.** Logotipo completo desde el fotograma 0, legible sobre fondos
  oscuros; cierre animado oficial con fondo negro; sting sincronizado.
- **QA técnico.** −15,8 LUFS, TP −2,2 dBTP, 1507/1507 fotogramas, sin
  silencio inicial/final (verificado por producción; confirmado por
  ffprobe: 50,41 s contenedor, 1080×1920, SHA-256 verificado por el padre).
- **Gancho.** «130» + «35 VOTOS MENOS QUE EN 2025» visibles en los
  primeros 3 s, sin intro institucional.

## Puntos débiles y corrección (V1.1)

| # | Severidad | Punto débil | Evidencia | Corrección |
|---|---|---|---|---|
| 1 | **Media** | Logo blanco pierde legibilidad sobre el fondo sepia claro de Martí: «MEMORIAL DE LA DENUNCIA» se lava | f_31s, f_33s | Scrim radial oscuro suave detrás del logo solo en las escenas sepia (S6/S7). NO una placa. Verificar letras legibles en stills. |
| 2 | **Media** | El título «PERO ESTO YA ESTABA ESCRITO» cruza la cara de Martí (ojos/frente) en el interrupt | f_27s | Subir el título por encima de la cabeza (o bajarlo bajo la línea de tiempo), cara libre. Retrasar su entrada ~1 s para que no coincida con el karaoke idéntico «ESTABA ESCRITO.» |
| 3 | **Media** | Callback: el contador marca 91 mientras la voz dice «ciento treinta» — gráfico contradice a la voz | f_41s | En el callback, sin count-up: 130 estático con pop desde el primer fotograma de la escena (o aterrizaje exacto sobre la palabra). |
| 4 | **Baja** | Título «EL MAPA CAMBIÓ» + karaoke «EL MAPA CAMBIÓ:» duplicados 1–2 s | f_14s | Retrasar la entrada del título ~1 s, hasta que pase ese chunk de karaoke. |
| 5 | **Baja** | Fondo del salón ONU generado: muy oscuro y genérico, apenas se lee como salón; resta credibilidad documental | f_0.5s, f_3s, f_41s | Reintentar UNA vez la descarga Wikimedia de la foto real de Gruban (URL en research/ASSETS.md); si funciona, sustituir el fondo (oscurecido igual). Si vuelve el 429, mantener Pollinations y anotarlo. La etiqueta IA de Meta sigue aplicando por el fondo del micrófono. |
| 6 | **Baja** | Mancha roja de Galápagos en el Pacífico: geográficamente correcta (Ecuador votó en contra) pero se lee como artefacto/píxel suelto | f_17s, f_18.5s | Quitar Galápagos del overlay rojo (color base); el Ecuador continental sigue en rojo. |

## Aceptado sin corrección (documentado)

- **Retrato de Fidel 1959 + badge «2005»**: el año corresponde a la cita,
  no a la foto; práctica estándar, retrato icónico. Sin cambio.
- **Tarjeta Browne + karaoke con las mismas palabras (~2 s)**: la tarjeta
  es la cita-evidencia y el karaoke es el subtítulo; la coincidencia es
  el comportamiento normal del subtitulado. Sin cambio.
- **Mitad inferior vacía en escenas de datos**: deja libre la zona de la
  interfaz de la plataforma (caption, botones) y sigue el estilo de la
  casa. Sin cambio.
- **Count-up del gancho (91 a los 0,5 s)**: no hay contradicción porque
  la voz aún no dice el número. Sin cambio.

## Estado

Correcciones 1–6 encargadas a producción (V1.1): re-render solo de los
tramos afectados + regenerar máster/ligera + QA completo + verificación
visual de los fotogramas corregidos.

**V1.1 APLICADA (17-nov-2026, ~22:18 UTC):** 5 de 6 correcciones
aplicadas y verificadas visualmente en 10 stills del máster nuevo
(`audit-frames/v11/`): (1) scrim radial + logo legible a 31/33 s;
(2) título bajo la línea de tiempo, cara libre a 27/28 s; (3) 130
estático con karaoke «CIENTO TREINTA» a 41 s; (4) «EL MAPA CAMBIÓ»
sin duplicar a 14 s, visible a 15 s; (6) mapa sin Galápagos a 17/18.5 s.
(5) NO aplicada: tercer intento Wikimedia de la foto de Gruban devolvió
de nuevo HTTP 429; se mantiene el fondo Pollinations. QA `--mode full`:
**passed** (1507/1507 f, −15,8 LUFS, TP −2,2 dBTP). Máster V1.1:
7.995.119 bytes, SHA-256 `f07d203d…91f03`.
