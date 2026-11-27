<!-- 마을 지도: 탁자 위 디오라마 마을 판, 장소 이름표를 눌러 들어간다 -->
<script lang="ts">
	import Board from './diorama/Board.svelte';
	import Box3D from './diorama/Box3D.svelte';
	import Doll from './diorama/Doll.svelte';
	import { projectOnStage, type BoardInfo } from './diorama/context';
	import { PLACES, type Place } from './data/places';
	import { townStore } from './progress.svelte';
	import { sound } from './sound.svelte';
	import type { PlaceId } from './rules/progress';

	let { onEnter }: { onEnter: (id: PlaceId) => void } = $props();

	// 마을 판(460×340)을 키워서 무대 가운데보다 조금 아래에
	const B: BoardInfo = { width: 460, depth: 340, cx: 660, cy: 430, tilt: 58, turn: -34, zoom: 1.55 };

	const suggested = $derived(
		PLACES.filter((p) => p.built && townStore.save.places[p.id].cleared < 5).sort(
			(a, b) => townStore.save.places[a.id].cleared - townStore.save.places[b.id].cleared
		)[0]?.id
	);

	let shaking = $state<PlaceId | null>(null);

	function tap(p: Place) {
		if (p.built) {
			onEnter(p.id);
			return;
		}
		sound.play('bump');
		shaking = p.id;
		setTimeout(() => (shaking = null), 450);
	}

	const labelPos = (p: Place) => {
		const s = projectOnStage(B, p.spot.x, p.spot.y, p.spot.z);
		return { x: s.x + (p.spot.dx ?? 0) * B.zoom, y: p.spot.below ? s.y + 14 : s.y - 12 };
	};

	// 공사 중 울타리: 장소 둘레의 낮은 줄무늬 띠
	const FENCES: Record<string, [number, number, number, number]> = {
		blocks: [250, 22, 150, 80],
		clothes: [392, 92, 66, 58],
		garden: [254, 214, 108, 108],
		seesaw: [374, 224, 82, 92]
	};
</script>

