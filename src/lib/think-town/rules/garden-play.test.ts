import { describe, it, expect } from 'vitest';
import { conflicts, gardenHint, gardenSolution, isGardenSolved, parseGarden, plant } from './garden-play';

const G = ['●★▲.', '■▲★●', '.■.★', '★●■.']; // 학습지 판, 답 하나

describe('garden-play', () => {
	it('처음 꽃은 고정, 빈칸만 바뀐다', () => {
		const { cells, fixed } = parseGarden(G);
		expect(fixed[0][0]).toBe(true);
		expect(fixed[0][3]).toBe(false);
		expect(plant(cells, fixed, 0, 0, '■')).toBe(cells);
		const a = plant(cells, fixed, 0, 3, '■');
		expect(a[0][3]).toBe('■');
		expect(cells[0][3]).toBe('.');
		expect(plant(a, fixed, 0, 3, '■')[0][3]).toBe('.'); // 같은 꽃 다시 = 뽑기
		expect(plant(a, fixed, 0, 3, '●')[0][3]).toBe('●'); // 다른 꽃 = 바꿔 심기
	});
	it('같은 줄·칸·네모에 겹친 꽃 둘 다 빨강, 뽑으면 사라짐', () => {
		const { cells, fixed } = parseGarden(G);
		const bad = plant(cells, fixed, 0, 3, '●'); // 0줄·3칸·네모에 ● 둘
		const k = conflicts(bad);
		expect(k[0][0]).toBe(true);
		expect(k[0][3]).toBe(true);
		expect(k[1][3]).toBe(true);
		expect(k[2][1]).toBe(false);
		expect(conflicts(plant(bad, fixed, 0, 3, '●')).flat().some(Boolean)).toBe(false);
	});
	it('다 맞게 심으면 풀림', () => {
		const sol = gardenSolution(G);
		expect(isGardenSolved(sol)).toBe(true);
		expect(isGardenSolved(parseGarden(G).cells)).toBe(false);
	});
	it('힌트: 잘못 심은 칸 먼저, 없으면 후보가 가장 적은 빈칸', () => {
		const { cells, fixed } = parseGarden(G);
		const sol = gardenSolution(G);
		const wrong = plant(cells, fixed, 2, 0, sol[2][0] === '▲' ? '●' : '▲');
		expect(gardenHint(wrong, sol)).toEqual({ r: 2, c: 0, shape: sol[2][0] });
		const h = gardenHint(cells, sol)!;
		expect(h.shape).toBe(sol[h.r][h.c]);
		expect(cells[h.r][h.c]).toBe('.');
		expect(gardenHint(sol, sol)).toBeNull();
	});
});
