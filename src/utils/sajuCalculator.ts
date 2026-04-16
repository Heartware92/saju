import { Solar } from 'lunar-javascript';

// ============================================
// 기본 상수 정의
// ============================================

// 천간 (10 Heavenly Stems)
export const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
// 지지 (12 Earthly Branches)
export const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

// ============================================
// 한자(lunar-javascript 반환) → 한글 정규화
// lunar-javascript는 천간/지지를 중국 한자(甲乙…癸 / 子丑…亥)로 반환하지만
// 본 계산 모듈의 모든 맵(TEN_GODS_MAP, STEM_ELEMENT 등)은 한글 키를 사용한다.
// 데이터가 들어오는 경계에서 반드시 한글로 정규화해야 모든 매핑이 정상 동작한다.
// ============================================
const HANJA_STEM_TO_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'
};
const HANJA_BRANCH_TO_HANGUL: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
};
/** 천간 문자(한자·한글 무관) → 한글 */
export const normalizeGan = (g: string): string => {
  if (!g) return '';
  if (HEAVENLY_STEMS.includes(g)) return g;
  return HANJA_STEM_TO_HANGUL[g] || '';
};
/** 지지 문자(한자·한글 무관) → 한글 */
export const normalizeZhi = (z: string): string => {
  if (!z) return '';
  if (EARTHLY_BRANCHES.includes(z)) return z;
  return HANJA_BRANCH_TO_HANGUL[z] || '';
};

// 오행
export const FIVE_ELEMENTS = {
  wood: '목', fire: '화', earth: '토', metal: '금', water: '수'
};

// 천간의 오행
export const STEM_ELEMENT: Record<string, string> = {
  '갑': '목', '을': '목',
  '병': '화', '정': '화',
  '무': '토', '기': '토',
  '경': '금', '신': '금',
  '임': '수', '계': '수'
};

// 천간의 음양
export const STEM_YINYANG: Record<string, string> = {
  '갑': '양', '을': '음',
  '병': '양', '정': '음',
  '무': '양', '기': '음',
  '경': '양', '신': '음',
  '임': '양', '계': '음'
};

// 지지의 오행
export const BRANCH_ELEMENT: Record<string, string> = {
  '자': '수', '축': '토', '인': '목', '묘': '목',
  '진': '토', '사': '화', '오': '화', '미': '토',
  '신': '금', '유': '금', '술': '토', '해': '수'
};

// 지지의 음양
export const BRANCH_YINYANG: Record<string, string> = {
  '자': '양', '축': '음', '인': '양', '묘': '음',
  '진': '양', '사': '음', '오': '양', '미': '음',
  '신': '양', '유': '음', '술': '양', '해': '음'
};

// 지장간 (지지 속에 숨은 천간)
export const BRANCH_HIDDEN_STEMS: Record<string, string[]> = {
  '자': ['계'],
  '축': ['기', '신', '계'],
  '인': ['갑', '병', '무'],
  '묘': ['을'],
  '진': ['무', '을', '계'],
  '사': ['병', '경', '무'],
  '오': ['정', '기'],
  '미': ['기', '정', '을'],
  '신': ['경', '임', '무'],
  '유': ['신'],
  '술': ['무', '신', '정'],
  '해': ['임', '갑']
};

