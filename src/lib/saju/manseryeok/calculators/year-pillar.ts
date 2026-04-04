/**
 * 연주(年柱) 계산 모듈
 *
 * 기준: 1900년 = 경자(庚子)년 = 60갑자 중 37번
 *
 * 주의: 입춘 전에 태어나면 전년도로 계산!
 */

import { Pillar } from '@/types/saju';
import { getGapjaByNumber } from '@/lib/data/gapja';
import { getSajuYearMonth } from '@/lib/data/jeolip';

/**
 * 연주 계산
 * @param dateString YYYY-MM-DD 형식
 * @param timeString HH:mm 형식 (절입일 당일 정확 판단용)
 * @returns 연주 (천간+지지)
 */
export function calculateYearPillar(dateString: string, timeString?: string): Pillar {
  // 사주력 연도 계산 (입춘 기준, 시간 포함)
  const { year: sajuYear } = getSajuYearMonth(dateString, timeString);

  // 60갑자 번호 계산
  // 1900년 = 경자년 = 37번
  const baseYear = 1900;
  const baseNumber = 37;

  const offset = sajuYear - baseYear;
  let gapjaNumber = ((baseNumber - 1 + offset) % 60) + 1;

  // 음수 처리
  while (gapjaNumber <= 0) {
    gapjaNumber += 60;
  }

  const gapja = getGapjaByNumber(gapjaNumber);

  return {
    gan: gapja.gan,
    ji: gapja.ji
  };
}

/**
 * 연도로부터 직접 60갑자 번호 계산 (입춘 무시)
 * 단순 참고용
 */
export function getYearGapjaNumber(year: number): number {
  const baseYear = 1900;
  const baseNumber = 37;

  const offset = year - baseYear;
  let gapjaNumber = ((baseNumber - 1 + offset) % 60) + 1;

  while (gapjaNumber <= 0) {
    gapjaNumber += 60;
  }

  return gapjaNumber;
}
