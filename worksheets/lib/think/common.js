// 생각 퍼즐 세트 공통: 회차 → 활동·라운드, 고정 난수, 조사.

export const ACTIVITIES = ['parking', 'blocks', 'counting', 'logic'];

export const ACTIVITY_NAMES = { parking: '주차장 탈출', blocks: '쌓기나무', counting: '경우의 수', logic: '논리 퍼즐' };

/** 회차 번호로 정해지는 활동: 1 주차장, 2 쌓기나무, 3 경우의 수, 4 논리, 5 주차장 … */
export function activityOf(id) {
	return ACTIVITIES[(id - 1) % 4];
}

/** 그 활동이 몇 번째로 나오는지 (1~6) */
export function roundOf(id) {
	return Math.ceil(id / 4);
}

/** 같은 seed면 같은 수열을 내는 난수 (mulberry32), 0 이상 1 미만 */
export function makeRng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** 마지막 글자에 받침이 있는지 */
function hasFinal(word) {
	const code = word.charCodeAt(word.length - 1);
	return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

// [받침 있을 때, 없을 때]
const PARTICLES = { '은/는': ['은', '는'], '이/가': ['이', '가'], '와/과': ['과', '와'], '을/를': ['을', '를'] };

/**
 * 낱말 + 조사
 * @param {string} word
 * @param {'은/는'|'이/가'|'와/과'|'을/를'} pair
 */
export function josa(word, pair) {
	const [withFinal, without] = PARTICLES[pair];
	return word + (hasFinal(word) ? withFinal : without);
}

export const circled = (n) => String.fromCharCode(0x2460 + n - 1);
