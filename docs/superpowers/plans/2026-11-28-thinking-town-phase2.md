# 생각 마을 2단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 생각 마을에 🧱 블록 공방(쌓기나무)과 🌼 사랑이 정원(모양 스도쿠)을 더해, 1단계 두 곳과 같은 흐름(3컷 이야기 → 퍼즐 → 대화 카드 → 도장)으로 끝까지 할 수 있게 한다.

**Architecture:** 1단계 구조를 그대로 쓴다. 퍼즐 규칙은 `$think/blocks.js`·`$think/logic.js`에서 가져오고, 앱 쪽 판단(블록 쌓기·빼기, 설계도 비교, 가장 적은 블록, 꽃 심기, 겹침, 힌트)은 `src/lib/think-town/rules/`의 순수 TS로 두고 vitest로 검사한다. 화면은 기존 디오라마 부품(Board·Box3D·Doll)에 판 돌리기 전환과 그림(snippet) 인형만 더한다. 퍼즐은 기존 도구가 미리 만들어 JSON에 더한다.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, vitest (`npx vitest run src`, `npm run ws:test`). 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-11-27-thinking-town-tablet-design.md` (6.2, 6.5, 7, 8, 13절)

## Global Constraints

- 1단계 계획(`2026-11-27-thinking-town-phase1.md`)의 Global Constraints 전부 그대로(1280×780 무대, 스크롤 없음, 새 의존성 없음, 아빠 버튼 길게 누름, 음향 규칙, 커밋 계정, 푸시 조건).
- 블록 공방: 단계 1·2 = 위에서 본 모양 + 칸마다 층수(답 하나, 그대로 쌓기). 단계 3~5 = 위·앞·옆 모양, 세 모양이 모두 같으면 정답. 도전 "가장 적은 블록으로" = 별 하나 더. 90°씩 4방향 돌려 보기만(자유 회전 없음). 힌트 = 블록 한 칸 보여 주기.
- 사랑이 정원: 꽃 4종(모양·색이 다름), 4×4, 줄·네모마다 하나씩. 같은 줄·네모에 겹치면 그 꽃이 빨갛게 흔들림. 다 심으면 꽃이 핌. 힌트 = 한 칸 채우기.
- 단계 s 퍼즐 = 학습지 라운드 s 범위(블록 `BLOCK_RANGES[s]`, 스도쿠 빈칸 `SUDOKU_BLANKS[s]`). 단계마다 12·12·12·12·40개, 학습지·앱 안에서 겹치지 않음.
- 기존 주차장·줄 세우기 퍼즐 JSON은 한 글자도 바뀌지 않는다(지호 기기의 cursor가 같은 퍼즐을 가리키도록).
- 블록 높이는 칸마다 0~3.

## Claude가 정한 것 (기획서에 없는 조작 세부)

- 블록: 아래 도구 버튼 **쌓기 / 빼기** 중 하나를 고르고 바닥 칸이나 탑을 누름. 3층 위로 쌓기·빈칸 빼기는 "보잉" 소리만.
- 블록 판정은 **확인 버튼**(매표소처럼). 자동 판정이면 "가장 적게"에 도전할 틈이 없어서. 틀리면 어긋난 설계도 카드만 ✕ + 흔들림, 단계 1·2는 틀린 칸이 설계도에 빨갛게.
- 블록 단계 1·2는 답이 하나라 별 하나 더가 없다(도전이 없으므로). 단계 3~5 퍼즐은 답이 둘 이상인 것만 써서 "가장 적게"가 늘 의미 있게.
- 블록 힌트: 지금 쌓은 것과 가장 가까운 정답에서 처음 다른 칸을 반짝이고 "n층"을 1.6초 보여 줌(대신 쌓지는 않음). 이미 맞으면 확인 버튼이 반짝임.
- 정원: 오른쪽 꽃씨 칸에서 꽃을 고르고 화단 칸을 누르면 심음. 같은 꽃을 다시 누르면 뽑음, 다른 꽃이면 바꿔 심음. 처음부터 있던 꽃(말뚝 표시)은 안 바뀜. 겹친 꽃은 겹침이 풀릴 때까지 빨간 채로, 겹침이 생긴 순간 흔들림 + 오답 소리.
- 정원은 다 맞게 심는 순간 자동 성공(답이 하나라 확인이 필요 없음), 별 하나 더 없음.
- 정원 힌트: 잘못 심은 칸이 있으면 그 칸을, 없으면 후보가 가장 적은 빈칸을 정답 꽃으로 심고 반짝임.
- 꽃 그림은 코드(SVG)로: ● 빨간 동그란 꽃, ▲ 보라 튤립, ■ 파란 네잎꽃, ★ 노란 별꽃.

## Review Focus

1. **4방향 돌린 뒤 누르기**: 판을 90°·180°·270° 돌린 상태에서 누른 칸/탑이 화면에서 누른 바로 그 칸이어야 한다 → Task 4 브라우저 확인(돌릴 때마다 서로 다른 칸 두 곳 눌러 높이 확인).
2. **블록 연타·한계**: 3층 위 쌓기·0층 빼기는 바뀌지 않고 같은 참조를 돌려준다 → `addBlock`/`removeBlock` 테스트(Task 1).
3. **확인 뒤 다시 고침**: 결과 ✓/✕는 블록을 바꾸는 순간 지워지고, 성공한 판은 더 못 바꾼다 → Task 4에서 `results = null` 처리, 브라우저 확인.
4. **정원 처음 꽃·겹침 풀림**: 처음 있던 칸은 안 바뀌고, 겹친 꽃을 뽑으면 빨간 표시가 바로 사라진다 → `plant`·`conflicts` 테스트(Task 1).
5. **성공 중 연타·힌트로 완성**: 마지막 칸을 힌트가 채워도 성공은 한 번(별 중복 없음) → `solved` 가드 + 기존 `run.solve` 중복 방지, Task 5 브라우저 확인.

---

### Task 1: 블록·정원 규칙

**Files:**
- Modify: `worksheets/lib/think/blocks.js` (끝에 `viewAnswers` 추가, 다른 줄은 그대로)
- Test: `worksheets/tests/think-blocks.test.js` (describe 하나 추가)
- Create: `worksheets/lib/think/blocks.d.ts`
- Modify: `worksheets/lib/think/logic.d.ts` (`SHAPES`, `SUDOKU_BLANKS`, `sudokuSolutions` 선언 추가)
- Create: `src/lib/think-town/rules/blocks-play.ts`, `src/lib/think-town/rules/garden-play.ts`
- Test: `src/lib/think-town/rules/blocks-play.test.ts`, `src/lib/think-town/rules/garden-play.test.ts`

**Interfaces:**
- Produces (`blocks.js`): `viewAnswers(top: boolean[][], front: number[], side: number[], maxH = 3): number[][][]` — 위 모양이 true인 칸만 1~maxH, 나머지 0, `frontView`·`sideView`가 front·side와 같은 높이 지도 전부(줄 순서 그대로, 칸 순서 그대로 탐색).
- Produces (`blocks-play.ts`):
  - `MAX_H = 3`, `type Heights = number[][]`
  - `type Blueprint = { rows: number; cols: number; numbers: boolean; target: Heights; top: boolean[][]; front: number[]; side: number[] }`
  - `blueprintOf(heights: string[], stage: number): Blueprint` (numbers = stage ≤ 2)
  - `emptyBuild(bp): Heights`, `addBlock(b, r, c): Heights`, `removeBlock(b, r, c): Heights` (한계면 b 그대로)
  - `checkBuild(b, bp): { top: boolean; front: boolean; side: boolean; wrong: [number, number][] }` (numbers면 wrong = target과 다른 칸, 세 값 모두 `wrong.length === 0`)
  - `isBuilt(b, bp): boolean`, `blockAnswers(bp): Heights[]` (numbers면 `[target]`), `minBlocks(bp): number`
  - `blockHint(b, bp): { r: number; c: number; h: number } | null`
- Produces (`garden-play.ts`):
  - `type Garden = string[][]` ('.' 또는 SHAPES 글자)
  - `parseGarden(grid: string[]): { cells: Garden; fixed: boolean[][] }`
  - `plant(cells, fixed, r, c, shape): Garden` (처음 꽃이면 cells 그대로, 같은 꽃이면 '.', 아니면 shape)
  - `conflicts(cells): boolean[][]`, `isGardenSolved(cells): boolean`, `gardenSolution(grid: string[]): Garden`
  - `gardenHint(cells, solution): { r: number; c: number; shape: string } | null`

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
// think-blocks.test.js
describe('viewAnswers', () => {
  it('세 모양에 맞는 탑을 모두 찾는다', () => {
    // 위: 2×2 모두, 앞 [2,1], 옆(앞 줄→뒤 줄) [2,1]
    const all = viewAnswers([[true, true], [true, true]], [2, 1], [2, 1]);
    expect(all).toEqual([[[1, 1], [2, 1]]]);   // 뒤 줄 [1,1], 앞 줄 [2,1]
    // 앞 [2,2], 옆 [2,2] → 대각선 두 칸만 2여도 됨: 답 여럿
    expect(viewAnswers([[true, true], [true, true]], [2, 2], [2, 2]).length).toBeGreaterThan(1);
  });
  it('정답 높이 지도는 늘 답 안에 있다', () => {
    const h = parseHeights(['120', '311']);
    const all = viewAnswers(topView(h), frontView(h), sideView(h));
    expect(all.map((a) => a.join('/'))).toContain(h.join('/'));
  });
});
```

