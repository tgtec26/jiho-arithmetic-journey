# 생각 퍼즐 학습지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 곱셈·나눗셈과 같은 틀·등장인물로 사고력 퍼즐 학습지 24회(주차장 탈출·쌓기나무·경우의 수·논리 퍼즐을 돌아가며) + 정답지 + 차 조각 장을 만들고, 빌드·어드민에 세 번째 세트로 넣는다.

**Architecture:** 활동마다 규칙·검사·생성 모듈과 그리는 모듈을 `worksheets/lib/think/`에 새로 둔다. 회차 검사·문제 칸 묶기는 `lib/think/episode.js`, 페이지 틀·만화·정답지 페이지 나누기는 기존 코드를 그대로 쓰고, `lib/sets.js`에 `think` 세트를 더한다. 퍼즐 데이터는 생성 도구가 회차 JSON에 적고, 빌드는 적힌 퍼즐을 다시 풀어 검사한다.

**Tech Stack:** Node 25 ESM, vitest 4 (`npm run ws:test`), HTML/CSS/SVG mm 단위, 크롬 헤드리스 PDF, Codex CLI 그림. 새 npm 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-11-27-thinking-worksheet-design.md`

## Global Constraints

- 문제 칸 94 × 86mm, A4 양면 1장 = 1회(2쪽), 앞면 만화 + ①②, 뒷면 ③~⑧. ①은 이야기 퍼즐(⭐ 주황 테두리).
- 활동 = 회차 번호: (id−1) % 4 → 0 주차장, 1 쌓기나무, 2 경우의 수, 3 논리. 라운드 = ceil(id / 4) (1~6).
- 한 장 안에서 쉬운 것부터(②~⑧ 오름차순), ①은 ②보다 쉽거나 같음(논리는 종류별로).
- 모든 퍼즐은 코드가 그리고 빌드가 다시 풀어 검사(`--strict`에서 실패하면 빌드 중단).
- 상품명 "러시아워"를 어디에도 쓰지 않는다. 퍼즐은 우리 생성기 결과만.
- 말풍선: 화자 필수, 40자 이하, 4번 컷 마지막은 `?`. 흰 배경, 배경 색 적게.
- 곱셈·나눗셈 세트의 출력 HTML은 한 글자도 바뀌지 않는다.
- 실제 아이 사진은 외부 서비스에 보내지 않는다. 인형 참고 사진은 로컬에만.
- 커밋 계정 `tgtec26` / `tgtec26@snu-g.ms.kr`, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **판 칸 ≠ 차 조각 크기**: 인쇄된 판 칸과 오린 조각이 1mm라도 다르면 조각이 판에 안 맞는다 → 둘 다 `CELL_MM` 하나에서 mm 크기를 낸다(Task 2 테스트).
2. **쌓기나무 방향 뒤집힘**: 높이 지도의 줄 순서(뒤→앞)나 옆(오른쪽) 방향이 그림과 정답에서 어긋나면 정답이 틀린다 → 비대칭 예로 앞·옆 모양을 손으로 계산해 고정(Task 3).
3. **줄 세우기 단서의 조사·방향**: "트럭은/지호는", "앞 = 매표소 쪽"이 틀리면 아이가 다르게 읽는다 → 조사 테스트, 그림에 방향 표시(Task 1, 5).
4. **빈칸 수로 답이 새어 나감**: 라운드 3 이후에 빈칸 수 = 답이면 답을 알려 주는 셈 → `slotsFor` 테스트(Task 4).
5. **정답지 넘침**: 작은 그림이 많은 정답 블록이 한 쪽을 넘으면 쪽수가 어긋난다 → 빌드 쪽수 검사 + Task 10 눈 확인.

---

### Task 1: 생각 세트 공통 도구

**Files:**
- Create: `worksheets/lib/think/common.js`
- Test: `worksheets/tests/think-common.test.js`

**Interfaces:**
- Produces: `ACTIVITIES` (`['parking','blocks','counting','logic']`), `ACTIVITY_NAMES` (`{ parking: '주차장 탈출', blocks: '쌓기나무', counting: '경우의 수', logic: '논리 퍼즐' }`), `activityOf(id: number): string`, `roundOf(id: number): number`, `makeRng(seed: number): () => number` (0 이상 1 미만, 같은 seed → 같은 수열), `josa(word: string, pair: '은/는'|'이/가'|'와/과'|'을/를'): string` (낱말 + 조사), `circled(n: number): string`.

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
expect([1, 2, 3, 4, 24].map(activityOf)).toEqual(['parking', 'blocks', 'counting', 'logic', 'logic']);
expect([1, 4, 5, 24].map(roundOf)).toEqual([1, 1, 2, 6]);
const a = makeRng(7), b = makeRng(7);
const xs = Array.from({ length: 5 }, a);
expect(xs).toEqual(Array.from({ length: 5 }, b));
expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
expect(josa('트럭', '은/는')).toBe('트럭은');
expect(josa('지호', '은/는')).toBe('지호는');
expect(josa('감돌이', '이/가')).toBe('감돌이가');
expect(josa('곰', '와/과')).toBe('곰과');
expect(josa('빨간 차', '이/가')).toBe('빨간 차가');
expect(circled(8)).toBe('⑧');
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-common` / Expected: FAIL (모듈 없음)
- [ ] **Step 3: 구현** — `makeRng`는 mulberry32. `josa`는 마지막 글자가 한글이면 (code − 0xAC00) % 28 ≠ 0 을 받침으로 본다.
- [ ] **Step 4: 통과 확인** — 같은 명령 / Expected: PASS
- [ ] **Step 5: 커밋** — `git add worksheets/lib/think/common.js worksheets/tests/think-common.test.js && git commit -m "feat(worksheets): 생각 퍼즐 공통 도구 (활동·라운드·난수·조사)"`

