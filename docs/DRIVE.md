# Google Drive media library — security-first connector setup

**Never commit downloaded media or credentials.** Sources live on Google Drive. The repository has only `.tsx`, manifest hashes and metadata. `public/` is local-only and ignored by Git. `out/` is disposable.

## Proposed Drive tree

```
Remotion Production/
  projects/
    demo/{assets,masters,qa,scratch}/
    mi-reel/{assets,masters,qa,scratch}/
    che-v42/{assets,masters,qa,scratch}/
```

These folders are a **proposed structure**. Creating source folders and configuring OAuth are pending; no existing originals are moved.

## Authentication in GitHub Actions

We use `rclone` with a preauthorized Google Drive remote named exactly `media`. GitHub Actions cannot automatically borrow this chat's Google Drive connector credentials.

**From Android:** a working option is Termux + `rclone config`: add a Google Drive remote called `media`, authorize it once with your own browser session; use appropriate least-privilege scopes consistent with reading existing resources and creating exports. Review whether broad Drive scope is acceptable before approving access. Save the complete `rclone.conf` as a **GitHub Actions repository secret** `RCLONE_CONFIG_B64` (base64 encoded, not encrypted by base64 itself; GitHub secrets encrypt at rest). Never paste OAuth refresh tokens into issues, commits or this chat. An account without Termux may configure rclone on a trusted device just once, then store the secret from the GitHub website using Android.

Convert to base64 on the authorized device:

```bash
base64 -w 0 ~/.config/rclone/rclone.conf
```

Place its result in **Settings → Secrets and variables → Actions → New repository secret → RCLONE_CONFIG_B64**. For Codespaces interactive resource sync, create a separate Codespaces secret or configure `rclone` locally; GitHub Actions secrets are not automatically accessible to Codespaces.

In the workflow, the decoded config lives in `$RUNNER_TEMP`, chmod 0600, never under the Git repo. The credential file is removed at the end. Ensure `rclone lsf media:"Remotion Production"` succeeds from Codespaces before attempting any real master.

**Permissions risk:** an OAuth refresh token may grant more Drive access than this project's folder. Ideally use a dedicated Google account/shared Drive or a limited app authorization; there is no universal promise of folder-only permission with this rclone approach. Revoke the token if compromised. Do not make the GitHub repository private just to protect Drive tokens; protect tokens through GitHub Secrets and keep assets private in Drive.

## Daily flow

1. Prepare media in Google Drive under `Remotion Production/projects/<slug>/assets/`.
2. Compute SHA256 and size of every approved file; update `projects/<slug>/asset-manifest.json` in Git, review the commit.
3. `node scripts/sync-assets.mjs --project <slug>` fetches only missing/mismatched files. It checks cryptographic hashes before render.
4. A full master is uploaded to `drivePath/masters/<slug>-<commit>-master.mp4`. A second checksum-based check must pass before scratch outputs can be removed.
5. Temporary previews are one-day GitHub artifacts and are not promoted to Drive masters automatically. Store only creative-approved releases permanently.

**V42 exception:** six original ZIPs remain at `Remotion Projects/che-october-1967-reel-2026/renders`. `projects/che-v42` knows that legacy source folder, unpacks approved files, then applies an optional corrected ZIP in this same location **before** SHA verification. The corrected ZIP is marked required, so render fails closed until it exists. New exports go to the separate `Remotion Production/projects/che-v42` folder.

## No silent cloud deletions

No workflow deletes old Drive assets, originals, archives, approvals or masters. `rclone sync` is **not used**, because it might delete remote assets. We use `copyto` only. Optional Drive archive policies should be reviewed separately by project owners; there is no dangerous retention sweeper with access to masters.
