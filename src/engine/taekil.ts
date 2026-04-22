/**
 * 택일(擇日) 엔진 — 특정 행사에 맞는 길일을 판별
 *
 * 원국(natal chart) + 행사 카테고리 + 날짜 범위를 받아
 * 각 날짜의 길흉 등급과 점수를 결정론적으로 계산한다.
 */

import { Solar } from 'lunar-javascript';
import {
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  TEN_GODS_MAP,
  BRANCH_HIDDEN_STEMS,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  STEM_YINYANG,
  TWELVE_STAGE_NAMES,
  normalizeGan,
  normalizeZhi,
  type SajuResult,
} from '../utils/sajuCalculator';

// ============================================
// 타입
// ============================================

export type TaekilCategory =
  | 'marriage'   // 결혼·혼례
  | 'moving'     // 이사·입택
  | 'business'   // 개업·창업
  | 'contract'   // 계약·거래·차량 구매
  | 'travel'     // 여행·출행
  | 'surgery'    // 수술
  | 'birth';     // 출산 택일 (제왕절개)

export const TAEKIL_CATEGORIES: { id: TaekilCategory; label: string; desc: string }[] = [
  { id: 'marriage', label: '결혼·혼례', desc: '결혼식, 약혼, 상견례' },
  { id: 'moving', label: '이사·입택', desc: '이사, 새집 입주' },
  { id: 'business', label: '개업·창업', desc: '가게 오픈, 사업 시작' },
  { id: 'contract', label: '계약·거래', desc: '부동산, 큰 계약, 차량 구매' },
  { id: 'travel', label: '여행·출행', desc: '해외여행, 장거리 이동' },
  { id: 'surgery', label: '수술', desc: '수술, 시술 일정' },
  { id: 'birth', label: '출산 택일', desc: '제왕절개, 출산 날짜 선정' },
];

export type TaekilGrade = '대길' | '길' | '평' | '흉';

export interface TaekilDay {
  date: string;       // YYYY-MM-DD
  lunarLabel: string;  // "을사년 기묘월 갑자일"
  dayGan: string;
  dayZhi: string;
  dayGanElement: string;
  dayZhiElement: string;
  score: number;       // 5~95
  grade: TaekilGrade;
  reasons: string[];   // 판정 사유
  luckyTime?: string;  // 길시 추천
}

export interface TaekilResult {
  category: TaekilCategory;
  categoryLabel: string;
  startDate: string;
  endDate: string;
  days: TaekilDay[];
  bestDays: TaekilDay[];  // 대길+길 날들 (상위)
}

// ============================================
// 상수
// ============================================

const TEN_GOD_SCORE: Record<string, number> = {
  '정관': 12, '정인': 10, '정재': 10, '식신': 9, '편재': 7,
  '편인': 2, '겁재': -3, '비견': 0, '상관': -4, '편관': -2,
};

const CATEGORY_BOOST: Record<TaekilCategory, Record<string, number>> = {
  marriage: { '정재': 15, '정관': 12, '식신': 8, '편재': 6, '상관': -10, '편관': -8, '겁재': -6 },
  moving:   { '정인': 14, '식신': 10, '정재': 8, '편인': 4, '편관': -8, '상관': -6 },
  business: { '편재': 15, '정재': 12, '식신': 10, '상관': 6, '겁재': -10, '편관': -6 },
  contract: { '정재': 14, '정관': 12, '정인': 8, '편관': -8, '겁재': -10 },
  travel:   { '식신': 12, '정인': 10, '편재': 6, '편관': -10, '겁재': -4 },
  surgery:  { '정인': 14, '식신': 10, '편인': 6, '편관': -12, '상관': -10 },
  // 출산 택일: 식신(子息 에너지) 최우선, 정인(보호·양육), 편인 극식신으로 강하게 감점
  birth:    { '식신': 18, '정인': 14, '정재': 6, '편인': -14, '편관': -16, '상관': -12, '겁재': -6 },
};

// 육충
const YUKCHUNG: [string, string][] = [
  ['자', '오'], ['축', '미'], ['인', '신'],
  ['묘', '유'], ['진', '술'], ['사', '해'],
];