---

### Task 2: 주차장 탈출 (규칙·풀이·생성·그림·차 조각)

**Files:**
- Create: `worksheets/lib/think/parking.js`, `worksheets/lib/think/render-parking.js`
- Test: `worksheets/tests/think-parking.test.js`

**Interfaces:**
- Consumes: Task 1 `makeRng`, `circled`.
- Produces (`parking.js`):
  - `SIZE = 6`, `EXIT_ROW = 2`, `PARKING_RANGES = {1:[1,3],2:[2,4],3:[3,6],4:[4,7],5:[5,9],6:[6,11]}`
  - 퍼즐 = `{ board: string[6], minMoves: number }`, 판 문자열은 `.` 빈칸, `R` 빨간 차, 다른 대문자 = 차 하나(한 줄로 이어진 2칸 또는 3칸, 가로/세로는 모양으로 정해짐).
  - `parseBoard(rows): { id, row, col, len, horizontal }[]`
  - `boardErrors(rows): string[]` — 6×6, 글자마다 곧은 2~3칸, R은 가로 2칸이고 `EXIT_ROW`에 있고 이미 출구(col 4)에 있지 않음.
  - `solveParking(rows): { minMoves, moves: { id, dir: 'up'|'down'|'left'|'right', dist }[] } | null` — 너비 우선 탐색. 한 번 = 차 하나를 한 방향으로 몇 칸이든. 목표 = R의 col이 4.
  - `checkParkingPuzzle(p, round): string[]` — 판 오류 + 풀림 + `minMoves`가 풀이와 같음(아니면 "가장 적게" 포함 오류) + 라운드 범위.
  - `formatMoves(moves): string` — `'B↑1, C←2, R→4'`
  - `generateParking(rng, [lo, hi], avoid = new Set()): { board, minMoves }` — 무작위 배치 + 풀이로 범위 확인, 범위에 못 미치면 차를 옮기거나 더해 `minMoves`를 키우는 언덕 오르기. 글자는 읽는 순서로 A, B, C…(R 건너뜀). `avoid`에 있는 판(`board.join('/')`)은 버린다.
- Produces (`render-parking.js`):
  - `CELL_MM = 10`
  - `renderParkingBoard(rows, { hint } = {}): string` — `<svg width="60mm" height="60mm" viewBox="0 0 60 60">`(1단위 = 1mm, 벽은 바깥에 더함), 칸 격자, 차마다 테두리 + 작은 글자, R은 `class="car red"`, 출구 틈, `hint`(첫 움직임)가 있으면 회색 화살표 `class="hint-arrow"`.
  - `renderParkingProblem({ puzzle, position, round }): string` — `<section class="problem think-problem parking[ story]" data-pos>`, 제목 `① 빨간 차를 꺼내요`(① 은 `⭐ 이야기 문제` 붙임), 판, `몇 번 움직였니? <span class="blank"></span>번 <span class="min">(가장 적게: N번)</span>`. 라운드 ≤ 2이고 position 1이면 풀이 첫 움직임을 hint로.
  - `renderPiecesSheet(episodes): string` — `<div class="page pieces think-set">` 한 쪽: 빨간 차 2개, 2칸 차·3칸 트럭은 각각 (모든 주차장 퍼즐 중 가장 많이 쓴 수 + 2)개. 조각 `<svg width="${len*CELL_MM}mm" height="${CELL_MM}mm">` + 자르는 점선, 안내 "두꺼운 종이에 인쇄해서 오려 쓰세요. 한 번 오리면 모든 회차에 써요."
  - `parkingAnswer(puzzle): string` — `'2번: A↑2, R→4'`

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
const open = ['......', '......', 'RR....', '......', '......', '......'];
expect(solveParking(open)).toEqual({ minMoves: 1, moves: [{ id: 'R', dir: 'right', dist: 4 }] });
const one = ['......', '......', 'RR.A..', '...A..', '......', '......'];
expect(solveParking(one).minMoves).toBe(2);
expect(solveParking(['......', '......', 'RR.BBB', '......', '......', '......'])).toBeNull();
expect(boardErrors(['R.....', 'R.....', '......', '......', '......', '......']).length).toBeGreaterThan(0);
expect(boardErrors(['......', '..AA..', '..A...', 'RR....', '......', '......']).length).toBeGreaterThan(0); // ㄱ자 차, R 줄 틀림
expect(boardErrors(open.slice(0, 5)).length).toBeGreaterThan(0);
expect(checkParkingPuzzle({ board: one, minMoves: 3 }, 1).join(' ')).toContain('가장 적게');
expect(checkParkingPuzzle({ board: open, minMoves: 1 }, 3).length).toBeGreaterThan(0); // 라운드 3은 3~6
expect(formatMoves([{ id: 'B', dir: 'up', dist: 1 }, { id: 'R', dir: 'right', dist: 4 }])).toBe('B↑1, R→4');
const g = generateParking(makeRng(1), [3, 6]);
expect(boardErrors(g.board)).toEqual([]);
expect(solveParking(g.board).minMoves).toBe(g.minMoves);
expect(g.minMoves).toBeGreaterThanOrEqual(3); expect(g.minMoves).toBeLessThanOrEqual(6);
expect(generateParking(makeRng(1), [3, 6])).toEqual(g);
const hard = generateParking(makeRng(2), [6, 11]); // 라운드 6도 만들 수 있어야 함
expect(hard.minMoves).toBeGreaterThanOrEqual(6);

