// 기차역 매표소 줄 세우기: 칸에 놓기, 단서 판정, 힌트. 줄은 0번 칸이 맨 앞.
import { fits } from '$think/logic.js';

export type Clue = { type: string; a: string; b?: string };
export type Slots = (string | null)[];

/** name을 slot 칸에 놓는다. 원래 자리는 비우고, 그 칸에 있던 인형은 name의 원래 자리로(없으면 빠짐) */
export function placeInSlot(slots: Slots, name: string, slot: number): Slots {
	const out = [...slots];
	const from = out.indexOf(name);
	const there = out[slot];
	if (from >= 0) out[from] = there !== name ? there : null;
	out[slot] = name;
	return out;
}

export function clueResults(order: string[], clues: Clue[]): boolean[] {
	return clues.map((c) => fits(order, c));
}

const filled = (slots: Slots): slots is string[] => slots.every((s) => s !== null);

export function isLineupSolved(slots: Slots, clues: Clue[]) {
	return filled(slots) && clueResults(slots, clues).every(Boolean);
}

/** 아직 맞지 않는 첫 단서 번호 (단서에 나온 이름이 아직 줄에 없으면 안 맞음). 다 맞으면 -1 */
export function hintClue(slots: Slots, clues: Clue[]) {
	return clues.findIndex((c) => {
		const names = c.b ? [c.a, c.b] : [c.a];
		if (names.some((n) => !slots.includes(n))) return true;
		if (c.type === 'first' || c.type === 'last' || c.type === 'middle') {
			const at = c.type === 'first' ? 0 : c.type === 'last' ? slots.length - 1 : (slots.length - 1) / 2;
			return slots[at] !== c.a;
		}
		return !fits(slots as string[], c);
	});
}
