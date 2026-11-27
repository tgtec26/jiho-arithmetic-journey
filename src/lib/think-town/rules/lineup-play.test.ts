import { describe, it, expect } from 'vitest';
import { placeInSlot, clueResults, isLineupSolved, hintClue } from './lineup-play';

// 답: [지호, 아빠, 감돌이]
const clues = [
	{ type: 'behind', a: '지호', b: '아빠' },
	{ type: 'before', a: '지호', b: '감돌이' }
];

describe('lineup-play', () => {
	it('칸에 놓으면 원래 자리는 비고, 그 칸에 있던 인형은 빈자리로 간다', () => {
		expect(placeInSlot([null, null, null], '지호', 1)).toEqual([null, '지호', null]);
		expect(placeInSlot([null, '지호', null], '지호', 0)).toEqual(['지호', null, null]);
		expect(placeInSlot(['아빠', '지호', null], '지호', 0)).toEqual(['지호', '아빠', null]);
	});
	it('단서마다 맞음/틀림', () => {
		expect(clueResults(['아빠', '지호', '감돌이'], clues)).toEqual([false, true]);
		expect(isLineupSolved(['지호', '아빠', '감돌이'], clues)).toBe(true);
		expect(isLineupSolved(['지호', '아빠', null], clues)).toBe(false);
	});
	it('힌트는 아직 안 맞는 첫 단서 (빈칸에 걸린 단서도 안 맞음)', () => {
		expect(hintClue([null, null, null], clues)).toBe(0);
		expect(hintClue(['지호', '아빠', null], clues)).toBe(1);
		expect(hintClue(['지호', '아빠', '감돌이'], clues)).toBe(-1);
	});
	it('맨 앞·맨 뒤·한가운데 단서는 그 자리가 비면 안 맞음', () => {
		const c = [{ type: 'first', a: '지호' }, { type: 'last', a: '아빠' }, { type: 'middle', a: '감돌이' }];
		expect(hintClue([null, '감돌이', '아빠'], c)).toBe(0);
		expect(hintClue(['지호', null, '아빠'], c)).toBe(2);
		expect(hintClue(['지호', '감돌이', null], c)).toBe(1);
	});
});
