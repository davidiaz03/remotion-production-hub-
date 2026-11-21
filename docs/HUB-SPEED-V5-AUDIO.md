# hub-speed-v5 — Herramientas de audio

Trabajo del agente de audio (rama `work/hub-speed-v5-audio`, 21-nov-2026).
Dos piezas, verificadas sobre el reel marti-fidel V5 (VO real v41,
11 líneas, guion V4.3; máster V5 `out/marti-fidel-v5_MASTER.mp4`).

> Regla del proyecto: nada se da por verificado sin medir. Las
> mediciones de este documento son corridas reales, no estimaciones.

## Pieza 1 — Alineación acústica de captions

**Problema (hallazgo V5, adjudicación `reports/adjudicacion-auditoria-v5.md`):**
los tiempos de palabra de faster-whisper adelantan sistemáticamente los
bordes tras pausa (mediana firmada −0,21 s; hasta −0,56 s). El karaoke
muestra la primera palabra de cada línea 0,20–0,56 s antes de oírse.
La auditoría V5 marcó 9 FAIL de (g) por eso.

**Archivos nuevos** (commit `93623a0`):

- `scripts/audio/envelope.py` — envolvente RMS vectorizada en ventanas
  de 10 ms (rejilla absoluta desde t=0), `envelope_onset` (umbral
  −50 dBFS + racha de 2 ventanas), `rise_onset` (máxima subida, solo
  contraste), `line_peak_db` (p95 por línea).
- `scripts/audio/align-captions.py` — re-temporiza los inicios de
  palabra tras silencio desde los onsets acústicos. Entrada JSON
  (HubCaption[]) o TS de Remotion (`export const CAPTIONS`); solo
  mueve `s`/`startMs` (+ el `start` del chunk en TS); `--verify`
  falla (código 2) si algún desvío supera 0,15 s tras corregir.

**Medición antes/después** (VO real v41 + captions V5; 173 palabras,
16 tras silencio, 11 corregidas):

| Palabra | Antes (s) | Después (s) |
|---|---|---|
| MARTÍ (L1) | −0,25 | 0,000 |
| ES (L3) | −0,42 | 0,000 |
| UN (L4) | −0,56 | 0,000 |
| WASHINGTON (L4) | −0,23 | 0,000 |
| YA (L5) | −0,20 | 0,000 |
| EL (L6) | −0,22 | 0,000 |
| EN (L7) | −0,29 | 0,000 |
| CUANDO (L9) | −0,49 | 0,000 |
| ¡QUE (L11) | −0,48 | 0,000 |
| NO (L2) | −0,129 | 0,000 |
| MUCHOS (L8) | −0,130 | 0,000 |

Desvío máximo: **0,56 → 0,049 s** (el restante es ESTÁ −0,049, bajo
el suelo de corrección de 0,05 s). Sobre el umbral 0,15 s: **9 → 0**.
`--verify` PASS.

De los 9 desvíos, 4 son adelantos REALES del karaoke renderizado
(MARTÍ, UN, EL, ¡QUE); los otros 5 son líneas en tarjeta/manuscrita
o ventana de karaoke apagado, y la corrección es igualmente correcta
(en caso de que la composición cambie, los tiempos ya son los
acústicos). Caso límite honesto: UN pasa a durar 0,10 s en pantalla
(13,37→13,47 s) — es la verdad de la grabación, no un error.

**Decisión de diseño (medida, no asumida):** el backlog V4 pedía
«envolvente/correlación en vez de umbral crudo», pero la V5 demostró
que el umbral NO era el problema. Las tres alternativas se probaron
sobre la VO real y se rechazaron con evidencia:

| Alternativa | Resultado |
|---|---|
| Umbral relativo al suelo (mediana previa + 5 dB) | Dispara en falso por deriva del tono de sala (MARTÍ 5,60 en vez de 5,90; UN 12,76 en vez de 13,37). El tono fluctúa ±7 dB entre segmentos y el onset de «EL» es de solo +8 dB: no hay margen separable. |
| Puerta de armonicidad (RMS > −55 dB y harm > 0,4) | El tono de sala de esta grabación ES armónico (0,45–0,53 en silencio puro): falsos disparos (MARTÍ 5,72; ¡QUE 64,02) y PIERDE «UN» entero. |
| Máxima subida de envolvente (`rise_onset`) | Encuentra el ataque MÁS FUERTE, no el primero: «EL» → 26,23 s (ataque de «GIGANTE») en vez de 25,91 s. |

