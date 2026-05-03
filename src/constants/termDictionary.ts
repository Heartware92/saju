/**
 * 사주 용어 사전 — 일반인용 간단 설명
 * 운세 결과 화면의 칩/배지에 붙이는 툴팁 용도.
 * 톤: 학술적 용어 최소화, 실생활 언어로 2문장 이내.
 */

export type TermCategory = 'sipsung' | 'grade' | 'ganzhi' | 'concept' | 'stage' | 'stem' | 'branch';

export interface TermEntry {
  term: string;
  category: TermCategory;
  short: string;        // 한 줄 요약 (팝오버 헤드)
  description: string;  // 본문 1~2문장
}

export const TERM_DICTIONARY: Record<string, TermEntry> = {
  // ── 십성(十星) 10개 — 일간과 다른 글자의 관계 ────────────────────
  '비견': {
    term: '비견', category: 'sipsung',
    short: '나와 닮은 동료·경쟁자',
    description: '나와 같은 기운의 사람. 친구·동료·형제처럼 옆에서 힘이 되기도 하고, 경쟁자가 되기도 해요.',
  },
  '겁재': {
    term: '겁재', category: 'sipsung',
    short: '돈이 새는 형제·동료',
    description: '비견과 비슷하지만 성향이 더 세요. 의리는 있지만 공동 재산에서 손해를 보거나 과소비로 이어지기 쉬워요.',
  },
  '식신': {
    term: '식신', category: 'sipsung',
    short: '먹을 복·창작의 기운',
    description: '여유롭게 즐기고 표현하는 에너지. 먹고사는 데 걱정 없는 복, 예술·요리·표현 활동에 재능이 있어요.',
  },
  '상관': {
    term: '상관', category: 'sipsung',
    short: '톡 쏘는 표현력',
    description: '남들이 못 하는 말을 시원하게 하는 기운. 재치·감각이 뛰어나지만 직선적인 말투로 갈등을 만들 수 있어요.',
  },
  '편재': {
    term: '편재', category: 'sipsung',
    short: '크게 들어왔다 나가는 돈',
    description: '사업·투자로 움직이는 재물. 큰 돈이 들어오지만 그만큼 크게 나가기도 해요. 흐름을 타는 감각이 필요합니다.',
  },
  '정재': {
    term: '정재', category: 'sipsung',
    short: '성실하게 쌓이는 돈',
    description: '월급·저축·임대처럼 예측 가능한 안정적인 수입. 꾸준한 노동의 대가로 들어오는 재물이에요.',
  },
  '편관': {
    term: '편관', category: 'sipsung',
    short: '강한 권력·압박',
    description: '책임감과 추진력은 강하지만 스트레스·압박이 큰 기운. 리더 역할을 맡거나 어려운 상황을 뚫어내는 힘이에요.',
  },
  '정관': {
    term: '정관', category: 'sipsung',
    short: '명예·원칙의 자리',
    description: '규칙과 책임을 지키는 에너지. 공직·대기업·안정적인 조직에서 인정받는 기운이에요.',
  },
  '편인': {
    term: '편인', category: 'sipsung',
    short: '전문 지식·남다른 감각',
    description: '한 분야에 깊이 파고드는 힘. 학문·예술·종교·전문 기술처럼 남다른 영역에 재능이 있어요.',
  },
  '정인': {
    term: '정인', category: 'sipsung',
    short: '공부·학문의 기운',
    description: '배움과 어머니의 보살핌 같은 에너지. 학업·자격증·명예에 유리하고 정신적인 풍요를 줘요.',
  },

  // ── 운세 등급 6단계 ─────────────────────────────────────────────
  '대길': {
    term: '대길', category: 'grade',
    short: '가장 좋은 때',
    description: '기운이 막힘없이 잘 흘러가는 시기. 새로운 시작·도전·결정을 과감하게 해도 좋아요.',
  },
  '길': {
    term: '길', category: 'grade',
    short: '좋은 흐름',
    description: '전체적으로 순조로워요. 꾸준히 나아가면 성과가 따라오는 시기입니다.',
  },
  '중길': {
    term: '중길', category: 'grade',
    short: '무난하게 좋은 편',
    description: '큰 굴곡 없이 안정적으로 흘러가요. 무리하지 않고 계획대로 꾸준히 하면 좋은 시기.',
  },
  '평': {
    term: '평', category: 'grade',
    short: '평범한 흐름',
    description: '특별히 좋거나 나쁘지 않아요. 큰 변화보다는 기존에 하던 일을 정리·다지는 시기.',
  },
  '중흉': {
    term: '중흉', category: 'grade',
    short: '조심할 때',
    description: '작은 마찰·손실이 생기기 쉬운 시기. 새로운 일보다 기존을 지키고 몸을 낮추는 게 좋아요.',
  },
  '흉': {
    term: '흉', category: 'grade',
    short: '힘든 시기',
    description: '예기치 않은 어려움이 올 수 있어요. 큰 결정은 미루고 건강·관계·재정을 조심스럽게 관리하세요.',
  },

  // ── 핵심 개념 ──────────────────────────────────────────────────
  '용신': {
    term: '용신', category: 'concept',
    short: '내 사주를 돕는 오행',
    description: '사주 전체의 균형을 맞춰주는 가장 중요한 기운. 이 기운을 활용하는 활동·색·방위가 운을 좋게 해요.',
  },
  '희신': {
    term: '희신', category: 'concept',
    short: '용신을 돕는 조력자',
    description: '용신을 뒤에서 받쳐주는 오행. 용신만큼은 아니지만 비슷하게 운을 끌어올려줘요.',
  },
  '기신': {
    term: '기신', category: 'concept',
    short: '나에게 해로운 오행',
    description: '사주 균형을 깨뜨리는 기운. 이 오행이 강해지는 시기에는 조심하고, 관련된 색·방위는 피하는 게 좋아요.',
  },
  '대운': {
    term: '대운', category: 'concept',
    short: '10년 단위 운의 흐름',
    description: '10년마다 바뀌는 인생의 큰 흐름. 한 대운 안에서는 비슷한 주제의 경험이 반복돼요.',
  },
  '세운': {
    term: '세운', category: 'concept',
    short: '1년 단위 운의 흐름',
    description: '해마다 바뀌는 운. 그 해의 분위기·이슈를 결정하며, 대운과 만나 구체적인 사건이 드러나요.',
  },
  '신강': {
    term: '신강', category: 'concept',
    short: '에너지가 강한 사주',
    description: '본인 오행이 강해 의지·추진력이 센 유형. 자기 주도적으로 밀고 나가는 힘이 있어요.',
  },
  '신약': {
    term: '신약', category: 'concept',
    short: '에너지가 부드러운 사주',
    description: '본인 오행이 약해 주변 기운에 잘 어울려가는 유형. 협력·관계 속에서 힘을 얻는 스타일이에요.',
  },
  '격국': {
    term: '격국', category: 'concept',
    short: '사주의 큰 틀',
    description: '이 사람이 어떤 방식으로 살아가는지 정해주는 구조. 정재격·편관격 등 이름에 따라 기질이 달라져요.',
  },
  '간여지동': {
    term: '간여지동', category: 'concept',
    short: '위·아래 같은 오행인 기둥',
    description: '하늘(천간)과 땅(지지)이 같은 오행으로 모인 상태. 한 방향으로 집중된 힘 — 뚝심은 강하지만 고집이 될 수 있어요.',
  },
  '병존': {
    term: '병존', category: 'concept',
    short: '같은 천간이 2개',
    description: '같은 글자가 사주에 2개 있으면 그 특성이 2배로 강해져요. 장점도 커지지만 단점도 같이 커집니다.',
  },
  '삼존': {
    term: '삼존', category: 'concept',
    short: '같은 천간이 3개',
    description: '같은 글자가 3개. 원국 전체를 압도할 만큼 강한 특성이 되어 이 사람의 주된 성향을 결정해요.',
  },

  // ── 12운성(十二運星) ─────────────────────────────────────────────
  '장생': { term: '장생', category: 'stage', short: '새로운 시작의 기운', description: '새 생명이 태어나듯 일이 시작되는 시기. 성장 가능성이 크고 도전에 유리해요.' },
  '목욕': { term: '목욕', category: 'stage', short: '정리·준비의 시기', description: '갓 태어난 아이를 씻기듯, 다듬고 정비하는 단계. 감정적 동요나 변화가 잦을 수 있어요.' },
  '관대': { term: '관대', category: 'stage', short: '성장·활동의 전성기', description: '관모와 갑옷을 입듯 기운이 차오르는 때. 사회 활동이 활발하고 자신감이 높아요.' },
  '건록': { term: '건록', category: 'stage', short: '안정적인 녹봉', description: '일해서 꾸준히 수입을 얻는 시기. 자기 능력으로 생활이 안정돼요.' },
  '제왕': { term: '제왕', category: 'stage', short: '힘의 정점', description: '왕이 즉위한 것처럼 기운이 가장 센 시기. 야심찬 도전에 유리하지만 과욕은 주의.' },
  '쇠': { term: '쇠', category: 'stage', short: '기운이 줄어드는 때', description: '전성기를 지나 서서히 에너지가 약해지는 시기. 무리하지 않고 실속을 챙기는 게 좋아요.' },
  '병(12운성)': { term: '병', category: 'stage', short: '기력이 약해진 상태', description: '몸이 아프듯 힘이 빠져 있는 시기. 휴식·회복이 우선이에요.' },
  '사(12운성)': { term: '사', category: 'stage', short: '마무리·소멸의 기운', description: '한 사이클이 끝나가는 단계. 정리와 마무리에 집중하면 좋아요.' },
  '묘(12운성)': { term: '묘', category: 'stage', short: '잠복·저장의 시기', description: '땅속에 묻혀 다음을 준비하는 때. 겉으로는 조용하지만 내면에서 에너지가 쌓여요.' },
  '절': { term: '절', category: 'stage', short: '단절·새 출발', description: '이전의 흐름이 끊기고 새로운 출발을 준비하는 시기. 변화의 씨앗이 심겨져요.' },
  '태': { term: '태', category: 'stage', short: '잉태·구상 단계', description: '아이가 잉태되듯 새로운 가능성이 싹트는 시기. 아이디어가 떠오르고 기획이 시작돼요.' },
  '양': { term: '양', category: 'stage', short: '성장을 향한 양육', description: '뱃속에서 자라는 단계. 아직 결과가 보이지 않지만 꾸준히 키우면 좋은 열매가 돼요.' },

  // ── 천간(天干) 10개 ─────────────────────────────────────────────
  '갑': { term: '갑', category: 'stem', short: '큰 나무의 기운 (양목)', description: '솟아오르는 큰 나무. 리더십·추진력·정의감이 강해요. 곧은 성격으로 원칙을 중시합니다.' },
  '을': { term: '을', category: 'stem', short: '풀·덩굴의 기운 (음목)', description: '유연한 풀과 덩굴. 적응력이 뛰어나고 부드러운 설득력이 있어요.' },
  '병(천간)': { term: '병', category: 'stem', short: '태양의 기운 (양화)', description: '밝게 비추는 태양. 열정적이고 활발하며 주목받는 것을 좋아해요.' },
  '정': { term: '정', category: 'stem', short: '촛불의 기운 (음화)', description: '은은한 촛불. 섬세하고 감성적이며 내면의 따뜻함이 있어요.' },
  '무': { term: '무', category: 'stem', short: '큰 산의 기운 (양토)', description: '묵직한 산. 듬직하고 안정적이며 사람들의 중심에 서는 포용력이 있어요.' },
  '기': { term: '기', category: 'stem', short: '기름진 밭의 기운 (음토)', description: '만물을 키우는 비옥한 땅. 세심하고 배려심이 깊으며 실질적인 성과를 만들어요.' },
  '경': { term: '경', category: 'stem', short: '바위·쇠의 기운 (양금)', description: '단단한 바위와 강철. 결단력이 강하고 의리가 있으며 추진력이 뛰어나요.' },
  '신': { term: '신', category: 'stem', short: '보석·가위의 기운 (음금)', description: '다듬어진 보석. 섬세한 감각과 날카로운 판단력, 완벽주의적 성향이 있어요.' },
  '임': { term: '임', category: 'stem', short: '큰 바다의 기운 (양수)', description: '넓은 바다와 큰 강. 지혜롭고 포용력 있으며 자유로운 사고를 해요.' },
  '계': { term: '계', category: 'stem', short: '이슬·빗물의 기운 (음수)', description: '조용한 이슬과 샘물. 영리하고 직감이 뛰어나며 학문적 재능이 있어요.' },

  // ── 지지(地支) 12개 ─────────────────────────────────────────────
  '자': { term: '자', category: 'branch', short: '쥐띠 · 수(水) 기운', description: '자시(23:00~01:00)에 해당하는 수 기운. 지혜롭고 민첩하며 새로운 시작의 에너지예요.' },
  '축': { term: '축', category: 'branch', short: '소띠 · 토(土) 기운', description: '축시(01:00~03:00)에 해당하는 토 기운. 성실하고 꾸준하며 저축·축적의 기운이에요.' },
  '인': { term: '인', category: 'branch', short: '호랑이띠 · 목(木) 기운', description: '인시(03:00~05:00)에 해당하는 목 기운. 용맹하고 진취적이며 새벽의 시작 에너지예요.' },
  '묘(지지)': { term: '묘', category: 'branch', short: '토끼띠 · 목(木) 기운', description: '묘시(05:00~07:00)에 해당하는 목 기운. 온화하고 감수성이 풍부하며 봄의 에너지예요.' },
  '진': { term: '진', category: 'branch', short: '용띠 · 토(土) 기운', description: '진시(07:00~09:00)에 해당하는 토 기운. 변화와 발전의 기운이 강하고 야심차요.' },
  '사(지지)': { term: '사', category: 'branch', short: '뱀띠 · 화(火) 기운', description: '사시(09:00~11:00)에 해당하는 화 기운. 지혜롭고 통찰력이 뛰어나며 직감이 강해요.' },
  '오': { term: '오', category: 'branch', short: '말띠 · 화(火) 기운', description: '오시(11:00~13:00)에 해당하는 화 기운. 활기차고 열정적이며 정오의 절정 에너지예요.' },
  '미': { term: '미', category: 'branch', short: '양띠 · 토(土) 기운', description: '미시(13:00~15:00)에 해당하는 토 기운. 온순하고 예술적이며 풍요의 기운이에요.' },
  '신(지지)': { term: '신', category: 'branch', short: '원숭이띠 · 금(金) 기운', description: '신시(15:00~17:00)에 해당하는 금 기운. 재치있고 다재다능하며 수확의 에너지예요.' },
  '유': { term: '유', category: 'branch', short: '닭띠 · 금(金) 기운', description: '유시(17:00~19:00)에 해당하는 금 기운. 정확하고 섬세하며 결실의 에너지예요.' },
  '술': { term: '술', category: 'branch', short: '개띠 · 토(土) 기운', description: '술시(19:00~21:00)에 해당하는 토 기운. 충직하고 의리있으며 저녁의 마무리 에너지예요.' },
  '해': { term: '해(지지)', category: 'branch', short: '돼지띠 · 수(水) 기운', description: '해시(21:00~23:00)에 해당하는 수 기운. 관대하고 낙천적이며 풍요의 에너지예요.' },
};

