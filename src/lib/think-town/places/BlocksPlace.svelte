<!-- 🧱 블록 공방 쌓기나무: 바닥 칸이나 탑을 눌러 쌓기·빼기, 90°씩 돌려 보기, 설계도와 같으면 확인 -->
<script lang="ts">
	import Board from '../diorama/Board.svelte';
	import Box3D from '../diorama/Box3D.svelte';
	import Doll from '../diorama/Doll.svelte';
	import BlockView from './BlockView.svelte';
	import { addBlock, blockHint, blueprintOf, checkBuild, emptyBuild, minBlocks, removeBlock, type Heights } from '../rules/blocks-play';
	import { sound } from '../sound.svelte';

	let { puzzle, stage, onSolved }: { puzzle: { heights: string[] }; stage: number; onSolved: (r: { bonus: boolean }) => void } = $props();

	const CELL = 84;
	const S = 78; // 블록 한 개(정육면체), 칸 안에 3px씩 여백
	const PAD = 30;
	const LEVEL = ['#ffb547', '#ff7f6b', '#5cc3e8']; // 층마다 색
	// svelte-ignore state_referenced_locally
	const bp = blueprintOf(puzzle.heights, stage);
	const min = minBlocks(bp);
	const W = bp.cols * CELL + PAD * 2;
	const D = bp.rows * CELL + PAD * 2;
	const zoom = Math.max(bp.rows, bp.cols) >= 3 ? 1.4 : 1.75;

	let build = $state<Heights>(emptyBuild(bp));
	let mode = $state<'add' | 'remove'>('add');
	let spin = $state(0);
	let results = $state<ReturnType<typeof checkBuild> | null>(null);
	let shakeKey = $state(0);
	let hinted = $state<{ r: number; c: number; h: number } | null>(null);
	let glowCheck = $state(false);
	let solved = $state(false);
	let landed = $state<string | null>(null);
	let bumped = $state<string | null>(null);
	let hintTok = 0;

	const count = $derived(build.flat().reduce((a, b) => a + b, 0));
	const cellX = (c: number) => PAD + c * CELL + 3;
	const cellY = (r: number) => PAD + r * CELL + 3;

	function act(r: number, c: number) {
		if (solved) return;
		const next = mode === 'add' ? addBlock(build, r, c) : removeBlock(build, r, c);
		const key = `${r},${c}`;
		if (next === build) {
			sound.play('bump');
			bumped = key;
			setTimeout(() => bumped === key && (bumped = null), 350);
			return;
		}
		build = next;
		results = null;
		sound.play('drop');
		if (mode === 'add') {
			landed = `${key},${next[r][c] - 1}`;
			setTimeout(() => (landed = null), 300);
		}
	}

	function reset() {
		if (solved) return;
		build = emptyBuild(bp);
		results = null;
	}

	function check() {
		if (!count || solved) return;
		const r = checkBuild(build, bp);
		results = r;
		if (r.top && r.front && r.side) {
			solved = true;
			onSolved({ bonus: !bp.numbers && count === min });
		} else {
			sound.play('error');
			shakeKey += 1;
		}
	}

	export function hint() {
		if (solved) return;
		const k = ++hintTok;
		const h = blockHint(build, bp);
		// 칸 반짝임과 확인 버튼 반짝임은 같은 타이머로 함께 끈다(힌트를 빨리 두 번 눌러도 남지 않게)
		hinted = h;
		glowCheck = !h;
		setTimeout(() => {
			if (k !== hintTok) return;
			hinted = null;
			glowCheck = false;
		}, 1600);
	}
</script>

