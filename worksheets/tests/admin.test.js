import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DIVISION_DIR, ROOT, loadEpisodes } from '../lib/episodes.js';
import { applyTextEdits, textOf } from '../admin/edit.js';
import { createAdminServer } from '../admin/server.js';
import { makeThinkEpisode } from './fixtures/think-episodes.js';

const [ep01] = loadEpisodes();
const [divEp01] = loadEpisodes(DIVISION_DIR);

describe('applyTextEdits', () => {
	it('copies only text fields and ignores numbers and positions', () => {
		const edits = textOf(ep01);
		edits.title = '새 제목';
		edits.unit = '사람';
		edits.panels[0][0] = '새 대사!';
		edits.fixed = 99;
		const out = applyTextEdits(ep01, { ...edits, panels: edits.panels.map((p) => [...p]) });
		expect(out.title).toBe('새 제목');
		expect(out.story.unit).toBe('사람');
		expect(out.panels[0].bubbles[0].text).toBe('새 대사!');
		expect(out.fixed).toBe(16);
		expect(out.panels[0].bubbles[0].x).toBe(ep01.panels[0].bubbles[0].x);
		expect(ep01.title).toBe('월드컵 16강'); // 원본은 그대로
	});

	it('describes the problem for either set', () => {
		expect(textOf(ep01).problem).toBe('16 × 11');
		expect(textOf(divEp01).problem).toBe('26 ÷ 2');
	});

	it('edits a thinking puzzle episode, which has no story unit', () => {
		const think = makeThinkEpisode(1);
		const edits = textOf(think);
		expect(edits.problem).toBe('주차장 탈출');
		expect(edits).not.toHaveProperty('unit');
		expect(textOf(makeThinkEpisode(4)).problem).toBe('논리 퍼즐');
		edits.title = '아빠 차 꺼내기';
		const out = applyTextEdits(think, edits);
		expect(out.title).toBe('아빠 차 꺼내기');
		expect(out.story).toBeUndefined();
		expect(out.puzzles).toEqual(think.puzzles);
	});

	it('rejects a different number of bubbles', () => {
		const edits = textOf(ep01);
		edits.panels[0].push('하나 더');
		expect(() => applyTextEdits(ep01, edits)).toThrow();
	});
});