```ts
// blocks-play.test.ts
const NUM = blueprintOf(['12', '01'], 1);          // numbers
const VIEW = blueprintOf(['22', '22'], 3);         // 앞 [2,2], 옆 [2,2]
it('단계 1·2는 층수 설계도, 3부터는 세 모양', () => {
  expect(NUM.numbers).toBe(true); expect(NUM.target).toEqual([[1, 2], [0, 1]]);
  expect(VIEW.numbers).toBe(false); expect(VIEW.front).toEqual([2, 2]); expect(VIEW.side).toEqual([2, 2]);
});
it('쌓기는 3층까지, 빼기는 0층까지 (한계면 그대로)', () => {
  let b = emptyBuild(NUM); b = addBlock(addBlock(addBlock(b, 0, 0), 0, 0), 0, 0);
  expect(b[0][0]).toBe(3); expect(addBlock(b, 0, 0)).toBe(b);
  const e = emptyBuild(NUM); expect(removeBlock(e, 1, 1)).toBe(e);
});
it('층수 설계도: 틀린 칸을 알려 준다', () => {
  const r = checkBuild([[1, 1], [0, 1]], NUM);
  expect(r.wrong).toEqual([[0, 1]]); expect(r.top).toBe(false); expect(isBuilt([[1, 2], [0, 1]], NUM)).toBe(true);
});
it('세 모양 설계도: 모양마다 맞음/틀림, 다른 탑도 정답', () => {
  expect(checkBuild([[2, 1], [1, 2]], VIEW)).toEqual({ top: true, front: true, side: true, wrong: [] });
  expect(checkBuild([[2, 2], [1, 1]], VIEW)).toMatchObject({ top: true, front: true, side: false });
  expect(checkBuild([[2, 2], [2, 0]], VIEW).top).toBe(false);
});
it('가장 적은 블록', () => { expect(minBlocks(VIEW)).toBe(6); expect(minBlocks(NUM)).toBe(4); });
it('힌트: 가장 가까운 정답에서 처음 다른 칸, 이미 맞으면 null', () => {
  expect(blockHint([[2, 1], [1, 1]], VIEW)).toEqual({ r: 1, c: 1, h: 2 });
  expect(blockHint([[1, 2], [0, 1]], NUM)).toBeNull();
  expect(blockHint(emptyBuild(NUM), NUM)).toEqual({ r: 0, c: 0, h: 1 });
});

// garden-play.test.ts
const G = ['●★▲.', '■▲★●', '.■.★', '★●■.'];   // 학습지 판, 답 하나
it('처음 꽃은 고정, 빈칸만 바뀐다', () => {
  const { cells, fixed } = parseGarden(G);
  expect(fixed[0][0]).toBe(true); expect(fixed[0][3]).toBe(false);
  expect(plant(cells, fixed, 0, 0, '■')).toBe(cells);
  const a = plant(cells, fixed, 0, 3, '■'); expect(a[0][3]).toBe('■');
  expect(plant(a, fixed, 0, 3, '■')[0][3]).toBe('.');   // 같은 꽃 다시 = 뽑기
  expect(plant(a, fixed, 0, 3, '●')[0][3]).toBe('●');   // 다른 꽃 = 바꿔 심기
});
it('같은 줄·칸·네모에 겹친 꽃 둘 다 빨강, 뽑으면 사라짐', () => {
  const { cells, fixed } = parseGarden(G);
  const bad = plant(cells, fixed, 0, 3, '●');            // 0줄에 ● 둘
  const k = conflicts(bad); expect(k[0][0]).toBe(true); expect(k[0][3]).toBe(true); expect(k[1][3]).toBe(true);
  expect(conflicts(plant(bad, fixed, 0, 3, '●')).flat().some(Boolean)).toBe(false);
});
it('다 맞게 심으면 풀림', () => {
  const sol = gardenSolution(G); expect(isGardenSolved(sol)).toBe(true);
  expect(isGardenSolved(parseGarden(G).cells)).toBe(false);
});
it('힌트: 잘못 심은 칸 먼저, 없으면 후보가 가장 적은 빈칸', () => {
  const { cells, fixed } = parseGarden(G); const sol = gardenSolution(G);
  const wrong = plant(cells, fixed, 2, 0, sol[2][0] === '▲' ? '●' : '▲');
  expect(gardenHint(wrong, sol)).toEqual({ r: 2, c: 0, shape: sol[2][0] });
  const h = gardenHint(cells, sol)!; expect(h.shape).toBe(sol[h.r][h.c]); expect(cells[h.r][h.c]).toBe('.');
  expect(gardenHint(sol, sol)).toBeNull();
});
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/think-town/rules && npm run ws:test -- think-blocks` / Expected: FAIL (모듈·함수 없음)
- [ ] **Step 3: 구현** — `viewAnswers`는 칸 순서대로 1~min(front[c], side[R−1−r], maxH) 탐색 후 줄·칸 최댓값 비교. `blockHint`는 `blockAnswers` 중 (다른 칸 수, 블록 수)가 가장 작은 답의 첫 다른 칸(줄→칸 순). `gardenHint`의 후보 = 같은 줄·칸·네모에 아직 없는 SHAPES 수, 동점이면 줄→칸 순.
- [ ] **Step 4: 통과 확인** — 같은 명령 / Expected: PASS, `npx svelte-check` 오류 0
- [ ] **Step 5: 커밋** — `feat(think-town): 블록 공방·정원 규칙`

