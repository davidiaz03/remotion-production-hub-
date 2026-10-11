# V33 — Remotion Whisper.cpp y revisión de voces conectadas (NO PUBLICAR)

## Workflow lanzado y comprobado
Quick-preview user run [38142873914](https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38142873914), SHA 7374015fbd6edaad9d0e5f5eb22ba9ca4cedb5f0, SUCCESS. Native frames 1195–1265: 71/71, 1080x1920, H264/AAC, decoder okay, zero unexpected black intervals, artifact 11703761324, mp4 SHA256 caff3c34dcf1c28cc84a099fb5472449817b506fe22497bbb70fab10dd3a1ff5. Nine-frame memorial-photo entrance examined; substantially faster than V30 and no abrupt image switch. It is NOT a full preview nor a transcription.

## Transcription system actually committed
- `scripts/boca-sama-remotion-whisper.mjs`: reads approved source filenames from manifest, verifies original byte counts and SHA-256, extracts 25-second contextual interview audio via FFmpeg, installs and runs multilingual Whisper.cpp through `@remotion/install-whisper-cpp` and converts results via `toCaptions()`.
- Output JSON includes SOURCE and REEL offsets, `verified:false`, and does **not** automatically enable captions, alter React montage or expose private original audio as artifact.
- `.github/workflows/boca-sama-remotion-whisper.yml`: manual separate workflow, CPU Ubuntu, timeout 28min, one-at-a-time, no render, uses Drive read OAuth secret already used by render pipeline, retention 1 day for **draft transcript only**, cleanup.
- **NOT RUN or validated on runner**. API integration based on published Remotion docs. Workflow may not be selectable in GitHub UI unless GitHub makes the workflow available from main/default. Do not merge main without approval. Costs are GitHub runner minutes/model downloads, not guaranteed zero. Model `base` Spanish preferred for first smoke test, `small` after comparison only if justified. Whisper results are not literal truth or editorial permission.
- The proof isn't a 1971 recording; Nancy/Carlos are later source interviews. `@remotion/captions` supports subsequent display but the human verification gate remains absolute.

## Other voice connectors actually checked
- HeyGen returned Spanish female catalogues (Serena Narrador, Lucía Sabia, Camila Vega and more), but `es-CU` locale-specific search returned **zero voices**; cannot claim Cuban accent. Voice generation not called; price/credits undetermined.
- Runway's both connected workspaces returned 401 tokens revoked during voice catalogue lookup; cannot produce through them before reauthorization. It is credit-priced.
- vidIQ listed 21 preset voices but none explicitly Spanish/Cuban; generation 14 credits/1000 characters rounded, not called.
- Azure Speech official `es-CU-BelkysNeural`, `es-CU-ManuelNeural` remains best provenance of locale. Manual Azure workflow is prepared but NO key/region verified and NO audio generated. Avoid billing or passing credentials in chat. Do not clone survivors' voices.
- User can choose to approve a non-Cuban Spanish provisional narrator but no point in incurring a charge when authentic institutional VO is incoming.

## Next real priorities
1. If manual Whisper workflow becomes executable on current branch, run first `nancy`+`base` only; inspect logs/time/cost and compare with Gemini before Carlos, do not run both repeatedly.
2. Independently listen to and check complete Nancy 4.8s and Carlos 8s quotes, verify whether handles contain partial phrases, mark uncertain tokens.
3. Create controlled `verified:true` captions and motion only after confirmation; mobile zone and no rectangle remain. Plan actual narration 4–24s, music duck on narrator, preserve survivor isolation.
4. Run *editorial* full 55s only after next milestone, preserving clean six-second logo ending.
