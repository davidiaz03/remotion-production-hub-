# Memorial de la Denuncia — música y finishing 10 de octubre

## Objetivo
Reel institucional 10 de octubre. Mantener video y marca originales; crear una version con musicalizacion de "La memoria que permanece", corregir flashes, y luego validar render real con Remotion.

## Archivos fuente originales (NO introducir en GitHub publico)
- `public/memorial.mp4`: 51693154 bytes; SHA256 `80aa286f8f0f578334c8c31e999a2e2828f2e03a5f071219d01d5f9ed20be70e`.
- `public/music.mp3`: 2089149 bytes; SHA256 `9710361b3436ee30b9db6e6111bd89fc7a2a4170e46618139b3b6d8acc0d0bd7`.
- Subir estas copias a Drive en `Remotion Production/projects/memorial-musica-2026/assets/`. Codespaces y Actions NO heredan la conexion Drive de ChatGPT; requieren autenticacion y `npm run assets:sync -- --project memorial-musica-2026` (o `node scripts/sync-assets.mjs --project memorial-musica-2026`) antes de previsualizar.
- Las exportaciones locales ya realizadas desde ChatGPT no estan subidas a GitHub ni a Drive. La copia del MP4 original no se sustituye.

## Auditoria visual (sobre el material real)
- Transiciones de alto brillo: 37.3, 50.6, 63.1, 72.1 segundos. Se corrijen con congelados discretos y fundidos en `src/Video.tsx`, sin borrado de imagen.
- Entrada gigante roja hacia 64 s oculta parte del texto. Se sustituye la entrada con una toma congelada de la composicion correcta posterior.
- 5-13 s retrato prolongado; 14-25 s escenas historicas estáticas; 39-51 s archivo documental denso; 52-63 s imágenes del museo. Mayor movimiento futuro solo si contamos con las capas originales (no escalar subtitulos/logos del MP4 plano).
- Texto pequeño en movil en ciertos paneles. No se inventan contenidos ni se intenta OCR generativo; requiere assets editables para corregirlo correctamente.
- Paleta negra/roja, marca de agua y logo institucional final conservados.

## Auditoria sonora
- Duracion MP4 83.072 s. MP3 original 82.392 s. Audio original con voz/efectos conservado.
- MusicGain muestreado cada medio segundo, para preservar voz. La musica tiene un pico natural a 40-60 s, algo anterior al lema final; la automatizacion suaviza ese desequilibrio.
- La primera entrega de mezcla y reparacion visual se ha ejecutado localmente con FFmpeg (no afirmar que ya se renderizo mediante Remotion). Remotion code path PENDIENTE de validar con esos mismos assets.
- No exportar master aprobado ni Drive sin revisar mezcla, composicion renderizada, hashes y consentimiento.

## Siguiente paso
1. Provisionar los dos archivos en Drive/Codespaces con exactamente los nombres del manifest, y verificar SHA256.
2. Abrir Remotion Studio y validar composición MainReel.
3. Lanzar quick preview en GitHub Actions con recursos disponibles, revisar MP4 y QA.
4. Si se aprueba editorialmente, generar y aprobar snapshot historico, comprobar credenciales rclone y exportar master de esa revision.
