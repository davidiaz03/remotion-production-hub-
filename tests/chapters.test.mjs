import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../scripts/lib.mjs';
import {buildChapters, enforceMinGap, formatStamp} from '../scripts/chapters.mjs';

test('chapters: formatStamp M:SS y H:MM:SS', () => {
	assert.equal(formatStamp(0), '0:00');
	assert.equal(formatStamp(5), '0:05');
	assert.equal(formatStamp(65), '1:05');
	assert.equal(formatStamp(3723), '1:02:03');
	assert.equal(formatStamp(3599), '59:59');
	assert.equal(formatStamp(3600), '1:00:00');
});

test('chapters: enforceMinGap fusiona los que violan la separación', () => {
	const {kept, dropped} = enforceMinGap([
		{start_s: 0, title: 'A'},
		{start_s: 5, title: 'B'},
		{start_s: 70, title: 'C'},
		{start_s: 75, title: 'D'},
		{start_s: 200, title: 'E'},
	], 10);
	assert.deepEqual(kept.map((c) => c.title), ['A', 'C', 'E']);
	assert.deepEqual(dropped.map((c) => c.title), ['B', 'D']);
	assert.match(dropped[0].reason, /5 s del capítulo anterior/);
});

test('chapters: buildChapters ancla el primero a 0:00 y exige 3', () => {
	const r = buildChapters({
		titles: ['Apertura', 'La idea', 'Cierre'],
		starts: [2.4, 62, 125],
	});
	assert.equal(r.chapters[0].start, '0:00');
	assert.equal(r.chapters[1].start, '1:02');
	assert.equal(r.chapters[2].start, '2:05');
	assert.deepEqual(r.dropped, []);
	assert.throws(
		() => buildChapters({titles: ['A', 'B'], starts: [0, 60]}),
		/al menos 3 capítulos/,
	);
});

test('chapters: CLI genera txt (YouTube) y json desde timeline.json', () => {
	const id = `chapters-test-${process.pid}`;
	const home = path.join(ROOT, 'projects', id);
	mkdirSync(path.join(home, 'src'), {recursive: true});
	mkdirSync(path.join(home, 'out'), {recursive: true});
	writeFileSync(path.join(home, 'project.json'), JSON.stringify({
		id, title: 'Chapters test', compositionId: 'MainReel',
		durationInFrames: 5400, fps: 30, width: 1920, height: 1080,
	}));
	writeFileSync(path.join(home, 'chapters.json'), JSON.stringify({
		chapters: [
			{number: 0, title: 'Apertura: qué es esto'},
			{number: 1, title: 'La idea central'},
			{number: 2, title: 'Cierre: una acción'},
		],
	}));
	writeFileSync(path.join(home, 'src', 'timeline.json'), JSON.stringify({
		fps: 30, totalFrames: 5400,
		chapters: [
			{number: 0, startFrame: 0, endFrame: 1800},
			{number: 1, startFrame: 1800, endFrame: 3600},
			{number: 2, startFrame: 3600, endFrame: 5400},
		],
	}));
	try {
		const r = spawnSync(process.execPath,
			[path.join(ROOT, 'scripts/chapters.mjs'), id],
			{encoding: 'utf8', timeout: 60000});
		assert.equal(r.status, 0, r.stderr);
		const txt = readFileSync(path.join(home, 'out', `${id}-chapters.txt`), 'utf8');
		assert.equal(txt, '0:00 Apertura: qué es esto\n1:00 La idea central\n2:00 Cierre: una acción\n');
		const js = JSON.parse(readFileSync(path.join(home, 'out', `${id}-chapters.json`), 'utf8'));
		assert.equal(js.chapters.length, 3);
		assert.equal(js.source, 'src/timeline.json');
		assert.equal(js.chapters[1].start_s, 60);
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});

test('chapters: CLI usa vo-full-lines.json si no hay timeline', () => {
	const id = `chapters-test-${process.pid}-b`;
	const home = path.join(ROOT, 'projects', id);
	mkdirSync(path.join(home, 'vo-chapters'), {recursive: true});
	mkdirSync(path.join(home, 'out'), {recursive: true});
	writeFileSync(path.join(home, 'project.json'), JSON.stringify({
		id, title: 'Chapters test', compositionId: 'MainReel',
		durationInFrames: 5400, fps: 30, width: 1920, height: 1080,
	}));
	writeFileSync(path.join(home, 'chapters.json'), JSON.stringify({
		chapters: [
			{number: 0, title: 'Uno'},
			{number: 1, title: 'Dos'},
			{number: 2, title: 'Tres'},
		],
	}));
	writeFileSync(path.join(home, 'vo-chapters', 'vo-full-lines.json'), JSON.stringify({
		lines: [
			{text: 'a', start: 0, end: 1, chapter: 0},
			{text: 'b', start: 45, end: 46, chapter: 1},
			{text: 'c', start: 100, end: 101, chapter: 2},
		],
	}));
	try {
		const r = spawnSync(process.execPath,
			[path.join(ROOT, 'scripts/chapters.mjs'), id],
			{encoding: 'utf8', timeout: 60000});
		assert.equal(r.status, 0, r.stderr);
		assert.ok(existsSync(path.join(home, 'out', `${id}-chapters.txt`)));
		const txt = readFileSync(path.join(home, 'out', `${id}-chapters.txt`), 'utf8');
		assert.equal(txt, '0:00 Uno\n0:45 Dos\n1:40 Tres\n');
	} finally {
		rmSync(home, {recursive: true, force: true});
	}
});
