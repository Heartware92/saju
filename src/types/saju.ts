/**
 * 사주명리학 타입 정의
 */

// 사용자 입력
export interface UserInput {
  birthDate: string;          // "1992-09-14" (ISO 8601)
  birthTime: string;          // "13:22" (HH:mm)
  birthPlace: string;         // "서울"
  gender: '남' | '여';
  calendarType: '양력' | '음력';
  isLeapMonth?: boolean;      // 음력 윤달 여부
}

// 기둥 (천간+지지)
export interface Pillar {
  gan: string;               // 천간
  ji: string;                // 지지
}

// 만세력 (8글자)
export interface Manseryeok {
  year: Pillar;              // 연주
  month: Pillar;             // 월주
  day: Pillar;               // 일주 (day.gan = 일간)
  hour: Pillar;              // 시주
}

// 오행 분석
export interface Ohaeng {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
  total: number;
  dominant: string;
  lacking: string[];
}

// 십성
export interface Sipseong {
  비견: number;
  겁재: number;
  식신: number;
  상관: number;
  편재: number;
  정재: number;
  편관: number;
  정관: number;
  편인: number;
  정인: number;
  dominant: string;
}

// 십이운성
export interface SibiUnseong {
  year: string;
  month: string;
  day: string;
  hour: string;
}

// 신강신약
export interface SingangSinyak {
  status: '매우 신강' | '신강' | '중화' | '신약' | '매우 신약';
  /** 0~100 정규화 점수 (강화점 / (강화점 + 약화점) * 100) */
  score: number;
  /** 득령(得令) — 월지 정기가 일간과 같은 오행 또는 인성이면 true */
  deukRyeong: boolean;
  /** 득지(得地) — 일지가 일간을 돕는 오행이면 true */
  deukJi: boolean;
  /** 득세(得勢) — 전체 강화점수 ≥ 약화점수 */
  deukSe: boolean;
  detail: {
    /** 비겁(比劫) — 일간과 같은 오행 */
    bijeopScore: number;
    /** 인성(印星) — 일간을 생하는 오행 */
    inseongScore: number;
    /** 식상(食傷) — 일간이 생하는 오행 */
    sikSangPenalty: number;
    /** 재성(財星) — 일간이 극하는 오행 */
    jaeseongPenalty: number;
    /** 관성(官星) — 일간을 극하는 오행 */
    gwanseongPenalty: number;
    /** 강화점 총합 (비겁 + 인성 + 득령 보너스 포함) */
    supportTotal: number;
    /** 약화점 총합 (관성 + 재성 + 식상) */
    weakenTotal: number;
  };
}

// 격국
export interface Gyeokguk {
  name: string;
  status: '성격' | '파격' | '불성불파';
  monthJiSipseong: string;
  description: string;
}

// 용신
export interface Yongsin {
  primary: string;
  secondary?: string;
  gisin?: string;
  method: '조후' | '억부' | '통관';
  reason: string;
}

// 사주관계
export interface SajuRelation {
  yukHap: Array<{
    pair: [string, string];
    result: string;
  }>;
  samHap: Array<{
    triple: [string, string, string];
    result: string;
  }>;
  chung: Array<{
    pair: [string, string];
  }>;
  hyeong: Array<{
    set: string[];
  }>;
  pa: Array<{
    pair: [string, string];
  }>;
  hae: Array<{
    pair: [string, string];
  }>;
}

// 대운
export interface Daeun {
  startAge: number;
  endAge: number;
  gan: string;
  ji: string;
  period: string;
}

// 종합 분석 결과
export interface SajuAnalysisResult {
  input: UserInput;
  manseryeok: Manseryeok;
  ohaeng: Ohaeng;
  sipseong: Sipseong;
  sibiUnseong: SibiUnseong;
  singangSinyak: SingangSinyak;
  gyeokguk: Gyeokguk;
  yongsin: Yongsin;
  sajuRelation: SajuRelation;
  daeun: Daeun[];
  interpretation: {
    personality: {
      summary: string;
      traits: string[];
      strengths: string[];
      weaknesses: string[];
    };
    career: {
      recommended: string[];
      avoid: string[];
      potential: string;
    };
    wealth: {
      type: string;
      timing: string;
      advice: string;
    };
    love: {
      style: string;
      compatibility: string[];
      advice: string;
    };
    health: {
      weakOrgans: string[];
      advice: string;
    };
    lifestyle: {
      luckyDirection: string;
      luckyColors: string[];
      luckyNumbers: number[];
      advice: string;
    };
  };
  createdAt: string;
  version: string;
}

// 오행 타입
export type OhaengType = '목' | '화' | '토' | '금' | '수';

// 음양 타입
export type YinyangType = '양' | '음';
