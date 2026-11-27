import { describe, it, expect } from 'vitest';
import P from './puzzles.json';
import { checkParkingPuzzle } from '$think/parking.js';
import { lineupSolutions, type Lineup } from '$think/logic.js';
import { LINEUP_CAST_BY_STAGE } from './cast';

const episodes = import.meta.glob('/worksheets/data/think/ep*.json', { eager: true, import: 'default' }) as Record<
	string,
	{ activity: string; puzzles: { board?: string[] }[] }
>;
const worksheetBoards = Object.values(episodes)
	.filter((e) => e.activity === 'parking')
	.flatMap((e) => e.puzzles.map((p) => p.board!.join('/')));

describe('미리 만든 퍼즐', () => {
	it('단계마다 개수', () => {
		expect(P.parking.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
		expect(P.lineup.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
	});
	it('주차장: 학습지 검사기로 라운드 범위·최소 횟수가 맞다', () => {
		P.parking.forEach((pool, s) => pool.forEach((p) => expect(checkParkingPuzzle(p, s + 1)).toEqual([])));
	});
	it('줄 세우기: 답이 하나, 등장인물은 그 단계 명단', () => {
		P.lineup.forEach((pool, s) =>
			pool.forEach((p) => {
				expect(lineupSolutions(p as Lineup)).toHaveLength(1);
				expect([...p.items].sort()).toEqual([...LINEUP_CAST_BY_STAGE[s]].sort());
			})
		);
	});
	it('겹치는 퍼즐 없음 (앱 안, 학습지와)', () => {
		expect(worksheetBoards.length).toBeGreaterThan(0);
		const boards = P.parking.flat().map((p) => p.board.join('/'));
		expect(new Set(boards).size).toBe(boards.length);
		for (const b of worksheetBoards) expect(boards).not.toContain(b);
		const lines = P.lineup.flat().map((p) => JSON.stringify(p.clues));
		expect(new Set(lines).size).toBe(lines.length);
	});
});
