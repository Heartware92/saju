/**
 * 진태양시(True Solar Time) 보정 및 역사적 표준시 처리 모듈
 *
 * 사주에서 시주(時柱)를 정확히 계산하기 위해서는
 * 시계 시간이 아닌 진태양시를 사용해야 합니다.
 */

// ============================================
// 한국 역사적 표준시 데이터
// ============================================

interface TimeZonePeriod {
  startDate: Date;
  endDate: Date;
  standardMeridian: number; // 표준 자오선 (경도)
  utcOffset: number; // UTC 오프셋 (시간 단위)
  description: string;
}

// 한국의 역사적 표준시 변경 이력
const KOREA_TIMEZONE_HISTORY: TimeZonePeriod[] = [
  {
    startDate: new Date('1800-01-01'),
    endDate: new Date('1908-03-31'),
    standardMeridian: 127.5,
    utcOffset: 8.5,
    description: '대한제국 표준시 (한양 기준)'
  },
  {
    startDate: new Date('1908-04-01'),
    endDate: new Date('1911-12-31'),
    standardMeridian: 127.5,
    utcOffset: 8.5,
    description: '대한제국 표준시'
  },
  {
    startDate: new Date('1912-01-01'),
    endDate: new Date('1954-03-20'),
    standardMeridian: 135,
    utcOffset: 9,
    description: '일제강점기 및 초기 대한민국 (도쿄 기준)'
  },
  {
    startDate: new Date('1954-03-21'),
    endDate: new Date('1961-08-09'),
    standardMeridian: 127.5,
    utcOffset: 8.5,
    description: '이승만 정부 표준시 환원'
  },
  {
    startDate: new Date('1961-08-10'),
    endDate: new Date('2100-12-31'),
    standardMeridian: 135,
    utcOffset: 9,
    description: '현재 KST (동경 135도 기준)'
  }
];

