# CREATIVE BRIEF — REEL PILAR V30 (Alberto, 15-nov-2026)

## Encargo
Rehacer el reel del caso Pilar / libro bomba (Lima, 1974) con el ecosistema
Remotion instalado en esta VM. Prueba del ecosistema + producto publicable.
El usuario pide: **más dinámico y más rápido** que las versiones anteriores,
con buenos subtítulos, animaciones, transiciones y gráficos que guíen la
narración, **sin cortar a las presentadoras** — la edición ocurre DENTRO del
video (gráficos y transparencias sobre las tomas). Producto profesional con
posibilidades reales de viralidad.

## Reglas duras (del usuario / del proyecto)
- **V13 es el máster preservado; V29 es la última versión de ChatGPT. NO tocar
  ninguna versión existente ni el guion en Drive.** Esta es V30, carpeta nueva.
- **Guion fijo. La fecha queda en «5 de febrero de 1974»** (decisión del
  usuario, 11-nov). NO corregir a 4 de febrero, NO añadir notas sobre la fecha.
  El testimonio de Pilar dice «4» en su voz: se conserva tal cual, sin
  editorializar (además, el fragmento usado NO menciona la fecha).
- **No cortar a las presentadoras.** Las 11 tomas íntegras, en orden, con la
  voz completa. Solo micro-recorte de silencio en los bordes.
- Toma muda VID_20261104_123115.mp4: excluida (sin voz).
- Sin hechos inventados. NO usar «Odalys Pérez» (artículo erróneo de EcuRed).
  Clip 01 de Bosch (Barbados) solo como B-roll MUDO, nunca con audio.
- Testimonio: rotular «Fragmentos editados» (son dos intervalos combinados).
- Frase final «y aún nos queda mucho por revelar» NO se regrabó: usar el audio
  existente tal cual (la toma termina en «...que tenemos que contar»).
- Subtítulos = lo que REALMENTE se dice (Whisper word_timestamps del audio
  real), no el guion escrito donde difieren (ej. «Y tú» antes de la pregunta).

## Diagnóstico (qué falla en V29 y qué pide el usuario)
V29 (estudiado: Reel_Pilar_Ligero.mp4, 540×960, 73,47 s) es correcto pero
estático: plano medio fijo de las presentadoras, cortes secos, gráficos
discretos en la mitad superior, y el «1080p» es un reescalado de un acabado
720p. El usuario pide explícitamente más dinamismo y velocidad.

## Concepto rector — «CONVERSACIÓN QUE SE CONVIERTE EN PRUEBA»
Las dos presentadoras conversan (formato del reel más viral del Memorial:
14K reacciones, 115K vistas). La cámara nunca las abandona: los datos entran
COMO PRUEBA dentro de la conversación (pegatinas de evidencia, titulares
cinéticos, fotos de archivo), y salen. El testimonio de Pilar es el único
momento sin adornos: voz y rostro, a pantalla completa.

## Estrategia de ritmo (la diferencia de V30)
1. **Render 1080p REAL** desde las tomas originales (no reescalado de 720p).
2. **Punch-in continuo**: cada bloque tiene un push-in lento (100→106%) y un
   punch-in rápido (→112%) en la palabra clave. Ningún plano queda estático.
