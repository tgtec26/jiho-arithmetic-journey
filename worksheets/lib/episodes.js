import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProblem, pickPractice, stageOf } from './numbers.js';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
const EPISODE_DIR = join(ROOT, 'data', 'episodes');
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

/**
 * @param {any} ep
 * @param {Set<string>} stickerIds
 * @returns {string[]} 오류 목록(빈 배열 = 통과)
 */
export function validateEpisode(ep, stickerIds) {
	const errors = [];
	const tag = `${ep.id}회`;
	if (!Number.isInteger(ep.id) || ep.id < 1 || ep.id > 24) errors.push(`${tag}: id는 1~24`);
	if (!ep.title) errors.push(`${tag}: 제목 없음`);
	if (!ep.story?.unit) errors.push(`${tag}: 이야기 문제 단위 없음`);
	if (errors.length) return errors;

	const stage = stageOf(ep.id);
	errors.push(...checkProblem(stage, ep.fixed, ep.story.other, 1).map((e) => `${tag}: ${e}`));

	const practice = practiceOf(ep);
	if (practice.length !== 7) errors.push(`${tag}: 변형 문제는 7개여야 함`);
	if (new Set(practice).size !== practice.length) errors.push(`${tag}: 변형 문제 중복`);
	if (practice.includes(ep.story.other)) errors.push(`${tag}: 변형 문제에 이야기 수 ${ep.story.other}가 있음`);
	practice.forEach((b, i) => errors.push(...checkProblem(stage, ep.fixed, b, i + 2).map((e) => `${tag}: ${e}`)));

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
			if (b.speaker && !ids.has(b.speaker)) errors.push(`${tag} ${i + 1}컷: 말하는 캐릭터 ${b.speaker}가 이 컷에 없음`);
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
