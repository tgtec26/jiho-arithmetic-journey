import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/episodes.js';
import { OUTFIT_COLORS, OUTFIT_SIZES, checkCountingPuzzle, countingAnswer, generateOutfit, listCases, listOutfits, slotsFor } from '../lib/think/counting.js';
import { makeRng } from '../lib/think/common.js';
import { countingAnswerText, renderCountingProblem } from '../lib/think/render-counting.js';

const c = (name) => ({ name });
const count = (html, needle) => html.split(needle).length - 1;
const shirts = { kind: 'pairs', text: '셔츠와 바지를 하나씩 골라 입는 방법은?', left: [c('빨'), c('파'), c('노')], right: [c('검'), c('흰')] };
const ord = { kind: 'order', text: '기차 칸 세 개를 잇는 순서는?', items: [c('a'), c('b'), c('c')], pick: 3 };
const noSticker = () => null;

describe('countingAnswer (by listing every case)', () => {
	it('counts pairs, orders, choices and shortest paths', () => {
		expect(countingAnswer(shirts)).toBe(6);
		expect(countingAnswer(ord)).toBe(6);
		expect(countingAnswer({ kind: 'order', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 2 })).toBe(12);
		expect(countingAnswer({ kind: 'choose', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 2 })).toBe(6);
		expect(countingAnswer({ kind: 'paths', text: 't', w: 2, h: 2 })).toBe(6);
		expect(countingAnswer({ kind: 'paths', text: 't', w: 3, h: 2 })).toBe(10);
		expect(listCases(shirts)[0]).toEqual(['빨', '검']);
	});
});

describe('slotsFor', () => {
	it('gives exactly as many slots early, more than the answer later, none at the end', () => {
		expect(slotsFor(ord, 1)).toBe(6);
		expect(slotsFor(ord, 3)).toBe(8); // 6 + 2 + 0
		expect(slotsFor({ kind: 'order', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 2 }, 4)).toBe(12 + 2 + 0);
		expect(slotsFor({ kind: 'choose', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 2 }, 4)).toBe(8);
		expect(slotsFor(ord, 5)).toBe(0);
		expect(slotsFor({ kind: 'paths', text: 't', w: 2, h: 2 }, 6)).toBe(8); // 길은 격자가 있어야 그림
		expect(slotsFor(shirts, 1)).toBe(0); // 선 긋기
	});

	it('never shows exactly the answer from round 3', () => {
		const items = (n) => Array.from({ length: n }, (_, i) => c(String(i)));
		const puzzles = [
			...[3, 4, 5].map((n) => ({ kind: 'choose', text: 't', items: items(n), pick: 2 })),
			...[3, 4].map((n) => ({ kind: 'order', text: 't', items: items(n), pick: 2 })),
			...[[1, 2], [2, 2], [3, 2], [1, 4]].map(([w, h]) => ({ kind: 'paths', text: 't', w, h }))
		];
		for (const p of puzzles) for (const round of [3, 4]) expect(slotsFor(p, round)).toBeGreaterThan(countingAnswer(p));
	});
});

describe('checkCountingPuzzle', () => {
	it('accepts allowed kinds and sizes and rejects the rest', () => {
		expect(checkCountingPuzzle(shirts, 1)).toEqual([]);
		expect(checkCountingPuzzle({ kind: 'choose', text: 't', items: [c('a'), c('b'), c('c')], pick: 2 }, 1).length).toBeGreaterThan(0);
		expect(checkCountingPuzzle({ kind: 'order', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 4 }, 6).length).toBeGreaterThan(0); // 24 > 12
		expect(checkCountingPuzzle({ ...ord, text: '' }, 1).length).toBeGreaterThan(0);
		expect(checkCountingPuzzle({ ...ord, items: [c('a'), c('a'), c('b')] }, 1).length).toBeGreaterThan(0);
	});
});

