# CREATIVE_BRIEF — El Libreto · ¿Quién Compra el Combustible de Cuba? (YouTube)

- **Proyecto:** `el-libreto-156-yt` · 1080×1920 · 30 fps · 1395 f (46,5 s)
- **Formato:** ¿Quién escribió el libreto? (El Libreto) · **Veredicto: SIN CONTEXTO**
- **Dossier:** `~/workspace/marketing/research/dossiers/donde-esta-el-bloqueo-156-millones/`
  (R31 verificado; guion aprobado por el usuario 23-nov-2026)
- **VO:** voz real del usuario, 1 toma con las 2 lecturas; YT 43,73 s,
  115 palabras habladas (114 guion + «dólares»), 156 ppm, preset clean.
  Informe `vo/VO_EDIT_REPORT_156.md`. Aprobada por el usuario
  («Está bien», 23-nov 18:59).

## Concepto

Versión larga del mismo Desmentido: además de la cifra (156,8M real,
actualizada 284,4M) y el comprador (empresas privadas, no el Estado),
el Short añade dos beats que el reel de Facebook no tiene: la
licencia «Apoyo al Pueblo Cubano» (SCP) y el salto de 311 mil dólares
(todo 2025) a 284 millones (ene–sep 2026). El reel DEMUESTRA con el
documento en pantalla (U.S.-Cuba Trade and Economic Council, datos del
U.S. Census Bureau), no solo comenta.

## Estructura (8 escenas)

| Escena | Fotogramas | Contenido |
|---|---|---|
| Gancho | 0–193 | Gráfico viral de Estíu + paneo a la pregunta + círculo rojo |
| Documento | 194–381 | Portada del Council (julio) + zoom a la línea Fuels + contador 156,8→284,4 |
| Quién compra | 382–596 | PROTO NEWS vs pág. 3 del Council («El gráfico no dice quién. El documento sí.») |
| Licencia | 597–767 | Pág. 3 + «EMPRESAS PRIVADAS» + «APOYO AL PUEBLO CUBANO» (SCP) |
| Buque | 768–836 | Video real DVIDS (buque tanque, mudo) + «1 BUQUE AL GOBIERNO» |
| Salto | 837–1133 | Gráfico en motion: 311 mil (2025) vs 284 M (2026) |
| Veredicto | 1134–1252 | «LA CIFRA ES REAL.» / «LA CONCLUSIÓN, NO.» / sello «SIN CONTEXTO» |
| Cierre | 1253–1394 | Pregunta de marca + end card + CTA «SUSCRÍBETE» |

## Decisiones

- **Karaoke sigue el GUION:** «llegó» (el ASR oyó «llevó» en 3 pasadas
  y la v1 lo siguió; el usuario lo corrigió de oído 23-nov-2026 —
  el oído manda sobre el ASR); añade «dólares» («de 311 mil dólares
  a 284 millones»). Whisper garabatea L14 como «hubo llevado» →
  corregido a «buque llegó» (TEXT_FIXES en build-audit-inputs.py).
- **Correcciones de caption por absorción de pausa de Whisper:**
  «ESA» 30,38→31,07 y «MILLONES.» 37,14→37,51 (onsets acústicos).
  La PREDICCIÓN conserva los tiempos Whisper (corregirla rompería
  el check de fallo de transcripción); la regla de contraste
  acústico del check (g) cubre el desvío. Pausas declaradas en
  prosody-gaps.json (L16 30,73–31,07; L17 37,24–37,51).
- **Música:** cama `libreto-messi-desmentido` reutilizada (Flow Music,
  misma marca, mismo día de lanzamiento); receta de ducking de Messi
  FB v2 (ratio 1,5, release 400 ms, threshold 0,08, music_volume 0,4,
  −16 LUFS) — NO la de YT v1 (ratio 5, bombeo 11,9 dB sin corregir).
  NUNCA `documentary-flow-a`.
- **PROTO NEWS:** se muestra recortada al 88% superior: la franja
  inferior («Empresas privadas...») es la respuesta y el beat es la
  pregunta.
- **Gráfico de Estíu (621×702, baja resolución):** fondo difuminado,
  nunca pantalla completa.
- **Video del buque:** DVIDS 900133 (U.S. Army, dominio público),
  corte 8–11 s del original (segundo distinto al de Facebook).
  Metraje ILUSTRATIVO del hecho, no el buque que fue a Cuba.
  Atribución en pantalla («VIDEO: U.S. ARMY · DVIDS»).
- **El salto:** sin multiplicador impreso (la voz dice los números;
  el contraste visual —astilla de 8 px contra barra completa— hace
  el resto).
- **Los totales 156,8M/284,4M** los publica el Council en la página web
  de cada informe, no dentro del PDF: en pantalla se cita el Council.
- **Veredicto SIN CONTEXTO** con sello rojo (la palabra «FALSO» no
  aparece en la voz).

## Recursos por escena (licencias)

- Estíu / PROTO NEWS: capturas de posts virales (uso periodístico,
  con fuente).
- Council (portada julio + pág. 3): documento público del
  U.S.-Cuba Trade and Economic Council.
- Buque: dominio público (obra del gobierno federal de EE. UU.).
- SFX: biblioteca del hub (CC0 / dominio público). Cama: Flow Music
  (Lyria 3.5, instrumental, scan PASS).

## Estado

- Preparación completa 23-nov-2026 ~19:30 (hora oficial): entradas,
  captions, composición, scripts adaptados.
- Render DESPUÉS del video largo (`libreto-pagina-62mil`): no correr
  dos renders a la vez (1,5 CPU).
