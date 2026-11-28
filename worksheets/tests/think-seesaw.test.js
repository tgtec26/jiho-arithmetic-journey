import { describe, expect, it } from 'vitest';
import { makeRng } from '../lib/think/common.js';
import { SEESAW_STAGES, answerKey, bestPair, isDecided, keep, maxWeighings, orders, weighResult } from '../lib/think/seesaw.js';

const ids = (n) => [...Array(n).keys()];

describe('시소 무게 추론', () => {
	it('순서 목록·거르기·최대 횟수', () => {
		expect(orders(3)).toHaveLength(6);
		expect(orders(4)).toHaveLength(24);
		expect(orders(3)[0]).toEqual([0, 1, 2]);
		const l = keep(orders(3), 0, 1);
		expect(l).toHaveLength(3);
		expect(l.every((o) => o.indexOf(0) < o.indexOf(1))).toBe(true);
		expect([maxWeighings(3, 'top'), maxWeighings(4, 'top'), maxWeighings(5, 'top')]).toEqual([2, 3, 4]);
		expect([maxWeighings(3, 'order'), maxWeighings(4, 'order')]).toEqual([3, 5]);
	});
	it('답 열쇠와 확정 판정', () => {
		expect(answerKey([2, 0, 1], 'top')).toBe('2');
		expect(answerKey([2, 0, 1], 'order')).toBe('2,0,1');
		const l = keep(keep(orders(3), 0, 1), 0, 2);
		expect(isDecided(l, 'top')).toBe(true);
		expect(isDecided(l, 'order')).toBe(false);
		expect(isDecided(keep(l, 1, 2), 'order')).toBe(true);
	});
	it('결과: 답을 늦게 정하는 쪽, 같으면 bias, 이미 정해진 쌍은 그대로', () => {
		expect(weighResult(orders(3), 0, 1, 'top', [1, 0, 2])).toBe(1);
		expect(weighResult(orders(3), 0, 1, 'top', [0, 1, 2])).toBe(0);
		// 0>1 뒤 0 vs 2: 어느 쪽이든 후보 하나, 순서가 둘 남는 0 쪽
		expect(weighResult(keep(orders(3), 0, 1), 0, 2, 'top', [2, 0, 1])).toBe(0);
		// 0>1, 1>2 이면 0>2 (bias가 반대여도)
		expect(weighResult(keep(keep(orders(3), 0, 1), 1, 2), 2, 0, 'order', [2, 1, 0])).toBe(0);
	});
	it('아무 쌍이나 무작위로 재도 모순 없음 (200판)', () => {
		const rng = makeRng(7);
		for (let k = 0; k < 200; k++) {
			const n = 3 + (k % 3);
			const goal = k % 2 ? 'top' : 'order';
			const bias = ids(n).sort(() => rng() - 0.5);
			let list = orders(n);
			let count = 0;
			while (!isDecided(list, goal)) {
				const a = Math.floor(rng() * n);
				const b = (a + 1 + Math.floor(rng() * (n - 1))) % n;
				const h = weighResult(list, a, b, goal, bias);
				expect([a, b]).toContain(h);
				list = keep(list, h, h === a ? b : a);
				expect(list.length).toBeGreaterThan(0);
				count++;
				expect(count).toBeLessThan(60);
			}
		}
	});
	it('힌트대로 재면 최대 횟수 안에 끝남', () => {
		for (const [n, goal] of [[3, 'top'], [4, 'top'], [5, 'top'], [3, 'order'], [4, 'order']]) {
			for (const bias of [ids(n), ids(n).reverse(), [1, 0, ...ids(n).slice(2)]]) {
				let list = orders(n);
				let count = 0;
				while (!isDecided(list, goal)) {
					const [a, b] = bestPair(list, goal);
					const h = weighResult(list, a, b, goal, bias);
					list = keep(list, h, h === a ? b : a);
					count++;
				}
				expect(count, `${n} ${goal}`).toBeLessThanOrEqual(maxWeighings(n, goal));
			}
		}
	});
	it('힌트 쌍', () => {
		expect(bestPair(orders(3), 'top')).toEqual([0, 1]);
		expect(bestPair(keep(orders(3), 0, 1), 'top')).toEqual([0, 2]);
		expect(bestPair(keep(keep(orders(3), 0, 1), 0, 2), 'top')).toBeNull();
	});
	it('단계 설정', () => {
		expect(SEESAW_STAGES[1]).toEqual([{ n: 3, goal: 'top' }]);
		expect(SEESAW_STAGES[4]).toEqual([{ n: 4, goal: 'order' }]);
		expect(SEESAW_STAGES[5]).toEqual([
			{ n: 5, goal: 'top' },
			{ n: 4, goal: 'order' }
		]);
	});
});
