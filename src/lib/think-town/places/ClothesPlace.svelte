<!-- 👕 옷가게 경우의 수: 옷걸이 칸을 눌러 마네킹에 입히고 📷 찍기. 사진첩을 빠짐없이·겹치지 않게 채운다 -->
<script lang="ts">
	import Board from '../diorama/Board.svelte';
	import Doll from '../diorama/Doll.svelte';
	import OutfitArt from '../art/OutfitArt.svelte';
	import { NO_OUTFIT, OUTFIT_HEX, clothesHint, partsOf, remaining, slotsShown, takePhoto, totalOutfits, wear, type Outfit, type Part } from '../rules/clothes-play';
	import type { Outfits } from '$think/counting.js';
	import { sound } from '../sound.svelte';

	let { puzzle, stage, onSolved }: { puzzle: Outfits; stage: number; onSolved: (r: { bonus: boolean }) => void } = $props();

	// svelte-ignore state_referenced_locally
	const parts = partsOf(puzzle);
	// svelte-ignore state_referenced_locally
	const total = totalOutfits(puzzle);
	// svelte-ignore state_referenced_locally
	const shown = slotsShown(stage);
	// 옷걸이 열은 몸 위에서 아래 순서
	const COLUMNS = (['hat', 'shirt', 'pants'] as Part[]).filter((p) => parts.includes(p));
	const ICON: Record<Part, { box: string; d: string }> = {
		hat: { box: '26 0 58 36', d: 'M33 26 Q34 6 50 6 Q66 6 67 26 Z M31 25 H80 Q81 31 74 31 H31 Q28 28 31 25 Z' },
		shirt: { box: '8 48 84 70', d: 'M33 54 L20 62 L13 82 L26 87 L31 76 V112 H69 V76 L74 87 L87 82 L80 62 L67 54 Q50 66 33 54 Z' },
		pants: { box: '24 100 52 72', d: 'M30 106 H70 V118 L68 168 H53 L50 124 L47 168 H32 L30 118 Z' }
	};

	let outfit = $state<Outfit>(NO_OUTFIT);
	let album = $state<string[]>([]);
	let solved = $state(false);
	let flash = $state(0);
	let fresh = $state(-1);
	let dup = $state(-1);
	let need = $state<Part[]>([]);
	let bubble = $state<{ text: string; key: number } | null>(null);
	let glowCamera = $state(false);
	let glowDone = $state(false);
	let doneShake = $state(0);
	let toks = { dup: 0, need: 0, bubble: 0, hint: 0 };

	const later = (k: keyof typeof toks, ms: number, fn: () => void) => {
		const t = ++toks[k];
		setTimeout(() => t === toks[k] && fn(), ms);
	};
	const say = (text: string) => {
		bubble = { text, key: Date.now() };
		later('bubble', 1800, () => (bubble = null));
	};
	const photoOf = (key: string): Outfit => {
		const v = key.split('|');
		return { shirt: v[0], pants: v[1], hat: v[2] ?? null };
	};

	function pick(part: Part, color: string) {
		if (solved) return;
		const next = wear(outfit, part, color);
		if (next === outfit) return;
		outfit = next;
		sound.play('drop');
	}

	function snap() {
		if (solved) return;
		const r = takePhoto(album, outfit, puzzle);
		if (r.result === 'incomplete') {
			sound.play('bump');
			need = r.missing;
			later('need', 900, () => (need = []));
			return;
		}
		if (r.result === 'dup') {
			sound.play('bump');
			dup = r.index;
			later('dup', 700, () => (dup = -1));
			say('이미 있어!');
			return;
		}
		album = r.album;
		fresh = r.index;
		flash += 1;
		sound.play('stamp');
		if (shown && album.length === total) win();
	}

	function done() {
		if (solved) return;
		const left = remaining(album, puzzle);
		if (left === 0) return win();
		sound.play('error');
		doneShake += 1;
		say(`아직 ${left}개 더 있어!`);
	}

	function win() {
		solved = true;
		onSolved({ bonus: false });
	}

	export function hint() {
		if (solved) return;
		const h = clothesHint(album, puzzle);
		if (!h) {
			glowDone = true;
			later('hint', 1600, () => (glowDone = false));
			return;
		}
		outfit = h;
		glowCamera = true;
		later('hint', 1600, () => (glowCamera = false));
	}
