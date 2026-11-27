// 줄 세우기 등장인물: 이름 → 스티커(static/think-town/stickers/<id>.png)
export const CAST: Record<string, string> = {
	지호: 'jiho-happy',
	아빠: 'dad-smiling',
	감돌이: 'gamdori-cheering',
	사랑이: 'sarang-sitting',
	선생님: 'guest-piano-teacher'
};

/** 단계(1~5)별 줄 서는 사람 */
export const LINEUP_CAST_BY_STAGE = [
	['지호', '아빠', '감돌이'],
	['지호', '아빠', '감돌이'],
	['지호', '아빠', '감돌이', '사랑이'],
	['지호', '아빠', '감돌이', '사랑이'],
	['지호', '아빠', '감돌이', '사랑이', '선생님']
];
