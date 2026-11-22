# Verificación de la voz en off — Adriana (22-nov-2026)

Reel «Dicen que no hay bloqueo». VO recibida 22-nov ~12:23 (8 archivos
`.aac`, 48 kHz estéreo) + L1 el 22-nov ~12:30. Guion: `preprod/propuestas/2026-11-22/
roi-rena-cuba-nunca-a-tenido-embargo/guion-adriana.md` (8 líneas,
125 palabras). Originales en `public/audio/real/lines/` (+ `L1.wav`–
`L8.wav` a 48 kHz para el montaje; L1 recibida 22-nov ~12:30 y verificada). Transcripciones y
el informe de `verify-vo-lines.py` en `research/vo/`.

## Veredicto

**8 de 8 líneas están BIEN. Ninguna línea necesita regrabarse.**
La L1 llegó 22-nov ~12:30 (`el_1_8_4uto.aac`) y verifica MATCH
con ambos modelos (small y base): transcripción exacta del guion,
~160 ppm, −22,2 LUFS, sin recorte. La VO está completa y el montaje
puede empezar.

## Cobertura

| Archivo | Línea (por contenido) | Estado |
|---|---|---|
| el_1_8_4uto.aac | L1 | ✓ OK |
| el_2_1_j9qw.aac | L2 | ✓ OK |
| el_3_0_7umm.aac | L3 | ✓ OK |
| el_3_2_qwro.aac | L3 — **DUPLICADO** | Mismo SHA256 que el_3_0_7umm.aac (byte-idéntico); no es otra línea |
| el_4_3_8km5.aac | L4 | ✓ OK |
| el_5_4_zldu.aac | L5 | ✓ OK |
| el_6_5_tjt9.aac | L6 | ✓ OK |
| el_7_6_xpg6.aac | L7 | ✓ OK |
| el_8_7_hjuv.aac | L8 | ✓ OK (ver nota qué/que) |

Los nombres de archivo NO indican la línea (el orden de llegada no
corresponde al guion); la asignación se hizo por el contenido
transcrito de cada archivo.

## Tabla por línea

ppm = palabras por minuto sobre el tramo hablado (timecodes
faster-whisper; ±10% aprox.). Sonoridad = loudness integrada
(ffmpeg loudnorm) / true peak. Sin recorte en ningún archivo
(TP ≤ −3,8 dB) y niveles consistentes entre líneas (media −23,1 a
−24,9 dB). Objetivo de ritmo: ~155 ppm.

| L | Archivo | Dur. | ppm | Sonoridad | Transcripción (small) | Estado | Notas |
|---|---|---|---|---|---|---|---|
| 1 | el_1_8_4uto.aac | 6,85 s | ~160 | −22,2 LUFS / TP −5,6 | El gobierno de Estados Unidos lleva meses diciendo que no hay bloqueo. Míralos. | MATCH | 13 palabras. Pausa de 0,42 s antes de «Míralos» — el latido que invita ✓. |
| 2 | el_2_1_j9qw.aac | 3,39 s | ~156 | −21,6 LUFS / TP −6,5 | Cuatro veces en seis meses. | MATCH | 5 palabras. Sin pausa interna ≥0,25 s entre las dos frases; staccato correcto. |
| 3 | el_3_0_7umm.aac | 3,61 s | 128 | −20,2 LUFS / TP −3,8 | Vale, ahora mira esto. | MATCH | 4 palabras. Pausa de 0,36 s tras «Vale» — el latido que pedía la dirección ✓. La más alta de sonoridad (línea de giro, más energía). |
| 4 | el_4_3_8km5.aac | 10,71 s | 169 | −24,6 LUFS / TP −6,3 | Esta es la página del Departamento de Estado. Dice que Estados Unidos mantiene, y cito, un embargo económico integral contra Cuba, que sigue vigente hoy. | MATCH | 25 palabras. Pausa de 0,50 s tras «Estado,» ✓. «cito» p=0,97; «embargo» p=0,42 en small pero p=0,97 en base: la palabra está. |
| 5 | el_5_4_zldu.aac | 10,73 s | 145 | −22,3 LUFS / TP −4,4 | Y el 5 de noviembre, ese mismo Departamento anunció 10 sanciones nuevas: una red de petróleo, entidades estatales y proveedores chinos. | MATCH | 21 palabras. Pausa de 0,54 s tras «nuevas,» antes de la lista ✓. |
| 6 | el_6_5_tjt9.aac | 12,16 s | 161 | −23,1 LUFS / TP −4,9 | Waltz presume de 876 millones en ventas a Cuba, pero cada venta necesita un permiso del gobierno. Eso no es comercio libre, eso es control. | MATCH | 25 palabras. Pausas de 0,50 / 0,52 / 0,44 s (tras «Cuba,», «gobierno.», «libre,») — fraseo excelente. Ver «el no» y «876» abajo. |
| 7 | el_7_6_xpg6.aac | 8,28 s | 168 | −23,1 LUFS / TP −6,8 | Ellos lo niegan, sus documentos lo confirman, el bloqueo no es un relato, es un documento oficial. | MATCH | 17 palabras. La línea más limpia: ninguna palabra de baja probabilidad. Pausas de 0,48 / 0,40 s y 0,26 s antes de «es un documento oficial» (la pausa de la tesis existe, algo corta). |
| 8 | el_8_7_hjuv.aac | 6,06 s | 192 | −23,3 LUFS / TP −5,8 | ¿Tú qué crees, que lo niegan porque no existe o porque no les conviene admitirlo? | MATCH* | 15 palabras. La más rápida (pregunta final, una sola respiración; inteligible, p≥0,90 en «conviene admitirlo»). *El verificador marca INCIERTO solo por «qué» vs «que»: misma palabra hablada, artefacto ortográfico del ASR. Sin acción. |

