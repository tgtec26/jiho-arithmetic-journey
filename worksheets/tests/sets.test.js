import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/episodes.js';
import { setOf } from '../lib/sets.js';

describe('setOf', () => {
	it('defaults to the multiplication set with its original folders', () => {
		const mul = setOf();
		expect(mul.key).toBe('mul');
		expect(mul.dir).toBe(join(ROOT, 'data', 'episodes'));
		expect(mul.outSub).toBe('');
	});

	it('finds the division set', () => {
		const div = setOf('div');
		expect(div.dir).toBe(join(ROOT, 'data', 'division'));
		expect(div.outSub).toBe('division');
		expect(div.name).toBe('나눗셈');
	});

	it('finds the thinking puzzle set with its pieces sheet', () => {
		const think = setOf('think');
		expect(think).toMatchObject({ outSub: 'think', name: '생각 퍼즐', answersPerPage: 4 });
		expect(think.dir).toBe(join(ROOT, 'data', 'think'));
		expect(think.extraDocs.map((d) => [d.name, d.pages])).toEqual([['pieces', 1]]);
	});

	it('refuses an unknown set', () => {
		expect(() => setOf('x')).toThrow();
	});
});
