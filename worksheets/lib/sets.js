// 학습지 세트(곱셈/나눗셈)마다 데이터 폴더·검사·렌더러·출력 폴더를 묶는다.
import { DIVISION_DIR, EPISODE_DIR, validateDivEpisode, validateEpisode } from './episodes.js';
import { renderDivEpisode, renderEpisode } from './render-page.js';
import { renderAnswerKey, renderDivAnswerKey } from './render-answers.js';

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
	}
};

/** @param {string} [key] 'mul' | 'div' */
export function setOf(key = 'mul') {
	const set = SETS[key];
	if (!set) throw new Error(`없는 세트: ${key}`);
	return set;
}
