// 블록 공방 조작 규칙: 칸마다 0~3층 쌓기·빼기, 설계도와 비교, 가장 적은 블록, 힌트.
// 높이 지도는 학습지와 같다: 줄 0 = 맨 뒤, 마지막 줄 = 맨 앞, 칸 = 왼쪽→오른쪽.
import { blockCount, frontView, parseHeights, sideView, topView, viewAnswers } from '$think/blocks.js';

export const MAX_H = 3;
export type Heights = number[][];
export type Blueprint = {
	rows: number;
	cols: number;
	/** 단계 1·2: 위에서 본 모양 + 칸마다 층수(답 하나) */
	numbers: boolean;
	target: Heights;
	top: boolean[][];
	front: number[];
	side: number[];
};

export function blueprintOf(heights: string[], stage: number): Blueprint {
	const target = parseHeights(heights);
	return {
		rows: target.length,
		cols: target[0].length,
		numbers: stage <= 2,
		target,
		top: topView(target),
		front: frontView(target),
		side: sideView(target)
	};
}

export const emptyBuild = (bp: Blueprint): Heights => bp.target.map((row) => row.map(() => 0));

function setCell(b: Heights, r: number, c: number, v: number): Heights {
	if (v < 0 || v > MAX_H) return b;
	return b.map((row, rr) => (rr === r ? row.map((x, cc) => (cc === c ? v : x)) : row));
}

export const addBlock = (b: Heights, r: number, c: number) => setCell(b, r, c, b[r][c] + 1);
export const removeBlock = (b: Heights, r: number, c: number) => setCell(b, r, c, b[r][c] - 1);

const same = <T>(a: T[], b: T[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function checkBuild(b: Heights, bp: Blueprint) {
	if (bp.numbers) {
		const wrong: [number, number][] = [];
		b.forEach((row, r) => row.forEach((v, c) => v !== bp.target[r][c] && wrong.push([r, c])));
		const ok = wrong.length === 0;
		return { top: ok, front: ok, side: ok, wrong };
	}
	const top = topView(b).every((row, r) => same(row, bp.top[r]));
	return { top, front: same(frontView(b), bp.front), side: same(sideView(b), bp.side), wrong: [] as [number, number][] };
}

export function isBuilt(b: Heights, bp: Blueprint) {
	const r = checkBuild(b, bp);
	return r.top && r.front && r.side;
}

export const blockAnswers = (bp: Blueprint): Heights[] => (bp.numbers ? [bp.target] : viewAnswers(bp.top, bp.front, bp.side, MAX_H));

export const minBlocks = (bp: Blueprint) => Math.min(...blockAnswers(bp).map(blockCount));

/** 지금 쌓은 것과 가장 가까운 정답(다른 칸 수 → 블록 수)에서 처음 다른 칸. 이미 맞으면 null */
export function blockHint(b: Heights, bp: Blueprint): { r: number; c: number; h: number } | null {
	if (isBuilt(b, bp)) return null;
	const diff = (a: Heights) => a.flat().filter((v, i) => v !== b.flat()[i]).length;
	const best = blockAnswers(bp)
		.map((a) => ({ a, d: diff(a), n: blockCount(a) }))
		.sort((x, y) => x.d - y.d || x.n - y.n)[0].a;
	for (let r = 0; r < bp.rows; r++) for (let c = 0; c < bp.cols; c++) if (best[r][c] !== b[r][c]) return { r, c, h: best[r][c] };
	return null;
}
