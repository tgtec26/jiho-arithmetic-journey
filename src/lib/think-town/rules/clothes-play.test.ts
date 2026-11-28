import { describe, it, expect } from 'vitest';
import { NO_OUTFIT, clothesHint, partsOf, remaining, slotsShown, takePhoto, totalOutfits, wear } from './clothes-play';

const P2 = { shirt: ['red', 'blue'], pants: ['navy', 'gray'] };
const P3 = { ...P2, hat: ['orange', 'teal'] };
const fit = (shirt: string | null, pants: string | null, hat: string | null = null) => ({ shirt, pants, hat });

describe('옷가게', () => {
	it('부분·전체 수·칸 보임', () => {
		expect(partsOf(P2)).toEqual(['shirt', 'pants']);
		expect(partsOf(P3)).toEqual(['shirt', 'pants', 'hat']);
		expect(totalOutfits(P2)).toBe(4);
		expect(totalOutfits(P3)).toBe(8);
		expect(slotsShown(3)).toBe(true);
		expect(slotsShown(4)).toBe(false);
	});
	it('입히기: 같은 옷이면 그대로', () => {
		const o = wear(NO_OUTFIT, 'shirt', 'red');
		expect(o.shirt).toBe('red');
		expect(NO_OUTFIT.shirt).toBeNull();
		expect(wear(o, 'shirt', 'red')).toBe(o);
		expect(wear(o, 'shirt', 'blue').shirt).toBe('blue');
	});
	it('사진: 덜 입음·같은 조합은 사진첩 그대로, 새 조합은 들어감', () => {
		const a0: string[] = [];
		const miss = takePhoto(a0, fit('red', null), P3);
		expect(miss.result).toBe('incomplete');
		expect(miss.missing).toEqual(['pants', 'hat']);
		expect(miss.album).toBe(a0);
		const one = takePhoto(a0, fit('red', 'navy'), P2);
		expect(one).toMatchObject({ result: 'new', index: 0, album: ['red|navy'] });
		expect(a0).toEqual([]);
		const dup = takePhoto(one.album, fit('red', 'navy'), P2);
		expect(dup.result).toBe('dup');
		expect(dup.index).toBe(0);
		expect(dup.album).toBe(one.album);
		// 모자 없는 판에서는 모자를 보지 않는다
		expect(takePhoto(one.album, fit('blue', 'navy', 'teal'), P2)).toMatchObject({ result: 'new', index: 1 });
	});
	it('남은 수와 힌트(차례대로 안 찍은 첫 조합)', () => {
		expect(remaining(['red|navy'], P2)).toBe(3);
		expect(clothesHint(['red|navy'], P2)).toEqual(fit('red', 'gray'));
		expect(clothesHint([], P3)).toEqual(fit('red', 'navy', 'orange'));
		expect(clothesHint(['red|navy', 'red|gray', 'blue|navy', 'blue|gray'], P2)).toBeNull();
	});
});
