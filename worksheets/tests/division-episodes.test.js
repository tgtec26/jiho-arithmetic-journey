import { describe, expect, it } from 'vitest';
import { DIVISION_DIR, loadEpisodes, loadStickers, validateDivEpisode } from '../lib/episodes.js';
import { renderDivEpisode } from '../lib/render-page.js';
import { renderDivAnswerKey } from '../lib/render-answers.js';

const stickerIds = new Set(loadStickers().map((s) => s.id));
const clone = (o) => JSON.parse(JSON.stringify(o));
const count = (html, needle) => html.split(needle).length - 1;
const [ep01] = loadEpisodes(DIVISION_DIR);

/** 15회(나머지 단계)처럼 꾸민 합성 회차: 50 ÷ 3 = 16 … 2 */
function remainderEpisode() {
	const ep = clone(ep01);
	ep.id = 15;
	ep.title = '사랑이 사료';
	ep.divisor = 3;
	ep.story = { dividend: 50, unit: '번', restUnit: '알' };
	return ep;
}

describe('validateDivEpisode', () => {
	it('accepts division episode 1', () => {
		expect(ep01.divisor).toBe(2);
		expect(validateDivEpisode(ep01, stickerIds)).toEqual([]);
	});

	it('needs a unit for what is left when the story has a remainder', () => {
		const ep = remainderEpisode();
		expect(validateDivEpisode(ep, stickerIds)).toEqual([]);
		delete ep.story.restUnit;
		expect(validateDivEpisode(ep, stickerIds).join(' ')).toContain('남는 것');
	});

	it('rejects a divisor outside the stage', () => {
		const ep = clone(ep01);
		ep.divisor = 6;
		ep.story.dividend = 66;
		expect(validateDivEpisode(ep, stickerIds).length).toBeGreaterThan(0);
	});

	it('uses the same comic checks as the multiplication set', () => {
		const ep = clone(ep01);
		delete ep.panels[0].bubbles[0].speaker;
		expect(validateDivEpisode(ep, stickerIds).join(' ')).toContain('말하는');
		const ep2 = clone(ep01);
		ep2.panels[3].bubbles.at(-1).text = '몇 개일까.';
		expect(validateDivEpisode(ep2, stickerIds).join(' ')).toContain('질문');
	});
});

describe('renderDivEpisode', () => {
	const html = renderDivEpisode(ep01, () => null);

	it('makes two division pages with 8 problems, 2 on the front', () => {
		expect(count(html, 'class="page ')).toBe(2);
		expect(count(html, 'div-set')).toBe(2);
		expect(count(html, '<section class="problem div-problem')).toBe(8);
		const front = html.slice(html.indexOf('class="page front'), html.indexOf('class="page back'));
		expect(count(front, '<section class="problem')).toBe(2);
		expect(front).toContain('축구공 나누기');
		expect(html).toContain('□ ÷ 2');
	});

	it('uses remainder boxes from episode 15', () => {
		expect(html).not.toContain('…');
		expect(renderDivEpisode(remainderEpisode(), () => null)).toContain('…');
	});
});

describe('renderDivAnswerKey', () => {
	it('lists quotient, units and the split for each problem', () => {
		const html = renderDivAnswerKey([ep01, remainderEpisode()]);
		expect(html).toContain('① <b>26 ÷ 2 = 13</b> <b>(13개)</b>');
		expect(html).toContain('20 + 6');
		expect(html).toContain('50 ÷ 3 = 16 … 2');
		expect(html).toContain('(16번, 2알)');
		expect(html).toContain('30 + 20');
		expect(count(html, 'class="page answers div-set"')).toBe(1);
	});
});
