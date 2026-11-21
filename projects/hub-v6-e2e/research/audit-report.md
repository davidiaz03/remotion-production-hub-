# Auditoría de audio — hub-v6-e2e (vX)

**Veredicto: FAIL** — 1 FAIL, 2 WARN, 0 PASS, 6 INFO.

## (a) Guion ↔ karaoke — PASS

- **INFO**: falta vo-lines.json o captions.json

## (b) Tiempos de caption — PASS

- **INFO**: falta captions.json o VO editada

## (c) Integridad de la VO — PASS

- **INFO**: faltan VO original/editada, transcripción o predicción

## (f) Música y ducking — PASS

- **INFO**: falta mix.wav

## (g) Máster — FAIL

- **WARN**: loudness -25.9 LUFS fuera del rango de QA [-16,5, -12,0]
- **FAIL**: 3 intervalos de silencio >=0,3 s en el máster
- **INFO**: sin mezcla: no se buscan agujeros de frontera en el máster
- **WARN**: desvío karaoke/voz del máster (Whisper) +0.30s en 'en'

## (i) Microcortes de voz (forma de onda) — PASS

- **INFO**: faltan VO original/editada

## Métricas

```json
{
 "g_duration": 13.133,
 "g_frames": 394,
 "g_lufs": -25.9,
 "g_true_peak": -8.0,
 "g_silence_intervals": 3,
 "g_first_audio_s": 0.01,
 "g_align_master_mean": 0.031,
 "g_align_master_median_signed": 0.0,
 "g_align_master_max": 0.3,
 "g_align_master_max_word": "en"
}
```
