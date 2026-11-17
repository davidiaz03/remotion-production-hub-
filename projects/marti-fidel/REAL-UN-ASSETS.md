# Fotogramas reales de la ONU — reel «Martí-Fidel: leer, pensar»

Extracción: 17-nov-2026. Sustituyen el fondo generado por IA (`bg-un-hall.png`,
Pollinations) que se repetía en varias escenas de la V1/V1.1. **No se usó la
27ª plenaria: la sesión exacta (28ª, votación) fue localizada y verificada.**

## Sesión verificada

- **Sesión:** 28ª sesión plenaria, 81º período, Asamblea General de la ONU
- **Fecha:** miércoles 28-oct-2026
- **Tema:** punto 37 — Necesidad de poner fin al bloqueo económico, comercial y
  financiero impuesto por los EE. UU. contra Cuba; proyecto **A/81/L.5**;
  acta **A/81/PV.28**
- **Resultado:** **130 a favor, 17 en contra, 25 abstenciones** (aprobada)
- **Fuente:** UN Web TV vía Biblioteca Audiovisual de la ONU —
  https://media.un.org/avlibrary/en/asset/d367/d3671892
- **Vídeo:** Kaltura entry `1_kspetddv` (emisión en directo) → VOD
  `1_8dylozhm`, duración 7.865 s (2:11:05), variante máxima 1920×1080
  (flavor `1_uxrvsron`, ~2,66 Mbps, 29,97 fps)
- **Verificación de contenido:** cada fotograma se verificó por transcripción
  de su audio (faster-whisper) contra la transcripción oficial de UN Web TV
  y por inspección visual. La línea de tiempo del VOD coincide con la de la
  transcripción oficial (comprobado en 00:00:35, 00:36:42, 01:18:05 y
  01:19:00–01:19:40).

## Método (nota técnica para futuras extracciones)

`ffmpeg -ss` sobre el HLS de Kaltura **no es fiable en este entorno**: varios
intentos cayeron en segmentos equivocados (p. ej. pedir 3890 s devolvió
contenido de 7576 s). Método que sí funcionó: descargar el manifiesto de la
variante 1080p, calcular el número de segmento por tiempo acumulado de
`#EXTINF` (segmentos de 10 s; seg-N empieza en 10N−40 s para N≥5), bajar los
segmentos `.ts` con curl, concatenarlos y extraer el fotograma del archivo
local. No se descargó el vídeo completo en ningún momento.

## Fotogramas entregados

Carpeta: `public/img/real-un/` (gitignored por diseño, como el resto de
`public/*`; los originales se conservan solo en local).

| Archivo | Timestamp VOD | Contenido | Escena del reel (V1.2) |
|---|---|---|---|
| `un-hall-wide.jpg` (+ `-vert`) | 01:18:05 (4685 s) | Plano general del salón con los dos tableros electrónicos mostrando el escrutinio EN CURSO (Item 37 – A/81/L.5, «Voting Started», reloj del tablero 11:18 AM) | **Gancho, Acto 1** (0–6 s): fondo del 130 |
| `un-podium-president.jpg` (+ `-vert`) | 00:00:35 (35 s) | Presidente en la mesa de la presidencia (mármol verde, mazo visible) | **Acto 2** (contadores/caída): fondo alternativo 1 |
| `un-bruno-podium.jpg` (+ `-vert`) | 00:40:10 (2410 s) | Bruno Rodríguez Parrilla, canciller de Cuba, en el podio de la Asamblea presentando la resolución | **Acto 2** (contadores/caída): fondo alternativo 2 |
| `un-voteboard-fullscreen.jpg` (solo horizontal) | 01:19:00 (4740 s) | Gráfico oficial a pantalla completa: «Voting Result — IN FAVOUR 130 / AGAINST 17 / ABSTENTION 25» | **Overlay de evidencia** (Acto 2 o callback): usar como tarjeta/contain, no como fondo cover |
| `un-voteboard-result.jpg` (+ `-vert`) | 01:19:10 (4750 s) | Plano general con los dos tableros mostrando el RESULTADO FINAL 130-17-25; delegados de pie/aplaudiendo | **Callback/cierre, Acto 4** (38–50 s): fondo del 130 estático |
| `un-delegates-after.jpg` (+ `-vert`) | 01:19:30 (4770 s) | Delegados en el hemiciclo justo tras la aprobación (placas visibles: UNITED STATES de pie, TRINIDAD AND TOBAGO, URUGUAY, COLOMBIA, BANGLADESH) | **Cierre/variedad** (Acto 4): segundo fondo del cierre |

