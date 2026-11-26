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
		for (const h of ['1×10', '1×6', '10×10', '10×6']) expect(html).toContain(`<span class="hint">${h}</span>`);
		expect(rowCells(html, 'v-p2')[3]).toBe('<span class="hint">0</span>');
		expect(count(html, 'class="rowsum"')).toBe(2);
		expect(heads(html)).toEqual(['10', '6', '1', '10']);
	});

	it('level 2: no hints, heads filled', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 2 });
		expect(html).not.toContain('class="hint"');
		expect(heads(html)).toEqual(['10', '6', '1', '10']);
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

	it('vertical: 5 rows × 4 digit cells, 4 carry cells, operands prefilled', () => {
		const html = renderProblem({ a: 16, b: 11, position: 2, level: 2 });
		expect(count(html, 'class="d"')).toBe(20);
		expect(count(html, 'class="carry"')).toBe(4);
		expect(rowCells(html, 'v-a')).toEqual(['', '', '1', '6']);
		expect(rowCells(html, 'v-b')).toEqual(['', '', '1', '1']);
		expect(rowCells(html, 'v-sum')).toEqual(['', '', '', '']);
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
