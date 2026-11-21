#!/bin/bash
# Tests del candado con propiedad (scripts/render-lock.sh).
# Usa SIEMPRE un candado de prueba propio, NUNCA el compartido.
# Uso: bash scripts/test_render_lock.sh
set -u
cd "$(dirname "$0")/.." || exit 1
# shellcheck source=render-lock.sh
source scripts/render-lock.sh

TEST_LOCK="/tmp/test-render-lock-$$.lock"
RENDER_LOCK_POLL_S=1
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); echo "ok   - $1"; }
bad()  { FAIL=$((FAIL + 1)); echo "FAIL - $1"; }
[ -d "$TEST_LOCK" ] && rm -rf "$TEST_LOCK"

# 1. Adquirir crea el candado con el PID propio.
if render_lock_acquire "$TEST_LOCK" 5; then
	[ -f "$TEST_LOCK/pid" ] && [ "$(cat "$TEST_LOCK/pid")" = "$$" ] \
		&& ok "adquirir escribe PID $$" \
		|| bad "adquirir no dejó el PID propio"
else
	bad "adquirir falló con el candado libre"
fi

# 2. ESCENARIO V6: un segundo proceso espera, agota el timeout y sale;
#    su trap de salida NO debe borrar el candado del poseedor.
(
	source scripts/render-lock.sh
	RENDER_LOCK_POLL_S=1
	# Patrón CORRECTO: el trap solo se instala tras adquirir; como el
	# acquire falla por timeout, el trap nunca se instala y el release
	# del final es no-op (flag held=0).
	if render_lock_acquire "$TEST_LOCK" 2; then
		trap render_lock_release EXIT
		echo "ERROR: el camarero adquirió un candado ocupado" >&2
		exit 2
	fi
	trap render_lock_release EXIT
	# Salir aquí ejecuta el trap: debe ser no-op.
	exit 0
)
waiter_rc=$?
if [ "$waiter_rc" -eq 0 ] && [ -f "$TEST_LOCK/pid" ] \
	&& [ "$(cat "$TEST_LOCK/pid")" = "$$" ]; then
	ok "camarero con timeout NO borra el candado ajeno (escenario V6)"
else
	bad "camarero con timeout tocó el candado ajeno (rc=$waiter_rc)"
fi

# 3. Un proceso que NUNCA adquirió no puede liberar.
(
	source scripts/render-lock.sh
	render_lock_release
)
if [ -f "$TEST_LOCK/pid" ] && [ "$(cat "$TEST_LOCK/pid")" = "$$" ]; then
	ok "release sin adquirir es no-op"
else
	bad "release sin adquirir borró el candado"
fi

# 4. El poseedor libera y el candado desaparece.
render_lock_release
if [ ! -e "$TEST_LOCK" ]; then
	ok "el poseedor libera el candado"
else
	bad "el poseedor no pudo liberar"
fi

# 5. Candado rancio con PID muerto se rompe al adquirir.
mkdir "$TEST_LOCK"
echo "999999" >"$TEST_LOCK/pid"   # PID que no existe
if render_lock_acquire "$TEST_LOCK" 5 \
	&& [ "$(cat "$TEST_LOCK/pid")" = "$$" ]; then
	ok "candado rancio (PID muerto) se rompe y se re-adquiere"
	render_lock_release
else
	bad "candado rancio no se rompió"
fi

# 6. Candado de proceso VIVO no se rompe aunque se espere.
(
	source scripts/render-lock.sh
	RENDER_LOCK_POLL_S=1
	render_lock_acquire "$TEST_LOCK" 5 || exit 3
	sleep 5
	render_lock_release
) &
waiter=$!
sleep 1
# El candado lo tiene el subproceso vivo; un tercer intento con
# timeout corto debe fallar SIN borrarlo.
if render_lock_acquire "$TEST_LOCK" 2; then
	bad "se adquirió un candado de proceso vivo"
	render_lock_release
else
	[ -d "$TEST_LOCK" ] \
		&& ok "candado de proceso vivo resiste un timeout ajeno" \
		|| bad "el timeout ajeno borró el candado vivo"
fi
wait "$waiter" 2>/dev/null
[ -d "$TEST_LOCK" ] && rm -rf "$TEST_LOCK"

echo
echo "test_render_lock: $PASS ok, $FAIL fallos"
[ "$FAIL" -eq 0 ]
