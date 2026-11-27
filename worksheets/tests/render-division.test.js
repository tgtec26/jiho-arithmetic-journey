import { describe, expect, it } from 'vitest';
import { renderDivProblem } from '../lib/render-division.js';

const count = (html, needle) => html.split(needle).length - 1;
const hint = (v) => `<span class="hint">${v}</span>`;
const row = (html, cls) => html.match(new RegExp(`<tr class="${cls}">(.*?)</tr>`, 's'))[1];

describe('renderDivProblem', () => {
	const l1 = renderDivProblem({ n: 48, d: 3, position: 2, level: 1, withRemainder: false });

	it('shows the split in gray at level 1, in the split line and the step rows', () => {
		expect(l1).toContain('<section class="problem div-problem"');
		expect(count(l1, hint(30))).toBe(2);
		expect(count(l1, hint(18))).toBe(2);
		expect(l1).toContain('dot first');
		expect(l1).toContain('dot second');
	});

	it('draws the long division with six rows and a gray bring-down digit', () => {
		for (const cls of ['ld-q', 'ld-n', 'ld-p1', 'ld-r1', 'ld-p2', 'ld-rem']) expect(l1).toContain(`<tr class="${cls}">`);
		expect(row(l1, 'ld-n')).toContain('<td class="dv">3</td>');
		expect(row(l1, 'ld-n')).toContain('>4</td>');
		expect(row(l1, 'ld-n')).toContain('>8</td>');
		expect(row(l1, 'ld-r1')).toContain(hint(8));
	});

	it('checks with multiplication, without a remainder box when not asked', () => {
		const check = l1.match(/<div class="check">(.*?)<\/div>/s)[1];
		expect(check).toContain('확인:');
		expect(check).toContain('× 3');
		expect(check).toContain('= 48');
		expect(check).not.toContain('+');
		expect(l1).not.toContain('…');
	});

	it('fades hints by level', () => {
		const l2 = renderDivProblem({ n: 48, d: 3, position: 2, level: 2, withRemainder: false });
		expect(count(l2, hint(30))).toBe(2);
		expect(l2).not.toContain(hint(18));
		expect(l2).not.toContain(hint(8));
		const l3 = renderDivProblem({ n: 48, d: 3, position: 2, level: 3, withRemainder: false });
		expect(l3).not.toContain('class="hint"');
		expect(l3).not.toContain('split small');
		const l4 = renderDivProblem({ n: 48, d: 3, position: 2, level: 4, withRemainder: false });
		expect(l4).toContain('split small');
		expect(l4).not.toContain('class="hint"');
	});

	it('adds remainder boxes in the remainder form', () => {
		const html = renderDivProblem({ n: 50, d: 3, position: 3, level: 3, withRemainder: true });
		expect(html).toContain('…');
		const check = html.match(/<div class="check">(.*?)<\/div>/s)[1];
		expect(check).toContain('+');
		expect(check).toContain('= 50');
	});

	it('splits a quotient-ones-0 problem as 60 + 2', () => {
		const html = renderDivProblem({ n: 62, d: 3, position: 4, level: 1, withRemainder: true });
		expect(count(html, hint(60))).toBe(2);
		expect(count(html, hint(2))).toBe(3); // 쪼개기, 단계 줄, 세로식 내려 쓴 수
	});

	it('asks for the answer (and what is left) in a story problem', () => {
		const story = renderDivProblem({ n: 26, d: 2, position: 1, level: 1, unit: '개', withRemainder: false });
		expect(story).toContain('problem div-problem story');
		expect(story).toContain('⭐');
		expect(story).toContain('답:');
		expect(story).not.toContain('남는 것');
		const rest = renderDivProblem({ n: 50, d: 3, position: 1, level: 3, unit: '번', restUnit: '알', withRemainder: true });
		expect(rest).toContain('남는 것');
		expect(rest).toContain('알');
		const exact = renderDivProblem({ n: 84, d: 6, position: 1, level: 3, unit: '장', restUnit: '장', withRemainder: true });
		expect(exact).not.toContain('남는 것');
	});
});
