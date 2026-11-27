import { describe, expect, it } from 'vitest';
import { loadStickers } from '../lib/episodes.js';
import { difficultyOf, validateThinkEpisode } from '../lib/think/episode.js';
import { renderThinkEpisode } from '../lib/render-page.js';
import { renderThinkAnswerKey } from '../lib/render-answers.js';
import { makeThinkEpisode } from './fixtures/think-episodes.js';

const stickerIds = new Set(loadStickers().map((s) => s.id));
const count = (html, needle) => html.split(needle).length - 1;

describe('validateThinkEpisode', () => {
	it('accepts a valid episode of each activity', () => {
		for (const id of [1, 2, 3, 4]) expect(validateThinkEpisode(makeThinkEpisode(id), stickerIds), `${id}회`).toEqual([]);
	});

	it('rejects the wrong activity, a missing puzzle, a repeated puzzle and a bad comic', () => {
		const wrong = makeThinkEpisode(1);
		wrong.activity = 'blocks';
		expect(validateThinkEpisode(wrong, stickerIds).length).toBeGreaterThan(0);
		const short = makeThinkEpisode(2);
		short.puzzles.pop();
		expect(validateThinkEpisode(short, stickerIds).length).toBeGreaterThan(0);
		const twice = makeThinkEpisode(3);
		twice.puzzles[7] = structuredClone(twice.puzzles[6]);
		expect(validateThinkEpisode(twice, stickerIds).join(' ')).toContain('같은 퍼즐');
		const comic = makeThinkEpisode(4);
		delete comic.panels[0].bubbles[0].speaker;
		expect(validateThinkEpisode(comic, stickerIds).join(' ')).toContain('말하는');
	});

	it('wants easy puzzles first', () => {
		const rev = makeThinkEpisode(1);
		rev.puzzles = [rev.puzzles[0], ...rev.puzzles.slice(1).reverse()];
		expect(validateThinkEpisode(rev, stickerIds).join(' ')).toContain('쉬운 것부터');
		const logic = makeThinkEpisode(4);
		logic.puzzles[5] = { kind: 'sudoku', grid: ['..■★', '■.●▲', '▲●.■', '★■▲.'] }; // ⑥ 빈칸 5
		logic.puzzles[7] = { kind: 'sudoku', grid: ['.▲■★', '■.●▲', '▲●.■', '★■▲.'] }; // ⑧ 빈칸 4
		expect(validateThinkEpisode(logic, stickerIds).join(' ')).toContain('쉬운 것부터');
	});

	it('measures difficulty per activity', () => {
		expect(difficultyOf('parking', { minMoves: 4 })).toEqual([4]);
		expect(difficultyOf('blocks', { heights: ['21', '10'] })).toEqual([4]);
		expect(difficultyOf('logic', { kind: 'sudoku', grid: ['.▲■★', '■.●▲', '▲●.■', '★■▲.'] })).toEqual([4]);
		expect(difficultyOf('logic', { kind: 'lineup', items: ['a', 'b', 'c'], clues: [{}, {}] })).toEqual([3, 2]);
	});
});

describe('renderThinkEpisode', () => {
	it('makes two pages with 8 puzzles, 2 on the front, in the think set colors', () => {
		for (const id of [1, 2, 3, 4]) {
			const html = renderThinkEpisode(makeThinkEpisode(id), () => null);
			expect(count(html, 'class="page ')).toBe(2);
			expect(count(html, 'think-set')).toBe(2);
			expect(count(html, '<section class="problem think-problem')).toBe(8);
			const front = html.slice(html.indexOf('class="page front'), html.indexOf('class="page back'));
			expect(count(front, '<section class="problem')).toBe(2);
			expect(html).not.toContain('러시아워');
		}
		expect(renderThinkEpisode(makeThinkEpisode(1), () => null)).toContain('주차장 탈출');
	});
});

describe('renderThinkAnswerKey', () => {
	it('puts 4 episodes on a page with the "how did you know" note', () => {
		const key = renderThinkAnswerKey([1, 2, 3, 4, 1].map(makeThinkEpisode));
		expect(count(key, 'class="page answers think-set"')).toBe(2);
		expect(key).toContain("'어떻게 알았어?'");
		expect(key).toContain('생각 퍼즐 정답 (아빠용)');
		expect(count(key, 'class="ans"')).toBe(5 * 8);
	});
});
