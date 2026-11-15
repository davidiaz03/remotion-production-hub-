# Dirección creativa — Reel Marabana V1 — La carrera que el bloqueo no pudo parar

**Proyecto:** `marabana-v1` · **Rama:** `work/marabana-v1` · **Estado:** estrategia cerrada 15-nov-2026; producción en curso (composición VO verificada con 17 stills v3; pendiente generar la música IA y renderizar).
**Documento maestro de estrategia:** `STRATEGY.md` (en este mismo proyecto) — este brief es el registro de trabajo del repo; la estrategia completa vive en STRATEGY.md.

**Cambios de dirección del usuario (15-nov-2026):** (1) el reel SÍ lleva voz en off — guion natural y conversacional, VO de IA solo como previsualización, el usuario grabará la definitiva; (2) música original generada con IA (MusicGen), no Flow — para evitar cualquier problema de derechos de autor; (3) entrega en dos versiones (máster + ligera). Ver STRATEGY.md §16.

> El asistente (Alberto, director creativo e investigador) amplió el encargo breve del usuario con investigación propia, estrategia, guion, plan técnico y auditoría. Nada de lo escrito aquí es un resultado inventado: cada hecho está verificado con su fuente en STRATEGY.md §15.

## Encargo, hipótesis y activos
- **Idea y objetivo aportados:** reel vertical del Memorial de la Denuncia sobre la 40ª Marabana (15-nov-2026) y la 5K «Carrera contra el Bloqueo y por la Paz». El usuario pidió autonomía creativa total y llevar la estrategia «al siguiente nivel», investigando referencias externas. Objetivo comunicativo: que el espectador aprenda en 40 s que el bloqueo intentó cancelar esta carrera en 2012 y que hoy, 14 años después, casi 3.000 personas la corrieron igual — con Ernesto Javier Consuegra (10K con bastón) como pico emocional. Emoción final deseada: indignación que se convierte en orgullo/desafío.
- **Audiencia, formato, duración, plataforma:** público del Memorial en Facebook e Instagram (audiencia cubana + solidaria); vertical 1080×1920, 30 fps, 47,5 s (41,5 s contenido + 6 s sting oficial); voz en off natural y conversacional + karaoke palabra a palabra + música original IA.
- **Restricción central:** NO hay presentadora ni metraje propio del equipo (las 8 fotos del equipo no existen para nadie). Solo fotos y video públicos de prensa. La estrategia compensa la falta de cara con: caras dentro de las fotos, voz en off natural que narra, karaoke como lenguaje de los virales, ritmo 1,5–5,5 s por beat, música con arco, gancho en el segundo 0. Ver STRATEGY.md §2.
- **Activos existentes:** ver matriz de recursos abajo y STRATEGY.md §10. Todos reales y verificados; procedencia y SHA-256 en `asset-manifest.json`.
- **Preguntas al usuario:** ninguna bloqueante. Las 7 preguntas de revisión editorial (voz de previsualización, música IA, sello, cita de Yuraldi, tarjeta de ganadores, gráfico IA, push-in de Ernesto) se plantean DESPUÉS de la primera versión, con el reel delante. Ver STRATEGY.md §14.

