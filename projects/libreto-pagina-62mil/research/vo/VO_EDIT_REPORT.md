# Informe de edición de la VO — «La página que engañó a 62.000 personas»

- **Fecha:** 23-nov-2026
- **Proyecto:** `libreto-pagina-62mil` (video largo, El Libreto)
- **Guion:** `~/workspace/marketing/research/dossiers/messi-patron-largo/guion-borrador.md` (31 líneas, 4 actos)
- **Voz:** real del usuario, una sola toma con repeticiones en vivo («quedate con lo bueno»)

## 1. Resumen

| | |
|---|---|
| Original (`vo-original.m4a`) | 590,51 s (9:51), 48 kHz estéreo AAC |
| Editada (`vo-edited.wav`) | **545,29 s (9:05,3)**, 48 kHz estéreo PCM |
| Limpia, preset pro (`vo-edited-clean.wav`) | **545,29 s**, −17,9 LUFS, TP −2,0 dBTP, SNR 50,7 dB, mono |
| Palabras del guion | **1.465** (ver nota sobre el conteo al final) |
| Ritmo efectivo | **161,2 palabras/min** |
| Repeticiones eliminadas | **8 sitios**, ~49 palabras, 45,22 s netos |
| Empalmes | 10, todos limpios a nivel de muestra (salto máximo en el borde: 0,00006) |
| Verificación vs. guion | **2 MATCH, 27 INCIERTO, 2 DISCREPANCIA** (de 31 líneas) |

**Archivo para el pipeline:** `vo-edited-clean.wav` (preset pro). La transcripción de esta versión (`vo-edited-transcript.json`, 94 segmentos, con word_timestamps) es la base para `vo-captions.json` y el paso `align`.

## 2. Repeticiones eliminadas (8 sitios)

Tiempos en el ORIGINAL. Criterio: intento completo y fluido; ante dos intentos buenos, el último. Los puntos de corte se refinaron con la envolvente RMS a 10 ms (los tiempos de palabra de Whisper absorben la pausa previa y empiezan hasta 2 s antes del onset real).

| # | Original | Lo que pasó | Decisión |
|---|---|---|---|
| R1 | 90,34–94,78 | «La página se llamaba José Forever» ×2. El primer intento se corta antes de «El Taiger»; el segundo vacila 2 s tras «La» y sigue completo. | Fuera el intento 1. Se conserva el 2 desde su onset real (94,80). Pausa de cambio de acto: 1,01 s (respiración + silencio reales de la grabación). |
| R2 | 219,44–225,18 | El tuit en inglés «Works in Cuba, just can't be sold there» ×2. Intento 1 atropellado (prob. ASR 0,11–0,33); intento 2 más lento y claro (prob. 0,63–0,98). | Fuera el intento 1. Se conserva el 2. Empalme a mitad de frase, sin pausa (la cita sigue a los dos puntos). |
| R3 | 392,73–395,79 | «Y eso es lo que hace peligroso» (sin el segundo «lo») y luego «Y eso es lo que **lo** hace peligroso». | Fuera el intento 1 (incompleto). Se conserva el 2, igual al guion. Pausa [P] 0,35 s. |
| R4 | 418,75–421,63 | «La confirmación» ×2 (arranque en falso y reintento). | Fuera el primer «la confirmación». Se conserva «La confirmación llegó en noviembre». Pausa [P] 0,35 s. |
| R5 | 495,90–502,00 | «Por eso, tres comprobaciones. Tardan menos de un minuto.» ×2, ambos completos. | Fuera el intento 1; se conserva el 2 (regla: ante dos buenos, el último). Pausa [P] 0,35 s. |
| R6 | 518,01–520,05 | «Segundo» corregido en vivo a «Segunda». | Fuera «segundo». Se conserva «Segunda: revisa los canales oficiales». Pausa [P] 0,35 s. |
| R7 | 555,85–561,09 | «Una imagen que parece real» ×3: intento 1 trabado («una imagen que aparece que parece»), intentos 2 y 3 buenos e idénticos. | Fuera los intentos 1 y 2. Se conserva el 3 (último bueno). Empalme a mitad de frase («...que quieres creer **y** una imagen...»), sin pausa. |
| R8 | 564,55–567,67 | «La única defensa es la verificación» ×2. El intento 1 es completo y fluido; el 2 se rompe («la» + 1,3 s de duda + «única defensa...»). | **Se conserva el intento 1** (mejor toma; la regla del «último» solo desempata entre dos buenos). Se inserta 0,35 s de tono de sala del propio original (7,00–7,35) como pausa [P] antes de «Y la verificación empieza por ti». |

Además: recortados 8,92 s de entrada (ruido de preparación + silencio) y 3,36 s de cola (ruidos de manipulación del teléfono al terminar), con fade-out de 0,4 s al final.

