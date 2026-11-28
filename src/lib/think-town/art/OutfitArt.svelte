<!-- 옷가게 마네킹 그림(SVG): 받침대 위 나무 마네킹, 셔츠·바지·모자 색. 안 입은 부분은 연한 나무색 점선 -->
<script lang="ts">
	import { OUTFIT_HEX } from '../rules/clothes-play';

	let { shirt = null, pants = null, hat = null }: { shirt?: string | null; pants?: string | null; hat?: string | null } = $props();

	const WOOD = '#e9cfa6';
	const BARE = { fill: '#f3e6cc', stroke: '#c9ad84', dash: '5 4' };
	const LINE = 'rgba(0,0,0,.22)';
</script>

<svg viewBox="0 0 100 200" class="outfit" aria-hidden="true">
	<ellipse cx="50" cy="193" rx="26" ry="6" fill="#9a7550" />
	<rect x="47" y="164" width="6" height="29" fill="#b98d5e" />
	<!-- 바지 -->
	<path
		d="M30 106 H70 V118 L68 168 H53 L50 124 L47 168 H32 L30 118 Z"
		fill={pants ? OUTFIT_HEX[pants] : BARE.fill}
		stroke={pants ? LINE : BARE.stroke}
		stroke-width="2.5"
		stroke-dasharray={pants ? undefined : BARE.dash}
		stroke-linejoin="round"
	/>
	<!-- 셔츠 -->
	<path
		d="M33 54 L20 62 L13 82 L26 87 L31 76 V112 H69 V76 L74 87 L87 82 L80 62 L67 54 Q50 66 33 54 Z"
		fill={shirt ? OUTFIT_HEX[shirt] : BARE.fill}
		stroke={shirt ? LINE : BARE.stroke}
		stroke-width="2.5"
		stroke-dasharray={shirt ? undefined : BARE.dash}
		stroke-linejoin="round"
	/>
	<rect x="44" y="44" width="12" height="12" rx="3" fill={WOOD} />
	<ellipse cx="50" cy="30" rx="16" ry="18" fill={WOOD} stroke="#cfae80" stroke-width="2" />
	<!-- 모자 -->
	{#if hat}
		<path d="M33 26 Q34 6 50 6 Q66 6 67 26 Z" fill={OUTFIT_HEX[hat]} stroke={LINE} stroke-width="2.5" stroke-linejoin="round" />
		<path d="M31 25 H80 Q81 31 74 31 H31 Q28 28 31 25 Z" fill={OUTFIT_HEX[hat]} stroke={LINE} stroke-width="2.5" stroke-linejoin="round" />
		<circle cx="50" cy="7" r="3.5" fill="#fff" opacity=".7" />
	{/if}
</svg>

<style>
	.outfit {
		display: block;
		height: 100%;
		width: auto;
		overflow: visible;
	}
</style>
