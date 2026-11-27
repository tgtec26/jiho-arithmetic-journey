// 앱(TypeScript)에서 쓰는 부분의 타입. 구현은 parking.js.
export type Vehicle = { id: string; row: number; col: number; len: number; horizontal: boolean };
export type Move = { id: string; dir: 'up' | 'down' | 'left' | 'right'; dist: number };
export const SIZE: number;
export const EXIT_ROW: number;
export const PARKING_RANGES: Record<number, [number, number]>;
export function parseBoard(rows: string[]): Vehicle[];
export function solveParking(rows: string[]): { minMoves: number; moves: Move[] } | null;
export function checkParkingPuzzle(p: { board: string[]; minMoves: number }, round: number): string[];
