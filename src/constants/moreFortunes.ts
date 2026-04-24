/**
 * "더 많은 운세" 9개 카테고리 메타 정보
 * - 홈 탭 아래 버튼으로 노출
 * - 각 카테고리는 달(moon) 크레딧 1개 소모
 * - 큰 카테고리(정통사주·신년·오늘·지정일·택일·토정·자미두수)와 달리 짧고 집중된 풀이
 */

export type MoreFortuneId =
  | 'love'         // 애정운
  | 'wealth'       // 재물운
  | 'career'       // 직업·진로운
  | 'health'       // 건강운
  | 'study'        // 학업·시험운
  | 'people'       // 인간관계·귀인운
  | 'children'     // 자녀·출산운
  | 'personality'  // 성격 심층 분석
  | 'name'         // 이름 풀이 (추가 입력 필요)
  | 'dream';       // 꿈 해몽 (꿈 서술 입력 필요)

export interface MoreFortuneConfig {
  id: MoreFortuneId;
  title: string;
  icon: string;
  shortDesc: string;       // 홈 버튼 아래 한 줄
  longDesc: string;        // 페이지 소개 카드 본문
  ctaButton: string;       // 풀이 버튼 문구
  maxTokens: number;       // AI 응답 길이 (토큰)
  needsNameInput?: boolean;
  needsDreamInput?: boolean;
}

export const MORE_FORTUNE_CONFIGS: Record<MoreFortuneId, MoreFortuneConfig> = {
  love: {
    id: 'love',
    title: '애정운',
    icon: '♡',
    shortDesc: '연애·결혼 시기',
    longDesc: '일지(배우자궁)와 재성·관성, 도화살을 바탕으로 어떤 사람에게 끌리는지, 올해 연애·결혼 가능성이 높은 시기가 언제인지 풀어드려요.',
    ctaButton: '내 애정운 보기',
    maxTokens: 1500,
  },
  wealth: {
    id: 'wealth',
    title: '재물운',
    icon: '◆',
    shortDesc: '돈의 흐름·시기',
    longDesc: '사주 속 재성(편재·정재) 분포와 재고, 올해 세운의 재성 흐름을 근거로 돈이 들어오는 스타일과 쌓이는 시기를 알려드려요.',
    ctaButton: '내 재물운 보기',
    maxTokens: 1500,
  },
  career: {
    id: 'career',
    title: '직업·진로운',
    icon: '▲',
    shortDesc: '적성·이직 시기',
    longDesc: '관성(조직)과 식상(창의), 격국을 종합해 어떤 직군이 잘 맞는지, 지금 이직·승진 시기로 적절한지 진단해드려요.',
    ctaButton: '내 직업운 보기',
    maxTokens: 1500,
  },
  health: {
    id: 'health',
    title: '건강운',
    icon: '◎',
    shortDesc: '약한 장부 진단',
    longDesc: '약한 오행과 충·형 구조로 취약한 장부를 파악하고, 올해 세운이 어느 장부에 영향을 주는지 주의사항과 습관을 알려드려요.',
    ctaButton: '내 건강운 보기',
    maxTokens: 1300,
  },
  study: {
    id: 'study',
    title: '학업·시험운',
    icon: '✎',
    shortDesc: '시험 유리한 달',
    longDesc: '인성(문창·학당귀인)과 식상, 올해 세운을 근거로 공부 체질인지, 시험·자격·발표에 유리한 달이 언제인지 짚어드려요.',
    ctaButton: '내 학업운 보기',
    maxTokens: 1300,
  },
  people: {
    id: 'people',
    title: '귀인운',
    icon: '★',
    shortDesc: '귀인·경계 관계',
    longDesc: '천을귀인과 비겁·인성·관성 배치를 바탕으로 올해 누가 도움이 될지, 조심해야 할 관계 유형이 무엇인지 알려드려요.',
    ctaButton: '내 귀인운 보기',
    maxTokens: 1500,
  },
  children: {
    id: 'children',
    title: '자녀·출산운',
    icon: '◇',
    shortDesc: '출산 유리한 달',
    longDesc: '남성은 관성, 여성은 식상을 자녀성으로 보고 시주의 자녀궁과 세운 흐름으로 자녀복과 출산에 유리한 시기를 풀어드려요.',
    ctaButton: '내 자녀운 보기',
    maxTokens: 1300,
  },
  personality: {
    id: 'personality',
    title: '성격 심층 분석',
    icon: '◉',
    shortDesc: '성격 심층 진단',
    longDesc: '일주 60갑자와 격국·신강신약·간여지동·주요 신살을 종합해 타고난 본질, 강점 2가지와 숨은 그림자 2가지를 명확히 짚어드려요.',
    ctaButton: '내 성격 분석 보기',
    maxTokens: 1800,
  },
  name: {
    id: 'name',
    title: '이름 풀이',
    icon: '✦',
    shortDesc: '이름·사주 조화',
    longDesc: '한글 초성의 음령오행을 분석해 내 이름이 사주 용신을 돕는지 거스르는지 진단하고, 한자를 입력하면 부수 기반 자원오행까지 교차 분석해 필명·닉네임 방향을 제안해드려요.',
    ctaButton: '내 이름 풀이 보기',
    maxTokens: 1300,
    needsNameInput: true,
  },
  dream: {
    id: 'dream',
    title: '꿈 해몽',
    icon: '☾',
    shortDesc: '꿈의 현실 힌트',
    longDesc: '간밤에 꾼 꿈을 적어주세요. 전통 꿈해몽 지식베이스와 당신의 사주 원국·올해 세운을 함께 해석해 꿈이 가리키는 현실의 힌트를 구체적으로 알려드려요.',
    ctaButton: '내 꿈 풀이 보기',
    maxTokens: 1500,
    needsDreamInput: true,
  },
};

export const MORE_FORTUNE_ORDER: MoreFortuneId[] = [
  'love', 'wealth', 'career',
  'health', 'study', 'people',
  'children', 'personality', 'name',
  'dream',
];

export const MOON_COST_PER_FORTUNE = 1;