// 그림: 판 칸과 조각이 같은 CELL_MM
expect(renderParkingBoard(one)).toContain(`width="${6 * CELL_MM}mm"`);
expect(renderParkingBoard(one)).toContain('car red');
const box1 = renderParkingProblem({ puzzle: { board: one, minMoves: 2 }, position: 1, round: 1 });
expect(box1).toContain('가장 적게: 2번'); expect(box1).toContain('hint-arrow'); expect(box1).toContain('⭐');
expect(renderParkingProblem({ puzzle: { board: one, minMoves: 2 }, position: 1, round: 3 })).not.toContain('hint-arrow');
const eps = [{ activity: 'parking', puzzles: [{ board: one, minMoves: 2 }, { board: ['......', '......', 'RR.B..', 'CCCB..', '......', '......'], minMoves: 2 }] }];
const sheet = renderPiecesSheet(eps);
expect(sheet.split(`width="${2 * CELL_MM}mm"`).length - 1).toBe(2 /* 빨간 차 */ + 1 + 2);
expect(sheet.split(`width="${3 * CELL_MM}mm"`).length - 1).toBe(1 + 2);
expect(parkingAnswer({ board: one, minMoves: 2 })).toMatch(/^2번: /);
```

(테스트의 `C…` 판처럼 예시 판은 실제로 풀리는지 작성 때 `solveParking`으로 확인해 숫자를 고친다.)

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-parking` / Expected: FAIL
- [ ] **Step 3: `parking.js` 구현** — 상태 = 차마다 축 위치 배열, 키 = 문자열. 언덕 오르기 한 번에 시도 수 제한(라운드 6 범위를 10초 안에).
- [ ] **Step 4: `render-parking.js` 구현**
- [ ] **Step 5: 통과 확인** — 같은 명령 / Expected: PASS
- [ ] **Step 6: 커밋** — `feat(worksheets): 주차장 탈출 퍼즐 (풀이·생성·판·차 조각)`

---

### Task 3: 쌓기나무 (높이 지도·보이는 모양·숨은 탑 검사·등각 그림)

**Files:**
- Create: `worksheets/lib/think/blocks.js`, `worksheets/lib/think/render-blocks.js`
- Test: `worksheets/tests/think-blocks.test.js`

**Interfaces:**
- Consumes: Task 1 `makeRng`, `circled`.
- Produces (`blocks.js`):
  - 퍼즐 = `{ heights: string[], ask: string[] }`. `heights[0]`이 맨 뒤 줄, 마지막이 맨 앞 줄, 글자 = 왼쪽→오른쪽 칸의 높이(0~3).
  - `BLOCK_RANGES = {1:[3,5],2:[4,6],3:[5,8],4:[6,9],5:[7,10],6:[8,12]}`
  - `ASKS_BY_ROUND = {1:['count','top'],2:['count','top','front'],3:[…,'side'],4:[…,'side'],5:[…,'side','topNumbers'],6:[…]}`
  - `parseHeights(rows): number[][]`, `blockCount(h): number`
  - `topView(h): boolean[][]` (데이터 줄 순서 그대로), `frontView(h): number[]` (왼→오른 칸마다 가장 높은 탑), `sideView(h): number[]` (오른쪽에서 볼 때 왼→오른 = 앞 줄→뒤 줄, 줄마다 가장 높은 탑)
  - `hiddenTops(h): [number, number][]` — 보는 방향 (1, −1, 1)(오른쪽·앞·위)으로, 탑 윗면에서 5×5 점을 쏘아 다른 블록에 막히는 점이 절반 넘으면 숨은 탑.
  - `checkBlocksPuzzle(p, round): string[]` — 줄·칸 2~3, 숫자 0~3, 빈 줄·빈 칸 없음, 라운드 1·2는 바닥 칸 6개 이하, 개수 범위, ask 1~2개이고 라운드에 허용된 것, 숨은 탑 없음.
  - `generateBlocks(rng, round, avoid = new Set()): { heights, ask }`
- Produces (`render-blocks.js`):
  - `renderIsoBlocks(h): string` — SVG 등각 그림. 화면 x = (x + y)/√2, 화면 위 = (−x + y + 2z)/√6 (x = 칸, y = 뒤쪽 깊이, z = 층). 블록마다 `<g class="cube">` 안에 윗면·앞면·오른쪽 면 다각형(한 색 세 밝기), 그리는 순서 = (x − y + z) 오름차순. 바닥 칸 옅은 선, `앞`·`옆` 화살표 글자.
  - `renderBlocksProblem({ puzzle, position, round }): string` — `<section class="problem think-problem blocks[ story]">`, 왼쪽 그림, 오른쪽 묻는 것: `count` → `블록은 모두 <blank>개` (+ 라운드 ≤ 2면 `1층 <blank>개 2층 <blank>개 3층 <blank>개`), `top`/`front`/`side` → `위에서/앞에서/옆에서 본 모양을 색칠해요` + 빈 모눈 `table.vgrid` 항상 3×3(데이터 크기로 답이 새지 않게), `topNumbers` → 3×3 모눈 + `위에서 본 모양에 층수를 써요`.
  - `blocksAnswer(puzzle): string` — 개수 + 묻는 모양의 작은 채운 모눈.

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
const h = parseHeights(['21', '10']); // 뒤 줄 [2,1], 앞 줄 [1,0]
expect(blockCount(h)).toBe(4);
expect(frontView(h)).toEqual([2, 1]);
expect(sideView(h)).toEqual([1, 2]); // 앞 줄 → 뒤 줄
expect(topView(h)).toEqual([[true, true], [true, false]]);
expect(hiddenTops(h)).toEqual([]);
expect(hiddenTops(parseHeights(['10', '03']))).toEqual([[0, 0]]); // 앞 오른쪽 3층 탑이 뒤 왼쪽 탑을 가림
expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['count'] }, 1)).toEqual([]);
expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['side'] }, 1).length).toBeGreaterThan(0);
expect(checkBlocksPuzzle({ heights: ['21', '10'], ask: ['count', 'top', 'front'] }, 2).length).toBeGreaterThan(0);
expect(checkBlocksPuzzle({ heights: ['33', '33'], ask: ['count'] }, 1).length).toBeGreaterThan(0); // 12개 > 5
const g = generateBlocks(makeRng(3), 4);
expect(checkBlocksPuzzle(g, 4)).toEqual([]);
expect(generateBlocks(makeRng(3), 4)).toEqual(g);

