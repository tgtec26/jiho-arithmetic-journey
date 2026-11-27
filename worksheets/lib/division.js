// 두 자리 수 ÷ 한 자리 수 학습지의 숫자 규칙.
// 쪼개기: n = firstPart + secondPart. firstPart는 십의 자리에서 나누어지는 만큼(나누는 수 × 몫의 십의 자리 × 10),
// secondPart는 세로식에서 "빼고 내려 쓴 수"와 같다.
export const DIVISORS = { 1: [2, 3, 4], 2: [2, 3, 4, 5], 3: [3, 4, 5, 6, 7, 8, 9] };

/** @param {number} n 나누어지는 수 @param {number} d 나누는 수 */
export function analyzeDiv(n, d) {
	const tens = Math.floor(n / 10);
	const tensQ = Math.floor(tens / d);
	const tensProduct = d * tensQ;
	const firstPart = tensProduct * 10;
	const secondPart = n - firstPart;
	const onesQ = Math.floor(secondPart / d);
	return {
		quotient: tensQ * 10 + onesQ,
		remainder: secondPart - d * onesQ,
		tensQ,
		onesQ,
		firstPart,
		secondPart,
		tensProduct,
		onesProduct: d * onesQ,
		carry: tens - tensProduct > 0
	};
}

/** 쉬운 것 → 어려운 것: 내림 없음 → 내림 → 나머지, 같으면 작은 수부터 */
export function divSortKey(n, d) {
	const r = analyzeDiv(n, d);
	return [r.remainder > 0 ? 1 : 0, r.carry ? 1 : 0, n];
}

/** 같은 나누는 수 d로 나누는 두 수를 쉬운 순서로 비교 (Array.sort용) */
export function divCompare(d) {
	return (x, y) => {
		const a = divSortKey(x, d);
		const b = divSortKey(y, d);
		return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
	};
}

/**
 * @param {1|2|3} stage
 * @param {number} position 1 = 이야기 문제, 2~8 = 변형 문제
 * @returns {string[]} 위반 메시지(빈 배열 = 통과)
 */
export function checkDivProblem(stage, n, d, position) {
	const label = `${n}÷${d} (${position}번)`;
	const errors = [];
	if (!Number.isInteger(n) || n < 10 || n > 99) errors.push(`${label}: ${n}은 두 자리 수가 아님`);
	if (!DIVISORS[stage].includes(d)) errors.push(`${label}: 나누는 수는 ${DIVISORS[stage].join('·')} 중 하나`);
	if (errors.length) return errors;
	if (Math.floor(n / 10) < d) return [`${label}: 몫이 한 자리`];

	const r = analyzeDiv(n, d);
	if (stage < 3) {
		if (r.remainder > 0) errors.push(`${label}: 나머지는 15회부터`);
		if (r.onesQ === 0) errors.push(`${label}: 몫의 일의 자리 0은 15회부터`);
	}
	if (stage === 1 && r.carry && position < 5) errors.push(`${label}: 1~6회 내림 문제는 ⑤번부터`);
	return errors;
}

/** 정렬된 목록에서 k개를 고르게 띄엄띄엄. phase(0~1)를 바꾸면 고르는 자리가 밀린다. */
function spreadShift(list, k, phase) {
	if (k <= 0) return [];
	if (list.length <= k) return list.slice();
	return Array.from({ length: k }, (_, i) => list[Math.floor(((i + phase) * list.length) / k)]);
}

/**
 * 나누는 수에 짝지을 변형 문제 7개 (②~⑧ 순서)
 * @param {number} seed 회차 번호: 같은 나누는 수를 쓰는 회차끼리 다른 문제가 나오게 한다
 * @param {number[]} avoid 같은 나누는 수를 쓰는 다른 회차가 이미 쓴 수(여러 번 쓴 수는 여러 번): 덜 쓴 수부터 고른다
 */
export function pickDivPractice(d, storyN, stage, seed = 0, avoid = []) {
	const byKey = divCompare(d);
	const candidates = [];
	for (let n = 10 * d; n <= 99; n++) {
		if (n !== storyN && checkDivProblem(stage, n, d, 8).length === 0) candidates.push(n);
	}
	candidates.sort(byKey);
	const info = (n) => analyzeDiv(n, d);
	// [후보 묶음, 개수]: 묶음마다 정한 개수만큼 고르고, 모자라면 남은 후보에서 채운다
	const quotas =
		stage === 1
			? [[candidates.filter((n) => !info(n).carry), 5], [candidates.filter((n) => info(n).carry), 2]]
			: stage === 2
				? [[candidates.filter((n) => !info(n).carry), 2], [candidates.filter((n) => info(n).carry), 5]]
				: [
						[candidates.filter((n) => info(n).onesQ === 0), 1],
						[candidates.filter((n) => info(n).onesQ > 0 && info(n).remainder === 0), 2],
						[candidates.filter((n) => info(n).onesQ > 0 && info(n).remainder > 0), 4]
					];
	const phase = (seed * 0.618034) % 1;
	// 안 쓴 수부터, 그다음 덜 쓴 수부터 고른다
	const uses = (n) => avoid.filter((a) => a === n).length;
	const take = (list, k) => {
		const got = [];
		const levels = [...new Set(list.map(uses))].sort((a, b) => a - b);
		for (const level of levels) {
			const group = list.filter((n) => uses(n) === level);
			got.push(...spreadShift(group, Math.min(k - got.length, group.length), phase));
		}
		return got;
	};
	const picks = quotas.flatMap(([list, k]) => take(list, k));
	const rest = candidates.filter((n) => !picks.includes(n));
	picks.push(...take(rest, 7 - picks.length));
	return picks.sort(byKey);
}
