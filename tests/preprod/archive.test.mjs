// Suite del archivo propio indexado (scripts/archive/archive.py):
// clasificación de tipos, indexado con un stub del CLI de Drive
// (sin red), dedupe entre fuentes, regla de ruta Marabana,
// búsqueda, pendientes, validación del índice, garantía de solo
// lectura en Drive y conteos del índice real contra el informe
// del 21-nov-2026.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,copyFileSync,chmodSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const SCRIPT=path.join(ROOT,'scripts','archive','archive.py');
const FIX=path.join(ROOT,'tests','preprod','fixtures','archive');
const REAL_INDEX=path.join(ROOT,'archive','index.json');

function runArchive(args,env={}){
 return spawnSync('python3',[SCRIPT,...args],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',...env}});
}
function runPy(code){
 return spawnSync('python3',['-c',code],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
}
function tmpDir(){
 return mkdtempSync(path.join(tmpdir(),'archive-test-'));
}
function sembrarTmp(){
 const dir=tmpDir();
 copyFileSync(path.join(FIX,'pending.json'),path.join(dir,'pending.json'));
 const stub=path.join(dir,'stub-drive.py');
 copyFileSync(path.join(FIX,'stub-drive.py'),stub);
 chmodSync(stub,0o755);
 copyFileSync(path.join(FIX,'drive-fixture.json'),path.join(dir,'drive-fixture.json'));
 const r=runArchive(['--dir',dir,'--fuentes',path.join(FIX,'sources.json'),
  '--drive-cli',stub,'index']);
 assert.equal(r.status,0,r.stderr);
 return dir;
}
function leerIndice(dir){
 return JSON.parse(readFileSync(path.join(dir,'index.json'),'utf8'));
}

test('clasificación: máster, crudo, foto, gráfico, audio y documento',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/archive')
from archive import clasificar, etiquetas_de, normalizar
c = clasificar
assert c('x_MASTER.mp4', 'video/mp4', 'masters', '') == 'máster'
assert c('REEL_PILAR_V30.mp4', 'video/mp4', 'pilar-versiones', 'REEL_PILAR_V30') == 'máster'
assert c('che-reel.mp4', 'video/mp4', 'che', 'renders') == 'máster'
assert c('S01_APPROVED.mp4', 'video/mp4', 'che', 'assets') == 'máster'
assert c('ARCHIVE_S01.mp4', 'video/mp4', 'che', 'assets') == 'video crudo'
assert c('source-bruno.mp4', 'video/mp4', 'bruno-onu', 'assets') == 'video crudo'
assert c('doc.mp4', 'video/mp4', 'pilar-recursos', '') == 'video crudo'
assert c('foto.jpg', 'image/jpeg', 'recorrido', '') == 'foto'
assert c('crudo.dng', 'image/x-adobe-dng', 'carruseles', '') == 'foto'
assert c('LOGO_X.png', 'image/png', 'che', 'assets') == 'gráfico'
assert c('logo_memorial_blanco.png', 'image/png', 'bruno-onu', 'assets') == 'gráfico'
assert c('MARCA_AGUA_OFICIAL.png', 'image/png', 'marca', '') == 'gráfico'
# Trampa: «diálogo» contiene «logo» pero no es un logo.
assert c('04_FAMCA_Dialogo_REDES.jpg', 'image/jpeg', 'carruseles', '') == 'foto'
assert c('cama.wav', 'audio/wav', 'che', 'assets') == 'audio'
assert c('notas.md', 'text/markdown', 'pilar', '') == 'documento'
assert c('kit.zip', 'application/zip', 'onu-cuba', '') == 'documento'
assert c('subs.srt', 'text/plain', 'marabana', '') == 'documento'
assert 'marca' in etiquetas_de('LOGO_X.png', [])
assert 'marca' in etiquetas_de('logo_memorial.png', [])
assert 'marca' not in etiquetas_de('04_FAMCA_Dialogo_REDES.jpg', [])
assert 'crudo' in etiquetas_de('foto.dng', []) and 'dng' in etiquetas_de('foto.dng', [])
assert 'ligero' in etiquetas_de('reel_LIGERO.mp4', [])
assert normalizar('BósCh') == 'bosch'
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stderr);
});

