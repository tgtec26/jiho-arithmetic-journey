// 시소 놀이터: 둘을 재고 기록하기, 시상대 판정(답이 확정됐을 때만), 힌트. 모두 새 값을 돌려준다.
import { answerKey, bestPair, isDecided, keep, maxWeighings, orders, weighResult, type Goal } from '$think/seesaw.js';

export type Weigh = { heavy: number; light: number };
export type Seesaw = { n: number; goal: Goal; max: number; bias: number[]; list: number[][]; results: Weigh[] };

export function startSeesaw(n: number, goal: Goal, bias: number[]): Seesaw {
	return { n, goal, max: maxWeighings(n, goal), bias, list: orders(n), results: [] };
}

/** a와 b를 잰다. 이미 잰 쌍이면 같은 결과, 횟수 그대로(s 그대로) */
export function weigh(s: Seesaw, a: number, b: number): { s: Seesaw; heavy: number; repeat: boolean } {
	const old = s.results.find((r) => (r.heavy === a && r.light === b) || (r.heavy === b && r.light === a));
	if (old) return { s, heavy: old.heavy, repeat: true };
	const heavy = weighResult(s.list, a, b, s.goal, s.bias);
	const light = heavy === a ? b : a;
	return { s: { ...s, list: keep(s.list, heavy, light), results: [...s.results, { heavy, light }] }, heavy, repeat: false };
}

export const podiumSlots = (s: Seesaw) => (s.goal === 'top' ? 1 : s.n);

/** podium = 무거운 것부터. 잰 결과로 답이 정해지지 않았으면 맞게 올려도 unsure */
export function checkPodium(s: Seesaw, podium: number[]): 'unsure' | 'wrong' | 'right' {
	if (!isDecided(s.list, s.goal)) return 'unsure';
	return answerKey(podium, s.goal) === answerKey(s.list[0], s.goal) ? 'right' : 'wrong';
}

export const seesawHint = (s: Seesaw) => bestPair(s.list, s.goal);
