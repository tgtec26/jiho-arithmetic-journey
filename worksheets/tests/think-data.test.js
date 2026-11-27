import { describe, expect, it } from 'vitest';
import { loadEpisodes, loadStickers } from '../lib/episodes.js';
import { THINK_DIR, validateThinkEpisode } from '../lib/think/episode.js';
import { countingAnswer } from '../lib/think/counting.js';

const stickerIds = new Set(loadStickers().map((s) => s.id));

describe('thinking puzzle episodes 1–24', () => {
	const eps = loadEpisodes(THINK_DIR);

	it('has 24 episodes that pass every check', () => {
		expect(eps.map((e) => e.id)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
		for (const ep of eps) expect(validateThinkEpisode(ep, stickerIds), `${ep.id}회`).toEqual([]);
	});

	it('never repeats a puzzle across the 24 episodes and never names the product', () => {
		const keys = eps.flatMap((e) => e.puzzles.map((p) => JSON.stringify(p)));
		expect(new Set(keys).size).toBe(keys.length);
		expect(JSON.stringify(eps)).not.toContain('러시아워');
	});

	it('keeps the story puzzle the same as the comic', () => {
		const ep = (id) => eps.find((e) => e.id === id);
		const story = (id) => ep(id).puzzles[0];
		const said = (id) => ep(id).panels.flatMap((p) => p.bubbles.map((b) => b.text)).join(' ');
		expect(countingAnswer(story(3))).toBe(4); // 간식 2가지 × 그릇 2개
		expect(said(3)).toContain('2가지');
		expect(story(11).left).toHaveLength(3); // 셔츠 3벌
		expect(story(11).right).toHaveLength(2); // 바지 2벌
		expect(story(15).items.map((i) => i.name)).toEqual(['빨간 칸', '파란 칸', '노란 칸']);
		expect(story(23)).toMatchObject({ kind: 'paths', to: '축구장' });
		expect(story(4).items).toEqual(['지호', '아빠', '감돌이']);
		expect(story(16).items).toEqual(['버스', '트럭', '택시', '빨간 차']);
		expect(story(24).items).toHaveLength(5);
		for (const id of [2, 6, 10, 14, 18, 22]) expect(story(id).ask).toContain('count'); // "블록은 모두 몇 개일까?"
		for (const id of [18, 22]) expect(story(id).ask).toContain('topNumbers'); // 만화: "위에서 본 모양에 층수를 써 볼까?"
	});
});
