/**
 * 절입일 데이터 (1900-2100년)
 *
 * 24절기 중 절입일 (월이 바뀌는 기준):
 * 1월(인월) = 입춘, 2월(묘월) = 경칩, 3월(진월) = 청명,
 * 4월(사월) = 입하, 5월(오월) = 망종, 6월(미월) = 소서,
 * 7월(신월) = 입추, 8월(유월) = 백로, 9월(술월) = 한로,
 * 10월(해월) = 입동, 11월(자월) = 대설, 12월(축월) = 소한
 */

export interface JeolipInfo {
  year: number;
  month: number;           // 양력 월
  solarTermName: string;   // 절기 이름
  datetime: string;        // ISO 8601 형식
  sajuMonth: number;       // 사주력 월 (인월=1, 묘월=2, ...)
}

// 절기 이름과 사주력 월 매핑
export const SOLAR_TERM_TO_SAJU_MONTH: Record<string, number> = {
  '입춘': 1,   // 인월
  '경칩': 2,   // 묘월
  '청명': 3,   // 진월
  '입하': 4,   // 사월
  '망종': 5,   // 오월
  '소서': 6,   // 미월
  '입추': 7,   // 신월
  '백로': 8,   // 유월
  '한로': 9,   // 술월
  '입동': 10,  // 해월
  '대설': 11,  // 자월
  '소한': 12,  // 축월
};

// 양력 월 → 해당 월의 절기
export const MONTH_TO_SOLAR_TERM: Record<number, string> = {
  1: '소한',
  2: '입춘',
  3: '경칩',
  4: '청명',
  5: '입하',
  6: '망종',
  7: '소서',
  8: '입추',
  9: '백로',
  10: '한로',
  11: '입동',
  12: '대설',
};

/**
 * 절입일 데이터 (주요 연도)
 * 실제 서비스에서는 DB 또는 API에서 조회
 * 여기서는 2020-2030년 데이터만 포함
 */