## Preproducción obligatoria: contenido decidido ANTES de crear
- **Objetivo medible/comunicativo y emoción final deseada:** ver arriba. Éxito = un reel sin presentadora que no repita el fracaso de los «ecosistema» (32–69 reacciones) y se acerque al lenguaje de los virales (palabra en rojo, gancho inmediato, evidencia).
- **Mensaje central, hechos verificados y fuentes:** STRATEGY.md §1 y §15. Hechos: 2012 OFAC cancela InsightCuba; 21 estadounidenses en 2011; 40ª Marabana 15-nov-2026, Sala Polivalente Ramón Fonst, ~3.000 corredores, 70 extranjeros; 5K «Carrera contra el Bloqueo y por la Paz»; Ernesto Javier Consuegra, 10K con bastón, dorsal 5766; ganadores Estévez 2:25:31 / Bacallao 2:45:41 / Tamerón 1:06:53 / López Guisao 1:17:24. Correcciones al brief: extranjeros 70 (no ~100); tiempo Estévez 2:25:31 (no «2.21.31»); NO hay ganadores del 10K publicados.
- **Guion narrativo/voz definitivo:** guion de voz en off en `VO_SCRIPT.md` (10 líneas, 114 palabras, tono conversacional; VO de previsualización con Piper, voz es_MX-ald-medium, 40,89 s). Los rótulos en pantalla aportan solo información nueva (números, nombres, citas, datos); el karaoke transcribe la voz. STRATEGY.md §6 (tabla maestra, 11 beats + sting).
- **Escaleta con beats/timecodes y duración total:** 47,5 s = 1.425 fotogramas. Acto I indignación (0–11,77 s), Acto II respuesta (11,77–32,35 s), Acto III corazón (32,35–41,5 s), sting (41,5–47,5 s). Los beats siguen las líneas de la VO.
- **Storyboard/shotlist e intención de cada escena:** STRATEGY.md §6–§7. Beat 1: foto héroe CN360 a pantalla completa (Malecón, amanecer, bandera CUBA). Beats 2–3: tarjetas gráficas 2012 (vector + sello CANCELADO en «canceló» + línea de tiempo con «21»). Beats 4–9: giro con whip + ventana de video real (salida masiva, Canal Caribe) + count-up 3.000 + 5K + cita Yuraldi + ganadores. Beat 10: Ernesto (el pico, 5,12 s, remate «CON UN BASTÓN» con la pausa dramática). Beat 11: cierre con foto de meta. Sting oficial.
- **Tratamiento acordado:** **narración + karaoke + evidencia**: voz en off natural que cuenta la historia + karaoke palabra a palabra (el lenguaje de los virales) + fotos y video reales de prensa como prueba + motion graphics en Remotion (sello, línea de tiempo, count-up) + UN gráfico vectorial de IA claramente ilustrativo para el beat 2012 (donde no existe foto) + música original generada con IA (MusicGen, 3 secciones). JUSTIFICACIÓN: el Memorial denuncia con evidencia; todo lo que parece documento ES documento real. La IA solo donde no hay foto (ilustración plana, nunca fotorrealista) y en la música (original, sin derechos de terceros).
- **Plan de recursos por escena:**

| Tiempo / escena | Objetivo y texto | Material REAL ideal / fuente | Estado | Alternativa gráfica o IA JUSTIFICADA | Audio/motion | Prioridad |
|---|---|---|---|---|---|---|
| 0–2,90 s Gancho | Pregunta indignante (VO L1) | Foto héroe CN360 (RL Hevia, 1600×844) | ENCONTRADO y verificado | — | Música IA sec. A (tensa); push-in lento; karaoke | CRÍTICA |
| 2,90–8,43 s Dato 2012 | «2012» + sello en «canceló» | No existe foto de 2012 | NO EXISTE | Vector plano IA (silueta + prohibición) o tarjeta tipográfica | Sello slam + destello rojo en 4,42 s; karaoke | ALTA |
| 8,43–11,77 s Contraste | «21» + línea de tiempo | — (grafismo) | Código Remotion | — | Línea de tiempo animada; karaoke | MEDIA |
| 11,77–13,22 s Giro | «PERO A PESAR DE ELLO…» | Foto Cubadebate 1 (multitud + bandera, INDER) | ENCONTRADO y verificado | — | Whip; entra sección enérgica (música IA sec. B) | CRÍTICA |
| 13,22–15,08 s Salida | Video real de la arrancada | Canal Caribe YouTube 43,5–48 s (640×360) | ENCONTRADO y verificado | — | Ventana 16:9 en marco + píldoras 42K/21K/10K/5K | ALTA |
| 15,08–19,33 s Número | «CASI 3.000 CORREDORES» | Foto Cubadebate 4 (dorsal 870) | ENCONTRADO y verificado | Estela motion blur (OpenCV) | Count-up 0→3.000 con «tres» | ALTA |
| 19,33–23,23 s 5K | Nombre oficial de la 5K | Foto Cubadebate 2 («CUBA NO ESTÁ SOLA») | ENCONTRADO y verificado | — | Ken Burns; karaoke | ALTA |
| 23,23–27,42 s Voz | Cita Yuraldi Cava (AP) | Foto Cubadebate 3 (MINREX) | ENCONTRADO y verificado | — | Texto con atribución; karaoke | MEDIA |
| 27,42–32,35 s Ganadores | Estévez/Bacallao + doblete tunero | Foto Tiempo21 (784×442) | ENCONTRADO y verificado | — | Tarjeta de datos que crece con la frase | MEDIA |
| 32,35–37,47 s Ernesto | «COMPLETÓ LOS 10K CON UN BASTÓN» | Foto Cubadebate 6 (JIT/INDER) | ENCONTRADO y VERIFICADO contra post El Necio | — | Push-in lento a su rostro; remate en 35,90 s; entra música IA sec. C | CRÍTICA |
| 37,47–41,5 s Cierre | «HOY LA HABANA CORRIÓ…» | Foto Cubadebate 5 (meta con arco) | ENCONTRADO y verificado | — | Titular + karaoke (sin duplicar la 2ª frase) | CRÍTICA |
| 41,5–47,5 s Sting | Cierre oficial | CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4 (Drive) | ENCONTRADO y verificado | — | Audio propio del sting (disparo) | CRÍTICA |