expect(renderIsoBlocks(h).split('class="cube"').length - 1).toBe(4);
const r1 = renderBlocksProblem({ puzzle: { heights: ['21', '10'], ask: ['count', 'top'] }, position: 2, round: 1 });
expect(r1).toContain('1층'); expect(r1).toContain('앞'); expect(r1).toContain('옆');
expect(r1.split('<td').length - 1).toBe(9); // 2×2 바닥이어도 3×3 모눈
expect(renderBlocksProblem({ puzzle: { heights: ['21', '10'], ask: ['count'] }, position: 2, round: 3 })).not.toContain('1층');
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-blocks` / Expected: FAIL
- [ ] **Step 3: `blocks.js` 구현** — 숨은 탑: 점 p에서 p + t(1,−1,1), t > 0 이 다른 블록 상자와 만나는지 판 검사(slab test).
- [ ] **Step 4: `render-blocks.js` 구현**
- [ ] **Step 5: 통과 확인** / Expected: PASS
- [ ] **Step 6: 커밋** — `feat(worksheets): 쌓기나무 퍼즐 (보이는 모양·숨은 탑 검사·등각 그림)`

---

### Task 4: 경우의 수 (늘어놓기·빈칸 힌트·그림)

**Files:**
- Create: `worksheets/lib/think/counting.js`, `worksheets/lib/think/render-counting.js`
- Test: `worksheets/tests/think-counting.test.js`

**Interfaces:**
- Consumes: Task 1 `circled`.
- Produces (`counting.js`):
  - 항목 `Item = { name: string, color?: string, sticker?: string }`. 퍼즐(모두 `text` 문장 포함):
    - `{ kind: 'pairs', text, left: Item[], right: Item[] }` (윗옷 × 아랫도리)
    - `{ kind: 'order', text, items: Item[], pick: number }` (순서 있게 pick개 늘어놓기)
    - `{ kind: 'choose', text, items: Item[], pick: 2 }` (순서 없이 2개 — 리그 경기·악수·맛 고르기)
    - `{ kind: 'paths', text, w: number, h: number }` (격자 가장 짧은 길)
  - `listCases(p): string[][]` (직접 늘어놓음), `countingAnswer(p): number` (= `listCases(p).length`)
  - `COUNT_LIMITS = {1:6,2:6,3:10,4:10,5:12,6:12}`, `KINDS_BY_ROUND`: 라운드 1·2 `['pairs','order']`, 3~6 네 가지 모두.
  - `slotsFor(p, round): number` — `pairs`는 0(선 긋기). 나머지: 라운드 ≤ 2 → 답, ≤ 4 → 답 + 2 + (답 % 3), ≥ 5 → 0. 단 `paths`는 라운드 ≥ 5에서도 답 + 2(격자 없이는 길을 그릴 수 없음).
  - `checkCountingPuzzle(p, round): string[]` — 라운드에 허용된 kind, 2 ≤ 답 ≤ 한도, `text` 있음, 항목 이름 겹침 없음.
- Produces (`render-counting.js`):
  - `renderCountingProblem({ puzzle, position, round, stickerSrc }): string` — `<section class="problem think-problem counting[ story]">`, 제목 + `text`, 항목 칩(색 점 또는 작은 스티커 + 이름). `pairs`: 왼쪽·오른쪽 칩 줄 + 잇기 점. `order`/`choose`: `slotsFor`개의 줄 `class="slot-row"`, 줄마다 `pick`칸 `class="slot"`(라운드 3·4는 "남는 칸이 있어도 돼요"). `paths`: 큰 격자(집·학원 표시) + 작은 격자 `class="mini-grid"` `slotsFor`개. 끝에 `모두 <blank>가지`.
  - `countingAnswerText(p): string` — `'6가지'`, 답 ≤ 6이면 `(빨-검, 빨-흰, …)` 목록 붙임.

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
const c = (n) => ({ name: n });
const shirts = { kind: 'pairs', text: '셔츠와 바지', left: [c('빨'), c('파'), c('노')], right: [c('검'), c('흰')] };
expect(countingAnswer(shirts)).toBe(6);
expect(countingAnswer({ kind: 'order', text: 't', items: [c('a'), c('b'), c('c')], pick: 3 })).toBe(6);
expect(countingAnswer({ kind: 'order', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 2 })).toBe(12);
expect(countingAnswer({ kind: 'choose', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 2 })).toBe(6);
expect(countingAnswer({ kind: 'paths', text: 't', w: 2, h: 2 })).toBe(6);
expect(countingAnswer({ kind: 'paths', text: 't', w: 3, h: 2 })).toBe(10);
const ord = { kind: 'order', text: 't', items: [c('a'), c('b'), c('c')], pick: 3 };
expect(slotsFor(ord, 1)).toBe(6);
expect(slotsFor(ord, 3)).toBe(8); // 6 + 2 + 0
expect(slotsFor(ord, 5)).toBe(0);
expect(slotsFor({ kind: 'paths', text: 't', w: 2, h: 2 }, 6)).toBe(8);
expect(slotsFor(shirts, 1)).toBe(0);
expect(checkCountingPuzzle({ kind: 'choose', text: 't', items: [c('a'), c('b'), c('c')], pick: 2 }, 1).length).toBeGreaterThan(0);
expect(checkCountingPuzzle({ kind: 'order', text: 't', items: [c('a'), c('b'), c('c'), c('d')], pick: 4 }, 6).length).toBeGreaterThan(0); // 24 > 12

const html = renderCountingProblem({ puzzle: ord, position: 3, round: 3, stickerSrc: () => null });
expect(html.split('class="slot-row"').length - 1).toBe(8);
expect(html).toContain('모두');
const paths = renderCountingProblem({ puzzle: { kind: 'paths', text: 't', w: 2, h: 2 }, position: 4, round: 5, stickerSrc: () => null });
expect(paths.split('class="mini-grid"').length - 1).toBe(8);
expect(countingAnswerText(shirts)).toMatch(/^6가지/);
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-counting` / Expected: FAIL
- [ ] **Step 3: 구현 (두 파일)**
- [ ] **Step 4: 통과 확인** / Expected: PASS
- [ ] **Step 5: 커밋** — `feat(worksheets): 경우의 수 퍼즐 (늘어놓기·빈칸 힌트)`