// 육합
const YUKHAP: [string, string][] = [
  ['자', '축'], ['인', '해'], ['묘', '술'],
  ['진', '유'], ['사', '신'], ['오', '미'],
];

// 형
const HYEONG: [string, string][] = [
  ['인', '사'], ['사', '신'], ['인', '신'],
  ['축', '술'], ['술', '미'], ['축', '미'],
  ['자', '묘'],
];

// 천덕귀인 — 월지 기준으로 천간에 해당하면 길
const CHEONDUK: Record<string, string> = {
  '인': '정', '묘': '신', '진': '임', '사': '신',
  '오': '해', '미': '갑', '신': '계', '유': '인',
  '술': '병', '해': '을', '자': '기', '축': '경',
};

const ELEMENT_TIMES: Record<string, string> = {
  '목': '오전 5~7시 (인·묘시)',
  '화': '오전 11시~오후 1시 (사·오시)',
  '토': '오전 7~9시 (진·미시)',
  '금': '오후 3~7시 (신·유시)',
  '수': '밤 9~11시 (해·자시)',
};

// 지장간 가중치: 정기/중기/여기
const HIDDEN_STEM_WEIGHTS = [0.6, 0.3, 0.1];

// 12운성 점수
const STAGE_POINTS: Record<string, number> = {
  '장생': 12, '목욕': 8, '관대': 12, '건록': 18, '제왕': 20,
  '쇠': 8, '병': 4, '사': 2, '묘': 8, '절': 0, '태': 2, '양': 6,
};

// 삼합
const SAMHAP: [string, string, string, string][] = [
  ['신', '자', '진', '수'],
  ['사', '유', '축', '금'],
  ['인', '오', '술', '화'],
  ['해', '묘', '미', '목'],
];

// 시작 행사 카테고리 (공망 감점이 큰 카테고리)
const START_CATEGORIES: TaekilCategory[] = ['marriage', 'moving', 'business', 'contract', 'birth'];

// ============================================
// 헬퍼 함수
// ============================================

function getTwelveStage(dayGan: string, branch: string): string {
  const branchIndex = EARTHLY_BRANCHES.indexOf(branch);
  if (branchIndex === -1) return '';
  const isYang = STEM_YINYANG[dayGan] === '양';
  const element = STEM_ELEMENT[dayGan];
  // 음양이행(전통): 양간은 亥·寅·巳·申에서 장생 순행, 음간은 午·酉·子·卯에서 장생 역행
  const yangStartPos: Record<string, number> = {
    '목': 11, '화': 2, '토': 2, '금': 5, '수': 8,
  };
  const yinStartPos: Record<string, number> = {
    '목': 6, '화': 9, '토': 9, '금': 0, '수': 3,
  };
  if (isYang) {
    const startPos = yangStartPos[element] ?? 0;
    return TWELVE_STAGE_NAMES[(branchIndex - startPos + 12) % 12];
  } else {
    const startPos = yinStartPos[element] ?? 0;
    return TWELVE_STAGE_NAMES[(startPos - branchIndex + 12) % 12];
  }
}

function getKongmangZhis(dayGan: string, dayZhi: string): [string, string] | null {
  const ganIdx = HEAVENLY_STEMS.indexOf(dayGan);
  const zhiIdx = EARTHLY_BRANCHES.indexOf(dayZhi);
  if (ganIdx < 0 || zhiIdx < 0) return null;
  const sunStart = (zhiIdx - ganIdx + 12) % 12;
  const k1 = (sunStart + 10) % 12;
  const k2 = (sunStart + 11) % 12;
  return [EARTHLY_BRANCHES[k1], EARTHLY_BRANCHES[k2]];
}

// ============================================
// 메인 계산
// ============================================

function gradeFromScore(s: number): TaekilGrade {
  if (s >= 75) return '대길';
  if (s >= 60) return '길';
  if (s >= 40) return '평';
  return '흉';
}