`envelope_onset` (−50 dBFS absoluto + racha de 2 ventanas) coincide
al milisegundo con `acoustic_span(-50)` en los 17 captions tras
silencio de V5. Se conserva `rise_onset` como utilidad de contraste.

**Verificación render — PENDIENTE (candado compartido).** La
verificación numérica (0 FAIL acústico, desvío máx 0,02 s) está
cerrada; la confirmación visual por render quedó pendiente porque
el agente de render tomó el candado compartido a las 02:20 para
una secuencia de pruebas de tramos y a las ~02:55 inició un render
completo del reel (`--frames 0-2076 --chunk 150`, ~1 h+). Todo
queda preparado para correrlo en cuanto el candado se libere:

- Worktree desechable `/tmp/v51-render-test` (rama
  `tmp/v51-render-test`, desde esta rama @17ab141) con
  `src/captions-v41.ts` sustituido por la versión re-temporizada
  (modificación sin commitear, a descartar) y symlinks
  `node_modules` → `repo/node_modules` y
  `projects/marti-fidel/public` → `repo/projects/marti-fidel/public`.
- Script `/tmp/hsv5-audio/render-stills-v51.mjs`: bundle una vez +
  8 `renderStill` de `MainReelV5` a `/tmp/hsv5-audio/stills-v51/`
  (MARTÍ f172/f177, UN f393/f401, EL f774/f777, ¡QUE f1925/f1933).
- Lanzador con candado `/tmp/hsv5-audio/run-stills.sh` (espera el
  candado, activa el entorno y corre el script).
- Fotogramas V5 de comparación ya extraídos en
  `/tmp/hsv5-audio/frames-v5-cmp/` (mismos 8 fotogramas del máster).
- Criterio: el fotograma discriminador está entre el inicio viejo
  del caption y el onset acústico (en V5 muestra la palabra = el
  bug; en V5.1-test NO debe mostrarla todavía); el fotograma de
  onset debe mostrarla destacada.
- Cadena de importes verificada por grep (sin render):
  `Root.tsx` → `MainReelV5` (`VideoV5.tsx`) →
  `import {CAPTIONS} from './captions-v41'` — exactamente el
  archivo sustituido en el worktree de prueba, así que el render
  leerá los tiempos re-temporizados. (Detalle: `CAPTIONS_B` en
  VideoV5.tsx usa `CAPTIONS[3].chunks[2].words[0].s` como fin de
  la ventana de apagado de L4; al re-temporizarse WASHINGTON a
  15,94 s, ese fin se mueve en consecuencia — comportamiento
  coherente, a confirmar en el still f401/f393 no aplica: L4 no
  tiene still discriminador porque su karaoke está apagado ahí.)

Al correr el render: verificar los 8 stills contra
`frames-v5-cmp/`, actualizar esta sección y borrar el worktree
desechable (`git worktree remove /tmp/v51-render-test` + borrar la
rama `tmp/v51-render-test`). Es verificación, NO entrega: no
existe ninguna V5.1 para el usuario.

## Pieza 2 — Backlog de la auditoría de audio (V1.5 → V1.6)

**Archivos** (commit `17ab141`):

- `scripts/audio/audit-audio.py` (V1.6).
- `projects/marti-fidel/research/karaoke-map-v5.json` (nuevo, en git).
- `scripts/audio/test_align_audit.py` (nuevo, 24 tests).

**Cambios:**

1. **Mapa karaoke (`--karaoke-map`, checks (b)/(g)).** La auditoría
   analizaba el archivo de captions sin saber qué se renderiza como
   karaoke y qué en tarjeta. El mapa (JSON: `card_lines`,
   `handwritten_lines`, `blank_windows`) le dice qué captions se
   renderizan como karaoke; los huecos/desvíos en líneas sin karaoke
   son INFO. Auto-descubrimiento en `research/karaoke-map.json` y
   `public/audio/karaoke-map.json`. Sin mapa, comportamiento
   histórico (todo karaoke). Las ventanas de apagado son [t0,t1)
   con fin exclusivo (MUCHOS @49,22 s vuelve a ser karaoke).
