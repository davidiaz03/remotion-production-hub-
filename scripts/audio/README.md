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
| `audit-audio.py` | **Auditoría completa de audio (17-nov-2026, V1.5 marti-fidel):** guion↔karaoke, tiempos de caption, integridad de la VO vs el original (cortes con clasificación por armonicidad, empalmes, palabras exprimidas), artefactos de time-stretch, mapa de silencios, música y ducking (suelo RMS, crossfade, recuperación, bombeo), máster (loudness/TP, alineación karaoke/onsets acústicos) y espectrogramas. Informe JSON + Markdown. **OBLIGATORIO antes de entregar cualquier reel: ningún reel se entrega sin pasar este módulo.** |

## Auditoría de audio (`audit-audio.py`)

```bash
python3 scripts/audio/audit-audio.py --project projects/marti-fidel \
    --tag v15 --edit-plan ../projects/marti-fidel/research/edit-plan-v15.json \
    --section assets/music/flow/shadows.wav@0@27 \
    --section assets/music/flow/weight.wav@25.5@50.23 \
    --expected-frames 1507
# Salida: projects/marti-fidel/reports/audio-audit-v15.{json,md}
# Código 0 = sin FAIL; 1 = hay FAIL (no entregar).
```

Lecciones codificadas (verificadas 17-nov-2026, reel marti-fidel):
- `alimiter=limit=X` con el `level` por defecto (auto-level=true)
  aplica ganancia de maquillaje 1/X (+2,05 dB con X=0,79): NO es un
  limitador de techo. Un techo real es `alimiter=limit=X:level=false`.
- Whisper sobre la MEZCLA tiene un sesgo sistemático (~+0,2 s); la
  alineación autoritativa es contra los ONSETS ACÚSTICOS de la VO
  limpia, y Whisper adelanta los inicios ~0,1-0,2 s tras cada pausa
  (0,55 s en la primera palabra de marti-fidel).
- BottomKaraoke solo lee los inicios (`s`) de cada palabra: la duración
  (e-s) NO afecta a la visualización; lo que importa es la duración de
  visualización (inicio a inicio).
- El escaneo de clics por umbral global es inútil (los ataques de
  plosivas lo saturan): las discontinuidades se buscan SOLO en los
  empalmes (método por borde).
- El bombeo del ducking se mide en la curva de ganancia del sidechain:
  con threshold 0,018/ratio 7 la música varía ~20 dB dentro de cada
  frase; con threshold 0,08/ratio 5/release 250 ms, ~9 dB.

## Verificación de líneas de voz (`verify-vo-lines.py`)

```bash
python3 scripts/audio/verify-vo-lines.py \
    --script projects/marti-fidel/vo-captions-v2.json \
    --transcription research/vo-real-transcripts-2026-11-18.json
# Salida: MATCH / INCIERTO / DISCREPANCIA por línea.
# Código 0 = sin DISCREPANCIA; 2 = alguna DISCREPANCIA (revisión humana).
```

Compara la transcripción ASR con el guion CONOCIDO usando alineación
difusa (difflib), normalización de números en español («treinta y
tres» → 33) y detección de fusiones («Martí ya» → «Martilla»).
INCIERTO = discrepancia de una sola palabra, palabra de baja
probabilidad ASR o fusión/tragado sospechoso → «verificar de oído»,
NUNCA un veredicto de regrabar por sí solo. DISCREPANCIA = palabras
faltantes o sobrantes claras con contexto ASR de alta confianza.

Lección del 18-nov-2026 (caso Martí-Fidel, NO olvidar): faster-whisper
(small y base) y la transcripción automática coincidieron en TRES
errores que NO existían («advertencia»→«pertenencia», «un pueblo»→
«el pueblo», la «a» de «condenado a volverla» tragada). El habla
rápida cubana engaña al ASR; el acuerdo entre sistemas NO es
evidencia de error real. El oído humano es el desempate. Self-test
con los casos del 18-nov: `python3 scripts/audio/verify-vo-lines.py
--self-test` (9/9).
| `diarize.py` | **Separar voces (16-nov-2026):** quién habla cuándo, con sherpa-onnx 2.0.1 (segmentación pyannote-3.0 + embedding 3D-Speaker ERes2Net, ONNX, 100 % local, sin cuenta ni token). `--speakers 2` para el diálogo de las dos presentadoras del Memorial. Modelos en `<hub>/.sherpa-models/` (46 MB). Salida JSON con segmentos {start, end, speaker}. |

