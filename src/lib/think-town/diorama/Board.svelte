<!-- 탁자 위 장난감 판: 비스듬히 내려다보는 고정 시점(원근 없음). 판 가운데가 무대 (cx, cy) -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setBoard } from './context';

	let {
		width,
		depth,
		cx,
		cy,
		tilt = 58,
		turn = -34,
		zoom = 1,
		ground = '#a9d68a',
		rim = '#c9a77a',
		cls = '',
		children
	}: {
		width: number;
		depth: number;
		cx: number;
		cy: number;
		tilt?: number;
		turn?: number;
		zoom?: number;
		ground?: string;
		rim?: string;
		cls?: string;
		children?: Snippet;
	} = $props();

	setBoard({
		get width() { return width; },
		get depth() { return depth; },
		get cx() { return cx; },
		get cy() { return cy; },
		get tilt() { return tilt; },
		get turn() { return turn; },
		get zoom() { return zoom; }
	});
</script>

<div class="anchor" style="left:{cx}px;top:{cy}px">
	<div
		class="board {cls}"
		style="left:{-width / 2}px;top:{-depth / 2}px;width:{width}px;height:{depth}px;transform:scale3d({zoom},{zoom},{zoom}) rotateX({tilt}deg) rotateZ({turn}deg)"
	>
		<div class="ground" style="background:{ground};box-shadow:0 0 0 12px {rim},0 0 0 14px #8f6d45,0 18px 30px 10px rgba(0,0,0,.18)"></div>
		{@render children?.()}
	</div>
</div>

<style>
	.anchor {
		position: absolute;
		width: 0;
		height: 0;
	}
	.board {
		position: absolute;
		transform-style: preserve-3d;
	}
	.ground {
		position: absolute;
		inset: 0;
		border-radius: 14px;
	}
</style>
