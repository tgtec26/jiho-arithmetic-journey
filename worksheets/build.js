// 학습지 빌드: node worksheets/build.js [--set=mul|div] [--only=1,2,3] [--strict]
// HTML → 크롬 헤드리스 PDF → 페이지 수 검사. 곱셈(mul, 기본)은 out/html·out/pdf, 나눗셈(div)은 그 아래 division/.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { ROOT, loadEpisodes, loadStickers } from './lib/episodes.js';
import { wrapDocument } from './lib/render-page.js';
import { setOf } from './lib/sets.js';
import { makeStickerLookup } from './lib/stickers.js';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',').map(Number)) : null;
const setArg = args.find((a) => a.startsWith('--set='));
const set = setOf(setArg ? setArg.slice(6) : 'mul');

const OUT_HTML = join(ROOT, 'out', 'html', set.outSub);
const OUT_PDF = join(ROOT, 'out', 'pdf', set.outSub);
const TO_ROOT = relative(OUT_HTML, ROOT); // HTML에서 worksheets/ 까지
const CSS = `${TO_ROOT}/styles/worksheet.css`;

function fail(lines) {
	console.error(lines.join('\n'));
	process.exit(1);
}

const stickerIds = new Set(loadStickers().map((s) => s.id));
const episodes = loadEpisodes(set.dir).filter((ep) => !only || only.has(ep.id));
if (!episodes.length) fail(['빌드할 회차가 없음']);

const errors = episodes.flatMap((ep) => set.validate(ep, stickerIds));
if (errors.length) fail(['회차 검증 실패:', ...errors]);

const lookup = makeStickerLookup(`${TO_ROOT}/`);
const missing = lookup.missing;

mkdirSync(OUT_HTML, { recursive: true });
mkdirSync(OUT_PDF, { recursive: true });

const docs = [];
const bodies = [];
for (const ep of episodes) {
	const body = set.renderEpisode(ep, lookup.src, lookup.aspect);
	bodies.push(body);
	const name = `ep${String(ep.id).padStart(2, '0')}`;
	writeFileSync(join(OUT_HTML, `${name}.html`), wrapDocument(body, CSS, `${ep.id}회 ${ep.title}`));
	docs.push({ name, pages: 2 });
}
writeFileSync(join(OUT_HTML, 'all.html'), wrapDocument(bodies.join(''), CSS, set.docTitle));
docs.push({ name: 'all', pages: 2 * episodes.length });
writeFileSync(join(OUT_HTML, 'answers.html'), wrapDocument(set.renderAnswers(episodes), CSS, `${set.name} 정답 (아빠용)`));
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
