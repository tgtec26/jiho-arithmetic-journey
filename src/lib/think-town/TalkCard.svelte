<!-- 대화 카드: "어떻게 알았어?" 아빠가 묻고, 지호가 설명하면 아빠가 ⭐을 꾹 -->
<script lang="ts">
	import LongPressButton from './LongPressButton.svelte';

	let { question, starred, onstar, ondone }: { question: string; starred: boolean; onstar: () => void; ondone: () => void } = $props();
</script>

<div class="dim"></div>
<div class="card">
	<img class="who dad" src="/think-town/stickers/dad-thinking.png" alt="" />
	<img class="who kid" src="/think-town/stickers/jiho-thinking.png" alt="" />
	<h2>어떻게 알았어?</h2>
	<p>{question}</p>
	<div class="row">
		<LongPressButton label={starred ? '⭐ 받았어!' : '아빠 ⭐ (꾹)'} disabled={starred} onfire={onstar} />
		<button class="done" onclick={ondone}>다 했어 ▶</button>
	</div>
</div>

<style>
	.dim {
		position: absolute;
		inset: 0;
		background: rgba(20, 30, 60, 0.35);
		z-index: 64;
	}
	.card {
		position: absolute;
		left: 50%;
		top: 52%;
		transform: translate(-50%, -50%);
		width: 640px;
		padding: 40px 48px 36px;
		border-radius: 40px;
		background: #fff;
		text-align: center;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
		z-index: 65;
		animation: rise 0.4s cubic-bezier(0.2, 1.4, 0.4, 1);
	}
	@keyframes rise {
		from {
			transform: translate(-50%, -40%) scale(0.85);
			opacity: 0;
		}
	}
	.who {
		position: absolute;
		bottom: 0;
		pointer-events: none;
	}
	.dad {
		left: -150px;
		height: 330px;
	}
	.kid {
		right: -130px;
		height: 260px;
	}
	h2 {
		margin: 0 0 14px;
		font-size: 46px;
		font-weight: 900;
		color: #2f6fd6;
	}
	p {
		margin: 0 0 30px;
		font-size: 34px;
		font-weight: 800;
		word-break: keep-all;
	}
	.row {
		display: flex;
		gap: 18px;
		justify-content: center;
		align-items: center;
	}
	.done {
		height: 74px;
		padding: 0 34px;
		border-radius: 999px;
		background: #4d96ff;
		color: #fff;
		font-size: 26px;
		font-weight: 900;
		box-shadow: 0 5px 0 #2f6fd6;
	}
	.done:active {
		transform: translateY(3px);
		box-shadow: 0 2px 0 #2f6fd6;
	}
</style>
