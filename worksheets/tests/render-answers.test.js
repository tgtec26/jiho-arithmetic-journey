import { describe, expect, it } from 'vitest';
import { loadEpisodes } from '../lib/episodes.js';
import { renderAnswerKey } from '../lib/render-answers.js';

const count = (html, needle) => html.split(needle).length - 1;

describe('renderAnswerKey', () => {
	const [ep01] = loadEpisodes();
	const html = renderAnswerKey([ep01]);

	it('lists the story answer with unit and partial sums', () => {
		expect(html).toContain('16 × 11 = 176');
		expect(html).toContain('176명');
		expect(html).toContain('16 + 160');
		expect(html).toContain('1회');
	});

	it('has 8 answer lines per episode inside A4 pages', () => {
		expect(count(html, 'class="ans"')).toBe(8);
		expect(html).toContain('class="page answers"');
	});
});
