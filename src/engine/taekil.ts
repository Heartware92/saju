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
  | 'contract'   // 계약·거래
  | 'travel'     // 여행·출행
  | 'surgery'    // 수술
  | 'vehicle'    // 차량 출고·인수
  | 'general';   // 일반 (범용)

export const TAEKIL_CATEGORIES: { id: TaekilCategory; label: string; desc: string }[] = [
  { id: 'marriage', label: '결혼·혼례', desc: '결혼식, 약혼, 상견례' },
  { id: 'moving', label: '이사·입택', desc: '이사, 새집 입주' },
  { id: 'business', label: '개업·창업', desc: '가게 오픈, 사업 시작' },
  { id: 'contract', label: '계약·거래', desc: '부동산, 큰 계약' },
  { id: 'travel', label: '여행·출행', desc: '해외여행, 장거리 이동' },
  { id: 'surgery', label: '수술', desc: '수술, 시술 일정' },
  { id: 'vehicle', label: '차량 출고', desc: '자동차 인수, 출고' },
  { id: 'general', label: '일반 택일', desc: '범용 길일 탐색' },
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
  vehicle:  { '편재': 12, '정재': 10, '식신': 8, '편관': -6, '겁재': -4 },
  general:  {},
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
  const mainHidden = (BRANCH_HIDDEN_STEMS as Record<string, string[]>)[dayZhi]?.[0] || '';
  const tenGodZhi = TEN_GODS_MAP[dayMaster]?.[mainHidden] || '';

  const reasons: string[] = [];
  let base = 50;

  // 1) 기본 십신 점수
  const ganScore = TEN_GOD_SCORE[tenGodGan] ?? 0;
  base += ganScore * 0.6;

  // 2) 카테고리별 십신 보정
  const catBoost = CATEGORY_BOOST[category];
  const catGanBoost = catBoost[tenGodGan] ?? 0;
  const catZhiBoost = catBoost[tenGodZhi] ?? 0;
  base += catGanBoost * 0.5 + catZhiBoost * 0.3;
  if (catGanBoost > 0) reasons.push(`${tenGodGan} — ${category === 'general' ? '기운 상승' : '행사에 유리'}`);
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

  // 7) clamp + grade
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
