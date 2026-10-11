# Native preview #1 — VERIFIED technical execution, visual revision needed

Workflow: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38103024742
Git SHA: d72977fe0bffc8efada009104e8945b0393b7d52 (V09 source), artifact ID 11688756269. Rendered by native Remotion 4.0.530 (not FFmpeg prototype).

## Verified output
- 90 frames from frame 0 to 89, 1080x1920, 30fps, H.264 and AAC. MP4 1,352,921 bytes, SHA256 3b1e0e852f67ff95f2988d1a137b1f97bbcb3433484874823ac664512ff9feb9.
- QA report `technicalStatus: passed`, `decodeOkay:true`, no detected black intervals, 3.050667s container duration (AAC padding), audio true; `visualStatus:PENDING_HUMAN_REVIEW`.
- Run completed SUCCESS. Manifest synchronization, verified SHA, rendering, decode QA and artifact upload all succeeded. Actual video and contact sheet downloaded from Actions artifact and inspected.
- Contact sheet/frame 1.3s and frame 2.5s inspected; archive window displays coastline (source retains channel bug), title BOCA DE SAMÁ clear; red eyebrow legible. Too much unused black space below text: video feels like an animated poster, not a high-impact reel. Note this confirms only opening 3s, not full 55s or other footage and transitions.

## Design decision
Do not approve opening aesthetically. Next iteration adjust vertical framing/layout so moving landscape and title occupy more useful area, reduce black dead space, use safe areas. Do not aggressively enlarge 360p to cover the screen or lose original video content. Maintain 9:16, Memorial palette and no fake 1971 imagery. Subtitles remain intentionally off pending verified speech.

## CI discrepancy
Code-check run 38102522688 at V09 SHA failed 1/31 tests because legacy test expected literal music filename inside Video.tsx whereas V09 moved the filename into the Editorial.tsx asset registry. Source and actual rendering were correct. Updated the test to inspect the shared asset registry at SHA cdff694527be3bd5f10132de0beb9820f9a441a9. Await new CI run.

## Artifact retention
The preview artifact expires 2026-10-12 01:49:19Z (1 day). File is recoverable in session; save independently to Drive scratch if needed before expiry. No master or approval.
