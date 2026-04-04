/**
 * 만세력 메인 계산 모듈
 *
 * 7단계 처리:
 * 1. 입력 검증
 * 2. 음력 → 양력 변환 (필요시)
 * 3. 시간 보정 (경도 + 썸머타임)
 * 4. 연주 계산
 * 5. 월주 계산 (절입일 체크)
 * 6. 일주 계산
 * 7. 시주 계산
 */

import { Manseryeok, UserInput, Pillar } from '@/types/saju';
import { validateInput } from './validators';
import { adjustTime, handleMidnightBoundary } from './time-adjustment';
import { convertLunarToSolar, convertSolarToLunar, formatLunarDate } from './lunar-converter';
import { calculateYearPillar } from './calculators/year-pillar';
import { calculateMonthPillar } from './calculators/month-pillar';
import { calculateDayPillar } from './calculators/day-pillar';
import { calculateHourPillar } from './calculators/hour-pillar';

export interface ManseryeokResult {
  manseryeok: Manseryeok;
  meta: {
    inputDate: string;
    inputTime: string;
    solarDate: string;
    lunarDate: string;
    adjustedTime: string;
    adjustedDate: string;
    timeOffsetMinutes: number;
    calendarType: '양력' | '음력';
  };
}

/**
 * 만세력 계산 메인 함수
 */
export function calculateManseryeok(input: UserInput): ManseryeokResult {
  // 1. 입력 검증
  validateInput(input);

  // 2. 음력 → 양력 변환 (필요시)
  let solarDate = input.birthDate;
  let lunarDateStr = '';

  if (input.calendarType === '음력') {
    solarDate = convertLunarToSolar(input.birthDate, input.isLeapMonth || false);
    const lunarInfo = {
      year: parseInt(input.birthDate.split('-')[0]),
      month: parseInt(input.birthDate.split('-')[1]),
      day: parseInt(input.birthDate.split('-')[2]),
      isLeapMonth: input.isLeapMonth || false
    };
    lunarDateStr = formatLunarDate(lunarInfo);
  } else {
    // 양력 → 음력 정보 계산
    const lunarInfo = convertSolarToLunar(solarDate);
    lunarDateStr = formatLunarDate(lunarInfo);
  }

  // 3. 시간 보정 (경도 + 썸머타임)
  const timeResult = adjustTime({
    time: input.birthTime,
    date: solarDate,
    location: input.birthPlace
  });

  let adjustedDate = timeResult.adjustedDate;
  let adjustedTime = timeResult.adjustedTime;

  // 4. 자시 경계 처리 (23:00 이후 → 다음날)
  const midnightResult = handleMidnightBoundary(adjustedTime, adjustedDate);
  if (midnightResult.isNextDay) {
    adjustedDate = midnightResult.adjustedDate;
  }

  // 5. 연주 계산 (시간 포함하여 절입 시각 정확 비교)
  const yearPillar = calculateYearPillar(adjustedDate, adjustedTime);

  // 6. 월주 계산 (시간 포함하여 절입 시각 정확 비교)
  const monthPillar = calculateMonthPillar(adjustedDate, yearPillar.gan, adjustedTime);

  // 7. 일주 계산
  const dayPillar = calculateDayPillar(adjustedDate);

  // 8. 시주 계산
  const hourPillar = calculateHourPillar(adjustedTime, dayPillar.gan);

  return {
    manseryeok: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar
    },
    meta: {
      inputDate: input.birthDate,
      inputTime: input.birthTime,
      solarDate,
      lunarDate: lunarDateStr,
      adjustedTime,
      adjustedDate,
      timeOffsetMinutes: timeResult.totalOffsetMinutes,
      calendarType: input.calendarType
    }
  };
}

/**
 * 만세력 결과를 문자열로 포맷
 */
export function formatManseryeok(manseryeok: Manseryeok): string {
  const { year, month, day, hour } = manseryeok;
  return `${year.gan}${year.ji}(年) ${month.gan}${month.ji}(月) ${day.gan}${day.ji}(日) ${hour.gan}${hour.ji}(時)`;
}

/**
 * 만세력을 한자 포함 포맷
 */
export function formatManseryeokWithHanja(manseryeok: Manseryeok): {
  year: string;
  month: string;
  day: string;
  hour: string;
  full: string;
} {
  // 천간과 지지를 분리 (신辛과 신申 구분)
  const ganHanjaMap: Record<string, string> = {
    '갑': '甲', '을': '乙', '병': '丙', '정': '丁', '무': '戊',
    '기': '己', '경': '庚', '신': '辛', '임': '壬', '계': '癸'
  };

  const jiHanjaMap: Record<string, string> = {
    '자': '子', '축': '丑', '인': '寅', '묘': '卯', '진': '辰', '사': '巳',
    '오': '午', '미': '未', '신': '申', '유': '酉', '술': '戌', '해': '亥'
  };

  const formatPillar = (pillar: Pillar) => {
    const ganHanja = ganHanjaMap[pillar.gan] || pillar.gan;
    const jiHanja = jiHanjaMap[pillar.ji] || pillar.ji;
    return `${pillar.gan}${pillar.ji}(${ganHanja}${jiHanja})`;
  };

  return {
    year: formatPillar(manseryeok.year),
    month: formatPillar(manseryeok.month),
    day: formatPillar(manseryeok.day),
    hour: formatPillar(manseryeok.hour),
    full: `${formatPillar(manseryeok.year)} ${formatPillar(manseryeok.month)} ${formatPillar(manseryeok.day)} ${formatPillar(manseryeok.hour)}`
  };
}
