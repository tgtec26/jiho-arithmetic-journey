// 무대·판 정보를 하위 컴포넌트에 나눠 주는 context
import { getContext, setContext } from 'svelte';
import { boardToScreen } from '../rules/camera';

export type StageInfo = { readonly scale: number };
export type BoardInfo = {
	readonly width: number;
	readonly depth: number;
	readonly cx: number;
	readonly cy: number;
	readonly tilt: number;
	readonly turn: number;
	readonly zoom: number;
};

export const setStage = (s: StageInfo) => setContext('think-stage', s);
export const getStage = () => getContext<StageInfo>('think-stage');
export const setBoard = (b: BoardInfo) => setContext('think-board', b);
export const getBoard = () => getContext<BoardInfo>('think-board');

/** 판 위 점 → 무대(1280×780) 좌표 */
export function projectOnStage(b: BoardInfo, x: number, y: number, z = 0) {
	const p = boardToScreen(x - b.width / 2, y - b.depth / 2, z, b.tilt, b.turn);
	return { x: b.cx + p.x * b.zoom, y: b.cy + p.y * b.zoom };
}
