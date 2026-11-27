// 생각 퍼즐 24회의 퍼즐 8개씩을 회차 JSON에 적는다: node worksheets/tools/make-think-puzzles.js
// 만화(panels)·제목 등은 그대로 두고 puzzles만 다시 적는다. 같은 입력이면 같은 퍼즐이 나온다(seed 고정).
// 주차장·쌓기나무·스도쿠·줄 세우기 단서는 생성기로, 경우의 수와 줄 세우기 이름은 아래 표로 정한다.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { THINK_DIR } from '../lib/think/episode.js';
import { loadEpisodes } from '../lib/episodes.js';
import { makeRng, roundOf } from '../lib/think/common.js';
import { PARKING_RANGES, generateParking } from '../lib/think/parking.js';
import { blockCount, generateBlocks, parseHeights } from '../lib/think/blocks.js';
import { SUDOKU_BLANKS, LINEUP_RANGES, generateLineup, generateSudoku } from '../lib/think/logic.js';

// ---------- 경우의 수 (회차별 8문제, ①은 만화 이야기와 같음) ----------
const C = {
	red: '#e5533d',
	blue: '#3d7be5',
	yellow: '#f2c230',
	green: '#4caf6a',
	black: '#333333',
	white: '#ffffff',
	pink: '#f29bb5',
	brown: '#8a5a3c',
	cream: '#f3e3b5',
	purple: '#9b6bd1',
	orange: '#f28c28',
	mint: '#9fe0c8',
	gray: '#9e9e9e'
};
const it = (name, color) => ({ name, color });
const who = (name, sticker) => ({ name, sticker });
const JIHO = who('지호', 'jiho-happy');
const DAD = who('아빠', 'dad-smiling');
const BEAR = who('감돌이', 'gamdori-sitting');
const CAT = who('사랑이', 'sarang-sitting');
const pairs = (text, left, right) => ({ kind: 'pairs', text, left, right });
const order = (text, items, pick = items.length) => ({ kind: 'order', text, items, pick });
const choose = (text, items) => ({ kind: 'choose', text, items, pick: 2 });
const paths = (text, w, h, to) => ({ kind: 'paths', text, w, h, ...(to ? { to } : {}) });

