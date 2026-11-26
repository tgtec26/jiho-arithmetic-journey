import { analyze, digits } from './numbers.js';
import { escapeHtml } from './html.js';

const COLS = 4; // 천·백·십·일
const circled = (n) => String.fromCharCode(0x2460 + n - 1);

/** 오른쪽 맞춤으로 숫자를 4칸에 나눔. n이 null이면 빈칸 */
function cellsOf(n) {
	const s = n == null ? '' : String(n);
	return Array.from({ length: COLS }, (_, i) => s[i - (COLS - s.length)] ?? '');
}

function digitRow(rowClass, op, cells) {
	const tds = cells.map((c) => `<td class="d">${c}</td>`).join('');
	return `<tr class="${rowClass}"><td class="op">${op}</td>${tds}</tr>`;
}

/**
 * 문제 한 칸
 * @param {{ a: number, b: number, position: number, level: 1|2|3|4, unit?: string }} p
 */
export function renderProblem({ a, b, position, level, unit }) {
	const r = analyze(a, b);
	const A = digits(a);
	const B = digits(b);
	const showHeads = level <= 2;
	const head = (v) => `<th data-role="head">${showHeads ? v : ''}</th>`;
	const cell = (c, rowKind) =>
		`<td class="cell ${rowKind}">${level === 1 ? `<span class="hint">${c.rowPart}×${c.colPart}</span>` : ''}</td>`;

	// 왼쪽 머리칸: 위 = b의 일의 자리 줄, 아래 = b의 십의 자리×10 줄 (세로셈 부분곱 순서와 같음)
	const left = (v, kind) => `<th class="left ${kind}" data-role="head">${showHeads ? v : ''}</th>`;
	const grid = `
<table class="grid${level === 4 ? ' small' : ''}">
  <tr><th class="corner">×</th>${head(A.tens * 10)}${head(A.ones)}</tr>
  <tr>${left(B.ones, 'ones')}${cell(r.cells[0], 'ones')}${cell(r.cells[1], 'ones')}</tr>
  <tr>${left(B.tens * 10, 'tens')}${cell(r.cells[2], 'tens')}${cell(r.cells[3], 'tens')}</tr>
</table>`;

	const rowsums =
		level === 4
			? ''
			: `
<div class="rowsums">
  <div class="rowsum"><span class="dot ones"></span><span class="eq">=</span><span class="box"></span></div>
  <div class="rowsum"><span class="dot tens"></span><span class="eq">=</span><span class="box"></span></div>
</div>`;

	const p2 = cellsOf(null);
	if (level === 1) p2[COLS - 1] = '<span class="hint">0</span>';
	const carryRow = `<tr class="v-carry"><td class="op"></td>${'<td class="carry"></td>'.repeat(COLS)}</tr>`;
	const vertical = `
<table class="vertical">
  ${digitRow('v-a', '', cellsOf(a))}
  ${digitRow('v-b', '×', cellsOf(b))}
  ${carryRow}
  ${digitRow('v-p1', '<span class="dot ones"></span>', cellsOf(null))}
  ${digitRow('v-p2', '<span class="dot tens"></span>', p2)}
  ${digitRow('v-sum', '', cellsOf(null))}
</table>`;

	const isStory = position === 1;
	const answer = isStory ? `<div class="answer">답: <span class="blank"></span> ${escapeHtml(unit ?? '')}</div>` : '';
	return `
<section class="problem${isStory ? ' story' : ''}" data-pos="${position}">
  <div class="ptitle"><span class="num">${circled(position)}</span> ${a} × ${b}${isStory ? ' <span class="star">⭐ 이야기 문제</span>' : ''}</div>
  <div class="pbody">
    <div class="left-col">${grid}${rowsums}</div>
    <div class="right-col">${vertical}</div>
  </div>
  ${answer}
</section>`;
}
