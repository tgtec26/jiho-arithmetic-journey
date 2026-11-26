import { describe, expect, it } from 'vitest';
import { loadEpisodes } from '../lib/episodes.js';
import { renderComic } from '../lib/render-comic.js';
import { renderEpisode, wrapDocument } from '../lib/render-page.js';

const count = (html, needle) => html.split(needle).length - 1;
const [ep01] = loadEpisodes();

describe('renderEpisode', () => {
	const html = renderEpisode(ep01, () => null);

	it('makes exactly two pages with 8 problems, 2 on the front', () => {
		expect(count(html, 'class="page ')).toBe(2);
		expect(count(html, '<section class="problem')).toBe(8);
		const front = html.slice(html.indexOf('class="page front"'), html.indexOf('class="page back"'));
		expect(count(front, '<section class="problem')).toBe(2);
		expect(front).toContain('1회');
		expect(front).toContain('월드컵 16강');
	});

	it('has 4 comic panels and placeholders for missing stickers', () => {
		expect(count(html, 'class="panel"')).toBe(4);
		expect(html).toContain('sticker missing');
	});

	it('uses the sticker path when the file exists', () => {
		const withArt = renderEpisode(ep01, (id) => `../../assets/stickers/${id}.png`);
		expect(withArt).toContain('src="../../assets/stickers/jiho-cheering.png"');
		expect(withArt).not.toContain('sticker missing');
	});
});

describe('renderComic', () => {
	it('escapes bubble text', () => {
		const panels = [{ stickers: [], bubbles: [{ text: '<b>안녕?', x: 0, y: 0, w: 50, tail: 'bl' }] }];
		const html = renderComic(panels, () => null);
		expect(html).toContain('&lt;b&gt;안녕?');
		expect(html).not.toContain('<b>안녕');
	});
});

describe('renderComic sizing', () => {
	it('sizes by height when h is given, mirrors when flip', () => {
		const panels = [{ stickers: [{ id: 'a', x: 1, y: 2, h: 60, flip: true }], bubbles: [] }];
		const html = renderComic(panels, () => 'a.png');
		expect(html).toContain('height:60%');
		expect(html).toContain('scaleX(-1)');
		expect(html).not.toContain('width:');
	});
});

describe('wrapDocument', () => {
	it('links the stylesheet', () => {
		expect(wrapDocument('<div></div>', '../../styles/worksheet.css')).toContain(
			'<link rel="stylesheet" href="../../styles/worksheet.css">'
		);
	});
});
