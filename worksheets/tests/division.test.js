import { describe, expect, it } from 'vitest';
import { DIVISORS, analyzeDiv, checkDivProblem, divSortKey, pickDivPractice } from '../lib/division.js';
import { stageOf } from '../lib/numbers.js';
import { DIV_EPISODE_TABLE } from './fixtures/division-table.js';

const lessKey = (x, y) => x[0] < y[0] || (x[0] === y[0] && (x[1] < y[1] || (x[1] === y[1] && x[2] < y[2])));

describe('analyzeDiv', () => {
	it('splits 48 ÷ 3 into 30 + 18 with a bring-down', () => {
		expect(analyzeDiv(48, 3)).toEqual({
			quotient: 16, remainder: 0, tensQ: 1, onesQ: 6,
			firstPart: 30, secondPart: 18, tensProduct: 3, onesProduct: 18, carry: true
		});
	});

	it('handles no bring-down, quotient ones 0 and remainders', () => {
		expect(analyzeDiv(26, 2)).toMatchObject({ firstPart: 20, secondPart: 6, carry: false, quotient: 13 });
		expect(analyzeDiv(62, 3)).toMatchObject({
			quotient: 20, remainder: 2, onesQ: 0, firstPart: 60, secondPart: 2, onesProduct: 0, carry: false
		});
		expect(analyzeDiv(50, 3)).toMatchObject({ firstPart: 30, secondPart: 20, quotient: 16, remainder: 2 });
		expect(analyzeDiv(96, 8)).toMatchObject({ firstPart: 80, secondPart: 16, quotient: 12 });
	});
});

describe('checkDivProblem', () => {
	it('rejects what each stage does not allow', () => {
		expect(checkDivProblem(1, 37, 3, 2).length).toBeGreaterThan(0); // 나머지
		expect(checkDivProblem(1, 26, 6, 2).length).toBeGreaterThan(0); // 나누는 수 범위 밖
		expect(checkDivProblem(1, 18, 2, 2).length).toBeGreaterThan(0); // 몫 한 자리
		expect(checkDivProblem(2, 60, 3, 2).length).toBeGreaterThan(0); // 몫 일의 자리 0
		expect(checkDivProblem(1, 52, 4, 3).length).toBeGreaterThan(0); // 1단계 내림은 ⑤부터
	});

	it('accepts what each stage allows', () => {
		expect(checkDivProblem(1, 52, 4, 5)).toEqual([]);
		expect(checkDivProblem(3, 62, 3, 4)).toEqual([]);
		expect(checkDivProblem(3, 85, 8, 1)).toEqual([]);
	});
});

describe('division episode table', () => {
	it('uses 8 and 9 in exactly one episode each, all divisors in stage ranges', () => {
		expect(DIV_EPISODE_TABLE.filter(([, d]) => d === 8)).toHaveLength(1);
		expect(DIV_EPISODE_TABLE.filter(([, d]) => d === 9)).toHaveLength(1);
		for (const [id, d] of DIV_EPISODE_TABLE) expect(DIVISORS[stageOf(id)]).toContain(d);
	});

	it.each(DIV_EPISODE_TABLE)('episode %i: story ÷ %i (%i) and practice obey stage rules', (id, d, n) => {
		const stage = stageOf(id);
		expect(checkDivProblem(stage, n, d, 1)).toEqual([]);
		const practice = pickDivPractice(d, n, stage, id);
		expect(practice).toHaveLength(7);
		expect(new Set(practice).size).toBe(7);
		expect(practice).not.toContain(n);
		practice.forEach((m, i) => expect(checkDivProblem(stage, m, d, i + 2)).toEqual([]));
		const keys = practice.map((m) => divSortKey(m, d));
		for (let i = 1; i < keys.length; i++) expect(lessKey(keys[i - 1], keys[i])).toBe(true);

		const carries = practice.map((m) => analyzeDiv(m, d).carry);
		if (stage === 1 && d !== 4) expect(carries).toEqual([false, false, false, false, false, true, true]);
		if (stage === 3) {
			expect(practice.some((m) => m % d > 0)).toBe(true);
			expect(practice.some((m) => analyzeDiv(m, d).onesQ === 0)).toBe(true);
		}
	});

	it('avoids numbers an earlier episode with the same divisor already used', () => {
		const ep7 = [52, ...pickDivPractice(4, 52, 2, 7)];
		const ep13 = pickDivPractice(4, 96, 2, 13, ep7);
		expect(ep13.filter((n) => ep7.includes(n)).length).toBeLessThanOrEqual(3);
		ep13.forEach((m, i) => expect(checkDivProblem(2, m, 4, i + 2)).toEqual([]));
		const keys = ep13.map((m) => divSortKey(m, 4));
		for (let i = 1; i < keys.length; i++) expect(lessKey(keys[i - 1], keys[i])).toBe(true);
	});

	it('gives episodes with the same divisor different practice sets', () => {
		const seen = new Map();
		for (const [id, d, n] of DIV_EPISODE_TABLE) {
			const key = `${d}:${pickDivPractice(d, n, stageOf(id), id).join(',')}`;
			expect(seen.has(key), `${id}회와 ${seen.get(key)}회 연습 문제가 같음`).toBe(false);
			seen.set(key, id);
		}
	});
});