---

### Task 5: 논리 퍼즐 (줄 세우기·4×4 스도쿠)

**Files:**
- Create: `worksheets/lib/think/logic.js`, `worksheets/lib/think/render-logic.js`
- Test: `worksheets/tests/think-logic.test.js`

**Interfaces:**
- Consumes: Task 1 `makeRng`, `josa`, `circled`.
- Produces (`logic.js`):
  - 줄 세우기 `{ kind: 'lineup', items: string[], clues: Clue[] }`, Clue: `{ type: 'first', a }`, `{ type: 'last', a }`, `{ type: 'behind', a, b }`(b가 a 바로 뒤), `{ type: 'before', a, b }`(a가 b보다 앞), `{ type: 'middle', a }`(홀수 명일 때만), `{ type: 'apart', a, b }`(붙어 있지 않음, 라운드 4부터).
  - `clueText(clue): string` — `아빠는 맨 앞이에요.` / `감돌이는 맨 뒤예요.` / `아빠 바로 뒤에 감돌이가 있어요.` / `지호는 사랑이보다 앞에 있어요.` / `트럭은 한가운데예요.` / `지호와 곰은 붙어 있지 않아요.` (조사는 `josa`)
  - `lineupSolutions(p): string[][]`
  - `LINEUP_RANGES = {1:{items:[3,3],clues:[2,2]},2:{items:[3,3],clues:[2,3]},3:{items:[4,4],clues:[3,3]},4:{items:[4,4],clues:[3,4]},5:{items:[4,5],clues:[4,4]},6:{items:[5,5],clues:[4,5]}}`
  - 스도쿠 `{ kind: 'sudoku', grid: string[4] }`, 글자 `●▲■★`와 빈칸 `.`. `SHAPES = ['●','▲','■','★']`, `SUDOKU_BLANKS = {1:[4,5],2:[5,6],3:[6,7],4:[7,8],5:[8,9],6:[9,10]}`.
  - `sudokuSolutions(grid, limit = 2): string[][]`
  - `LOGIC_KIND_AT = { 1: 'lineup', 2: 'sudoku', 3: 'lineup', 4: 'lineup', 5: 'lineup', 6: 'sudoku', 7: 'sudoku', 8: 'sudoku' }`
  - `checkLogicPuzzle(p, round, position): string[]` — 자리에 맞는 종류, 범위, 단서 속 이름이 items에 있음, 허용 단서, 답 정확히 하나(아니면 "답이 하나" 포함 오류).
  - `generateLineup(rng, round, items: string[]): lineup 퍼즐`, `generateSudoku(rng, round): sudoku 퍼즐`
- Produces (`render-logic.js`):
  - `renderLineupProblem({ puzzle, position, round }): string` — `<section class="problem think-problem lineup[ story]">`, 줄 방향 그림(`매표소 ◀ 앞 … 뒤`), 단서 목록(`clueText`), 빈칸 `class="slot"` items 수만큼, 라운드 ≤ 2면 가운데 칸(index ⌊(n−1)/2⌋)에 정답 이름 회색 `class="hint"`, 아래 쓸 이름 목록.
  - `renderSudokuProblem({ puzzle, position }): string` — 4×4 `table.sudoku`(2×2 굵은 선), 주어진 모양, 규칙 한 줄 `가로줄·세로줄·굵은 네모 안에 ●▲■★가 하나씩`.
  - `logicAnswer(puzzle): string` — `'아빠 → 감돌이 → 지호'` / 채운 작은 스도쿠.

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
expect(clueText({ type: 'behind', a: '아빠', b: '감돌이' })).toBe('아빠 바로 뒤에 감돌이가 있어요.');
expect(clueText({ type: 'first', a: '트럭' })).toBe('트럭은 맨 앞이에요.');
expect(clueText({ type: 'apart', a: '지호', b: '곰' })).toBe('지호와 곰은 붙어 있지 않아요.');
const ok = { kind: 'lineup', items: ['지호', '아빠', '감돌이'], clues: [{ type: 'first', a: '아빠' }, { type: 'behind', a: '아빠', b: '감돌이' }] };
expect(lineupSolutions(ok)).toEqual([['아빠', '감돌이', '지호']]);
expect(checkLogicPuzzle(ok, 1, 1)).toEqual([]);
const two = { ...ok, clues: [{ type: 'first', a: '아빠' }, { type: 'before', a: '아빠', b: '감돌이' }] };
expect(checkLogicPuzzle(two, 1, 1).join(' ')).toContain('답이 하나');
expect(checkLogicPuzzle(ok, 1, 2).length).toBeGreaterThan(0); // ②는 스도쿠 자리
const sud = { kind: 'sudoku', grid: ['.▲■★', '■.●▲', '▲●.■', '★■▲.'] }; // 답 ●▲■★ / ■★●▲ / ▲●★■ / ★■▲●
expect(sudokuSolutions(sud.grid)).toHaveLength(1);
expect(checkLogicPuzzle(sud, 1, 2)).toEqual([]); // 빈칸 4
expect(checkLogicPuzzle(sud, 3, 6).length).toBeGreaterThan(0); // 라운드 3은 6~7
const gs = generateSudoku(makeRng(5), 6);
expect(checkLogicPuzzle(gs, 6, 8)).toEqual([]);
const gl = generateLineup(makeRng(5), 6, ['지호', '아빠', '감돌이', '사랑이', '손님']);
expect(checkLogicPuzzle(gl, 6, 5)).toEqual([]);

