// 생각 마을 진행: 저장 형식, 단계, 퍼즐 꺼내기. 모두 새 객체를 돌려준다.

export const PLACE_IDS = ['parking', 'blocks', 'clothes', 'ticket', 'garden', 'seesaw'] as const;
export type PlaceId = (typeof PLACE_IDS)[number];

export const STAGES = 5;
/** 단계별 한 번에 푸는 판 수 */
export const BOARDS_PER_STAGE = [3, 3, 4, 4, 5];

export type PlaceSave = { cleared: number; cursor: number[] };
export type TownSave = { version: 1; stars: number; places: Record<PlaceId, PlaceSave> };

const emptyPlace = (): PlaceSave => ({ cleared: 0, cursor: new Array(STAGES).fill(0) });

export function emptySave(): TownSave {
	return { version: 1, stars: 0, places: Object.fromEntries(PLACE_IDS.map((id) => [id, emptyPlace()])) as TownSave['places'] };
}

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

function placeFrom(v: unknown): PlaceSave {
	const p = v as Partial<PlaceSave> | null;
	if (!p || !isCount(p.cleared) || !Array.isArray(p.cursor) || p.cursor.length !== STAGES || !p.cursor.every(isCount)) {
		return emptyPlace();
	}
	return { cleared: Math.min(p.cleared, STAGES), cursor: [...p.cursor] };
}

/** localStorage 문자열 → 저장값. 깨졌으면 빈 진행 */
export function loadSave(raw: string | null): TownSave {
	try {
		const d = JSON.parse(raw ?? '');
		if (!d || d.version !== 1 || !isCount(d.stars)) return emptySave();
		const places = d.places ?? {};
		return {
			version: 1,
			stars: d.stars,
			places: Object.fromEntries(PLACE_IDS.map((id) => [id, placeFrom(places[id])])) as TownSave['places']
		};
	} catch {
		return emptySave();
	}
}

export const currentStage = (save: TownSave, place: PlaceId) => Math.min(save.places[place].cleared + 1, STAGES);

/** pool의 cursor부터 n개 (끝나면 처음부터) */
export function takePuzzles<T>(pool: T[], cursor: number, n: number) {
	const items = Array.from({ length: n }, (_, k) => pool[(cursor + k) % pool.length]);
	return { items, next: (cursor + n) % pool.length };
}

function withPlace(save: TownSave, place: PlaceId, p: PlaceSave): TownSave {
	return { ...save, places: { ...save.places, [place]: p } };
}

/** stage는 1부터 */
export function withCursor(save: TownSave, place: PlaceId, stage: number, next: number): TownSave {
	const p = save.places[place];
	return withPlace(save, place, { ...p, cursor: p.cursor.map((c, i) => (i === stage - 1 ? next : c)) });
}

export function clearStage(save: TownSave, place: PlaceId): TownSave {
	const p = save.places[place];
	return withPlace(save, place, { ...p, cleared: Math.min(p.cleared + 1, STAGES) });
}

export const addStars = (save: TownSave, n: number): TownSave => ({ ...save, stars: save.stars + n });

export const stampCount = (save: TownSave) => PLACE_IDS.reduce((sum, id) => sum + save.places[id].cleared, 0);

/** 장소가 살아난 정도: 0 그대로, 1 기본 움직임(1단계 끝), 2 완성 모습 + 깃발(5단계 끝) */
export const aliveLevel = (cleared: number): 0 | 1 | 2 => (cleared >= STAGES ? 2 : cleared >= 1 ? 1 : 0);

/** 끝낸 단계 수가 before → after로 바뀌었을 때 새로 오른 수준, 오르지 않았으면 0 */
export function newlyAlive(before: number, after: number): 0 | 1 | 2 {
	const lv = aliveLevel(after);
	return lv > aliveLevel(before) ? lv : 0;
}
