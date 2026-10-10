# Automatización Android — progreso sin renders

**Estado:** los cambios Android ya están integrados en `main`. La antigua rama de automatización fue una prueba; para proyectos futuros crear rama `work/*` nueva. La selección de `demo` es un ejemplo, no un proyecto activo obligatorio. Leer `docs/PLATFORM_STATUS.md`.

## Uso desde Android

Abrir Codespaces en la rama de trabajo. **Una vez por Codespace**, seleccionar el proyecto desde la terminal con `npm run use -- demo` (o el ID de un proyecto futuro). La selección se guarda **solo dentro de .git**, jamás se publica en GitHub. Comprobar con `npm run active`.

Luego ir a VS Code → Terminal → Run Task. **Las tareas 00 a 05 no preguntan nada**, porque Chrome Android puede quedarse bloqueado en los cuadros de texto de VS Code. Usan el proyecto activo, sin editor paralelo. Para cambiar de documental, ejecutar `npm run use -- documental` una sola vez. **No se selecciona proyecto automáticamente** para evitar guardar el documental equivocado.

| Acción | Comando |
|---|---|
| Abrir Studio | `npm run open -- demo` |
| Guardar progreso remoto | `npm run save -- demo --note "Escenas ajustadas"` |
| Consultar estado | `npm run status -- demo` |
| Reintentar solo la publicación tras fallo | `npm run publish -- demo` |
| Recuperar en modo seguro | `npm run recover -- demo --revision demo-cut-002` |
| Recuperar en worktree separado | `npm run recover -- demo --revision demo-cut-002 --execute` |
| Crear proyecto a partir de plantilla | `npm run create -- nuevo-proyecto` |

Se acepta tanto `npm run studio -- demo` como `npm run studio -- --project demo`. El archivo abierto se guarda automáticamente en VS Code, **pero solo `save` genera commits y comprueba GitHub**.

**Evidencia 2026-10-10:** la primera ejecución de `npm run save -- demo --note "Prueba de guardado desde Android"` devolvió `status: saved` y `verifiedRemoteSha: 51131c38f8b1a169b225caeab15d2da66e8ee693`. Los archivos editables, `STATE.json`, `HANDOFF.md`, `PROJECTS.json` y el snapshot quedaron confirmados en GitHub. Tras guardar, `git status --short` no mostró cambios y `npm run status -- demo` informó `dirty: []`, `pendingCheckpoint: null`. Las 14 pruebas locales en Codespaces pasaron.

**Advertencia:** 06 Crear proyecto y 07 Aprobar siguen siendo tareas avanzadas con cuadros de texto; desde Android usar en su lugar la terminal para operaciones que requieren entrada específica. Nunca aprobar por defecto.

### Higiene de Codespaces y renders

No lanzar renders por cada modificación: utilizar Studio, previews de hasta 90 fotogramas y aprobación explícita para máster. El repositorio limita a un render concurrente global. Después de guardar evidencia, limpiar solo `out/` del proyecto mediante `node scripts/cleanup.mjs --project <id> --execute` y detener Codespaces. Nunca borrar assets, fuentes, revisiones o másteres Drive. Ver `docs/RENDER_RESOURCE_POLICY.md`.

### Protocolo de guardado

`save` valida el proyecto, rechaza cambios de otros proyectos o de revisiones históricas, comprueba que estás en una rama `work/*`, comprueba el repositorio remoto oficial y verifica que la rama remota es ancestro local. Registra primero el commit de código, luego crea un snapshot con SHA exacto y estado *en revisión*, actualiza `PROJECTS.json`, `STATE.json` y `HANDOFF.md`, registra el segundo commit y hace push normal. Confirma finalmente que el SHA remoto coincide. **No renderiza ni aprueba**. Si falla el push, los commits quedan locales: reintenta con `publish`, no crees otro checkpoint. La versión reforzada además deja un diario privado en Git para reanudar interrupciones entre las dos fases de commit. No elimina el riesgo de perder cambios que **nunca** llegaron a publicarse si se destruye el Codespace.

La creación de un proyecto registra su identidad en el índice y genera estructura editable con la plantilla actual. La carpeta correspondiente de Google Drive aún requiere aprovisionamiento separado. El comando `open` rechaza assets faltantes: hay que obtener recursos desde Drive antes de previsualizar. Los ZIP originales y los másteres no se borran.

### Aprobación y exportación

Solo una persona autorizada puede aprobar una revisión; el comando `approve` requiere `--confirm APROBAR-REVISION` y verifica el snapshot. Los workflows de render continúan manuales; un máster exige una revisión aprobada y copia autenticada a Drive. No hay render por guardado.

### Estado verificado

GitHub contiene una prueba exitosa de 59 fotogramas en Actions y las dos revisiones manuales de demo. La primera batería local de seguridad del nuevo orquestador pasa 4/4. El primer checkpoint real y su SHA remoto ya fueron verificados. Tareas 00/03/04 sin diálogo verificadas en Android. Recuperación de tres revisiones demostrada en clon Git independiente (Actions `38074798345`). Drive lectura y escritura pequeña verificadas. **Faltan entrega de máster audiovisual y credenciales Drive propias del Codespace.** Codespaces no se detiene por este script: configura tiempo de inactividad en GitHub y usa Stop codespace en Android.

## Recuperación entre chats

Revisar rama remota, `PROJECTS.json`, `projects/<id>/STATE.json`, `HANDOFF.md`, los archivos `revisions/` y `approvals/`. No suponer que `main` es la rama más reciente ni reconstruir desde MP4. Comprobar SHAs y recursos.
