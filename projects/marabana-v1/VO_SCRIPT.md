# VO_SCRIPT.md — Guion de voz en off · Reel Marabana V1

**Decisión del usuario (15-nov-2026):** el reel SÍ lleva voz en off. Anula la decisión
anterior de «sin voz en off» (STRATEGY.md §2 y §11.6). La voz de IA de este proyecto
es SOLO una previsualización: el usuario grabará la definitiva con su propia voz.

## Tono y ritmo

- **Natural, humano, conversacional** — como si se lo contaras a un amigo, no como
  un locutor de documental. Ese era precisamente uno de los fallos de los reels
  «ecosistema» (dicción formal y escrita) y aquí se evita a propósito.
- Ritmo de reel: rápido pero claro. Pausas dramáticas solo en dos puntos marcados
  con `…` (el giro «Pero a pesar de ello…» y el remate de Ernesto «…con un bastón»).
- 114 palabras. Duración objetivo: ~40–44 s leído a ritmo natural.

## Guion (10 líneas)

| # | Línea | Beat |
|---|---|---|
| 1 | ¿Sabías que el bloqueo llegó hasta el maratón? | 1 Gancho |
| 2 | En 2012, la OFAC canceló el programa que traía corredores de Estados Unidos a Marabana. | 2 Dato 2012 |
| 3 | Un año antes, veintiuno habían corrido en La Habana. | 4 Contraste (el sello cae al final de la línea 2) |
| 4 | Pero a pesar de ello… | 5 Giro |
| 5 | Hoy, catorce años después, casi tres mil corredores tomaron las calles de La Habana en la cuarenta edición de Marabana. | 6 Salida + 7 Número (el corte 6→7 cae en «casi») |
| 6 | Y los cinco kilómetros se llamaron Carrera contra el Bloqueo y por la Paz. | 8 La 5K |
| 7 | Como dijo el corredor Yuraldi Cava: «El bloqueo asfixia al pueblo cubano». | 9 La voz |
| 8 | En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas. | 10 Ganadores |
| 9 | Y Ernesto Javier Consuegra completó los diez kilómetros… con un bastón. | 11 Ernesto |
| 10 | Hoy La Habana corrió. Y cada paso fue una denuncia. | 12 Cierre |

## Texto corrido (para grabar / sintetizar)

> ¿Sabías que el bloqueo llegó hasta el maratón?
> En 2012, la OFAC canceló el programa que traía corredores de Estados Unidos a Marabana.
> Un año antes, veintiuno habían corrido en La Habana.
> Pero a pesar de ello…
> Hoy, catorce años después, casi tres mil corredores tomaron las calles de La Habana en la cuarenta edición de Marabana.
> Y los cinco kilómetros se llamaron Carrera contra el Bloqueo y por la Paz.
> Como dijo el corredor Yuraldi Cava: «El bloqueo asfixia al pueblo cubano».
> En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas.
> Y Ernesto Javier Consuegra completó los diez kilómetros… con un bastón.
> Hoy La Habana corrió. Y cada paso fue una denuncia.

## Notas de pronunciación (para la grabación del usuario y el TTS)

- **OFAC**: siglas de la Oficina de Control de Activos Extranjeros de EE. UU.
  Se lee «O-F-A-C» (letra por letra). En el TTS de previsualización se escribe
  «O.F.A.C.» (con puntos) para que el sintetizador deletree las iniciales.
- **Yuraldi Cava**: nombre del corredor citado por AP (Cubadebate, 15-nov-2026).
- **Estévez / Bacallao / Tamerón / López Guisao**: ganadores verificados
  (ver STRATEGY.md §15). En la voz se dicen solo los apellidos.
- **«doblete de Las Tunas»**: los dos ganadores de la media son tuneros
  (José Tamerón Cruz y Marian Yanet López Guisao).
- **Números en palabras**: la voz dice «veintiuno», «casi tres mil», «diez
  kilómetros», «cinco kilómetros»; en pantalla se ven «21», «3.000», «10K»,
  «5K». Los subtítulos karaoke transcriben lo que dice la voz.

## Voz de previsualización (IA)

- Herramienta: **Piper** (TTS neuronal local, 100% offline tras descargar
  el modelo — `pip install piper-tts`, modelo en
  `~/workspace/.piper-voices/es_MX-ald-medium/`).
- Voz: **es_MX-ald-medium** (masculina, español de México, calidad media —
  el registro neutro latinoamericano más cercano al del usuario; la primera
  voz probada, es_MX-claude-high, resultó ser femenina — F0 mediana 184 Hz
  — y no existe voz masculina «high» en español en Piper).
- Velocidad: length_scale 0,75 (≈25% más rápido que el natural de ald;
  con 1,0 la VO salía en ~50 s y con 0,88 en 46,6 s — ald es más lento que
  claude en natural —; con 0,75 queda en ~40 s, ritmo de reel). El ritmo
  lo dan los silencios entre líneas (0,2 s entre frases normales).
- Pausas: 500 ms tras «Pero a pesar de ello…», 700 ms tras
  «…los diez kilómetros…» (los dos puntos dramáticos), insertadas como
  silencio real al concatenar los fragmentos.
- Archivo: `public/audio/vo-preview.wav` (WAV 48 kHz, normalizado a −14 LUFS).
- Generación: `scripts/gen-vo-piper.py` (sintetiza línea por línea y guarda
  los tiempos de cada línea en `public/audio/vo-lines.json`).

### Por qué no edge-tts (primera opción, descartada 15-nov-2026)

La primera opción era **edge-tts** (`es-MX-JorgeNeural`, voz neuronal
gratuita de Microsoft). La lista de voces funciona desde este entorno, pero
la síntesis usa WebSocket contra `speech.platform.bing.com` y el endpoint
no responde de forma utilizable a través del proxy de egreso: en pruebas
directas devolvió, de forma inconsistente, timeout de 60 s, HTTP 400 y
101 con el header `Connection` mutilado (aiohttp lo rechaza por igualdad
estricta). Un WebSocket genérico (echo de Postman) SÍ funciona por el mismo
proxy, así que el problema es específico de Bing. El script `gen-vo.py`
queda en el repo documentado por si se ejecuta fuera de este proxy.

## Sustitución por la voz del usuario

Ver **EDIT_NOTES.md** (procedimiento exacto): reemplazar
`public/audio/vo-preview.wav` por la grabación del usuario, re-transcribir
con faster-whisper (word_timestamps), regenerar `src/captions.ts` y el
ducking, re-temporizar si la duración cambia y re-renderizar.
