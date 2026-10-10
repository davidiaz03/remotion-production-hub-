# Remotion Production Hub — universal, Android-first

**COMIENZA AQUÍ: [START_HERE.md](START_HERE.md) · [AGENTS.md](AGENTS.md)**

**Central engine for independent professional audiovisual projects.** The Che Memorial reel is *one compatibility case*, not the architecture's purpose.

## Persistent production state and exact source recovery

The canonical editable project is **Git source + project configuration + SHA256 resource manifests**, not a previous MP4. Start a new chat by reading `PROJECTS.json`, `projects/<id>/STATE.json`, `HANDOFF.md`, and the revision/approval files before editing.

- **Edit** in Remotion Studio and commit the actual TSX project. Changes do not generate MP4s.
- **Snapshot** via `node scripts/revisions.mjs snapshot --project demo --revision demo-cut-001`; commit and push its manifest.
- **Approve** only after human review with `node scripts/revisions.mjs approve --project demo --revision demo-cut-001 --confirm APROBAR-REVISION`; commit and push.
- **Recover** by `node scripts/revisions.mjs resume --project demo --revision demo-cut-001 --execute`. It checks out the preserved code into an independent worktree.
- **Export** manually: Actions → Full master → choose project, **approved revision**, and `EXPORTAR-MASTER`. The workflow verifies approval, checks out the source SHA, installs that lockfile and checks approved media hashes before native Remotion rendering. The output QA report contains source revision and dependency/asset provenance.
- Quick previews remain manual and may render the current working branch unless an approved revision is explicitly selected.

See [persistent state protocol](docs/PERSISTENCE.md), [Android Studio guide](docs/ANDROID_STUDIO.md), and [reusable components](docs/COMPONENTS.md).

**Verificación (2026-10-10):** el render demo de 59 fotogramas, Codespaces real en Chrome Android, Studio y recuperación de dos revisiones fueron probados. La nueva automatización del PR #1 todavía necesita pruebas remotas de guardado; el máster aprobado y la entrega a Drive siguen pendientes.

## Operación simplificada en Android (rama experimental)

Los comandos nuevos y tareas de VS Code Web están documentados en [Automatización Android](docs/ANDROID_AUTOMATION.md). En Codespaces, abre **Terminal → Run Task** y selecciona **02 Guardar progreso en GitHub** después de editar. También puedes usar `npm run save -- demo --note "Progreso de hoy"`. Guarda código en Git + snapshot + estado, publica y comprueba el SHA remoto. **No exporta ni aprueba**; si falla el push, usa `npm run publish -- demo` para no duplicar revisiones.

El avance real previo del proyecto `demo` está en `work/demo-android-persistence-20261010`: `demo-cut-001` conserva el título original, `demo-cut-002` la edición persistente. Ninguna tiene aprobación editorial. La rama `work/hub-android-automation-20261010` incluye esos commits y la nueva operación de guardado sin alterar `main`. Antes de integrarla en `main`, ejecutar `npm test` y probar un checkpoint remoto desde Codespaces.

## What it does

`ChatGPT (code) → GitHub (versioned source) → Codespaces (same code in Studio) → Actions (native Remotion render) → FFprobe/FFmpeg QA + human review → Google Drive (approved masters)`.

- One pinned Remotion/React/Node stack and one dependency lock, used for previews and final renders.
- A `projects/<slug>` directory per reel; shared components in `shared/`.
- `workflow_dispatch` only: no expensive renders on push, PR, schedule or merge.
- A single `workflow_call` rendering engine, reused by all projects.
- Quick preview: **1–90 frames**, per-project queue/cancellation, 1-day artifact.
- Master: explicit **EXPORTAR-MASTER** confirmation; one active full master per entire repository, Drive copy verified before deleting scratch outputs; no auto-publication.
- Fail closed on **private** GitHub Actions repositories (no assumption about remaining paid minutes). Standard hosted Linux on public repositories is documented as free; no paid runners.
- Project-specific Drive folders; heavy media excluded from Git; local SHA256 asset manifests.
- Optional legacy V42 compatibility project, with no Che master workflow automatically triggered.

## Android workflow — repository installed on GitHub

1. Open the existing **public** repository `davidiaz03/remotion-production-hub-`. Do **not** commit private institutional media or credentials; restrict masters to Drive.
2. The universal engine, manual workflows and `package-lock.json` are already committed to `main`. Codespaces, Studio y una prueba corta de Actions ya funcionaron; el flujo automático de guardado y máster hacia Drive aún requieren validación.
3. Para experimentar con la automatización usa la rama `work/hub-android-automation-20261010`, no `main`. GitHub → **Code → Codespaces** (máquina pequeña). Use `npm run studio -- demo` in browser VS Code terminal, then open the private forwarded port 3000.
4. Create a new project: `npm run new -- mi-reel` (or `npm run new -- mi-reel "Título"`). Change `projects/mi-reel/src/Video.tsx` and the composition/duration/fps in both `Root.tsx` and `project.json`.
5. Preview in Studio, commit source, and use **Actions → 01 - Remotion quick preview → Run workflow** with project `mi-reel` and frames `0-57`. This is a real native Remotion render, not a transcode of an old MP4.
6. Inspect the one-day MP4 plus `technical-qa.json` and `contact-sheet.jpg` from the workflow artifacts. Inspect pacing, voice, subtitling and branding on Android; machines cannot automatically approve editorial quality.
7. For a full export only after checking quota/eligibility and connecting Drive, use **02 - Remotion full master**, enter `EXPORTAR-MASTER`. The workflow fails without Drive credentials, verified assets or explicit approval.
8. Stop Codespaces when finished. Set an appropriate idle timeout, e.g. 15 min, in your GitHub account settings. Do not create background Codespaces/render loops.

### Local utility commands

```bash
node scripts/validate.mjs --all
npm run new -- ejemplo-nuevo
npm run studio -- ejemplo-nuevo
node scripts/project.mjs render demo --mode quick --frames 0-57
node scripts/qa-media.mjs --project demo --mode quick --frames 0-57 --file projects/demo/out/demo-quick.mp4
node scripts/cleanup.mjs                   # safe DRY RUN
node scripts/cleanup.mjs --execute         # only scratch and outputs
```

The `--file` argument must point inside that project's `out/`. The `--approval` for full CLI rendering is `--approve EXPORTAR-MASTER`.

**Estado de despliegue:** Codespaces Android, Studio, render corto de Actions y recuperación manual Git están comprobados. No confundir esto con prueba del nuevo `npm run save`, máster por revisión aprobada o entrega a Drive, que siguen pendientes. Drive OAuth requiere autorización separada. El historial original del Che continúa en su repositorio histórico; V42 de compatibilidad no importó ese historial Git.

**Read next:** [ARCHITECTURE](docs/ARCHITECTURE.md), [DRIVE](docs/DRIVE.md), [OPERATIONS](docs/OPERATIONS.md), [MIGRATION](docs/MIGRATION.md), [TESTS](docs/TESTS.md).
