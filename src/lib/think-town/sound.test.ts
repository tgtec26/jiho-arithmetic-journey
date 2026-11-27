import { describe, it, expect } from 'vitest';
import { canPlay, readMuted } from './sound.svelte';

describe('sound', () => {
	it('같은 소리는 90ms 안에 다시 안 난다', () => {
		expect(canPlay(undefined, 1000)).toBe(true);
		expect(canPlay(1000, 1050)).toBe(false);
		expect(canPlay(1000, 1090)).toBe(true);
	});
	it('음소거 저장값 읽기', () => {
		expect(readMuted({ getItem: () => '1' })).toBe(true);
		expect(readMuted({ getItem: () => null })).toBe(false);
		expect(
			readMuted({
				getItem: () => {
					throw new Error('blocked');
				}
			})
		).toBe(false);
	});
});
