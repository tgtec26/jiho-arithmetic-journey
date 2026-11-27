import { describe, it, expect } from 'vitest';
import { screenToBoard, boardToScreen, fitScale } from './camera';

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

describe('boardToScreen', () => {
	it('바닥 점은 screenToBoard로 되돌아온다', () => {
		const p = boardToScreen(40, -25, 0, 58, -34);
		const back = screenToBoard(p.x, p.y, 58, -34, 1);
		expect(back.x).toBeCloseTo(40);
		expect(back.y).toBeCloseTo(-25);
	});
	it('높이 z만큼 화면에서 sin(기울기)배 위로 올라간다', () => {
		const ground = boardToScreen(10, 10, 0, 60, -20);
		const up = boardToScreen(10, 10, 30, 60, -20);
		expect(up.x).toBeCloseTo(ground.x);
		expect(ground.y - up.y).toBeCloseTo(30 * Math.sin(Math.PI / 3));
	});
});
