/**
 * 시주(時柱) 계산 모듈
 *
 * 핵심:
 * 1. 시간 → 시진(時辰) 변환
 * 2. 오서전환(五鼠遁換)으로 시간 계산
 */

import { Pillar } from '@/types/saju';
import { WUSEO_FORMULA, HOUR_TO_BRANCH } from '@/lib/data/constants';

/**
 * 시주 계산
 * @param time HH:mm 형식
 * @param dayGan 일간 (일주의 천간)
 * @returns 시주 (천간+지지)
 */
export function calculateHourPillar(time: string, dayGan: string): Pillar {
  // 1. 시간 → 시진 변환
  const hour = parseInt(time.split(':')[0]);
  const hourJi = getHourBranch(hour);

  // 2. 오서전환으로 시간 계산
  const hourGan = WUSEO_FORMULA[dayGan][hourJi];

  return {
    gan: hourGan,
    ji: hourJi
  };
}

/**
 * 시간 → 지지(시진) 변환
 *
 * 시진 구분:
 * 자시: 23:00-00:59
 * 축시: 01:00-02:59
 * 인시: 03:00-04:59
 * 묘시: 05:00-06:59
 * 진시: 07:00-08:59
 * 사시: 09:00-10:59
 * 오시: 11:00-12:59
 * 미시: 13:00-14:59
 * 신시: 15:00-16:59
 * 유시: 17:00-18:59
 * 술시: 19:00-20:59
 * 해시: 21:00-22:59
 */
export function getHourBranch(hour: number): string {
  if (hour === 23 || hour === 0) return '자';
  if (hour === 1 || hour === 2) return '축';
  if (hour === 3 || hour === 4) return '인';
  if (hour === 5 || hour === 6) return '묘';
  if (hour === 7 || hour === 8) return '진';
  if (hour === 9 || hour === 10) return '사';
  if (hour === 11 || hour === 12) return '오';
  if (hour === 13 || hour === 14) return '미';
  if (hour === 15 || hour === 16) return '신';
  if (hour === 17 || hour === 18) return '유';
  if (hour === 19 || hour === 20) return '술';
  if (hour === 21 || hour === 22) return '해';

  // 기본값
  return '자';
}

/**
 * 오서전환 적용
 * @param dayGan 일간
 * @param hourJi 시지
 * @returns 시간
 */
export function getHourStem(dayGan: string, hourJi: string): string {
  return WUSEO_FORMULA[dayGan]?.[hourJi] || '갑';
}

/**
 * 시진 한글 이름 반환
 */
export function getHourName(hourJi: string): string {
  const names: Record<string, string> = {
    '자': '자시(子時)',
    '축': '축시(丑時)',
    '인': '인시(寅時)',
    '묘': '묘시(卯時)',
    '진': '진시(辰時)',
    '사': '사시(巳時)',
    '오': '오시(午時)',
    '미': '미시(未時)',
    '신': '신시(申時)',
    '유': '유시(酉時)',
    '술': '술시(戌時)',
    '해': '해시(亥時)'
  };

  return names[hourJi] || hourJi;
}
