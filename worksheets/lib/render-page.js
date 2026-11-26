import { escapeHtml } from './html.js';
import { hintLevel } from './numbers.js';
import { practiceOf } from './episodes.js';
import { renderComic } from './render-comic.js';
import { renderProblem } from './render-problem.js';

/**
 * 회차 앞뒤 2페이지
 * @param {any} ep
 * @param {(id: string) => string | null} stickerSrc
 */
export function renderEpisode(ep, stickerSrc) {
	const level = hintLevel(ep.id);
	const others = [ep.story.other, ...practiceOf(ep)];
	const problems = others.map((b, i) =>
		renderProblem({ a: ep.fixed, b, position: i + 1, level, unit: i === 0 ? ep.story.unit : undefined })
	);
	const title = escapeHtml(ep.title);
	const front = `
<div class="page front">
  <header class="phead">
    <span class="ep"><span class="icon">${escapeHtml(ep.icon ?? '')}</span>${ep.id}회</span>
    <span class="title">${title}</span>
    <span class="who">이름 <span class="line"></span> 날짜 <span class="line"></span></span>
    <span class="stamp">다 풀었어요</span>
  </header>
  ${renderComic(ep.panels, stickerSrc)}
  <div class="problems front-problems">${problems.slice(0, 2).join('')}</div>
</div>`;
	const back = `
<div class="page back">
  <header class="phead">
    <span class="ep"><span class="icon">${escapeHtml(ep.icon ?? '')}</span>${ep.id}회 · 연습</span>
    <span class="title">${ep.fixed} × □</span>
  </header>
  <div class="problems back-problems">${problems.slice(2).join('')}</div>
</div>`;
	return front + back;
}

/** HTML 문서로 감싸기 */
export function wrapDocument(body, cssHref, title = '지호의 곱셈 이야기') {
	return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${cssHref}"></head>
<body>${body}</body></html>`;
}
