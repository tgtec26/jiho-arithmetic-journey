// 시험용 생각 퍼즐 회차: 생성기(고정 seed)로 퍼즐 8개를 만들고 나눗셈 1회 만화를 빌린다.
import { DIVISION_DIR, loadEpisodes } from '../../lib/episodes.js';
import { activityOf, makeRng, roundOf } from '../../lib/think/common.js';
import { PARKING_RANGES, generateParking } from '../../lib/think/parking.js';
import { blockCount, generateBlocks, parseHeights } from '../../lib/think/blocks.js';
import { generateLineup, generateSudoku } from '../../lib/think/logic.js';

const [div1] = loadEpisodes(DIVISION_DIR);
const c = (name, color) => ({ name, color });

/** 라운드 1 경우의 수 8문제 (답 2,2,3,4,6,6,6,6) */
const COUNTING_R1 = [
	{ kind: 'pairs', text: '모자 2개, 신발 1켤레', left: [c('빨강', '#e5533d'), c('파랑', '#3d7be5')], right: [c('검정', '#333')] },
	{ kind: 'order', text: '두 명이 줄 서는 순서', items: [c('지호'), c('아빠')], pick: 2 },
	{ kind: 'pairs', text: '셔츠 3벌, 바지 1벌', left: [c('빨강'), c('파랑'), c('노랑')], right: [c('검정')] },
	{ kind: 'pairs', text: '셔츠 2벌, 바지 2벌', left: [c('빨강'), c('파랑')], right: [c('검정'), c('흰색')] },
	{ kind: 'pairs', text: '셔츠 3벌, 바지 2벌', left: [c('빨강'), c('파랑'), c('노랑')], right: [c('검정'), c('흰색')] },
	{ kind: 'order', text: '기차 칸 세 개 순서', items: [c('빨강'), c('파랑'), c('노랑')], pick: 3 },
	{ kind: 'order', text: '세 명 중 1등·2등', items: [c('지호'), c('아빠'), c('감돌이')], pick: 2 },
	{ kind: 'pairs', text: '콘 2개, 맛 3가지', left: [c('과자 콘'), c('컵')], right: [c('딸기'), c('초코'), c('바닐라')] }
];

function puzzlesFor(activity, round, rng) {
	if (activity === 'parking') {
		const [lo, hi] = PARKING_RANGES[round];
		const avoid = new Set();
		return Array.from({ length: 8 }, (_, i) => {
			const t = lo + Math.floor((i * (hi - lo + 1)) / 8);
			const p = generateParking(rng, [t, t], avoid);
			avoid.add(p.board.join('/'));
			return p;
		});
	}
	if (activity === 'blocks') {
		const avoid = new Set();
		const list = Array.from({ length: 8 }, () => {
			const p = generateBlocks(rng, round, avoid);
			avoid.add(p.heights.join('/'));
			return p;
		});
		return list.sort((a, b) => blockCount(parseHeights(a.heights)) - blockCount(parseHeights(b.heights)));
	}
	if (activity === 'counting') return structuredClone(COUNTING_R1);
	const names = ['지호', '아빠', '감돌이', '사랑이', '손님'].slice(0, round >= 5 ? 5 : round >= 3 ? 4 : 3);
	const avoid = new Set();
	const sudokus = Array.from({ length: 4 }, () => {
		const s = generateSudoku(rng, round, avoid);
		avoid.add(s.grid.join('/'));
		return s;
	}).sort((a, b) => a.grid.join('').split('.').length - b.grid.join('').split('.').length);
	const lineups = Array.from({ length: 4 }, () => generateLineup(rng, round, names)).sort((a, b) => a.clues.length - b.clues.length);
	return [lineups[0], sudokus[0], lineups[1], lineups[2], lineups[3], sudokus[1], sudokus[2], sudokus[3]];
}

/** 올바른 생각 퍼즐 회차 (id 1~4는 네 활동 각각, 라운드 1) */
export function makeThinkEpisode(id) {
	const activity = activityOf(id);
	return {
		id,
		topic: 'test',
		icon: '🧩',
		title: `시험 ${id}회`,
		activity,
		puzzles: puzzlesFor(activity, roundOf(id), makeRng(id * 1000)),
		panels: structuredClone(div1.panels)
	};
}
