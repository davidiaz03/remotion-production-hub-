#!/usr/bin/env bash
# Deterministic bootstrap from the historical, immutable Git revision.
# Run once in an online Codespace, inspect diff, commit package-lock.json.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f package-lock.json ]]; then echo 'Lockfile already exists; refusing overwrite.' >&2; exit 1; fi
node scripts/bootstrap-lock.mjs
node -e 'const p=require("./package.json"),l=require("./package-lock.json");for(const d of ["dependencies","devDependencies"])for(const [k,v] of Object.entries(p[d]))if(l.packages["" ][d]?.[k]!==v)throw Error("Lock root mismatch: "+k);console.log("Root dependency pins validated")'
npm ci --no-audit --no-fund
npm ls --depth=0
printf '\nNEXT: git add package-lock.json && git commit -m "chore: lock Remotion engine dependencies"\n'
