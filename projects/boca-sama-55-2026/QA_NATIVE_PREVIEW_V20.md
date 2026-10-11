# V20 native close QA and V21 stabilization
GitHub Actions: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38106770386
Native MP4: frames 1450–1500 inclusive (51/51) 1080x1920 30 fps H264/AAC, SHA256 fa99e8df5c49e682a14996ff938ebbcef501f4508b9b0e9dc348a198708c57f2, 421743 bytes. Technical QA passed, no black intervals, decoder okay. Backed up Drive: https://drive.google.com/file/d/1tTpKoCz-YO9BQJra-_yqmWMYh2WrLS_v/view ; frame audit: https://drive.google.com/file/d/1PWe-gMxlq1-a-x1bPc2ac4mG-JegmXdH/view.

Visual verdict: official animation starts alone, without former overlapping LA MEMORIA PERMANECE title. Watermark ends at global frame 1469, clean official logo starts 1470. V20 now substantially better than V19. However previous documentary shot changes abruptly from architecture/interior to landscape around source ~355.5 sec right before dip-to-black; this is visible in render and weakens continuity.

Verified by extracting 16 source stills t350–362s from original 640x360 source. V21 edit uses original source from 356s at speed .72 for second Remembrance window (117 frames), thus 2.8 sec source time from t356–358.8 and avoids documented 355.5s scene change. Both original footage and logos unchanged. Changes committed to Editorial.tsx playbackRate prop and Video.tsx. This V21 change is NOT rendered; do not assert aesthetic success until short QA sample. The actual original 720x1280 Memorial logo is still source of watermark and animation.

Outstanding: voices and truthful subtitles, copyright, historical fact check and master sign-off. No full master generated.