### Task 2: 퍼즐 풀 (블록·정원)

**Files:**
- Modify: `worksheets/tools/make-town-puzzles.js` (블록·정원 풀 추가, 주차장·줄 세우기 코드 그대로)
- Modify: `src/lib/think-town/data/puzzles.json` (도구로 다시 씀)
- Test: `src/lib/think-town/data/puzzles.test.ts`

**Interfaces:**
- Consumes: `$think/blocks.js` `generateBlocks`, `viewAnswers`, `parseHeights`, `topView`, `frontView`, `sideView`, `blockCount`, `BLOCK_RANGES`; `$think/logic.js` `generateSudoku`, `sudokuSolutions`, `SUDOKU_BLANKS`.
- Produces: `P.blocks: { heights: string[] }[][]`, `P.garden: { grid: string[] }[][]` (단계 5개, 12·12·12·12·40개).

- [ ] **Step 1: 실패하는 테스트**

```ts
it('블록·정원도 단계마다 개수', () => {
  expect(P.blocks.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
  expect(P.garden.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
});
it('블록: 라운드 블록 수 범위, 0~3층, 단계 3~5는 답이 둘 이상', () => {
  P.blocks.forEach((pool, s) => pool.forEach((p) => {
    const h = parseHeights(p.heights); const [lo, hi] = BLOCK_RANGES[s + 1];
    expect(blockCount(h)).toBeGreaterThanOrEqual(lo); expect(blockCount(h)).toBeLessThanOrEqual(hi);
    if (s >= 2) expect(viewAnswers(topView(h), frontView(h), sideView(h)).length).toBeGreaterThan(1);
  }));
});
it('정원: 답 하나, 빈칸 수는 라운드 범위', () => {
  P.garden.forEach((pool, s) => pool.forEach((p) => {
    expect(sudokuSolutions(p.grid)).toHaveLength(1);
    const blanks = p.grid.join('').split('').filter((ch) => ch === '.').length;
    const [lo, hi] = SUDOKU_BLANKS[s + 1]; expect(blanks).toBeGreaterThanOrEqual(lo); expect(blanks).toBeLessThanOrEqual(hi);
  }));
});
// '겹치는 퍼즐 없음' 테스트에 블록 높이 지도·정원 판 추가 (학습지 blocks heights, logic sudoku grid 와도)
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/lib/think-town/data` / Expected: FAIL (P.blocks undefined)
- [ ] **Step 3: 도구에 풀 추가** — seed 블록 `20262127 + stage`, 정원 `20263127 + stage`. 블록은 `generateBlocks(rng, stage, used)`에서 `ask`를 버리고, 단계 3~5는 답 2개 이상만. 정원은 `generateSudoku(rng, stage, used)`에서 `kind`를 버림. 학습지 판과 앞서 만든 판을 `used`에 넣음. `node worksheets/tools/make-town-puzzles.js` 실행.
- [ ] **Step 4: 기존 풀 그대로 확인 + 통과** — Run: `node -e` 로 `git show HEAD:src/lib/think-town/data/puzzles.json`의 parking·lineup과 새 파일 비교 / Expected: 같음. `npx vitest run src` PASS.
- [ ] **Step 5: 커밋** — `feat(think-town): 블록 공방·정원 퍼즐 미리 만들기`

