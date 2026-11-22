// Suite del módulo de medición semanal (scripts/preprod/measure.py):
// matemática (mediana, multiplicador, destacado/flojo, hora/día),
// hallazgos para FORMATOS.md, base CSV de la auditoría, vías de
// Facebook (Páginas y URLs) e Instagram (pública e insights propios)
// con CLIs falsos (sin red), rate limit y garantía de no-edición.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,copyFileSync,chmodSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const SCRIPT=path.join(ROOT,'scripts','preprod','measure.py');
const FIX=path.join(ROOT,'tests','preprod','fixtures','medicion');
const FORMATOS=path.join(ROOT,'preprod','FORMATOS.md');
const RESEARCH=path.join(ROOT,'preprod','research');
const CONFIG=path.join(FIX,'config.json');
const FB_URLS=path.join(FIX,'fb-urls.txt');
const BASE_CSV=path.join(FIX,'base.csv');
const FECHA='2026-11-21';

function runMeasure(args,env={}){
 const merged={...process.env,PYTHONDONTWRITEBYTECODE:'1',
  OUTLIERS_PAUSA_FB:'0.01'};
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
 return mkdtempSync(path.join(tmpdir(),'measure-test-'));
}
function stub(dir,nombre){
 const ruta=path.join(dir,nombre);
 copyFileSync(path.join(FIX,nombre),ruta);
 chmodSync(ruta,0o755);
 return ruta;
}
function stubs(dir){
 return {fb:stub(dir,'stub-facebook.py'),
         ig:stub(dir,'stub-instagram.py')};
}
function leerInforme(out){
 const md=readFileSync(path.join(out,`medicion-${FECHA}.md`),'utf8');
 const js=JSON.parse(readFileSync(path.join(out,`medicion-${FECHA}.json`),'utf8'));
 return {md,js};
}
function hashArchivo(ruta){
 return createHash('sha256').update(readFileSync(ruta)).digest('hex');
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

test('matemática: mediana, multiplicador, destacado/flojo y medianas por tipo',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from datetime import date
from measure import analizar_plataforma, clasificar_medicion
assert clasificar_medicion(2.99) is None
assert clasificar_medicion(3.0) == 'destacado'
assert clasificar_medicion(0.5) == 'flojo'
assert clasificar_medicion(0.51) is None
assert clasificar_medicion(None) is None
ref = date(2026, 11, 21)
def p(senial, dias, tipo='reel'):
    from datetime import timedelta
    return {'titulo': 't', 'url': 'u', 'tipo': tipo,
            'publicado': ref - timedelta(days=dias), 'senial': senial}
posts = [p(100, 50), p(200, 40), p(300, 30),
         p(400, 20, 'carrusel'), p(500, 15, 'carrusel'),
         p(900, 1), p(150, 3), p(300, 5)]
a = analizar_plataforma('Facebook', posts, ref, 'reacciones')
assert a['mediana'] == 300, a['mediana']
assert a['mediana_fiable'] is True
assert a['n_base'] == 5 and a['n_ventana'] == 3
assert a['medianas_tipo']['reel'] == {'mediana': 200, 'n': 3}
assert 'carrusel' not in a['medianas_tipo']  # n=2 < 3
assert a['top'][0]['multiplicador'] == 3.0
assert a['top'][0]['multiplicador_tipo'] == 4.5
assert a['top'][0]['clasificacion'] == 'destacado'
assert a['bottom'][0]['multiplicador'] == 0.5
assert a['bottom'][0]['clasificacion'] == 'flojo'
assert len(a['destacados']) == 1 and len(a['flojos']) == 1
# Base pequeña: mediana poco fiable; sin fecha/sin señal no entran.
posts2 = [p(100, 50), p(200, 40), p(300, 30), p(900, 1),
          {'titulo': 't', 'url': 'u', 'tipo': 'reel',
           'publicado': None, 'senial': 9999},
          {'titulo': 't', 'url': 'u', 'tipo': 'reel',
           'publicado': ref, 'senial': None}]
b = analizar_plataforma('Facebook', posts2, ref, 'reacciones')
assert b['mediana'] == 200 and b['mediana_fiable'] is False
assert b['n_sin_fecha'] == 1 and b['n_sin_senial'] == 1
assert b['n_base'] == 3 and b['n_ventana'] == 2
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stderr);
});

