# Test matrix and acceptance gates

| Test | Current expected test | Verified or pending |
| --- | --- | --- |
| Project config | valid JSON, paths confined, 30 approved asset hashes | Local static test |
| New project scaffolding | creates independent `projects/<slug>` without copy of CI | Local test |
| V42 source timeline | 28 contiguous scenes, 2418 frames, 30 fps, 58 Intl. frames by manifest | Local static test |
| V42 media files | 30 SHA256 files verified against corrected local workspace | Local asset test only |
| Workflow syntax | exactly 2 manual dispatchers, 1 reusable call; no push/cron | Local YAML test |
| QA routine | FFprobe + complete FFmpeg decode + contact sheet + black warnings | Local synthetic media smoke test (NOT Remotion render) |
| Demo real Remotion render | `npx remotion render ... 0-57` | PENDING; npm registry unavailable in this container |
| Actions remote run | 58-frame demo | PENDING; no accessible GitHub destination installation/repo |
| Codespaces runtime | 2-core browser Studio port 3000 | PENDING; account authorization and usage not verified |
| Drive upload to new project | checksum-verified copy in independent folder | PENDING; separate rclone OAuth secret |
| Historic graph mirror | branch SHA matches original after full mirror | PENDING; do not confuse with file copy |

A **synthetic FFmpeg MP4** is only a test of the QA tool itself. It must never be reported as proof of a native Remotion render. Human signoff is necessary for audiovisual fidelity.
