// 쌓기나무: 바닥 칸마다 블록을 쌓은 탑(뜬 블록 없음).
// 높이 지도: heights[0]이 맨 뒤 줄, 마지막이 맨 앞 줄, 글자 = 왼쪽→오른쪽 칸의 높이(0~3).
// 그림은 오른쪽·앞·위에서 본 등각 그림이라, 모든 탑의 윗면이 보이면 블록 수가 하나로 정해진다.

/** 라운드별 블록 수 범위 */
export const BLOCK_RANGES = { 1: [3, 5], 2: [4, 6], 3: [5, 8], 4: [6, 9], 5: [7, 10], 6: [8, 12] };

const BASE = ['count', 'top'];
/** 라운드별로 물을 수 있는 것 */
export const ASKS_BY_ROUND = {
	1: BASE,
	2: [...BASE, 'front'],
	3: [...BASE, 'front', 'side'],
	4: [...BASE, 'front', 'side'],
	5: [...BASE, 'front', 'side', 'topNumbers'],
	6: [...BASE, 'front', 'side', 'topNumbers']
};

/** @returns {number[][]} */
export function parseHeights(rows) {
	return rows.map((row) => [...row].map(Number));
}

export function blockCount(h) {
	return h.flat().reduce((a, b) => a + b, 0);
}

/** 위에서 본 모양 (데이터 줄 순서 그대로: 위 = 뒤) */
export function topView(h) {
	return h.map((row) => row.map((v) => v > 0));
}

/** 앞에서 본 모양: 왼쪽→오른쪽 칸마다 가장 높은 탑 */
export function frontView(h) {
	return h[0].map((_, c) => Math.max(...h.map((row) => row[c])));
}

/** 오른쪽 옆에서 본 모양: 왼쪽→오른쪽 = 앞 줄→뒤 줄 */
export function sideView(h) {
	return h.map((row) => Math.max(...row)).reverse();
}

const EPS = 1e-9;

/** 점 p에서 보는 쪽(오른쪽 +x, 앞 −y, 위 +z)으로 쏜 선이 상자에 막히는지 */
function rayHitsBox([px, py, pz], [x0, x1, y0, y1, z0, z1]) {
	let lo = EPS;
	let hi = Infinity;
	for (const [a, b] of [
		[x0 - px, x1 - px], // x = px + t
		[py - y1, py - y0], // y = py − t
		[z0 - pz, z1 - pz] // z = pz + t
	]) {
		lo = Math.max(lo, a);
		hi = Math.min(hi, b);
	}
	return hi - lo > 1e-6;
}

/**
 * 윗면이 절반 넘게 가려진 탑
 * @returns {[number, number][]} [줄, 칸] (데이터 좌표)
 */
export function hiddenTops(h) {
	const rows = h.length;
	const depth = (r) => rows - 1 - r; // 앞 줄 = 0
	const boxes = [];
	h.forEach((row, r) => row.forEach((v, c) => v > 0 && boxes.push({ r, c, box: [c, c + 1, depth(r), depth(r) + 1, 0, v] })));
	const hidden = [];
	for (const { r, c, box } of boxes) {
		const top = box[5];
		let blocked = 0;
		for (let i = 0; i < 5; i++) {
			for (let j = 0; j < 5; j++) {
				const p = [c + (i + 0.5) / 5, depth(r) + (j + 0.5) / 5, top];
				if (boxes.some((o) => (o.r !== r || o.c !== c) && rayHitsBox(p, o.box))) blocked++;
			}
		}
		if (blocked > 12) hidden.push([r, c]);
	}
	return hidden;
}

/** @returns {string[]} */
export function checkBlocksPuzzle(p, round) {
	const rows = p.heights;
	if (!Array.isArray(rows) || rows.length < 2 || rows.length > 3) return ['바닥 줄은 2~3줄'];
	const cols = [...rows[0]].length;
	if (cols < 2 || cols > 3 || rows.some((r) => [...r].length !== cols)) return ['바닥 칸은 줄마다 2~3칸으로 같아야 함'];
	if (rows.some((r) => !/^[0-3]+$/.test(r))) return ['높이는 0~3'];
	const h = parseHeights(rows);
	const errors = [];
	if (h.some((row) => row.every((v) => v === 0)) || h[0].some((_, c) => h.every((row) => row[c] === 0))) {
		errors.push('빈 줄이나 빈 칸이 있음 (바닥 크기로 헷갈림)');
	}
	if (round <= 2 && rows.length * cols > 6) errors.push(`라운드 ${round}은 바닥 6칸까지`);
	const n = blockCount(h);
	const [lo, hi] = BLOCK_RANGES[round];
	if (n < lo || n > hi) errors.push(`블록 ${n}개: 라운드 ${round} 범위 ${lo}~${hi}개 밖`);
	const ask = p.ask ?? [];
	if (ask.length < 1 || ask.length > 2 || new Set(ask).size !== ask.length) errors.push('묻는 것은 1~2개');
	for (const a of ask) if (!ASKS_BY_ROUND[round].includes(a)) errors.push(`라운드 ${round}에서 물을 수 없음: ${a}`);
	if (hiddenTops(h).length) errors.push('그림에서 보이지 않는 탑이 있음');
	return errors;
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

/**
 * 라운드에 맞는 쌓기나무 퍼즐
 * @param {() => number} rng
 * @param {number} round
 * @param {Set<string>} [avoid] 쓰면 안 되는 높이 지도(heights.join('/'))
 */
export function generateBlocks(rng, round, avoid = new Set()) {
	const dims = round <= 2 ? [[2, 2], [2, 3], [3, 2]] : [[2, 3], [3, 2], [3, 3]];
	const allowed = ASKS_BY_ROUND[round];
	for (let tries = 0; tries < 20000; tries++) {
		const [R, C] = pick(rng, dims);
		const heights = Array.from({ length: R }, () =>
			Array.from({ length: C }, () => String(Math.min(3, Math.floor(rng() * 4.4)))).join('')
		);
		const newest = allowed[allowed.length - 1];
		const ask = rng() < 0.5 ? [pick(rng, allowed)] : ['count', pick(rng, allowed.filter((a) => a !== 'count'))];
		if (round >= 2 && rng() < 0.35 && !ask.includes(newest)) ask[ask.length - 1] = newest;
		const p = { heights, ask: [...new Set(ask)] };
		if (avoid.has(heights.join('/'))) continue;
		if (checkBlocksPuzzle(p, round).length === 0) return p;
	}
	throw new Error(`쌓기나무 퍼즐을 만들지 못함 (라운드 ${round})`);
}
