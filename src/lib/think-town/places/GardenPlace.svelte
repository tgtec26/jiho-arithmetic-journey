<!-- 🌼 사랑이 정원 모양 스도쿠: 꽃씨를 고르고 화단 칸을 눌러 심기. 줄·네모마다 꽃이 하나씩이면 꽃이 핌 -->
<script lang="ts">
	import Board from '../diorama/Board.svelte';
	import Box3D from '../diorama/Box3D.svelte';
	import Doll from '../diorama/Doll.svelte';
	import FlowerArt from '../art/FlowerArt.svelte';
	import { conflicts, gardenHint, gardenSolution, isGardenSolved, parseGarden, plant, type Garden } from '../rules/garden-play';
	import { SHAPES } from '$think/logic.js';
	import { sound } from '../sound.svelte';

	let { puzzle, onSolved }: { puzzle: { grid: string[] }; onSolved: (r: { bonus: boolean }) => void } = $props();

	const CELL = 80;
	const GAP = 16; // 네모(2×2) 사이 길
	const PAD = 22;
	const BED_H = 12;
	const SIZE = PAD * 2 + CELL * 4 + GAP;
	const CAM = { cx: 430, cy: 440, tilt: 45, turn: -15, zoom: 1.4 };
	// svelte-ignore state_referenced_locally
	const start = parseGarden(puzzle.grid);
	const fixed = start.fixed;
	// svelte-ignore state_referenced_locally
	const solution = gardenSolution(puzzle.grid);

	let cells = $state<Garden>(start.cells);
	let pick = $state(SHAPES[0]);
	let solved = $state(false);
	let shaking = $state<string[]>([]);
	let hinted = $state<string | null>(null);
	let hintTok = 0;
	let shakeTok = 0;

	const bad = $derived(conflicts(cells));
	const pos = (i: number) => PAD + i * CELL + (i >= 2 ? GAP : 0);
	const key = (r: number, c: number) => `${r},${c}`;

	function shake(list: string[]) {
		const k = ++shakeTok;
		shaking = list;
		setTimeout(() => k === shakeTok && (shaking = []), 450);
	}

	function apply(next: Garden) {
		const before = conflicts(cells);
		cells = next;
		const after = conflicts(next);
		const fresh: string[] = [];
		after.forEach((row, r) => row.forEach((v, c) => v && !before[r][c] && fresh.push(key(r, c))));
		if (fresh.length) {
			sound.play('error');
			shake(fresh);
		} else sound.play('drop');
		if (isGardenSolved(next)) {
			solved = true;
			onSolved({ bonus: false });
		}
	}

	function tap(r: number, c: number) {
		if (solved) return;
		if (fixed[r][c]) {
			sound.play('bump');
			shake([key(r, c)]);
			return;
		}
		apply(plant(cells, fixed, r, c, pick));
	}

	export function hint() {
		if (solved) return;
		const h = gardenHint(cells, solution);
		if (!h) return;
		const k = ++hintTok;
		hinted = key(h.r, h.c);
		setTimeout(() => k === hintTok && (hinted = null), 1600);
		apply(plant(cells, fixed, h.r, h.c, h.shape));
	}
</script>

