# 생각 마을 1단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 산수 여행 메뉴에 "생각 마을"을 더하고, 디오라마 마을 지도 + 🚗 주차장(주차장 탈출) + 🎫 기차역 매표소(줄 세우기)를 이야기 → 퍼즐 → 대화 카드 → 도장 흐름으로 탭 S6에서 할 수 있게 한다. 나머지 4곳은 지도에 "공사 중"으로 보인다.

**Architecture:** 퍼즐 규칙은 `worksheets/lib/think/`의 순수 모듈을 Vite 별칭 `$think`로 그대로 가져온다. 앱 쪽 판단(차 밀기 범위, 단서 맞음/틀림, 진행 저장, 한 번 하기 흐름, 끌기 좌표 변환, 화면 맞춤)은 `src/lib/think-town/rules/`의 순수 TS 함수로 두고 vitest로 검사한다. 화면은 CSS 3D(원근 없음 = 정사영) 상자·판·종이 인형 컴포넌트를 1280×780 무대 안에 그린다. 퍼즐은 Node 도구가 미리 만들어 JSON으로 넣는다.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, Tailwind 4, TypeScript, vitest 4 (`npx vitest run src`), 기존 `canvas-confetti`. 새 npm 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-11-27-thinking-town-tablet-design.md`

## Global Constraints

- 갤럭시탭 S6 가로 1280 × 800, 세로 가용 780px 안, PWA 전체 화면, 스크롤 없음.
- Svelte 5(runes), Tailwind 4, 기존 `gameStore` 점수·기록과 이어짐, 카드는 스쿼클(22%), 터치 대상 넉넉히(최소 64px).
- 새 npm 의존성 없음(접근 A).
- 반목표: 4지선다 반복 / 판단 없이 버튼 하나로 끝나는 과제 / 답이 여러 개인 퍼즐 / 버벅임·스크롤 / 글로 가르치는 화면 / 밋밋한 성공 연출.
- 피드백은 움직임·소리·색. 성공은 길고 화려하게(팝·반짝임·별 카운트), 실패는 짧게(흔들림 + 소리).
- 별은 생각 마을 전용 누적 수로 따로 저장, 별 하나마다 기존 점수에도 더함(기록 남기기에 들어감).
- 판 통과 = 별 1, 가장 적게 풀면(주차장 최소 횟수) 별 1 더, 대화 카드 아빠 ⭐ = 별 1 더(한 번).
- 아빠 버튼(힌트·⭐)은 길게 눌러야 동작.
- 장소마다 단계 5개, 한 번 = 현재 단계 퍼즐 3~5판, 5단계 뒤에는 5단계 퍼즐로 계속.
- 음향: 라이브러리 음원을 바이트 그대로 복사(재인코딩 금지), 첫 입력에서 오디오 풀기, 음소거 새로고침 뒤 유지, 같은 효과음 연타 간격 90ms, 음량·경로는 코드 밖(`static/think-town/audio.json`), 사용자가 들어 보고 확정(Claude는 못 들음).
- 상품명 "러시아워"를 어디에도 쓰지 않는다("주차장 탈출").
- 실제 아이 사진을 외부 서비스에 보내지 않는다. 등장인물은 학습지 스티커 PNG 사본만.
- 커밋 계정 `tgtec26` / `tgtec26@snu-g.ms.kr`, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. main에 바로 커밋(이 저장소 관행).
- 푸시 조건: 테스트 + `git diff --check` 통과 + 1280×800 브라우저에서 눈으로 확인.

## Review Focus

1. **빠른 끌기·손가락이 판 밖으로 나감·pointercancel**: 차가 범위를 넘거나 다른 차와 겹치면 안 되고, 취소되면 원래 자리로 → `clampSlide`·`snapSlide` 테스트(Task 1), Task 6에서 pointercancel 처리.
2. **성공 연출 중 연타**: 같은 판에서 별이 두 번 들어가면 안 된다 → `run.ts`의 `solve`가 같은 판에 두 번 불려도 한 번만 셈(Task 2 테스트).
3. **저장값이 깨짐·없음·localStorage 오류**: 마을이 빈 진행으로 열려야 한다 → `loadSave` 쓰레기 입력 테스트(Task 2), 저장은 try/catch.
4. **1280×800이 아닌 창**(데스크톱, 내비게이션 바 있는 탭 1280×752): 잘림·스크롤 없이 무대가 줄어든다 → `fitScale` 테스트(Task 1).
5. **단계 중간에 나갔다 다시 들어옴**(뒤로 가기·브라우저 뒤로): 단계가 끝난 걸로 치면 안 되고, 이미 받은 별은 그대로, 다음엔 새 퍼즐 → `takePuzzles`·`clearStage` 테스트(Task 2).

## 파일 구조

```
src/lib/think-town/
  rules/
    camera.ts          끌기 좌표 변환(screenToBoard), 화면 맞춤(fitScale)
    parking-play.ts    차 목록·밀기 범위·이동·풀림·힌트
    lineup-play.ts     줄 칸 놓기·단서 판정·힌트
    progress.ts        저장 형식·단계·퍼즐 꺼내기(순수)
    run.ts             한 번 하기 흐름 상태(순수): story → board → talk → finale
    *.test.ts
  progress.svelte.ts   진행 store(localStorage + gameStore 점수)
  sound.ts             효과음·배경음(WebAudio), 음소거 유지, 연타 제한
  data/
    puzzles.json       미리 만든 퍼즐(도구가 씀)
    puzzles.test.ts    퍼즐 검사
    places.ts          장소 6곳 이름·아이콘·지도 위치·만들었는지
    stories.ts         이야기 10개(주차장 5, 매표소 5) + 대화 카드 질문
    cast.ts            줄 세우기 이름 → 스티커
  diorama/
    Stage.svelte       1280×780 무대, 창에 맞춰 줄임
    Board.svelte       비스듬한 판(카메라 각도 props), 나무 테두리
    Box3D.svelte       입체 상자
    Doll.svelte        세운 종이 인형 + 바닥 그림자
  ThinkTown.svelte     지도 ↔ 장소 전환, 위쪽 알약, 음소거
  TownMap.svelte       마을 지도
  PlaceRun.svelte      한 번 하기 흐름 화면
  StoryScene.svelte    3컷 이야기
  TalkCard.svelte      "어떻게 알았어?"
  Finale.svelte        도장 + 폭죽 + 별 카운트
  LongPressButton.svelte
  places/ParkingPlace.svelte
  places/TicketPlace.svelte
