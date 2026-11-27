<!-- 🎫 기차역 매표소 줄 세우기: 인형을 끌어 줄 칸에 세우고, 확인하면 단서 카드마다 맞음/틀림 -->
<script lang="ts">
	import Board from '../diorama/Board.svelte';
	import Box3D from '../diorama/Box3D.svelte';
	import Doll from '../diorama/Doll.svelte';
	import { getStage, projectOnStage, type BoardInfo } from '../diorama/context';
	import { clueResults, hintClue, isLineupSolved, placeInSlot, type Clue, type Slots } from '../rules/lineup-play';
	import { clueText } from '$think/logic.js';
	import { CAST } from '../data/cast';
	import { sound } from '../sound.svelte';

	let { puzzle, onSolved }: { puzzle: { items: string[]; clues: Clue[] }; onSolved: (r: { bonus: boolean }) => void } = $props();

	const CAM: BoardInfo = { width: 600, depth: 290, cx: 445, cy: 540, tilt: 55, turn: -10, zoom: 1.22 };
	const SLOT_GAP = 92;
	const SLOT_X0 = 190;
	const SLOT_Y = 205;
	const DOLL_H = 132;
	const BENCH_Y = 70;
	const stageInfo = getStage();

	// svelte-ignore state_referenced_locally
	const names = puzzle.items;
	let slots = $state<Slots>(names.map(() => null));
	let results = $state<(boolean | null)[]>([]);
	let shakeKey = $state(0);
	let hinted = $state(-1);
	let solved = $state(false);
	let walking = $state(false);
	let overlay = $state<HTMLDivElement>();
	let drag = $state<{ name: string; x: number; y: number } | null>(null);
	let landed = $state<string | null>(null);

	const slotPos = (i: number) => ({ x: SLOT_X0 + i * SLOT_GAP, y: SLOT_Y });
	const benchPos = (k: number) => ({ x: 300 + k * 66, y: BENCH_Y });
	const waiting = $derived(names.filter((n) => !slots.includes(n)));
	const full = $derived(slots.every((s) => s !== null));
	const clueCls = (i: number) => (hinted === i ? 'hint' : results[i] === true ? 'ok' : results[i] === false ? 'bad' : '');

	function toStage(e: PointerEvent) {
		const r = overlay!.getBoundingClientRect();
		return { x: (e.clientX - r.left) / stageInfo.scale, y: (e.clientY - r.top) / stageInfo.scale };
	}

	function down(e: PointerEvent, name: string) {
		if (solved || drag) return;
		e.preventDefault();
		drag = { name, ...toStage(e) };
	}

	function move(e: PointerEvent) {
		if (drag) drag = { ...drag, ...toStage(e) };
	}

	function up() {
		if (!drag) return;
		const { name, x, y } = drag;
		drag = null;
		// 손가락 위치 = 인형 발 위치. 가장 가까운 칸(90px 안)에 세우고, 멀면 의자로
		let best = -1;
		let bestD = 90;
		slots.forEach((_, i) => {
			const p = projectOnStage(CAM, slotPos(i).x, slotPos(i).y);
			const d = Math.hypot(p.x - x, p.y - y);
			if (d < bestD) [best, bestD] = [i, d];
		});
		const before = slots;
		slots = best >= 0 ? placeInSlot(slots, name, best) : slots.map((s) => (s === name ? null : s));
		if (slots.some((s, i) => s !== before[i])) {
			results = [];
			sound.play('drop');
			landed = name;
			setTimeout(() => (landed = null), 300);
		}
	}

	function check() {
		if (!full || solved) return;
		const r = clueResults(slots as string[], puzzle.clues);
		results = r;
		if (isLineupSolved(slots, puzzle.clues)) {
			solved = true;
			walking = true;
			onSolved({ bonus: false });
		} else {
			sound.play('error');
			shakeKey += 1;
		}
	}

	export function hint() {
		if (solved) return;
		hinted = hintClue(slots, puzzle.clues);
		setTimeout(() => (hinted = -1), 1600);
	}
</script>

<svelte:window onpointermove={move} onpointerup={up} onpointercancel={() => (drag = null)} />

<div class="overlay" bind:this={overlay}></div>

