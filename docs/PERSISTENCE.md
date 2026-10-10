# Persistent editing and exact export protocol (Android / Codespaces / Actions)

**This is the operational source of truth. A rendered MP4 is an output, never the editable source.**

## Where information lives

- `PROJECTS.json`: global index of all projects, their most recent snapshot and their last *explicitly approved* revision. A null approval means **no approval**, not missing information.
- `projects/<id>/project.json`: composition id, duration, FPS, dimensions, Drive path, resource mode.
- `projects/<id>/src/`: the editable Remotion composition, sequences, animation, subtitles, effects, audio, and layers. `shared/` contains reusable components.
- `projects/<id>/STATE.json`: objective, progress, tasks, revision pointers, next step. It is deliberately separate from conversation memory.
- `projects/<id>/HANDOFF.md`: plain-language editorial handoff for the next chat, edited and committed with meaningful changes.
- `projects/<id>/asset-manifest.json`: original asset relative paths, SHA-256 and byte sizes. Resources are in the project's Google Drive folder and copied into project `public/` only for Studio/render. **Do not upload resource files to Git.**
- `projects/<id>/revisions/<id>.json`: immutable snapshot descriptor. Contains source commit, Git tree, individual SHA-256 of source and configs, lockfile hash, full asset manifest, Remotion/React/Node/npm versions, composition dimensions/duration.
- `projects/<id>/approvals/<id>.json`: separate explicit approval record, pointing to the snapshot by SHA-256 and source commit. Approval records must never be overwritten.

## Editing session: no render required

1. Start a 2-core Codespace, open the repository on Android, then `npm ci` (automatic on creation) and `npm run studio -- demo`.
2. Before changing an existing project, read `PROJECTS.json`, its `STATE.json` and `HANDOFF.md`. Verify which commit and assets belong to the selected version. Never treat a video as original code.
3. Edit `projects/<id>/src/**`, the project's `project.json`, subtitles/style files and resource manifest as needed. Use `npm run validate`. Assets must have correct paths, SHA-256 and lengths. Use `npm run assets:sync -- --project <id>` only after safely configuring Drive.
4. Update `STATE.json`'s editorial progress and `HANDOFF.md` with your actual decisions. **Commit the source before taking a snapshot:**

```bash
git status --short
git add -A
git commit -m "edit(demo): preserve current composition and handoff"
node scripts/revisions.mjs snapshot --project demo --revision demo-cut-001
git add PROJECTS.json projects/demo/STATE.json projects/demo/revisions/demo-cut-001.json
git commit -m "checkpoint(demo): demo-cut-001"
git push origin HEAD
```

The snapshot deliberately points to the earlier **clean source commit**. It is not itself an approval. This two-commit protocol avoids an impossible self-referential commit SHA.

## Approving, only after reviewing

Only after a human reviews the source and its exact assets:

```bash
node scripts/revisions.mjs approve --project demo --revision demo-cut-001 --confirm APROBAR-REVISION
git add PROJECTS.json projects/demo/STATE.json projects/demo/approvals/demo-cut-001.json
git commit -m "approve(demo): demo-cut-001"
git push origin HEAD
node scripts/revisions.mjs verify --project demo --revision demo-cut-001
```

Approval requires a clean tree, a recorded snapshot and all listed resources with matching SHA-256. No approval runs a render. All prior approvals remain available by immutable filename and commit history. If a creative revision is rejected, do not approve it.

## Closing and resuming days or weeks later

Push commits, then stop Codespaces. In a new Codespace, clone the same repository. Read `PROJECTS.json` and `STATE.json`; retrieve the chosen `revision` from `revisions/`. To safely recover the **exact source commit** into a separate checkout (without resetting `main`):

```bash
node scripts/revisions.mjs verify --project demo --revision demo-cut-001
node scripts/revisions.mjs resume --project demo --revision demo-cut-001
node scripts/revisions.mjs resume --project demo --revision demo-cut-001 --execute
# Open the printed .worktrees/demo-demo-cut-001 folder in VS Code Web.
# This is a new work/<id>/<revision>-resume branch. Run npm ci + Studio here.
```

`resume` defaults to a **dry run**, refuses an existing destination/branch and does not delete previous work. `verify` requires approval; for an unapproved but saved checkpoint, use `resume` on the snapshot by revision and do not call it approved.

Each new approved change must get a **new revision ID**. Do not rename or overwrite a previous approval; never use an MP4 to recreate its source.

## Exact export (manual only)

Actions → `02 - Remotion full master` → choose `project`, enter the **approved** `revision`, type `EXPORTAR-MASTER`.

The job first checks the approval record against its snapshot and available Git objects. Then it checks out **exactly `sourceCommit`**, installs dependencies using that commit's `package-lock.json`, downloads exact approved assets and verifies each SHA-256. Studio and `remotion render` run the same `src/index.ts` from that commit. The final MP4 includes a QA report recording source commit, revision, package lock hash, manifest hash, codec, FPS, duration and decoded frames. The master goes to Drive only after QA, with a verified SHA-256 transfer. Full renders never run automatically.

**Limitations:** system fonts, browser/Chromium versions, codecs and non-deterministic animations can create differences between Studio playback and exported pixels. Bundle licensed fonts into the asset manifest, use deterministic frame-derived animation, pin external datasets/resources and inspect the resulting contact sheet plus full video. QA numbers alone are not creative approval.

## New ChatGPT conversation: copy-paste handoff

> Continue Remotion Production Hub at `davidiaz03/remotion-production-hub-` on `main`. First fetch the latest commit SHA, `PROJECTS.json`, `projects/<id>/STATE.json`, `HANDOFF.md`, its most recent `revisions/<id>.json` and any `approvals/<id>.json`. Verify SHA/hash and the current branch. Continue editing the actual TypeScript source; never recreate it from an MP4. Do not render until explicitly requested.

## Guarantees and boundaries

- Git protects committed versions. A local unsaved/uncommitted edit cannot be recovered after a Codespace is deleted. Save + commit + push before closing.
- GitHub project creation does not automatically create a Drive folder: create the corresponding project-specific `assets/`, `masters/`, `qa/` and `scratch/` folders with the connected Drive account or authorized rclone configuration.
- Private projects/media need privacy assessment: this repository is **public**, so no tokens, licensed media bytes, confidential subtitles or personal information should be committed.
- **No cloud Codespace has been launched or browser Studio directly tested by this installation step.** The integration is source-configured; user/device launch still needs validation.
