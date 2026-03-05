import { Solar } from 'lunar-javascript';

// ============================================
// 기본 상수 정의
// ============================================

// 천간 (10 Heavenly Stems)
export const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
// 지지 (12 Earthly Branches)
export const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

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
  const branches = [pillars.year.zhi, pillars.month.zhi, pillars.day.zhi, pillars.hour.zhi];

  const tianYiGuiRen: Record<string, string[]> = {
    '갑': ['축', '미'], '을': ['자', '신'], '병': ['해', '유'], '정': ['해', '유'],
    '무': ['축', '미'], '기': ['자', '신'], '경': ['축', '미'], '신': ['인', '오'],
    '임': ['묘', '사'], '계': ['묘', '사']
  };

  const guiRenBranches = tianYiGuiRen[dayGan] || [];
  if (branches.some(b => guiRenBranches.includes(b))) {
    sinSals.push({ name: '천을귀인', type: 'good', description: '위기 시 귀인의 도움을 받는 최고의 길신' });
  }

  const yeokMa: Record<string, string> = {
    '인': '신', '신': '인', '사': '해', '해': '사',
    '오': '자', '자': '오', '묘': '유', '유': '묘',
    '진': '술', '술': '진', '축': '미', '미': '축'
  };

  const yearBranch = pillars.year.zhi;
  const yeokMaBranch = yeokMa[yearBranch];
  if (branches.includes(yeokMaBranch)) {
    sinSals.push({ name: '역마살', type: 'neutral', description: '이동수가 많음, 해외/여행/무역 관련 기회' });
  }

  const doHwa: Record<string, string> = {
    '인': '묘', '오': '묘', '술': '묘',
    '사': '오', '유': '오', '축': '오',
    '신': '유', '자': '유', '진': '유',
    '해': '자', '묘': '자', '미': '자'
  };

  const doHwaBranch = doHwa[yearBranch];
  if (branches.includes(doHwaBranch)) {
    sinSals.push({ name: '도화살', type: 'neutral', description: '인기와 매력, 연예/예술/대인관계에 유리' });
  }

  const hwaGae: Record<string, string> = {
    '인': '술', '오': '술', '술': '술',
    '사': '축', '유': '축', '축': '축',
    '신': '진', '자': '진', '진': '진',
    '해': '미', '묘': '미', '미': '미'
  };

  const hwaGaeBranch = hwaGae[yearBranch];
  if (branches.includes(hwaGaeBranch)) {
    sinSals.push({ name: '화개살', type: 'neutral', description: '종교/학문/예술적 재능, 고독한 탐구자' });
  }

  const hasInSaSin = ['인', '사', '신'].every(b => branches.includes(b));
  const hasChukSulMi = ['축', '술', '미'].every(b => branches.includes(b));

  if (hasInSaSin) sinSals.push({ name: '인사신 삼형', type: 'bad', description: '지세지형 - 교통사고, 수술, 갈등 주의' });
  if (hasChukSulMi) sinSals.push({ name: '축술미 삼형', type: 'bad', description: '무은지형 - 가족 갈등, 건강 주의' });

  const guiMun: string[][] = [
    ['자', '유'], ['축', '오'], ['인', '미'], ['묘', '신'], ['진', '사'], ['술', '해']
  ];

  guiMun.forEach(pair => {
    if (branches.includes(pair[0]) && branches.includes(pair[1])) {
      sinSals.push({ name: '귀문관살', type: 'neutral', description: '영적 감수성, 직관력 강함, 예술/종교적 재능' });
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
    const branchVals = branches.map(b => b.val);
    const matches = [b1, b2, b3].filter(b => branchVals.includes(b));
    if (matches.length >= 2) {
      interactions.push({
        type: '합',
        elements: matches,
        description: `${matches.join('')} ${matches.length === 3 ? '삼합' : '반합'} ${element}국 - 강력한 ${element} 기운 형성`
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

const calculateSeWoon = (dayGan: string, currentYear: number): SeWoon[] => {
  const seWoons: SeWoon[] = [];

  for (let i = 0; i < 10; i++) {
    const year = currentYear + i;
    const solar = Solar.fromYmd(year, 6, 15);
    const lunar = solar.getLunar();
    const yearGanZhi = lunar.getYearInGanZhiExact();

    const gan = yearGanZhi.substring(0, 1);
    const zhi = yearGanZhi.substring(1, 2);

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

export const calculateSaju = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  gender: 'male' | 'female' = 'male'
): SajuResult => {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const baZi = lunar.getEightChar();

  const genderNum = gender === 'male' ? 1 : 0;
  const yun = baZi.getYun(genderNum);
  const daewoonRaw = yun.getDaYun();

  const dayGan = baZi.getDayGan();
  const dayMasterElement = STEM_ELEMENT[dayGan] || '';
  const dayMasterYinYang = STEM_YINYANG[dayGan] || '';

  const createPillar = (gan: string, zhi: string): Pillar => ({
    gan,
    zhi,
    ganElement: STEM_ELEMENT[gan] || '',
    zhiElement: BRANCH_ELEMENT[zhi] || '',
    ganYinYang: STEM_YINYANG[gan] || '',
    zhiYinYang: BRANCH_YINYANG[zhi] || '',
    hiddenStems: BRANCH_HIDDEN_STEMS[zhi] || [],
    tenGodGan: gan === dayGan ? '일주' : getTenGod(dayGan, gan),
    tenGodZhi: getTenGodForBranch(dayGan, zhi),
    twelveStage: getTwelveStage(dayGan, zhi)
  });

  const pillars = {
    year: createPillar(baZi.getYearGan(), baZi.getYearZhi()),
    month: createPillar(baZi.getMonthGan(), baZi.getMonthZhi()),
    day: createPillar(baZi.getDayGan(), baZi.getDayZhi()),
    hour: createPillar(baZi.getTimeGan(), baZi.getTimeZhi())
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

  const strengthResult = analyzeStrength(dayGan, baZi.getMonthZhi(), pillars);
  const yongSinResult = determineYongSin(dayMasterElement, strengthResult.isStrong, elementCount, baZi.getMonthZhi());
  const sinSals = calculateSinSals(dayGan, pillars);
  const interactions = analyzeInteractions(pillars);

  const daeWoon: DaeWoon[] = daewoonRaw.map((dw: any) => {
    const ganZhi = dw.getGanZhi();
    const gan = ganZhi.substring(0, 1);
    const zhi = ganZhi.substring(1, 2);
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
  const currentSeWoon = seWoon[0];

  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();
  const isLeapMonth = lunar.getMonth() < 0;

  return {
    solarDate: solar.toYmdHms(),
    lunarDate: lunar.toFullString(),
    lunarDateSimple: `${Math.abs(lunarMonth)}월 ${lunarDay}일${isLeapMonth ? ' (윤달)' : ''}`,
    isLeapMonth,
    gender,
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
