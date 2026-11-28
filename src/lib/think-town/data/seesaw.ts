// 시소 놀이터 장난감(크기가 같아 겉모습으로 무게를 알 수 없음)과 단계별 판 목록.
import { SEESAW_STAGES, type Goal } from '$think/seesaw.js';

export const TOYS = ['rabbit', 'duck', 'frog', 'penguin', 'pig'];

export type SeesawPuzzle = { goal: Goal; cast: string[] };

function combos(list: string[], k: number): string[][] {
	if (k === 0) return [[]];
	return list.flatMap((x, i) => combos(list.slice(i + 1), k - 1).map((rest) => [x, ...rest]));
}

/** 단계마다 그 단계 설정 × 장난감 조합(사전 순). 설정이 둘이면 번갈아 */
export const SEESAW_POOLS: SeesawPuzzle[][] = [1, 2, 3, 4, 5].map((stage) => {
	const lists = SEESAW_STAGES[stage].map(({ n, goal }) => combos(TOYS, n).map((cast) => ({ goal, cast })));
	const len = Math.max(...lists.map((l) => l.length));
	return Array.from({ length: len }, (_, k) => lists.map((l) => l[k % l.length])).flat();
});
