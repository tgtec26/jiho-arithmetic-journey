<!-- 판 위에 세운 종이 인형: 스티커가 늘 카메라를 보고, 발밑에 그림자 -->
<script lang="ts">
	import { getBoard } from './context';

	let {
		x,
		y,
		z = 0,
		sticker,
		height,
		cls = ''
	}: { x: number; y: number; z?: number; sticker: string; height: number; cls?: string } = $props();
	const board = getBoard();
</script>

<div class="shadow" style="left:{x - height * 0.22}px;top:{y - height * 0.07}px;width:{height * 0.44}px;height:{height * 0.14}px;transform:translateZ({z + 0.5}px)"></div>
<div class="doll {cls}" style="transform:translate3d({x}px,{y}px,{z}px) rotateZ({-board.turn}deg) rotateX({-board.tilt}deg)">
	<img src="/think-town/stickers/{sticker}.png" alt="" draggable="false" style="height:{height}px" />
</div>

<style>
	.shadow {
		position: absolute;
		border-radius: 50%;
		background: radial-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0) 70%);
	}
	.doll {
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 0;
		transform-style: preserve-3d;
	}
	.doll img {
		position: absolute;
		bottom: 0;
		left: 0;
		transform: translateX(-50%);
		max-width: none;
		pointer-events: none;
	}
</style>
