# Publicación programada del Memorial (versión prudente)

Prepara borradores programados para revisar. **Nada se publica solo
y nada se agenda sin un humano que lo confirme.**

## El flujo

```
pack aprobado por Suleris → máster listo → prepare → review → schedule --confirmar
```

```bash
cd ~/workspace/remotion-hub/repo

# 1. Borrador: a partir del pack aprobado, el máster y el texto.
python3 scripts/publish/schedule.py prepare \
  --pack preprod/propuestas/2026-11-21/<slug>/propuesta.md \
  --medio <ruta al máster MP4> \
  --plataforma facebook \
  --cuando 2026-11-24T19:00:00-04:00 \
  --texto "Texto del post." \
  --hashtags "#Memorial" "#Cuba"

# 2. Previsualización: ver exactamente el post antes de confirmar.
python3 scripts/publish/schedule.py review --id <id>
#    (sin --id, previsualiza todos los borradores pendientes)

# 3. Simulación (opcional): valida todo y muestra el comando
#    exacto, sin llamar a la plataforma.
python3 scripts/publish/schedule.py schedule --id <id> --confirmar --simular

# 4. Agendar: solo con la confirmación explícita del humano.
python3 scripts/publish/schedule.py schedule --id <id> --confirmar

# Estado de la cola en cualquier momento.
python3 scripts/publish/schedule.py status
```

La hora la elige el humano: el calendario semanal de marketing
(`~/workspace/marketing/calendar/`) es la fuente del hueco. El
módulo no inventa «mejores horas». Se acepta ISO 8601 con offset
explícito; sin offset, se asume -04:00 (hora oficial de La Habana).

## Las puertas duras (sin excepciones)

1. **Nunca publicar inmediato.** El único comando de escritura es
   `pages posts create` SIEMPRE con `--scheduled-publish-time`.
   No existe en el script ninguna ruta que publique ahora
   (garantía estática en la suite).
2. **Nunca agendar sin aprobación de Suleris.** La sección
   `## Aprobación` del pack debe decir `Estado: aprobada`. Se
   comprueba en `prepare` y se vuelve a comprobar en `schedule`.
3. **Nunca agendar sin `--confirmar`.** La flag explícita de un
   humano es obligatoria en cada `schedule`.
4. **Fecha pasada → rechazo.** Facebook solo agenda entre 10
   minutos y 29 días en el futuro; esa ventana se impone aquí.
5. **Instagram bloqueado** hasta reactivar la sesión de
   @memorialdenuncia (código nuevo al correo del Memorial).
   `schedule` lo rechaza con mensaje claro. Facebook es la vía
   que funciona (Página owner_id `61553292780810`).

## Previsualización

`review` muestra el borrador como quedará el post: texto completo
con hashtags, medio (qué video o imagen, con tamaño; avisa si el
archivo ya no existe), fecha y hora en legible, plataforma y
aprobación de Suleris. El humano ve exactamente lo que va a
agendar antes de confirmar.

## Si el acceso se cae en el momento de publicar

1. **Una vez agendado, el post vive en Meta.** El schedule es una
   sola escritura: el post queda guardado en los servidores de
   Meta con su hora, y lo publica Meta. Nuestro acceso (token,
   sesión) solo hace falta EN EL MOMENTO DE AGENDAR. Si se cae
   después, el post sale igual a la hora fijada.
2. **Verificación de lectura.** Tras un schedule exitoso, el
   módulo vuelve a leer el post agendado en la plataforma
   (`pages posts get`) y solo marca `agendado` si la lectura
   confirma `state: scheduled`. Sin confirmación, no hay
   «agendado».
3. **Si el schedule falla, el borrador queda.** Con un rechazo
   claro de la plataforma (p. ej. token caído), el borrador
   SIGUE en la cola en estado `borrador`, con el error registrado
   (`ultimo_error`), sin perderse, y el fallo se reporta en alto
   (salida 3). Se puede reintentar cuando el acceso vuelva.

## Resultado incierto (lo ambiguo no se reintenta solo)

Si no se puede confirmar si el post se agendó (tiempo agotado,
respuesta ilegible, verificación de lectura fallida, o la lectura
devuelve otro estado), el manifiesto pasa a `incierto` (salida
4): el post PODRÍA estar agendado, así que el módulo NO reintenta
solo — un segundo schedule podría duplicar el post. El humano
comprueba la Página en Facebook y lo resuelve:

```bash
# El post SÍ está agendado en la Página:
python3 scripts/publish/schedule.py resolver --id <id> --fue-agendado --post-id <id-del-post>

# El post NO está agendado: vuelve a borrador y se puede agendar de nuevo:
python3 scripts/publish/schedule.py resolver --id <id> --reintentar
```

## Después de agendar: el post se puede cambiar en Facebook

Una vez agendado, el post vive en los **posts programados de la
Página** (Meta Business Suite / Contenido programado), donde
Beatriz o cualquier administradora puede verlo, editar su texto o
su hora, o cancelar la programación antes de que salga. El módulo
no expone todavía reprogramar ni cancelar desde la línea de
comandos (el conector tiene `pages posts reschedule` y
`pages posts cancel-schedule` para una versión posterior); hasta
entonces, esos cambios se hacen en Facebook.

## Códigos de salida

- `0` ok. `1` error inesperado. `2` rechazo de puerta (sin
  aprobación, sin `--confirmar`, fecha inválida, Instagram,
  medio desaparecido, manifiesto incierto o ya agendado).
- `3` rechazo de la plataforma: borrador conservado, reintentable.
- `4` resultado incierto: revisar la Página, resolver a mano.

## Facebook primero, Instagram pendiente

- **Facebook:** la vía que funciona. Un reel es un post de Página
  cuyo único medio es un MP4 (`posts create` con un `--file` MP4).
- **Instagram:** bloqueado en `schedule` hasta reactivar la sesión
  de @memorialdenuncia. Los borradores de Instagram sí se pueden
  preparar (quedan en cola para cuando la sesión vuelva); el
  conector programa con `--publish-at` y no puede listar ni
  cancelar lo programado (eso se hace en la app de Instagram).

## Límites honestos

- La programación es bajo demanda: **no hay cron** que agende
  solo. Cada schedule lo dispara un humano con `--confirmar`.
- La lectura de verificación usa `pages posts get` y exige
  `state: scheduled`. Si la plataforma no devuelve el estado, el
  resultado es `incierto`, nunca «agendado por fe».
- El módulo no reprograma ni cancela desde la línea de comandos
  (ver arriba: eso se hace en Facebook).
- Solo Python stdlib, sin dependencias ni red salvo la llamada al
  CLI de la plataforma en `schedule` (y `--simular` ni eso).
