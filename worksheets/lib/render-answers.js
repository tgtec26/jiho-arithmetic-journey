import { escapeHtml } from './html.js';
import { analyze } from './numbers.js';
import { analyzeDiv } from './division.js';
import { divPracticeOf, practiceOf } from './episodes.js';
import { thinkAnswerLines } from './think/episode.js';

const PER_PAGE = 6;
const circled = (n) => String.fromCharCode(0x2460 + n - 1);

function block(ep) {
	const others = [ep.story.other, ...practiceOf(ep)];
	const lines = others
		.map((b, i) => {
			const r = analyze(ep.fixed, b);
			const unit = i === 0 ? ` <b>(${r.answer}${escapeHtml(ep.story.unit)})</b>` : '';
			return `<div class="ans">${circled(i + 1)} <b>${ep.fixed} × ${b} = ${r.answer}</b>${unit} <span class="sub">${r.onesRow} + ${r.tensRow}</span></div>`;
		})
		.join('');
	return section(ep, lines);
}

function divBlock(ep) {
	const dividends = [ep.story.dividend, ...divPracticeOf(ep)];
	const lines = dividends
		.map((n, i) => {
			const r = analyzeDiv(n, ep.divisor);
			const result = r.remainder ? `${r.quotient} … ${r.remainder}` : `${r.quotient}`;
			const rest = r.remainder ? `, ${r.remainder}${escapeHtml(ep.story.restUnit ?? '')}` : '';
			const unit = i === 0 ? ` <b>(${r.quotient}${escapeHtml(ep.story.unit)}${rest})</b>` : '';
			return `<div class="ans">${circled(i + 1)} <b>${n} ÷ ${ep.divisor} = ${result}</b>${unit} <span class="sub">${r.firstPart} + ${r.secondPart}</span></div>`;
		})
		.join('');
	return section(ep, lines);
}

function section(ep, lines) {
	return `<section class="ans-block"><h3>${ep.id}회 · ${escapeHtml(ep.title)}</h3><div class="ans-grid">${lines}</div></section>`;
}

/** A4 한 쪽에 perPage회씩 (note가 있으면 머리줄 아래 한 줄) */
function paginate(episodes, blockOf, title, setClass = '', perPage = PER_PAGE, note = '') {
	const pages = [];
	const noteHtml = note ? `<p class="ans-note">${note}</p>` : ''; // 코드에 적힌 문구만 받음
	for (let i = 0; i < episodes.length; i += perPage) {
		const blocks = episodes.slice(i, i + perPage).map(blockOf).join('');
		pages.push(`<div class="page answers${setClass}"><header class="phead"><span class="title">${title}</span></header>${noteHtml}${blocks}</div>`);
	}
	return pages.join('');
}

/** 곱셈 정답지 */
export function renderAnswerKey(episodes) {
	return paginate(episodes, block, '정답 (아빠용)');
}

/** 나눗셈 정답지 */
export function renderDivAnswerKey(episodes) {
	return paginate(episodes, divBlock, '나눗셈 정답 (아빠용)', ' div-set');
}

/** 생각 퍼즐 정답지 (작은 그림이 있어 쪽당 4회) */
export function renderThinkAnswerKey(episodes) {
	const note = "답을 맞히면 '어떻게 알았어?' 하고 물어봐 주세요.";
	return paginate(episodes, (ep) => section(ep, thinkAnswerLines(ep)), '생각 퍼즐 정답 (아빠용)', ' think-set', 4, note);
}
