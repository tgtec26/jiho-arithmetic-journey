<script lang="ts">
  import { onMount } from 'svelte';
  import { gameStore } from '$lib/stores/gameStore.svelte';
  import Confetti from '../Confetti.svelte';

  interface LegoGrid {
    rows: number;
    cols: number;
    adjust: number; // -1, 0, +1
    total: number;  // rows * cols + adjust
    color: string;
    studColor: string;
    shadowColor: string;
  }

  // 레고 색상 팔레트 (배경, 스터드, 그림자)
  const COLOR_PAIRS: [typeof COLORS[number], typeof COLORS[number]][] = [];
  const COLORS = [
    { bg: '#0055BF', stud: '#0069D9', shadow: '#003F8A' },  // 파랑
    { bg: '#C91A09', stud: '#E02020', shadow: '#8B0000' },  // 빨강
    { bg: '#237841', stud: '#2D9B54', shadow: '#1A5C31' },  // 초록
    { bg: '#F2CD37', stud: '#FFD84D', shadow: '#C4A520' },  // 노랑
    { bg: '#FF7E14', stud: '#FF9A44', shadow: '#CC5F00' },  // 주황
    { bg: '#81007B', stud: '#A020A0', shadow: '#5C005A' },  // 보라
  ] as const;

  function pickColorPair(): [typeof COLORS[number], typeof COLORS[number]] {
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  let leftGrid = $state<LegoGrid>({ rows: 0, cols: 0, adjust: 0, total: 0, color: '', studColor: '', shadowColor: '' });
  let rightGrid = $state<LegoGrid>({ rows: 0, cols: 0, adjust: 0, total: 0, color: '', studColor: '', shadowColor: '' });

  let leftOptions = $state<number[]>([]);
  let rightOptions = $state<number[]>([]);
  let finalOptions = $state<number[]>([]);

  let leftSolved = $state(false);
  let rightSolved = $state(false);
  let finalSolved = $state(false);

  let leftErrorIdx = $state<number | null>(null);
  let rightErrorIdx = $state<number | null>(null);
  let finalErrorIdx = $state<number | null>(null);

  let leftWrongCount = $state(0);
  let rightWrongCount = $state(0);
  let finalWrongCount = $state(0);

  let feedback = $state('');
  let confettiRef: any = $state();
  let appearKey = $state(0);

  const TOTAL_ROUNDS = 5;
  let round = $state(0);

  onMount(() => {
    startNewRound();
  });

  function generateOptions(answer: number): number[] {
    // 오답 2개를 랜덤 간격으로 생성 (±1~3, 중복·음수 방지)
    const opts = new Set<number>([answer]);
    while (opts.size < 3) {
      const offset = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? -1 : 1);
      const val = answer + offset;
      if (val >= 1 && val !== answer) opts.add(val);
    }
    return Array.from(opts).sort((a, b) => a - b);
  }

  // 랜덤 adjust: 약 40% 확률로 ±1
  function randomAdjust(): number {
    const r = Math.random();
    if (r < 0.3) return 0;
    if (r < 0.65) return 1;
    return -1;
  }

  function startNewRound() {
    if (round >= TOTAL_ROUNDS) {
      gameStore.updateProgress(TOTAL_ROUNDS, TOTAL_ROUNDS);
      return;
    }

    const [color1, color2] = pickColorPair();

    const lCols = Math.floor(Math.random() * 3) + 2; // 2~4
    const lRows = Math.floor(Math.random() * 3) + 2;
    const rCols = Math.floor(Math.random() * 3) + 2;
    const rRows = Math.floor(Math.random() * 3) + 2;

    const lAdj = randomAdjust();
    const rAdj = randomAdjust();

    leftGrid = {
      rows: lRows, cols: lCols, adjust: lAdj,
      total: lRows * lCols + lAdj,
      color: color1.bg, studColor: color1.stud, shadowColor: color1.shadow
    };
    rightGrid = {
      rows: rRows, cols: rCols, adjust: rAdj,
      total: rRows * rCols + rAdj,
      color: color2.bg, studColor: color2.stud, shadowColor: color2.shadow
    };

    leftOptions = generateOptions(leftGrid.total);
    rightOptions = generateOptions(rightGrid.total);
    finalOptions = generateOptions(leftGrid.total + rightGrid.total);

    leftSolved = false;
    rightSolved = false;
    finalSolved = false;
    leftErrorIdx = null;
    rightErrorIdx = null;
    finalErrorIdx = null;
    leftWrongCount = 0;
    rightWrongCount = 0;
    finalWrongCount = 0;
    feedback = '';
    appearKey += 1;

    round += 1;
    gameStore.updateProgress(round - 1, TOTAL_ROUNDS);
  }

  function handleLeftAnswer(idx: number) {
    if (leftSolved) return;
    const choice = leftOptions[idx];
    if (choice === leftGrid.total) {
      leftSolved = true;
      leftErrorIdx = null;
      gameStore.addScore(10, true);
      feedback = '';
    } else {
      leftErrorIdx = idx;
      leftWrongCount += 1;
      feedback = '다시 생각해볼까요? 🤔';
      if (leftWrongCount === 2) gameStore.subtractScore(10);
      setTimeout(() => { leftErrorIdx = null; feedback = ''; }, 800);
    }
  }

  function handleRightAnswer(idx: number) {
    if (rightSolved) return;
    const choice = rightOptions[idx];
    if (choice === rightGrid.total) {
      rightSolved = true;
      rightErrorIdx = null;
      gameStore.addScore(10, true);
      feedback = '';
    } else {
      rightErrorIdx = idx;
      rightWrongCount += 1;
      feedback = '다시 생각해볼까요? 🤔';
      if (rightWrongCount === 2) gameStore.subtractScore(10);
      setTimeout(() => { rightErrorIdx = null; feedback = ''; }, 800);
    }
  }

  function handleFinalAnswer(idx: number) {
    if (finalSolved) return;
    const choice = finalOptions[idx];
    const correctSum = leftGrid.total + rightGrid.total;
    if (choice === correctSum) {
      finalSolved = true;
      finalErrorIdx = null;
      feedback = '완벽해요! 레고 천재 지호! 🧱🎉';
      gameStore.addScore(10, true);
      confettiRef?.fire();
      setTimeout(startNewRound, 2500);
    } else {
      finalErrorIdx = idx;
      finalWrongCount += 1;
      feedback = '두 수를 다시 더해볼까요? 🧐';
      if (finalWrongCount === 2) gameStore.subtractScore(10);
      setTimeout(() => { finalErrorIdx = null; feedback = ''; }, 800);
    }
  }

  const bothSolved = $derived(leftSolved && rightSolved);