- Horizontales: 1920×1080, JPEG q:v 2.
- Verticales (`-vert`): 1080×1920, recorte + escala Lanczos desde el horizontal.
  Zonas de recorte: tableros `x=350–957` (conserva el tablero izquierdo
  completo y legible + emblema + podio); retratos `x=656–1263` (centro).
- `un-voteboard-fullscreen` NO tiene versión vertical: el texto (etiquetas +
  cifras) abarca ~680 px de ancho y ningún recorte 9:16 lo conserva entero.
  Usar como tarjeta horizontal superpuesta o a pantalla completa con fondo
  difuminado.
- El tablero de votación SÍ es visible en el vídeo, dos veces: escrutinio en
  curso (4685 s) y resultado final (4740–4750 s). No hay limitación aquí.

## Alternativas documentadas (no extraídas; segmentos listos)

Por si la V1.2 necesita más variedad, verificadas por transcripción:

| Momento | Timestamp | Contenido | Segmentos HLS |
|---|---|---|---|
| México en el podio | 00:02:10 (130 s) | Representante de México en el podio de mármol verde | segs 16–18 |
| Mesa/podio vacía | 00:36:52 (2212 s) | Plano amplio de la tribuna y la mesa presidencial (Bruno subiendo al podio) | segs 225–227 |
| Delegados, plano amplio | 01:19:40 (4780 s) | Hemiciclo tras la aprobación (STATE OF PALESTINE, TRINIDAD AND TOBAGO, URUGUAY, ARGELIA…) | segs 482–484 |

## Licencia y crédito

- Material audiovisual de la **Organización de las Naciones Unidas** (UN Web TV
  / Biblioteca Audiovisual), © United Nations. No es dominio público ni CC:
  es material informativo oficial de la ONU.
- Uso previsto: **editorial/informativo, no comercial**, por una institución
  pública (Memorial de la Denuncia). Las condiciones generales de un.org
  permiten descargar y copiar materiales para uso personal no comercial sin
  reventa ni redistribución; la práctica habitual para la cobertura de
  sesiones públicas es el uso editorial con crédito.
- **Crédito a incluir al publicar:** «Imágenes: UN Web TV / Naciones Unidas»
  (en la descripción del reel o como rótulo breve).
- Si se quisiera certeza formal para un uso distinto, la Biblioteca
  Audiovisual tiene canal de solicitud de material:
  https://media.un.org/avlibrary/en/contact/request_footage
- Con estos fondos reales, la etiqueta de contenido IA de Meta deja de
  aplicar por los fondos; seguiría aplicando solo si quedara voz de IA o
  algún fondo generado en el montaje final (decisión de la V1.2).

## Limitaciones

- La máxima calidad servida por UN Web TV es 1080p a ~2,66 Mbps: hay
  artefactos de compresión leves en las zonas de público (visibles al
  ampliar). No se ha aplicado upscale artificial más allá del reescalado
  607→1080 px de los recortes verticales (1,78×, aceptable como fondo bajo
  texto/overlays).
- Los recortes verticales de los planos generales conservan UN tablero (el
  izquierdo); el horizontal conserva los dos.
- Los `.ts` y ventanas de trabajo quedaron en `/tmp` (efímeros); los JPG
  finales son los únicos archivos conservados, en `public/img/real-un/`.
