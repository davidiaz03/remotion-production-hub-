# V40 — primer borrador integral Remotion y reparación del corte de Nancy (11 octubre 2026)
BORRADOR · NO PUBLICAR.

## Evidencia del render V39 anterior al corte reparado
- GitHub run 38153873437: SUCCESS; fuente SHA 4b7abec7c6ef4b9c030f736e710ff5333e17e529.
- En Drive scratch: boca-sama-v39-FULL-EDITORIAL-DRAFT-NO-PUBLICAR.mp4; id 1JVe0Lx3-0ieUxS66xnq8mxXhS1dMWEOT.
- 1080x1920, 30 fps, 1650/1650 fotogramas, duración MP4 55.061333 s (padding de audio); decode OK; audio presente; cero intervalos negros detectados; technicalStatus passed.
- SHA256 MP4: 984f26c23ba4dc1570e2ce06077196b66703d6ee7c47924c8b7987cb415608d4.
- Mezcla integral EBU R128: -19.3 LUFS, LRA 18.6 LU, pico verdadero -3.6 dBFS. **No es aprobación de inteligibilidad ni de derechos**.
- La hoja de contacto 3x3 fue examinada: apertura costa, mapa, archivo del poblado, cifras, Nancy, monumento, Carlos, memoria, animación oficial. Algunos encuadres todavía demasiado oscuros y debe auditarse transición por transición sobre video completo.
- El V39 anterior todavía emplea el corte viejo de Nancy. Por tanto **NO considerarlo edición corregida final**.

## Whisper de Carlos
- GitHub run 38153858514: SUCCESS. JSON respaldado en Drive scratch como boca-sama-v39-carlos-whisper-base-UNVERIFIED.json (id 1oqoI_YfQrMauAJxKuLmSZSiD_GSLjQBB).
- 105 unidades automáticas, de las cuales 31 caen completamente dentro del fragmento seleccionado; todos llevan verified:false.
- Lectura aproximada: «Desde el suelo, pues continué combatiendo sin percatarme que los compañeros que andaban conmigo habían sido asesinados». Cotejar literalmente con la fuente antes de activar subtítulos. Whisper fragmenta varias palabras en tokens.
- La última palabra «asesinados» sí entra en la duración de voz anterior; no cortar ni manipular innecesariamente.

## Corte genuino de Nancy reparado en V40
- Whisper fuente 49.110-49.880 registra la palabra «sufro», pero el clip usado en V39 empezaba 49.833, recortándola.
- Fuente original MP4 verificada SHA256 7921813ba41b121f5c50482912b20166492af2c7e8b3f96d1eda0ccb7c260dc1.
- Nuevo WAV mono PCM 48000 Hz t=49.080 a 55.213333, duración 6.133333 segundos, 588878 bytes, SHA256 20b5a45e85f6489ac82f0bb012b25f428ae686027e1bc23eadf962164a350f18.
- Copia almacenada en Drive assets: boca-sama-v40-nancy-full-sufro-ORIGINAL-REVIEW.wav; el original permanece intacto.
- Manifest y Editorial.tsx contienen nuevo recurso; Video.tsx actualizado para usarlo durante 184 frames desde 24.000s y retener reducción musical hasta frame 904, seguido de salida musical gradual. Necesita nuevo render nativo para validar el cambio.
- Ningún subtítulo testimonal activado automáticamente. Consultar derechos, pronunciaciones y cifras; el proyecto permanece PR #7 draft.

## Próximas puertas
1. CI del commit de reparación V40.
2. Nueva preview del tramo 720–809 con el audio Nancy completo y comprobación de forma de onda / mezcla / sincronía.
3. Cotejar contra entrevistas fuente palabra por palabra, subtítulos sin fondo tras verificación.
4. Revisión visual del V39 completo y nuevo render integral V40 antes de cualquier aprobación, no confundir el V39 con el V40.