test('patrón de hora/día: solo se emite con n y ratio suficientes',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from datetime import datetime, timedelta
from measure import _patron_hora_dia
def p(senial, dia, hora):
    return {'senial': senial,
            'publicado_dt': datetime(2026, 10, dia, hora)}
# 6 de mañana (100) + 6 de noche (10), todos lunes: solo franja.
posts = [p(100, 5, 8), p(100, 12, 9), p(100, 19, 8), p(100, 26, 9),
         p(100, 5, 10), p(100, 12, 8),
         p(10, 5, 22), p(10, 12, 23), p(10, 19, 22), p(10, 26, 23),
         p(10, 5, 21), p(10, 12, 22)]
pat = _patron_hora_dia(posts)
assert pat is not None and len(pat) == 1, pat
assert pat[0]['dimension'] == 'franja'
assert pat[0]['mejor']['etiqueta'] == 'mañana'
assert pat[0]['ratio'] == 10.0
# Menos de 10 posts: sin patrón.
assert _patron_hora_dia(posts[:5]) is None
# Ratio < 1,5: sin patrón.
posts2 = [p(100, 5, 8), p(100, 12, 9), p(100, 19, 8), p(100, 26, 9),
          p(100, 5, 10), p(100, 12, 8),
          p(90, 5, 22), p(90, 12, 23), p(90, 19, 22), p(90, 26, 23),
          p(90, 5, 21), p(90, 12, 22)]
assert _patron_hora_dia(posts2) is None
# Sin hora: sin patrón aunque haya 12 posts.
posts3 = [{'senial': 100, 'publicado_dt': None} for _ in range(12)]
assert _patron_hora_dia(posts3) is None
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stderr);
});

test('hallazgos: solo con evidencia (ratio entre tipos, semana floja)',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from measure import generar_hallazgos
def analisis(mt, top=None, flojos=None, patron=None):
    return {'plataforma': 'Facebook', 'senial': 'reacciones',
            'mediana': 300, 'n_base': 6, 'medianas_tipo': mt,
            'top': top or [], 'flojos': flojos or [],
            'patron_hora_dia': patron}
# Ratio 2.5x entre tipos -> hallazgo.
h = generar_hallazgos(analisis({'reel': {'mediana': 200, 'n': 3},
                                'carrusel': {'mediana': 500, 'n': 3}}))
assert len(h) == 1 and '2.5x' in h[0]['texto'], h
assert 'n=3' in h[0]['evidencia']
# Ratio 1.5x -> sin hallazgo de tipos.
h = generar_hallazgos(analisis({'reel': {'mediana': 200, 'n': 3},
                                'carrusel': {'mediana': 300, 'n': 3}}))
assert h == [], h
# 3 flojos del mismo tipo -> hallazgo de semana floja.
flojos = [{'titulo': f'flojo {i}', 'tipo': 'carrusel',
           'multiplicador': 0.3} for i in range(3)]
h = generar_hallazgos(analisis({}, flojos=flojos))
assert len(h) == 1 and 'floja' in h[0]['texto'], h
# 2 flojos no bastan.
h = generar_hallazgos(analisis({}, flojos=flojos[:2]))
assert h == [], h
# Top destacado -> hallazgo con enlace.
top = [{'titulo': 'El mejor', 'url': 'https://ejemplo.test/1',
        'senial': 900, 'multiplicador': 3.0}]
h = generar_hallazgos(analisis({}, top=top))
assert len(h) == 1 and 'El mejor' in h[0]['texto'], h
assert 'https://ejemplo.test/1' in h[0]['evidencia']
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stderr);
});

