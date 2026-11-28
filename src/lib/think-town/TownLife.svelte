<!-- 마을 판 위 살아나는 모습: 장소마다 수준 1(1단계 끝: 기본 움직임), 수준 2(5단계 끝: 장식 + 깃발). 새로 살아난 곳은 통 튀어 나옴 -->
<script lang="ts">
	import Box3D from './diorama/Box3D.svelte';
	import Doll from './diorama/Doll.svelte';
	import FlowerArt from './art/FlowerArt.svelte';
	import OutfitArt from './art/OutfitArt.svelte';
	import ToyArt from './art/ToyArt.svelte';
	import type { PlaceId } from './rules/progress';

	let { levels, celebrate = null }: { levels: Record<PlaceId, 0 | 1 | 2>; celebrate?: { id: PlaceId; level: 1 | 2 } | null } = $props();

	const at = (id: PlaceId, lv: 1 | 2) => levels[id] >= lv;
	const pop = (id: PlaceId, lv: 1 | 2) => (celebrate?.id === id && celebrate.level === lv ? 'pop' : '');

	// 깃발 기둥 자리 (x, y, z) 와 깃발 색: 이름표·인형에 가리지 않는 모퉁이
	const FLAGS: Record<PlaceId, [number, number, number, string]> = {
		parking: [184, 26, 0, '#e0473a'],
		blocks: [330, 86, 46, '#ffb547'],
		clothes: [390, 150, 0, '#f06292'],
		ticket: [28, 216, 44, '#4d96ff'],
		garden: [352, 226, 0, '#ffc21a'],
		seesaw: [384, 306, 0, '#9b6bd6']
	};
	const AWNING = ['#ff7f9f', '#fff', '#ff7f9f', '#fff', '#ff7f9f'];
	const TOWER = ['#e0473a', '#ffb547', '#5cc3e8', '#4fbf6a'];
	const BLOOMS: [number, number, string][] = [
		[274, 240, '●'],
		[302, 262, '▲'],
		[334, 238, '■'],
		[284, 296, '★'],
		[318, 290, '●'],
		[342, 268, '▲']
	];
</script>

