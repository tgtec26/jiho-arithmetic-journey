import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT } from '../lib/episodes.js';

const css = readFileSync(join(ROOT, 'styles', 'worksheet.css'), 'utf8');

/** 선택자 블록 안의 width(mm) */
function widthOf(selector) {
	const start = css.indexOf(`${selector} {`);
	if (start < 0) throw new Error(`no rule ${selector}`);
	const block = css.slice(start, css.indexOf('}', start));
	return Number(block.match(/\bwidth:\s*([\d.]+)mm/)[1]);
}

describe('grid cells leave room for 3–4 digit products', () => {
	it('normal grid cells are at least 16mm wide and match the head width', () => {
		expect(widthOf('.grid td.cell')).toBeGreaterThanOrEqual(16);
		expect(widthOf(".grid tr:first-child th[data-role='head']")).toBe(widthOf('.grid td.cell'));
	});

	it('small (level 4) grid cells are still at least 13mm wide', () => {
		expect(widthOf('.grid.small td.cell')).toBeGreaterThanOrEqual(13);
		expect(widthOf(".grid.small tr:first-child th[data-role='head']")).toBe(widthOf('.grid.small td.cell'));
	});
});