// 십성 (Ten Gods) 계산
export const TEN_GODS_MAP: Record<string, Record<string, string>> = {
  '갑': { '갑': '비견', '을': '겁재', '병': '식신', '정': '상관', '무': '편재', '기': '정재', '경': '편관', '신': '정관', '임': '편인', '계': '정인' },
  '을': { '을': '비견', '갑': '겁재', '정': '식신', '병': '상관', '기': '편재', '무': '정재', '신': '편관', '경': '정관', '계': '편인', '임': '정인' },
  '병': { '병': '비견', '정': '겁재', '무': '식신', '기': '상관', '경': '편재', '신': '정재', '임': '편관', '계': '정관', '갑': '편인', '을': '정인' },
  '정': { '정': '비견', '병': '겁재', '기': '식신', '무': '상관', '신': '편재', '경': '정재', '계': '편관', '임': '정관', '을': '편인', '갑': '정인' },
  '무': { '무': '비견', '기': '겁재', '경': '식신', '신': '상관', '임': '편재', '계': '정재', '갑': '편관', '을': '정관', '병': '편인', '정': '정인' },
  '기': { '기': '비견', '무': '겁재', '신': '식신', '경': '상관', '계': '편재', '임': '정재', '을': '편관', '갑': '정관', '정': '편인', '병': '정인' },
  '경': { '경': '비견', '신': '겁재', '임': '식신', '계': '상관', '갑': '편재', '을': '정재', '병': '편관', '정': '정관', '무': '편인', '기': '정인' },
  '신': { '신': '비견', '경': '겁재', '계': '식신', '임': '상관', '을': '편재', '갑': '정재', '정': '편관', '병': '정관', '기': '편인', '무': '정인' },
  '임': { '임': '비견', '계': '겁재', '갑': '식신', '을': '상관', '병': '편재', '정': '정재', '무': '편관', '기': '정관', '경': '편인', '신': '정인' },
  '계': { '계': '비견', '임': '겁재', '을': '식신', '갑': '상관', '정': '편재', '병': '정재', '기': '편관', '무': '정관', '신': '편인', '경': '정인' }
};

// 12운성 명칭
export const TWELVE_STAGE_NAMES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];

// ============================================
// 타입 정의
// ============================================

export interface Pillar {
  gan: string;
  zhi: string;
  ganElement: string;
  zhiElement: string;
  ganYinYang: string;
  zhiYinYang: string;
  hiddenStems: string[];
  tenGodGan: string;
  tenGodZhi: string;
  twelveStage: string;
  /** 12신살 (년지 삼합 기준) — 겁살/재살/천살/지살/도화/월살/망신/장성/반안/역마/육해/화개 */
  sinSal12: string;
  /** 일주 기준 공망 여부 */
  isKongmang: boolean;
}

export interface ElementCount {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
}

export interface SinSal {
  name: string;
  type: 'good' | 'bad' | 'neutral';
  description: string;
  /**
   * 신살이 걸린 기둥 인덱스 (표시 순서 기준: 0=시, 1=일, 2=월, 3=년)
   * - 지지를 기반으로 발동한 신살은 해당 지지가 위치한 기둥을 기록
   * - 조합형(삼형 등)은 관여한 모든 기둥을 기록
   */
  pillars: number[];
}

export interface Interaction {
  type: '합' | '충' | '형' | '파' | '해';
  elements: string[];
  description: string;
}

export interface DaeWoon {
  startAge: number;
  endAge: number;
  gan: string;
  zhi: string;
  ganElement: string;
  zhiElement: string;
  tenGod: string;
  twelveStage: string;
}

export interface SeWoon {
  year: number;
  gan: string;
  zhi: string;
  ganElement: string;
  zhiElement: string;
  tenGod: string;
  twelveStage: string;
  animal: string;
}

export interface SajuResult {
  solarDate: string;
  lunarDate: string;
  lunarDateSimple: string;
  isLeapMonth: boolean;
  gender: 'male' | 'female';
  /**
   * 출생 시간을 모를 때 true.
   * - 시주(pillars.hour)는 빈 값("?")으로 세팅되어 화면에 "시간 미상"으로 표시됨.
   * - 모든 하위 계산(오행·십성·신살·합충)은 시주를 제외하고 삼주추명으로 진행됨.
   * - AI 프롬프트에도 플래그로 전달되어 자녀·말년·시간대 관련 해석이 제한됨.
   */
  hourUnknown: boolean;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  dayMaster: string;
  dayMasterElement: string;
  dayMasterYinYang: string;
  elementCount: ElementCount;
  elementPercent: ElementCount;
  strongElement: string;
  weakElement: string;
  isStrong: boolean;
  strengthScore: number;
  strengthAnalysis: string;
  yongSin: string;
  heeSin: string;
  giSin: string;
  yongSinElement: string;
  interactions: Interaction[];
  sinSals: SinSal[];
  daeWoon: DaeWoon[];
  daeWoonStartAge: number;
  seWoon: SeWoon[];
  currentSeWoon: SeWoon;
}

