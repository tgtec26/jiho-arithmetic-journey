# 곱셈 이야기 학습지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지호용 2자리 × 2자리 곱셈 인쇄 학습지 24회분(회차당 A4 양면 1장: 4컷 만화 + 8문제)과 정답지를 PDF로 만든다.

**Architecture:** 회차 내용은 JSON 데이터, 숫자 규칙·검증·HTML 렌더링은 순수 JS 모듈(Node ESM), 조판은 HTML/CSS(mm 단위), PDF는 크롬 헤드리스로 출력한다. 만화 그림은 Magnific으로 만든 투명 배경 스티커 PNG를 컷 위에 배치하고, 말풍선은 HTML 텍스트로 얹는다.

**Tech Stack:** Node 25 (ESM, `.js`), vitest 4(이미 devDependency), Google Chrome 헤드리스, Magnific MCP(images_generate, images_remove_background), macOS 설치 폰트(BM Dohyeon, Spoqa Han Sans Neo, Nanum Gothic).

**Spec:** `docs/superpowers/specs/2026-11-26-multiplication-worksheet-design.md`

## Global Constraints

- 모든 학습지 코드는 `worksheets/` 아래. SvelteKit 앱(`src/`)은 건드리지 않는다.
- A4 세로 210 × 297mm, 양면. 회차당 정확히 2페이지(앞면·뒷면).
- **배경은 흰색.** 색은 캐릭터·소품·작은 표시(색 점, 아주 옅은 줄 색)에만.
- 이미지 안에 글자를 넣지 않는다. 모든 한글은 HTML 텍스트.
- 지호·아빠: 실제 얼굴 닮게 그리지 않음, 안경 없음. 아이 사진은 외부 서비스에 보내지 않음.
- 손흥민·홀란: 이름은 대사에만. 그림은 7번·9번 등번호 만화 선수(실제 얼굴 닮게 그리지 않음).
- 감돌이: 갈색 곱슬털 곰 인형, 동그란 귀, 진한 갈색 코, 작은 검은 눈. 사랑이: 회색 줄무늬 고양이 인형, 흰 가슴·흰 발, 분홍 코, 호박색 눈. 참고 사진 `worksheets/reference/*.png`(gitignore, 결과물에 사용 금지).
- 문제 칸 크기: 격자 한 칸 13mm(스펙 13~15mm), 세로셈 모눈 한 칸 9mm(스펙 9~10mm 이상).
- 고정 수·다른 수 모두 끝자리 0 금지(격자에 0줄이 생겨 헷갈림 — 빌더 결정).
- 빌드는 폰트가 설치된 이 Mac에서만(다른 기기는 PDF만 사용).
- 커밋 계정 `tgtec26` / `tgtec26@snu-g.ms.kr`. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **양면 인쇄 밀림:** 내용이 넘쳐 한 회차가 3페이지가 되면 이후 앞뒤가 전부 어긋난다 → Task 4 빌드가 PDF 페이지 수를 세어 `2 × 회차 수`(+정답지 페이지)가 아니면 실패.
2. **말풍선 넘침:** 대사가 길면 말풍선이 컷 밖으로 나가거나 잘린다 → Task 2 검증기가 말풍선 글자 수 ≤ 40, 컷당 말풍선 ≤ 2를 검사.
3. **스티커 누락:** 그림 파일이 없을 때 자리표시 상자가 최종 인쇄물에 그대로 남는다 → Task 4 `--strict` 빌드가 누락 시 실패.
4. **4자리 값:** 15 × 88 = 1320처럼 줄 합·답이 4자리일 때 세로셈 칸이 모자람 → Task 3 렌더 테스트에 15 × 88.
5. **규칙 어긋난 수동 수정:** 첫 3회 확인 후 JSON에서 숫자를 손으로 바꾸면 난이도 규칙이 깨질 수 있음 → Task 2 검증기가 `practice` 덮어쓰기도 같은 규칙으로 검사.

---

## 파일 구조

