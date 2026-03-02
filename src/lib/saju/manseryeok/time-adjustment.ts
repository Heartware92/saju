/**
 * 시간 보정 모듈
 *
 * 진태양시(True Solar Time) 계산:
 * 1. 경도 보정: (135 - 지역경도) × 4분
 * 2. 썸머타임 보정: -60분 (해당 기간)
 * 3. 균시차 보정 (선택사항)
 */

import { getLocationByName, LOCATIONS } from '@/lib/data/locations';
import { getDaylightSavingOffset } from '@/lib/data/daylight-saving';

export interface TimeAdjustmentResult {
  adjustedTime: string;      // 보정된 시간 (HH:mm)
  adjustedDate: string;      // 보정된 날짜 (날짜 변경 시)
  totalOffsetMinutes: number; // 총 보정량 (분)
  breakdown: {
    longitudeOffset: number;  // 경도 보정
    dstOffset: number;        // 썸머타임 보정
  };
}

/**
 * 시간 보정 수행
 */
export function adjustTime(params: {
  time: string;       // HH:mm
  date: string;       // YYYY-MM-DD
  location: string;   // 지역명 또는 키
}): TimeAdjustmentResult {
  const { time, date, location } = params;

  // 1. 지역 정보 조회
  let locationInfo = getLocationByName(location);
  if (!locationInfo) {
    // 키로 시도
    locationInfo = LOCATIONS[location];
  }
  if (!locationInfo) {
    // 기본값: 서울
    locationInfo = LOCATIONS['seoul'];
  }

  // 2. 경도 보정 (분 단위)
  const longitudeOffset = locationInfo.timeOffsetMinutes;

  // 3. 썸머타임 보정
  const dstOffset = getDaylightSavingOffset(date);

  // 4. 총 보정량
  const totalOffsetMinutes = longitudeOffset + dstOffset;

  // 5. 시간 계산
  const [hourStr, minuteStr] = time.split(':');
  let totalMinutes = parseInt(hourStr) * 60 + parseInt(minuteStr);

  // 보정 적용
  totalMinutes += totalOffsetMinutes;

  // 6. 날짜 변경 처리
  let adjustedDate = date;
  const [year, month, day] = date.split('-').map(Number);

  if (totalMinutes < 0) {
    // 전날로 변경
    totalMinutes += 1440; // 24시간 = 1440분
    const prevDate = new Date(year, month - 1, day - 1);
    adjustedDate = formatDate(prevDate);
  } else if (totalMinutes >= 1440) {
    // 다음날로 변경
    totalMinutes -= 1440;
    const nextDate = new Date(year, month - 1, day + 1);
    adjustedDate = formatDate(nextDate);
  }

  // 7. 시간 포맷팅
  const adjustedHour = Math.floor(totalMinutes / 60);
  const adjustedMinute = totalMinutes % 60;
  const adjustedTime = `${String(adjustedHour).padStart(2, '0')}:${String(adjustedMinute).padStart(2, '0')}`;

  return {
    adjustedTime,
    adjustedDate,
    totalOffsetMinutes,
    breakdown: {
      longitudeOffset,
      dstOffset
    }
  };
}

/**
 * 자시(子時) 경계 처리
 *
 * 23:00~00:59는 자시로, 다음날로 처리해야 함
 * (야자시 vs 조자시 논쟁이 있으나, 현대 명리학에서는 주로 야자시 채택)
 *
 * @returns 자시 경계로 인한 날짜 변경 여부와 조정된 날짜
 */
export function handleMidnightBoundary(
  time: string,
  date: string
): { isNextDay: boolean; adjustedDate: string } {
  const hour = parseInt(time.split(':')[0]);

  // 23:00~23:59는 다음날 자시
  if (hour === 23) {
    const [year, month, day] = date.split('-').map(Number);
    const nextDate = new Date(year, month - 1, day + 1);
    return {
      isNextDay: true,
      adjustedDate: formatDate(nextDate)
    };
  }

  return {
    isNextDay: false,
    adjustedDate: date
  };
}

/**
 * Date 객체를 YYYY-MM-DD 형식으로 포맷
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 경도로부터 시간 보정값 직접 계산
 */
export function calculateLongitudeOffset(longitude: number): number {
  // 한국 표준시는 동경 135도 기준
  // (135 - 경도) × 4분
  return Math.round((135 - longitude) * 4);
}
