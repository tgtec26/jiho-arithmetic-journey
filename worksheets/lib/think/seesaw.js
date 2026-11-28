// 시소 놀이터(태블릿 전용) 무게 추론. 인형은 0..n-1 번호, 순서는 무거운 것부터.
// 숨은 무게는 처음에 정하지 않는다. 지금까지 잰 결과와 맞는 순서를 모두 들고 다니며,
// 잴 때마다 답이 가장 늦게 정해지는 쪽 결과를 고른다(운으로 일찍 끝나지 않게).

/** 단계별 판 설정: top = 가장 무거운 것, order = 무거운 순서 전부 */
export const SEESAW_STAGES = {
	1: [{ n: 3, goal: 'top' }],
	2: [{ n: 4, goal: 'top' }],
	3: [{ n: 3, goal: 'order' }],
	4: [{ n: 4, goal: 'order' }],
	5: [
		{ n: 5, goal: 'top' },
		{ n: 4, goal: 'order' }
	]
};

/** 0..n-1의 모든 순서 (사전 순) */
export function orders(n) {
	const go = (rest) => (rest.length ? rest.flatMap((x, i) => go([...rest.slice(0, i), ...rest.slice(i + 1)]).map((t) => [x, ...t])) : [[]]);
	return go([...Array(n).keys()]);
}

/** heavy가 light보다 무거운 순서만 */
export function keep(list, heavy, light) {
	return list.filter((o) => o.indexOf(heavy) < o.indexOf(light));
}

export function answerKey(order, goal) {
	return goal === 'top' ? String(order[0]) : order.join(',');
}

const keyCount = (list, goal) => new Set(list.map((o) => answerKey(o, goal))).size;

/** 남은 순서들의 답이 모두 같으면 확정 */
export function isDecided(list, goal) {
	return keyCount(list, goal) === 1;
}

/** 가장 무거운 것은 n-1번, 순서는 ⌈log₂ n!⌉번이면 늘 충분하고 그보다 적으면 안 되는 경우가 있다 */
export function maxWeighings(n, goal) {
	if (goal === 'top') return n - 1;
	let f = 1;
	for (let k = 2; k <= n; k++) f *= k;
	return Math.ceil(Math.log2(f));
}

/** (남는 답 가짓수, 남는 순서 수) */
const score = (list, goal) => [keyCount(list, goal), list.length];
const compare = (x, y) => x[0] - y[0] || x[1] - y[1];

/** a와 b를 재면 무거운 쪽: 답을 더 늦게 정하는 쪽, 같으면 bias(숨은 순서)를 따름 */
export function weighResult(list, a, b, goal, bias) {
	const A = keep(list, a, b);
	const B = keep(list, b, a);
	if (!B.length) return a;
	if (!A.length) return b;
	const c = compare(score(A, goal), score(B, goal));
	if (c) return c > 0 ? a : b;
	return bias.indexOf(a) < bias.indexOf(b) ? a : b;
}

/** 힌트: 나쁜 쪽 결과에서 남는 (답 가짓수, 순서 수)가 가장 작은 쌍. 확정이면 null */
export function bestPair(list, goal) {
	if (isDecided(list, goal)) return null;
	const n = list[0].length;
	let best = null;
	let bestWorst = null;
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			const a = score(keep(list, i, j), goal);
			const b = score(keep(list, j, i), goal);
			const worst = compare(a, b) >= 0 ? a : b;
			if (!best || compare(worst, bestWorst) < 0) {
				best = [i, j];
				bestWorst = worst;
			}
		}
	}
	return best;
}