</script>

<div class="rack">
	{#each COLUMNS as part}
		<div class="col" class:need={need.includes(part)}>
			{#each puzzle[part] ?? [] as color}
				<button class="item" class:on={outfit[part] === color} onclick={() => pick(part, color)} aria-label="{part} {color}">
					<svg viewBox={ICON[part].box}><path d={ICON[part].d} fill={OUTFIT_HEX[color]} stroke="rgba(0,0,0,.22)" stroke-width="3" stroke-linejoin="round" /></svg>
				</button>
			{/each}
		</div>
	{/each}
</div>

<Board width={280} depth={200} cx={596} cy={468} tilt={50} turn={-12} zoom={1.3} ground="#f4dbe5" rim="#d9a7b8">
	<div class="rug"></div>
	<Doll x={140} y={110} height={250} cls="mannequin {need.length ? 'shake' : ''}">
		<OutfitArt shirt={outfit.shirt} pants={outfit.pants} hat={parts.includes('hat') ? outfit.hat : null} />
	</Doll>
</Board>
{#key flash}
	{#if flash}<div class="flash"></div>{/if}
{/key}
{#if bubble}
	{#key bubble.key}<div class="bubble">{bubble.text}</div>{/key}
{/if}

<button class="camera" class:glow={glowCamera} disabled={solved} onclick={snap}>📷 찰칵</button>

<div class="side">
<div class="album">
	<div class="head">
		<b>사진첩</b>
		<span>{shown ? `${album.length} / ${total}` : `${album.length}장`}</span>
	</div>
	<div class="grid">
		{#each album as key, i (key)}
			<div class="photo w{i % 4}" class:fresh={fresh === i} class:dup={dup === i} class:hop={solved}>
				<OutfitArt {...photoOf(key)} />
			</div>
		{/each}
		{#if shown}
			{#each Array(total - album.length) as _}<div class="photo empty"></div>{/each}
		{:else if album.length < 12}
			<div class="photo empty next"></div>
		{/if}
	</div>
</div>
{#if !shown}
	{#key doneShake}
		<button class="done" class:glow={glowDone} class:shake={doneShake > 0} disabled={solved || !album.length} onclick={done}>다 찾았다!</button>
	{/key}
{/if}
</div>

<style>
	.rack {
		position: absolute;
		left: 26px;
		top: 96px;
		display: flex;
		gap: 12px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.92);
		border-radius: 28px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 6px;
		border-radius: 22px;
		transition: background 0.2s;
	}
	.col.need {
		animation: need 0.3s ease-in-out 3 alternate;
	}
	@keyframes need {
		to {
			background: #ffe27a;
		}
	}
	.item {
		width: 92px;
		height: 92px;
		border-radius: 22px;
		background: #f6f1e6;
		border: 5px solid transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s;
	}
	.item svg {
		width: 66px;
		height: 66px;
	}
	.item.on {
		border-color: #4d96ff;
		background: #eaf2ff;
		transform: translateY(-4px);
		box-shadow: 0 6px 0 #2f6fd6;
	}
	.rug {
		position: absolute;
		left: 50px;
		top: 30px;
		width: 180px;
		height: 140px;
		border-radius: 50%;
		background: #fff3f7;
		box-shadow: inset 0 0 0 8px #f0b8cc;
	}
	:global(.doll.mannequin .art) {
		transform-origin: 50% 100%;
	}
	:global(.doll.mannequin.shake .art) {
		animation: wobble 0.42s;
	}
	@keyframes wobble {
		20%,
		60% {
			translate: -9px 0;
		}
		40%,
		80% {
			translate: 9px 0;
		}
	}
	.flash {
		position: absolute;
		left: 380px;
		top: 90px;
		width: 430px;
		height: 520px;
		border-radius: 30px;
		background: #fff;
		pointer-events: none;
		animation: flash 0.4s ease-out forwards;
	}
	@keyframes flash {
		from {
			opacity: 0.9;
		}
		to {
			opacity: 0;
		}
	}
	.bubble {
		position: absolute;
		left: 596px;
		top: 104px;
		transform: translateX(-50%);
		background: #fff;
		color: #c0392b;
		font-size: 30px;
		font-weight: 900;
		padding: 12px 26px;
		border-radius: 24px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
		white-space: nowrap;
		pointer-events: none;
		animation: pop 0.3s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	@keyframes pop {
		from {
			transform: translateX(-50%) scale(0.5);
			opacity: 0;
		}
	}
	.camera {
		position: absolute;
		left: 596px;
		top: 636px;
		transform: translateX(-50%);
		width: 240px;
		height: 90px;
		border-radius: 30px;
		background: #4d96ff;
		color: #fff;
		font-size: 34px;
		font-weight: 900;
		box-shadow: 0 6px 0 #2f6fd6;
	}
	.camera:active:not(:disabled) {
		transform: translateX(-50%) translateY(4px);
		box-shadow: 0 2px 0 #2f6fd6;
	}
	.camera:disabled {
		background: #c9d6ea;
		box-shadow: 0 6px 0 #aab7cc;
	}
	.camera.glow,
	.done.glow {
		animation: glowbtn 0.4s ease-in-out infinite alternate;
	}
	@keyframes glowbtn {
		to {
			background: #ffc400;
			box-shadow: 0 6px 0 #d19a00;
		}
	}
	.side {
		position: absolute;
		right: 26px;
		top: 92px;
		width: 430px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.album {
		padding: 14px 16px 16px;
		background: rgba(255, 255, 255, 0.94);
		border-radius: 28px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 24px;
		font-weight: 900;
		color: #5a4630;
		margin-bottom: 12px;
	}
	.head span {
		background: #fff3c4;
		padding: 4px 16px;
		border-radius: 999px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(4, 92px);
		gap: 10px;
	}
	.photo {
		height: 112px;
		border-radius: 12px;
		background: #fdf7ee;
		border: 5px solid #fff;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 4px;
	}
	.photo > :global(svg) {
		height: 96px;
	}
	.photo.empty {
		background: transparent;
		border: 4px dashed #e0cfb2;
		box-shadow: none;
	}
	.photo.next {
		border-color: #b9d3ff;
	}
	.photo.fresh {
		animation: fresh 0.45s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	@keyframes fresh {
		from {
			transform: scale(0.2) rotate(-14deg);
			opacity: 0;
		}
	}
	.photo.dup {
		animation: dup 0.42s;
		border-color: #ffc400;
	}
	@keyframes dup {
		20%,
		60% {
			transform: translateX(-7px);
		}
		40%,
		80% {
			transform: translateX(7px);
		}
	}
	.photo.hop {
		animation: hop 0.5s ease-in-out 3;
	}
	.photo.hop.w1 {
		animation-delay: 0.08s;
	}
	.photo.hop.w2 {
		animation-delay: 0.16s;
	}
	.photo.hop.w3 {
		animation-delay: 0.24s;
	}
	@keyframes hop {
		50% {
			transform: translateY(-16px);
		}
	}
	.done {
		height: 84px;
		border-radius: 26px;
		background: #3fbf7f;
		color: #fff;
		font-size: 32px;
		font-weight: 900;
		box-shadow: 0 6px 0 #2e9963;
	}
	.done:disabled {
		background: #c9d6ea;
		box-shadow: 0 6px 0 #aab7cc;
	}
	.done.shake {
		animation: dup 0.45s;
	}
	.done.glow.shake {
		animation: glowbtn 0.4s ease-in-out infinite alternate;
	}
</style>