const COUNTING_PLAN = {
	3: [
		pairs('간식 2가지와 그릇 2개 중에서 하나씩 고르는 방법은 모두 몇 가지일까요?', [it('생선 과자', C.blue), it('닭고기 과자', C.cream)], [it('빨간 그릇', C.red), it('파란 그릇', C.blue)]),
		pairs('모자 2개와 장갑 2켤레 중에서 하나씩 고르는 방법은?', [it('노란 모자', C.yellow), it('초록 모자', C.green)], [it('빨간 장갑', C.red), it('파란 장갑', C.blue)]),
		pairs('빵 2가지와 우유 2가지 중에서 하나씩 고르는 방법은?', [it('식빵', C.cream), it('크루아상', C.orange)], [it('흰 우유', C.white), it('초코 우유', C.brown)]),
		pairs('콘 2가지와 맛 3가지 중에서 하나씩 고르는 방법은?', [it('과자 콘', C.orange), it('컵', C.white)], [it('딸기', C.pink), it('초코', C.brown), it('바닐라', C.cream)]),
		order('기차 칸 3개를 한 줄로 잇는 순서는 모두 몇 가지일까요?', [it('빨간 칸', C.red), it('파란 칸', C.blue), it('노란 칸', C.yellow)]),
		order('세 명이 달리기를 해요. 1등과 2등이 되는 경우는 모두 몇 가지일까요?', [JIHO, DAD, BEAR], 2),
		pairs('셔츠 3벌과 바지 2벌 중에서 하나씩 골라 입는 방법은?', [it('빨간 셔츠', C.red), it('파란 셔츠', C.blue), it('노란 셔츠', C.yellow)], [it('검은 바지', C.black), it('흰 바지', C.white)]),
		order('셋이 한 줄로 서서 사진을 찍는 방법은 모두 몇 가지일까요?', [JIHO, BEAR, CAT])
	],
	7: [
		pairs('과자 콘과 컵 중 하나, 맛 3가지 중 하나를 고르는 방법은 모두 몇 가지일까요?', [it('과자 콘', C.orange), it('컵', C.white)], [it('딸기', C.pink), it('초코', C.brown), it('바닐라', C.cream)]),
		order('딸기, 초코, 바닐라를 한 줄로 쌓는 순서는 모두 몇 가지일까요?', [it('딸기', C.pink), it('초코', C.brown), it('바닐라', C.cream)]),
		pairs('티셔츠 2벌과 모자 3개 중에서 하나씩 고르는 방법은?', [it('줄무늬 티', C.blue), it('별무늬 티', C.yellow)], [it('빨간 모자', C.red), it('초록 모자', C.green), it('검은 모자', C.black)]),
		order('피아노 곡 3곡 중에서 첫 번째와 두 번째로 칠 곡을 고르는 방법은?', [it('나비야', C.yellow), it('작은 별', C.blue), it('학교 종', C.orange)], 2),
		pairs('빵 3가지와 속 2가지 중에서 하나씩 골라 샌드위치를 만드는 방법은?', [it('식빵', C.cream), it('호밀빵', C.brown), it('모닝빵', C.orange)], [it('햄', C.pink), it('달걀', C.yellow)]),
		order('자동차 3대가 주차장에 한 줄로 서는 순서는 모두 몇 가지일까요?', [it('빨간 차', C.red), it('파란 차', C.blue), it('초록 차', C.green)]),
		pairs('고양이 장난감 2개와 간식 3가지 중에서 하나씩 고르는 방법은?', [it('공', C.red), it('쥐 인형', C.gray)], [it('생선', C.blue), it('닭고기', C.cream), it('우유', C.white)]),
		order('블록 3개 중 2개를 골라 위아래로 쌓는 방법은 모두 몇 가지일까요?', [it('빨간 블록', C.red), it('노란 블록', C.yellow), it('파란 블록', C.blue)], 2)
	],
	11: [
		pairs('셔츠 3벌과 바지 2벌 중에서 하나씩 골라 입는 방법은 모두 몇 가지일까요?', [it('빨간 셔츠', C.red), it('파란 셔츠', C.blue), it('노란 셔츠', C.yellow)], [it('검은 바지', C.black), it('흰 바지', C.white)]),
		choose('아이스크림 맛 4가지 중에서 2가지를 고르는 방법은?', [it('딸기', C.pink), it('초코', C.brown), it('바닐라', C.cream), it('민트', C.mint)]),
		paths('집에서 학원까지 가장 짧은 길은 모두 몇 가지일까요?', 2, 2),
		order('피아노, 영어, 코딩 학원에 가는 순서를 정하는 방법은?', [it('피아노', C.purple), it('영어', C.blue), it('코딩', C.green)]),
		pairs('빵 2가지와 음료 4가지 중에서 하나씩 고르는 방법은?', [it('식빵', C.cream), it('베이글', C.orange)], [it('우유', C.white), it('주스', C.orange), it('물', C.mint), it('코코아', C.brown)]),
		pairs('모자 3개와 목도리 3개 중에서 하나씩 고르는 방법은?', [it('빨간 모자', C.red), it('파란 모자', C.blue), it('노란 모자', C.yellow)], [it('초록 목도리', C.green), it('보라 목도리', C.purple), it('회색 목도리', C.gray)]),
		choose('다섯이 서로 한 번씩 악수를 하면 악수는 모두 몇 번일까요?', [JIHO, DAD, BEAR, CAT, it('선생님', C.orange)]),
		paths('가로 3칸, 세로 2칸 길에서 집에서 학원까지 가장 짧은 길은?', 3, 2)
	],
	15: [
		order('빨간 칸, 파란 칸, 노란 칸을 한 줄로 잇는 방법은 모두 몇 가지일까요?', [it('빨간 칸', C.red), it('파란 칸', C.blue), it('노란 칸', C.yellow)]),
		choose('축구팀 4개가 서로 한 번씩 경기하면 모두 몇 경기일까요?', [it('해 팀', C.orange), it('달 팀', C.yellow), it('별 팀', C.blue), it('구름 팀', C.gray)]),
		paths('집에서 공원까지 가장 짧은 길은 모두 몇 가지일까요?', 2, 2, '공원'),
		pairs('모자 2개와 목도리 4개 중에서 하나씩 고르는 방법은?', [it('빨간 모자', C.red), it('파란 모자', C.blue)], [it('노란 목도리', C.yellow), it('초록 목도리', C.green), it('보라 목도리', C.purple), it('회색 목도리', C.gray)]),
		pairs('피자 반죽 3가지와 토핑 3가지 중에서 하나씩 고르는 방법은?', [it('얇은 반죽', C.cream), it('두꺼운 반죽', C.orange), it('치즈 반죽', C.yellow)], [it('불고기', C.brown), it('옥수수', C.yellow), it('파인애플', C.orange)]),
		paths('가로 2칸, 세로 3칸 길에서 집에서 학원까지 가장 짧은 길은?', 2, 3),
		choose('공원 5곳 중에서 오늘 갈 두 곳을 고르는 방법은?', [it('놀이터', C.red), it('호수', C.blue), it('숲', C.green), it('꽃밭', C.pink), it('분수', C.mint)]),
		pairs('케이크 2가지와 초 5가지 색 중에서 하나씩 고르는 방법은?', [it('초코 케이크', C.brown), it('딸기 케이크', C.pink)], [it('빨간 초', C.red), it('파란 초', C.blue), it('노란 초', C.yellow), it('초록 초', C.green), it('보라 초', C.purple)])
	],
	19: [
		order('지호, 감돌이, 사랑이가 한 줄로 서서 생일 사진을 찍는 방법은 모두 몇 가지일까요?', [JIHO, BEAR, CAT]),
		choose('사랑이 장난감 4개 중에서 2개를 고르는 방법은?', [it('공', C.red), it('쥐 인형', C.gray), it('깃털', C.purple), it('방울', C.yellow)]),
		paths('집에서 수영장까지 가장 짧은 길은 모두 몇 가지일까요?', 2, 2, '수영장'),
		pairs('케이크 2가지와 음료 4가지 중에서 하나씩 고르는 방법은?', [it('초코 케이크', C.brown), it('딸기 케이크', C.pink)], [it('우유', C.white), it('주스', C.orange), it('물', C.mint), it('코코아', C.brown)]),
		pairs('셔츠 3벌과 바지 3벌 중에서 하나씩 골라 입는 방법은?', [it('빨간 셔츠', C.red), it('파란 셔츠', C.blue), it('노란 셔츠', C.yellow)], [it('검은 바지', C.black), it('흰 바지', C.white), it('회색 바지', C.gray)]),
		choose('다섯 명 중에서 두 명씩 짝을 지어 사진을 찍으면 사진은 모두 몇 장일까요?', [JIHO, DAD, BEAR, CAT, it('선생님', C.orange)]),
		order('네 명이 달리기를 해요. 1등과 2등이 되는 경우는 모두 몇 가지일까요?', [JIHO, DAD, BEAR, CAT], 2),
		pairs('빵 3가지와 잼 4가지 중에서 하나씩 고르는 방법은?', [it('식빵', C.cream), it('베이글', C.orange), it('모닝빵', C.brown)], [it('딸기잼', C.red), it('포도잼', C.purple), it('사과잼', C.yellow), it('땅콩잼', C.brown)])
	],
	23: [
		paths('집에서 축구장까지 가장 짧은 길은 모두 몇 가지일까요?', 2, 2, '축구장'),
		order('레고 로봇 3개를 한 줄로 세우는 방법은 모두 몇 가지일까요?', [it('빨간 로봇', C.red), it('파란 로봇', C.blue), it('초록 로봇', C.green)]),
		choose('축구팀 4개가 서로 한 번씩 경기하면 모두 몇 경기일까요?', [it('사자 팀', C.orange), it('호랑이 팀', C.yellow), it('독수리 팀', C.brown), it('상어 팀', C.blue)]),
		pairs('장갑 2켤레와 모자 4개 중에서 하나씩 고르는 방법은?', [it('빨간 장갑', C.red), it('파란 장갑', C.blue)], [it('노란 모자', C.yellow), it('초록 모자', C.green), it('보라 모자', C.purple), it('회색 모자', C.gray)]),
		pairs('기차 3대 중 하나를 타고 역 3곳 중 하나에서 내리는 방법은?', [it('빨간 기차', C.red), it('파란 기차', C.blue), it('노란 기차', C.yellow)], [it('바다역', C.mint), it('숲역', C.green), it('시장역', C.orange)]),
		paths('가로 3칸, 세로 2칸 동네에서 집에서 학원까지 가장 짧은 길은?', 3, 2),
		choose('영어 단어 카드 5장 중에서 2장을 고르는 방법은?', [it('cat', C.orange), it('dog', C.brown), it('sun', C.yellow), it('car', C.red), it('ball', C.blue)]),
		order('피아노 대회에 네 명이 나왔어요. 1등과 2등이 되는 경우는 모두 몇 가지일까요?', [it('지호', C.orange), it('하준', C.blue), it('서연', C.pink), it('도윤', C.green)], 2)
	]
};

