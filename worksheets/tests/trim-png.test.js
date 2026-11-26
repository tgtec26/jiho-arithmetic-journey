import { describe, expect, it } from 'vitest';
import { decodePng, encodePng, trimPng } from '../tools/trim-png.js';

function makeImage(w, h, paint) {
	const data = Buffer.alloc(w * h * 4, 255); // 흰색, 불투명
	paint((x, y, rgba) => data.set(rgba, (y * w + x) * 4));
	return { width: w, height: h, data };
}

describe('trim-png', () => {
	it('round-trips encode/decode', () => {
		const img = makeImage(5, 4, (set) => set(1, 2, [10, 20, 30, 255]));
		const back = decodePng(encodePng(img));
		expect(back.width).toBe(5);
		expect(back.height).toBe(4);
		expect([...back.data.subarray((2 * 5 + 1) * 4, (2 * 5 + 1) * 4 + 4)]).toEqual([10, 20, 30, 255]);
	});

	it('trims white margins to the drawing', () => {
		const img = makeImage(10, 10, (set) => {
			for (let y = 5; y < 8; y++) for (let x = 4; x < 6; x++) set(x, y, [200, 0, 0, 255]);
		});
		const out = decodePng(trimPng(encodePng(img), { pad: 0 }));
		expect([out.width, out.height]).toEqual([2, 3]);
	});

	it('treats transparent pixels as empty', () => {
		const img = makeImage(8, 8, (set) => {
			for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) set(x, y, [0, 0, 0, 0]);
			set(3, 3, [0, 0, 0, 255]);
		});
		const out = decodePng(trimPng(encodePng(img), { pad: 0 }));
		expect([out.width, out.height]).toEqual([1, 1]);
	});
});