export const JEOLIP_DATA: JeolipInfo[] = [
  // 2024년
  { year: 2024, month: 1, solarTermName: '소한', datetime: '2024-01-06T04:49:00+09:00', sajuMonth: 12 },
  { year: 2024, month: 2, solarTermName: '입춘', datetime: '2024-02-04T16:27:00+09:00', sajuMonth: 1 },
  { year: 2024, month: 3, solarTermName: '경칩', datetime: '2024-03-05T10:23:00+09:00', sajuMonth: 2 },
  { year: 2024, month: 4, solarTermName: '청명', datetime: '2024-04-04T15:02:00+09:00', sajuMonth: 3 },
  { year: 2024, month: 5, solarTermName: '입하', datetime: '2024-05-05T08:10:00+09:00', sajuMonth: 4 },
  { year: 2024, month: 6, solarTermName: '망종', datetime: '2024-06-05T12:10:00+09:00', sajuMonth: 5 },
  { year: 2024, month: 7, solarTermName: '소서', datetime: '2024-07-06T22:20:00+09:00', sajuMonth: 6 },
  { year: 2024, month: 8, solarTermName: '입추', datetime: '2024-08-07T08:09:00+09:00', sajuMonth: 7 },
  { year: 2024, month: 9, solarTermName: '백로', datetime: '2024-09-07T11:11:00+09:00', sajuMonth: 8 },
  { year: 2024, month: 10, solarTermName: '한로', datetime: '2024-10-08T03:00:00+09:00', sajuMonth: 9 },
  { year: 2024, month: 11, solarTermName: '입동', datetime: '2024-11-07T06:20:00+09:00', sajuMonth: 10 },
  { year: 2024, month: 12, solarTermName: '대설', datetime: '2024-12-07T00:17:00+09:00', sajuMonth: 11 },

  // 2025년
  { year: 2025, month: 1, solarTermName: '소한', datetime: '2025-01-05T10:33:00+09:00', sajuMonth: 12 },
  { year: 2025, month: 2, solarTermName: '입춘', datetime: '2025-02-03T22:10:00+09:00', sajuMonth: 1 },
  { year: 2025, month: 3, solarTermName: '경칩', datetime: '2025-03-05T16:07:00+09:00', sajuMonth: 2 },
  { year: 2025, month: 4, solarTermName: '청명', datetime: '2025-04-04T20:48:00+09:00', sajuMonth: 3 },
  { year: 2025, month: 5, solarTermName: '입하', datetime: '2025-05-05T13:57:00+09:00', sajuMonth: 4 },
  { year: 2025, month: 6, solarTermName: '망종', datetime: '2025-06-05T17:56:00+09:00', sajuMonth: 5 },
  { year: 2025, month: 7, solarTermName: '소서', datetime: '2025-07-07T04:05:00+09:00', sajuMonth: 6 },
  { year: 2025, month: 8, solarTermName: '입추', datetime: '2025-08-07T13:51:00+09:00', sajuMonth: 7 },
  { year: 2025, month: 9, solarTermName: '백로', datetime: '2025-09-07T16:52:00+09:00', sajuMonth: 8 },
  { year: 2025, month: 10, solarTermName: '한로', datetime: '2025-10-08T08:41:00+09:00', sajuMonth: 9 },
  { year: 2025, month: 11, solarTermName: '입동', datetime: '2025-11-07T12:04:00+09:00', sajuMonth: 10 },
  { year: 2025, month: 12, solarTermName: '대설', datetime: '2025-12-07T06:05:00+09:00', sajuMonth: 11 },

  // 2026년
  { year: 2026, month: 1, solarTermName: '소한', datetime: '2026-01-05T16:23:00+09:00', sajuMonth: 12 },
  { year: 2026, month: 2, solarTermName: '입춘', datetime: '2026-02-04T04:02:00+09:00', sajuMonth: 1 },
  { year: 2026, month: 3, solarTermName: '경칩', datetime: '2026-03-05T21:59:00+09:00', sajuMonth: 2 },
  { year: 2026, month: 4, solarTermName: '청명', datetime: '2026-04-05T02:40:00+09:00', sajuMonth: 3 },
  { year: 2026, month: 5, solarTermName: '입하', datetime: '2026-05-05T19:49:00+09:00', sajuMonth: 4 },
  { year: 2026, month: 6, solarTermName: '망종', datetime: '2026-06-05T23:48:00+09:00', sajuMonth: 5 },
  { year: 2026, month: 7, solarTermName: '소서', datetime: '2026-07-07T09:57:00+09:00', sajuMonth: 6 },
  { year: 2026, month: 8, solarTermName: '입추', datetime: '2026-08-07T19:42:00+09:00', sajuMonth: 7 },
  { year: 2026, month: 9, solarTermName: '백로', datetime: '2026-09-07T22:41:00+09:00', sajuMonth: 8 },
  { year: 2026, month: 10, solarTermName: '한로', datetime: '2026-10-08T14:29:00+09:00', sajuMonth: 9 },
  { year: 2026, month: 11, solarTermName: '입동', datetime: '2026-11-07T17:52:00+09:00', sajuMonth: 10 },
  { year: 2026, month: 12, solarTermName: '대설', datetime: '2026-12-07T11:52:00+09:00', sajuMonth: 11 },

  // 2027년
  { year: 2027, month: 1, solarTermName: '소한', datetime: '2027-01-05T22:10:00+09:00', sajuMonth: 12 },
  { year: 2027, month: 2, solarTermName: '입춘', datetime: '2027-02-04T09:46:00+09:00', sajuMonth: 1 },
  { year: 2027, month: 3, solarTermName: '경칩', datetime: '2027-03-06T03:39:00+09:00', sajuMonth: 2 },
  { year: 2027, month: 4, solarTermName: '청명', datetime: '2027-04-05T08:17:00+09:00', sajuMonth: 3 },
  { year: 2027, month: 5, solarTermName: '입하', datetime: '2027-05-06T01:25:00+09:00', sajuMonth: 4 },
  { year: 2027, month: 6, solarTermName: '망종', datetime: '2027-06-06T05:26:00+09:00', sajuMonth: 5 },
  { year: 2027, month: 7, solarTermName: '소서', datetime: '2027-07-07T15:37:00+09:00', sajuMonth: 6 },
  { year: 2027, month: 8, solarTermName: '입추', datetime: '2027-08-08T01:26:00+09:00', sajuMonth: 7 },
  { year: 2027, month: 9, solarTermName: '백로', datetime: '2027-09-08T04:28:00+09:00', sajuMonth: 8 },
  { year: 2027, month: 10, solarTermName: '한로', datetime: '2027-10-08T20:15:00+09:00', sajuMonth: 9 },
  { year: 2027, month: 11, solarTermName: '입동', datetime: '2027-11-07T23:38:00+09:00', sajuMonth: 10 },
  { year: 2027, month: 12, solarTermName: '대설', datetime: '2027-12-07T17:38:00+09:00', sajuMonth: 11 },

  // 1992년 (테스트용)
  { year: 1992, month: 1, solarTermName: '소한', datetime: '1992-01-06T09:09:00+09:00', sajuMonth: 12 },
  { year: 1992, month: 2, solarTermName: '입춘', datetime: '1992-02-04T21:48:00+09:00', sajuMonth: 1 },
  { year: 1992, month: 3, solarTermName: '경칩', datetime: '1992-03-05T15:43:00+09:00', sajuMonth: 2 },
  { year: 1992, month: 4, solarTermName: '청명', datetime: '1992-04-04T20:43:00+09:00', sajuMonth: 3 },
  { year: 1992, month: 5, solarTermName: '입하', datetime: '1992-05-05T14:10:00+09:00', sajuMonth: 4 },
  { year: 1992, month: 6, solarTermName: '망종', datetime: '1992-06-05T18:26:00+09:00', sajuMonth: 5 },
  { year: 1992, month: 7, solarTermName: '소서', datetime: '1992-07-07T04:51:00+09:00', sajuMonth: 6 },
  { year: 1992, month: 8, solarTermName: '입추', datetime: '1992-08-07T14:46:00+09:00', sajuMonth: 7 },
  { year: 1992, month: 9, solarTermName: '백로', datetime: '1992-09-07T17:44:00+09:00', sajuMonth: 8 },
  { year: 1992, month: 10, solarTermName: '한로', datetime: '1992-10-08T09:20:00+09:00', sajuMonth: 9 },
  { year: 1992, month: 11, solarTermName: '입동', datetime: '1992-11-07T12:26:00+09:00', sajuMonth: 10 },
  { year: 1992, month: 12, solarTermName: '대설', datetime: '1992-12-07T05:59:00+09:00', sajuMonth: 11 },
];

