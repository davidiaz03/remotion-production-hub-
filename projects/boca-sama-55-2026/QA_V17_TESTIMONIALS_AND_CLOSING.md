# V17 — Auditoría de testimonios y cierre · 10 octubre 2026
Estado: código corregido, NO hay render V17. Producción vertical 1080×1920 y 1650 frames (55s).

## Verificaciones nuevas
Se examinaron directamente fotogramas de `Boca_de_Samá,_monumento_contra_el_terrorismo_en_Cuba(360p).mp4`, fuente de 640×360, en los tiempos Nancy 252–262s, B-roll Nancy 323–332s, Carlos 87–96s, B-roll Carlos 352–362s y bloque de memoria 361–371s. Se examinó además reportaje aniversario 106–118s. Hoja de contacto de 6 series archivada en sesión de trabajo. Este muestreo es **visual**, no transcripción ni permiso para reutilizar audio.
Nancy y Carlos visualmente identificables, fuente de apoyo contiene monumento, pueblo y costa. El tramo alrededor de 365s pasa a cartela del cierre de la **Agencia Cubana de Noticias**: riesgo crítico de incluir logo/colofón de tercero. Se eliminó el comienzo `362.3` del plano final y ahora se usa `350.5` por ~3.9s; debe comprobarse aún en render para descartar rótulos o saltos.
El resto de archivos fuente siguen sin cambios en Drive.

## Validación verificable vs no verificada
CI de V16 completó SUCCESS en workflow 38105413045; no valida contenido. Primer render nativo 0–89 frames V09: éxito; segunda transición 113–175 V14: éxito técnico con barrido visual deficiente; tercera 110–152 V15: éxito y mejora validada. **No existe render del bloque Nancy/Carlos ni de V17.**
El audio de los originales continúa muteado en Remotion: no se puede afirmar que esté integrado el testimonio. No inventar la transcripción. Subtítulos vacíos hasta sincronización de voz real. Logo animado original y su fotograma final exacto para watermark siguen pendientes, no suplir con IA.

## Próxima prueba de máximo valor
Preview manual `861-929` (69 frames, incluye cambio interno de Nancy alrededor de frame 870, no 915; V14 modificó `portraitFrames=150` y empieza Nancy en global frame 720). Alternativa: `1451-1510` para probar el final y confirmar ausencia de cartela de Agencia Cubana de Noticias. No lanzar varias a la vez. Ejecutar siempre sobre la rama actual y revisión vacía; comprobar artifacts y QA.
**Corrección importante:** el cambio interno actual de Nancy es en el frame **870**, no 915 como registraban handoffs antiguos. Carlos: frame **1200**, porque empieza frame 1020 y `portraitFrames=180`. Mantener estos tiempos actualizados en siguientes planes.

## Dirección visual
Archivo horizontal dentro de canvas vertical, sin deformación agresiva. Los encuadres dentro de ventana no prueban autenticidad de cámara de 1971. No usar transiciones espectaculares durante testimonios sin criterio semántico, ni logos de otra institución al cierre. Retención será hipótesis hasta disponer de métricas, no promesa.
