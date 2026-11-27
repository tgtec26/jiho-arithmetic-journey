// 논리 퍼즐 그림: 줄 세우기 칸, 스도쿠 칸, 정답.
import { escapeHtml } from '../html.js';
import { circled } from './common.js';
import { clueText, lineupSolutions, sudokuSolutions } from './logic.js';

const title = (position, text) =>
	`<div class="ptitle"><span class="num">${circled(position)}</span> ${text}${position === 1 ? ' <span class="star">⭐ 이야기 문제</span>' : ''}</div>`;

/**
 * 줄 세우기 문제 칸 (왼쪽이 앞)
 * @param {{ puzzle: { items: string[], clues: any[] }, position: number, round: number }} p
 */
export function renderLineupProblem({ puzzle, position, round }) {
	const isStory = position === 1;
	const n = puzzle.items.length;
	const answer = lineupSolutions(puzzle)[0];
	const hintAt = round <= 2 ? Math.floor((n - 1) / 2) : -1;
	const slots = Array.from({ length: n }, (_, i) =>
		i === hintAt ? `<span class="slot"><span class="hint">${escapeHtml(answer[i])}</span></span>` : `<span class="slot"></span>`
	).join('');
	return `
<section class="problem think-problem lineup${isStory ? ' story' : ''}" data-pos="${position}">
  ${title(position, '줄 세우기')}
  <ul class="clues">${puzzle.clues.map((c) => `<li>${escapeHtml(clueText(c))}</li>`).join('')}</ul>
  <div class="queue"><span class="qend">◀ 앞</span>${slots}<span class="qend">뒤</span></div>
  <div class="names">줄 선 순서대로 이름을 써요: ${puzzle.items.map(escapeHtml).join(', ')}</div>
</section>`;
}

/**
 * 모양 스도쿠 문제 칸
 * @param {{ puzzle: { grid: string[] }, position: number }} p
 */
export function renderSudokuProblem({ puzzle, position }) {
	const rows = puzzle.grid.map((row) => `<tr>${[...row].map((ch) => `<td>${ch === '.' ? '' : ch}</td>`).join('')}</tr>`).join('');
	return `
<section class="problem think-problem sudoku" data-pos="${position}">
  ${title(position, '모양 스도쿠')}
  <div class="rule">가로줄·세로줄·굵은 네모 안에 ●▲■★가 하나씩 들어가요.</div>
  <div class="pbody"><table class="sudoku-grid">${rows}</table></div>
</section>`;
}

/** 정답지: 줄 순서 또는 채운 작은 스도쿠 */
export function logicAnswer(puzzle) {
	if (puzzle.kind === 'lineup') return lineupSolutions(puzzle)[0].join(' → ');
	const [solved] = sudokuSolutions(puzzle.grid, 1);
	return `<table class="mini sudoku-mini">${solved.map((row) => `<tr>${[...row].map((ch) => `<td>${ch}</td>`).join('')}</tr>`).join('')}</table>`;
}
