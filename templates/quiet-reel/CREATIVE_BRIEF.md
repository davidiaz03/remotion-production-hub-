# CREATIVE_BRIEF — __TITLE__

Plantilla tranquila (QuietReel) para reels de material grabado.
Proyecto: `__SLUG__`.

## Enfoque

El material manda: video a pantalla completa, cortes limpios, casi sin
gráficos. Sin animaciones de motion graphics salvo lo estrictamente
necesario (lower-third mínimo, karaoke opcional). La fuerza está en lo
que se dice y se ve, no en los efectos.

## Flujo (ver scripts/editing/README.md)

1. Grabar (teléfono, vertical 1080×1920, 30 fps si es posible).
2. Subir a Drive → carpeta «Videos oficiales».
3. `paper-edit.py` → papel con frases numeradas.
4. El usuario elige frases en orden.
5. `assemble-cut.py` → rough cut + EDL + captions + `src/cut.ts`.
6. Render QuietReel → mezcla con `mix.py` (cama musical + ducking) →
   QA con `audit-audio.py` → máster.

## Decisiones de este proyecto

- (Rellenar por proyecto: tema, ángulo, lower-thirds, música, duración
  objetivo, qué NO va.)

## Regla de marca (obligatoria)

- Marca de agua: LOGOTIPO COMPLETO blanco y transparente, sin placa,
  desde el fotograma 0. Nunca solo la estrella.
- Cierre: logo animado con fondo negro (sting-black-2x.mp4).
