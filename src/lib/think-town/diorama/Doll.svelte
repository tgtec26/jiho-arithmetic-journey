<!-- 판 위에 세운 종이 인형: 스티커(또는 그림 snippet)가 늘 카메라를 보고, 발밑에 그림자 -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getBoard } from './context';

	let {
		x,
		y,
		z = 0,
		sticker,
		height,
		cls = '',
		hidden = false,
		onpointerdown,
		children
	}: {
		x: number;
		y: number;
		z?: number;
		sticker?: string;
		height: number;
		cls?: string;
		hidden?: boolean;
		onpointerdown?: (e: PointerEvent) => void;
		children?: Snippet;
	} = $props();
	const board = getBoard();
</script>

<div class="shadow" style="left:{x - height * 0.22}px;top:{y - height * 0.07}px;width:{height * 0.44}px;height:{height * 0.14}px;transform:translateZ({z + 0.5}px)"></div>
<div class="doll {cls}" class:hidden style="transform:translate3d({x}px,{y}px,{z}px) rotateZ({-board.turn}deg) rotateX({-board.tilt}deg)">
	{#if children}
		<div class="art" class:grab={!!onpointerdown} style="height:{height}px" role="presentation" {onpointerdown}>{@render children()}</div>
	{:else}
		<img
			src="/think-town/stickers/{sticker}.png"
			alt=""
			draggable="false"
			class:grab={!!onpointerdown}
			style="height:{height}px"
			{onpointerdown}
		/>
	{/if}
</div>

<style>
	.shadow {
		position: absolute;
		border-radius: 50%;
		background: radial-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0) 70%);
		pointer-events: none;
	}
	.doll {
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 0;
		transform-style: preserve-3d;
	}
	.doll img,
	.doll .art {
		position: absolute;
		bottom: 0;
		left: 0;
		transform: translateX(-50%);
		max-width: none;
		pointer-events: none;
	}
	.doll img.grab,
	.doll .art.grab {
		pointer-events: auto;
		cursor: grab;
	}
	.doll.hidden {
		visibility: hidden;
	}
</style>
