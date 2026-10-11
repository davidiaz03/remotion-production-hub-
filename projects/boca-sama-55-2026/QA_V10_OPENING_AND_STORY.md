# V10 — Dirección, guion y auditoría de apertura (no máster)
## Auditoría previa
El primer render nativo de V09 (GitHub Actions 38103024742) fue técnicamente correcto (90/90 frames, 1080×1920, sonido, sin negro absoluto). Auditoría visual: metraje reducido a franja horizontal en altura 335 y gran vacío oscuro bajo el título; poco uso del espacio móvil. CI posterior de V09 llegó a SUCCESS en 38103330457. Este hecho NO certifica estética ni render de V10.

## Decisiones V10 implementadas en Remotion
- Apertura: misma imagen real de costa, ahora dos capas sincronizadas: fondo de fotograma extraído t≈4,5s del reportaje `Aniversario_52...` desenfocado/oscurito, más ventana 16:9 original intacta. Se anima el fondo de forma tenue, título único y corto.
- Se sustituye texto repetitivo por jerarquía estricta: fecha de referencia, título «BOCA DE SAMÁ», una sola frase («Un lugar. Una historia que permanece.») y línea de localización CUBA/HOLGUÍN/BANES.
- `GeographicIndex` es secuencia tipográfica editorial NO ruta militar ni coordenada inventada.
- Fotos del poblado, retratos y homenaje ahora se muestran como documentos físicos con sombra y leves movimientos, deliberadamente distintas a los testimonios. No se simula que esas fotos sean fotografías directas del ataque.
- Nueva still de costa generada exclusivamente por extracción ffmpeg, original intacto; SHA-256 y longitud en asset-manifest. Drive: https://drive.google.com/file/d/1O87P6lhdGDnHGIJo04LqBscluSy8A6Kd/view
- `CaptionTrack` continúa vacío hasta contar con narración real o citas verificadas, para no falsificar subtítulos. Sin fondos ni rectángulos; 50px, max 2 líneas, protección de UI 9:16. La adaptación al guion de voz requiere calibración con grabación definitiva.

## Guion de escenas (se mantiene)
0-4 costa y apertura; 4-10 localización regional; 10-17 archivo del poblado y fecha; 17-24 consecuencias humanas; 24-34 testimonio Nancy; 34-43 testimonio Carlos; 43-49 monumento actual; 49-55 cierre pendiente de logos originales. 1650 frames a 30 fps, 1080×1920, vertical.
**Problema editorial aún abierto:** falta grabación, los testimonios todavía están silenciados, los nombres de víctimas no están cotejados y logo/animación oficial original no está localizado. No aprobar publicación.

## Impacto vs rigor
Tres pilares de retención: hecho con fecha muy temprana; contraste geográfico→huella humana; alternancia de escala y espacio negativo controlado. No se puede prometer viralidad sin métricas. No usar explosiones falsas ni sonidos de víctimas inventados. Manual Memorial (2012): rojo #ED1C24, negro #000, gris #77787B y Amplitude Condensed (sin redistribución de fuentes). Su logo sobre imágenes exige área corporativa y zona de seguridad; no generarlo mediante IA.

## QA siguiente
1. Esperar CI de V10. Es CI de código, NO prueba visual.
2. El usuario puede ejecutar la próxima preview manual 0–89 solo si la V10 está estabilizada; nunca master ni render full sin aprobación.
3. Inspeccionar captura real Remotion: posición de archivo y fondo, título, contraste, longitud de logo pendiente, fuente y ausencia de fallos de assets. Si hay errores, corregir código y volver a comprobar.
4. Reemplazar subtítulos placeholder solo tras transcripción y ajuste palabra a palabra.
