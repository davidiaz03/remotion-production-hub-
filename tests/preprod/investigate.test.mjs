// Suite de la etapa de investigación previa: dossier (new/check),
// validación de hechos y referencias, y la puerta en propose.py
// (draft avisa, check exige dossier verificado en packs nuevos).
// Modelo: tmpdirs + spawnSync (ver tests/preprod/preprod.test.mjs).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const SCRIPT_INV=path.join(ROOT,'scripts','preprod','investigate.py');
const SCRIPT_PROP=path.join(ROOT,'scripts','preprod','propose.py');
const FIX=path.join(ROOT,'tests','preprod','fixtures');
const URL_A='https://www.facebook.com/reel/1111111111111111/';
const URL_FRANKLIN='https://www.instagram.com/reel/2222222222222222/';

function runInv(args,env={}){
 return spawnSync('python3',[SCRIPT_INV,...args],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',...env}});
}
function runProp(args,env={}){
 return spawnSync('python3',[SCRIPT_PROP,...args],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',...env}});
}
function tmpOut(){
 return mkdtempSync(path.join(tmpdir(),'investigate-test-'));
}
function listarArchivos(dir){
 const out=[];
 const walk=(base,rel)=>{
  for(const e of readdirSync(base,{withFileTypes:true})){
   const p=path.join(base,e.name), r=rel?`${rel}/${e.name}`:e.name;
   if(e.isDirectory()) walk(p,r); else out.push(r);
  }
 };
 if(existsSync(dir)) walk(dir,'');
 return out.sort();
}

// Rellena un dossier recién creado con contenido válido: 1 hecho
// VERIFICADO + 1 NO VERIFICADO, 3 referencias con URL, métricas y
// análisis, 2 tendencias adaptables y 2 ganchos.
function rellenarDossier(contenido){
 let out=contenido;
 out=out.replace(/^- \[VERIFICADO\].*$/m,
  '- [VERIFICADO] Estados Unidos mantiene un embargo económico total sobre Cuba desde 1962. — Fuente: https://www.state.gov/cuba-sanctions/ — Fecha: 2026-11-22');
 out=out.replace(/^- \[NO VERIFICADO\].*$/m,
  '- [NO VERIFICADO] Un mensaje en X del embajador negando el embargo. — Fuente: sin fuente primaria — Fecha: 2026-11-19');
 out=out.replace(/^- URL: \[ESCRIBIR.*$/gm,
  '- URL: https://www.instagram.com/reel/Da8ljr0GeKP/');
 out=out.replace(/^- Plataforma: \[ESCRIBIR.*$/gm,'- Plataforma: Instagram');
 out=out.replace(/^- Métricas: \[ESCRIBIR.*$/gm,'- Métricas: 160K likes · 22-nov-2026');
 out=out.replace(/^- Por qué funciona: \[ESCRIBIR\]$/gm,
  '- Por qué funciona: confrontación pregunta-respuesta con hechos.');
 out=out.replace(/^- Qué se toma prestado \(guía, no copia\): \[ESCRIBIR\]$/gm,
  '- Qué se toma prestado (guía, no copia): el ritmo pregunta-respuesta.');
 out=out.replace(/^- Origen: \[ESCRIBIR.*$/gm,'- Origen: investigación manual');
 out=out.replace(/^### \d+\. \[ESCRIBIR.*$/gm,'### Interrogatorio de Jayapal en el Congreso');
 out=out.replace(/^- \[ESCRIBIR: tendencia\].*$/gm,
  '- El ángulo del combustible está caliente: el pivote del reel es la paradoja del combustible — Visto en: https://www.youtube.com/watch?v=wSMWeYz4tHk');
 out=out.replace(/^- \[ESCRIBIR: tipo de gancho\].*$/gm,
  '- Cita textual del protagonista: «There is no blockade» — Visto en: referencia 1');
 return out;
}

function crearDossierValido(out,tema='negación del embargo'){
 const r=runInv(['new',tema,'--date','2026-11-22','--out',out]);
 assert.equal(r.status,0,r.stderr);
 const ruta=path.join(out,'negacion-del-embargo','dossier.md');
 writeFileSync(ruta,rellenarDossier(readFileSync(ruta,'utf8')));
 return ruta;
}

function rutaPack(out,fecha){
 const packs=listarArchivos(path.join(out,fecha))
  .filter(f=>f.endsWith('/propuesta.md'));
 assert.equal(packs.length,1);
 return path.join(out,fecha,packs[0]);
}

function listaFallos(salida){
 // La lista de fallos va tras la línea «check FALLIDO (N):».
 const partes=salida.split('check FALLIDO');
 return partes.length>1?partes[1]:'';
}

test('new crea el dossier con la plantilla y las cuatro secciones',()=>{
 const out=tmpOut();
 try{
  const r=runInv(['new','negación del embargo','--date','2026-11-22','--out',out]);
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/dossier creado/);
  const ruta=path.join(out,'negacion-del-embargo','dossier.md');
  assert.ok(existsSync(ruta));
  const dossier=readFileSync(ruta,'utf8');
  for(const sec of ['## Hechos verificados','## Referencias',
   '## Tendencias adaptables','## Ganchos que funcionan']){
   assert.ok(dossier.includes(sec),`falta la sección ${sec}`);
  }
  // La plantilla trae marcadores: un dossier recién creado NO pasa.
  assert.ok(dossier.includes('[ESCRIBIR'));
  const c=runInv(['check','negacion-del-embargo','--out',out]);
  assert.notEqual(c.status,0);
  assert.match(c.stdout,/marcador sin rellenar/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('happy path: dossier rellenado pasa el check',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  const r=runInv(['check',ruta]);
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout,/check OK/);
  // También por slug.
  const r2=runInv(['check','negacion-del-embargo','--out',out]);
  assert.equal(r2.status,0,r2.stdout+r2.stderr);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('hecho VERIFICADO sin fuente primaria falla',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  let contenido=readFileSync(ruta,'utf8');
  contenido=contenido.replace(
   '— Fuente: https://www.state.gov/cuba-sanctions/ — Fecha: 2026-11-22',
   '— Fuente: sin fuente primaria — Fecha: 2026-11-22');
  writeFileSync(ruta,contenido);
  const r=runInv(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/hecho VERIFICADO sin fuente primaria/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('referencia sin métricas falla',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  let contenido=readFileSync(ruta,'utf8');
  contenido=contenido.replace('- Métricas: 160K likes · 22-nov-2026',
   '- Métricas:');
  writeFileSync(ruta,contenido);
  const r=runInv(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/sin métricas/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('referencia sin URL falla',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  let contenido=readFileSync(ruta,'utf8');
  contenido=contenido.replace(
   '- URL: https://www.instagram.com/reel/Da8ljr0GeKP/','- URL:');
  writeFileSync(ruta,contenido);
  const r=runInv(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/sin URL/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('falta una sección falla',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  let contenido=readFileSync(ruta,'utf8');
  contenido=contenido.replace(/## Ganchos que funcionan[\s\S]*$/,'');
  writeFileSync(ruta,contenido);
  const r=runInv(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/falta la sección ## Ganchos que funcionan/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('dossier sin tendencias adaptables falla',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  let contenido=readFileSync(ruta,'utf8');
  // Quita las dos tendencias: queda la sección vacía.
  contenido=contenido.replace(
   /^- El ángulo del combustible está caliente.*$/gm,'');
  writeFileSync(ruta,contenido);
  const r=runInv(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/tendencias: se esperan al menos 2/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('dossier sin hechos VERIFICADOS falla',()=>{
 const out=tmpOut();
 try{
  const ruta=crearDossierValido(out);
  let contenido=readFileSync(ruta,'utf8');
  contenido=contenido.replace('- [VERIFICADO] Estados Unidos mantiene',
   '- [NO VERIFICADO] Estados Unidos mantiene');
  writeFileSync(ruta,contenido);
  const r=runInv(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/ningún hecho VERIFICADO/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('new no sobrescribe sin --force; con --force sí',()=>{
 const out=tmpOut();
 try{
  const r1=runInv(['new','negación del embargo','--date','2026-11-22','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const r2=runInv(['new','negación del embargo','--date','2026-11-22','--out',out]);
  assert.equal(r2.status,1);
  assert.match(r2.stderr,/ya existe/);
  const r3=runInv(['new','negación del embargo','--date','2026-11-22','--out',out,'--force']);
  assert.equal(r3.status,0,r3.stderr);
  const ruta=path.join(out,'negacion-del-embargo','dossier.md');
  assert.ok(readFileSync(ruta,'utf8').includes('[ESCRIBIR'));
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('check de dossier inexistente: exit 1',()=>{
 const out=tmpOut();
 try{
  const r=runInv(['check','tema-que-no-existe','--out',out]);
  assert.equal(r.status,1);
  assert.match(r.stderr,/dossier no encontrado/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('puerta de draft: sin dossier avisa; con --dossier válido rellena la ficha',()=>{
 const out=tmpOut();
 try{
  // Sin dossier: el pack se crea, con aviso y Dossier pendiente.
  const r1=runProp(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-23','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  assert.match(r1.stdout,/aviso: sin dossier de investigación/);
  const pack1=readFileSync(rutaPack(out,'2026-11-23'),'utf8');
  assert.match(pack1,/- Dossier: pendiente/);
  // Con dossier válido: sin aviso y la ficha lleva la ruta.
  const dossier=crearDossierValido(path.join(out,'inv'));
  const r2=runProp(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_FRANKLIN,'--date','2026-11-24','--out',out,
   '--dossier',dossier]);
  assert.equal(r2.status,0,r2.stderr);
  assert.ok(!r2.stdout.includes('aviso: sin dossier'),
   'el draft con dossier válido no debe avisar');
  const pack2=readFileSync(rutaPack(out,'2026-11-24'),'utf8');
  assert.ok(pack2.includes(`- Dossier: ${dossier}`));
  // Con dossier inválido (plantilla sin rellenar): el draft falla.
  const r3=runInv(['new','tema prueba','--date','2026-11-22',
   '--out',path.join(out,'inv2')]);
  assert.equal(r3.status,0,r3.stderr);
  const r4=runProp(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-25','--out',out,'--force',
   '--dossier',path.join(out,'inv2','tema-prueba','dossier.md')]);
  assert.equal(r4.status,1);
  assert.match(r4.stderr,/dossier no válido/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('puerta de check: pack nuevo con dossier pendiente falla; pack anterior a la etapa solo avisa',()=>{
 const out=tmpOut();
 try{
  // Pack nuevo (2026-11-23): el dossier pendiente ES un fallo.
  const r1=runProp(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-23','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const c1=runProp(['check',rutaPack(out,'2026-11-23')]);
  assert.notEqual(c1.status,0);
  assert.match(listaFallos(c1.stdout),/dossier pendiente/);
  // Pack anterior a la etapa (2026-11-21): solo un aviso, el dossier
  // no aparece en la lista de fallos (los fallos son los marcadores).
  const r2=runProp(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_FRANKLIN,'--date','2026-11-21','--out',out]);
  assert.equal(r2.status,0,r2.stderr);
  const c2=runProp(['check',rutaPack(out,'2026-11-21')]);
  assert.notEqual(c2.status,0);
  assert.match(c2.stdout,/aviso: dossier pendiente/);
  assert.ok(!/dossier/i.test(listaFallos(c2.stdout)),
   `el pack legado no debe fallar por el dossier: ${listaFallos(c2.stdout)}`);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('puerta de check: pack nuevo con dossier válido no falla por el dossier',()=>{
 const out=tmpOut();
 try{
  const dossier=crearDossierValido(path.join(out,'inv'));
  const r1=runProp(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-23','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const pack=rutaPack(out,'2026-11-23');
  let contenido=readFileSync(pack,'utf8');
  // Ruta relativa desde la carpeta del pack (como en el repo real).
  const relativa=path.relative(path.dirname(pack),dossier);
  contenido=contenido.replace(/^- Dossier: pendiente.*$/m,
   `- Dossier: ${relativa}`);
  writeFileSync(pack,contenido);
  const c=runProp(['check',pack]);
  // El andamio sigue fallando por los marcadores, pero NADA del
  // dossier aparece en la lista de fallos.
  assert.notEqual(c.status,0);
  assert.ok(!/dossier/i.test(listaFallos(c.stdout)),
   `el dossier válido no debe aparecer en los fallos: ${listaFallos(c.stdout)}`);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('garantía estática: investigate.py no menciona edición ni la ejecuta',()=>{
 const codigo=readFileSync(SCRIPT_INV,'utf8');
 for(const token of ['render-chunks','project.mjs','master.py','qa-media',
  'remotion','ffmpeg','subprocess','os.system','os.exec','Popen','check_output']){
  assert.ok(!codigo.includes(token),`scripts/preprod menciona ${token}`);
 }
 const sinComentarios=codigo.split('\n')
  .filter(l=>!l.trim().startsWith('#')).join('\n');
 assert.ok(!/render/i.test(sinComentarios),
  'la palabra render aparece fuera de un comentario');
});

test('new/check con --out no escriben fuera del tmpdir',()=>{
 const out=tmpOut();
 const investRepo=path.join(ROOT,'preprod','investigacion');
 const antes=listarArchivos(investRepo);
 try{
  const r1=runInv(['new','negación del embargo','--date','2026-11-22','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const ruta=path.join(out,'negacion-del-embargo','dossier.md');
  writeFileSync(ruta,rellenarDossier(readFileSync(ruta,'utf8')));
  const r2=runInv(['check','negacion-del-embargo','--out',out]);
  assert.equal(r2.status,0,r2.stdout+r2.stderr);
  assert.deepEqual(listarArchivos(investRepo),antes);
 }finally{rmSync(out,{recursive:true,force:true});}
});