// ============================================
// 계산 함수들
// ============================================

const getTenGod = (dayGan: string, targetGan: string): string => {
  return TEN_GODS_MAP[dayGan]?.[targetGan] || '';
};

const getTenGodForBranch = (dayGan: string, branch: string): string => {
  const mainStem = BRANCH_HIDDEN_STEMS[branch]?.[0];
  if (!mainStem) return '';
  return getTenGod(dayGan, mainStem);
};

const getTwelveStage = (dayGan: string, branch: string): string => {
  const branchIndex = EARTHLY_BRANCHES.indexOf(branch);
  if (branchIndex === -1) return '';

  const isYang = STEM_YINYANG[dayGan] === '양';
  const element = STEM_ELEMENT[dayGan];

  const startPositions: Record<string, number> = {
    '목': 11, '화': 2, '토': 2, '금': 5, '수': 8
  };

  const startPos = startPositions[element] || 0;

  if (isYang) {
    const idx = (branchIndex - startPos + 12) % 12;
    return TWELVE_STAGE_NAMES[idx];
  } else {
    const idx = (startPos - branchIndex + 12) % 12;
    return TWELVE_STAGE_NAMES[idx];
  }
};

const countElements = (pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar }): ElementCount => {
  const count: ElementCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const allPillars = [pillars.year, pillars.month, pillars.day, pillars.hour];

  allPillars.forEach(pillar => {
    const ganEl = pillar.ganElement as keyof ElementCount;
    if (ganEl) count[ganEl] += 1;

    const zhiEl = pillar.zhiElement as keyof ElementCount;
    if (zhiEl) count[zhiEl] += 1;

    pillar.hiddenStems.forEach((stem, idx) => {
      const hiddenEl = STEM_ELEMENT[stem] as keyof ElementCount;
      if (hiddenEl) {
        count[hiddenEl] += idx === 0 ? 0.5 : 0.25;
      }
    });
  });

  return count;
};

const getHelpingElements = (element: string): string[] => {
  const helping: Record<string, string[]> = {
    '목': ['목', '수'], '화': ['화', '목'], '토': ['토', '화'], '금': ['금', '토'], '수': ['수', '금']
  };
  return helping[element] || [];
};

const getControllingElement = (element: string): string => {
  const controlling: Record<string, string> = {
    '목': '금', '화': '수', '토': '목', '금': '화', '수': '토'
  };
  return controlling[element] || '';
};

const analyzeStrength = (
  dayGan: string,
  monthBranch: string,
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar }
): { isStrong: boolean; score: number; analysis: string } => {
  const dayElement = STEM_ELEMENT[dayGan];
  let score = 50;

  const monthElement = BRANCH_ELEMENT[monthBranch];
  const helpingElements = getHelpingElements(dayElement);

  if (helpingElements.includes(monthElement)) {
    score += 25;
  } else if (getControllingElement(dayElement) === monthElement) {
    score -= 20;
  }

  const dayBranchElement = pillars.day.zhiElement;
  if (helpingElements.includes(dayBranchElement)) {
    score += 15;
  }

  const allElements = [
    pillars.year.ganElement, pillars.year.zhiElement,
    pillars.month.ganElement,
    pillars.hour.ganElement, pillars.hour.zhiElement
  ];

  allElements.forEach(el => {
    if (helpingElements.includes(el)) score += 5;
    else if (getControllingElement(dayElement) === el) score -= 5;
  });

  const isStrong = score >= 55;

  let analysis = '';
  if (score >= 70) analysis = '매우 강한 신강 사주입니다. 기운이 넘쳐 설기나 극이 필요합니다.';
  else if (score >= 55) analysis = '신강 사주입니다. 적절한 발산이 필요합니다.';
  else if (score >= 45) analysis = '중화된 사주입니다. 균형이 잘 잡혀있습니다.';
  else if (score >= 30) analysis = '신약 사주입니다. 도움과 보호가 필요합니다.';
  else analysis = '매우 약한 신약 사주입니다. 인성과 비겁의 도움이 절실합니다.';

  return { isStrong, score, analysis };
};

