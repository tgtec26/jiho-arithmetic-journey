import { describe, expect, it } from 'vitest';
import { renderProblem } from '../lib/render-problem.js';

const count = (html, needle) => html.split(needle).length - 1;
const rowCells = (html, rowClass) => {
	const row = html.match(new RegExp(`<tr class="${rowClass}">([\\s\\S]*?)</tr>`))[1];
	return [...row.matchAll(/<td class="d">([\s\S]*?)<\/td>/g)].map((m) => m[1]);
};
const heads = (html) => [...html.matchAll(/data-role="head"[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1]);

describe('renderProblem', () => {
	it('level 1: gray hints, gray 0, two row sums', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 1 });
		const hints = [...html.matchAll(/<span class="hint">(\d+×\d+)<\/span>/g)].map((m) => m[1]);
		expect(hints).toEqual(['1×6', '1×10', '10×6', '10×10']); // 왼쪽 위부터 계산 순서
		expect(rowCells(html, 'v-p2')[3]).toBe('<span class="hint">0</span>');
		expect(count(html, 'class="rowsum"')).toBe(2);
		expect(heads(html)).toEqual(['6', '10', '1', '10']);
	});

	it('level 2: no hints, heads filled', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 2 });
		expect(html).not.toContain('class="hint"');
		expect(heads(html)).toEqual(['6', '10', '1', '10']);
		expect(count(html, 'class="rowsum"')).toBe(2);
	});

	it('level 3: heads empty, row sums kept', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 3 });
		expect(heads(html)).toEqual(['', '', '', '']);
		expect(count(html, 'class="rowsum"')).toBe(2);
	});

	it('level 4: small grid, no row sums', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 4 });
		expect(html).toContain('grid small');
		expect(html).not.toContain('rowsum');
		expect(heads(html)).toEqual(['', '', '', '']);
	});

	it('vertical: 5 rows × 4 digit cells, no carry cells, operands prefilled', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 2 });
		expect(count(html, 'class="d"')).toBe(20);
		expect(html).not.toContain('class="carry"');
		expect(rowCells(html, 'v-a')).toEqual(['', '', '1', '6']);
		expect(rowCells(html, 'v-b')).toEqual(['', '', '1', '1']);
		expect(rowCells(html, 'v-sum')).toEqual(['', '', '', '']);
	});

	it('blank gaps (no cells) separate the operands, partial products and sum', () => {
		const html = renderProblem({ a: 16, b: 13, position: 3, level: 2 });
		const order = [...html.matchAll(/<tr class="(v-[a-z0-9]+)">/g)].map((m) => m[1]);
		expect(order).toEqual(['v-a', 'v-b', 'v-gap', 'v-p1', 'v-p2', 'v-gap', 'v-sum']);
		const gaps = [...html.matchAll(/<tr class="v-gap">([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
		for (const g of gaps) expect(g).not.toContain('class="d"');
	});

	it('15 × 88 still fits 4 columns', () => {
		const html = renderProblem({ a: 15, b: 88, position: 5, level: 3 });
		expect(count(html, 'class="d"')).toBe(20);
		expect(html).toContain('15 × 88');
	});

	it('story problem has an answer line with unit and a star', () => {
		const story = renderProblem({ a: 16, b: 11, position: 1, level: 1, unit: '명' });
		expect(story).toContain('답:');
		expect(story).toContain('명');
		expect(story).toContain('problem story');
		expect(story).toContain('data-pos="1"');
		const plain = renderProblem({ a: 16, b: 12, position: 2, level: 1 });
		expect(plain).not.toContain('답:');
		expect(plain).toContain('②');
	});
});
