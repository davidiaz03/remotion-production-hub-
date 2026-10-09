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

## Android workflow — repository installed on GitHub

1. Open the existing **public** repository `davidiaz03/remotion-production-hub-`. Do **not** commit private institutional media or credentials; restrict masters to Drive.
2. The universal engine, manual workflows and `package-lock.json` are already committed to `main`. Codespaces and Actions must still be tested on GitHub before being called operational.
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

**Deployment status:** The GitHub source files and workflows have been verified via the connector. No GitHub Actions run, Codespace launch, or real Remotion MP4 is yet verified. Drive OAuth for workflows must be configured separately. Original Che history remains in its historical repository; copying the V42 compatibility code here did not import its Git history.

**Read next:** [ARCHITECTURE](docs/ARCHITECTURE.md), [DRIVE](docs/DRIVE.md), [OPERATIONS](docs/OPERATIONS.md), [MIGRATION](docs/MIGRATION.md), [TESTS](docs/TESTS.md).