// 주요 도시 경도 데이터
export const CITY_COORDINATES: Record<string, { lat: number; lng: number; name: string; category?: string }> = {
  // ========== 대한민국 17개 시도 ==========
  // 특별시/광역시/특별자치시
  'seoul': { lat: 37.5665, lng: 126.978, name: '서울특별시', category: '대한민국' },
  'busan': { lat: 35.1796, lng: 129.0756, name: '부산광역시', category: '대한민국' },
  'daegu': { lat: 35.8714, lng: 128.6014, name: '대구광역시', category: '대한민국' },
  'incheon': { lat: 37.4563, lng: 126.7052, name: '인천광역시', category: '대한민국' },
  'gwangju': { lat: 35.1595, lng: 126.8526, name: '광주광역시', category: '대한민국' },
  'daejeon': { lat: 36.3504, lng: 127.3845, name: '대전광역시', category: '대한민국' },
  'ulsan': { lat: 35.5384, lng: 129.3114, name: '울산광역시', category: '대한민국' },
  'sejong': { lat: 36.4800, lng: 127.2890, name: '세종특별자치시', category: '대한민국' },

  // 도 (도청 소재지 기준)
  'gyeonggi': { lat: 37.2752, lng: 127.0094, name: '경기도 (수원)', category: '대한민국' },
  'gangwon': { lat: 37.8813, lng: 127.7298, name: '강원도 (춘천)', category: '대한민국' },
  'chungbuk': { lat: 36.6357, lng: 127.4912, name: '충청북도 (청주)', category: '대한민국' },
  'chungnam': { lat: 36.6588, lng: 126.6728, name: '충청남도 (홍성)', category: '대한민국' },
  'jeonbuk': { lat: 35.8203, lng: 127.1088, name: '전라북도 (전주)', category: '대한민국' },
  'jeonnam': { lat: 34.8161, lng: 126.4630, name: '전라남도 (무안)', category: '대한민국' },
  'gyeongbuk': { lat: 36.5760, lng: 128.5056, name: '경상북도 (안동)', category: '대한민국' },
  'gyeongnam': { lat: 35.2380, lng: 128.6924, name: '경상남도 (창원)', category: '대한민국' },
  'jeju': { lat: 33.4996, lng: 126.5312, name: '제주특별자치도', category: '대한민국' },

  // ========== 북한 ==========
  'pyongyang': { lat: 39.0392, lng: 125.7625, name: '평양', category: '북한' },

  // ========== 아시아 ==========
  'tokyo': { lat: 35.6762, lng: 139.6503, name: '도쿄 (일본)', category: '아시아' },
  'osaka': { lat: 34.6937, lng: 135.5023, name: '오사카 (일본)', category: '아시아' },
  'beijing': { lat: 39.9042, lng: 116.4074, name: '베이징 (중국)', category: '아시아' },
  'shanghai': { lat: 31.2304, lng: 121.4737, name: '상하이 (중국)', category: '아시아' },
  'hongkong': { lat: 22.3193, lng: 114.1694, name: '홍콩', category: '아시아' },
  'taipei': { lat: 25.0330, lng: 121.5654, name: '타이베이 (대만)', category: '아시아' },
  'singapore': { lat: 1.3521, lng: 103.8198, name: '싱가포르', category: '아시아' },
  'bangkok': { lat: 13.7563, lng: 100.5018, name: '방콕 (태국)', category: '아시아' },
  'hanoi': { lat: 21.0285, lng: 105.8542, name: '하노이 (베트남)', category: '아시아' },
  'manila': { lat: 14.5995, lng: 120.9842, name: '마닐라 (필리핀)', category: '아시아' },

  // ========== 북미 ==========
  'newyork': { lat: 40.7128, lng: -74.0060, name: '뉴욕 (미국)', category: '북미' },
  'losangeles': { lat: 34.0522, lng: -118.2437, name: '로스앤젤레스 (미국)', category: '북미' },
  'chicago': { lat: 41.8781, lng: -87.6298, name: '시카고 (미국)', category: '북미' },
  'sanfrancisco': { lat: 37.7749, lng: -122.4194, name: '샌프란시스코 (미국)', category: '북미' },
  'seattle': { lat: 47.6062, lng: -122.3321, name: '시애틀 (미국)', category: '북미' },
  'vancouver': { lat: 49.2827, lng: -123.1207, name: '밴쿠버 (캐나다)', category: '북미' },
  'toronto': { lat: 43.6532, lng: -79.3832, name: '토론토 (캐나다)', category: '북미' },

  // ========== 유럽 ==========
  'london': { lat: 51.5074, lng: -0.1278, name: '런던 (영국)', category: '유럽' },
  'paris': { lat: 48.8566, lng: 2.3522, name: '파리 (프랑스)', category: '유럽' },
  'berlin': { lat: 52.5200, lng: 13.4050, name: '베를린 (독일)', category: '유럽' },
  'frankfurt': { lat: 50.1109, lng: 8.6821, name: '프랑크푸르트 (독일)', category: '유럽' },

  // ========== 오세아니아 ==========
  'sydney': { lat: -33.8688, lng: 151.2093, name: '시드니 (호주)', category: '오세아니아' },
  'melbourne': { lat: -37.8136, lng: 144.9631, name: '멜버른 (호주)', category: '오세아니아' },
  'auckland': { lat: -36.8509, lng: 174.7645, name: '오클랜드 (뉴질랜드)', category: '오세아니아' },
};

// ============================================
// 균시차(Equation of Time) 계산
// ============================================

/**
 * 균시차를 계산합니다.
 * 지구의 타원 궤도와 자전축 기울기로 인해 발생하는 시간 오차
 *
 * @param dayOfYear 연중 일수 (1-365/366)
 * @returns 균시차 (분 단위, 양수면 진태양시가 평균태양시보다 빠름)
 */
export const calculateEquationOfTime = (dayOfYear: number): number => {
  // 간략화된 균시차 공식 (Spencer's formula 기반)
  const B = (2 * Math.PI * (dayOfYear - 81)) / 365;

  const eot = 9.87 * Math.sin(2 * B)
            - 7.53 * Math.cos(B)
            - 1.5 * Math.sin(B);

  return eot; // 분 단위
};

/**
 * 연중 일수를 계산합니다.
 */
export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

// ============================================
// 역사적 표준시 조회
// ============================================

/**
 * 특정 날짜의 표준시 정보를 반환합니다.
 */
export const getHistoricalTimezone = (date: Date): TimeZonePeriod => {
  for (const period of KOREA_TIMEZONE_HISTORY) {
    if (date >= period.startDate && date <= period.endDate) {
      return period;
    }
  }
  // 기본값: 현재 KST
  return KOREA_TIMEZONE_HISTORY[KOREA_TIMEZONE_HISTORY.length - 1];
};