</script>

<Confetti bind:this={confettiRef} />

<div class="lego-stage flex flex-col items-center w-full h-[calc(100vh-120px)] max-w-6xl mx-auto px-2 select-none overflow-hidden">

  <!-- 제목 -->
  <div class="text-center shrink-0">
    <h2 class="text-2xl sm:text-3xl font-black text-white drop-shadow-lg tracking-tight leading-tight">레고 블록 세기</h2>
    <p class="text-accent-yellow font-bold text-sm sm:text-base leading-tight" style="word-break: keep-all; overflow-wrap: break-word;">
      레고를 곱셈으로 세어보세요! 🧱
    </p>
  </div>

  <!-- 메인 콘텐츠: CSS Grid 3열 -->
  {#key appearKey}
  <div class="lego-main-grid w-full mt-0.5">

    <!-- 왼쪽 열: 그리드 + 수식 + 보기 -->
    <div class="flex flex-col items-center gap-1 lego-appear" style="animation-delay: 0ms; grid-area: left;">
      <div class="lego-grid" style="--lego-color: {leftGrid.color}; --stud-color: {leftGrid.studColor}; --shadow-color: {leftGrid.shadowColor};">
        {#each Array(leftGrid.rows) as _, r}
          <div class="flex gap-[2px]">
            {#each Array(leftGrid.cols) as _, c}
              {#if leftGrid.adjust === -1 && r === leftGrid.rows - 1 && c === leftGrid.cols - 1}
                <div class="lego-brick lego-empty"></div>
              {:else}
                <div class="lego-brick">
                  <div class="lego-stud"></div>
                </div>
              {/if}
            {/each}
          </div>
        {/each}
        {#if leftGrid.adjust === 1}
          <div class="flex gap-[2px]">
            <div class="lego-brick">
              <div class="lego-stud"></div>
            </div>
          </div>
        {/if}
      </div>
      <div class="text-lg sm:text-xl font-black text-white/90 tracking-wide">
        {#if leftSolved}
          {leftGrid.total}개 <span class="text-green-400">✓</span>
        {:else}
          몇 개?
        {/if}
      </div>
      <div class="flex gap-2">
        {#each leftOptions as opt, i}
          <button
            onclick={() => handleLeftAnswer(i)}
            disabled={leftSolved}
            class="lego-option {leftSolved && opt === leftGrid.total ? 'correct' : ''} {leftErrorIdx === i ? 'shake-error error-bg' : ''}"
          >
            {opt}
          </button>
        {/each}
      </div>
    </div>

    <!-- + 기호 -->
    <div class="text-4xl sm:text-5xl font-black text-white/50 flex items-center justify-center" style="grid-area: plus;">+</div>

    <!-- 오른쪽 열: 그리드 + 수식 + 보기 -->
    <div class="flex flex-col items-center gap-1 lego-appear" style="animation-delay: 200ms; grid-area: right;">
      <div class="lego-grid" style="--lego-color: {rightGrid.color}; --stud-color: {rightGrid.studColor}; --shadow-color: {rightGrid.shadowColor};">
        {#each Array(rightGrid.rows) as _, r}
          <div class="flex gap-[2px]">
            {#each Array(rightGrid.cols) as _, c}
              {#if rightGrid.adjust === -1 && r === rightGrid.rows - 1 && c === rightGrid.cols - 1}
                <div class="lego-brick lego-empty"></div>
              {:else}
                <div class="lego-brick">
                  <div class="lego-stud"></div>
                </div>
              {/if}
            {/each}
          </div>
        {/each}
        {#if rightGrid.adjust === 1}
          <div class="flex gap-[2px]">
            <div class="lego-brick">
              <div class="lego-stud"></div>
            </div>
          </div>
        {/if}
      </div>
      <div class="text-lg sm:text-xl font-black text-white/90 tracking-wide">
        {#if rightSolved}
          {rightGrid.total}개 <span class="text-green-400">✓</span>
        {:else}
          몇 개?
        {/if}
      </div>
      <div class="flex gap-2">
        {#each rightOptions as opt, i}
          <button
            onclick={() => handleRightAnswer(i)}
            disabled={rightSolved}
            class="lego-option {rightSolved && opt === rightGrid.total ? 'correct' : ''} {rightErrorIdx === i ? 'shake-error error-bg' : ''}"
          >
            {opt}
          </button>
        {/each}
      </div>
    </div>
  </div>
  {/key}

  <!-- 하단: 합산 영역 -->
  <div class="w-full flex flex-col items-center shrink-0 mt-1">
    {#if bothSolved && !finalSolved}
      <div class="text-xl sm:text-2xl font-black text-white mb-1 lego-appear" style="word-break: keep-all; overflow-wrap: break-word;">
        {leftGrid.total} + {rightGrid.total} = ?
      </div>
      <div class="flex gap-3 lego-appear" style="animation-delay: 300ms;">
        {#each finalOptions as opt, i}
          <button
            onclick={() => handleFinalAnswer(i)}
            class="lego-option final {finalErrorIdx === i ? 'shake-error error-bg' : ''}"
          >
            {opt}
          </button>
        {/each}
      </div>
    {:else if finalSolved}
      <div class="text-xl sm:text-2xl font-black text-green-400 animate-bounce">
        {leftGrid.total} + {rightGrid.total} = {leftGrid.total + rightGrid.total} ✅
      </div>
    {/if}
  </div>

  <!-- 피드백 (고정 오버레이) -->
  {#if feedback}
    <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl sm:text-3xl font-black text-white text-center drop-shadow-2xl z-50 pointer-events-none bg-black/50 px-8 py-3 rounded-2xl backdrop-blur-sm" style="word-break: keep-all;">{feedback}</div>
  {/if}
</div>

<style>
  .lego-stage {
    position: relative;
  }

  .lego-main-grid {
    display: grid;
    grid-template-areas: "left plus right";
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    justify-items: center;
    gap: 8px 16px;
  }

  .lego-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: rgba(255,255,255,0.08);
    padding: 8px;
    border-radius: 14px;
    border: 2px solid rgba(255,255,255,0.15);
  }

  .lego-empty {
    visibility: hidden;
  }

  .lego-brick {
    width: 36px;
    height: 28px;
    background: var(--lego-color);
    border-radius: 3px;
    position: relative;
    box-shadow:
      inset 0 -2px 0 var(--shadow-color),
      inset 0 1px 0 rgba(255,255,255,0.2),
      0 1px 3px rgba(0,0,0,0.3);
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .lego-stud {
    width: 14px;
    height: 14px;
    background: var(--stud-color);
    border-radius: 50%;
    margin-top: 3px;
    box-shadow:
      inset 0 -2px 0 var(--shadow-color),
      inset 0 1px 0 rgba(255,255,255,0.35),
      0 1px 2px rgba(0,0,0,0.2);
  }

  .lego-option {
    min-width: 60px;
    padding: 6px 14px;
    background: white;
    border-radius: 18px;
    font-size: 1.25rem;
    font-weight: 900;
    color: #13183D;
    border-bottom: 4px solid #d1d5db;
    box-shadow: 0 3px 8px rgba(0,0,0,0.15);
    transition: all 0.15s;
  }

  .lego-option:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .lego-option:active:not(:disabled) {
    transform: scale(0.95);
    border-bottom-width: 2px;
  }

  .lego-option:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .lego-option.correct {
    background: #F0FDF4 !important;
    border-color: #22C55E !important;
    color: #166534 !important;
    opacity: 1 !important;
  }

  .lego-option.final {
    min-width: 76px;
    padding: 8px 18px;
    font-size: 1.5rem;
    background: #FEF3C7;
    border-color: #F59E0B;
    color: #92400E;
  }

  .lego-option.final:hover:not(:disabled) {
    background: #FDE68A;
  }

  .error-bg {
    background: #FEE2E2 !important;
    border-color: #EF4444 !important;
    color: #991B1B !important;
  }

  .shake-error {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }

  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }

  .lego-appear {
    opacity: 0;
    animation: lego-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes lego-pop {
    0% { opacity: 0; scale: 0.85; }
    60% { scale: 1.03; }
    100% { opacity: 1; scale: 1; }
  }
</style>