<Board width={CAM.width} depth={CAM.depth} cx={CAM.cx} cy={CAM.cy} tilt={CAM.tilt} turn={CAM.turn} zoom={CAM.zoom} ground="#d9cdb4" rim="#b98d5e">
	<!-- 승강장 바닥 무늬와 레일 -->
	<div class="tiles" style="width:{CAM.width}px;height:{CAM.depth - 40}px"></div>
	<div class="rail" style="top:{CAM.depth - 34}px;width:{CAM.width}px"></div>
	<!-- 줄 칸 -->
	{#each slots as _, i}
		{@const p = slotPos(i)}
		<div class="slot" style="left:{p.x - 34}px;top:{p.y - 34}px"><b>{i + 1}</b></div>
	{/each}
	<div class="front" style="left:{SLOT_X0 - 120}px;top:{SLOT_Y + 46}px">앞</div>
	<!-- 대기 의자 -->
	<Box3D x={270} y={BENCH_Y - 26} w={names.length * 66 + 0} d={40} h={20} color="#b07a4a" radius={6} />
	<!-- 매표소 -->
	<Doll x={70} y={185} sticker="prop-ticket-booth" height={205} />
	<!-- 인형들 -->
	{#each names as name (name)}
		{@const at = slots.indexOf(name)}
		{@const p = at >= 0 ? slotPos(at) : benchPos(waiting.indexOf(name))}
		<Doll
			x={p.x - (walking ? 40 : 0)}
			y={p.y}
			z={at >= 0 ? 0 : 20}
			sticker={CAST[name]}
			height={at >= 0 ? DOLL_H : DOLL_H * 0.72}
			hidden={drag?.name === name}
			cls="person {landed === name ? 'landed' : ''} {walking ? 'walking' : ''}"
			onpointerdown={(e) => down(e, name)}
		/>
	{/each}
</Board>

<!-- 이름표 -->
{#each names as name (name)}
	{#if drag?.name !== name}
		{@const at = slots.indexOf(name)}
		{@const p = at >= 0 ? slotPos(at) : benchPos(waiting.indexOf(name))}
		{@const s = projectOnStage(CAM, p.x - (walking ? 40 : 0), p.y, at >= 0 ? 0 : 20)}
		<span class="tag" class:walking style="left:{s.x}px;top:{s.y + 6}px">{name}</span>
	{/if}
{/each}

{#if drag}
	<img class="ghost" src="/think-town/stickers/{CAST[drag.name]}.png" alt="" style="left:{drag.x}px;top:{drag.y}px;height:{DOLL_H * CAM.zoom}px" />
{/if}

<div class="clues">
	{#key shakeKey}
		{#each puzzle.clues as c, i}
			<div class="clue {clueCls(i)}" class:shake={results[i] === false}>
				<span class="mark">{results[i] === true ? '✓' : results[i] === false ? '✕' : i + 1}</span>
				<span>{clueText(c)}</span>
			</div>
		{/each}
	{/key}
	<button class="check" disabled={!full || solved} onclick={check}>확인</button>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.tiles {
		position: absolute;
		left: 0;
		top: 0;
		border-radius: 14px 14px 0 0;
		background-image: linear-gradient(rgba(0, 0, 0, 0.06) 2px, transparent 2px),
			linear-gradient(90deg, rgba(0, 0, 0, 0.06) 2px, transparent 2px);
		background-size: 46px 46px;
	}
	.rail {
		position: absolute;
		left: 0;
		height: 26px;
		background: #8c7a66 repeating-linear-gradient(90deg, #5e4b39 0 6px, transparent 6px 22px);
		border-top: 4px solid #f2c230;
	}
	.slot {
		position: absolute;
		width: 68px;
		height: 68px;
		border-radius: 50%;
		border: 4px dashed #4d96ff;
		background: rgba(77, 150, 255, 0.12);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	.slot b {
		transform: translateY(32px);
		font-size: 22px;
		color: #2f6fd6;
	}
	.front {
		position: absolute;
		font-size: 40px;
		font-weight: 900;
		color: #2f6fd6;
		background: #fff;
		border-radius: 12px;
		padding: 2px 14px;
	}
	:global(.person) {
		transition: transform 0.25s ease-out;
	}
	:global(.person.walking) {
		transition: transform 1.1s ease-in-out;
	}
	:global(.person.landed img) {
		animation: hop 0.3s ease-out;
	}
	@keyframes hop {
		50% {
			transform: translate(-50%, -14px);
		}
	}
	.tag {
		position: absolute;
		transform: translateX(-50%);
		background: #fff;
		border-radius: 999px;
		padding: 2px 12px;
		font-weight: 900;
		font-size: 18px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
		pointer-events: none;
		transition: left 0.25s, top 0.25s;
	}
	.tag.walking {
		transition: left 1.1s ease-in-out;
	}
	.ghost {
		position: absolute;
		transform: translate(-50%, -100%) scale(1.06);
		pointer-events: none;
		filter: drop-shadow(0 14px 10px rgba(0, 0, 0, 0.3));
		z-index: 80;
	}
	.clues {
		position: absolute;
		right: 26px;
		top: 100px;
		width: 440px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.clue {
		display: flex;
		align-items: center;
		gap: 14px;
		background: #fff;
		border-radius: 20px;
		padding: 14px 18px;
		font-size: 25px;
		font-weight: 800;
		line-height: 1.3;
		word-break: keep-all;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.14);
		border: 4px solid transparent;
	}
	.mark {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #eef3ff;
		color: #2f6fd6;
		font-weight: 900;
	}
	.clue.ok {
		border-color: #3fbf7f;
	}
	.clue.ok .mark {
		background: #3fbf7f;
		color: #fff;
	}
	.clue.bad {
		border-color: #ff4d4d;
	}
	.clue.bad .mark {
		background: #ff4d4d;
		color: #fff;
	}
	.clue.hint {
		border-color: #ffc400;
		animation: glow 0.4s ease-in-out infinite alternate;
	}
	@keyframes glow {
		to {
			background: #fff3c4;
		}
	}
	.clue.shake {
		animation: shake 0.45s;
	}
	@keyframes shake {
		20%, 60% { transform: translateX(-10px); }
		40%, 80% { transform: translateX(10px); }
	}
	.check {
		margin-top: 6px;
		height: 84px;
		border-radius: 26px;
		background: #4d96ff;
		color: #fff;
		font-size: 32px;
		font-weight: 900;
		box-shadow: 0 6px 0 #2f6fd6;
	}
	.check:disabled {
		background: #c9d6ea;
		box-shadow: 0 6px 0 #aab7cc;
	}
	.check:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 2px 0 #2f6fd6;
	}
</style>
