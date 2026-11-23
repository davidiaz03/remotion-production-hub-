# Plan de SFX — libreto-pagina-62mil (23-nov-2026)

33 colocaciones. Tiempos de word_timestamps + tabla de frases v3 + onsets acústicos del paso align. Los SFX entran a pleno nivel sin ducking (mix.py); niveles verificados por pico/RMS antes de mezclar.

| # | archivo | at (s) | nota |
|---|---------|--------|------|
| 1 | `room-tone-loop.wav` | 0.0 | suelo de sala, bucle 548.3 s a -32 LUFS |
| 2 | `bass-sub-drop-short.wav` | 0.0 | cold open |
| 3 | `data-number-land.wav` | 19.38 | contador aterriza en «62.000» (onset acústico) |
| 4 | `reverse-whoosh-medium-soft.wav` | 27.03 | entrada comparación (escena 3, v3) |
| 5 | `writing-pencil-draw-05s.wav` | 35.23 | 2ª «bandera» (recorte 0.5 s +6 dB) |
| 6 | `digital-blip-subtle.wav` | 42.89 | titular elTOQUE |
| 7 | `digital-blip-subtle.wav` | 43.91 | titular InfoVeritas |
| 8 | `postcard-ambient-30.wav` | 48.47 | ambiente Postcard, J-cut 0.5 s antes del clip (48.97), -30 LUFS |
| 9 | `props-page-turn.wav` | 62.87 | tarjeta de título (escena 6) |
| 10 | `digital-blip-subtle.wav` | 83.97 | hito «10» de noviembre (blip, no data-tick: 18 ms inaudible) |
| 11 | `digital-blip-subtle.wav` | 113.57 | crecimiento «600.000» |
| 12 | `digital-blip-subtle.wav` | 119.95 | crecimiento «748.000» |
| 13 | `digital-blip-subtle.wav` | 125.35 | crecimiento «770.000» |
| 14 | `digital-blip-subtle.wav` | 143.29 | fórmula paso 1 |
| 15 | `digital-blip-subtle.wav` | 146.57 | fórmula paso 2 |
| 16 | `digital-blip-subtle.wav` | 151.59 | fórmula paso 3 |
| 17 | `digital-blip-subtle.wav` | 158.09 | fórmula paso 4 |
| 18 | `paper-card-slide-2.wav` | 166.18 | slide Bukele (-6 dB, pico -1.4) |
| 19 | `paper-card-slide-2.wav` | 183.42 | slide trío marzo |
| 20 | `reverse-whoosh-medium-soft.wav` | 250.78 | swipe Carlos Perez (+3 dB) |
| 21 | `digital-blip-subtle.wav` | 329.96 | «fake» (Daguito) |
| 22 | `bass-sub-drop-short.wav` | 333.96 | revelación Cienfuegos («una») |
| 23 | `impact-medium-soft.wav` | 389.58 | «Falso» (Valdez Galloso) |
| 24 | `props-page-turn.wav` | 426.16 | pregunta acto 3 |
| 25 | `digital-blip-subtle.wav` | 432.62 | repaso «Messi por fin» (frase 94, v3) |
| 26 | `digital-blip-subtle.wav` | 434.44 | repaso Ronaldo (frase 95) |
| 27 | `digital-blip-subtle.wav` | 437.86 | repaso El Taiger (frase 96) |
| 28 | `digital-blip-subtle.wav` | 482.58 | búsqueda inversa «2022» (blip, no data-tick) |
| 29 | `digital-blip-subtle.wav` | 494.38 | checklist ✗1 («No») |
| 30 | `digital-blip-subtle.wav` | 495.13 | checklist ✗2 |
| 31 | `digital-blip-subtle.wav` | 495.92 | checklist ✗3 («ninguna.») |
| 32 | `digital-scan-subtle.wav` | 502.84 | scan marca Gemini |
| 33 | `props-page-turn.wav` | 530.32 | cierre (escena 28) |

Ajustes de nivel: paper-card-slide-2 −6 dB (pico −1,4 dBFS, tocaba el limitador); writing-pencil-draw recortado a 0,5 s con fade-out +6 dB; reverse-whoosh +3 dB; postcard-ambient −23,99 → −30 LUFS (−6,01 dB); room tone bucleado a 548,3 s a −32 LUFS (bed-loop.py, xfade 3 s). Los dos «ticks» de hito usan digital-blip-subtle en vez de data-tick (18 ms, inaudible bajo la VO).
