# Automatización Android — progreso sin renders

**Rama de desarrollo:** `work/hub-android-automation-20261010`. Se creó desde `work/demo-android-persistence-20261010` en commit `d462ef7522b7a216787db2e006de51940693fe44`, conservando `demo-cut-001` y `demo-cut-002` **sin aprobaciones**.

## Uso desde Android

Abrir Codespaces en la rama de trabajo, VS Code → Terminal → Run Task. Las tareas numeradas llaman exactamente a los scripts del proyecto, no a un editor paralelo.

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

### Protocolo de guardado

`save` valida el proyecto, rechaza cambios de otros proyectos o de revisiones históricas, comprueba que estás en una rama `work/*`, comprueba el repositorio remoto oficial y verifica que la rama remota es ancestro local. Registra primero el commit de código, luego crea un snapshot con SHA exacto y estado *en revisión*, actualiza `PROJECTS.json`, `STATE.json` y `HANDOFF.md`, registra el segundo commit y hace push normal. Confirma finalmente que el SHA remoto coincide. **No renderiza ni aprueba**. Si falla push, ambos commits quedan locales: reintenta con `publish`, no repitas `save`.

La creación de un proyecto registra su identidad en el índice y genera estructura editable con la plantilla actual. La carpeta correspondiente de Google Drive aún requiere aprovisionamiento separado. El comando `open` rechaza assets faltantes: hay que obtener recursos desde Drive antes de previsualizar. Los ZIP originales y los másteres no se borran.

### Aprobación y exportación

Solo una persona autorizada puede aprobar una revisión; el comando `approve` requiere `--confirm APROBAR-REVISION` y verifica el snapshot. Los workflows de render continúan manuales; un máster exige una revisión aprobada y copia autenticada a Drive. No hay render por guardado.

### Estado verificado

GitHub contiene una prueba exitosa de 59 fotogramas en Actions y las dos revisiones manuales de demo. La primera batería local de seguridad del nuevo orquestador pasa 4/4. Todavía faltan un checkpoint real con este nuevo comando, una recuperación desde máquina nueva, una aprobación explícita y una entrega de máster verificada a Drive. Codespaces no se detiene por este script: configura tiempo de inactividad en GitHub y usa Stop codespace en Android.

## Recuperación entre chats

Revisar rama remota, `PROJECTS.json`, `projects/<id>/STATE.json`, `HANDOFF.md`, los archivos `revisions/` y `approvals/`. No suponer que `main` es la rama más reciente ni reconstruir desde MP4. Comprobar SHAs y recursos.
