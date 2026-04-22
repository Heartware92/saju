/**
 * 한국 전통 꿈해몽 지식베이스
 *
 * 사용 목적:
 *  - 사용자가 입력한 꿈 설명에서 키워드를 추출해 전통 상징 해석을 매칭
 *  - 매칭된 상징을 프롬프트에 주입하여 AI가 근거 있는 해석을 생성하도록 유도
 *
 * 구조:
 *  - category: 상징 분류 (동물, 자연, 신체, 행위, 인물, 사물, 감정)
 *  - keywords: 매칭용 한글 키워드(동의어·활용형 포함)
 *  - tradition: 한국 전통(토정비결·주공해몽 계열) 해석 — 길흉 포함
 *  - psychology: 현대 심리적 보조 해석 (무의식·상징)
 *  - polarity: 'good' | 'bad' | 'neutral' | 'mixed' — 전반 경향
 */

export type DreamPolarity = 'good' | 'bad' | 'neutral' | 'mixed';

export interface DreamSymbol {
  id: string;
  label: string;              // 대표 이름
  category: '동물' | '자연' | '신체' | '행위' | '인물' | '사물' | '숫자색' | '감정';
  keywords: string[];         // 매칭용
  tradition: string;          // 전통 해몽 (2~3문장)
  psychology?: string;        // 현대 심리 상징
  polarity: DreamPolarity;
}