const determineYongSin = (
  dayElement: string,
  isStrong: boolean,
  _elementCount: ElementCount,
  _monthBranch: string
): { yongSin: string; heeSin: string; giSin: string; element: string } => {
  if (isStrong) {
    const drainElements: Record<string, string> = {
      '목': '화', '화': '토', '토': '금', '금': '수', '수': '목'
    };
    const drain = drainElements[dayElement];

    return {
      yongSin: '식신/상관',
      heeSin: '편재/정재',
      giSin: '편인/정인',
      element: drain
    };
  } else {
    const supportElements: Record<string, string> = {
      '목': '수', '화': '목', '토': '화', '금': '토', '수': '금'
    };

    return {
      yongSin: '편인/정인',
      heeSin: '비견/겁재',
      giSin: '편관/정관',
      element: supportElements[dayElement]
    };
  }
};

const calculateSinSals = (
  dayGan: string,
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar }
): SinSal[] => {
  const sinSals: SinSal[] = [];
  // 내부 배열 인덱스 → 표시 기둥 인덱스(시0/일1/월2/년3)
  const branches: Array<{ zhi: string; col: number }> = [
    { zhi: pillars.year.zhi, col: 3 },
    { zhi: pillars.month.zhi, col: 2 },
    { zhi: pillars.day.zhi, col: 1 },
    { zhi: pillars.hour.zhi, col: 0 },
  ];
  const findCols = (target: string): number[] =>
    branches.filter(b => b.zhi === target).map(b => b.col);

  const tianYiGuiRen: Record<string, string[]> = {
    '갑': ['축', '미'], '을': ['자', '신'], '병': ['해', '유'], '정': ['해', '유'],
    '무': ['축', '미'], '기': ['자', '신'], '경': ['축', '미'], '신': ['인', '오'],
    '임': ['묘', '사'], '계': ['묘', '사']
  };

  const guiRenBranches = tianYiGuiRen[dayGan] || [];
  const guiRenCols = branches.filter(b => guiRenBranches.includes(b.zhi)).map(b => b.col);
  if (guiRenCols.length > 0) {
    sinSals.push({ name: '천을귀인', type: 'good', description: '위기 시 귀인의 도움을 받는 최고의 길신', pillars: guiRenCols });
  }

  const yeokMa: Record<string, string> = {
    '인': '신', '신': '인', '사': '해', '해': '사',
    '오': '자', '자': '오', '묘': '유', '유': '묘',
    '진': '술', '술': '진', '축': '미', '미': '축'
  };

  const yearBranch = pillars.year.zhi;
  const yeokMaBranch = yeokMa[yearBranch];
  const yeokMaCols = findCols(yeokMaBranch);
  if (yeokMaCols.length > 0) {
    sinSals.push({ name: '역마살', type: 'neutral', description: '이동수가 많음, 해외/여행/무역 관련 기회', pillars: yeokMaCols });
  }

  const doHwa: Record<string, string> = {
    '인': '묘', '오': '묘', '술': '묘',
    '사': '오', '유': '오', '축': '오',
    '신': '유', '자': '유', '진': '유',
    '해': '자', '묘': '자', '미': '자'
  };

  const doHwaBranch = doHwa[yearBranch];
  const doHwaCols = findCols(doHwaBranch);
  if (doHwaCols.length > 0) {
    sinSals.push({ name: '도화살', type: 'neutral', description: '인기와 매력, 연예/예술/대인관계에 유리', pillars: doHwaCols });
  }

  const hwaGae: Record<string, string> = {
    '인': '술', '오': '술', '술': '술',
    '사': '축', '유': '축', '축': '축',
    '신': '진', '자': '진', '진': '진',
    '해': '미', '묘': '미', '미': '미'
  };

  const hwaGaeBranch = hwaGae[yearBranch];
  const hwaGaeCols = findCols(hwaGaeBranch);
  if (hwaGaeCols.length > 0) {
    sinSals.push({ name: '화개살', type: 'neutral', description: '종교/학문/예술적 재능, 고독한 탐구자', pillars: hwaGaeCols });
  }

  const hasInSaSin = ['인', '사', '신'].every(b => branches.some(br => br.zhi === b));
  const hasChukSulMi = ['축', '술', '미'].every(b => branches.some(br => br.zhi === b));

  if (hasInSaSin) {
    const cols = branches.filter(b => ['인', '사', '신'].includes(b.zhi)).map(b => b.col);
    sinSals.push({ name: '인사신 삼형', type: 'bad', description: '지세지형 - 교통사고, 수술, 갈등 주의', pillars: cols });
  }
  if (hasChukSulMi) {
    const cols = branches.filter(b => ['축', '술', '미'].includes(b.zhi)).map(b => b.col);
    sinSals.push({ name: '축술미 삼형', type: 'bad', description: '무은지형 - 가족 갈등, 건강 주의', pillars: cols });
  }

  const guiMun: string[][] = [
    ['자', '유'], ['축', '오'], ['인', '미'], ['묘', '신'], ['진', '사'], ['술', '해']
  ];

  guiMun.forEach(pair => {
    const cols = branches.filter(b => pair.includes(b.zhi)).map(b => b.col);
    const hasBoth = pair.every(p => branches.some(br => br.zhi === p));
    if (hasBoth) {
      sinSals.push({ name: '귀문관살', type: 'neutral', description: '영적 감수성, 직관력 강함, 예술/종교적 재능', pillars: cols });
    }
  });

  return sinSals;
};