```
worksheets/
  vitest.config.js
  build.js                     # CLI: HTML 생성 → 크롬 PDF → 페이지 수 검사
  lib/numbers.js               # 자리 나누기, 받아올림, 어려운 곱, 단계·힌트, 문제 검사, 연습 수 고르기
  lib/episodes.js              # JSON 읽기 + validateEpisode
  lib/render-problem.js        # 문제 한 칸 HTML
  lib/render-comic.js          # 4컷 HTML
  lib/render-page.js           # 회차 앞뒤 2페이지 HTML
  lib/render-answers.js        # 정답지 HTML
  lib/html.js                  # escapeHtml
  styles/worksheet.css
  data/episodes/ep01.json … ep24.json
  data/stickers.json           # 스티커 목록(id, file, prompt)
  assets/sheets/*.png          # 승인된 캐릭터 시트(생성물)
  assets/stickers/*.png        # 투명 배경 스티커(생성물)
  tests/*.test.js
  out/                         # 빌드 결과(gitignore)
```

`package.json` scripts에 추가: `"ws:test": "vitest run --config worksheets/vitest.config.js"`, `"ws:build": "node worksheets/build.js"`.
`.gitignore`에 `worksheets/out/` 추가.

## 회차 표 (숫자 검증 완료 — 바꾸면 Task 2 검증기로 다시 확인)

| 회 | 단계 | 힌트 | 소재(topic) | 제목 | 고정 수 × 다른 수 | 단위 | 이야기 핵심 |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | soccer | 월드컵 16강 | 16 × 11 | 명 | 16나라, 한 팀 11명(손흥민·홀란 언급) |
| 2 | 1 | 1 | train | 꼬마 기차 | 12 × 14 | 명 | 객차 12칸, 한 칸 14명 |
| 3 | 1 | 1 | coding | 레고 로봇 | 13 × 15 | 개 | 로봇 한 대 블록 13개, 친구 15명 |
| 4 | 1 | 1 | piano | 피아노 연습 | 14 × 12 | 마디 | 한 곡 14마디, 12번 연습 |
| 5 | 1 | 1 | english | 영어 단어 | 15 × 12 | 개 | 하루 단어 15개, 12일 |
| 6 | 1 | 1 | sarang | 사랑이 간식 | 18 × 13 | 개 | 한 봉지 18개, 13봉지 |
| 7 | 2 | 2 | car | 주차장 | 17 × 12 | 대 | 한 줄 17대, 12줄 |
| 8 | 2 | 2 | gamdori | 감돌이 생일 | 14 × 16 | 개 | 의자 한 줄 14개, 16줄 |
| 9 | 2 | 2 | soccer | K리그 | 25 × 12 | 명 | 한 팀 선수단 25명, 12팀 |
| 10 | 2 | 2 | train | 기찻길 만들기 | 21 × 13 | 개 | 한 줄 레일 21개, 13줄 |
| 11 | 2 | 2 | coding | 로봇 팔 | 23 × 17 | 개 | 로봇 팔 부품 23개, 17대 |
| 12 | 2 | 2 | piano | 매일 피아노 | 27 × 14 | 분 | 하루 27분, 14일 |
| 13 | 2 | 2 | english | 영어 동화책 | 26 × 15 | 쪽 | 한 권 26쪽, 15권 |
| 14 | 2 | 2 | car | 자동차 경주 | 29 × 12 | 초 | 한 바퀴 29초, 12바퀴 |
| 15 | 3 | 3 | sarang | 사랑이 사료 | 32 × 28 | 알 | 하루 32알, 28일 |
| 16 | 3 | 3 | gamdori | 곰 인형 공장 | 24 × 35 | 개 | 한 상자 24개, 35상자 |
| 17 | 3 | 3 | soccer | 2026 월드컵 | 48 × 26 | 명 | 48나라, 한 팀 26명(손흥민·홀란) |
| 18 | 3 | 3 | train | 고속 열차 | 46 × 18 | 개 | 한 칸 좌석 46개, 18칸 |
| 19 | 3 | 3 | coding | 레고 블록 통 | 38 × 27 | 개 | 한 통 38개, 27통 |
| 20 | 3 | 3 | piano | 피아노 학원 | 15 × 88 | 개 | 피아노 15대, 건반 88개씩 |
| 21 | 3 | 4 | english | 단어 카드 | 45 × 23 | 장 | 한 상자 45장, 23상자 |
| 22 | 3 | 4 | car | 주차 타워 | 37 × 19 | 대 | 한 층 37대, 19층 |
| 23 | 3 | 4 | sarang | 고양이 발가락 | 18 × 42 | 개 | 고양이 발가락 18개, 42마리 |
| 24 | 3 | 4 | gamdori | 곱셈 졸업 파티 | 27 × 36 | 개 | 친구 27명, 쿠키 36개씩 |

