import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadStickers } from './episodes.js';

/**
 * 스티커 id → 그림 경로·가로세로 비
 * @param {string} prefix HTML에서 assets/ 앞에 붙일 경로 (예: '../../' 또는 '/')
 */
export function makeStickerLookup(prefix) {
	const files = new Map(loadStickers().map((s) => [s.id, s.file]));
	const missing = new Set();
	const aspects = new Map();
	const fileOf = (id) => {
		const f = files.get(id);
		return f && existsSync(join(ROOT, f)) ? f : null;
	};
	return {
		missing,
		src(id) {
			const f = fileOf(id);
			if (!f) missing.add(id);
			return f ? `${prefix}${f}` : null;
		},
		aspect(id) {
			if (!aspects.has(id)) {
				const f = fileOf(id);
				let a = 1;
				if (f) {
					const buf = readFileSync(join(ROOT, f));
					a = buf.readUInt32BE(16) / buf.readUInt32BE(20); // PNG IHDR 가로/세로
				}
				aspects.set(id, a);
			}
			return aspects.get(id);
		}
	};
}
