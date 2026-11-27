// 어드민에서 고칠 수 있는 텍스트만 꺼내고 되돌려 넣는다. 숫자·그림 위치는 건드리지 않는다.
import { ACTIVITY_NAMES } from '../lib/think/common.js';

/** 회차 안내 줄에 보일 문제 요약 */
function problemOf(ep) {
	if (ep.activity) return ACTIVITY_NAMES[ep.activity];
	return ep.divisor ? `${ep.story.dividend} ÷ ${ep.divisor}` : `${ep.fixed} × ${ep.story.other}`;
}

/** 회차 → 편집용 텍스트 */
export function textOf(ep) {
	return {
		id: ep.id,
		title: ep.title,
		...(ep.story ? { unit: ep.story.unit } : {}),
		...(ep.story?.restUnit !== undefined ? { restUnit: ep.story.restUnit } : {}),
		problem: problemOf(ep),
		panels: ep.panels.map((p) => p.bubbles.map((b) => b.text))
	};
}

/**
 * 편집한 텍스트를 회차에 반영한 새 객체 (원본은 그대로)
 * @throws 말풍선 개수가 다르면
 */
export function applyTextEdits(ep, edits) {
	const out = structuredClone(ep);
	if (!Array.isArray(edits.panels) || edits.panels.length !== out.panels.length) {
		throw new Error('컷 개수가 다름');
	}
	out.panels.forEach((panel, i) => {
		const texts = edits.panels[i];
		if (!Array.isArray(texts) || texts.length !== panel.bubbles.length) {
			throw new Error(`${i + 1}컷 말풍선 개수가 다름`);
		}
		panel.bubbles.forEach((b, j) => {
			b.text = String(texts[j]).trim();
		});
	});
	out.title = String(edits.title ?? out.title).trim();
	if (out.story) {
		out.story.unit = String(edits.unit ?? out.story.unit).trim();
		if (out.story.restUnit !== undefined) out.story.restUnit = String(edits.restUnit ?? out.story.restUnit).trim();
	}
	return out;
}
