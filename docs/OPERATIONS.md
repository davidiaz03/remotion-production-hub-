# Operating handbook — Android + quotas + cleanup

1. Open the repository via Android Chrome. Choose Code → Codespaces → Create from `main`. Open VS Code Web and terminal.
2. Create: `npm run new -- titulo-corto`; review/edit `projects/titulo-corto/src/Video.tsx`, `src/Root.tsx` and `project.json`.
3. Preview: `npm run studio -- titulo-corto` (private forwarded port 3000); review in phone portrait. If resources are required, configure rclone and run `npm run assets:sync -- --project titulo-corto` first.
4. Commit changes. Request **quick preview** from GitHub Actions with `project=titulo-corto`, `frames=0-57`. Do not trigger repeated runs until the log of a failed one is analyzed.
5. Download quick MP4 within **one day**. Open QA JSON and storyboard; a technical pass does not certify editorial correctness.
6. Only when approved, prepare Drive secret and explicitly request **full master** with typed `EXPORTAR-MASTER`. The master job blocks unless Drive upload/checksum validation succeeds.
7. Stop the Codespace. Preview master on Android before publication.

## GitHub Actions strategy

- Zero push/PR/scheduled triggers: all resource-consuming workflows are explicitly manual.
- Public repository + standard Linux runner only. Private repositories **fail closed** before dependency installation. No self-hosted, paid larger runners or nonstandard services.
- Quick up to 90 frames, max 14 min/job, one active per project; a newer quick request cancels an old running/queued quick job. If it fails, inspect logs before resubmitting.
- Master max 45 min/job, one active globally. Running masters are *not* auto-cancelled, to avoid corrupting deliveries; GitHub can replace an obsolete queued request. Cancel an obsolete run explicitly in Actions, after identifying its run ID.
- `actions/setup-node` caches npm downloads with one key based on the lockfile. No media, browser frames or finished videos are cached. Keep the lock stable and monitor GitHub cache usage from Settings; GitHub's default per-repo cache limit is subject to its current billing rules.
- Preview MP4 and QA artifacts retained **one day**. Master MP4 stored in Drive after checksum verification; Actions stores only one-day technical reports. Emergency one-day MP4 archive is created only if a completed master render fails Drive delivery.
- On success `cleanup --execute` deletes **only** local `.cache/` and `projects/*/out/`. By default cleanup performs a dry run. QA reports are not deleted by the local cleanup command.
- GitHub hosted runner is ephemeral, so workspace and decoded secrets are also discarded at termination. Original Drive assets and masters are not touched.

## Billing checks to do manually before enabling

Check GitHub Settings → Billing & licensing → Usage / Budgets. For public standard Actions runners, GitHub documents free usage, but ensure the account has no unexplained restrictions and do not turn on paid services. Codespaces has **separate** compute and storage quotas; set 2 cores, disable unnecessary idle time and stop the environment at the end. The connector currently has no verified account-level Codespaces/billing data.

## Release approval checklist

- [ ] Source SHA and package-lock SHA recorded.
- [ ] All media hashes match approved asset-manifest.
- [ ] Native Remotion render exists and decodes.
- [ ] MP4 fps, resolution, frames/duration as requested; audio stream expected where required.
- [ ] Contact sheet inspected; black frame/decoder warnings triaged.
- [ ] Voice, audio levels, captions (transparent/no distortion), pacing, transitions and logo reviewed at normal speed.
- [ ] Institutional sign-off recorded by human, not inferred from FFprobe.
- [ ] Drive link and checksum manifest verified before marking release approved.
