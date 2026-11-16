# Módulo de audio compartido (`scripts/audio/`)

Un solo pipeline de audio para todos los reels del hub (auditoría R4,
15-nov-2026). Antes, cada proyecto copiaba sus scripts de mezcla y
generación (Marabana, Pilar) y el máster se hacía a mano en
`render-chunks.sh`.

## Flujo

```
VO (Kokoro, previsualización; Piper de respaldo) ─┐
                                                  ├─► mix.py ─► mix.wav (48 kHz, -14,5 LUFS)
Música (MusicGen / Flow) ─────────────────────────┤      (ducking sidechain + loudnorm)
SFX del kit ──────────────────────────────────────┘
                                        │
Remotion render (tramos) ───────────────┤
                                        ▼
                              master.py ─► MÁSTER (CRF 19) + LIGERA (720p)
                                        │
                                        ▼
                              qa-media.mjs --mode full
                              (gate de sonoridad + silencios)
```

Beats de la música (`beats.py`, Fase B R16) → cortes y transiciones
sobre el ritmo, antes de fijar la escaleta.

## Scripts

| Script | Qué hace |
|---|---|
| `mix.py` | VO + música (archivo único o secciones con crossfades) + SFX opcionales → WAV 48 kHz con ducking sidechain y loudnorm. Informe JSON con LUFS/TP medidos. |
| `master.py` | Máster + ligera desde el render (chunks o archivo único). Copia el video (ya a CRF 19); recodifica el audio con la cadena V1.3 (recorte 40 ms, realce de arranque +6 dB/100 ms, alimiter 0.79). |
| `gen-music.py` | Música original por secciones con MusicGen-small (CPU). Las secciones vienen de un JSON. Stem a −16 LUFS (no confundir con el objetivo del reel). |
| `gen-vo-piper.py` | VO de previsualización con Piper, línea por línea, desde un JSON de guion. Escribe `vo-lines.json` con los tiempos. Respaldo desde la Fase B (ver Kokoro). |
| `gen-vo-kokoro.py` | **VO de previsualización recomendada (Fase B, R6):** Kokoro-82M (Apache-2.0), voces ES `em_alex` (defecto), `em_santa`, `ef_dora`. Misma interfaz que Piper (JSON de guion → WAV 24 kHz + `vo-lines.json`). Determinista (empalmar es seguro). ~0,3x tiempo real en esta VM (~3 min para 48 s de VO). Modelo en `../.hf-cache`; requiere espeak-ng (apt, .deb en `../debs/`). |
| `beats.py` | **Detección de beats/onsets (Fase B, R16):** aubio 0.4.9 → JSON con BPM, beats y onsets en segundos y en fotogramas (`--fps 30`). Coloca cortes y transiciones sobre el ritmo de la música. Ojo: recorta los beats fantasma de los WAV de Flow (la carátula mjpeg confunde a aubio, +5 s). |
| `transcribe-vo.py` | Alinea faster-whisper word_timestamps con el guion → `captions.ts` (formato CapSegment) y, con `--out-json`, HubCaption[] para `shared/captions`. |

## Casos límite

- **Mezcla en silencio** (`mix.py`): si VO y música son silencio
  digital, la mezcla sale en silencio y ebur128 no puede medir pico
  (`Peak: -inf`). No se aborta: se escribe el WAV y el informe con
  `silent: true`, `status: PASS_SILENT` y LUFS/TP en `null`, más un
  aviso por stderr. Cubierto por `tests/audio-mix.test.mjs`.

## Calibración (datos reales, no teoría)

- **Objetivo de mezcla**: −14,5 LUFS / TP −1,5 dBTP. Los másteres reales
  miden: Marabana V1.3 −14,28 LUFS / −1,99 dBTP; V1.2 −14,02 / −1,76;
  referente Maxi Rubio −14,33 LUFS. El −16 teórico del Studio dejaría
  los reels ~1,5 LUFS por debajo de nuestros mejores másteres.
- **Gate de QA** (`qa-media.mjs`, modo full): LUFS integrados en
  [−16,5, −12,0] y true peak ≤ −1,0 dBTP. Rechaza másteres claramente
  bajos (−18) o calientes (−10) sin rechazar nuestros másteres reales.
- **Techo de true peak del máster**: alimiter 0,79. Con 0,84 el máster
  V1.2 medía −1,27 dBTP (el sobreimpulso inter-muestra del disparo del
  sting supera el techo de −1,5 dBTP pedido); con 0,79 queda ~−1,6 dBTP.
- **Stem de música**: −16 LUFS (2 dB por debajo de la VO; el ducking lo
  baja a 0,25 bajo la voz). Es el nivel del STEM, no del reel.
- **Arranque**: el render por tramos deja 40 ms de silencio digital al
  inicio y atenúa ~3-4 dB el arranque; `master.py` recorta los 40 ms y
  aplica un realce de +6 dB que decae en 100 ms. Sin esto, el gancho
  suena "medio tarde" (auditoría V1.2→V1.3).

## Entornos

- `mix.py`, `master.py`, `gen-vo-piper.py`, `transcribe-vo.py`: venv del
  hub (`~/workspace/remotion-hub/.venv/bin/python`; transcribe-vo usa
  `~/workspace/.stt-env/bin/python` por faster-whisper).
- `gen-music.py`: `~/workspace/.musicgen-env/bin/python` (torch 2.15 CPU
  + transformers; pesos en `~/workspace/.musicgen-models/`).

## Música de Flow Music

Ver `FLOW_MUSIC.md` en esta carpeta (integración con Google Flow Music,
auditoría R5).
