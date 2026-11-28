# 생각 마을 3단계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 👕 옷가게(경우의 수)와 ⚖️ 시소 놀이터(무게 추론)를 더해 장소 6곳을 모두 열고, 1단계·5단계를 끝낼 때마다 지도에서 그 장소가 살아나는 연출을 넣는다.

**Architecture:** 1·2단계 구조 그대로. 퍼즐 규칙은 `worksheets/lib/think/`의 순수 JS(`counting.js`에 옷 조합 생성기, 새 `seesaw.js`)에 두고, 앱 쪽 판단(입히기·사진첩, 시소 자리·시상대 판정·힌트)은 `src/lib/think-town/rules/`의 순수 TS로 vitest 검사. 화면은 기존 디오라마 부품(Board·Box3D·Doll + 그림 snippet)과 새 SVG 그림(마네킹 옷·장난감 인형). 마을 연출은 지도 판 안의 새 컴포넌트 하나.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript, vitest (`npx vitest run src`, `npm run ws:test`). 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-11-27-thinking-town-tablet-design.md` (6.3, 6.6, 7, 8, 9, 10, 13절)

## Global Constraints

- 1·2단계 계획의 Global Constraints 전부 그대로(1280×780 무대, 스크롤 없음, 새 의존성 없음, 아빠 버튼 길게 누름, 음향 규칙, 커밋 계정, 푸시 조건).
- 옷가게: 셔츠 × 바지(뒤 단계는 × 모자). 마네킹은 단순한 옷 모양(지호 그림에 옷을 겹치지 않음). 입힌 조합을 사진 찍으면 사진첩 칸에 들어감, 이미 찍은 조합이면 흔들림 + "이미 있어". 앞 단계는 사진첩 칸 수 = 답(다 채우면 성공), 뒤 단계는 칸 수를 숨기고 "다 찾았다" 버튼(틀리면 남은 수 힌트).
- 시소: 인형 3~5개의 숨은 무게, 둘을 올리면 무거운 쪽으로 기움, 잰 횟수 표시. 시상대는 잰 결과로 답이 **확정됐을 때만** 받음(확정 전 = 시소 흔들림 + "아직 확실하지 않아"). 숨은 무게는 정하지 않고, 잴 때마다 답이 가장 늦게 정해지는 쪽 결과. 최대 횟수를 넘겨도 끝까지 풀 수 있고, 횟수 안이면 별 하나 더.
- 살아나는 모습은 장소마다 두 번: 1단계 끝 = 기본 움직임(주차장 차가 다님, 공방 굴뚝 연기, 옷가게 진열장, 기차가 지나감, 꽃이 핌, 시소에 아이들), 5단계 끝 = 장식 더한 완성 모습 + 깃발. 장면 12개.
- 기존 주차장·줄 세우기·블록·정원 퍼즐 JSON은 한 글자도 바뀌지 않는다(지호 기기 cursor).
- 새 효과음 없음(아래 "Claude가 정한 것").

## Claude가 정한 것 (기획서에 없는 세부)

- **옷가게 단계표**: 1 = 셔츠×바지 4~6가지(2×2, 2×3, 3×2), 2 = 8~9가지(3×3, 2×4, 4×2), 3 = 모자까지 2×2×2 = 8가지, 4 = 칸 숨김 6~9가지(2×3, 3×2, 3×3), 5 = 칸 숨김 + 모자 8~12가지(2×2×2, 3×2×2, 2×3×2). 칸 보임 = 단계 1~3.
- 기획서의 "아이스크림 맛·기차 칸 순서"는 고르지 않고 모자로 통일(조작이 같아 한 장소 안에서 헷갈리지 않음).
- 옷 색: 셔츠 빨강·파랑·노랑·초록, 바지 남색·갈색·회색·분홍, 모자 주황·보라·청록. 색 이름 글자 없이 색 칸만.
- 옷가게 조작: 왼쪽 옷걸이 칸(모자·셔츠·바지 열)을 누르면 마네킹이 바로 입음, 📷 버튼으로 찍기. 덜 입었으면 'bump' + 마네킹 흔들림 + 빠진 옷 열이 반짝. 칸 숨김 단계는 다 찍어도 자동 성공하지 않음("더 없다"를 스스로 판단하는 것이 핵심). 별 하나 더 없음(기획서 7절 목록에 없음).
- 옷가게 힌트: 차례(셔츠 → 바지 → 모자 순)대로 아직 안 찍은 첫 조합을 마네킹에 입히고 📷 버튼이 반짝(찍지는 않음). 다 찍었으면 "다 찾았다" 버튼이 반짝.
- **시소 단계표**: 1 = 3개 중 가장 무거운 것(최대 2번), 2 = 4개 중 가장 무거운 것(3번), 3 = 3개 순서(3번), 4 = 4개 순서(5번), 5 = 5개 중 가장 무거운 것(4번)과 4개 순서(5번)를 번갈아. 최대 횟수 = 가장 무거운 것은 n−1, 순서는 ⌈log₂ n!⌉. 5개 순서(7번)는 6살에게 거의 불가능한 전략이라 뺌.
- 시소 인형은 크기가 같은 장난감 5종(토끼·오리·개구리·펭귄·돼지, SVG). 가족 스티커를 쓰면 "아빠가 당연히 무겁지" 같은 실제 지식이 끼어들어서.
- 시소 조작: 아래 도구 **⚖️ 재기 / 🏆 시상대** 중 하나(블록의 쌓기/빼기와 같은 모양). 재기: 의자 인형을 누르면 시소 왼쪽→오른쪽 자리에 앉음, 둘이 앉으면 기울고 결과가 오른쪽 기록에 쌓임. 둘 다 앉은 채 다른 인형을 누르면 둘 다 내려오고 새 인형이 왼쪽에. 앉은 인형을 누르면 내려옴. 이미 잰 쌍은 같은 결과만 보여 주고 횟수는 그대로. 시상대: 무거운 순서대로 누르면 단에 올라감, 칸이 다 차면 판정.
- 시소 결과 고르기: 두 결과 중 (남는 답 가짓수, 남는 순서 수)가 큰 쪽, 같으면 판마다 무작위로 정한 숨은 순서(bias)를 따름 — "늘 왼쪽이 내려간다" 같은 버릇이 안 보이게.
- 시소 힌트: 잰 결과로 아직 모르는 쌍 중 (나쁜 쪽 결과에서 남는 답 가짓수, 남는 순서 수)가 가장 작은 쌍의 두 인형이 반짝. 확정됐으면 🏆 버튼이 반짝.
- **소리**: 라이브러리(카탈로그·Gamemaster 묶음)에 카메라 셔터가 없어 새 소리 없이 기존 6개 재사용 — 옷 입히기 'drop', 사진 'stamp', 이미 있음·덜 입음·확실하지 않음 'bump', 시소 내려앉음 'stamp', 틀린 시상대·틀린 "다 찾았다" 'error', 살아나는 연출 'success'.
- **마을 연출**: 지도 판 위에 코드로 그림(Box3D·SVG, 기존 지도와 같은 상자 그림체). 장소를 끝내고 마을로 돌아왔을 때 살아나는 수준(0/1/2)이 올랐으면 그 장소 새 장식이 통통 튀어 나오고 그 자리에서 폭죽, 위쪽에 "🚗 주차장이 살아났어요!" / "🚗 주차장 완성!" 3초, 'success'. 2~4단계 끝, 5단계 뒤 계속하기는 연출 없음.
- 공사 중 울타리 코드는 그대로 둔다(모든 장소가 열려 보이지 않을 뿐, 지우면 diff만 커짐).

## Review Focus

1. **시소 같은 쌍·이미 알 수 있는 쌍**: 같은 쌍을 다시 재면 횟수가 늘지 않고 같은 결과, 추론으로 이미 정해진 쌍은 그 결과로 나오고 횟수는 늘어남 → `seesaw-play` 테스트(Task 2).
2. **시소 찍어서 맞히기**: 확정 전 시상대는 맞는 순서여도 'unsure', 확정 뒤 틀리면 'wrong' → `checkPodium` 테스트(Task 2).
3. **어떻게 재도 모순 없음**: 아무 쌍이나 무작위로 재도 남은 순서가 비지 않고 결과가 앞뒤 맞음, 힌트대로 재면 최대 횟수 안 → `seesaw.js` 무작위·시뮬레이션 테스트(Task 2).
4. **옷가게 덜 입힘·같은 조합·숨김 단계 판정**: 덜 입었거나 같은 조합이면 사진첩이 그대로, "다 찾았다"는 다 찍었을 때만 성공(아니면 남은 수) → `clothes-play` 테스트(Task 1), Task 4 브라우저.
5. **연출은 1·5단계에서만 한 번**: 2~4단계 끝·5단계 뒤 계속하기·중간에 나가기는 연출 없음 → `newlyAlive` 테스트(Task 6), 브라우저.

---

### Task 1: 옷가게 규칙·퍼즐

**Files:**
- Modify: `worksheets/lib/think/counting.js` (끝에 옷 조합 추가, 다른 줄 그대로) · Create: `worksheets/lib/think/counting.d.ts`
- Test: `worksheets/tests/think-counting.test.js` (describe 하나 추가)
- Create: `src/lib/think-town/rules/clothes-play.ts` · Test: `src/lib/think-town/rules/clothes-play.test.ts`
- Modify: `worksheets/tools/make-town-puzzles.js` (clothes 풀 추가) · `src/lib/think-town/data/puzzles.json` (도구로 다시 씀) · Test: `src/lib/think-town/data/puzzles.test.ts`

**Interfaces:**
- Produces (`counting.js`):
  - `OUTFIT_COLORS = { shirt: ['red','blue','yellow','green'], pants: ['navy','brown','gray','pink'], hat: ['orange','purple','teal'] }`
  - `OUTFIT_SIZES: Record<1..5, number[][]>` (위 단계표, [셔츠, 바지(, 모자)] 수)
  - `type Outfits = { shirt: string[]; pants: string[]; hat?: string[] }`
  - `listOutfits(p: Outfits): string[][]` — 셔츠 → 바지 → 모자 순으로 늘어놓은 모든 조합(각 [shirt, pants(, hat)])
  - `generateOutfit(rng, stage, used: Set<string>): Outfits` — 크기는 `OUTFIT_SIZES[stage]`에서, 색은 팔레트에서 골라 팔레트 순서대로, `JSON.stringify` 결과가 used에 없을 때까지
- Produces (`clothes-play.ts`):
  - `type Part = 'shirt' | 'pants' | 'hat'`, `type Outfit = Record<Part, string | null>`, `NO_OUTFIT: Outfit`
  - `partsOf(p): Part[]` (['shirt','pants'] 또는 + 'hat'), `totalOutfits(p): number`, `slotsShown(stage): boolean` (stage ≤ 3)
  - `wear(o, part, color): Outfit` (같은 옷이면 o 그대로)
  - `takePhoto(album: string[], o, p): { album: string[]; result: 'incomplete' | 'dup' | 'new'; index: number; missing: Part[] }` — 열쇠 = partsOf 순서로 `|` 이음, incomplete·dup이면 album 그대로(같은 참조)
  - `remaining(album, p): number`, `clothesHint(album, p): Outfit | null`
  - `OUTFIT_HEX: Record<string, string>` (색 id → 색값)
- Produces (JSON): `P.clothes: Outfits[][]` (12·12·12·12·40)

- [ ] **Step 1: 실패하는 테스트**

```js
// think-counting.test.js
describe('옷 조합', () => {
  it('셔츠 × 바지 (× 모자) 모든 조합을 차례대로', () => {
    expect(listOutfits({ shirt: ['red', 'blue'], pants: ['navy', 'gray', 'pink'] })).toHaveLength(6);
    const three = listOutfits({ shirt: ['red', 'blue'], pants: ['navy', 'gray'], hat: ['orange', 'teal'] });
    expect(three).toHaveLength(8);
    expect(three.slice(0, 2)).toEqual([['red', 'navy', 'orange'], ['red', 'navy', 'teal']]);
  });
  it('단계 크기·팔레트 색·겹치지 않음', () => {
    for (let stage = 1; stage <= 5; stage++) {
      const rng = makeRng(stage), used = new Set();
      for (let k = 0; k < 12; k++) {
        const p = generateOutfit(rng, stage, used); used.add(JSON.stringify(p));
        const sizes = [p.shirt.length, p.pants.length, ...(p.hat ? [p.hat.length] : [])];
        expect(OUTFIT_SIZES[stage]).toContainEqual(sizes);
        for (const part of ['shirt', 'pants', 'hat']) (p[part] ?? []).forEach((c) => expect(OUTFIT_COLORS[part]).toContain(c));
      }
      expect(used.size).toBe(12);
    }
  });
});
```

```ts
// clothes-play.test.ts
const P2 = { shirt: ['red', 'blue'], pants: ['navy', 'gray'] };
const P3 = { ...P2, hat: ['orange', 'teal'] };
const fit = (shirt, pants, hat = null) => ({ shirt, pants, hat });
it('부분·전체 수·칸 보임', () => {
  expect(partsOf(P2)).toEqual(['shirt', 'pants']); expect(partsOf(P3)).toEqual(['shirt', 'pants', 'hat']);
  expect(totalOutfits(P3)).toBe(8); expect(slotsShown(3)).toBe(true); expect(slotsShown(4)).toBe(false);
});
it('입히기: 같은 옷이면 그대로', () => {
  const o = wear(NO_OUTFIT, 'shirt', 'red'); expect(o.shirt).toBe('red'); expect(wear(o, 'shirt', 'red')).toBe(o);
});
it('사진: 덜 입음·같은 조합은 사진첩 그대로, 새 조합은 들어감', () => {
  const a0: string[] = [];
  const miss = takePhoto(a0, fit('red', null), P3);
  expect(miss.result).toBe('incomplete'); expect(miss.missing).toEqual(['pants', 'hat']); expect(miss.album).toBe(a0);
  const one = takePhoto(a0, fit('red', 'navy'), P2); expect(one).toMatchObject({ result: 'new', index: 0, album: ['red|navy'] });
  const dup = takePhoto(one.album, fit('red', 'navy'), P2); expect(dup.result).toBe('dup'); expect(dup.index).toBe(0); expect(dup.album).toBe(one.album);
});
it('남은 수와 힌트(차례대로 안 찍은 첫 조합)', () => {
  expect(remaining(['red|navy'], P2)).toBe(3);
  expect(clothesHint(['red|navy'], P2)).toEqual(fit('red', 'gray'));
  expect(clothesHint(['red|navy', 'red|gray', 'blue|navy', 'blue|gray'], P2)).toBeNull();
});
```

```ts
// puzzles.test.ts
it('옷가게: 단계마다 개수·크기, 앱 안에서 겹치지 않음', () => {
  expect(P.clothes.map((s) => s.length)).toEqual([12, 12, 12, 12, 40]);
  P.clothes.forEach((pool, s) => pool.forEach((p) => {
    expect(OUTFIT_SIZES[s + 1]).toContainEqual([p.shirt.length, p.pants.length, ...(p.hat ? [p.hat.length] : [])]);
  }));
  const keys = P.clothes.flat().map((p) => JSON.stringify(p)); expect(new Set(keys).size).toBe(keys.length);
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm run ws:test -- think-counting && npx vitest run src/lib/think-town/rules/clothes-play.test.ts src/lib/think-town/data` / Expected: FAIL (함수·P.clothes 없음)
- [ ] **Step 3: 구현** — 위 Interfaces. 생성기: `OUTFIT_SIZES[stage]`에서 크기 하나, 목록마다 팔레트를 섞어 앞 k개를 팔레트 순서로. 도구: seed `20264127 + stage`, 앞서 만든 옷 조합을 used에 넣음, 출력 `{ parking, lineup, blocks, garden, clothes }`. 학습지 경우의 수와는 겹칠 수 없는 형태라 학습지 비교는 없음.
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS. `git show HEAD:src/lib/think-town/data/puzzles.json`의 parking·lineup·blocks·garden이 새 파일과 같음(`node -e`), `npx svelte-check` 오류 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 옷가게 규칙·퍼즐`

### Task 2: 시소 규칙

**Files:**
- Create: `worksheets/lib/think/seesaw.js`, `worksheets/lib/think/seesaw.d.ts` · Test: `worksheets/tests/think-seesaw.test.js`
- Create: `src/lib/think-town/rules/seesaw-play.ts` · Test: `src/lib/think-town/rules/seesaw-play.test.ts`
- Create: `src/lib/think-town/data/seesaw.ts` (장난감·단계별 판 목록)

**Interfaces:**
- Produces (`seesaw.js`, 인형은 0..n−1 번호, 순서는 무거운 것부터):
  - `type Goal = 'top' | 'order'`, `SEESAW_STAGES: Record<1..5, { n: number; goal: Goal }[]>` (위 단계표)
  - `orders(n): number[][]` (사전 순), `keep(list, heavy, light): number[][]`
  - `answerKey(order, goal): string` ('top' = 첫 번호, 'order' = 전체), `isDecided(list, goal): boolean`
  - `maxWeighings(n, goal): number` ('top' n−1, 'order' ⌈log₂ n!⌉)
  - `weighResult(list, a, b, goal, bias: number[]): number` — 무거운 쪽 번호(위 결과 고르기 규칙)
  - `bestPair(list, goal): [number, number] | null` — 위 힌트 규칙, 같으면 (i, j) 사전 순 첫 쌍, 확정이면 null
- Produces (`seesaw-play.ts`):
  - `type Weigh = { heavy: number; light: number }`
  - `type Seesaw = { n: number; goal: Goal; max: number; bias: number[]; list: number[][]; results: Weigh[] }`
  - `startSeesaw(n, goal, bias): Seesaw`
  - `weigh(s, a, b): { s: Seesaw; heavy: number; repeat: boolean }` (이미 잰 쌍이면 s 그대로, repeat true)
  - `checkPodium(s, podium: number[]): 'unsure' | 'wrong' | 'right'` (podium = 무거운 것부터, 'top'은 1칸·'order'는 n칸)
  - `seesawHint(s): [number, number] | null`, `podiumSlots(s): number`
- Produces (`data/seesaw.ts`): `TOYS = ['rabbit','duck','frog','penguin','pig']`, `type SeesawPuzzle = { goal: Goal; cast: string[] }`, `SEESAW_POOLS: SeesawPuzzle[][]` (단계마다 그 단계 설정 × 장난감 조합(사전 순), 단계 5는 두 설정을 번갈아; 각 풀 길이 ≥ 그 단계 판 수)

- [ ] **Step 1: 실패하는 테스트**

```js
// think-seesaw.test.js
it('순서 목록·거르기·최대 횟수', () => {
  expect(orders(3)).toHaveLength(6); expect(orders(4)).toHaveLength(24); expect(orders(3)[0]).toEqual([0, 1, 2]);
  expect(keep(orders(3), 0, 1).every((o) => o.indexOf(0) < o.indexOf(1))).toBe(true);
  expect([maxWeighings(3, 'top'), maxWeighings(4, 'top'), maxWeighings(5, 'top')]).toEqual([2, 3, 4]);
  expect([maxWeighings(3, 'order'), maxWeighings(4, 'order')]).toEqual([3, 5]);
});
it('확정 판정', () => {
  const l = keep(keep(orders(3), 0, 1), 0, 2);
  expect(isDecided(l, 'top')).toBe(true); expect(isDecided(l, 'order')).toBe(false);
});
it('결과: 답을 늦게 정하는 쪽, 같으면 bias, 이미 정해진 쌍은 그대로', () => {
  expect(weighResult(orders(3), 0, 1, 'top', [1, 0, 2])).toBe(1);
  expect(weighResult(orders(3), 0, 1, 'top', [0, 1, 2])).toBe(0);
  expect(weighResult(keep(orders(3), 0, 1), 0, 2, 'top', [2, 0, 1])).toBe(0);   // 순서 2개 남는 쪽
  expect(weighResult(keep(keep(orders(3), 0, 1), 1, 2), 2, 0, 'order', [2, 1, 0])).toBe(0);
});
it('무작위로 재도 모순 없음 (200판)', () => {
  // n 3~5, goal 둘, 아무 쌍이나 골라 weighResult → keep; 남은 목록은 늘 비지 않고, C(n,2)번 안에 확정
});
it('힌트대로 재면 최대 횟수 안에 끝남', () => {
  for (const [n, goal] of [[3, 'top'], [4, 'top'], [5, 'top'], [3, 'order'], [4, 'order']]) {
    for (const bias of [[...Array(n).keys()], [...Array(n).keys()].reverse()]) {
      let list = orders(n), count = 0;
      while (!isDecided(list, goal)) { const [a, b] = bestPair(list, goal); const h = weighResult(list, a, b, goal, bias); list = keep(list, h, h === a ? b : a); count++; }
      expect(count).toBeLessThanOrEqual(maxWeighings(n, goal));
    }
  }
});
it('힌트 쌍', () => {
  expect(bestPair(orders(3), 'top')).toEqual([0, 1]);
  expect(bestPair(keep(orders(3), 0, 1), 'top')).toEqual([0, 2]);
  expect(bestPair(keep(keep(orders(3), 0, 1), 0, 2), 'top')).toBeNull();
});
```

```ts
// seesaw-play.test.ts
it('같은 쌍 다시 재면 횟수 그대로·같은 결과', () => {
  const r1 = weigh(startSeesaw(3, 'top', [0, 1, 2]), 0, 1);
  expect(r1.s.results).toEqual([{ heavy: 0, light: 1 }]);
  const r2 = weigh(r1.s, 1, 0); expect(r2.repeat).toBe(true); expect(r2.heavy).toBe(0); expect(r2.s).toBe(r1.s);
});
it('이미 알 수 있는 쌍도 재면 횟수가 늘고 결과는 맞음', () => {
  let s = startSeesaw(3, 'order', [2, 1, 0]);
  s = weigh(s, 0, 1).s; s = weigh(s, 1, 2).s;          // bias 반대여도 결과는 지금까지와 맞게
  const h = s.results.map((r) => r.heavy);
  const r = weigh(s, 0, 2); expect(r.s.results).toHaveLength(3); expect(r.s.list.length).toBeGreaterThan(0);
});
it('시상대: 확정 전 unsure, 확정 뒤 맞으면 right·틀리면 wrong', () => {
  let s = startSeesaw(3, 'top', [0, 1, 2]);
  expect(checkPodium(s, [0])).toBe('unsure');
  s = weigh(s, 0, 1).s; s = weigh(s, 0, 2).s;           // bias가 0을 가장 무겁게
  expect(checkPodium(s, [0])).toBe('right'); expect(checkPodium(s, [2])).toBe('wrong');
  expect(podiumSlots(s)).toBe(1); expect(podiumSlots(startSeesaw(4, 'order', [0, 1, 2, 3]))).toBe(4);
});
it('판 목록: 단계 설정과 같고 장난감이 겹치지 않음', () => {
  SEESAW_POOLS.forEach((pool, i) => {
    expect(pool.length).toBeGreaterThanOrEqual(BOARDS_PER_STAGE[i]);
    pool.forEach((p) => { expect(new Set(p.cast).size).toBe(p.cast.length); expect(SEESAW_STAGES[i + 1]).toContainEqual({ n: p.cast.length, goal: p.goal }); });
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm run ws:test -- think-seesaw && npx vitest run src/lib/think-town/rules/seesaw-play.test.ts` / Expected: FAIL (모듈 없음)
- [ ] **Step 3: 구현** — 위 Interfaces와 Claude가 정한 규칙대로. 같은 쌍 판정은 `results`에서 {a,b} 짝 찾기.
- [ ] **Step 4: 통과 확인** — 같은 명령 PASS, `npx svelte-check` 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 시소 놀이터 무게 추론 규칙`

### Task 3: 이야기·옷·장난감 그림

**Files:**
- Modify: `src/lib/think-town/data/stories.ts` (clothes·seesaw 5단계 × 3컷) · Test: `stories.test.ts` (장소 6곳 모두)
- Create: `src/lib/think-town/art/OutfitArt.svelte` (props `shirt`, `pants`, `hat`: 색 id 또는 null — 받침대 위 나무 마네킹, 안 입은 부분은 연한 나무색 점선)
- Create: `src/lib/think-town/art/ToyArt.svelte` (props `kind`: TOYS 하나 — 같은 크기 둥근 몸, 귀·부리·코로만 구별)
- Modify: `src/lib/think-town/StoryScene.svelte` (옷가게: 분홍 바닥 + 옷 입은 마네킹 줄, 시소: 모래 바닥 + 시소 + 장난감)

- [ ] **Step 1: 테스트 고침** — 첫 테스트를 `PLACE_IDS` 6곳 모두로. Run `npx vitest run src/lib/think-town/data/stories.test.ts` / Expected: FAIL (clothes 없음)
- [ ] **Step 2: 이야기** — 옷가게(감돌이가 가게 주인, 지호·아빠·사랑이): 1 셔츠·바지 사진 찍기, 2 바지가 더 들어옴, 3 모자 등장, 4 사진첩 칸이 사라짐(몇 장인지 스스로), 5 패션쇼. 시소(사랑이·지호·감돌이·아빠): 1 누가 가장 무거울까, 2 친구 하나 더, 3 무거운 순서, 4 넷 줄 세우기, 5 시소 대회. 말풍선 40자 안, 3컷째 질문.
- [ ] **Step 3: 그림·이야기 판** — OutfitArt·ToyArt를 Doll children으로 세움.
- [ ] **Step 4: 통과** — `npx vitest run src` PASS, `npx svelte-check` 0. 이야기 화면 눈 확인은 Task 4·5에서.
- [ ] **Step 5: 커밋** — `feat(think-town): 옷가게·시소 이야기와 그림`

### Task 4: 👕 옷가게 화면

**Files:**
- Create: `src/lib/think-town/places/ClothesPlace.svelte`
- Modify: `src/lib/think-town/PlaceRun.svelte` (clothes 풀 — 조합 수 적은 판부터 — 분기, `stage` 전달) · `src/lib/think-town/data/places.ts` (clothes built)

**Interfaces:**
- Consumes: Task 1 `clothes-play.ts`, Task 3 `OutfitArt`.
- Produces: `ClothesPlace` props `{ puzzle: Outfits; stage: number; onSolved: (r: { bonus: boolean }) => void }`, `export function hint()`.

- [ ] **Step 1: 화면** — 왼쪽 옷걸이 판(열: 모자(있을 때)·셔츠·바지, 칸 92px 이상, 고른 칸 파란 테두리), 가운데 작은 가게 판 위 큰 마네킹(Doll + OutfitArt), 그 아래 📷 찰칵 버튼. 오른쪽 사진첩: 칸 보임 = 답 수만큼 빈 액자(4열), 숨김 = 찍은 사진 + 점선 액자 하나 + "다 찾았다!" 버튼. 머리글 "사진첩 n / N" 또는 "사진 n장".
- [ ] **Step 2: 동작** — 위 "Claude가 정한 것"대로. 새 사진 = 'stamp' + 가게 판 흰 번쩍임 + 사진이 통 튀며 들어감. 칸 보임 단계는 다 차면 성공(한 번), 숨김 단계는 "다 찾았다!" → 맞으면 성공, 아니면 'error' + 버튼 흔들림 + "아직 n개 더 있어!". 성공 = 사진들이 물결처럼 통통 + `onSolved({ bonus: false })`, 이후 조작 막음.
- [ ] **Step 3: 연결** — PlaceRun·places.ts.
- [ ] **Step 4: 브라우저 확인 (800×500 + 1280×752·1024×768 수치)** — 이야기 3컷 → 1단계 판마다: 입히기, 덜 입고 찍기, 같은 조합 다시 찍기(Review Focus 4), 힌트, 다 채워 성공. 4단계(저장값 cleared=3으로): 다 찍기 전 "다 찾았다" → 남은 수, 다 찍고 → 성공 한 번. 대화 카드 → 도장. 콘솔 오류 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 옷가게 사진첩 경우의 수`

### Task 5: ⚖️ 시소 놀이터 화면

**Files:**
- Create: `src/lib/think-town/places/SeesawPlace.svelte`
- Modify: `src/lib/think-town/PlaceRun.svelte` (`SEESAW_POOLS` 꺼내기·분기) · `src/lib/think-town/data/places.ts` (seesaw built)

**Interfaces:**
- Consumes: Task 2 `seesaw-play.ts`·`data/seesaw.ts`, Task 3 `ToyArt`.
- Produces: `SeesawPlace` props `{ puzzle: SeesawPuzzle; onSolved: (r: { bonus: boolean }) => void }`, `export function hint()`.

- [ ] **Step 1: 화면** — 왼쪽 놀이터 판: 가운데 시소(받침 + 널빤지, 널빤지는 받침 위에서 기울기 ±12°, 0.6초), 앞쪽 의자에 인형 n개(제자리 고정), 오른쪽 시상대 단('top' 1칸, 'order' n칸 계단, 윗면에 1·2·3…). 인형은 모두 한 부모 안 Doll(위치가 바뀌면 transform 전환으로 날아감), 시소 위 인형 높이는 기울기에 맞춰 계산. 오른쪽 패널: 목표 알약("🏆 가장 무거운 친구" / "🏆 무거운 순서대로"), 잰 기록 카드(2열 × 5줄, 작은 시소에 두 얼굴, 무거운 쪽 아래), "⚖️ n번 · m번 안에 ⭐". 아래 도구: ⚖️ 재기 / 🏆 시상대.
- [ ] **Step 2: 동작** — 위 "Claude가 정한 것"대로. 둘이 앉으면 0.25초 뒤 기울고 내려앉을 때 'stamp', 이미 잰 쌍은 "이미 쟀어" 꼬리표만. 시상대 칸이 다 차면 0.4초 뒤 판정: unsure = 시소 흔들림 + "아직 확실하지 않아" 꼬리표 + 'bump' + 인형 의자로, wrong = 'error' + 시상대 흔들림 + 의자로, right = 인형들이 통통 + `onSolved({ bonus: count ≤ max })`. 시상대 모드로 바꾸면 시소 위 인형은 의자로. 판마다 bias = 무작위 순서.
- [ ] **Step 3: 연결** — PlaceRun·places.ts.
- [ ] **Step 4: 브라우저 확인** — 이야기 → 1단계: 재기(기울기 방향이 기록과 같음), 같은 쌍 다시, 확정 전 시상대(Review Focus 2), 힌트 반짝, 횟수 안 성공 = 별 2. 4단계(cleared=3): 순서 시상대 4칸, 틀린 순서 'wrong'. 대화 카드 → 도장. 콘솔 오류 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 시소 놀이터 무게 추론`

### Task 6: 마을이 살아나는 연출

**Files:**
- Modify: `src/lib/think-town/rules/progress.ts` (`aliveLevel`, `newlyAlive`) · Test: `progress.test.ts`
- Create: `src/lib/think-town/TownLife.svelte` (지도 Board 안: 장소별 수준 1·2 장식)
- Modify: `src/lib/think-town/TownMap.svelte` (`celebrate` prop, TownLife 넣기, 시소 장소의 멈춘 널빤지는 수준 0일 때만, 축하 띠·폭죽) · `src/lib/think-town/ThinkTown.svelte` (들어갈 때 수준 기억, 나올 때 비교)

**Interfaces:**
- Produces: `aliveLevel(cleared: number): 0 | 1 | 2` (0 / ≥1 / ≥5), `newlyAlive(before: number, after: number): 0 | 1 | 2` (cleared 전후 → 올라간 수준, 아니면 0).
- Produces: `TownMap` props `{ onEnter; celebrate?: { id: PlaceId; level: 1 | 2 } | null }`, `TownLife` props `{ levels: Record<PlaceId, 0 | 1 | 2>; celebrate: PlaceId | null }`.

- [ ] **Step 1: 실패하는 테스트**

```ts
it('살아나는 수준: 1단계·5단계에서만 오름', () => {
  expect([0, 1, 2, 4, 5].map(aliveLevel)).toEqual([0, 1, 1, 1, 2]);
  expect(newlyAlive(0, 1)).toBe(1); expect(newlyAlive(4, 5)).toBe(2);
  expect(newlyAlive(1, 2)).toBe(0); expect(newlyAlive(5, 5)).toBe(0); expect(newlyAlive(2, 2)).toBe(0);
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/lib/think-town/rules/progress.test.ts` / Expected: FAIL
- [ ] **Step 3: 구현** — 장면(수준 2는 수준 1 위에 더함, 깃발은 장소 모퉁이 기둥 + 펄럭이는 SVG 깃발):
  - 주차장: 1 작은 차가 주차장 둘레를 돎 / 2 고깔 줄 + 깃발
  - 블록 공방: 1 지붕 굴뚝 + 피어오르는 연기 / 2 알록달록 블록 탑 + 깃발
  - 옷가게: 1 줄무늬 차양 + 진열장 작은 마네킹(OutfitArt) / 2 둥실 풍선 + 깃발
  - 기차역: 1 기차가 레일을 따라 지나감(판 끝에서 흐려짐) / 2 승강장 지붕 + 시계 + 깃발
  - 정원: 1 꽃이 피어 흔들림(FlowerArt) / 2 나비 + 꽃 아치 + 깃발
  - 시소: 1 시소가 오르내리고 장난감 둘이 탐(ToyArt) / 2 미끄럼틀 + 깃발
  - 움직임은 transform·opacity 개별 속성(translate/rotate/scale) CSS 애니메이션만(탭 S6).
  - ThinkTown: 들어갈 때 `cleared` 기억 → 나올 때(도장 뒤 "마을로"든 위 "← 마을"이든) `newlyAlive` > 0이면 `celebrate` 4초. TownMap: 그 장소 새 장식에 `pop-in`(차례로 통 튀어 나옴), 이름표 자리에서 폭죽(canvas-confetti), 위쪽 띠 "🚗 주차장이 살아났어요!" / "🚗 주차장 완성!" 3초, 'success'.
- [ ] **Step 4: 통과 + 브라우저 확인** — 테스트 PASS. 저장값으로 수준 0·1·2 지도 모습 12장면 확인(겹침·잘림 없음), 1단계 끝 → 마을 연출, 2단계 끝 → 연출 없음. 콘솔 오류 0.
- [ ] **Step 5: 커밋** — `feat(think-town): 마을이 살아나는 연출`

### Task 7: 마무리

- [ ] `npx vitest run src`, `npm run ws:test`, `npx svelte-check`, `npm run build`, `git diff --check` 모두 통과.
- [ ] 최종 검토(가장 좋은 모델 새 눈) → 중요 지적은 재현 테스트 RED→GREEN으로 한 번에 고침.
- [ ] 브라우저 확인을 마쳤으면 푸시, 한 줄 보고.
