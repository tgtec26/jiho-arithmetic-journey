import { describe, it, expect } from 'vitest';
import P from './puzzles.json';
import { checkParkingPuzzle } from '$think/parking.js';
import { lineupSolutions, sudokuSolutions, SUDOKU_BLANKS, type Lineup } from '$think/logic.js';
import { BLOCK_RANGES, blockCount, frontView, parseHeights, sideView, topView, viewAnswers } from '$think/blocks.js';
import { LINEUP_CAST_BY_STAGE } from './cast';

const episodes = import.meta.glob('/worksheets/data/think/ep*.json', { eager: true, import: 'default' }) as Record<
	string,
	{ activity: string; puzzles: { board?: string[]; heights?: string[]; kind?: string; grid?: string[] }[] }
>;
const worksheetBoards = Object.values(episodes)
	.filter((e) => e.activity === 'parking')
	.flatMap((e) => e.puzzles.map((p) => p.board!.join('/')));
const worksheetHeights = Object.values(episodes)
	.filter((e) => e.activity === 'blocks')
	.flatMap((e) => e.puzzles.map((p) => p.heights!.join('/')));
const worksheetGrids = Object.values(episodes).flatMap((e) => e.puzzles.filter((p) => p.kind === 'sudoku').map((p) => p.grid!.join('/')));

describe('미리 만든 퍼즐', () => {
	it('단계마다 개수', () => {
		expect(P.parking.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
		expect(P.lineup.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
	});
	it('블록·정원도 단계마다 개수', () => {
		expect(P.blocks.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
		expect(P.garden.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
	});
	it('블록: 라운드 블록 수 범위, 0~3층, 단계 3~5는 답이 둘 이상', () => {
		P.blocks.forEach((pool, s) =>
			pool.forEach((p) => {
				expect(p.heights.every((row) => /^[0-3]+$/.test(row))).toBe(true);
				const h = parseHeights(p.heights);
				const [lo, hi] = BLOCK_RANGES[s + 1];
				expect(blockCount(h)).toBeGreaterThanOrEqual(lo);
				expect(blockCount(h)).toBeLessThanOrEqual(hi);
				if (s >= 2) expect(viewAnswers(topView(h), frontView(h), sideView(h)).length).toBeGreaterThan(1);
			})
		);
	});
	it('정원: 답 하나, 빈칸 수는 라운드 범위', () => {
		P.garden.forEach((pool, s) =>
			pool.forEach((p) => {
				expect(sudokuSolutions(p.grid)).toHaveLength(1);
				const blanks = p.grid.join('').split('').filter((ch) => ch === '.').length;
				const [lo, hi] = SUDOKU_BLANKS[s + 1];
				expect(blanks).toBeGreaterThanOrEqual(lo);
				expect(blanks).toBeLessThanOrEqual(hi);
			})
		);
	});
	it('주차장: 학습지 검사기로 라운드 범위·최소 횟수가 맞다', () => {
		P.parking.forEach((pool, s) => pool.forEach((p) => expect(checkParkingPuzzle(p, s + 1)).toEqual([])));
	});
	it('줄 세우기: 답이 하나, 등장인물은 그 단계 명단', () => {
		P.lineup.forEach((pool, s) =>
			pool.forEach((p) => {
				expect(lineupSolutions(p as Lineup)).toHaveLength(1);
				expect([...p.items].sort()).toEqual([...LINEUP_CAST_BY_STAGE[s]].sort());
			})
		);
	});
	it('겹치는 퍼즐 없음 (앱 안, 학습지와)', () => {
		expect(worksheetBoards.length).toBeGreaterThan(0);
		const boards = P.parking.flat().map((p) => p.board.join('/'));
		expect(new Set(boards).size).toBe(boards.length);
		for (const b of worksheetBoards) expect(boards).not.toContain(b);
		const lines = P.lineup.flat().map((p) => JSON.stringify(p.clues));
		expect(new Set(lines).size).toBe(lines.length);
		expect(worksheetHeights.length).toBeGreaterThan(0);
		const heights = P.blocks.flat().map((p) => p.heights.join('/'));
		expect(new Set(heights).size).toBe(heights.length);
		for (const h of worksheetHeights) expect(heights).not.toContain(h);
		expect(worksheetGrids.length).toBeGreaterThan(0);
		const grids = P.garden.flat().map((p) => p.grid.join('/'));
		expect(new Set(grids).size).toBe(grids.length);
		for (const g of worksheetGrids) expect(grids).not.toContain(g);
	});
});
