# Próxima validación integral de Remotion — PROTOCOLO

Propósito: comprobar de extremo a extremo un video NUEVO y desechable, no retomar proyectos de prueba anteriores. No declarar resultados adelantados.

## Preparación

- Utilizar un ID y rama `work/*` nuevos; crear estructura desde plantilla.
- Un clip de pocos segundos, gráficos animados, transición y pista corta de audio con derechos autorizados, 9:16.
- Medios en `Remotion Production/projects/<id>/assets/`, tamaños y SHA-256 en el manifiesto.
- No almacenar MP4 institucionales ni secretos en GitHub público. Controlar cuotas y no generar materiales innecesarios.

## Puertas de aceptación

| Etapa | Evidencia necesaria |
|---|---|
| A. Crear proyecto | TSX/config/STATE/HANDOFF y PROJECTS.json coherentes; ningún otro proyecto alterado |
| B. Recursos Drive | Descarga por rclone del archivo exacto, tamaño y SHA-256 iguales |
| C. Edición | Studio abre; cambios TSX guardados y SHA GitHub verificado |
| D. Recuperación | Versión recuperada en entorno separado sin sobrescribir el origen |
| E. Preview | Run nativo Remotion, MP4/artifact y QA; revisar visualmente y audio |
| F. Aprobación | Confirmación humana y revisión/source commit identificados |
| G. Máster | Exportación manual aprobada, frames/FPS/audio/duración/decodificación y report QA comprobados |
| H. Entrega Drive | Master presente en `masters/`, bytes y SHA-256 coincidentes con la fuente |
| I. Transferencia a futuros trabajos | Manual universal actualizado con fallos corregidos; proyecto piloto no pasa a ser encargo futuro |

## Restricciones

Primero ejecutar A-E con costes mínimos. **No ejecutar F-H sin aprobación expresa**. Abortamos en caso de errores de credenciales, archivos ausentes, hashes distintos, facturación imprevista o salida sin revisión. Mantener originales y versiones sin borrar.

**Importante:** la prueba positiva de escritura de 104 bytes ([Actions 38085770087](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38085770087)) NO acredita aún entrega de un máster.
