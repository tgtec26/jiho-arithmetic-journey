// 경우의 수 그림: 항목 칩, 짝 짓기 점, 늘어놓을 빈칸, 길 찾기 격자, 정답.
import { escapeHtml } from '../html.js';
import { circled } from './common.js';
import { countingAnswer, listCases, slotsFor } from './counting.js';

/** 항목 하나: 색 점 또는 작은 스티커 + 이름 */
function chip(item, stickerSrc) {
	const src = item.sticker ? stickerSrc(item.sticker) : null;
	const mark = src
		? `<img src="${src}" alt="">`
		: `<i class="dot" style="background:${escapeHtml(item.color ?? '#ddd')}"></i>`;
	return `<span class="chip">${mark}<span>${escapeHtml(item.name)}</span></span>`;
}

/** 격자 (w칸 × h칸), 왼쪽 아래 = 집, 오른쪽 위 = 도착지(기본 학원) */
function grid(w, h, cell, cls, labels = false, to = '학원') {
	const lines = [];
	for (let i = 0; i <= w; i++) lines.push(`<line x1="${i * cell}" y1="0" x2="${i * cell}" y2="${h * cell}"/>`);
	for (let j = 0; j <= h; j++) lines.push(`<line x1="0" y1="${j * cell}" x2="${w * cell}" y2="${j * cell}"/>`);
	const pad = labels ? 7 : 1.5;
	const marks = labels
		? `<circle cx="0" cy="${h * cell}" r="1.4"/><circle cx="${w * cell}" cy="0" r="1.4"/><text x="-1" y="${h * cell + 5}">집</text><text x="${w * cell + 1.5}" y="-2.5" text-anchor="end">${escapeHtml(to)}</text>`
		: `<circle cx="0" cy="${h * cell}" r="0.8"/><circle cx="${w * cell}" cy="0" r="0.8"/>`;
	const W = w * cell + pad * 2;
	const H = h * cell + pad * 2;
	return `<svg class="${cls}" width="${W}mm" height="${H}mm" viewBox="${-pad} ${-pad} ${W} ${H}">${lines.join('')}${marks}</svg>`;
}

function listing(n, pick, round) {
	if (n === 0) return `<div class="free"></div>`;
	const rows = Array.from({ length: n }, () => `<div class="slot-row">${'<span class="slot"></span>'.repeat(pick)}</div>`).join('');
	const note = round >= 3 ? `<div class="note">남는 칸이 있어도 돼요</div>` : '';
	return `<div class="slots">${rows}</div>${note}`;
}

function body(p, round, stickerSrc) {
	if (p.kind === 'pairs') {
		const col = (items, side) =>
			`<div class="pcol ${side}">${items.map((it) => `<div class="prow">${side === 'r' ? '<b class="link"></b>' : ''}${chip(it, stickerSrc)}${side === 'l' ? '<b class="link"></b>' : ''}</div>`).join('')}</div>`;
		return `<div class="pairs">${col(p.left, 'l')}${col(p.right, 'r')}</div>`;
	}
	if (p.kind === 'paths') {
		const n = slotsFor(p, round);
		const minis = Array.from({ length: n }, () => grid(p.w, p.h, 3.4, 'mini-grid')).join('');
		const note = round >= 3 ? `<div class="note">남는 격자가 있어도 돼요</div>` : '';
		return `<div class="paths">${grid(p.w, p.h, 8, 'big-grid', true, p.to)}<div class="minis">${minis}</div></div>${note}`;
	}
	const legend = `<div class="legend">${p.items.map((it) => chip(it, stickerSrc)).join('')}</div>`;
	return legend + listing(slotsFor(p, round), p.pick, round);
}

/**
 * 경우의 수 문제 칸
 * @param {{ puzzle: any, position: number, round: number, stickerSrc: (id: string) => string | null }} p
 */
export function renderCountingProblem({ puzzle, position, round, stickerSrc }) {
	const isStory = position === 1;
	return `
<section class="problem think-problem counting kind-${puzzle.kind}${isStory ? ' story' : ''}" data-pos="${position}">
  <div class="ptitle"><span class="num">${circled(position)}</span> 경우의 수${isStory ? ' <span class="star">⭐ 이야기 문제</span>' : ''}</div>
  <div class="qtext">${escapeHtml(puzzle.text)}</div>
  <div class="pbody">${body(puzzle, round, stickerSrc)}</div>
  <div class="answer">모두 <span class="blank"></span>가지</div>
</section>`;
}

const STEP = { R: '→', U: '↑' };

/** 정답지: '6가지 (빨-검, 빨-흰, …)' — 6가지 이하면 목록까지 */
export function countingAnswerText(p) {
	const n = countingAnswer(p);
	if (n > 6) return `${n}가지`;
	const cases = listCases(p).map((c) => (p.kind === 'paths' ? c.map((s) => STEP[s]).join('') : c.join('-')));
	return `${n}가지 (${cases.join(', ')})`;
}
