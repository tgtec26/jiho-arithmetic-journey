import { describe, it, expect } from 'vitest';
import { carsFromBoard, boardOf, slideRange, clampSlide, snapSlide, moveCar, isSolved, hintMove } from './parking-play';

// A: 세로 3칸 트럭 (2열, 0~2줄), R: 빨간 차 (3번째 줄 0~1열)
const B = ['..A...', '..A...', 'RRA...', '......', '......', '......'];
const idx = (cars: { id: string }[], id: string) => cars.findIndex((c) => c.id === id);

describe('parking-play', () => {
	it('세로 트럭 A는 아래로만 3칸까지', () => {
		const cars = carsFromBoard(B);
		expect(slideRange(cars, idx(cars, 'A'))).toEqual({ min: 0, max: 3 });
	});
	it('빨간 차는 A에 막혀 제자리', () => {
		const cars = carsFromBoard(B);
		expect(slideRange(cars, idx(cars, 'R'))).toEqual({ min: 0, max: 0 });
	});
	it('범위 밖 끌기는 끝에서 멈추고, 놓으면 가까운 칸', () => {
		expect(clampSlide({ min: 0, max: 3 }, 5.4)).toBe(3);
		expect(clampSlide({ min: 0, max: 3 }, -2)).toBe(0);
		expect(clampSlide({ min: 0, max: 3 }, 1.25)).toBe(1.25);
		expect(snapSlide({ min: 0, max: 3 }, 1.6)).toBe(2);
		expect(snapSlide({ min: 0, max: 3 }, 9)).toBe(3);
	});
	it('A를 내리면 빨간 차가 출구까지 가고 풀린다', () => {
		let cars = carsFromBoard(B);
		cars = moveCar(cars, idx(cars, 'A'), 3);
		expect(slideRange(cars, idx(cars, 'R'))).toEqual({ min: 0, max: 4 });
		expect(isSolved(cars)).toBe(false);
		cars = moveCar(cars, idx(cars, 'R'), 4);
		expect(isSolved(cars)).toBe(true);
		expect(boardOf(cars)[2]).toBe('....RR');
	});
	it('moveCar는 원래 목록을 바꾸지 않는다', () => {
		const cars = carsFromBoard(B);
		moveCar(cars, idx(cars, 'A'), 3);
		expect(boardOf(cars)).toEqual(B);
	});
	it('힌트는 가장 짧은 풀이의 첫 움직임', () => {
		expect(hintMove(carsFromBoard(B))).toEqual({ id: 'A', dir: 'down', dist: 3 });
	});
});
