# Selección automática de ventana de cama — hub-speed-v5 (pieza BED)

Fecha: 21-nov-2026. Rama: `work/hub-speed-v5-bed`.
Script: `scripts/audio/select-bed-window.py` (+ tests
`scripts/audio/test_select_bed_window.py`, 22 tests).

## Problema

La pista «instrumental» de Google Flow Music («Documentary
underscore — Martí reel», 179,56 s) llevaba texturas vocales
fantasma en 60–88 s. La ventana V4.1 (72–141,23 s) empezaba dentro
de esa zona y los primeros ~16 s del reel llevaban susurros bajo
la VO. La V5 tuvo que mover la ventana A MANO a 88–157,23 s.
Esta pieza automatiza esa decisión: dada una pista y una duración
objetivo, elige la mejor ventana sin intervención.

## Diseño

**Un solo escaneo.** La pista se decodifica UNA vez a WAV 16 kHz
mono; ese WAV alimenta (a) una sola pasada Whisper (faster-whisper
small, con VAD + sin VAD de registro, igual que `scan-bed.py`) sobre
TODA la pista y (b) la curva RMS por segundo. Las ventanas
candidatas (paso 1 s por defecto) se puntúan a partir de ese único
escaneo — nunca un Whisper por ventana. El informe JSON guarda el
escaneo completo y `--scan-json` lo reutiliza para re-puntuar con
otros parámetros sin gastar CPU.

**Rechazo duro:**
- **Voz (VAD):** segmento VOICE de la pasada con VAD que solape la
  ventana ≥ 1,0 s. El VAD es el discriminador (ver `scan-bed.py`):
  la música limpia da 0 segmentos con VAD. El solape mínimo de 1 s
  existe porque una frase puede terminar justo dentro de la ventana:
  la frase fantasma 80,69–88,49 s termina 0,49 s dentro de la
  ventana V5 y el escaneo de esa ventana dio 0 segmentos con VAD.
- **Agujero:** un bin de 1 s más de 14 dB por debajo de la mediana
  RMS de la ventana (calibración abajo).

**Puntuación (base 100):** ataque en el primer segundo (−2 pt/dB
sobre mediana +3 dB); inicio fuerte (−2 pt/dB sobre mediana +1 dB
en los primeros 5 s); crecimiento al cierre = mediana últimos 10 s
− mediana primeros 10 s (+1 pt/dB hasta +3, −1 pt/dB con suelo
−12); respiro profundo entre 8 y 14 dB (−1 pt/dB); voz sin VAD
(−30 pt, no es rechazo: la pasada sin VAD es de registro);
UNCERTAIN (−10 pt por segmento). **Desempate:** entre las aceptadas
a menos de 3 pt de la mejor, gana la más temprana (diferencias
< 3 pt en una escala heurística de 100 no son significativas;
reproduce la decisión V5: primera ventana limpia tras la
contaminación).

**Códigos de salida:** 0 = ventana elegida; 1 = ninguna ventana
pasa (p. ej. pista entera contaminada); 2 = error. El escaneo
Whisper toma el candado compartido `/tmp/hub-speed-v5-render.lock`
(`--no-lock` lo omite); la puntuación no lo necesita.

## Calibración (pista Flow, faster-whisper small)

Curva RMS medida (1 s, 16 kHz mono; reproducida en
`tests/fixtures/flow-rms-curve.json`):

| Zona | Mediana | Mínimo | Notas |
|---|---|---|---|
| 0–60 s (limpia) | −27,7 dBFS | −44,9 @10 s | Apertura irregular; ataque en el s 0 |
| 60–88 s (contaminada) | — | — | Voz fantasma (VAD 80,69–88,49 s) |
| 88–179,56 s (limpia) | −19,1 dBFS | −29,8 @154 s | Meseta 88–141 s ~−17/−20; coda en descenso 142–157 s; fade-out 175–179 s (−36…−63) |

Umbral de agujero (14 dB): la ventana 0–69,23 s tiene un agujero de
−44,9 dBFS (17,2 dB bajo su mediana −27,7) y la V5 tiene un respiro
de frase de −29,8 dBFS (10,6 dB bajo su mediana −19,1); 14 dB separa
ambos con ~3 dB de margen a cada lado. Las ventanas 107–110 caen por
el fade-out (profundidad 16,0–42,9 dB).

## Verificación obligatoria (pista Flow, objetivo 69,23 s)

### Escaneo real completo (corrida 1, 21-nov-2026)

Escaneo Whisper+VAD sobre TODA la pista (faster-whisper small, 2
pasadas), 112 candidatas, **21 aceptadas** (inicios 86–106 s),
91 rechazadas (86 por voz VAD, 28 por agujero).

