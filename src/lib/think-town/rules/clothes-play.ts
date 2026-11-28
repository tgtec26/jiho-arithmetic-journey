// 옷가게(경우의 수): 마네킹에 입히기, 사진 찍어 사진첩에 넣기, 남은 수, 힌트. 모두 새 값을 돌려준다.
import { listOutfits, type Outfits } from '$think/counting.js';

export type Part = 'shirt' | 'pants' | 'hat';
export type Outfit = Record<Part, string | null>;

export const NO_OUTFIT: Outfit = { shirt: null, pants: null, hat: null };

/** 색 id → 색값 */
export const OUTFIT_HEX: Record<string, string> = {
	red: '#e0473a',
	blue: '#4d96ff',
	yellow: '#ffc93c',
	green: '#4fbf6a',
	navy: '#34508f',
	brown: '#9a6a3a',
	gray: '#8d939b',
	pink: '#f08cb4',
	orange: '#ff8a3d',
	purple: '#9b6bd6',
	teal: '#25b5a5'
};

export const partsOf = (p: Outfits): Part[] => (p.hat ? ['shirt', 'pants', 'hat'] : ['shirt', 'pants']);
export const totalOutfits = (p: Outfits) => listOutfits(p).length;
/** 단계 1~3은 사진첩 칸 수 = 답, 4~5는 칸을 숨김 */
export const slotsShown = (stage: number) => stage <= 3;

export function wear(o: Outfit, part: Part, color: string): Outfit {
	return o[part] === color ? o : { ...o, [part]: color };
}

export type Photo = { album: string[]; result: 'incomplete' | 'dup' | 'new'; index: number; missing: Part[] };

export function takePhoto(album: string[], o: Outfit, p: Outfits): Photo {
	const parts = partsOf(p);
	const missing = parts.filter((part) => o[part] === null);
	if (missing.length) return { album, result: 'incomplete', index: -1, missing };
	const key = parts.map((part) => o[part]).join('|');
	const at = album.indexOf(key);
	if (at >= 0) return { album, result: 'dup', index: at, missing };
	return { album: [...album, key], result: 'new', index: album.length, missing };
}

export const remaining = (album: string[], p: Outfits) => totalOutfits(p) - album.length;

/** 셔츠 → 바지 → 모자 차례로 아직 안 찍은 첫 조합 */
export function clothesHint(album: string[], p: Outfits): Outfit | null {
	const next = listOutfits(p).find((combo) => !album.includes(combo.join('|')));
	if (!next) return null;
	return { shirt: next[0], pants: next[1], hat: next[2] ?? null };
}