worksheets/tools/make-town-puzzles.js
static/think-town/stickers/*.png, static/think-town/audio/*, static/think-town/audio.json
```

---

### Task 1: 조작 규칙 (차 밀기·줄 세우기·좌표)

**Files:**
- Modify: `svelte.config.js` (kit.alias `$think: 'worksheets/lib/think'`)
- Modify: `worksheets/lib/think/logic.js` (`function fits` → `export function fits`, 다른 줄은 그대로)
- Create: `src/lib/think-town/rules/camera.ts`, `parking-play.ts`, `lineup-play.ts`
- Test: `src/lib/think-town/rules/camera.test.ts`, `parking-play.test.ts`, `lineup-play.test.ts`

**Interfaces:**
- Consumes: `$think/parking.js` `parseBoard`, `solveParking`, `SIZE`, `EXIT_ROW`; `$think/logic.js` `fits`, `clueText`.
- Produces:
  - `camera.ts`: `screenToBoard(dx: number, dy: number, tiltDeg: number, turnDeg: number, scale: number): { x: number; y: number }`, `fitScale(w: number, h: number): number` (무대 1280×780 기준, 최대 1).
  - `parking-play.ts`: `type Car = { id: string; row: number; col: number; len: number; horizontal: boolean }`, `carsFromBoard(board: string[]): Car[]`, `boardOf(cars: Car[]): string[]`, `posOf(car: Car): number` (가로면 col, 세로면 row), `slideRange(cars: Car[], i: number): { min: number; max: number }`, `clampSlide(range, pos: number): number`, `snapSlide(range, pos: number): number`, `moveCar(cars: Car[], i: number, pos: number): Car[]`, `isSolved(cars: Car[]): boolean`, `hintMove(cars: Car[]): { id: string; dir: 'up'|'down'|'left'|'right'; dist: number } | null`, `GOAL_COL = 4`.
  - `lineup-play.ts`: `type Clue = { type: string; a: string; b?: string }`, `placeInSlot(slots: (string|null)[], name: string, slot: number): (string|null)[]` (이미 있던 자리에서 빼고, 그 칸에 있던 이름은 빈자리로), `clueResults(order: string[], clues: Clue[]): boolean[]`, `isLineupSolved(slots, clues): boolean`, `hintClue(slots, clues): number` (아직 안 맞는 첫 단서 번호, 다 맞으면 -1).

- [ ] **Step 1: 실패하는 테스트 쓰기**

```ts
// camera.test.ts
it('정사영 판에서 화면 이동을 판 이동으로 되돌린다', () => {
  // turn 0, tilt 60: 화면 세로는 cos60 = 0.5배로 줄어 보임
  expect(screenToBoard(10, 5, 60, 0, 1)).toEqual({ x: 10, y: 10 });
  // scale 0.5면 두 배
  const p = screenToBoard(0, 0, 58, -34, 0.5); expect(p.x).toBeCloseTo(0); expect(p.y).toBeCloseTo(0);
  // 판 (x, y) → 화면 (X, Y) = (x cos t − y sin t, (x sin t + y cos t)·cos a) 를 되돌리는지
  const t = -34 * Math.PI / 180, a = 58 * Math.PI / 180, x = 30, y = -12;
  const X = x * Math.cos(t) - y * Math.sin(t), Y = (x * Math.sin(t) + y * Math.cos(t)) * Math.cos(a);
  const back = screenToBoard(X, Y, 58, -34, 1); expect(back.x).toBeCloseTo(x); expect(back.y).toBeCloseTo(y);
});
it('무대를 창에 맞춘다', () => {
  expect(fitScale(1280, 800)).toBe(1);
  expect(fitScale(1280, 752)).toBeCloseTo(752 / 780);
  expect(fitScale(1920, 1080)).toBe(1);
  expect(fitScale(640, 800)).toBeCloseTo(0.5);
});

// parking-play.test.ts — 판 B = ['..A...', '..A...', 'RRA...', '......', '......', '......'] (A 세로 3칸 col 2 row 0~2)
it('세로 트럭 A는 아래로만 3칸까지', () => {
  const cars = carsFromBoard(B); const i = cars.findIndex(c => c.id === 'A');
  expect(slideRange(cars, i)).toEqual({ min: 0, max: 3 });
});
it('빨간 차는 A에 막혀 제자리', () => {
  const cars = carsFromBoard(B); const r = cars.findIndex(c => c.id === 'R');
  expect(slideRange(cars, r)).toEqual({ min: 0, max: 0 });
});
it('범위 밖 끌기는 끝에서 멈추고, 놓으면 가까운 칸', () => {
  expect(clampSlide({ min: 0, max: 3 }, 5.4)).toBe(3);
  expect(clampSlide({ min: 0, max: 3 }, -2)).toBe(0);
  expect(snapSlide({ min: 0, max: 3 }, 1.6)).toBe(2);
  expect(snapSlide({ min: 0, max: 3 }, 9)).toBe(3);
});
it('A를 내리면 빨간 차가 출구까지 가고 풀린다', () => {
  let cars = carsFromBoard(B); const i = cars.findIndex(c => c.id === 'A'); const r = cars.findIndex(c => c.id === 'R');
  cars = moveCar(cars, i, 3);
  expect(slideRange(cars, r)).toEqual({ min: 0, max: 4 });
  expect(isSolved(cars)).toBe(false);
  cars = moveCar(cars, r, 4);
  expect(isSolved(cars)).toBe(true);
  expect(boardOf(cars)[2]).toBe('....RR');
});
it('힌트는 가장 짧은 풀이의 첫 움직임', () => {
  expect(hintMove(carsFromBoard(B))).toEqual({ id: 'A', dir: 'down', dist: 3 });
});

// lineup-play.test.ts — 단서: 지호 바로 뒤에 아빠, 지호는 감돌이보다 앞 → 답 [지호, 아빠, 감돌이]
const clues = [{ type: 'behind', a: '지호', b: '아빠' }, { type: 'before', a: '지호', b: '감돌이' }];
it('칸에 놓으면 원래 자리는 비고, 그 칸에 있던 인형은 빈자리로 간다', () => {
  expect(placeInSlot([null, null, null], '지호', 1)).toEqual([null, '지호', null]);
  expect(placeInSlot([null, '지호', null], '지호', 0)).toEqual(['지호', null, null]);
  expect(placeInSlot(['아빠', '지호', null], '지호', 0)).toEqual(['지호', '아빠', null]);
});
it('단서마다 맞음/틀림', () => {
  expect(clueResults(['아빠', '지호', '감돌이'], clues)).toEqual([false, true]);
  expect(isLineupSolved(['지호', '아빠', '감돌이'], clues)).toBe(true);
  expect(isLineupSolved(['지호', '아빠', null], clues)).toBe(false);
});
it('힌트는 아직 안 맞는 첫 단서 (빈칸에 걸린 단서도 안 맞음)', () => {
  expect(hintClue([null, null, null], clues)).toBe(0);
  expect(hintClue(['지호', '아빠', null], clues)).toBe(1);
  expect(hintClue(['지호', '아빠', '감돌이'], clues)).toBe(-1);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/think-town` · Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**
  - `screenToBoard`: 판 점 (x,y)는 화면에 (x cos t − y sin t, (x sin t + y cos t)·cos a)로 보인다(`transform: rotateX(a) rotateZ(t)`, 원근 없음). 역변환: y′ = dY / cos a, x′ = dX, x = x′ cos t + y′ sin t, y = −x′ sin t + y′ cos t, 둘 다 ÷ scale.
  - `slideRange`: 그 차를 뺀 칸 차지 표에서 축 방향으로 빈칸을 셀 때까지(판 끝 0~SIZE−len). `hintMove`: `solveParking(boardOf(cars))?.moves[0] ?? null`. `hintClue`: 빈칸에 걸린 이름이 있는 단서는 안 맞음으로 본다(`first`/`last`/`middle`는 그 자리가 비었거나 다른 이름이면 안 맞음).
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src && npm run ws:test` · Expected: 모두 PASS (logic.js export 한 줄만 바뀜)
- [ ] **Step 5: 커밋** — `feat(think-town): 차 밀기·줄 세우기·좌표 규칙`

---

### Task 2: 진행 저장과 한 번 하기 흐름

**Files:**
- Create: `src/lib/think-town/rules/progress.ts`, `src/lib/think-town/rules/run.ts`, `src/lib/think-town/progress.svelte.ts`
- Test: `src/lib/think-town/rules/progress.test.ts`, `src/lib/think-town/rules/run.test.ts`

**Interfaces:**
- Produces:
  - `progress.ts`: `PLACE_IDS = ['parking','blocks','clothes','ticket','garden','seesaw'] as const`, `type PlaceId`, `STAGES = 5`, `BOARDS_PER_STAGE = [3, 3, 4, 4, 5]`, `type TownSave = { version: 1; stars: number; places: Record<PlaceId, { cleared: number; cursor: number[] }> }` (cursor 길이 5), `emptySave(): TownSave`, `loadSave(raw: string | null): TownSave`, `currentStage(save, place): number` (= min(cleared+1, 5)), `takePuzzles<T>(pool: T[], cursor: number, n: number): { items: T[]; next: number }` (끝에서 처음으로 돌아감), `withCursor(save, place, stage, next): TownSave`, `clearStage(save, place): TownSave` (cleared = min(cleared+1, 5)), `addStars(save, n): TownSave`, `stampCount(save): number` (cleared 합).
  - `run.ts`: `type Phase = 'story' | 'board' | 'talk' | 'finale'`, `type Run = { phase: Phase; panel: number; board: number; boards: number; solved: boolean[]; stars: number; talkStar: boolean }`, `startRun(boards: number): Run`, `nextPanel(run): Run` (3컷 뒤 board로), `solve(run, bonus: boolean): { run: Run; gained: number }` (이미 푼 판이면 gained 0), `nextBoard(run): Run` (마지막 판 뒤 talk로), `giveTalkStar(run): { run: Run; gained: number }` (한 번만), `finish(run): Run` (talk → finale).
  - `progress.svelte.ts`: `townStore` — `save` (getter), `stage(place)`, `takeFor<T>(place, pools: T[][]): T[]` (`pools[stage-1]`에서 `BOARDS_PER_STAGE[stage-1]`개 꺼내고 cursor 저장), `award(n)` (별 저장 + `gameStore.addScore(10 * n, true)`), `clear(place)`; localStorage 키 `think_town_v1`, 읽기·쓰기 try/catch.

- [ ] **Step 1: 실패하는 테스트 쓰기**

```ts
// progress.test.ts
it('깨진 저장값이면 빈 진행', () => {
  for (const raw of [null, '', '{', '[]', '{"version":9}', '{"version":1,"stars":"x"}']) expect(loadSave(raw)).toEqual(emptySave());
});
it('일부만 있는 저장값은 빠진 장소를 채운다', () => {
  const s = loadSave(JSON.stringify({ version: 1, stars: 7, places: { parking: { cleared: 2, cursor: [3, 3, 0, 0, 0] } } }));
  expect(s.stars).toBe(7); expect(s.places.parking.cleared).toBe(2); expect(s.places.ticket).toEqual({ cleared: 0, cursor: [0, 0, 0, 0, 0] });
});
it('단계는 5에서 멈추고, 5단계를 끝내도 5', () => {
  let s = emptySave(); expect(currentStage(s, 'parking')).toBe(1);
  for (let i = 0; i < 7; i++) s = clearStage(s, 'parking');
  expect(s.places.parking.cleared).toBe(5); expect(currentStage(s, 'parking')).toBe(5);
});
it('퍼즐 꺼내기는 이어서, 끝나면 처음부터', () => {
  expect(takePuzzles(['a', 'b', 'c', 'd', 'e'], 3, 3)).toEqual({ items: ['d', 'e', 'a'], next: 1 });
});
it('중간에 나가도(cursor만 바뀜) 단계는 그대로', () => {
  const s = withCursor(emptySave(), 'ticket', 1, 3);
  expect(s.places.ticket.cursor[0]).toBe(3); expect(currentStage(s, 'ticket')).toBe(1);
});
it('도장 수 = 끝낸 단계 합', () => {
  let s = clearStage(clearStage(emptySave(), 'parking'), 'ticket'); expect(stampCount(s)).toBe(2);
});

// run.test.ts
it('이야기 3컷 → 판', () => {
  let r = startRun(3); r = nextPanel(nextPanel(r)); expect(r.phase).toBe('story'); r = nextPanel(r); expect(r.phase).toBe('board');
});
it('같은 판을 두 번 풀어도 별은 한 번', () => {
  let r = nextPanel(nextPanel(nextPanel(startRun(3))));
  const a = solve(r, true); expect(a.gained).toBe(2);
  const b = solve(a.run, true); expect(b.gained).toBe(0); expect(b.run.stars).toBe(2);
});
it('마지막 판 뒤 대화 카드, ⭐는 한 번만, 그다음 피날레', () => {
  let r = nextPanel(nextPanel(nextPanel(startRun(1))));
  r = nextBoard(solve(r, false).run); expect(r.phase).toBe('talk');
  const t1 = giveTalkStar(r); const t2 = giveTalkStar(t1.run);
  expect([t1.gained, t2.gained]).toEqual([1, 0]);
  expect(finish(t2.run).phase).toBe('finale');
});
it('풀지 않은 판은 넘어가지 않는다', () => {
  const r = nextPanel(nextPanel(nextPanel(startRun(3)))); expect(nextBoard(r)).toEqual(r);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/think-town/rules` · Expected: FAIL (progress·run 없음)
- [ ] **Step 3: 구현** — 순수 함수는 새 객체를 돌려준다(입력 안 바꿈). `progress.svelte.ts`는 `gameStore.svelte.ts`처럼 클래스 + `$state`, 바뀔 때마다 저장.
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src` · Expected: PASS
- [ ] **Step 5: 커밋** — `feat(think-town): 진행 저장과 한 번 하기 흐름`

---

### Task 3: 미리 만든 퍼즐

**Files:**
- Create: `worksheets/tools/make-town-puzzles.js` (실행: `node worksheets/tools/make-town-puzzles.js`)
- Create: `src/lib/think-town/data/cast.ts`, `src/lib/think-town/data/puzzles.json` (도구가 씀)
- Test: `src/lib/think-town/data/puzzles.test.ts`

**Interfaces:**
- Consumes: `generateParking`, `PARKING_RANGES`, `checkParkingPuzzle` (`parking.js`); `generateLineup`, `LINEUP_RANGES`, `lineupSolutions` (`logic.js`); `makeRng` (`common.js`); 학습지 퍼즐 `worksheets/data/think/ep*.json`.
- Produces: `puzzles.json` = `{ "parking": { board: string[]; minMoves: number }[][5], "lineup": { kind: 'lineup'; items: string[]; clues: Clue[] }[][5] }` — 단계 1~4 각 12개, 단계 5 각 40개. 단계 s는 학습지 라운드 s 범위. `cast.ts`: `CAST: Record<string, string>` 이름 → 스티커 id = `{ 지호: 'jiho-happy', 아빠: 'dad-smiling', 감돌이: 'gamdori-cheering', 사랑이: 'sarang-sitting', 선생님: 'guest-piano-teacher' }`, `LINEUP_CAST_BY_STAGE = [['지호','아빠','감돌이'], ['지호','아빠','감돌이'], ['지호','아빠','감돌이','사랑이'], ['지호','아빠','감돌이','사랑이'], ['지호','아빠','감돌이','사랑이','선생님']]`.

- [ ] **Step 1: 실패하는 테스트 쓰기**

```ts
// puzzles.test.ts
it('단계마다 개수', () => {
  expect(P.parking.map(s => s.length)).toEqual([12, 12, 12, 12, 40]);
  expect(P.lineup.map(s => s.length)).toEqual([12, 12, 12, 12, 40]);
});
it('주차장: 학습지 검사기로 라운드 범위·최소 횟수가 맞다', () => {
  P.parking.forEach((pool, s) => pool.forEach(p => expect(checkParkingPuzzle(p, s + 1)).toEqual([])));
});
it('줄 세우기: 답이 하나, 등장인물은 그 단계 명단', () => {
  P.lineup.forEach((pool, s) => pool.forEach(p => {
    expect(lineupSolutions(p)).toHaveLength(1);
    expect([...p.items].sort()).toEqual([...LINEUP_CAST_BY_STAGE[s]].sort());
  }));
});
it('겹치는 퍼즐 없음 (앱 안, 학습지와)', () => {
  const boards = P.parking.flat().map(p => p.board.join('/'));
  expect(new Set(boards).size).toBe(boards.length);
  for (const b of worksheetBoards()) expect(boards).not.toContain(b); // ep*.json 의 parking 판
  const lines = P.lineup.flat().map(p => JSON.stringify(p.clues));
  expect(new Set(lines).size).toBe(lines.length);
});
```
(`worksheetBoards`는 테스트 안에서 `import.meta.glob('/worksheets/data/think/ep*.json', { eager: true })`로 모은다.)

- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/think-town/data` · Expected: FAIL (puzzles.json 없음)
- [ ] **Step 3: 도구 구현 후 실행** — seed 고정(`makeRng(20261127 + stage)`), 학습지 판·앞서 만든 판은 `avoid`로 넘기고, 줄 세우기는 단서 JSON이 겹치면 다시 만든다. 이름 순서는 `generateLineup`이 섞는다. Run: `node worksheets/tools/make-town-puzzles.js` · Expected: `parking 88, lineup 88` 출력, `puzzles.json` 생김.
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src` · Expected: PASS
- [ ] **Step 5: 커밋** — `feat(think-town): 주차장·매표소 퍼즐 미리 만들기`

---

### Task 4: 스티커·음향 사본과 소리 모듈

**Files:**
- Create: `static/think-town/stickers/*.png` — `jiho-*`, `dad-*`, `gamdori-*`, `sarang-*`, `guest-piano-teacher`, `prop-ticket-booth`, `prop-bullet-train`, `prop-parking-lot` 을 `sips -Z 360`으로 줄인 사본(원본은 그대로)
- Create: `static/think-town/audio/` — `/Users/choijonghun/agent/local-game-audio-studio/library/`의 `sfx/ui/correct.mp3`, `sfx/ui/error.mp3`, `sfx/ui/success.mp3`, `sfx/impact/683031_thump.mp3`(도장), `sfx/other/urea_release_bubble_pop.mp3`(놓기), `sfx/impact/urea_bump_cartoon_boing.mp3`(막힘), `bgm/minigame/fp_bgm_carousel_morning.m4a`(마을·퍼즐 배경음)를 `cp`로 바이트 그대로
- Create: `static/think-town/audio.json` — `{ "bgmVolume": 0.35, "sfxVolume": 0.8, "bgm": "...m4a", "sfx": { "correct": ..., "error": ..., "success": ..., "stamp": ..., "drop": ..., "bump": ... } }`
- Create: `src/lib/think-town/sound.ts`
- Test: `src/lib/think-town/sound.test.ts`

**Interfaces:**
- Produces: `type Sfx = 'correct'|'error'|'success'|'stamp'|'drop'|'bump'`, `sound.unlock(): Promise<void>` (첫 입력에서 AudioContext resume + 설정·음원 읽기 + 배경음 시작), `sound.play(name: Sfx): void`, `sound.muted` (getter), `sound.toggleMute(): void`, `sound.stopBgm(): void`. 순수 도우미: `canPlay(last: number | undefined, now: number, gap = 90): boolean`, `readMuted(storage: Pick<Storage,'getItem'>): boolean` (`think_town_muted`, 오류면 false).

- [ ] **Step 1: 실패하는 테스트 쓰기**

```ts
it('같은 소리는 90ms 안에 다시 안 난다', () => {
  expect(canPlay(undefined, 1000)).toBe(true);
  expect(canPlay(1000, 1050)).toBe(false);
  expect(canPlay(1000, 1090)).toBe(true);
});
it('음소거 저장값 읽기', () => {
  expect(readMuted({ getItem: () => '1' })).toBe(true);
  expect(readMuted({ getItem: () => null })).toBe(false);
  expect(readMuted({ getItem: () => { throw new Error('blocked'); } })).toBe(false);
});
```
- [ ] **Step 2: 실패 확인** — Run: `npx vitest run src/lib/think-town/sound.test.ts` · Expected: FAIL
- [ ] **Step 3: 구현** — 효과음은 AudioBuffer(WebAudio), 배경음은 `HTMLAudioElement` 반복(`loop`) + 음량, `visibilitychange`로 숨으면 멈추고 돌아오면 이어서. 음원 크기 확인: `md5 -q` 원본 = 사본.
- [ ] **Step 4: 통과 확인** — Run: `npx vitest run src` · Expected: PASS. `cmp` 로 사본 7개가 원본과 같음.
- [ ] **Step 5: 커밋** — `feat(think-town): 스티커·음향 사본과 소리 모듈`

---

### Task 5: 디오라마 부품 + 마을 지도 + 메뉴 연결

**Files:**
- Create: `src/lib/think-town/diorama/Stage.svelte`, `Board.svelte`, `Box3D.svelte`, `Doll.svelte`, `src/lib/think-town/data/places.ts`, `src/lib/think-town/ThinkTown.svelte`, `src/lib/think-town/TownMap.svelte`
- Create: `.claude/launch.json` (`npm run dev`, port 5173)
- Modify: `src/lib/types.ts` (GameMode에 `'think'`), `src/lib/components/Menu.svelte` (games 끝에 `{ mode: 'think', icon: '🏘️' }`), `src/routes/+page.svelte` (`think`면 Header·ProgressBar 없이 `<ThinkTown />`)

**Interfaces:**
- Consumes: `fitScale` (Task 1), `townStore` (Task 2), `sound` (Task 4).
- Produces:
  - `Stage.svelte`: 화면 고정, 안쪽 1280×780을 `fitScale(innerWidth, innerHeight)`로 줄여 가운데. children 슬롯.
  - `Board.svelte` props `{ width: number; depth: number; tilt?: number (기본 58); turn?: number (기본 -34); children }` — 판 + 나무 테두리, `transform: rotateX(tilt) rotateZ(turn)`, `transform-style: preserve-3d`, 원근 없음.
  - `Box3D.svelte` props `{ x; y; w; d; h; z?: number; color: string; onpointerdown?; children? }` — 윗면 translateZ(z+h) 밝기 1.12, 앞 0.86, 오른쪽 0.72, 뒤 0.8, 왼쪽 0.78 (목업과 같은 면 짜기).
  - `Doll.svelte` props `{ x; y; sticker: string; height: number; turn?: number }` — 판 위 (x,y)에 서서 카메라를 보는 스티커(`rotateZ(-turn) rotateX(-90deg)`, 아래 가운데 기준) + 타원 그림자.
  - `places.ts`: `PLACES: { id: PlaceId; name: string; icon: string; activity: string; built: boolean; spot: { x; y } }[]` — 주차장·매표소만 `built: true`.
  - `ThinkTown.svelte`: 상태 `view: 'map' | PlaceId`. 위쪽: ← 메뉴(`gameStore.setMode('menu')`), 도장 n/30 · ⭐ n, 음소거. 첫 pointerdown에 `sound.unlock()`.
  - `TownMap.svelte` props `{ onEnter: (id: PlaceId) => void }` — 지도 판(목업 town-v2 배치), 장소 이름표 + 단계 점(●●○○○), 추천 장소(만든 곳 중 cleared가 가장 작은 곳, 동점이면 앞) 통통, 안 만든 곳은 울타리 + "공사 중"(누르면 흔들림 + bump).

- [ ] **Step 1: 구현** — 위 Interfaces대로. 목업 `.superpowers/brainstorm/82213-1795776773/content/town-v2.html`의 판 크기·도로·건물 배치를 옮긴다(주차장: 회색 바닥 + 작은 차 상자, 매표소: 하늘색 건물 + 레일, 나머지 4곳은 기본 건물 + 울타리).
- [ ] **Step 2: 검사** — Run: `npm run check && npx vitest run src` · Expected: 0 ERRORS(기존 경고 2개만), PASS
- [ ] **Step 3: 눈 확인** — preview_start(launch.json) → 1280×800 창 → 메뉴에 🏘️ → 누르면 지도. 확인: 스크롤 없음, 판이 입체로 보임, 이름표 6개 겹치지 않음, 주차장·매표소 통통/점, 4곳 "공사 중", 공사 중 누르면 흔들림, ← 로 메뉴 복귀, 1280×752에서도 안 잘림. 스크린샷 저장.
- [ ] **Step 4: 커밋** — `feat(think-town): 디오라마 마을 지도와 메뉴 칸`

---

### Task 6: 주차장 (판 조작 + 한 번 하기 기본 흐름)

**Files:**
- Create: `src/lib/think-town/places/ParkingPlace.svelte`, `src/lib/think-town/PlaceRun.svelte`
- Modify: `src/lib/think-town/ThinkTown.svelte` (`view`가 장소면 `<PlaceRun place onExit>`)

**Interfaces:**
- Consumes: `parking-play.ts`, `camera.ts` (Task 1); `run.ts`, `townStore` (Task 2); `puzzles.json` (Task 3); `sound` (Task 4); `Board`/`Box3D` (Task 5).
- Produces:
  - 장소 컴포넌트 공통 모양: props `{ puzzle: P; onSolved: (r: { bonus: boolean }) => void }`, 인스턴스 함수 `export function hint(): void`.
  - `PlaceRun.svelte` props `{ place: PlaceId; onExit: () => void }` — 들어올 때 `townStore.takeFor(place, puzzles[place])`로 퍼즐 n개(주차장은 minMoves 오름차순), `run.ts`로 단계 진행. 이 Task에서는 `startRun` 뒤 `nextPanel` 세 번으로 board에서 시작하고 talk도 바로 `finish`(Task 8에서 이야기·대화 카드를 넣음), 마지막 판 뒤 `townStore.clear(place)` 후 지도로. 판 사이: 성공 연출 1.2초 동안 입력 잠금.
  - `ParkingPlace.svelte`: 6×6 판(칸 80px, tilt 50, turn -22에서 시작해 눈으로 조정), 출구 = 3번째 줄 오른쪽 테두리 틈 + 화살표. 차 = `Box3D`(R 빨강, 2칸 높이 34, 3칸 트럭 높이 44, 색은 글자마다 고정 팔레트). 위쪽 알약: "움직임 n · 가장 적게 N번", 되돌리기 ↩, 처음부터 ⟲.

- [ ] **Step 1: 구현** — 끌기: `pointerdown`에서 `setPointerCapture`, 시작 위치 기억 → `pointermove`마다 `screenToBoard(dx, dy, tilt, turn, scale)`의 축 성분 ÷ 칸 크기 + 시작 칸 → `clampSlide`로 미끄러지게 보여 줌(범위 끝에 닿는 순간 bump 한 번) → `pointerup`에서 `snapSlide`, 자리가 바뀌었으면 `moveCar` + 움직임 +1 + 되돌리기 쌓기 + drop 소리 → `pointercancel`이면 원래 자리. `isSolved`면 빨간 차가 출구 밖으로 0.8초 달려 나감 + correct + 별 팝(+1, 움직임 ≤ minMoves면 +2) → `onSolved({ bonus: moves <= minMoves })`. `hint()`: `hintMove` 차를 1.5초 반짝 + 방향 화살표.
- [ ] **Step 2: 검사** — Run: `npm run check && npx vitest run src` · Expected: 0 ERRORS, PASS
- [ ] **Step 3: 눈 확인** — 지도 → 주차장 → 판 3개를 직접 풀기(브라우저에서 끌기). 확인: 차가 자기 축으로만 움직이고 다른 차를 뚫지 않음, 빠르게 판 밖까지 끌어도 범위 끝에서 멈춤, 움직임 수·최소 횟수 표시, 되돌리기·처음부터, 빨간 차가 출구로 나감, 별이 위쪽 알약에 더해짐, 3판 뒤 지도에서 주차장 점 하나 채워짐, 중간에 ← 나가면 단계 그대로. 스크린샷.
- [ ] **Step 4: 커밋** — `feat(think-town): 주차장 탈출 판 조작`

---

### Task 7: 기차역 매표소 (줄 세우기)

**Files:**
- Create: `src/lib/think-town/places/TicketPlace.svelte`
- Modify: `src/lib/think-town/PlaceRun.svelte` (ticket 연결)

**Interfaces:**
- Consumes: `lineup-play.ts` (Task 1), `clueText` (`$think/logic.js`), `CAST` (Task 3), `Board`/`Doll`/`Box3D` (Task 5), 장소 컴포넌트 공통 모양 (Task 6).
- Produces: `TicketPlace.svelte` — 디오라마: 매표소 건물(왼쪽 끝 = 줄 맨 앞, 창구 쪽에 "앞" 표시), 바닥에 줄 칸 n개(발자국 모양), 오른쪽 아래 대기 의자에 인형들. 오른쪽에 단서 카드 2~5장(`clueText`), "확인" 단추(칸이 다 차야 켜짐).

- [ ] **Step 1: 구현** — 끌기는 화면 평면에서: 인형을 누르면 같은 스티커가 손가락을 따라오는 2D 겹친 그림(`position: absolute`, 무대 좌표 = 화면 좌표 ÷ scale)으로 바뀌고, 놓을 때 칸 표시들의 `getBoundingClientRect()` 가운데와 가장 가까운 칸(반경 90px 안)에 `placeInSlot`, 멀면 의자로. 놓으면 drop 소리 + 인형 통 튐. "확인": `clueResults`로 카드마다 초록 ✓ / 빨강 ✕ 불(✕ 카드는 흔들림 + error), 다 맞으면 줄이 매표소 쪽으로 한 칸씩 걸어가고 표가 나옴 + correct → `onSolved({ bonus: false })`. `hint()`: `hintClue` 카드를 1.5초 노랗게 반짝.
- [ ] **Step 2: 검사** — Run: `npm run check && npx vitest run src` · Expected: 0 ERRORS, PASS
- [ ] **Step 3: 눈 확인** — 지도 → 매표소 → 3판 풀기. 확인: 인형이 손가락을 따라옴, 칸에 쏙 들어감·자리 바꾸기, 칸이 다 차야 확인 켜짐, 틀린 단서만 ✕·흔들림, 맞으면 걸어가는 연출, 단서 글자 크기(아빠가 읽기 쉬움) 28px 이상. 스크린샷.
- [ ] **Step 4: 커밋** — `feat(think-town): 기차역 매표소 줄 세우기`

---

### Task 8: 이야기·대화 카드·아빠 버튼·도장 피날레

**Files:**
- Create: `src/lib/think-town/StoryScene.svelte`, `TalkCard.svelte`, `Finale.svelte`, `LongPressButton.svelte`, `src/lib/think-town/data/stories.ts`
- Modify: `src/lib/think-town/PlaceRun.svelte` (story → board → talk → finale 전부)

**Interfaces:**
- Consumes: `run.ts`, `townStore`, `sound`, `Board`/`Doll`, `canvas-confetti`.
- Produces:
  - `stories.ts`: `type Panel = { cast: { sticker: string; x: number; y: number; h: number }[]; speaker: string; text: string }`, `STORIES: Partial<Record<PlaceId, Panel[][]>>` (장소마다 단계 5개 × 3컷), `TALK: Record<PlaceId, string>` = 기획 8절 질문 그대로.
  - `LongPressButton.svelte` props `{ label: string; ms?: number (기본 800); onfire: () => void }` — 누르는 동안 테두리가 차오르고, 다 차면 한 번 실행, 일찍 떼면 취소.
  - `StoryScene.svelte` props `{ panels: Panel[]; index: number; onnext }` — 그 장소 디오라마 위에 인형(`Doll`) + 말풍선(화자 머리 위, 24px 이상, 40자 이하), 오른쪽 아래 "다음 ▶"(큰 단추).
  - `TalkCard.svelte` props `{ question: string; onstar; ondone }` — "어떻게 알았어?" + 질문, 아빠 ⭐(LongPress, 한 번 누르면 별이 날아가 알약에 더해짐), "다 했어" 단추.
  - `Finale.svelte` props `{ placeName: string; stage: number; stars: number; ondone }` — 잠깐 멈춤 → 도장 쾅(stamp 소리 + 화면 살짝 흔들림) → 폭죽(confetti) + success → 별 카운트업 → 3~5초 뒤 "마을로" 단추(바로 눌러 건너뛰기 가능).
  - PlaceRun: 퍼즐 화면 왼쪽 아래에 아빠 힌트(LongPress) → 장소 컴포넌트 `hint()`.
  - 이야기 10개(단계마다 한 줄 줄거리, 대사는 학습지 말투로 3컷):

    | 단계 | 🚗 주차장 | 🎫 매표소 |
    |---|---|---|
    | 1 | 마트 가는 날, 아빠 빨간 차가 막혔다 | 지호·아빠·감돌이가 기차표 줄을 선다 |
    | 2 | 감돌이가 장난감 차를 잔뜩 세워 놨다 | 감돌이가 순서를 헷갈려 한다 |
    | 3 | 비 오는 날 주차장이 붐빈다 | 사랑이도 줄에 끼고 싶어 한다(넷) |
    | 4 | 트럭이 많은 날 | 차장님이 단서 쪽지를 준다 |
    | 5 | 축구 경기 날 꽉 찬 주차장 | 선생님까지 다섯이 줄 선다 |

- [ ] **Step 1: 구현** — 이야기 대사: 말풍선마다 화자 필수, 40자 이하, 3번째 컷은 퍼즐로 이어지는 질문(`?`로 끝). 등장인물은 스티커 사본만.
- [ ] **Step 2: 검사** — `stories.ts` 모양 테스트를 `src/lib/think-town/data/stories.test.ts`에 둔다: 주차장·매표소 각 5단계 × 3컷, 텍스트 1~40자, 3번째 컷 `?`로 끝남, 화자 스티커가 `cast`에 있음, 모든 스티커 id 파일이 `static/think-town/stickers/`에 있음(`fs.existsSync`). Run: `npx vitest run src && npm run check` · Expected: PASS, 0 ERRORS
- [ ] **Step 3: 눈 확인** — 주차장·매표소 각각 한 번 끝까지: 이야기 3컷 → 판 → 대화 카드(⭐ 길게 누르기, 짧게 누르면 안 됨) → 피날레 → 지도(점 하나 더, 도장 수 +1, 별 늘어남). 힌트 길게 누르기. 음소거 단추 → 새로고침 뒤 유지. 소리 재생 확인은 `paused=false`·`currentTime` 증가까지(들어 보지 못함). 스크린샷.
- [ ] **Step 4: 커밋** — `feat(think-town): 이야기·대화 카드·도장 피날레`

---

### Task 9: 마무리 검증과 배포

- [ ] **Step 1:** Run: `npx vitest run src && npm run ws:test && npm run check && npm run build && git diff --check` · Expected: 모두 통과, 빌드 성공
- [ ] **Step 2:** `npm run preview`(빌드본)로 1280×800·1280×752 다시 확인: 메뉴 → 마을 → 두 장소 각 1회, 콘솔 오류 없음, 스크롤 없음.
- [ ] **Step 3:** 푸시(전역 규칙 조건 충족 시) — `git push` 후 한 줄 보고. 사용자가 들어 보고 정할 소리 목록(배경음 1, 효과음 6)을 보고에 적는다.
