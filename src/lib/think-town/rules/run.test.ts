import { describe, it, expect } from 'vitest';
import { startRun, nextPanel, solve, nextBoard, giveTalkStar, finish } from './run';

const toBoard = (n: number) => nextPanel(nextPanel(nextPanel(startRun(n))));

describe('run', () => {
	it('이야기 3컷 → 판', () => {
		let r = nextPanel(nextPanel(startRun(3)));
		expect(r.phase).toBe('story');
		expect(r.panel).toBe(2);
		r = nextPanel(r);
		expect(r.phase).toBe('board');
		expect(r.board).toBe(0);
	});
	it('같은 판을 두 번 풀어도 별은 한 번', () => {
		const a = solve(toBoard(3), true);
		expect(a.gained).toBe(2);
		const b = solve(a.run, true);
		expect(b.gained).toBe(0);
		expect(b.run.stars).toBe(2);
	});
	it('풀지 않은 판은 넘어가지 않는다', () => {
		const r = toBoard(3);
		expect(nextBoard(r)).toEqual(r);
	});
	it('판을 차례로 풀고 마지막 판 뒤 대화 카드, ⭐는 한 번만, 그다음 피날레', () => {
		let r = toBoard(2);
		r = nextBoard(solve(r, false).run);
		expect(r.phase).toBe('board');
		expect(r.board).toBe(1);
		r = nextBoard(solve(r, true).run);
		expect(r.phase).toBe('talk');
		expect(r.stars).toBe(3);
		const t1 = giveTalkStar(r);
		const t2 = giveTalkStar(t1.run);
		expect([t1.gained, t2.gained]).toEqual([1, 0]);
		expect(t2.run.stars).toBe(4);
		expect(finish(t2.run).phase).toBe('finale');
	});
	it('대화 카드가 아니면 ⭐·피날레로 가지 않는다', () => {
		const r = toBoard(1);
		expect(giveTalkStar(r).gained).toBe(0);
		expect(finish(r)).toEqual(r);
	});
});