## Diarización (`diarize.py`)

```
.venv/bin/python scripts/audio/diarize.py dialogo.wav --speakers 2 --out d.json
.venv/bin/python scripts/audio/diarize.py reel.mp4 --out d.json   # acepta video
```

- **Por qué sherpa-onnx y no pyannote directo:** pyannote exige cuenta
  de Hugging Face + token (modelo gated) y torch; sherpa-onnx usa los
  mismos modelos exportados a ONNX, descargados como archivos públicos
  de GitHub Releases, sin cuenta ni token, y corre solo con
  onnxruntime. Licencias: sherpa-onnx Apache-2.0, segmentación
  pyannote-3.0 MIT, embedding 3D-Speaker Apache-2.0.
- **Verificado 16-nov-2026.** Audio de control con dos voces conocidas
  (VO Marabana em_alex 0–15 s + testimonio de Pilar 16–31 s): 2
  hablantes, frontera detectada en 15,07/15,94 s (real: 15/16 s).
  Audio real del reel Pilar V30 (75 s): con `--speakers 2`, separa el
  testimonio de Pilar (25,4–38,4 s; real 24,8–38,2 s) de las
  presentadoras, con fronteras a <0,3 s del EDL. Con `--speakers 3`
  y con autodetección `--threshold 0.7` da el MISMO resultado
  (3 hablantes: testimonio + dos presentadoras, fronteras idénticas
  al milisegundo) — dos vías independientes que convergen. Con el
  umbral por defecto (0,5), la autodetección sobresegmenta
  (5 hablantes): para este material, usar 0,7 o fijar --speakers.
- **Límite honesto:** las dos presentadoras SÍ se separan (ver
  arriba), pero no existe guion con hablante por línea para certificar
  cada turno de presentadora al 100 %; contrastar siempre con el
  guion (los turnos ya se conocen del guion; la diarización confirma
  fronteras, no sustituye al guion). Voces muy parecidas grabadas
  en el mismo equipo son el caso más difícil para el clustering.
- **Coste:** ~1–2,5× tiempo real en esta VM según la carga (75 s de
  audio → 79–181 s; 31 s → 62 s). Paso por lotes, no interactivo.
- **IDs relativos:** SPEAKER_00 en un audio no es la misma persona
  que SPEAKER_00 en otro audio.

## Casos límite

- **Mezcla en silencio** (`mix.py`): si VO y música son silencio
  digital, la mezcla sale en silencio y ebur128 no puede medir pico
  (`Peak: -inf`). No se aborta: se escribe el WAV y el informe con
  `silent: true`, `status: PASS_SILENT` y LUFS/TP en `null`, más un
  aviso por stderr. Cubierto por `tests/audio-mix.test.mjs`.

## Registro en STATE.json (guardado en tiempo real)

Los scripts de audio NO registran solos: tras cada paso, el agente
que los llama anota el hito con `node scripts/state.mjs <id> ...`
(desde la raíz del repo). El render por tramos sí lo hace solo
(`render-chunks.mjs` registra cada tramo verificado).

```bash
# Tras gen-vo-kokoro.py / gen-vo-piper.py
node scripts/state.mjs <id> milestone vo "VO de previsualización generada" \
  --artifact public/vo.wav,vo-lines.json --status done
# Tras transcribe-vo.py
node scripts/state.mjs <id> milestone captions "Karaoke generado desde la VO" \
  --artifact src/captions.ts,captions.json --status done
# Tras mix.py
node scripts/state.mjs <id> milestone mix "Mezcla VO+música+SFX" \
  --artifact public/mix.wav --status done
# Tras master.py (SIN --status done: el gate de QA marca la fase)
node scripts/state.mjs <id> milestone qa "Máster y ligera compuestos" \
  --artifact out/<id>-master.mp4,out/<id>-light.mp4
# Si un paso falla
node scripts/state.mjs <id> milestone <fase> "<qué falló>" \
  --status failed --note "<detalle del error>"
```

Tras cada fase, checkpoint en Git: `node scripts/checkpoint.mjs <id>
--phase <fase>`. Para retomar en frío: `node scripts/resume.mjs <id>`.

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
