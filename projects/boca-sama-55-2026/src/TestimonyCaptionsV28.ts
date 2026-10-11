import type {Caption} from './Editorial';
/** V45 timing refinement for archival witness candidate subtitles.
 * WORDING STILL UNVERIFIED; all verified:false, never render in public.
 * Derived from Spanish Whisper.cpp token timing + stored original audio trims.
 * Nancy V40 video/audio source starts at 49.080s (global frame 720).
 * Carlos source starts at 203.633333s (global frame 1020).
 * Times are draft cue boundaries, NOT certified transcript alignment.
 * No subtitle background, two lines max after editorial approval.
 */
export const testimonyCaptionDraftV28:Caption[]=[
 // Nancy: ASR token window 49.110-52.000, then 52.000-55.000s original.
 {from:721,to:808,words:'Sufro mucho todavía por eso.',verified:false},
 {from:808,to:900,words:'Porque nunca he tenido felicidad.',verified:false},
 // Carlos: ASR token windows 203.970-204.860 / 204.860-206.560 /
 // 206.560-209.070 / 209.070-211.880. Tokens can split words.
 {from:1030,to:1058,words:'Desde el suelo, pues,',verified:false},
 {from:1058,to:1110,words:'continué combatiendo,',verified:false},
 {from:1110,to:1183,words:'sin percatarme que los compañeros',verified:false},
 {from:1183,to:1268,words:'que andaban conmigo habían sido asesinados.',verified:false},
];
