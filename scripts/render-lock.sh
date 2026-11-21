#!/bin/bash
# Candado de render compartido con propiedad por PID (hub-speed-v5).
#
# BUG QUE CORRIGE (21-nov-2026, incidente durante el render V6,
# 23:17-23:40): el lanzador /tmp/hsv5-audio/run-stills.sh tenía un
# `trap ... EXIT` que borraba el candado compartido
# /tmp/hub-speed-v5-render.lock AL SALIR, sin comprobar quién lo
# creó. Un proceso que esperaba el candado y salía (timeout, señal)
# borraba el candado del render que lo tenía, dejándolo desprotegido:
# otro render podía arrancar en paralelo en una caja de 1,5 CPU.
# Sin daño en V6 (exit 0, 14/14 tramos verificados), pero es un bug
# real de propiedad del candado.
#
# REGLA: solo el proceso que creó el candado puede borrarlo. Este
# helper la impone de dos formas:
#   1. Al adquirir, escribe su PID en $LOCK/pid.
#   2. Al liberar, solo borra si el PID del archivo coincide con $$.
# Además el trap de liberación solo se instala DESPUÉS de adquirir.
#
# Uso:
#   source scripts/render-lock.sh
#   render_lock_acquire [ruta] [timeout_s]   # timeout 0 = esperar siempre
#   trap render_lock_release EXIT            # SOLO tras adquirir con éxito
#   ... trabajo pesado (render, encode, Whisper) ...
#   render_lock_release
#
# Candado rancio: si el PID del archivo ya no existe (el poseedor
# murió sin liberar, p. ej. SIGKILL), el siguiente adquiriente lo
# rompe y reintenta. Sin archivo PID (candados viejos de mkdir
# pelado), se considera rancio por edad (> RENDER_LOCK_STALE_S).
# Nunca se rompe el candado de un proceso vivo.
#
# OJO: este helper es para scripts de shell. Los equivalentes en
# Python ya existen y son seguros: scripts/audio/select-bed-window.py
# (clase Lock con flag `held`) y scripts/visual-preflight.py
# (release solo en el finally posterior a acquire). No dupliques la
# lógica a mano: usa este helper o esas clases.

RENDER_LOCK_DEFAULT="/tmp/hub-speed-v5-render.lock"
RENDER_LOCK_STALE_S="${RENDER_LOCK_STALE_S:-7200}"
RENDER_LOCK_POLL_S="${RENDER_LOCK_POLL_S:-20}"

_RENDER_LOCK_HELD=0
_RENDER_LOCK_PATH=""

render_lock_acquire() {
	local path="${1:-$RENDER_LOCK_DEFAULT}"
	local timeout="${2:-0}"
	local waited=0
	while true; do
		if mkdir "$path" 2>/dev/null; then
			echo "$$" >"$path/pid"
			_RENDER_LOCK_HELD=1
			_RENDER_LOCK_PATH="$path"
			return 0
		fi
		# El candado existe: ¿su dueño sigue vivo?
		local owner=""
		[ -f "$path/pid" ] && owner="$(cat "$path/pid" 2>/dev/null)"
		if [ -n "$owner" ]; then
			if ! kill -0 "$owner" 2>/dev/null; then
				echo "[render-lock] candado $path rancio (PID $owner muerto); se libera" >&2
				rm -rf "$path"
				continue
			fi
		else
			# Sin archivo PID (candado viejo): rancio por edad.
			local age
			age="$(( $(date +%s) - $(stat -c %Y "$path" 2>/dev/null || echo 0) ))"
			if [ "$age" -gt "$RENDER_LOCK_STALE_S" ]; then
				echo "[render-lock] candado $path rancio (${age}s sin PID); se libera" >&2
				rm -rf "$path"
				continue
			fi
		fi
		if [ "$timeout" -gt 0 ] && [ "$waited" -ge "$timeout" ]; then
			echo "[render-lock] candado $path ocupado tras ${timeout}s" >&2
			return 1
		fi
		if [ $((waited % 60)) -eq 0 ]; then
			echo "[render-lock] esperando candado $path (${waited}s)..." >&2
		fi
		sleep "$RENDER_LOCK_POLL_S"
		waited=$((waited + RENDER_LOCK_POLL_S))
	done
}

render_lock_release() {
	[ "$_RENDER_LOCK_HELD" = "1" ] || return 0
	local path="$_RENDER_LOCK_PATH"
	[ -n "$path" ] || return 0
	local owner=""
	[ -f "$path/pid" ] && owner="$(cat "$path/pid" 2>/dev/null)"
	if [ "$owner" = "$$" ]; then
		rm -f "$path/pid"
		rmdir "$path" 2>/dev/null
	fi
	_RENDER_LOCK_HELD=0
	_RENDER_LOCK_PATH=""
}

render_lock_status() {
	local path="${1:-$RENDER_LOCK_DEFAULT}"
	if [ -d "$path" ]; then
		local owner=""
		[ -f "$path/pid" ] && owner="$(cat "$path/pid" 2>/dev/null)"
		local age="$(( $(date +%s) - $(stat -c %Y "$path" 2>/dev/null || echo 0) ))"
		echo "candado $path: ocupado, PID ${owner:-desconocido}, edad ${age}s"
	else
		echo "candado $path: libre"
	fi
}
