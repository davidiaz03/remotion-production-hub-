# V30 native Remotion QA — Carlos -> memorial (2026-10-11)

- GitHub Action run: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38141945427
- Source revision: `8d6f38f2cbb4585f8a5724929fa9525882329e95` on `work/boca-sama-55-2026-research`.
- Frames previewed: **1195–1265 inclusive** (71 frames at 30fps = 2.3667s picture), 1080x1920 H264/AAC.
- Artifact MP4: 883234 bytes, SHA-256 `5051fcfc33c1160a9ab1d23ecb5487fba95ca2a4e329cf9e6a218fc29800c1d1`.
- `reports/technical-qa.json`: 71/71 frames, `decodeOkay:true`, `hasAudio:true`, `blackIntervals:[]`, `technicalStatus:"passed"`. Sound is present but semantics of Carlos' full utterance remain human-review only.
- Frame contact sheet **visually inspected**: Carlos appears at opening, cuts to verified later-period Boca de Samá monument image. No third-party 2026 incident imagery. Voice waveform and watermark remain. Problem: monument image arrives ~40%+ dark because generic `PaperDocument` fades in over 43 frames (1.43s), excessively long for a 2.3s proof, weakening final emotional sentence.
- Improvement for V31: add opt-in `entranceFrames` prop to `PaperDocument`; use **9 frames** only on Carlos monument. Do not change all other scenes. V31 is a code edit, **not rendered or approved**.
- Backed-up original ZIP with MP4/contact sheet/report: https://drive.google.com/file/d/1WRQqACkTjdSjd8FApVZGxO0vi0_FIErR/view ; temporary GitHub artifact expires after one day. No master.
- Current complete validation still pending: entire quoted speech and exact subtitles, full 55s editorial preview, narrator selection/approval, licensed music, complete official closing.
