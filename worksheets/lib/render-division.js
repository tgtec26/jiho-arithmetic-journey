import { analyzeDiv } from './division.js';
import { escapeHtml } from './html.js';

const circled = (n) => String.fromCharCode(0x2460 + n - 1);
const hint = (v) => `<span class="hint">${v}</span>`;
const box = (inner = '', cls = '') => `<span class="box${cls ? ` ${cls}` : ''}">${inner}</span>`;

/** 세로식 한 줄: 왼쪽 칸 + 십의 자리·일의 자리 칸 */
function ldRow(cls, op, cells, cellClass = ['d', 'd']) {
	return `<tr class="${cls}">${op}${cells.map((c, i) => `<td class="${cellClass[i]}">${c}</td>`).join('')}</tr>`;
}

/**
 * 나눗셈 문제 한 칸: 왼쪽 쪼개기 + 오른쪽 세로식
 * @param {{ n: number, d: number, position: number, level: 1|2|3|4, unit?: string, restUnit?: string, withRemainder: boolean }} p
 */
export function renderDivProblem({ n, d, position, level, unit, restUnit, withRemainder }) {
	const r = analyzeDiv(n, d);
	const first = level <= 2 ? hint(r.firstPart) : '';
	const second = level === 1 ? hint(r.secondPart) : '';
	const remBox = withRemainder ? `<span class="rem">…</span>${box('', 'sm')}` : '';

	// 주황 = 십의 자리 단계, 파랑 = 일의 자리 단계 (세로식의 같은 색 점 줄과 짝)
	const split = `
<div class="split${level === 4 ? ' small' : ''}">
  <div class="srow">${n} = ${box(first)} + ${box(second)}</div>
  <div class="srow"><span class="dot first"></span>${box(first)} ÷ ${d} = ${box()}</div>
  <div class="srow"><span class="dot second"></span>${box(second)} ÷ ${d} = ${box()}${remBox}</div>
  <div class="srow">몫 = <span class="dot first"></span> + <span class="dot second"></span> = ${box()}</div>
</div>`;

	const op = (inner = '') => `<td class="op">${inner}</td>`;
	const longdiv = `
<table class="longdiv">
  ${ldRow('ld-q', op(), ['', ''], ['d q1', 'd q2'])}
  ${ldRow('ld-n', '<td class="dv">' + d + '</td>', [Math.floor(n / 10), n % 10])}
  ${ldRow('ld-p1', op('<span class="dot first"></span>'), ['', ''])}
  ${ldRow('ld-r1', op(), ['', level === 1 ? hint(n % 10) : ''])}
  ${ldRow('ld-p2', op('<span class="dot second"></span>'), ['', ''])}
  ${ldRow('ld-rem', op(), ['', ''])}
</table>`;

	const check = `<div class="check">확인: ${box()} × ${d}${withRemainder ? ` + ${box('', 'sm')}` : ''} = ${n}</div>`;

	const isStory = position === 1;
	const rest = r.remainder > 0 ? `, 남는 것 <span class="blank"></span> ${escapeHtml(restUnit ?? '')}` : '';
	const answer = isStory ? `<div class="answer">답: <span class="blank"></span> ${escapeHtml(unit ?? '')}${rest}</div>` : '';
	return `
<section class="problem div-problem${isStory ? ' story' : ''}" data-pos="${position}">
  <div class="ptitle"><span class="num">${circled(position)}</span> ${n} ÷ ${d}${isStory ? ' <span class="star">⭐ 이야기 문제</span>' : ''}</div>
  <div class="pbody">${split}${longdiv}</div>
  ${check}
  ${answer}
</section>`;
}
