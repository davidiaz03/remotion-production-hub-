# Candado de render con propiedad (hub-speed-v5) — corrección del bug V6

## Incidente (20-nov-2026, 23:17–23:40)

Durante el render V6 del reel marti-fidel, el candado compartido
`/tmp/hub-speed-v5-render.lock` quedó desprotegido parte del tiempo:
un proceso que esperaba el candado salió y su `trap ... EXIT`
borró el directorio del candado, que pertenecía al render V6.
Sin daño (exit 0, 14/14 tramos verificados), pero el fallo es real:
con el candado caído, otro render podía arrancar en paralelo en una
caja de 1,5 CPU y degradar ambos trabajos.

## Causa raíz

El lanzador `/tmp/hsv5-audio/run-stills.sh` (preparado por el
trabajador de audio para la verificación de stills V5.1) instalaba
un trap de limpieza incondicional:

```bash
trap 'rmdir /tmp/hub-speed-v5-render.lock' EXIT
```

El trap no comprobaba quién creó el candado. Cualquier salida del
proceso — timeout esperando, señal, error antes de adquirir —
ejecutaba el `rmdir` sobre un candado ajeno. El patrón «trap puesto
antes de adquirir + borrado incondicional» es el bug; el protocolo
original de coordinación lo evitaba por orden (trap después del
`mkdir` con éxito), pero nada lo imponía y el lanzador lo violó.

Nota: `/tmp/hsv5-audio/` y `/tmp/v51-render-test` ya no existen
(limpieza del entorno de `/tmp`); el archivo culpable no se puede
reparar in situ. La corrección es estructural (abajo) y el
andamiaje de la verificación de stills V5.1 deberá re-prepararse
si se quiere cerrar ese pendiente.

## Corrección

`scripts/render-lock.sh` (nuevo): helper de shell con propiedad
por PID. Reglas que impone:

1. Al adquirir, el proceso escribe su PID en `$LOCK/pid`.
2. Al liberar, solo borra si el PID del archivo coincide con `$$`.
3. El trap de liberación solo se instala DESPUÉS de adquirir con
   éxito; un `release` sin adquirir es no-op (flag interno).
4. Candado rancio: si el PID del archivo ya no existe (poseedor
   muerto sin liberar), el siguiente adquiriente lo rompe y
   reintenta. Sin archivo PID (candados viejos de `mkdir` pelado),
   rancio por edad (> 7200 s, igual que `select-bed-window.py`).
   Nunca se rompe el candado de un proceso vivo.

Patrón correcto para cualquier lanzador nuevo:

```bash
source scripts/render-lock.sh
render_lock_acquire || exit 1
trap render_lock_release EXIT
# ... trabajo pesado ...
render_lock_release
```

OJO (hub-v6, 21-nov-2026): `flock -c '...'` ejecuta con `/bin/sh`
(dash), donde `source` NO existe: dentro de un `flock -c` hay que
usar `. scripts/render-lock.sh` (punto POSIX). Con `source`, el
acquire falla en silencio («not found» en stderr, que el `&&` ni
siquiera ve porque `source` no es el último comando) y el render
corre SIN candado — le pasó al render E2E de hub-v6 (sin daño: el
flock pesado sí serializaba con los demás trabajadores).

## Auditoría de los usuarios actuales del candado (21-nov-2026)

| Usuario | Veredicto |
|---|---|
| `scripts/audio/select-bed-window.py` (clase `Lock`) | SEGURO: flag `held`, `__exit__` solo borra si lo tiene; stale por edad 7200 s. |
| `scripts/visual-preflight.py` (`acquire_lock`/`release_lock`) | SEGURO en la práctica: `release_lock` solo corre en el `finally` posterior a un `acquire_lock` con éxito (este no tiene timeout ni vía de fallo: o adquiere o espera). Sin manejo de rancio: si el proceso muere con SIGKILL, el candado queda hasta que alguien lo borre a mano. Pendiente menor, no el bug V6. |
| `/tmp/hsv5-audio/run-stills.sh` | BUGGY (trap incondicional). Archivo ya inexistente; no se puede reparar, se sustituye por este helper. |
| Protocolo de coordinación hub-speed-v5 (trap tras `mkdir`) | Seguro por orden, pero frágil: nada impide instalar el trap antes. Este helper lo hace imposible por construcción. |

## Verificación

`scripts/test_render_lock.sh`: **6/6 OK** (~7 s, sobre un candado
de prueba propio, nunca el compartido):

1. adquirir escribe el PID propio;
2. ESCENARIO V6: un camarero con timeout que sale NO borra el
   candado del poseedor (su trap es no-op);
3. release sin adquirir es no-op;
4. el poseedor libera el candado;
5. candado rancio (PID muerto) se rompe y se re-adquiere;
6. candado de proceso vivo resiste un timeout ajeno.

## Texto para `repo/AGENTS.md` (integrar al fusionar hub-speed-v5)

```md
## Candado de render: solo el creador lo borra (21-nov-2026, hub-speed-v5)
El candado compartido /tmp/hub-speed-v5-render.lock protege los
renders en una caja de 1,5 CPU. REGLA: solo el proceso que creó el
candado puede borrarlo. El incidente V6 (20-nov, 23:17-23:40) lo
demostró: un trap EXIT incondicional en run-stills.sh borró el
candado del render V6 mientras otro proceso esperaba. Usar siempre
`scripts/render-lock.sh` (propiedad por PID: acquire escribe $$ en
$LOCK/pid; release solo borra si coincide; el trap solo se instala
tras adquirir) o las clases Python equivalentes (Lock de
select-bed-window.py, acquire/release de visual-preflight.py).
Nunca `trap 'rmdir ...' EXIT` sin comprobar la propiedad. Candado
rancio: PID muerto o >7200 s sin PID.
```
