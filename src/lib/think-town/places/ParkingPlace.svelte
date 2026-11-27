<!-- 🚗 주차장 탈출: 차 상자를 축 방향으로 끌어 밀고, 빨간 차를 오른쪽 출구로 -->
<script lang="ts">
	import Board from '../diorama/Board.svelte';
	import Box3D from '../diorama/Box3D.svelte';
	import { getStage } from '../diorama/context';
	import { screenToBoard } from '../rules/camera';
	import {
		carsFromBoard,
		clampSlide,
		hintMove,
		isSolved,
		moveCar,
		posOf,
		slideRange,
		snapSlide,
		type Car,
		type Range
	} from '../rules/parking-play';
	import { EXIT_ROW, SIZE } from '$think/parking.js';
	import { sound } from '../sound.svelte';

	let { puzzle, onSolved }: { puzzle: { board: string[]; minMoves: number }; onSolved: (r: { bonus: boolean }) => void } = $props();

	const CELL = 76;
	const INSET = 5;
	const W = CELL * SIZE;
	const CAM = { cx: 640, cy: 455, tilt: 50, turn: -22, zoom: 1.22 };
	const COLORS = ['#4d96ff', '#ffb020', '#3fbf7f', '#9b6bd1', '#f28c28', '#2bb3c0', '#e86fa8', '#8a6a48', '#6c7ae0', '#c9a227', '#5aa469', '#d96c4f', '#7b8794'];
	const LETTERS = 'ABCDEFGHIJKLMNOPQSTUVWXYZ';
	const stageInfo = getStage();

	// svelte-ignore state_referenced_locally
	const start = carsFromBoard(puzzle.board);
	let cars = $state<Car[]>(start);
	let history = $state<Car[][]>([]);
	let moves = $state(0);
	let solved = $state(false);
	let hinted = $state<{ id: string; dir: string } | null>(null);

	let drag = $state<{ i: number; x0: number; y0: number; p0: number; pos: number; range: Range; bumped: boolean } | null>(null);

	const colorOf = (car: Car) => (car.id === 'R' ? '#e0473a' : COLORS[LETTERS.indexOf(car.id) % COLORS.length]);
	const shownPos = (car: Car, i: number) => (drag && drag.i === i ? drag.pos : posOf(car));

	function down(e: PointerEvent, i: number) {
		if (solved || drag) return;
		e.preventDefault();
		drag = { i, x0: e.clientX, y0: e.clientY, p0: posOf(cars[i]), pos: posOf(cars[i]), range: slideRange(cars, i), bumped: false };
	}

	function move(e: PointerEvent) {
		if (!drag) return;
		const d = screenToBoard(e.clientX - drag.x0, e.clientY - drag.y0, CAM.tilt, CAM.turn, stageInfo.scale * CAM.zoom);
		const raw = drag.p0 + (cars[drag.i].horizontal ? d.x : d.y) / CELL;
		const pos = clampSlide(drag.range, raw);
		const out = Math.abs(raw - pos) > 0.15;
		if (out && !drag.bumped) sound.play('bump');
		drag = { ...drag, pos, bumped: out };
	}

	function up() {
		if (!drag) return;
		const { i, p0, pos, range } = drag;
		const to = snapSlide(range, pos);
		drag = null;
		if (to === p0) return;
		history = [...history, cars];
		cars = moveCar(cars, i, to);
		moves += 1;
		sound.play('drop');
		if (isSolved(cars)) win();
	}

	function cancel() {
		drag = null;
	}

	function win() {
		solved = true;
		onSolved({ bonus: moves <= puzzle.minMoves });
	}

	function undo() {
		if (solved || !history.length) return;
		cars = history[history.length - 1];
		history = history.slice(0, -1);
		moves -= 1;
	}

	function reset() {
		if (solved) return;
		cars = start;
		history = [];
		moves = 0;
	}

	export function hint() {
		if (solved) return;
		const m = hintMove(cars);
		if (!m) return;
		hinted = { id: m.id, dir: m.dir };
		setTimeout(() => (hinted = null), 1600);
	}

	const ARROW_ROT: Record<string, number> = { right: 0, down: 90, left: 180, up: 270 };
</script>

<svelte:window onpointermove={move} onpointerup={up} onpointercancel={cancel} />