test('base CSV: parseo con BOM, tipos, Historias excluidas y "1,0 mil"',()=>{
 const codigo=`
import sys
sys.path.insert(0, 'scripts/preprod')
from measure import leer_base_csv
posts = leer_base_csv('tests/preprod/fixtures/medicion/base.csv')
# 5 de 7 filas: la sin enlace se descarta y la Historia no es feed.
assert len(posts) == 5, len(posts)
assert [p['tipo'] for p in posts] == ['reel', 'foto', 'carrusel', 'reel', 'reel']
assert [p['reacciones'] for p in posts] == [100, 200, 300, 1000, 200]
assert [p['visualizaciones'] for p in posts] == [1000, 2000, 3000, 5000, 2000]
assert all(p['fuente'] == 'csv' for p in posts)
assert posts[0]['publicado'].isoformat() == '2026-10-01'
try:
    leer_base_csv('tests/preprod/fixtures/medicion/no-existe.csv')
    raise AssertionError('debió fallar')
except SystemExit as e:
    assert 'no existe' in str(e)
`;
 const r=runPy(codigo);
 assert.equal(r.status,0,r.stderr);
});

test('config: perfil desconocido y fichero ausente fallan con mensaje',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r1=runMeasure(['measure','--profile','noexiste','--config',CONFIG,
  '--date',FECHA,'--out',out,'--facebook-cli',s.fb,
  '--instagram-cli',s.ig,'--no-digest']);
 assert.notEqual(r1.status,0,'perfil desconocido debe fallar');
 assert.match(r1.stderr+r1.stdout,/no hay un perfil/);
 const r2=runMeasure(['measure','--config','/tmp/no-existe-config.json',
  '--date',FECHA,'--out',out,'--facebook-cli',s.fb,
  '--instagram-cli',s.ig,'--no-digest']);
 assert.notEqual(r2.status,0,'config ausente debe fallar');
 assert.match(r2.stderr+r2.stdout,/no existe el fichero de perfiles/);
});

test('Facebook vía URLs: mediana 350, destacado 3.0x, bloqueo de Páginas',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','facebook','--date',FECHA,'--out',out,
  '--fb-urls',FB_URLS,'--facebook-cli',s.fb,'--instagram-cli',s.ig,
  '--no-digest']);
 assert.equal(r.status,0,r.stderr);
 const {md,js}=leerInforme(out);
 assert.equal(js.plataformas.length,1);
 const fb=js.plataformas[0];
 assert.equal(fb.plataforma,'Facebook');
 assert.equal(fb.senial,'reacciones');
 assert.equal(fb.mediana,350);
 assert.equal(fb.n_base,6);
 assert.equal(fb.n_ventana,3);
 assert.equal(fb.mediana_fiable,true);
 assert.equal(fb.medianas_tipo.reel.mediana,200);
 assert.equal(fb.medianas_tipo.carrusel.mediana,500);
 assert.equal(fb.top[0].multiplicador,3.0);
 assert.equal(fb.top[0].clasificacion,'destacado');
 assert.equal(fb.bottom[0].multiplicador,0.29);
 assert.equal(fb.bottom[0].clasificacion,'flojo');
 // El post de otra Página (9999) no entra en la medición.
 assert.ok(!JSON.stringify(fb.ventana).includes('otra pagina'));
 assert.ok(js.fallos.some(f=>f.error.includes('otra Página')));
 // El bloqueo de la vía de Páginas queda registrado.
 assert.ok(js.bloqueos.some(b=>b.plataforma==='Facebook'
  && b.via==='pages' && b.error.includes('0 Páginas')));
 // Hallazgos: tipos (2.5x) + top destacado.
 assert.ok(js.hallazgos.some(h=>h.texto.includes('2.5x')));
 assert.ok(js.hallazgos.some(h=>h.texto.includes('mil cincuenta')));
 assert.ok(md.includes('Hallazgos para FORMATOS.md'));
 assert.ok(md.includes('Mediana: 350 reacciones'));
 assert.ok(md.includes('Vía: lectura pública por URL'));
});