<!-- 🚗 주차장 -->
{#if at('parking', 1)}
	<div class="grp {pop('parking', 1)}" style="transform-origin:100px 110px">
		<div class="mover drive"><Box3D x={26} y={104} w={30} d={15} h={12} color="#5cc3e8" radius={4} /></div>
	</div>
{/if}
{#if at('parking', 2)}
	<div class="grp {pop('parking', 2)}" style="transform-origin:100px 134px">
		{#each [40, 80, 120, 160] as cx}
			<Box3D x={cx} y={133} w={7} d={7} h={9} color="#ff8a3d" radius={3} />
		{/each}
	</div>
{/if}

<!-- 🧱 블록 공방 -->
{#if at('blocks', 1)}
	<div class="grp {pop('blocks', 1)}" style="transform-origin:323px 73px">
		<Box3D x={318} y={68} z={46} w={11} d={11} h={22} color="#b5653f" />
		{#each [0, 1, 2] as k}
			<Doll x={323} y={73} z={70} height={14} cls="puff p{k}"><i class="cloud"></i></Doll>
		{/each}
	</div>
{/if}
{#if at('blocks', 2)}
	<div class="grp {pop('blocks', 2)}" style="transform-origin:309px 113px">
		{#each TOWER as color, k}
			<Box3D x={300} y={104} z={k * 18} w={18} d={18} h={18} color={color} radius={3} />
		{/each}
	</div>
{/if}

<!-- 👕 옷가게 -->
{#if at('clothes', 1)}
	<div class="grp {pop('clothes', 1)}" style="transform-origin:425px 145px">
		{#each AWNING as color, k}
			<Box3D x={398 + k * 10.8} y={134} z={30} w={10.8} d={14} h={3} {color} radius={1} />
		{/each}
		{#each [[409, 'red', 'navy'], [425, 'blue', 'gray'], [441, 'yellow', 'pink']] as [mx, sh, pa]}
			<Doll x={+mx} y={150} height={26}><OutfitArt shirt={String(sh)} pants={String(pa)} /></Doll>
		{/each}
	</div>
{/if}
{#if at('clothes', 2)}
	<div class="grp {pop('clothes', 2)}" style="transform-origin:425px 110px">
		{#each [[456, 96, '#ff5d73'], [462, 122, '#5cc3e8'], [396, 98, '#ffd23f']] as [bx, by, color], k}
			<Doll x={+bx} y={+by} z={44} height={30} cls="balloon b{k}">
				<svg viewBox="0 0 20 34" class="art-svg"><path d="M10 20 Q8 27 11 34" stroke="#888" fill="none" /><ellipse cx="10" cy="10" rx="8" ry="10" fill={String(color)} /><ellipse cx="7" cy="6" rx="2" ry="3" fill="#fff" opacity=".6" /></svg>
			</Doll>
		{/each}
	</div>
{/if}

<!-- 🎫 기차역 -->
{#if at('ticket', 1)}
	<div class="grp {pop('ticket', 1)}" style="transform-origin:60px 200px">
		<div class="mover train">
			{#each ['#e0473a', '#4d96ff', '#ffc93c'] as color, k}
				<Box3D x={78 - k * 38} y={195} w={34} d={14} h={14} {color} radius={4} />
			{/each}
		</div>
	</div>
{/if}
{#if at('ticket', 2)}
	<div class="grp {pop('ticket', 2)}" style="transform-origin:165px 222px">
		<Box3D x={134} y={213} w={3} d={3} h={26} color="#8a6a48" />
		<Box3D x={194} y={213} w={3} d={3} h={26} color="#8a6a48" />
		<Box3D x={130} y={208} z={26} w={72} d={22} h={3} color="#4a78b8" radius={3} />
		<Doll x={75} y={240} z={44} height={22}>
			<svg viewBox="0 0 20 20" class="art-svg"><circle cx="10" cy="10" r="9" fill="#fff" stroke="#4a78b8" stroke-width="2" /><path d="M10 4 V10 L14 12" stroke="#2b2b2b" stroke-width="1.6" fill="none" stroke-linecap="round" /></svg>
		</Doll>
	</div>
{/if}

<!-- 🌼 사랑이 정원 -->
{#if at('garden', 1)}
	<div class="grp {pop('garden', 1)}" style="transform-origin:308px 268px">
		{#each BLOOMS as [fx, fy, f], k}
			<Doll x={fx} y={fy} height={24} cls="bloom s{k % 3}"><FlowerArt shape={f} /></Doll>
		{/each}
	</div>
{/if}
{#if at('garden', 2)}
	<div class="grp {pop('garden', 2)}" style="transform-origin:308px 318px">
		<Doll x={308} y={318} height={40}>
			<svg viewBox="0 0 40 40" class="art-svg">
				<path d="M6 40 V18 Q20 -2 34 18 V40" fill="none" stroke="#f48fb1" stroke-width="4" />
				{#each [[6, 26], [10, 12], [20, 6], [30, 12], [34, 26]] as [cx, cy]}<circle {cx} {cy} r="3.5" fill="#fff59d" />{/each}
			</svg>
		</Doll>
		{#each [0, 1] as k}
			<Doll x={290 + k * 36} y={250 + k * 20} z={30} height={14} cls="fly f{k}">
				<svg viewBox="0 0 20 14" class="art-svg"><ellipse cx="6" cy="6" rx="6" ry="5" fill={k ? '#9b6bd6' : '#ff8a3d'} /><ellipse cx="14" cy="6" rx="6" ry="5" fill={k ? '#9b6bd6' : '#ff8a3d'} /><rect x="9" y="3" width="2" height="10" rx="1" fill="#333" /></svg>
			</Doll>
		{/each}
	</div>
{/if}

<!-- ⚖️ 시소 놀이터 -->
{#if at('seesaw', 1)}
	<div class="grp {pop('seesaw', 1)}" style="transform-origin:415px 255px">
		<div class="mover" style="transform:translate3d(415px,255px,14px)">
			<div class="rock">
				<Box3D x={-29} y={-3} z={-2} w={58} d={6} h={4} color="#d9534f" />
				<Doll x={-22} y={0} z={2} height={16}><ToyArt kind="rabbit" /></Doll>
				<Doll x={22} y={0} z={2} height={16}><ToyArt kind="duck" /></Doll>
			</div>
		</div>
	</div>
{/if}
{#if at('seesaw', 2)}
	<div class="grp {pop('seesaw', 2)}" style="transform-origin:420px 300px">
		<Doll x={420} y={302} height={34}>
			<svg viewBox="0 0 40 34" class="art-svg">
				<path d="M4 8 L36 30" stroke="#ff8a3d" stroke-width="5" stroke-linecap="round" />
				<path d="M4 8 V34 M10 8 V34" stroke="#8a6a48" stroke-width="2.5" />
				{#each [14, 20, 26] as y}<path d="M4 {y} H10" stroke="#8a6a48" stroke-width="2" />{/each}
			</svg>
		</Doll>
	</div>
{/if}

<!-- 🚩 깃발 (수준 2) -->
{#each Object.entries(FLAGS) as [id, [fx, fy, fz, color]]}
	{#if at(id as PlaceId, 2)}
		<div class="grp {pop(id as PlaceId, 2)}" style="transform-origin:{fx}px {fy}px">
			<Doll x={fx} y={fy} z={fz} height={44}>
				<svg viewBox="0 0 40 60" class="art-svg">
					<path d="M20 4 V60" stroke="#6b5640" stroke-width="2.5" />
					<path class="flag" d="M20 5 L38 12 L20 19 Z" fill={color} />
					<circle cx="20" cy="4" r="2.5" fill="#ffd23f" />
				</svg>
			</Doll>
		</div>
	{/if}
{/each}

<style>
	.grp,
	.mover,
	.rock {
		position: absolute;
		left: 0;
		top: 0;
		transform-style: preserve-3d;
	}
	.grp.pop {
		animation: popin 0.8s cubic-bezier(0.2, 1.6, 0.4, 1) both 0.3s;
	}
	@keyframes popin {
		from {
			scale: 0.01 0.01 0.01;
		}
	}
	.drive {
		animation: drive 5s linear infinite;
	}
	@keyframes drive {
		0% {
			translate: 0 0;
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		92%,
		100% {
			translate: 130px 0;
			opacity: 0;
		}
	}
	.train {
		animation: train 8s linear infinite;
	}
	@keyframes train {
		0% {
			translate: 0 0;
			opacity: 0;
		}
		6% {
			opacity: 1;
		}
		78% {
			opacity: 1;
		}
		86%,
		100% {
			translate: 346px 0;
			opacity: 0;
		}
	}
	.rock {
		animation: rock 2.4s ease-in-out infinite;
	}
	@keyframes rock {
		0%,
		100% {
			transform: rotateY(-11deg);
		}
		50% {
			transform: rotateY(11deg);
		}
	}
	.cloud {
		display: block;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.06);
	}
	:global(.doll.puff .art) {
		animation: puff 2.4s ease-out infinite;
		opacity: 0;
	}
	:global(.doll.puff.p1 .art) {
		animation-delay: 0.8s;
	}
	:global(.doll.puff.p2 .art) {
		animation-delay: 1.6s;
	}
	@keyframes puff {
		0% {
			translate: 0 0;
			scale: 0.5;
			opacity: 0;
		}
		20% {
			opacity: 0.95;
		}
		100% {
			translate: 6px -34px;
			scale: 1.6;
			opacity: 0;
		}
	}
	:global(.doll.bloom .art),
	:global(.doll.balloon .art) {
		transform-origin: 50% 100%;
	}
	:global(.doll.bloom .art) {
		animation: sway 2.2s ease-in-out infinite;
	}
	:global(.doll.bloom.s1 .art) {
		animation-delay: 0.4s;
	}
	:global(.doll.bloom.s2 .art) {
		animation-delay: 0.8s;
	}
	@keyframes sway {
		0%,
		100% {
			rotate: -7deg;
		}
		50% {
			rotate: 7deg;
		}
	}
	:global(.doll.balloon .art) {
		animation: bob 2.6s ease-in-out infinite;
	}
	:global(.doll.balloon.b1 .art) {
		animation-delay: 0.6s;
	}
	:global(.doll.balloon.b2 .art) {
		animation-delay: 1.2s;
	}
	@keyframes bob {
		50% {
			translate: 0 -6px;
		}
	}
	:global(.doll.fly .art) {
		animation: fly 3s ease-in-out infinite;
	}
	:global(.doll.fly.f1 .art) {
		animation-delay: 1.2s;
	}
	@keyframes fly {
		0%,
		100% {
			translate: 0 0;
		}
		25% {
			translate: 10px -8px;
		}
		50% {
			translate: 0 -14px;
		}
		75% {
			translate: -10px -6px;
		}
	}
	.art-svg {
		display: block;
		height: 100%;
		width: auto;
		overflow: visible;
	}
	.flag {
		transform-box: fill-box;
		transform-origin: left center;
		animation: wave 1.2s ease-in-out infinite;
	}
	@keyframes wave {
		50% {
			transform: scaleX(0.75) skewY(4deg);
		}
	}
</style>
