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
		expect(html).not.toContain('pnum'); // 컷 번호는 넣지 않음
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
		const panels = [{ stickers: [{ id: 'a', x: 10, y: 40, h: 50 }], bubbles: [{ text: '<b>안녕?', speaker: 'a' }] }];
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

describe('speaker-anchored bubbles', () => {
	const style = (html) => html.match(/class="bubble[^"]*" style="([^"]*)"/)[1];

	it('sits a fixed gap above a left-side speaker head, tail pointing at the speaker', () => {
		const panels = [{ stickers: [{ id: 'a', x: 10, y: 40, h: 50 }], bubbles: [{ text: '안녕?', speaker: 'a' }] }];
		const html = renderComic(panels, () => 'a.png', () => 0.5);
		expect(html).toContain('bubble tail-l');
		const s = style(html);
		expect(s).toContain('bottom:64%'); // 100 - 40 + 4
		expect(s).toContain('left:9.5%'); // 중심 21.5% - 12%
		expect(s).toContain('--tail:11.3mm');
	});

	it('anchors to the right edge for a right-side speaker', () => {
		const panels = [{ stickers: [{ id: 'b', x: 60, y: 55, h: 40 }], bubbles: [{ text: '나도!', speaker: 'b' }] }];
		const html = renderComic(panels, () => 'b.png', () => 0.9);
		expect(html).toContain('bubble tail-r');
		const s = style(html);
		expect(s).toContain('bottom:49%');
		expect(s).toMatch(/right:11\.\d%/);
		expect(s).toContain('--tail:11.3mm');
	});

	it('narrows bubbles when two speakers share a panel', () => {
		const panels = [
			{
				stickers: [{ id: 'a', x: 6, y: 40, h: 56 }, { id: 'b', x: 60, y: 54, h: 43 }],
				bubbles: [{ text: '하나', speaker: 'a' }, { text: '둘', speaker: 'b' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', () => 0.6);
		const widths = [...html.matchAll(/max-width:([\d.]+)%/g)].map((m) => Number(m[1]));
		expect(widths).toHaveLength(2);
		for (const w of widths) expect(w).toBeLessThanOrEqual(46);
	});

	it('pushes two long bubbles to the panel edges so they do not overlap', () => {
		const panels = [
			{
				stickers: [{ id: 'a', x: 6, y: 40, h: 56 }, { id: 'b', x: 60, y: 54, h: 43 }],
				bubbles: [{ text: '우리 반 친구는 15명이에요!', speaker: 'a' }, { text: '모두 하나씩 만들자!', speaker: 'b' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', () => 0.6);
		expect(html).toContain('left:2%');
		expect(html).toContain('right:2%');
	});

	it('narrows a bubble to keep clear of a taller neighbour while staying right above the speaker', () => {
		const panels = [
			{
				stickers: [{ id: 'jiho-thinking', x: 8, y: 40, h: 58 }, { id: 'sarang-curious', x: 62, y: 58, h: 39 }],
				bubbles: [{ text: '그럼 블록은 모두 몇 개가 필요할까?', speaker: 'sarang-curious' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', (id) => (id.startsWith('jiho') ? 0.45 : 0.8));
		const style = html.match(/anchored" style="([^"]*)"/)[1];
		expect(style).toContain('bottom:46%'); // 사랑이 머리(58%) 바로 위
		const maxW = Number(style.match(/max-width:([\d.]+)%/)[1]);
		expect(maxW).toBeLessThanOrEqual(55); // 지호(8~32%) 오른쪽에서 시작
	});

	it('lifts the bubble only when there is no room beside the neighbour', () => {
		const panels = [
			{
				stickers: [{ id: 'dad-thinking', x: 30, y: 37, h: 60 }, { id: 'sarang-curious', x: 64, y: 58, h: 39 }],
				bubbles: [{ text: '그럼 블록은 모두 몇 개가 필요할까?', speaker: 'sarang-curious' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', (id) => (id.startsWith('dad') ? 1.0 : 0.8));
		expect(html).toContain('bottom:67%'); // 아빠 머리(37%) 위로
	});

	it('leaves short bubbles next to their speakers', () => {
		const panels = [
			{
				stickers: [{ id: 'a', x: 8, y: 40, h: 56 }, { id: 'b', x: 60, y: 54, h: 43 }],
				bubbles: [{ text: '좋아!', speaker: 'a' }, { text: '나도!', speaker: 'b' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', () => 0.6);
		expect(html).not.toContain('left:2%');
		expect(html).not.toContain('right:2%');
	});
});

describe('wrapDocument', () => {
	it('links the stylesheet', () => {
		expect(wrapDocument('<div></div>', '../../styles/worksheet.css')).toContain(
			'<link rel="stylesheet" href="../../styles/worksheet.css">'
		);
	});
});
