# STRATEGY.md — Reel escaparate Marabana 40
## «Los que se fueron, los que vinieron»
**Memorial de la Denuncia · 40ª Marabana · 15 de noviembre de 2026**
**Fecha de estrategia: 16-nov-2026 · Autor: Alberto · Estado: ESCAPARATE (demostración final del ecosistema; proyecto APARTE de la V1.3, que sigue intacta como máster cerrado para Suleris)**

## 1. TESIS DEL REEL (una frase)

> **El bloqueo vació Marabana de extranjeros y de patrocinadores — y aun así 3.000 personas corrieron, y la 41 ya está en marcha.**

## 2. POR QUÉ ESTE ÁNGULO (y no los otros dos)

La investigación (`~/workspace/marabana/research/showcase/RESEARCH.md`)
ofrecía tres ángulos. Se eligió el **Ángulo 1 — «Los que se fueron, los
que vinieron»**, con el motivo del amanecer del Ángulo 2 tejido dentro
(la salida a las 6:00, antes del amanecer de las 6:43, es el corazón
visual del Acto 2):

- **Es el contraste corregido de la V1.3.** La V1.3 abría con el gancho
  OFAC-2012 («la OFAC canceló en 2012 el programa que traía corredores
  de EE.UU.», «21 en 2011»). La investigación demostró que **no existe
  fuente** para ese gancho y que la evidencia lo contradice (la
  participación estadounidense CRECIÓ después de 2012: ~50 en 2013,
  474 en 2015, ~400 en 2019). El arco 2019→2026 (1.449 → 275 → 70) es
  verificable, actual y más dramático.
- **Cada cifra tiene fuente.** 1.449 (2019, CubaPlus/JIT), 275 (2025,
  ACN), 70 de 15 naciones (2026, JIT + AP). Adidas 2026 es un hecho
  fresco que la V1.3 no tenía (cita de Mayté Vigoa a AP).
- **El cierre mira al futuro** («La 41 ya comenzó», acuerdos con
  Fundación Che de Italia y BioCubaCafé) en vez de repetir el eslogan.
- **El Ángulo 2 («Antes del amanecer»)** es el más cinematográfico,
  pero su gancho (la hora) es más débil que el dato 1.449→70 para
  retener en el primer segundo; su motivo del amanecer se incorpora
  como beat visual, no como tesis.
- **El Ángulo 3 («Cada cuerpo es una denuncia»)** es el más humano,
  pero depende de retratos (Consuegra no se re-verificó en esta ronda)
  y su gancho («No fue un cartel. Fueron 3.000 cuerpos») es menos
  concreto que el dato. Sus retratos (Estévez, Sardiñas, Cava) viven
  dentro del Ángulo 1 como Acto 3.

## 3. QUÉ HACE SUPERIOR A ESTE REEL FRENTE A LA V1.3

| Dimensión | V1.3 | Escaparate |
|---|---|---|
| Guion | Gancho OFAC-2012 sin fuente; 125 palabras | Gancho 1.449→70 verificado; 148 palabras; bucle abierto con resolución (Sardiñas) |
| Hechos | 21 en 2011 (sin fuente); nombre 5K sin fuente; Consuegra sin re-verificar | Solo hechos con fuente en RESEARCH.md; Consuegra sustituido por Sardiñas (verificado) |
| Video real | 2 ventanas de Canal Caribe | 5 ventanas: salida + 3 entrevistas a ganadores (Estévez, López, Tamerón) |
| Caras | Solo fotos | Caras en movimiento: los ganadores hablan a cámara (mudo, con karaoke) |
| Grafismo | Sello, count-up, línea de tiempo | Countdown 1.449→70 con motion blur, diagrama 15 países→La Habana, parallax 2.5D del abanderado (rembg), iconos Lottie (candado, reloj, bandera, check), iconos Lucide |
| Transiciones | Fundidos + whip | 10 transiciones curadas (slide, waveWipe, whipPan, irisWipe, fade) |
| SFX | 3 sintetizados | 21 SFX del kit CC0 por sync point (whoosh, pop, boom, riser, sting) |
| Música | MusicGen 3 secciones | Flow Music (Lyria 3.5): Shadows & Evidence + Weight of Memory, con beats medidos (BPM 93) |
| Voz | Piper (respaldo) | Kokoro em_alex (determinista, más natural) |
| Karaoke | Copia local KaraokeInner | Módulo compartido BottomKaraoke + SRT exportable |
| Duración | 47,97 s | 55,9 s (contenido 52,9 + sting 3) |