export const DREAM_SYMBOLS: DreamSymbol[] = [
  // ── 동물 ──────────────────────────────────────────────
  {
    id: 'pig',
    label: '돼지',
    category: '동물',
    keywords: ['돼지', '멧돼지', '새끼돼지', '돼지꿈'],
    tradition: '전통적으로 재물·재복의 대표 길몽. 돼지를 품에 안거나 집에 들어오는 꿈은 곧 큰돈이 들어온다는 신호다. 새끼돼지 여러 마리는 재물이 연달아 생긴다는 뜻이며, 태몽으로도 복된 자식을 의미한다.',
    psychology: '풍요·다산·본능적 충만함의 상징.',
    polarity: 'good',
  },
  {
    id: 'snake',
    label: '뱀',
    category: '동물',
    keywords: ['뱀', '구렁이', '살모사', '독사', '이무기', '뱀꿈'],
    tradition: '뱀은 태몽·재물·변화 세 가지를 상징한다. 큰 구렁이가 몸을 감거나 품에 들어오면 귀한 아이를 얻거나 재물·권력이 생긴다. 뱀에 물리는 꿈은 정식 인연(특히 귀인)을 만나는 상서로운 꿈으로 전해진다.',
    psychology: '변화·재생·억눌린 욕망의 각성.',
    polarity: 'good',
  },
  {
    id: 'dragon',
    label: '용',
    category: '동물',
    keywords: ['용', '이무기승천', '용이', '청룡', '황룡', '승천'],
    tradition: '용꿈은 최고의 길몽. 승천하는 용은 출세·시험 합격·승진을 뜻하고, 여의주를 물면 평생의 큰 성취가 임박한다는 뜻이다. 태몽으로는 크게 될 자식을 의미한다.',
    psychology: '자기실현·리더십·초월적 에너지.',
    polarity: 'good',
  },
  {
    id: 'tiger',
    label: '호랑이',
    category: '동물',
    keywords: ['호랑이', '백호', '범', '호랑이꿈'],
    tradition: '호랑이는 권력·명예·귀인을 상징한다. 호랑이를 타거나 쓰다듬는 꿈은 윗사람의 후원·승진. 호랑이에게 쫓기는 꿈은 권력자와의 갈등이나 큰 도전 임박.',
    psychology: '내면의 카리스마·억압된 공격성.',
    polarity: 'mixed',
  },
  {
    id: 'dog',
    label: '개',
    category: '동물',
    keywords: ['개', '강아지', '진돗개', '개꿈'],
    tradition: '하얀 개·귀여운 강아지는 귀인·친구의 도움. 검은 개나 짖는 개는 구설·배신의 징조. 개에게 물리는 꿈은 가까운 사람과의 갈등 주의.',
    polarity: 'mixed',
  },
  {
    id: 'cat',
    label: '고양이',
    category: '동물',
    keywords: ['고양이', '냥이', '야옹'],
    tradition: '검은 고양이는 예로부터 구설·질투·여성으로 인한 다툼. 하얀 고양이는 예술·직감의 발현. 고양이가 품에 안기면 묘한 인연이 생긴다.',
    polarity: 'mixed',
  },
  {
    id: 'rat',
    label: '쥐',
    category: '동물',
    keywords: ['쥐', '생쥐', '들쥐'],
    tradition: '쥐는 작은 재물이지만 도둑·새는 돈을 의미하기도 한다. 여러 마리가 나오면 재물이 모이나 관리가 어렵고, 쥐를 잡는 꿈은 숨은 재물·기회 획득.',
    polarity: 'mixed',
  },
  {
    id: 'bird',
    label: '새·날짐승',
    category: '동물',
    keywords: ['새', '까치', '봉황', '학', '비둘기', '독수리', '참새'],
    tradition: '까치는 반가운 소식·손님. 봉황·학은 귀한 자리·명예. 까마귀는 흉사나 구설의 예고. 새가 품에 들어오면 좋은 소식이 가까이 온다.',
    polarity: 'mixed',
  },
  {
    id: 'fish',
    label: '물고기',
    category: '동물',
    keywords: ['물고기', '잉어', '붕어', '금붕어', '생선'],
    tradition: '잉어·금붕어는 재물운의 상징. 많이 잡는 꿈은 큰 수입. 큰 잉어가 품에 뛰어들면 귀한 자식이나 큰돈. 죽은 물고기는 기회가 지나감.',
    polarity: 'good',
  },

  // ── 자연 ──────────────────────────────────────────────
  {
    id: 'water',
    label: '물',
    category: '자연',
    keywords: ['물', '바다', '강', '호수', '비', '홍수', '개울'],
    tradition: '맑은 물은 재물·축복. 잔잔한 바다는 안정. 더럽거나 탁한 물은 건강·감정 문제. 홍수는 큰 변동이지만 물이 집으로 들어오면 재물이 들어오는 뜻.',
    psychology: '감정·무의식의 상태.',
    polarity: 'mixed',
  },
  {
    id: 'fire',
    label: '불',
    category: '자연',
    keywords: ['불', '불꽃', '화재', '모닥불', '산불'],
    tradition: '타오르는 불·활활 붙는 불은 큰 재물·명성. 반대로 집이 타서 재만 남으면 소식은 흉. 자기가 불을 끄지 못하면 감당 못 할 일이 생긴다는 경고.',
    psychology: '정열·분노·변화의 힘.',
    polarity: 'mixed',
  },
  {
    id: 'sun_moon',
    label: '해·달·별',
    category: '자연',
    keywords: ['해', '태양', '달', '별', '일출', '월출'],
    tradition: '해가 떠오르거나 품에 들어오면 크게 출세한다. 달이 밝으면 여성에게 좋은 일. 별이 떨어지는 꿈은 귀인의 죽음 또는 큰 기회 임박.',
    polarity: 'good',
  },
  {
    id: 'mountain',
    label: '산·나무',
    category: '자연',
    keywords: ['산', '등산', '나무', '큰나무', '거목'],
    tradition: '푸른 산·큰 나무는 안정·가문의 번창. 산을 오르면 지위 상승. 나무가 말라 있거나 꺾이면 건강·가족 주의.',
    polarity: 'good',
  },

  // ── 신체 ──────────────────────────────────────────────
  {
    id: 'teeth',
    label: '이빨',
    category: '신체',
    keywords: ['이', '이빨', '치아', '이빠짐', '이가빠지', '이뽑'],
    tradition: '이가 빠지는 꿈은 전통적으로 가족·가까운 이의 우환을 의미한다. 윗니는 윗사람, 아랫니는 아랫사람. 다만 스스로 흔들리는 이를 빼고 시원하면 묵은 문제 해결의 신호.',
    psychology: '상실·통제 불안·변화 저항.',
    polarity: 'bad',
  },
  {
    id: 'blood',
    label: '피',
    category: '신체',
    keywords: ['피', '출혈', '코피', '피흘리'],
    tradition: '피는 재물로 푸는 것이 원칙. 바닥에 흥건히 흐르는 피는 큰 재물. 자기 몸에서 많이 나면 건강 주의. 남의 피를 보면 구설 조심.',
    polarity: 'mixed',
  },
  {
    id: 'hair',
    label: '머리카락',
    category: '신체',
    keywords: ['머리', '머리카락', '머리빠짐', '탈모', '머리자름'],
    tradition: '머리가 길게 자라면 수명·복. 숱이 많으면 재물. 스스로 자르면 결단·변화. 뭉텅이로 빠지면 기력·명예 손실.',
    polarity: 'mixed',
  },
  {
    id: 'poop',
    label: '똥',
    category: '신체',
    keywords: ['똥', '대변', '변'],
    tradition: '똥꿈은 대표적 길몽. 똥을 밟거나 덮어쓰면 재물운 대박. 깨끗이 씻는 꿈은 돈이 나간다는 반대 의미.',
    polarity: 'good',
  },

  // ── 행위 ──────────────────────────────────────────────
  {
    id: 'fly',
    label: '날다',
    category: '행위',
    keywords: ['날다', '하늘', '비행', '날아', '날았'],
    tradition: '하늘을 자유롭게 나는 꿈은 성취·승진·해방. 높이 오를수록 큰 성공. 추락하면 현재 기반의 불안.',
    psychology: '자유·자기확장.',
    polarity: 'good',
  },
  {
    id: 'fall',
    label: '떨어지다',
    category: '행위',
    keywords: ['떨어지', '추락', '낙하', '빠지'],
    tradition: '높은 곳에서 떨어지는 꿈은 지위·계획의 동요. 다만 떨어져서 바닥에 부드럽게 닿으면 시련 뒤 안착.',
    psychology: '통제 상실·변화 불안.',
    polarity: 'bad',
  },
  {
    id: 'chase',
    label: '쫓기다',
    category: '행위',
    keywords: ['쫓기', '도망', '추격', '피해'],
    tradition: '정체 모를 것에 쫓기면 스트레스·회피 중인 문제. 아는 대상(사람·짐승)에 쫓기면 해당 관계의 압박감.',
    psychology: '회피·억압된 감정 직면 필요.',
    polarity: 'bad',
  },
  {
    id: 'swim',
    label: '수영·헤엄',
    category: '행위',
    keywords: ['수영', '헤엄', '물에빠', '물속'],
    tradition: '맑은 물에서 자유롭게 헤엄치면 일이 순조롭다. 탁한 물에서 허우적대면 감정·관계 혼란.',
    polarity: 'mixed',
  },
  {
    id: 'death',
    label: '죽음',
    category: '행위',
    keywords: ['죽', '죽음', '죽었', '사망', '장례', '관'],
    tradition: '꿈에서 죽는 것은 끝이 아니라 재생·새 시작을 상징한다. 자기 장례를 보면 큰 변화 직전. 남의 죽음은 그 사람과의 관계 전환.',
    psychology: '한 국면의 종결, 새 자아의 등장.',
    polarity: 'good',
  },
  {
    id: 'wedding',
    label: '결혼',
    category: '행위',
    keywords: ['결혼', '웨딩', '신부', '신랑', '혼례'],
    tradition: '결혼식 꿈은 큰 변화의 시작. 미혼자에게는 인연이, 기혼자에게는 사업·협력 관계의 결합. 다만 슬프게 느껴졌다면 준비 부족의 신호.',
    polarity: 'mixed',
  },
  {
    id: 'exam',
    label: '시험',
    category: '행위',
    keywords: ['시험', '수능', '면접', '평가'],
    tradition: '시험 꿈은 현실의 평가·도전 앞 압박감. 잘 보면 실제 결과도 좋은 신호. 답을 못 쓰면 준비 부족을 무의식이 알리는 것.',
    polarity: 'neutral',
  },
  {
    id: 'naked',
    label: '벌거벗다',
    category: '행위',
    keywords: ['벌거', '나체', '알몸', '옷벗'],
    tradition: '공공 장소에서 알몸이 되는 꿈은 숨기고 싶은 약점의 노출 불안. 반대로 편안하게 느꼈다면 진실에의 수용.',
    psychology: '자기노출·취약함의 인식.',
    polarity: 'neutral',
  },

  // ── 인물 ──────────────────────────────────────────────
  {
    id: 'deceased',
    label: '돌아가신 분',
    category: '인물',
    keywords: ['돌아가신', '죽은사람', '조상', '할아버지', '할머니', '아버지', '어머니'],
    tradition: '조상·돌아가신 분이 밝은 표정으로 나타나면 일이 풀린다는 신호. 무언가를 건네주면 실제 도움(유산·기회)이 온다. 슬픈 표정이면 가족에 주의할 일.',
    polarity: 'mixed',
  },
  {
    id: 'baby',
    label: '아기',
    category: '인물',
    keywords: ['아기', '아이', '신생아', '태아', '갓난'],
    tradition: '밝고 건강한 아기는 새 시작·창작·프로젝트. 태몽으로도 해석된다. 우는 아기는 해결 못한 문제의 신호.',
    psychology: '새로운 가능성·내면의 자아.',
    polarity: 'good',
  },
  {
    id: 'stranger',
    label: '낯선 사람',
    category: '인물',
    keywords: ['낯선', '모르는사람', '이방인'],
    tradition: '낯선 인물은 자기 안의 미처 몰랐던 면 또는 곧 만날 인연. 도움을 주면 귀인, 해치면 경계할 만남.',
    polarity: 'mixed',
  },

  // ── 사물 ──────────────────────────────────────────────
  {
    id: 'money',
    label: '돈·금',
    category: '사물',
    keywords: ['돈', '지폐', '금', '금반지', '보석'],
    tradition: '직접 돈을 받는 꿈은 오히려 지출의 암시인 경우가 많다. 반대로 쓰거나 잃어버리는 꿈은 실제로 수입이 생긴다는 역몽. 금·보석을 얻으면 장기적 재물.',
    polarity: 'mixed',
  },
  {
    id: 'house',
    label: '집',
    category: '사물',
    keywords: ['집', '방', '아파트', '현관', '이사'],
    tradition: '큰 집·새 집은 상승·확장. 허물어진 집은 기반·가족 문제. 이사하는 꿈은 실제로 삶의 국면 전환이 임박.',
    psychology: '자기·가족·정체성.',
    polarity: 'mixed',
  },
  {
    id: 'car',
    label: '차·교통',
    category: '사물',
    keywords: ['차', '자동차', '버스', '기차', '비행기', '운전'],
    tradition: '내가 운전대를 잡으면 주도권 확보. 사고가 나면 계획에 제동. 큰 차·고급차를 타면 지위 상승.',
    polarity: 'mixed',
  },
  {
    id: 'knife',
    label: '칼·날붙이',
    category: '사물',
    keywords: ['칼', '식칼', '검', '가위'],
    tradition: '번뜩이는 칼은 결단력·권력의 상징. 날붙이에 베이면 구설 조심. 칼을 받으면 권한 위임, 잃으면 권위 약화.',
    polarity: 'mixed',
  },

  // ── 숫자·색 ──────────────────────────────────────────────
  {
    id: 'color_red',
    label: '붉은색',
    category: '숫자색',
    keywords: ['빨간', '붉은', '빨강'],
    tradition: '붉은색은 정열·재물·경사. 다만 붉은 피가 과하면 건강 주의. 붉은 꽃·옷은 좋은 일의 전조.',
    polarity: 'good',
  },
  {
    id: 'color_white',
    label: '흰색',
    category: '숫자색',
    keywords: ['하얀', '흰', '하양'],
    tradition: '흰색은 순수·정결·상(喪). 흰 옷·흰 새·흰 짐승은 귀인 또는 조상의 가호. 흰 수의는 실제 애사 주의.',
    polarity: 'mixed',
  },
  {
    id: 'color_black',
    label: '검은색',
    category: '숫자색',
    keywords: ['검은', '까만', '검정'],
    tradition: '검은 구름·검은 물은 답답함·장애. 검은 짐승은 구설·음해 주의. 다만 검은 소·검은 돼지는 예외적으로 재물.',
    polarity: 'bad',
  },

  // ── 감정/현상 ──────────────────────────────────────────
  {
    id: 'crying',
    label: '울다',
    category: '감정',
    keywords: ['울', '눈물', '슬펐', '울고'],
    tradition: '시원하게 우는 꿈은 억눌림 해소 뒤 길사. 소리 없이 울면 현실의 응어리가 있음.',
    polarity: 'mixed',
  },
  {
    id: 'laugh',
    label: '웃다',
    category: '감정',
    keywords: ['웃', '웃었', '웃음'],
    tradition: '활짝 웃는 꿈은 기대했던 일이 성사된다. 다만 억지로 웃거나 기괴하게 웃으면 역몽으로 풀이되기도 한다.',
    polarity: 'good',
  },
];

