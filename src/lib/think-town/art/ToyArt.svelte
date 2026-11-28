<!-- 시소 놀이터 장난감(SVG): 몸 크기는 모두 같고 귀·부리·코로만 구별 (겉모습으로 무게를 알 수 없게) -->
<script lang="ts">
	let { kind }: { kind: string } = $props();

	const COLOR: Record<string, string> = {
		rabbit: '#f7a8c4',
		duck: '#ffd23f',
		frog: '#6cc46a',
		penguin: '#3c4f76',
		pig: '#ffb59b'
	};
	const body = $derived(COLOR[kind] ?? COLOR.rabbit);
	const LINE = 'rgba(0,0,0,.2)';
</script>

<svg viewBox="0 0 100 130" class="toy" aria-hidden="true">
	{#if kind === 'rabbit'}
		{#each [36, 64] as x}
			<ellipse cx={x} cy="30" rx="10" ry="27" fill={body} stroke={LINE} stroke-width="2.5" />
			<ellipse cx={x} cy="32" rx="4.5" ry="18" fill="#ffe1ec" />
		{/each}
	{:else if kind === 'pig'}
		{#each [[22, 58, 30, 36, 40, 54], [78, 58, 70, 36, 60, 54]] as [x1, y1, x2, y2, x3, y3]}
			<polygon points="{x1},{y1} {x2},{y2} {x3},{y3}" fill={body} stroke={LINE} stroke-width="2.5" stroke-linejoin="round" />
		{/each}
	{:else if kind === 'duck'}
		<path d="M50 46 Q46 30 56 26 Q52 36 58 40" fill="none" stroke="#e8b400" stroke-width="4" stroke-linecap="round" />
	{/if}
	<!-- 발 -->
	<ellipse cx="36" cy="124" rx="12" ry="5" fill={kind === 'duck' || kind === 'penguin' ? '#ff9a2e' : body} stroke={LINE} stroke-width="2" />
	<ellipse cx="64" cy="124" rx="12" ry="5" fill={kind === 'duck' || kind === 'penguin' ? '#ff9a2e' : body} stroke={LINE} stroke-width="2" />
	<!-- 몸(모두 같은 크기) -->
	<circle cx="50" cy="86" r="38" fill={body} stroke={LINE} stroke-width="2.5" />
	{#if kind === 'penguin'}
		<ellipse cx="50" cy="94" rx="27" ry="28" fill="#fff" />
	{/if}
	{#if kind === 'frog'}
		{#each [34, 66] as x}
			<circle cx={x} cy="54" r="13" fill={body} stroke={LINE} stroke-width="2.5" />
			<circle cx={x} cy="53" r="8" fill="#fff" />
			<circle cx={x} cy="54" r="4" fill="#2b2b2b" />
		{/each}
		<path d="M36 92 Q50 104 64 92" fill="none" stroke="#2f6b2e" stroke-width="3.5" stroke-linecap="round" />
	{:else}
		<circle cx="38" cy="76" r="4.5" fill="#2b2b2b" />
		<circle cx="62" cy="76" r="4.5" fill="#2b2b2b" />
	{/if}
	<circle cx="28" cy="90" r="6" fill="#ff7a9a" opacity=".45" />
	<circle cx="72" cy="90" r="6" fill="#ff7a9a" opacity=".45" />
	{#if kind === 'duck' || kind === 'penguin'}
		<ellipse cx="50" cy="88" rx="11" ry="6" fill="#ff9a2e" stroke={LINE} stroke-width="2" />
	{:else if kind === 'pig'}
		<ellipse cx="50" cy="90" rx="13" ry="9" fill="#ff8f86" stroke={LINE} stroke-width="2" />
		<circle cx="45" cy="90" r="2.6" fill="#a8463f" />
		<circle cx="55" cy="90" r="2.6" fill="#a8463f" />
	{:else if kind === 'rabbit'}
		<path d="M46 86 L50 90 L54 86 Z" fill="#e0607e" />
		<path d="M50 90 Q46 96 42 94 M50 90 Q54 96 58 94" fill="none" stroke="#b5596f" stroke-width="2" stroke-linecap="round" />
	{/if}
</svg>

<style>
	.toy {
		display: block;
		height: 100%;
		width: auto;
		overflow: visible;
	}
</style>
