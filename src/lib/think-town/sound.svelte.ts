// 생각 마을 소리: 효과음은 WebAudio, 배경음은 반복 재생 오디오.
// 음원 경로·음량은 static/think-town/audio.json 에 둔다(코드에 박지 않음).
// 첫 입력에서 unlock() → 음원을 읽고 배경음 시작. 음소거는 새로고침 뒤에도 유지.

export type Sfx = 'correct' | 'error' | 'success' | 'stamp' | 'drop' | 'bump';

type AudioConfig = { bgmVolume: number; sfxVolume: number; bgm: string; sfx: Record<Sfx, string> };

const MUTE_KEY = 'think_town_muted';
const GAP_MS = 90;

/** 같은 효과음 연타 간격 제한 */
export function canPlay(last: number | undefined, now: number, gap = GAP_MS) {
	return last === undefined || now - last >= gap;
}

export function readMuted(storage: Pick<Storage, 'getItem'>) {
	try {
		return storage.getItem(MUTE_KEY) === '1';
	} catch {
		return false;
	}
}

class Sound {
	muted = $state(false);
	#ctx: AudioContext | null = null;
	#gain: GainNode | null = null;
	#buffers = new Map<Sfx, AudioBuffer>();
	#last = new Map<Sfx, number>();
	#bgm: HTMLAudioElement | null = null;
	#loading: Promise<void> | null = null;
	#wantBgm = false;

	constructor() {
		if (typeof window === 'undefined') return;
		this.muted = readMuted(localStorage);
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) this.#bgm?.pause();
			else if (this.#wantBgm && !this.muted) this.#bgm?.play().catch(() => {});
		});
	}

	/** 첫 사용자 입력에서 부른다 */
	unlock(): Promise<void> {
		if (typeof window === 'undefined') return Promise.resolve();
		this.#ctx ??= new AudioContext();
		if (this.#ctx.state === 'suspended') this.#ctx.resume().catch(() => {});
		this.#loading ??= this.#load();
		return this.#loading.then(() => this.startBgm());
	}

	async #load() {
		const ctx = this.#ctx!;
		const cfg: AudioConfig = await fetch('/think-town/audio.json').then((r) => r.json());
		this.#gain = ctx.createGain();
		this.#gain.gain.value = cfg.sfxVolume;
		this.#gain.connect(ctx.destination);
		this.#bgm = new Audio(cfg.bgm);
		this.#bgm.loop = true;
		this.#bgm.volume = cfg.bgmVolume;
		await Promise.all(
			(Object.entries(cfg.sfx) as [Sfx, string][]).map(async ([name, url]) => {
				try {
					const data = await fetch(url).then((r) => r.arrayBuffer());
					this.#buffers.set(name, await ctx.decodeAudioData(data));
				} catch {
					// 소리 하나 못 읽어도 게임은 계속
				}
			})
		);
	}

	play(name: Sfx) {
		if (this.muted || !this.#ctx || !this.#gain) return;
		const now = performance.now();
		if (!canPlay(this.#last.get(name), now)) return;
		const buffer = this.#buffers.get(name);
		if (!buffer) return;
		this.#last.set(name, now);
		const src = this.#ctx.createBufferSource();
		src.buffer = buffer;
		src.connect(this.#gain);
		src.start();
	}

	startBgm() {
		this.#wantBgm = true;
		if (!this.muted && !document.hidden) this.#bgm?.play().catch(() => {});
	}

	stopBgm() {
		this.#wantBgm = false;
		this.#bgm?.pause();
	}

	toggleMute() {
		this.muted = !this.muted;
		try {
			localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
		} catch {
			// 저장 못 해도 이번엔 적용
		}
		if (this.muted) this.#bgm?.pause();
		else if (this.#wantBgm) this.#bgm?.play().catch(() => {});
	}
}

export const sound = new Sound();
