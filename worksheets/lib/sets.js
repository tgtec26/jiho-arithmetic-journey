// 학습지 세트(곱셈/나눗셈/생각 퍼즐)마다 데이터 폴더·검사·렌더러·출력 폴더를 묶는다.
import { DIVISION_DIR, EPISODE_DIR, validateDivEpisode, validateEpisode } from './episodes.js';
import { renderDivEpisode, renderEpisode, renderThinkEpisode } from './render-page.js';
import { renderAnswerKey, renderDivAnswerKey, renderThinkAnswerKey } from './render-answers.js';
import { THINK_DIR, validateThinkEpisode } from './think/episode.js';
import { renderPiecesSheet } from './think/render-parking.js';

export const SETS = {
	mul: {
		key: 'mul',
		name: '곱셈',
		dir: EPISODE_DIR,
		outSub: '',
		validate: validateEpisode,
		renderEpisode,
		renderAnswers: renderAnswerKey,
		docTitle: '지호의 곱셈 이야기'
	},
	div: {
		key: 'div',
		name: '나눗셈',
		dir: DIVISION_DIR,
		outSub: 'division',
		validate: validateDivEpisode,
		renderEpisode: renderDivEpisode,
		renderAnswers: renderDivAnswerKey,
		docTitle: '지호의 나눗셈 이야기'
	},
	think: {
		key: 'think',
		name: '생각 퍼즐',
		dir: THINK_DIR,
		outSub: 'think',
		validate: validateThinkEpisode,
		renderEpisode: renderThinkEpisode,
		renderAnswers: renderThinkAnswerKey,
		docTitle: '지호의 생각 퍼즐',
		answersPerPage: 4,
		// 양면 묶음에 넣지 않고 따로 한 번만 인쇄하는 차 조각 장
		extraDocs: [{ name: 'pieces', title: '주차장 탈출 차 조각', render: renderPiecesSheet, pages: 1 }]
	}
};

/** @param {string} [key] 'mul' | 'div' | 'think' */
export function setOf(key = 'mul') {
	const set = SETS[key];
	if (!set) throw new Error(`없는 세트: ${key}`);
	return set;
}
