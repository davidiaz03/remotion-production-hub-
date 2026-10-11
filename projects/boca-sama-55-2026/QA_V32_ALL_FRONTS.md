# V32 · Auditoría multidisciplinar y controles de producción (BORRADOR · NO PUBLICAR)

## Ejecución comprobada
- La preview nativa V30 de Carlos→monumento, run 38141945427, fue 71/71 frames Full HD; diagnóstico de entrada demasiado oscura. ZIP y reportes conservados en Drive 1WRQqACkTjdSjd8FApVZGxO0vi0_FIErR.
- V31 redujo la entrada del documento a 9 frames. CI del SHA 7b3154fe aprobada, run 38142369938, pero V31 *no tiene render nativo*; no confundir pruebas de código con validación visual.
- V32 reduce tipo de subtítulos a 46px con salto de palabra y divide las frases más largas de Carlos en bloques móviles. **Todos conservan verified:false**. Ninguna palabra dudosa se publica ni aparece en el render.

## Narración de IA provisional: realidad y coste
La voz cubana Microsoft es-CU-BelkysNeural está identificada junto con Manuel; se preparó el workflow `.github/workflows/boca-sama-azure-cuban-voice.yml` manual con secreto AZURE_SPEECH_KEY/REGION. NO HAY WAV GENERADO NI CLAVE VERIFICADA. La conexión Microsoft Outlook NO es Azure TTS. Se consultaron alternativas conectadas (vidIQ: 14 créditos/1000 caracteres, 21 voces listadas sin español cubano identificado; Runway cobra créditos también): rechazadas por costo y fidelidad local. No generar audio de pago ni asumir nivel gratuito.
Advertencia: GitHub workflow_dispatch puede no mostrarse/activarse en UI hasta que exista una versión de este workflow en la rama por defecto, y no se debe fusionar `main` automáticamente. El flujo Azure permanecerá reservado a uso autorizado.

## Integración una vez exista WAV probado
- Comprobar origen, timbre, pronunciación de «Boca de Samá», «Banes», «Holguín», duración, pico y ruido.
- Registrar audio con `asset-manifest.json` (SHA/bytes) en Drive; incorporar en Remotion solo dentro de 4–24s, bajando `Weight of Memory` bajo la VO, sin pisar Nancy 24–29.3s ni Carlos 34–42.4s.
- Script provisional documentado en `VOICEOVER_CUBAN_MICROSOFT_PROVISIONAL.md`. No presentarlo como voz de testigo ni como narrador institucional auténtico.
- Las cifras de víctimas deben cotejarse editorialmente antes de publicar. La procedencia de imágenes y material 2026 `Hacemos Cuba` continúa diferenciada.

## Gates abiertos
(1) comprobar visualmente V31/32; (2) escuchar/cotejar citas completas de Nancy y Carlos, no solo Gemini; (3) voz provisional cubana realmente generada y autorizada o sustituir por equipo Memorial; (4) subtítulos exactos sin fondo sobre Android; (5) permiso derechos y score; (6) prueba editorial integral 1650 frames y cierre completo 49–55s; (7) aprobación institucional y exportación de máster separada.
