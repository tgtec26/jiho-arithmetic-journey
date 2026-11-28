// 앱(TypeScript)에서 쓰는 부분의 타입. 구현은 seesaw.js.
export type Goal = 'top' | 'order';
export const SEESAW_STAGES: Record<number, { n: number; goal: Goal }[]>;
export function orders(n: number): number[][];
export function keep(list: number[][], heavy: number, light: number): number[][];
export function answerKey(order: number[], goal: Goal): string;
export function isDecided(list: number[][], goal: Goal): boolean;
export function maxWeighings(n: number, goal: Goal): number;
export function weighResult(list: number[][], a: number, b: number, goal: Goal, bias: number[]): number;
export function bestPair(list: number[][], goal: Goal): [number, number] | null;