const analyzeInteractions = (
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar }
): Interaction[] => {
  const interactions: Interaction[] = [];
  const branches = [
    { pos: '년지', val: pillars.year.zhi },
    { pos: '월지', val: pillars.month.zhi },
    { pos: '일지', val: pillars.day.zhi },
    { pos: '시지', val: pillars.hour.zhi }
  ];
  const stems = [
    { pos: '년간', val: pillars.year.gan },
    { pos: '월간', val: pillars.month.gan },
    { pos: '일간', val: pillars.day.gan },
    { pos: '시간', val: pillars.hour.gan }
  ];

  const stemCombinations: [string, string, string][] = [
    ['갑', '기', '토'], ['을', '경', '금'], ['병', '신', '수'],
    ['정', '임', '목'], ['무', '계', '화']
  ];

  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      stemCombinations.forEach(([s1, s2, result]) => {
        if ((stems[i].val === s1 && stems[j].val === s2) ||
            (stems[i].val === s2 && stems[j].val === s1)) {
          interactions.push({
            type: '합',
            elements: [stems[i].pos, stems[j].pos],
            description: `${stems[i].val}${stems[j].val}합 ${result} - 두 기운이 결합`
          });
        }
      });
    }
  }

  const branchCombinations: [string, string, string][] = [
    ['자', '축', '토'], ['인', '해', '목'], ['묘', '술', '화'],
    ['진', '유', '금'], ['사', '신', '수'], ['오', '미', '토']
  ];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      branchCombinations.forEach(([b1, b2, result]) => {
        if ((branches[i].val === b1 && branches[j].val === b2) ||
            (branches[i].val === b2 && branches[j].val === b1)) {
          interactions.push({
            type: '합',
            elements: [branches[i].pos, branches[j].pos],
            description: `${branches[i].val}${branches[j].val}합 ${result} - 육합으로 결속`
          });
        }
      });
    }
  }

  const triCombinations: [string, string, string, string][] = [
    ['인', '오', '술', '화'], ['사', '유', '축', '금'],
    ['신', '자', '진', '수'], ['해', '묘', '미', '목']
  ];

  triCombinations.forEach(([b1, b2, b3, element]) => {
    const trioSet = new Set([b1, b2, b3]);
    const matched = branches.filter(br => trioSet.has(br.val));
    const uniqueVals = new Set(matched.map(m => m.val));
    if (uniqueVals.size >= 2) {
      const matchVals = Array.from(uniqueVals);
      interactions.push({
        type: '합',
        elements: matched.map(m => m.pos),
        description: `${matchVals.join('')} ${uniqueVals.size === 3 ? '삼합' : '반합'} ${element}국 - 강력한 ${element} 기운 형성`
      });
    }
  });

  const clashes: [string, string][] = [
    ['자', '오'], ['축', '미'], ['인', '신'], ['묘', '유'], ['진', '술'], ['사', '해']
  ];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      clashes.forEach(([c1, c2]) => {
        if ((branches[i].val === c1 && branches[j].val === c2) ||
            (branches[i].val === c2 && branches[j].val === c1)) {
          interactions.push({
            type: '충',
            elements: [branches[i].pos, branches[j].pos],
            description: `${branches[i].val}${branches[j].val}충 - 변동과 갈등의 기운`
          });
        }
      });
    }
  }

  return interactions;
};

