// 생각 퍼즐 회차: 검사, 문제 칸 8개, 정답 줄.
import { join } from 'node:path';
import { ROOT, validatePanels } from '../episodes.js';
import { escapeHtml } from '../html.js';
import { activityOf, circled, roundOf } from './common.js';
import { checkParkingPuzzle } from './parking.js';
import { blockCount, checkBlocksPuzzle, parseHeights } from './blocks.js';
import { checkCountingPuzzle, countingAnswer } from './counting.js';
import { checkLogicPuzzle } from './logic.js';
import { parkingAnswer, renderParkingProblem } from './render-parking.js';
import { blocksAnswer, renderBlocksProblem } from './render-blocks.js';
import { countingAnswerText, renderCountingProblem } from './render-counting.js';
import { logicAnswer, renderLineupProblem, renderSudokuProblem } from './render-logic.js';

export const THINK_DIR = join(ROOT, 'data', 'think');

const CHECK = {
	parking: checkParkingPuzzle,
	blocks: checkBlocksPuzzle,
	counting: checkCountingPuzzle,
	logic: checkLogicPuzzle
};

/** 쉬운 것부터 비교할 값 (앞 값부터 비교) */
export function difficultyOf(activity, p) {
	if (activity === 'parking') return [p.minMoves];
	if (activity === 'blocks') return [blockCount(parseHeights(p.heights))];
	if (activity === 'counting') return [countingAnswer(p)];
	if (p.kind === 'lineup') return [p.items.length, p.clues.length];
	return [p.grid.join('').split('').filter((ch) => ch === '.').length];
}

const lessOrEqual = (a, b) => {
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
	return true;
};

/** 자리 번호 묶음이 쉬운 것부터인지 */
function ordered(ep, positions) {
	const d = positions.map((pos) => difficultyOf(ep.activity, ep.puzzles[pos - 1]));
	return d.every((v, i) => i === 0 || lessOrEqual(d[i - 1], v));
}

/**
 * @param {any} ep
 * @param {Set<string>} stickerIds
 * @returns {string[]} 오류 목록(빈 배열 = 통과)
 */
export function validateThinkEpisode(ep, stickerIds) {
	const tag = `${ep.id}회`;
	if (!Number.isInteger(ep.id) || ep.id < 1 || ep.id > 24) return [`${tag}: id는 1~24`];
	const errors = [];
	if (!ep.title) errors.push(`${tag}: 제목 없음`);
	const activity = activityOf(ep.id);
	if (ep.activity !== activity) return [...errors, `${tag}: 활동은 ${activity}이어야 함 (${ep.activity})`];
	const puzzles = ep.puzzles ?? [];
	if (puzzles.length !== 8) return [...errors, `${tag}: 퍼즐은 8개여야 함 (${puzzles.length}개)`];

	const round = roundOf(ep.id);
	puzzles.forEach((p, i) => errors.push(...CHECK[activity](p, round, i + 1).map((e) => `${tag} ${circled(i + 1)}: ${e}`)));
	const keys = puzzles.map((p) => JSON.stringify(p));
	if (new Set(keys).size !== keys.length) errors.push(`${tag}: 같은 퍼즐이 두 번 있음`);
	if (!errors.length) {
		const groups = activity === 'logic' ? [[1, 3, 4, 5], [2, 6, 7, 8]] : [[1, 2], [2, 3, 4, 5, 6, 7, 8]];
		if (!groups.every((g) => ordered(ep, g))) errors.push(`${tag}: 퍼즐 순서는 쉬운 것부터`);
	}
	errors.push(...validatePanels(ep, stickerIds, tag));
	return errors;
}

/**
 * 문제 칸 8개
 * @param {any} ep
 * @param {(id: string) => string | null} stickerSrc
 */
export function renderThinkProblems(ep, stickerSrc) {
	const round = roundOf(ep.id);
	return ep.puzzles.map((puzzle, i) => {
		const a = { puzzle, position: i + 1, round };
		if (ep.activity === 'parking') return renderParkingProblem(a);
		if (ep.activity === 'blocks') return renderBlocksProblem(a);
		if (ep.activity === 'counting') return renderCountingProblem({ ...a, stickerSrc });
		return puzzle.kind === 'lineup' ? renderLineupProblem(a) : renderSudokuProblem(a);
	});
}

const ANSWER = { parking: parkingAnswer, blocks: blocksAnswer, counting: (p) => escapeHtml(countingAnswerText(p)), logic: logicAnswer };

/** 정답지 한 회의 줄들 (blocks·logic은 작은 그림 HTML이 섞임) */
export function thinkAnswerLines(ep) {
	return ep.puzzles.map((p, i) => `<div class="ans">${circled(i + 1)} ${ANSWER[ep.activity](p)}</div>`).join('');
}