---

### Task 1: 숫자 규칙 모듈

**Files:**
- Create: `worksheets/vitest.config.js`, `worksheets/lib/numbers.js`, `worksheets/tests/numbers.test.js`
- Modify: `package.json` (scripts `ws:test`, `ws:build`), `.gitignore` (`worksheets/out/`)

**Interfaces:**
- Produces (`worksheets/lib/numbers.js`):
  - `digits(n: number): { tens: number, ones: number }`
  - `countAddCarries(x: number, y: number): number` — 세로 덧셈 받아올림 횟수
  - `isHardFact(p: number, q: number): boolean` — `min ≥ 6 && max ≥ 7`
  - `analyze(a: number, b: number): { answer, onesRow, tensRow, cells, carries, hardFacts }`
    - `onesRow = a × (b의 일의 자리)`, `tensRow = a × (b의 십의 자리) × 10`
    - `cells`: 길이 4, 순서 `[일의자리줄×a십, 일의자리줄×a일, 십의자리줄×a십, 십의자리줄×a일]`, 각 `{ rowPart, colPart, value, fact: [p, q] }` (예: 16 × 11 → rowPart 1·1·10·10, colPart 10·6·10·6, value 10·6·100·60)
    - `carries` = 줄 합 두 개(각 줄의 두 칸 덧셈) + 최종 합(`onesRow + tensRow`)의 받아올림 합
    - `hardFacts` = 네 칸의 `fact` 중 `isHardFact` 개수
  - `stageOf(id: number): 1|2|3` — 1~6 / 7~14 / 15~24
  - `hintLevel(id: number): 1|2|3|4` — 1~6 / 7~14 / 15~20 / 21~24
  - `checkProblem(stage, a, b, position: 1..8): string[]` — 위반 메시지 목록(빈 배열 = 통과). 규칙:
    - 공통: a, b는 두 자리, 끝자리 0 금지
    - 단계 1: a 11~19, b 11~39, carries ≤ 1, hardFacts 0
    - 단계 2: a 11~29, b 11~59, hardFacts ≤ 1, hardFacts ≥ 1이면 position ≥ 5만; position 1(이야기)은 carries ≤ 2, 2~8은 carries 1~2
    - 단계 3: a 11~49, b 11~99, 제한 없음
  - `pickPractice(fixed, storyOther, stage): number[]` — 7개, 서로 다름, storyOther 제외, 각자 `checkProblem(stage, fixed, b, i + 2)` 통과, `(hardFacts, carries, b)` 오름차순. 후보를 정렬한 뒤 고르게 띄엄띄엄 뽑는다(쉬운 것부터 어려운 것까지 고루). 단계 2는 어려운 곱 문제를 최대 2개, 뒤쪽 자리에만.

- [ ] **Step 1: 실패하는 테스트 작성** (`worksheets/tests/numbers.test.js`)

