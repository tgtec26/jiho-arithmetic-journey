<!-- 입체 상자: 판 위 (x, y)에서 너비 w × 깊이 d × 높이 h. 면은 한 색의 다섯 밝기 -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		x,
		y,
		w,
		d,
		h,
		z = 0,
		color,
		radius = 3,
		cls = '',
		onpointerdown,
		top
	}: {
		x: number;
		y: number;
		w: number;
		d: number;
		h: number;
		z?: number;
		color: string;
		radius?: number;
		cls?: string;
		onpointerdown?: (e: PointerEvent) => void;
		top?: Snippet;
	} = $props();
</script>

<div class="p3 {cls}" style="transform:translate3d({x}px,{y}px,{z}px)" {onpointerdown} role="presentation">
	<div class="face" style="width:{w}px;height:{h}px;transform-origin:top;transform:rotateX(90deg);background:{color};filter:brightness(.8);border-radius:{radius}px"></div>
	<div class="face" style="width:{h}px;height:{d}px;transform-origin:left;transform:rotateY(-90deg);background:{color};filter:brightness(.78);border-radius:{radius}px"></div>
	<div class="face" style="left:{w}px;width:{h}px;height:{d}px;transform-origin:left;transform:rotateY(-90deg);background:{color};filter:brightness(.72);border-radius:{radius}px"></div>
	<div class="face" style="top:{d}px;width:{w}px;height:{h}px;transform-origin:top;transform:rotateX(90deg);background:{color};filter:brightness(.86);border-radius:{radius}px"></div>
	<div class="face topface" style="width:{w}px;height:{d}px;transform:translateZ({h}px);background:{color};filter:brightness(1.12);border-radius:{radius}px">
		{@render top?.()}
	</div>
</div>

<style>
	.p3 {
		position: absolute;
		left: 0;
		top: 0;
		transform-style: preserve-3d;
	}
	.face {
		position: absolute;
		left: 0;
		top: 0;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15);
	}
</style>