<Board width={W} depth={W} cx={CAM.cx} cy={CAM.cy} tilt={CAM.tilt} turn={CAM.turn} zoom={CAM.zoom} ground="#7d848e" rim="#c9a77a">
	<!-- 칸 선 -->
	<div class="grid" style="width:{W}px;height:{W}px;background-size:{CELL}px {CELL}px"></div>
	<!-- 출구 -->
	<div class="exit" style="left:{W - 4}px;top:{EXIT_ROW * CELL}px;width:{CELL * 1.6}px;height:{CELL}px"></div>
	{#each cars as car, i (car.id)}
		{@const p = shownPos(car, i)}
		{@const away = solved && car.id === 'R'}
		{@const x = (car.horizontal ? p : car.col) * CELL + INSET + (away ? CELL * 3 : 0)}
		{@const y = (car.horizontal ? car.row : p) * CELL + INSET}
		{@const w = (car.horizontal ? car.len : 1) * CELL - INSET * 2}
		{@const d = (car.horizontal ? 1 : car.len) * CELL - INSET * 2}
		<Box3D
			{x}
			{y}
			{w}
			{d}
			h={car.len === 3 ? 44 : 32}
			color={colorOf(car)}
			radius={8}
			cls="car {drag?.i === i ? 'dragging' : ''} {away ? 'away' : ''} {hinted?.id === car.id ? 'hinted' : ''}"
			onpointerdown={(e) => down(e, i)}
		>
			{#snippet top()}
				<div class="roof" class:vertical={!car.horizontal}></div>
				{#if hinted?.id === car.id}
					<div class="arrow" style="transform:translate(-50%,-50%) rotate({ARROW_ROT[hinted.dir]}deg)">➜</div>
				{/if}
			{/snippet}
		</Box3D>
	{/each}
</Board>

<div class="counter">
	<span>움직임 <b>{moves}</b></span>
	<span class="goal">가장 적게 <b>{puzzle.minMoves}</b>번</span>
</div>

<div class="tools">
	<button onclick={undo} disabled={!history.length || solved} aria-label="되돌리기">↩</button>
	<button onclick={reset} disabled={!moves || solved} aria-label="처음부터">⟲</button>
</div>

<style>
	.grid {
		position: absolute;
		left: 0;
		top: 0;
		border-radius: 14px;
		background-image: linear-gradient(rgba(255, 255, 255, 0.35) 2px, transparent 2px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.35) 2px, transparent 2px);
	}
	.exit {
		position: absolute;
		transform: translateZ(1px);
		border-radius: 0 10px 10px 0;
		background: #7d848e repeating-linear-gradient(90deg, #ffd23f 0 14px, transparent 14px 28px) center / 100% 8px no-repeat;
	}
	:global(.car) {
		cursor: grab;
		transition: transform 0.14s ease-out;
	}
	:global(.car.dragging) {
		transition: none;
	}
	:global(.car.away) {
		transition: transform 0.8s ease-in;
	}
	:global(.car.hinted .topface) {
		animation: glow 0.5s ease-in-out infinite alternate;
	}
	@keyframes glow {
		to {
			filter: brightness(1.6);
		}
	}
	.roof {
		position: absolute;
		inset: 22% 30%;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.45);
	}
	.roof.vertical {
		inset: 30% 22%;
	}
	.arrow {
		position: absolute;
		left: 50%;
		top: 50%;
		font-size: 44px;
		color: #fff;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}
	.counter {
		position: absolute;
		top: 92px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 14px;
		font-size: 24px;
		font-weight: 800;
	}
	.counter span {
		background: #fff;
		padding: 10px 22px;
		border-radius: 999px;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.14);
	}
	.counter .goal {
		background: #fff3c4;
	}
	.tools {
		position: absolute;
		right: 28px;
		bottom: 28px;
		display: flex;
		gap: 14px;
	}
	.tools button {
		width: 84px;
		height: 84px;
		border-radius: 22%;
		background: #fff;
		font-size: 40px;
		font-weight: 900;
		color: #2f6fd6;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
	}
	.tools button:disabled {
		opacity: 0.4;
	}
	.tools button:active:not(:disabled) {
		transform: scale(0.92);
	}
</style>
