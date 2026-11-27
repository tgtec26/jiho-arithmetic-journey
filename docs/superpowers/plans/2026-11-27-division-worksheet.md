# 나눗셈 이야기 학습지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 곱셈 학습지와 같은 틀·등장인물로 두 자리 ÷ 한 자리 나눗셈 학습지 24회 + 정답지를 만들고, 빌드·어드민에서 곱셈/나눗셈 세트를 고를 수 있게 한다.

**Architecture:** 숫자 규칙(`lib/division.js`)과 문제 칸(`lib/render-division.js`)은 새 파일. 만화·말풍선은 그대로 재사용. 페이지·정답지는 공통 틀을 뽑아 두 세트가 같이 쓰고, `lib/sets.js`가 세트별 데이터 폴더·검증·렌더러·출력 폴더를 묶어 빌드와 어드민에 넘긴다.

**Tech Stack:** Node 25 ESM, vitest 4 (`npm run ws:test`), HTML/CSS mm 단위, 크롬 헤드리스 PDF, Codex CLI 그림.

**Spec:** `docs/superpowers/specs/2026-11-27-division-worksheet-design.md`

## Global Constraints

- 문제 칸 94 × 86mm, A4 양면 1장 = 1회, 앞면 만화 + ①②, 뒷면 ③~⑧.
- 회차마다 나누는 수 고정, 몫은 항상 두 자리(나누어지는 수의 십의 자리 ≥ 나누는 수).
- 단계: 1~6회 ÷2·3·4 / 7~14회 ÷2~5 / 15~24회 ÷3~9, 8·9는 각각 한 회.
- 1~14회: 나머지 없음, 몫의 일의 자리 0 없음. 15회부터 나머지·몫 0 섞음.
- 1~6회 내림은 뒤쪽에만(⑦⑧, 아래 Ruling 참고).
- 정렬: 내림 없음 → 내림 → 나머지, 같으면 나누어지는 수 작은 순.
- 힌트 4단계: 1~6 / 7~14 / 15~20 / 21~24 (곱셈 `hintLevel` 그대로).
- 말풍선: 화자 필수, 40자 이하, 4번 컷 마지막은 `?`.
- 곱셈 세트의 결과물(경로·모양)은 바뀌지 않는다.
- 커밋 계정 `tgtec26` / `tgtec26@snu-g.ms.kr`.

## Rulings (계획 단계에서 정한 것)

- ÷4는 몫 두 자리·나머지 없음·몫 0 없음·내림 없음인 수가 44·48·84·88 넷뿐이라 ÷4 회차(6회)는 내림 문제를 ⑤부터 둔다. 검사 규칙: 1단계 내림은 ⑤번 이후, 고르기는 내림 없는 수를 최대 5개 먼저 → ÷2·3 회차는 ⑦⑧만 내림.
- 15~24회는 모든 문제가 `… [ ]` 나머지 칸과 `확인: [ ] × d + [ ] = n`을 쓴다(나머지 칸 유무로 답을 알려 주지 않으려고). 이야기 답의 "남는 것" 칸은 이야기 문제에 나머지가 있을 때만.
- 나머지가 있는 이야기는 몫 단위와 남는 것 단위가 다를 수 있어(16번, 2알) `story.restUnit`을 둔다.
- 세로식은 6줄(몫 / 나누는 수)나누어지는 수 / 십의 자리 곱 / 빼고 내린 수 / 일의 자리 곱 / 나머지), 칸 9 × 8mm. 1단계 힌트는 "빼고 내린 수" 줄 일의 자리에 회색 숫자(곱셈의 회색 0과 같은 자리 안내).
- 머리줄 색: 나눗셈은 `#4a7fc1`.
- 출력: `out/html/division/`, `out/pdf/division/`. 곱셈 경로는 그대로.

## Review Focus

- 몫의 일의 자리가 0인 문제(62÷3, 85÷8)에서 쪼개기·세로식·정답지가 `60 + 2`, `2 ÷ 3 = 0 … 2`로 맞게 나오는가.
- 나머지 있는 이야기 문제의 답 칸·정답지 단위(`16번, 2알`).
- 어드민에서 세트를 바꿔도 다른 세트 파일을 덮어쓰지 않는가(같은 id 1~24가 두 세트에 있음).
- 빌드 `--set=div`가 곱셈 출력 폴더를 지우거나 덮지 않는가.
- 15~24회 왼쪽 칸(나머지 칸 포함)이 59mm 폭 안에 들어가는가 — PDF로 눈 확인.

---

### Task 1: 나눗셈 숫자 규칙