<Board width={B.width} depth={B.depth} cx={B.cx} cy={B.cy} tilt={B.tilt} turn={B.turn} zoom={B.zoom}>
	<!-- 길 -->
	<div class="flat" style="left:0;top:150px;width:460px;height:34px;background:#e9e1cf"></div>
	<div class="flat" style="left:212px;top:0;width:34px;height:340px;background:#e9e1cf"></div>
	<!-- 주차장 -->
	<div class="flat lot" style="left:20px;top:20px;width:170px;height:110px"></div>
	<Box3D x={34} y={40} w={46} d={20} h={14} color="#e0473a" />
	<Box3D x={100} y={30} w={20} d={44} h={14} color="#7fb3e6" />
	<Box3D x={130} y={80} w={50} d={20} h={14} color="#e8b36b" />
	<!-- 블록 공방 -->
	<Box3D x={262} y={30} w={70} d={60} h={46} color="#f0cf94" />
	{#each [[350, 40, 3], [372, 40, 2], [350, 62, 1]] as [bx, by, n]}
		{#each Array(n) as _, k}
			<Box3D x={bx} y={by} z={k * 22} w={22} d={22} h={22} color="#e8c27f" />
		{/each}
	{/each}
	<!-- 옷가게 -->
	<Box3D x={400} y={100} w={50} d={40} h={40} color="#f6a6c1" />
	<!-- 기차역: 레일 + 건물 -->
	<div class="flat rail" style="left:0;top:196px;width:460px;height:12px"></div>
	<Box3D x={30} y={218} w={90} d={50} h={38} color="#8fb7e8" />
	<Box3D x={24} y={212} w={102} d={62} h={6} z={38} color="#4a78b8" />
	<!-- 사랑이 정원 -->
	<div class="flat garden" style="left:262px;top:222px;width:92px;height:92px"></div>
	<!-- 시소 놀이터 -->
	<div class="flat" style="left:380px;top:230px;width:70px;height:80px;background:#e7d7a8"></div>
	<Box3D x={410} y={250} w={10} d={10} h={12} color="#9b7b5b" />
	<Box3D x={386} y={252} w={58} d={6} h={4} z={12} color="#d9534f" />
	<!-- 나무 -->
	{#each [[200, 110], [440, 20], [140, 300], [440, 330], [10, 140]] as [tx, ty]}
		<Box3D x={tx - 4} y={ty - 4} w={8} d={8} h={14} color="#8a6a48" />
		<Box3D x={tx - 11} y={ty - 11} w={22} d={22} h={22} z={14} radius={9} color="#5fae5a" />
	{/each}
	<!-- 공사 중 울타리 -->
	{#each PLACES.filter((p) => !p.built) as p}
		{@const [fx, fy, fw, fd] = FENCES[p.id]}
		<Box3D x={fx} y={fy} w={fw} d={3} h={9} color="#f2c230" cls="fence" />
		<Box3D x={fx} y={fy + fd} w={fw} d={3} h={9} color="#f2c230" cls="fence" />
		<Box3D x={fx} y={fy} w={3} d={fd} h={9} color="#f2c230" cls="fence" />
		<Box3D x={fx + fw} y={fy} w={3} d={fd + 3} h={9} color="#f2c230" cls="fence" />
	{/each}
	<Doll x={160} y={170} sticker="gamdori-waving" height={46} />
	<Doll x={330} y={200} sticker="sarang-happy" height={34} />
</Board>

<!-- 앞쪽 탁자 가의 아빠와 지호 -->
<img class="who" src="/think-town/stickers/dad-smiling.png" alt="" style="left:28px;bottom:-6px;height:300px" />
<img class="who" src="/think-town/stickers/jiho-pointing.png" alt="" style="left:150px;bottom:-4px;height:230px" />

{#each PLACES as p (p.id)}
	{@const pos = labelPos(p)}
	{@const cleared = townStore.save.places[p.id].cleared}
	<button
		class="label"
		class:soon={!p.built}
		class:now={p.id === suggested}
		class:shake={shaking === p.id}
		class:below={p.spot.below}
		style="left:{pos.x}px;top:{pos.y}px"
		onclick={() => tap(p)}
	>
		<span class="name">{p.icon} {p.name}</span>
		{#if p.built}
			<span class="dots">
				{#each Array(5) as _, i}<i class:on={i < cleared}></i>{/each}
			</span>
		{:else}
			<span class="soon-text">공사 중</span>
		{/if}
	</button>
{/each}

<style>
	.flat {
		position: absolute;
		border-radius: 6px;
	}
	.lot {
		background: #8a919b linear-gradient(90deg, rgba(255, 255, 255, 0.4) 2px, transparent 2px) 0 0 / 28px 100%;
	}
	.rail {
		background: #9b7b5b repeating-linear-gradient(90deg, #6f553c 0 4px, transparent 4px 14px);
		opacity: 0.85;
	}
	.garden {
		background: #7cc36b;
		background-image: linear-gradient(rgba(255, 255, 255, 0.5) 2px, transparent 2px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.5) 2px, transparent 2px);
		background-size: 23px 23px;
	}
	.who {
		position: absolute;
		filter: drop-shadow(0 8px 6px rgba(0, 0, 0, 0.22));
		pointer-events: none;
	}
	.label {
		position: absolute;
		transform: translate(-50%, -100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 120px;
		padding: 10px 18px 10px;
		border-radius: 22px;
		background: #fff;
		box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
		color: #2b2b2b;
		transition: transform 0.15s;
	}
	.label.below {
		transform: translate(-50%, 0);
	}
	.label.below:active {
		transform: translate(-50%, 0) scale(0.94);
	}
	.label:active {
		transform: translate(-50%, -100%) scale(0.94);
	}
	.label .name {
		font-weight: 900;
		font-size: 22px;
		white-space: nowrap;
	}
	.dots {
		display: flex;
		gap: 5px;
	}
	.dots i {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #e2e2e2;
	}
	.dots i.on {
		background: #ffb400;
		box-shadow: 0 0 0 2px #fff3c4;
	}
	.label.now {
		background: #4d96ff;
		color: #fff;
		animation: bob 1.1s ease-in-out infinite;
	}
	.label.now .dots i {
		background: rgba(255, 255, 255, 0.45);
	}
	.label.now .dots i.on {
		background: #ffd84d;
	}
	.label.soon {
		background: #f1f1f1;
		color: #8a8a8a;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
	}
	.soon-text {
		font-weight: 800;
		font-size: 15px;
	}
	.label.shake {
		animation: shake 0.45s;
	}
	@keyframes bob {
		50% {
			transform: translate(-50%, calc(-100% - 10px));
		}
	}
	.label.below.now {
		animation-name: bob-below;
	}
	@keyframes bob-below {
		50% {
			transform: translate(-50%, -10px);
		}
	}
	@keyframes shake {
		20%, 60% { transform: translate(calc(-50% - 8px), -100%); }
		40%, 80% { transform: translate(calc(-50% + 8px), -100%); }
	}
</style>
