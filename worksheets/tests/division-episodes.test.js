import { describe, expect, it } from 'vitest';
import { DIVISION_DIR, divPracticeOf, loadEpisodes, loadStickers, validateDivEpisode } from '../lib/episodes.js';
import { renderDivEpisode } from '../lib/render-page.js';
import { renderDivAnswerKey } from '../lib/render-answers.js';
import { DIV_EPISODE_TABLE } from './fixtures/division-table.js';

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
	ep.practice = null; // 1회 연습 목록(÷2) 대신 규칙대로 고른다
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

	it('rejects a written practice list that is not easy-to-hard', () => {
		const ep = clone(ep01);
		ep.practice = [...divPracticeOf(ep01)].reverse();
		expect(validateDivEpisode(ep, stickerIds).join(' ')).toContain('순서');
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

describe('division episodes 1–24', () => {
	const episodes = loadEpisodes(DIVISION_DIR);

	it('has 24 episodes that pass every check', () => {
		expect(episodes.map((e) => e.id)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
		for (const ep of episodes) expect(validateDivEpisode(ep, stickerIds), `${ep.id}회`).toEqual([]);
	});

	// ÷4는 7~14회 규칙에 맞는 수가 13개뿐이라 ÷4 세 회(6·7·13회, 24칸)는 겹침 합이 11 이상, 한 쌍 최대 4가 최선이다
	it('keeps episodes with the same divisor mostly different (at most 4 of 8 problems shared)', () => {
		const all = (ep) => [ep.story.dividend, ...divPracticeOf(ep)];
		for (const a of episodes) for (const b of episodes) {
			if (a.id >= b.id || a.divisor !== b.divisor) continue;
			const shared = all(a).filter((n) => all(b).includes(n));
			expect(shared.length, `${a.id}회·${b.id}회 ÷${a.divisor}: ${shared.join(' ')}`).toBeLessThanOrEqual(4);
		}
	});

	it('says clearly how many share, so the story matches the divisor', () => {
		const text = (id) => episodes.find((e) => e.id === id).panels.flatMap((p) => p.bubbles.map((b) => b.text)).join(' ');
		expect(text(17)).toContain('6명에게');
		expect(text(17)).not.toContain('곧 시작');
		expect(text(20)).toContain('나까지 8명');
		expect(text(24)).toContain('5명에게');
		expect(text(22)).not.toContain('몇 대, 몇 대');
	});

	it.each(DIV_EPISODE_TABLE)('episode %i uses ÷ %i with story number %i', (id, d, n) => {
		const ep = episodes.find((e) => e.id === id);
		expect([ep.divisor, ep.story.dividend]).toEqual([d, n]);
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
		expect(html).toContain('나눗셈 정답 (아빠용)');
	});
});