### Task 3: 이야기·그림 인형·꽃 그림

**Files:**
- Modify: `src/lib/think-town/data/stories.ts` (blocks·garden 5단계 × 3컷)
- Modify: `src/lib/think-town/data/stories.test.ts` (첫 테스트 장소 목록에 blocks·garden)
- Modify: `src/lib/think-town/diorama/Doll.svelte` (`sticker` 대신 `children` snippet도 받음; 핸들러가 있으면 그림도 누를 수 있음)
- Modify: `src/lib/think-town/diorama/Board.svelte` (`cls` prop → `.board`에 붙음)
- Create: `src/lib/think-town/art/FlowerArt.svelte` (`shape: string; size: number`, SVG)
- Modify: `src/lib/think-town/StoryScene.svelte` (공방: 나무 바닥 + 블록 탑, 정원: 잔디 + 화단 + 꽃)

**Interfaces:**
- Produces: `Doll` props에 `children?: Snippet` (sticker는 선택), `Board` props에 `cls?: string`, `FlowerArt` (`shape` = '●'|'▲'|'■'|'★').

- [ ] **Step 1: 테스트 고침** — 첫 테스트를 `['parking', 'ticket', 'blocks', 'garden']`로. Run `npx vitest run src/lib/think-town/data/stories.test.ts` / Expected: FAIL (blocks 없음)
- [ ] **Step 2: 이야기 쓰기** — 공방(아빠·지호·감돌이): 1·2 숫자 설계도, 3 세 모양 등장, 4 블록 아끼기, 5 축제 탑. 정원(사랑이·지호·아빠·감돌이): 1 줄마다 하나씩, 2 네모 칸도, 3 빈칸 늘어남, 4 비 온 뒤 다시 심기, 5 정원 잔치. 말풍선 40자 안, 3컷째 질문.
- [ ] **Step 3: Doll·Board·FlowerArt·StoryScene** — 위 Interfaces대로.
- [ ] **Step 4: 통과 + 눈 확인** — `npx vitest run src` PASS, `npx svelte-check` 0, 브라우저에서 두 장소 이야기 3컷(장소를 아직 지도에 열지 않았으므로 콘솔에서 `view` 대신 PlaceRun을 거치지 않고, Task 4·5 끝난 뒤 함께 확인해도 됨).
- [ ] **Step 5: 커밋** — `feat(think-town): 블록 공방·정원 이야기와 꽃 그림`