```js
expect(analyze(16, 11)).toMatchObject({ answer: 176, onesRow: 16, tensRow: 160, carries: 0, hardFacts: 0 });
expect(analyze(16, 11).cells.map(c => c.value)).toEqual([10, 6, 100, 60]);
expect(analyze(16, 13)).toMatchObject({ onesRow: 48, tensRow: 160, carries: 1 });
expect(analyze(16, 17)).toMatchObject({ carries: 1, hardFacts: 1 });
expect(analyze(48, 26)).toMatchObject({ answer: 1248, carries: 2, hardFacts: 1 });
expect(analyze(15, 88)).toMatchObject({ answer: 1320, tensRow: 1200 });
expect([isHardFact(6,7), isHardFact(9,9), isHardFact(6,6), isHardFact(3,7), isHardFact(7,5)]).toEqual([true, true, false, false, false]);
expect([stageOf(6), stageOf(7), stageOf(14), stageOf(15)]).toEqual([1, 2, 2, 3]);
expect([hintLevel(6), hintLevel(7), hintLevel(20), hintLevel(21)]).toEqual([1, 2, 3, 4]);
expect(checkProblem(1, 16, 17, 2).length).toBeGreaterThan(0);   // 6×7
expect(checkProblem(1, 16, 40, 2).length).toBeGreaterThan(0);   // 끝자리 0
expect(checkProblem(2, 16, 17, 3).length).toBeGreaterThan(0);   // 어려운 곱은 ⑤부터
expect(checkProblem(2, 16, 17, 6)).toEqual([]);
// 회차 표 24개 전부: 이야기 문제 통과 + pickPractice 결과 7개·중복 없음·각 자리 통과·정렬
```

마지막 줄은 회차 표의 `[id, fixed, other]` 24개 배열을 테스트 안에 두고 반복 검사한다.

- [ ] **Step 2: 실패 확인** — Run: `npm run ws:test` / Expected: FAIL (모듈 없음)
- [ ] **Step 3: `worksheets/lib/numbers.js` 구현** + `vitest.config.js`(root = `worksheets/`, include `tests/**/*.test.js`), package.json scripts, `.gitignore`
- [ ] **Step 4: 통과 확인** — Run: `npm run ws:test` / Expected: PASS
- [ ] **Step 5: 커밋** — `git add worksheets/ package.json .gitignore && git commit -m "feat(worksheets): 곱셈 숫자 규칙 모듈"`

### Task 2: 회차 데이터와 검증기 (1회 데이터 포함)

**Files:**
- Create: `worksheets/lib/html.js`, `worksheets/lib/episodes.js`, `worksheets/data/stickers.json`, `worksheets/data/episodes/ep01.json`, `worksheets/tests/episodes.test.js`

**Interfaces:**
- Consumes: Task 1 `stageOf`, `checkProblem`, `pickPractice`
- Produces:
  - `escapeHtml(s: string): string` (`worksheets/lib/html.js`)
  - 회차 JSON 형식:
    ```json
    { "id": 1, "topic": "soccer", "icon": "⚽", "title": "월드컵 16강",
      "fixed": 16, "story": { "other": 11, "unit": "명" },
      "practice": null,
      "panels": [ { "stickers": [ { "id": "jiho-happy", "x": 5, "y": 30, "w": 40 } ],
                    "bubbles":  [ { "text": "아빠! 월드컵 16강이 시작됐대!", "x": 40, "y": 4, "w": 56, "tail": "bl" } ] } ] }
    ```
    `x, y, w`는 컷 크기 대비 %, `tail`은 `"bl" | "br" | "none"`. `practice`는 `null`(자동) 또는 7개 배열(덮어쓰기).
  - `stickers.json`: `[{ "id": "jiho-happy", "file": "assets/stickers/jiho-happy.png", "prompt": "..." }]` — 계획된 스티커 전부(파일은 Task 6~7에서 생김)
  - `loadEpisodes(dir?: string): Episode[]` (id 오름차순), `loadStickers(): Sticker[]`
  - `practiceOf(ep): number[]` — `ep.practice ?? pickPractice(ep.fixed, ep.story.other, stageOf(ep.id))`
  - `validateEpisode(ep, stickerIds: Set<string>): string[]` — 검사: id 1~24, 이야기 문제 `checkProblem(stage, fixed, other, 1)`, `practiceOf` 각각 해당 자리 규칙·중복 없음·이야기 수와 다름, 컷 정확히 4개, 컷당 말풍선 1~2개, 말풍선 글자 수 ≤ 40, 4번 컷 마지막 말풍선이 `?`로 끝남, 스티커 id가 목록에 있음

