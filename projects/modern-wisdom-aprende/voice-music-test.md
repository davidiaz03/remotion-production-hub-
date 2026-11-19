# Prueba de voz y música — Modern Wisdom: aprender

Fecha: 19-nov-2026. Rama: `work/modern-wisdom-aprende`.
Párrafo de muestra: 555 caracteres / 101 palabras (del guion real).
Velocidad: por defecto (1.0) en ambas voces. Modelo Kokoro-82M, script
`scripts/audio/gen-vo-kokoro.py`.

## 1. Voz elegida: `em_alex`

### Números de la comparativa

| | em_alex | em_santa |
|---|---|---|
| Duración del audio | 31,83 s | 31,85 s |
| Tiempo de generación (pared, incluye carga del pipeline ~30 s) | 83,0 s | 82,2 s |
| Velocidad efectiva | 23,0 s audio/min | 23,3 s audio/min |
| Errores reales de transcripción (faster-whisper small, es) | **0 / 101** | **0 / 101** |
| F0 mediana (aubio YIN) | 131 Hz | 146 Hz |
| Rango F0 p10–p90 | 103–277 Hz | 96–239 Hz |
| RMS / pico | −26,2 dB / −3,7 dB | −25,9 dB / −3,8 dB |

### Estimación para ~35 min de voz

- Tasa medida: ~2,6 s de pared por 1 s de audio (incluye la carga del
  pipeline, que en una sola ejecución larga se amortiza).
- **~90 min de pared en el peor caso; 60–75 min si se genera todo en
  una sola ejecución** (la carga ~30 s se paga una vez). En ambos
  casos, lanzar en segundo plano y seguir con otras tareas.

### Detalle de la verificación por transcripción

- em_alex: 2 diferencias, ambas artefactos ortográficos del ASR, no
  errores del TTS: «pese»→«pece» (homófonos con seseo) y «qué»→«que»
  (solo la tilde). 0 errores reales.
- em_santa: las mismas 2 + «por qué»→«porque» (p=0,526, baja
  confianza → INCIERTO por la regla del 18-nov, no veredicto).
  Segunda opinión con faster-whisper **base**: oyó «por qué»
  (p=0,800) y «pese» correctamente. **Era error del ASR, no del TTS.**
  0 errores reales.

### Justificación de la elección

Empate técnico en inteligibilidad (0 errores reales) y velocidad
(±1 s). Desempate:

1. **Voz más grave** (F0 131 vs 146 Hz): menos fatigante en 35 min
   de escucha continua.
2. **Rango de entonación más amplio** (103–277 vs 96–239 Hz):
   más expresiva; santa corre más riesgo de sonar monótona en un
   video largo.
3. **Voz por defecto del hub**, ya usada en los previews de Marabana
   y Pilar: pipeline probado, sin sorpresas.
4. Señal débil a favor: el modelo small oyó bien el «qué» de alex
   (p=0,827) y confundió el «por qué» de santa — alex articula el
   acento interrogativo con algo más de claridad.

Archivos: `public/audio/voice-test/em_alex.wav` y `em_santa.wav`
(+ `vo-lines-alex.json` / `vo-lines-santa.json`).

## 2. Música de fondo: NINGÚN cue local de Flow encaja

Las 3 pistas locales son cues documentales dramáticos del Memorial,
no camas calmadas. Medición objetiva (RMS por segundo):

| Pista | Duración real | Rango RMS/s | Salto máx. en 1 s | Carácter |
|---|---|---|---|---|
| historical-investigation-flow.wav | 78,9 s | 53,2 dB | 18,2 dB | Investigación/tensión; subidas y bajadas fuertes (−29 → −13 dB) |
| shadows-and-evidence-flow.wav | 80,1 s | 63,5 dB | 24,4 dB | La más dramática; perfil muy irregular |
| weight-of-memory-flow.wav | 58,5 s | 39,7 dB | 11,8 dB | La menos mala, pero emotiva/triste, irregular y con fade-out final |

Problemas comunes: cambios bruscos de energía (una cama bajo
narración debe moverse <~6 dB), colas con fade-out (el loop no es
limpio: habría que recortar la cola y crossfadear) y duración corta
(58–80 s → 27–36 repeticiones para 35 min; la repetición se notaría).

### Candidatos en la nube de Flow (sin descargar — NO verificados)

Por nombre/descripción, el más prometedor es **«Right to Food
Underscore» (2:32)** — es el único etiquetado explícitamente como
*underscore*. Seguidores: «Memoria de Boca de Samá» (2:39, memoria)
y «Firm Roots» (2:27). **Recomendación: que el agente padre descargue
«Right to Food Underscore» por navegador y lo evalúe** (medir su
rango dinámico igual que arriba) antes de decidir. Si encaja, con
2:32 harían falta ~14 repeticiones con crossfade de 6–8 s, o mejor:
usarla como base y variar con otra pista calmada por bloques.

### Plan B — MusicGen (si Flow no da una pista calmada)

Script: `scripts/audio/gen-music.py` (MusicGen-small, CPU, mono,
stem a −16 LUFS; `mix.py` ya soporta secciones con crossfades y
ducking bajo la voz). **No generado todavía** (paso más lento; lo
lanza el agente padre tras este informe).

- Prompt (único para todas las secciones, misma semilla para
  coherencia): «calm ambient documentary underscore, soft piano and
  warm synth pads, slow tempo, gentle, unobtrusive background music
  for narration, no drums, no vocals, no dramatic swells, even
  dynamics throughout»
- Secciones: **7 de ~300 s** (5 min) con crossfade de 8 s entre
  ellas → ~35 min. Alternativa más segura: 12 de ~180 s (si las
  secciones largas pierden coherencia).
- Tiempo: desconocido para secciones largas (el README cita ~1–2 min
  por sección corta). **Medir primero una sección de 60 s** y
  extrapolar antes de lanzar las 7.
- Nota: MusicGen-small es mono; para una cama discreta bajo narración
  es aceptable.

## 3. Problemas encontrados

- La primera tanda de generación falló por mi harness de medición
  (`/usr/bin/time` no existe en la VM; el `grep` se tragó el error
  real). La generación en sí funciona; se re-lanzó sin `time` y con
  `date` y salió bien. Lección: medir con `date +%s` o con el
  `durationMs` del exec, no con GNU time.
- `bc` no está instalado (irrelevante; se usó el tiempo del exec).
- librosa no está en ningún venv; el análisis de F0/RMS se hizo con
  aubio + numpy + soundfile (disponibles en el venv del hub).