const getAnimal = (branch: string): string => {
  const animals: Record<string, string> = {
    '자': '쥐', '축': '소', '인': '호랑이', '묘': '토끼',
    '진': '용', '사': '뱀', '오': '말', '미': '양',
    '신': '원숭이', '유': '닭', '술': '개', '해': '돼지'
  };
  return animals[branch] || '';
};

// ============================================
// 12신살 (년지 삼합 기준)
// ============================================
/**
 * 년지가 속한 삼합(水/金/火/木 국)에 따라 각 지지에 붙는 신살을 반환.
 * 순서: 겁살 → 재살 → 천살 → 지살 → 도화(연살) → 월살 → 망신 → 장성 → 반안 → 역마 → 육해 → 화개
 * 지살은 항상 "생지(삼합 첫 글자)" 에 위치 — 그로부터 시계방향으로 돈다.
 */
const SINSAL12_SEQUENCE = ['겁살','재살','천살','지살','도화','월살','망신','장성','반안','역마','육해','화개'];
// 삼합 그룹 → 지살이 위치하는 지지(=생지)의 EARTHLY_BRANCHES 인덱스
const SINSAL12_GROUP_START: Record<string, number> = {
  '신': 8, '자': 8, '진': 8, // 수국 — 지살=신
  '사': 5, '유': 5, '축': 5, // 금국 — 지살=사
  '인': 2, '오': 2, '술': 2, // 화국 — 지살=인
  '해': 11, '묘': 11, '미': 11, // 목국 — 지살=해
};
const getSinSal12 = (yearZhi: string, targetZhi: string): string => {
  const start = SINSAL12_GROUP_START[yearZhi];
  const targetIdx = EARTHLY_BRANCHES.indexOf(targetZhi);
  if (start === undefined || targetIdx < 0) return '';
  // 지살이 순서상 index 3 이므로, 지살 위치(start)에서 뺀 뒤 +3 을 더하면 신살 인덱스가 나온다.
  const sinSalIdx = ((targetIdx - start + 12) % 12 + 3) % 12;
  return SINSAL12_SEQUENCE[sinSalIdx];
};

// ============================================
// 공망 (일주 기준 순중공망)
// ============================================
/**
 * 일주가 속한 60갑자 순(旬)에서 빠지는 2개 지지 = 공망.
 * 공망 지지 인덱스 = (순 시작 지지 + 10), (+11) mod 12
 * 순 시작 지지 인덱스 = (일지idx - 일간idx + 12) mod 12
 */
const getKongmangZhis = (dayGan: string, dayZhi: string): [string, string] | null => {
  const ganIdx = HEAVENLY_STEMS.indexOf(dayGan);
  const zhiIdx = EARTHLY_BRANCHES.indexOf(dayZhi);
  if (ganIdx < 0 || zhiIdx < 0) return null;
  const sunStart = (zhiIdx - ganIdx + 12) % 12;
  const k1 = (sunStart + 10) % 12;
  const k2 = (sunStart + 11) % 12;
  return [EARTHLY_BRANCHES[k1], EARTHLY_BRANCHES[k2]];
};

