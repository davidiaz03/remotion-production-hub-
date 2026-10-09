# Remotion Production Hub — universal, Android-first

**Central engine for independent professional audiovisual projects.** The Che Memorial reel is *one compatibility case*, not the architecture's purpose.

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

## Android 5-minute workflow (once repository and its connector permissions are enabled)

1. Create **public** `remotion-production-hub` on the new GitHub account. Do **not** put private institutional media, passwords or private data in source control. Restrict master outputs to Drive.
2. Import these repository files (ZIP delivered by ChatGPT). Commit to `main`. **Generate `package-lock.json` once** in an online Codespace with `bash scripts/bootstrap-lock.sh`, inspect and commit it. This pins all transitive dependencies to the historical Remotion 4.0.530 lock; Actions deliberately blocks until a lock is committed.
3. In GitHub repository → **Code → Codespaces** → Create codespace on `main` (2 cores). Use `npm run studio -- demo` in browser VS Code terminal, then open the private forwarded port 3000.
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

**Read next:** [ARCHITECTURE](docs/ARCHITECTURE.md), [DRIVE](docs/DRIVE.md), [OPERATIONS](docs/OPERATIONS.md), [MIGRATION](docs/MIGRATION.md), [TESTS](docs/TESTS.md).