const lu = renderLineupProblem({ puzzle: ok, position: 1, round: 1 });
expect(lu).toContain('아빠 바로 뒤에 감돌이가 있어요.');
expect(lu.split('class="slot').length - 1).toBe(3);
expect(lu).toContain('<span class="hint">감돌이</span>');
expect(renderLineupProblem({ puzzle: ok, position: 1, round: 3 })).not.toContain('class="hint"');
const sd = renderSudokuProblem({ puzzle: sud, position: 2 });
expect(sd.split('<td').length - 1).toBe(16);
expect(logicAnswer(ok)).toBe('아빠 → 감돌이 → 지호');
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-logic` / Expected: FAIL
- [ ] **Step 3: 구현** — 줄 세우기 생성: 무작위 정답 순서 → 정답에 맞는 단서 후보에서 하나씩 골라 답이 하나가 될 때까지, 단서 수가 범위에 들면 채택. 스도쿠 생성: 무작위 완성판 → 답 하나를 지키며 칸 지우기.
- [ ] **Step 4: 통과 확인** / Expected: PASS
- [ ] **Step 5: 커밋** — `feat(worksheets): 논리 퍼즐 (줄 세우기·모양 스도쿠)`

---

### Task 6: 생각 세트 묶기 (회차 검사·페이지·정답지·빌드)

**Files:**
- Create: `worksheets/lib/think/episode.js`, `worksheets/tests/think-episodes.test.js`, `worksheets/tests/fixtures/think-episodes.js`
- Modify: `worksheets/lib/render-page.js` (renderThinkEpisode 더함), `worksheets/lib/render-answers.js` (paginate에 perPage·note 인자, renderThinkAnswerKey), `worksheets/lib/sets.js` (think), `worksheets/build.js` (answersPerPage, extraDocs, 사용법 주석), `worksheets/styles/worksheet.css`, `worksheets/tests/sets.test.js`

**Interfaces:**
- Consumes: Task 1~5 전부. `validatePanels(ep, stickerIds, tag)` (`lib/episodes.js`, export 됨).
- Produces:
  - 회차 JSON: `{ id, topic, icon, title, activity, puzzles: Puzzle[8], panels }` (`worksheets/data/think/epNN.json`).
  - `episode.js`: `THINK_DIR` (= `ROOT/data/think`), `validateThinkEpisode(ep, stickerIds): string[]`, `renderThinkProblems(ep, stickerSrc): string[8]`, `thinkAnswerBlock(ep): string`, `difficultyOf(activity, puzzle): number[]` (주차장 [minMoves], 쌓기나무 [개수], 경우의 수 [답], 줄 세우기 [items, clues], 스도쿠 [빈칸]).
  - 검사 내용: id 1~24, 제목, `activity === activityOf(id)`, 퍼즐 8개, 퍼즐마다 활동 검사(라운드·자리), 같은 퍼즐 두 번 없음, 쉬운 것부터(②~⑧ `difficultyOf` 오름차순 — 논리는 종류별 자리 묶음 안에서, 그 밖은 ① ≤ ②; 오류에 "쉬운 것부터"), `validatePanels`.
  - `render-page.js`: `renderThinkEpisode(ep, stickerSrc, stickerAspect)` → 기존 `renderPages({ ep, problems: renderThinkProblems(ep, stickerSrc), backTitle: ACTIVITY_NAMES[ep.activity], setClass: ' think-set' })`.
  - `render-answers.js`: `paginate(episodes, blockOf, title, setClass = '', perPage = PER_PAGE, note = '')` (기본값이면 지금 출력과 같음), `renderThinkAnswerKey(episodes)` → 쪽당 4회, 제목 `생각 퍼즐 정답 (아빠용)`, 쪽마다 note `답을 맞히면 '어떻게 알았어?' 하고 물어봐 주세요.`
  - `sets.js`: `SETS.think = { key: 'think', name: '생각 퍼즐', dir: THINK_DIR, outSub: 'think', validate: validateThinkEpisode, renderEpisode: renderThinkEpisode, renderAnswers: renderThinkAnswerKey, docTitle: '지호의 생각 퍼즐', answersPerPage: 4, extraDocs: [{ name: 'pieces', render: renderPiecesSheet, pages: 1 }] }`.
  - `build.js`: 정답지 예상 쪽수 `Math.ceil(n / (set.answersPerPage ?? 6))`; `set.extraDocs`마다 `${name}.html`(render(episodes)) → PDF, 쪽수 검사.
  - CSS: `--think-set: #3f9a5c`, `.page.think-set .phead .ep/.stamp` 색, `.think-problem` 공통·활동별 칸 스타일, `.page.pieces`, 정답지 note.
  - fixture: `makeThinkEpisode(id)` — 생성기(고정 seed)로 퍼즐 8개 + 나눗셈 1회 만화 panels를 빌려 만든 올바른 회차(id 1~4 네 활동).