/** 특수 규칙: 역몽(逆夢) — 흉해 보이지만 길한 것들 */
export const REVERSE_DREAM_NOTES = [
  '꿈에서 "죽음·장례·피·똥·불"은 전통적으로 역몽(逆夢)으로, 실제로는 재생·재물·변화의 길몽으로 본다.',
  '"돈을 직접 받는 꿈"은 오히려 지출의 암시가 많고, "돈을 잃거나 쓰는 꿈"이 실제 수입의 전조인 경우가 많다.',
  '"우는 꿈"은 시원하게 울었다면 응어리 해소 후의 길몽이다.',
];

/** 공통 해석 프레임 — 프롬프트에 상수 블록으로 주입 */
export const DREAM_FRAMEWORK = `[꿈해몽 해석 프레임 — 순서대로 적용]
1) 꿈 종류 판별 — 태몽/예지몽/심리몽/길몽/흉몽 중 어느 유형에 가까운지 [꿈 종류 체크리스트] 근거로 추정
2) 상징 추출 — 매칭된 [꿈속 상징]의 전통 의미를 우선 인용
3) 맥락 가중 — [맥락 규칙]에 따라 "보는/당하는/품는/쫓기는" 의미 강도를 조정
4) 감정 가중 — [감정 규칙]으로 길흉 방향을 최종 조정(감정이 상징보다 우선)
5) 역몽 확인 — [역몽 규칙]에 해당하면 반대 해석을 먼저 검토
6) 최종 해석 — 사용자의 현실에 어떤 힌트를 주는지 단정적으로 제시`;

