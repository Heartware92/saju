/**
 * 토정비결(土亭祕訣) 계산 엔진
 *
 * 공식:
 *   상괘(1~8) = (세는 나이 + 태세수) mod 8, 나머지 0이면 8
 *   중괘(1~6) = (음력 생월 + 월건수) mod 6, 나머지 0이면 6
 *   하괘(1~3) = (음력 생일 + 일진수) mod 3, 나머지 0이면 3
 *
 * 태세수 = 해당 해(targetYear) 년주(年柱)의 60갑자 순번 (1~60)
 * 월건수 = 해당 해 음력 생월의 월주(月柱) 60갑자 순번
 * 일진수 = 해당 해 음력 생일의 일주(日柱) 60갑자 순번
 *
 * 최종 괘번호 = 상괘 * 100 + 중괘 * 10 + 하괘 (예: 815)
 * → 8 * 6 * 3 = 144가지
 */

import { Solar, Lunar } from 'lunar-javascript';

// ============================================
// 60갑자 순번 계산
// ============================================

const GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
const ZHI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

/** 간지 문자열(예: "갑자")을 1~60 순번으로 변환 */
function ganZhiToNumber(ganZhi: string): number {
  if (!ganZhi || ganZhi.length < 2) return 1;
  const ganIdx = GAN.indexOf(ganZhi[0]);
  const zhiIdx = ZHI.indexOf(ganZhi[1]);
  if (ganIdx < 0 || zhiIdx < 0) return 1;
  // 60갑자: gan과 zhi가 같은 홀/짝 쌍만 유효. 순번 = (((zhi - gan) mod 12) * 5 + gan * ???)
  // 표준 공식: 순번(1~60)
  // 갑자=1, 을축=2, ..., 계해=60
  // 아래는 lookup 방식
  for (let i = 0; i < 60; i++) {
    if (GAN[i % 10] === ganZhi[0] && ZHI[i % 12] === ganZhi[1]) {
      return i + 1;
    }
  }
  return 1;
}

// ============================================
// 팔괘 / 중괘 / 하괘 메타
// ============================================

export interface SangGwaeMeta {
  num: number;
  name: string;
  hanja: string;
  symbol: string;
  element: string;
  meaning: string;
}

export interface JungGwaeMeta {
  num: number;
  position: string;
  meaning: string;
}

export interface HaGwaeMeta {
  num: number;
  name: string;
  meaning: string;
}

export const SANG_GWAE: SangGwaeMeta[] = [
  { num: 1, name: '건', hanja: '乾', symbol: '☰', element: '金', meaning: '하늘, 강건, 리더십, 창조' },
  { num: 2, name: '태', hanja: '兌', symbol: '☱', element: '金', meaning: '연못, 기쁨, 교류, 언변' },
  { num: 3, name: '리', hanja: '離', symbol: '☲', element: '火', meaning: '불, 밝음, 열정, 명예' },
  { num: 4, name: '진', hanja: '震', symbol: '☳', element: '木', meaning: '우레, 움직임, 추진, 변화' },
  { num: 5, name: '손', hanja: '巽', symbol: '☴', element: '木', meaning: '바람, 유연, 영향력, 소통' },
  { num: 6, name: '감', hanja: '坎', symbol: '☵', element: '水', meaning: '물, 지혜, 험난, 인내' },
  { num: 7, name: '간', hanja: '艮', symbol: '☶', element: '土', meaning: '산, 멈춤, 신중, 축적' },
  { num: 8, name: '곤', hanja: '坤', symbol: '☷', element: '土', meaning: '땅, 수용, 포용, 모성' },
];

export const JUNG_GWAE: JungGwaeMeta[] = [
  { num: 1, position: '초효(初爻)', meaning: '시작의 자리 · 잠재력과 출발점' },
  { num: 2, position: '이효(二爻)', meaning: '내부 중심 · 안정과 기반' },
  { num: 3, position: '삼효(三爻)', meaning: '전환의 자리 · 과도기와 시험' },
  { num: 4, position: '사효(四爻)', meaning: '외부로 확장 · 사회적 활동' },
  { num: 5, position: '오효(五爻)', meaning: '지존의 자리 · 정점과 성취' },
  { num: 6, position: '상효(上爻)', meaning: '말미의 자리 · 완성 혹은 쇠퇴' },
];

export const HA_GWAE: HaGwaeMeta[] = [
  { num: 1, name: '天(천)', meaning: '하늘의 뜻 · 환경과 시운' },
  { num: 2, name: '地(지)', meaning: '땅의 안정 · 물질과 기반' },
  { num: 3, name: '人(인)', meaning: '사람의 노력 · 인연과 관계' },
];

// ============================================
// 결과 타입
// ============================================

export interface TojeongResult {
  // 입력 정보
  targetYear: number;
  age: number; // 세는 나이
  birthLunar: { year: number; month: number; day: number; isLeap: boolean };
  birthSolar: { year: number; month: number; day: number };

  // 해당 해의 간지
  yearGanZhi: { ganZhi: string; number: number };
  monthGanZhi: { ganZhi: string; number: number };
  dayGanZhi: { ganZhi: string; number: number };

  // 괘 3자리
  upper: number; // 1~8
  middle: number; // 1~6
  lower: number; // 1~3
  gwaeNumber: number; // 예: 815