- [ ] **Step 1: 바뀌면 안 되는 출력 떠 두기** — Run: `node worksheets/build.js --strict && node worksheets/build.js --set=div --strict && rm -rf "$SCRATCH/html-before" && cp -R worksheets/out/html "$SCRATCH/html-before"` (`$SCRATCH` = 세션 스크래치 폴더) / Expected: 곱셈 48+4쪽, 나눗셈 48+4쪽 완료
- [ ] **Step 2: 실패하는 테스트 쓰기** (`think-episodes.test.js`, `sets.test.js`에 한 개)

```js
for (const id of [1, 2, 3, 4]) expect(validateThinkEpisode(makeThinkEpisode(id), stickerIds), `${id}`).toEqual([]);
const wrong = makeThinkEpisode(1); wrong.activity = 'blocks';
expect(validateThinkEpisode(wrong, stickerIds).length).toBeGreaterThan(0);
const short = makeThinkEpisode(2); short.puzzles.pop();
expect(validateThinkEpisode(short, stickerIds).length).toBeGreaterThan(0);
const rev = makeThinkEpisode(1); rev.puzzles = [rev.puzzles[0], ...rev.puzzles.slice(1).reverse()];
expect(validateThinkEpisode(rev, stickerIds).join(' ')).toContain('쉬운 것부터');
const html = renderThinkEpisode(makeThinkEpisode(3), () => null);
expect(html.split('class="page ').length - 1).toBe(2);
expect(html.split('think-set').length - 1).toBe(2);
expect(html.split('<section class="problem think-problem').length - 1).toBe(8);
expect(html).not.toContain('러시아워');
const key = renderThinkAnswerKey([1, 2, 3, 4, 1].map(makeThinkEpisode));
expect(key.split('class="page answers think-set"').length - 1).toBe(2);
expect(key).toContain("'어떻게 알았어?'");
// sets.test.js
expect(setOf('think')).toMatchObject({ outSub: 'think', name: '생각 퍼즐', answersPerPage: 4 });
```