/**
 * 꿈 종류 판별 체크리스트
 * - 사주처럼 수식적 계산은 없으나, 해몽가들이 통상 쓰는 판별 기준을 명문화.
 * - AI는 각 체크리스트에 몇 개 부합하는지 추정해 "가능성 높음/경향 있음/해당 없음"으로 판정.
 */
export const DREAM_TYPE_CHECKLIST = `[꿈 종류 체크리스트]
■ 태몽(胎夢) 가능성 — 아래 중 2개 이상 부합 시 태몽 가능성 높음
  1) 본인/배우자/가까운 가족 중 임신 가능성 있는 사람이 있다
  2) 용·뱀·호랑이·돼지·물고기·과일·해·달·꽃·보석 중 하나 이상 등장
  3) 그 대상을 "본 것"이 아니라 품에 안거나, 잡거나, 먹거나, 받았다
  4) 꿈이 유난히 생생하고 깼을 때 "이건 특별한 꿈"이라는 직감이 있다

■ 예지몽 가능성 — 아래 중 2개 이상 부합 시 예지몽 경향
  1) 새벽 3~7시에 꾼 꿈이다(전통적으로 예지력 높다고 본다)
  2) 꿈이 생생·논리적이고 현실처럼 일관되게 진행됐다
  3) 같은 꿈을 반복해서 꾼다
  4) 꿈의 구체적 장면이 최근 현실의 특정 상황과 바로 연결된다

■ 심리몽 가능성 — 아래 중 2개 이상 부합 시 심리몽 경향(무의식의 반영)
  1) 최근 스트레스·고민·관계 문제가 장면에 그대로 투영되어 있다
  2) 비논리적·조각난 전개이고 깨고 나면 내용이 쉽게 흐려진다
  3) 시험·추락·쫓김·발가벗음·늦음 같은 스트레스 정형 장면이다
  4) 반복되는 악몽 성격이다

■ 길몽 신호 — 빛·상승·풍요·따뜻함·깨끗한 물·해·달·용·봉황·돼지·똥·피(역몽)
■ 흉몽 신호 — 어둠·추락·끊김·더러움·쫓김·무서움. 단 [역몽 규칙]으로 재판정 필요.

[주의] 태몽·예지몽·심리몽은 서로 배타적이지 않다. 동시에 해당할 수 있다.
판별 근거를 반드시 본문에서 한 문장으로 명시할 것("새벽에 반복해서 꾸셨다고 하셔서 예지몽 경향으로 봅니다" 식).`;

