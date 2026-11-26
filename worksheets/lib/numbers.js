// 두 자리 수 × 두 자리 수 학습지의 숫자 규칙.
// 격자: 위 머리 = a(십×10 | 일), 왼쪽 머리 = b(위: 일의 자리, 아래: 십의 자리×10).

/** @param {number} n */
export function digits(n) {
	return { tens: Math.floor(n / 10) % 10, ones: n % 10 };
}

/** 세로 덧셈 x + y 에서 생기는 받아올림 횟수 */
export function countAddCarries(x, y) {
	let count = 0;
	let carry = 0;
	while (x > 0 || y > 0 || carry > 0) {
		carry = (x % 10) + (y % 10) + carry >= 10 ? 1 : 0;
		count += carry;
		x = Math.floor(x / 10);
		y = Math.floor(y / 10);
	}
	return count;
}

/** 7·8·9단이 헷갈리는 아이에게 어려운 곱: 두 수 모두 6 이상이고 하나가 7 이상 */
export function isHardFact(p, q) {
	return Math.min(p, q) >= 6 && Math.max(p, q) >= 7;
}

/** @param {number} a 고정 수(위 머리) @param {number} b 다른 수(왼쪽 머리) */
export function analyze(a, b) {
	const A = digits(a);
	const B = digits(b);
	const rows = [
		{ rowPart: B.ones, digit: B.ones },
		{ rowPart: B.tens * 10, digit: B.tens }
	];
	const cols = [
		{ colPart: A.tens * 10, digit: A.tens },
		{ colPart: A.ones, digit: A.ones }
	];
	const cells = rows.flatMap((r) =>
		cols.map((c) => ({
			rowPart: r.rowPart,
			colPart: c.colPart,
			value: r.rowPart * c.colPart,
			fact: [r.digit, c.digit]
		}))
	);
	const onesRow = a * B.ones;
	const tensRow = a * B.tens * 10;
	const carries =
		countAddCarries(cells[0].value, cells[1].value) +
		countAddCarries(cells[2].value, cells[3].value) +
		countAddCarries(onesRow, tensRow);
	const hardFacts = cells.filter((c) => isHardFact(c.fact[0], c.fact[1])).length;
	return { answer: a * b, onesRow, tensRow, cells, carries, hardFacts };
}

/** @returns {1|2|3} */
export function stageOf(id) {
	return id <= 6 ? 1 : id <= 14 ? 2 : 3;
}

/** @returns {1|2|3|4} */
export function hintLevel(id) {
	return id <= 6 ? 1 : id <= 14 ? 2 : id <= 20 ? 3 : 4;
}

const RANGES = {
	1: { fixed: [11, 19], other: [11, 39] },
	2: { fixed: [11, 29], other: [11, 59] },
	3: { fixed: [11, 49], other: [11, 99] }
};

/**
 * @param {1|2|3} stage
 * @param {number} position 1 = 이야기 문제, 2~8 = 변형 문제
 * @returns {string[]} 위반 메시지(빈 배열 = 통과)
 */
export function checkProblem(stage, a, b, position) {
	const errors = [];
	const label = `${a}×${b} (${position}번)`;
	for (const n of [a, b]) {
		if (n < 10 || n > 99) errors.push(`${label}: ${n}은 두 자리 수가 아님`);
		if (n % 10 === 0) errors.push(`${label}: ${n}은 끝자리가 0`);
	}
	const range = RANGES[stage];
	if (a < range.fixed[0] || a > range.fixed[1]) errors.push(`${label}: 고정 수 범위 ${range.fixed.join('~')} 밖`);
	if (b < range.other[0] || b > range.other[1]) errors.push(`${label}: 다른 수 범위 ${range.other.join('~')} 밖`);
	if (errors.length) return errors;

	const { carries, hardFacts } = analyze(a, b);
	if (stage === 1) {
		if (carries > 1) errors.push(`${label}: 받아올림 ${carries}곳 (최대 1)`);
		if (hardFacts > 0) errors.push(`${label}: 어려운 곱 ${hardFacts}개 (0개여야 함)`);
	} else if (stage === 2) {
		if (hardFacts > 1) errors.push(`${label}: 어려운 곱 ${hardFacts}개 (최대 1)`);
		if (hardFacts >= 1 && position < 5) errors.push(`${label}: 어려운 곱은 5번 문제부터`);
		if (position === 1 && carries > 2) errors.push(`${label}: 받아올림 ${carries}곳 (최대 2)`);
		if (position >= 2 && (carries < 1 || carries > 2)) errors.push(`${label}: 받아올림 ${carries}곳 (1~2곳이어야 함)`);
	}
	return errors;
}

function sortKey(a, b) {
	const r = analyze(a, b);
	return [r.hardFacts, r.carries, b];
}

function compareKeys(x, y) {
	for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
	return 0;
}

/** 정렬된 목록에서 k개를 고르게 띄엄띄엄 */
function spread(list, k) {
	if (k <= 0) return [];
	if (list.length <= k) return list.slice();
	if (k === 1) return [list[0]];
	return Array.from({ length: k }, (_, i) => list[Math.round((i * (list.length - 1)) / (k - 1))]);
}

/** 고정 수에 짝지을 변형 문제 7개 (②~⑧ 순서) */
export function pickPractice(fixed, storyOther, stage) {
	const [lo, hi] = RANGES[stage].other;
	const candidates = [];
	for (let b = lo; b <= hi; b++) if (b !== storyOther && b % 10 !== 0) candidates.push(b);
	const byKey = (x, y) => compareKeys(sortKey(fixed, x), sortKey(fixed, y));

	let picks;
	if (stage === 2) {
		const easy = candidates.filter((b) => checkProblem(2, fixed, b, 2).length === 0).sort(byKey);
		const hard = candidates
			.filter((b) => analyze(fixed, b).hardFacts === 1 && checkProblem(2, fixed, b, 5).length === 0)
			.sort(byKey);
		const hardCount = Math.min(2, hard.length);
		picks = [...spread(easy, 7 - hardCount), ...spread(hard, hardCount)];
	} else {
		const ok = candidates.filter((b) => checkProblem(stage, fixed, b, 2).length === 0).sort(byKey);
		picks = spread(ok, 7);
	}
	return picks.sort(byKey);
}