## 4. ESTRUCTURA NARRATIVA — LA TABLA MAESTRA

**Duración total: 55,9 s = 1.677 fotogramas a 30 fps** (52,9 s de
contenido + 3 s de sting a 2x). La VO manda el ritmo (52,47 s, Kokoro
em_alex a 1.1x). Cortes sobre fronteras de frase de la VO; donde el
beat de la música cae a ≤0,15 s, se usa el beat.

### ACTO 0 — GANCHO (0–6,17 s)
| Beat | Tiempo | Visual | VO |
|---|---|---|---|
| 1. GANCHO | 0–6,17 s | Foto héroe a pantalla completa (abanderada, Malecón al amanecer) + **countdown 1.449 → 70** con motion blur + serie «1.449 → 275 → 70» | L1–L2 «En 2019, 1.449 extranjeros corrieron Marabana. Hoy, setenta.» |

### ACTO I — EL CERCO (6,17–14,33 s)
| Beat | Tiempo | Visual | VO |
|---|---|---|---|
| 2. EL CERCO | 6,17–14,33 s | Fase 1: candado Lottie que se cierra + AlertBanner «ADIDAS SE RETIRÓ» + foto nocturna «CUBA NO ESTÁ SOLA» + «MELIÁ TAMBIÉN». Fase 2 (sobre «apagones»): QuoteCard Gattorno + «APAGONES DE MÁS DE 30 HORAS» | L3–L4 «Adidas, la patrocinadora de siempre, se retiró. Meliá también. Y el país corría entre apagones de más de treinta horas, sin electricidad, sin conexión.» |

### ACTO II — LOS QUE VINIERON (14,33–27,07 s)
| Beat | Tiempo | Visual | VO |
|---|---|---|---|
| 3a. VINIERON | 14,33–19,00 s | Parallax 2.5D del abanderado (rembg) + CountUp «70 VINIERON IGUAL» + «DE 15 PAÍSES» + diagrama 15 países → La Habana | L5 «Pero setenta vinieron igual, de quince países, pese a las amenazas y la presión.» |
| 3b. AMANECER | 19,00–23,90 s | «6:00» + reloj Lottie + **ventana de video real** (salida, Canal Caribe) + «EL SOL SALÍA A LAS 6:43» + CountUp 3.000 | L6 «Y a las seis de la mañana, antes del amanecer, casi tres mil corredores tomaron las calles.» |
| 4. BUCLE | 23,90–27,07 s | Foto oscurecida + icono ojo tachado + «¿QUIÉN ERA?» (la pregunta que la VO no hace; la promesa la resuelve Sardiñas) | L7 «Y entre ellos corría un hombre que no veía la meta.» |

### ACTO III — LA DENUNCIA Y LOS GANADORES (27,07–44,23 s)
| Beat | Tiempo | Visual | VO |
|---|---|---|---|
| 5. DENUNCIA | 27,07–35,77 s | «CUBA NO ES UNA AMENAZA, EL BLOQUEO SÍ» (BLOQUEO en rojo) + foto MINREX con carteles + QuoteCard Cava «El bloqueo asfixia al pueblo cubano» | L8–L9 «Muchos llevaban un cartel en la espalda… Yuraldi Cava lo dijo mientras corría…» |
| 6a. GANADORES | 35,77–40,03 s | **Tres ventanas de video** (entrevistas Estévez, López, Tamerón) + tarjeta de tiempos + «DOBLETE TUNERO EN 21K» | L10 «En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas.» |
| 6b. EL ZAPATO | 40,03–44,23 s | «−1:00» golpe de sello + «EN LA PRIMERA VUELTA» + «ESO ME ROMPIÓ LA ESTRATEGIA» (Estévez a Granma) + «Y GANÓ.» | L11–L12 «Estévez debutaba. Perdió un minuto cambiando de zapatos… y ganó.» |

