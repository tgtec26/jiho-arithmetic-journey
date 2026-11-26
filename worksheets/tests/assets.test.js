import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, loadStickers } from '../lib/episodes.js';

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const present = loadStickers().filter((s) => existsSync(join(ROOT, s.file)));

describe('sticker files', () => {
	it.each(present.map((s) => [s.id, s.file]))('%s is an RGBA PNG ≤ 1200px', (_id, file) => {
		const buf = readFileSync(join(ROOT, file));
		expect(buf.subarray(0, 8).equals(SIGNATURE)).toBe(true);
		const width = buf.readUInt32BE(16);
		const height = buf.readUInt32BE(20);
		const colorType = buf[25];
		expect(colorType).toBe(6);
		expect(Math.max(width, height)).toBeLessThanOrEqual(1200);
	});
});