/**
 * 임의 문자열에서 용어 엔트리 해석.
 * - 사전에 있으면 그대로 반환
 * - 한자 2글자(간지 패턴)면 공통 간지 설명 생성
 * - 그 외는 null (툴팁 없이 평범한 칩)
 */
export function resolveTerm(raw: string, hint?: 'stem' | 'branch' | 'stage'): TermEntry | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (TERM_DICTIONARY[trimmed]) return TERM_DICTIONARY[trimmed];

  if (hint) {
    const suffixed = `${trimmed}(${hint === 'stage' ? '12운성' : hint === 'stem' ? '천간' : '지지'})`;
    if (TERM_DICTIONARY[suffixed]) return TERM_DICTIONARY[suffixed];
  }

  if (/^[一-鿿]{2}$/.test(trimmed)) {
    return {
      term: trimmed,
      category: 'ganzhi',
      short: '간지 (천간 + 지지)',
      description: '연·월·일·시의 기운을 2글자로 표현한 것. 앞 글자는 하늘의 기운(천간), 뒤 글자는 땅의 기운(지지)이에요.',
    };
  }

  return null;
}

export const GRADE_COLOR: Record<string, string> = {
  '대길': '#34D399',
  '길':   '#86EFAC',
  '중길': '#FBBF24',
  '평':   '#CBD5E1',
  '중흉': '#FB923C',
  '흉':   '#F87171',
};
