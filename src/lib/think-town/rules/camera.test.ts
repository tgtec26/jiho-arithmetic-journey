import { describe, it, expect } from 'vitest';
import { screenToBoard, fitScale } from './camera';

describe('screenToBoard', () => {
	it('기울기만 있으면 화면 세로가 cos만큼 줄어 보인 것을 되돌린다', () => {
		const p = screenToBoard(10, 5, 60, 0, 1);
		expect(p.x).toBeCloseTo(10);
		expect(p.y).toBeCloseTo(10);
	});
	it('판 점을 화면에 보인 대로 되돌린다', () => {
		const t = (-34 * Math.PI) / 180;
		const a = (58 * Math.PI) / 180;
		const x = 30;
		const y = -12;
		const X = x * Math.cos(t) - y * Math.sin(t);
		const Y = (x * Math.sin(t) + y * Math.cos(t)) * Math.cos(a);
		const back = screenToBoard(X, Y, 58, -34, 1);
		expect(back.x).toBeCloseTo(x);
		expect(back.y).toBeCloseTo(y);
	});
	it('무대가 줄어 있으면 그만큼 키운다', () => {
		const p = screenToBoard(5, 0, 0, 0, 0.5);
		expect(p.x).toBeCloseTo(10);
		expect(p.y).toBeCloseTo(0);
	});
});

describe('fitScale', () => {
	it('무대 1280×780을 창에 맞추고 키우지는 않는다', () => {
		expect(fitScale(1280, 800)).toBe(1);
		expect(fitScale(1280, 752)).toBeCloseTo(752 / 780);
		expect(fitScale(1920, 1080)).toBe(1);
		expect(fitScale(640, 800)).toBeCloseTo(0.5);
	});
});