test('Facebook vía URLs + CSV: la base crece y el duplicado no se repite',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','facebook','--date',FECHA,'--out',out,
  '--fb-urls',FB_URLS,'--fb-base-csv',BASE_CSV,'--facebook-cli',s.fb,
  '--instagram-cli',s.ig,'--no-digest']);
 assert.equal(r.status,0,r.stderr);
 const {js}=leerInforme(out);
 const fb=js.plataformas[0];
 // 6 vivos + 3 nuevos del CSV: la fila con la misma URL se descarta
 // por URL y la fila con la misma fecha+título (otra URL) por
 // deduplicación de contenido.
 assert.equal(fb.n_base,9);
 assert.equal(fb.mediana,300);
 assert.equal(fb.medianas_tipo.carrusel.mediana,450);
 assert.ok(!('foto' in fb.medianas_tipo)); // n=1 < 3
});

test('Facebook vía Páginas: interacciones, seguidores, CSV no mezclado',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','facebook','--date',FECHA,'--out',out,
  '--fb-urls',FB_URLS,'--fb-base-csv',BASE_CSV,'--facebook-cli',s.fb,
  '--instagram-cli',s.ig,'--no-digest'],
  {STUB_FB_PAGES:'found'});
 assert.equal(r.status,0,r.stderr);
 const {js}=leerInforme(out);
 const fb=js.plataformas[0];
 assert.equal(fb.senial,'interacciones');
 assert.equal(fb.seguidores,5000);
 assert.equal(fb.mediana,200);
 assert.equal(fb.n_base,3); // el CSV no se mezcla (otra señal)
 assert.equal(fb.top[0].multiplicador,3.0);
 assert.equal(fb.bottom[0].multiplicador,0.25);
 assert.ok(fb.via.startsWith('pages posts list'));
 assert.equal(js.bloqueos.length,0);
});

test('Instagram público: likes, filtro de colaboraciones, bloqueo de insights',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','instagram','--date',FECHA,'--out',out,
  '--facebook-cli',s.fb,'--instagram-cli',s.ig,
  '--instagram-account-id','9001','--no-digest']);
 assert.equal(r.status,0,r.stderr);
 const {md,js}=leerInforme(out);
 const ig=js.plataformas[0];
 assert.equal(ig.plataforma,'Instagram');
 assert.equal(ig.senial,'likes');
 assert.equal(ig.seguidores,1000);
 assert.equal(ig.mediana,20);
 assert.equal(ig.n_base,3);
 assert.equal(ig.n_ventana,2);
 assert.equal(ig.top[0].multiplicador,4.5);
 assert.equal(ig.top[0].clasificacion,'destacado');
 assert.equal(ig.bottom[0].multiplicador,0.25);
 // La colaboración de otra autora (9999 likes) no entra.
 assert.ok(!JSON.stringify(ig.ventana).includes('otra autora'));
 assert.ok(!JSON.stringify(ig.ventana).includes('9999'));
 // Sin --instagram-owned-id, el bloqueo queda registrado.
 assert.ok(js.bloqueos.some(b=>b.plataforma==='Instagram'
  && b.via==='owned-insights' && b.error.includes('no intentado')));
 assert.ok(md.includes('Mediana: 20 likes'));
});

test('Instagram insights propios bloqueados: media_not_found con precisión',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','instagram','--date',FECHA,'--out',out,
  '--facebook-cli',s.fb,'--instagram-cli',s.ig,
  '--instagram-account-id','9001','--instagram-owned-id','9002',
  '--no-digest']);
 assert.equal(r.status,0,r.stderr);
 const {js}=leerInforme(out);
 const bloqueo=js.bloqueos.find(b=>b.plataforma==='Instagram'
  && b.via==='owned-insights');
 assert.ok(bloqueo,'falta el bloqueo de owned-insights');
 assert.ok(bloqueo.error.includes('media_not_found'),bloqueo.error);
 assert.ok(bloqueo.que_falta.includes('código nuevo'));
 // La medición pública sigue funcionando pese al bloqueo.
 assert.equal(js.plataformas[0].mediana,20);
});

