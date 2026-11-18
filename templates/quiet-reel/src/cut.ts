// PLACEHOLDER — lo sobrescribe scripts/editing/assemble-cut.py (--ts-out
// o --project) con el corte real (EDL + captions remapeados + lower-thirds).
// No editar a mano: regenerar desde la selección del papel.
// Sin imports: CutCaption es idéntico en estructura a HubCaption
// (shared/captions/types.ts) para que cut.ts sea autocontenido.
export type CutCaption = {text: string; startMs: number; endMs: number; timestampMs: number | null; confidence: number | null; pageBreakAfter?: boolean; kw?: boolean};
export type CutLowerThird = {atFrame: number; frames: number; title: string; subtitle: string};
export type CutEdlSegment = {order: number; paper_ids: number[]; src_start: number; src_end: number; out_start: number; out_end: number; transition_in: string};
export type CutEdl = {version: number; source: string; paper: string | null; xfade: number; fps: number; width: number; height: number; segments: CutEdlSegment[]; duration: number; rough_cut: string};
export type Cut = {fps: number; roughCutFile: string; roughCutFrames: number; stingFrames: number; totalFrames: number; karaoke: boolean; captions: CutCaption[]; lowerThirds: CutLowerThird[]; edl: CutEdl};

export const CUT: Cut = {
	fps: 30,
	roughCutFile: 'video/rough-cut.mp4',
	roughCutFrames: 900,
	stingFrames: 91,
	totalFrames: 991,
	karaoke: false,
	captions: [],
	lowerThirds: [],
	edl: {
		version: 1,
		source: '',
		paper: null,
		xfade: 0,
		fps: 30,
		width: 1080,
		height: 1920,
		segments: [],
		duration: 30,
		rough_cut: '',
	},
};