/**
 * 맥락 규칙 — 같은 상징도 "어떻게 등장했는가"로 의미가 달라진다.
 * 키워드 매칭 결과 폴라리티에 가중치를 주는 개념적 지침.
 */
export interface ContextRule {
  action: string;
  keywords: string[];
  strengthNote: string;
}

export const CONTEXT_RULES: ContextRule[] = [
  { action: '보다(관찰)',    keywords: ['봤', '보았', '보이', '보더라', '나타났'],
    strengthNote: '의미 세기 중간. 객관 상태 확인의 성격.' },
  { action: '품다/안다/소유', keywords: ['품', '안았', '껴안', '받았', '얻었', '가졌'],
    strengthNote: '의미 세기 최강(+). 내 것이 됨 — 길몽은 더 길몽, 흉몽은 나에게 직접 영향.' },
  { action: '먹다/마시다',   keywords: ['먹', '마셨', '삼켰'],
    strengthNote: '의미 세기 강(+). 내면화 — 태몽 맥락에서는 아기를 잉태하는 암시.' },
  { action: '타다/운전',     keywords: ['탔', '타고', '운전', '몰고'],
    strengthNote: '의미 세기 강. 주도권·추진력 상승/하락의 신호.' },
  { action: '당하다/물리다', keywords: ['물렸', '당했', '맞았', '잡혔'],
    strengthNote: '의미 세기 강(-). 수동적 영향 — 좋은 상징이면 귀인 개입, 나쁜 상징이면 공격.' },
  { action: '쫓기다/도망',   keywords: ['쫓겼', '도망', '쫓아', '피했'],
    strengthNote: '의미 세기 강. 회피 중인 현실 문제의 투영이 큼.' },
  { action: '싸우다/다투다', keywords: ['싸웠', '다퉜', '공격'],
    strengthNote: '의미 세기 중간. 갈등 상황 — 이겼는지 졌는지가 길흉을 가름.' },
  { action: '죽다/죽이다',   keywords: ['죽', '죽었', '죽였'],
    strengthNote: '역몽 1순위. 내가 죽으면 재생·변화, 남을 죽이면 관계 종결.' },
  { action: '날다/오르다',   keywords: ['날았', '올라', '비행', '솟아'],
    strengthNote: '의미 세기 강(+). 성취·해방·상승.' },
  { action: '떨어지다',      keywords: ['떨어', '추락', '빠졌'],
    strengthNote: '의미 세기 강(-). 통제 상실. 부드럽게 착지하면 연착륙의 길조.' },
  { action: '찾다/잃다',     keywords: ['찾았', '잃었', '잃어'],
    strengthNote: '의미 세기 중간. 잃는 쪽이 더 직접적.' },
];