test('Instagram insights propios disponibles: Views enriquece la ventana',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','instagram','--date',FECHA,'--out',out,
  '--facebook-cli',s.fb,'--instagram-cli',s.ig,
  '--instagram-account-id','9001','--instagram-owned-id','9002',
  '--no-digest'],
  {STUB_IG_INSIGHTS:'ok'});
 assert.equal(r.status,0,r.stderr);
 const {js}=leerInforme(out);
 assert.equal(js.bloqueos.length,0);
 const ventana=js.plataformas[0].ventana;
 assert.ok(ventana.every(p=>p.visualizaciones===5000),JSON.stringify(ventana));
 assert.ok(ventana.every(p=>p.alcance===3000));
 // La señal sigue siendo likes (comparabilidad con la base).
 assert.equal(js.plataformas[0].senial,'likes');
});

test('rate limit en Facebook: informe parcial con Instagram, sin reintentos',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','all','--date',FECHA,'--out',out,
  '--fb-urls',FB_URLS,'--facebook-cli',s.fb,'--instagram-cli',s.ig,
  '--instagram-account-id','9001','--no-digest'],
  {STUB_FB_RATE_LIMIT:'urls'});
 assert.equal(r.status,0,r.stderr);
 const {js}=leerInforme(out);
 assert.equal(js.plataformas.length,1);
 assert.equal(js.plataformas[0].plataforma,'Instagram');
 assert.ok(js.bloqueos.some(b=>b.plataforma==='Facebook'
  && b.error.includes('rate limit')));
});

test('garantía de no-edición (estático): measure.py no menciona edición ni la ejecuta',()=>{
 const codigo=readFileSync(SCRIPT,'utf8');
 for(const token of ['render-chunks','project.mjs','master.py','qa-media',
  'remotion','ffmpeg','subprocess','os.system','os.exec','Popen',
  'check_output']){
  assert.ok(!codigo.includes(token),`measure.py menciona ${token}`);
 }
 const sinComentarios=codigo.split('\n')
  .filter(l=>!l.trim().startsWith('#')).join('\n');
 assert.ok(!/render/i.test(sinComentarios),
  'la palabra render aparece fuera de un comentario');
 // Las CLIs pasan por ejecutar_cli de outliers.py (único subprocess).
 assert.ok(codigo.includes('from outliers import'),
  'measure.py no reutiliza outliers.py');
 assert.ok(codigo.includes('ejecutar_cli'),
  'measure.py no usa ejecutar_cli');
 // Nunca abre FORMATOS.md para escribir: las únicas escrituras son
 // el informe .md/.json en el directorio de salida.
 for(const linea of codigo.split('\n')){
  if(linea.includes('open(') && linea.includes('"w"')){
   assert.ok(!linea.includes('FORMATOS'),
    'una escritura menciona FORMATOS.md');
  }
 }
});

test('garantía de no-edición (ejecución): una corrida no toca FORMATOS.md ni research',()=>{
 const out=tmpOut();
 const s=stubs(out);
 const antesFormatos=hashArchivo(FORMATOS);
 const antesResearch=listarArchivos(RESEARCH);
 const r=runMeasure(['measure','--profile','prueba','--config',CONFIG,
  '--platform','all','--date',FECHA,'--out',out,
  '--fb-urls',FB_URLS,'--fb-base-csv',BASE_CSV,'--facebook-cli',s.fb,
  '--instagram-cli',s.ig,'--instagram-account-id','9001','--no-digest']);
 assert.equal(r.status,0,r.stderr);
 assert.ok(existsSync(path.join(out,`medicion-${FECHA}.md`)));
 assert.ok(existsSync(path.join(out,`medicion-${FECHA}.json`)));
 assert.equal(hashArchivo(FORMATOS),antesFormatos,
  'FORMATOS.md cambió durante la medición');
 assert.deepEqual(listarArchivos(RESEARCH),antesResearch,
  'la corrida escribió en preprod/research pese a --out');
});
