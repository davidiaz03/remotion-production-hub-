# V46 · Auditoría V44 integral y pista de revisión de subtítulos
**11 octubre 2026 · INTERNO / NO PUBLICAR**

## V44, resultado contrastado
- Segundo intento V44: GitHub run **38161262601**, SUCCESS; primer intento 38161084428 falló debido a `yuv440p` accidental, resuelto mediante `yuv420p`. No confundir ambas ejecuciones.
- MP4 Drive scratch: `boca-sama-v44-FULL-EDITORIAL-DRAFT-NO-PUBLICAR.mp4`, ID `1hIBPkKp9yJ8t7nT9Ek_xgqcbbKKdYmZR`; 12,731,218 bytes.
- FFprobe local: 1080×1920, H264, 1650 frames, 30fps, AAC, contenedor de 55.061333 s.
- Auditoría de imagen real: dos series, V42 y V44, con muestras cada 2s y extracción densa alrededor del fotograma 1290. La transición defectuosa del segundo 43 ya no cae a negro.
- Luminancia ROI común t=43.000s, misma extracción de imágenes a 540px de ancho: V42=9.15, V44=94.87 (V42 1289=94.89, V44 1289=94.83). Esto confirma continuidad de la composición antes del fundido a memoria.
- Luminancia ROI a 1302: V42=94.29, V44=94.35. Transición técnicamente reparada.
- FFmpeg EBU R128 medido en MP4 V44 integral: -18.2 LUFS, LRA=18.7 LU y true peak=-3.6 dBFS. Fragmentos de audio V42 y V44 iguales en cifras a precisión 0.1: narradora -16.6 LUFS, Nancy -19.1 y Carlos -18.7. Ningún motivo cuantitativo para seguir aumentando la voz.
- Silencedetect < -45dB por 0.65s detectó solamente silencio desde ~53.988 hasta 55.061s: comprobar editorialmente si es cierre intencional del logo, sin añadir audio automáticamente.
- El muestreo visual de escenas confirma progresión editorial, no implica revisión o aprobación literal de los 1650 fotogramas.

## Subtítulos
- Hasta V45 los seis bloques temporales siguen `verified:false`; nunca aparecen en la composición `MainReel`.
- V46 añade composición independiente `CaptionReviewReel`, que dibuja el texto sin fondo con el rótulo visible `SOLO REVISIÓN · CITAS SIN VERIFICAR`. Esta vista sirve para revisar tamaño, cortes y legibilidad, no para publicar.
- Workflow `.github/workflows/boca-sama-v46-caption-review.yml`: run `38163081653` lanzado para 720–809 Nancy y 1020–1109 Carlos. **Sin ejecución final confirmada al redactar**. Revisar sus artefactos y el resultado de la CI antes de asumir éxito.
- Texto candidato de Nancy y Carlos necesita cotejo literal auditivo con los archivos originales (el reconocimiento Whisper segmenta voces y palabras); no activar las líneas a `verified:true` sin ello.
- No realizar cambios de máster institucional sin autorización editorial ni verificar todos los datos/autoría/derechos.

## Próxima iteración
1. Revisar resultado exacto del job V46, su QA visual, y corregir desbordes o solapamientos.
2. Guardar los previews de revisión en Drive scratch (no se deben confundir con videos aprobados).
3. Priorizar verificación literal y de derechos, fuente histórica y tipografía. Entregar texto ya contrastado antes de generar otro master.
4. Mantener PR #7 como draft, `approvedRevision:null` y narración IA como provisional.
