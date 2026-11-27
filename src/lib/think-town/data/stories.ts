// 장소마다 단계별 3컷 이야기(아빠가 읽어 줌)와 대화 카드 질문.
// 인물은 이야기 판(760×300) 위 (x, y)에 서는 종이 인형, h = 키.
import type { PlaceId } from '../rules/progress';

export type Cast = { sticker: string; x: number; y: number; h: number };
export type Panel = { cast: Cast[]; speaker: string; text: string };

const Y = 175;
const dad = (pose: string, x: number): Cast => ({ sticker: `dad-${pose}`, x, y: Y, h: 215 });
const jiho = (pose: string, x: number): Cast => ({ sticker: `jiho-${pose}`, x, y: Y + 10, h: 175 });
const bear = (pose: string, x: number): Cast => ({ sticker: `gamdori-${pose}`, x, y: Y + 10, h: 150 });
const cat = (pose: string, x: number): Cast => ({ sticker: `sarang-${pose}`, x, y: Y + 15, h: 105 });
const guest = (who: string, x: number): Cast => ({ sticker: `guest-${who}`, x, y: Y, h: 205 });

/** 말하는 사람은 cast의 첫 번째 */
const panel = (text: string, ...cast: Cast[]): Panel => ({ cast, speaker: cast[0].sticker, text });

export const STORIES: Partial<Record<PlaceId, Panel[][]>> = {
	parking: [
		[
			panel('마트 가자! 그런데 우리 빨간 차가 갇혔네.', dad('explaining', 260), jiho('happy', 470)),
			panel('앞에 차들이 가로막고 있어요!', jiho('surprised', 300), dad('thinking', 500)),
			panel('어떤 차를 먼저 비키면 나갈 수 있을까?', dad('thinking', 260), jiho('thinking', 470))
		],
		[
			panel('내 장난감 주차장 구경할래?', bear('waving', 300), jiho('happy', 480)),
			panel('와, 장난감 차가 엄청 많다!', jiho('pointing', 320), bear('cheering', 500)),
			panel('빨간 차를 꺼내 줄 수 있어?', bear('thinking', 300), jiho('thinking', 480))
		],
		[
			panel('비가 와서 주차장이 꽉 찼어.', dad('smiling', 260), jiho('surprised', 470)),
			panel('차들이 빽빽하게 서 있어요.', jiho('thinking', 300), dad('thinking', 500)),
			panel('가장 적게 움직여서 나가 볼까?', dad('explaining', 260), jiho('happy', 470))
		],
		[
			panel('아빠, 커다란 트럭이 있어요!', jiho('pointing', 300), dad('surprised', 500)),
			panel('트럭은 길어서 비키기가 어려워.', dad('explaining', 260), jiho('thinking', 470)),
			panel('트럭을 어느 쪽으로 밀어야 할까?', jiho('thinking', 300), dad('thinking', 500))
		],
		[
			panel('오늘은 축구 경기 날이에요!', jiho('cheering', 300), dad('smiling', 500)),
			panel('경기장 주차장이 꽉 찼네!', dad('surprised', 260), jiho('surprised', 470)),
			panel('늦지 않게 빨간 차를 꺼낼 수 있을까?', dad('thinking', 260), jiho('kicking', 470))
		]
	],
	ticket: [
		[
			panel('기차 타러 역에 왔어. 표를 사자.', dad('smiling', 300), jiho('happy', 480), bear('waving', 620)),
			panel('매표소 앞에 줄을 서요!', jiho('pointing', 320), bear('cheering', 500)),
			panel('누가 어디에 서야 할까?', bear('thinking', 320), jiho('thinking', 480))
		],
		[
			panel('어? 내가 몇 번째였더라?', bear('surprised', 320), jiho('thinking', 480)),
			panel('단서 카드를 보면 알 수 있어.', jiho('pointing', 320), bear('thinking', 500)),
			panel('단서를 하나씩 맞춰 볼까?', dad('explaining', 300), jiho('happy', 480))
		],
		[
			panel('사랑이도 기차 타고 싶대요!', jiho('happy', 320), cat('jumping', 480)),
			panel('그럼 넷이 줄을 서야겠네.', dad('smiling', 300), cat('happy', 460), bear('waving', 600)),
			panel('넷이면 어떻게 서야 할까?', jiho('thinking', 320), cat('curious', 480))
		],
		[
			panel('줄 서는 순서는 이 쪽지에 있어요.', guest('conductor', 300), jiho('surprised', 480)),
			panel('쪽지가 여러 장이에요!', jiho('surprised', 320), guest('conductor', 500)),
			panel('쪽지를 모두 지키려면 어떻게 설까?', dad('thinking', 300), jiho('thinking', 480))
		],
		[
			panel('안녕! 나도 이 기차를 타.', guest('piano-teacher', 300), jiho('cheering', 480)),
			panel('피아노 선생님이다! 같이 서요.', jiho('cheering', 320), guest('piano-teacher', 500)),
			panel('다섯 명이 어떻게 줄을 설까?', dad('explaining', 300), jiho('thinking', 480))
		]
	]
};

/** 대화 카드 "어떻게 알았어?" 질문 */
export const TALK: Record<PlaceId, string> = {
	parking: '어떤 차를 먼저 비켰어? 왜?',
	blocks: '옆에서 보면 몇 층이 보여?',
	clothes: '빠뜨리지 않으려고 어떻게 했어?',
	ticket: '어느 단서부터 봤어?',
	garden: '이 칸은 왜 이 꽃이야?',
	seesaw: '왜 이 둘을 먼저 쟀어?'
};
