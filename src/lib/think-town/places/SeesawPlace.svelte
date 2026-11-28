<!-- ⚖️ 시소 놀이터 무게 추론: 의자 인형을 시소에 둘 태워 재고, 답이 확정되면 시상대에 무거운 순서로 올린다 -->
<script lang="ts">
	import Board from '../diorama/Board.svelte';
	import Box3D from '../diorama/Box3D.svelte';
	import Doll from '../diorama/Doll.svelte';
	import ToyArt from '../art/ToyArt.svelte';
	import { checkPodium, podiumSlots, seesawHint, startSeesaw, weigh, type Seesaw } from '../rules/seesaw-play';
	import type { SeesawPuzzle } from '../data/seesaw';
	import { sound } from '../sound.svelte';

	let { puzzle, onSolved }: { puzzle: SeesawPuzzle; onSolved: (r: { bonus: boolean }) => void } = $props();

	// 판 700×300: 왼쪽 시소, 오른쪽 시상대, 앞쪽 의자
	const PX = 200; // 시소 받침 가운데
	const PY = 135;
	const PIVOT_H = 44;
	const SEAT = 128; // 받침에서 자리까지
	const PLANK_TOP = PIVOT_H + 10;
	const ANGLE = 12;
	const TOY_H = 90;

	// svelte-ignore state_referenced_locally
	const n = puzzle.cast.length;
	const bias = [...Array(n).keys()].sort(() => Math.random() - 0.5);
	// svelte-ignore state_referenced_locally
	const start = startSeesaw(n, puzzle.goal, bias);
	let s = $state<Seesaw>(start);
	const slots = podiumSlots(start);
	const STEP_H = [70, 54, 38, 22];
	const steps =
		slots === 1
			? [{ x: 515, w: 90, h: 64 }]
			: Array.from({ length: slots }, (_, k) => ({ x: 430 + k * 66, w: 62, h: STEP_H[k] }));
	const bench = Array.from({ length: n }, (_, i) => ({ x: 110 + (i * 480) / (n - 1), y: 264, z: 16 }));

	let mode = $state<'weigh' | 'podium'>('weigh');
	let seats = $state<(number | null)[]>([null, null]);
	let tilt = $state(0); // -1 왼쪽이 무거움, 1 오른쪽
	let podium = $state<number[]>([]);
	let busy = false;
	let solved = $state(false);
	let fresh = $state(-1);
	let tag = $state<{ text: string; key: number } | null>(null);
	let wobble = $state(0);
	let podShake = $state(0);
	let glowToys = $state<number[]>([]);
	let glowPodium = $state(false);
	let toks = { tag: 0, hint: 0 };

	const count = $derived(s.results.length);

	const later = (k: keyof typeof toks, ms: number, fn: () => void) => {
		const t = ++toks[k];
		setTimeout(() => t === toks[k] && fn(), ms);
	};
	const say = (text: string, ms = 1400) => {
		tag = { text, key: Date.now() };
		later('tag', ms, () => (tag = null));
	};

	function spot(i: number) {
		const seat = seats.indexOf(i);
		if (seat >= 0) {
			const xr = seat === 0 ? -SEAT : SEAT;
			const a = (tilt * ANGLE * Math.PI) / 180;
			return { x: PX + xr * Math.cos(a), y: PY + 17, z: PLANK_TOP - xr * Math.sin(a) };
		}
		const p = podium.indexOf(i);
		if (p >= 0) return { x: steps[p].x + steps[p].w / 2, y: 135, z: steps[p].h };
		return bench[i];
	}

	function tapToy(i: number) {
		if (solved || busy) return;
		sound.play('drop');
		if (mode === 'podium') {
			if (podium.includes(i)) {
				podium = podium.filter((x) => x !== i);
				return;
			}
			podium = [...podium, i];
			if (podium.length === slots) {
				busy = true;
				setTimeout(judge, 450);
			}
			return;
		}
		const at = seats.indexOf(i);
		if (at >= 0) {
			seats = seats.map((x, k) => (k === at ? null : x));
			tilt = 0;
			return;
		}
		tilt = 0;
		if (seats[0] !== null && seats[1] !== null) seats = [i, null];
		else seats = seats[0] === null ? [i, seats[1]] : [seats[0], i];
		if (seats[0] !== null && seats[1] !== null) {
			busy = true;
			setTimeout(weighNow, 250);
		}
	}

	function weighNow() {
		const [a, b] = seats as [number, number];
		const r = weigh(s, a, b);
		s = r.s;
		tilt = r.heavy === a ? -1 : 1;
		if (r.repeat) say('이미 쟀어');
		else fresh = s.results.length - 1;
		setTimeout(() => {
			sound.play('stamp');
			busy = false;
		}, 450);
	}

	function judge() {
		const res = checkPodium(s, podium);
		if (res === 'right') {
			solved = true;
			busy = false;
			onSolved({ bonus: count <= s.max });
			return;
		}
		if (res === 'unsure') {
			sound.play('bump');
			wobble += 1;
			say('아직 확실하지 않아', 1800);
		} else {
			sound.play('error');
			podShake += 1;
		}
		setTimeout(() => {
			podium = [];
			busy = false;
		}, 700);
	}

	function setMode(m: 'weigh' | 'podium') {
		if (solved || busy || mode === m) return;
		mode = m;
		seats = [null, null];
		tilt = 0;
		podium = [];
	}

	export function hint() {
		if (solved) return;
		const p = seesawHint(s);
		glowToys = p ?? [];
		glowPodium = !p;
		later('hint', 1600, () => {
			glowToys = [];
			glowPodium = false;
		});
	}