- [ ] **Step 1: 실패하는 테스트 작성** — `validateEpisode`가: 정상 ep01 → `[]`; 컷 3개 → 오류; 41자 말풍선 → 오류; 4번 컷 질문 없음 → 오류; 없는 스티커 id → 오류; `practice: [12,13,14,15,16,17,21]`(16×17은 단계 1에서 6×7) → 오류. 그리고 `loadEpisodes()` 전체가 오류 0개. `escapeHtml('<b>&')` → `'&lt;b&gt;&amp;'`.
- [ ] **Step 2: 실패 확인** — `npm run ws:test` / FAIL
- [ ] **Step 3: 구현** + `stickers.json`(아래 Task 7 스티커 목록 전체, prompt 포함) + `ep01.json`(스펙 5.2 4컷 틀: ①상황 ②첫 수 ③둘째 수 ④질문, 대사는 짧게, 감돌이·사랑이도 한 마디씩, 3번 컷에 7번·9번 선수)
- [ ] **Step 4: 통과 확인** — `npm run ws:test` / PASS
- [ ] **Step 5: 커밋** — `feat(worksheets): 회차 데이터 형식과 검증기, 1회 데이터`

### Task 3: 문제 칸 렌더러 + 스타일

**Files:**
- Create: `worksheets/lib/render-problem.js`, `worksheets/styles/worksheet.css`, `worksheets/tests/render-problem.test.js`

**Interfaces:**
- Consumes: Task 1 `analyze`, `digits`; Task 2 `escapeHtml`
- Produces: `renderProblem({ a, b, position, level, unit }): string` — `<section class="problem" data-pos="N">` 하나

칸 배치(문제 칸 94 × 86mm, 안쪽 여백 3mm):
- 맨 위: `①  16 × 11` (이야기 문제는 ⭐ 표시, 주황 테두리 2px).
- 왼쪽: 격자. 머리 열 6mm + 13mm × 2, 머리 행 6mm + 13mm × 2. 위 머리 `a십×10 | a일`, 왼쪽 머리 **위 = b일, 아래 = b십×10**(세로셈 순서와 맞춤). 일의자리 줄은 아주 옅은 주황, 십의자리 줄은 아주 옅은 파랑. 왼쪽 머리칸에 줄 색 점.
- 격자 아래: **줄 합 칸 2줄** `● = [      ]`(주황 점, 파랑 점, 상자 폭 24mm). 스펙은 "각 줄 오른쪽"이지만 94mm 폭에 9mm 세로셈과 함께 들어가지 않아 격자 아래에 두고 색 점으로 짝짓는다(빌더 결정, 사용자에게 보고).
- 오른쪽: 세로셈 모눈. 연산자 열 6mm + 숫자 4열 × 9mm. 줄: 받아올림(작은 칸 5mm) / a / × b / ━ / 부분곱1(주황 점) / 부분곱2(파랑 점) / ━ / 합. a, b는 미리 채움(오른쪽 맞춤), 나머지는 빈칸.
- 이야기 문제(position 1)만 맨 아래 `답: ______ {unit}`.

힌트 단계:
- level 1: 머리칸 채움, 격자 안 회색 `rowPart×colPart`(예: `1×10`), 부분곱2 일의 자리에 회색 `0`, 줄 합 칸 있음.
- level 2: 머리칸 채움, 회색 힌트 없음, 줄 합 칸 있음.
- level 3: 머리칸 빈칸(`data-role="head"` 내용 없음), 줄 합 칸 있음.
- level 4: 격자 `class="grid small"`(칸 9mm), 머리칸 빈칸, 줄 합 칸 없음.

폰트: 제목 `'BM Dohyeon'`, 본문·숫자 `'Spoqa Han Sans Neo', 'Nanum Gothic', sans-serif`. 회색 힌트 `#bbb`.

