import { describe, expect, it } from 'vitest';
import { makeRng } from '../lib/think/common.js';
import { checkLogicPuzzle, clueText, generateLineup, generateSudoku, lineupSolutions, sudokuSolutions } from '../lib/think/logic.js';
import { logicAnswer, renderLineupProblem, renderSudokuProblem } from '../lib/think/render-logic.js';

const count = (html, needle) => html.split(needle).length - 1;
const ok = { kind: 'lineup', items: ['지호', '아빠', '감돌이'], clues: [{ type: 'first', a: '아빠' }, { type: 'behind', a: '아빠', b: '감돌이' }] };
const sud = { kind: 'sudoku', grid: ['.▲■★', '■.●▲', '▲●.■', '★■▲.'] }; // 답 ●▲■★ / ■★●▲ / ▲●★■ / ★■▲●

describe('clueText', () => {
	it('writes each clue as a Korean sentence with the right particles', () => {
		expect(clueText({ type: 'first', a: '트럭' })).toBe('트럭은 맨 앞이에요.');
		expect(clueText({ type: 'last', a: '감돌이' })).toBe('감돌이는 맨 뒤예요.');
		expect(clueText({ type: 'behind', a: '아빠', b: '감돌이' })).toBe('아빠 바로 뒤에 감돌이가 있어요.');
		expect(clueText({ type: 'before', a: '지호', b: '사랑이' })).toBe('지호는 사랑이보다 앞에 있어요.');
		expect(clueText({ type: 'middle', a: '버스' })).toBe('버스는 한가운데예요.');
		expect(clueText({ type: 'apart', a: '지호', b: '곰' })).toBe('지호와 곰은 붙어 있지 않아요.');
	});
});

describe('line-up puzzles', () => {
	it('finds the only order that fits the clues', () => {
		expect(lineupSolutions(ok)).toEqual([['아빠', '감돌이', '지호']]);
		expect(checkLogicPuzzle(ok, 1, 1)).toEqual([]);
	});

	it('rejects clues with more than one answer, the wrong slot and clues the round does not use', () => {
		const two = { ...ok, clues: [{ type: 'first', a: '아빠' }, { type: 'before', a: '아빠', b: '감돌이' }] };
		expect(checkLogicPuzzle(two, 1, 1).join(' ')).toContain('답이 하나');
		expect(checkLogicPuzzle(ok, 1, 2).length).toBeGreaterThan(0); // ②는 스도쿠 자리
		const apart = { kind: 'lineup', items: ['지호', '아빠', '감돌이', '사랑이'], clues: [{ type: 'first', a: '아빠' }, { type: 'apart', a: '지호', b: '아빠' }, { type: 'last', a: '지호' }] };
		expect(checkLogicPuzzle(apart, 3, 3).join(' ')).toContain('apart');
		expect(checkLogicPuzzle({ ...ok, clues: [{ type: 'first', a: '사랑이' }, ok.clues[1]] }, 1, 1).length).toBeGreaterThan(0);
	});

	it('generates unique line-ups within the round range', () => {
		for (const [round, names] of [[1, ['지호', '아빠', '감돌이']], [4, ['지호', '아빠', '감돌이', '사랑이']], [6, ['지호', '아빠', '감돌이', '사랑이', '손님']]]) {
			const g = generateLineup(makeRng(round), round, names);
			expect(checkLogicPuzzle(g, round, 3), `round ${round}`).toEqual([]);
		}
	});
});

describe('shape sudoku', () => {
	it('solves and checks blanks by round', () => {
		expect(sudokuSolutions(sud.grid)).toEqual([['●▲■★', '■★●▲', '▲●★■', '★■▲●']]);
		expect(checkLogicPuzzle(sud, 1, 2)).toEqual([]); // 빈칸 4
		expect(checkLogicPuzzle(sud, 3, 6).length).toBeGreaterThan(0); // 라운드 3은 6~7
		expect(checkLogicPuzzle({ kind: 'sudoku', grid: ['●●..', '....', '....', '....'] }, 6, 6).length).toBeGreaterThan(0);
	});

	it('generates unique sudokus for every round', () => {
		for (const round of [1, 2, 3, 4, 5, 6]) {
			const g = generateSudoku(makeRng(round + 10), round);
			expect(checkLogicPuzzle(g, round, 8), `round ${round}`).toEqual([]);
		}
	});
});

describe('logic drawing', () => {
	it('shows clues, one slot per name and a gray hint only early', () => {
		const lu = renderLineupProblem({ puzzle: ok, position: 1, round: 1 });
		expect(lu).toContain('problem think-problem lineup story');
		expect(lu).toContain('아빠 바로 뒤에 감돌이가 있어요.');
		expect(count(lu, 'class="slot')).toBe(3);
		expect(lu).toContain('<span class="hint">감돌이</span>');
		expect(lu).toContain('앞');
		expect(renderLineupProblem({ puzzle: ok, position: 1, round: 3 })).not.toContain('class="hint"');
	});

	it('draws a 4×4 sudoku with the givens', () => {
		const sd = renderSudokuProblem({ puzzle: sud, position: 2 });
		expect(sd).toContain('problem think-problem sudoku');
		expect(count(sd, '<td')).toBe(16);
		expect(count(sd, '●')).toBeGreaterThanOrEqual(3);
	});

	it('answers with the order or the filled grid', () => {
		expect(logicAnswer(ok)).toBe('아빠 → 감돌이 → 지호');
		expect(logicAnswer(sud)).toContain('★');
	});
});
