<!-- 아빠 버튼: 꾹 누르고 있으면 테두리가 차오르고, 다 차면 한 번 실행. 일찍 떼면 취소 -->
<script lang="ts">
	let {
		label,
		ms = 800,
		disabled = false,
		cls = '',
		onfire
	}: { label: string; ms?: number; disabled?: boolean; cls?: string; onfire: () => void } = $props();

	let progress = $state(0);
	let raf = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let t0 = 0;

	// 실행은 타이머로(화면 갱신이 느려져도 정확히 ms 뒤), 테두리 그림만 프레임마다
	function draw() {
		progress = Math.min(1, (performance.now() - t0) / ms);
		raf = requestAnimationFrame(draw);
	}

	function start(e: PointerEvent) {
		if (disabled || timer) return;
		e.preventDefault();
		t0 = performance.now();
		raf = requestAnimationFrame(draw);
		timer = setTimeout(() => {
			stop();
			onfire();
		}, ms);
	}

	function stop() {
		cancelAnimationFrame(raf);
		clearTimeout(timer);
		timer = undefined;
		progress = 0;
	}
</script>

<button
	class="long {cls}"
	class:holding={progress > 0}
	{disabled}
	style="--p:{progress * 360}deg"
	onpointerdown={start}
	onpointerup={stop}
	onpointerleave={stop}
	onpointercancel={stop}
	oncontextmenu={(e) => e.preventDefault()}
>
	<span>{label}</span>
</button>

<style>
	.long {
		position: relative;
		padding: 5px;
		border-radius: 999px;
		background: conic-gradient(#ffb400 var(--p), rgba(255, 255, 255, 0.6) var(--p));
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
		-webkit-touch-callout: none;
	}
	.long span {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 64px;
		padding: 0 26px;
		border-radius: 999px;
		background: #fff;
		color: #6b4d00;
		font-size: 22px;
		font-weight: 900;
		white-space: nowrap;
	}
	.long.holding span {
		background: #fff8df;
	}
	.long:disabled {
		opacity: 0.45;
	}
</style>