  // 메타
  upperGwae: SangGwaeMeta;
  middleGwae: JungGwaeMeta;
  lowerGwae: HaGwaeMeta;

  // 공식 로그
  formula: {
    upper: string;
    middle: string;
    lower: string;
  };
}

// ============================================
// 메인 계산
// ============================================

export function calculateTojeong(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  calendarType: 'solar' | 'lunar',
  targetYear: number = new Date().getFullYear()
): TojeongResult {
  // 1) 생년월일 → 음력 기준 (및 양력도 보존)
  let lunarY: number, lunarM: number, lunarD: number, isLeap = false;
  let solarY: number, solarM: number, solarD: number;

  if (calendarType === 'lunar') {
    lunarY = birthYear;
    lunarM = birthMonth;
    lunarD = birthDay;
    const lunar = Lunar.fromYmd(birthYear, birthMonth, birthDay);
    const solar = lunar.getSolar();
    solarY = solar.getYear();
    solarM = solar.getMonth();
    solarD = solar.getDay();
    isLeap = typeof (lunar as any).isLeap === 'function' ? (lunar as any).isLeap() : false;
  } else {
    solarY = birthYear;
    solarM = birthMonth;
    solarD = birthDay;
    const solar = Solar.fromYmd(birthYear, birthMonth, birthDay);
    const lunar = solar.getLunar();
    lunarY = lunar.getYear();
    lunarM = Math.abs(lunar.getMonth()); // 윤달은 음수로 반환되므로 절댓값
    lunarD = lunar.getDay();
    isLeap = lunar.getMonth() < 0;
  }

  // 2) 세는 나이 (한국식): targetYear - birthYear(양력) + 1
  const age = targetYear - solarY + 1;

  // 3) 해당 해 年柱 (태세수): 해당 해 6월 15일 양력 기준 → 년주 간지
  const targetMidSolar = Solar.fromYmd(targetYear, 6, 15);
  const targetMidLunar = targetMidSolar.getLunar();
  const yearGanZhi = targetMidLunar.getYearInGanZhi();
  const yearNumber = ganZhiToNumber(yearGanZhi);

  // 4) 해당 해 음력 생월의 月柱 (월건수)
  // 해당 해에 음력 생월이 존재하도록 보정. 안전하게 lunarM 그대로 사용.
  let monthGanZhi = '';
  let monthNumber = 1;
  try {
    // 해당 해의 음력 생월 15일을 취해 월주 조회
    const monthProbe = Lunar.fromYmd(targetYear, lunarM, 15);
    monthGanZhi = monthProbe.getMonthInGanZhi();
    monthNumber = ganZhiToNumber(monthGanZhi);
  } catch {
    // fallback
    monthGanZhi = '갑인';
    monthNumber = ganZhiToNumber(monthGanZhi);
  }

  // 5) 해당 해 음력 생일의 日柱 (일진수)
  // 해당 해 + 음력 생월/생일이 존재하지 않는 경우가 있을 수 있음(큰달/작은달) → 가능한 최대일로 보정
  let dayProbeM = lunarM;
  let dayProbeD = lunarD;
  let dayGanZhi = '';
  let dayNumber = 1;
  try {
    const dayProbe = Lunar.fromYmd(targetYear, dayProbeM, dayProbeD);
    dayGanZhi = dayProbe.getDayInGanZhi();
    dayNumber = ganZhiToNumber(dayGanZhi);
  } catch {
    // 보정: 29일로 시도
    try {
      const fallback = Lunar.fromYmd(targetYear, dayProbeM, Math.min(dayProbeD, 29));
      dayGanZhi = fallback.getDayInGanZhi();
      dayNumber = ganZhiToNumber(dayGanZhi);
    } catch {
      dayGanZhi = '갑자';
      dayNumber = 1;
    }
  }

  // 6) 상중하괘 계산
  const upperMod = (age + yearNumber) % 8;
  const upper = upperMod === 0 ? 8 : upperMod;

  const middleMod = (lunarM + monthNumber) % 6;
  const middle = middleMod === 0 ? 6 : middleMod;

  const lowerMod = (lunarD + dayNumber) % 3;
  const lower = lowerMod === 0 ? 3 : lowerMod;

  const gwaeNumber = upper * 100 + middle * 10 + lower;

  return {
    targetYear,
    age,
    birthLunar: { year: lunarY, month: lunarM, day: lunarD, isLeap },
    birthSolar: { year: solarY, month: solarM, day: solarD },
    yearGanZhi: { ganZhi: yearGanZhi, number: yearNumber },
    monthGanZhi: { ganZhi: monthGanZhi, number: monthNumber },
    dayGanZhi: { ganZhi: dayGanZhi, number: dayNumber },
    upper,
    middle,
    lower,
    gwaeNumber,
    upperGwae: SANG_GWAE[upper - 1],
    middleGwae: JUNG_GWAE[middle - 1],
    lowerGwae: HA_GWAE[lower - 1],
    formula: {
      upper: `(나이 ${age} + 태세수 ${yearNumber}) mod 8 = ${upper}`,
      middle: `(음력 생월 ${lunarM} + 월건수 ${monthNumber}) mod 6 = ${middle}`,
      lower: `(음력 생일 ${lunarD} + 일진수 ${dayNumber}) mod 3 = ${lower}`,
    },
  };
}
