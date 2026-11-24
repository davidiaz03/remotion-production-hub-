# CREATIVE_BRIEF — El Libreto · ¿Quién compra el combustible de Cuba? (Facebook)

- **Proyecto:** `el-libreto-156-fb` · 1080×1920 · 30 fps · 825 f (27,5 s)
- **Formato:** El Número (El Libreto) · **Veredicto: SIN CONTEXTO**
- **Dossier:** `~/workspace/marketing/research/dossiers/donde-esta-el-bloqueo-156-millones/`
  (R31 verificado; guion aprobado por el usuario 23-nov-2026)
- **VO:** voz real del usuario, 1 toma con las 2 lecturas; FB 24,02 s,
  69 palabras, 172 ppm, preset clean. Informe `vo/VO_EDIT_REPORT_156.md`.
  Aprobada por el usuario («Está bien», 23-nov 18:59).

## Concepto

Un gráfico viral dice que Cuba compró 156,8 millones en combustibles a
EE. UU. y pregunta «¿dónde está el bloqueo?». La cifra es real; la
conclusión, no: el que compra no es el Estado, son empresas privadas
con licencias especiales, y desde enero solo un buque llegó al gobierno.
El reel DEMUESTRA con el documento en pantalla (U.S.-Cuba Trade and
Economic Council, datos del U.S. Census Bureau), no solo comenta.

## Estructura (6 escenas)

| Escena | Fotogramas | Contenido |
|---|---|---|
| Gancho | 0–191 | Gráfico viral de Estíu + paneo a la pregunta + círculo rojo |
| Documento | 192–373 | Portada del Council (julio) + zoom a la línea Fuels + contador 156,8→284,4 |
| Comprador | 374–497 | Pág. 3 del Council + «EMPRESAS PRIVADAS» |
| Buque | 498–563 | Video real DVIDS (buque tanque, mudo) + «1 BUQUE AL GOBIERNO» |
| Veredicto | 564–662 | «LA CIFRA ES REAL.» / «LA CONCLUSIÓN, NO.» / sello «SIN CONTEXTO» |
| Cierre | 663–824 | Pregunta de marca + end card + CTA «SÍGUENOS» |

## Decisiones

- **Karaoke sigue el GUION:** «llegó» (el ASR oyó «llevó» en 3 pasadas
  y la v1 lo siguió; el usuario lo corrigió de oído 23-nov-2026 —
  el oído manda sobre el ASR), «combustibles» y «licencias
  especiales» en plural (pasadas ASR).
- **Música:** cama `libreto-messi-desmentido` reutilizada (Flow Music,
  misma marca, mismo día de lanzamiento); receta de ducking de Messi
  FB v2 (ratio 1,5, release 400 ms, threshold 0,08, music_volume 0,4,
  −16 LUFS). NUNCA `documentary-flow-a`.
- **Gráfico de Estíu (621×702, baja resolución):** fondo difuminado,
  nunca pantalla completa.
- **Video del buque:** DVIDS 900133 (U.S. Army, dominio público),
  corte 3–6 s del original. Metraje ILUSTRATIVO del hecho, no el buque
  que fue a Cuba: el texto enuncia el hecho sin afirmar que el video
  sea ese buque. Atribución en pantalla («VIDEO: U.S. ARMY · DVIDS»).
- **Los totales 156,8M/284,4M** los publica el Council en la página web
  de cada informe, no dentro del PDF: en pantalla se cita el Council.
- **Veredicto SIN CONTEXTO** con sello rojo (la palabra «FALSO» no
  aparece en la voz).

## Recursos por escena (licencias)

- Estíu: captura de post viral (uso periodístico, con fuente).
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