/**
 * 감정 규칙 — 꿈 속에서 느낀 감정은 길흉을 결정적으로 가름.
 * 같은 뱀이라도 따뜻했는가/무서웠는가로 해석이 180도 바뀐다.
 */
export interface EmotionRule {
  emotion: string;
  keywords: string[];
  modifier: 'strong+' | 'mild+' | 'neutral' | 'mild-' | 'strong-';
  note: string;
}

export const EMOTION_RULES: EmotionRule[] = [
  { emotion: '따뜻함/편안함',  keywords: ['따뜻', '편안', '포근', '안심', '평온'],
    modifier: 'strong+', note: '흉몽 상징이어도 길몽 쪽으로 전환 가능. 관계·재물·건강 개선 신호.' },
  { emotion: '기쁨/설렘',      keywords: ['기뻤', '즐거', '설렜', '행복', '웃었'],
    modifier: 'strong+', note: '기대했던 일이 이뤄진다는 신호.' },
  { emotion: '평온/담담',      keywords: ['담담', '평범', '그냥', '덤덤'],
    modifier: 'neutral', note: '감정 단서 약함. 상징과 맥락 위주로 해석.' },
  { emotion: '찜찜함/불안',    keywords: ['찜찜', '불안', '께름', '이상'],
    modifier: 'mild-', note: '완전한 흉몽은 아니지만 주의 신호. 현실의 불편함 점검 필요.' },
  { emotion: '슬픔/외로움',    keywords: ['슬펐', '외로', '쓸쓸', '눈물'],
    modifier: 'mild-', note: '정리·이별의 시기. 시원한 눈물이었다면 오히려 해소.' },
  { emotion: '무서움/공포',    keywords: ['무서', '두려', '겁났', '끔찍'],
    modifier: 'strong-', note: '길몽 상징이어도 길함을 잃을 수 있음. 회피 중인 현실 문제의 강력한 신호.' },
  { emotion: '분노/짜증',      keywords: ['화났', '분노', '짜증', '격분'],
    modifier: 'mild-', note: '억눌린 갈등. 가까운 관계에서 풀어야 할 실마리가 있음.' },
];

