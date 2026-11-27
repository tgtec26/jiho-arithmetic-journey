<!-- 도장 피날레: 잠깐 멈춤 → 도장 쾅 → 폭죽 → 별 세기 → 마을로 -->
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import confetti from 'canvas-confetti';
	import { sound } from './sound.svelte';

	let { icon, placeName, stage, stars, ondone }: { icon: string; placeName: string; stage: number; stars: number; ondone: () => void } = $props();

	let step = $state(0); // 0 멈춤, 1 도장, 2 폭죽·별, 3 단추
	let shown = $state(0);
	const timers: ReturnType<typeof setTimeout>[] = [];
	const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

	onMount(() => {
		at(350, () => {
			step = 1;
			sound.play('stamp');
		});
		at(900, () => {
			step = 2;
			sound.play('success');
			confetti({ particleCount: 160, spread: 100, origin: { y: 0.55 }, zIndex: 200 });
			// svelte-ignore state_referenced_locally
			const total = stars;
			for (let k = 1; k <= total; k++) at(k * Math.min(160, 1200 / total), () => (shown = k));
		});
		at(2600, () => (step = 3));
	});
	onDestroy(() => timers.forEach(clearTimeout));
</script>

<div class="dim" class:shake={step === 1}></div>
<div class="wrap">
	<p class="title">{icon} {placeName} {stage}단계 끝!</p>
	{#if step >= 1}
		<div class="stamp">
			<span class="icon">{icon}</span>
			<span class="txt">참 잘했어요</span>
		</div>
	{/if}
	{#if step >= 2}
		<p class="stars">⭐ × {shown}</p>
	{/if}
	<button class="home" class:show={step >= 3} onclick={ondone}>마을로 ▶</button>
</div>

<style>
	.dim {
		position: absolute;
		inset: 0;
		background: rgba(20, 30, 60, 0.45);
		z-index: 64;
	}
	.dim.shake {
		animation: thud 0.3s;
	}
	@keyframes thud {
		30% {
			transform: translateY(6px);
		}
	}
	.wrap {
		position: absolute;
		inset: 0;
		z-index: 65;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		color: #fff;
	}
	.title {
		margin: 0;
		font-size: 44px;
		font-weight: 900;
		text-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
	}
	.stamp {
		width: 260px;
		height: 260px;
		border-radius: 50%;
		border: 12px solid #e0473a;
		background: rgba(255, 255, 255, 0.95);
		color: #e0473a;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transform: rotate(-12deg);
		animation: slam 0.4s cubic-bezier(0.5, 0, 0.7, 1.4);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}
	@keyframes slam {
		from {
			transform: rotate(-12deg) scale(3);
			opacity: 0;
		}
	}
	.icon {
		font-size: 96px;
		line-height: 1;
	}
	.txt {
		font-size: 30px;
		font-weight: 900;
	}
	.stars {
		margin: 0;
		font-size: 56px;
		font-weight: 900;
		color: #ffd84d;
		text-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
	}
	.home {
		height: 84px;
		padding: 0 46px;
		border-radius: 30px;
		background: #4d96ff;
		color: #fff;
		font-size: 32px;
		font-weight: 900;
		box-shadow: 0 6px 0 #2f6fd6;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.3s;
	}
	.home.show {
		opacity: 1;
		pointer-events: auto;
	}
</style>
