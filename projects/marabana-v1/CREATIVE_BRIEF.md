# Dirección creativa — Reel Marabana V1 — La carrera que el bloqueo no pudo parar

**Proyecto:** `marabana-v1` · **Rama:** `work/marabana-v1` · **Estado:** estrategia cerrada 15-nov-2026; producción en curso.
**Documento maestro de estrategia:** `STRATEGY.md` (en este mismo proyecto) — este brief es el registro de trabajo del repo; la estrategia completa vive en STRATEGY.md.

> El asistente (Alberto, director creativo e investigador) amplió el encargo breve del usuario con investigación propia, estrategia, guion, plan técnico y auditoría. Nada de lo escrito aquí es un resultado inventado: cada hecho está verificado con su fuente en STRATEGY.md §15.

## Encargo, hipótesis y activos
- **Idea y objetivo aportados:** reel vertical del Memorial de la Denuncia sobre la 40ª Marabana (15-nov-2026) y la 5K «Carrera contra el Bloqueo y por la Paz». El usuario pidió autonomía creativa total y llevar la estrategia «al siguiente nivel», investigando referencias externas. Objetivo comunicativo: que el espectador aprenda en 40 s que el bloqueo intentó cancelar esta carrera en 2012 y que hoy, 14 años después, casi 3.000 personas la corrieron igual — con Ernesto Javier Consuegra (10K con bastón) como pico emocional. Emoción final deseada: indignación que se convierte en orgullo/desafío.
- **Audiencia, formato, duración, plataforma:** público del Memorial en Facebook e Instagram (audiencia cubana + solidaria); vertical 1080×1920, 30 fps, 46 s (40 s contenido + 6 s sting oficial); sin voz en off (música + texto cinético).
- **Restricción central:** NO hay presentadora ni metraje propio del equipo (las 8 fotos del equipo no existen para nadie). Solo fotos y video públicos de prensa. La estrategia compensa la falta de cara con: caras dentro de las fotos, texto cinético como narrador, ritmo 2–5,5 s por beat, música con arco, gancho en el segundo 0. Ver STRATEGY.md §2.
- **Activos existentes:** ver matriz de recursos abajo y STRATEGY.md §10. Todos reales y verificados; procedencia y SHA-256 en `asset-manifest.json`.
- **Preguntas al usuario:** ninguna bloqueante. Las 6 preguntas de revisión editorial (ritmo del Acto I, cita de Yuraldi, tarjeta de ganadores, gráfico IA, push-in de Ernesto, unión musical) se plantean DESPUÉS de la primera versión, con el reel delante. Ver STRATEGY.md §14.

## Preproducción obligatoria: contenido decidido ANTES de crear
- **Objetivo medible/comunicativo y emoción final deseada:** ver arriba. Éxito = un reel sin presentadora que no repita el fracaso de los «ecosistema» (32–69 reacciones) y se acerque al lenguaje de los virales (palabra en rojo, gancho inmediato, evidencia).
- **Mensaje central, hechos verificados y fuentes:** STRATEGY.md §1 y §15. Hechos: 2012 OFAC cancela InsightCuba; 21 estadounidenses en 2011; 40ª Marabana 15-nov-2026, Sala Polivalente Ramón Fonst, ~3.000 corredores, 70 extranjeros; 5K «Carrera contra el Bloqueo y por la Paz»; Ernesto Javier Consuegra, 10K con bastón, dorsal 5766; ganadores Estévez 2:25:31 / Bacallao 2:45:41 / Tamerón 1:06:53 / López Guisao 1:17:24. Correcciones al brief: extranjeros 70 (no ~100); tiempo Estévez 2:25:31 (no «2.21.31»); NO hay ganadores del 10K publicados.
- **Guion narrativo/voz definitivo:** sin voz. Guion de texto en pantalla, STRATEGY.md §6 (tabla maestra, 12 beats + sting).
- **Escaleta con beats/timecodes y duración total:** 46 s = 1.380 fotogramas. Acto I indignación (0–12 s), Acto II respuesta (12–30,5 s), Acto III corazón (30,5–40 s), sting (40–46 s).
- **Storyboard/shotlist e intención de cada escena:** STRATEGY.md §6–§7. Beat 1: foto héroe CN360 a pantalla completa (Malecón, amanecer, bandera CUBA). Beats 2–4: tarjetas gráficas 2012 (vector + sello CANCELADO + línea de tiempo). Beats 5–10: tarjetas de evidencia con fotos INDER/Cubadebate + ventana de video real (salida masiva, Canal Caribe) + count-up + cita Yuraldi + ganadores. Beat 11: Ernesto (el pico, 5,5 s). Beat 12: cierre con foto de meta. Sting oficial.
- **Tratamiento acordado:** **híbrido archivo-motion (explainer visual)**: fotos y video reales de prensa como base + motion graphics en Remotion (sello, línea de tiempo, count-up, texto cinético) + UN gráfico vectorial de IA claramente ilustrativo para el beat 2012 (donde no existe foto). JUSTIFICACIÓN: el Memorial denuncia con evidencia; todo lo que parece documento ES documento real. La IA solo donde no hay foto y solo como ilustración plana, nunca fotorrealista.
- **Plan de recursos por escena:**

