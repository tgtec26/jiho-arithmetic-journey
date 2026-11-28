<!-- 블록 공방 설계도 카드 하나: 층수(위에서 + 숫자) / 위에서 / 앞에서 / 옆에서 -->
<script lang="ts">
	import type { Blueprint } from '../rules/blocks-play';

	let {
		kind,
		bp,
		state = null,
		wrong = []
	}: { kind: 'numbers' | 'top' | 'front' | 'side'; bp: Blueprint; state?: boolean | null; wrong?: [number, number][] } = $props();

	const TITLE = { numbers: '위에서 본 모양', top: '위에서', front: '앞에서', side: '옆에서' };
	const NOTE = { numbers: '숫자 = 층수 · 아래쪽이 앞', top: '아래쪽이 앞', front: '', side: '왼쪽이 앞' };
	const SIZE = { numbers: 66, top: 44, front: 36, side: 36 };
	const bars = $derived(kind === 'front' ? bp.front : bp.side);
	const isWrong = (r: number, c: number) => wrong.some(([wr, wc]) => wr === r && wc === c);
</script>

<div class="card" class:ok={state === true} class:bad={state === false} style="--s:{SIZE[kind]}px">
	<div class="head">
		<b>{TITLE[kind]}</b>
		{#if state !== null}<span class="mark">{state ? '✓' : '✕'}</span>{/if}
	</div>
	{#if kind === 'numbers' || kind === 'top'}
		<div class="grid" style="grid-template-columns:repeat({bp.cols}, var(--s))">
			{#each bp.target as row, r}
				{#each row as v, c}
					<i class:on={bp.top[r][c]} class:wrong={isWrong(r, c)}>{kind === 'numbers' && v > 0 ? v : ''}</i>
				{/each}
			{/each}
		</div>
	{:else}
		<div class="grid sil" style="grid-template-columns:repeat({bars.length}, var(--s))">
			{#each [3, 2, 1] as level}
				{#each bars as v}<i class:on={v >= level}></i>{/each}
			{/each}
		</div>
	{/if}
	{#if NOTE[kind]}<small>{NOTE[kind]}</small>{/if}
</div>

<style>
	.card {
		background: #fff;
		border-radius: 20px;
		padding: 10px 16px 12px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.14);
		border: 4px solid transparent;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.card.ok {
		border-color: #3fbf7f;
	}
	.card.bad {
		border-color: #ff4d4d;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 22px;
		font-weight: 900;
		color: #5a4630;
	}
	.mark {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		background: #3fbf7f;
	}
	.bad .mark {
		background: #ff4d4d;
	}
	.grid {
		display: grid;
		gap: 4px;
	}
	.grid i {
		width: var(--s);
		height: var(--s);
		border-radius: 8px;
		border: 2px dashed #d8c7a8;
		display: flex;
		align-items: center;
		justify-content: center;
		font-style: normal;
		font-size: calc(var(--s) * 0.55);
		font-weight: 900;
		color: #fff;
	}
	.grid i.on {
		border: 2px solid #d98a1e;
		background: #ffb547;
	}
	.grid i.wrong {
		border-color: #ff4d4d;
		background: #ff6b6b;
		animation: blink 0.4s ease-in-out 3 alternate;
	}
	.sil {
		padding-bottom: 4px;
		border-bottom: 4px solid #8f6d45;
	}
	.sil i {
		border-color: transparent;
	}
	small {
		font-size: 16px;
		font-weight: 700;
		color: #8a7556;
	}
	@keyframes blink {
		to {
			filter: brightness(1.3);
		}
	}
</style>
