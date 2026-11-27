// 논리 퍼즐: 줄 세우기(단서로 순서 정하기)와 4×4 모양 스도쿠.
// 줄은 왼쪽이 앞. 한 회에 ①③④⑤ 줄 세우기, ②⑥⑦⑧ 스도쿠.
import { josa } from './common.js';

export const LINEUP_RANGES = {
	1: { items: [3, 3], clues: [2, 2] },
	2: { items: [3, 3], clues: [2, 3] },
	3: { items: [4, 4], clues: [3, 3] },
	4: { items: [4, 4], clues: [3, 4] },
	5: { items: [4, 5], clues: [4, 4] },
	6: { items: [5, 5], clues: [4, 5] }
};

const EARLY = ['first', 'last', 'behind', 'before', 'middle'];
export const CLUE_TYPES_BY_ROUND = { 1: EARLY, 2: EARLY, 3: EARLY, 4: [...EARLY, 'apart'], 5: [...EARLY, 'apart'], 6: [...EARLY, 'apart'] };

export const SHAPES = ['●', '▲', '■', '★'];
export const SUDOKU_BLANKS = { 1: [4, 5], 2: [5, 6], 3: [6, 7], 4: [7, 8], 5: [8, 9], 6: [9, 10] };

/** 자리마다 종류 */
export const LOGIC_KIND_AT = { 1: 'lineup', 2: 'sudoku', 3: 'lineup', 4: 'lineup', 5: 'lineup', 6: 'sudoku', 7: 'sudoku', 8: 'sudoku' };

/** 단서 → 문장 */
export function clueText(c) {
	switch (c.type) {
		case 'first':
			return `${josa(c.a, '은/는')} 맨 앞이에요.`;
		case 'last':
			return `${josa(c.a, '은/는')} 맨 뒤예요.`;
		case 'behind':
			return `${c.a} 바로 뒤에 ${josa(c.b, '이/가')} 있어요.`;
		case 'before':
			return `${josa(c.a, '은/는')} ${c.b}보다 앞에 있어요.`;
		case 'middle':
			return `${josa(c.a, '은/는')} 한가운데예요.`;
		case 'apart':
			return `${josa(c.a, '와/과')} ${josa(c.b, '은/는')} 붙어 있지 않아요.`;
		default:
			throw new Error(`없는 단서: ${c.type}`);
	}
}

export function fits(order, c) {
	const pos = (x) => order.indexOf(x);
	const n = order.length;
	switch (c.type) {
		case 'first':
			return pos(c.a) === 0;
		case 'last':
			return pos(c.a) === n - 1;
		case 'behind':
			return pos(c.b) === pos(c.a) + 1;
		case 'before':
			return pos(c.a) < pos(c.b);
		case 'middle':
			return pos(c.a) === (n - 1) / 2;
		case 'apart':
			return Math.abs(pos(c.a) - pos(c.b)) > 1;
		default:
			return false;
	}
}

function permutations(list) {
	if (list.length <= 1) return [list];
	return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest]));
}

/** @returns {string[][]} 단서를 모두 만족하는 순서 */
export function lineupSolutions(p) {
	return permutations(p.items).filter((order) => p.clues.every((c) => fits(order, c)));
}

// ---------- 스도쿠 ----------

const boxOf = (r, c) => Math.floor(r / 2) * 2 + Math.floor(c / 2);

/** @returns {string[][]} 답(최대 limit개) */
export function sudokuSolutions(grid, limit = 2) {
	const cells = grid.map((row) => [...row]);
	const found = [];
	const canPut = (r, c, s) => {
		for (let k = 0; k < 4; k++) if (cells[r][k] === s || cells[k][c] === s) return false;
		for (let rr = 0; rr < 4; rr++) for (let cc = 0; cc < 4; cc++) if (boxOf(rr, cc) === boxOf(r, c) && cells[rr][cc] === s) return false;
		return true;
	};
	const walk = (i) => {
		if (found.length >= limit) return;
		if (i === 16) return void found.push(cells.map((row) => row.join('')));
		const r = Math.floor(i / 4);
		const c = i % 4;
		if (cells[r][c] !== '.') return walk(i + 1);
		for (const s of SHAPES) {
			if (!canPut(r, c, s)) continue;
			cells[r][c] = s;
			walk(i + 1);
			cells[r][c] = '.';
		}
	};
	walk(0);
	return found;
}

function sudokuErrors(p, round) {
	const g = p.grid;
	if (!Array.isArray(g) || g.length !== 4 || g.some((row) => [...row].length !== 4 || [...row].some((ch) => ch !== '.' && !SHAPES.includes(ch)))) {
		return ['스도쿠는 ●▲■★와 . 로 된 4칸 4줄'];
	}
	const cells = g.map((row) => [...row]);
	const groups = [
		...cells,
		...[0, 1, 2, 3].map((c) => cells.map((row) => row[c])),
		...[0, 1, 2, 3].map((b) => cells.flatMap((row, r) => row.filter((_, c) => boxOf(r, c) === b)))
	];
	if (groups.some((gr) => {
		const shown = gr.filter((ch) => ch !== '.');
		return new Set(shown).size !== shown.length;
	})) return ['같은 줄이나 네모 안에 같은 모양이 두 번 있음'];
	const errors = [];
	const blanks = cells.flat().filter((ch) => ch === '.').length;
	const [lo, hi] = SUDOKU_BLANKS[round];
	if (blanks < lo || blanks > hi) errors.push(`빈칸 ${blanks}개: 라운드 ${round}는 ${lo}~${hi}개`);
	const n = sudokuSolutions(g).length;
	if (n !== 1) errors.push(`답이 하나뿐이어야 함 (${n === 0 ? '답 없음' : '여러 개'})`);
	return errors;
}

