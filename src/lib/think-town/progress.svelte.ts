// 생각 마을 진행 store: 기기에 저장(localStorage), 별은 기존 점수에도 더한다.
import { browser } from '$app/environment';
import { gameStore } from '$lib/stores/gameStore.svelte';
import {
	BOARDS_PER_STAGE,
	addStars,
	clearStage,
	currentStage,
	loadSave,
	takePuzzles,
	withCursor,
	type PlaceId,
	type TownSave
} from './rules/progress';

const KEY = 'think_town_v1';
/** 별 하나 = 기존 점수 10점 */
const POINTS_PER_STAR = 10;

function read(): string | null {
	try {
		return localStorage.getItem(KEY);
	} catch {
		return null;
	}
}

class TownStore {
	#save = $state<TownSave>(loadSave(browser ? read() : null));

	get save() {
		return this.#save;
	}

	stage(place: PlaceId) {
		return currentStage(this.#save, place);
	}

	/** 현재 단계 퍼즐을 꺼내고, 다음에 이어서 꺼내도록 cursor를 저장 */
	takeFor<T>(place: PlaceId, pools: T[][]): T[] {
		const stage = this.stage(place);
		const { items, next } = takePuzzles(pools[stage - 1], this.#save.places[place].cursor[stage - 1], BOARDS_PER_STAGE[stage - 1]);
		this.#set(withCursor(this.#save, place, stage, next));
		return items;
	}

	award(n: number) {
		if (n <= 0) return;
		this.#set(addStars(this.#save, n));
		gameStore.addScore(POINTS_PER_STAR * n, true);
	}

	clear(place: PlaceId) {
		this.#set(clearStage(this.#save, place));
	}

	#set(save: TownSave) {
		this.#save = save;
		if (!browser) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(save));
		} catch {
			// 저장 못 해도 이번 판은 계속
		}
	}
}

export const townStore = new TownStore();
