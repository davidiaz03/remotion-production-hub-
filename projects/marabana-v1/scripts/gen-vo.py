#!/usr/bin/env python3
"""Genera la voz en off de PREVISUALIZACIÓN con edge-tts (voz neuronal gratuita).
Voz: es-MX-JorgeNeural (masculina, español neutro latinoamericano).
Velocidad +5%. Pausas SSML en los dos puntos dramáticos del guion.

NOTA SSL: el proxy de egreso del entorno hace MITM con un CA propio.
edge-tts usa el bundle de certifi e ignora SSL_CERT_FILE, así que se parchean
los contextos SSL de edge_tts.communicate y edge_tts.voices para usar el
bundle del proxy (/run/hatch/egress-tls/ca-bundle.pem, el mismo que usa curl).
No se desactiva la verificación: solo se usa el CA del entorno.

Uso: ~/workspace/remotion-hub/.venv/bin/python scripts/gen-vo.py
Salida: public/audio/vo-preview.mp3 (luego se convierte a WAV 48kHz y se
normaliza a -14 LUFS con scripts/prep-vo.sh).
"""
import asyncio
import os
import ssl

import edge_tts.communicate as comm
import edge_tts.voices as voices

CA_BUNDLE = "/run/hatch/egress-tls/ca-bundle.pem"
_CTX = ssl.create_default_context(cafile=CA_BUNDLE)
comm._SSL_CTX = _CTX
voices._SSL_CTX = _CTX

import edge_tts  # noqa: E402  (después del parche SSL)

VOICE = "es-MX-JorgeNeural"
RATE = "+5%"

# El WebSocket (wss://) de edge-tts NO hereda el proxy de las variables de
# entorno HTTPS_PROXY (aiohttp solo aplica HTTPS_PROXY a https://, y para
# wss:// busca WSS_PROXY, que no está definida): sin proxy explícito la
# conexión va directa al gateway de egreso y el handshake TLS falla con
# WRONG_VERSION_NUMBER. Se pasa el proxy del entorno explícitamente.
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

SSML = """<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX">
<voice name="es-MX-JorgeNeural"><prosody rate="+5%">
¿Sabías que el bloqueo llegó hasta el maratón?
En 2012, la OFAC canceló el programa que traía corredores de Estados Unidos a Marabana.
Un año antes, veintiuno habían corrido en La Habana.
Pero a pesar de ello…<break time="500ms"/>
Hoy, catorce años después, casi tres mil corredores tomaron las calles de La Habana en la cuarenta edición de Marabana.
Y los cinco kilómetros se llamaron Carrera contra el Bloqueo y por la Paz.
Como dijo el corredor Yuraldi Cava: El bloqueo asfixia al pueblo cubano.
En el maratón ganaron Estévez y Bacallao. Y en la media, doblete de Las Tunas.
Y Ernesto Javier Consuegra completó los diez kilómetros…<break time="700ms"/> con un bastón.
Hoy La Habana corrió. Y cada paso fue una denuncia.
</prosody></voice>
</speak>"""

OUT = os.path.expanduser(
    "~/workspace/remotion-hub/repo/projects/marabana-v1/public/audio/vo-preview.mp3"
)


async def main() -> None:
    communicate = edge_tts.Communicate(SSML, VOICE, rate=RATE, proxy=PROXY)
    await communicate.save(OUT)
    print(f"OK {OUT} ({os.path.getsize(OUT)} bytes)")


if __name__ == "__main__":
    asyncio.run(main())
