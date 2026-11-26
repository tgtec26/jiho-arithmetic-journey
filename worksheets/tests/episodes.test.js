import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../lib/html.js';
import { loadEpisodes, loadStickers, practiceOf, validateEpisode } from '../lib/episodes.js';

const stickerIds = new Set(loadStickers().map((s) => s.id));
const clone = (o) => JSON.parse(JSON.stringify(o));

describe('escapeHtml', () => {
	it('escapes markup', () => {
		expect(escapeHtml('<b>&')).toBe('&lt;b&gt;&amp;');
		expect(escapeHtml('"x"')).toBe('&quot;x&quot;');
	});
});

describe('validateEpisode', () => {
	const [ep01] = loadEpisodes();

	it('accepts episode 1', () => {
		expect(ep01.id).toBe(1);
		expect(validateEpisode(ep01, stickerIds)).toEqual([]);
	});

	it('rejects 3 panels', () => {
		const ep = clone(ep01);
		ep.panels.pop();
		expect(validateEpisode(ep, stickerIds).length).toBeGreaterThan(0);
	});

	it('rejects a 41-character bubble', () => {
		const ep = clone(ep01);
		ep.panels[0].bubbles[0].text = '가'.repeat(41);
		expect(validateEpisode(ep, stickerIds).length).toBeGreaterThan(0);
	});

	it('rejects a last panel without a question', () => {
		const ep = clone(ep01);
		const last = ep.panels[3].bubbles;
		last[last.length - 1].text = '모두 몇 명일까.';
		expect(validateEpisode(ep, stickerIds).length).toBeGreaterThan(0);
	});

	it('rejects a speaker that is not in the same panel', () => {
		const ep = clone(ep01);
		ep.panels[0].bubbles[0].speaker = 'sarang-curious';
		expect(validateEpisode(ep, stickerIds).join(' ')).toContain('말하는');
	});

	it('every bubble with a tail names its speaker', () => {
		for (const ep of loadEpisodes()) {
			for (const p of ep.panels) for (const b of p.bubbles) {
				if (b.tail !== 'none') expect(b.speaker, `${ep.id}회 "${b.text}"`).toBeTruthy();
			}
		}
	});

	it('rejects an unknown sticker id', () => {
		const ep = clone(ep01);
		ep.panels[0].stickers[0].id = 'nope-unknown';
		expect(validateEpisode(ep, stickerIds).length).toBeGreaterThan(0);
	});

	it('rejects a practice override that breaks stage rules', () => {
		const ep = clone(ep01);
		ep.practice = [12, 13, 14, 15, 16, 17, 21]; // 16×17 → 6×7 (단계 1 금지)
		expect(validateEpisode(ep, stickerIds).length).toBeGreaterThan(0);
	});

	it('practiceOf uses override when given', () => {
		const ep = clone(ep01);
		ep.practice = [12, 13, 14, 15, 21, 22, 23];
		expect(practiceOf(ep)).toEqual([12, 13, 14, 15, 21, 22, 23]);
	});
});

describe('episode wording', () => {
	it('episode 4 asks about one day of practice, not an open-ended total', () => {
		const ep04 = loadEpisodes().find((e) => e.id === 4);
		const texts = ep04.panels.flatMap((p) => p.bubbles.map((b) => b.text));
		expect(texts.some((t) => t.includes('매일 12번'))).toBe(false);
		expect(texts[texts.length - 1]).toContain('오늘');
	});
});

describe('all episodes', () => {
	it('every episode file is valid and ids are unique', () => {
		const eps = loadEpisodes();
		expect(new Set(eps.map((e) => e.id)).size).toBe(eps.length);
		for (const ep of eps) expect(validateEpisode(ep, stickerIds)).toEqual([]);
	});
});