**Puerta de preproducción:** superada. Guion, escaleta, storyboard y matriz de materiales completos ANTES de fabricar escenas. Materiales de Facebook (INDER, El Necio, Chapman) NO descargables sin login — documentado en STRATEGY.md §11; cubiertos por el mismo material INDER/JIT vía Cubadebate. Video teleSUR RECHAZADO (archivo de ediciones anteriores, engañoso).

## Uso responsable de material real e IA
- Prioridad aplicada: (1) archivo institucional acreditado — marca de agua y sting oficiales del Memorial (Drive); (2) fotos/video reales verificables de prensa (Cubadebate/INDER/JIT, CubaNoticias360, Tiempo21, Canal Caribe) con crédito en pantalla; (3) no se usó stock; (4) motion en Remotion sobre materiales reales; (5) IA generativa selectiva: UN vector plano para el beat 2012 + música original (MusicGen) + VO de previsualización (Piper, sustituible por la voz del usuario).
- La IA no fabrica rostros ni hechos; el gráfico del beat 2 es ilustración plana, claramente no fotográfica, y se señala como tal. Si no queda bien, fallback = tarjeta tipográfica pura. La música IA es original (sin derechos de terceros); la VO de IA es solo un placeholder para previsualizar el ritmo.
- Proveniencia/licencia y SHA-256 de cada recurso: `asset-manifest.json` + STRATEGY.md §10.

## Investigación y referentes
- **Fuentes profesionales consultadas:** STRATEGY.md §3–§4. Memorial: reels 09 (más viral, 14K), 01 (viral reciente, 9,1K), 10 (último, 10-nov, 147 likes — analizado fotograma a fotograma); handoff de referencias virales (Drive `1pa6IIqq6HIFm9Yv-70lYzNmHhfYNKtWk`); HOMOLOGOS.md (11 cuentas: Ac2ality, Academia Play, LUM Perú, Museo Memoria y Tolerancia MX, Prado, MMDH Chile…); Manual de Identidad Corporativa MD (Drive `1eWYHgyf8c6LQVXgrUAWCL87HIh8BLSPG`).
- **Referentes externos (mecanismos, no popularidad):** sports hype reels (mejor imagen primero, números como gráficos); velocity editing (pattern interrupt, cortes al beat, speed ramps); Motion Echo Blur de Gyasi (estelas en fotos deportivas); photo slideshows TikTok (1,5–5 s por diapositiva); explainer visual AJ+/Ac2ality (texto cinético como narrador). Detalle y URLs en STRATEGY.md §4.
- **Ejemplos solicitados al usuario:** el usuario aportó el reel 10 (10-nov) como referencia de edición del equipo; analizado e incorporado. No se solicitaron más referencias: la investigación externa se hizo por web.
- **Oportunidades y riesgos:** oportunidad = primer reel del Memorial en formato explainer visual sin presentadora que respeta el lenguaje de los virales. Riesgo = el formato sin cara nunca ha funcionado en la página; mitigado con el sistema de compensación (STRATEGY.md §2). Riesgo de calidad = fotos de 580 px; mitigado con el sistema de tarjetas de evidencia (solo la foto CN360 va a pantalla completa).

