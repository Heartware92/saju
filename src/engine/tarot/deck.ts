/**
 * 타로 카드 덱 — 78장 풀덱(메이저 22 + 마이너 56)
 *
 * 각 카드는 전통적 라이더-웨이트 의미에 기반하며,
 * 정방향/역방향 키워드와 맥락별 해석(전반·애정·직업·재물·건강)을 포함한다.
 *
 * 모든 데이터는 결정론적 — 같은 시드로 뽑으면 같은 결과.
 */

export type TarotElement = 'Fire' | 'Water' | 'Air' | 'Earth' | 'Spirit';
export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotContextMeaning {
  overall: string;
  love: string;
  career: string;
  money: string;
  health: string;
  advice: string;
}

export interface TarotCard {
  id: number;          // 0~77
  name: string;        // English
  nameKr: string;      // Korean
  symbol: string;      // Roman numeral or suit symbol
  suit: TarotSuit;
  number?: number;     // 1~14 for minor, 0~21 for major
  element: TarotElement;
  keywords: { upright: string[]; reversed: string[] };
  upright: TarotContextMeaning;
  reversed: TarotContextMeaning;
}

// ================================================================
// 메이저 아르카나 22장
// ================================================================
const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0, name: 'The Fool', nameKr: '광대', symbol: '0', suit: 'major', number: 0, element: 'Air',
    keywords: { upright: ['새 출발', '순수', '모험', '자유', '가능성'], reversed: ['무모함', '경솔', '위험 무시', '방향 상실'] },
    upright: {
      overall: '새로운 여정이 시작됩니다. 경험은 부족해도 순수한 열정이 길을 열어줍니다.',
      love: '새로운 만남이나 관계의 초기 단계. 가볍고 자유롭게 상대를 대하세요.',
      career: '미지의 프로젝트·창업·이직 기회. 체계보다 용기가 필요한 시점.',
      money: '큰 투자보다 소액의 실험적 지출. 배움에 쓰는 돈은 아끼지 말 것.',
      health: '컨디션 회복 국면. 새 운동이나 습관 시작에 좋은 타이밍.',
      advice: '완벽한 계획보다 일단 첫걸음을 떼는 것이 중요합니다.',
    },
    reversed: {
      overall: '준비 없이 달려들어 위험을 초래할 수 있습니다. 한 템포 멈추세요.',
      love: '즉흥적 선택, 변덕. 상대의 신중함이 필요.',
      career: '무모한 사직·이직. 중요 결정은 미루세요.',
      money: '충동 소비·도박 충동 주의.',
      health: '경솔한 식이·수면 패턴. 기본부터 점검.',
      advice: '지금은 뛰기보다 내려다볼 때입니다.',
    },
  },
  {
    id: 1, name: 'The Magician', nameKr: '마법사', symbol: 'I', suit: 'major', number: 1, element: 'Air',
    keywords: { upright: ['창조', '의지', '실행력', '다재다능', '주도'], reversed: ['속임수', '미숙', '재능 낭비', '허세'] },
    upright: {
      overall: '가진 자원을 현실로 만들 힘이 있습니다. 의지를 모아 집중하세요.',
      love: '원하는 관계를 스스로 만들어가는 시기. 먼저 표현할 것.',
      career: '자신의 재능을 제대로 드러낼 기회. 프레젠테이션·면접 유리.',
      money: '적극적 창출의 기운. 부업·프리랜싱 결과가 좋음.',
      health: '의지로 나쁜 습관을 바꿀 수 있는 시기.',
      advice: '도구는 갖춰져 있습니다. 망설이지 말고 시작하세요.',
    },
    reversed: {
      overall: '재능을 제대로 쓰지 못하거나, 허세로 공허한 결과를 만들 수 있습니다.',
      love: '말뿐인 매력, 진심 부족.',
      career: '과장된 자기 PR이 독이 됨. 실력을 다질 것.',
      money: '사기·투기 조심.',
      health: '임시방편 처방보다 근본 원인 해결.',
      advice: '겉보다 실력을 다듬을 때입니다.',
    },
  },
  {
    id: 2, name: 'The High Priestess', nameKr: '여사제', symbol: 'II', suit: 'major', number: 2, element: 'Water',
    keywords: { upright: ['직관', '비밀', '지혜', '내면', '신비'], reversed: ['억압', '비밀 유출', '혼란', '얕은 판단'] },
    upright: {
      overall: '말보다 내면의 소리가 정확합니다. 성급한 결정을 피하고 관찰하세요.',
      love: '깊은 이해와 비언어적 교감. 아직 드러나지 않은 감정.',
      career: '전문성·연구 분야에서 성과. 눈에 띄지 않지만 인정받음.',
      money: '저축·자산 보존의 시기.',
      health: '무의식의 신호 — 꿈·직감을 존중.',
      advice: '조용히 듣는 것이 최선의 전략입니다.',
    },
    reversed: {
      overall: '표면적 판단으로 중요한 것을 놓칠 수 있습니다.',
      love: '소통 부재·오해.',
      career: '정보 누출·동료 간 불신.',
      money: '숨겨진 지출·비공개 거래 주의.',
      health: '스트레스 누적 — 드러내고 풀 것.',
      advice: '감정을 억누르지 말고 드러내세요.',
    },
  },
  {
    id: 3, name: 'The Empress', nameKr: '여황제', symbol: 'III', suit: 'major', number: 3, element: 'Earth',
    keywords: { upright: ['풍요', '창조', '모성', '양육', '감성'], reversed: ['의존', '공허', '산만', '창의 부족'] },
    upright: {
      overall: '풍요와 창조력의 시기. 시작한 일이 무르익어 결실을 냅니다.',
      love: '따뜻하고 안정적 관계. 임신·가족 확장의 기운.',
      career: '기획·예술·교육 분야 성과. 동료들에게 영감을 줌.',
      money: '부가 늘어나는 시기 — 소비보다 재투자.',
      health: '균형 잡힌 건강.',
      advice: '자신과 주변을 돌보며 에너지를 순환시키세요.',
    },
    reversed: {
      overall: '과잉 보호나 의존이 창의성을 막을 수 있습니다.',
      love: '공허함·일방적 헌신.',
      career: '창의력 고갈, 번아웃.',
      money: '사치성 소비.',
      health: '호르몬·피로 누적.',
      advice: '남을 돌보기 전에 나를 먼저 돌보세요.',
    },
  },
  {
    id: 4, name: 'The Emperor', nameKr: '황제', symbol: 'IV', suit: 'major', number: 4, element: 'Fire',
    keywords: { upright: ['권위', '안정', '리더십', '구조', '통제'], reversed: ['독재', '경직', '통제욕', '권력 남용'] },
    upright: {
      overall: '구조와 질서를 세울 때. 책임감 있는 결정이 신뢰를 낳습니다.',
      love: '안정적·장기적 관계. 결혼 얘기 가능.',
      career: '승진·리더 역할. 조직 체계가 인정받음.',
      money: '재정 관리·저축 강화.',
      health: '규칙적 생활 리듬.',
      advice: '원칙을 지키되 유연함을 잃지 마세요.',
    },
    reversed: {
      overall: '권위 남용·고집으로 주변과 마찰.',
      love: '일방적 주도·간섭.',
      career: '상사와 충돌·관료주의에 피로.',
      money: '과도한 긴축으로 기회 상실.',
      health: '스트레스성 긴장.',
      advice: '통제보다 신뢰를 택하세요.',
    },
  },
  {
    id: 5, name: 'The Hierophant', nameKr: '교황', symbol: 'V', suit: 'major', number: 5, element: 'Earth',
    keywords: { upright: ['전통', '가르침', '멘토', '제도', '영적'], reversed: ['맹종', '고정관념', '반항', '자유 억압'] },
    upright: {
      overall: '검증된 방법·스승·전통을 따르면 길이 보입니다.',
      love: '공식적 관계 — 약혼·결혼·양가 인사.',
      career: '멘토링·교육·공공 분야 유리.',
      money: '보수적 투자·연금·적금.',
      health: '정기 검진·전통 의학.',
      advice: '지금은 새로운 방식보다 고전적 지혜가 통합니다.',
    },
    reversed: {
      overall: '규칙에 억눌려 자유를 잃거나, 불필요한 반항을 하게 됩니다.',
      love: '관습에 막힌 관계.',
      career: '조직 내 고정관념·권위주의.',
      money: '제도 외 투자 유혹 — 신중할 것.',
      health: '대체 요법 과신 주의.',
      advice: '맹목적 순응·반항 모두 피하세요.',
    },
  },
  {
    id: 6, name: 'The Lovers', nameKr: '연인', symbol: 'VI', suit: 'major', number: 6, element: 'Air',
    keywords: { upright: ['사랑', '조화', '선택', '결합', '가치관'], reversed: ['불화', '잘못된 선택', '유혹', '갈등'] },
    upright: {
      overall: '중요한 선택의 순간. 마음과 가치관이 일치하는 길을 택하세요.',
      love: '운명적 만남 혹은 관계의 확신.',
      career: '동업·협업·이직 결정.',
      money: '공동 투자·재정 파트너십.',
      health: '마음의 평화가 몸의 건강으로 이어짐.',
      advice: '선택의 기준은 가치관이지 조건이 아닙니다.',
    },
    reversed: {
      overall: '잘못된 선택·관계의 불균형.',
      love: '삼각관계·가치관 충돌.',
      career: '파트너 간 갈등.',
      money: '공동 명의 분쟁.',
      health: '관계 스트레스로 인한 심신 소모.',
      advice: '결정 전 자신의 진짜 욕구를 점검하세요.',
    },
  },
  {
    id: 7, name: 'The Chariot', nameKr: '전차', symbol: 'VII', suit: 'major', number: 7, element: 'Water',
    keywords: { upright: ['승리', '의지', '전진', '집중', '통제'], reversed: ['방향 상실', '제어 불능', '공격성', '지연'] },
    upright: {
      overall: '강한 의지로 목표를 돌파하는 시기. 경쟁에서 우위.',
      love: '적극적 프러포즈·구애 성공.',
      career: '프로젝트 주도·승진.',
      money: '성과에 따른 수입 증가.',
      health: '활력 상승·운동 성과.',
      advice: '방향을 정했다면 흔들리지 마세요.',
    },
    reversed: {
      overall: '방향성 상실·폭주. 브레이크가 필요합니다.',
      love: '고집으로 인한 충돌.',
      career: '독단·팀 와해.',
      money: '무리한 확장.',
      health: '과로·사고 위험.',
      advice: '속도를 줄이고 방향을 다시 맞추세요.',
    },
  },
  {
    id: 8, name: 'Strength', nameKr: '힘', symbol: 'VIII', suit: 'major', number: 8, element: 'Fire',
    keywords: { upright: ['내면의 힘', '용기', '인내', '절제', '부드러움'], reversed: ['자기 의심', '나약', '분노', '충동'] },
    upright: {
      overall: '부드러운 힘이 강한 것을 이깁니다. 감정을 다스리면 모든 일이 풀립니다.',
      love: '갈등 속 인내·화해.',
      career: '스트레스 관리 능력이 인정받음.',
      money: '꾸준한 저축.',
      health: '내면 안정이 체력으로 전이.',
      advice: '서두르지 말고 따뜻하게 설득하세요.',
    },
    reversed: {
      overall: '자신감 부족·감정 폭발.',
      love: '질투·분노로 관계 위태.',
      career: '스트레스로 퍼포먼스 저하.',
      money: '공포 매매·손절 실패.',
      health: '면역력 저하·스트레스성 질환.',
      advice: '호흡을 고르고 감정의 근원을 살피세요.',
    },
  },
  {
    id: 9, name: 'The Hermit', nameKr: '은둔자', symbol: 'IX', suit: 'major', number: 9, element: 'Earth',
    keywords: { upright: ['내면 탐색', '지혜', '고독', '성찰', '인도'], reversed: ['고립', '외로움', '현실 도피', '편협'] },
    upright: {
      overall: '혼자만의 시간에서 답이 나옵니다. 외부 자극을 줄이세요.',
      love: '잠시 거리두기·자기 이해.',
      career: '연구·전문화에 유리.',
      money: '신중한 재정 점검.',
      health: '명상·요가·휴식.',
      advice: '내면의 나침반을 믿으세요.',
    },
    reversed: {
      overall: '과도한 고립으로 사회와 단절.',
      love: '회피·연락 두절.',
      career: '팀 고립으로 기회 놓침.',
      money: '정보 부재로 손실.',
      health: '외로움에서 오는 우울.',
      advice: '혼자의 시간을 줄이고 사람 속으로 돌아오세요.',
    },
  },
  {
    id: 10, name: 'Wheel of Fortune', nameKr: '운명의 수레바퀴', symbol: 'X', suit: 'major', number: 10, element: 'Fire',
    keywords: { upright: ['변화', '행운', '전환점', '순환', '타이밍'], reversed: ['악운', '저항', '정체', '지연'] },
    upright: {
      overall: '흐름이 바뀝니다. 변화의 방향을 읽고 편승하세요.',
      love: '예상치 못한 만남·재회.',
      career: '새 기회·역할 변경.',
      money: '뜻밖의 수입.',
      health: '회복의 전환점.',
      advice: '기회의 창은 짧습니다 — 준비된 자에게 옵니다.',
    },
    reversed: {
      overall: '잠시 불운의 시기. 바닥에서 준비하세요.',
      love: '관계 권태기·이별.',
      career: '프로젝트 중단.',
      money: '예상치 못한 지출.',
      health: '만성 증상 악화.',
      advice: '버티는 것도 실력입니다.',
    },
  },
  {
    id: 11, name: 'Justice', nameKr: '정의', symbol: 'XI', suit: 'major', number: 11, element: 'Air',
    keywords: { upright: ['공정', '진실', '균형', '책임', '인과'], reversed: ['불공정', '편견', '책임 회피', '부정'] },
    upright: {
      overall: '뿌린 대로 거둡니다. 공정한 결과가 나옵니다.',
      love: '관계의 균형·책임 분담.',
      career: '승진·인정·공정 평가.',
      money: '밀린 돈 회수·계약 성공.',
      health: '생활 리듬 회복.',
      advice: '정직이 최상의 전략입니다.',
    },
    reversed: {
      overall: '불공정한 평가·법적 분쟁 가능.',
      love: '불평등한 관계.',
      career: '승진 누락·부당한 평가.',
      money: '계약 분쟁.',
      health: '무시해 온 증상 표면화.',
      advice: '숨기려 하지 말고 바로잡으세요.',
    },
  },
  {
    id: 12, name: 'The Hanged Man', nameKr: '매달린 사람', symbol: 'XII', suit: 'major', number: 12, element: 'Water',
    keywords: { upright: ['희생', '관점 전환', '정지', '수용', '내맡김'], reversed: ['무의미한 희생', '저항', '이기심', '지연'] },
    upright: {
      overall: '잠시 멈추고 관점을 바꾸면 답이 보입니다.',
      love: '관계를 위한 작은 양보.',
      career: '프로젝트 일시 정지·재평가.',
      money: '투자 재검토.',
      health: '휴식·재활.',
      advice: '내려놓음이 전진입니다.',
    },
    reversed: {
      overall: '헛된 희생·고집. 놓아야 할 때입니다.',
      love: '일방적 희생에 지침.',
      career: '의미 없는 야근.',
      money: '손절 실패.',
      health: '회복기 무시.',
      advice: '버리는 용기가 필요합니다.',
    },
  },
  {
    id: 13, name: 'Death', nameKr: '죽음', symbol: 'XIII', suit: 'major', number: 13, element: 'Water',
    keywords: { upright: ['끝과 시작', '변환', '재탄생', '정리', '해방'], reversed: ['변화 거부', '집착', '정체', '두려움'] },
    upright: {
      overall: '끝은 새 시작을 의미합니다. 오래된 것을 놓아주세요.',
      love: '오랜 관계의 마무리 혹은 재정의.',
      career: '직무·업계 전환.',
      money: '자산 구조 재편.',
      health: '나쁜 습관 청산.',
      advice: '두려움이 아닌 해방으로 받아들이세요.',
    },
    reversed: {
      overall: '변화 거부로 인한 정체.',
      love: '과거에 매여 전진 못함.',
      career: '퇴사 미루다 상황 악화.',
      money: '비효율적 자산 고수.',
      health: '치료 지연.',
      advice: '집착이 가장 큰 적입니다.',
    },
  },
  {
    id: 14, name: 'Temperance', nameKr: '절제', symbol: 'XIV', suit: 'major', number: 14, element: 'Fire',
    keywords: { upright: ['균형', '조화', '인내', '통합', '중용'], reversed: ['불균형', '과잉', '조급', '극단'] },
    upright: {
      overall: '서로 다른 것을 조화롭게 섞는 시기. 중용이 빛납니다.',
      love: '성숙한 관계·의사소통 원활.',
      career: '팀 조율·프로젝트 통합.',
      money: '균형 잡힌 포트폴리오.',
      health: '식단·운동 밸런스.',
      advice: '극단보다 중도를 택하세요.',
    },
    reversed: {
      overall: '균형 상실·조급함이 일을 그르칩니다.',
      love: '감정 과잉·냉각.',
      career: '무리한 일정.',
      money: '충동 투자.',
      health: '생활 리듬 붕괴.',
      advice: '한 박자 늦추는 것이 빠른 길입니다.',
    },
  },
  {
    id: 15, name: 'The Devil', nameKr: '악마', symbol: 'XV', suit: 'major', number: 15, element: 'Earth',
    keywords: { upright: ['유혹', '속박', '집착', '물질', '그림자'], reversed: ['해방', '각성', '자유', '집착 극복'] },
    upright: {
      overall: '물질·욕망·중독에 묶인 시기. 자각이 필요합니다.',
      love: '집착·의존·독점.',
      career: '돈·지위에 얽매인 선택.',
      money: '빚·도박·투기의 유혹.',
      health: '중독·탐닉.',
      advice: '자신의 그림자를 직시하세요.',
    },
    reversed: {
      overall: '묶였던 것에서 벗어나는 해방의 시기.',
      love: '불건강한 관계 청산.',
      career: '환경 탈출·독립.',
      money: '빚 정리.',
      health: '습관 극복·금주·금연.',
      advice: '지금이 자유를 되찾을 기회입니다.',
    },
  },
  {
    id: 16, name: 'The Tower', nameKr: '탑', symbol: 'XVI', suit: 'major', number: 16, element: 'Fire',
    keywords: { upright: ['급변', '깨달음', '충격', '해체', '진실'], reversed: ['회피된 붕괴', '점진적 변화', '두려움'] },
    upright: {
      overall: '급격한 변화·충격. 무너져야 진실이 드러납니다.',
      love: '관계의 파국 혹은 폭로.',
      career: '해고·구조조정.',
      money: '예상치 못한 손실.',
      health: '응급 상황·급성 질환.',
      advice: '무너지는 것을 두려워 말고, 기초부터 다시 세우세요.',
    },
    reversed: {
      overall: '큰 위기는 피했으나 불안은 남음.',
      love: '깨지기 직전의 관계.',
      career: '정리해고 루머.',
      money: '부채 누적.',
      health: '검진 미루기.',
      advice: '미룬다고 문제가 사라지지 않습니다.',
    },
  },
  {
    id: 17, name: 'The Star', nameKr: '별', symbol: 'XVII', suit: 'major', number: 17, element: 'Air',
    keywords: { upright: ['희망', '영감', '치유', '믿음', '비전'], reversed: ['절망', '불신', '영감 부재', '낙담'] },
    upright: {
      overall: '폭풍 후 평화. 상처가 치유되고 새 비전이 싹틉니다.',
      love: '신뢰 회복·새로운 설렘.',
      career: '장기 목표의 밑그림.',
      money: '장기 투자·보험·연금.',
      health: '회복기 진입.',
      advice: '희망은 계획을 이깁니다.',
    },
    reversed: {
      overall: '믿음을 잃은 상태. 작은 기쁨부터 다시 찾으세요.',
      love: '회의·이별 생각.',
      career: '비전 부재·번아웃.',
      money: '미래에 대한 불안.',
      health: '기력 저하.',
      advice: '아주 작은 빛이라도 먼저 보려 하세요.',
    },
  },
  {
    id: 18, name: 'The Moon', nameKr: '달', symbol: 'XVIII', suit: 'major', number: 18, element: 'Water',
    keywords: { upright: ['직관', '무의식', '환상', '불안', '은폐'], reversed: ['진실 발견', '두려움 해소', '혼란 극복'] },
    upright: {
      overall: '보이는 것이 전부가 아닙니다. 혼란 속에서도 직관을 믿으세요.',
      love: '의심·오해·거짓.',
      career: '정보 은폐·복잡한 정치.',
      money: '불명확한 계약.',
      health: '원인 모를 증상·불안.',
      advice: '성급한 판단을 미루고 안개가 걷힐 때까지 기다리세요.',
    },
    reversed: {
      overall: '진실이 드러나는 시기. 오해가 풀립니다.',
      love: '의심 해소·화해.',
      career: '숨겨진 문제 노출 후 해결.',
      money: '혼란 정리.',
      health: '원인 규명.',
      advice: '용기 내어 진실을 마주하세요.',
    },
  },
  {
    id: 19, name: 'The Sun', nameKr: '태양', symbol: 'XIX', suit: 'major', number: 19, element: 'Fire',
    keywords: { upright: ['성공', '기쁨', '활력', '명예', '긍정'], reversed: ['일시적 좌절', '자만', '지연', '과열'] },
    upright: {
      overall: '가장 밝은 시기. 모든 일이 순조롭고 인정받습니다.',
      love: '행복·결혼·임신.',
      career: '성공·명성·수상.',
      money: '부 축적.',
      health: '활력·회복.',
      advice: '지금의 기쁨을 나누세요 — 배로 돌아옵니다.',
    },
    reversed: {
      overall: '성공이 지연되거나 자만이 발목을 잡습니다.',
      love: '과시로 인한 균열.',
      career: '성과 과대평가.',
      money: '지나친 낙관.',
      health: '과열·탈진.',
      advice: '겸손이 지속을 만듭니다.',
    },
  },
  {
    id: 20, name: 'Judgement', nameKr: '심판', symbol: 'XX', suit: 'major', number: 20, element: 'Spirit',
    keywords: { upright: ['부활', '각성', '소명', '결산', '용서'], reversed: ['자기 비판', '후회', '미루기', '부정'] },
    upright: {
      overall: '과거가 정리되고 새 소명을 발견합니다.',
      love: '재회·용서·관계 재정의.',
      career: '천직 발견·복직.',
      money: '과거 손실 회복.',
      health: '큰 회복·재활.',
      advice: '과거의 나를 용서하고 부름에 응하세요.',
    },
    reversed: {
      overall: '자책과 후회에 갇힌 상태.',
      love: '과거에 매여 현재를 놓침.',
      career: '중요 결정을 미룸.',
      money: '지난 실수 반복.',
      health: '정신적 피로.',
      advice: '완벽하지 않아도 지금 움직이세요.',
    },
  },
  {
    id: 21, name: 'The World', nameKr: '세계', symbol: 'XXI', suit: 'major', number: 21, element: 'Earth',
    keywords: { upright: ['완성', '성취', '통합', '여정의 끝', '성숙'], reversed: ['미완성', '지연', '부족함', '마무리 미숙'] },
    upright: {
      overall: '여정의 완성. 노력이 결실로 맺어지는 순간입니다.',
      love: '결혼·이상적 관계.',
      career: '프로젝트 완성·박사·자격 취득.',
      money: '재정 목표 달성.',
      health: '총체적 건강.',
      advice: '성취를 축하하고 다음 여정을 준비하세요.',
    },
    reversed: {
      overall: '마무리가 덜 된 느낌 — 한 걸음 더 필요합니다.',
      love: '결정 유보.',
      career: '프로젝트 지연.',
      money: '목표 미달.',
      health: '완치 전 재활.',
      advice: '마지막 1%가 전체를 좌우합니다.',
    },
  },
];