**Pausas:** cada empalme conserva la pausa del guion ([P] 0,35 s, [P+] 0,5–0,7 s, 0 s a mitad de frase). Ninguna pausa intra-línea se tocó: los cortes caen en silencios o en mínimos de energía entre palabras. Plan de cortes reproducible: `edit-plan.json` + `vo-edit.py`.

## 3. Verificación contra el guion

Herramienta: `scripts/audio/verify-vo-lines.py` (31 líneas, `vo-lines.json` vs. `vo-edited-transcript-by-line.json`). Informe JSON: `vo-verify-report.json`.

**Resultado: 2 MATCH (L6, L26), 27 INCIERTO, 2 DISCREPANCIA (L16, L17).** Código de salida 2 (bandera de revisión humana, no auto-FAIL).

### 3.1 Las 2 DISCREPANCIA — verificar de oído

| Línea | En la VO editada | Guion | Sospecha |
|---|---|---|---|
| **L16 — 4:56** | «Esto también es falso» (296,20 s) | «**Es totalmente falso**. No he salido de Estados Unidos» | **La única sospecha seria.** Las dos transcripciones (original y editada) oyen «esto también es falso» y la herramienta marca «totalmente» como no oída con contexto de alta confianza. Puede ser un lapsus de lectura («Es totalmente» → «Esto también») o un error del ASR ante el habla rápida. **Es la cita-prueba del caso Bebeshito: hay que verificarla de oído.** Si es un lapsus, basta regrabar esa frase (no toda la VO). |
| **L17 — 5:17** | «...y hacer puto y el poder digital» (317,22 s) | «...Yasel Porto y elpoderdigital» | Artefacto del ASR con el nombre propio: «Yasel Porto» (4 sílabas) sale como «y hacer puto» (mismo ritmo; «puto» es una alucinación típica de Whisper ante sílabas poco claras). Casi seguro que la toma está bien; verificación de oído de 5 segundos. |

### 3.2 INCIERTO que merece oído (resto: artefactos claros del ASR)

Tiempos en la VO editada:

| Línea | Momento | Guion | ASR | Juicio |
|---|---|---|---|---|
| L13 | 3:18 (198,4 s) | «Musk SÍ dijo **algo real** sobre Cuba» | «a correar» | Probable error del ASR (habla rápida); la frase es el núcleo del matiz Musk, vale una escucha. |
| L2 | 0:15 (15,3 s) | «que **en marzo** publicó» | «en malso» | Casi seguro el ASR: «marzo» con la r→l cubana («malzo»). |
| L12 | 3:07 (187,5 s) | «a **Daddy** Yankee» | «a Ari Yankee» | Casi seguro el ASR (la d inicial se pierde en habla rápida). |
| L28 | 8:13 (493,0 s) | «**estaría en** sus cuentas» | «estarían» | Fusión del ASR («estaría-en» → «estarían»). |
| L31 | 8:57 (536,8 s) | «**sino verlo** con tus propios ojos» | «si no ves lo» | Fusión del ASR. |
| L19 | 6:16 (375,8 s) | «no apela **a** la razón» | «no apela la razón» | La «a» tragada: el mismo patrón del caso Martí-Fidel (18-nov). El ASR sí captó la «a» en «apela a la esperanza» justo después. |

### 3.3 Patrones sistemáticos del ASR (no son errores de la toma)

- **«el» → «en»** (8 veces: L3, L4, L8, L14, L18, L20, L22, L24): el «el» átono en habla rápida cubana.
- **Nombres propios**: José→Joseph, Taiger→Tiger (así se pronuncia), Messi→mesi, Roccuzzo→rocuzzo, Gemini→yemení, InfoVeritas→infoberitas, Cuballama→cubayama, Miami→mayami, Nayib→nahid, Bebeshito→bebeschito, Habana→havana, Valdés-Galloso→valdés galloso (partido), Padron→padrón.
- **Palabras en inglés**: feed→fit/fin, short→show, factchecker→fact checker, video→vídeo.
- **Números**: «62.000»→«62 mil», «600.000»→«600 000», «7.800»→«7 800» (formato, mismo valor).
- **«elTOQUE» → «el toque»**: la misma palabra partida en dos.

### 3.4 Dos cosas que la transcripción de la versión limpia RESOLVIÓ

- **El tuit en inglés se transcribe perfecto**: «Works in Cuba. Just can't be sold there.» (la transcripción del original lo garabateaba: «works en cuba ya scan b sol der»). La cita está bien dicha y la mejora pro ayudó a la inteligibilidad.
- **«La réplica del post» en singular** (L24, 455,36 s, p=0,98): el original había oído «las réplicas»; la versión limpia confirma el singular del guion.

## 4. Mejora de voz (enhance-voice.py, preset pro)

