// 비스듬한 판(원근 없음)의 좌표 도우미.
// 판은 `transform: rotateX(tilt) rotateZ(turn)`. 판 점 (x, y)는 화면에
// (x cos t − y sin t, (x sin t + y cos t) · cos a) 로 보인다.

export const STAGE_W = 1280;
export const STAGE_H = 780;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** 화면에서 움직인 거리 → 판 위에서 움직인 거리 */
export function screenToBoard(dx: number, dy: number, tiltDeg: number, turnDeg: number, scale: number) {
	const t = rad(turnDeg);
	const xs = dx / scale;
	const ys = dy / scale / Math.cos(rad(tiltDeg));
	return { x: xs * Math.cos(t) + ys * Math.sin(t), y: -xs * Math.sin(t) + ys * Math.cos(t) };
}

/** 판 위 점 (x, y, 높이 z) → 화면 위치 (판 가운데 기준, 확대 전) */
export function boardToScreen(x: number, y: number, z: number, tiltDeg: number, turnDeg: number) {
	const t = rad(turnDeg);
	const a = rad(tiltDeg);
	const yr = x * Math.sin(t) + y * Math.cos(t);
	return { x: x * Math.cos(t) - y * Math.sin(t), y: yr * Math.cos(a) - z * Math.sin(a) };
}

/** 1280×780 무대를 창에 맞추는 배율 (키우지 않음) */
export function fitScale(w: number, h: number) {
	return Math.min(1, w / STAGE_W, h / STAGE_H);
}
