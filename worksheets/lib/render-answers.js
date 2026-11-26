import { escapeHtml } from './html.js';
import { analyze } from './numbers.js';
import { practiceOf } from './episodes.js';

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
	return `<section class="ans-block"><h3>${ep.id}회 · ${escapeHtml(ep.title)}</h3><div class="ans-grid">${lines}</div></section>`;
}

/** 아빠용 정답지 (A4 한 쪽에 6회) */
export function renderAnswerKey(episodes) {
	const pages = [];
	for (let i = 0; i < episodes.length; i += PER_PAGE) {
		const blocks = episodes.slice(i, i + PER_PAGE).map(block).join('');
		pages.push(`<div class="page answers"><header class="phead"><span class="title">정답 (아빠용)</span></header>${blocks}</div>`);
	}
	return pages.join('');
}