### ACTO IV — EL CORAZÓN Y EL CIERRE (44,23–52,90 s)
| Beat | Tiempo | Visual | VO |
|---|---|---|---|
| 7. SARDIÑAS | 44,23–47,47 s | Foto de meta + «ELVIS SARDIÑAS» + «CIEGO · MEDIA MARATÓN» + «1:48:52» + bandera Lottie (resuelve el bucle) | L13 «Y Elvis Sardiñas, ciego, completó la media maratón.» |
| 8. CIERRE | 47,47–52,90 s | Héroe oscurecido (bookend) + QuoteCard Gattorno «Marabana está vivo. Era ahora o nunca, y fue ahora» + «LA 41 YA COMENZÓ» + check Lottie + CTA | L14–L15 «Marabana está vivo. Era ahora o nunca, y fue ahora. La cuarenta y una ya comenzó.» |

### STING (52,90–55,90 s)
Cierre animado oficial «la del disparo» a 2x (versión negra, estrella
blanca), con cola musical baja debajo. Disparo a ~0,65 s del sting.

## 5. IDENTIDAD VISUAL

- **Rojo corporativo #ED1C24** (palabra clave, acentos, sello).
- **Fondo tinta #0A0E11** + resplandor emocional por actos (rojo =
  peligro/cerco/denuncia; naranja = amanecer; azul = ganadores;
  verde implícito en «vinieron igual»).
- **Tipografía:** Archivo Black (display/números) + Poppins (etiquetas)
  + Georgia itálica (citas, QuoteCard).
- **Marca de agua — REGLA GENERAL DEL MEMORIAL:** logotipo COMPLETO
  blanco y TRANSPARENTE (estrella blanca + letras blancas, SIN placa
  ni fondo), 115 px, esquina superior derecha, desde el fotograma 0,
  fade antes del sting. El sting conserva su fondo negro.
- **Lenguaje de tarjetas de evidencia** (heredado de la V1.3): fotos
  enmarcadas estilo pegatina con etiqueta de fuente; el video real va
  en ventana con sus bugs de noticiero visibles (se lee como material
  de prensa).
- **Contenido IA:** la voz es previsualización TTS, la música es de
  Flow Music (Lyria 3.5) y un gráfico es vectorial en código. **Al
  publicar, activar la etiqueta de contenido IA de Meta.**

## 6. MÚSICA — GOOGLE FLOW MUSIC (Lyria 3.5)

- **Sección A (0–14,3 s):** Shadows & Evidence 0–15,8 s (intro tensa,
  media −23 dB) — gancho y cerco.
- **Sección B (12,8–44,2 s):** Shadows & Evidence 30–63,5 s (cuerpo
  potente, media −13/−14 dB) — vinieron, denuncia, ganadores.
  Crossfades de 1,5 s en ambos giros.
- **Sección C (42,7–55,9 s):** Weight of Memory 15–28,7 s (emotiva,
  media −19 dB) — Sardiñas, cierre y cola bajo el sting.
- Stems a −16 LUFS (procedimiento en dos pases, FLOW_MUSIC.md):
  shadows −15,8 LUFS (existente), weight −16,02 LUFS (creado aquí).
- Beats medidos con aubio: shadows BPM 93,0 (122 beats); cortes
  alineados a beats donde coinciden con fronteras de frase.
- **Derechos:** la página de precios de Flow Music no declara
  derechos comerciales por plan. El Memorial no monetiza; la
  comprobación de términos de Google queda PENDIENTE de registrar en
  CREATIVE_BRIEF.md antes de publicar (ver EDIT_NOTES.md).

