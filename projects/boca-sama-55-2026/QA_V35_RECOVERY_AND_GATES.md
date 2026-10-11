# V35 — continuidad verificable y auditoría de los frentes (11 octubre 2026)
**BORRADOR · NO PUBLICAR · NO MÁSTER.** Esta nota no sustituye los archivos V34 ni cambia la aprobación editorial.

## Evidencia comprobada
- PR #7: https://github.com/davidiaz03/remotion-production-hub-/pull/7 ; rama `work/boca-sama-55-2026-research`.
- V34, run https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38144572527 : 70 fotogramas 180–249 (2,33 s), 1080x1920, AAC, sin pantallazos negros inesperados. Voz presente; el fragmento NO valida dicción de 15,4 segundos ni mezcla final.
- SHA de V34 probada: `d67f37c51c7774f3ff8b1471b5f2f2dcbf920f66`. CI previa de checkpoint `7b3680b7` aprobada: run 38144900015.
- El cierre oficial procede de un MP4 original y el frame final recortado con transparencia se utiliza como marca de agua. No sustituir por logo generado.
- Nancy y Carlos tienen WAV auténticos V28 archivados y hasheados; subtítulos provisionales `verified:false`. Nunca activar sin escucha/cotejo.

## Whisper — cambio técnico V35
- Se añadió disparador `push` solo para cambios de `.github/workflows/boca-sama-remotion-whisper.yml` en esta rama; sigue `workflow_dispatch` para uso manual.
- En evento push, test por defecto **Nancy + base**, no ambos testigos; timeout reducido a 22 minutos. Sin cambio de voces, audio original, subtítulos ni archivos publicados.
- **No hay resultado ASR confirmado**. Consultar Actions del commit `fe2266df5a870d2658bda9e4a5fe37c303d7ea9b`; al comprobar inicialmente no se devolvieron runs de ese SHA. Un workflow que solo vive en una rama puede no ser ejecutable automáticamente según GitHub, comprobar antes de declarar éxito. No fusionar main solo para dispararlo sin autorización.
- Si existe ejecución, revisar fallos de prerrequisitos (Drive, instalación, modelo), duración real y artefacto UNVERIFIED antes de habilitar Carlos; jamás aplicar `verified:true` automáticamente.

## Voz original de HeyGen — diagnóstico de persistencia
- El código `src/Video.tsx` incluye la URL correcta de la locución remota usada solo para vista previa, V34 (15,438 s), frames 180–644.
- La URL reproducida en el informe `QA_V34_TEMP_VOICE_AND_NEXT_RENDER.md` diverge de la del código. **Usar el código como referencia para recuperación, no copiar la URL incompleta del informe.**
- La cuenta HeyGen conectada NO identificó el WAV como asset consultable por IDs extraídos de esa URL (404), y el entorno de trabajo no tiene salida DNS hacia HeyGen para descargarlo. **No hay nuevo WAV local, ni respaldo en Drive, ni hash verificable** en esta revisión. No volver a generar voz con créditos.
- Prioridad: recuperar el mismo WAV desde un entorno autorizado con acceso; medir tamaño/duración/codec/SHA256; subirlo a `Remotion Production/projects/boca-sama-55-2026/assets/` y añadirlo al manifiesto solo DESPUÉS de comprobar bytes y checksum. Entonces sustituir la URL por `staticFile(...)`.

## Auditoría editorial: posiciones reales y puntos de revisión
- Timeline 1650 frames/30fps: apertura 0–131, mapa 120–311, historia 300–521, consecuencias 510–731; Nancy 720–1019, Carlos 1020–1289, memoria 1290–1469, logo 1470–1649.
- Locución provisional 180–644, termina antes del testimonio Nancy. Cama de música se atenúa durante voz (frames cercanos a 168–655), pero no existe medida de sonoridad integral de los 55s.
- Testimonios: Nancy WAV empieza en el frame local 0 de escena (global 720), 159 frames hasta global ~879; Carlos 252 frames desde global 1020 a ~1272. Rótulos de voz/onda salen antes de cortes respectivos.
- Subtítulos: track sin fondo rectangular, 46 px, zona segura y=1500–1645; los 6 cues V28 siguen desactivados. Verificar una a una las palabras originales, fracciones de frase y desfase antes de activarlos.
- Punto visual pendiente: parte inferior muy oscura en el mapa; mejorar sin inventar geografía ni desplazar captions.
- No se ha renderizado la pieza integral ni escuchado toda la narración; no certificar títulos, pronunciación Samá/Banes/Holguín, enlaces musicales, fotogramas del cierre ni derechos de archivo.
- Los tres videos de Hacemos Cuba 2026 no sirven como imágenes de ataque 1971 salvo identificación documental específica.

## Próximos pasos sin gastos
1. Comprobar aparición real de job Whisper; si no arranca, diagnosticar disponibilidad del workflow en la rama y utilizar mecanismo de ejecución ya autorizado, sin fusionar el PR.
2. Recobrar WAV ya generado (no regenerar), guardarlo con SHA256 y usar referencia local en Remotion.
3. Leer JSON Whisper **si lo produce**; cotejar palabra por palabra con entrevistas y Gemini, activando solo fragmentos literales con autorización.
4. Efectuar previews segmentadas necesarias (sin repetir los tramos aprobados); auditar especialmente el final de Nancy, voz de Carlos y cierre 49–55s.
5. Planificar revisión visual y mezcla de los 55s con storyboard/contact sheet y medición integral; entrega final solo tras aprobación, derechos y control de gastos.
