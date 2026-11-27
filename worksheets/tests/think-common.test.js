import { describe, expect, it } from 'vitest';
import { activityOf, circled, josa, makeRng, roundOf } from '../lib/think/common.js';

describe('activityOf / roundOf', () => {
	it('rotates the four activities by episode number', () => {
		expect([1, 2, 3, 4, 24].map(activityOf)).toEqual(['parking', 'blocks', 'counting', 'logic', 'logic']);
	});

	it('counts which time the activity comes round (1–6)', () => {
		expect([1, 4, 5, 24].map(roundOf)).toEqual([1, 1, 2, 6]);
	});
});

describe('makeRng', () => {
	it('gives the same numbers in [0, 1) for the same seed', () => {
		const a = makeRng(7);
		const b = makeRng(7);
		const xs = Array.from({ length: 5 }, a);
		expect(xs).toEqual(Array.from({ length: 5 }, b));
		expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
		expect(Array.from({ length: 5 }, makeRng(8))).not.toEqual(xs);
	});
});

describe('josa', () => {
	it('picks the particle by the last syllable', () => {
		expect(josa('트럭', '은/는')).toBe('트럭은');
		expect(josa('지호', '은/는')).toBe('지호는');
		expect(josa('감돌이', '이/가')).toBe('감돌이가');
		expect(josa('곰', '와/과')).toBe('곰과');
		expect(josa('빨간 차', '이/가')).toBe('빨간 차가');
		expect(josa('사랑이', '을/를')).toBe('사랑이를');
	});
});

it('circled numbers', () => {
	expect(circled(8)).toBe('⑧');
});
