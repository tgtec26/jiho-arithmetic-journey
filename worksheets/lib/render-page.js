import { escapeHtml } from './html.js';
import { hintLevel, stageOf } from './numbers.js';
import { divPracticeOf, practiceOf } from './episodes.js';
import { renderComic } from './render-comic.js';
import { renderProblem } from './render-problem.js';
import { renderDivProblem } from './render-division.js';
import { ACTIVITY_NAMES } from './think/common.js';
import { renderThinkProblems } from './think/episode.js';

/**
 * 회차 앞뒤 2페이지 (두 세트 공통 틀)
 * @param {{ ep: any, problems: string[], backTitle: string, setClass?: string }} p
 */
function renderPages({ ep, problems, backTitle, setClass = '' }, stickerSrc, stickerAspect) {
	const title = escapeHtml(ep.title);
	const icon = `<span class="icon">${escapeHtml(ep.icon ?? '')}</span>`;
	const front = `
<div class="page front${setClass}">
  <header class="phead">
    <span class="ep">${icon}${ep.id}회</span>
    <span class="title">${title}</span>
    <span class="who">이름 <span class="line"></span> 날짜 <span class="line"></span></span>
    <span class="stamp">다 풀었어요</span>
  </header>
  ${renderComic(ep.panels, stickerSrc, stickerAspect)}
  <div class="problems front-problems">${problems.slice(0, 2).join('')}</div>
</div>`;
	const back = `
<div class="page back${setClass}">
  <header class="phead">
    <span class="ep">${icon}${ep.id}회 · 연습</span>
    <span class="title">${backTitle}</span>
  </header>
  <div class="problems back-problems">${problems.slice(2).join('')}</div>
</div>`;
	return front + back;
}

/**
 * 곱셈 회차 앞뒤 2페이지
 * @param {any} ep
 * @param {(id: string) => string | null} stickerSrc
 * @param {(id: string) => number} [stickerAspect]
 */
export function renderEpisode(ep, stickerSrc, stickerAspect) {
	const level = hintLevel(ep.id);
	const others = [ep.story.other, ...practiceOf(ep)];
	const problems = others.map((b, i) =>
		renderProblem({ a: ep.fixed, b, position: i + 1, level, unit: i === 0 ? ep.story.unit : undefined })
	);
	return renderPages({ ep, problems, backTitle: `${ep.fixed} × □` }, stickerSrc, stickerAspect);
}

/**
 * 나눗셈 회차 앞뒤 2페이지. 15회부터는 모든 문제에 나머지 칸.
 * @param {any} ep
 * @param {(id: string) => string | null} stickerSrc
 * @param {(id: string) => number} [stickerAspect]
 */
export function renderDivEpisode(ep, stickerSrc, stickerAspect) {
	const level = hintLevel(ep.id);
	const withRemainder = stageOf(ep.id) === 3;
	const dividends = [ep.story.dividend, ...divPracticeOf(ep)];
	const problems = dividends.map((n, i) =>
		renderDivProblem({
			n,
			d: ep.divisor,
			position: i + 1,
			level,
			withRemainder,
			...(i === 0 ? { unit: ep.story.unit, restUnit: ep.story.restUnit } : {})
		})
	);
	return renderPages({ ep, problems, backTitle: `□ ÷ ${ep.divisor}`, setClass: ' div-set' }, stickerSrc, stickerAspect);
}

/**
 * 생각 퍼즐 회차 앞뒤 2페이지
 * @param {any} ep
 * @param {(id: string) => string | null} stickerSrc
 * @param {(id: string) => number} [stickerAspect]
 */
export function renderThinkEpisode(ep, stickerSrc, stickerAspect) {
	const problems = renderThinkProblems(ep, stickerSrc);
	return renderPages({ ep, problems, backTitle: ACTIVITY_NAMES[ep.activity], setClass: ' think-set' }, stickerSrc, stickerAspect);
}

/** HTML 문서로 감싸기 */
export function wrapDocument(body, cssHref, title = '지호의 곱셈 이야기') {
	return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${cssHref}"></head>
<body>${body}</body></html>`;
}