`verify-vo-lines.py`: 6 MATCH, 1 INCIERTO (L8, artefacto),
1 DISCREPANCIA (L1, «sin transcripción» = no había llegado el audio).
La L1 llegó después (22-nov ~12:30) y verifica MATCH con small+base
(transcripción exacta del guion): **7 MATCH, 1 INCIERTO (L8,
artefacto) = 8/8 líneas bien**.

## El «no» de L6 — RESUELTO, está presente

La transcripción automática del mensaje de WhatsApp sugería que el
«no» de «Eso no es comercio libre» podía faltar («Eso es un comercio
libre»), lo que invertiría el sentido. **El «no» SÍ está, sin duda:**

- faster-whisper small: «no» en 8,60–8,72 s, **p=0,99**.
- faster-whisper base (modelo independiente): «no» en 8,60–8,72 s,
  **p=0,99** — mismo timecode exacto.
- La transcripción automática se lo tragó; los dos modelos locales
  lo oyen con confianza máxima. **No hace falta verificar de oído.**

## El «876» de L6 — RESUELTO, es 876

El modelo small oyó «876» (p=0,66) y el base «886» (p=0,74) en el
archivo completo. Para desambiguar se aisló el segmento 2,2–3,8 s y
se retranscribió con ambos modelos y dos tamaños de haz: **las 4
pasadas aisladas dicen 876** (small beam 5 y 1; base beam 5 y 1).
Total: 5 de 6 pasadas dicen 876; el «886» del base en archivo
completo fue un artefacto de contexto. No bloquea el montaje; si se
quiere, confirmación de oído en `el_6_5_tjt9.aac` 2,5–3,3 s.

## Tono y ritmo — valoración

- **Ritmo:** las líneas largas (L4–L7) van a 145–169 ppm, en torno al
  objetivo de 155. L8 es la más rápida (192 ppm en tramo hablado)
  pero es la pregunta final en una sola respiración y se entiende
  palabra por palabra. L2–L3 son staccato como pedía la dirección.
- **Pausas de dirección:** la de tras «Vale» está (0,36 s); la de
  antes de «Es un documento oficial» está (0,26 s, algo corta pero
  presente); el fraseo de L5 y L6 (pausas de ~0,5 s entre frases)
  es el de una locutora con oficio.
- **Sonoridad:** consistente en toda la sesión (media −23,1 a
  −24,9 dB); sin recorte ni ruido de fondo apreciable en el
  análisis de silencios (−45 dB). Cada archivo trae holgura de
  cabeza y cola (0,5–1,5 s) para editar.
- **Carácter/fuerza:** eso se juzga de oído y no lo mido. Lo que las
  mediciones sí muestran — ritmo en objetivo, pausas donde la
  dirección las pidió, energía más alta en la línea de giro (L3,
  −20,2 LUFS) — apunta a una lectura con intención, no plana.

## Método y límites

- Transcripción local faster-whisper **small** (primaria) y **base**
  (segunda opinión independiente), `language="es"`,
  `word_timestamps=True`. Comparación con `verify-vo-lines.py`
  (MATCH / INCIERTO / DISCREPANCIA).
- Regla permanente (caso Martí-Fidel, 18-nov): la transcripción solo
  señala sospechas; el acuerdo entre sistemas ASR NO es evidencia
  de error real. Aquí no hubo que aplicarla como veto: las dos
  sospechas que surgieron (el «no» de L6 y el 876) se resolvieron
  con evidencia concluyente a favor de la grabación.
- No se escucharon los audios de oído en esta verificación: el
  veredicto se apoya en transcripción doble + probabilidades por
  palabra + mediciones. La única comprobación de oído que queda es
  opcional (el 876, 5 s) y no bloquea nada.

## Para el montaje

- Usar `L1.wav`–`L8.wav` (48 kHz). La L1 ya está verificada.
- No usar `el_3_2_qwro.aac` (duplicado de L3).
- Duración total de VO (L1–L8): ~65,3 s de audio;
  tramo hablado ~48,4 s.
- Tras el montaje, auditoría obligatoria con
  `scripts/audio/audit-audio.py` antes de entregar.