2. **(c) §4 umbrales relativos al pico de línea (variante B).** La
   ganancia por línea sesgaba la medida absoluta (L6 original 7,7 dB
   más quieta que la editada). thresh = pico(p95) − 32 dB;
   loud = max(pico − 12 dB, −28 dBFS). El suelo absoluto −28 dB es
   imprescindible: sin él, un respiro fuerte (−28,1 dB, arm 0,11) en
   el original quieto se rescata como voz y la pausa L7 QUE→HABER
   colapsa de 0,46 s a 0 s. Validado: L9 HISTORIA,→ESTÁ 0,26/0,26 s
   (pérdida 0%) en todas las variantes; 0 FAIL en los 15 pares.
3. **(c) §2 suelo de audibilidad en empalmes.** `SPLICE_MIN_JUMP =
   0,02` (−34 dBFS): un paso por debajo es inaudible en la mezcla
   (la cama está ≥ −32 dBFS RMS por (f) y lo enmascara) → INFO, no
   FAIL. Caso V5 @5,17 s: paso 0,0098 en pausa diseñada, (i1)
   limpio. Los clics reales (≥0,02) siguen siendo FAIL.
4. **(g) onsets por envolvente + re-etiquetado.** La alineación
   acústica usa `envelope.envelope_onset` (misma semántica que
   `acoustic_span(-50)`, verificada al milisegundo en 17 captions).
   La «alineación clean» se re-etiqueta «coherencia
   captions↔transcripción (clean)»: compara los captions contra los
   tiempos de los que derivan, y un 0,000 s ahí no prueba sincronía.
   Las claves de métrica `g_align_clean_*` no cambian.

**Medición antes/después** (auditoría completa sobre el máster V5):

| | FAIL | WARN | PASS | INFO |
|---|---|---|---|---|
| Baseline V5 (V1.5) | 11 | 74 | 12 | 51 |
| V1.6, captions V5 + mapa | 4 | 72 | 12 | 57 |
| V1.6, captions V5.1 re-temporizados + mapa | **0** | 70 | 11 | 60 |

Los 11 FAIL del baseline se descomponen en: 1× (b) hueco falso
@36,63 s (L7 en tarjeta, lo resuelve el mapa); 1× (c) §2 empalme
@5,17 s (paso 0,0098, lo resuelve el suelo de audibilidad); 9× (g)
adelantos post-pausa (5 son líneas sin karaoke → el mapa; 4 reales
→ la pieza 1). Con el mapa y captions V5 quedan exactamente los 4
FAIL reales (MARTÍ −0,25; UN −0,56; EL −0,22; ¡QUE −0,48 s); con
los captions re-temporizados, **0 FAIL**: la alineación acústica
pasa a PASS (media 0,003 s, mediana +0,000 s, máx 0,02 s en 7
palabras). Los 4 desvíos captions↔Whisper que quedan (+0,25/+0,56/
+0,22/+0,48 s) se informan como INFO con el mensaje correcto:
«error de Whisper, no de sincronía».

Matices honestos de la comparación (la pasada V5.1 corrió con
`--no-whisper --no-spectrograms` y sin `--sfx`, porque lo que se
verificaba era (b)/(g), no la mezcla):
- Los 8 WARN (g) de la pasada V5 son desvíos karaoke↔voz del
  máster medidos con Whisper: en la pasada V5.1 no corrieron, no
  es una mejora real. La caída WARN 72→70 es neta de eso.
- El PASS 12→11 es (i5): sin `--sfx` no se mide el
  enmascaramiento (INFO en vez de PASS), no una regresión.
- La re-temporización crea 6 WARN (b) nuevos: captions cortos
  (UN 0,100 s, ¡QUE 0,061 s, CUANDO 0,111 s, NO 0,111 s, ES
  0,140 s) porque el inicio se mueve y el fin no. Es la verdad de
  la grabación (las palabras son así de cortas); BottomKaraoke
  solo lee inicios, así que el efecto visual es nulo salvo un
  WARN: el pop de 0,1 s de ¡QUE se corta antes de terminar
  (0,061 s de visualización). WARN, no FAIL: aceptable, y
  visible en la verificación por render.