// ============================================
// 진태양시 계산
// ============================================

export interface TrueSolarTimeResult {
  originalTime: Date;
  trueSolarTime: Date;
  longitudeCorrection: number; // 분
  equationOfTime: number; // 분
  historicalCorrection: number; // 분
  totalCorrection: number; // 분
  timezone: TimeZonePeriod;
}

/**
 * 진태양시를 계산합니다.
 *
 * 공식: T_true = T_clock + 4(L_local - L_standard) + EOT + Historical_Correction
 *
 * @param clockTime 시계 시간 (입력된 생년월일시)
 * @param longitude 출생지 경도 (기본값: 서울 126.978)
 * @param applyHistoricalTimezone 역사적 표준시 적용 여부
 */
export const calculateTrueSolarTime = (
  clockTime: Date,
  longitude: number = 126.978, // 기본값: 서울
  applyHistoricalTimezone: boolean = true
): TrueSolarTimeResult => {
  // 1. 역사적 표준시 정보 조회
  const timezone = getHistoricalTimezone(clockTime);
  const standardMeridian = timezone.standardMeridian;

  // 2. 경도 보정 (4분/도)
  // 표준 자오선과 출생지 경도의 차이
  const longitudeCorrection = 4 * (longitude - standardMeridian);

  // 3. 균시차
  const dayOfYear = getDayOfYear(clockTime);
  const equationOfTime = calculateEquationOfTime(dayOfYear);

  // 4. 역사적 표준시 보정
  // 현재 KST(+9)와의 차이를 분으로 환산
  let historicalCorrection = 0;
  if (applyHistoricalTimezone) {
    const currentOffset = 9; // 현재 KST
    historicalCorrection = (timezone.utcOffset - currentOffset) * 60;
  }

  // 5. 총 보정값
  const totalCorrection = longitudeCorrection + equationOfTime + historicalCorrection;

  // 6. 보정된 시간 계산
  const trueSolarTime = new Date(clockTime.getTime() + totalCorrection * 60 * 1000);

  return {
    originalTime: clockTime,
    trueSolarTime,
    longitudeCorrection: Math.round(longitudeCorrection * 10) / 10,
    equationOfTime: Math.round(equationOfTime * 10) / 10,
    historicalCorrection,
    totalCorrection: Math.round(totalCorrection * 10) / 10,
    timezone
  };
};

// ============================================
// 시주(時柱) 결정을 위한 시간 구간
// ============================================

export interface HourBranch {
  branch: string;
  startHour: number;
  endHour: number;
  name: string;
}

// 12시진 (지지별 시간 구간) - 진태양시 기준
export const HOUR_BRANCHES: HourBranch[] = [
  { branch: '자', startHour: 23, endHour: 1, name: '자시' },
  { branch: '축', startHour: 1, endHour: 3, name: '축시' },
  { branch: '인', startHour: 3, endHour: 5, name: '인시' },
  { branch: '묘', startHour: 5, endHour: 7, name: '묘시' },
  { branch: '진', startHour: 7, endHour: 9, name: '진시' },
  { branch: '사', startHour: 9, endHour: 11, name: '사시' },
  { branch: '오', startHour: 11, endHour: 13, name: '오시' },
  { branch: '미', startHour: 13, endHour: 15, name: '미시' },
  { branch: '신', startHour: 15, endHour: 17, name: '신시' },
  { branch: '유', startHour: 17, endHour: 19, name: '유시' },
  { branch: '술', startHour: 19, endHour: 21, name: '술시' },
  { branch: '해', startHour: 21, endHour: 23, name: '해시' }
];

/**
 * 시간으로부터 지지(시주)를 결정합니다.
 */
export const getHourBranch = (hour: number): string => {
  if (hour >= 23 || hour < 1) return '자';
  if (hour >= 1 && hour < 3) return '축';
  if (hour >= 3 && hour < 5) return '인';
  if (hour >= 5 && hour < 7) return '묘';
  if (hour >= 7 && hour < 9) return '진';
  if (hour >= 9 && hour < 11) return '사';
  if (hour >= 11 && hour < 13) return '오';
  if (hour >= 13 && hour < 15) return '미';
  if (hour >= 15 && hour < 17) return '신';
  if (hour >= 17 && hour < 19) return '유';
  if (hour >= 19 && hour < 21) return '술';
  return '해';
};

