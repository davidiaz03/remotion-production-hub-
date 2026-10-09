import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib.mjs';
import {validateProject} from './validate.mjs';
const p=path.join(ROOT,'projects/che-v42'),data=JSON.parse(readFileSync(path.join(p,'V42_ASSET_MANIFEST.json'),'utf8'));
const cfg=JSON.parse(readFileSync(path.join(p,'project.json'),'utf8'));
const code=readFileSync(path.join(p,'src/Video.tsx'),'utf8');
const segments=data.segments;
if(segments.length!==28||data.frames!==2418||data.fps!==30)throw Error('V42 segment metadata mismatch');
if(segments[0].start!==0||segments.at(-1).end!==data.frames)throw Error('V42 timeline bounds mismatch');
for(let i=0;i<segments.length;i++){
 const s=segments[i];if(s.end<=s.start||i&&s.start!==segments[i-1].end)throw Error('V42 non-contiguous segment '+s.name);
 if(!code.includes(s.asset))throw Error('V42 code missing '+s.asset);
}
const intl=segments.find(s=>s.name==='international');
if(intl.end-intl.start!==58)throw Error('International segment no longer 58');
if(!code.includes("single_watermark_crisp.png")||!code.includes('FINAL_AUDIO_MASTER_V26.wav'))throw Error('V42 watermarks/audio paths changed');
console.log(JSON.stringify({status:'STATIC_COMPATIBILITY_PASS_ONLY',project:validateProject('che-v42'),timelineSegments:segments.length,internationalismFrames:intl.end-intl.start,cues:data.cue_count,rendered:false}));
