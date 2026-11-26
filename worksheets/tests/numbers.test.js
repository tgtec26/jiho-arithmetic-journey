import { describe, expect, it } from 'vitest';
import {
	analyze,
	checkProblem,
	countAddCarries,
	digits,
	hintLevel,
	isHardFact,
	pickPractice,
	stageOf
} from '../lib/numbers.js';

// 회차 표: [id, 고정 수, 이야기 다른 수]
export const EPISODE_TABLE = [
	[1, 16, 11], [2, 12, 14], [3, 13, 15], [4, 14, 12], [5, 15, 12], [6, 18, 13],
	[7, 17, 12], [8, 14, 16], [9, 25, 12], [10, 21, 13], [11, 23, 17], [12, 27, 14],
	[13, 26, 15], [14, 29, 12], [15, 32, 28], [16, 24, 35], [17, 48, 26], [18, 46, 18],
	[19, 38, 27], [20, 15, 88], [21, 45, 23], [22, 37, 19], [23, 18, 42], [24, 27, 36]
];

describe('numbers', () => {
	it('digits / countAddCarries', () => {
		expect(digits(16)).toEqual({ tens: 1, ones: 6 });
		expect(countAddCarries(48, 160)).toBe(1);
		expect(countAddCarries(999, 1)).toBe(3);
	});

	it('analyze', () => {
		expect(analyze(16, 11)).toMatchObject({ answer: 176, onesRow: 16, tensRow: 160, carries: 0, hardFacts: 0 });
		expect(analyze(16, 11).cells.map((c) => c.value)).toEqual([10, 6, 100, 60]);
		expect(analyze(16, 11).cells.map((c) => c.rowPart)).toEqual([1, 1, 10, 10]);
		expect(analyze(16, 11).cells.map((c) => c.colPart)).toEqual([10, 6, 10, 6]);
		expect(analyze(16, 13)).toMatchObject({ onesRow: 48, tensRow: 160, carries: 1 });
		expect(analyze(16, 17)).toMatchObject({ carries: 1, hardFacts: 1 });
		expect(analyze(48, 26)).toMatchObject({ answer: 1248, carries: 2, hardFacts: 1 });
		expect(analyze(15, 88)).toMatchObject({ answer: 1320, tensRow: 1200 });
	});

	it('isHardFact / stageOf / hintLevel', () => {
		expect([isHardFact(6, 7), isHardFact(9, 9), isHardFact(6, 6), isHardFact(3, 7), isHardFact(7, 5)]).toEqual([
			true, true, false, false, false
		]);
		expect([stageOf(6), stageOf(7), stageOf(14), stageOf(15)]).toEqual([1, 2, 2, 3]);
		expect([hintLevel(6), hintLevel(7), hintLevel(20), hintLevel(21)]).toEqual([1, 2, 3, 4]);
	});

	it('checkProblem', () => {
		expect(checkProblem(1, 16, 17, 2).length).toBeGreaterThan(0); // 6×7
		expect(checkProblem(1, 16, 40, 2).length).toBeGreaterThan(0); // 끝자리 0
		expect(checkProblem(2, 16, 17, 3).length).toBeGreaterThan(0); // 어려운 곱은 ⑤부터
		expect(checkProblem(2, 16, 17, 6)).toEqual([]);
		expect(checkProblem(1, 16, 11, 1)).toEqual([]);
	});

	it.each(EPISODE_TABLE)('episode %i: story %i × %i and practice obey stage rules', (id, fixed, other) => {
		const stage = stageOf(id);
		expect(checkProblem(stage, fixed, other, 1)).toEqual([]);
		const practice = pickPractice(fixed, other, stage);
		expect(practice).toHaveLength(7);
		expect(new Set(practice).size).toBe(7);
		expect(practice).not.toContain(other);
		practice.forEach((b, i) => expect(checkProblem(stage, fixed, b, i + 2)).toEqual([]));
		const keys = practice.map((b) => {
			const r = analyze(fixed, b);
			return [r.hardFacts, r.carries, b];
		});
		for (let i = 1; i < keys.length; i++) {
			const [h0, c0, b0] = keys[i - 1];
			const [h1, c1, b1] = keys[i];
			expect(h0 < h1 || (h0 === h1 && (c0 < c1 || (c0 === c1 && b0 < b1)))).toBe(true);
		}
	});
});