### Task 4: 🧱 블록 공방 화면

**Files:**
- Create: `src/lib/think-town/places/BlocksPlace.svelte`, `src/lib/think-town/places/BlockView.svelte`
- Modify: `src/lib/think-town/PlaceRun.svelte` (blocks 풀·분기, `stage` 전달)
- Modify: `src/lib/think-town/data/places.ts` (blocks `built: true`)

**Interfaces:**
- Consumes: Task 1 `blocks-play.ts` 전부, Task 3 `Doll` children·`Board` cls, `sound.play('drop'|'bump'|'error')`.
- Produces: `BlocksPlace` props `{ puzzle: { heights: string[] }; stage: number; onSolved: (r: { bonus: boolean }) => void }`, `export function hint()`. `BlockView` props `{ kind: 'numbers'|'top'|'front'|'side'; bp: Blueprint; state: boolean | null; wrong?: [number, number][] }`.

- [ ] **Step 1: 화면** — 판 왼쪽 가운데(칸 84, 블록 한 칸 = 84 정육면체 Box3D, z = 층 × 84), 판 둘레 "앞"(앞 가장자리)·"옆"(오른쪽 가장자리) 세운 글자. 오른쪽 설계도 칸: 단계 1·2 = 층수 칸 하나, 3~5 = 위 + 앞·옆 나란히. 그 아래 "블록 n개"(3~5는 "가장 적게 m개" 금색), 확인 버튼. 아래 가운데 도구: 쌓기·빼기(고른 것 파랑), ⟲·⟳ 돌리기(turn ±90, 0.5초 전환, 글자 인형도 같이), 처음부터.
- [ ] **Step 2: 동작** — 칸/탑 누르면 모드대로 add/remove, 바뀌면 'drop' + 결과 지움, 안 바뀌면 'bump'. 확인: checkBuild → 카드 ✓/✕, 실패면 'error' + ✕ 카드 흔들림, 성공이면 블록이 물결처럼 통통 + `onSolved({ bonus: stage >= 3 && count === minBlocks })`, 이후 조작 막음. hint(): blockHint → 칸 반짝 + "n층" 1.6초, null이면 확인 버튼 반짝.
- [ ] **Step 3: 연결** — PlaceRun에 `P.blocks` 꺼내기·분기, places.ts built.
- [ ] **Step 4: 브라우저 확인 (1280×800, 1280×752)** — 이야기 3컷 → 판마다: 쌓기/빼기, 3층 한계, 4방향 돌린 뒤 서로 다른 칸 두 곳 누르기(Review Focus 1), 틀린 확인(✕ 카드만 흔들림, 1·2단계 빨간 칸), 바꾸면 결과 지워짐, 힌트, 정답 → 별 팝, 3~5단계 가장 적게 = 별 2. 끝까지 → 대화 카드 → 도장. 콘솔 오류 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 블록 공방 쌓기나무`

### Task 5: 🌼 사랑이 정원 화면

**Files:**
- Create: `src/lib/think-town/places/GardenPlace.svelte`
- Modify: `src/lib/think-town/PlaceRun.svelte` (garden 풀·분기)
- Modify: `src/lib/think-town/data/places.ts` (garden `built: true`)

**Interfaces:**
- Consumes: Task 1 `garden-play.ts`, Task 3 `Doll` children·`FlowerArt`.
- Produces: `GardenPlace` props `{ puzzle: { grid: string[] }; onSolved: (r: { bonus: boolean }) => void }`, `export function hint()`.

- [ ] **Step 1: 화면** — 판 왼쪽 가운데 4×4 흙 칸(네모 2×2 사이는 넓은 돌길), 꽃은 세운 그림 인형(FlowerArt), 처음 꽃은 칸에 작은 말뚝. 오른쪽 꽃씨 칸 4개(큰 버튼, 고른 것 파랑 테두리 + 들림), 처음엔 첫 꽃 선택.
- [ ] **Step 2: 동작** — 칸 또는 꽃 누름 → plant. 처음 꽃이면 'bump' + 살짝 흔들. 심어서 겹침이 새로 생기면 'error' + 그 꽃들 흔들, 아니면 'drop'. 겹친 꽃은 빨간 테두리·빨간 빛 유지. isGardenSolved → solved(한 번만), 꽃이 물결처럼 피어남 → `onSolved({ bonus: false })`. hint(): gardenHint → 그 칸 심고 1.6초 반짝, 그것으로 풀리면 같은 성공 처리.
- [ ] **Step 3: 연결** — PlaceRun에 `P.garden`, places.ts built.
- [ ] **Step 4: 브라우저 확인** — 이야기 → 판마다 심기·뽑기·바꾸기, 처음 꽃 안 바뀜, 겹침 빨강·흔들·풀림(Review Focus 4), 힌트로 마지막 칸 채워 성공이 한 번(Review Focus 5), 끝까지 → 도장. 지도에서 공사 중 울타리가 두 곳만 남음. 콘솔 오류 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 사랑이 정원 모양 스도쿠`

### Task 6: 마무리

- [ ] `npx vitest run src`, `npm run ws:test`, `npx svelte-check`, `npm run build`, `git diff --check` 모두 통과.
- [ ] 최종 검토(가장 좋은 모델 새 눈) → 중요 지적은 재현 테스트 RED→GREEN으로 한 번에 고침.
- [ ] 브라우저 확인을 마쳤으면 푸시, 한 줄 보고.
