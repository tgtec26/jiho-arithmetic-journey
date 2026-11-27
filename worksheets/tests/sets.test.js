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

	it('refuses an unknown set', () => {
		expect(() => setOf('x')).toThrow();
	});
});
