// 앱(TypeScript)에서 쓰는 부분의 타입. 구현은 counting.js.
export type Outfits = { shirt: string[]; pants: string[]; hat?: string[] };
export const OUTFIT_COLORS: { shirt: string[]; pants: string[]; hat: string[] };
export const OUTFIT_SIZES: Record<number, number[][]>;
export function listOutfits(p: Outfits): string[][];
export function generateOutfit(rng: () => number, stage: number, used: Set<string>): Outfits;
