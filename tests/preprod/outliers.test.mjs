// Suite del escáner de outliers (scripts/preprod/outliers.py):
// matemática, selección de backend, cuota, informes de YouTube,
// Instagram y Facebook con fixtures sin red (CLIs falsos),
// descubrimiento de URLs en digests, resolución del ID de
// Instagram y garantía de no-edición del script.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,copyFileSync,chmodSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync,mkdirSync} from 'node:fs';
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
function stubInstagram(dir){
 const ruta=path.join(dir,'stub-instagram.py');
 copyFileSync(path.join(FIX,'stub-instagram.py'),ruta);
 chmodSync(ruta,0o755);
 return ruta;
}
function stubFacebook(dir){
 const ruta=path.join(dir,'stub-facebook.py');
 copyFileSync(path.join(FIX,'stub-facebook.py'),ruta);
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
def v(senial, dias):
    # La señal es genérica: vistas (YouTube), likes (IG), reacciones (FB).
    return {'id': f'v{senial}_{dias}', 'titulo': 't', 'url': 'u',
            'senial': senial,
            'publicado': ref - timedelta(days=dias) if dias is not None else None,
            'duracion_s': 100}
videos = [v(100, 30), v(200, 25), v(300, 20), v(400, 15), v(500, 10),
          v(1500, 30), v(4500, 20), v(9000, 2), v(100, 1),
          {'id': 'sv', 'titulo': 't', 'url': 'u', 'senial': None, 'publicado': ref, 'duracion_s': 1},
          v(600, None),
          v(700, 7),
          v(800, 8)]
r = analizar_canal('Prueba', videos, ref)
# Base: 100,200,300,400,500,800,1500,4500 -> mediana (400+500)/2 = 450.
assert r['mediana'] == 450, r['mediana']
assert r['n_items'] == 13
assert r['n_base'] == 8, r['n_base']
assert r['n_sin_senial'] == 1
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
 // subprocess solo en ejecutar_cli, en un único sitio; las 3 CLIs
 // (yt-dlp, instagram-cli, facebook-cli) pasan por esa función.
 assert.equal((codigo.match(/subprocess\.run\(/g)||[]).length,1);
 assert.ok(codigo.includes('def ejecutar_cli'),
  'falta la función centralizada ejecutar_cli');
 assert.ok(codigo.includes('cmd = [ytdlp_bin'),
  'la llamada a yt-dlp no usa el binario ytdlp_bin');
 assert.ok((codigo.match(/ejecutar_cli\(/g)||[]).length>=5,
  'las CLIs no pasan todas por ejecutar_cli');
 // Pausa cortés entre URLs de Facebook.
 assert.ok(codigo.includes('time.sleep(PAUSA_FB_SEG)'),
  'falta la pausa entre llamadas de enriquecimiento de Facebook');
 // La clave solo se lee del entorno, nunca se escribe ni se imprime.
 assert.ok(!codigo.includes('YOUTUBE_API_KEY')||codigo.includes("os.environ.get(\"YOUTUBE_API_KEY\")"),
  'la clave se toca fuera de os.environ.get');
 assert.ok(!/print\([^)]*clave/i.test(codigo),
  'la clave se imprime en algún print');
 // El ID de la cuenta de Instagram: solo del entorno/flag/autodetección,
 // nunca impreso ni hardcodeado (el fbid real no puede estar en el repo).
 assert.ok(codigo.includes('os.environ.get("INSTAGRAM_ACCOUNT_ID")'),
  'INSTAGRAM_ACCOUNT_ID no se lee del entorno');
 assert.ok(!/print\([^)]*account_id/i.test(codigo),
  'el ID de cuenta de Instagram se imprime en algún print');
 // Ningún número de 15+ dígitos (un fbid tiene 17): el ID de la
 // cuenta no puede estar hardcodeado en el script. La guarda no
 // escribe el fbid real en el repo: solo prohíbe su forma.
 assert.ok(!/\b\d{15,}\b/.test(codigo),
  'el script contiene un número largo (posible ID hardcodeado)');
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

test('scan instagram con CLI falso: informe con likes, paginación y filtro de colaboraciones',()=>{
 const out=tmpOut();
 try{
  const stub=stubInstagram(out);
  const log=path.join(out,'stub.log');
  const r=runOutliers(['scan','--platform','instagram',
   '--channels',path.join(FIX,'channels.json'),
   '--instagram-cli',stub,'--out',out,'--date','2026-11-21',
   '--max','50'],{STUB_LOG:log,YOUTUBE_API_KEY:undefined,
   INSTAGRAM_ACCOUNT_ID:undefined});
  assert.equal(r.status,0,r.stdout+r.stderr);
  // Autodetección de la cuenta + paginación de cuentaa (3 páginas).
  const llamadas=readFileSync(log,'utf8');
  assert.match(llamadas,/^accounts$/m);
  assert.match(llamadas,/posts --username cuentaa/);
  assert.match(llamadas,/--after PAG2/);
  assert.match(llamadas,/--after PAG3/);
  assert.match(llamadas,/posts --username cuentab/);
  // Solo existe el informe de Instagram (no el de YouTube).
  assert.ok(existsSync(path.join(out,'outliers-instagram-2026-11-21.md')));
  assert.ok(!existsSync(path.join(out,'outliers-2026-11-21.md')));
  const md=readFileSync(path.join(out,'outliers-instagram-2026-11-21.md'),'utf8');
  assert.match(md,/# Outliers de Instagram — 2026-11-21/);
  assert.match(md,/Backend: \*\*instagram-cli\*\*/);
  assert.match(md,/Cuentas escaneadas: 2/);
  assert.match(md,/Publicaciones analizadas: 15/);
  assert.match(md,/Señal principal: likes/);
  assert.match(md,/Post breakout once equis/);
  assert.match(md,/13\.85x/);
  assert.match(md,/Post outlier tres equis/);
  assert.match(md,/3\.69x/);
  assert.match(md,/Recientes a vigilar/);
  assert.match(md,/Post reciente veintidos equis/);
  assert.match(md,/27\.69x/);
  assert.match(md,/## Cuentas omitidas/);
  assert.match(md,/Cuenta Omitida/);
  // La colaboración de otro autor (99999 likes) NO entró en el informe.
  assert.ok(!md.includes('Colaboración que debe filtrarse'));
  // Cuenta B: base de 3 -> aviso de mediana poco fiable.
  assert.match(md,/mediana poco fiable \(base de 3 publicaciones\)/);
  assert.match(md,/Mediana: 325 likes/);
  const data=JSON.parse(readFileSync(path.join(out,'outliers-instagram-2026-11-21.json'),'utf8'));
  assert.equal(data.plataforma,'instagram');
  assert.equal(data.backend,'instagram-cli');
  assert.equal(data.top_global.length,2);
  assert.equal(data.top_global[0].multiplicador,13.85);
  assert.equal(data.top_global[0].likes,4500);
  assert.equal(data.canales.length,2);
  const a=data.canales[0];
  assert.equal(a.canal,'Cuenta de Prueba A');
  assert.equal(a.mediana,325);
  assert.equal(a.n_publicaciones,15);
  assert.equal(a.n_base,12);
  assert.equal(a.mediana_fiable,true);
  assert.equal(a.outliers.length,2);
  assert.equal(a.outliers[0].clasificacion,'breakout');
  assert.equal(a.outliers[0].multiplicador,13.85);
  assert.equal(a.outliers[1].multiplicador,3.69);
  assert.equal(a.recientes_a_vigilar.length,1);
  assert.equal(a.recientes_a_vigilar[0].multiplicador,27.69);
  const b=data.canales[1];
  assert.equal(b.canal,'Cuenta de Prueba B');
  assert.equal(b.mediana,200);
  assert.equal(b.n_base,3);
  assert.equal(b.mediana_fiable,false);
  assert.equal(b.outliers.length,0);
  assert.equal(data.omitidos.length,1);
  assert.equal(data.omitidos[0].nombre,'Cuenta Omitida');
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('scan facebook con CLI falso: enriquecimiento por URL, agrupación y páginas sin URLs',()=>{
 const out=tmpOut();
 try{
  const stub=stubFacebook(out);
  const r=runOutliers(['scan','--platform','facebook',
   '--channels',path.join(FIX,'channels.json'),
   '--facebook-cli',stub,'--fb-urls',path.join(FIX,'fb-urls.txt'),
   '--no-digest','--out',out,'--date','2026-11-21','--max','50'],
   {YOUTUBE_API_KEY:undefined,OUTLIERS_PAUSA_FB:'0'});
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.ok(existsSync(path.join(out,'outliers-facebook-2026-11-21.md')));
  assert.ok(!existsSync(path.join(out,'outliers-2026-11-21.md')));
  const md=readFileSync(path.join(out,'outliers-facebook-2026-11-21.md'),'utf8');
  assert.match(md,/# Outliers de Facebook — 2026-11-21/);
  assert.match(md,/Backend: \*\*facebook-cli\*\*/);
  assert.match(md,/Páginas escaneadas: 2/);
  assert.match(md,/Publicaciones analizadas: 8/);
  assert.match(md,/URLs procesadas: 11/);
  assert.match(md,/Señal principal: reacciones/);
  assert.match(md,/Post breakout once equis/);
  assert.match(md,/11\.25x/);
  assert.match(md,/Post outlier tres equis/);
  assert.match(md,/3\.0x/);
  assert.match(md,/Recientes a vigilar/);
  assert.match(md,/Post reciente veintidos equis/);
  assert.match(md,/22\.5x/);
  assert.match(md,/## Páginas omitidas/);
  assert.match(md,/Página Omitida/);
  // Página B no está en la config: se atribuye y se marca, con el
  // slug entre paréntesis (dos Páginas pueden compartir nombre).
  assert.match(md,/## Página B \(facebook\.com\/paginab\)/);
  assert.match(md,/Página no configurada en trend-channels\.json/);
  assert.match(md,/mediana poco fiable \(base de 2 publicaciones\)/);
  assert.match(md,/Mediana: 400 reacciones/);
  // La URL desconocida quedó como fallo, sin tumbar el escaneo.
  assert.match(md,/## Publicaciones con error/);
  assert.match(md,/reel\/9999/);
  // Página Sin URLs: activa en la config, sin URLs en la lista.
  assert.match(md,/## Páginas de referencia sin publicaciones en este escaneo/);
  assert.match(md,/Página Sin URLs/);
  const data=JSON.parse(readFileSync(path.join(out,'outliers-facebook-2026-11-21.json'),'utf8'));
  assert.equal(data.plataforma,'facebook');
  assert.equal(data.backend,'facebook-cli');
  assert.equal(data.top_global.length,2);
  assert.equal(data.top_global[0].multiplicador,11.25);
  assert.equal(data.top_global[0].reacciones,4500);
  assert.equal(data.canales.length,2);
  const a=data.canales.find(c=>c.canal==='Página A');
  assert.equal(a.mediana,400);
  assert.equal(a.n_publicaciones,8);
  assert.equal(a.n_base,7);
  assert.equal(a.mediana_fiable,true);
  assert.equal(a.configurada,true);
  assert.equal(a.outliers.length,2);
  assert.equal(a.outliers[0].clasificacion,'breakout');
  assert.equal(a.recientes_a_vigilar.length,1);
  const b=data.canales.find(c=>c.canal==='Página B (facebook.com/paginab)');
  assert.equal(b.mediana,150);
  assert.equal(b.n_base,2);
  assert.equal(b.mediana_fiable,false);
  assert.equal(b.configurada,false);
  assert.equal(data.fallos.length,1);
  assert.match(data.fallos[0].canal,/reel\/9999/);
  assert.equal(data.omitidos.length,1);
  assert.equal(data.omitidos[0].nombre,'Página Omitida');
  assert.equal(data.paginas_sin_urls.length,1);
  assert.equal(data.paginas_sin_urls[0].nombre,'Página Sin URLs');
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('scan --platform all: escribe los tres informes',()=>{
 const out=tmpOut();
 try{
  const ytdlp=stubYtdlp(out);
  const ig=stubInstagram(out);
  const fb=stubFacebook(out);
  const r=runOutliers(['scan','--platform','all',
   '--channels',path.join(FIX,'channels.json'),
   '--backend','ytdlp','--ytdlp',ytdlp,
   '--instagram-cli',ig,'--facebook-cli',fb,
   '--fb-urls',path.join(FIX,'fb-urls.txt'),'--no-digest',
   '--out',out,'--date','2026-11-21'],
   {YOUTUBE_API_KEY:undefined,INSTAGRAM_ACCOUNT_ID:undefined,
    OUTLIERS_PAUSA_FB:'0'});
  assert.equal(r.status,0,r.stdout+r.stderr);
  for(const nombre of ['outliers-2026-11-21.md','outliers-2026-11-21.json',
   'outliers-instagram-2026-11-21.md','outliers-instagram-2026-11-21.json',
   'outliers-facebook-2026-11-21.md','outliers-facebook-2026-11-21.json']){
   assert.ok(existsSync(path.join(out,nombre)),`falta ${nombre}`);
  }
  const mdYt=readFileSync(path.join(out,'outliers-2026-11-21.md'),'utf8');
  assert.match(mdYt,/# Outliers de YouTube — 2026-11-21/);
  const mdIg=readFileSync(path.join(out,'outliers-instagram-2026-11-21.md'),'utf8');
  assert.match(mdIg,/# Outliers de Instagram — 2026-11-21/);
  const mdFb=readFileSync(path.join(out,'outliers-facebook-2026-11-21.md'),'utf8');
  assert.match(mdFb,/# Outliers de Facebook — 2026-11-21/);
  const dataFb=JSON.parse(readFileSync(path.join(out,'outliers-facebook-2026-11-21.json'),'utf8'));
  assert.equal(dataFb.plataforma,'facebook');
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('descubrimiento de URLs de Facebook en digests + lectura de --fb-urls',()=>{
 const out=tmpOut();
 try{
  const digestDir=path.join(out,'digests');
  writeFileSync(path.join(out,'urls.txt'),
   '# comentario\nhttps://www.facebook.com/reel/111/\n\nhttps://www.facebook.com/reel/222/\n');
  // Fixture de digest con los dos formatos (entidad en la línea y
  // entidad en la cabecera anterior) + una URL de Página (se excluye)
  // + un digest viejo fuera del rango (se ignora).
  mkdirSync(digestDir,{recursive:true});
  writeFileSync(path.join(digestDir,'radar-2026-11-20-digest.txt'),
   '- 2026-11-20 10:00:00 UTC | 1KL | Entidad A | https://www.facebook.com/reel/555/\n' +
   '- [2026-11-20 11:00:00] L:2K C:3 | entity-Entidad B¦author_id=user-1 | https://www.facebook.com/EntidadB/posts/pfbid0abc\n' +
   'https://www.facebook.com/permalink.php?story_fbid=pfbid0xyz&id=123\n' +
   'https://www.facebook.com/EntidadC\n');
  writeFileSync(path.join(digestDir,'radar-2026-11-01-digest.txt'),
   '- 2026-11-01 10:00:00 UTC | 1L | Vieja | https://www.facebook.com/reel/999/\n');
  const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from datetime import date
from outliers import descubrir_urls_digest, leer_urls_fb
urls = descubrir_urls_digest('${digestDir}', 7, date(2026, 11, 21))
assert 'https://www.facebook.com/reel/555/' in urls, urls
assert 'https://www.facebook.com/EntidadB/posts/pfbid0abc' in urls, urls
assert 'https://www.facebook.com/permalink.php?story_fbid=pfbid0xyz&id=123' in urls, urls
assert 'https://www.facebook.com/EntidadC' not in urls, urls
assert 'https://www.facebook.com/reel/999/' not in urls, urls
assert descubrir_urls_digest('/no/existe', 7, date(2026, 11, 21)) == []
leidas = leer_urls_fb('${path.join(out,'urls.txt')}')
assert leidas == ['https://www.facebook.com/reel/111/', 'https://www.facebook.com/reel/222/'], leidas
print('DIGEST OK')
`;
  const r=runPy(codigo);
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout,/DIGEST OK/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('resolución del ID de Instagram: flag > entorno > autodetección',()=>{
 const out=tmpOut();
 try{
  const stub=stubInstagram(out);
  const codigo=`
import os, sys
sys.path.insert(0, 'scripts/preprod')
from outliers import resolver_instagram_account_id
stub = '${stub}'
os.environ.pop('INSTAGRAM_ACCOUNT_ID', None)
assert resolver_instagram_account_id('FLAG-1', stub) == 'FLAG-1'
os.environ['INSTAGRAM_ACCOUNT_ID'] = 'ENV-2'
assert resolver_instagram_account_id(None, stub) == 'ENV-2'
assert resolver_instagram_account_id('FLAG-1', stub) == 'FLAG-1'
os.environ.pop('INSTAGRAM_ACCOUNT_ID', None)
assert resolver_instagram_account_id(None, stub) == '999999'
print('ACCOUNT OK')
`;
  const r=runPy(codigo);
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout,/ACCOUNT OK/);
 }finally{rmSync(out,{recursive:true,force:true});}
});

test('rate limit: un 429 en los datos no es un rate limit; en stderr sí',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from outliers import _es_rate_limit
# Un 429 dentro de un payload exitoso (likes, IDs) NO es rate limit.
assert _es_rate_limit('{"likes": 429, "post_id": "178414029123"}', '', 0) is False
assert _es_rate_limit('{"count": 33}', '', 0) is False
# Marcadores en stderr sí, aunque la llamada no falle.
assert _es_rate_limit('', 'Error: rate limit exceeded', 0) is True
assert _es_rate_limit('', 'Too Many Requests', 1) is True
# Código 429 en un error con salida no cero sí.
assert _es_rate_limit('{"error": {"code": 429}}', '', 1) is True
assert _es_rate_limit('', 'HTTP 429', 1) is True
# Un fallo sin marcadores de rate limit no lo es.
assert _es_rate_limit('', 'Error: not found', 1) is False
print('RATELIMIT OK')
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stdout+r.stderr);
 assert.match(r.stdout,/RATELIMIT OK/);
});

test('instagram: con --max pequeño sigue paginando hasta completar la base mínima',()=>{
 const out=tmpOut();
 try{
  const stub=stubInstagram(out);
  const log=path.join(out,'stub.log');
  // --max 6: tras la página 2 hay 10 posts pero solo 7 en la base
  // (<10), así que el escaneo debe pedir la página 3 (base 12).
  const r=runOutliers(['scan','--platform','instagram',
   '--channels',path.join(FIX,'channels.json'),
   '--instagram-cli',stub,'--out',out,'--date','2026-11-21',
   '--max','6','--only','Prueba A'],
   {STUB_LOG:log,YOUTUBE_API_KEY:undefined,
    INSTAGRAM_ACCOUNT_ID:undefined});
  assert.equal(r.status,0,r.stdout+r.stderr);
  const llamadas=readFileSync(log,'utf8');
  assert.match(llamadas,/--after PAG3/);
  const data=JSON.parse(readFileSync(path.join(out,'outliers-instagram-2026-11-21.json'),'utf8'));
  assert.equal(data.canales.length,1);
  assert.equal(data.canales[0].n_publicaciones,15);
  assert.equal(data.canales[0].n_base,12);
  assert.equal(data.canales[0].mediana,325);
 }finally{rmSync(out,{recursive:true,force:true});}
});
