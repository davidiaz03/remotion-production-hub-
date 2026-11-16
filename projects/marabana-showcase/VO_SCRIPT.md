# VO_SCRIPT.md — Guion de voz en off · Reel escaparate Marabana 40

**Memorial de la Denuncia · 40ª Marabana · 15 de noviembre de 2026**
**Fecha: 16-nov-2026 · Autor: Alberto · Estado: escaparate (proyecto aparte de la V1.3)**

La voz de IA de este proyecto es SOLO una previsualización: el usuario
grabará la definitiva con su propia voz (mismo flujo que la V1.3).

## Tono y ritmo

- **Natural, humano, conversacional** — como si se lo contaras a un
  amigo, no como un locutor de documental.
- Ritmo de reel: rápido pero claro. Pausas dramáticas en dos puntos:
  tras el bucle abierto («…un hombre que no veía la meta.», 0,5 s) y
  tras «…cambiando de zapatos…» (0,65 s).
- 15 fragmentos, 148 palabras. Duración objetivo: ~50–54 s.

## Guion (15 fragmentos)

| # | Línea | Beat |
|---|---|---|
| 1 | En dos mil diecinueve, mil cuatrocientos cuarenta y nueve extranjeros corrieron Marabana. | 1 Gancho |
| 2 | Hoy, setenta. | 1 Gancho (aterriza el conteo) |
| 3 | Adidas, la patrocinadora de siempre, se retiró. Meliá también. | 2 El cerco |
| 4 | Y el país corría entre apagones de más de treinta horas, sin electricidad, sin conexión. | 2 El cerco |
| 5 | Pero setenta vinieron igual, de quince países, pese a las amenazas y la presión. | 3 Los que vinieron |
| 6 | Y a las seis de la mañana, antes del amanecer, casi tres mil corredores tomaron las calles. | 3 Los que vinieron |
| 7 | Y entre ellos corría un hombre que no veía la meta. | 3 Bucle abierto |
| 8 | Muchos llevaban un cartel en la espalda: Cuba no es una amenaza, el bloqueo sí. | 4 La denuncia |
| 9 | Yuraldi Cava lo dijo mientras corría: el bloqueo asfixia al pueblo cubano. | 4 La denuncia |
| 10 | En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas. | 5 Ganadores |
| 11 | Estévez debutaba. Perdió un minuto cambiando de zapatos… | 5 El zapato |
| 12 | y ganó. | 5 El zapato (remate) |
| 13 | Y Elvis Sardiñas, ciego, completó la media maratón. | 6 Sardiñas |
| 14 | Marabana está vivo. Era ahora o nunca, y fue ahora. | 7 Cierre (Gattorno) |
| 15 | La cuarenta y una ya comenzó. | 7 Cierre |

## Texto corrido (para grabar / sintetizar)

> En dos mil diecinueve, mil cuatrocientos cuarenta y nueve extranjeros
> corrieron Marabana. Hoy, setenta.
>
> Adidas, la patrocinadora de siempre, se retiró. Meliá también.
>
> Y el país corría entre apagones de más de treinta horas, sin
> electricidad, sin conexión.
>
> Pero setenta vinieron igual, de quince países, pese a las amenazas y
> la presión.
>
> Y a las seis de la mañana, antes del amanecer, casi tres mil
> corredores tomaron las calles.
>
> Y entre ellos corría un hombre que no veía la meta.
>
> Muchos llevaban un cartel en la espalda: Cuba no es una amenaza, el
> bloqueo sí.
>
> Yuraldi Cava lo dijo mientras corría: el bloqueo asfixia al pueblo
> cubano.
>
> En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de
> Las Tunas.
>
> Estévez debutaba. Perdió un minuto cambiando de zapatos… y ganó.
>
> Y Elvis Sardiñas, ciego, completó la media maratón.
>
> Marabana está vivo. Era ahora o nunca, y fue ahora.
>
> La cuarenta y una ya comenzó.

## Notas de pronunciación

- **Números en palabras**: la voz dice «mil cuatrocientos cuarenta y
  nueve», «setenta», «quince», «tres mil», «seis de la mañana»,
  «cuarenta y una»; en pantalla se ven «1.449», «70», «15», «3.000»,
  «6:00», «41». Los subtítulos karaoke transcriben lo que dice la voz.
- **Yuraldi Cava**: corredor citado por AP (Cubadebate, 15-nov-2026).
- **Estévez / Bacallao / Tamerón / López Guisao**: ganadores
  verificados (JIT/Granma). En la voz se dicen solo los apellidos.
- **Elvis Sardiñas Sánchez** (ANCI): media maratón en 1:48:52
  (Granma). En la voz, solo «Elvis Sardiñas»; el tiempo va en pantalla.
- **«Era ahora o nunca, y fue ahora»**: cita literal de Carlos
  Gattorno Correa, director de la Comisión Nacional de Carreras y
  Caminatas (Granma, 15-nov-2026). La línea 14 la dice la VO como
  cita atribuida en pantalla (QuoteCard con atribución).

## Voz de previsualización (IA)

- Herramienta: **Kokoro TTS** (Kokoro-82M, Apache-2.0),
  `scripts/audio/gen-vo-kokoro.py`, voz **em_alex** (masculina,
  español). Determinista: regenerar una línea da el mismo audio.
- Velocidad: 1.0 (medir duración real; si la VO supera 54 s,
  regenerar a 1.05–1.1).
- Pausas: 0,2–0,3 s entre líneas normales; 0,35 s tras la línea 1
  (aterriza el conteo); 0,5 s tras el bucle abierto (línea 7);
  0,65 s tras «…zapatos…» (línea 11).
- Archivo: `public/audio/vo-preview.wav` (24 kHz mono de Kokoro →
  48 kHz y −14 LUFS en prep-vo; ver EDIT_NOTES.md).
- Guion JSON: `vo-script.json` (fragmentos + pause_after).

## Sustitución por la voz del usuario

Ver **EDIT_NOTES.md**: reemplazar `public/audio/vo-preview.wav` por
la grabación del usuario, re-transcribir con faster-whisper
(word_timestamps), regenerar `src/captions.ts` y el ducking,
re-temporizar si la duración cambia y re-renderizar.
