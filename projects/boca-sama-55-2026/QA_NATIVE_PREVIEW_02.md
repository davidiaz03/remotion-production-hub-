# Native Remotion preview #2 — transition audit and V15 correction

Source workflow: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38104808177
Rendered revision: 8e882708b26416119364b2075e793c300757c02e (V14); branch work/boca-sama-55-2026-research. 113–175 inclusive, 63 frames at 30 fps, 1080×1920 H264/AAC.

## Verified QA
Native Remotion render succeeded, project source and Drive assets restored and verified via SHA-256. Decode OK, 0 black intervals, 63 actual / 63 expected. Container ~2.154667s with AAC padding; expected video time 2.1s. MP4 SHA256 10a988fa2d4bc0fd07621915e0dbeb3176a39a818a92912386e89829ea05fc28; 1,232,726 bytes. Technical QA passed. Visual contact sheet and frames 0,5,8,12,18,30,50,62 reviewed. Audio mean -43.3 dB, peak -22.6 dB in this preview (low-level background score, not master mix). Original asset remains available via artifact ID 11688714512 until its 1-day retention expires.

## Creative QA
The scene overlap functions, but the left-direction mask on the satellite slices the title "BOCA DE SAMÁ" at ~frame 5–12 of this preview. This is formally correct yet visually unconvincing and resembles a preset. The satellite continues correctly after the wipe and there is no black flash. The lower area still lacks engaging imagery; this is a choice to revisit later, but not justification for fake archival imagery.

## Actual V15 fix in GitHub
Opening typography now gradually fades during global frames 103–122, while real coast imagery persists. Scene from frame 120 changes from `left` wipe to an actual crossfade over 12 frames. This removes the visible guillotine through the title. **This change has been committed but NOT yet rendered**. Future review should target 110–152; no promise of improvement before native visual QA.

## Constraints
No full/master renders, no made-up testimonies or 1971 imagery, no substitute official logo. Real survivor words still require verification, and institutional animation + exact frame-end watermark remain missing. Future subtitle track has no rectangular boxes but waits for authentic voice.
