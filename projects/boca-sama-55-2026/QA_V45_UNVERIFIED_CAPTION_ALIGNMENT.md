# V45 — reajuste temporal de subtítulos candidatos. NO PUBLICAR
**11 octubre 2026 | No hay habilitación de subtítulos.**

Todos los registros de `src/TestimonyCaptionsV28.ts` mantienen `verified:false`. `CaptionTrack` de Editorial.tsx muestra exclusivamente `verified:true`. Ajustar timecodes en V45 **no produce subtítulos en el video**; establece una línea de tiempo revisable.

## Nancy Pavón
Fuente auténtica entrevista 2011 y sonido restaurado V40 recortado desde 49.080s (frame global 720). Whisper V37 analizó t=47–72 y devolvió 62 tokens en la ventana completa. El token «suf» empieza t=49.110 y «ro» termina t=49.880; el corte viejo t=49.833 mutilaba el inicio. «eso» termina 51.960 y la segunda oración acaba hacia 55.000.

| Frases de borrador, pendientes de cotejo | Frames provisionales en 30fps |
| --- | --- |
| Sufro mucho todavía por eso. | 721–807 |
| Porque nunca he tenido felicidad. | 808–899 |

## Carlos Escalante
Fuente entrevista de archivo, corte de voz t=203.633333 (frame global 1020), 8.4 segundos. Whisper V39 base generó 105 tokens, con 31 dentro del corte seleccionado. La ASR contiene errores de segmentación como `sig-o` en la frase final; no tomar texto de la IA como literal sin verificación humana.

| Frases de borrador, pendientes de cotejo | Frames provisionales en 30fps |
| --- | --- |
| Desde el suelo, pues, | 1030–1057 |
| continué combatiendo, | 1058–1109 |
| sin percatarme que los compañeros | 1110–1182 |
| que andaban conmigo habían sido asesinados. | 1183–1267 |

## Límites
- Transcripciones no verificadas por escucha minuciosa; la puntuación/composición puede no reflejar exactamente palabras, pausas ni variantes dialectales.
- Ningún término escrito se atribuye institucionalmente a sobrevivientes sin cotejo con audio original, permiso y revisión editorial.
- Conservar la estética oficial: sin rectángulo opaco, zona de subtítulos y=1500–1645, no superponer al waveform y rótulo.
- Los subtítulos finales deberían dividirse por grupos legibles de máximo dos líneas y sincronizarse al habla; la segmentación anterior es provisional.

## En curso
V44 render 55s `38161262601` fue lanzado tras corregir en el workflow un `yuv440p` accidental (Remotion H264 exige `yuv420p`). El primer intento `38161084428` falló por pixel format ANTES de codificar el video: **no implicó defecto del TSX ni de los originales**.