- [ ] **Step 3: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-episodes sets` / Expected: FAIL
- [ ] **Step 4: 구현** (episode.js, render-page.js, render-answers.js, sets.js, build.js, CSS, fixture)
- [ ] **Step 5: 통과 + 전체 테스트** — Run: `npm run ws:test` / Expected: 전부 PASS
- [ ] **Step 6: 곱셈·나눗셈 출력 그대로인지** — Run: Step 1의 두 빌드 다시 → `diff -r "$SCRATCH/html-before" worksheets/out/html -x think` / Expected: 차이 없음
- [ ] **Step 7: 커밋** — `feat(worksheets): 생각 퍼즐 세트 (회차 검사·페이지·정답지·빌드)`

---

### Task 7: 어드민에서 생각 퍼즐 세트

**Files:**
- Modify: `worksheets/admin/edit.js`, `worksheets/admin/server.js` (dirs 주석에 think), `worksheets/admin/index.html`, `worksheets/tests/admin.test.js`

**Interfaces:**
- Consumes: Task 6 `SETS.think`, Task 1 `ACTIVITY_NAMES`, fixture `makeThinkEpisode`.
- Produces: `textOf(ep)` — `story`가 있을 때만 `unit`(/`restUnit`), 생각 퍼즐은 `problem: ACTIVITY_NAMES[ep.activity]`. `applyTextEdits` — `story`가 있을 때만 단위 반영. index.html: `생각 퍼즐` 탭, `SET_NAMES.think`, `PDF_DIR.think = '/out/pdf/think'`, `unit`이 없으면 단위 칸 숨김, 안내 글 `이야기 문제` → 생각 퍼즐은 `활동`.

- [ ] **Step 1: 실패하는 테스트 쓰기** — 임시 폴더에 `makeThinkEpisode(1)`을 `ep01.json`으로 쓰고 `createAdminServer({ dirs: { think: tmp }, build: fake })`:

```js
const got = await (await fetch(`${base}/api/episodes/1?set=think`)).json();
expect(got.problem).toBe('주차장 탈출');
expect(got).not.toHaveProperty('unit');
got.panels[0][0] = '고친 말';
expect((await fetch(`${base}/api/episodes/1?set=think`, { method: 'PUT', body: JSON.stringify(got) })).status).toBe(200);
expect(JSON.parse(readFileSync(join(tmp, 'ep01.json'), 'utf8')).panels[0].bubbles[0].text).toBe('고친 말');
expect(textOf(makeThinkEpisode(4)).problem).toBe('논리 퍼즐');
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js admin` / Expected: FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — Run: `npm run ws:test` / Expected: 전부 PASS
- [ ] **Step 5: 커밋** — `feat(worksheets): 어드민에서 생각 퍼즐 세트 편집`

(어드민 화면 눈 확인은 Task 10에서 데이터가 생긴 뒤.)

---

### Task 8: 소품 스티커 (Codex)

**Files:**
- Create: `worksheets/assets/stickers/prop-red-car.png`, `prop-ticket-booth.png`, `prop-ice-cream.png`, `prop-uniforms.png`, `prop-cube-blocks.png`, `prop-town-map.png`, `prop-puzzle-paper.png`
- Modify: `worksheets/data/stickers.json`

**Interfaces:**
- Produces: 위 7개 스티커 id (만화에서 씀).

- [ ] **Step 1: 그림 만들기** — 스티커마다 `stickers.json`과 같은 짧은 영어 프롬프트(예: `Small red family car seen from the side`, `Train station ticket booth window`, `Three ice cream cones with different flavors`, `Soccer shirts and shorts hanging on hangers`, `Pile of plain wooden cube blocks with a small tower`, `Simple grid town map with a house and a school`, `Sheet of paper with a 4x4 puzzle grid and a pencil`)를 같은 그림체로: `codex exec --skip-git-repo-check -s workspace-write -C worksheets/assets -i stickers/prop-cookie-plate.png - < prompt.txt` → `node worksheets/tools/trim-png.js f` → `sips -Z 700 f`.
- [ ] **Step 2: 확인** — 7개를 한 장에 모아 보고 그림체·배경 투명 확인. Run: `npm run ws:test` / Expected: assets 테스트 포함 PASS
- [ ] **Step 3: 커밋** — `feat(worksheets): 생각 퍼즐 소품 스티커 7개`

---

### Task 9: 24회 데이터 (퍼즐 생성 도구 + 만화)

**Files:**
- Create: `worksheets/tools/make-think-puzzles.js`, `worksheets/data/think/ep01.json` … `ep24.json`, `worksheets/tests/think-data.test.js`

**Interfaces:**
- Consumes: Task 2~6 생성기·검사, Task 8 스티커.
- Produces: 24개 회차 JSON(5절 회차 구성·6절 범위대로), `node worksheets/tools/make-think-puzzles.js` — 각 JSON의 `panels` 등은 그대로 두고 `puzzles`만 다시 적는다. 주차장·쌓기나무·스도쿠는 seed = id × 100 + 자리로 생성하고 앞 회차 퍼즐을 `avoid`에 넣는다. 경우의 수 8문제와 논리 ①의 등장인물·이야기는 도구 안 표(`COUNTING_PLAN`, `LINEUP_ITEMS`)에 적는다(① = 만화 이야기와 같은 내용).

- [ ] **Step 1: 실패하는 테스트 쓰기**

```js
const eps = loadEpisodes(THINK_DIR);
expect(eps.map((e) => e.id)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
for (const ep of eps) expect(validateThinkEpisode(ep, stickerIds), `${ep.id}회`).toEqual([]);
const keys = eps.flatMap((e) => e.puzzles.map((p) => JSON.stringify(p)));
expect(new Set(keys).size).toBe(keys.length); // 24회 전체에서 같은 퍼즐 없음
const text = JSON.stringify(eps);
expect(text).not.toContain('러시아워');
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run --config worksheets/vitest.config.js think-data` / Expected: FAIL (폴더 없음)
- [ ] **Step 3: 만화 24개 쓰기** — 회차마다 제목·아이콘·소재·4컷(①상황 ②퍼즐이 생긴 까닭 ③규칙 ④질문). 활동별 ① 이야기: 주차장 = 아빠 차(빨간 차)가 막힘, 쌓기나무 = 감돌이·사랑이·지호가 쌓은 탑, 경우의 수 = 유니폼·아이스크림·기차 칸·리그·길, 논리 = 매표소·급식·사진 찍기 줄. 말풍선 규칙(화자, 40자, 마지막 `?`).
- [ ] **Step 4: 도구 쓰고 실행** — Run: `node worksheets/tools/make-think-puzzles.js` / Expected: 24개 파일에 퍼즐 8개씩
- [ ] **Step 5: 통과 확인** — Run: `npm run ws:test` / Expected: 전부 PASS
- [ ] **Step 6: 커밋** — `feat(worksheets): 생각 퍼즐 24회 이야기와 퍼즐`

---

### Task 10: 빌드·눈 확인·마무리

**Files:**
- Modify: 눈 확인에서 나온 것만 (CSS mm, 문구, 대사)

- [ ] **Step 1: 빌드** — Run: `node worksheets/build.js --set=think --strict` / Expected: ep01~24 각 2쪽, all 48쪽, answers 6쪽, pieces 1쪽, 오류 없음
- [ ] **Step 2: 눈 확인** — `pdftoppm`으로 앞면 24장·뒷면(활동별 1장 이상)·정답지·차 조각 장을 그림으로 떠서 모아 보기. 볼 것: 칸 넘침, 판과 조각 크기(PDF에서 판 칸 10mm = 조각 10mm), 쌓기나무 그림과 정답 일치(손으로 2개 이상), 주차장 가장 적은 횟수(손으로 2개 이상 따라 풀기), 줄 세우기 단서 문장, 만화 말풍선.
- [ ] **Step 3: 어드민 눈 확인** — 어드민을 다시 켜고(실행 중인 것을 멈춘 뒤) 생각 퍼즐 탭에서 회차 열기·미리보기·저장 확인.
- [ ] **Step 4: 곱셈·나눗셈 그대로** — Run: `node worksheets/build.js --strict && node worksheets/build.js --set=div --strict` / Expected: 48+4쪽씩
- [ ] **Step 5: 전체 테스트·공백 검사** — Run: `npm run ws:test && git diff --check` / Expected: PASS, 출력 없음
- [ ] **Step 6: 커밋** — `fix(worksheets): 생각 퍼즐 눈 확인 반영` (고친 것이 있을 때)
