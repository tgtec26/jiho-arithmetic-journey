// 장소 한 번 하기: 이야기 3컷 → 판 n개 → 대화 카드 → 피날레.

export type Phase = 'story' | 'board' | 'talk' | 'finale';
export type Run = { phase: Phase; panel: number; board: number; boards: number; solved: boolean[]; stars: number; talkStar: boolean };

export const PANELS = 3;

export function startRun(boards: number): Run {
	return { phase: 'story', panel: 0, board: 0, boards, solved: new Array(boards).fill(false), stars: 0, talkStar: false };
}

export function nextPanel(run: Run): Run {
	if (run.phase !== 'story') return run;
	return run.panel + 1 < PANELS ? { ...run, panel: run.panel + 1 } : { ...run, phase: 'board' };
}

/** 지금 판을 풀었다. 이미 푼 판이면 별 0 */
export function solve(run: Run, bonus: boolean): { run: Run; gained: number } {
	if (run.phase !== 'board' || run.solved[run.board]) return { run, gained: 0 };
	const gained = bonus ? 2 : 1;
	const solved = run.solved.map((s, i) => (i === run.board ? true : s));
	return { run: { ...run, solved, stars: run.stars + gained }, gained };
}

export function nextBoard(run: Run): Run {
	if (run.phase !== 'board' || !run.solved[run.board]) return run;
	return run.board + 1 < run.boards ? { ...run, board: run.board + 1 } : { ...run, phase: 'talk' };
}

export function giveTalkStar(run: Run): { run: Run; gained: number } {
	if (run.phase !== 'talk' || run.talkStar) return { run, gained: 0 };
	return { run: { ...run, talkStar: true, stars: run.stars + 1 }, gained: 1 };
}

export function finish(run: Run): Run {
	return run.phase === 'talk' ? { ...run, phase: 'finale' } : run;
}