/** Mode B(흐릿) 가이드용 칩 그룹 — UI에서 다중 선택으로 노출 */
export interface ChipGroup {
  id: 'people' | 'animal' | 'nature' | 'object' | 'place' | 'action' | 'emotion';
  label: string;
  question: string;
  items: string[];
}

export const DREAM_CHIP_GROUPS: ChipGroup[] = [
  {
    id: 'people',
    label: '사람',
    question: '꿈에 누가 나왔나요?',
    items: [
      '돌아가신 분(조상·고인)',
      '부모님',
      '형제·자매',
      '배우자',
      '연인',
      '친구',
      '직장 동료·상사',
      '낯선 사람',
      '아기(갓난아이)',
      '아이(어린이)',
      '유명인·스타',
      '신(神)·종교적 존재',
      '나 자신',
    ],
  },
  {
    id: 'animal',
    label: '동물',
    question: '어떤 동물이 나왔나요?',
    items: [
      '돼지',
      '뱀·구렁이',
      '용',
      '호랑이',
      '사자·곰',
      '개(강아지)',
      '고양이',
      '쥐',
      '까치·비둘기',
      '까마귀',
      '봉황·학',
      '물고기·잉어',
      '소·말',
      '벌레·곤충',
    ],
  },
  {
    id: 'nature',
    label: '자연',
    question: '어떤 자연이 보였나요?',
    items: [
      '맑은 물(강·호수)',
      '바다·파도',
      '홍수·큰물',
      '탁한 물·더러운 물',
      '불꽃·모닥불',
      '큰 화재·집이 탐',
      '해·태양',
      '달',
      '별·유성',
      '산·큰 바위',
      '나무·숲',
      '비·눈',
      '하늘·구름',
      '땅·흙·진흙',
    ],
  },
  {
    id: 'object',
    label: '사물',
    question: '어떤 사물이 나왔나요?',
    items: [
      '돈·지폐',
      '금·보석',
      '집·건물',
      '자동차',
      '버스·기차',
      '비행기·배',
      '음식·떡',
      '꽃·과일',
      '칼·무기',
      '옷·신발',
      '책·편지',
      '거울·유리',
      '열쇠·문',
    ],
  },
  {
    id: 'place',
    label: '장소',
    question: '어디서 일어난 꿈인가요?',
    items: [
      '우리 집',
      '과거 살던 집',
      '모르는 집',
      '학교',
      '직장·사무실',
      '길거리·시내',
      '바닷가·강가',
      '산·숲속',
      '병원',
      '결혼식장',
      '장례식장',
      '시험장·면접장',
      '모르는 낯선 곳',
    ],
  },
  {
    id: 'action',
    label: '행동·상황',
    question: '꿈에서 무슨 일이 있었나요? (애매하면 여러 개 골라도 됩니다)',
    items: [
      '바라봤다·지켜봤다',
      '품에 안았다·받았다',
      '먹었다·마셨다',
      '차·배·비행기를 탔다',
      '불에 탔다·화상 입었다',
      '누가 불태웠다',
      '싸웠다·다퉜다',
      '누구에게 쫓겼다',
      '내가 쫓아갔다',
      '하늘을 날았다',
      '내가 높은 곳에서 떨어졌다',
      '물건을 잃어버렸다',
      '물건을 찾았다·주웠다',
      '내가 죽었다',
      '누구를 죽였다',
      '누가 죽는 걸 봤다',
      '울었다',
      '웃었다',
      '결혼식을 올렸다',
      '장례식에 갔다',
      '시험·면접을 봤다',
      '목욕·씻었다',
      '길을 잃었다',
      '발가벗었다',
    ],
  },
  {
    id: 'emotion',
    label: '감정',
    question: '꿈에서 느낀 기분은 어땠나요?',
    items: [
      '따뜻하고 편안함',
      '기쁨·설렘',
      '평온·담담함',
      '찜찜함·불안',
      '슬픔·외로움',
      '무서움·공포',
      '분노·짜증',
      '놀람',
      '기억 안 남',
    ],
  },
];

