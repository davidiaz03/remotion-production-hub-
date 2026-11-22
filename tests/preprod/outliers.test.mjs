// Suite del escáner de outliers de YouTube (scripts/preprod/outliers.py):
// matemática, selección de backend, cuota, informe con fixtures sin red
// (yt-dlp falso) y garantía de no-edición del script.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,copyFileSync,chmodSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const SCRIPT=path.join(ROOT,'scripts','preprod','outliers.py');
const FIX=path.join(ROOT,'tests','preprod','fixtures','outliers');
const RESEARCH=path.join(ROOT,'preprod','research');

function runOutliers(args,env={}){
 const merged={...process.env,PYTHONDONTWRITEBYTECODE:'1'};
 for(const [k,v] of Object.entries(env)){
  if(v===undefined) delete merged[k]; else merged[k]=v;
 }
 return spawnSync('python3',[SCRIPT,...args],{cwd:ROOT,encoding:'utf8',env:merged});
}
function runPy(code,env={}){
 return spawnSync('python3',['-c',code],{cwd:ROOT,encoding:'utf8',
  env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',...env}});
}
function tmpOut(){
 return mkdtempSync(path.join(tmpdir(),'outliers-test-'));
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
function stubYtdlp(dir){
 // Copia el yt-dlp falso al tmpdir y lo hace ejecutable.
 const ruta=path.join(dir,'stub-ytdlp.sh');
 copyFileSync(path.join(FIX,'stub-ytdlp.sh'),ruta);
 chmodSync(ruta,0o755);
 return ruta;
}

test('matemática: mediana, multiplicador, umbrales 3x/10x y exclusión de recientes',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from datetime import date, timedelta
from outliers import analizar_canal, clasificar
import statistics
assert clasificar(2.99) is None
assert clasificar(3.0) == 'outlier'
assert clasificar(9.99) == 'outlier'
assert clasificar(10.0) == 'breakout'
assert clasificar(None) is None
assert statistics.median([100, 200, 300]) == 200
assert statistics.median([100, 200, 300, 400]) == 250
ref = date(2026, 11, 21)
def v(vistas, dias):
    return {'id': f'v{vistas}_{dias}', 'titulo': 't', 'url': 'u',
            'vistas': vistas,
            'publicado': ref - timedelta(days=dias) if dias is not None else None,
            'duracion_s': 100}
videos = [v(100, 30), v(200, 25), v(300, 20), v(400, 15), v(500, 10),
          v(1500, 30), v(4500, 20), v(9000, 2), v(100, 1),
          {'id': 'sv', 'titulo': 't', 'url': 'u', 'vistas': None, 'publicado': ref, 'duracion_s': 1},
          v(600, None),
          v(700, 7),
          v(800, 8)]
r = analizar_canal('Prueba', videos, ref)
# Base: 100,200,300,400,500,800,1500,4500 -> mediana (400+500)/2 = 450.
assert r['mediana'] == 450, r['mediana']
assert r['n_videos'] == 13
assert r['n_base'] == 8, r['n_base']
assert r['n_sin_vistas'] == 1
assert r['n_sin_fecha'] == 1
outs = {o['id']: o for o in r['outliers']}
assert set(outs) == {'v1500_30', 'v4500_20'}, outs.keys()
assert outs['v1500_30']['clasificacion'] == 'outlier'  # 1500/450 = 3.33x
assert outs['v4500_20']['clasificacion'] == 'breakout'  # 4500/450 = 10.0x
assert r['outliers'][0]['id'] == 'v4500_20'  # ordenados por multiplicador
rec = r['recientes_a_vigilar']
assert len(rec) == 1 and rec[0]['id'] == 'v9000_2', rec
# El video de exactamente 7 días no entra en la base ni en recientes (1.56x).
# El video sin fecha no se clasifica.
# Mediana 0: sin división por cero.
r0 = analizar_canal('Cero', [v(0, 30), v(0, 20)], ref)
assert r0['mediana'] == 0
assert r0['outliers'] == []
# Sin videos: mediana None.
r1 = analizar_canal('Vacio', [], ref)
assert r1['mediana'] is None and r1['outliers'] == []
print('MATH OK')
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stdout+r.stderr);
 assert.match(r.stdout,/MATH OK/);
});

test('backend: auto elige api con clave y ytdlp sin clave; api sin clave falla',()=>{
 const codigo=`
import os, sys
sys.path.insert(0, 'scripts/preprod')
from outliers import elegir_backend
os.environ.pop('YOUTUBE_API_KEY', None)
assert elegir_backend('auto') == 'ytdlp'
assert elegir_backend('ytdlp') == 'ytdlp'
os.environ['YOUTUBE_API_KEY'] = 'CLAVE-DE-PRUEBA'
assert elegir_backend('auto') == 'api'
assert elegir_backend('ytdlp') == 'ytdlp'
os.environ.pop('YOUTUBE_API_KEY', None)
try:
    elegir_backend('api')
    raise AssertionError('api sin clave debio fallar')
except SystemExit as e:
    assert 'YOUTUBE_API_KEY' in str(e)
print('BACKEND OK')
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stdout+r.stderr);
 assert.match(r.stdout,/BACKEND OK/);
});

test('cuota: el contador respeta el tope',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from outliers import Cuota
c = Cuota(5)
c.gastar(3, 'prueba')
assert c.usadas == 3
try:
    c.gastar(3, 'prueba')
    raise AssertionError('debió superar el tope')
except SystemExit as e:
    assert 'tope de cuota' in str(e)
print('CUOTA OK')
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stdout+r.stderr);
 assert.match(r.stdout,/CUOTA OK/);
});

test('scan con yt-dlp falso: informe .md y .json con outliers reales del fixture',()=>{
 const out=tmpOut();
 try{
  const stub=stubYtdlp(out);
  const log=path.join(out,'stub.log');
  const r=runOutliers(['scan','--channels',path.join(FIX,'channels.json'),
   '--backend','ytdlp','--ytdlp',stub,'--out',out,'--date','2026-11-21',
   '--max','50'],{STUB_LOG:log,YOUTUBE_API_KEY:undefined});
  assert.equal(r.status,0,r.stdout+r.stderr);
  // El stub recibió la URL de la playlist de uploads (UU + ID) de cada canal.
  const llamadas=readFileSync(log,'utf8');
  assert.match(llamadas,/playlist\?list=UUFAKE000000000000000001/);
  assert.match(llamadas,/playlist\?list=UUFAKE000000000000000002/);
  // El .md legible: top 3, outliers con multiplicador, recientes, omitidos.
  const md=readFileSync(path.join(out,'outliers-2026-11-21.md'),'utf8');
  assert.match(md,/# Outliers de YouTube — 2026-11-21/);
  assert.match(md,/Backend: \*\*ytdlp\*\*/);
  assert.match(md,/## Top 3 global/);
  assert.match(md,/Video breakout once equis/);
  assert.match(md,/11\.25x/);
  assert.match(md,/Video outlier tres equis/);
  assert.match(md,/3\.0x/);
  assert.match(md,/Recientes a vigilar/);
  assert.match(md,/Video reciente veintidos equis/);
  assert.match(md,/22\.5x/);
  assert.match(md,/## Canales omitidos/);
  assert.match(md,/Canal Omitido/);
  assert.match(md,/## Canal de Prueba A/);
  assert.match(md,/## Canal de Prueba B/);
  assert.match(md,/Mediana: 400 vistas/);
  // El .json: estructura y números exactos del fixture.
  const data=JSON.parse(readFileSync(path.join(out,'outliers-2026-11-21.json'),'utf8'));
  assert.equal(data.fecha,'2026-11-21');
  assert.equal(data.backend,'ytdlp');
  assert.equal(data.unidades_api,0);
  assert.equal(data.top_global.length,3);
  assert.equal(data.top_global[0].multiplicador,11.25);
  assert.equal(data.canales.length,2);
  const a=data.canales[0];
  assert.equal(a.mediana,400);
  assert.equal(a.n_videos,10);
  assert.equal(a.n_base,7);
  assert.equal(a.outliers.length,2);
  assert.equal(a.outliers[0].clasificacion,'breakout');
  assert.equal(a.outliers[0].multiplicador,11.25);
  assert.equal(a.outliers[1].clasificacion,'outlier');
  assert.equal(a.outliers[1].multiplicador,3.0);
  assert.equal(a.recientes_a_vigilar.length,1);
  assert.equal(a.recientes_a_vigilar[0].multiplicador,22.5);
  assert.equal(a.recientes_a_vigilar[0].clasificacion,null);
  assert.equal(data.omitidos.length,1);
  assert.equal(data.omitidos[0].nombre,'Canal Omitido');
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('scan --only: escanea solo el canal pedido',()=>{
 const out=tmpOut();
 try{
  const stub=stubYtdlp(out);
  const r=runOutliers(['scan','--channels',path.join(FIX,'channels.json'),
   '--backend','ytdlp','--ytdlp',stub,'--out',out,'--date','2026-11-21',
   '--only','Prueba B'],{YOUTUBE_API_KEY:undefined});
  assert.equal(r.status,0,r.stdout+r.stderr);
  const data=JSON.parse(readFileSync(path.join(out,'outliers-2026-11-21.json'),'utf8'));
  assert.equal(data.canales.length,1);
  assert.equal(data.canales[0].canal,'Canal de Prueba B');
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('scan: errores de uso (backend api sin clave, --only sin coincidencia, --max 0)',()=>{
 const out=tmpOut();
 try{
  const stub=stubYtdlp(out);
  const r1=runOutliers(['scan','--channels',path.join(FIX,'channels.json'),
   '--backend','api','--out',out],{YOUTUBE_API_KEY:undefined});
  assert.equal(r1.status,1);
  assert.match(r1.stderr,/YOUTUBE_API_KEY/);
  const r2=runOutliers(['scan','--channels',path.join(FIX,'channels.json'),
   '--backend','ytdlp','--ytdlp',stub,'--out',out,'--only','NoExiste'],
   {YOUTUBE_API_KEY:undefined});
  assert.equal(r2.status,2);
  assert.match(r2.stderr,/--only no coincide/);
  const r3=runOutliers(['scan','--channels',path.join(FIX,'channels.json'),
   '--backend','ytdlp','--ytdlp',stub,'--out',out,'--max','0'],
   {YOUTUBE_API_KEY:undefined});
  assert.equal(r3.status,2);
  assert.match(r3.stderr,/--max debe ser >= 1/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('garantía de no-edición (estático): outliers.py no menciona edición ni búsqueda de la API',()=>{
 const codigo=readFileSync(SCRIPT,'utf8');
 for(const token of ['render-chunks','project.mjs','master.py','qa-media',
  'remotion','ffmpeg','os.system','os.exec']){
  assert.ok(!codigo.includes(token),`outliers.py menciona ${token}`);
 }
 // «render» y «search.list» solo pueden aparecer en comentarios (#).
 const sinComentarios=codigo.split('\n')
  .filter(l=>!l.trim().startsWith('#')).join('\n');
 assert.ok(!/render/i.test(sinComentarios),
  'la palabra render aparece fuera de un comentario');
 assert.ok(!sinComentarios.includes('search.list'),
  'search.list aparece fuera de un comentario');
 // subprocess solo para invocar yt-dlp, en un único sitio.
 assert.equal((codigo.match(/subprocess\.run\(/g)||[]).length,1);
 assert.ok(codigo.includes('cmd = [ytdlp_bin'),
  'la única llamada a subprocess no usa el binario yt-dlp');
 // La clave solo se lee del entorno, nunca se escribe ni se imprime.
 assert.ok(!codigo.includes('YOUTUBE_API_KEY')||codigo.includes("os.environ.get(\"YOUTUBE_API_KEY\")"),
  'la clave se toca fuera de os.environ.get');
 assert.ok(!/print\([^)]*clave/i.test(codigo),
  'la clave se imprime en algún print');
});

test('scan con --out no escribe fuera del tmpdir (research del repo intacto)',()=>{
 const out=tmpOut();
 const antes=listarArchivos(RESEARCH);
 try{
  const stub=stubYtdlp(out);
  const r=runOutliers(['scan','--channels',path.join(FIX,'channels.json'),
   '--backend','ytdlp','--ytdlp',stub,'--out',out,'--date','2026-11-21'],
   {YOUTUBE_API_KEY:undefined});
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.ok(existsSync(path.join(out,'outliers-2026-11-21.md')));
  assert.deepEqual(listarArchivos(RESEARCH),antes);
 }finally{rmSync(out,{recursive:true,force:true});}
});
