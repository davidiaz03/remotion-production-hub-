# V24 · Native Remotion preview with verified original Nancy audio
2026-10-11. **Technical QA passed; editorial/semantic approval pending. NOT FOR PUBLICATION.**

Source workflow: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38108311401
SHA rendered `bb4dc1b2298d457ddfec20e85c6ee10bd7d5439a`; frames global **720–789**, inclusive, 70 frames, 1080x1920 30fps. Native Remotion, not FFmpeg reconstruction.

## Verified evidence
- MP4 size 834,514 bytes; SHA256 `05363a33f163d9bc82bed71595afad13b1be2a7fcc19b2d3bb988acf37774612`.
- Actual 70 / expected 70 frames; H264 + AAC; decode OK; no unexpected black intervals; QA `technicalStatus:passed`; container 2.389333 s (2.333333 s video with AAC padding).
- Contact sheet inspected: Nancy in outdoor archive interview, no obstructed face, real Memorial watermark upper-right, institutional red/white name readable; however **large empty dark lower half remains** and soft-source 428×240 remains limited. No claim of aesthetic mastery or approval of full witness scene.
- Decoded native audio from MP4 (48k mono). `volumedetect`: average **-24.6 dBFS**, max **-11.5 dBFS** over 2.389s; no digital peak clipping. These are dBFS sample measures, NOT LUFS or full-reel levels.
- Compared PCM preview signal with the actual source WAV `boca-sama-v24-voice-nancy-source-2011-review.wav` at corresponding intervals after allowing ~42.7ms AAC timing offset; normalized waveform correlation ~0.995–0.998 in three 0.6–0.7s windows. Confirms actual Nancy recording is present and the audiovisual render is technically source-matched. Does NOT verify spoken meaning, quotation boundaries or permissions.
- Backups: MP4 https://drive.google.com/file/d/1dks0snMRP8pe8bAdLrljT41n_UrCit9H/view ; contact sheet https://drive.google.com/file/d/1bdEsks1tYeX52xECHNhPrfeHp2h8PVen/view .
- A separate V23 preview previously succeeded in run 38108029936, 70 frames around 755–824, but that did not include current V24 voice implementation.

## Quality decisions and next work
1. Do not alter audio source or claim transcript until **a human accurately listens to and verifies** the complete excerpt and its context in the original interview. No voice cloning; no fabricated words. This preview covers only first 2.33s of a 5.75s witness segment.
2. Next unique-value quick preview of **Carlos** global frames 1020–1089 (70f) to validate second source and music blend; no repeat of Nancy frames unless code materially changes.
3. Add subtitles only from verified, word-accurate transcript, 1–2 lines without rectangular background, adhering to Memorial identity/safe areas. Confirm if the original quote is complete and meaningful rather than an editorially broken fragment.
4. Address the large negative space under archive on mobile without enlarging 428×240 material excessively; editorial motion/layout rather than gratuitous transition. Avoid overpromising retention.
5. Full 55s cinematic/auditory QA and the *complete six-second institutional closing animation* remain unchecked. The master approval gate remains closed.
