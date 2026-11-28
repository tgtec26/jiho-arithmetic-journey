<!-- 정원 꽃 그림(SVG): 학습지 모양 ●▲■★ 하나에 꽃 하나, 모양과 색이 모두 다름 -->
<script lang="ts">
	let { shape }: { shape: string } = $props();

	// 꽃잎 색, 가운데 색
	const COLORS: Record<string, [string, string]> = {
		'●': ['#e8424a', '#ffd23f'],
		'▲': ['#a05ad6', '#f4d9ff'],
		'■': ['#2f86f2', '#fff6c8'],
		'★': ['#ffc21a', '#ff8a00']
	};
	const [petal, eye] = $derived(COLORS[shape] ?? COLORS['●']);
	const star = Array.from({ length: 10 }, (_, i) => {
		const a = (Math.PI / 5) * i - Math.PI / 2;
		const r = i % 2 ? 15 : 34;
		return `${50 + r * Math.cos(a)},${42 + r * Math.sin(a)}`;
	}).join(' ');
</script>

<svg viewBox="0 0 100 140" class="flower" aria-hidden="true">
	<path d="M50 70 V138" stroke="#3f8f3a" stroke-width="7" stroke-linecap="round" />
	<path d="M50 112 C30 96 18 104 14 92 C30 88 42 96 50 108" fill="#5fae5a" />
	<path d="M50 100 C70 84 82 92 86 80 C70 76 58 84 50 96" fill="#5fae5a" />
	{#if shape === '▲'}
		<path d="M24 22 L37 40 L50 16 L63 40 L76 22 L74 54 Q50 84 26 54 Z" fill={petal} stroke="rgba(0,0,0,.18)" stroke-width="2" />
		<path d="M38 52 Q50 66 62 52" fill="none" stroke={eye} stroke-width="4" stroke-linecap="round" />
	{:else if shape === '■'}
		{#each [[25, 17], [51, 17], [25, 43], [51, 43]] as [x, y]}
			<rect {x} {y} width="24" height="24" rx="7" fill={petal} stroke="rgba(0,0,0,.18)" stroke-width="2" />
		{/each}
		<circle cx="50" cy="42" r="9" fill={eye} />
	{:else if shape === '★'}
		<polygon points={star} fill={petal} stroke="rgba(0,0,0,.18)" stroke-width="2" stroke-linejoin="round" />
		<circle cx="50" cy="44" r="9" fill={eye} />
	{:else}
		{#each Array(8) as _, i}
			<circle cx={50 + 19 * Math.cos((Math.PI / 4) * i)} cy={42 + 19 * Math.sin((Math.PI / 4) * i)} r="12" fill={petal} stroke="rgba(0,0,0,.18)" stroke-width="2" />
		{/each}
		<circle cx="50" cy="42" r="12" fill={eye} />
	{/if}
</svg>

<style>
	.flower {
		display: block;
		height: 100%;
		width: auto;
		overflow: visible;
	}
</style>
