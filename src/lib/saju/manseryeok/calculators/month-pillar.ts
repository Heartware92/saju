/**
 * 월주(月柱) 계산 모듈
 *
 * 핵심:
 * 1. 절입일로 실제 월 결정
 * 2. 오호전환(五虎遁換)으로 월간 계산
 */

import { Pillar } from '@/types/saju';
import { MONTH_BRANCH, WUHO_FORMULA } from '@/lib/data/constants';
import { getSajuYearMonth } from '@/lib/data/jeolip';

/**
 * 월주 계산
 * @param dateString YYYY-MM-DD 형식
 * @param yearGan 년간 (연주의 천간)
 * @returns 월주 (천간+지지)
 */
export function calculateMonthPillar(dateString: string, yearGan: string): Pillar {
  // 1. 절입일 기준 실제 사주력 월 계산
  const { month: sajuMonth } = getSajuYearMonth(dateString);

  // 2. 월지 결정 (사주력 월 → 지지)
  const monthJi = MONTH_BRANCH[sajuMonth];

  // 3. 오호전환으로 월간 계산
  const monthGan = WUHO_FORMULA[yearGan][sajuMonth];

  return {
    gan: monthGan,
    ji: monthJi
  };
}

/**
 * 사주력 월 → 월지 직접 변환
 */
export function getMonthBranch(sajuMonth: number): string {
  return MONTH_BRANCH[sajuMonth] || '인';
}

/**
 * 오호전환 적용
 * @param yearGan 년간
 * @param sajuMonth 사주력 월 (1-12, 인월=1)
 * @returns 월간
 */
export function getMonthStem(yearGan: string, sajuMonth: number): string {
  return WUHO_FORMULA[yearGan]?.[sajuMonth] || '병';
}
