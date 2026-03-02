/**
 * 일주(日柱) 계산 모듈
 *
 * 일주는 60갑자가 하루씩 순환
 * 기준: 2000년 1월 1일 = 경진(庚辰)일 = 17번
 */

import { Pillar } from '@/types/saju';
import { getGapjaByNumber } from '@/lib/data/gapja';

/**
 * 일주 계산
 * @param dateString YYYY-MM-DD 형식
 * @returns 일주 (천간+지지)
 */
export function calculateDayPillar(dateString: string): Pillar {
  // 기준일: 2000-01-01 = 무오일 (55번)
  const baseDate = new Date('2000-01-01T00:00:00');
  const targetDate = new Date(dateString + 'T00:00:00');

  // 경과 일수 계산
  const diffTime = targetDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 60갑자 번호 계산
  const baseNumber = 55; // 무오
  let gapjaNumber = ((baseNumber - 1 + diffDays) % 60) + 1;

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
 * 특정 날짜의 60갑자 번호 계산
 */
export function getDayGapjaNumber(dateString: string): number {
  const baseDate = new Date('2000-01-01T00:00:00');
  const targetDate = new Date(dateString + 'T00:00:00');

  const diffTime = targetDate.getTime() - baseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const baseNumber = 55; // 무오
  let gapjaNumber = ((baseNumber - 1 + diffDays) % 60) + 1;

  while (gapjaNumber <= 0) {
    gapjaNumber += 60;
  }

  return gapjaNumber;
}

/**
 * 두 날짜 사이의 일수 차이 계산
 */
export function getDaysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');

  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