- [ ] **Step 1: 실패하는 테스트 작성** — 문자열/DOM 검사(`linkedom` 없이 정규식으로 충분):
  - level 1, 16 × 11: `class="hint"` 안에 `1×10`, `1×6`, `10×10`, `10×6`; 부분곱2 일의 자리 `hint">0`; `class="rowsum"` 2개
  - level 2: `class="hint"` 없음, 머리칸에 `10`, `6`
  - level 3: `data-role="head"` 칸 4개 모두 비어 있음
  - level 4: `grid small` 있음, `rowsum` 없음
  - 세로셈 숫자 칸 `class="d"` 정확히 20개(5줄 × 4), `class="carry"` 4개; 16 × 11의 첫 줄 칸 내용 `['', '', '1', '6']`
  - 15 × 88(level 3): 숫자 4열로 렌더(`class="d"` 20개 그대로), 예외 없음
  - position 1 + unit `명`: `답:`과 `명` 포함, position 2: `답:` 없음
- [ ] **Step 2: 실패 확인** — `npm run ws:test` / FAIL
- [ ] **Step 3: 구현** (`render-problem.js` + `worksheet.css`의 `.problem` 관련 규칙)
- [ ] **Step 4: 통과 확인** — `npm run ws:test` / PASS
- [ ] **Step 5: 커밋** — `feat(worksheets): 격자+세로셈 문제 칸 렌더러`

### Task 4: 만화·페이지 렌더러와 빌드(PDF)

**Files:**
- Create: `worksheets/lib/render-comic.js`, `worksheets/lib/render-page.js`, `worksheets/build.js`, `worksheets/tests/render-page.test.js`
- Modify: `worksheets/styles/worksheet.css`

**Interfaces:**
- Consumes: Task 2 `loadEpisodes`, `loadStickers`, `practiceOf`, `validateEpisode`, `escapeHtml`; Task 3 `renderProblem`; Task 1 `hintLevel`
- Produces:
  - `renderComic(panels, stickerSrc: (id) => string | null): string` — 2 × 2 `.panel`. 파일 없으면 `<div class="sticker missing">id</div>`(점선 상자). 말풍선은 흰 바탕·검은 1px 테두리·둥근 모서리·CSS 꼬리.
  - `renderEpisode(ep, stickerSrc): string` — `.page.front` + `.page.back`
    - 앞면: 머리줄(아이콘, `N회`, 제목, `이름 ____ 날짜 ____`, 지름 14mm 도장 칸 "다 풀었어요"), 만화(남는 높이 전부, 약 175mm), 문제 ①②(2열)
    - 뒷면: 머리줄(`N회 · 연습`, `고정 수 × □`), 문제 ③~⑧(2열 × 3줄)
    - 페이지: `@page { size: A4; margin: 0 }`, `.page { width:210mm; height:297mm; padding:9mm; overflow:hidden; break-after:page }`, 문제 칸 94 × 86mm
  - `build.js` CLI: `node worksheets/build.js [--only=1,2,3] [--strict]`
    1. 모든 회차 `validateEpisode` — 오류 있으면 출력 후 종료 코드 1
    2. `--strict`면 참조된 스티커 파일이 하나라도 없으면 종료 코드 1
    3. `worksheets/out/html/epNN.html`, `all.html`(선택 회차 묶음), `answers.html`(Task 5 이후) 생성. CSS·이미지 상대 경로
    4. 크롬: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=<pdf> file://<html>` → `worksheets/out/pdf/`
    5. 각 PDF 페이지 수를 세어(`/Type /Page` 개수, `/Pages` 제외) 회차 PDF는 2, `all.pdf`는 `2 × 회차 수`가 아니면 종료 코드 1