// ================================================================
// 마이너 아르카나 — 4 수트 × 14장
//   Wands(완드/불/Fire) — 행동·열정
//   Cups(컵/물/Water) — 감정·관계
//   Swords(소드/공기/Air) — 사고·갈등
//   Pentacles(펜타클/땅/Earth) — 물질·현실
// ================================================================

const SUIT_META: Record<Exclude<TarotSuit, 'major'>, { nameKr: string; element: TarotElement; symbol: string; theme: string }> = {
  wands:     { nameKr: '완드', element: 'Fire',  symbol: '🔥', theme: '행동·열정·창의' },
  cups:      { nameKr: '컵',   element: 'Water', symbol: '💧', theme: '감정·관계·직관' },
  swords:    { nameKr: '소드', element: 'Air',   symbol: '⚔️', theme: '사고·갈등·의사결정' },
  pentacles: { nameKr: '펜타클', element: 'Earth', symbol: '🪙', theme: '물질·재물·현실' },
};

// 숫자 카드 1~10 의미 템플릿 (라이더웨이트 구조를 단순화)
function buildNumberCard(
  id: number,
  suit: Exclude<TarotSuit, 'major'>,
  number: number,
): TarotCard {
  const meta = SUIT_META[suit];
  const suitKr = meta.nameKr;

  // 숫자별 기본 서사 — 카드 10장의 공통 흐름
  const narrative: Record<number, { keywordsU: string[]; keywordsR: string[]; overallU: string; overallR: string }> = {
    1:  { keywordsU: ['시작','기회','영감','씨앗'],       keywordsR: ['지연','놓친 기회','동기 부족'],
          overallU: `${meta.theme}의 새로운 시작·씨앗이 주어진다.`,
          overallR: `기회가 눈앞에 있지만 내가 움직이지 않는다.` },
    2:  { keywordsU: ['균형','파트너','선택','대화'],      keywordsR: ['불균형','갈등','결정 미루기'],
          overallU: `두 가지 선택지를 저울질하며 균형을 찾는다.`,
          overallR: `균형이 깨지고 갈등이 표면화된다.` },
    3:  { keywordsU: ['확장','협력','초기 성과'],          keywordsR: ['협업 마찰','진행 지연'],
          overallU: `초기 성과가 보이고 협력이 이어진다.`,
          overallR: `팀 내부 의견 차로 진척이 느리다.` },
    4:  { keywordsU: ['안정','기반','휴식'],              keywordsR: ['정체','답보','경직'],
          overallU: `안정된 기반 위에서 잠시 숨을 고른다.`,
          overallR: `안정이 정체로 바뀌어 답답함을 느낀다.` },
    5:  { keywordsU: ['갈등','경쟁','시련','도전'],         keywordsR: ['갈등 해소','회복','화해'],
          overallU: `갈등과 경쟁 — 피할 수 없는 시련의 국면.`,
          overallR: `갈등이 가라앉고 회복이 시작된다.` },
    6:  { keywordsU: ['승리','조화','성장','베풂'],         keywordsR: ['자만','의존','보상 지연'],
          overallU: `결실이 보이고 주변과 기쁨을 나눈다.`,
          overallR: `주어야 할 것과 받을 것의 균형이 흐트러진다.` },
    7:  { keywordsU: ['도전','수비','평가'],              keywordsR: ['포기','방어 실패','의심'],
          overallU: `지금 가진 것을 지키며 평가하는 국면.`,
          overallR: `방어가 느슨해져 의심과 회의가 찾아온다.` },
    8:  { keywordsU: ['속도','집중','기술','숙련'],         keywordsR: ['지체','조급','산만'],
          overallU: `집중과 기술로 속도를 높이는 시기.`,
          overallR: `서두르다 실수하거나 중간에 멈춘다.` },
    9:  { keywordsU: ['인내','완성 직전','결실'],           keywordsR: ['지침','위축','마지막 고비'],
          overallU: `마지막 한 걸음을 남긴 인내의 시기.`,
          overallR: `피로가 누적되어 결승선이 흐려진다.` },
    10: { keywordsU: ['완성','결말','전환'],              keywordsR: ['책임 과중','피로','부채'],
          overallU: `한 사이클이 마무리되고 다음 단계가 열린다.`,
          overallR: `완성됐지만 뒤따르는 책임과 무게가 무겁다.` },
  };

  const n = narrative[number];

  // 수트별 맥락
  const byDomain: Record<Exclude<TarotSuit, 'major'>, (u: boolean) => { love: string; career: string; money: string; health: string; advice: string }> = {
    wands: (u) => ({
      love:   u ? '열정적 어프로치·설렘' : '식은 열정·권태',
      career: u ? '새 프로젝트 추진력' : '의욕 저하',
      money:  u ? '창업·부업 성과' : '투자 지연',
      health: u ? '활력·운동 효과' : '번아웃',
      advice: u ? '행동할 때입니다 — 생각보다 실행.' : '잠시 쉬고 동기부터 되찾으세요.',
    }),
    cups: (u) => ({
      love:   u ? '감정의 흐름 원활' : '감정 혼선·오해',
      career: u ? '팀워크·영감' : '팀 분위기 저하',
      money:  u ? '선물·기쁜 수입' : '감정적 소비',
      health: u ? '마음 안정' : '정서 피로',
      advice: u ? '마음의 소리에 귀 기울이세요.' : '감정에 휘둘리지 말고 한 박자 쉬세요.',
    }),
    swords: (u) => ({
      love:   u ? '솔직한 대화·조건 합의' : '말다툼·오해',
      career: u ? '분석·의사결정 성공' : '결정 지연·갈등',
      money:  u ? '합리적 판단' : '계약 분쟁',
      health: u ? '명료한 진단' : '스트레스성 증상',
      advice: u ? '이성적으로 판단하세요.' : '말보다 글로 정리해 보세요.',
    }),
    pentacles: (u) => ({
      love:   u ? '안정·현실적 관계' : '재정 문제로 갈등',
      career: u ? '성과 보상·승진' : '결과 부족',
      money:  u ? '부 축적·저축' : '손실·지출 증가',
      health: u ? '체력 증진' : '피로·만성 증상',
      advice: u ? '꾸준한 습관이 부를 만듭니다.' : '가계부부터 펼치세요.',
    }),
  };

  const uD = byDomain[suit](true);
  const rD = byDomain[suit](false);

  return {
    id,
    name: `${number} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
    nameKr: `${suitKr}의 ${number}`,
    symbol: String(number),
    suit,
    number,
    element: meta.element,
    keywords: { upright: n.keywordsU, reversed: n.keywordsR },
    upright: { overall: n.overallU, ...uD },
    reversed: { overall: n.overallR, ...rD },
  };
}

const COURT_MAP: { role: string; label: string; growth: string }[] = [
  { role: 'Page',   label: '시동(페이지)', growth: '배움과 메시지의 단계' },
  { role: 'Knight', label: '기사',          growth: '행동과 추진의 단계' },
  { role: 'Queen',  label: '여왕',          growth: '성숙과 통찰의 단계' },
  { role: 'King',   label: '왕',            growth: '완성과 리더십의 단계' },
];

function buildCourtCard(
  id: number,
  suit: Exclude<TarotSuit, 'major'>,
  roleIdx: number,
): TarotCard {
  const meta = SUIT_META[suit];
  const role = COURT_MAP[roleIdx];
  const ruLove: Record<number, [string, string]> = {
    0: ['순수한 설렘·풋사랑',     '미성숙·유치한 감정'],
    1: ['적극적 구애·열정',        '서두름·변덕'],
    2: ['포용하는 파트너',         '감정 과잉·통제'],
    3: ['성숙한 관계 주도',         '권위적·강요'],
  };

  return {
    id,
    name: `${role.role} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
    nameKr: `${meta.nameKr}의 ${role.label}`,
    symbol: role.role[0],
    suit,
    number: 11 + roleIdx,
    element: meta.element,
    keywords: {
      upright: [role.label, meta.theme, '성장'],
      reversed: ['미성숙', '불균형', '역할 혼란'],
    },
    upright: {
      overall: `${meta.theme}의 ${role.growth} — 해당 수트의 성숙한 면모가 드러난다.`,
      love:    ruLove[roleIdx][0],
      career:  `${meta.theme} 분야에서 ${role.growth}`,
      money:   role.role === 'King' ? '부의 관리와 통솔' : role.role === 'Queen' ? '안정적 수입 관리' : role.role === 'Knight' ? '적극적 수익 추구' : '재테크 입문',
      health:  '성장과 균형',
      advice:  `${role.label}의 자세로 책임감 있게 나아가세요.`,
    },
    reversed: {
      overall: `${role.label}의 자질이 왜곡되거나 미성숙하게 드러난다.`,
      love:    ruLove[roleIdx][1],
      career:  `${role.label}다운 균형을 잃는다.`,
      money:   '재정 판단 미숙',
      health:  '과잉·불균형',
      advice:  '역할에 걸맞은 절제가 필요합니다.',
    },
  };
}

