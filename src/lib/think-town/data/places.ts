// 생각 마을 장소 6곳. spot = 마을 판(460×340) 위 이름표 자리, z = 건물 높이, below = 이름표를 그 점 아래에
import type { PlaceId } from '../rules/progress';

export type Place = {
	id: PlaceId;
	name: string;
	icon: string;
	activity: string;
	built: boolean;
	spot: { x: number; y: number; z: number; dx?: number; below?: boolean };
};

export const PLACES: Place[] = [
	{ id: 'parking', name: '주차장', icon: '🚗', activity: '주차장 탈출', built: true, spot: { x: 105, y: 40, z: 14 } },
	{ id: 'blocks', name: '블록 공방', icon: '🧱', activity: '쌓기나무', built: false, spot: { x: 297, y: 45, z: 46 } },
	{ id: 'clothes', name: '옷가게', icon: '👕', activity: '경우의 수', built: false, spot: { x: 425, y: 110, z: 40 } },
	{ id: 'ticket', name: '기차역 매표소', icon: '🎫', activity: '줄 세우기', built: true, spot: { x: 75, y: 268, z: 0, below: true } },
	{ id: 'garden', name: '사랑이 정원', icon: '🌼', activity: '모양 스도쿠', built: false, spot: { x: 300, y: 250, z: 0, dx: -30 } },
	{ id: 'seesaw', name: '시소 놀이터', icon: '⚖️', activity: '무게 추론', built: false, spot: { x: 415, y: 255, z: 12, dx: 40 } }
];

export const placeOf = (id: PlaceId) => PLACES.find((p) => p.id === id)!;