// ---------- 줄 세우기 이름 (①은 만화와 같음) ----------
const PEOPLE = ['지호', '아빠', '감돌이', '사랑이', '선생님'];
const CARS = ['버스', '트럭', '택시', '빨간 차', '자전거'];
const CARRIAGES = ['빨간 칸', '파란 칸', '노란 칸', '초록 칸', '하얀 칸'];
const ANIMALS = ['곰', '고양이', '토끼', '강아지', '다람쥐'];
const LINEUP_ITEMS = {
	4: [['지호', '아빠', '감돌이'], ['버스', '트럭', '택시'], ['곰', '고양이', '토끼'], ['빨간 칸', '파란 칸', '노란 칸']],
	8: [['지호', '감돌이', '사랑이'], ['토끼', '강아지', '다람쥐'], ['택시', '자전거', '버스'], ['노란 칸', '초록 칸', '빨간 칸']],
	12: [CARRIAGES.slice(0, 4), PEOPLE.slice(0, 4), ANIMALS.slice(0, 4), CARS.slice(0, 4)],
	16: [CARS.slice(0, 4), ANIMALS.slice(1, 5), PEOPLE.slice(1, 5), CARRIAGES.slice(1, 5)],
	20: [PEOPLE.slice(0, 4), ANIMALS.slice(0, 4), CARS, CARRIAGES],
	24: [PEOPLE, ANIMALS, CARS, CARRIAGES]
};

