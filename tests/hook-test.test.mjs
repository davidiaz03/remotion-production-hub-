import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

// Proyecto mínimo bajo projects/ (sin tocar PROJECTS.json: hook-test
// solo usa loadProject). Se borra al final de cada test.
function makeProject({withHooks = true, withProp = true} = {}) {
	const home = path.join(ROOT, 'projects', 'hook-test-tmp');
	rmSync(home, {recursive: true, force: true});
	mkdirSync(path.join(home, 'src'), {recursive: true});
	mkdirSync(path.join(home, 'research'), {recursive: true});
	mkdirSync(path.join(home, 'public'), {recursive: true});
	writeFileSync(
		path.join(home, 'project.json'),
		JSON.stringify({
			id: 'hook-test-tmp',
			compositionId: 'MainReel',
			fps: 30,
			width: 1080,
			height: 1920,
			durationInFrames: 300,
		}),
	);
	writeFileSync(
		path.join(home, 'src', 'index.ts'),
		"import {registerRoot} from 'remotion';\n",
	);
	writeFileSync(
		path.join(home, 'src', 'Video.tsx'),
		withProp
			? 'export const MainReel = ({hookVariant = 0}) => null;\n'
			: 'export const MainReel = () => null;\n',
	);
	if (withHooks) {
		writeFileSync(
			path.join(home, 'research', 'hooks.json'),
			JSON.stringify({
				variants: [
					{text: 'Primer gancho', style: 'title'},
					{text: 'Segundo gancho', style: 'question'},
				],
			}),
		);
	}
	return home;
}

function runHookTest(...args) {
	return spawnSync(
		process.execPath,
		[path.join(ROOT, 'scripts', 'hook-test.mjs'), ...args],
		{cwd: ROOT, encoding: 'utf8', timeout: 30000},
	);
}

test('hook-test: --dry-run lista el plan sin renderizar', () => {
	const home = makeProject();
	try {
		const r = runHookTest('hook-test-tmp', '--seconds', '3', '--dry-run');
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /2 variante\(s\), primeros 90 fotogramas/);
		assert.match(r.stdout, /variante 0 \[title\]: variant-00\.mp4 — «Primer gancho»/);
		assert.match(r.stdout, /variante 1 \[question\]: variant-01\.mp4/);
		assert.match(r.stdout, /--dry-run: sin renderizar/);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('hook-test: --variants selecciona un subconjunto; fuera de rango falla', () => {
	const home = makeProject();
	try {
		const r = runHookTest(
			'hook-test-tmp',
			'--variants',
			'1',
			'--dry-run',
		);
		assert.equal(r.status, 0, r.stderr);
		assert.match(r.stdout, /1 variante\(s\)/);
		assert.match(r.stdout, /variante 1/);
		assert.doesNotMatch(r.stdout, /variante 0/);
		const bad = runHookTest('hook-test-tmp', '--variants', '5', '--dry-run');
		assert.notEqual(bad.status, 0);
		assert.match(bad.stderr, /fuera de rango/);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('hook-test: sin hooks.json o sin la prop se niega', () => {
	let home = makeProject({withHooks: false});
	try {
		const r = runHookTest('hook-test-tmp', '--dry-run');
		assert.notEqual(r.status, 0);
		assert.match(r.stderr, /Sin variantes de gancho/);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
	home = makeProject({withProp: false});
	try {
		const r = runHookTest('hook-test-tmp', '--dry-run');
		assert.notEqual(r.status, 0);
		assert.match(r.stderr, /no lee la prop hookVariant/);
		// --force lo ignora (en dry-run no renderiza igual).
		const forced = runHookTest('hook-test-tmp', '--dry-run', '--force');
		assert.equal(forced.status, 0, forced.stderr);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});
