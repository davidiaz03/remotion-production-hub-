# Remotion Production Hub — iniciar aqui

**Repositorio canónico:** `davidiaz03/remotion-production-hub-`. El MP4 es una salida; la fuente editable es el commit de Git, su configuración y los assets verificados.

**A 2026-10-10:** `main` sigue en `1f14c13`. La automatización experimental está en el pull request #1, rama `work/hub-android-automation-20261010`. Verifica el HEAD remoto actual antes de operar; no presupongas que PR #1 fue fusionado.

## Inicio de cualquier chat o sesión autorizada

1. Comprueba usuario GitHub, repositorio, rama, HEAD, permisos y `git status`. Lee `AGENTS.md`, `PROJECTS.json`, `docs/PERSISTENCE.md` y `docs/ANDROID_AUTOMATION.md`.
2. Para el proyecto elegido, lee `projects/<id>/project.json`, `STATE.json`, `HANDOFF.md`, `asset-manifest.json`, `revisions/` y `approvals/`.
3. Diferencia **último avance** de **última revisión aprobada**. `approvedRevision: null` significa que no existe aprobación editorial.
4. Comprueba disponibilidad/hash de medios externos antes de prometer reproducción o exportación. La conexión Drive de un chat no da acceso a Codespaces o Actions.
5. Trabaja en `work/*`. Revisa cambios antes de guardarlos. En la PR experimental usa `npm run open -- <id>` para Studio y `npm run save -- <id> --note "Qué hice"` para persistir sin MP4.
6. Si se interrumpe `save`, no repitas snapshots manualmente: usa `npm run publish -- <id>` para terminar un checkpoint pendiente; comprueba el SHA remoto.
7. Solicita autorización antes de aprobar versiones, lanzar másteres, borrar materiales o cambiar permisos/facturación. Nunca hagas render automático por `push`.
8. Actualiza `HANDOFF.md` conservando decisiones editoriales; informa pruebas reales, pendientes y siguiente paso. Detén Codespaces cuando acabes.

## Evidencia histórica verificada

- Render Remotion: Actions run `37991845049`, MP4 de 59 fotogramas del proyecto `demo`.
- Android: Codespaces `improved yodel`, `npm test` (9/9 en la revisión anterior), Studio `MainReel` abierto con vista previa.
- `demo-cut-001`: título «DEMO · MOTOR UNIVERSAL», commit fuente `1f14c13`, manifiesto publicado en `9184e12`.
- `demo-cut-002`: título «DEMO · EDICIÓN PERSISTENTE», commit fuente `db1a451`, manifiesto publicado en `d462ef7`. **Ninguna revisión está aprobada.**
- Tras detener y reiniciar Codespaces, se recuperaron código y revisiones; una clonación independiente en `/tmp/remotion-recovery-test` dentro del mismo Codespace recuperó los commits de origen.
- La automatización de `operate.mjs` aún necesita una prueba real de `save`/ `publish`, tests completos en Codespaces y validación del PR.

## Pendientes que NO deben declararse resueltos

1. Checkpoint automático y reintento ante interrupciones reales.
2. Tareas de VS Code, creación con plantilla y recuperación en **máquina nueva**.
3. Integración segura de GitHub Actions con Drive y QA/subida del máster **de una revisión aprobada**, tras autorización expresa.
4. Fusionar PR #1 solo después de pruebas satisfactorias. Evitar renders innecesarios.

**Privacidad:** el repositorio es público. Nunca guardar credenciales, binarios institucionales sensibles ni medios privados en Git.

## Control Android sin cuadros de texto (PR #1)

El selector de proyecto de las tareas VS Code puede bloquearse en Chrome Android. Para las tareas **00–05** existe un acceso sin ventanas. Al iniciar un Codespace nuevo:

```bash
npm run use -- demo  # una sola vez por Codespace
npm run active       # confirmar la selección
```

Después ejecutar **Terminal → Run Task → 03 Consultar estado** o **02 Guardar progreso en GitHub**: no abrirán el cuadro «Proyecto». La selección permanece privada en Git; no requiere commit ni MP4. Cambia a otro trabajo con `npm run use -- otro-id`. Nunca se elige automáticamente un proyecto desconocido. Para operaciones especiales que soliciten revisión o consentimiento utiliza la terminal y las guías del repositorio.
