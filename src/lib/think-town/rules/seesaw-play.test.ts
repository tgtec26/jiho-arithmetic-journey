import { describe, it, expect } from 'vitest';
import { SEESAW_STAGES } from '$think/seesaw.js';
import { checkPodium, podiumSlots, seesawHint, startSeesaw, weigh } from './seesaw-play';
import { SEESAW_POOLS, TOYS } from '../data/seesaw';
import { BOARDS_PER_STAGE } from './progress';

describe('시소 놀이터', () => {
	it('처음: 최대 횟수, 결과 없음', () => {
		const s = startSeesaw(4, 'order', [0, 1, 2, 3]);
		expect(s.max).toBe(5);
		expect(s.results).toEqual([]);
		expect(s.list).toHaveLength(24);
	});
	it('같은 쌍 다시 재면 횟수 그대로·같은 결과', () => {
		const r1 = weigh(startSeesaw(3, 'top', [0, 1, 2]), 0, 1);
		expect(r1.repeat).toBe(false);
		expect(r1.heavy).toBe(0);
		expect(r1.s.results).toEqual([{ heavy: 0, light: 1 }]);
		const r2 = weigh(r1.s, 1, 0);
		expect(r2.repeat).toBe(true);
		expect(r2.heavy).toBe(0);
		expect(r2.s).toBe(r1.s);
	});
	it('이미 알 수 있는 쌍도 재면 횟수가 늘고 결과는 앞뒤가 맞음', () => {
		let s = startSeesaw(3, 'order', [2, 1, 0]);
		s = weigh(s, 0, 1).s;
		s = weigh(s, 1, 2).s;
		const [first, second] = s.results;
		if (first.light === second.heavy) {
			// a>b, b>c 이면 a>c 로만 나와야 한다
			const r = weigh(s, first.heavy, second.light);
			expect(r.heavy).toBe(first.heavy);
			expect(r.s.results).toHaveLength(3);
		}
		expect(s.list.length).toBeGreaterThan(0);
	});
	it('시상대: 확정 전 unsure, 확정 뒤 맞으면 right·틀리면 wrong', () => {
		let s = startSeesaw(3, 'top', [0, 1, 2]);
		expect(checkPodium(s, [0])).toBe('unsure');
		s = weigh(s, 0, 1).s;
		s = weigh(s, 0, 2).s;
		expect(checkPodium(s, [0])).toBe('right');
		expect(checkPodium(s, [2])).toBe('wrong');
		expect(podiumSlots(s)).toBe(1);
		expect(podiumSlots(startSeesaw(4, 'order', [0, 1, 2, 3]))).toBe(4);
	});
	it('순서 시상대: 확정된 순서와 같아야 right', () => {
		let s = startSeesaw(3, 'order', [0, 1, 2]);
		s = weigh(s, 0, 1).s; // 0>1 (같으면 bias)
		s = weigh(s, 1, 2).s; // 2>1 (순서가 둘 남는 쪽)
		expect(checkPodium(s, [0, 2, 1])).toBe('unsure');
		s = weigh(s, 0, 2).s; // 0>2 (같으면 bias)
		expect(s.list).toEqual([[0, 2, 1]]);
		expect(checkPodium(s, [0, 2, 1])).toBe('right');
		expect(checkPodium(s, [0, 1, 2])).toBe('wrong');
	});
	it('힌트: 확정 전에는 쌍, 확정 뒤 null', () => {
		let s = startSeesaw(3, 'top', [0, 1, 2]);
		expect(seesawHint(s)).toEqual([0, 1]);
		s = weigh(s, 0, 1).s;
		s = weigh(s, 0, 2).s;
		expect(seesawHint(s)).toBeNull();
	});
	it('판 목록: 단계 설정과 같고 장난감이 겹치지 않음', () => {
		expect(TOYS).toHaveLength(5);
		expect(SEESAW_POOLS).toHaveLength(5);
		SEESAW_POOLS.forEach((pool, i) => {
			expect(pool.length).toBeGreaterThanOrEqual(BOARDS_PER_STAGE[i]);
			pool.forEach((p) => {
				expect(new Set(p.cast).size).toBe(p.cast.length);
				p.cast.forEach((t) => expect(TOYS).toContain(t));
				expect(SEESAW_STAGES[i + 1]).toContainEqual({ n: p.cast.length, goal: p.goal });
			});
		});
		// 단계 5는 두 설정을 번갈아
		expect(SEESAW_POOLS[4].slice(0, 2).map((p) => p.goal)).toEqual(['top', 'order']);
	});
});
