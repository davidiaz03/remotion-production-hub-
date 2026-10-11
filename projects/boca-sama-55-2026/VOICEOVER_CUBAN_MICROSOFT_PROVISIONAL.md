# V31 Microsoft Cuban TTS — provisional voice plan (NO PUBLICAR)

Microsoft Azure Speech lists Spanish Cuba voices `es-CU-BelkysNeural` and `es-CU-ManuelNeural`. Start with Belkys, natural-sounding documentary read; compare Manuel in a short A/B test only if access is available.

**Connection audit:** The available Microsoft connector here is Outlook Email, **not** Azure Speech or Azure subscription. No Azure Speech key/region or official TTS endpoint has been verified in the repo; no Microsoft TTS audio has been synthesized. No purchases/credits authorized. Do not claim either a free service entitlement or existing integration. Do not imitate the survivors' voices.

## Script for *provisional* 04–24 s (approval and historical fact check required)
«El doce de octubre de mil novecientos setenta y uno, un ataque armado alcanzó Boca de Samá, en Banes. Dos personas murieron y otras cuatro resultaron heridas. Las consecuencias siguen presentes.»

Estimated 39 spoken words; measure actual generated duration, aim 14–19s with slight pauses. No TTS under/over a survivor. If it exceeds the window, edit wording instead of speeding mechanically. The 0–4 s opening is visual/musical, 4–24 s editorial voice only. Nancy authentic 24–29.3 and Carlos authentic 34–42.4; other moments leave to music/visual.

## Microsoft official route, not executed
Use a dedicated Azure Speech resource and a **budget** that explicitly permits synthesis. Supply `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` as GitHub Actions secrets to a manual workflow (no credentials in Git), call official Azure Speech REST synthesis with locale `es-CU`, voice `es-CU-BelkysNeural`, high-quality PCM or MP3; write temporary WAV/MP3, probe duration and loudness, upload to Drive *only after verifying rights and cost*. If Azure not authorized, **do not call API** and retain voiceover as pending.

Can use a no-cost local offline TTS for timing mockups only, but those are not a Cuban voice and must not be mistaken for the desired Microsoft quality.

## Visual notes
Native Carlos monument cut V30 technically passed (run 38141945427); image fade was too long; V31 reduces this specific entrance to 9 frames. Pending native QA. New AI narration must always be clearly marked as production placeholder; replace it with approved Memorial staff narration before publication unless the institution expressly endorses synthetic narration.

## Final gates
Original voice transcriptions independently reviewed (Gemini = provisional); subtitles verified at global 30fps and safe zone; sound mix - neither music nor VO mask Nancy/Carlos; licensed background score and authentic logo preserved; user approval before master.
