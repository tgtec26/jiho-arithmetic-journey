<!-- 장소 한 번 하기: 이야기 3컷 → 퍼즐 판 n개 → 대화 카드 → 도장 피날레 -->
<script lang="ts">
	import P from './data/puzzles.json';
	import { STORIES, TALK } from './data/stories';
	import { placeOf } from './data/places';
	import ParkingPlace from './places/ParkingPlace.svelte';
	import TicketPlace from './places/TicketPlace.svelte';
	import BlocksPlace from './places/BlocksPlace.svelte';
	import GardenPlace from './places/GardenPlace.svelte';
	import StoryScene from './StoryScene.svelte';
	import TalkCard from './TalkCard.svelte';
	import Finale from './Finale.svelte';
	import LongPressButton from './LongPressButton.svelte';
	import { townStore } from './progress.svelte';
	import { sound } from './sound.svelte';
	import { finish, giveTalkStar, nextBoard, nextPanel, solve, startRun, type Run } from './rules/run';
	import type { PlaceId } from './rules/progress';

	let { place, onExit }: { place: PlaceId; onExit: () => void } = $props();

	type ParkingPuzzle = { board: string[]; minMoves: number };
	type LineupPuzzle = (typeof P.lineup)[number][number];

	// svelte-ignore state_referenced_locally
	const info = placeOf(place);
	// svelte-ignore state_referenced_locally
	const stage = townStore.stage(place);
	// 주차장은 한 번 안에서 쉬운 판부터
	// svelte-ignore state_referenced_locally
	const parking: ParkingPuzzle[] = place === 'parking' ? townStore.takeFor(place, P.parking).sort((a, b) => a.minMoves - b.minMoves) : [];
	// svelte-ignore state_referenced_locally
	const lineup: LineupPuzzle[] = place === 'ticket' ? townStore.takeFor(place, P.lineup) : [];
	// 블록도 블록 수가 적은 판부터
	const blockN = (p: { heights: string[] }) => [...p.heights.join('')].reduce((a, ch) => a + Number(ch), 0);
	// svelte-ignore state_referenced_locally
	const blocks = place === 'blocks' ? townStore.takeFor(place, P.blocks).sort((a, b) => blockN(a) - blockN(b)) : [];
	// 정원은 빈칸이 적은 판부터
	const blanks = (p: { grid: string[] }) => [...p.grid.join('')].filter((ch) => ch === '.').length;
	// svelte-ignore state_referenced_locally
	const garden = place === 'garden' ? townStore.takeFor(place, P.garden).sort((a, b) => blanks(a) - blanks(b)) : [];
	const boards = parking.length || lineup.length || blocks.length || garden.length;
	// svelte-ignore state_referenced_locally
	const story = STORIES[place]![stage - 1];

	let run = $state<Run>(startRun(boards));
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
		}, 1700);
	}

	function talkStar() {
		const r = giveTalkStar(run);
		if (!r.gained) return;
		run = r.run;
		townStore.award(r.gained);
		sound.play('correct');
		pop = { n: 1, key: Date.now() };
		setTimeout(() => (pop = null), 1600);
	}

	function toFinale() {
		run = finish(run);
		townStore.clear(place);
	}
</script>

{#if run.phase === 'story'}
	<StoryScene {place} panel={story[run.panel]} index={run.panel} onnext={() => (run = nextPanel(run))} />
{:else}
	<div class="steps">
		<span class="stage">{info.icon} {stage}단계</span>
		{#each run.solved as done, i}
			<i class:done class:now={i === run.board && run.phase === 'board'}></i>
		{/each}
	</div>

	{#key run.board}
		{#if place === 'parking'}
			<ParkingPlace bind:this={placeRef} puzzle={parking[run.board]} {onSolved} />
		{:else if place === 'ticket'}
			<TicketPlace bind:this={placeRef} puzzle={lineup[run.board]} {onSolved} />
		{:else if place === 'blocks'}
			<BlocksPlace bind:this={placeRef} puzzle={blocks[run.board]} {stage} {onSolved} />
		{:else if place === 'garden'}
			<GardenPlace bind:this={placeRef} puzzle={garden[run.board]} {onSolved} />
		{/if}
	{/key}

	{#if run.phase === 'board'}
		<div class="hint">
			<LongPressButton label="아빠 힌트 (꾹)" disabled={run.solved[run.board]} onfire={() => placeRef?.hint()} />
		</div>
	{:else if run.phase === 'talk'}
		<TalkCard question={TALK[place]} starred={run.talkStar} onstar={talkStar} ondone={toFinale} />
	{:else if run.phase === 'finale'}
		<Finale icon={info.icon} placeName={info.name} {stage} stars={run.stars} ondone={onExit} />
	{/if}
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
	.hint {
		position: absolute;
		left: 26px;
		bottom: 26px;
		z-index: 60;
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