/**
 * 특정 연월의 절입일 조회
 */
export function getJeolipInfo(year: number, month: number): JeolipInfo | null {
  return JEOLIP_DATA.find(j => j.year === year && j.month === month) || null;
}

/**
 * 주어진 날짜가 해당 월의 절입일 이전인지 확인
 * @returns true면 절입일 이전 (전월로 처리해야 함)
 */
export function isBeforeJeolip(dateString: string, jeolipDatetime: string): boolean {
  const targetDate = new Date(dateString);
  const jeolipDate = new Date(jeolipDatetime);
  return targetDate < jeolipDate;
}

/**
 * 주어진 날짜의 실제 사주력 월 계산
 * @returns { year: 사주력 연도, month: 사주력 월 (1-12, 인월=1) }
 */
export function getSajuYearMonth(dateString: string): { year: number; month: number } {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed → 1-indexed

  // 해당 월의 절입일 조회
  const jeolip = getJeolipInfo(year, month);

  if (!jeolip) {
    // 데이터가 없으면 간이 계산 (절입일 ≈ 매월 4-8일)
    const day = date.getDate();
    const estimatedJeolipDay = month === 2 ? 4 : (month <= 7 ? 5 : 7);

    if (day < estimatedJeolipDay) {
      // 절입일 이전 → 전월
      if (month === 1) {
        // 1월 소한 이전 → 전년도 12월(축월)
        return { year: year - 1, month: 12 };
      } else if (month === 2) {
        // 2월 입춘 이전 → 전년도 12월(축월) (사주력 연도도 전년)
        return { year: year - 1, month: 12 };
      } else {
        // 다른 월 절입 이전 → 전월
        return { year, month: SOLAR_TERM_TO_SAJU_MONTH[MONTH_TO_SOLAR_TERM[month - 1]] };
      }
    }

    return { year, month: SOLAR_TERM_TO_SAJU_MONTH[MONTH_TO_SOLAR_TERM[month]] };
  }

  // 절입일 비교
  if (isBeforeJeolip(dateString, jeolip.datetime)) {
    // 절입일 이전
    if (month === 1) {
      // 1월 소한 이전 → 전년도 11월(자월)
      return { year: year - 1, month: 11 };
    } else if (month === 2) {
      // 2월 입춘 이전 → 전년도 12월(축월)
      return { year: year - 1, month: 12 };
    } else {
      // 다른 월 → 전월
      const prevMonth = month - 1;
      const prevJeolip = getJeolipInfo(year, prevMonth);
      return {
        year,
        month: prevJeolip ? prevJeolip.sajuMonth : SOLAR_TERM_TO_SAJU_MONTH[MONTH_TO_SOLAR_TERM[prevMonth]]
      };
    }
  }

  return { year, month: jeolip.sajuMonth };
}
