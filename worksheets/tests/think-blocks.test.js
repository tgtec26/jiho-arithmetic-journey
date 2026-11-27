import { describe, expect, it } from 'vitest';
import { makeRng } from '../lib/think/common.js';
import {
	blockCount,
	checkBlocksPuzzle,
	frontView,
	generateBlocks,
	hiddenTops,
	parseHeights,
	sideView,
	topView
} from '../lib/think/blocks.js';
import { blocksAnswer, renderBlocksProblem, renderIsoBlocks } from '../lib/think/render-blocks.js';

const count = (html, needle) => html.split(needle).length - 1;
const h = parseHeights(['21', '10']); // 뒤 줄 [2,1], 앞 줄 [1,0]

describe('views of a stack map (first row = back, last row = front)', () => {
	it('counts blocks and sees them from the top, front and right side', () => {
		expect(h).toEqual([[2, 1], [1, 0]]);
		expect(blockCount(h)).toBe(4);
		expect(frontView(h)).toEqual([2, 1]);
		expect(sideView(h)).toEqual([1, 2]); // 오른쪽에서 보면 왼쪽이 앞 줄
		expect(topView(h)).toEqual([[true, true], [true, false]]);
	});
});

describe('hiddenTops', () => {
	it('finds a stack whose top is hidden behind a tall front-right stack', () => {
		expect(hiddenTops(h)).toEqual([]);
		expect(hiddenTops(parseHeights(['10', '03']))).toEqual([[0, 0]]);
	});
});

describe('phantom towers', () => {
	it('rejects a drawing where a tower in an empty cell would be completely hidden', () => {
		// 뒤 줄 [0,1], 앞 줄 [1,2]: 뒤 왼쪽 빈칸에 1층 탑을 놓으면 앞 오른쪽 2층 블록에 가려 보이지 않는다
		expect(checkBlocksPuzzle({ heights: ['01', '12'], ask: ['count'] }, 1).join(' ')).toContain('숨');
		expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['count'] }, 1)).toEqual([]);
	});
});

describe('checkBlocksPuzzle', () => {
	it('accepts a round-1 puzzle and rejects what the round does not allow', () => {
		expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['count'] }, 1)).toEqual([]);
		expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['side'] }, 1).length).toBeGreaterThan(0);
		expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['count', 'top', 'front'] }, 2).length).toBeGreaterThan(0);
		expect(checkBlocksPuzzle({ heights: ['33', '33'], ask: ['count'] }, 1).length).toBeGreaterThan(0); // 12개 > 5
		expect(checkBlocksPuzzle({ heights: ['10', '03'], ask: ['count'] }, 1).join(' ')).toContain('보이지');
		expect(checkBlocksPuzzle({ heights: ['21', '00'], ask: ['count'] }, 1).length).toBeGreaterThan(0); // 빈 줄
		expect(checkBlocksPuzzle({ heights: ['211', '110', '100'], ask: ['count'] }, 1).length).toBeGreaterThan(0); // 라운드 1은 바닥 6칸까지
	});
});

describe('generateBlocks', () => {
	it('makes a valid puzzle for the round, the same one for the same seed', () => {
		for (const round of [1, 2, 3, 4, 5, 6]) {
			const g = generateBlocks(makeRng(round), round);
			expect(checkBlocksPuzzle(g, round), `round ${round}`).toEqual([]);
		}
		expect(generateBlocks(makeRng(3), 4)).toEqual(generateBlocks(makeRng(3), 4));
	});
});

describe('blocks drawing', () => {
	it('draws one cube per block', () => {
		expect(count(renderIsoBlocks(h), 'class="cube"')).toBe(4);
		expect(count(renderIsoBlocks(parseHeights(['321', '210', '100'])), 'class="cube"')).toBe(10);
	});

	it('asks with always-3×3 grids, floor lines only early, and front/side labels', () => {
		const r1 = renderBlocksProblem({ puzzle: { heights: ['21', '10'], ask: ['count', 'top'] }, position: 2, round: 1 });
		expect(r1).toContain('problem think-problem blocks');
		expect(r1).toContain('1층');
		expect(r1).toContain('>앞<');
		expect(r1).toContain('>옆<');
		expect(count(r1, '<td')).toBe(9);
		expect(renderBlocksProblem({ puzzle: { heights: ['21', '10'], ask: ['count'] }, position: 2, round: 3 })).not.toContain('1층');
		expect(renderBlocksProblem({ puzzle: { heights: ['21', '10'], ask: ['count'] }, position: 1, round: 1 })).toContain('⭐');
	});

	it('answers with the count and the asked shapes', () => {
		const a = blocksAnswer({ heights: ['21', '10'], ask: ['count', 'front'] });
		expect(a).toContain('4개');
		expect(count(a, 'class="on"')).toBe(3); // 앞에서 본 모양: 2 + 1칸
	});
});
