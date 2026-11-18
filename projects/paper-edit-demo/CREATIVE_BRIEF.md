# CREATIVE_BRIEF — Prueba edición en papel

Plantilla tranquila (QuietReel) para reels de material grabado.
Proyecto: `paper-edit-demo`.

## Enfoque

El material manda: video a pantalla completa, cortes limpios, casi sin
gráficos. Sin animaciones de motion graphics salvo lo estrictamente
necesario (lower-third mínimo, karaoke opcional). La fuerza está en lo
que se dice y se ve, no en los efectos.

## Flujo (ver scripts/editing/README.md)

1. Grabar (teléfono, vertical 1080×1920, 30 fps si es posible).
2. Subir a Drive → carpeta «Videos oficiales».
3. `paper-edit.py` → papel con frases numeradas.
4. El usuario elige frases en orden.
5. `assemble-cut.py` → rough cut + EDL + captions + `src/cut.ts`.
6. Render QuietReel → mezcla con `mix.py` (cama musical + ducking) →
   QA con `audit-audio.py` → máster.

## Decisiones de este proyecto

Proyecto de PRUEBA end-to-end del flujo paper-edit (17-nov-2026,
rama `work/paper-edit-workflow`). No es un reel para publicar: valida
la cadena completa con material real.

- **Material**: testimonio de María del Pilar Ramírez Vega
  (`~/workspace/pilar/testimonio_pilar_192959.mp4`, 128,9 s,
  1088×1920, 30 fps) — el mismo de la V30 del caso Pilar.
- **Papel**: 289 palabras, 23 frases, 7 párrafos
  (`research/paper/paper.md` + `paper.json`).
- **Selección simulada** (del usuario): frases `5,12,15-16,21-22`,
  xfade 0,3 s — «Y el 4 de febrero del año 74» → «fui para allá, eso
  fue el lunes 4 de febrero» → «me senté detrás de un libro» →
  «paquético… Fernández Sociedad Anónima, procedente de México» →
  «sentí una explosión… pensé que a lo mejor era un petardo, alguien,
  una broma de algún lugar». Las frases 21-22 se fusionan en un solo
  segmento (hueco de 0,1 s: pasaje continuo).
- **Rough cut**: 28,73 s (862 f) + cierre 91 f = 953 f (31,77 s).
- **Lower-third**: segmento 1 — «María del Pilar Ramírez Vega /
  Sobreviviente del atentado de Lima, 1974».
- **Música**: «Shadows & Evidence» (pista Flow local), 0–31,77 s,
  ducking V1.5 (threshold 0,08 / ratio 5 / release 250 ms), fundido
  final 1,0 s. Sin créditos gastados.
- **Auditoría**: v1 = FAIL (14 FAIL) → correcciones → v2 = FAIL
  (1 FAIL marginal: ventana a −32,2 dBFS en la cola musical) →
  correcciones → **v3 = WARN — 0 FAIL, 48 WARN, 8 PASS, 1 INFO**
  (`reports/audio-audit-v3.md`). Bombeo honesto 10,0 dB (≈ 9,1 dB de
  marti-fidel V1.5, aceptado); alineación karaoke/onset acústico
  media 0,093 s, máx 0,14 s; máster −14,6 LUFS, TP −3,7 dBTP;
  0 cortes en voz, 0 empalmes, 0 palabras exprimidas. Los 48 WARN
  son todos aceptables y documentados (palabras cortas del habla
  real, 4 solapes de 0,1 s en las uniones con xfade, 5 pausas
  naturales, desvíos Whisper-sobre-mezcla con su sesgo conocido).
  Máster definitivo (953 f, 31,77 s): 10.530.539 bytes, SHA-256
  `e7e1443ffff7f841c7eea2ae4fce91fbf6465ef03946f1a2ab21157341dc85fe`;
  ligera 1.906.527 bytes, SHA-256
  `e3ec9d5184fcfbf4c624d0125dfba7f474edda058c81de98c6662e66a496d9fa`.

### Hallazgos de la prueba (corregidos en la rama)

1. Lower-third y karaoke se solapaban a `bottom: 190`: con karaoke
   activo el lower-third sube a 480 (`Video.tsx`).
2. El separador título/subtítulo de `--lower-third` es `|`, no `:`
   (`orden:título|subtítulo`).
3. `cut.ts` ya no importa `HubCaption`: define `CutCaption` inline
   (idéntico en estructura) para que la copia de `research/cut/`
   pase el typecheck.
4. `--edl` solo reproduce el video: para reproducir el corte CON
   subtítulos hay que pasar `--edl` + `--paper`.
5. Doble seek en `assemble-cut.py` (salto rápido + seek preciso):
   el montaje de 5 segmentos bajó de 241 s a ~95 s.
6. **Auditoría v1 = FAIL (14 FAIL)** y lo que enseñó:
   - (b) 3 FAIL: huecos de karaoke con voz encima dentro de frases →
     cada caption dura hasta la palabra siguiente (regla V1.5).
   - (c) 3 FAIL: dos eran colas reales truncadas («74,» terminaba
     0,36 s después de lo declarado por Whisper; «México.» con cola
     sonora) → cortes acústicos en silencio real en AMBOS bordes
     (−45 dBFS, ventana 1,0 s final / 0,5 s inicial). El tercero era
     la cabeza de la frase siguiente excluida → el plan lleva
     `prev/next_phrase_gap` y el módulo lo marca INFO.
   - (e) 5 FAIL: pausas «inesperadas» que son el ritmo natural de
     Pilar → en proyectos paper-edit son WARN, no FAIL.
   - (f) 3 FAIL: uno en una pausa natural (exento en paper-edit) y
     dos en el fundido final (exento en cualquier proyecto); el
     bombeo se medía con un límite fijo de 47 s que incluía la cola
     musical → ahora se mide solo sobre la región con voz.
   - El módulo se corría con el python del venv (sin scipy) y
     reventaba en el check (d): se corre con el `python3` del
     sistema; además (d) ya no calcula el STFT si no hay stretch.
7. **La cota de 30 palabras partía a mitad de cláusula** («una broma
   / de algún lugar»): ahora parte en la última coma de la segunda
   mitad. Y las frases consecutivas con hueco < 0,5 s se fusionan en
   un solo segmento (sin fundido artificial en medio de un pasaje).
8. **El bombeo de v2 (25,9 dB) era un artefacto de medición**: el
   módulo medía con sus parámetros por defecto (los agresivos del
   Studio: 0,018/7,0/150 ms) y la voz cruda (−12,9 LUFS), no con los
   de la mezcla real (0,08/5/250 ms, voz a −18 LUFS). Ahora lee los
   parámetros de `mix.wav.json` y normaliza la voz antes de medir:
   bombeo honesto 10,0 dB (≈ 9,1 dB de marti-fidel V1.5, aceptado).
   Los parámetros V1.5 se mantienen para paper-edit.

## Regla de marca (obligatoria)

- Marca de agua: LOGOTIPO COMPLETO blanco y transparente, sin placa,
  desde el fotograma 0. Nunca solo la estrella.
- Cierre: logo animado con fondo negro (sting-black-2x.mp4).
