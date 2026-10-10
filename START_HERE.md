# Remotion Production Hub — punto de entrada universal

**Repositorio canónico:** `davidiaz03/remotion-production-hub-`. El sistema tiene una plataforma estable en `main`; los cambios nuevos se preparan en `work/*`.

## Antes que nada: ¿infraestructura o proyecto?

- Si el usuario pide mejorar automatización, Remotion, GitHub, Drive, pruebas o funcionamiento entre chats: trabaja en **la plataforma**. Lee `AGENTS.md`, `docs/SYSTEM_AUTOMATION.md`, `docs/DRIVE.md`, workflows y scripts. **NO retomes automáticamente el último reel de prueba.**
- Si el usuario identifica un documental específico: entonces lee `PROJECTS.json`, `projects/<id>/project.json`, `STATE.json`, `HANDOFF.md`, revisiones y manifiestos. El handoff del documental es exclusivo de ese documental.
- Una pieza piloto puede ayudar a detectar fallos; las mejoras universales se integran en `scripts/`, `shared/`, `templates/`, `.github/` y `docs/`, no en una memoria de conversación sobre el piloto.

## Protocolo obligatorio

1. Verificar GitHub conectado, rama y SHA remotos actuales; no confiar en fechas o commits antiguos de los documentos.
2. Confirmar si la tarea es de plataforma o de un proyecto identificado. Nunca seleccionar `demo` o un piloto por defecto.
3. Trabajar en `work/*`, revisar diffs y comprobar pruebas antes de solicitar integración en `main`.
4. Para medios privados, usar Drive y manifiestos SHA-256. Los MP4 no reemplazan fuentes TSX originales y no se suben al repositorio público.
5. La conexión ChatGPT-Drive NO autoriza por sí misma a Codespaces o Actions. Ver `docs/DRIVE.md`.
6. `npm run save -- <id> --note "..."` y `npm run publish -- <id>` no aprueban, no renderizan y deben verificar publicación remota.
7. Un master requiere aprobación editorial explícita, verificación de recursos, QA técnico y una entrega autenticada a Drive. Nunca por mero `push`.

## Evidencia existente (2026-10-10; verificar vigencia)

- PR #1 fusionado en `main` (`807c4608`): historial, guardado Android y recuperación.
- GitHub Actions run `38074798345`: 17/17 pruebas, recuperación aislada de tres revisiones reales de demo.
- Codespaces Android: Studio y guardado remoto reales probados. Controles 00/03/04 sin diálogo probados.
- Conector ChatGPT-Drive: carpeta `Remotion Production/projects` existente; GitHub Actions **lectura Drive verificada** el 10-10-2026 mediante run `38084894131` y secret `RCLONE_CONFIG_B64`. **Escritura/subida no verificadas**.
- Render demo de 59 fotogramas validado; master aprobado y entrega verificada a Drive pendientes.

## Para cualquier chat futuro

«Trabaja en el SISTEMA Remotion Production Hub, repositorio `davidiaz03/remotion-production-hub-`. Lee `START_HERE.md`, `AGENTS.md`, `docs/SYSTEM_AUTOMATION.md` y `docs/DRIVE.md`. Verifica rama, CI y conexión Drive. No abras proyectos piloto ni asumas uno activo, salvo que nombre el ID explícitamente. Documenta soluciones reutilizables para nuevos proyectos».

Para trabajo de un reel concreto, indicar también su `<id>` y leer sus propios STATE/HANDOFF.
