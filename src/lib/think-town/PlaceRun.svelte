<!-- 장소 한 번 하기: (이야기) → 퍼즐 판 n개 → (대화 카드) → 도장 -->
<script lang="ts">
	import P from './data/puzzles.json';
	import ParkingPlace from './places/ParkingPlace.svelte';
	import { townStore } from './progress.svelte';
	import { sound } from './sound.svelte';
	import { finish, nextBoard, nextPanel, solve, startRun, PANELS, type Run } from './rules/run';
	import type { PlaceId } from './rules/progress';

	let { place, onExit }: { place: PlaceId; onExit: () => void } = $props();

	type ParkingPuzzle = { board: string[]; minMoves: number };

	// svelte-ignore state_referenced_locally
	const stage = townStore.stage(place);
	// svelte-ignore state_referenced_locally
	const items: ParkingPuzzle[] = townStore.takeFor(place, P.parking).sort((a, b) => a.minMoves - b.minMoves);

	const skipStory = (r: Run) => Array.from({ length: PANELS }).reduce<Run>((acc) => nextPanel(acc), r);
	let run = $state<Run>(skipStory(startRun(items.length)));
	let pop = $state<{ n: number; key: number } | null>(null);
	let placeRef = $state<{ hint: () => void }>();

	function onSolved({ bonus }: { bonus: boolean }) {
		const r = solve(run, bonus);
		if (!r.gained) return;
		run = r.run;
		townStore.award(r.gained);
		sound.play('correct');
		pop = { n: r.gained, key: Date.now() };
		setTimeout(() => {
			pop = null;
			run = nextBoard(run);
			if (run.phase === 'talk') {
				run = finish(run);
				townStore.clear(place);
				onExit();
			}
		}, 1700);
	}
</script>

<div class="steps">
	<span class="stage">{stage}단계</span>
	{#each run.solved as done, i}
		<i class:done class:now={i === run.board && run.phase === 'board'}></i>
	{/each}
</div>

{#if run.phase === 'board'}
	{#key run.board}
		<ParkingPlace bind:this={placeRef} puzzle={items[run.board]} {onSolved} />
	{/key}
{/if}

{#if pop}
	{#key pop.key}
		<div class="pop">
			{#each Array(pop.n) as _}<span>⭐</span>{/each}
			<b>+{pop.n}</b>
		</div>
	{/key}
{/if}

<style>
	.steps {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 10px;
		z-index: 60;
		background: rgba(255, 255, 255, 0.94);
		height: 44px;
		padding: 0 18px;
		border-radius: 999px;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.14);
	}
	.stage {
		font-weight: 900;
		font-size: 18px;
		margin-right: 4px;
	}
	.steps i {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #ddd;
	}
	.steps i.now {
		background: #4d96ff;
		box-shadow: 0 0 0 3px #cfe0ff;
	}
	.steps i.done {
		background: #ffb400;
	}
	.pop {
		position: absolute;
		left: 50%;
		top: 40%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 84px;
		z-index: 70;
		pointer-events: none;
		animation: pop 1.6s cubic-bezier(0.2, 1.4, 0.4, 1) forwards;
		filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
	}
	.pop b {
		font-size: 72px;
		color: #ffb400;
		-webkit-text-stroke: 4px #fff;
		paint-order: stroke;
	}
	@keyframes pop {
		0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
		20% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
		35% { transform: translate(-50%, -50%) scale(1); }
		80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
		100% { transform: translate(-50%, -160%) scale(0.6); opacity: 0; }
	}
</style>
