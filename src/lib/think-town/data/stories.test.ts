import { describe, it, expect } from 'vitest';
import { STORIES, TALK } from './stories';
import { PLACE_IDS } from '../rules/progress';

describe('이야기', () => {
	it('주차장·매표소는 단계 5개 × 3컷', () => {
		for (const place of ['parking', 'ticket'] as const) {
			expect(STORIES[place]).toHaveLength(5);
			for (const story of STORIES[place]!) expect(story).toHaveLength(3);
		}
	});
	it('말풍선은 1~40자, 3번째 컷은 질문으로 끝남, 화자는 그 컷에 나옴', () => {
		for (const stories of Object.values(STORIES)) {
			for (const story of stories!) {
				story.forEach((panel, i) => {
					expect(panel.text.length).toBeGreaterThan(0);
					expect(panel.text.length).toBeLessThanOrEqual(40);
					if (i === 2) expect(panel.text.endsWith('?')).toBe(true);
					expect(panel.cast.map((c) => c.sticker)).toContain(panel.speaker);
				});
			}
		}
	});
	it('스티커 파일이 모두 있다', () => {
		const ids = Object.values(STORIES).flatMap((s) => s!.flat().flatMap((p) => p.cast.map((c) => c.sticker)));
		const files = Object.keys(import.meta.glob('/static/think-town/stickers/*.png'));
		for (const id of new Set(ids)) expect(files, id).toContain(`/static/think-town/stickers/${id}.png`);
	});
	it('대화 카드 질문은 장소 6곳 모두', () => {
		for (const id of PLACE_IDS) expect(TALK[id].length).toBeGreaterThan(0);
	});
});
