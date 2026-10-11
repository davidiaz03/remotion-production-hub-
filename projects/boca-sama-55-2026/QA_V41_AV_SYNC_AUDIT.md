# V41 — Auditoría iterativa de sincronía y legibilidad · 2026-10-11

**BORRADOR · NO PUBLICAR.**

## Evidencia audiovisual existente
- V39 integral: run `38153873437`, SUCCESS, 1650 fotogramas a 30fps/1080x1920, respaldo en Drive scratch: `boca-sama-v39-FULL-EDITORIAL-DRAFT-NO-PUBLICAR.mp4`. No incorpora la reparación de Nancy.
- V40 Nancy: run `38154816544`, SUCCESS, 90/90 fotogramas, audio AAC, decodificación correcta, 0 pantallazos negros en el tramo. **Pero la verificación de codec, número de fotogramas y fotogramas de contacto no detecta fallos de lipsync**.
- Revisión V39 con 55 muestras visuales (una por segundo) observa secuencia editorial y cierre coherentes pero composiciones verticales con amplias zonas oscuras y algunos créditos pequeños. No equivale a auditar cada fotograma ni sustituye escucha crítica.

## Fallo visual-sonoro real localizado y reparado
- V40 unió voz original extraída desde t=49.080 de la entrevista Nancy con video desde t=49.833333: imagen retrasada **0.753333 segundos**, 22.6 fotogramas aprox. Respecto a la voz.
- V41 cambia `earlySeek` de Nancy a `49.08`, manteniendo `voiceStart=49.08` y `voiceFrames=184`. Carlos permanece sin cambios.
- Recalculada visualización RMS de la voz Nancy con el audio de 6.133333 segundos: **62 bins**, 100ms por bin aproximados; antes se reutilizaban 53 bins de la versión V28, que empezaba a mitad de «sufro».
- Se amplió fuente tipográfica bajo las cifras humanas de 23px a 30px y se elevó a y=1398, manteniendo claro el corredor de subtítulos (y=1500–1645). Validar visualmente en nuevo render.
- Añadida prueba de regresión en `tests/boca-sama-preproduction.test.mjs` que comprueba inicio idéntico audio/video y 62 muestras de la forma de onda.

## Próxima verificación
- Workflow lanzado por commit `dd8ecb2b8920058c5ebc28b2f639d8f488184ab3` → `.github/workflows/boca-sama-v41-sync-qa.yml` con `720-809` (90 frames). Comprobar que realmente se ejecutó antes de afirmar éxito.
- Comprobar visualmente V41 respecto a V40 y escuchar los primeros 2 segundos del testimonio. Un cambio de seek puede encontrar restricciones de velocidad/tiempos en Remotion; si hay fallo, reparar y repetir. Mantener subtítulos `verified:false` hasta cotejo fiable.
- Tras aprobar V41 local, exportar otro **borrador** integral 55s, verificar mezcla EBU R128, créditos, voz, autenticidad y cierre. NO elevarlo a máster oficial.

## Riesgos y límites
- La fuente `Mar y Pesca (1978)` de las cifras y demás datos precisa verificación institucional antes de publicar.
- Derechos de video, narración provisional genérica y música aún no autorizados para publicación.
- PR #7 continúa draft; no fusionar, publicar, ni dar por aprobado el máster automáticamente.
