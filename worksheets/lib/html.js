const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** @param {string} s */
export function escapeHtml(s) {
	return String(s).replace(/[&<>"']/g, (c) => MAP[c]);
}
