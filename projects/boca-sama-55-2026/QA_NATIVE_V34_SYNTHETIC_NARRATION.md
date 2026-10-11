# V34 — verificación nativa de narración IA, 11 octubre 2026
**BORRADOR · NO PUBLICAR.** Resultado técnico limitado a 2,33 segundos.

## Evidencia de GitHub y descarga
- Quick preview ejecutada por el productor: https://github.com/davidiaz03/remotion-production-hub-/actions/runs/38144572527
- SHA renderizado: `d67f37c51c7774f3ff8b1471b5f2f2dcbf920f66` (V34)
- Intervalo **global 180–249**, 70 fotogramas/30 fps = 2,333 segundos (segundos 6–8,333 del reel).
- MP4 1080×1920, H.264+AAC estéreo 48kHz, 1.352.947 bytes, SHA256 `13b065085f9f3c207169c6c3ef61db2d78616eaa31ea551732dc644f47dd2b31`. Duración contenedor 2,389333 segundos (padding AAC).
- `reports/technical-qa.json` certifica 70/70, decodeOkay:true, hasAudio:true, blackIntervals:[], technicalStatus:passed. No falla la recuperación de la voz remota al entrar el narrador.
- Respaldo MP4 en Drive: https://drive.google.com/file/d/1i-T3o4kco8ZxHQ9faLQfISieb_SWfifj/view
- Respaldo hoja de contacto en Drive: https://drive.google.com/file/d/1kgW684pDjKr6Gkac8v-byVtQZNVa_jjr/view
- Artifact de GitHub 11704008621, caduca; los enlaces de Drive son la copia duradera.

## QA audiovisual realizada
- Nueve fotogramas distribuidos a lo largo del fragmento: vista regional satelital de costa Holguín y etiqueta Banes/Boca de Samá, misma escena, sin black flashes ni sobreimpresiones extrañas; logo institucional presente. No se atribuye posición precisa a la imagen regional.
- FFmpeg volumedetect en MP4: mean -18,0 dBFS, max -3,9 dBFS. EBU R128 en esta ventana cortísima: -15,0 LUFS integrados, true peak -3,9 dBFS. Estos números **no representan** la sonoridad final de los 55 segundos ni certifican inteligibilidad/mezcla completa.
- Audio realmente codificado en la salida; Remotion pudo usar la URL remota de HeyGen durante esta prueba. **No se ha escuchado/verificado palabra por palabra su pronunciación, especialmente «Samá» y «Banes»**. No asumir el archivo original WAV disponible localmente: sigue sin SHA ni respaldo Drive.
- La hoja de contacto muestra que la mitad inferior de esta escena queda muy oscura/vacía; revisar editorialmente antes de aprobar el layout del mapa. No tapar subtítulos futuros, ni añadir mapas de rutas inventadas.

## Riesgos y next actions
1. Recurso de narración temporal: un render correcto **no convierte la URL de HeyGen en almacenamiento permanente**. Antes de máster, conservar WAV original con checksum SHA y ruta en `asset-manifest.json`; no generar otra voz sin necesidad.
2. Probar una única vista previa de un tramo tardío de la narración o una preview editorial integral planificada para valorar frase completa, música y continuidad. No repetir 180–249 mientras el código no cambie.
3. Revisión del manuscrito/nombres propios y volumen voz vs música, luego transcripción de testimonios auténticos y subtítulos verificados. Comprobar el cierre oficial completo 49–55s antes de finalizar.
4. El workflow Whisper.cpp continúa sin ejecución exitosa: NO afirmar transcripciones automáticas disponibles.