| Tiempo / escena | Objetivo y texto | Material REAL ideal / fuente | Estado | Alternativa gráfica o IA JUSTIFICADA | Audio/motion | Prioridad |
|---|---|---|---|---|---|---|
| 0–3,5 s Gancho | Pregunta indignante | Foto héroe CN360 (RL Hevia, 1600×844) | ENCONTRADO y verificado | — | Flow intro; push-in lento | CRÍTICA |
| 3,5–7 s Dato 2012 | «2012 / LA OFAC CANCELÓ…» | No existe foto de 2012 | NO EXISTE | Vector plano IA (silueta + prohibición) o tarjeta tipográfica | Texto escalonado | ALTA |
| 7–9,5 s Sello | «CANCELADO» | — (grafismo) | Código Remotion | — | Slam + destello rojo | ALTA |
| 9,5–12 s Contraste | «21 estadounidenses en 2011» | — (grafismo) | Código Remotion | — | Línea de tiempo animada | MEDIA |
| 12–15 s Giro | «PERO A PESAR DE ELLO…» | Foto Cubadebate 1 (multitud + bandera, INDER) | ENCONTRADO y verificado | — | Whip; entra sección potente Flow | CRÍTICA |
| 15–18,5 s Salida | Video real de la arrancada | Canal Caribe YouTube 44–48 s (640×360) | ENCONTRADO y verificado | — | Ventana 16:9 en marco | ALTA |
| 18,5–21,5 s Número | «CASI 3.000 CORREDORES» | Foto Cubadebate 4 (dorsal 870) | ENCONTRADO y verificado | Estela motion blur (PIL) | Count-up 0→3.000 | ALTA |
| 21,5–24,5 s 5K | Nombre oficial de la 5K | Foto Cubadebate 2 («CUBA NO ESTÁ SOLA») | ENCONTRADO y verificado | — | Ken Burns | ALTA |
| 24,5–27,5 s Voz | Cita Yuraldi Cava (AP) | Foto Cubadebate 3 (MINREX) | ENCONTRADO y verificado | — | Texto con atribución | MEDIA |
| 27,5–30,5 s Ganadores | Estévez/Bacallao + doblete tunero | Foto Tiempo21 (784×442) | ENCONTRADO y verificado | — | Tarjeta de datos | MEDIA |
| 30,5–36 s Ernesto | «COMPLETÓ LOS 10K CON UN BASTÓN» | Foto Cubadebate 6 (JIT/INDER) | ENCONTRADO y VERIFICADO contra post El Necio | — | Push-in lento a su rostro; beat más largo (5,5 s) | CRÍTICA |
| 36–40 s Cierre | «HOY LA HABANA CORRIÓ…» | Foto Cubadebate 5 (meta con arco) | ENCONTRADO y verificado | — | Texto en dos tiempos | CRÍTICA |
| 40–46 s Sting | Cierre oficial | CIERRE_ANIMADO_OFICIAL_MEMORIAL.mp4 (Drive) | ENCONTRADO y verificado | — | Audio propio del sting | CRÍTICA |

