# Higiene de renders, archivos temporales y límites de GitHub

Norma global de infraestructura para todos los proyectos. **Minimizar consumo y basura; nunca intentar eludir ni sortear restricciones de GitHub**. Estas medidas reducen riesgo, pero no garantizan cuota infinita ni inmunidad a controles de uso de GitHub.

## Restricciones técnicas reales

- Renders **solo manuales**: guardar fuentes/checkpoints y ejecutar tests de código no genera video.
- Workflow reutilizable con **grupo de concurrencia global por repositorio** `remotion-render-${{ github.repository }}`, `cancel-in-progress: false`: máximo UN job de render activo en el repositorio, sin cortar un máster por lanzar una preview. La semántica estándar de GitHub puede reemplazar una ejecución **pendiente** por otra más reciente; el asistente debe vigilar la cola, no prometer FIFO completo ni una cola infinita.
- Previews limitadas a **1–90 frames** y `timeout-minutes` bajo; másteres solo con revisión aprobada, confirmación humana, permisos Drive y QA.
- Usar runners Ubuntu estándar cuando GitHub y sus condiciones lo permitan. Comprobar minutos/billing en la cuenta, límites de Codespaces y caché/almacenamiento antes de varios renders: **no prometer coste cero**.
- `actions/upload-artifact` retiene previews, QA y rescates de emergencia durante **1 día**. Los logs de runs y cachés tienen políticas independientes administradas por GitHub: revisar/ajustar en Settings → Actions y eliminar manualmente lo obsoleto desde su interfaz cuando sea seguro. El workflow no borra logs/historial global ni caches indiscriminadamente.

## Gestión de material

**Git:** solo TSX, manifest SHA-256 y metadatos. No añadir MP4, ZIP originales, medios con derechos restringidos, tokens ni credenciales a un repositorio público.

**Drive:** originales `assets/`, másteres aprobados `masters/` e informes `qa/` conservados. Nunca usar `rclone sync` destructivo ni borrados silenciosos. Archivos de trabajo `scratch/` se revisan antes de purgar, no borrarlos por rutina si hay evidencias pendientes.

**Codespaces/runner:** recursos descargados `public/`, outputs `out/`, cachés y reportes `reports/` solo se consideran temporales cuando hay copia persistente de lo que se necesita. El script `scripts/cleanup.mjs` es DRY RUN por defecto; ejecución requiere `--project <id>` y solo elimina `projects/<id>/out/`. Con `--reports` se pueden eliminar informes temporales explícitamente, **solo si ya están publicados/verificados**. La cache general `.cache` no se purga en operaciones por proyecto.

**GitHub Actions:** primero se publica artifact / verifica subida del máster; luego se elimina temporal local de ese proyecto. En caso de fallo, el runner hospedado suele ser efímero y se destruye al terminar; no hay autorización para borrar el material persistente de Drive. Para recuperar salida de una entrega fallida, usar artifact de rescate antes de limpieza del runner; revisar que exista.

## Rutina preventiva para el asistente

1. Antes de preview/full: revisar necesidad creativa, `workflow_dispatch` real, límites de frames, duplicados, ejecuciones running/pending y costes posibles. Preferir Studio y previews breves, reutilizar previews/QA si la fuente no cambió.
2. Durante: jamás crear bucles de renders, tareas horarias sin permiso o lanzar muchas ramas a renderizar en paralelo. Monitorizar estado y abortar rendiciones inútiles mediante controles normales.
3. Después: comprobar artifact/QA y ruta Drive, luego limpieza acotada al proyecto y apagar Codespace. Conservar commit, brief, aprobaciones y hashes.
4. Periodicamente: inspeccionar Actions runs/artifacts, Actions caches y Codespaces (tiempo de inactividad), usando controles oficiales para reducir restos. Limpiar historia/cache **solo** con revisión y permiso si pudiera afectar evidencia o recuperación.
5. Si GitHub impone un límite o restricción: detener operaciones afectadas, informar y regularizar por los canales normales. Nunca proponer evasión.

## Comandos seguros

Vista previa de destinos (no borra): `node scripts/cleanup.mjs --project mi-reel`.

Solo tras QA/copia persistente verificada: `node scripts/cleanup.mjs --project mi-reel --execute`.

Opcional y explícito, para informes regenerables: `node scripts/cleanup.mjs --project mi-reel --reports --execute`.

Sin `--project`, el script solo permite auditoría DRY RUN de todos los proyectos. La ejecución global de limpieza queda bloqueada por seguridad.
