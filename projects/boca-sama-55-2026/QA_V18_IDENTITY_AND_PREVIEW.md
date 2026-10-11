# V18 Memorial original animation and watermark
## Sources and verification
The folder of 25 video/image resources for Boca de Samá contains no individual logo animations. The folder named `Logos` also returned zero children. However, the Memorial's own institutional museum reel `AQO72lD6...` (Drive ID 1Zg9bxfk9FPiATBs8KIDxi7NDVyIS6h8Y) contains the animated *white* identifier toward the last ~3.4 seconds, on black. The other reel carries a red-star variation. White was selected provisionally for better contrast against dark documentary footage.

Extracted 93.9–97.3s, 360x640, 30fps, muted, preserving the original graphic; `memorial-official-white-outro-from-institutional-reel-v1.mp4` size 51,114 bytes SHA256 dd046dbf24fb735454cf84f790d78191542c323790b740b02f395a486cb33153.
Watermark source is the **last static frame of the same animation**, RGBA PNG 287x456. For background removal only, luminance threshold and contour mask applied to original frame: keeps black details within star silhouette while black background goes transparent. No generative fabrication or recreated text. File `memorial-official-white-finalframe-alpha-v1.png` size 68,213 SHA256 73fae8c03c04dce04fffad4535525ecd73af7c09acd7f1e064b821eee73a2e2f.
Three-background alpha compositing QA image in Drive assets. Source logo is **360p compressed Instagram reel**, not high-res original. Color/fringe cleanup and visual test required before publishing.

Drive:
- extracted outro: https://drive.google.com/file/d/1Mz4Y-ukRFyQLjmjKuJ8Y13kpbT3Qy6Ha/view
- transparent alpha watermark: https://drive.google.com/file/d/1FN1D6f6ren-VVKXSLolg2uoy6Qf5QRKP/view
- background test: https://drive.google.com/file/d/1ZUxPj-vpGPomd27jQ4xnoNX1STNU6lnR/view

## Implementation
V18 edit in `src/Video.tsx` uses source outro for the 102 first frames of closing (global 1470–1571), then holds exact extracted final-frame PNG centered on black for 78 frames (1572–1649). Watermark on all earlier frames top-right w125px opacity .36, alpha PNG, removed entirely at frame 1470. Its placement must be visually audited against the upper labels: labels mostly top-left; 'BORRADOR' proof upper right at y80 and watermark at y190. Music remains until end. Both binary derivatives appended with verified hash and length to manifest in Drive project assets.
Important: Original 360x640 end logo video black-screen background is appropriate **only for closing**; watermark uses cropped transparency without backdrop.

## New native render (completed prior to V18)
GitHub Actions 38105799213, V17 source SHA f4fcd200..., frames 861–929 (69), 1080x1920 30fps; technical QA success, decode true and no black intervals; MP4 SHA256 41c00ff6cd683fc1fcbad358da0f3f64cbc45f298206691df4648ea61424b1f2, 870486 bytes, inspected contact sheet. The test crosses Nancy face→B-roll at global frame 870 and shows correct continuity without technical black flashes; source audio remains muted, no testimony claim.
**V18 logo integration has been saved, not yet natively rendered.** CI and short preview of closing should follow before aesthetic acceptance; first test frames 1460–1525 to verify removal of watermark, outro positioning and scale, then 1565–1620 for final static frame if justified. Do not spend render minutes unnecessarily.

## Pending
The user's statement about three original logo masters is not independently confirmed by directory listing. Request only the exact folder or files if a sharper export is needed. The reel-derived version can be used in internal work pending higher quality source. Confirm rights/brand rules and final narration. No master has been generated or approved.