const calculateSeWoon = (dayGan: string, currentYear: number): SeWoon[] => {
  const seWoons: SeWoon[] = [];

  // 다른 어플처럼 과거~미래를 함께 보여준다 — 현재년 -7 ~ +4 (총 12년)
  // 자동 센터 스크롤이 currentYear 카드를 가운데로 끌어다 놓는다.
  const startYear = currentYear - 7;
  for (let i = 0; i < 12; i++) {
    const year = startYear + i;
    const solar = Solar.fromYmd(year, 6, 15);
    const lunar = solar.getLunar();
    const yearGanZhi = lunar.getYearInGanZhiExact();

    const gan = normalizeGan(yearGanZhi.substring(0, 1));
    const zhi = normalizeZhi(yearGanZhi.substring(1, 2));

    seWoons.push({
      year,
      gan,
      zhi,
      ganElement: STEM_ELEMENT[gan] || '',
      zhiElement: BRANCH_ELEMENT[zhi] || '',
      tenGod: getTenGod(dayGan, gan),
      twelveStage: getTwelveStage(dayGan, zhi),
      animal: getAnimal(zhi)
    });
  }

  return seWoons;
};

// ============================================
// 메인 계산 함수
// ============================================

/**
 * 출생 시간 미상 시 사용할 빈 시주 placeholder.
 * 모든 문자열 필드를 빈 문자열, 배열 필드를 빈 배열로 둠으로써
 * 하위 계산 함수들(`countElements`, `analyzeStrength`, `calculateSinSals`,
 * `analyzeInteractions`)이 해당 기둥을 자연스럽게 건너뛰게 한다
 * (예: `if (ganEl) count[ganEl] += 1` 의 falsy check, `branches.includes('')` 불일치).
 */
const EMPTY_HOUR_PILLAR: Pillar = {
  gan: '',
  zhi: '',
  ganElement: '',
  zhiElement: '',
  ganYinYang: '',
  zhiYinYang: '',
  hiddenStems: [],
  tenGodGan: '',
  tenGodZhi: '',
  twelveStage: '',
  sinSal12: '',
  isKongmang: false,
};

