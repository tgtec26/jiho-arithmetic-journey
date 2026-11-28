<!-- 생각 마을: 지도 ↔ 장소. 위쪽 알약(메뉴로, 도장·별, 소리) -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import Stage from './diorama/Stage.svelte';
	import TownMap from './TownMap.svelte';
	import PlaceRun from './PlaceRun.svelte';
	import { townStore } from './progress.svelte';
	import { sound } from './sound.svelte';
	import { PLACE_IDS, STAGES, newlyAlive, stampCount, type PlaceId } from './rules/progress';

	let view = $state<'map' | PlaceId>('map');
	// 장소를 끝내고 돌아왔을 때 살아나는 수준이 올랐으면 지도에서 축하
	let celebrate = $state<{ id: PlaceId; level: 1 | 2 } | null>(null);
	let enteredCleared = 0;
	let cheerTimer: ReturnType<typeof setTimeout> | undefined;

	function enter(id: PlaceId) {
		enteredCleared = townStore.save.places[id].cleared;
		celebrate = null;
		view = id;
	}

	function exit() {
		if (view === 'map') return;
		const id = view;
		const level = newlyAlive(enteredCleared, townStore.save.places[id].cleared);
		if (level) {
			celebrate = { id, level };
			clearTimeout(cheerTimer);
			cheerTimer = setTimeout(() => (celebrate = null), 4000);
		}
		view = 'map';
	}
	let unlocked = false;
	let alive = true;

	// 첫 터치에서 소리를 풀고, 음원을 다 읽었을 때 아직 마을에 있으면 배경음
	function firstTouch() {
		if (unlocked) return;
		unlocked = true;
		sound.unlock().then(() => {
			if (alive) sound.startBgm();
		});
	}

	onDestroy(() => {
		alive = false;
		sound.stopBgm();
		clearTimeout(cheerTimer);
	});
</script>

<Stage>
	<div class="town" onpointerdowncapture={firstTouch} role="presentation">
		{#if view === 'map'}
			<TownMap onEnter={enter} {celebrate} />
		{:else}
			{#key view}
				<PlaceRun place={view} onExit={exit} />
			{/key}
		{/if}

		<div class="hud">
			<button class="pill btn" onclick={() => (view === 'map' ? gameStore.setMode('menu') : exit())}>
				← {view === 'map' ? '메뉴' : '마을'}
			</button>
			<span class="pill title">생각 마을</span>
			<span class="spacer"></span>
			<span class="pill">도장 {stampCount(townStore.save)} / {PLACE_IDS.length * STAGES}</span>
			<span class="pill star">⭐ {townStore.save.stars}</span>
			<button class="pill btn" onclick={(e) => { sound.toggleMute(); (e.currentTarget as HTMLElement).blur(); }} aria-label="소리">
				{sound.muted ? '🔇' : '🔊'}
			</button>
		</div>
	</div>
</Stage>

<style>
	.town {
		position: absolute;
		inset: 0;
	}
	.hud {
		position: absolute;
		top: 14px;
		left: 16px;
		right: 16px;
		display: flex;
		gap: 10px;
		align-items: center;
		z-index: 50;
		pointer-events: none;
	}
	.spacer {
		flex: 1;
	}
	.pill {
		pointer-events: auto;
		background: rgba(255, 255, 255, 0.94);
		color: #2b2b2b;
		padding: 0 20px;
		height: 56px;
		display: inline-flex;
		align-items: center;
		border-radius: 999px;
		font-weight: 900;
		font-size: 20px;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.14);
	}
	.title {
		background: #2f6fd6;
		color: #fff;
	}
	.btn:active {
		transform: scale(0.94);
	}
	.star {
		color: #b07400;
	}
</style>
