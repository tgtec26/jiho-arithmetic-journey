import { describe, it, expect } from 'vitest';
import { emptySave, loadSave, currentStage, takePuzzles, withCursor, clearStage, addStars, stampCount } from './progress';

describe('progress', () => {
	it('깨진 저장값이면 빈 진행', () => {
		for (const raw of [null, '', '{', '[]', 'null', '{"version":9}', '{"version":1,"stars":"x"}']) {
			expect(loadSave(raw)).toEqual(emptySave());
		}
	});
	it('일부만 있는 저장값은 빠진 장소를 채운다', () => {
		const s = loadSave(JSON.stringify({ version: 1, stars: 7, places: { parking: { cleared: 2, cursor: [3, 3, 0, 0, 0] } } }));
		expect(s.stars).toBe(7);
		expect(s.places.parking).toEqual({ cleared: 2, cursor: [3, 3, 0, 0, 0] });
		expect(s.places.ticket).toEqual({ cleared: 0, cursor: [0, 0, 0, 0, 0] });
	});
	it('이상한 장소 값은 빈 값으로', () => {
		const s = loadSave(JSON.stringify({ version: 1, stars: 1, places: { parking: { cleared: 'a', cursor: 3 } } }));
		expect(s.places.parking).toEqual({ cleared: 0, cursor: [0, 0, 0, 0, 0] });
	});
	it('단계는 5에서 멈추고, 5단계를 끝내도 5', () => {
		let s = emptySave();
		expect(currentStage(s, 'parking')).toBe(1);
		for (let i = 0; i < 7; i++) s = clearStage(s, 'parking');
		expect(s.places.parking.cleared).toBe(5);
		expect(currentStage(s, 'parking')).toBe(5);
	});
	it('퍼즐 꺼내기는 이어서, 끝나면 처음부터', () => {
		expect(takePuzzles(['a', 'b', 'c', 'd', 'e'], 3, 3)).toEqual({ items: ['d', 'e', 'a'], next: 1 });
		expect(takePuzzles(['a', 'b'], 0, 2)).toEqual({ items: ['a', 'b'], next: 0 });
	});
	it('중간에 나가도(cursor만 바뀜) 단계는 그대로', () => {
		const s = withCursor(emptySave(), 'ticket', 1, 3);
		expect(s.places.ticket.cursor[0]).toBe(3);
		expect(currentStage(s, 'ticket')).toBe(1);
	});
	it('별 더하기와 도장 수', () => {
		const s = addStars(clearStage(clearStage(emptySave(), 'parking'), 'ticket'), 3);
		expect(s.stars).toBe(3);
		expect(stampCount(s)).toBe(2);
	});
	it('순수 함수: 입력을 바꾸지 않는다', () => {
		const s = emptySave();
		clearStage(s, 'parking');
		withCursor(s, 'parking', 1, 2);
		expect(s).toEqual(emptySave());
	});
});
