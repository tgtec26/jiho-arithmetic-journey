import { describe, it, expect } from 'vitest';
import { addBlock, blockHint, blueprintOf, checkBuild, emptyBuild, isBuilt, minBlocks, removeBlock } from './blocks-play';

const NUM = blueprintOf(['12', '01'], 1); // 층수 설계도
const VIEW = blueprintOf(['22', '22'], 3); // 앞 [2,2], 옆 [2,2]

describe('blocks-play', () => {
	it('단계 1·2는 층수 설계도, 3부터는 세 모양', () => {
		expect(NUM.numbers).toBe(true);
		expect(NUM.target).toEqual([[1, 2], [0, 1]]);
		expect(VIEW.numbers).toBe(false);
		expect(VIEW.front).toEqual([2, 2]);
		expect(VIEW.side).toEqual([2, 2]);
	});
	it('쌓기는 3층까지, 빼기는 0층까지 (한계면 그대로)', () => {
		let b = emptyBuild(NUM);
		b = addBlock(addBlock(addBlock(b, 0, 0), 0, 0), 0, 0);
		expect(b[0][0]).toBe(3);
		expect(addBlock(b, 0, 0)).toBe(b);
		const e = emptyBuild(NUM);
		expect(removeBlock(e, 1, 1)).toBe(e);
		expect(removeBlock(b, 0, 0)[0][0]).toBe(2);
	});
	it('층수 설계도: 틀린 칸을 알려 준다', () => {
		const r = checkBuild([[1, 1], [0, 1]], NUM);
		expect(r.wrong).toEqual([[0, 1]]);
		expect(r.top).toBe(false);
		expect(isBuilt([[1, 2], [0, 1]], NUM)).toBe(true);
	});
	it('세 모양 설계도: 모양마다 맞음/틀림, 다른 탑도 정답', () => {
		expect(checkBuild([[2, 1], [1, 2]], VIEW)).toEqual({ top: true, front: true, side: true, wrong: [] });
		expect(checkBuild([[2, 2], [1, 1]], VIEW)).toMatchObject({ top: true, front: true, side: false });
		expect(checkBuild([[2, 2], [2, 0]], VIEW).top).toBe(false);
	});
	it('가장 적은 블록', () => {
		expect(minBlocks(VIEW)).toBe(6);
		expect(minBlocks(NUM)).toBe(4);
	});
	it('힌트: 가장 가까운 정답에서 처음 다른 칸, 이미 맞으면 null', () => {
		expect(blockHint([[2, 1], [1, 1]], VIEW)).toEqual({ r: 1, c: 1, h: 2 });
		expect(blockHint([[1, 2], [0, 1]], NUM)).toBeNull();
		expect(blockHint(emptyBuild(NUM), NUM)).toEqual({ r: 0, c: 0, h: 1 });
	});
});