Segmentos del escaneo (10 VOICE en total):
- VAD: **1 segmento, 0,00–86,51 s, VOICE, nsp 0,276**
  («¿Empecemos a reseñar?» — el texto varía entre corridas; lo
  estable es la clase y el nsp). Silero fusiona 0–86,51 s en una
  sola región porque la música es continua (sin silencios ≥500 ms);
  Whisper transcribe una frase sobre esa región. Ver «Hallazgo:
  fusión VAD» abajo.
- Sin VAD: 23 segmentos, todos en 60–89,28 s: 9 VOICE 60–78,28 s
  (nsp 0,375) + 13 UNCERTAIN de 1 s («No.», 78,28–89,28 s, nsp
  0,375; bucle de repetición de Whisper sobre la textura fantasma)
  + 1 HALLUCINATION Amara.org 179,28–184,28 s (más allá del audio,
  correctamente ignorada).

- **ELEGIDA: 89,00–158,23 s (92,0 pt)** — equivalente a la V5
  (88–157,23 s, 1 s después). Mediana −19,1 dBFS, inicio −19,2,
  cierre −24,6 (crecimiento −5,3 dB), respiro máx 10,6 dB.
  Mejor puntuación absoluta: 97,00–166,23 s (94,7 pt); 89 está a
  2,7 pt, dentro de la banda de desempate, y gana por ser la más
  temprana. La ventana 88 queda aceptada con 81,7 pt: la cola
  UNCERTAIN sin VAD 88,28–89,28 s le resta −10 pt.
- **72,00–141,23 s (V4.1): RECHAZADA por voz** — «voz (VAD)
  0,00–86,51 s solapa 14,5 s (nsp 0,276)», más 3 VOICE sin VAD
  (73–78 s) y 13 UNCERTAIN (72–89 s).
- **0,00–69,23 s: RECHAZADA por voz Y por agujero** — voz VAD
  (solapa 69,2 s) y «agujero −44,9 dBFS a los 10 s (17,2 dB bajo
  la mediana −27,7)». La voz es real: la pasada sin VAD da VOICE
  en 60–68,28 s, dentro de la ventana. La expectativa inicial
  («debe perder por el agujero, no por voz») venía de los controles
  0–60 s (PASS) y 60–88 s (FAIL), no de una medición de 0–69,23 s;
  la medición real muestra ambas causas.
- **Sin ventana:** con `--duration 170` las 11 candidatas se
  rechazan y el código de salida es **1**. Verificado con el
  escaneo real.
- **Determinismo:** re-puntuar con `--scan-json` sobre el informe
  de esta corrida reproduce la elección exacta (89,00–158,23 s,
  92,0 pt) en 2,2 s.

### Tiempos (pista completa, 179,56 s)

Corrida 1 (pared): **658,3 s (11,0 min)** en total; RMS 0,1 s,
puntuación 0,0 s. El Whisper real (2 pasadas) tomó ~120–160 s
estimados: la medición inicial (655,9 s) incluía la espera del
candado (~8,5 min, hermanos renderizando) — bug de medición
corregido en el mismo commit (ahora `lock_wait_s` aparte de
`whisper_s`). Re-puntuar con `--scan-json`: 2,2 s (sin Whisper).

### Segunda corrida (estabilidad entre corridas): PENDIENTE

No realizada: el candado compartido estuvo ocupado por el render
completo del hermano (hub-speed-v5-render, 14 tramos + pasos
posteriores) durante toda la ventana disponible (~20 min de espera
sin liberarse). La verificación obligatoria está completa con la
corrida 1 (escaneo real) + la re-puntuación determinista con
`--scan-json`. Una segunda corrida aportaría el tiempo exacto de
Whisper (estimado 120–160 s en la corrida 1, tras corregir el bug
de medición) y un segundo punto de estabilidad de la elección ante
la no-determinación de Whisper; puede hacerse en cualquier momento
con el mismo comando (cada informe guarda su escaneo para comparar
segmentos y elección).

### Hallazgo: fusión VAD en el escaneo de pista completa

En el escaneo de pista completa, Silero fusiona 0–86,51 s en UNA
sola región de «voz» (la música es continua, sin silencios ≥500 ms
que partan la región), mientras que los escaneos por ventana de la
calibración daban la frase ajustada a 80,69–88,49 s. Consecuencia:
el selector rechaza por voz VAD 86 ventanas en vez de 75 — pero
en esta pista **ninguna ventana limpia resultó rechazada por ello**:
todas las rechazadas por voz VAD contienen además voz o UNCERTAIN
sin VAD en 60–89,28 s o el agujero, y la elección (89,00 s) es la
misma que con segmentos ajustados. La dirección del error es
conservadora (rechaza de más, nunca acepta una ventana
contaminada). Mejora futura (PENDIENTE, no medida): escaneo VAD
por tramos solapados (p. ej. 30 s con 5 s de solape) para localizar
mejor las frases fantasma; requeriría su propia calibración y otra
corrida completa.

