# V26 Carlos native render and V27 design fix

Native run: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38109843775
Rendered source: f5eba05c1367a99f5e9c56ecc796f5540f96c423; global frames 1020–1089, 70/70, 1080x1920 at 30fps. H264/AAC, decoded correctly, zero black intervals. MP4 891754 bytes, SHA256 faa5648d1e0ade83d70b7ddfa5389b871acde329c233257138752876948a9915. WAV waveform represented in UI; track audible. Preview average -24.4 dBFS, peak -9.7 dBFS (not LUFS). MP4 backup: https://drive.google.com/file/d/1qifGunPfr-E3lz6EAMrLYNQZGEf25I2v/view . Contact sheet: https://drive.google.com/file/d/1k1bc33yWmdFeXJQyJjryvJ7elmeauviA/view .

Visual evaluation: archive interview remains in 16:9 and face recognizable; authentic recording waveform gives lower half useful structure and depth. A static label and waveform in V26 extend into the part of the scene when the recorded speech ends, and waveform y1400 + label y1540 interferes with future caption zone 1500–1645.

**V27 code fix implemented but NOT rendered**: waveform y1310 and label y1425, opacity drops to zero between local frames 157–174; audio source lasts 173 frames. Keeps subtitles safe and avoids false waveform during silent B-roll. No fake transcription or reconstructed 1971 imagery.

Do not render master: witness quotations not transcribed/semantically validated, subtitles absent, voiceover not recorded, licensing unresolved. Remaining full 55s still needs end-to-end QA.
