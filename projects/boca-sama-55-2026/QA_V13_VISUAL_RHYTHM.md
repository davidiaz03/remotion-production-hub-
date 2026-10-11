# V13 — Auditoría documental de ritmo y medios (borrador NO PUBLICAR)

Revisión de 3 fuentes (reportaje 52 aniversario, documental del monumento y Muerte en Boca) con 47 fotogramas adicionales seleccionados en el tiempo. El clip del monumento muestra testimonios, lugar físico, monumento, edificios y costa.

## Cambio ejecutado
En `src/Video.tsx` cada testigo entra como rostro, y pasa después a B-roll procedente del **mismo documental**: Nancy 255–261.5 s y detalle del monumento ~324.6; Carlos 89–95 s y material local ~354.7; remate de memoria alterna monumento ~324.6 y reportaje del 52 aniversario ~109.4. Los segundos de entrada son decisiones visuales **no cortes de audio validados**. Fuente de imagen y contexto NO atribuidos a cámara de 1971.
La presentación mantiene una sola identificación nominal por testigo, sin narración inventada. Material fuente en mute a la espera de citas auténticas y permisos.
El manifiesto `asset-manifest.json` se reduce de 11 a 7 medios usados efectivamente (sin eliminar ni modificar material en Drive).
Audio musical continuo hasta locución real; subtítulos permanecen vacíos por exactitud editorial.

## Advertencia técnica
Pruebas automáticas GitHub no prueban la decodificación de cada transición ni los frames posteriores al 89. El render previo fue V09, 0-89. Para comprobar transiciones V13 priorizar preview manual 113-175. También deberá auditarse en una vista posterior el montaje de testimonios (cambio interno Nancy cerca de frame 915). Ningún máster aprobado.
La duración de cada `OffthreadVideo trimBefore` usa frames de COMPOSICIÓN a 30 fps como requiere Remotion, no frames del origen de 25/24 fps. Audio original silenciado; los fotogramas del material deben revisarse tras render por diferencias de tasa.