test('index con stub: conteos, dedupe, regla Marabana y pendientes',()=>{
 const dir=sembrarTmp();
 try{
  const idx=leerIndice(dir);
  assert.equal(idx.totales.disponibles,7);
  assert.equal(idx.totales.pendientes,2);
  assert.equal(idx.totales.total,9);
  const ids=idx.entradas.map(e=>e.id);
  assert.equal(new Set(ids).size,ids.length,'sin duplicados');
  // f1 vive en dos fuentes: aparece una sola vez.
  assert.equal(ids.filter(i=>i==='drive:f1').length,1);
  // Regla de ruta: la subcarpeta de Marabana es proyecto propio.
  const f6=idx.entradas.find(e=>e.id==='drive:f6');
  assert.equal(f6.proyecto,'marabana');
  assert.equal(f6.grupo,'marabana');
  assert.equal(f6.tipo,'máster');
  assert.equal(f6.subgrupo,'REEL_MARABANA_V1_ALBERTO_20261115');
  const f7=idx.entradas.find(e=>e.id==='drive:f7');
  assert.equal(f7.proyecto,'marabana');
  assert.equal(f7.tipo,'documento');
  // Tipos del resto.
  const porId=Object.fromEntries(idx.entradas.map(e=>[e.id,e]));
  assert.equal(porId['drive:f3'].tipo,'video crudo');
  assert.equal(porId['drive:f4'].tipo,'foto');
  assert.equal(porId['drive:f5'].tipo,'gráfico');
  assert.ok(porId['drive:f5'].etiquetas.includes('marca'));
  // Pendientes fusionadas, sin file_id.
  const pend=idx.entradas.filter(e=>e.estado==='pendiente');
  assert.equal(pend.length,2);
  assert.ok(pend.every(p=>p.file_id===null));
  // La lista para Suleris se generó con los pendientes.
  const md=readFileSync(path.join(dir,'pendiente-suleris.md'),'utf8');
  assert.ok(md.includes('Video crudo de prueba'));
  assert.ok(md.includes('Foto de archivo de prueba'));
  // check en verde sobre el índice generado.
  const r=runArchive(['--dir',dir,'check']);
  assert.equal(r.status,0,r.stderr);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('search: texto, etiquetas, proyecto, tipo, estado y JSON',()=>{
 const dir=sembrarTmp();
 try{
  const buscar=(args)=>{
   const r=runArchive(['--dir',dir,'search',...args,'--json']);
   assert.equal(r.status,0,r.stderr);
   return JSON.parse(r.stdout);
  };
  assert.equal(buscar(['bosch']).length,1);
  assert.equal(buscar(['bosch'])[0].id,'drive:f4');
  assert.equal(buscar(['logo']).length,1);
  assert.equal(buscar(['','--proyecto','marabana']).length,2);
  assert.equal(buscar(['','--tipo','máster']).length,3);
  assert.equal(buscar(['','--estado','pendiente']).length,2);
  assert.equal(buscar(['','--proyecto','pilar','--tipo','foto']).length,1);
  assert.equal(buscar(['zzz']).length,0);
  // Sin acentos: «bosCh» encuentra bosch.
  assert.equal(buscar(['bósch']).length,1);
  // Texto plano: sin resultados.
  const r=runArchive(['--dir',dir,'search','zzz']);
  assert.equal(r.status,0);
  assert.ok(r.stdout.includes('Sin resultados.'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('pending --escribir-md regenera la lista sin reindexar',()=>{
 const dir=sembrarTmp();
 try{
  const md=path.join(dir,'pendiente-suleris.md');
  rmSync(md);
  assert.equal(existsSync(md),false);
  const r=runArchive(['--dir',dir,'pending','--escribir-md']);
  assert.equal(r.status,0,r.stderr);
  assert.equal(existsSync(md),true);
  assert.ok(readFileSync(md,'utf8').includes('Video crudo de prueba'));
  const lista=runArchive(['--dir',dir,'pending']);
  assert.equal(lista.status,0);
  assert.ok(lista.stdout.includes('Video crudo de prueba'));
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('check: un índice corrupto falla',()=>{
 const dir=sembrarTmp();
 try{
  const ruta=path.join(dir,'index.json');
  const idx=leerIndice(dir);
  // 1. Falta un campo obligatorio.
  const roto1=JSON.parse(JSON.stringify(idx));
  delete roto1.entradas[0].tipo;
  writeFileSync(ruta,JSON.stringify(roto1));
  assert.notEqual(runArchive(['--dir',dir,'check']).status,0);
  // 2. Id duplicado.
  const roto2=JSON.parse(JSON.stringify(idx));
  roto2.entradas[1].id=roto2.entradas[0].id;
  writeFileSync(ruta,JSON.stringify(roto2));
  assert.notEqual(runArchive(['--dir',dir,'check']).status,0);
  // 3. Totales incoherentes.
  const roto3=JSON.parse(JSON.stringify(idx));
  roto3.totales.total=999;
  writeFileSync(ruta,JSON.stringify(roto3));
  assert.notEqual(runArchive(['--dir',dir,'check']).status,0);
  // 4. Pendiente con file_id.
  const roto4=JSON.parse(JSON.stringify(idx));
  const p=roto4.entradas.find(e=>e.estado==='pendiente');
  p.file_id='falso';
  writeFileSync(ruta,JSON.stringify(roto4));
  assert.notEqual(runArchive(['--dir',dir,'check']).status,0);
  // 5. El original sigue en verde.
  writeFileSync(ruta,JSON.stringify(idx));
  assert.equal(runArchive(['--dir',dir,'check']).status,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('garantía de solo lectura: el script solo lista en Drive',()=>{
 const src=readFileSync(SCRIPT,'utf8');
 assert.ok(src.includes('"files", "list"'));
 for(const prohibido of ['"files", "update"','"files", "create"','"files", "delete"','"files", "copy"','"+upload"','"permissions"','trashed":true']){
  assert.ok(!src.includes(prohibido),`el script no debe contener ${prohibido}`);
 }
});

test('índice real: cubre los 9 grupos del informe y cuadran los conteos exactos',()=>{
 assert.ok(existsSync(REAL_INDEX),'el índice real debe existir (correr index antes)');
 const idx=JSON.parse(readFileSync(REAL_INDEX,'utf8'));
 const e=idx.entradas;
 const n=(f)=>e.filter(f).length;
 const disp=(f)=>e.filter(x=>x.estado==='disponible').filter(f).length;
 // Los 5 grupos que el informe contó con exactitud cuadran
 // (solo disponibles: el pendiente del testimonio de Pilar
 // también lleva grupo pilar-recursos).
 assert.equal(disp(x=>x.proyecto==='marti-fidel'&&x.grupo==='masters'),7);
 assert.equal(disp(x=>x.proyecto==='che'&&x.subgrupo==='renders'),85);
 assert.equal(disp(x=>x.proyecto==='diaz-canel'),8);
 assert.equal(disp(x=>x.proyecto==='pilar'&&x.grupo==='pilar-recursos'),19);
 assert.equal(disp(x=>x.proyecto==='recorrido'),73);
 // Los 9 grupos del informe están cubiertos (marca por etiqueta).
 assert.ok(n(x=>x.proyecto==='carruseles')>=21,'carruseles');
 assert.ok(n(x=>x.etiquetas.includes('marca'))>=13,'marca');
 assert.ok(n(x=>x.proyecto==='estrategia')>=1,'estrategia');
 assert.ok(n(x=>x.proyecto==='otros')>=2,'otros');
 // El índice supera el total del informe (249): las subcarpetas
 // que el informe no recorrió por completo sí están indexadas.
 assert.ok(idx.totales.disponibles>=249);
 // Archivos conocidos presentes y disponibles.
 for(const nombre of ['marti-fidel-v61_MASTER.mp4',
  'REEL_PILAR_V30_ALBERTO_20261115.mp4',
  'REEL_MARABANA_V1.3_ALBERTO_20261115_MASTER.mp4',
  'MARCA_AGUA_OFICIAL_MEMORIAL.png']){
  const hallado=e.find(x=>x.titulo===nombre);
  assert.ok(hallado,`${nombre} debe estar en el índice`);
  assert.equal(hallado.estado,'disponible');
 }
 // Pendientes: 3, con los títulos esperados y sin file_id.
 const pend=e.filter(x=>x.estado==='pendiente');
 assert.equal(pend.length,3);
 assert.ok(pend.some(p=>p.titulo.includes('testimonio de María del Pilar')));
 assert.ok(pend.some(p=>p.titulo.includes('archivo histórico')));
 assert.ok(pend.some(p=>p.titulo.includes('otras víctimas')));
 assert.ok(pend.every(p=>p.file_id===null));
 // Totales coherentes con las entradas.
 const r=runArchive(['check']);
 assert.equal(r.status,0,r.stderr);
});
