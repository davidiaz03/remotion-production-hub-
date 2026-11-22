# Handoff — «Dicen que no hay bloqueo» (negacion-embargo)

22-nov-2026. **PRODUCCIÓN EN CURSO** (fase `edit`, ya no bloqueada):
Suleris dio el visto bueno final y el usuario ordenó proceder
(~12:36); VO de Adriana completa 8/8 y verificada.

## Hitos de producción (22-nov, en curso)

- [ ] 1. Composición construida
- [ ] 2. Pre-vuelo visual superado
- [x] 3. Cama lista y escaneada — HECHO 22-nov ~13:20. Cama nueva de
      Flow Music «Memorial de la Denuncia — Cama documental» (Lyria
      3.5, 112 BPM, 117,38 s), ventana limpia 8–98 s (90 s; scan PASS
      0 VOICE / 0 UNCERTAIN), registrada como
      `memorial-cama-documental`. Stem 77,5 s a nivel nativo + dips
      horneados (panel −6 dB, giro −12 dB). MEZCLA FINAL con
      fixed-gain lineal (+3,21 dB): PASS_REAL −16,2 LUFS / TP −1,9;
      dips verificados en la mezcla. `documentary-flow-a` queda como
      RESPALDO (stem y mezcla temporal guardados). El render de
      validación usa directamente la mezcla FINAL.
- [ ] 4. Render terminado
- [ ] 5. Auditoría de audio superada
- [ ] 6. Máster + ligera entregados

Se marcan en este archivo y en `STATE.json` (`milestones`) a medida
que se completan.

## Dónde está todo

- Brief creativo: `CREATIVE_BRIEF.md` (concepto, guion, plan por escena).
- Manifiesto: `asset-manifest.json` (13 archivos, 546 MB, con SHA256,
  fuente, licencia y escena que sirve cada uno).
- Estrategia aprobada: `preprod/propuestas/2026-11-22/roi-rena-cuba-nunca-a-tenido-embargo/estrategia-video-1.md`
- Dossier: `preprod/investigacion/negacion-del-embargo/dossier.md`

## Lo conseguido

- **Panel completo con metraje real**: Rubio 20-may (corte 10,05 s),
  Waltz 7-jul «It's fake» (corte 17,02 s, UN Web TV 99.ª plenaria),
  Waltz 27-oct «There is no blockade» (UNifeed soundbite 33, 26,6 s),
  Waltz 16-nov Fox News (foto real). Todo verificado por
  transcripción local y/o a ojo.
- **Respaldo y fuentes de edición**: ventanas UN Web TV completas
  (julio 331,8 s; octubre 90,5 s + 80,1 s — la de 90,5 s incluye la
  cifra de 876 M con la voz de Waltz, útil para L6), paquetes UNifeed
  completos, original de Rubio completo.
- **Documentos reales**: capturas de state.gov «Cuba Sanctions» y
  comunicado del 5-nov (ambas 1920×1080, texto clave verificado
  legible a ojo por dos agentes). Método CDP + relay CONNECT local
  (ver `research/capturas-state-gov-metodo.md`).
- **Archivo del Memorial buscado** (13 términos): solo 2 piezas
  útiles, en Drive sin descargar (imagen satelital NOAA/CIRA de
  Cuba a oscuras; fuente cruda del reel de Bruno ONU) — ver
  `referenced` en el manifiesto. Nada de puerto/petróleo/barcos/
  Habana/Malecón.

## Lo que falta

- Visto bueno FINAL de Suleris (puerta dura).
- Cama Flow Music (elegir ventana limpia + `scan-bed.py`).
- VO: Adriana graba la definitiva (guion entregado 22-nov; sin
  audio de referencia por decisión del usuario).
- Si se usa la imagen satelital de Cuba a oscuras: descargarla de
  Drive (`Cuba_blackout_NOAA_CIRA_2026.png`) y verificar el crédito
  NOAA/CIRA.

## Avisos para la edición

1. El video de Rubio lleva **subtítulos quemados en inglés** (sin
   fotograma limpio): recortar el tercio inferior o cubrir con la
   banda de la cita.
2. El corte «It's fake» empieza con una cola «aid.» de ~0,3 s:
   recortar el inicio; la frase empieza a ~0,3 s.
3. Las frases de las tarjetas 2–3 con voz original duran 5–6 s:
   decidir si el panel se estira a 14–16 s o se queda en 3 s por
   tarjeta con cita completa como texto (ver CREATIVE_BRIEF.md §5).
4. La foto de Fox News es 1280×720 (no hay mayor resolución en el
   artículo); verificar su crédito original al publicar.
5. **Regla de Suleris**: en la voz del Memorial, BLOQUEO, nunca
   «embargo» («embargo» solo en citas textuales de EE. UU., L4).
6. Licencias: ONU © (crédito «Imágenes: UN Web TV / Naciones
   Unidas»); Dept. de Estado = dominio público; Fox News = cita
   editorial con atribución.

## 22-nov ~15:05 — Composición v2 recibida + re-mezcla v2 (hitos 1–2)

- Composición MainReel v2 (commit `1cab80d`): reencuadre Rubio, regla de
  caras, L4 T1–T5, 8 técnicas, gancho video real, auditoría 18 puntos,
  investigación 3. Borrador v2 540p; puerta QA visual PASS (0 negros).
- Pre-vuelo: 70 stills del subagente + 16/16 críticos verificados por mí
  (S1, L6, S9, gancho, L4, T3/T4, wipe, sello fantasma, freeze).
- Re-mezcla v2: 43 SFX (+4 risers sync 0,982, obturador 18,40 s −6 dB,
  marcador 36,58 s −1 dB); J-cut L8 (VO 69,0→68,5 s); PUNTO. 13,32 s;
  contador 48,81 s. Mix −16,43 LUFS / TP −1,94.
- NO re-ejecutar `scripts/build-timeline.py` sin restaurar `src/captions.ts`
  después (regenera los onsets y destruye las correcciones manuales + el
  desplazamiento L8). Trampa documentada por el subagente de composición.
- Pendiente: render de validación (run-render.sh) + QA + auditoría + entrega.