3. **Karaoke palabra a palabra** con la palabra de carga en ROJO (#ED1C24),
   fuente Archivo Black, mayúsculas, tercio inferior. Máx. 4–5 palabras
   visibles. Los tiempos salen de Whisper (small, word_timestamps) sobre el
   audio REAL de cada toma.
4. **Un beat visual por bloque** (12 bloques = 12 beats): título cinético,
   foto-evidencia, mapa o B-roll, nunca más de una idea gráfica a la vez,
   nunca más de 4 s seguidos sin volver a la cara.
5. **Transiciones cortas** (fade 6f entre bloques de presentadora; wipe al
   entrar/salir del testimonio) en vez de cortes secos.
6. **Audio**: voz limpia (DeepFilterNet suave) normalizada a −14 LUFS; música
   Flow original (la del proyecto, V5) muy baja, casi silenciada durante el
   testimonio. Sin foley sintético, sin sonidos de explosión.

## Escaleta por bloques (EDL canónico, MAPA_GUION_CLIPS.md)

| Bloque | Toma / intervalo | Dur. | Beat visual V30 |
|---|---|---|---|
| 01 Gancho | 115351 · 2.81–6.66 | 3.85 s | Punch-in en «BOMBA». Sin intro ni logo de apertura. |
| 02 Contexto | 115835 · 2.99–9.50 | 6.51 s | Push-in lento; pop en «TERRORISMO». |
| 03 Fecha/lugar | 120843 · 2.47–12.80 | 10.33 s | Tarjeta «LIMA, PERÚ · 5 DE FEBRERO DE 1974» + mapa real de Perú (peru_mapa_real.png) + foto embajada (ILUSTRATIVA, edificio actual) + retrato de Pilar con lower-third «PILAR RAMÍREZ VEGA · FUNCIONARIA DEL MINREX». |
| 04 El hecho | 121452 · 2.95–6.98 | 4.03 s | Maqueta carta-bomba (ILUSTRATIVA, etiquetada) + «UN LIBRO / POR CORREO»; pop cinético en «ESTALLA». |
| 05 Testimonio | 192959 · 73.30–78.00 + 98.85–105.45 + 112.90–114.95 (ver nota abajo) | 13.53 s | Pilar a pantalla completa, zoom suave. Rótulos: «TESTIMONIO · PILAR RAMÍREZ VEGA» y «Fragmentos editados». Sin efectos, sin música. |
| 06 Clasificación | 122815 · 2.39–6.86 | 4.47 s | Tarjeta «ES TERRORISMO» al pronunciarse; punch-in. |
| 07 No militar | 123312 · 2.41–7.24 | 4.83 s | «NO ERA MILITAR» + «SEDE DIPLOMÁTICA». |
| 08 Alcance | 123437 · 2.31–7.66 | 5.35 s | «CUALQUIER CUBANO / CUALQUIER EMBAJADA» cinético. |
| 09 Bosch | 123528 · 2.15–8.74 | 6.59 s | «AÑOS DESPUÉS / ORLANDO BOSCH» + retrato Bosch (spartacus) + foto juicio Barbados (etiquetada) + clip_02 B-roll mudo. |
| 10 Supervivencia | 123652 · 2.95–6.66 | 3.71 s | «PILAR SOBREVIVIÓ» + retrato gesto de Pilar. Sin efectos sobre su imagen. |
| 11 Pregunta | 123957 · 3.33–9.42 | 6.09 s | Tarjeta pregunta «¿CREES QUE ES JUSTIFICABLE…?» + burbuja de diálogo; punch-in. |
| 12 Cierre | 124232 · 2.97–7.50 | 4.53 s | «Y SÍGUENOS» + tarjeta final 1.5 s con logo oficial y «MEMORIAL DE LA DENUNCIA». |

Duración objetivo: ~72–75 s, 30 fps, 1080×1920, H.264.

## Decisión editorial — fragmento de testimonio (15-nov, verificada)
El EDL (MAPA_GUION_CLIPS.md) define el fragmento como 98.85–105.55 +
112.75–120.75. Al transcribir el testimonio COMPLETO con Whisper se comprobó
que esos intervalos (a) empiezan a mitad de frase («…el tamaño de un libro»,
cortando «cogí mi paquetico») y (b) incluyen una coda reflexiva («pero no
pensé nunca…») que el proyecto cortó deliberadamente en V13–V29. Además, la
duración del EDL (14,78 s) contradice el fragmento real del máster V13
(366 fotogramas = 12,2 s, con las palabras del SRT de V11).
**Decisión (autonomía editorial del encargo):** usar el fragmento de V11/V13,
el que el proyecto aprobó en 16 versiones: «Y empecé a abrir la
correspondencia. Me topé con un paquetico. El tamaño de un libro. Con las
tijeras, porque tenía un cordel muy fuerte. Sentí una explosión.» — tres
intervalos de origen (73.30–78.00, 98.85–105.45, 112.90–114.95), 13,53 s,
con límites verificados palabra por palabra contra la transcripción completa
(`pilar/v30/captions/testimonio_full.json`). El rótulo «Fragmentos editados»
sigue siendo exacto (tres fragmentos combinados). Sin editorializar la fecha:
el fragmento no la menciona.

## Identidad visual
Rojo institucional #ED1C24 · marfil #F7F7F2 · mate oscuro #0A0E11.
Tipografías: Archivo Black (karaoke), Roboto Condensed Bold (títulos/rótulos)
— instaladas en ~/.fonts. Logo oficial marca_agua_original.png arriba a la
derecha (del checkpoint V13, sin modificar). Overlays estilo pegatina con
borde blanco fino y sombra; etiquetas ILUSTRATIVA donde corresponda.

## Recursos (verificados)
- 11 tomas VID_20261104_*.mp4 (Drive, carpeta 1NxYB7xRI0X0STjDJ5kDyrb8gr4i2RAEL)
- Testimonio 20261108_192959_es_edited.mp4 (local, 327 MB)
- Clips Bosch 01–04 (local, 360p — solo 02 como B-roll; 01 solo mudo si se usa)
- Fotos: bosch-retrato-spartacus, bosch-juicio-barbados-ecured,
  pilar-ramirez-testimonio-retrato/gesto, embajada-cuba-lima-infobae,
  carta-bomba-maqueta-entrenamiento, peru_mapa_real.png (checkpoint V13)
- Música: Shadows_and_Evidence_original_Flow.wav (V5, 80 s) — la del proyecto
- Logo: marca_agua_original.png (checkpoint V13)

## Referencias estudiadas
- 00_LEEME_handoff.md (carpeta Referencias): fórmula viral del Memorial —
  presentadoras a cámara, karaoke con palabra en rojo, overlays de evidencia,
  tema indignante, pregunta final para comentarios.
- V29 (Reel_Pilar_Ligero.mp4): estado actual; base de comparación.
- INFORME_AUDITORIA_V14.md: dirección «documental táctil / tipo editorial»,
  principios de rostro ancla y movimiento con verbo.

## Pipeline técnico
1. ffmpeg: conformar 12 segmentos según EDL (corte exacto por fotograma).
2. Audio por segmento: extraer WAV → DeepFilterNet suave → loudnorm −14 LUFS.
3. faster-whisper small (es, word_timestamps) por segmento → captions.json
   con chunks de 2–4 palabras y palabra clave marcada.
4. Remotion: Sequence por bloque + OffthreadVideo + overlays + karaoke +
   transiciones + música con ducking por volumen. Render quick (90f) para
   verificar, luego full master CRF 19; re-encode CRF ~23 si >60 MB.
5. QA: ffprobe, decodificación completa, inspección de frames, niveles de
   audio, sin frames negros.

## Riesgos / notas
- Los clips de archivo son 360p: usarlos solo en ventanas pequeñas (nunca a
  pantalla completa) para no evidenciar la baja resolución.
- La toma 124232 termina en «...que tenemos que contar»: el cierre queda
  incompleto respecto al guion escrito (incidencia conocida, sin regrabar).
- Render largo en VM pequeña (1,5 CPU): si falla por memoria, bajar a
  --concurrency 1 o renderizar por tramos y unir con ffmpeg.
