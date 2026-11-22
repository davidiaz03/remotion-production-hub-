// Suite de preproducción: checklist, packs, ranking, garantía de
// no-edición y corrida diaria silenciosa. Modelo: tmpdirs + spawnSync
// (ver tests/creative-brief.test.mjs).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync,statSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const SCRIPT=path.join(ROOT,'scripts','preprod','propose.py');
const FIX=path.join(ROOT,'tests','preprod','fixtures');
const CHECKLIST=JSON.parse(readFileSync(path.join(ROOT,'preprod','checklist-suleris.json'),'utf8'));
const URL_A='https://www.facebook.com/reel/1111111111111111/';
const URL_F='https://www.facebook.com/reel/9999999999999999/';

function run(args,env={}){
 return spawnSync('python3',[SCRIPT,...args],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',...env}});
}
function tmpOut(){
 const d=mkdtempSync(path.join(tmpdir(),'preprod-test-'));
 return d;
}
function listarArchivos(dir){
 // Lista recursiva de archivos relativos (para detectar escrituras fuera del tmpdir).
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

// Guion que PASA: 148 palabras, sin vetos. Incluye a propósito dos
// casos que NO deben disparar V4: el año 1891 (plan visual) y la
// fecha «19 de noviembre de 2026» (plan visual).
const VO_OK=[
 'Trump dice que Rusia y China ya no están en Venezuela, y que los únicos que quedaron son ellos.',
 'Lo dijo en rueda de prensa en la Casa Blanca, flanqueado por Vance y Rubio, ante las cámaras del mundo.',
 'Según sus palabras, China mordisqueaba los bordes del país y Rusia estaba muy involucrada, hasta que les pidió que se fueran.',
 'El mapa completo es mayor: la misma pregunta mencionaba Groenlandia, el Canal de Panamá y el Pacífico.',
 'La historia de Nuestra América enseña que los imperios siempre cuentan su victoria antes de tiempo.',
 'En 2005, Fidel lo dijo con una claridad que estremece: no es lo mismo estar desinformado que haber perdido la capacidad de pensar.',
 'Por eso este reel no repite el podio: muestra los hechos y deja que el espectador saque sus conclusiones.',
 'Leer para no olvidar. Pensar para no arrodillarse. Que no pase el gigante.',
];
const VISUAL_OK=[
 'Trump en el podio de la Casa Blanca; titular en pantalla con la cita.',
 'Plano de Vance y Rubio junto al podio; etiqueta «19 de noviembre de 2026».',
 'Mapa animado de Venezuela con las rutas que nombra la voz.',
 'Mapa del continente con Groenlandia, Panamá y el Pacífico señalados.',
 'Retrato de Martí con el año 1891 en pantalla.',
 'Foto de Fidel mirando al frente; cita en texto estático.',
 'Archivo de la rueda de prensa; overlay con la fuente y la fecha.',
 'Árboles en fila al amanecer; logo completo del Memorial.',
];
const GANCHOS_OK=[
 '«Ya no están allí. Ellos sí.» Trump asegura que echó a Rusia y China de Venezuela.',
 '¿Se fueron de verdad Rusia y China, o solo cambió el relato desde el podio?',
 'Trump lo dijo en la Casa Blanca: Rusia y China fuera, Estados Unidos dentro.',
];

// Guion que VIOLA: un «19» autónomo (V4), una acusación en primera
// persona del plural (V5) y un sello «PATIO TRASERO» en el plan visual
// (V7). 141 palabras: el rango NO es el motivo del fallo.
const VO_BAD=[...VO_OK];
VO_BAD[4]='19 gobiernos se apartaron de la posición común, y la cifra se usa como argumento.';
VO_BAD[6]='Por eso nosotros repetimos lo que dicen los medios sin detenernos a pensar.';
const VISUAL_BAD=[...VISUAL_OK];
VISUAL_BAD[2]='Mapa con sello «PATIO TRASERO» sobre el Caribe.';

function rellenarPack(contenido,{vo,visual,ganchos}){
 // Sustituye los marcadores del andamio por texto completo.
 let out=contenido;
 out=out.replace(/\[ESCRIBIR: en 2–3 frases[^\n]*/,
  'La declaración es de hoy y define el relato sobre Venezuela: el Memorial responde con hechos, no con el podio.');
 out=out.replace(/\[ESCRIBIR: justificación del formato[^\n]*/,
  'Formato elegido: Presentador a cámara + evidencia, 60 s. La cita textual del protagonista hace el gancho y el mapa sostiene el contexto.');
 ganchos.forEach((g,i)=>{
  out=out.replace(new RegExp(`\\[ESCRIBIR: gancho ${i+1}[^\\n]*`),g);
 });
 vo.forEach((linea,i)=>{
  out=out.replace(new RegExp(`\\[ESCRIBIR: línea ${i+1} de voz en off\\.`),linea);
 });
 visual.forEach((linea,i)=>{
  out=out.replace(new RegExp(`\\[ESCRIBIR: qué se ve en la escena ${i+1}\\.`),linea);
 });
 // Checklist: todas las reglas en pass con evidencia escrita.
 out=out.replace(/- \[ \] (\w+) ·/g,'- [x] $1 ·');
 out=out.replace(/estado: pendiente — evidencia: */g,
  'estado: pass — evidencia: revisado por el agente en la prueba.');
 return out;
}

function crearPackRelleno(out,{vo,visual,ganchos}){
 const r=run(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
  '--url',URL_A,'--date','2026-11-21','--out',out]);
 assert.equal(r.status,0,r.stderr);
 const packs=listarArchivos(path.join(out,'2026-11-21'))
  .filter(f=>f.endsWith('/propuesta.md'));
 assert.equal(packs.length,1);
 const ruta=path.join(out,'2026-11-21',packs[0]);
 const contenido=readFileSync(ruta,'utf8');
 writeFileSync(ruta,rellenarPack(contenido,{vo,visual,ganchos}));
 return ruta;
}

test('checklist: un guion limpio pasa el check',()=>{
 const out=tmpOut();
 try{
  const ruta=crearPackRelleno(out,{vo:VO_OK,visual:VISUAL_OK,ganchos:GANCHOS_OK});
  const r=run(['check',ruta]);
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout,/check OK/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('checklist: un guion que viola V4, V5 y V7 falla citando las reglas correctas',()=>{
 const out=tmpOut();
 try{
  const ruta=crearPackRelleno(out,{vo:VO_BAD,visual:VISUAL_BAD,ganchos:GANCHOS_OK});
  const r=run(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/V4/);
  assert.match(r.stdout,/V5/);
  assert.match(r.stdout,/V7/);
  assert.match(r.stdout,/check FALLIDO \(3\)/);
  // La línea de evidencia del «19» aparece en la salida.
  assert.match(r.stdout,/19 gobiernos/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('check: un pack con marcadores sin rellenar falla',()=>{
 const out=tmpOut();
 try{
  const r0=run(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-21','--out',out]);
  assert.equal(r0.status,0,r0.stderr);
  const ruta=path.join(out,'2026-11-21',
   listarArchivos(path.join(out,'2026-11-21')).find(f=>f.endsWith('/propuesta.md')));
  const r=run(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/marcador sin rellenar/);
  assert.match(r.stdout,/pendiente/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('check: un guion fuera del rango 120–170 palabras falla',()=>{
 const out=tmpOut();
 try{
  const voCorto=['Trump habla de Venezuela.','Fin.'];
  const ruta=crearPackRelleno(out,{vo:voCorto,visual:VISUAL_OK.slice(0,2),ganchos:GANCHOS_OK});
  // El andamio trae 8 líneas; al rellenar solo 2 quedan marcadores: eso
  // también fallaría. Para aislar el rango, quita las líneas restantes.
  let contenido=readFileSync(ruta,'utf8');
  contenido=contenido.replace(/^\d+\. \[ESCRIBIR[^\n]*\n/gm,'');
  contenido=contenido.replace(/^> Visual: \[ESCRIBIR[^\n]*\n/gm,'');
  writeFileSync(ruta,contenido);
  const r=run(['check',ruta]);
  assert.notEqual(r.status,0);
  assert.match(r.stdout,/palabras habladas, fuera del rango 120–170/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('draft desde radar: el andamio tiene todas las secciones y los hechos salen del fixture',()=>{
 const out=tmpOut();
 try{
  const r=run(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-21','--out',out]);
  assert.equal(r.status,0,r.stderr);
  const ruta=path.join(out,'2026-11-21',
   listarArchivos(path.join(out,'2026-11-21')).find(f=>f.endsWith('/propuesta.md')));
  const pack=readFileSync(ruta,'utf8');
  for(const sec of ['## Ficha','## Hechos','## Por qué ahora','## Ganchos',
   '## Guion','## Formato','## Checklist Suleris','## Aprobación']){
   assert.ok(pack.includes(sec),`falta la sección ${sec}`);
  }
  // Hechos del fixture, sin inventar: la URL, la entidad y un fragmento
  // literal de la descripción del digest.
  assert.ok(pack.includes(URL_A));
  assert.ok(pack.includes('Miguel Díaz-Canel'));
  assert.ok(pack.includes('The blockade is a war against our people'));
  // La clasificación NO se inventa desde el radar.
  assert.ok(pack.includes('por determinar'));
  // Las 3 opciones de gancho y las 8 líneas de guion con su plan visual.
  assert.match(pack,/1\. \[ESCRIBIR: gancho 1/);
  assert.match(pack,/3\. \[ESCRIBIR: gancho 3/);
  assert.match(pack,/8\. \[ESCRIBIR: línea 8 de voz en off/);
  assert.match(pack,/> Visual: \[ESCRIBIR: qué se ve en la escena 8/);
  // Todas las reglas del checklist, en pendiente.
  const pendientes=(pack.match(/estado: pendiente/g)||[]).length;
  assert.equal(pendientes,CHECKLIST.reglas.length);
  // El índice registra la URL para no volver a proponerla.
  const indice=JSON.parse(readFileSync(path.join(out,'index.json'),'utf8'));
  assert.ok(indice.propuestas.some(p=>p.url===URL_A));
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('draft desde borrador news-content: los hechos del items JSON mandan sobre el .md',()=>{
 const out=tmpOut();
 try{
  const r=run(['draft','--from-draft',path.join(FIX,'2026-11-21-ejemplo-reel.md'),
   '--date','2026-11-21','--out',out,
   '--news-content',path.join(FIX,'news-content')]);
  assert.equal(r.status,0,r.stderr);
  const ruta=path.join(out,'2026-11-21','2026-11-21-ejemplo','propuesta.md');
  assert.ok(existsSync(ruta));
  const pack=readFileSync(ruta,'utf8');
  // Del JSON (no del .md): clasificación «declaración», sección
  // «Cuba-EE.UU.», cita del JSON y nota de verificación del JSON.
  assert.ok(pack.includes('- Clasificación: declaración'));
  assert.ok(pack.includes('- Sección: Cuba-EE.UU.'));
  assert.ok(pack.includes('cita de ejemplo del JSON'));
  assert.ok(pack.includes('Nota de verificación del JSON de prueba.'));
  assert.ok(pack.includes('https://www.instagram.com/reel/EJEMPLO000/'));
  assert.ok(!pack.includes('cita de ejemplo del borrador'));
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('ranking: shortlist ordenada, con desglose, justificación y dedupe',()=>{
 const out=tmpOut();
 try{
  // La URL F ya fue propuesta: se siembra en el índice antes del rank.
  mkdirSync(out,{recursive:true});
  writeFileSync(path.join(out,'index.json'),JSON.stringify({version:1,propuestas:[
   {url:URL_F,pack:'2026-11-20/ya-propuesta/propuesta.md',fecha:'2026-11-20',titulo:'Ya propuesta'}]}));
  const r=run(['rank','--date','2026-11-21','--digest-dir',FIX,'--out',out]);
  assert.equal(r.status,0,r.stderr);
  const data=JSON.parse(readFileSync(path.join(out,'2026-11-21','SHORTLIST.json'),'utf8'));
  assert.equal(data.items.length,3);
  // Ordenada por total descendente; totales exactos del fixture.
  assert.deepEqual(data.items.map(i=>i.total),[58.2,40.5,36.1]);
  // El engagement NO ordena: A (300 likes tras el dedupe) supera a B
  // (50.000 likes) por criterios, y C (8 likes, caso Kane) entra.
  assert.equal(data.items[0].entity,'Miguel Díaz-Canel');
  assert.equal(data.items[1].entity,'Franklin Virguez');
  assert.equal(data.items[2].entity,'Bayern München');
  for(const item of data.items){
   assert.equal(Object.keys(item.criterios).length,5);
   for(const k of ['valor_informativo','narrativa','formato','gancho','actualidad']){
    assert.ok(item.criterios[k]>=0&&item.criterios[k]<=5,`${k} fuera de 0–5`);
   }
   assert.ok(item.justificacion.length>20,'justificación vacía');
   assert.ok(item.formato_sugerido,'sin formato sugerido');
   assert.ok(item.total>=30,'bajo el umbral');
  }
  // Dedupe: la URL ya propuesta (F) y la de bajo umbral no aparecen.
  const urls=data.items.map(i=>i.url);
  assert.ok(!urls.includes(URL_F),'la URL ya propuesta volvió a la shortlist');
  assert.ok(!urls.some(u=>u.includes('rumor')));
  // Stats: 6 parseadas, 1 duplicada, 1 ya propuesta, 4 frescas.
  assert.equal(data.stats.parseadas,6);
  assert.equal(data.stats.duplicadas,1);
  assert.equal(data.stats.ya_propuestas,1);
  assert.equal(data.stats.frescas,4);
  // El .md legible lleva el desglose y la justificación.
  const md=readFileSync(path.join(out,'2026-11-21','SHORTLIST.md'),'utf8');
  assert.match(md,/C1 valor informativo: 5/);
  assert.match(md,/C2 narrativa: 5/);
  assert.match(md,/Formato: /);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('garantía de no-edición (estático): scripts/preprod no menciona edición ni la ejecuta',()=>{
 const codigo=readFileSync(SCRIPT,'utf8');
 for(const token of ['render-chunks','project.mjs','master.py','qa-media',
  'remotion','ffmpeg','subprocess','os.system','os.exec','Popen','check_output']){
  assert.ok(!codigo.includes(token),`scripts/preprod menciona ${token}`);
 }
 // «render» solo puede aparecer en comentarios que expliquen la prohibición.
 const sinComentarios=codigo.split('\n')
  .filter(l=>!l.trim().startsWith('#')).join('\n');
 assert.ok(!/render/i.test(sinComentarios),
  'la palabra render aparece fuera de un comentario');
});

test('garantía de no-edición (ejecución): draft/check/rank/daily con --out no escriben fuera del tmpdir',()=>{
 const out=tmpOut();
 const propuestasRepo=path.join(ROOT,'preprod','propuestas');
 const antes=listarArchivos(propuestasRepo);
 try{
  const r1=run(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-21','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const pack=path.join(out,'2026-11-21',
   listarArchivos(path.join(out,'2026-11-21')).find(f=>f.endsWith('/propuesta.md')));
  const r2=run(['check',pack]);
  assert.notEqual(r2.status,0,'el andamio sin rellenar debe fallar el check');
  const r3=run(['rank','--date','2026-11-21','--digest-dir',FIX,'--out',out]);
  assert.equal(r3.status,0,r3.stderr);
  const r4=run(['daily','--date','2026-11-22','--digest-dir',FIX,'--out',out]);
  assert.equal(r4.status,0,r4.stderr);
  // Todo lo escrito quedó dentro del tmpdir.
  assert.ok(existsSync(path.join(out,'2026-11-21','SHORTLIST.md')));
  assert.ok(existsSync(path.join(out,'2026-11-22','daily.log')));
  assert.ok(!existsSync(path.join(out,'2026-11-22','SHORTLIST.md')));
  // Y el árbol real de propuestas del repo no cambió.
  assert.deepEqual(listarArchivos(propuestasRepo),antes);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('corrida diaria silenciosa: digest bajo umbral → exit 0, sin packs ni shortlist',()=>{
 const out=tmpOut();
 try{
  const r=run(['daily','--date','2026-11-22','--digest-dir',FIX,'--out',out]);
  assert.equal(r.status,0,r.stderr);
  assert.ok(!existsSync(path.join(out,'2026-11-22','SHORTLIST.md')));
  assert.ok(!existsSync(path.join(out,'2026-11-22','SHORTLIST.json')));
  const archivos=listarArchivos(path.join(out,'2026-11-22'));
  assert.deepEqual(archivos,['daily.log']);
  const log=readFileSync(path.join(out,'2026-11-22','daily.log'),'utf8');
  assert.match(log,/sin shortlist/);
  assert.match(log,/sin packs/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('corrida diaria con shortlist: crea SHORTLIST + packs de los 3 primeros',()=>{
 const out=tmpOut();
 try{
  const r=run(['daily','--date','2026-11-21','--digest-dir',FIX,'--out',out]);
  assert.equal(r.status,0,r.stderr);
  assert.ok(existsSync(path.join(out,'2026-11-21','SHORTLIST.md')));
  assert.ok(existsSync(path.join(out,'2026-11-21','daily.log')));
  const packs=listarArchivos(path.join(out,'2026-11-21'))
   .filter(f=>f.endsWith('/propuesta.md'));
  assert.equal(packs.length,3);
  const indice=JSON.parse(readFileSync(path.join(out,'index.json'),'utf8'));
  assert.equal(indice.propuestas.length,3);
  const log=readFileSync(path.join(out,'2026-11-21','daily.log'),'utf8');
  assert.match(log,/3 packs creados/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('rank con digest ausente: exit 1 con mensaje claro',()=>{
 const out=tmpOut();
 try{
  const r=run(['rank','--date','2026-11-23','--digest-dir',FIX,'--out',out]);
  assert.equal(r.status,1);
  assert.match(r.stderr,/digest no encontrado/);
  assert.match(r.stderr,/radar de las 07:17/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('check de pack inexistente: exit 1',()=>{
 const r=run(['check',path.join(tmpdir(),'no-existe','propuesta.md')]);
 assert.equal(r.status,1);
 assert.match(r.stderr,/pack no encontrado/);
});

test('slug con tema: el pack desde el radar no usa las palabras genéricas de la descripción',()=>{
 const out=tmpOut();
 try{
  const r1=run(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url',URL_A,'--date','2026-11-21','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const r2=run(['draft','--from-radar',path.join(FIX,'radar-2026-11-21-digest.txt'),
   '--url','https://www.instagram.com/reel/2222222222222222/','--date','2026-11-21','--out',out]);
  assert.equal(r2.status,0,r2.stderr);
  const dirs=readdirSync(path.join(out,'2026-11-21'),{withFileTypes:true})
   .filter(e=>e.isDirectory()).map(e=>e.name).sort();
  // A: con cita → entidad + titular entrecomillado.
  assert.ok(dirs.includes('miguel-diaz-canel-the-blockade-is-a-war-against'),`slug de A: ${dirs}`);
  // Franklin: sin cita → entidad + palabras de contenido, sin duplicar la entidad.
  assert.ok(dirs.includes('franklin-virguez-venezuela-oil-deal-united-states'),`slug de Franklin: ${dirs}`);
  for(const d of dirs){
   assert.ok(!d.startsWith('this-is-a')&&!d.startsWith('the-video-shows'),`slug genérico: ${d}`);
  }
  // El título del pack A lleva el tema entrecomillado.
  const packA=readFileSync(path.join(out,'2026-11-21','miguel-diaz-canel-the-blockade-is-a-war-against','propuesta.md'),'utf8');
  assert.match(packA,/The blockade is a war against our people/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('ranking: la justificación cita el titular entrecomillado cuando lo hay',()=>{
 const out=tmpOut();
 try{
  // Igual que el test de ranking: la URL F ya fue propuesta.
  mkdirSync(out,{recursive:true});
  writeFileSync(path.join(out,'index.json'),JSON.stringify({version:1,propuestas:[
   {url:URL_F,pack:'2026-11-20/ya-propuesta/propuesta.md',fecha:'2026-11-20',titulo:'Ya propuesta'}]}));
  const r=run(['rank','--date','2026-11-21','--digest-dir',FIX,'--out',out]);
  assert.equal(r.status,0,r.stderr);
  const data=JSON.parse(readFileSync(path.join(out,'2026-11-21','SHORTLIST.json'),'utf8'));
  assert.match(data.items[0].justificacion,/The blockade is a war against our people/);
  const md=readFileSync(path.join(out,'2026-11-21','SHORTLIST.md'),'utf8');
  assert.match(md,/— «The blockade is a war against our people/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('ranking: una entrada sin likes se muestra como «likes s/d», no «¿?»',()=>{
 const out=tmpOut();
 try{
  const r=run(['rank','--date','2026-11-21','--digest-dir',path.join(FIX,'sin-likes'),'--out',out]);
  assert.equal(r.status,0,r.stderr);
  const md=readFileSync(path.join(out,'2026-11-21','SHORTLIST.md'),'utf8');
  assert.match(md,/likes s\/d/);
  assert.ok(!md.includes('¿?'),'queda un ¿? en la shortlist');
  const data=JSON.parse(readFileSync(path.join(out,'2026-11-21','SHORTLIST.json'),'utf8'));
  assert.equal(data.items.length,1);
  assert.equal(data.items[0].likes,null);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('slug único: dos ítems con misma entidad y titular no se pisan',()=>{
 const out=tmpOut();
 const digest=path.join(FIX,'colision','radar-2026-11-21-digest.txt');
 const urlFB='https://www.facebook.com/reel/2011594893132373/';
 const urlIG='https://www.instagram.com/reel/Df-ocWiJfbO/';
 try{
  const r1=run(['draft','--from-radar',digest,'--url',urlFB,'--date','2026-11-21','--out',out]);
  assert.equal(r1.status,0,r1.stderr);
  const r2=run(['draft','--from-radar',digest,'--url',urlIG,'--date','2026-11-21','--out',out]);
  assert.equal(r2.status,0,r2.stderr);
  const dirs=readdirSync(path.join(out,'2026-11-21'),{withFileTypes:true})
   .filter(e=>e.isDirectory()).map(e=>e.name).sort();
  assert.deepEqual(dirs,['ntn24-no-estan-en-venezuela-nosotros-si',
   'ntn24-no-estan-en-venezuela-nosotros-si-2']);
  const pack1=readFileSync(path.join(out,'2026-11-21',dirs[0],'propuesta.md'),'utf8');
  const pack2=readFileSync(path.join(out,'2026-11-21',dirs[1],'propuesta.md'),'utf8');
  assert.match(pack1,/facebook\.com\/reel\/2011594893132373/);
  assert.match(pack2,/instagram\.com\/reel\/Df-ocWiJfbO/);
  // Regenerar el primero con --force no crea un -3: es la misma URL.
  const r3=run(['draft','--from-radar',digest,'--url',urlFB,'--date','2026-11-21','--out',out,'--force']);
  assert.equal(r3.status,0,r3.stderr);
  const dirs2=readdirSync(path.join(out,'2026-11-21'),{withFileTypes:true})
   .filter(e=>e.isDirectory()).map(e=>e.name).sort();
  assert.deepEqual(dirs2,dirs);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('ranking: la prosa entrecomillada de la descripción no se usa como cita',()=>{
 const out=tmpOut();
 try{
  const r=run(['rank','--date','2026-11-21','--digest-dir',path.join(FIX,'colision'),'--out',out]);
  assert.equal(r.status,0,r.stderr);
  const data=JSON.parse(readFileSync(path.join(out,'2026-11-21','SHORTLIST.json'),'utf8'));
  const item=data.items.find(i=>i.entity==='NOTICIAS 24 HORAS');
  assert.ok(item,'el ítem NOTICIAS 24 HORAS no entró en la shortlist');
  assert.match(item.justificacion,/TRUMP QUIERE RESOLVER CUBA/);
  assert.ok(!item.justificacion.includes('overlays the bottom'),
   `la justificación usa prosa como cita: ${item.justificacion}`);
  // Un paréntesis en inglés entre dos citas no se usa como tema.
  const roi=data.items.find(i=>i.entity==='Roi Rena');
  assert.ok(roi,'el ítem Roi Rena no entró en la shortlist');
  assert.match(roi.justificacion,/Cuba nunca a tenido embargo/);
  assert.ok(!roi.justificacion.includes('Slide 1 displays'),
   `la justificación usa prosa como cita: ${roi.justificacion}`);
  const md=readFileSync(path.join(out,'2026-11-21','SHORTLIST.md'),'utf8');
  assert.ok(!md.includes('overlays the bottom'),'la shortlist usa prosa como tema');
  assert.ok(!md.includes('Slide 1 displays'),'la shortlist usa prosa como tema');
 }finally{rmSync(out,{recursive:true,force:true});}
});