// ---------- 생성 ----------

/** 주차장: 자리별 가장 적은 횟수 목표 (1번 만에 풀리는 퍼즐은 쓰지 않음) */
function parkingTargets(round) {
	const [lo0, hi] = PARKING_RANGES[round];
	const lo = Math.max(lo0, 2);
	return Array.from({ length: 8 }, (_, i) => lo + Math.floor((i * (hi - lo + 1)) / 8));
}

/** 조건에 맞는 것이 나올 때까지 다시 만든다 */
function until(make, ok, tries = 5000) {
	for (let i = 0; i < tries; i++) {
		const p = make();
		if (ok(p)) return p;
	}
	throw new Error('조건에 맞는 퍼즐을 만들지 못함');
}

const used = { parking: new Set(), blocks: new Set(), sudoku: new Set(), lineup: new Set() };

function puzzlesOf(ep) {
	const round = roundOf(ep.id);
	const rng = makeRng(ep.id * 100);
	if (ep.activity === 'parking') {
		return parkingTargets(round).map((t) => {
			const p = generateParking(rng, [t, t], used.parking);
			used.parking.add(p.board.join('/'));
			return p;
		});
	}
	if (ep.activity === 'blocks') {
		const list = Array.from({ length: 8 }, () => {
			const p = generateBlocks(rng, round, used.blocks);
			used.blocks.add(p.heights.join('/'));
			return p;
		}).sort((a, b) => blockCount(parseHeights(a.heights)) - blockCount(parseHeights(b.heights)));
		// ① 만화: "블록은 모두 몇 개일까?" (라운드 5·6 만화는 "위에서 본 모양에 층수를 써 볼까?"도 말함)
		list[0] = { ...list[0], ask: round >= 5 ? ['topNumbers', 'count'] : ['count'] };
		return list;
	}
	if (ep.activity === 'counting') return structuredClone(COUNTING_PLAN[ep.id]);

	// 논리: ①③④⑤ 줄 세우기 (이름 수·단서 수 오름차순), ②⑥⑦⑧ 스도쿠 (빈칸 오름차순)
	const names = LINEUP_ITEMS[ep.id];
	const { items: itemRange, clues: clueRange } = LINEUP_RANGES[round];
	const clueTargets = [clueRange[0], clueRange[0], clueRange[1], clueRange[1]];
	const lineups = names.map((items, i) => {
		const n = Math.min(Math.max(items.length, itemRange[0]), itemRange[1]);
		const p = until(
			() => generateLineup(rng, round, items.slice(0, n)),
			(q) => q.clues.length === clueTargets[i] && !used.lineup.has(JSON.stringify(q))
		);
		used.lineup.add(JSON.stringify(p));
		return p;
	});
	const [blo, bhi] = SUDOKU_BLANKS[round];
	const blankTargets = [blo, blo, bhi, bhi];
	const sudokus = blankTargets.map((b) => {
		const s = until(
			() => generateSudoku(rng, round, used.sudoku),
			(q) => q.grid.join('').split('').filter((ch) => ch === '.').length === b
		);
		used.sudoku.add(s.grid.join('/'));
		return s;
	});
	return [lineups[0], sudokus[0], lineups[1], lineups[2], lineups[3], sudokus[1], sudokus[2], sudokus[3]];
}

for (const ep of loadEpisodes(THINK_DIR)) {
	const file = join(THINK_DIR, `ep${String(ep.id).padStart(2, '0')}.json`);
	const data = JSON.parse(readFileSync(file, 'utf8'));
	data.puzzles = puzzlesOf(ep);
	writeFileSync(file, JSON.stringify(data, null, '\t') + '\n');
	console.log(`${ep.id}회 ${ep.activity}: 퍼즐 8개`);
}
