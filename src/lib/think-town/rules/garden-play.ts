// 사랑이 정원 조작 규칙: 4×4 모양 스도쿠에 꽃 심기·뽑기, 겹침, 힌트.
// 칸 글자는 학습지와 같다: '.' = 빈칸, SHAPES(●▲■★) = 꽃.
import { SHAPES, sudokuSolutions } from '$think/logic.js';

export type Garden = string[][];

export function parseGarden(grid: string[]) {
	const cells = grid.map((row) => [...row]);
	return { cells, fixed: cells.map((row) => row.map((ch) => ch !== '.')) };
}

/** 처음 꽃이면 그대로, 같은 꽃이면 뽑기, 아니면 그 꽃을 심음 */
export function plant(cells: Garden, fixed: boolean[][], r: number, c: number, shape: string): Garden {
	if (fixed[r][c]) return cells;
	const next = cells[r][c] === shape ? '.' : shape;
	return cells.map((row, rr) => (rr === r ? row.map((ch, cc) => (cc === c ? next : ch)) : row));
}

const boxOf = (r: number, c: number) => Math.floor(r / 2) * 2 + Math.floor(c / 2);
const peers = (r: number, c: number, r2: number, c2: number) => (r !== r2 || c !== c2) && (r === r2 || c === c2 || boxOf(r, c) === boxOf(r2, c2));

/** 같은 줄·칸·네모에 같은 꽃이 또 있는 칸 */
export function conflicts(cells: Garden): boolean[][] {
	return cells.map((row, r) =>
		row.map((ch, c) => ch !== '.' && cells.some((row2, r2) => row2.some((ch2, c2) => ch2 === ch && peers(r, c, r2, c2))))
	);
}

export const isGardenSolved = (cells: Garden) => cells.every((row) => row.every((ch) => ch !== '.')) && !conflicts(cells).flat().some(Boolean);

export const gardenSolution = (grid: string[]): Garden => sudokuSolutions(grid, 1)[0].map((row) => [...row]);

/** 잘못 심은 칸이 있으면 그 칸, 없으면 후보가 가장 적은 빈칸(동점이면 줄→칸 순). 다 맞으면 null */
export function gardenHint(cells: Garden, solution: Garden): { r: number; c: number; shape: string } | null {
	const at = (r: number, c: number) => ({ r, c, shape: solution[r][c] });
	for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (cells[r][c] !== '.' && cells[r][c] !== solution[r][c]) return at(r, c);
	let best: { r: number; c: number; n: number } | null = null;
	for (let r = 0; r < 4; r++) {
		for (let c = 0; c < 4; c++) {
			if (cells[r][c] !== '.') continue;
			const n = SHAPES.filter((s) => !cells.some((row2, r2) => row2.some((ch2, c2) => ch2 === s && peers(r, c, r2, c2)))).length;
			if (!best || n < best.n) best = { r, c, n };
		}
	}
	return best && at(best.r, best.c);
}