## Estrategia y autoría creativa de Alberto
- **Propuesta conceptual:** «La carrera que el bloqueo no pudo parar» — contraste AYER (2012, cancelación) → HOY (la carrera se corrió igual) → CORAZÓN (Ernesto). Alternativas evaluadas y descartadas: (a) reel puramente histórico 2012 (sin gancho de actualidad; el Memorial ya sabe que la historia fría no funciona); (b) reel solo de celebración deportiva (pierde la denuncia, que es la identidad del Memorial); (c) sin voz en off (decisión inicial, anulada por el usuario: la narración natural vende mejor la historia; lo que se evita es la dicción formal de documental, uno de los fallos de «ecosistema»).
- **Guion, gancho, arco, storyboard:** STRATEGY.md §6–§7.
- **Paleta, tipografía, animación, branding:** rojo #ED1C24, negro, tinta #0A0E11, apoyos del manual; Archivo Black + Roboto Condensed (Amplitude no disponible); tarjetas de evidencia; marca de agua estrella en esquina; sting oficial. STRATEGY.md §5, §7, §9.
- **Música, efectos, voz, resolución:** música original generada con IA (MusicGen-small, 3 secciones: tensa / enérgica / emotiva, crossfades de 1,5 s en los giros, −16 LUFS); VO de previsualización con Piper (es_MX-ald-medium, −14 LUFS) + karaoke palabra a palabra desde el audio real, con ducking de la música a 0,25 bajo la voz. 1080×1920, 30 fps, H.264+AAC, faststart. Entrega en dos versiones: máster CRF 19 + ligera 720p. STRATEGY.md §8, §13.
- **Prompt maestro (Alberto, director creativo, 15-nov-2026):** «Soy el director creativo, investigador y editor senior del reel Marabana V1 del Memorial de la Denuncia. El usuario me entrega una idea y el contexto, no un plan completo. Construyo mi propia estrategia y prompts, verifico cada hecho con su fuente, investigo técnicas y referentes relevantes (del Memorial y externos), diseño estructura, ritmo, visuales, motion y sonido, selecciono una ejecución realizable en Remotion, creo la versión, la audito y la corrijo antes de proponer aprobación. Registro decisiones, evidencia y código reproducible. No invento resultados ni excedo los permisos otorgados.»
- **Prompts específicos:**
  - Imagen IA (beat 2): «Flat vector illustration, minimalist, dark background: a marathon runner silhouette in white mid-stride, crossed by a large red prohibition ring (circle with diagonal slash), bold graphic poster style, no text, no photorealism» — resultado: GENERADO y verificado (`img/vector-2012.png`, 1920×1280).
  - Música IA (MusicGen, `scripts/gen-music.py`): sec. A «tense cinematic underscore, low pulsing synth bass, sparse somber piano notes, restrained anger, dark minimal atmosphere, slow steady pulse, no vocals, no drums, moody»; sec. B «driving defiant sports anthem, powerful drums, energetic bassline, rising orchestral strings, triumphant brass stabs, building intensity, motivational cinematic trailer music, no vocals»; sec. C «emotional uplifting cinematic finale, warm strings and piano, hopeful triumphant resolution, gentle build to a soaring peak, no vocals».
  - Voz IA (Piper, `scripts/gen-vo-piper.py`): voz es_MX-ald-medium, length_scale 0,75, síntesis línea por línea con silencios de 0,2 s (0,45 s y 0,65 s en los puntos dramáticos). edge-tts (primera opción) descartado: su WebSocket no responde de forma utilizable desde este entorno (ver VO_SCRIPT.md).
  - Investigación web: búsquedas de sports hype reels, velocity editing, motion echo blur, photo slideshows (15-nov-2026) — resultados en STRATEGY.md §4.
  - QA: checklist en STRATEGY.md §13 y abajo en Auditoría.

