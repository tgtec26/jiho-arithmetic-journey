// 주차장 탈출: 6×6 판에서 빨간 차(R)를 오른쪽 출구로 꺼내는 퍼즐.
// 판은 문자열 6줄: '.' 빈칸, 'R' 빨간 차, 다른 대문자 = 차 하나(한 줄로 이어진 2칸 차 또는 3칸 트럭).
// 한 번 움직임 = 차 하나를 한 방향으로 미는 것(몇 칸이든).

export const SIZE = 6;
export const EXIT_ROW = 2;
const GOAL_COL = SIZE - 2; // 빨간 차 오른쪽 끝이 출구에 닿는 자리

/** 라운드별 가장 적게 움직이는 횟수 범위 */
export const PARKING_RANGES = { 1: [1, 3], 2: [2, 4], 3: [3, 6], 4: [4, 7], 5: [5, 9], 6: [6, 11] };

const ARROWS = { up: '↑', down: '↓', left: '←', right: '→' };

/** 글자마다 칸 목록 */
function cellsOf(rows) {
	const cells = new Map();
	rows.forEach((row, r) =>
		[...row].forEach((ch, c) => {
			if (ch === '.') return;
			if (!cells.has(ch)) cells.set(ch, []);
			cells.get(ch).push([r, c]);
		})
	);
	return cells;
}

