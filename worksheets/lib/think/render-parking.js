// 주차장 탈출 그림: 판(차 자리 테두리), 문제 칸, 오려 쓰는 차 조각 장, 정답.
// 판 칸과 차 조각은 같은 CELL_MM로 그려야 조각이 판에 꼭 맞는다.
import { circled } from './common.js';
import { EXIT_ROW, SIZE, formatMoves, parseBoard, solveParking } from './parking.js';

export const CELL_MM = 10;

const B = SIZE * CELL_MM; // 판 한 변 (mm)
const WALL = 1.2;

/** 차 자리 테두리 하나 */
function outline(v) {
	const w = (v.horizontal ? v.len : 1) * CELL_MM - 2;
	const h = (v.horizontal ? 1 : v.len) * CELL_MM - 2;
	const x = v.col * CELL_MM + 1;
	const y = v.row * CELL_MM + 1;
	const red = v.id === 'R';
	return `<g class="car${red ? ' red' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/><text x="${x + 1.6}" y="${y + 3.6}">${v.id}</text></g>`;
}

/** 첫 움직임을 보여 주는 회색 화살표 */
function hintArrow(v, move) {
	const cx = v.col * CELL_MM + ((v.horizontal ? v.len : 1) * CELL_MM) / 2;
	const cy = v.row * CELL_MM + ((v.horizontal ? 1 : v.len) * CELL_MM) / 2;
	const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[move.dir];
	const reach = (v.len * CELL_MM) / 2 + move.dist * CELL_MM - 3;
	const x2 = cx + dx * reach;
	const y2 = cy + dy * reach;
	const head = `${x2 + dx * 2},${y2 + dy * 2} ${x2 - dy * 1.8},${y2 + dx * 1.8} ${x2 + dy * 1.8},${y2 - dx * 1.8}`;
	return `<g class="hint-arrow"><line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}"/><polygon points="${head}"/></g>`;
}

/**
 * 판 그림 (1단위 = 1mm, 벽과 출구 표시는 판 바깥에 그림)
 * @param {string[]} rows
 * @param {{ hint?: { id: string, dir: string, dist: number } }} [opts]
 */
export function renderParkingBoard(rows, { hint } = {}) {
	const vs = parseBoard(rows);
	const lines = [];
	for (let k = 1; k < SIZE; k++) {
		lines.push(`<line x1="${k * CELL_MM}" y1="0" x2="${k * CELL_MM}" y2="${B}"/>`, `<line x1="0" y1="${k * CELL_MM}" x2="${B}" y2="${k * CELL_MM}"/>`);
	}
	const o = -WALL / 2;
	const exitTop = EXIT_ROW * CELL_MM;
	const exitBottom = exitTop + CELL_MM;
	const wall = `<path class="wall" d="M ${B - o} ${exitTop} V ${o} H ${o} V ${B - o} H ${B - o} V ${exitBottom}"/>`;
	const exit = `<g class="exit"><text x="${B + 2.5}" y="${exitTop - 1.5}">출구</text><polygon points="${B + 3},${exitTop + 3} ${B + 7},${exitTop + 5} ${B + 3},${exitTop + 7}"/></g>`;
	const hintVehicle = hint && vs.find((v) => v.id === hint.id);
	return `<svg class="parking-board" width="${B}mm" height="${B}mm" viewBox="0 0 ${B} ${B}" overflow="visible">
<g class="grid">${lines.join('')}</g>${wall}${exit}${vs.map(outline).join('')}${hintVehicle ? hintArrow(hintVehicle, hint) : ''}</svg>`;
}

/**
 * 주차장 문제 칸
 * @param {{ puzzle: { board: string[], minMoves: number }, position: number, round: number }} p
 */