## 7. FUENTES DE LOS HECHOS (todo con fuente en RESEARCH.md)

- Serie de extranjeros 2019→2026: CubaPlus/JIT (1.449), ACN (275),
  JIT + AP (70, 15 naciones).
- Adidas / Meliá / apagones / Cava / Torres / 40 diplomáticos: AP
  (reproducido por Cubadebate y La Jornada, 15-nov-2026).
- Gattorno (3 citas): Granma, 15-nov-2026.
- Resultados y tiempos: JIT + Granma, 15-nov-2026.
- Estévez y el zapato; López Guisao sola desde el km 16: Granma.
- Sardiñas (ANCI, media en 1:48:52): Granma + reglamento oficial.
- Salida 6:00, meta Ramón Fonst, amanecer 6:43: reglamento oficial /
  AP / weather.com. Salida/meta en Av. Independencia y 19 de Mayo
  (NO el Prado).
- La 41 ya comenzó (Fundación Che de Italia, BioCubaCafé): Eventos
  en Cuba (conferencia previa, 14-nov-2026).
- 507º aniversario de La Habana: AP/Cubadebate.

## 8. LO QUE NO VA (decisiones de exclusión)

1. **Gancho OFAC-2012 de la V1.3:** sin fuente; contradicho por la
   evidencia. Retirado.
2. **«Carrera contra el Bloqueo y por la Paz» como nombre de los 5K:**
   el reglamento la llama «carrera participativa». No se afirma.
3. **Consuegra individual (dorsal 5766, bastón):** no re-verificado
   en web en esta ronda. Sustituido por Elvis Sardiñas (verificado).
4. **«Récord del circuito» de Tamerón:** solo «mejoró su marca de
   2025» (1:07:37 → 1:06:53). En el reel solo aparece su tiempo.
5. **Video de teleSUR:** archivo de otros años + marca quemada.
   Excluido (como en la V1.3).
6. **Ilustraciones de Pollinations:** sin token Seed; el tier anónimo
   pone marca de agua. No publicable. Los gráficos son vectoriales
   en código o rembg sobre material real.
7. **Fotos cn360-1..10:** archivos XML (descargas fallidas), no
   imágenes. Solo cn360-hero.jpg es usable.
8. **Foto cubadebate-6 (Ernesto):** no se usa (caso no re-verificado).

## 9. COPY PARA PUBLICAR

> En 2019, 1.449 extranjeros corrieron Marabana. Hoy, 70.
>
> Adidas, la patrocinadora de siempre, se retiró este año. Meliá
> también. Y el país corría entre apagones de más de treinta horas.
>
> Pero setenta vinieron igual, de quince países, pese a las amenazas
> y la presión. Y a las seis de la mañana, antes del amanecer, casi
> tres mil corredores tomaron las calles de La Habana.
>
> Elvis Sardiñas, ciego, completó la media maratón.
>
> Marabana está vivo. Era ahora o nunca, y fue ahora. La 41 ya comenzó.
>
> #TumbaElBloqueo #CubaNoEsUnaAmenaza #Marabana #MemorialDeLaDenuncia #CubaNoEstáSola

## 10. QUÉ NECESITA EL OJO DEL USUARIO (antes de publicar)

1. **El gancho 1.449→70:** ¿el countdown con motion blur vende mejor
   que el gancho OFAC de la V1.3?
2. **Las entrevistas en video:** ¿las tres ventanas de ganadores se
   leen bien o distraen de la tarjeta de tiempos?
3. **El bucle abierto:** ¿la promesa («un hombre que no veía la
   meta») y su resolución con Sardiñas funcionan?
4. **La música Flow:** ¿el cambio a Weight of Memory en Sardiñas se
   siente natural? ¿La mezcla deja oír bien la narración?
5. **La voz Kokoro:** ¿el ritmo y el tono venden la narración? Es
   previsualización: la grabación del usuario la sustituye.
6. **El cierre:** ¿«LA 41 YA COMENZÓ» + CTA cierran mejor que el
   eslogan de la V1.3?