describe('counting drawing', () => {
	it('draws the listing rows from slotsFor and asks for the total', () => {
		const html = renderCountingProblem({ puzzle: ord, position: 3, round: 3, stickerSrc: noSticker });
		expect(html).toContain('problem think-problem counting');
		expect(count(html, 'class="slot-row"')).toBe(8);
		expect(html).toContain('남는 칸이 있어도 돼요');
		expect(html).toContain('모두');
		expect(html).toContain('기차 칸 세 개를 잇는 순서는?');
	});

	it('draws pairs to connect, small grids for paths, and stickers when given', () => {
		const pairs = renderCountingProblem({ puzzle: shirts, position: 1, round: 1, stickerSrc: noSticker });
		expect(count(pairs, 'class="chip"')).toBe(5);
		expect(pairs).toContain('⭐');
		const paths = renderCountingProblem({ puzzle: { kind: 'paths', text: 't', w: 2, h: 2 }, position: 4, round: 5, stickerSrc: noSticker });
		expect(count(paths, 'class="mini-grid"')).toBe(8);
		const people = { kind: 'order', text: 't', items: [{ name: '지호', sticker: 'jiho-happy' }, c('아빠'), c('곰')], pick: 3 };
		expect(renderCountingProblem({ puzzle: people, position: 2, round: 1, stickerSrc: (id) => `s/${id}.png` })).toContain('src="s/jiho-happy.png"');
	});

	it('keeps the box itself free of the inner layout classes (pairs, paths)', () => {
		for (const puzzle of [shirts, { kind: 'paths', text: 't', w: 2, h: 2 }]) {
			const html = renderCountingProblem({ puzzle, position: 2, round: 3, stickerSrc: noSticker });
			const cls = html.match(/<section class="([^"]+)"/)[1].split(' ');
			expect(cls).not.toContain('pairs');
			expect(cls).not.toContain('paths');
		}
	});

	it('keeps the big path grid at full size next to the practice grids', () => {
		const css = readFileSync(join(ROOT, 'styles', 'worksheet.css'), 'utf8');
		const rule = css.slice(css.indexOf('.paths .big-grid {'), css.indexOf('}', css.indexOf('.paths .big-grid {')));
		expect(rule).toContain('flex: none');
		const html = renderCountingProblem({ puzzle: { kind: 'paths', text: 't', w: 3, h: 2 }, position: 2, round: 3, stickerSrc: noSticker });
		expect(html).toContain('class="big-grid" width="27mm" height="21mm"'); // 6mm 칸 + 여백 4.5mm
	});

	it('labels the shortest-path goal with the place in the story', () => {
		const park = renderCountingProblem({ puzzle: { kind: 'paths', text: '집에서 공원까지', w: 2, h: 2, to: '공원' }, position: 3, round: 3, stickerSrc: noSticker });
		expect(park).toContain('>공원<');
		expect(park).not.toContain('>학원<');
		expect(renderCountingProblem({ puzzle: { kind: 'paths', text: 't', w: 2, h: 2 }, position: 3, round: 3, stickerSrc: noSticker })).toContain('>학원<');
		expect(checkCountingPuzzle({ kind: 'paths', text: 't', w: 2, h: 2, to: '축구장' }, 3)).toEqual([]);
	});

	it('writes the total, with the list when it is short', () => {
		expect(countingAnswerText(shirts)).toBe('6가지 (빨-검, 빨-흰, 파-검, 파-흰, 노-검, 노-흰)');
		expect(countingAnswerText({ kind: 'paths', text: 't', w: 3, h: 2 })).toBe('10가지');
	});
});

describe('옷 조합 (태블릿 옷가게)', () => {
	it('셔츠 × 바지 (× 모자) 모든 조합을 차례대로', () => {
		expect(listOutfits({ shirt: ['red', 'blue'], pants: ['navy', 'gray', 'pink'] })).toHaveLength(6);
		const three = listOutfits({ shirt: ['red', 'blue'], pants: ['navy', 'gray'], hat: ['orange', 'teal'] });
		expect(three).toHaveLength(8);
		expect(three.slice(0, 2)).toEqual([
			['red', 'navy', 'orange'],
			['red', 'navy', 'teal']
		]);
	});
	it('단계 크기·팔레트 색·겹치지 않음', () => {
		for (let stage = 1; stage <= 5; stage++) {
			const rng = makeRng(stage);
			const used = new Set();
			for (let k = 0; k < 12; k++) {
				const p = generateOutfit(rng, stage, used);
				used.add(JSON.stringify(p));
				const sizes = [p.shirt.length, p.pants.length, ...(p.hat ? [p.hat.length] : [])];
				expect(OUTFIT_SIZES[stage]).toContainEqual(sizes);
				for (const part of ['shirt', 'pants', 'hat']) {
					const list = p[part] ?? [];
					list.forEach((c) => expect(OUTFIT_COLORS[part]).toContain(c));
					expect(list).toEqual(OUTFIT_COLORS[part].filter((c) => list.includes(c)));
				}
			}
			expect(used.size).toBe(12);
		}
	});
});
