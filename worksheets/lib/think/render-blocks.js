// 쌓기나무 그림: 등각 그림(오른쪽·앞·위에서 봄), 문제 칸, 정답.
import { circled } from './common.js';
import { blockCount, frontView, parseHeights, sideView, topView } from './blocks.js';

const S = 8; // 블록 한 변 (mm)
const R2 = Math.SQRT2;
const R6 = Math.sqrt(6);

/** 공간 점 (x 오른쪽, y 뒤쪽, z 위) → 화면 mm (y는 아래로) */
const proj = (x, y, z) => [((x + y) / R2) * S, ((x - y - 2 * z) / R6) * S];
const pts = (list) => list.map(([x, y, z]) => proj(x, y, z).map((v) => v.toFixed(2)).join(',')).join(' ');

/** 블록 한 개: 윗면·앞면·오른쪽 면 */
function cube(x, y, z) {
	const top = pts([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]]);
	const front = pts([[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]]);
	const right = pts([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]]);
	return `<g class="cube"><polygon class="f-top" points="${top}"/><polygon class="f-front" points="${front}"/><polygon class="f-right" points="${right}"/></g>`;
}

/** 바닥 위 화살표 + 글자 (from → to, 글자는 from 바깥쪽) */
function label(text, from, to, out) {
	const [x1, y1] = proj(...from);
	const [x2, y2] = proj(...to);
	const [tx, ty] = proj(...out);
	return `<g class="dir"><line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" marker-end="url(#iso-arrow)"/><text x="${tx.toFixed(2)}" y="${(ty + 1.4).toFixed(2)}">${text}</text></g>`;
}

/** 등각 그림 SVG */
export function renderIsoBlocks(h) {
	const R = h.length;
	const C = h[0].length;
	const depth = (r) => R - 1 - r;
	const floor = [];
	const cubes = [];
	h.forEach((row, r) =>
		row.forEach((v, c) => {
			const y = depth(r);
			floor.push(`<polygon points="${pts([[c, y, 0], [c + 1, y, 0], [c + 1, y + 1, 0], [c, y + 1, 0]])}"/>`);
			for (let z = 0; z < v; z++) cubes.push({ x: c, y, z });
		})
	);
	cubes.sort((a, b) => a.x - a.y + a.z - (b.x - b.y + b.z));
	const front = label('앞', [C / 2, -1.1, 0], [C / 2, -0.3, 0], [C / 2, -1.55, 0]);
	const side = label('옆', [C + 1.1, R / 2, 0], [C + 0.3, R / 2, 0], [C + 1.55, R / 2, 0]);

	const H = Math.max(...h.flat());
	const corners = [[0, 0, 0], [C, 0, 0], [0, R, 0], [C, R, 0], [0, R, H], [C, 0, H], [0, 0, H], [C / 2, -1.9, 0], [C + 1.9, R / 2, 0]];
	const xs = corners.map((p) => proj(...p)[0]);
	const ys = corners.map((p) => proj(...p)[1]);
	const [minX, maxX, minY, maxY] = [Math.min(...xs) - 1, Math.max(...xs) + 1, Math.min(...ys) - 1, Math.max(...ys) + 2];
	const w = maxX - minX;
	const hh = maxY - minY;
	return `<svg class="iso-blocks" width="${w.toFixed(1)}mm" height="${hh.toFixed(1)}mm" viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${w.toFixed(2)} ${hh.toFixed(2)}">
<defs><marker id="iso-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="3" markerHeight="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#777"/></marker></defs>
<g class="floor">${floor.join('')}</g>${cubes.map((q) => cube(q.x, q.y, q.z)).join('')}${front}${side}</svg>`;
}

/** 빈 3×3 모눈 (데이터 크기로 답이 새지 않게 늘 같은 크기) */
const emptyGrid = () => `<table class="vgrid">${'<tr><td></td><td></td><td></td></tr>'.repeat(3)}</table>`;

const VIEW_ASK = {
	top: ['위에서 본 모양을 색칠해요', '아래쪽이 앞'],
	front: ['앞에서 본 모양을 색칠해요', ''],
	side: ['오른쪽 옆에서 본 모양을 색칠해요', '왼쪽이 앞'],
	topNumbers: ['위에서 본 모양에 층수를 써요', '아래쪽이 앞']
};

function askHtml(a, round) {
	if (a === 'count') {
		const floors =
			round <= 2
				? `<div class="floors">1층 <span class="blank sm"></span>개 2층 <span class="blank sm"></span>개 3층 <span class="blank sm"></span>개</div>`
				: '';
		return `<div class="ask">블록은 모두 <span class="blank"></span>개</div>${floors}`;
	}
	const [text, note] = VIEW_ASK[a];
	return `<div class="ask">${text}</div><div class="view">${emptyGrid()}${note ? `<span class="vlabel">${note}</span>` : ''}</div>`;
}

/**
 * 쌓기나무 문제 칸
 * @param {{ puzzle: { heights: string[], ask: string[] }, position: number, round: number }} p
 */
export function renderBlocksProblem({ puzzle, position, round }) {
	const isStory = position === 1;
	const h = parseHeights(puzzle.heights);
	return `
<section class="problem think-problem blocks${isStory ? ' story' : ''}" data-pos="${position}">
  <div class="ptitle"><span class="num">${circled(position)}</span> 쌓기나무${isStory ? ' <span class="star">⭐ 이야기 문제</span>' : ''}</div>
  <div class="pbody"><div class="iso">${renderIsoBlocks(h)}</div><div class="asks">${puzzle.ask.map((a) => askHtml(a, round)).join('')}</div></div>
</section>`;
}

/** 칸마다 켜짐/글자를 받은 작은 모눈 */
function mini(rows, label) {
	const body = rows.map((row) => `<tr>${row.map((v) => (v === false || v === '' ? '<td></td>' : `<td class="on">${v === true ? '' : v}</td>`)).join('')}</tr>`).join('');
	return `<span class="mini-view"><table class="mini">${body}</table><small>${label}</small></span>`;
}

/** 높이 목록 → 아래에서 쌓아 올린 모양 */
function silhouette(heights) {
	const H = Math.max(...heights);
	return Array.from({ length: H }, (_, i) => heights.map((v) => v >= H - i));
}

/** 정답지: 개수 + 묻는 모양 */
export function blocksAnswer(puzzle) {
	const h = parseHeights(puzzle.heights);
	const parts = puzzle.ask.map((a) => {
		if (a === 'count') return `<b>${blockCount(h)}개</b>`;
		if (a === 'top') return mini(topView(h), '위');
		if (a === 'topNumbers') return mini(h.map((row) => row.map((v) => (v > 0 ? v : ''))), '층수');
		if (a === 'front') return mini(silhouette(frontView(h)), '앞');
		return mini(silhouette(sideView(h)), '옆');
	});
	return parts.join(' ');
}
