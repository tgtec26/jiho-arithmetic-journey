// 학습지 빌드: node worksheets/build.js [--only=1,2,3] [--strict]
// HTML → 크롬 헤드리스 PDF → 페이지 수 검사
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, loadEpisodes, loadStickers, validateEpisode } from './lib/episodes.js';
import { renderEpisode, wrapDocument } from './lib/render-page.js';
import { renderAnswerKey } from './lib/render-answers.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_HTML = join(ROOT, 'out', 'html');
const OUT_PDF = join(ROOT, 'out', 'pdf');
const CSS = '../../styles/worksheet.css';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map(Number)) : null;

function fail(lines) {
	console.error(lines.join('\n'));
	process.exit(1);
}

const stickers = loadStickers();
const stickerIds = new Set(stickers.map((s) => s.id));
const stickerFile = new Map(stickers.map((s) => [s.id, s.file]));
const episodes = loadEpisodes().filter((ep) => !only || only.has(ep.id));
if (!episodes.length) fail(['빌드할 회차가 없음']);

const errors = episodes.flatMap((ep) => validateEpisode(ep, stickerIds));
if (errors.length) fail(['회차 검증 실패:', ...errors]);

const missing = new Set();
const stickerSrc = (id) => {
	const file = stickerFile.get(id);
	if (file && existsSync(join(ROOT, file))) return `../../${file}`;
	missing.add(id);
	return null;
};

mkdirSync(OUT_HTML, { recursive: true });
mkdirSync(OUT_PDF, { recursive: true });

const docs = [];
const bodies = [];
for (const ep of episodes) {
	const body = renderEpisode(ep, stickerSrc);
	bodies.push(body);
	const name = `ep${String(ep.id).padStart(2, '0')}`;
	writeFileSync(join(OUT_HTML, `${name}.html`), wrapDocument(body, CSS, `${ep.id}회 ${ep.title}`));
	docs.push({ name, pages: 2 });
}
writeFileSync(join(OUT_HTML, 'all.html'), wrapDocument(bodies.join(''), CSS));
docs.push({ name: 'all', pages: 2 * episodes.length });
writeFileSync(join(OUT_HTML, 'answers.html'), wrapDocument(renderAnswerKey(episodes), CSS, '정답 (아빠용)'));
docs.push({ name: 'answers', pages: Math.ceil(episodes.length / 6) });

if (missing.size) {
	const msg = `스티커 파일 없음 (${missing.size}개): ${[...missing].sort().join(', ')}`;
	if (strict) fail([msg]);
	console.warn(`경고: ${msg}`);
}

function pageCount(pdf) {
	const info = execFileSync('pdfinfo', [pdf], { encoding: 'utf8' });
	return Number(info.match(/^Pages:\s+(\d+)/m)[1]);
}

// 사용자가 켜 둔 크롬과 부딪히지 않게 빌드 전용 프로필을 쓰고, 실패하면 한 번 더 시도한다.
const profile = mkdtempSync(join(tmpdir(), 'worksheet-chrome-'));
function printPdf(html, pdf) {
	const run = () =>
		execFileSync(
			CHROME,
			['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, `file://${html}`],
			{ stdio: 'ignore' }
		);
	try {
		run();
	} catch {
		run();
	}
}

const wrong = [];
for (const doc of docs) {
	const html = join(OUT_HTML, `${doc.name}.html`);
	const pdf = join(OUT_PDF, `${doc.name}.pdf`);
	printPdf(html, pdf);
	const pages = pageCount(pdf);
	console.log(`${doc.name}.pdf: ${pages}쪽`);
	if (doc.pages != null && pages !== doc.pages) wrong.push(`${doc.name}.pdf: ${pages}쪽 (예상 ${doc.pages}쪽)`);
}
rmSync(profile, { recursive: true, force: true });
if (wrong.length) fail(['페이지 수가 맞지 않음 (양면 인쇄가 어긋남):', ...wrong]);
console.log(`완료: ${OUT_PDF}`);
