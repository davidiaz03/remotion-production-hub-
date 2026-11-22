// Suite de publicación programada (scripts/publish/schedule.py):
// puertas duras (sin aprobación, sin --confirmar, fecha pasada,
// Instagram bloqueado, medio desaparecido), previsualización fiel,
// simulación sin llamar a la plataforma, schedule + verificación
// de lectura con el stub, fallo de la plataforma (borrador
// conservado), resultado incierto (sin reintento solo, resolver
// a mano), garantía estática de nunca-publicar-ahora y la cola
// real vacía (ningún borrador real creado por los tests).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,readFileSync,existsSync,readdirSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const SCRIPT=path.join(ROOT,'scripts','publish','schedule.py');
const FIX=path.join(ROOT,'tests','preprod','fixtures','publish');
const STUB=path.join(FIX,'stub-platform.py');
const COLA_REAL=path.join(ROOT,'publish','queue');

function isoConOffset(ms){
 const d=new Date(ms-4*3600e3);
 const p=n=>String(n).padStart(2,'0');
 return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00-04:00`;
}
const FUTURO=()=>isoConOffset(Date.now()+2*864e5);
const PASADO=()=>isoConOffset(Date.now()-864e5);

function tmpDir(){
 return mkdtempSync(path.join(tmpdir(),'publish-test-'));
}
function runSchedule(dir,args,env={}){
 return spawnSync('python3',[SCRIPT,'--dir',dir,'--platform-cli',STUB,...args],
  {cwd:ROOT,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',...env}});
}
function runPy(code){
 return spawnSync('python3',['-c',code],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
}
function sembrar(dir,pack='pack-aprobado'){
 const packDir=path.join(dir,pack);
 mkdirSync(packDir,{recursive:true});
 copyFileSync(path.join(FIX,pack,'propuesta.md'),path.join(packDir,'propuesta.md'));
 const medio=path.join(dir,'master-ficticio.mp4');
 writeFileSync(medio,'mp4 ficticio');
 return {pack:path.join(packDir,'propuesta.md'),medio};
}
function preparar(dir,{pack='pack-aprobado',plataforma='facebook',cuando=FUTURO(),id='test-reel'}={}){
 const {pack:packPath,medio}=sembrar(dir,pack);
 const registro=path.join(dir,'registro.jsonl');
 const r=runSchedule(dir,['prepare','--pack',packPath,'--medio',medio,
  '--plataforma',plataforma,'--cuando',cuando,
  '--texto','Texto del post ficticio para probar.',
  '--hashtags','#Memorial','#Cuba','--id',id],
  {STUB_REGISTRO:registro});
 assert.equal(r.status,0,r.stderr);
 return {id,medio,registro,pack:packPath};
}
function leerManifiesto(dir,id){
 return JSON.parse(readFileSync(path.join(dir,`${id}.json`),'utf8'));
}
function llamadas(registro){
 if(!existsSync(registro)) return [];
 return readFileSync(registro,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l));
}

test('prepare desde un pack aprobado crea el borrador',()=>{
 const dir=tmpDir();
 const {id}=preparar(dir);
 const m=leerManifiesto(dir,id);
 assert.equal(m.estado,'borrador');
 assert.equal(m.plataforma,'facebook');
 assert.equal(m.aprobacion.fecha,'2026-11-21');
 assert.deepEqual(m.hashtags,['#Memorial','#Cuba']);
 assert.equal(typeof m.cuando_unix,'number');
 assert.equal(m.ultimo_error,null);
 assert.equal(m.agendado,null);
});

test('prepare sin aprobación de Suleris → rechazo y sin manifiesto',()=>{
 const dir=tmpDir();
 const {pack,medio}=sembrar(dir,'pack-pendiente');
 const r=runSchedule(dir,['prepare','--pack',pack,'--medio',medio,
  '--plataforma','facebook','--cuando',FUTURO(),'--texto','x','--id','sin-aprob']);
 assert.equal(r.status,2);
 assert.match(r.stderr,/no está aprobado/);
 assert.equal(existsSync(path.join(dir,'sin-aprob.json')),false);
});

test('prepare con fecha pasada → rechazo',()=>{
 const dir=tmpDir();
 const {pack,medio}=sembrar(dir);
 const r=runSchedule(dir,['prepare','--pack',pack,'--medio',medio,
  '--plataforma','facebook','--cuando',PASADO(),'--texto','x','--id','pasado']);
 assert.equal(r.status,2);
 assert.match(r.stderr,/ya pasó/);
});

test('review muestra la previsualización fiel del post',()=>{
 const dir=tmpDir();
 const {id}=preparar(dir);
 const r=runSchedule(dir,['review','--id',id]);
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/PREVISUALIZACIÓN/);
 assert.match(r.stdout,/Texto del post ficticio para probar\./);
 assert.match(r.stdout,/#Memorial #Cuba/);
 assert.match(r.stdout,/master-ficticio\.mp4 \(vídeo/);
 assert.match(r.stdout,/facebook/);
 assert.match(r.stdout,/hora de La Habana/);
 assert.match(r.stdout,/Aprobación de Suleris: 2026-11-21/);
 const lista=runSchedule(dir,['review']);
 assert.match(lista.stdout,/Texto del post ficticio para probar\./);
 assert.match(lista.stdout,/#Memorial #Cuba/);
});

test('review avisa si el medio ya no existe',()=>{
 const dir=tmpDir();
 const {id,medio}=preparar(dir);
 rmSync(medio);
 const r=runSchedule(dir,['review','--id',id]);
 assert.match(r.stdout,/EL ARCHIVO NO EXISTE/);
});

test('schedule sin --confirmar → rechazo y la plataforma no se toca',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id],{STUB_REGISTRO:registro});
 assert.equal(r.status,2);
 assert.match(r.stderr,/--confirmar/);
 assert.equal(leerManifiesto(dir,id).estado,'borrador');
 assert.deepEqual(llamadas(registro),[]);
});

test('schedule en Instagram → bloqueo claro (@memorialdenuncia)',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir,{plataforma:'instagram',id:'test-ig'});
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],{STUB_REGISTRO:registro});
 assert.equal(r.status,2);
 assert.match(r.stderr,/Instagram está BLOQUEADO/);
 assert.match(r.stderr,/@memorialdenuncia/);
 assert.equal(leerManifiesto(dir,id).estado,'borrador');
 assert.deepEqual(llamadas(registro),[]);
});

test('schedule con fecha pasada → rechazo (manifiesto a mano)',()=>{
 const dir=tmpDir();
 const {id,medio,pack}=preparar(dir);
 const m=leerManifiesto(dir,id);
 m.cuando=PASADO();
 m.cuando_unix=Math.floor(new Date(m.cuando).getTime()/1000);
 writeFileSync(path.join(dir,`${id}.json`),JSON.stringify(m));
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar']);
 assert.equal(r.status,2);
 assert.match(r.stderr,/ya pasó/);
 assert.equal(leerManifiesto(dir,id).estado,'borrador');
});

test('schedule con el medio desaparecido → rechazo y borrador en cola',()=>{
 const dir=tmpDir();
 const {id,medio,registro}=preparar(dir);
 rmSync(medio);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],{STUB_REGISTRO:registro});
 assert.equal(r.status,2);
 assert.match(r.stderr,/ya no existe/);
 assert.equal(leerManifiesto(dir,id).estado,'borrador');
 assert.deepEqual(llamadas(registro),[]);
});

test('--simular valida todo sin llamar a la plataforma',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar','--simular'],
  {STUB_REGISTRO:registro});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/SIMULACIÓN/);
 assert.match(r.stdout,/--scheduled-publish-time/);
 assert.deepEqual(llamadas(registro),[]);
 const m=leerManifiesto(dir,id);
 assert.equal(m.estado,'borrador');
 assert.ok(m.simulacion_ultima.comando.includes('--scheduled-publish-time'));
});

test('schedule ok: agenda, verifica con lectura y marca agendado',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],{STUB_REGISTRO:registro});
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/Agendado y verificado/);
 assert.match(r.stdout,/state: scheduled/);
 const m=leerManifiesto(dir,id);
 assert.equal(m.estado,'agendado');
 assert.equal(m.agendado.post_id,'fb_post_123');
 assert.ok(m.agendado.verificado_en);
 const calls=llamadas(registro);
 assert.equal(calls.length,2);
 assert.deepEqual(calls[0].slice(0,3),['pages','posts','create']);
 assert.ok(calls[0].includes('--scheduled-publish-time'));
 assert.deepEqual(calls[1].slice(0,3),['pages','posts','get']);
 assert.ok(calls[1].includes('fb_post_123'));
 // Ya agendado: no se agenda dos veces.
 const otra=runSchedule(dir,['schedule','--id',id,'--confirmar'],{STUB_REGISTRO:registro});
 assert.equal(otra.status,2);
 assert.match(otra.stderr,/ya está agendado/);
});

test('fallo de la plataforma (token caído): borrador en cola con el error',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],
  {STUB_REGISTRO:registro,STUB_MODO:'error-auth'});
 assert.equal(r.status,3);
 assert.match(r.stdout,/FALLO AL AGENDAR/);
 assert.match(r.stdout,/SIGUE EN LA COLA/);
 const m=leerManifiesto(dir,id);
 assert.equal(m.estado,'borrador');
 assert.match(m.ultimo_error.mensaje,/token/);
 assert.equal(m.ultimo_error.etapa,'agendar');
 // Reintentable: con el acceso de vuelta, agenda bien.
 const ok=runSchedule(dir,['schedule','--id',id,'--confirmar'],{STUB_REGISTRO:registro});
 assert.equal(ok.status,0,ok.stderr);
 assert.equal(leerManifiesto(dir,id).estado,'agendado');
});

test('fallo ambiguo → incierto, sin reintento solo, resolver a mano',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],
  {STUB_REGISTRO:registro,STUB_MODO:'error-5xx'});
 assert.equal(r.status,4);
 assert.match(r.stdout,/RESULTADO INCIERTO/);
 assert.match(r.stdout,/NO SE REINTENTA SOLO/);
 assert.equal(leerManifiesto(dir,id).estado,'incierto');
 const reintento=runSchedule(dir,['schedule','--id',id,'--confirmar'],
  {STUB_REGISTRO:registro});
 assert.equal(reintento.status,2);
 assert.match(reintento.stderr,/INCIERTO/);
 const res=runSchedule(dir,['resolver','--id',id,'--reintentar']);
 assert.equal(res.status,0,res.stderr);
 assert.equal(leerManifiesto(dir,id).estado,'borrador');
 const ok=runSchedule(dir,['schedule','--id',id,'--confirmar'],{STUB_REGISTRO:registro});
 assert.equal(ok.status,0,ok.stderr);
});

test('la verificación de lectura falla → incierto con post_id, resolver --fue-agendado',()=>{
 const dir=tmpDir();
 const {id,registro}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],
  {STUB_REGISTRO:registro,STUB_LECTURA:'fallo'});
 assert.equal(r.status,4);
 assert.match(r.stdout,/VERIFICACIÓN FALLÓ/);
 const m=leerManifiesto(dir,id);
 assert.equal(m.estado,'incierto');
 assert.equal(m.agendado.post_id,'fb_post_123');
 assert.equal(m.agendado.verificado_en,null);
 const res=runSchedule(dir,['resolver','--id',id,'--fue-agendado','--post-id','fb_post_123']);
 assert.equal(res.status,0,res.stderr);
 const m2=leerManifiesto(dir,id);
 assert.equal(m2.estado,'agendado');
 assert.equal(m2.agendado.verificacion,'humana');
});

test('la lectura devuelve otro estado (published) → incierto',()=>{
 const dir=tmpDir();
 const {id}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],
  {STUB_LECTURA:'publicado'});
 assert.equal(r.status,4);
 assert.match(r.stdout,/NO APARECE COMO AGENDADO/);
 assert.equal(leerManifiesto(dir,id).estado,'incierto');
});

test('respuesta sin post_id → incierto',()=>{
 const dir=tmpDir();
 const {id}=preparar(dir);
 const r=runSchedule(dir,['schedule','--id',id,'--confirmar'],
  {STUB_MODO:'sin-post-id'});
 assert.equal(r.status,4);
 assert.equal(leerManifiesto(dir,id).estado,'incierto');
});

test('tiempo agotado → incierto (no se reintenta solo)',()=>{
 const dir=tmpDir();
 const {id}=preparar(dir);
 const r=spawnSync('python3',[SCRIPT,'--dir',dir,'--platform-cli',STUB,'--timeout','1',
  'schedule','--id',id,'--confirmar'],
  {cwd:ROOT,encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',STUB_MODO:'lento'}});
 assert.equal(r.status,4);
 assert.match(r.stdout,/RESULTADO INCIERTO/);
 assert.equal(leerManifiesto(dir,id).estado,'incierto');
});

test('garantía estática: ninguna ruta publica inmediato',()=>{
 const fuente=readFileSync(SCRIPT,'utf8');
 assert.ok(!fuente.includes('drafts'),'el script no usa drafts publish');
 assert.equal((fuente.match(/"posts",\s*"create"/g)||[]).length,1,
  'un solo posts create en todo el script');
 const fn=fuente.slice(fuente.indexOf('def construir_comando_agendar'),
  fuente.indexOf('def construir_comando_leer'));
 assert.ok(fn.includes('"--scheduled-publish-time"'),
  'el único comando de escritura siempre lleva --scheduled-publish-time');
 assert.equal((fuente.match(/subprocess\.run/g)||[]).length,1,
  'una sola llamada a subprocess (ejecutar_cli)');
});

test('unidades: fechas, ventana, aprobación y comando de agendar',()=>{
 const codigo=`
import sys
from datetime import datetime, timedelta, timezone
sys.path.insert(0, 'scripts/publish')
from schedule import parsear_cuando, validar_ventana, leer_aprobacion, aprobado, construir_comando_agendar
# Sin offset se asume -04:00 (La Habana).
d = parsear_cuando('2026-11-24T19:00:00')
assert d.utcoffset() == timedelta(hours=-4)
d2 = parsear_cuando('2026-11-24T23:00:00Z')
assert d2.utcoffset() == timedelta(0)
# Ventana: pasado, <10 min y >29 días se rechazan; 11 min y 2 días pasan.
ahora = datetime.now(timezone.utc)
assert validar_ventana(ahora - timedelta(days=1), ahora) is not None
assert validar_ventana(ahora + timedelta(minutes=5), ahora) is not None
assert validar_ventana(ahora + timedelta(minutes=11), ahora) is None
assert validar_ventana(ahora + timedelta(days=2), ahora) is None
assert validar_ventana(ahora + timedelta(days=30), ahora) is not None
# Aprobación: aprobada / pendiente / sin sección.
assert aprobado(leer_aprobacion('tests/preprod/fixtures/publish/pack-aprobado/propuesta.md'))
assert not aprobado(leer_aprobacion('tests/preprod/fixtures/publish/pack-pendiente/propuesta.md'))
assert leer_aprobacion('tests/preprod/fixtures/publish/stub-platform.py') is None
# El comando de agendar siempre lleva el flag con el unix correcto.
m = {'texto': 'Hola', 'hashtags': ['#X'], 'medio': '/tmp/x.mp4', 'cuando_unix': 1795000000}
cmd = construir_comando_agendar(m, '/opt/hatch/bin/facebook-cli')
assert '--scheduled-publish-time' in cmd
assert cmd[cmd.index('--scheduled-publish-time') + 1] == '1795000000'
assert cmd[cmd.index('--text') + 1] == 'Hola\\n\\n#X'
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stderr);
});

test('la cola real está vacía: ningún borrador real',()=>{
 const archivos=existsSync(COLA_REAL)
  ? readdirSync(COLA_REAL).filter(f=>f.endsWith('.json')) : [];
 assert.deepEqual(archivos,[],
  'publish/queue/ no debe tener manifiestos reales (solo fixtures en tests)');
});
