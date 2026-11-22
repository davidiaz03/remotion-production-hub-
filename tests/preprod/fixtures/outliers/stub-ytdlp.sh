#!/bin/sh
# yt-dlp falso para las pruebas de outliers.py: vuelca una playlist
# fija (sin red) y registra sus argumentos en $STUB_LOG si está definido.
# Datos: base 100/200/300/400/500 + outlier 1200 (3.0x) + breakout 4500
# (11.25x) sobre mediana 400; un reciente a 9000 (22.5x, sin clasificar);
# un video sin vistas y uno sin fecha.
if [ -n "$STUB_LOG" ]; then
  echo "$@" >> "$STUB_LOG"
fi
cat <<'JSON'
{"_type": "playlist", "id": "UUFAKE000000000000000001", "title": "Uploads from Canal de Prueba", "channel_id": "UCFAKE000000000000000001", "entries": [
{"id": "v_base1", "title": "Video base 100", "view_count": 100, "upload_date": "20261001", "duration": 120},
{"id": "v_base2", "title": "Video base 200", "view_count": 200, "upload_date": "20261005", "duration": 180},
{"id": "v_base3", "title": "Video base 300", "view_count": 300, "upload_date": "20261010", "duration": 240},
{"id": "v_base4", "title": "Video base 400", "view_count": 400, "upload_date": "20261015", "duration": 300},
{"id": "v_base5", "title": "Video base 500", "view_count": 500, "upload_date": "20261020", "duration": 360},
{"id": "v_out", "title": "Video outlier tres equis", "view_count": 1200, "upload_date": "20261015", "duration": 200},
{"id": "v_break", "title": "Video breakout once equis", "view_count": 4500, "upload_date": "20261010", "duration": 200},
{"id": "v_reciente", "title": "Video reciente veintidos equis", "view_count": 9000, "upload_date": "20261120", "duration": 200},
{"id": "v_sinvistas", "title": "Video sin vistas", "view_count": null, "upload_date": "20261005", "duration": 200},
{"id": "v_sinfecha", "title": "Video sin fecha", "view_count": 600, "duration": 200}
]}
JSON
