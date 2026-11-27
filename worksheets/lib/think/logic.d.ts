// 앱(TypeScript)에서 쓰는 부분의 타입. 구현은 logic.js.
export type Clue = { type: string; a: string; b?: string };
export type Lineup = { kind: 'lineup'; items: string[]; clues: Clue[] };
export function clueText(c: Clue): string;
export function fits(order: string[], c: Clue): boolean;
export function lineupSolutions(p: Lineup): string[][];