**Files:**
- Create: `worksheets/lib/division.js`
- Test: `worksheets/tests/division.test.js`

**Interfaces:**
- Produces:
  - `DIVISORS: {1: number[], 2: number[], 3: number[]}` = `{1:[2,3,4], 2:[2,3,4,5], 3:[3,4,5,6,7,8,9]}`
  - `analyzeDiv(n, d) → { quotient, remainder, tensQ, onesQ, firstPart, secondPart, tensProduct, onesProduct, carry }` — `firstPart = d*tensQ*10`, `secondPart = n - firstPart`(= 빼고 내린 수), `tensProduct = d*tensQ`, `onesProduct = d*onesQ`, `carry = 십의 자리 - tensProduct > 0`.
  - `checkDivProblem(stage, n, d, position) → string[]`
  - `pickDivPractice(d, storyN, stage) → number[7]`
  - `divSortKey(n, d) → [remainder>0?1:0, carry?1:0, n]`

- [ ] **Step 1: 실패하는 테스트 작성** — `DIV_EPISODE_TABLE` = `[id, d, n]`:
  `[1,2,26],[2,3,36],[3,2,64],[4,3,39],[5,2,48],[6,4,48],[7,4,52],[8,3,45],[9,5,75],[10,2,72],[11,3,69],[12,5,90],[13,4,96],[14,2,58],[15,3,50],[16,4,70],[17,6,84],[18,5,63],[19,7,91],[20,8,85],[21,6,75],[22,7,80],[23,9,96],[24,5,87]`
  - `analyzeDiv(48,3)` → quotient 16, remainder 0, tensQ 1, onesQ 6, firstPart 30, secondPart 18, tensProduct 3, onesProduct 18, carry true.
  - `analyzeDiv(26,2)` → firstPart 20, secondPart 6, carry false.
  - `analyzeDiv(62,3)` → quotient 20, remainder 2, onesQ 0, firstPart 60, secondPart 2, onesProduct 0, carry false.
  - `analyzeDiv(50,3)` → firstPart 30, secondPart 20, quotient 16, remainder 2.
  - `analyzeDiv(96,8)` → firstPart 80, secondPart 16, quotient 12.
  - `checkDivProblem`: (1, 37, 3, 2) 나머지 → 오류; (1, 26, 6, 2) 나누는 수 범위 밖 → 오류; (1, 18, 2, 2) 몫 한 자리 → 오류; (2, 60, 3, 2) 몫 0 → 오류; (1, 52, 4, 3) 내림 ③ → 오류; (1, 52, 4, 5) → []; (3, 62, 3, 4) → []; (3, 85, 8, 1) → [].
  - 회차 표 each: 이야기 문제 통과, 연습 7개·중복 없음·이야기 수 없음·각 위치 규칙 통과·`divSortKey` 오름차순; 1~5회는 내림이 정확히 ⑦⑧ 두 문제; 15~24회는 나머지 있는 연습 ≥ 1; 표 전체에서 d=8, d=9가 각각 한 번.
- [ ] **Step 2: 실행해서 실패 확인** — `npm run ws:test -- division` → FAIL (module not found).
- [ ] **Step 3: 구현** — `stageOf`는 `numbers.js` 것을 import. `pickDivPractice`: 후보 = `10d..99`, 이야기 수 제외, `checkDivProblem(stage, n, d, 8)` 통과. 1단계는 내림 없는 수에서 `min(5, 개수)`개, 내림 있는 수에서 나머지를 `spread`(곱셈과 같은 고르게 띄엄띄엄)로 고르고, 그 밖은 정렬된 후보 전체에서 `spread(…, 7)`. 결과는 `divSortKey` 순. `spread`는 `numbers.js`에서 export해 재사용.
- [ ] **Step 4: 통과 확인** — `npm run ws:test` → 전체 PASS.
- [ ] **Step 5: 커밋** — `feat(worksheets): 나눗셈 숫자 규칙`

### Task 2: 나눗셈 문제 칸

**Files:**
- Create: `worksheets/lib/render-division.js`
- Modify: `worksheets/styles/worksheet.css` (새 블록 `/* ---------- 나눗셈 문제 칸 ---------- */`)
- Test: `worksheets/tests/render-division.test.js`