describe('admin server', () => {
	let dir, divDir, thinkDir, server, base;
	const built = [];
	beforeAll(async () => {
		dir = mkdtempSync(join(tmpdir(), 'ws-admin-'));
		divDir = mkdtempSync(join(tmpdir(), 'ws-admin-div-'));
		cpSync(join(ROOT, 'data', 'episodes'), dir, { recursive: true });
		cpSync(DIVISION_DIR, divDir, { recursive: true });
		thinkDir = mkdtempSync(join(tmpdir(), 'ws-admin-think-'));
		writeFileSync(join(thinkDir, 'ep01.json'), JSON.stringify(makeThinkEpisode(1)));
		server = createAdminServer({
			dirs: { mul: dir, div: divDir, think: thinkDir },
			build: async (set) => {
				built.push(set);
				return { ok: true, log: 'fake build' };
			}
		});
		await new Promise((r) => server.listen(0, '127.0.0.1', r));
		base = `http://127.0.0.1:${server.address().port}`;
	});
	afterAll(() => {
		server.close();
		rmSync(dir, { recursive: true, force: true });
		rmSync(divDir, { recursive: true, force: true });
		rmSync(thinkDir, { recursive: true, force: true });
	});

	it('lists 24 episodes', async () => {
		const list = await (await fetch(`${base}/api/episodes`)).json();
		expect(list).toHaveLength(24);
		expect(list[0]).toEqual({ id: 1, title: '월드컵 16강', icon: '⚽' });
	});

	it('returns editable text for one episode', async () => {
		const t = await (await fetch(`${base}/api/episodes/1`)).json();
		expect(t.title).toBe('월드컵 16강');
		expect(t.panels).toHaveLength(4);
		expect(t.panels[3].at(-1)).toContain('?');
	});

	it('saves valid edits to the episode file', async () => {
		const t = await (await fetch(`${base}/api/episodes/1`)).json();
		t.panels[0][0] = '아빠! 16강 경기 같이 봐요!';
		const res = await fetch(`${base}/api/episodes/1`, { method: 'PUT', body: JSON.stringify(t) });
		expect(res.status).toBe(200);
		const saved = JSON.parse(readFileSync(join(dir, 'ep01.json'), 'utf8'));
		expect(saved.panels[0].bubbles[0].text).toBe('아빠! 16강 경기 같이 봐요!');
		expect(saved.fixed).toBe(16);
	});

	it('refuses edits that break the rules and keeps the file', async () => {
		const t = await (await fetch(`${base}/api/episodes/1`)).json();
		t.panels[3][t.panels[3].length - 1] = '질문이 아니에요.';
		const res = await fetch(`${base}/api/episodes/1`, { method: 'PUT', body: JSON.stringify(t) });
		expect(res.status).toBe(400);
		expect((await res.json()).errors.join(' ')).toContain('질문');
		const saved = JSON.parse(readFileSync(join(dir, 'ep01.json'), 'utf8'));
		expect(saved.panels[3].bubbles.at(-1).text).toContain('?');
	});

	it('renders a preview of unsaved text', async () => {
		const t = await (await fetch(`${base}/api/episodes/2`)).json();
		t.title = '미리보기 제목';
		const html = await (await fetch(`${base}/api/preview/2`, { method: 'POST', body: JSON.stringify(t) })).text();
		expect(html).toContain('미리보기 제목');
		expect(html).toContain('class="page front"');
	});

	it('runs the build', async () => {
		const res = await (await fetch(`${base}/api/build`, { method: 'POST' })).json();
		expect(res).toEqual({ ok: true, log: 'fake build' });
		expect(built.at(-1)).toBe('mul');
	});

	it('lists, edits, previews and builds the division set separately', async () => {
		const list = await (await fetch(`${base}/api/episodes?set=div`)).json();
		expect(list[0]).toEqual({ id: 1, title: '축구공 나누기', icon: '⚽' });

		const t = await (await fetch(`${base}/api/episodes/1?set=div`)).json();
		expect(t.problem).toBe('26 ÷ 2');
		t.title = '축구공을 나눠요';
		const res = await fetch(`${base}/api/episodes/1?set=div`, { method: 'PUT', body: JSON.stringify(t) });
		expect(res.status).toBe(200);
		expect(JSON.parse(readFileSync(join(divDir, 'ep01.json'), 'utf8')).title).toBe('축구공을 나눠요');
		expect(JSON.parse(readFileSync(join(dir, 'ep01.json'), 'utf8')).divisor).toBeUndefined(); // 곱셈 파일은 그대로

		const html = await (await fetch(`${base}/api/preview/1?set=div`, { method: 'POST', body: JSON.stringify(t) })).text();
		expect(html).toContain('div-set');
		expect(html).toContain('축구공을 나눠요');

		await fetch(`${base}/api/build?set=div`, { method: 'POST' });
		expect(built.at(-1)).toBe('div');
	});

	it('edits and previews the thinking puzzle set', async () => {
		const got = await (await fetch(`${base}/api/episodes/1?set=think`)).json();
		expect(got.problem).toBe('주차장 탈출');
		expect(got).not.toHaveProperty('unit');
		got.panels[0][0] = '고친 말';
		const res = await fetch(`${base}/api/episodes/1?set=think`, { method: 'PUT', body: JSON.stringify(got) });
		expect(res.status).toBe(200);
		expect(JSON.parse(readFileSync(join(thinkDir, 'ep01.json'), 'utf8')).panels[0].bubbles[0].text).toBe('고친 말');
		const html = await (await fetch(`${base}/api/preview/1?set=think`, { method: 'POST', body: JSON.stringify(got) })).text();
		expect(html).toContain('think-set');
		await fetch(`${base}/api/build?set=think`, { method: 'POST' });
		expect(built.at(-1)).toBe('think');
	});

	it('refuses an unknown set', async () => {
		const res = await fetch(`${base}/api/episodes?set=x`);
		expect(res.status).toBe(400);
	});
});