export const calculateSaju = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'male' | 'female' = 'male',
  hourUnknown: boolean = false
): SajuResult => {
  // 시간 미상일 때도 lunar 계산 자체는 정오(12:00) 기준으로 돌려 일주(日柱)까지 안전하게 산출.
  // 이후 시주만 비워 삼주추명 규칙으로 전환한다.
  const safeHour = hourUnknown ? 12 : hour;
  const safeMinute = hourUnknown ? 0 : minute;
  const solar = Solar.fromYmdHms(year, month, day, safeHour, safeMinute, 0);
  const lunar = solar.getLunar();
  const baZi = lunar.getEightChar();

  const genderNum = gender === 'male' ? 1 : 0;
  const yun = baZi.getYun(genderNum);
  const daewoonRaw = yun.getDaYun();

  const dayGan = normalizeGan(baZi.getDayGan());
  const monthZhiNorm = normalizeZhi(baZi.getMonthZhi());
  const dayMasterElement = STEM_ELEMENT[dayGan] || '';
  const dayMasterYinYang = STEM_YINYANG[dayGan] || '';

  // 12신살·공망 판정에 필요한 기준 지지들을 먼저 뽑는다.
  const yearZhiForSinsal = normalizeZhi(baZi.getYearZhi());
  const dayZhiForKongmang = normalizeZhi(baZi.getDayZhi());
  const kongmangZhis = getKongmangZhis(dayGan, dayZhiForKongmang);

  const createPillar = (ganRaw: string, zhiRaw: string): Pillar => {
    const gan = normalizeGan(ganRaw);
    const zhi = normalizeZhi(zhiRaw);
    return {
      gan,
      zhi,
      ganElement: STEM_ELEMENT[gan] || '',
      zhiElement: BRANCH_ELEMENT[zhi] || '',
      ganYinYang: STEM_YINYANG[gan] || '',
      zhiYinYang: BRANCH_YINYANG[zhi] || '',
      hiddenStems: BRANCH_HIDDEN_STEMS[zhi] || [],
      tenGodGan: gan === dayGan ? '일주' : getTenGod(dayGan, gan),
      tenGodZhi: getTenGodForBranch(dayGan, zhi),
      twelveStage: getTwelveStage(dayGan, zhi),
      sinSal12: getSinSal12(yearZhiForSinsal, zhi),
      isKongmang: kongmangZhis ? (zhi === kongmangZhis[0] || zhi === kongmangZhis[1]) : false,
    };
  };

  const pillars = {
    year: createPillar(baZi.getYearGan(), baZi.getYearZhi()),
    month: createPillar(baZi.getMonthGan(), baZi.getMonthZhi()),
    day: createPillar(baZi.getDayGan(), baZi.getDayZhi()),
    // 시간 미상 시 시주는 빈 placeholder — 하위 계산이 자연스럽게 시주를 스킵함
    hour: hourUnknown ? { ...EMPTY_HOUR_PILLAR } : createPillar(baZi.getTimeGan(), baZi.getTimeZhi())
  };

  const elementCount = countElements(pillars);
  const totalWeight = Object.values(elementCount).reduce((a, b) => a + b, 0);
  const elementPercent: ElementCount = totalWeight > 0 ? {
    목: Math.round((elementCount.목 / totalWeight) * 100),
    화: Math.round((elementCount.화 / totalWeight) * 100),
    토: Math.round((elementCount.토 / totalWeight) * 100),
    금: Math.round((elementCount.금 / totalWeight) * 100),
    수: Math.round((elementCount.수 / totalWeight) * 100)
  } : { 목: 20, 화: 20, 토: 20, 금: 20, 수: 20 };

  const sortedElements = Object.entries(elementCount).sort((a, b) => b[1] - a[1]);
  const strongElement = sortedElements[0][0];
  const weakElement = sortedElements[sortedElements.length - 1][0];

  const strengthResult = analyzeStrength(dayGan, monthZhiNorm, pillars);
  const yongSinResult = determineYongSin(dayMasterElement, strengthResult.isStrong, elementCount, monthZhiNorm);
  const sinSals = calculateSinSals(dayGan, pillars);
  const interactions = analyzeInteractions(pillars);

  const daeWoon: DaeWoon[] = daewoonRaw.map((dw: any) => {
    const ganZhi = dw.getGanZhi();
    const gan = normalizeGan(ganZhi.substring(0, 1));
    const zhi = normalizeZhi(ganZhi.substring(1, 2));
    return {
      startAge: dw.getStartYear(),
      endAge: dw.getStartYear() + 9,
      gan,
      zhi,
      ganElement: STEM_ELEMENT[gan] || '',
      zhiElement: BRANCH_ELEMENT[zhi] || '',
      tenGod: getTenGod(dayGan, gan),
      twelveStage: getTwelveStage(dayGan, zhi)
    };
  });

  const currentYear = new Date().getFullYear();
  const seWoon = calculateSeWoon(dayGan, currentYear);
  const currentSeWoon = seWoon.find(s => s.year === currentYear) ?? seWoon[0];

  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();
  const isLeapMonth = lunar.getMonth() < 0;

  return {
    solarDate: solar.toYmdHms(),
    lunarDate: lunar.toFullString(),
    lunarDateSimple: `${Math.abs(lunarMonth)}월 ${lunarDay}일${isLeapMonth ? ' (윤달)' : ''}`,
    isLeapMonth,
    gender,
    hourUnknown,
    pillars,
    dayMaster: dayGan,
    dayMasterElement,
    dayMasterYinYang,
    elementCount,
    elementPercent,
    strongElement,
    weakElement,
    isStrong: strengthResult.isStrong,
    strengthScore: strengthResult.score,
    strengthAnalysis: strengthResult.analysis,
    yongSin: yongSinResult.yongSin,
    heeSin: yongSinResult.heeSin,
    giSin: yongSinResult.giSin,
    yongSinElement: yongSinResult.element,
    interactions,
    sinSals,
    daeWoon,
    daeWoonStartAge: yun.getStartYear(),
    seWoon,
    currentSeWoon
  };
};

export const getSajuSummary = (result: SajuResult): string => {
  const { pillars, dayMasterElement, isStrong, yongSinElement } = result;
  return `일주: ${pillars.day.gan}${pillars.day.zhi} (${dayMasterElement} 일간)\n신강/신약: ${isStrong ? '신강' : '신약'}\n용신 오행: ${yongSinElement}`;
};
