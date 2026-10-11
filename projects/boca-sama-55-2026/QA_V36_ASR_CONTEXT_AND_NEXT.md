# V36 — corrección verificable de contexto ASR y siguientes comprobaciones
**BORRADOR / NO PUBLICAR — 2026-10-11**

- Estado PR #7 y rama `work/boca-sama-55-2026-research`, máster NO aprobado.
- GitHub Actions CI del checkpoint V35 `4938a0d` llegó a SUCCESS en run `38145639358`. El run previo `38145610254` fue CANCELLED por nueva ejecución (no evidencia de prueba fallida).
- Código ASR: antes Nancy tenía ventana original t50–75 s, mientras que el propio corte seleccionado empieza t49.833333. Era imposible analizar completamente el inicio, y las primeras palabras podían quedar fuera. **Corregido a ventana t47–72s**; el clip seleccionado 49.833333–55.133333 ahora está íntegro en contexto.
- Añadida aserción del guion para que futuras ventanas contengan todo el intervalo seleccionado; añadido error explícito si Whisper devuelve cero captions.
- El flujo Whisper dispone de activación en rama mediante modificación propia y de `workflow_dispatch`, pero **ningún resultado de transcripción ha sido validado todavía**. Los subtítulos permanecen `verified:false`, no representar como citas aprobadas.
- En la última lectura GitHub la rama tenía V35, nueva modificación ASR `0dcc21fae735ad1557a3a0d5c84ba29d1ccf47e2`; revalidar CI tras este cambio. No se ha ejecutado render ni consumido créditos de generación.
- HeyGen V34 sigue usando URL remota sin WAV SHA-pinned; no aprobar máster si se depende de ella. Priorizar preservar el audio original, no generar otro.
- La prueba de V34 contiene 70 frames, no revisión integral de locución ni del reel; la zona oscura del mapa, la mezcla musical, derechos, exactitud de transcripciones, pronunciación Samá/Banes y último cierre siguen pendientes.

## Plan de reanudación
1. Comprobar CI de `0dcc21f`. Diagnosticar por qué no apareció job Whisper en rama; no declarar ASR terminado sin JSON y escucha humana.
2. Recuperar WAV de narración ya generado, verificar ffprobe y SHA256 y subir sin sobrescribir material fuente.
3. Ejecutar contexto de 25s Nancy, luego Carlos si procede; comparar con originales, usar captions `verified:true` únicamente tras comprobación.
4. Auditar segmentos finales de testimonios y secuencia de 49–55s mediante preview nativa, no alterar logo oficial.
5. Preparar QA de 1650 fotogramas con mezcla y subtítulos sin fondo; requiere autorización editorial para master definitivo.
