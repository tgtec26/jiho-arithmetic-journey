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
	],
	blocks: [
		[
			panel('블록 공방에 왔어! 탑을 쌓아 볼까?', dad('smiling', 260), jiho('happy', 470)),
			panel('설계도에 숫자가 적혀 있어요.', jiho('pointing', 300), dad('explaining', 500)),
			panel('숫자만큼 쌓으면 될까?', dad('thinking', 260), jiho('thinking', 470))
		],
		[
			panel('나도 탑 쌓을래!', bear('cheering', 300), jiho('happy', 480)),
			panel('감돌이 설계도에도 숫자가 있네.', jiho('reading', 320), bear('waving', 500)),
			panel('칸마다 몇 층인지 볼까?', bear('thinking', 300), jiho('thinking', 480))
		],
		[
			panel('어? 이번 설계도는 숫자가 없어요.', jiho('surprised', 300), dad('smiling', 500)),
			panel('위, 앞, 옆에서 본 모양이 있지.', dad('explaining', 260), jiho('thinking', 470)),
			panel('세 모양을 다 맞추려면 어떻게 쌓을까?', jiho('thinking', 300), dad('thinking', 500))
		],
		[
			panel('블록이 조금밖에 없어요.', jiho('surprised', 300), bear('surprised', 500)),
			panel('그럼 아껴서 쌓아야겠다!', bear('thinking', 300), jiho('pointing', 480)),
			panel('가장 적은 블록으로 만들 수 있을까?', dad('thinking', 260), jiho('thinking', 470))
		],
		[
			panel('마을 축제에 쓸 탑을 만들어요!', jiho('cheering', 300), dad('thumbsup', 500)),
			panel('앞에서도 옆에서도 멋져야 해.', dad('explaining', 260), jiho('happy', 470)),
			panel('돌려 보면서 확인해 볼까?', jiho('thinking', 300), bear('thinking', 500))
		]
	],
	garden: [
		[
			panel('사랑이가 꽃밭을 만들고 싶대요.', jiho('happy', 300), cat('jumping', 480)),
			panel('꽃은 네 가지야. 줄마다 하나씩!', dad('explaining', 260), jiho('thinking', 470)),
			panel('빈칸에는 어떤 꽃이 들어갈까?', jiho('thinking', 300), cat('curious', 480))
		],
		[
			panel('네모 칸 안에서도 꽃이 다 달라야 해.', dad('explaining', 260), jiho('surprised', 470)),
			panel('가로줄, 세로줄, 네모 칸 모두요?', jiho('thinking', 300), cat('curious', 480)),
			panel('겹치지 않게 심어 볼까?', cat('happy', 300), jiho('happy', 480))
		],
		[
			panel('나비가 놀러 왔어요!', jiho('pointing', 300), cat('jumping', 480)),
			panel('꽃이 더 많이 피면 좋겠다.', bear('waving', 300), cat('happy', 480)),
			panel('빈칸이 늘었어. 어디부터 심을까?', dad('thinking', 260), jiho('thinking', 470))
		],
		[
			panel('비가 와서 꽃이 몇 개 쓰러졌어.', dad('surprised', 260), cat('sleepy', 470)),
			panel('다시 심어 주자, 사랑아!', jiho('cheering', 300), cat('curious', 480)),
			panel('어떤 꽃이 빠졌는지 알 수 있을까?', jiho('thinking', 300), dad('thinking', 500))
		],
		[
			panel('정원 잔치에 친구들을 불렀어요!', jiho('cheering', 300), cat('jumping', 480)),
			panel('가장 예쁜 꽃밭을 보여 주자.', dad('smiling', 260), bear('cheering', 470)),
			panel('빈칸이 많아도 다 채울 수 있을까?', jiho('thinking', 300), cat('curious', 480))
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
