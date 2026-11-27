import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProblem, pickPractice, stageOf } from './numbers.js';
import { analyzeDiv, checkDivProblem, divCompare, pickDivPractice } from './division.js';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const EPISODE_DIR = join(ROOT, 'data', 'episodes');
export const DIVISION_DIR = join(ROOT, 'data', 'division');
const STICKER_FILE = join(ROOT, 'data', 'stickers.json');

export const MAX_BUBBLE_CHARS = 40;

/** @returns {any[]} 회차 목록(id 오름차순) */
export function loadEpisodes(dir = EPISODE_DIR) {
	return readdirSync(dir)
		.filter((f) => /^ep\d+\.json$/.test(f))
		.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
		.sort((a, b) => a.id - b.id);
}

/** @returns {{ id: string, file: string, prompt: string }[]} */
export function loadStickers() {
	return JSON.parse(readFileSync(STICKER_FILE, 'utf8'));
}

/** 변형 문제 7개 (②~⑧) */
export function practiceOf(ep) {
	return ep.practice ?? pickPractice(ep.fixed, ep.story.other, stageOf(ep.id));
}

/** 나눗셈 변형 문제 7개 (②~⑧) */
export function divPracticeOf(ep) {
	return ep.practice ?? pickDivPractice(ep.divisor, ep.story.dividend, stageOf(ep.id), ep.id);
}

/** 두 세트 공통: id·제목·단위 */
function headerErrors(ep, tag) {
	const errors = [];
	if (!Number.isInteger(ep.id) || ep.id < 1 || ep.id > 24) errors.push(`${tag}: id는 1~24`);
	if (!ep.title) errors.push(`${tag}: 제목 없음`);
	if (!ep.story?.unit) errors.push(`${tag}: 이야기 문제 단위 없음`);
	return errors;
}

/** 두 세트 공통: 변형 문제 7개 목록 */
function practiceErrors(tag, practice, storyValue, check) {
	const errors = [];
	if (practice.length !== 7) errors.push(`${tag}: 변형 문제는 7개여야 함`);
	if (new Set(practice).size !== practice.length) errors.push(`${tag}: 변형 문제 중복`);
	if (practice.includes(storyValue)) errors.push(`${tag}: 변형 문제에 이야기 수 ${storyValue}가 있음`);
	practice.forEach((v, i) => errors.push(...check(v, i + 2).map((e) => `${tag}: ${e}`)));
	return errors;
}

/**
 * @param {any} ep
 * @param {Set<string>} stickerIds
 * @returns {string[]} 오류 목록(빈 배열 = 통과)
 */
export function validateEpisode(ep, stickerIds) {
	const tag = `${ep.id}회`;
	const errors = headerErrors(ep, tag);
	if (errors.length) return errors;

	const stage = stageOf(ep.id);
	errors.push(...checkProblem(stage, ep.fixed, ep.story.other, 1).map((e) => `${tag}: ${e}`));
	errors.push(...practiceErrors(tag, practiceOf(ep), ep.story.other, (b, pos) => checkProblem(stage, ep.fixed, b, pos)));
	errors.push(...validatePanels(ep, stickerIds, tag));
	return errors;
}

/**
 * 나눗셈 회차 검사
 * @param {any} ep
 * @param {Set<string>} stickerIds
 * @returns {string[]} 오류 목록(빈 배열 = 통과)
 */
export function validateDivEpisode(ep, stickerIds) {
	const tag = `${ep.id}회`;
	const errors = headerErrors(ep, tag);
	if (errors.length) return errors;

	const stage = stageOf(ep.id);
	const n = ep.story.dividend;
	errors.push(...checkDivProblem(stage, n, ep.divisor, 1).map((e) => `${tag}: ${e}`));
	if (errors.length) return errors;
	if (analyzeDiv(n, ep.divisor).remainder > 0 && !ep.story.restUnit) {
		errors.push(`${tag}: 나머지가 있는 이야기는 남는 것의 단위(restUnit)가 필요함`);
	}
	const practice = divPracticeOf(ep);
	errors.push(...practiceErrors(tag, practice, n, (m, pos) => checkDivProblem(stage, m, ep.divisor, pos)));
	const sorted = [...practice].sort(divCompare(ep.divisor));
	if (sorted.some((m, i) => m !== practice[i])) {
		errors.push(`${tag}: 변형 문제 순서는 쉬운 것부터(내림 없음 → 내림 → 나머지, 작은 수부터)`);
	}
	errors.push(...validatePanels(ep, stickerIds, tag));
	return errors;
}

/** 두 세트 공통: 4컷 만화 (컷 수, 말풍선 수·길이·화자, 스티커, 마지막 질문) */
export function validatePanels(ep, stickerIds, tag) {
	const errors = [];
	const panels = ep.panels ?? [];
	if (panels.length !== 4) errors.push(`${tag}: 컷은 4개여야 함 (${panels.length}개)`);
	panels.forEach((panel, i) => {
		const bubbles = panel.bubbles ?? [];
		if (bubbles.length < 1 || bubbles.length > 2) errors.push(`${tag} ${i + 1}컷: 말풍선 1~2개`);
		for (const b of bubbles) {
			if ([...b.text].length > MAX_BUBBLE_CHARS) errors.push(`${tag} ${i + 1}컷: 말풍선 ${MAX_BUBBLE_CHARS}자 초과 "${b.text}"`);
		}
		const ids = new Set((panel.stickers ?? []).map((s) => s.id));
		for (const b of bubbles) {
			if (!b.speaker) errors.push(`${tag} ${i + 1}컷: 말하는 캐릭터가 정해지지 않음 "${b.text}"`);
			else if (!ids.has(b.speaker)) errors.push(`${tag} ${i + 1}컷: 말하는 캐릭터 ${b.speaker}가 이 컷에 없음`);
		}
		for (const s of panel.stickers ?? []) {
			if (!stickerIds.has(s.id)) errors.push(`${tag} ${i + 1}컷: 없는 스티커 ${s.id}`);
		}
	});
	const last = panels[3]?.bubbles ?? [];
	if (!last.length || !last[last.length - 1].text.trim().endsWith('?')) {
		errors.push(`${tag}: 4번 컷 마지막 말풍선은 질문(?)이어야 함`);
	}
	return errors;
}