<Board width={SIZE} depth={SIZE} cx={CAM.cx} cy={CAM.cy} tilt={CAM.tilt} turn={CAM.turn} zoom={CAM.zoom} ground="#a9d68a" rim="#b98d5e">
	<div class="path" style="left:{PAD + CELL * 2}px;top:0;width:{GAP}px;height:{SIZE}px"></div>
	<div class="path" style="left:0;top:{PAD + CELL * 2}px;width:{SIZE}px;height:{GAP}px"></div>
	<!-- 네모 화단 4개, 윗면에 흙 칸 -->
	{#each [0, 2] as br}
		{#each [0, 2] as bc}
			<Box3D x={pos(bc) - 4} y={pos(br) - 4} w={CELL * 2 + 8} d={CELL * 2 + 8} h={BED_H} color="#b07a4a" radius={10}>
				{#snippet top()}
					{#each [0, 1] as dr}
						{#each [0, 1] as dc}
							{@const r = br + dr}
							{@const c = bc + dc}
							<div
								class="soil"
								class:fixed={fixed[r][c]}
								class:bad={bad[r][c]}
								class:hint={hinted === key(r, c)}
								style="left:{4 + dc * CELL + 3}px;top:{4 + dr * CELL + 3}px;width:{CELL - 6}px;height:{CELL - 6}px"
								role="presentation"
								onpointerdown={() => tap(r, c)}
							></div>
						{/each}
					{/each}
				{/snippet}
			</Box3D>
		{/each}
	{/each}
	<!-- 꽃 -->
	{#each cells as row, r}
		{#each row as ch, c}
			{#if ch !== '.'}
				<Doll
					x={pos(c) + CELL / 2}
					y={pos(r) + CELL / 2 + 8}
					z={BED_H}
					height={58}
					cls="flower w{r + c} {bad[r][c] ? 'bad' : ''} {shaking.includes(key(r, c)) ? 'shake' : ''} {solved ? 'bloom' : ''} {hinted === key(r, c) ? 'hinted' : ''}"
					onpointerdown={() => tap(r, c)}
				>
					<FlowerArt shape={ch} />
				</Doll>
			{/if}
		{/each}
	{/each}
</Board>

<div class="tray">
	<b class="title">꽃씨</b>
	<div class="seeds">
		{#each SHAPES as s}
			<button class="seed" class:on={pick === s} onclick={() => (pick = s)} aria-label="꽃 {s}">
				<span class="art"><FlowerArt shape={s} /></span>
			</button>
		{/each}
	</div>
</div>

<style>
	.path {
		position: absolute;
		background: repeating-linear-gradient(45deg, #e3dccb 0 10px, #d6cdb8 10px 20px);
	}
	.soil {
		position: absolute;
		border-radius: 10px;
		background: #8b5e3c;
		box-shadow: inset 0 3px 0 rgba(0, 0, 0, 0.18);
		cursor: pointer;
	}
	.soil.fixed {
		background: #74492b;
		box-shadow: inset 0 0 0 5px #e7d8b8;
	}
	.soil.bad {
		box-shadow: inset 0 0 0 5px #ff4d4d;
	}
	.soil.hint {
		animation: glow 0.4s ease-in-out infinite alternate;
	}
	@keyframes glow {
		to {
			background: #ffd94a;
		}
	}
	:global(.doll.flower .art) {
		transform-origin: 50% 100%;
		transition: filter 0.2s;
	}
	:global(.doll.flower.bad .art) {
		filter: drop-shadow(0 0 5px #ff2d2d) drop-shadow(0 0 2px #ff2d2d);
	}
	:global(.doll.flower.hinted .art) {
		filter: drop-shadow(0 0 8px #ffd400) drop-shadow(0 0 3px #ffd400);
	}
	:global(.doll.flower.shake .art) {
		animation: wobble 0.42s;
	}
	@keyframes wobble {
		20%,
		60% {
			translate: -7px 0;
		}
		40%,
		80% {
			translate: 7px 0;
		}
	}
	:global(.doll.flower.bloom .art) {
		animation: bloom 0.55s ease-in-out 2;
	}
	:global(.doll.flower.bloom.w1 .art) {
		animation-delay: 0.07s;
	}
	:global(.doll.flower.bloom.w2 .art) {
		animation-delay: 0.14s;
	}
	:global(.doll.flower.bloom.w3 .art) {
		animation-delay: 0.21s;
	}
	:global(.doll.flower.bloom.w4 .art) {
		animation-delay: 0.28s;
	}
	:global(.doll.flower.bloom.w5 .art) {
		animation-delay: 0.35s;
	}
	:global(.doll.flower.bloom.w6 .art) {
		animation-delay: 0.42s;
	}
	@keyframes bloom {
		50% {
			scale: 1.35;
		}
	}
	.tray {
		position: absolute;
		right: 26px;
		top: 120px;
		width: 430px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 28px;
		padding: 16px 20px 22px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
	}
	.title {
		font-size: 26px;
		font-weight: 900;
		color: #5a4630;
	}
	.seeds {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		width: 100%;
	}
	.seed {
		height: 170px;
		border-radius: 26px;
		background: #f6f1e6;
		border: 6px solid transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s, box-shadow 0.15s;
	}
	.seed .art {
		height: 140px;
		display: block;
	}
	.seed.on {
		border-color: #4d96ff;
		background: #eaf2ff;
		transform: translateY(-6px);
		box-shadow: 0 8px 0 #2f6fd6;
	}
</style>
