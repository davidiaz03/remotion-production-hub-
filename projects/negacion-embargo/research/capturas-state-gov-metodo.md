# Capturas de state.gov — método que funciona en esta VM (22-nov-2026)

Las dos capturas de `public/img/docs/` se tomaron con este método.
Se documenta porque la vía obvia NO funciona en esta VM.

## Lo que NO funciona

- `/opt/meta-chromium/chrome` no arranca: «Hatch WebGL domain policy
  is required».
- El modo `--screenshot` del chrome-headless-shell de Remotion se
  cuelga incluso con `file://`.
- Chrome directo al proxy de egress falla con
  `ERR_TUNNEL_CONNECTION_FAILED`: el proxy hace MITM con CA propia
  y rechaza el túnel de Chrome (curl con el CONNECT idéntico
  funciona).

## Lo que SÍ funciona: CDP + relay local de CONNECT

1. **Relay local** en `127.0.0.1:18081`: reenvía el CONNECT byte a
   byte al proxy de egress y el proxy responde 200.
   Script: `~/workspace/.tmp/proxy-relay.mjs` (efímero; el relay
   quedó APAGADO al terminar las capturas).
2. **Captura por CDP**: el endpoint DevTools de Chrome sí responde;
   se controla el navegador por el protocolo CDP y se cierra el
   banner de cookies con un clic en «Accept» antes de capturar.
   Script: `~/workspace/.tmp/cdp-shot.mjs` (efímero).

## Lecciones

- La primera captura del comunicado del 5-nov salió con el modal de
  cookies tapando el centro: siempre cerrar el banner antes de
  capturar y verificar la imagen a ojo.
- Viewport 1920×1080: el texto clave de ambas páginas cabe en el
  primer viewport; no hizo falta captura de página completa.
- Si hay que recapturar, levantar el relay, capturar por CDP y
  apagar el relay al terminar.

## Archivos producidos

- `public/img/docs/statedept-cuba-sanctions.png` (1920×1080,
  sha256 `341e7aa2…8adec`)
- `public/img/docs/statedept-5nov-2026.png` (1920×1080,
  sha256 `6788f4cc…3e0b`)