/** @returns {{ id: string, row: number, col: number, len: number, horizontal: boolean }[]} 글자 순 */
export function parseBoard(rows) {
	return [...cellsOf(rows)]
		.map(([id, cs]) => ({
			id,
			row: Math.min(...cs.map(([r]) => r)),
			col: Math.min(...cs.map(([, c]) => c)),
			len: cs.length,
			horizontal: cs.every(([r]) => r === cs[0][0])
		}))
		.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** @returns {string[]} 판 모양 오류 */
export function boardErrors(rows) {
	if (!Array.isArray(rows) || rows.length !== SIZE || rows.some((r) => typeof r !== 'string' || [...r].length !== SIZE)) {
		return ['판은 6칸짜리 6줄이어야 함'];
	}
	const errors = [];
	if (rows.some((r) => !/^[.A-Z]+$/.test(r))) errors.push('판에는 . 과 대문자만');
	for (const [id, cs] of cellsOf(rows)) {
		const sameRow = cs.every(([r]) => r === cs[0][0]);
		const sameCol = cs.every(([, c]) => c === cs[0][1]);
		const line = sameRow ? cs.map(([, c]) => c) : cs.map(([r]) => r);
		const contiguous = Math.max(...line) - Math.min(...line) === cs.length - 1;
		if (cs.length < 2 || cs.length > 3) errors.push(`차 ${id}: 2칸이나 3칸이어야 함`);
		else if (!(sameRow || sameCol) || !contiguous) errors.push(`차 ${id}: 한 줄로 이어져야 함`);
	}
	const red = parseBoard(rows).find((v) => v.id === 'R');
	if (!red) errors.push('빨간 차(R)가 없음');
	else if (!red.horizontal || red.len !== 2) errors.push('빨간 차는 가로 2칸');
	else if (red.row !== EXIT_ROW) errors.push(`빨간 차는 출구 줄(${EXIT_ROW + 1}번째 줄)에 있어야 함`);
	else if (red.col === GOAL_COL) errors.push('빨간 차가 이미 출구에 있음');
	return errors;
}

/**
 * 너비 우선 탐색으로 가장 적은 움직임 찾기
 * @returns {{ minMoves: number, moves: { id: string, dir: 'up'|'down'|'left'|'right', dist: number }[] } | null}
 */
export function solveParking(rows) {
	const vs = parseBoard(rows);
	const red = vs.findIndex((v) => v.id === 'R');
	const start = vs.map((v) => (v.horizontal ? v.col : v.row));
	const key = (s) => s.join(',');

	const occupancy = (s) => {
		const grid = new Array(SIZE * SIZE).fill(-1);
		vs.forEach((v, i) => {
			for (let k = 0; k < v.len; k++) {
				const r = v.horizontal ? v.row : s[i] + k;
				const c = v.horizontal ? s[i] + k : v.col;
				grid[r * SIZE + c] = i;
			}
		});
		return grid;
	};
	const free = (grid, r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE && grid[r * SIZE + c] === -1;

	const parent = new Map([[key(start), null]]);
	let frontier = [start];
	while (frontier.length) {
		const next = [];
		for (const s of frontier) {
			if (s[red] === GOAL_COL) return { minMoves: pathOf(s).length, moves: pathOf(s) };
			const grid = occupancy(s);
			vs.forEach((v, i) => {
				for (const sign of [-1, 1]) {
					for (let d = 1; ; d++) {
						const head = sign < 0 ? s[i] - d : s[i] + v.len - 1 + d;
						const ok = v.horizontal ? free(grid, v.row, head) : free(grid, head, v.col);
						if (!ok) break;
						const t = [...s];
						t[i] = s[i] + sign * d;
						const k = key(t);
						if (parent.has(k)) continue;
						const dir = v.horizontal ? (sign < 0 ? 'left' : 'right') : sign < 0 ? 'up' : 'down';
						parent.set(k, { from: s, move: { id: v.id, dir, dist: d } });
						next.push(t);
					}
				}
			});
		}
		frontier = next;
	}
	return null;

	function pathOf(s) {
		const moves = [];
		for (let p = parent.get(key(s)); p; p = parent.get(key(p.from))) moves.unshift(p.move);
		return moves;
	}
}

/** @returns {string[]} */
export function checkParkingPuzzle(p, round) {
	const errors = boardErrors(p.board);
	if (errors.length) return errors;
	const s = solveParking(p.board);
	if (!s) return ['빨간 차를 꺼낼 수 없음'];
	if (s.minMoves !== p.minMoves) errors.push(`가장 적게 ${s.minMoves}번인데 ${p.minMoves}번으로 적힘`);
	const [lo, hi] = PARKING_RANGES[round];
	if (s.minMoves < lo || s.minMoves > hi) errors.push(`가장 적게 ${s.minMoves}번: 라운드 ${round} 범위 ${lo}~${hi}번 밖`);
	return errors;
}

/** 'B↑1, C←2, R→4' */
export function formatMoves(moves) {
	return moves.map((m) => `${m.id}${ARROWS[m.dir]}${m.dist}`).join(', ');
}

// ---------- 생성 ----------

/** 차 목록 → 판 문자열 (글자는 읽는 순서로 A, B, C…, R 건너뜀) */
function toBoard(vehicles) {
	const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill('.'));
	const order = vehicles
		.map((v, i) => ({ v, i }))
		.filter(({ v }) => !v.red)
		.sort((a, b) => a.v.row * SIZE + a.v.col - (b.v.row * SIZE + b.v.col));
	const letters = 'ABCDEFGHIJKLMNOPQSTUVWXYZ';
	const names = new Map(order.map(({ i }, n) => [i, letters[n]]));
	vehicles.forEach((v, i) => {
		for (let k = 0; k < v.len; k++) {
			grid[v.horizontal ? v.row : v.row + k][v.horizontal ? v.col + k : v.col] = v.red ? 'R' : names.get(i);
		}
	});
	return grid.map((r) => r.join(''));
}

function cellsOfVehicle(v) {
	return Array.from({ length: v.len }, (_, k) => (v.horizontal ? [v.row, v.col + k] : [v.row + k, v.col]));
}

function fits(vehicles, v, skip = -1) {
	const taken = new Set(vehicles.flatMap((w, i) => (i === skip ? [] : cellsOfVehicle(w).map(([r, c]) => r * SIZE + c))));
	return cellsOfVehicle(v).every(([r, c]) => r < SIZE && c < SIZE && !taken.has(r * SIZE + c));
}

function randomVehicle(rng) {
	const len = rng() < 0.72 ? 2 : 3;
	const horizontal = rng() < 0.5;
	const row = Math.floor(rng() * (horizontal ? SIZE : SIZE - len + 1));
	const col = Math.floor(rng() * (horizontal ? SIZE - len + 1 : SIZE));
	return { len, horizontal, row, col };
}

/** 한 군데 바꾼 새 차 목록 (더하기·빼기·옮기기) */
function mutate(rng, vehicles) {
	const out = vehicles.map((v) => ({ ...v }));
	const others = out.length - 1;
	const op = rng();
	if ((op < 0.4 || others < 2) && others < 13) {
		for (let tries = 0; tries < 20; tries++) {
			const v = randomVehicle(rng);
			if (fits(out, v)) return [...out, v];
		}
		return out;
	}
	if (op < 0.55) {
		out.splice(1 + Math.floor(rng() * others), 1);
		return out;
	}
	const i = 1 + Math.floor(rng() * others);
	for (let tries = 0; tries < 20; tries++) {
		const v = randomVehicle(rng);
		if (fits(out, v, i)) {
			out[i] = v;
			return out;
		}
	}
	return out;
}

/**
 * 범위 안의 퍼즐 만들기: 무작위로 시작해 가장 적은 횟수가 늘어나는 쪽으로 한 군데씩 바꾼다.
 * @param {() => number} rng
 * @param {[number, number]} range
 * @param {Set<string>} [avoid] 쓰면 안 되는 판(board.join('/'))
 * @returns {{ board: string[], minMoves: number }}
 */
export function generateParking(rng, [lo, hi], avoid = new Set()) {
	for (let restart = 0; restart < 200; restart++) {
		const red = { red: true, len: 2, horizontal: true, row: EXIT_ROW, col: Math.floor(rng() * 3) };
		let best = [red];
		let bestMoves = 1;
		for (let step = 0; step < 1500; step++) {
			const cand = mutate(rng, best);
			const board = toBoard(cand);
			const s = solveParking(board);
			if (!s || s.minMoves > hi || s.minMoves < bestMoves) continue;
			best = cand;
			bestMoves = s.minMoves;
			if (bestMoves >= lo && !avoid.has(board.join('/'))) return { board, minMoves: bestMoves };
		}
	}
	throw new Error(`주차장 퍼즐을 만들지 못함 (${lo}~${hi}번)`);
}