</script>

<Board width={700} depth={300} cx={474} cy={450} tilt={52} turn={-10} zoom={1.2} ground="#ecdcae" rim="#b98d5e">
	<div class="sand"></div>
	<!-- 시소 -->
	<Box3D x={PX - 10} y={PY + 2} w={20} d={30} h={PIVOT_H} color="#9b7b5b" />
	<div class="plank" style="transform:translate3d({PX}px,{PY}px,{PIVOT_H + 5}px) rotateY({tilt * ANGLE}deg)">
		{#key wobble}
			<div class="wob" class:on={wobble > 0}>
				<Box3D x={-165} y={0} z={-5} w={330} d={34} h={10} color="#e0473a" radius={5} />
				<Box3D x={-150} y={-6} z={5} w={8} d={46} h={18} color="#ffb547" radius={3} />
				<Box3D x={142} y={-6} z={5} w={8} d={46} h={18} color="#ffb547" radius={3} />
			</div>
		{/key}
	</div>
	<!-- 시상대 -->
	{#key podShake}
		<div class="pod" class:shake={podShake > 0}>
			{#each steps as st, k}
				<Box3D x={st.x} y={100} w={st.w} d={70} h={st.h} color={['#ffc93c', '#c9d3de', '#e3a26b', '#9fc5e8'][k]} radius={6}>
					{#snippet top()}<span class="rank">{k + 1}</span>{/snippet}
				</Box3D>
			{/each}
		</div>
	{/key}
	<!-- 의자 -->
	<Box3D x={60} y={244} w={580} d={40} h={16} color="#b98d5e" radius={6} />
	<div class="toys">
		{#each puzzle.cast as kind, i}
			{@const p = spot(i)}
			<Doll
				x={p.x}
				y={p.y}
				z={p.z}
				height={TOY_H}
				cls="toy w{i} {glowToys.includes(i) ? 'glow' : ''} {solved ? 'hop' : ''}"
				onpointerdown={() => tapToy(i)}
			>
				<ToyArt {kind} />
			</Doll>
		{/each}
	</div>
	{#if tag}
		{#key tag.key}
			<Doll x={PX} y={PY} z={PIVOT_H + 120} height={50}><span class="tag">{tag.text}</span></Doll>
		{/key}
	{/if}
</Board>

<div class="tools">
	<button class="mode" class:on={mode === 'weigh'} onclick={() => setMode('weigh')}>⚖️ 재기</button>
	<button class="mode" class:on={mode === 'podium'} class:glow={glowPodium} onclick={() => setMode('podium')}>🏆 시상대</button>
</div>

<div class="panel">
	<div class="goal">🏆 {puzzle.goal === 'top' ? '가장 무거운 친구' : '무거운 순서대로'}</div>
	<div class="count">
		<span>⚖️ <b>{count}</b>번</span>
		<span class="aim" class:over={count > s.max}><b>{s.max}</b>번 안에 ⭐</span>
	</div>
	<div class="log">
		{#each s.results as r, k}
			{@const leftHeavy = r.heavy < r.light}
			<div class="rec" class:fresh={fresh === k}>
				<i class="bar" style="rotate:{leftHeavy ? -14 : 14}deg"></i>
				<span class="mini l" class:down={leftHeavy}><ToyArt kind={puzzle.cast[Math.min(r.heavy, r.light)]} /></span>
				<span class="mini r" class:down={!leftHeavy}><ToyArt kind={puzzle.cast[Math.max(r.heavy, r.light)]} /></span>
			</div>
		{/each}
	</div>
</div>

<style>
	.sand {
		position: absolute;
		left: 20px;
		top: 20px;
		width: 380px;
		height: 220px;
		border-radius: 40px;
		background: #f4e7c2;
		box-shadow: inset 0 0 0 6px #e0cc98;
	}
	.plank,
	.wob,
	.pod,
	.toys {
		position: absolute;
		left: 0;
		top: 0;
		transform-style: preserve-3d;
	}
	.plank {
		transition: transform 0.5s ease-in-out;
	}
	.wob.on {
		animation: wob 0.6s ease-in-out;
	}
	@keyframes wob {
		25% {
			transform: rotateY(-7deg);
		}
		75% {
			transform: rotateY(7deg);
		}
	}
	.pod.shake {
		animation: podshake 0.45s;
	}
	@keyframes podshake {
		20%,
		60% {
			translate: -10px 0;
		}
		40%,
		80% {
			translate: 10px 0;
		}
	}
	.rank {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 34px;
		font-weight: 900;
		color: rgba(90, 60, 20, 0.55);
	}
	.toys :global(.doll.toy) {
		transition: transform 0.5s ease-in-out;
	}
	.toys :global(.shadow) {
		transition:
			left 0.5s ease-in-out,
			top 0.5s ease-in-out,
			transform 0.5s ease-in-out;
	}
	:global(.doll.toy .art) {
		transform-origin: 50% 100%;
	}
	:global(.doll.toy.glow .art) {
		filter: drop-shadow(0 0 8px #ffd400) drop-shadow(0 0 3px #ffd400);
		animation: bob 0.4s ease-in-out infinite alternate;
	}
	@keyframes bob {
		to {
			translate: 0 -10px;
		}
	}
	:global(.doll.toy.hop .art) {
		animation: hop 0.5s ease-in-out 3;
	}
	:global(.doll.toy.hop.w1 .art) {
		animation-delay: 0.1s;
	}
	:global(.doll.toy.hop.w2 .art) {
		animation-delay: 0.2s;
	}
	:global(.doll.toy.hop.w3 .art) {
		animation-delay: 0.3s;
	}
	:global(.doll.toy.hop.w4 .art) {
		animation-delay: 0.4s;
	}
	@keyframes hop {
		50% {
			translate: 0 -26px;
		}
	}
	.tag {
		display: block;
		white-space: nowrap;
		font-size: 28px;
		font-weight: 900;
		color: #6b4d00;
		background: #ffe27a;
		border-radius: 14px;
		padding: 2px 14px;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
	}
	.tools {
		position: absolute;
		left: 300px;
		bottom: 26px;
		display: flex;
		gap: 12px;
	}
	.mode {
		height: 84px;
		padding: 0 26px;
		border-radius: 26px;
		background: #fff;
		font-size: 28px;
		font-weight: 900;
		color: #5a4630;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
	}
	.mode.on {
		background: #4d96ff;
		color: #fff;
		box-shadow: 0 6px 0 #2f6fd6;
	}
	.mode.glow {
		animation: glowbtn 0.4s ease-in-out infinite alternate;
	}
	@keyframes glowbtn {
		to {
			background: #ffc400;
			box-shadow: 0 6px 0 #d19a00;
		}
	}
	.panel {
		position: absolute;
		right: 26px;
		top: 92px;
		width: 330px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: rgba(255, 255, 255, 0.94);
		border-radius: 28px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
	}
	.goal {
		font-size: 26px;
		font-weight: 900;
		color: #5a4630;
		text-align: center;
	}
	.count {
		display: flex;
		justify-content: center;
		gap: 10px;
		font-size: 22px;
		font-weight: 800;
	}
	.count span {
		background: #f6f1e6;
		padding: 6px 16px;
		border-radius: 999px;
	}
	.count .aim {
		background: #fff3c4;
	}
	.count .aim.over {
		background: #eee;
		color: #999;
		text-decoration: line-through;
	}
	.log {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		min-height: 72px;
	}
	.rec {
		position: relative;
		height: 72px;
		border-radius: 16px;
		background: #f6f1e6;
	}
	.rec.fresh {
		animation: pop 0.4s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	@keyframes pop {
		from {
			transform: scale(0.3);
			opacity: 0;
		}
	}
	.bar {
		position: absolute;
		left: 22px;
		right: 22px;
		top: 50px;
		height: 7px;
		border-radius: 4px;
		background: #e0473a;
	}
	.mini {
		position: absolute;
		top: 4px;
		height: 44px;
	}
	.mini.l {
		left: 22px;
	}
	.mini.r {
		right: 22px;
	}
	.mini.down {
		top: 14px;
	}
	.mini.l:not(.down) {
		top: -4px;
	}
	.mini.r:not(.down) {
		top: -4px;
	}
</style>
