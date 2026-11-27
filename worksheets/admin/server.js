// 학습지 텍스트 어드민 (이 Mac 전용): npm run ws:admin → http://127.0.0.1:5180
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadEpisodes, loadStickers } from '../lib/episodes.js';
import { wrapDocument } from '../lib/render-page.js';
import { setOf } from '../lib/sets.js';
import { applyTextEdits, textOf } from './edit.js';
import { makeStickerLookup } from '../lib/stickers.js';

const PORT = 5180;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.pdf': 'application/pdf', '.js': 'text/javascript' };

/** 한 세트의 PDF 다시 만들기 (build.js --strict --set=…) */
function runBuild(setKey) {
	return new Promise((resolve) => {
		const args = [join(ROOT, 'build.js'), '--strict', `--set=${setKey}`];
		execFile('node', args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
			const log = `${stdout}${stderr}`.trim().split('\n').slice(-8).join('\n');
			resolve({ ok: !err, log });
		});
	});
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
	res.writeHead(status, { 'content-type': type });
	res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req) {
	let raw = '';
	for await (const chunk of req) raw += chunk;
	return JSON.parse(raw || '{}');
}

/** ROOT 아래 허용된 폴더의 파일만 내보냄 */
function serveStatic(res, urlPath) {
	const rel = normalize(decodeURIComponent(urlPath)).replace(/^\/+/, '');
	const allowed = ['assets/', 'styles/', 'out/pdf/'];
	if (!allowed.some((p) => rel.startsWith(p)) || rel.includes('..')) return send(res, 404, { error: 'not found' });
	const file = join(ROOT, rel);
	if (!existsSync(file)) return send(res, 404, { error: 'not found' });
	send(res, 200, readFileSync(file), TYPES[extname(file)] ?? 'application/octet-stream');
}

/**
 * @param {{ dirs?: { mul?: string, div?: string }, build?: (setKey: string) => Promise<{ ok: boolean, log: string }> }} [opts]
 *   dirs: 세트별 회차 폴더(기본은 세트의 data 폴더), API는 ?set=div 로 세트를 고른다(없으면 곱셈)
 */
export function createAdminServer({ dirs = {}, build = runBuild } = {}) {
	const stickerIds = new Set(loadStickers().map((s) => s.id));
	const lookup = makeStickerLookup('/');
	let building = false;

	return createServer(async (req, res) => {
		try {
			const url = new URL(req.url, 'http://localhost');
			const path = url.pathname;
			let set;
			try {
				set = setOf(url.searchParams.get('set') ?? 'mul');
			} catch (e) {
				return send(res, 400, { errors: [e.message] });
			}
			const episodeDir = dirs[set.key] ?? set.dir;
			const m = path.match(/^\/api\/(episodes|preview)\/(\d+)$/);
			const ep = m ? loadEpisodes(episodeDir).find((e) => e.id === Number(m[2])) : null;
			if (m && !ep) return send(res, 404, { error: '없는 회차' });

			if (req.method === 'GET' && path === '/') {
				return send(res, 200, readFileSync(join(ROOT, 'admin', 'index.html')), TYPES['.html']);
			}
			if (req.method === 'GET' && path === '/api/episodes') {
				return send(res, 200, loadEpisodes(episodeDir).map((e) => ({ id: e.id, title: e.title, icon: e.icon })));
			}
			if (req.method === 'GET' && m?.[1] === 'episodes') return send(res, 200, textOf(ep));
			if (req.method === 'PUT' && m?.[1] === 'episodes') {
				let next;
				try {
					next = applyTextEdits(ep, await readJson(req));
				} catch (e) {
					return send(res, 400, { errors: [e.message] });
				}
				const errors = set.validate(next, stickerIds);
				if (errors.length) return send(res, 400, { errors });
				writeFileSync(join(episodeDir, `ep${String(ep.id).padStart(2, '0')}.json`), JSON.stringify(next, null, '\t') + '\n');
				return send(res, 200, { ok: true });
			}
			if (req.method === 'POST' && m?.[1] === 'preview') {
				let next;
				try {
					next = applyTextEdits(ep, await readJson(req));
				} catch {
					next = ep;
				}
				const body = set.renderEpisode(next, lookup.src, lookup.aspect);
				return send(res, 200, wrapDocument(body, '/styles/worksheet.css', set.docTitle), TYPES['.html']);
			}
			if (req.method === 'POST' && path === '/api/build') {
				if (building) return send(res, 409, { ok: false, log: '이미 만드는 중' });
				building = true;
				try {
					return send(res, 200, await build(set.key));
				} finally {
					building = false;
				}
			}
			if (req.method === 'GET') return serveStatic(res, path);
			send(res, 404, { error: 'not found' });
		} catch (e) {
			send(res, 500, { errors: [String(e.message ?? e)] });
		}
	});
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const server = createAdminServer();
	server.listen(PORT, '127.0.0.1', () => {
		const url = `http://127.0.0.1:${PORT}`;
		console.log(`학습지 어드민: ${url}  (끝내려면 Ctrl+C)`);
		if (!process.argv.includes('--no-open')) execFile('open', [url]);
	});
}
