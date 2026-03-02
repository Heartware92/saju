/**
 * 음력-양력 변환 모듈
 *
 * lunar-javascript 라이브러리 활용
 */

import { Solar, Lunar } from 'lunar-javascript';

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

export interface SolarDate {
  year: number;
  month: number;
  day: number;
}

/**
 * 음력 → 양력 변환
 */
export function convertLunarToSolar(
  lunarDateString: string,
  isLeapMonth: boolean = false
): string {
  const [year, month, day] = lunarDateString.split('-').map(Number);

  try {
    // lunar-javascript 사용
    const lunar = Lunar.fromYmd(year, isLeapMonth ? -month : month, day);
    const solar = lunar.getSolar();

    const solarYear = solar.getYear();
    const solarMonth = String(solar.getMonth()).padStart(2, '0');
    const solarDay = String(solar.getDay()).padStart(2, '0');

    return `${solarYear}-${solarMonth}-${solarDay}`;
  } catch (error) {
    console.error('Lunar to Solar conversion error:', error);
    // 변환 실패 시 원본 반환 (양력으로 간주)
    return lunarDateString;
  }
}

/**
 * 양력 → 음력 변환
 */
export function convertSolarToLunar(solarDateString: string): LunarDate {
  const [year, month, day] = solarDateString.split('-').map(Number);

  try {
    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();

    return {
      year: lunar.getYear(),
      month: Math.abs(lunar.getMonth()),
      day: lunar.getDay(),
      isLeapMonth: lunar.getMonth() < 0
    };
  } catch (error) {
    console.error('Solar to Lunar conversion error:', error);
    // 변환 실패 시 양력 그대로 반환
    return {
      year,
      month,
      day,
      isLeapMonth: false
    };
  }
}

/**
 * 음력 날짜 문자열 포맷
 */
export function formatLunarDate(lunar: LunarDate): string {
  const leapPrefix = lunar.isLeapMonth ? '윤' : '';
  return `${lunar.year}년 ${leapPrefix}${lunar.month}월 ${lunar.day}일`;
}