function lineupErrors(p, round) {
	const { items, clues } = p;
	const range = LINEUP_RANGES[round];
	const errors = [];
	if (!Array.isArray(items) || new Set(items).size !== items.length) return ['줄 세울 이름이 겹침'];
	if (items.length < range.items[0] || items.length > range.items[1]) errors.push(`${items.length}명: 라운드 ${round}는 ${range.items.join('~')}명`);
	if (clues.length < range.clues[0] || clues.length > range.clues[1]) errors.push(`단서 ${clues.length}개: 라운드 ${round}는 ${range.clues.join('~')}개`);
	for (const c of clues) {
		if (!CLUE_TYPES_BY_ROUND[round].includes(c.type)) errors.push(`라운드 ${round}에서 쓰지 않는 단서: ${c.type}`);
		if (![c.a, c.b].filter((x) => x !== undefined).every((x) => items.includes(x))) errors.push(`단서에 줄에 없는 이름: ${clueText(c)}`);
		if (c.type === 'middle' && items.length % 2 === 0) errors.push('짝수 명에는 한가운데가 없음');
	}
	if (errors.length) return errors;
	const n = lineupSolutions(p).length;
	if (n !== 1) errors.push(`답이 하나뿐이어야 함 (${n}개)`);
	return errors;
}

/** @returns {string[]} */
export function checkLogicPuzzle(p, round, position) {
	const want = LOGIC_KIND_AT[position];
	if (p.kind !== want) return [`${position}번 자리는 ${want === 'lineup' ? '줄 세우기' : '스도쿠'}`];
	return p.kind === 'lineup' ? lineupErrors(p, round) : sudokuErrors(p, round);
}

// ---------- 생성 ----------

function shuffle(rng, list) {
	const out = [...list];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

const randInt = (rng, [lo, hi]) => lo + Math.floor(rng() * (hi - lo + 1));

/** 정답 순서에 맞는 모든 단서 */
function trueClues(order, types) {
	const n = order.length;
	const out = [];
	if (types.includes('first')) out.push({ type: 'first', a: order[0] });
	if (types.includes('last')) out.push({ type: 'last', a: order[n - 1] });
	if (types.includes('middle') && n % 2 === 1) out.push({ type: 'middle', a: order[(n - 1) / 2] });
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			if (j === i + 1 && types.includes('behind')) out.push({ type: 'behind', a: order[i], b: order[j] });
			if (j > i + 1 && types.includes('before')) out.push({ type: 'before', a: order[i], b: order[j] });
			if (j > i + 1 && types.includes('apart')) out.push({ type: 'apart', a: order[i], b: order[j] });
		}
	}
	return out;
}

/**
 * 답이 하나인 줄 세우기
 * @param {() => number} rng
 * @param {number} round
 * @param {string[]} items 줄 세울 이름 (라운드 범위의 수)
 */
export function generateLineup(rng, round, items) {
	const range = LINEUP_RANGES[round];
	const types = CLUE_TYPES_BY_ROUND[round];
	for (let tries = 0; tries < 5000; tries++) {
		const order = shuffle(rng, items);
		const k = randInt(rng, range.clues);
		const clues = shuffle(rng, trueClues(order, types)).slice(0, k);
		if (!clues.some((c) => ['behind', 'before', 'apart'].includes(c.type))) continue;
		const p = { kind: 'lineup', items: [...items], clues };
		if (lineupErrors(p, round).length === 0) return p;
	}
	throw new Error(`줄 세우기를 만들지 못함 (라운드 ${round})`);
}

/**
 * 답이 하나인 모양 스도쿠
 * @param {() => number} rng
 * @param {number} round
 * @param {Set<string>} [avoid] 쓰면 안 되는 판(grid.join('/'))
 */
export function generateSudoku(rng, round, avoid = new Set()) {
	const base = ['0123', '2301', '1032', '3210'];
	const [lo, hi] = SUDOKU_BLANKS[round];
	for (let tries = 0; tries < 2000; tries++) {
		const shapes = shuffle(rng, SHAPES);
		const band = shuffle(rng, [0, 1]);
		const rows = band.flatMap((b) => shuffle(rng, [0, 1]).map((r) => b * 2 + r));
		const stack = shuffle(rng, [0, 1]);
		const cols = stack.flatMap((s) => shuffle(rng, [0, 1]).map((c) => s * 2 + c));
		let full = rows.map((r) => cols.map((c) => shapes[Number(base[r][c])]));
		if (rng() < 0.5) full = full[0].map((_, c) => full.map((row) => row[c]));
		const target = randInt(rng, [lo, hi]);
		const cells = full.map((row) => [...row]);
		let blanks = 0;
		for (const i of shuffle(rng, [...Array(16).keys()])) {
			if (blanks === target) break;
			const [r, c] = [Math.floor(i / 4), i % 4];
			const keep = cells[r][c];
			cells[r][c] = '.';
			if (sudokuSolutions(cells.map((row) => row.join(''))).length === 1) blanks++;
			else cells[r][c] = keep;
		}
		const grid = cells.map((row) => row.join(''));
		if (blanks === target && !avoid.has(grid.join('/'))) return { kind: 'sudoku', grid };
	}
	throw new Error(`스도쿠를 만들지 못함 (라운드 ${round})`);
}
