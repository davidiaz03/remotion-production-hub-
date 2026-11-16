# Dirección creativa — Marabana 40 — Reel escaparate

**Proyecto:** `marabana-showcase` · **Plantilla:** motion-reel (explainer
animado, módulo `shared/motion/`). Flujo completo: skill
`motion_graphics_reels`.

## Brief

- **Tema y objetivo comunicativo:** Marabana 40 (15-nov-2026) como
  acto de resistencia: los que se fueron (Adidas, Meliá, los 1.379
  extranjeros que faltan) contra los que vinieron (70 de 15 países,
  pese a amenazas y presión) — y la carrera como denuncia. Cierre:
  «Marabana está vivo. Era ahora o nunca, y fue ahora» + «La 41 ya
  comenzó». Reel escaparate: demostrar que el ecosistema Remotion
  produce un reel de otro nivel (no una V1.4).
- **Duración y estructura (55,9 s, 11 escenas):** gancho (countdown
  1.449→70) → cerco (Adidas/Meliá/apagones) → vinieron (parallax
  2.5D) → amanecer (video de la salida + «EL SOL SALÍA A LAS 6:43»)
  → bucle (¿QUIÉN ERA?) → denuncia (cartel + Yuraldi Cava) →
  ganadores (3 entrevistas en video + tarjeta) → el zapato (−1:00
  + «ESO ME ROMPIÓ LA ESTRATEGIA») → Sardiñas (resuelve el bucle)
  → cierre (Gattorno + bookend del héroe) → sting (logo animado).
  Mapa completo en STRATEGY.md §4.
- **Guion de VO:** 15 fragmentos, 148 palabras, en `VO_SCRIPT.md`
  (voz Kokoro em_alex, solo previsualización; el usuario graba la
  definitiva tras la aprobación).
- **Fotos/video reales y su procedencia:** foto héroe CN360/RL Hevia
  (1600×844); fotos 1–5 Cubadebate/INDER (580 px); ventanas de
  video Canal Caribe 15-nov-2026 (salida + entrevistas a Estévez,
  López y Tamerón); abanderado recortado con rembg (MIT) para el
  parallax 2.5D. Sin ilustraciones de IA (sin token Seed; el tier
  anónimo de Pollinations marca con agua). Tabla completa en
  EDIT_NOTES.md. Créditos en pantalla en cada foto/video.
- **Style prompt BLOQUEADO (ilustraciones):** N/A — no hay
  ilustraciones en este reel.
- **Música (Flow, biblioteca del usuario):** «Shadows & Evidence»
  (actos 1–2: intro + build) y «Weight of Memory» (cierre). Stems
  a −16 LUFS en dos pases (ver scripts/audio/FLOW_MUSIC.md).
  Mezcla −15,4 LUFS / TP −1,5.
- **Carpeta de Drive de entrega:** Marabana
  `1L374oa6XKnlENwy3Xb_54TQ-04t2OnEy` (nombres SHOWCASE; no tocar
  V1–V1.3).

## Checklist de producción

- [x] VO de previsualización (Kokoro em_alex, speed 1.1) + karaoke
      desde `transcribe-vo.py` (34 chunks, 156 palabras).
- [x] Beats de la música (`beats.py`: shadows BPM 93,0, 122 beats)
      para colocar los cortes sobre el ritmo.
- [x] SFX por sync point (`add-sfx.mjs` + `<Sfx>`, 21 colocaciones).
- [ ] Render por tramos (`render-chunks.mjs`, 150 f) + máster con
      `master.py`.
- [ ] QA (`qa-media.mjs --mode full`: sonoridad, TP, fotogramas) +
      juicio creativo del usuario antes de publicar.
- [x] Marca de agua: LOGOTIPO COMPLETO (estrella + letras), nunca
      solo la estrella. En video: identificador blanco transparente,
      sin placa de fondo, desde el fotograma 0.

## Pendientes antes de publicar

- **Derechos de las pistas de Flow Music:** la página de precios no
  declara derechos comerciales por plan. Leer los términos de
  Google y registrar aquí la comprobación (pista + fecha + qué
  dicen) antes de publicar. Pistas usadas: «Shadows & Evidence» y
  «Weight of Memory» (biblioteca del usuario, cuenta
  izquierdodavid528@gmail.com, plan Plus).
- **Etiqueta de contenido IA de Meta** al publicar (VO TTS +
  música Flow + gráfico vectorial en código).
- **Juicio creativo del usuario** (ver STRATEGY.md §10) y su
  grabación de la VO definitiva.
