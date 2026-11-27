import { describe, expect, it } from 'vitest';
import { makeRng } from '../lib/think/common.js';
import { boardErrors, checkParkingPuzzle, formatMoves, generateParking, parseBoard, solveParking } from '../lib/think/parking.js';
import { CELL_MM, parkingAnswer, renderParkingBoard, renderParkingProblem, renderPiecesSheet } from '../lib/think/render-parking.js';

const open = ['......', '......', 'RR....', '......', '......', '......'];
const one = ['......', '......', 'RR.A..', '...A..', '......', '......'];
const count = (html, needle) => html.split(needle).length - 1;

describe('parseBoard', () => {
	it('reads each vehicle with its length and direction', () => {
		expect(parseBoard(one)).toEqual([
			{ id: 'A', row: 2, col: 3, len: 2, horizontal: false },
			{ id: 'R', row: 2, col: 0, len: 2, horizontal: true }
		]);
	});
});

describe('solveParking', () => {
	it('slides the red car straight out in one move', () => {
		expect(solveParking(open)).toEqual({ minMoves: 1, moves: [{ id: 'R', dir: 'right', dist: 4 }] });
	});

	it('moves a blocking car first', () => {
		expect(solveParking(one).minMoves).toBe(2);
	});

	it('finds no way out when a horizontal truck blocks the exit row', () => {
		expect(solveParking(['......', '......', 'RR.BBB', '......', '......', '......'])).toBeNull();
	});
});

describe('boardErrors', () => {
	it('rejects a vertical red car, a bent car, a red car off the exit row and a short board', () => {
		expect(boardErrors(['R.....', 'R.....', '......', '......', '......', '......']).length).toBeGreaterThan(0);
		expect(boardErrors(['......', '..AA..', '..A...', 'RR....', '......', '......']).length).toBeGreaterThan(0);
		expect(boardErrors(open.slice(0, 5)).length).toBeGreaterThan(0);
		expect(boardErrors(['......', '......', '....RR', '......', '......', '......']).length).toBeGreaterThan(0); // 이미 출구
		expect(boardErrors(one)).toEqual([]);
	});
});

describe('checkParkingPuzzle', () => {
	it('checks the written fewest moves and the round range', () => {
		expect(checkParkingPuzzle({ board: one, minMoves: 2 }, 1)).toEqual([]);
		expect(checkParkingPuzzle({ board: one, minMoves: 3 }, 1).join(' ')).toContain('가장 적게');
		expect(checkParkingPuzzle({ board: open, minMoves: 1 }, 3).length).toBeGreaterThan(0); // 라운드 3은 3~6
	});
});

it('formats moves for the answer key', () => {
	expect(formatMoves([{ id: 'B', dir: 'up', dist: 1 }, { id: 'R', dir: 'right', dist: 4 }])).toBe('B↑1, R→4');
});

describe('generateParking', () => {
	it('makes a valid puzzle in range, the same one for the same seed', () => {
		const g = generateParking(makeRng(1), [3, 6]);
		expect(boardErrors(g.board)).toEqual([]);
		expect(solveParking(g.board).minMoves).toBe(g.minMoves);
		expect(g.minMoves).toBeGreaterThanOrEqual(3);
		expect(g.minMoves).toBeLessThanOrEqual(6);
		expect(generateParking(makeRng(1), [3, 6])).toEqual(g);
	});

	it('can make round-6 puzzles and avoids boards it is told to', () => {
		const hard = generateParking(makeRng(2), [6, 11]);
		expect(hard.minMoves).toBeGreaterThanOrEqual(6);
		expect(hard.minMoves).toBeLessThanOrEqual(11);
		const again = generateParking(makeRng(2), [6, 11], new Set([hard.board.join('/')]));
		expect(again.board).not.toEqual(hard.board);
	}, 30000);
});

describe('parking drawing', () => {
	it('draws the board cells and the cut-out pieces from the same cell size', () => {
		expect(renderParkingBoard(one)).toContain(`width="${6 * CELL_MM}mm"`);
		expect(renderParkingBoard(one)).toContain('car red');
		const eps = [
			{ activity: 'parking', puzzles: [{ board: one, minMoves: 2 }, { board: ['......', '......', 'RR.B..', 'CCCB..', '......', '......'], minMoves: 2 }] },
			{ activity: 'blocks', puzzles: [{ heights: ['1'], ask: ['count'] }] }
		];
		const sheet = renderPiecesSheet(eps);
		expect(count(sheet, `width="${2 * CELL_MM}mm"`)).toBe(2 + 1 + 2); // 빨간 차 2 + (가장 많이 쓴 2칸 차 1 + 2)
		expect(count(sheet, `width="${3 * CELL_MM}mm"`)).toBe(1 + 2);
		expect(sheet).toContain('page pieces think-set');
	});

	it('shows the fewest moves and a gray first-move arrow only early on the story puzzle', () => {
		const box1 = renderParkingProblem({ puzzle: { board: one, minMoves: 2 }, position: 1, round: 1 });
		expect(box1).toContain('problem think-problem parking story');
		expect(box1).toContain('가장 적게: 2번');
		expect(box1).toContain('hint-arrow');
		expect(box1).toContain('⭐');
		expect(renderParkingProblem({ puzzle: { board: one, minMoves: 2 }, position: 1, round: 3 })).not.toContain('hint-arrow');
		expect(renderParkingProblem({ puzzle: { board: one, minMoves: 2 }, position: 2, round: 1 })).not.toContain('hint-arrow');
	});

	it('writes the fewest moves and the steps in the answer key', () => {
		expect(parkingAnswer({ board: one, minMoves: 2 })).toMatch(/^2번: A[↑↓]\d, R→4$/);
	});
});
