# Rejilla de compás — cama memorial-cama-documental (ventana 8–98 s)

Medición 22-nov con scripts/audio/beats.py (aubio) sobre la cama de la biblioteca.
- BPM nominal (Flow Music): 112 → T_beat = 0,5357 s (16,07 f), T_corchea = 0,2679 s (8,04 f).
- aubio: 159 beats / 520 onsets en 90 s; BPM estimado 111,4.
- **CONCLUSIÓN: la cama NO tiene un pulso bloqueable.** Ajuste a rejilla 112 BPM:
  fase circular 0,4327 s (residuo medio 118 ms); fase moda 0,51 s (solo 19% de
  beats a <50 ms); onsets: 8% a <20 ms de la mejor rejilla = nivel de azar
  (7,5%). La envolvente RMS 0–15 s no muestra entrada de ritmo definida.
  Es un underscore blando (pads + arpegio fluido), no una pista con kick.
- **Consecuencia (T2):** no hay fase de downbeat medible. Se usa la rejilla
  NOMINAL anclada a los disparadores de VO/escena (cada secuencia se ancla a
  su palabra/evento y se espacia por la rejilla: compases/corcheas), con los
  eventos 1–2 f ANTES del tiempo. Los 4 impactos grandes NO se mueven (los
  fija la VO/panel) y no caen todos en downbeats de ninguna rejilla.
- Rejilla nominal de referencia (hipótesis track-0: la rejilla del generador
  empieza en el segundo 0 de la pista; la ventana empieza en 8 s = 14,93
  compases): beats en 0,036 + k×0,5357 s; downbeats en 0,571 + 2,143k s.
  Convención, NO medición.
