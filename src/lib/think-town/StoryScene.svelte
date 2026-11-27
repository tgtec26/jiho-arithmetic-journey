<!-- 3컷 이야기: 장소 디오라마 위에 종이 인형 + 말풍선, 아빠가 읽고 "다음" -->
<script lang="ts">
	import Board from './diorama/Board.svelte';
	import Box3D from './diorama/Box3D.svelte';
	import Doll from './diorama/Doll.svelte';
	import { projectOnStage, type BoardInfo } from './diorama/context';
	import type { Panel } from './data/stories';
	import type { PlaceId } from './rules/progress';

	let { place, panel, index, onnext }: { place: PlaceId; panel: Panel; index: number; onnext: () => void } = $props();

	const CAM: BoardInfo = { width: 760, depth: 300, cx: 640, cy: 540, tilt: 56, turn: -8, zoom: 1.1 };
	const speaker = $derived(panel.cast.find((c) => c.sticker === panel.speaker)!);
	const bubble = $derived.by(() => {
		const feet = projectOnStage(CAM, speaker.x, speaker.y);
		return { x: feet.x, y: feet.y - speaker.h * CAM.zoom - 14 };
	});
</script>

<Board width={CAM.width} depth={CAM.depth} cx={CAM.cx} cy={CAM.cy} tilt={CAM.tilt} turn={CAM.turn} zoom={CAM.zoom} ground={place === 'parking' ? '#8a919b' : '#d9cdb4'} rim="#c9a77a">
	{#if place === 'parking'}
		<div class="lines"></div>
		<Box3D x={40} y={30} w={130} d={52} h={34} color="#4d96ff" radius={8} />
		<Box3D x={580} y={24} w={52} d={130} h={34} color="#ffb020" radius={8} />
		<Box3D x={60} y={200} w={130} d={52} h={34} color="#e0473a" radius={8} />
	{:else}
		<div class="rail"></div>
		<Doll x={90} y={150} sticker="prop-ticket-booth" height={210} />
	{/if}
	{#each panel.cast as c (c.sticker + c.x)}
		<Doll x={c.x} y={c.y} sticker={c.sticker} height={c.h} cls="actor" />
	{/each}
</Board>

{#key index}
	<div class="bubble" style="left:{bubble.x}px;top:{bubble.y}px">{panel.text}</div>
{/key}

<div class="panels">
	{#each Array(3) as _, i}<i class:on={i <= index}></i>{/each}
</div>

<button class="next" onclick={onnext}>{index < 2 ? '다음 ▶' : '시작! ▶'}</button>

<style>
	.lines {
		position: absolute;
		inset: 0;
		border-radius: 14px;
		background: linear-gradient(90deg, rgba(255, 255, 255, 0.35) 3px, transparent 3px) 0 0 / 95px 100%;
	}
	.rail {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 30px;
		background: #8c7a66 repeating-linear-gradient(90deg, #5e4b39 0 6px, transparent 6px 22px);
		border-top: 4px solid #f2c230;
	}
	.bubble {
		position: absolute;
		transform: translate(-30%, -100%);
		max-width: 470px;
		background: #fff;
		border-radius: 28px;
		padding: 18px 26px;
		font-size: 30px;
		font-weight: 800;
		line-height: 1.35;
		word-break: keep-all;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
		animation: pop 0.35s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.bubble::after {
		content: '';
		position: absolute;
		left: 30%;
		bottom: -18px;
		border: 12px solid transparent;
		border-top: 18px solid #fff;
		transform: translateX(-50%);
	}
	@keyframes pop {
		from {
			transform: translate(-30%, -100%) scale(0.6);
			opacity: 0;
		}
	}
	.panels {
		position: absolute;
		left: 50%;
		top: 92px;
		transform: translateX(-50%);
		display: flex;
		gap: 10px;
	}
	.panels i {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.7);
	}
	.panels i.on {
		background: #4d96ff;
	}
	.next {
		position: absolute;
		right: 34px;
		bottom: 30px;
		height: 88px;
		padding: 0 40px;
		border-radius: 30px;
		background: #4d96ff;
		color: #fff;
		font-size: 32px;
		font-weight: 900;
		box-shadow: 0 6px 0 #2f6fd6;
	}
	.next:active {
		transform: translateY(4px);
		box-shadow: 0 2px 0 #2f6fd6;
	}
</style>
