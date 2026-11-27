// 경우의 수: 빠짐없이 늘어놓고 세기. 답은 코드가 직접 늘어놓아 센다(공식 없음).
// 퍼즐 종류: pairs(윗옷 × 아랫도리), order(순서 있게 늘어놓기), choose(순서 없이 2개), paths(격자 가장 짧은 길).

/** 라운드별 답 한도 */
export const COUNT_LIMITS = { 1: 6, 2: 6, 3: 10, 4: 10, 5: 12, 6: 12 };

const ALL = ['pairs', 'order', 'choose', 'paths'];
export const KINDS_BY_ROUND = { 1: ['pairs', 'order'], 2: ['pairs', 'order'], 3: ALL, 4: ALL, 5: ALL, 6: ALL };

function permutations(list, k) {
	if (k === 0) return [[]];
	return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)], k - 1).map((rest) => [x, ...rest]));
}

function combinations(list, k) {
	if (k === 0) return [[]];
	return list.flatMap((x, i) => combinations(list.slice(i + 1), k - 1).map((rest) => [x, ...rest]));
}

/** 'R'(오른쪽) w개, 'U'(위) h개로 된 모든 길 */
function paths(w, h) {
	if (w === 0 && h === 0) return [[]];
	return [
		...(w > 0 ? paths(w - 1, h).map((p) => ['R', ...p]) : []),
		...(h > 0 ? paths(w, h - 1).map((p) => ['U', ...p]) : [])
	];
}

/** @returns {string[][]} 모든 경우 */
export function listCases(p) {
	const names = (items) => items.map((it) => it.name);
	if (p.kind === 'pairs') return names(p.left).flatMap((l) => names(p.right).map((r) => [l, r]));
	if (p.kind === 'order') return permutations(names(p.items), p.pick);
	if (p.kind === 'choose') return combinations(names(p.items), p.pick);
	if (p.kind === 'paths') return paths(p.w, p.h);
	throw new Error(`없는 경우의 수 종류: ${p.kind}`);
}

export function countingAnswer(p) {
	return listCases(p).length;
}

/**
 * 늘어놓을 빈칸 수: 앞 라운드는 답만큼(빠짐없이 채우기), 가운데는 답보다 많이(답이 새지 않게), 끝은 없음.
 * pairs는 선을 그어 짝 지으므로 빈칸 없음. paths는 격자가 있어야 길을 그리므로 끝에도 답 + 2.
 */
export function slotsFor(p, round) {
	if (p.kind === 'pairs') return 0;
	const n = countingAnswer(p);
	if (round <= 2) return n;
	if (round <= 4) return n + 2 + (n % 3);
	return p.kind === 'paths' ? n + 2 : 0;
}

/** @returns {string[]} */
export function checkCountingPuzzle(p, round) {
	if (!KINDS_BY_ROUND[round].includes(p.kind)) return [`라운드 ${round}에서 쓰지 않는 종류: ${p.kind}`];
	const errors = [];
	if (!p.text?.trim()) errors.push('문제 문장(text) 없음');
	for (const list of [p.left, p.right, p.items].filter(Boolean)) {
		const names = list.map((it) => it.name);
		if (names.some((n) => !n) || new Set(names).size !== names.length) errors.push('항목 이름이 비었거나 겹침');
	}
	if (p.kind === 'paths' && ![p.w, p.h].every((v) => Number.isInteger(v) && v >= 1 && v <= 3)) errors.push('격자는 1~3칸');
	if ((p.kind === 'order' || p.kind === 'choose') && !(p.pick >= 2 && p.pick <= p.items.length)) errors.push('고르는 수가 맞지 않음');
	if (p.kind === 'choose' && p.pick !== 2) errors.push('고르기는 2개만');
	if (errors.length) return errors;
	const n = countingAnswer(p);
	if (n < 2 || n > COUNT_LIMITS[round]) errors.push(`답 ${n}가지: 라운드 ${round}는 2~${COUNT_LIMITS[round]}가지`);
	return errors;
}
