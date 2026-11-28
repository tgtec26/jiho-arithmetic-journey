// 앱(TypeScript)에서 쓰는 부분의 타입. 구현은 blocks.js.
export const BLOCK_RANGES: Record<number, [number, number]>;
export function parseHeights(rows: string[]): number[][];
export function blockCount(h: number[][]): number;
export function topView(h: number[][]): boolean[][];
export function frontView(h: number[][]): number[];
export function sideView(h: number[][]): number[];
export function viewAnswers(top: boolean[][], front: number[], side: number[], maxH?: number): number[][][];