- [ ] **Step 1: 실패하는 테스트 작성** — `renderEpisode(ep01, () => null)`: `.page` 정확히 2개, `class="problem"` 8개, 앞면 안에 problem 2개, `class="panel"` 4개, `sticker missing` 포함, 말풍선 텍스트에 `<`가 있으면 이스케이프됨.
- [ ] **Step 2: 실패 확인** — `npm run ws:test` / FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — `npm run ws:test` / PASS
- [ ] **Step 5: 실제 출력 확인** — Run: `npm run ws:build -- --only=1` / Expected: `out/pdf/ep01.pdf` 2페이지, 오류 없음. 내장 브라우저로 `worksheets/out/html/ep01.html`과 PDF를 열어 스크린샷: 앞면 만화가 위 약 2/3, 문제 2개가 아래, 뒷면 6문제, 칸이 잘리지 않음, 배경 흰색.
- [ ] **Step 6: 커밋** — `feat(worksheets): 만화·페이지 렌더러와 PDF 빌드`

### Task 5: 정답지

**Files:**
- Create: `worksheets/lib/render-answers.js`, `worksheets/tests/render-answers.test.js`
- Modify: `worksheets/build.js` (answers.html/pdf 생성, 페이지 수 검사에 정답지 페이지 수 포함 안 함 — 별도 파일)

**Interfaces:**
- Consumes: Task 1 `analyze`; Task 2 `practiceOf`
- Produces: `renderAnswerKey(episodes): string` — A4 페이지들, 회차마다 한 블록: `N회 제목`, `① 16 × 11 = 176 (176명)`, `② … ⑧`. 줄 합(부분곱)도 작게 `16 + 160` 표기해 아빠가 과정까지 확인 가능.

- [ ] **Step 1: 실패하는 테스트 작성** — 1회 포함 시 `16 × 11 = 176`, `176명`, `16 + 160` 포함; 8개 줄.
- [ ] **Step 2: 실패 확인** — FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** — PASS, `npm run ws:build -- --only=1` 후 `out/pdf/answers.pdf` 열어 확인
- [ ] **Step 5: 커밋** — `feat(worksheets): 정답지`

### Task 6: 캐릭터 시트 (사용자 확인 단계)

**Files:**
- Create: `worksheets/assets/sheets/{jiho,dad,gamdori,sarang}.png`

공통 스타일 프롬프트(모든 생성에 붙임): `cute children's picture-book sticker illustration, clean dark brown outline, soft flat colors, simple shading, pure white background, no text, no letters, full body`.

- [ ] **Step 1:** `images_models_list`로 참고 이미지 기반 캐릭터 일관성이 좋은 모델 선택(추천 표시 우선). 비용 확인 `simulate_cost`(이미지 1장 약 135크레딧, 배경 제거 3크레딧, 잔액 약 11만).
- [ ] **Step 2:** 감돌이·사랑이: `worksheets/reference/` 인형 사진을 참고 이미지로 넣고 생성(정면 + 3/4 측면 + 뒷모습 시트). 지호(초등 저학년 남자아이, 안경 없음, 밝은 색 티셔츠)·아빠(30~40대, 안경 없음): 글 설명만으로 생성.
- [ ] **Step 3:** 네 장을 내장 브라우저에 나란히 띄우고 **사용자 승인 받기**. 수정 요청은 다시 생성. 승인본을 `assets/sheets/`에 저장.
- [ ] **Step 4: 커밋** — `feat(worksheets): 승인된 캐릭터 시트`

### Task 7: 캐릭터 스티커 세트

**Files:**
- Create: `worksheets/assets/stickers/*.png`, `worksheets/tests/assets.test.js`
- Modify: `worksheets/data/stickers.json`(prompt 확정)

스티커 목록(id):
- 지호: `jiho-happy`, `jiho-surprised`, `jiho-thinking`, `jiho-pointing`, `jiho-cheering`, `jiho-kicking`, `jiho-reading`
- 아빠: `dad-smiling`, `dad-explaining`, `dad-thinking`, `dad-surprised`, `dad-thumbsup`
- 감돌이: `gamdori-waving`, `gamdori-surprised`, `gamdori-sitting`, `gamdori-cheering`, `gamdori-thinking`
- 사랑이: `sarang-sitting`, `sarang-curious`, `sarang-jumping`, `sarang-happy`, `sarang-sleepy`
- 손님: `guest-soccer7`(빨간 유니폼 7번, 짧은 검은 머리), `guest-soccer9`(빨간 유니폼 9번, 묶은 금발), `guest-conductor`, `guest-english-teacher`, `guest-piano-teacher`, `guest-coding-teacher`