## Producción Remotion y revisiones
- Fuentes/asset-manifest SHA-256 y licencias: `asset-manifest.json` (se completa al copiar los assets a `public/`).
- Componentes, escenas editables, plan de implementación: `src/Video.tsx` (MainReel, 1.425 fotogramas) + `src/timeline.ts` (beats re-temporizados por la VO) + `src/captions.ts` (karaoke, 28 chunks, 119 palabras, autogenerado por `scripts/transcribe-vo.py`): KenBurns, EvidenceCard, Headline, Karaoke, Stamp (dentro del beat 2012), Timeline, CountUp, VideoWindow, Watermark, Sting. Audio: `VoiceOverInner` + `MusicInner` (ducking por `VO_LINES`) + `StingAudioInner`. Pre-procesado en `scripts/prep-assets.py` (recortes, motion blur) y `scripts/prep-media.sh` (video, sting, Flow-fallback); VO en `scripts/gen-vo-piper.py` + `scripts/prep-vo.sh`; música en `scripts/gen-music.py`.
- Versiones/commits/previews; decisiones: `fa28038` estrategia; `e659d8f` composición sin voz + QA visual (20 stills); composición VO + karaoke verificada con 17 stills v3 (correcciones: tarjeta de ganadores que crece, píldoras de distancias en la salida). Render por tramos (6 tramos de ~238 fotogramas) por la lección de OOM de V30; patrón `projects/pilar-v30/render-chunks.sh`.
- Próxima operación verificable: generar la música IA → render por tramos (máster + ligera) → QA → entrega Drive.

## Recursos, presupuesto y seguridad del motor
- Un solo render manual a la vez; previews breves solo cuando resuelvan una incógnita; sin renders paralelos ni repetitivos.
- Limpieza local del proyecto: PENDIENTE (solo `out/` de este proyecto, tras QA y copia Drive verificada). Ver `docs/RENDER_RESOURCE_POLICY.md`.

## Auditoría autónoma (hallazgo → corrección → reauditoría)
- Contexto/veracidad/derechos y coherencia con identidad: HECHO en estrategia (STRATEGY.md §1, §5, §10, §11, §15); música original IA (sin derechos de terceros); VO de IA solo como placeholder.
- Narrativa, variación, ritmo, continuidad y técnica visual: HECHO — 17 stills v3 verificados (todos los beats + sting); correcciones aplicadas y re-verificadas (ganadores, salida).
- Textos/subtítulos/márgenes de pantalla Android y logo: HECHO en stills (karaoke legible, marca de agua discreta); pendiente verificación final en el render.
- Audio, voz, música, sincronía, picos y silencios: PENDIENTE (tras el render; la sincronía karaoke-VO es por construcción — word_timestamps del audio real).
- FPS, frames, decodificación, duración, artefactos y hashes: PENDIENTE (tras el render).
- Registro de problemas, gravedad, cambios y prueba de corrección: en curso (ver Auditoría y STRATEGY.md §16).
- Revisión editorial, aprobación y entrega: PENDIENTE, no inferir del guardado. El usuario revisa el reel antes de publicar (STRATEGY.md §14).

## Aprendizajes reutilizables
- PENDIENTE (al cerrar: el sistema de tarjetas de evidencia para fotos de baja resolución y la edición musical por secciones de energía son candidatos a patrón universal).
