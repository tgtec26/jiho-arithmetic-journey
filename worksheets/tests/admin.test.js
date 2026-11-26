import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ROOT, loadEpisodes } from '../lib/episodes.js';
import { applyTextEdits, textOf } from '../admin/edit.js';
import { createAdminServer } from '../admin/server.js';

const [ep01] = loadEpisodes();

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

	it('rejects a different number of bubbles', () => {
		const edits = textOf(ep01);
		edits.panels[0].push('하나 더');
		expect(() => applyTextEdits(ep01, edits)).toThrow();
	});
});

describe('admin server', () => {
	let dir, server, base;
	beforeAll(async () => {
		dir = mkdtempSync(join(tmpdir(), 'ws-admin-'));
		cpSync(join(ROOT, 'data', 'episodes'), dir, { recursive: true });
		server = createAdminServer({ episodeDir: dir, build: async () => ({ ok: true, log: 'fake build' }) });
		await new Promise((r) => server.listen(0, '127.0.0.1', r));
		base = `http://127.0.0.1:${server.address().port}`;
	});
	afterAll(() => {
		server.close();
		rmSync(dir, { recursive: true, force: true });
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
	});
});
