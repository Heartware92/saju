/**
 * 한국 썸머타임(일광절약시간) 데이터
 *
 * 한국은 다음 기간에 썸머타임을 시행했습니다:
 * - 1948-1951년
 * - 1955-1960년
 * - 1987-1988년
 *
 * 썸머타임 적용 시 시간을 1시간 앞당겼으므로,
 * 실제 태양시로 변환하려면 -1시간 보정 필요
 */

export interface DaylightSavingPeriod {
  year: number;
  startDate: string;  // MM-DD 형식
  endDate: string;    // MM-DD 형식
}

export const DAYLIGHT_SAVING_PERIODS: DaylightSavingPeriod[] = [
  // 1948-1951년
  { year: 1948, startDate: '06-01', endDate: '09-12' },
  { year: 1949, startDate: '04-03', endDate: '09-10' },
  { year: 1950, startDate: '04-01', endDate: '09-09' },
  { year: 1951, startDate: '05-06', endDate: '09-08' },

  // 1955-1960년
  { year: 1955, startDate: '05-05', endDate: '09-08' },
  { year: 1956, startDate: '05-20', endDate: '09-29' },
  { year: 1957, startDate: '05-05', endDate: '09-21' },
  { year: 1958, startDate: '05-04', endDate: '09-20' },
  { year: 1959, startDate: '05-03', endDate: '09-19' },
  { year: 1960, startDate: '05-01', endDate: '09-17' },

  // 1987-1988년
  { year: 1987, startDate: '05-10', endDate: '10-10' },
  { year: 1988, startDate: '05-08', endDate: '10-08' },
];

/**
 * 주어진 날짜가 썸머타임 기간인지 확인
 * @param dateString ISO 8601 형식 (YYYY-MM-DD)
 * @returns true면 썸머타임 기간 (-1시간 보정 필요)
 */
export function isDaylightSavingTime(dateString: string): boolean {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);

  const period = DAYLIGHT_SAVING_PERIODS.find(p => p.year === year);
  if (!period) return false;

  const [startMonth, startDay] = period.startDate.split('-').map(Number);
  const [endMonth, endDay] = period.endDate.split('-').map(Number);

  // 시작일 이후인지 확인
  const afterStart = month > startMonth || (month === startMonth && day >= startDay);
  // 종료일 이전인지 확인
  const beforeEnd = month < endMonth || (month === endMonth && day <= endDay);

  return afterStart && beforeEnd;
}

/**
 * 썸머타임 보정값 반환 (분 단위)
 * @returns 썸머타임 기간이면 -60, 아니면 0
 */
export function getDaylightSavingOffset(dateString: string): number {
  return isDaylightSavingTime(dateString) ? -60 : 0;
}