### Escaneo sintético (calibración, sin Whisper)

Con el escaneo calibrado (`tests/fixtures/flow-scan.json`: VAD
80,69–88,49 s nsp 0,224; sin VAD «¡Suscríbete!» 60–62 s nsp 0,106;
alucinación Amara.org 100–105 s): 112 candidatas, 19 aceptadas, 93
rechazadas (75 por voz VAD, 28 por agujero; algunas por ambas).

- **ELEGIDA: 88,00–157,23 s (91,7 pt)** — la ventana V5 exacta.
  Mediana −19,1 dBFS, inicio −19,2, cierre −24,9 (crecimiento
  −5,7 dB), respiro máx 10,6 dB.
- Mejor puntuación absoluta: 97,00–166,23 s (94,7 pt); 88 está a
  3,0 pt, dentro de la banda de desempate, y gana por ser la más
  temprana. Top 5: 97 (94,7), 101 (94,6), 102 (94,6), 98 (94,4),
  103 (94,2).
- **72,00–141,23 s (V4.1): RECHAZADA por voz** — «voz (VAD)
  80,69–88,49 s solapa 7,8 s (nsp 0,224)». Su puntuación de arco
  (102,7 pt) es la más alta de todas: sin el escaneo de voz, el
  selector la habría elegido. Es exactamente el fallo de la V4.1.
- **0,00–69,23 s: RECHAZADA por agujero** — «agujero −44,9 dBFS a
  los 10 s (17,2 dB bajo la mediana −27,7)», no por voz (la voz sin
  VAD 60–62 s solo resta −30 pt como nota secundaria; el ataque
  inicial +7,0 dB resta otros −8,0 pt).
- **Sin ventana:** con `--duration 170` las 11 candidatas se
  rechazan (todas solapan la zona contaminada) y el código de
  salida es 1. Verificado.

### Tests

`scripts/audio/test_select_bed_window.py`: **22 tests, todos OK**
(`.venv/bin/python -m unittest scripts.audio.test_select_bed_window`).
Sintéticos (voz VAD, cola < 1 s, agujero vs respiro, voz sin VAD /
`--strict`, alucinación ignorada, UNCERTAIN, arco, desempate, sin
ventana, candidata alineada al final) + regresión Flow (elige
88,00–157,23 s; rechaza 72 por voz y 0 por agujero; métricas V5).

## Texto exacto para `AGENTS.md` (lo integra el coordinador al fusionar)

Añadir tras la sección «Camas generadas: escanear con Whisper antes
de usarlas»:

```markdown
## Selección automática de ventana de cama (21-nov-2026, hub-speed-v5)
**No elegir la ventana de una cama a mano: usar
`scripts/audio/select-bed-window.py --in <pista> --duration <s>`.**
El selector escanea la pista UNA sola vez (Whisper + VAD sobre
toda la pista + curva RMS por segundo) y puntúa las ventanas
candidatas a partir de ese escaneo: rechaza las que solapan voz
VAD (≥1 s) o tienen un agujero (>14 dB bajo la mediana) y elige
la mejor por arco (inicio calmado, leve crecimiento al cierre,
sin agujeros), con desempate a la más temprana entre las que
están a <3 pt de la mejor. Código 0 = ventana elegida, 1 =
ninguna ventana pasa (elegir otra pista), 2 = error. Verificado
sobre la pista Flow: elige 89-158,23 s (equivalente a la ventana
V5, 88-157,23 s) y rechaza la 72-141,23 s (V4.1, voz) y la
0-69,23 s (agujero -44,9 dBFS + voz 60-68,28 s).
Ver `scripts/audio/README.md` § «Selección de ventana de cama» y
`docs/HUB-SPEED-V5-BED.md`.
```

## Pendiente

- Escaneo VAD por tramos solapados (ver «Hallazgo: fusión VAD»):
  localizar mejor las frases fantasma en pistas con textura vocal
  extensa. No implementado: en la pista Flow la fusión no cambió
  la elección y la dirección del error es conservadora; requeriría
  su propia calibración y otra corrida completa de Whisper.
- Segunda corrida de estabilidad (ver arriba): PENDIENTE por el
  candado ocupado; no bloquea la verificación obligatoria.
```