function buildSuit(startId: number, suit: Exclude<TarotSuit, 'major'>): TarotCard[] {
  const cards: TarotCard[] = [];
  for (let n = 1; n <= 10; n++) {
    cards.push(buildNumberCard(startId + n - 1, suit, n));
  }
  for (let r = 0; r < 4; r++) {
    cards.push(buildCourtCard(startId + 10 + r, suit, r));
  }
  return cards;
}

const WANDS     = buildSuit(22, 'wands');
const CUPS      = buildSuit(36, 'cups');
const SWORDS    = buildSuit(50, 'swords');
const PENTACLES = buildSuit(64, 'pentacles');

export const TAROT_DECK: TarotCard[] = [
  ...MAJOR_ARCANA,
  ...WANDS,
  ...CUPS,
  ...SWORDS,
  ...PENTACLES,
]; // 78장

export const TAROT_MAJORS = MAJOR_ARCANA;

export const ELEMENT_COLORS: Record<TarotElement, string> = {
  'Fire':   '#F87171',
  'Water':  '#60A5FA',
  'Air':    '#86EFAC',
  'Earth':  '#D4A373',
  'Spirit': '#C4B5FD',
};

export const SUIT_SYMBOL: Record<TarotSuit, string> = {
  major:     '✦',
  wands:     '🔥',
  cups:      '💧',
  swords:    '⚔️',
  pentacles: '🪙',
};
