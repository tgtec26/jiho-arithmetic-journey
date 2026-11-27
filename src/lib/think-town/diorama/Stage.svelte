<!-- 1280×780 무대를 창에 맞춰 줄여 가운데 둔다 (탭 S6 가로 전체 화면 기준) -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fitScale, STAGE_H, STAGE_W } from '../rules/camera';
	import { setStage } from './context';

	let { children }: { children: Snippet } = $props();
	let w = $state(STAGE_W);
	let h = $state(STAGE_H);
	const scale = $derived(fitScale(w, h));
	setStage({
		get scale() {
			return scale;
		}
	});
</script>

<svelte:window bind:innerWidth={w} bind:innerHeight={h} />

<div class="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#9fd3ef]">
	<div class="stage" style="width:{STAGE_W}px;height:{STAGE_H}px;transform:scale({scale})">
		{@render children()}
	</div>
</div>

<style>
	.stage {
		position: relative;
		flex-shrink: 0;
		overflow: hidden;
		color: #2b2b2b;
		background: linear-gradient(#bfe6ff 0%, #e8f6ff 36%, #d9efc6 37%, #bfe0a3 100%);
	}
</style>
