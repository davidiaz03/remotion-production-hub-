# Demo - continuidad entre conversaciones

**Proyecto:** `demo` | **Composicion:** `MainReel` | **Estado canonico:** `STATE.json`.

**Demostrado:** el workflow manual `37991845049` renderizo 59 fotogramas nativos con Remotion; no debe repetirse sin motivo. El resultado es una exportacion, **no** la fuente editable.

**Pendiente:** probar Codespaces en Android y usar una revision Git persistente, luego el procedimiento de recuperacion de `docs/PERSISTENCE.md`.

**Siguiente accion:** revisar `PROJECTS.json`, `STATE.json`, `revisions/` y `approvals/`. No deducir un estado aprobado a partir de un MP4.

## Actualización verificada 2026-10-10

- Codespaces `improved yodel` funcionó desde Chrome Android. `npm test`: 9/9 en la revisión anterior; Studio abrió `MainReel` y previsualizó la edición nueva.
- `demo-cut-001`: fuente `1f14c13`, registro `9184e12`, título **DEMO · MOTOR UNIVERSAL**.
- `demo-cut-002`: fuente `db1a451`, registro `d462ef7`, título **DEMO · EDICIÓN PERSISTENTE**. Ambas NO aprobadas.
- Detención/reinicio del mismo Codespace: código y revisiones recuperados. Clon independiente en `/tmp` dentro de ese entorno recuperó ambos estados históricos.
- **Pendiente real:** prueba de `npm run save` / `publish` nuevos sobre la PR #1, máquina nueva, aprobación y exportación a Drive. Las líneas antiguas de «pendiente probar Codespaces» anteriores a esta actualización son históricas y no reflejan el estado presente.

**Próxima tarea:** revisar `START_HERE.md`, abrir rama del PR #1 y validar guardar + recuperar, sin render.
