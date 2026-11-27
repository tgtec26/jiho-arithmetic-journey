<!-- 생각 마을: 지도 ↔ 장소. 위쪽 알약(메뉴로, 도장·별, 소리) -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { gameStore } from '$lib/stores/gameStore.svelte';
	import Stage from './diorama/Stage.svelte';
	import TownMap from './TownMap.svelte';
	import PlaceRun from './PlaceRun.svelte';
	import { townStore } from './progress.svelte';
	import { sound } from './sound.svelte';
	import { PLACE_IDS, STAGES, stampCount, type PlaceId } from './rules/progress';

	let view = $state<'map' | PlaceId>('map');
	let unlocked = false;

	function firstTouch() {
		if (unlocked) return;
		unlocked = true;
		sound.unlock();
	}

	onDestroy(() => sound.stopBgm());
</script>

<Stage>
	<div class="town" onpointerdowncapture={firstTouch} role="presentation">
		{#if view === 'map'}
			<TownMap onEnter={(id) => (view = id)} />
		{:else}
			{#key view}
				<PlaceRun place={view} onExit={() => (view = 'map')} />
			{/key}
		{/if}

		<div class="hud">
			<button class="pill btn" onclick={() => (view === 'map' ? gameStore.setMode('menu') : (view = 'map'))}>
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