**Puerta de preproducción:** superada. Guion, escaleta, storyboard y matriz de materiales completos ANTES de fabricar escenas. Materiales de Facebook (INDER, El Necio, Chapman) NO descargables sin login — documentado en STRATEGY.md §11; cubiertos por el mismo material INDER/JIT vía Cubadebate. Video teleSUR RECHAZADO (archivo de ediciones anteriores, engañoso).

## Uso responsable de material real e IA
- Prioridad aplicada: (1) archivo institucional acreditado — marca de agua y sting oficiales del Memorial (Drive); (2) fotos/video reales verificables de prensa (Cubadebate/INDER/JIT, CubaNoticias360, Tiempo21, Canal Caribe) con crédito en pantalla; (3) no se usó stock; (4) motion en Remotion sobre materiales reales; (5) IA generativa selectiva: UN vector plano para el beat 2012.
- La IA no fabrica rostros ni hechos; el gráfico del beat 2 es ilustración plana, claramente no fotográfica, y se señala como tal. Si no queda bien, fallback = tarjeta tipográfica pura.
- Proveniencia/licencia y SHA-256 de cada recurso: `asset-manifest.json` + STRATEGY.md §10.

## Investigación y referentes
- **Fuentes profesionales consultadas:** STRATEGY.md §3–§4. Memorial: reels 09 (más viral, 14K), 01 (viral reciente, 9,1K), 10 (último, 10-nov, 147 likes — analizado fotograma a fotograma); handoff de referencias virales (Drive `1pa6IIqq6HIFm9Yv-70lYzNmHhfYNKtWk`); HOMOLOGOS.md (11 cuentas: Ac2ality, Academia Play, LUM Perú, Museo Memoria y Tolerancia MX, Prado, MMDH Chile…); Manual de Identidad Corporativa MD (Drive `1eWYHgyf8c6LQVXgrUAWCL87HIh8BLSPG`).
- **Referentes externos (mecanismos, no popularidad):** sports hype reels (mejor imagen primero, números como gráficos); velocity editing (pattern interrupt, cortes al beat, speed ramps); Motion Echo Blur de Gyasi (estelas en fotos deportivas); photo slideshows TikTok (1,5–5 s por diapositiva); explainer visual AJ+/Ac2ality (texto cinético como narrador). Detalle y URLs en STRATEGY.md §4.
- **Ejemplos solicitados al usuario:** el usuario aportó el reel 10 (10-nov) como referencia de edición del equipo; analizado e incorporado. No se solicitaron más referencias: la investigación externa se hizo por web.
- **Oportunidades y riesgos:** oportunidad = primer reel del Memorial en formato explainer visual sin presentadora que respeta el lenguaje de los virales. Riesgo = el formato sin cara nunca ha funcionado en la página; mitigado con el sistema de compensación (STRATEGY.md §2). Riesgo de calidad = fotos de 580 px; mitigado con el sistema de tarjetas de evidencia (solo la foto CN360 va a pantalla completa).

