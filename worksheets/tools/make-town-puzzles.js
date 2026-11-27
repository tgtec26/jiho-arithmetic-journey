// 생각 마을(태블릿) 퍼즐을 미리 만들어 앱에 넣는다: node worksheets/tools/make-town-puzzles.js
// 주차장·줄 세우기, 단계 1~4는 12개씩, 단계 5(끝낸 뒤 계속하기 포함)는 40개. 단계 s = 학습지 라운드 s 범위.
// 학습지에 나온 판과 앞서 만든 판은 피한다. seed 고정이라 같은 입력이면 같은 결과.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeRng } from '../lib/think/common.js';
import { PARKING_RANGES, generateParking } from '../lib/think/parking.js';
import { generateLineup } from '../lib/think/logic.js';
import { LINEUP_CAST_BY_STAGE } from '../../src/lib/think-town/data/cast.ts';

const ROOT = new URL('../..', import.meta.url).pathname;
const THINK = join(ROOT, 'worksheets/data/think');
const OUT = join(ROOT, 'src/lib/think-town/data/puzzles.json');
const COUNTS = [12, 12, 12, 12, 40];

const episodes = readdirSync(THINK)
	.filter((f) => /^ep\d+\.json$/.test(f))
	.map((f) => JSON.parse(readFileSync(join(THINK, f), 'utf8')));
const usedBoards = new Set(episodes.filter((e) => e.activity === 'parking').flatMap((e) => e.puzzles.map((p) => p.board.join('/'))));
const usedClues = new Set(episodes.flatMap((e) => e.puzzles.filter((p) => p.kind === 'lineup').map((p) => JSON.stringify(p.clues))));

const parking = COUNTS.map((n, i) => {
	const stage = i + 1;
	const rng = makeRng(20261127 + stage);
	// 생성기는 범위 맨 아래에서 멈추므로, 목표 횟수를 범위 안에서 돌려 가며 고르게 섞는다
	const [lo, hi] = PARKING_RANGES[stage];
	return Array.from({ length: n }, (_, k) => {
		const t = lo + (k % (hi - lo + 1));
		const p = generateParking(rng, [t, t], usedBoards);
		usedBoards.add(p.board.join('/'));
		return p;
	});
});

const lineup = COUNTS.map((n, i) => {
	const stage = i + 1;
	const rng = makeRng(20261227 + stage);
	const out = [];
	while (out.length < n) {
		const p = generateLineup(rng, stage, LINEUP_CAST_BY_STAGE[i]);
		const key = JSON.stringify(p.clues);
		if (usedClues.has(key)) continue;
		usedClues.add(key);
		out.push(p);
	}
	return out;
});

writeFileSync(OUT, JSON.stringify({ parking, lineup }) + '\n');
console.log(`parking ${parking.flat().length}, lineup ${lineup.flat().length} → ${OUT}`);
