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

	it('keeps narration boxes (no speaker) at their spot, sized to the text on one line', () => {
		const panels = [{ stickers: [], bubbles: [{ text: '이야기', x: 3, y: 3, w: 40, tail: 'none' }] }];
		const html = renderComic(panels, () => null);
		expect(html).toContain('bubble tail-none narration');
		expect(style(html)).toBe('left:3%;top:3%');
	});

	it('narrows bubbles when two speakers share a panel', () => {
		const panels = [
			{
				stickers: [{ id: 'a', x: 6, y: 40, h: 56 }, { id: 'b', x: 60, y: 54, h: 43 }],
				bubbles: [{ text: '하나', speaker: 'a' }, { text: '둘', speaker: 'b' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', () => 0.6);
		expect(html.split('max-width:46%').length - 1).toBe(2);
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

	it('lifts a bubble above a taller character it would otherwise cover', () => {
		const panels = [
			{
				stickers: [{ id: 'jiho-thinking', x: 8, y: 40, h: 58 }, { id: 'sarang-curious', x: 62, y: 58, h: 39 }],
				bubbles: [{ text: '그럼 16강에서 뛰는 선수는 모두 몇 명일까?', speaker: 'sarang-curious' }]
			}
		];
		const html = renderComic(panels, () => 'x.png', (id) => (id.startsWith('jiho') ? 0.45 : 0.8));
		expect(html).toContain('bottom:64%'); // 지호 머리(40%) 위로
	});

	it('never rises into the narration box at the top', () => {
		const panels = [
			{
				stickers: [{ id: 'guest-soccer9', x: 27, y: 20, h: 76 }, { id: 'jiho-pointing', x: 64, y: 46, h: 52 }],
				bubbles: [
					{ text: '축구 한 팀은 11명이에요.', x: 2, y: 3, tail: 'none' },
					{ text: '손흥민 선수랑 홀란 선수도 나와요!', speaker: 'jiho-pointing' }
				]
			}
		];
		const html = renderComic(panels, () => 'x.png', () => 0.5);
		const bottom = Number(html.match(/anchored" style="[^"]*bottom:([\d.]+)%/)[1]);
		// 해설 상자(위 3% + 한 줄 11.7%) + 간격 2% 아래에 두 줄 말풍선(19.3%)
		expect(bottom).toBeLessThanOrEqual(64.1);
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