export function renderParkingProblem({ puzzle, position, round }) {
	const isStory = position === 1;
	const hint = isStory && round <= 2 ? solveParking(puzzle.board)?.moves[0] : undefined;
	return `
<section class="problem think-problem parking${isStory ? ' story' : ''}" data-pos="${position}">
  <div class="ptitle"><span class="num">${circled(position)}</span> 빨간 차를 꺼내요${isStory ? ' <span class="star">⭐ 이야기 문제</span>' : ''}</div>
  <div class="pbody">${renderParkingBoard(puzzle.board, { hint })}</div>
  <div class="answer">몇 번 움직였니? <span class="blank"></span>번 <span class="min">(가장 적게: ${puzzle.minMoves}번)</span></div>
</section>`;
}

// 조각 색 (배경 색을 적게: 연한 색 위주)
const CAR_COLORS = ['#7fb3e6', '#8fd19e', '#f2d16b', '#c9a3e6', '#f2a97f', '#9ad6d6'];
const TRUCK_COLORS = ['#b0b8c4', '#e8b36b', '#9fc2a6'];

/** 위에서 본 차 한 대 (조각 하나 = 칸 크기 그대로, 테두리가 자르는 선) */
function piece(len, color, red = false) {
	const w = len * CELL_MM;
	const h = CELL_MM;
	const body = `<rect x="1" y="1.2" width="${w - 2}" height="${h - 2.4}" rx="2" fill="${color}" stroke="#555" stroke-width="0.3"/>`;
	const glass =
		len === 2
			? `<rect x="${w * 0.58}" y="2.4" width="${w * 0.16}" height="${h - 4.8}" rx="0.8" fill="#fff" opacity="0.85"/><rect x="${w * 0.22}" y="2.6" width="${w * 0.12}" height="${h - 5.2}" rx="0.6" fill="#fff" opacity="0.7"/>`
			: `<rect x="${w - 8.5}" y="2.2" width="2.2" height="${h - 4.4}" rx="0.6" fill="#fff" opacity="0.85"/><line x1="${w - 10}" y1="1.6" x2="${w - 10}" y2="${h - 1.6}" stroke="#555" stroke-width="0.3"/>`;
	const mark = red ? `<text x="${w * 0.4}" y="${h / 2 + 1.3}" font-size="3.4" fill="#fff" font-weight="700">R</text>` : '';
	return `<svg class="piece${red ? ' red' : ''}" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><rect class="cut" x="0.1" y="0.1" width="${w - 0.2}" height="${h - 0.2}"/>${body}${glass}${mark}</svg>`;
}

/**
 * 오려 쓰는 차 조각 장 (따로 한 번만 인쇄)
 * @param {{ activity?: string, puzzles: any[] }[]} episodes
 */
export function renderPiecesSheet(episodes) {
	let cars = 0;
	let trucks = 0;
	for (const ep of episodes.filter((e) => e.activity === 'parking')) {
		for (const p of ep.puzzles) {
			const others = parseBoard(p.board).filter((v) => v.id !== 'R');
			cars = Math.max(cars, others.filter((v) => v.len === 2).length);
			trucks = Math.max(trucks, others.filter((v) => v.len === 3).length);
		}
	}
	const pieces = [
		piece(2, '#e0473a', true),
		piece(2, '#e0473a', true),
		...Array.from({ length: cars + 2 }, (_, i) => piece(2, CAR_COLORS[i % CAR_COLORS.length])),
		...Array.from({ length: trucks + 2 }, (_, i) => piece(3, TRUCK_COLORS[i % TRUCK_COLORS.length]))
	];
	return `
<div class="page pieces think-set">
  <header class="phead"><span class="title">주차장 탈출 차 조각</span></header>
  <p class="note">두꺼운 종이에 인쇄해서 점선을 따라 오려 쓰세요. 한 번 오리면 모든 회차에 써요. 빨간 차, 2칸 차, 3칸 트럭은 판의 테두리 크기에 맞춰 올려놓아요.</p>
  <div class="piece-list">${pieces.join('')}</div>
</div>`;
}

/** 정답지: '2번: A↑2, R→4' */
export function parkingAnswer(puzzle) {
	const s = solveParking(puzzle.board);
	return `${s.minMoves}번: ${formatMoves(s.moves)}`;
}
