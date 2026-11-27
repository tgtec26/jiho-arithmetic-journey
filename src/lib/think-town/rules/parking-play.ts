// 주차장 탈출 판 조작: 차 밀기 범위, 이동, 풀림, 힌트.
import { parseBoard, solveParking, SIZE, EXIT_ROW } from '$think/parking.js';

export type Car = { id: string; row: number; col: number; len: number; horizontal: boolean };
export type Range = { min: number; max: number };

export const GOAL_COL = SIZE - 2;

export function carsFromBoard(board: string[]): Car[] {
	return parseBoard(board);
}

/** 가로 차는 col, 세로 차는 row */
export const posOf = (car: Car) => (car.horizontal ? car.col : car.row);

function cellsOf(car: Car): [number, number][] {
	return Array.from({ length: car.len }, (_, k) => (car.horizontal ? [car.row, car.col + k] : [car.row + k, car.col]));
}

export function boardOf(cars: Car[]): string[] {
	const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill('.'));
	for (const car of cars) for (const [r, c] of cellsOf(car)) grid[r][c] = car.id;
	return grid.map((row) => row.join(''));
}

/** i번 차가 축을 따라 갈 수 있는 앞머리 자리 범위 */
export function slideRange(cars: Car[], i: number): Range {
	const taken = new Set(cars.flatMap((car, j) => (j === i ? [] : cellsOf(car).map(([r, c]) => r * SIZE + c))));
	const car = cars[i];
	const free = (p: number) => (car.horizontal ? !taken.has(car.row * SIZE + p) : !taken.has(p * SIZE + car.col));
	const start = posOf(car);
	let min = start;
	while (min - 1 >= 0 && free(min - 1)) min--;
	let max = start;
	while (max + car.len < SIZE && free(max + car.len)) max++;
	return { min, max };
}

export const clampSlide = (range: Range, pos: number) => Math.min(range.max, Math.max(range.min, pos));
export const snapSlide = (range: Range, pos: number) => Math.round(clampSlide(range, pos));

export function moveCar(cars: Car[], i: number, pos: number): Car[] {
	return cars.map((car, j) => (j !== i ? car : car.horizontal ? { ...car, col: pos } : { ...car, row: pos }));
}

export function isSolved(cars: Car[]) {
	const red = cars.find((car) => car.id === 'R');
	return !!red && red.row === EXIT_ROW && red.col === GOAL_COL;
}

export function hintMove(cars: Car[]) {
	return solveParking(boardOf(cars))?.moves[0] ?? null;
}