function scoreOneDay(
  saju: SajuResult,
  dateStr: string,
  category: TaekilCategory,
): TaekilDay {
  const [y, m, d] = dateStr.split('-').map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const dayGz = lunar.getDayInGanZhi();
  const monthGz = lunar.getMonthInGanZhi();

  const dayGan = normalizeGan(dayGz[0]);
  const dayZhi = normalizeZhi(dayGz[1]);
  const monthZhi = normalizeZhi(monthGz[1]);
  const dayGanElement = STEM_ELEMENT[dayGan] || '';
  const dayZhiElement = BRANCH_ELEMENT[dayZhi] || '';

  const dayMaster = saju.dayMaster;
  const tenGodGan = TEN_GODS_MAP[dayMaster]?.[dayGan] || '';
  const hiddenStems = (BRANCH_HIDDEN_STEMS as Record<string, string[]>)[dayZhi] || [];

  const reasons: string[] = [];
  let base = 50;

  // 1) 기본 십신 점수
  const ganScore = TEN_GOD_SCORE[tenGodGan] ?? 0;
  base += ganScore * 0.6;

  // 2) 지장간 full — 정기/중기/여기 가중 분석
  const catBoost = CATEGORY_BOOST[category];
  let hiddenStemBonus = 0;
  hiddenStems.forEach((stem, idx) => {
    const w = HIDDEN_STEM_WEIGHTS[idx] ?? 0.1;
    const tenGod = TEN_GODS_MAP[dayMaster]?.[stem] || '';
    const godScore = TEN_GOD_SCORE[tenGod] ?? 0;
    hiddenStemBonus += godScore * w * 0.4;
    const catB = catBoost[tenGod] ?? 0;
    hiddenStemBonus += catB * w * 0.3;
  });
  base += hiddenStemBonus;

  // 3) 카테고리별 천간 십신 보정
  const catGanBoost = catBoost[tenGodGan] ?? 0;
  base += catGanBoost * 0.5;
  if (catGanBoost > 0) reasons.push(`${tenGodGan} — 행사에 유리`);
  if (catGanBoost < 0) reasons.push(`${tenGodGan} — 행사에 불리`);

  // 3) 용신 일치
  if (dayGanElement === saju.yongSinElement) {
    base += 8;
    reasons.push(`일진 천간이 용신(${saju.yongSinElement})과 일치`);
  }
  if (dayZhiElement === saju.yongSinElement) {
    base += 4;
  }

  // 4) 기신 일치 (불리)
  if (dayGanElement === saju.giSin) {
    base -= 6;
    reasons.push(`일진 천간이 기신(${saju.giSin})과 일치 — 주의`);
  }

  // 5) 원국 지지와 일진 지지 합·충·형
  const pillars = [saju.pillars.year, saju.pillars.month, saju.pillars.day];
  if (!saju.hourUnknown) pillars.push(saju.pillars.hour);

  let interactionBonus = 0;
  pillars.forEach(p => {
    // 육합
    for (const [a, b] of YUKHAP) {
      if ((p.zhi === a && dayZhi === b) || (p.zhi === b && dayZhi === a)) {
        interactionBonus += 5;
        reasons.push(`${p.zhi}(원국)와 ${dayZhi}(일진) 육합 — 조화`);
      }
    }
    // 육충
    for (const [a, b] of YUKCHUNG) {
      if ((p.zhi === a && dayZhi === b) || (p.zhi === b && dayZhi === a)) {
        interactionBonus -= 7;
        reasons.push(`${p.zhi}(원국)와 ${dayZhi}(일진) 육충 — 충돌`);
      }
    }
    // 형
    for (const [a, b] of HYEONG) {
      if ((p.zhi === a && dayZhi === b) || (p.zhi === b && dayZhi === a)) {
        interactionBonus -= 4;
        reasons.push(`${p.zhi}(원국)와 ${dayZhi}(일진) 형 — 시비 주의`);
      }
    }
  });
  base += interactionBonus;

  // 6) 천덕귀인 체크 (월지 기준)
  const cheondukGan = CHEONDUK[monthZhi];
  if (cheondukGan && dayGan === cheondukGan) {
    base += 8;
    reasons.push('천덕귀인일 — 재앙 해소, 대길');
  }

  // 7) 12운성 — 일간 기준으로 일진 지지의 운성 판단
  const stage = getTwelveStage(dayMaster, dayZhi);
  if (stage) {
    const stageScore = STAGE_POINTS[stage] ?? 0;
    const stageBonus = (stageScore - 8) * 0.4;
    base += stageBonus;
    if (stageScore >= 18) {
      reasons.push(`12운성 ${stage} — 강한 기운, 시작에 유리`);
    } else if (stageScore <= 2) {
      reasons.push(`12운성 ${stage} — 기운 약함, 주의 필요`);
    }
  }

  // 8) 공망 — 일주 기준 공망 지지가 일진 지지와 일치하면 감점
  const natalDayGan = saju.pillars.day.gan;
  const natalDayZhi = saju.pillars.day.zhi;
  const kongmang = getKongmangZhis(natalDayGan, natalDayZhi);
  if (kongmang && kongmang.includes(dayZhi)) {
    const isStartEvent = START_CATEGORIES.includes(category);
    const penalty = isStartEvent ? -10 : -5;
    base += penalty;
    reasons.push(`공망일(${kongmang.join('·')}) — ${isStartEvent ? '시작 행사 크게 불리' : '허한 기운 주의'}`);
  }

  // 9) 삼합 — 원국 지지 + 일진 지지로 삼합 완성 시 보너스
  const natalZhis = pillars.map(p => p.zhi);
  for (const [b1, b2, b3, element] of SAMHAP) {
    const trio = [b1, b2, b3];
    if (!trio.includes(dayZhi)) continue;
    const remaining = trio.filter(b => b !== dayZhi);
    if (remaining.every(b => natalZhis.includes(b))) {
      base += 8;
      reasons.push(`삼합 완성(${trio.join('')}→${element}) — 강한 조화`);
      if (element === saju.yongSinElement) {
        base += 5;
        reasons.push(`삼합 오행(${element})이 용신과 일치 — 대길`);
      }
    }
  }

  // 10) 출산 택일 전용 — 사(死)·절(絶) 강화 패널티 / 장생·제왕 보너스
  if (category === 'birth') {
    if (stage === '사' || stage === '절') {
      base -= 12;
      reasons.push(`12운성 ${stage} — 출산 택일 기피일`);
    } else if (stage === '장생' || stage === '제왕' || stage === '건록') {
      base += 6;
      reasons.push(`12운성 ${stage} — 출산에 강한 생명 에너지`);
    }
  }

  // 11) clamp + grade
  const score = Math.max(5, Math.min(95, Math.round(base)));
  const grade = gradeFromScore(score);
  if (reasons.length === 0) {
    reasons.push(grade === '대길' || grade === '길' ? '전반적으로 무난한 길일' : '특별한 길흉 요소 없음');
  }

  const yearGz = lunar.getYearInGanZhi();
  const lunarLabel = `${yearGz}년 ${monthGz}월 ${dayGz}일`;
  const luckyTime = ELEMENT_TIMES[saju.yongSinElement] || '';

  return {
    date: dateStr,
    lunarLabel,
    dayGan,
    dayZhi,
    dayGanElement,
    dayZhiElement,
    score,
    grade,
    reasons,
    luckyTime: grade === '대길' || grade === '길' ? luckyTime : undefined,
  };
}

// ============================================
// 공개 API
// ============================================

export function calculateTaekil(
  saju: SajuResult,
  category: TaekilCategory,
  startDate: string,
  endDate: string,
): TaekilResult {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days: TaekilDay[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    days.push(scoreOneDay(saju, iso, category));
    cursor.setDate(cursor.getDate() + 1);
  }

  const bestDays = days
    .filter(d => d.grade === '대길' || d.grade === '길')
    .sort((a, b) => b.score - a.score);

  const cat = TAEKIL_CATEGORIES.find(c => c.id === category)!;

  return {
    category,
    categoryLabel: cat.label,
    startDate,
    endDate,
    days,
    bestDays,
  };
}
