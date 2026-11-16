# Dirección creativa — __TITLE__

**Proyecto:** `__SLUG__` · **Plantilla:** motion-reel (explainer animado,
módulo `shared/motion/`). Flujo completo: skill `motion_graphics_reels`.

## Brief (rellenar antes de montar)

- **Tema y objetivo comunicativo:** PENDIENTE.
- **Duración y estructura (5 actos: gancho → problema → pasos → mecanismo → CTA):** PENDIENTE.
- **Guion de VO (líneas cortas, una idea por frase):** PENDIENTE.
- **Fotos/video reales y su procedencia:** PENDIENTE.
- **Style prompt BLOQUEADO (ilustraciones, si las hay):** PENDIENTE.
- **Música (Flow: revisar catálogo antes de generar; o MusicGen por acto):** PENDIENTE.
- **Carpeta de Drive de entrega:** PENDIENTE.

## Checklist de producción

- [ ] VO de previsualización (`scripts/audio/gen-vo-kokoro.py`, o Piper) + karaoke desde `transcribe-vo.py`.
- [ ] Beats de la música (`scripts/audio/beats.py`) para colocar los cortes sobre el ritmo.
- [ ] SFX por sync point (`shared/motion/sfx/add-sfx.mjs` + `<Sfx>`).
- [ ] Render por tramos (`scripts/render-chunks.mjs`, 150 f) + máster con `scripts/audio/master.py`.
- [ ] QA (`scripts/qa-media.mjs --mode full`: sonoridad, TP, fotogramas) + juicio creativo del usuario antes de publicar.
- [ ] Marca de agua: LOGOTIPO COMPLETO (estrella + letras), nunca solo la estrella. En video: identificador blanco transparente, sin placa de fondo.