- [ ] **Step 1: 실패하는 테스트 작성** (`assets.test.js`) — `stickers.json`에서 파일이 있는 항목마다: PNG 시그니처, IHDR 색 형식 6(RGBA), 가로·세로 ≤ 1200px. 파일 없는 항목은 건너뜀. Task 2에서 만든 테스트와 별개.
- [ ] **Step 2:** 각 스티커: 승인된 시트를 참고 이미지로 `images_generate` → 확인(`creations_read`) → `images_remove_background` → 내려받아 `sips -Z 1200`으로 줄여 `assets/stickers/<id>.png` 저장.
- [ ] **Step 3:** 전체 스티커를 한 화면(연락처 시트 HTML)에 띄워 일관성 확인. 얼굴·색이 시트와 다른 것은 다시 생성.
- [ ] **Step 4: 통과 확인** — `npm run ws:test` / PASS
- [ ] **Step 5: 커밋** — `feat(worksheets): 캐릭터 스티커 세트`

### Task 8: 1~3회 완성 (사용자 인쇄 확인 단계)

**Files:**
- Create: `worksheets/data/episodes/ep02.json`, `ep03.json`, 소품 스티커 `assets/stickers/prop-*.png`
- Modify: `worksheets/data/stickers.json`, `ep01.json`(스티커 배치 다듬기)

- [ ] **Step 1:** 회차 표대로 2·3회 JSON 작성(스펙 5.2 틀). 필요한 소품 스티커(예: `prop-soccerball`, `prop-goal`, `prop-flags`, `prop-train`, `prop-lego-robot`, `prop-lego-blocks`)를 Task 7과 같은 방법으로 생성·등록.
- [ ] **Step 2:** `npm run ws:test` / PASS
- [ ] **Step 3:** `npm run ws:build -- --only=1,2,3 --strict` / Expected: ep01~03 각 2페이지, all.pdf 6페이지, answers.pdf, 오류 없음
- [ ] **Step 4:** 내장 브라우저로 세 회차를 열어 스크린샷 확인(말풍선 겹침, 스티커가 말풍선 가림, 칸 잘림 없음).
- [ ] **Step 5: 커밋**, 그리고 `all.pdf`·`answers.pdf`를 사용자에게 보냄(SendUserFile). **사용자가 실제 인쇄해 보고 숫자·힌트·대사·칸 크기 의견을 줄 때까지 대기.** 의견을 반영해 Task 1~4 규칙이나 데이터를 고친 뒤 다시 빌드·확인.
- [ ] **Step 6:** 사용자 확인 후 푸시(`.gitignore` 변경 포함 — 사용자 확인이 곧 푸시 승인 조건).

### Task 9: 4~24회와 최종 묶음

**Files:**
- Create: `worksheets/data/episodes/ep04.json` … `ep24.json`, 필요한 소품 스티커
- Modify: `worksheets/data/stickers.json`

- [ ] **Step 1:** 회차 표대로 4~24회 JSON 작성. 소품 스티커 생성·등록(회차당 1~3개, 이미 있는 것 재사용).
- [ ] **Step 2:** `npm run ws:test` / PASS (24회 전부 검증 통과)
- [ ] **Step 3:** `npm run ws:build -- --strict` / Expected: ep01~24 각 2페이지, all.pdf 48페이지, answers.pdf, 오류 없음
- [ ] **Step 4:** 내장 브라우저로 무작위 5개 회차 + 힌트 단계가 바뀌는 회차(6·7, 14·15, 20·21) 확인.
- [ ] **Step 5:** `git diff --check` 통과 후 커밋, 푸시, `all.pdf`·`answers.pdf`를 사용자에게 보내고 한 줄 보고.
