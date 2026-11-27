import { escapeHtml } from './html.js';
import { analyze } from './numbers.js';
import { analyzeDiv } from './division.js';
import { divPracticeOf, practiceOf } from './episodes.js';

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

/** A4 한 쪽에 6회씩 */
function paginate(episodes, blockOf, setClass = '') {
	const pages = [];
	for (let i = 0; i < episodes.length; i += PER_PAGE) {
		const blocks = episodes.slice(i, i + PER_PAGE).map(blockOf).join('');
		pages.push(`<div class="page answers${setClass}"><header class="phead"><span class="title">정답 (아빠용)</span></header>${blocks}</div>`);
	}
	return pages.join('');
}

/** 곱셈 정답지 */
export function renderAnswerKey(episodes) {
	return paginate(episodes, block);
}

/** 나눗셈 정답지 */
export function renderDivAnswerKey(episodes) {
	return paginate(episodes, divBlock, ' div-set');
}
