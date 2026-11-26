import { escapeHtml } from './html.js';

const pct = (n) => `${Number(n)}%`;

/**
 * 4컷 만화 (2 × 2)
 * @param {any[]} panels
 * @param {(id: string) => string | null} stickerSrc 그림 경로, 없으면 null
 */
export function renderComic(panels, stickerSrc) {
	const body = panels
		.map((panel, i) => {
			const stickers = (panel.stickers ?? [])
				.map((s) => {
					const size = s.h != null ? `height:${pct(s.h)}` : `width:${pct(s.w)}`;
					const style = `left:${pct(s.x)};top:${pct(s.y)};${size}${s.flip ? ';transform:scaleX(-1)' : ''}`;
					const src = stickerSrc(s.id);
					return src
						? `<img class="sticker" src="${escapeHtml(src)}" alt="" style="${style}">`
						: `<div class="sticker missing" style="${style}">${escapeHtml(s.id)}</div>`;
				})
				.join('');
			const bubbles = (panel.bubbles ?? [])
				.map(
					(b) =>
						`<div class="bubble tail-${b.tail ?? 'none'}" style="left:${pct(b.x)};top:${pct(b.y)};width:${pct(b.w)}">${escapeHtml(b.text)}</div>`
				)
				.join('');
			return `<div class="panel"><span class="pnum">${i + 1}</span>${stickers}${bubbles}</div>`;
		})
		.join('');
	return `<div class="comic">${body}</div>`;
}