**Tests** (`scripts/audio/test_align_audit.py`, 24 tests):

- 19 sintéticos (corren sin medios): onsets (blip de 10 ms
  rechazado, palabra quieta a −52 dB, rise_onset encuentra el
  ataque más fuerte), alineación JSON/TS (roundtrip, monotonía,
  chunk start), mapa karaoke (hueco en tarjeta = INFO, en karaoke
  = FAIL, fin de ventana exclusivo), pausas relativas (recorte
  legal con ganancia +12 dB pasa, recorte ilegal FAIL, regresión
  del respiro fuerte), suelo de empalme (0,0098 INFO, 0,1 FAIL).
- 5 de integración V5 (se saltan sin los audios; `MARTI_FIDEL_PROJ`
  apunta al proyecto real porque `public/` no está en los
  worktrees): (b) con mapa 0 FAIL / sin mapa 1 FAIL (comportamiento
  histórico); (g) acústica con mapa = exactamente los 4 adelantos
  reales; (g) con captions re-temporizados 0 FAIL; los 9 desvíos
  corregidos.
- `test_microcut.py` (29 tests) sigue pasando sin cambios.

## Texto exacto para `repo/AGENTS.md`

(El coordinador lo integra al fusionar; este agente NO edita
`repo/AGENTS.md`.)

```markdown
## Alineación acústica de captions (hub-speed-v5, 21-nov-2026)
- Los tiempos de palabra de faster-whisper adelantan los bordes tras
  pausa (mediana −0,21 s, hasta −0,56 s): el karaoke muestra la
  primera palabra de cada línea antes de oírse. ANTES de renderizar,
  re-temporizar con `scripts/audio/align-captions.py --voice <vo.wav>
  --captions <captions.json|ts> --out <out> --verify`: corrige solo
  los inicios tras silencio desde los onsets acústicos (envolvente
  10 ms, umbral −50 dBFS, `envelope.py`). Verificado en marti-fidel
  V5: desvío máx 0,56 → 0,049 s; sobre el umbral 9 → 0.
- La auditoría V1.6 conoce el mapa karaoke: cada proyecto con líneas
  en tarjeta/manuscrita o ventanas de karaoke apagado DEBE tener un
  `research/karaoke-map.json` (`card_lines`, `handwritten_lines`,
  `blank_windows`) para que (b)/(g) no marquen FAIL espurios. Sin
  mapa, se supone que todo es karaoke.
- (c) §4 usa umbrales relativos al pico de línea (pico−32 dB,
  loud = max(pico−12 dB, −28 dBFS)): la ganancia por línea ya no
  sesga la medida de pausas. La regla de pausa no cambia: ninguna
  pausa natural <0,25 s ni pérdida >50%.
- (c) §2: un paso de empalme <0,02 (−34 dBFS) es INFO (inaudible
  bajo la cama), no FAIL. La «alineación clean» de (g) es
  coherencia captions↔transcripción, no sincronía: la única
  alineación autoritativa es la acústica.
```

## Commits

- `93623a0` — Audio (hub-speed-v5): alineación acústica de captions
  (`scripts/audio/envelope.py`, `scripts/audio/align-captions.py`).
- `17ab141` — Audio (hub-speed-v5): backlog de la auditoría V1.6
  (`scripts/audio/audit-audio.py`, `projects/marti-fidel/research/karaoke-map-v5.json`,
  `scripts/audio/test_align_audit.py`).
- `75649de` — Audio (hub-speed-v5): documentación de las dos piezas
  (este documento + `scripts/audio/README.md`).
- _(pendiente)_ — actualización de este documento con el estado
  final de la verificación por render.

## Pendiente

- Verificación visual por render de los 8 fotogramas V5.1 (ver
  § Pieza 1): bloqueada por el candado compartido (el agente de
  render está en un render completo del reel, ~1 h+ desde las
  ~02:55). Todo preparado en `/tmp/v51-render-test` +
  `/tmp/hsv5-audio/run-stills.sh`; la verificación numérica
  (auditoría 0 FAIL) ya está cerrada y la cadena de importes está
  verificada por grep.
