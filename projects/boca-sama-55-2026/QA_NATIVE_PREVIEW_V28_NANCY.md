# V28 Nancy — Native Remotion preview: verified technical recovery checkpoint

**Date:** 2026-10-11 UTC. **Approval:** internal preview only; **NO PUBLICAR**.

## Source and execution

- GitHub Action: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38111670265
- Rendered exact SHA: `706bfe0cfd43eea8c448ae76a786adfff51a1d5e` on `work/boca-sama-55-2026-research`.
- V28 code checks: **SUCCESS**, run https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38111579311 on the same SHA.
- Workflow input frames global **720-789** inclusive, 70 frames at 30 fps = 2.33333 s of picture; reel duration remains 1650 frames/55s.
- Native MP4: 1080x1920, H264/AAC, 974942 bytes, SHA256 `926da13623eaa40c0eada6cf5b01cef5c9d6e4c6d0737d37a632d0e8c94f7f54`. MP4 container duration 2.389333s due to AAC padding.
- Technical report: actualFrames=70, expectedFrames=70, decodeOkay=true, hasAudio=true, blackIntervals=[], technicalStatus=passed, visualStatus=PENDING_HUMAN_REVIEW in automated report.

## Actual review
1. Native contact sheet of 9 stills opened and reviewed: Nancy in correct 16:9 authentic 428x240 video source, red-white institutional watermark top-right, a clean identity name and display-only original-audio waveform below. No black-flash, title cutoff or severe cropping in this 2.33s passage.
2. Audio peak measured with FFmpeg `volumedetect`: approximately **-9.4 dBFS**, mean **-24.2 dBFS**, no sample clipping. Not a measurement of final full-reel LUFS.
3. Decoded audio compared with original V28 selected WAV `boca-sama-v28-nancy-authentic-candidate-PENDING-REVIEW.wav`, using resampling and cross-correlation with timing compensation: ~**0.995** correlation over a ~1.75 s matching window; ~0.997 and ~0.994 across two tested subwindows. This confirms the correct *new* WAV is integrated, but does not validate the literal utterance or edit boundary.
4. **Critical caveat:** Preview only covers 24.00-26.33s of reel while Nancy's selected 5.3 s track reaches ~29.3 s and Carlos's new 8.4 s track spans ~34.0-42.4 s. These are **NOT** audiovisually approved yet.

## Durable backups
- Native video: https://drive.google.com/file/d/19WFrMqJGWwzGIGp2pI9E5rlrjTXo91mX/view
- Contact sheet: https://drive.google.com/file/d/1Blu_-KF8dQrW4kb3-6pzKUjdePXi_e5r/view
- QA JSON: https://drive.google.com/file/d/1BhW-jGP16VMQg3nHhVxdZudS9Ivb7899/view
- Action artifact 11691672427 is temporary (1-day retention); **do not rely on it tomorrow**.

## Editing and publication gate
- Gemini text from producer is a preliminary transcript hypothesis. Four captions are in `src/TestimonyCaptionsV28.ts` but deliberately `verified:false`, so **none is rendered**. Do not flip flag without human verifying exact words and their IN/OUT and permission.
- Source to reel conversion must not be confused: Nancy original t50–54.8 s (approx.), corresponding to reel ~24–29.3 s; Carlos original ~203.8–211.8 s corresponding reel ~34–42.4 s; the WAVs include short handles.
- Other pending: full 55s visual/sound continuity QA, complete closing logo 49–55s, voiceover from Memorial team, source rights, historical fact-check, captions safe-zone and phone legibility.
- Do not trigger a new render just because of this checkpoint. Recommended next *unique* preview is the **end** of Nancy's voice / cut into B-roll around global frames 852–906 (55 frames) to evaluate full phrase ending, or Carlos opening if editorially prioritized; no master without approval.

## Resume tomorrow
1. Read `START_HERE.md`, `AGENTS.md`, `STATE.json`, the last section of `HANDOFF.md`, and this file.
2. Check whether the user has supplied revised/verified transcripts; avoid treating Gemini as ground truth.
3. Compare source audio against selected speech for meaning/completeness, correct trims and plan exact SRT. Future narrator must be an approved Memorial voice.
4. Review one high-value preview; then run an **editorial full-length preview** only with permission and compliant resource policy.