## Estrategia y autoría creativa de Alberto
- **Propuesta conceptual:** «La carrera que el bloqueo no pudo parar» — contraste AYER (2012, cancelación) → HOY (la carrera se corrió igual) → CORAZÓN (Ernesto). Alternativas evaluadas y descartadas: (a) reel puramente histórico 2012 (sin gancho de actualidad; el Memorial ya sabe que la historia fría no funciona); (b) reel solo de celebración deportiva (pierde la denuncia, que es la identidad del Memorial); (c) voz en off (uno de los fallos documentados de «ecosistema»).
- **Guion, gancho, arco, storyboard:** STRATEGY.md §6–§7.
- **Paleta, tipografía, animación, branding:** rojo #ED1C24, negro, tinta #0A0E11, apoyos del manual; Archivo Black + Roboto Condensed (Amplitude no disponible); tarjetas de evidencia; marca de agua estrella en esquina; sting oficial. STRATEGY.md §5, §7, §9.
- **Música, efectos, voz, resolución:** Flow (V30), EDITADA: intro 0–12 s + sección potente 30–58 s, crossfade 1 s, fade antes del sting. Sin voz. 1080×1920, 30 fps, H.264+AAC, faststart, <~50 MB. STRATEGY.md §8, §13.
- **Prompt maestro (Alberto, director creativo, 15-nov-2026):** «Soy el director creativo, investigador y editor senior del reel Marabana V1 del Memorial de la Denuncia. El usuario me entrega una idea y el contexto, no un plan completo. Construyo mi propia estrategia y prompts, verifico cada hecho con su fuente, investigo técnicas y referentes relevantes (del Memorial y externos), diseño estructura, ritmo, visuales, motion y sonido, selecciono una ejecución realizable en Remotion, creo la versión, la audito y la corrijo antes de proponer aprobación. Registro decisiones, evidencia y código reproducible. No invento resultados ni excedo los permisos otorgados.»
- **Prompts específicos:**
  - Imagen IA (beat 2): «Flat vector illustration, minimalist, dark background: a marathon runner silhouette in white mid-stride, crossed by a large red prohibition ring (circle with diagonal slash), bold graphic poster style, no text, no photorealism» — resultado: PENDIENTE (se registra al generar; fallback tipográfico listo).
  - Investigación web: búsquedas de sports hype reels, velocity editing, motion echo blur, photo slideshows (15-nov-2026) — resultados en STRATEGY.md §4.
  - QA: checklist en STRATEGY.md §13 y abajo en Auditoría.

## Producción Remotion y revisiones
- Fuentes/asset-manifest SHA-256 y licencias: `asset-manifest.json` (se completa al copiar los assets a `public/`).
- Componentes, escenas editables, plan de implementación: `src/Video.tsx` (MainReel, 1.380 fotogramas) + componentes por beat (`src/components/`): KenBurns, EvidenceCard, KineticText, Stamp, Timeline, CountUp, VideoWindow, Watermark, Sting. Pre-procesado en `scripts/prep-assets.py` (recortes, motion blur, edición musical con ffmpeg).
- Versiones/commits/previews; decisiones: se registra al avanzar. Render por tramos (6 tramos de ~230 fotogramas) por la lección de OOM de V30; patrón `projects/pilar-v30/render-chunks.sh`.
- Próxima operación verificable: pre-procesado de assets → composición → preview breve (1–90 fotogramas por beat clave) → render por tramos → QA → entrega Drive.

## Recursos, presupuesto y seguridad del motor
- Un solo render manual a la vez; previews breves solo cuando resuelvan una incógnita; sin renders paralelos ni repetitivos.
- Limpieza local del proyecto: PENDIENTE (solo `out/` de este proyecto, tras QA y copia Drive verificada). Ver `docs/RENDER_RESOURCE_POLICY.md`.

## Auditoría autónoma (hallazgo → corrección → reauditoría)
- Contexto/veracidad/derechos y coherencia con identidad: PENDIENTE (tras el render).
- Narrativa, variación, ritmo, continuidad y técnica visual: PENDIENTE.
- Textos/subtítulos/márgenes de pantalla Android y logo: PENDIENTE.
- Audio, voz, música, sincronía, picos y silencios: PENDIENTE.
- FPS, frames, decodificación, duración, artefactos y hashes: PENDIENTE.
- Registro de problemas, gravedad, cambios y prueba de corrección: PENDIENTE.
- Revisión editorial, aprobación y entrega: PENDIENTE, no inferir del guardado. El usuario revisa el reel antes de publicar (STRATEGY.md §14).

## Aprendizajes reutilizables
- PENDIENTE (al cerrar: el sistema de tarjetas de evidencia para fotos de baja resolución y la edición musical por secciones de energía son candidatos a patrón universal).
