import { escapeHtml } from './html.js';

// 만화 컷 한 칸 크기(mm): 앞면 만화 영역 192 × 177mm, 컷 사이 3mm
const PANEL_W_MM = 94.5;
const PANEL_RATIO = 94.5 / 87;
const HEAD_GAP = 4; // 말풍선 아래 끝과 머리 사이 (컷 높이 %)
const SIDE = 12; // 말풍선 가장자리에서 꼬리까지 (컷 너비 %)
const EDGE = 2; // 컷 가장자리 여백 (%)

const pct = (n) => `${Number(n)}%`;
const r1 = (n) => Number(n.toFixed(1));

const CHAR_MM = 4.9; // 14pt 글자 하나 폭(넉넉히)
const PAD_MM = 5.2; // 말풍선 좌우 안쪽 여백 합

const LINE_MM = 6.6; // 14pt 한 줄 높이
const PAD_Y_MM = 3.6; // 말풍선 위아래 안쪽 여백 합

/** 스티커의 가로 범위·가운데·머리 위치 (컷 %) */
function speakerSpot(s, aspect) {
	const width = s.h != null ? (s.h * aspect) / PANEL_RATIO : Number(s.w);
	const x0 = Number(s.x);
	return { x0, x1: x0 + width, center: x0 + width / 2, top: Number(s.y) };
}

/** 글자 수로 어림한 상자 높이 (컷 %) */
function boxHeight(text, maxPct) {
	const lines = Math.ceil(([...text].length * CHAR_MM + PAD_MM) / ((maxPct / 100) * PANEL_W_MM));
	return ((lines * LINE_MM + PAD_Y_MM) / 87) * 100;
}

const spots0 = (b, talkers) => talkers.some((t) => t.b === b);

/** 글자 수로 어림한 말풍선 폭 (컷 %) */
function estWidth(text, maxPct) {
	return Math.min(maxPct, (([...text].length * CHAR_MM + PAD_MM) / PANEL_W_MM) * 100);
}

/**
 * 한 컷의 말풍선 자리: 머리 위에 일정한 간격으로 붙이고,
 * 두 캐릭터의 말풍선이 겹칠 것 같으면 양쪽 가장자리로 벌린다
 */
function placeBubbles(items, figures = [], ceiling = EDGE) {
	const maxPct = items.length > 1 ? 46 : 66;
	const placed = items.map((it) =>
		it.center < 50
			? { ...it, side: 'l', edge: Math.max(EDGE, it.center - SIDE) }
			: { ...it, side: 'r', edge: Math.max(EDGE, 100 - (it.center + SIDE)) }
	);
	const l = placed.find((p) => p.side === 'l');
	const r = placed.find((p) => p.side === 'r');
	if (items.length === 2 && l && r) {
		const lEnd = l.edge + estWidth(l.text, maxPct);
		const rStart = 100 - r.edge - estWidth(r.text, maxPct);
		if (lEnd + 2 > rStart) {
			l.edge = EDGE;
			r.edge = EDGE;
		}
	}
	return placed.map((p) => {
		const w = estWidth(p.text, maxPct);
		const [e0, e1] = p.side === 'l' ? [p.edge, p.edge + w] : [100 - p.edge - w, 100 - p.edge];
		// 말풍선 아래에 걸리는 다른 캐릭터가 있으면 그 머리 위로 올린다
		const top = Math.min(p.top, ...figures.filter((f) => f.x1 > e0 && f.x0 < e1).map((f) => f.top));
		// 컷 위(또는 해설 상자)로 넘치지 않게
		const height = boxHeight(p.text, w);
		const bottom = Math.min(100 - top + HEAD_GAP, 100 - ceiling - height);
		const tail = ((p.side === 'l' ? p.center - p.edge : 100 - p.edge - p.center) / 100) * PANEL_W_MM;
		const pos = p.side === 'l' ? 'left' : 'right';
		const narrow = items.length > 1 ? `;max-width:${maxPct}%` : '';
		return {
			cls: `tail-${p.side}`,
			style: `${pos}:${r1(p.edge)}%;bottom:${r1(bottom)}%;--tail:${r1(tail)}mm${narrow}`
		};
	});
}

/**
 * 4컷 만화 (2 × 2)
 * @param {any[]} panels
 * @param {(id: string) => string | null} stickerSrc 그림 경로, 없으면 null
 * @param {(id: string) => number} stickerAspect 그림 가로/세로 비
 */
export function renderComic(panels, stickerSrc, stickerAspect = () => 1) {
	const body = panels
		.map((panel) => {
			const list = panel.stickers ?? [];
			const stickers = list
				.map((s) => {
					const size = s.h != null ? `height:${pct(s.h)}` : `width:${pct(s.w)}`;
					const style = `left:${pct(s.x)};top:${pct(s.y)};${size}${s.flip ? ';transform:scaleX(-1)' : ''}`;
					const src = stickerSrc(s.id);
					return src
						? `<img class="sticker" src="${escapeHtml(src)}" alt="" style="${style}">`
						: `<div class="sticker missing" style="${style}">${escapeHtml(s.id)}</div>`;
				})
				.join('');
			const all = panel.bubbles ?? [];
			const talkers = all
				.map((b) => ({ b, s: b.speaker && list.find((x) => x.id === b.speaker) }))
				.filter((t) => t.s)
				.map((t) => ({ b: t.b, text: t.b.text, ...speakerSpot(t.s, stickerAspect(t.s.id)) }));
			const figures = list.filter((x) => !x.id.startsWith('prop-')).map((x) => speakerSpot(x, stickerAspect(x.id)));
			// 해설 상자 아래로만 말풍선이 올라가게
			const ceiling = Math.max(
				EDGE,
				...all
					.filter((b) => !spots0(b, talkers))
					.map((b) => Number(b.y) + boxHeight(b.text, 94) + 2)
			);
			const spots = new Map(placeBubbles(talkers, figures, ceiling).map((p, k) => [talkers[k].b, p]));
			const bubbles = all
				.map((b) => {
					const a = spots.get(b);
					if (a) return `<div class="bubble ${a.cls} anchored" style="${a.style}">${escapeHtml(b.text)}</div>`;
					// 해설 상자: 정해진 자리에 글자 길이만큼(한 줄 우선)
					return `<div class="bubble tail-none narration" style="left:${pct(b.x)};top:${pct(b.y)}">${escapeHtml(b.text)}</div>`;
				})
				.join('');
			return `<div class="panel">${stickers}${bubbles}</div>`;
		})
		.join('');
	return `<div class="comic">${body}</div>`;
}