<Board width={W} depth={D} cx={420} cy={530} tilt={55} turn={-30 + spin * 90} {zoom} ground="#e6cc9a" rim="#b98d5e" cls="spin">
	<div class="planks" style="width:{W}px;height:{D}px"></div>
	{#each build as row, r}
		{#each row as h, c}
			<div
				class="cell"
				class:hint={hinted?.r === r && hinted?.c === c}
				class:bump={bumped === `${r},${c}`}
				style="left:{cellX(c)}px;top:{cellY(r)}px;width:{S}px;height:{S}px"
				role="presentation"
				onpointerdown={() => act(r, c)}
			></div>
			{#each Array(h) as _, k (k)}
				<Box3D
					x={cellX(c)}
					y={cellY(r)}
					z={k * S}
					w={S}
					d={S}
					h={S}
					color={LEVEL[k]}
					radius={6}
					cls="cube w{r + c} {landed === `${r},${c},${k}` ? 'landed' : ''} {solved ? 'hop' : ''}"
					onpointerdown={() => act(r, c)}
				/>
			{/each}
		{/each}
	{/each}
	<!-- 판 밖 탁자 위에 세운 글자: 설계도의 앞·옆이 판의 어느 쪽인지 -->
	<Doll x={W / 2} y={D + 34} height={46} cls="spin-bb"><span class="side">앞</span></Doll>
	<Doll x={W + 34} y={D / 2} height={46} cls="spin-bb"><span class="side">옆</span></Doll>
	{#if hinted}
		<Doll
			x={cellX(hinted.c) + S / 2}
			y={cellY(hinted.r) + S / 2}
			z={build[hinted.r][hinted.c] * S + 6}
			height={52}
			cls="spin-bb"
		>
			<span class="tip">{hinted.h ? `${hinted.h}층` : '비워요'}</span>
		</Doll>
	{/if}
</Board>

<button class="turn l" onclick={() => (spin -= 1)} aria-label="왼쪽으로 돌리기">↶</button>
<button class="turn r" onclick={() => (spin += 1)} aria-label="오른쪽으로 돌리기">↷</button>

<div class="tools">
	<button class="mode" class:on={mode === 'add'} onclick={() => (mode = 'add')}>➕ 쌓기</button>
	<button class="mode" class:on={mode === 'remove'} onclick={() => (mode = 'remove')}>➖ 빼기</button>
	<button class="sq" onclick={reset} disabled={!count || solved} aria-label="처음부터">⟲</button>
</div>

<div class="panel">
	{#key shakeKey}
		{#if bp.numbers}
			<div class:shake={results?.top === false}>
				<BlockView kind="numbers" {bp} state={results ? results.top : null} wrong={results?.wrong ?? []} />
			</div>
		{:else}
			<div class:shake={results?.top === false}><BlockView kind="top" {bp} state={results ? results.top : null} /></div>
			<div class="pair">
				<div class:shake={results?.front === false}><BlockView kind="front" {bp} state={results ? results.front : null} /></div>
				<div class:shake={results?.side === false}><BlockView kind="side" {bp} state={results ? results.side : null} /></div>
			</div>
		{/if}
	{/key}
	<div class="count">
		<span>블록 <b>{count}</b>개</span>
		{#if !bp.numbers}<span class="goal">가장 적게 <b>{min}</b>개</span>{/if}
	</div>
	<button class="check" class:glow={glowCheck} disabled={!count || solved} onclick={check}>확인</button>
</div>

<style>
	:global(.board.spin),
	:global(.doll.spin-bb) {
		transition: transform 0.5s ease-in-out;
	}
	.planks {
		position: absolute;
		left: 0;
		top: 0;
		border-radius: 14px;
		background: repeating-linear-gradient(90deg, rgba(120, 80, 30, 0.12) 0 2px, transparent 2px 42px);
	}
	.cell {
		position: absolute;
		transform: translateZ(0.5px);
		border-radius: 8px;
		border: 3px dashed rgba(143, 109, 69, 0.55);
		background: rgba(255, 255, 255, 0.25);
		cursor: pointer;
	}
	.cell.hint {
		border: 4px solid #ffc400;
		animation: glow 0.4s ease-in-out infinite alternate;
	}
	.cell.bump {
		background: rgba(255, 77, 77, 0.35);
	}
	@keyframes glow {
		to {
			background: rgba(255, 228, 120, 0.9);
		}
	}
	:global(.cube) {
		cursor: pointer;
	}
	:global(.cube.landed) {
		animation: land 0.25s ease-in;
	}
	@keyframes land {
		from {
			translate: 0 0 70px;
		}
	}
	:global(.cube.hop) {
		animation: hop 0.5s ease-in-out 3;
	}
	:global(.cube.hop.w1) {
		animation-delay: 0.08s;
	}
	:global(.cube.hop.w2) {
		animation-delay: 0.16s;
	}
	:global(.cube.hop.w3) {
		animation-delay: 0.24s;
	}
	:global(.cube.hop.w4) {
		animation-delay: 0.32s;
	}
	@keyframes hop {
		50% {
			translate: 0 0 34px;
		}
	}
	.side {
		display: block;
		white-space: nowrap;
		font-size: 30px;
		font-weight: 900;
		color: #2f6fd6;
		background: #fff;
		border-radius: 12px;
		padding: 0 12px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}
	.tip {
		display: block;
		white-space: nowrap;
		font-size: 30px;
		font-weight: 900;
		color: #6b4d00;
		background: #ffe27a;
		border-radius: 14px;
		padding: 2px 14px;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
	}
	.turn {
		position: absolute;
		top: 460px;
		width: 84px;
		height: 84px;
		border-radius: 50%;
		background: #fff;
		color: #2f6fd6;
		font-size: 44px;
		font-weight: 900;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
	}
	.turn.l {
		left: 28px;
	}
	.turn.r {
		left: 728px;
	}
	.tools {
		position: absolute;
		left: 290px;
		bottom: 26px;
		display: flex;
		gap: 12px;
	}
	.tools button {
		height: 84px;
		border-radius: 26px;
		background: #fff;
		font-size: 28px;
		font-weight: 900;
		color: #5a4630;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
	}
	.mode {
		padding: 0 22px;
	}
	.mode.on {
		background: #4d96ff;
		color: #fff;
		box-shadow: 0 6px 0 #2f6fd6;
	}
	.sq {
		width: 84px;
		font-size: 40px !important;
		color: #2f6fd6 !important;
	}
	.sq:disabled {
		opacity: 0.4;
	}
	.panel {
		position: absolute;
		right: 26px;
		top: 92px;
		width: 430px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.pair > div {
		display: flex;
	}
	.pair > div > :global(.card) {
		flex: 1;
	}
	.shake {
		animation: shake 0.45s;
	}
	@keyframes shake {
		20%,
		60% {
			transform: translateX(-10px);
		}
		40%,
		80% {
			transform: translateX(10px);
		}
	}
	.count {
		display: flex;
		justify-content: center;
		gap: 12px;
		font-size: 24px;
		font-weight: 800;
	}
	.count span {
		background: #fff;
		padding: 8px 20px;
		border-radius: 999px;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.14);
	}
	.count .goal {
		background: #fff3c4;
	}
	.check {
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
	.check.glow {
		animation: glowbtn 0.4s ease-in-out infinite alternate;
	}
	@keyframes glowbtn {
		to {
			background: #ffc400;
			box-shadow: 0 6px 0 #d19a00;
		}
	}
	.check:active:not(:disabled) {
		transform: translateY(4px);
		box-shadow: 0 2px 0 #2f6fd6;
	}
</style>