// ============================================
// 야자시/조자시 처리
// ============================================

export type ZasiMode = 'yajasi' | 'jojasi' | 'unified';

export interface ZasiConfig {
  mode: ZasiMode;
  description: string;
}

export const ZASI_MODES: Record<ZasiMode, ZasiConfig> = {
  'yajasi': {
    mode: 'yajasi',
    description: '야자시/조자시 구분 (23:00~00:00는 당일, 00:00~01:00는 다음날)'
  },
  'jojasi': {
    mode: 'jojasi',
    description: '조자시 통합 (23:00부터 다음날로 일주 변경)'
  },
  'unified': {
    mode: 'unified',
    description: '00:00 기준 (자정부터 날짜 변경, 전통적 방식)'
  }
};

/**
 * 야자시/조자시에 따른 날짜 조정
 *
 * @param date 원본 날짜
 * @param hour 시간 (0-23)
 * @param mode 자시 처리 모드
 * @returns 조정된 날짜와 시주 변경 여부
 */
export const adjustDateForZasi = (
  date: Date,
  hour: number,
  mode: ZasiMode = 'unified'
): { adjustedDate: Date; isZasi: boolean; dayChanged: boolean } => {
  const isZasi = hour >= 23 || hour < 1;
  let adjustedDate = new Date(date);
  let dayChanged = false;

  if (!isZasi) {
    return { adjustedDate, isZasi, dayChanged };
  }

  switch (mode) {
    case 'yajasi':
      // 야자시 (23:00~00:00): 당일 유지
      // 조자시 (00:00~01:00): 이미 다음날이므로 변경 없음
      break;

    case 'jojasi':
      // 23:00 이후면 다음날로 취급
      if (hour >= 23) {
        adjustedDate.setDate(adjustedDate.getDate() + 1);
        dayChanged = true;
      }
      break;

    case 'unified':
    default:
      // 00:00 기준 (기본값) - 시스템 날짜 그대로 사용
      break;
  }

  return { adjustedDate, isZasi, dayChanged };
};

// ============================================
// 종합 시간 보정 함수
// ============================================

export interface CorrectedTimeResult {
  originalDate: Date;
  trueSolarTime: TrueSolarTimeResult;
  adjustedForZasi: {
    date: Date;
    dayChanged: boolean;
  };
  finalHour: number;
  hourBranch: string;
  correctionSummary: string;
}

/**
 * 사주 계산을 위한 종합 시간 보정
 */
export const getCorrectedTimeForSaju = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number = 126.978,
  zasiMode: ZasiMode = 'unified',
  applyTrueSolarTime: boolean = true
): CorrectedTimeResult => {
  const originalDate = new Date(year, month - 1, day, hour, minute);

  // 1. 진태양시 계산
  const trueSolarTime = calculateTrueSolarTime(originalDate, longitude, true);

  // 2. 보정된 시간 추출
  const correctedTime = applyTrueSolarTime ? trueSolarTime.trueSolarTime : originalDate;
  const finalHour = correctedTime.getHours() + correctedTime.getMinutes() / 60;

  // 3. 야자시/조자시 처리
  const zasiResult = adjustDateForZasi(correctedTime, Math.floor(finalHour), zasiMode);

  // 4. 시주 지지 결정
  const hourBranch = getHourBranch(Math.floor(finalHour));

  // 5. 보정 요약
  const summaryParts = [];
  if (applyTrueSolarTime && Math.abs(trueSolarTime.totalCorrection) >= 1) {
    summaryParts.push(`진태양시 보정 ${trueSolarTime.totalCorrection > 0 ? '+' : ''}${trueSolarTime.totalCorrection}분`);
  }
  if (zasiResult.dayChanged) {
    summaryParts.push(`자시 처리로 날짜 변경`);
  }

  return {
    originalDate,
    trueSolarTime,
    adjustedForZasi: {
      date: zasiResult.adjustedDate,
      dayChanged: zasiResult.dayChanged
    },
    finalHour: Math.floor(finalHour),
    hourBranch,
    correctionSummary: summaryParts.length > 0 ? summaryParts.join(', ') : '보정 없음'
  };
};