**Interfaces:**
- Consumes: `analyzeDiv`
- Produces: `renderDivProblem({ n, d, position, level, unit?, restUnit?, withRemainder }) → string` — `<section class="problem div-problem[ story]" data-pos>`; 왼쪽 `.split[.small]`(4줄: `n = [ ] + [ ]`, `● [ ] ÷ d = [ ]`(주황), `● [ ] ÷ d = [ ]( … [ ])`(파랑), `몫 = ● + ● = [ ]`), 오른쪽 `table.longdiv` 줄 클래스 `ld-q, ld-n, ld-p1, ld-r1, ld-p2, ld-rem`(각 2칸 `td.d` + 왼쪽 `td.op`), 아래 `.check`, 이야기면 `.answer`.

- [ ] **Step 1: 실패하는 테스트**
  - level 1, 48÷3: `.split` 회색 힌트에 `30`, `18`이 각각 2번(쪼개기 칸, 단계 줄); `ld-r1` 일의 자리 칸에 `<span class="hint">8</span>`; `ld-n` 칸에 `4`, `8`, 나누는 수 칸 `3`; 6줄 모두 있음; `확인:` 있고 `+` 칸 없음.
  - level 2: 힌트 `30`만, `18` 없음. level 3: `class="hint"` 없음. level 4: `split small`.
  - `withRemainder: true`, 50÷3: 파랑 줄에 `…`와 칸, `.check`에 `+` 칸.
  - 이야기(position 1, unit '개'): `⭐`, `답:`; `restUnit: '알'`이고 나머지 있으면 `남는 것` 포함; 나머지 없으면 `남는 것` 없음.
  - 62÷3 level 1 힌트: `60`, `2`.
- [ ] **Step 2: 실패 확인** — `npm run ws:test -- render-division` → FAIL.
- [ ] **Step 3: 구현 + CSS** — 왼쪽 열 59mm, 오른쪽 26mm(op 8 + 9 + 9), `td.d` 9 × 8mm 점선, `ld-n` 칸 위 굵은 선 + 첫 칸 왼쪽 둥근 선(`)` 모양), `ld-p1`/`ld-p2` 아래 굵은 선, 몫 칸은 주황/파랑 옅은 바탕(십/일 단계 짝). 단계 줄 dot 색: 첫 줄 `dot ones`(주황), 둘째 `dot tens`(파랑) — 곱셈 CSS 그대로 재사용.
- [ ] **Step 4: 통과 확인** — `npm run ws:test` PASS.
- [ ] **Step 5: 눈 확인** — 문제 8개(level 1~4, 나머지/이야기 포함)를 HTML로 찍어 크롬 PDF → `pdftoppm`으로 보고 넘침·겹침이 없을 때까지 CSS 조정.
- [ ] **Step 6: 커밋** — `feat(worksheets): 나눗셈 문제 칸 (쪼개기 + 세로식)`

### Task 3: 회차 데이터 검증·페이지·정답지

**Files:**
- Modify: `worksheets/lib/episodes.js` (패널 검사 `validatePanels` 분리, `DIVISION_DIR`, `divPracticeOf`, `validateDivEpisode`)
- Modify: `worksheets/lib/render-page.js` (공통 `renderPages` 분리, `renderDivEpisode`)
- Modify: `worksheets/lib/render-answers.js` (공통 페이지 나누기, `renderDivAnswerKey`)
- Modify: `worksheets/styles/worksheet.css` (`.page.div-set` 머리줄 `#4a7fc1`)
- Create: `worksheets/data/division/ep01.json` (1회 실제 이야기)
- Test: `worksheets/tests/division-episodes.test.js`

**Interfaces:**
- Consumes: Task 1, Task 2.
- Produces:
  - 회차 JSON: `{ id, topic, icon, title, divisor, story: { dividend, unit, restUnit? }, practice: null, panels }`
  - `DIVISION_DIR`, `divPracticeOf(ep) → number[7]`, `validateDivEpisode(ep, stickerIds) → string[]` (나머지 있는 이야기에 `restUnit` 필수)
  - `renderDivEpisode(ep, stickerSrc, stickerAspect?) → string` (뒷면 제목 `□ ÷ d`, 앞뒤 `page ... div-set`)
  - `renderDivAnswerKey(episodes) → string` (한 쪽 6회, 줄 `① 26 ÷ 2 = 13 (13개) 20 + 6`, 나머지 `50 ÷ 3 = 16 … 2 (16번, 2알)`)