/** 구조화된 선택지 + 자유 메모를 프롬프트용 자연어 문장으로 합성 */
export interface StructuredDreamInput {
  selections: Partial<Record<ChipGroup['id'], string[]>>;
  note?: string;
  timeOfNight?: '새벽' | '한밤' | '아침' | '모름';
  isRepeating?: boolean;
}

export function composeDreamTextFromStructured(input: StructuredDreamInput): string {
  const parts: string[] = [];
  const groups = DREAM_CHIP_GROUPS;

  for (const g of groups) {
    const sel = input.selections[g.id];
    if (sel && sel.length > 0) {
      parts.push(`${g.label}: ${sel.join(', ')}`);
    }
  }
  if (input.timeOfNight && input.timeOfNight !== '모름') {
    parts.push(`꾼 시간대: ${input.timeOfNight}`);
  }
  if (input.isRepeating) {
    parts.push('반복해서 꾸는 꿈');
  }
  if (input.note && input.note.trim()) {
    parts.push(`추가 기억: ${input.note.trim()}`);
  }
  return parts.join('\n');
}

/**
 * 사용자 꿈 설명에서 KB 상징을 매칭한다.
 * - 모든 심벌의 키워드를 포함 검색(부분 일치).
 * - 최대 5개 반환(너무 많으면 프롬프트 과대).
 */
export function matchDreamSymbols(userText: string, maxHits: number = 5): DreamSymbol[] {
  if (!userText) return [];
  const text = userText.trim();
  if (text.length === 0) return [];

  const hits: { sym: DreamSymbol; rank: number }[] = [];
  for (const sym of DREAM_SYMBOLS) {
    let rank = 0;
    for (const kw of sym.keywords) {
      if (!kw) continue;
      if (text.includes(kw)) {
        // 긴 키워드(구체적) 우선
        rank += kw.length;
      }
    }
    if (rank > 0) hits.push({ sym, rank });
  }

  hits.sort((a, b) => b.rank - a.rank);
  return hits.slice(0, maxHits).map(h => h.sym);
}

/** 매칭된 상징 목록을 프롬프트용 텍스트 블록으로 직렬화. */
export function buildMatchedSymbolsBlock(matches: DreamSymbol[]): string {
  if (matches.length === 0) {
    return '[꿈속 상징 매칭 결과]\n직접 매칭된 전통 상징 없음 — 사용자의 문장 자체를 토대로 자유롭게 해석하되, 길흉 단정은 보수적으로 하세요.';
  }
  const lines = matches.map(s => {
    const pol = s.polarity === 'good' ? '길몽' : s.polarity === 'bad' ? '흉몽' : s.polarity === 'mixed' ? '길흉혼재' : '중립';
    return `• ${s.label} [${s.category}·${pol}] — ${s.tradition}${s.psychology ? ` (심리: ${s.psychology})` : ''}`;
  });
  return `[꿈속 상징 매칭 결과]\n${lines.join('\n')}`;
}
