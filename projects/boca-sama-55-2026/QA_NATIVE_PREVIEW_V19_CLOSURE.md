# V19 logo transition native preview → V20 correction
Run: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38106499245
Source SHA: 3ceb9514f44e41c4aafc54d6d56cd925a6915722. Frames 1458–1520 inclusive, Remotion 1080x1920 30fps H264+AAC, expected/actual 63/63, decoder OK, no detected black intervals, technicalStatus passed. SHA256 cb95813a7d96f142ac30b98b949436ae6ebab386cbd7c0f6019f37ab82d22982; size 455272 bytes; duration container 2.154667 sec (video 2.1 sec, AAC padding).

Visual review of frames 1458,1466,1469,1470,1474,1477,1480,1488,1500,1520:
- Real Memorial animated original red star starts on black and continues correctly. Alpha watermark is present before global frame 1470 and disappears there.
- **Editorial defect**: V19 12-frame crossfade overlays giant early logo star with the text LA MEMORIA PERMANECE from previous footage. Very cluttered and visually confusing. Rendering pipeline itself is healthy.
- Corrected in **V20**: Remembrance uses near-end dip-to-black frames 1453–1469; previous shot duration reduced from 192 to 180 frames; Closure uses direct cut at global 1470. It now preserves all 180 frames / six seconds of original animated asset, without crossfade over narrative text.
- The logo/alpha from three original 720x1280 animations, not compressed Instagram source. Files verified in Drive, manifest pinned. The 720p source upscales for 1080 delivery; do not invent AI details.

Drive permanent preview: https://drive.google.com/file/d/1IETxHRI1C9RGQtZfZjGoYWwCZJJ7ablG/view
Detailed ten-frame contact sheet: https://drive.google.com/file/d/17rDloHZBlx5di7ykrd-nmg4kpk17VA7W/view

**V20 code has been committed but NOT rendered.** Next single short manual quick preview 1450–1500 (51 frames) validates blackout-to-logo and watermark disappearance. Wait until CI on V20 completes. DO NOT publish master: voice, verified subtitling and permissions still pending.