- [ ] **Step 1: 실패하는 테스트** — 나눗셈 1회 검증 통과; restUnit 없는 나머지 이야기 거부; 나누는 수 범위 밖 거부; 화자 없는 말풍선 거부(공통 패널 검사); `renderDivEpisode` 2쪽·문제 8개·앞면 2개·`div-set`·뒷면 `□ ÷ 2`; 정답지 줄 형식(합성 회차로 나머지 경우 포함). 기존 곱셈 테스트는 그대로 통과.
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — `validateEpisode`의 패널 부분을 `validatePanels(ep, stickerIds, tag)`로 옮기고 두 검증이 같이 씀. 페이지는 `renderPages({ ep, problems, backTitle, setClass }, stickerSrc, stickerAspect)`.
- [ ] **Step 4: 통과 확인** — `npm run ws:test` PASS.
- [ ] **Step 5: 커밋** — `feat(worksheets): 나눗셈 회차 검증·페이지·정답지`

### Task 4: 세트 선택 (빌드·어드민)

**Files:**
- Create: `worksheets/lib/sets.js`
- Modify: `worksheets/build.js` (`--set=mul|div`, 기본 mul)
- Modify: `worksheets/admin/server.js`, `worksheets/admin/edit.js`, `worksheets/admin/index.html`
- Test: `worksheets/tests/sets.test.js`, `worksheets/tests/admin.test.js`

**Interfaces:**
- Produces:
  - `SETS.mul / SETS.div`: `{ key, name, dir, outSub, validate, renderEpisode, renderAnswers, practiceTitle, docTitle }`; `setOf(key='mul')` (없는 키면 throw).
  - 빌드 출력: mul → `out/html`, `out/pdf`(그대로); div → `out/html/division`, `out/pdf/division`. CSS·스티커 경로는 출력 폴더에서 `ROOT`까지 상대 경로로 계산.
  - 어드민 API: 모든 경로에 `?set=div` (없으면 mul). `createAdminServer({ dirs: { mul, div }, build })`, `build(setKey)`.
  - `textOf(ep)` → `{ id, title, unit, restUnit?, problem, panels }` (`problem`: `16 × 11` / `26 ÷ 2`), `applyTextEdits`는 `restUnit`도 반영.

- [ ] **Step 1: 실패하는 테스트** — `setOf('div').dir`이 `data/division`, `setOf('x')` throw; 어드민: `?set=div` 목록이 나눗셈 회차, 저장이 나눗셈 폴더에만 쓰이고 곱셈 ep01은 그대로, 미리보기에 `div-set`, 빌드 호출 인자 `div`; `textOf(나눗셈 1회).problem === '26 ÷ 2'`.
- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: 구현** — 어드민 화면 머리에 `곱셈 | 나눗셈` 탭, 탭마다 목록·PDF 링크(`/out/pdf/division/all.pdf` 등)·빌드 대상이 바뀜. 미저장 수정이 있으면 탭 이동 전 확인.
- [ ] **Step 4: 통과 확인** — `npm run ws:test` PASS, `node worksheets/build.js --only=1`이 곱셈 그대로 동작.
- [ ] **Step 5: 커밋** — `feat(worksheets): 빌드·어드민에서 곱셈/나눗셈 세트 선택`

### Task 5: 24회 이야기와 소품

**Files:**
- Create: `worksheets/data/division/ep02.json` … `ep24.json`
- Modify: `worksheets/data/stickers.json` (새 소품), `worksheets/assets/stickers/*.png`

- [ ] **Step 1:** 회차 표(Task 1의 `DIV_EPISODE_TABLE`, 주제 순서는 곱셈과 같음)대로 4컷 이야기 작성: ①상황 ②나눌 전체 ③나누는 수 ④질문. 1~14회 등분, 15회부터 포함·남는 것.
- [ ] **Step 2:** 필요한 새 소품을 Codex로 생성(기존 소품 PNG를 그림체 참고로 `-i`), `trim-png.js` → `sips -Z 700`, `stickers.json`에 등록.
- [ ] **Step 3:** 테스트 추가: 나눗셈 24회 모두 `validateDivEpisode` 통과, id 1~24, 표의 나누는 수·이야기 수와 일치. `npm run ws:test` PASS.
- [ ] **Step 4: 커밋** — `feat(worksheets): 나눗셈 24회 이야기와 소품`

### Task 6: PDF와 눈 확인

- [ ] **Step 1:** `node worksheets/build.js --set=div --strict` → 회차 48쪽 묶음, 정답지 4쪽, 오류 없음.
- [ ] **Step 2:** `pdftoppm`으로 앞면 전체·뒷면 몇 장·정답지를 보고 말풍선 위치, 문제 칸 넘침, 나머지 칸 폭을 확인. 문제가 있으면 데이터/CSS 수정 후 다시.
- [ ] **Step 3:** 어드민 다시 시작 후 브라우저에서 나눗셈 탭 확인.
- [ ] **Step 4: 커밋** — 고친 것이 있으면 `fix(worksheets): …`