Comando (desde `~/workspace/remotion-hub/repo`):
`enhance-voice.py --in vo-edited.wav --out vo-edited-clean.wav --preset pro --compare --force`

| | Entrada (vo-edited.wav) | Salida pro (vo-edited-clean.wav) |
|---|---|---|
| Duración | 545,29 s | **545,29 s (idéntica)** |
| LUFS | −18,2 | **−17,9** |
| True peak | 0,0 dBTP | **−2,0 dBTP** |
| SNR | 32,9 dB | **50,7 dB (+17,8 dB)** |
| Suelo de ruido | −52,2 dBFS | **−64,6 dBFS** |
| Canales | 2 (estéreo) | 1 (mono; DeepFilterNet) |
| Loudnorm | — | two-pass lineal, I=−18,0 / TP=−2,0 / LRA=9,0 |

Cadena pro: DeepFilterNet 0.5.6 (binario `~/workspace/.voice-env/bin/deep-filter`, DF recortó 0,03 s de cola y se rellenó con silencio) → highpass 80 → afftdn nr=12 nf=−55 → EQ −2 dB @ 250 / +3 dB @ 3,5 k / aire +1,5 dB @ 10 k → compresor 2:1 → deesser → alimiter → loudnorm. Informe JSON: `vo-edited-clean.wav.json`. A/B: `vo-edited-clean-ab.wav`.

### 4.1 El FAIL de pausas del preset pro es un artefacto de medida

El veredicto fue FAIL por «6 pausas recortadas» (pérdidas medidas del 12–59% en pausas de 0,25–0,61 s). **No es daño real:**

1. **La duración es idéntica (545,29 s)** y la cadena no manipula el tiempo: ninguna pausa puede haberse recortado temporalmente.
2. **Re-medición con umbral absoluto fijo (−45 dBFS)** en las 6 pausas: las duraciones cambian entre −0,10 s y +0,10 s (típico ±0,03 s). Las pausas están intactas.
3. **El preset `clean` falla MÁS (17 pausas)** con una cadena más ligera y sin DeepFilterNet: la prueba es sensible a cualquier cambio de niveles (el compresor + loudnorm sube los sonidos bajos de las pausas por encima del umbral relativo del detector), no a daño real.

Por eso se mantiene el preset pro como entregable (es el aceptado por el usuario y el que mejor mide: 6 pausas señaladas frente a 17 en clean, y +17,8 dB de SNR frente a +1,7 dB). La versión clean queda como respaldo: `vo-edited-preset-clean.wav` (545,29 s, −18,3 LUFS, TP −2,0, SNR 34,6 dB).

## 5. Notas

- **Conteo de palabras del guion:** la cabecera de `guion-borrador.md` dice 1.493 palabras, pero el texto de narración (sin [PANTALLA], sin marcas [P]/[P+]) tiene **1.465** palabras contadas dos veces por métodos independientes (extracción del .md y `vo-lines.json`, con diff palabra por palabra: coinciden al 100%). La diferencia (28) probablemente viene de un conteo sobre un borrador anterior al recorte final. El ritmo real es 161,2 ppm; la duración estimada del guion (10:39 a 140 ppm) asumía un ritmo más lento.
- **Los timestamps de palabra de Whisper adelantan tras las pausas** (mediana −0,21 s, hasta −0,56 s): los momentos de la §3.2 son orientativos (±0,5 s). El paso `align` del pipeline re-temporiza los captions desde los onsets acústicos antes de renderizar.
- **Archivos en `research/vo/`:** `vo-original.m4a` (original intacto), `vo-original-16k.wav`, `vo-transcript.{txt,json}` (transcripción del original), `vo-edit.py` + `edit-plan.json` (cortes reproducibles), `vo-cut-analysis.py` (análisis de envolvente), `vo-edited.wav`, `vo-edited-clean.wav` (+ `.json`, `-ab.wav`, `-16k.wav`), `vo-edited-preset-clean.wav` (+ `.json`, respaldo), `vo-edited-transcript.{txt,json}`, `vo-edited-transcript-by-line.json`, `vo-lines.json` (31 líneas del guion), `vo-verify-report.json`, `vo-segment-lines.py`, este informe.

## 6. Pendiente

1. **El usuario verifica de oído** (prioridad: L16 a las 4:56; después L17 a las 5:17). Si L16 es un lapsus, regrabar solo esa frase.
2. Pipeline de video largo: `align` (captions desde `vo-edited-transcript.json`) → timeline → música (3 camas Flow, en generación) → mezcla → pre-vuelo → render.

## Verificación de oído del usuario (23-nov-2026, 17:04)

L16 (4:56, «Es totalmente falso»): el usuario escuchó el trozo y confirmó que la toma dice «Es totalmente». El ASR erró en las dos pasadas («Esto también es falso»). NO se regraba. La VO editada queda confirmada.
