/**
 * 절입일 데이터 (1920-2050년)
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
 * 절입일 데이터 (1920-2050년)
 * lunar-javascript 패키지로 천문학적 계산하여 생성
 * 생성 스크립트: scripts/generate-jeolip.js
 */
export const JEOLIP_DATA: JeolipInfo[] = [
  // 1920년
  { year: 1920, month: 1, solarTermName: '소한', datetime: '1920-01-06T22:40:00+09:00', sajuMonth: 12 },
  { year: 1920, month: 2, solarTermName: '입춘', datetime: '1920-02-05T10:26:00+09:00', sajuMonth: 1 },
  { year: 1920, month: 3, solarTermName: '경칩', datetime: '1920-03-06T04:51:00+09:00', sajuMonth: 2 },
  { year: 1920, month: 4, solarTermName: '청명', datetime: '1920-04-05T10:14:00+09:00', sajuMonth: 3 },
  { year: 1920, month: 5, solarTermName: '입하', datetime: '1920-05-06T04:11:00+09:00', sajuMonth: 4 },
  { year: 1920, month: 6, solarTermName: '망종', datetime: '1920-06-06T08:50:00+09:00', sajuMonth: 5 },
  { year: 1920, month: 7, solarTermName: '소서', datetime: '1920-07-07T19:18:00+09:00', sajuMonth: 6 },
  { year: 1920, month: 8, solarTermName: '입추', datetime: '1920-08-08T04:58:00+09:00', sajuMonth: 7 },
  { year: 1920, month: 9, solarTermName: '백로', datetime: '1920-09-08T07:26:00+09:00', sajuMonth: 8 },
  { year: 1920, month: 10, solarTermName: '한로', datetime: '1920-10-08T22:29:00+09:00', sajuMonth: 9 },
  { year: 1920, month: 11, solarTermName: '입동', datetime: '1920-11-08T01:04:00+09:00', sajuMonth: 10 },
  { year: 1920, month: 12, solarTermName: '대설', datetime: '1920-12-07T17:30:00+09:00', sajuMonth: 11 },

  // 1921년
  { year: 1921, month: 1, solarTermName: '소한', datetime: '1921-01-06T04:33:00+09:00', sajuMonth: 12 },
  { year: 1921, month: 2, solarTermName: '입춘', datetime: '1921-02-04T16:20:00+09:00', sajuMonth: 1 },
  { year: 1921, month: 3, solarTermName: '경칩', datetime: '1921-03-06T10:45:00+09:00', sajuMonth: 2 },
  { year: 1921, month: 4, solarTermName: '청명', datetime: '1921-04-05T16:08:00+09:00', sajuMonth: 3 },
  { year: 1921, month: 5, solarTermName: '입하', datetime: '1921-05-06T10:04:00+09:00', sajuMonth: 4 },
  { year: 1921, month: 6, solarTermName: '망종', datetime: '1921-06-06T14:41:00+09:00', sajuMonth: 5 },
  { year: 1921, month: 7, solarTermName: '소서', datetime: '1921-07-08T01:06:00+09:00', sajuMonth: 6 },
  { year: 1921, month: 8, solarTermName: '입추', datetime: '1921-08-08T10:43:00+09:00', sajuMonth: 7 },
  { year: 1921, month: 9, solarTermName: '백로', datetime: '1921-09-08T13:09:00+09:00', sajuMonth: 8 },
  { year: 1921, month: 10, solarTermName: '한로', datetime: '1921-10-09T04:10:00+09:00', sajuMonth: 9 },
  { year: 1921, month: 11, solarTermName: '입동', datetime: '1921-11-08T06:45:00+09:00', sajuMonth: 10 },
  { year: 1921, month: 12, solarTermName: '대설', datetime: '1921-12-07T23:11:00+09:00', sajuMonth: 11 },

  // 1922년
  { year: 1922, month: 1, solarTermName: '소한', datetime: '1922-01-06T10:16:00+09:00', sajuMonth: 12 },
  { year: 1922, month: 2, solarTermName: '입춘', datetime: '1922-02-04T22:06:00+09:00', sajuMonth: 1 },
  { year: 1922, month: 3, solarTermName: '경칩', datetime: '1922-03-06T16:33:00+09:00', sajuMonth: 2 },
  { year: 1922, month: 4, solarTermName: '청명', datetime: '1922-04-05T21:58:00+09:00', sajuMonth: 3 },
  { year: 1922, month: 5, solarTermName: '입하', datetime: '1922-05-06T15:52:00+09:00', sajuMonth: 4 },
  { year: 1922, month: 6, solarTermName: '망종', datetime: '1922-06-06T20:30:00+09:00', sajuMonth: 5 },
  { year: 1922, month: 7, solarTermName: '소서', datetime: '1922-07-08T06:57:00+09:00', sajuMonth: 6 },
  { year: 1922, month: 8, solarTermName: '입추', datetime: '1922-08-08T16:37:00+09:00', sajuMonth: 7 },
  { year: 1922, month: 9, solarTermName: '백로', datetime: '1922-09-08T19:06:00+09:00', sajuMonth: 8 },
  { year: 1922, month: 10, solarTermName: '한로', datetime: '1922-10-09T10:09:00+09:00', sajuMonth: 9 },
  { year: 1922, month: 11, solarTermName: '입동', datetime: '1922-11-08T12:45:00+09:00', sajuMonth: 10 },
  { year: 1922, month: 12, solarTermName: '대설', datetime: '1922-12-08T05:10:00+09:00', sajuMonth: 11 },

  // 1923년
  { year: 1923, month: 1, solarTermName: '소한', datetime: '1923-01-06T16:14:00+09:00', sajuMonth: 12 },
  { year: 1923, month: 2, solarTermName: '입춘', datetime: '1923-02-05T04:00:00+09:00', sajuMonth: 1 },
  { year: 1923, month: 3, solarTermName: '경칩', datetime: '1923-03-06T22:24:00+09:00', sajuMonth: 2 },
  { year: 1923, month: 4, solarTermName: '청명', datetime: '1923-04-06T03:45:00+09:00', sajuMonth: 3 },
  { year: 1923, month: 5, solarTermName: '입하', datetime: '1923-05-06T21:38:00+09:00', sajuMonth: 4 },
  { year: 1923, month: 6, solarTermName: '망종', datetime: '1923-06-07T02:14:00+09:00', sajuMonth: 5 },
  { year: 1923, month: 7, solarTermName: '소서', datetime: '1923-07-08T12:42:00+09:00', sajuMonth: 6 },
  { year: 1923, month: 8, solarTermName: '입추', datetime: '1923-08-08T22:24:00+09:00', sajuMonth: 7 },
  { year: 1923, month: 9, solarTermName: '백로', datetime: '1923-09-09T00:57:00+09:00', sajuMonth: 8 },
  { year: 1923, month: 10, solarTermName: '한로', datetime: '1923-10-09T16:03:00+09:00', sajuMonth: 9 },
  { year: 1923, month: 11, solarTermName: '입동', datetime: '1923-11-08T18:40:00+09:00', sajuMonth: 10 },
  { year: 1923, month: 12, solarTermName: '대설', datetime: '1923-12-08T11:04:00+09:00', sajuMonth: 11 },

  // 1924년
  { year: 1924, month: 1, solarTermName: '소한', datetime: '1924-01-06T22:05:00+09:00', sajuMonth: 12 },
  { year: 1924, month: 2, solarTermName: '입춘', datetime: '1924-02-05T09:49:00+09:00', sajuMonth: 1 },
  { year: 1924, month: 3, solarTermName: '경칩', datetime: '1924-03-06T04:12:00+09:00', sajuMonth: 2 },
  { year: 1924, month: 4, solarTermName: '청명', datetime: '1924-04-05T09:33:00+09:00', sajuMonth: 3 },
  { year: 1924, month: 5, solarTermName: '입하', datetime: '1924-05-06T03:25:00+09:00', sajuMonth: 4 },
  { year: 1924, month: 6, solarTermName: '망종', datetime: '1924-06-06T08:01:00+09:00', sajuMonth: 5 },
  { year: 1924, month: 7, solarTermName: '소서', datetime: '1924-07-07T18:29:00+09:00', sajuMonth: 6 },
  { year: 1924, month: 8, solarTermName: '입추', datetime: '1924-08-08T04:12:00+09:00', sajuMonth: 7 },
  { year: 1924, month: 9, solarTermName: '백로', datetime: '1924-09-08T06:45:00+09:00', sajuMonth: 8 },
  { year: 1924, month: 10, solarTermName: '한로', datetime: '1924-10-08T21:52:00+09:00', sajuMonth: 9 },
  { year: 1924, month: 11, solarTermName: '입동', datetime: '1924-11-08T00:29:00+09:00', sajuMonth: 10 },
  { year: 1924, month: 12, solarTermName: '대설', datetime: '1924-12-07T16:52:00+09:00', sajuMonth: 11 },

  // 1925년
  { year: 1925, month: 1, solarTermName: '소한', datetime: '1925-01-06T03:53:00+09:00', sajuMonth: 12 },
  { year: 1925, month: 2, solarTermName: '입춘', datetime: '1925-02-04T15:36:00+09:00', sajuMonth: 1 },
  { year: 1925, month: 3, solarTermName: '경칩', datetime: '1925-03-06T09:59:00+09:00', sajuMonth: 2 },
  { year: 1925, month: 4, solarTermName: '청명', datetime: '1925-04-05T15:22:00+09:00', sajuMonth: 3 },
  { year: 1925, month: 5, solarTermName: '입하', datetime: '1925-05-06T09:17:00+09:00', sajuMonth: 4 },
  { year: 1925, month: 6, solarTermName: '망종', datetime: '1925-06-06T13:56:00+09:00', sajuMonth: 5 },
  { year: 1925, month: 7, solarTermName: '소서', datetime: '1925-07-08T00:24:00+09:00', sajuMonth: 6 },
  { year: 1925, month: 8, solarTermName: '입추', datetime: '1925-08-08T10:07:00+09:00', sajuMonth: 7 },
  { year: 1925, month: 9, solarTermName: '백로', datetime: '1925-09-08T12:40:00+09:00', sajuMonth: 8 },
  { year: 1925, month: 10, solarTermName: '한로', datetime: '1925-10-09T03:47:00+09:00', sajuMonth: 9 },
  { year: 1925, month: 11, solarTermName: '입동', datetime: '1925-11-08T06:26:00+09:00', sajuMonth: 10 },
  { year: 1925, month: 12, solarTermName: '대설', datetime: '1925-12-07T22:52:00+09:00', sajuMonth: 11 },

  // 1926년
  { year: 1926, month: 1, solarTermName: '소한', datetime: '1926-01-06T09:54:00+09:00', sajuMonth: 12 },
  { year: 1926, month: 2, solarTermName: '입춘', datetime: '1926-02-04T21:38:00+09:00', sajuMonth: 1 },
  { year: 1926, month: 3, solarTermName: '경칩', datetime: '1926-03-06T15:59:00+09:00', sajuMonth: 2 },
  { year: 1926, month: 4, solarTermName: '청명', datetime: '1926-04-05T21:18:00+09:00', sajuMonth: 3 },
  { year: 1926, month: 5, solarTermName: '입하', datetime: '1926-05-06T15:08:00+09:00', sajuMonth: 4 },
  { year: 1926, month: 6, solarTermName: '망종', datetime: '1926-06-06T19:41:00+09:00', sajuMonth: 5 },
  { year: 1926, month: 7, solarTermName: '소서', datetime: '1926-07-08T06:05:00+09:00', sajuMonth: 6 },
  { year: 1926, month: 8, solarTermName: '입추', datetime: '1926-08-08T15:44:00+09:00', sajuMonth: 7 },
  { year: 1926, month: 9, solarTermName: '백로', datetime: '1926-09-08T18:15:00+09:00', sajuMonth: 8 },
  { year: 1926, month: 10, solarTermName: '한로', datetime: '1926-10-09T09:24:00+09:00', sajuMonth: 9 },
  { year: 1926, month: 11, solarTermName: '입동', datetime: '1926-11-08T12:07:00+09:00', sajuMonth: 10 },
  { year: 1926, month: 12, solarTermName: '대설', datetime: '1926-12-08T04:38:00+09:00', sajuMonth: 11 },

  // 1927년
  { year: 1927, month: 1, solarTermName: '소한', datetime: '1927-01-06T15:44:00+09:00', sajuMonth: 12 },
  { year: 1927, month: 2, solarTermName: '입춘', datetime: '1927-02-05T03:30:00+09:00', sajuMonth: 1 },
  { year: 1927, month: 3, solarTermName: '경칩', datetime: '1927-03-06T21:50:00+09:00', sajuMonth: 2 },
  { year: 1927, month: 4, solarTermName: '청명', datetime: '1927-04-06T03:06:00+09:00', sajuMonth: 3 },
  { year: 1927, month: 5, solarTermName: '입하', datetime: '1927-05-06T20:53:00+09:00', sajuMonth: 4 },
  { year: 1927, month: 6, solarTermName: '망종', datetime: '1927-06-07T01:24:00+09:00', sajuMonth: 5 },
  { year: 1927, month: 7, solarTermName: '소서', datetime: '1927-07-08T11:49:00+09:00', sajuMonth: 6 },
  { year: 1927, month: 8, solarTermName: '입추', datetime: '1927-08-08T21:31:00+09:00', sajuMonth: 7 },
  { year: 1927, month: 9, solarTermName: '백로', datetime: '1927-09-09T00:05:00+09:00', sajuMonth: 8 },
  { year: 1927, month: 10, solarTermName: '한로', datetime: '1927-10-09T15:15:00+09:00', sajuMonth: 9 },
  { year: 1927, month: 11, solarTermName: '입동', datetime: '1927-11-08T17:56:00+09:00', sajuMonth: 10 },
  { year: 1927, month: 12, solarTermName: '대설', datetime: '1927-12-08T10:26:00+09:00', sajuMonth: 11 },

  // 1928년
  { year: 1928, month: 1, solarTermName: '소한', datetime: '1928-01-06T21:31:00+09:00', sajuMonth: 12 },
  { year: 1928, month: 2, solarTermName: '입춘', datetime: '1928-02-05T09:16:00+09:00', sajuMonth: 1 },
  { year: 1928, month: 3, solarTermName: '경칩', datetime: '1928-03-06T03:37:00+09:00', sajuMonth: 2 },
  { year: 1928, month: 4, solarTermName: '청명', datetime: '1928-04-05T08:54:00+09:00', sajuMonth: 3 },
  { year: 1928, month: 5, solarTermName: '입하', datetime: '1928-05-06T02:43:00+09:00', sajuMonth: 4 },
  { year: 1928, month: 6, solarTermName: '망종', datetime: '1928-06-06T07:17:00+09:00', sajuMonth: 5 },
  { year: 1928, month: 7, solarTermName: '소서', datetime: '1928-07-07T17:44:00+09:00', sajuMonth: 6 },
  { year: 1928, month: 8, solarTermName: '입추', datetime: '1928-08-08T03:27:00+09:00', sajuMonth: 7 },
  { year: 1928, month: 9, solarTermName: '백로', datetime: '1928-09-08T06:01:00+09:00', sajuMonth: 8 },
  { year: 1928, month: 10, solarTermName: '한로', datetime: '1928-10-08T21:09:00+09:00', sajuMonth: 9 },
  { year: 1928, month: 11, solarTermName: '입동', datetime: '1928-11-07T23:49:00+09:00', sajuMonth: 10 },
  { year: 1928, month: 12, solarTermName: '대설', datetime: '1928-12-07T16:17:00+09:00', sajuMonth: 11 },

  // 1929년
  { year: 1929, month: 1, solarTermName: '소한', datetime: '1929-01-06T03:22:00+09:00', sajuMonth: 12 },
  { year: 1929, month: 2, solarTermName: '입춘', datetime: '1929-02-04T15:08:00+09:00', sajuMonth: 1 },
  { year: 1929, month: 3, solarTermName: '경칩', datetime: '1929-03-06T09:31:00+09:00', sajuMonth: 2 },
  { year: 1929, month: 4, solarTermName: '청명', datetime: '1929-04-05T14:51:00+09:00', sajuMonth: 3 },
  { year: 1929, month: 5, solarTermName: '입하', datetime: '1929-05-06T08:40:00+09:00', sajuMonth: 4 },
  { year: 1929, month: 6, solarTermName: '망종', datetime: '1929-06-06T13:10:00+09:00', sajuMonth: 5 },
  { year: 1929, month: 7, solarTermName: '소서', datetime: '1929-07-07T23:31:00+09:00', sajuMonth: 6 },
  { year: 1929, month: 8, solarTermName: '입추', datetime: '1929-08-08T09:08:00+09:00', sajuMonth: 7 },
  { year: 1929, month: 9, solarTermName: '백로', datetime: '1929-09-08T11:39:00+09:00', sajuMonth: 8 },
  { year: 1929, month: 10, solarTermName: '한로', datetime: '1929-10-09T02:47:00+09:00', sajuMonth: 9 },
  { year: 1929, month: 11, solarTermName: '입동', datetime: '1929-11-08T05:27:00+09:00', sajuMonth: 10 },
  { year: 1929, month: 12, solarTermName: '대설', datetime: '1929-12-07T21:56:00+09:00', sajuMonth: 11 },

  // 1930년
  { year: 1930, month: 1, solarTermName: '소한', datetime: '1930-01-06T09:02:00+09:00', sajuMonth: 12 },
  { year: 1930, month: 2, solarTermName: '입춘', datetime: '1930-02-04T20:51:00+09:00', sajuMonth: 1 },
  { year: 1930, month: 3, solarTermName: '경칩', datetime: '1930-03-06T15:16:00+09:00', sajuMonth: 2 },
  { year: 1930, month: 4, solarTermName: '청명', datetime: '1930-04-05T20:37:00+09:00', sajuMonth: 3 },
  { year: 1930, month: 5, solarTermName: '입하', datetime: '1930-05-06T14:26:00+09:00', sajuMonth: 4 },
  { year: 1930, month: 6, solarTermName: '망종', datetime: '1930-06-06T18:58:00+09:00', sajuMonth: 5 },
  { year: 1930, month: 7, solarTermName: '소서', datetime: '1930-07-08T05:19:00+09:00', sajuMonth: 6 },
  { year: 1930, month: 8, solarTermName: '입추', datetime: '1930-08-08T14:56:00+09:00', sajuMonth: 7 },
  { year: 1930, month: 9, solarTermName: '백로', datetime: '1930-09-08T17:28:00+09:00', sajuMonth: 8 },
  { year: 1930, month: 10, solarTermName: '한로', datetime: '1930-10-09T08:37:00+09:00', sajuMonth: 9 },
  { year: 1930, month: 11, solarTermName: '입동', datetime: '1930-11-08T11:20:00+09:00', sajuMonth: 10 },
  { year: 1930, month: 12, solarTermName: '대설', datetime: '1930-12-08T03:50:00+09:00', sajuMonth: 11 },

  // 1931년
  { year: 1931, month: 1, solarTermName: '소한', datetime: '1931-01-06T14:55:00+09:00', sajuMonth: 12 },
  { year: 1931, month: 2, solarTermName: '입춘', datetime: '1931-02-05T02:40:00+09:00', sajuMonth: 1 },
  { year: 1931, month: 3, solarTermName: '경칩', datetime: '1931-03-06T21:02:00+09:00', sajuMonth: 2 },
  { year: 1931, month: 4, solarTermName: '청명', datetime: '1931-04-06T02:20:00+09:00', sajuMonth: 3 },
  { year: 1931, month: 5, solarTermName: '입하', datetime: '1931-05-06T20:09:00+09:00', sajuMonth: 4 },
  { year: 1931, month: 6, solarTermName: '망종', datetime: '1931-06-07T00:41:00+09:00', sajuMonth: 5 },
  { year: 1931, month: 7, solarTermName: '소서', datetime: '1931-07-08T11:05:00+09:00', sajuMonth: 6 },
  { year: 1931, month: 8, solarTermName: '입추', datetime: '1931-08-08T20:44:00+09:00', sajuMonth: 7 },
  { year: 1931, month: 9, solarTermName: '백로', datetime: '1931-09-08T23:17:00+09:00', sajuMonth: 8 },
  { year: 1931, month: 10, solarTermName: '한로', datetime: '1931-10-09T14:26:00+09:00', sajuMonth: 9 },
  { year: 1931, month: 11, solarTermName: '입동', datetime: '1931-11-08T17:09:00+09:00', sajuMonth: 10 },
  { year: 1931, month: 12, solarTermName: '대설', datetime: '1931-12-08T09:40:00+09:00', sajuMonth: 11 },

  // 1932년
  { year: 1932, month: 1, solarTermName: '소한', datetime: '1932-01-06T20:45:00+09:00', sajuMonth: 12 },
  { year: 1932, month: 2, solarTermName: '입춘', datetime: '1932-02-05T08:29:00+09:00', sajuMonth: 1 },
  { year: 1932, month: 3, solarTermName: '경칩', datetime: '1932-03-06T02:49:00+09:00', sajuMonth: 2 },
  { year: 1932, month: 4, solarTermName: '청명', datetime: '1932-04-05T08:06:00+09:00', sajuMonth: 3 },
  { year: 1932, month: 5, solarTermName: '입하', datetime: '1932-05-06T01:55:00+09:00', sajuMonth: 4 },
  { year: 1932, month: 6, solarTermName: '망종', datetime: '1932-06-06T06:27:00+09:00', sajuMonth: 5 },
  { year: 1932, month: 7, solarTermName: '소서', datetime: '1932-07-07T16:52:00+09:00', sajuMonth: 6 },
  { year: 1932, month: 8, solarTermName: '입추', datetime: '1932-08-08T02:31:00+09:00', sajuMonth: 7 },
  { year: 1932, month: 9, solarTermName: '백로', datetime: '1932-09-08T05:02:00+09:00', sajuMonth: 8 },
  { year: 1932, month: 10, solarTermName: '한로', datetime: '1932-10-08T20:09:00+09:00', sajuMonth: 9 },
  { year: 1932, month: 11, solarTermName: '입동', datetime: '1932-11-07T22:49:00+09:00', sajuMonth: 10 },
  { year: 1932, month: 12, solarTermName: '대설', datetime: '1932-12-07T15:18:00+09:00', sajuMonth: 11 },

  // 1933년
  { year: 1933, month: 1, solarTermName: '소한', datetime: '1933-01-06T02:23:00+09:00', sajuMonth: 12 },
  { year: 1933, month: 2, solarTermName: '입춘', datetime: '1933-02-04T14:09:00+09:00', sajuMonth: 1 },
  { year: 1933, month: 3, solarTermName: '경칩', datetime: '1933-03-06T08:31:00+09:00', sajuMonth: 2 },
  { year: 1933, month: 4, solarTermName: '청명', datetime: '1933-04-05T13:50:00+09:00', sajuMonth: 3 },
  { year: 1933, month: 5, solarTermName: '입하', datetime: '1933-05-06T07:41:00+09:00', sajuMonth: 4 },
  { year: 1933, month: 6, solarTermName: '망종', datetime: '1933-06-06T12:17:00+09:00', sajuMonth: 5 },
  { year: 1933, month: 7, solarTermName: '소서', datetime: '1933-07-07T22:44:00+09:00', sajuMonth: 6 },
  { year: 1933, month: 8, solarTermName: '입추', datetime: '1933-08-08T08:25:00+09:00', sajuMonth: 7 },
  { year: 1933, month: 9, solarTermName: '백로', datetime: '1933-09-08T10:57:00+09:00', sajuMonth: 8 },
  { year: 1933, month: 10, solarTermName: '한로', datetime: '1933-10-09T02:03:00+09:00', sajuMonth: 9 },
  { year: 1933, month: 11, solarTermName: '입동', datetime: '1933-11-08T04:42:00+09:00', sajuMonth: 10 },
  { year: 1933, month: 12, solarTermName: '대설', datetime: '1933-12-07T21:11:00+09:00', sajuMonth: 11 },

  // 1934년
  { year: 1934, month: 1, solarTermName: '소한', datetime: '1934-01-06T08:16:00+09:00', sajuMonth: 12 },
  { year: 1934, month: 2, solarTermName: '입춘', datetime: '1934-02-04T20:03:00+09:00', sajuMonth: 1 },
  { year: 1934, month: 3, solarTermName: '경칩', datetime: '1934-03-06T14:26:00+09:00', sajuMonth: 2 },
  { year: 1934, month: 4, solarTermName: '청명', datetime: '1934-04-05T19:43:00+09:00', sajuMonth: 3 },
  { year: 1934, month: 5, solarTermName: '입하', datetime: '1934-05-06T13:30:00+09:00', sajuMonth: 4 },
  { year: 1934, month: 6, solarTermName: '망종', datetime: '1934-06-06T18:01:00+09:00', sajuMonth: 5 },
  { year: 1934, month: 7, solarTermName: '소서', datetime: '1934-07-08T04:24:00+09:00', sajuMonth: 6 },
  { year: 1934, month: 8, solarTermName: '입추', datetime: '1934-08-08T14:03:00+09:00', sajuMonth: 7 },
  { year: 1934, month: 9, solarTermName: '백로', datetime: '1934-09-08T16:36:00+09:00', sajuMonth: 8 },
  { year: 1934, month: 10, solarTermName: '한로', datetime: '1934-10-09T07:44:00+09:00', sajuMonth: 9 },
  { year: 1934, month: 11, solarTermName: '입동', datetime: '1934-11-08T10:26:00+09:00', sajuMonth: 10 },
  { year: 1934, month: 12, solarTermName: '대설', datetime: '1934-12-08T02:56:00+09:00', sajuMonth: 11 },

  // 1935년
  { year: 1935, month: 1, solarTermName: '소한', datetime: '1935-01-06T14:02:00+09:00', sajuMonth: 12 },
  { year: 1935, month: 2, solarTermName: '입춘', datetime: '1935-02-05T01:48:00+09:00', sajuMonth: 1 },
  { year: 1935, month: 3, solarTermName: '경칩', datetime: '1935-03-06T20:10:00+09:00', sajuMonth: 2 },
  { year: 1935, month: 4, solarTermName: '청명', datetime: '1935-04-06T01:26:00+09:00', sajuMonth: 3 },
  { year: 1935, month: 5, solarTermName: '입하', datetime: '1935-05-06T19:12:00+09:00', sajuMonth: 4 },
  { year: 1935, month: 6, solarTermName: '망종', datetime: '1935-06-06T23:41:00+09:00', sajuMonth: 5 },
  { year: 1935, month: 7, solarTermName: '소서', datetime: '1935-07-08T10:05:00+09:00', sajuMonth: 6 },
  { year: 1935, month: 8, solarTermName: '입추', datetime: '1935-08-08T19:47:00+09:00', sajuMonth: 7 },
  { year: 1935, month: 9, solarTermName: '백로', datetime: '1935-09-08T22:24:00+09:00', sajuMonth: 8 },
  { year: 1935, month: 10, solarTermName: '한로', datetime: '1935-10-09T13:35:00+09:00', sajuMonth: 9 },
  { year: 1935, month: 11, solarTermName: '입동', datetime: '1935-11-08T16:17:00+09:00', sajuMonth: 10 },
  { year: 1935, month: 12, solarTermName: '대설', datetime: '1935-12-08T08:44:00+09:00', sajuMonth: 11 },

  // 1936년
  { year: 1936, month: 1, solarTermName: '소한', datetime: '1936-01-06T19:46:00+09:00', sajuMonth: 12 },
  { year: 1936, month: 2, solarTermName: '입춘', datetime: '1936-02-05T07:29:00+09:00', sajuMonth: 1 },
  { year: 1936, month: 3, solarTermName: '경칩', datetime: '1936-03-06T01:49:00+09:00', sajuMonth: 2 },
  { year: 1936, month: 4, solarTermName: '청명', datetime: '1936-04-05T07:06:00+09:00', sajuMonth: 3 },
  { year: 1936, month: 5, solarTermName: '입하', datetime: '1936-05-06T00:56:00+09:00', sajuMonth: 4 },
  { year: 1936, month: 6, solarTermName: '망종', datetime: '1936-06-06T05:30:00+09:00', sajuMonth: 5 },
  { year: 1936, month: 7, solarTermName: '소서', datetime: '1936-07-07T15:58:00+09:00', sajuMonth: 6 },
  { year: 1936, month: 8, solarTermName: '입추', datetime: '1936-08-08T01:43:00+09:00', sajuMonth: 7 },
  { year: 1936, month: 9, solarTermName: '백로', datetime: '1936-09-08T04:20:00+09:00', sajuMonth: 8 },
  { year: 1936, month: 10, solarTermName: '한로', datetime: '1936-10-08T19:32:00+09:00', sajuMonth: 9 },
  { year: 1936, month: 11, solarTermName: '입동', datetime: '1936-11-07T22:14:00+09:00', sajuMonth: 10 },
  { year: 1936, month: 12, solarTermName: '대설', datetime: '1936-12-07T14:42:00+09:00', sajuMonth: 11 },

  // 1937년
  { year: 1937, month: 1, solarTermName: '소한', datetime: '1937-01-06T01:43:00+09:00', sajuMonth: 12 },
  { year: 1937, month: 2, solarTermName: '입춘', datetime: '1937-02-04T13:25:00+09:00', sajuMonth: 1 },
  { year: 1937, month: 3, solarTermName: '경칩', datetime: '1937-03-06T07:44:00+09:00', sajuMonth: 2 },
  { year: 1937, month: 4, solarTermName: '청명', datetime: '1937-04-05T13:01:00+09:00', sajuMonth: 3 },
  { year: 1937, month: 5, solarTermName: '입하', datetime: '1937-05-06T06:50:00+09:00', sajuMonth: 4 },
  { year: 1937, month: 6, solarTermName: '망종', datetime: '1937-06-06T11:22:00+09:00', sajuMonth: 5 },
  { year: 1937, month: 7, solarTermName: '소서', datetime: '1937-07-07T21:45:00+09:00', sajuMonth: 6 },
  { year: 1937, month: 8, solarTermName: '입추', datetime: '1937-08-08T07:25:00+09:00', sajuMonth: 7 },
  { year: 1937, month: 9, solarTermName: '백로', datetime: '1937-09-08T09:59:00+09:00', sajuMonth: 8 },
  { year: 1937, month: 10, solarTermName: '한로', datetime: '1937-10-09T01:10:00+09:00', sajuMonth: 9 },
  { year: 1937, month: 11, solarTermName: '입동', datetime: '1937-11-08T03:55:00+09:00', sajuMonth: 10 },
  { year: 1937, month: 12, solarTermName: '대설', datetime: '1937-12-07T20:26:00+09:00', sajuMonth: 11 },

  // 1938년
  { year: 1938, month: 1, solarTermName: '소한', datetime: '1938-01-06T07:31:00+09:00', sajuMonth: 12 },
  { year: 1938, month: 2, solarTermName: '입춘', datetime: '1938-02-04T19:14:00+09:00', sajuMonth: 1 },
  { year: 1938, month: 3, solarTermName: '경칩', datetime: '1938-03-06T13:33:00+09:00', sajuMonth: 2 },
  { year: 1938, month: 4, solarTermName: '청명', datetime: '1938-04-05T18:48:00+09:00', sajuMonth: 3 },
  { year: 1938, month: 5, solarTermName: '입하', datetime: '1938-05-06T12:35:00+09:00', sajuMonth: 4 },
  { year: 1938, month: 6, solarTermName: '망종', datetime: '1938-06-06T17:06:00+09:00', sajuMonth: 5 },
  { year: 1938, month: 7, solarTermName: '소서', datetime: '1938-07-08T03:31:00+09:00', sajuMonth: 6 },
  { year: 1938, month: 8, solarTermName: '입추', datetime: '1938-08-08T13:12:00+09:00', sajuMonth: 7 },
  { year: 1938, month: 9, solarTermName: '백로', datetime: '1938-09-08T15:48:00+09:00', sajuMonth: 8 },
  { year: 1938, month: 10, solarTermName: '한로', datetime: '1938-10-09T07:01:00+09:00', sajuMonth: 9 },
  { year: 1938, month: 11, solarTermName: '입동', datetime: '1938-11-08T09:48:00+09:00', sajuMonth: 10 },
  { year: 1938, month: 12, solarTermName: '대설', datetime: '1938-12-08T02:21:00+09:00', sajuMonth: 11 },

  // 1939년
  { year: 1939, month: 1, solarTermName: '소한', datetime: '1939-01-06T13:27:00+09:00', sajuMonth: 12 },
  { year: 1939, month: 2, solarTermName: '입춘', datetime: '1939-02-05T01:10:00+09:00', sajuMonth: 1 },
  { year: 1939, month: 3, solarTermName: '경칩', datetime: '1939-03-06T19:26:00+09:00', sajuMonth: 2 },
  { year: 1939, month: 4, solarTermName: '청명', datetime: '1939-04-06T00:37:00+09:00', sajuMonth: 3 },
  { year: 1939, month: 5, solarTermName: '입하', datetime: '1939-05-06T18:21:00+09:00', sajuMonth: 4 },
  { year: 1939, month: 6, solarTermName: '망종', datetime: '1939-06-06T22:51:00+09:00', sajuMonth: 5 },
  { year: 1939, month: 7, solarTermName: '소서', datetime: '1939-07-08T09:18:00+09:00', sajuMonth: 6 },
  { year: 1939, month: 8, solarTermName: '입추', datetime: '1939-08-08T19:03:00+09:00', sajuMonth: 7 },
  { year: 1939, month: 9, solarTermName: '백로', datetime: '1939-09-08T21:42:00+09:00', sajuMonth: 8 },
  { year: 1939, month: 10, solarTermName: '한로', datetime: '1939-10-09T12:56:00+09:00', sajuMonth: 9 },
  { year: 1939, month: 11, solarTermName: '입동', datetime: '1939-11-08T15:43:00+09:00', sajuMonth: 10 },
  { year: 1939, month: 12, solarTermName: '대설', datetime: '1939-12-08T08:17:00+09:00', sajuMonth: 11 },

  // 1940년
  { year: 1940, month: 1, solarTermName: '소한', datetime: '1940-01-06T19:23:00+09:00', sajuMonth: 12 },
  { year: 1940, month: 2, solarTermName: '입춘', datetime: '1940-02-05T07:07:00+09:00', sajuMonth: 1 },
  { year: 1940, month: 3, solarTermName: '경칩', datetime: '1940-03-06T01:23:00+09:00', sajuMonth: 2 },
  { year: 1940, month: 4, solarTermName: '청명', datetime: '1940-04-05T06:34:00+09:00', sajuMonth: 3 },
  { year: 1940, month: 5, solarTermName: '입하', datetime: '1940-05-06T00:16:00+09:00', sajuMonth: 4 },
  { year: 1940, month: 6, solarTermName: '망종', datetime: '1940-06-06T04:44:00+09:00', sajuMonth: 5 },
  { year: 1940, month: 7, solarTermName: '소서', datetime: '1940-07-07T15:08:00+09:00', sajuMonth: 6 },
  { year: 1940, month: 8, solarTermName: '입추', datetime: '1940-08-08T00:51:00+09:00', sajuMonth: 7 },
  { year: 1940, month: 9, solarTermName: '백로', datetime: '1940-09-08T03:29:00+09:00', sajuMonth: 8 },
  { year: 1940, month: 10, solarTermName: '한로', datetime: '1940-10-08T18:42:00+09:00', sajuMonth: 9 },
  { year: 1940, month: 11, solarTermName: '입동', datetime: '1940-11-07T21:26:00+09:00', sajuMonth: 10 },
  { year: 1940, month: 12, solarTermName: '대설', datetime: '1940-12-07T13:57:00+09:00', sajuMonth: 11 },

  // 1941년
  { year: 1941, month: 1, solarTermName: '소한', datetime: '1941-01-06T01:03:00+09:00', sajuMonth: 12 },
  { year: 1941, month: 2, solarTermName: '입춘', datetime: '1941-02-04T12:49:00+09:00', sajuMonth: 1 },
  { year: 1941, month: 3, solarTermName: '경칩', datetime: '1941-03-06T07:10:00+09:00', sajuMonth: 2 },
  { year: 1941, month: 4, solarTermName: '청명', datetime: '1941-04-05T12:24:00+09:00', sajuMonth: 3 },
  { year: 1941, month: 5, solarTermName: '입하', datetime: '1941-05-06T06:09:00+09:00', sajuMonth: 4 },
  { year: 1941, month: 6, solarTermName: '망종', datetime: '1941-06-06T10:39:00+09:00', sajuMonth: 5 },
  { year: 1941, month: 7, solarTermName: '소서', datetime: '1941-07-07T21:03:00+09:00', sajuMonth: 6 },
  { year: 1941, month: 8, solarTermName: '입추', datetime: '1941-08-08T06:45:00+09:00', sajuMonth: 7 },
  { year: 1941, month: 9, solarTermName: '백로', datetime: '1941-09-08T09:23:00+09:00', sajuMonth: 8 },
  { year: 1941, month: 10, solarTermName: '한로', datetime: '1941-10-09T00:38:00+09:00', sajuMonth: 9 },
  { year: 1941, month: 11, solarTermName: '입동', datetime: '1941-11-08T03:24:00+09:00', sajuMonth: 10 },
  { year: 1941, month: 12, solarTermName: '대설', datetime: '1941-12-07T19:55:00+09:00', sajuMonth: 11 },

  // 1942년
  { year: 1942, month: 1, solarTermName: '소한', datetime: '1942-01-06T07:02:00+09:00', sajuMonth: 12 },
  { year: 1942, month: 2, solarTermName: '입춘', datetime: '1942-02-04T18:48:00+09:00', sajuMonth: 1 },
  { year: 1942, month: 3, solarTermName: '경칩', datetime: '1942-03-06T13:09:00+09:00', sajuMonth: 2 },
  { year: 1942, month: 4, solarTermName: '청명', datetime: '1942-04-05T18:23:00+09:00', sajuMonth: 3 },
  { year: 1942, month: 5, solarTermName: '입하', datetime: '1942-05-06T12:06:00+09:00', sajuMonth: 4 },
  { year: 1942, month: 6, solarTermName: '망종', datetime: '1942-06-06T16:32:00+09:00', sajuMonth: 5 },
  { year: 1942, month: 7, solarTermName: '소서', datetime: '1942-07-08T02:51:00+09:00', sajuMonth: 6 },
  { year: 1942, month: 8, solarTermName: '입추', datetime: '1942-08-08T12:30:00+09:00', sajuMonth: 7 },
  { year: 1942, month: 9, solarTermName: '백로', datetime: '1942-09-08T15:06:00+09:00', sajuMonth: 8 },
  { year: 1942, month: 10, solarTermName: '한로', datetime: '1942-10-09T06:21:00+09:00', sajuMonth: 9 },
  { year: 1942, month: 11, solarTermName: '입동', datetime: '1942-11-08T09:11:00+09:00', sajuMonth: 10 },
  { year: 1942, month: 12, solarTermName: '대설', datetime: '1942-12-08T01:46:00+09:00', sajuMonth: 11 },

  // 1943년
  { year: 1943, month: 1, solarTermName: '소한', datetime: '1943-01-06T12:54:00+09:00', sajuMonth: 12 },
  { year: 1943, month: 2, solarTermName: '입춘', datetime: '1943-02-05T00:40:00+09:00', sajuMonth: 1 },
  { year: 1943, month: 3, solarTermName: '경칩', datetime: '1943-03-06T18:58:00+09:00', sajuMonth: 2 },
  { year: 1943, month: 4, solarTermName: '청명', datetime: '1943-04-06T00:11:00+09:00', sajuMonth: 3 },
  { year: 1943, month: 5, solarTermName: '입하', datetime: '1943-05-06T17:53:00+09:00', sajuMonth: 4 },
  { year: 1943, month: 6, solarTermName: '망종', datetime: '1943-06-06T22:18:00+09:00', sajuMonth: 5 },
  { year: 1943, month: 7, solarTermName: '소서', datetime: '1943-07-08T08:38:00+09:00', sajuMonth: 6 },
  { year: 1943, month: 8, solarTermName: '입추', datetime: '1943-08-08T18:18:00+09:00', sajuMonth: 7 },
  { year: 1943, month: 9, solarTermName: '백로', datetime: '1943-09-08T20:55:00+09:00', sajuMonth: 8 },
  { year: 1943, month: 10, solarTermName: '한로', datetime: '1943-10-09T12:10:00+09:00', sajuMonth: 9 },
  { year: 1943, month: 11, solarTermName: '입동', datetime: '1943-11-08T14:58:00+09:00', sajuMonth: 10 },
  { year: 1943, month: 12, solarTermName: '대설', datetime: '1943-12-08T07:32:00+09:00', sajuMonth: 11 },

  // 1944년
  { year: 1944, month: 1, solarTermName: '소한', datetime: '1944-01-06T18:39:00+09:00', sajuMonth: 12 },
  { year: 1944, month: 2, solarTermName: '입춘', datetime: '1944-02-05T06:22:00+09:00', sajuMonth: 1 },
  { year: 1944, month: 3, solarTermName: '경칩', datetime: '1944-03-06T00:40:00+09:00', sajuMonth: 2 },
  { year: 1944, month: 4, solarTermName: '청명', datetime: '1944-04-05T05:53:00+09:00', sajuMonth: 3 },
  { year: 1944, month: 5, solarTermName: '입하', datetime: '1944-05-05T23:39:00+09:00', sajuMonth: 4 },
  { year: 1944, month: 6, solarTermName: '망종', datetime: '1944-06-06T04:10:00+09:00', sajuMonth: 5 },
  { year: 1944, month: 7, solarTermName: '소서', datetime: '1944-07-07T14:36:00+09:00', sajuMonth: 6 },
  { year: 1944, month: 8, solarTermName: '입추', datetime: '1944-08-08T00:18:00+09:00', sajuMonth: 7 },
  { year: 1944, month: 9, solarTermName: '백로', datetime: '1944-09-08T02:55:00+09:00', sajuMonth: 8 },
  { year: 1944, month: 10, solarTermName: '한로', datetime: '1944-10-08T18:08:00+09:00', sajuMonth: 9 },
  { year: 1944, month: 11, solarTermName: '입동', datetime: '1944-11-07T20:54:00+09:00', sajuMonth: 10 },
  { year: 1944, month: 12, solarTermName: '대설', datetime: '1944-12-07T13:27:00+09:00', sajuMonth: 11 },

  // 1945년
  { year: 1945, month: 1, solarTermName: '소한', datetime: '1945-01-06T00:34:00+09:00', sajuMonth: 12 },
  { year: 1945, month: 2, solarTermName: '입춘', datetime: '1945-02-04T12:19:00+09:00', sajuMonth: 1 },
  { year: 1945, month: 3, solarTermName: '경칩', datetime: '1945-03-06T06:37:00+09:00', sajuMonth: 2 },
  { year: 1945, month: 4, solarTermName: '청명', datetime: '1945-04-05T11:51:00+09:00', sajuMonth: 3 },
  { year: 1945, month: 5, solarTermName: '입하', datetime: '1945-05-06T05:36:00+09:00', sajuMonth: 4 },
  { year: 1945, month: 6, solarTermName: '망종', datetime: '1945-06-06T10:05:00+09:00', sajuMonth: 5 },
  { year: 1945, month: 7, solarTermName: '소서', datetime: '1945-07-07T20:26:00+09:00', sajuMonth: 6 },
  { year: 1945, month: 8, solarTermName: '입추', datetime: '1945-08-08T06:05:00+09:00', sajuMonth: 7 },
  { year: 1945, month: 9, solarTermName: '백로', datetime: '1945-09-08T08:38:00+09:00', sajuMonth: 8 },
  { year: 1945, month: 10, solarTermName: '한로', datetime: '1945-10-08T23:49:00+09:00', sajuMonth: 9 },
  { year: 1945, month: 11, solarTermName: '입동', datetime: '1945-11-08T02:34:00+09:00', sajuMonth: 10 },
  { year: 1945, month: 12, solarTermName: '대설', datetime: '1945-12-07T19:07:00+09:00', sajuMonth: 11 },

  // 1946년
  { year: 1946, month: 1, solarTermName: '소한', datetime: '1946-01-06T06:16:00+09:00', sajuMonth: 12 },
  { year: 1946, month: 2, solarTermName: '입춘', datetime: '1946-02-04T18:03:00+09:00', sajuMonth: 1 },
  { year: 1946, month: 3, solarTermName: '경칩', datetime: '1946-03-06T12:24:00+09:00', sajuMonth: 2 },
  { year: 1946, month: 4, solarTermName: '청명', datetime: '1946-04-05T17:38:00+09:00', sajuMonth: 3 },
  { year: 1946, month: 5, solarTermName: '입하', datetime: '1946-05-06T11:21:00+09:00', sajuMonth: 4 },
  { year: 1946, month: 6, solarTermName: '망종', datetime: '1946-06-06T15:48:00+09:00', sajuMonth: 5 },
  { year: 1946, month: 7, solarTermName: '소서', datetime: '1946-07-08T02:10:00+09:00', sajuMonth: 6 },
  { year: 1946, month: 8, solarTermName: '입추', datetime: '1946-08-08T11:51:00+09:00', sajuMonth: 7 },
  { year: 1946, month: 9, solarTermName: '백로', datetime: '1946-09-08T14:27:00+09:00', sajuMonth: 8 },
  { year: 1946, month: 10, solarTermName: '한로', datetime: '1946-10-09T05:40:00+09:00', sajuMonth: 9 },
  { year: 1946, month: 11, solarTermName: '입동', datetime: '1946-11-08T08:27:00+09:00', sajuMonth: 10 },
  { year: 1946, month: 12, solarTermName: '대설', datetime: '1946-12-08T01:00:00+09:00', sajuMonth: 11 },

  // 1947년
  { year: 1947, month: 1, solarTermName: '소한', datetime: '1947-01-06T12:06:00+09:00', sajuMonth: 12 },
  { year: 1947, month: 2, solarTermName: '입춘', datetime: '1947-02-04T23:50:00+09:00', sajuMonth: 1 },
  { year: 1947, month: 3, solarTermName: '경칩', datetime: '1947-03-06T18:07:00+09:00', sajuMonth: 2 },
  { year: 1947, month: 4, solarTermName: '청명', datetime: '1947-04-05T23:20:00+09:00', sajuMonth: 3 },
  { year: 1947, month: 5, solarTermName: '입하', datetime: '1947-05-06T17:02:00+09:00', sajuMonth: 4 },
  { year: 1947, month: 6, solarTermName: '망종', datetime: '1947-06-06T21:31:00+09:00', sajuMonth: 5 },
  { year: 1947, month: 7, solarTermName: '소서', datetime: '1947-07-08T07:55:00+09:00', sajuMonth: 6 },
  { year: 1947, month: 8, solarTermName: '입추', datetime: '1947-08-08T17:40:00+09:00', sajuMonth: 7 },
  { year: 1947, month: 9, solarTermName: '백로', datetime: '1947-09-08T20:21:00+09:00', sajuMonth: 8 },
  { year: 1947, month: 10, solarTermName: '한로', datetime: '1947-10-09T11:37:00+09:00', sajuMonth: 9 },
  { year: 1947, month: 11, solarTermName: '입동', datetime: '1947-11-08T14:24:00+09:00', sajuMonth: 10 },
  { year: 1947, month: 12, solarTermName: '대설', datetime: '1947-12-08T06:56:00+09:00', sajuMonth: 11 },

  // 1948년
  { year: 1948, month: 1, solarTermName: '소한', datetime: '1948-01-06T18:00:00+09:00', sajuMonth: 12 },
  { year: 1948, month: 2, solarTermName: '입춘', datetime: '1948-02-05T05:42:00+09:00', sajuMonth: 1 },
  { year: 1948, month: 3, solarTermName: '경칩', datetime: '1948-03-05T23:57:00+09:00', sajuMonth: 2 },
  { year: 1948, month: 4, solarTermName: '청명', datetime: '1948-04-05T05:09:00+09:00', sajuMonth: 3 },
  { year: 1948, month: 5, solarTermName: '입하', datetime: '1948-05-05T22:52:00+09:00', sajuMonth: 4 },
  { year: 1948, month: 6, solarTermName: '망종', datetime: '1948-06-06T03:20:00+09:00', sajuMonth: 5 },
  { year: 1948, month: 7, solarTermName: '소서', datetime: '1948-07-07T13:43:00+09:00', sajuMonth: 6 },
  { year: 1948, month: 8, solarTermName: '입추', datetime: '1948-08-07T23:26:00+09:00', sajuMonth: 7 },
  { year: 1948, month: 9, solarTermName: '백로', datetime: '1948-09-08T02:04:00+09:00', sajuMonth: 8 },
  { year: 1948, month: 10, solarTermName: '한로', datetime: '1948-10-08T17:20:00+09:00', sajuMonth: 9 },
  { year: 1948, month: 11, solarTermName: '입동', datetime: '1948-11-07T20:06:00+09:00', sajuMonth: 10 },
  { year: 1948, month: 12, solarTermName: '대설', datetime: '1948-12-07T12:37:00+09:00', sajuMonth: 11 },

  // 1949년
  { year: 1949, month: 1, solarTermName: '소한', datetime: '1949-01-05T23:41:00+09:00', sajuMonth: 12 },
  { year: 1949, month: 2, solarTermName: '입춘', datetime: '1949-02-04T11:22:00+09:00', sajuMonth: 1 },
  { year: 1949, month: 3, solarTermName: '경칩', datetime: '1949-03-06T05:39:00+09:00', sajuMonth: 2 },
  { year: 1949, month: 4, solarTermName: '청명', datetime: '1949-04-05T10:51:00+09:00', sajuMonth: 3 },
  { year: 1949, month: 5, solarTermName: '입하', datetime: '1949-05-06T04:36:00+09:00', sajuMonth: 4 },
  { year: 1949, month: 6, solarTermName: '망종', datetime: '1949-06-06T09:06:00+09:00', sajuMonth: 5 },
  { year: 1949, month: 7, solarTermName: '소서', datetime: '1949-07-07T19:31:00+09:00', sajuMonth: 6 },
  { year: 1949, month: 8, solarTermName: '입추', datetime: '1949-08-08T05:14:00+09:00', sajuMonth: 7 },
  { year: 1949, month: 9, solarTermName: '백로', datetime: '1949-09-08T07:54:00+09:00', sajuMonth: 8 },
  { year: 1949, month: 10, solarTermName: '한로', datetime: '1949-10-08T23:11:00+09:00', sajuMonth: 9 },
  { year: 1949, month: 11, solarTermName: '입동', datetime: '1949-11-08T01:59:00+09:00', sajuMonth: 10 },
  { year: 1949, month: 12, solarTermName: '대설', datetime: '1949-12-07T18:33:00+09:00', sajuMonth: 11 },

  // 1950년
  { year: 1950, month: 1, solarTermName: '소한', datetime: '1950-01-06T05:38:00+09:00', sajuMonth: 12 },
  { year: 1950, month: 2, solarTermName: '입춘', datetime: '1950-02-04T17:20:00+09:00', sajuMonth: 1 },
  { year: 1950, month: 3, solarTermName: '경칩', datetime: '1950-03-06T11:35:00+09:00', sajuMonth: 2 },
  { year: 1950, month: 4, solarTermName: '청명', datetime: '1950-04-05T16:44:00+09:00', sajuMonth: 3 },
  { year: 1950, month: 5, solarTermName: '입하', datetime: '1950-05-06T10:24:00+09:00', sajuMonth: 4 },
  { year: 1950, month: 6, solarTermName: '망종', datetime: '1950-06-06T14:51:00+09:00', sajuMonth: 5 },
  { year: 1950, month: 7, solarTermName: '소서', datetime: '1950-07-08T01:13:00+09:00', sajuMonth: 6 },
  { year: 1950, month: 8, solarTermName: '입추', datetime: '1950-08-08T10:55:00+09:00', sajuMonth: 7 },
  { year: 1950, month: 9, solarTermName: '백로', datetime: '1950-09-08T13:33:00+09:00', sajuMonth: 8 },
  { year: 1950, month: 10, solarTermName: '한로', datetime: '1950-10-09T04:51:00+09:00', sajuMonth: 9 },
  { year: 1950, month: 11, solarTermName: '입동', datetime: '1950-11-08T07:43:00+09:00', sajuMonth: 10 },
  { year: 1950, month: 12, solarTermName: '대설', datetime: '1950-12-08T00:21:00+09:00', sajuMonth: 11 },

  // 1951년
  { year: 1951, month: 1, solarTermName: '소한', datetime: '1951-01-06T11:30:00+09:00', sajuMonth: 12 },
  { year: 1951, month: 2, solarTermName: '입춘', datetime: '1951-02-04T23:13:00+09:00', sajuMonth: 1 },
  { year: 1951, month: 3, solarTermName: '경칩', datetime: '1951-03-06T17:26:00+09:00', sajuMonth: 2 },
  { year: 1951, month: 4, solarTermName: '청명', datetime: '1951-04-05T22:32:00+09:00', sajuMonth: 3 },
  { year: 1951, month: 5, solarTermName: '입하', datetime: '1951-05-06T16:09:00+09:00', sajuMonth: 4 },
  { year: 1951, month: 6, solarTermName: '망종', datetime: '1951-06-06T20:32:00+09:00', sajuMonth: 5 },
  { year: 1951, month: 7, solarTermName: '소서', datetime: '1951-07-08T06:53:00+09:00', sajuMonth: 6 },
  { year: 1951, month: 8, solarTermName: '입추', datetime: '1951-08-08T16:37:00+09:00', sajuMonth: 7 },
  { year: 1951, month: 9, solarTermName: '백로', datetime: '1951-09-08T19:18:00+09:00', sajuMonth: 8 },
  { year: 1951, month: 10, solarTermName: '한로', datetime: '1951-10-09T10:36:00+09:00', sajuMonth: 9 },
  { year: 1951, month: 11, solarTermName: '입동', datetime: '1951-11-08T13:26:00+09:00', sajuMonth: 10 },
  { year: 1951, month: 12, solarTermName: '대설', datetime: '1951-12-08T06:02:00+09:00', sajuMonth: 11 },

  // 1952년
  { year: 1952, month: 1, solarTermName: '소한', datetime: '1952-01-06T17:09:00+09:00', sajuMonth: 12 },
  { year: 1952, month: 2, solarTermName: '입춘', datetime: '1952-02-05T04:52:00+09:00', sajuMonth: 1 },
  { year: 1952, month: 3, solarTermName: '경칩', datetime: '1952-03-05T23:07:00+09:00', sajuMonth: 2 },
  { year: 1952, month: 4, solarTermName: '청명', datetime: '1952-04-05T04:15:00+09:00', sajuMonth: 3 },
  { year: 1952, month: 5, solarTermName: '입하', datetime: '1952-05-05T21:54:00+09:00', sajuMonth: 4 },
  { year: 1952, month: 6, solarTermName: '망종', datetime: '1952-06-06T02:20:00+09:00', sajuMonth: 5 },
  { year: 1952, month: 7, solarTermName: '소서', datetime: '1952-07-07T12:44:00+09:00', sajuMonth: 6 },
  { year: 1952, month: 8, solarTermName: '입추', datetime: '1952-08-07T22:30:00+09:00', sajuMonth: 7 },
  { year: 1952, month: 9, solarTermName: '백로', datetime: '1952-09-08T01:13:00+09:00', sajuMonth: 8 },
  { year: 1952, month: 10, solarTermName: '한로', datetime: '1952-10-08T16:32:00+09:00', sajuMonth: 9 },
  { year: 1952, month: 11, solarTermName: '입동', datetime: '1952-11-07T19:21:00+09:00', sajuMonth: 10 },
  { year: 1952, month: 12, solarTermName: '대설', datetime: '1952-12-07T11:55:00+09:00', sajuMonth: 11 },

  // 1953년
  { year: 1953, month: 1, solarTermName: '소한', datetime: '1953-01-05T23:02:00+09:00', sajuMonth: 12 },
  { year: 1953, month: 2, solarTermName: '입춘', datetime: '1953-02-04T10:45:00+09:00', sajuMonth: 1 },
  { year: 1953, month: 3, solarTermName: '경칩', datetime: '1953-03-06T05:02:00+09:00', sajuMonth: 2 },
  { year: 1953, month: 4, solarTermName: '청명', datetime: '1953-04-05T10:12:00+09:00', sajuMonth: 3 },
  { year: 1953, month: 5, solarTermName: '입하', datetime: '1953-05-06T03:52:00+09:00', sajuMonth: 4 },
  { year: 1953, month: 6, solarTermName: '망종', datetime: '1953-06-06T08:16:00+09:00', sajuMonth: 5 },
  { year: 1953, month: 7, solarTermName: '소서', datetime: '1953-07-07T18:34:00+09:00', sajuMonth: 6 },
  { year: 1953, month: 8, solarTermName: '입추', datetime: '1953-08-08T04:14:00+09:00', sajuMonth: 7 },
  { year: 1953, month: 9, solarTermName: '백로', datetime: '1953-09-08T06:52:00+09:00', sajuMonth: 8 },
  { year: 1953, month: 10, solarTermName: '한로', datetime: '1953-10-08T22:10:00+09:00', sajuMonth: 9 },
  { year: 1953, month: 11, solarTermName: '입동', datetime: '1953-11-08T01:00:00+09:00', sajuMonth: 10 },
  { year: 1953, month: 12, solarTermName: '대설', datetime: '1953-12-07T17:36:00+09:00', sajuMonth: 11 },

  // 1954년
  { year: 1954, month: 1, solarTermName: '소한', datetime: '1954-01-06T04:45:00+09:00', sajuMonth: 12 },
  { year: 1954, month: 2, solarTermName: '입춘', datetime: '1954-02-04T16:30:00+09:00', sajuMonth: 1 },
  { year: 1954, month: 3, solarTermName: '경칩', datetime: '1954-03-06T10:48:00+09:00', sajuMonth: 2 },
  { year: 1954, month: 4, solarTermName: '청명', datetime: '1954-04-05T15:59:00+09:00', sajuMonth: 3 },
  { year: 1954, month: 5, solarTermName: '입하', datetime: '1954-05-06T09:38:00+09:00', sajuMonth: 4 },
  { year: 1954, month: 6, solarTermName: '망종', datetime: '1954-06-06T14:00:00+09:00', sajuMonth: 5 },
  { year: 1954, month: 7, solarTermName: '소서', datetime: '1954-07-08T00:19:00+09:00', sajuMonth: 6 },
  { year: 1954, month: 8, solarTermName: '입추', datetime: '1954-08-08T09:59:00+09:00', sajuMonth: 7 },
  { year: 1954, month: 9, solarTermName: '백로', datetime: '1954-09-08T12:37:00+09:00', sajuMonth: 8 },
  { year: 1954, month: 10, solarTermName: '한로', datetime: '1954-10-09T03:57:00+09:00', sajuMonth: 9 },
  { year: 1954, month: 11, solarTermName: '입동', datetime: '1954-11-08T06:50:00+09:00', sajuMonth: 10 },
  { year: 1954, month: 12, solarTermName: '대설', datetime: '1954-12-07T23:28:00+09:00', sajuMonth: 11 },

  // 1955년
  { year: 1955, month: 1, solarTermName: '소한', datetime: '1955-01-06T10:35:00+09:00', sajuMonth: 12 },
  { year: 1955, month: 2, solarTermName: '입춘', datetime: '1955-02-04T22:17:00+09:00', sajuMonth: 1 },
  { year: 1955, month: 3, solarTermName: '경칩', datetime: '1955-03-06T16:30:00+09:00', sajuMonth: 2 },
  { year: 1955, month: 4, solarTermName: '청명', datetime: '1955-04-05T21:38:00+09:00', sajuMonth: 3 },
  { year: 1955, month: 5, solarTermName: '입하', datetime: '1955-05-06T15:17:00+09:00', sajuMonth: 4 },
  { year: 1955, month: 6, solarTermName: '망종', datetime: '1955-06-06T19:43:00+09:00', sajuMonth: 5 },
  { year: 1955, month: 7, solarTermName: '소서', datetime: '1955-07-08T06:05:00+09:00', sajuMonth: 6 },
  { year: 1955, month: 8, solarTermName: '입추', datetime: '1955-08-08T15:50:00+09:00', sajuMonth: 7 },
  { year: 1955, month: 9, solarTermName: '백로', datetime: '1955-09-08T18:31:00+09:00', sajuMonth: 8 },
  { year: 1955, month: 10, solarTermName: '한로', datetime: '1955-10-09T09:52:00+09:00', sajuMonth: 9 },
  { year: 1955, month: 11, solarTermName: '입동', datetime: '1955-11-08T12:45:00+09:00', sajuMonth: 10 },
  { year: 1955, month: 12, solarTermName: '대설', datetime: '1955-12-08T05:22:00+09:00', sajuMonth: 11 },

  // 1956년
  { year: 1956, month: 1, solarTermName: '소한', datetime: '1956-01-06T16:30:00+09:00', sajuMonth: 12 },
  { year: 1956, month: 2, solarTermName: '입춘', datetime: '1956-02-05T04:11:00+09:00', sajuMonth: 1 },
  { year: 1956, month: 3, solarTermName: '경칩', datetime: '1956-03-05T22:24:00+09:00', sajuMonth: 2 },
  { year: 1956, month: 4, solarTermName: '청명', datetime: '1956-04-05T03:31:00+09:00', sajuMonth: 3 },
  { year: 1956, month: 5, solarTermName: '입하', datetime: '1956-05-05T21:09:00+09:00', sajuMonth: 4 },
  { year: 1956, month: 6, solarTermName: '망종', datetime: '1956-06-06T01:35:00+09:00', sajuMonth: 5 },
  { year: 1956, month: 7, solarTermName: '소서', datetime: '1956-07-07T11:57:00+09:00', sajuMonth: 6 },
  { year: 1956, month: 8, solarTermName: '입추', datetime: '1956-08-07T21:40:00+09:00', sajuMonth: 7 },
  { year: 1956, month: 9, solarTermName: '백로', datetime: '1956-09-08T00:18:00+09:00', sajuMonth: 8 },
  { year: 1956, month: 10, solarTermName: '한로', datetime: '1956-10-08T15:35:00+09:00', sajuMonth: 9 },
  { year: 1956, month: 11, solarTermName: '입동', datetime: '1956-11-07T18:25:00+09:00', sajuMonth: 10 },
  { year: 1956, month: 12, solarTermName: '대설', datetime: '1956-12-07T11:02:00+09:00', sajuMonth: 11 },

  // 1957년
  { year: 1957, month: 1, solarTermName: '소한', datetime: '1957-01-05T22:10:00+09:00', sajuMonth: 12 },
  { year: 1957, month: 2, solarTermName: '입춘', datetime: '1957-02-04T09:54:00+09:00', sajuMonth: 1 },
  { year: 1957, month: 3, solarTermName: '경칩', datetime: '1957-03-06T04:10:00+09:00', sajuMonth: 2 },
  { year: 1957, month: 4, solarTermName: '청명', datetime: '1957-04-05T09:18:00+09:00', sajuMonth: 3 },
  { year: 1957, month: 5, solarTermName: '입하', datetime: '1957-05-06T02:58:00+09:00', sajuMonth: 4 },
  { year: 1957, month: 6, solarTermName: '망종', datetime: '1957-06-06T07:24:00+09:00', sajuMonth: 5 },
  { year: 1957, month: 7, solarTermName: '소서', datetime: '1957-07-07T17:48:00+09:00', sajuMonth: 6 },
  { year: 1957, month: 8, solarTermName: '입추', datetime: '1957-08-08T03:32:00+09:00', sajuMonth: 7 },
  { year: 1957, month: 9, solarTermName: '백로', datetime: '1957-09-08T06:12:00+09:00', sajuMonth: 8 },
  { year: 1957, month: 10, solarTermName: '한로', datetime: '1957-10-08T21:29:00+09:00', sajuMonth: 9 },
  { year: 1957, month: 11, solarTermName: '입동', datetime: '1957-11-08T00:20:00+09:00', sajuMonth: 10 },
  { year: 1957, month: 12, solarTermName: '대설', datetime: '1957-12-07T16:55:00+09:00', sajuMonth: 11 },

  // 1958년
  { year: 1958, month: 1, solarTermName: '소한', datetime: '1958-01-06T04:04:00+09:00', sajuMonth: 12 },
  { year: 1958, month: 2, solarTermName: '입춘', datetime: '1958-02-04T15:49:00+09:00', sajuMonth: 1 },
  { year: 1958, month: 3, solarTermName: '경칩', datetime: '1958-03-06T10:04:00+09:00', sajuMonth: 2 },
  { year: 1958, month: 4, solarTermName: '청명', datetime: '1958-04-05T15:12:00+09:00', sajuMonth: 3 },
  { year: 1958, month: 5, solarTermName: '입하', datetime: '1958-05-06T08:49:00+09:00', sajuMonth: 4 },
  { year: 1958, month: 6, solarTermName: '망종', datetime: '1958-06-06T13:12:00+09:00', sajuMonth: 5 },
  { year: 1958, month: 7, solarTermName: '소서', datetime: '1958-07-07T23:33:00+09:00', sajuMonth: 6 },
  { year: 1958, month: 8, solarTermName: '입추', datetime: '1958-08-08T09:17:00+09:00', sajuMonth: 7 },
  { year: 1958, month: 9, solarTermName: '백로', datetime: '1958-09-08T11:58:00+09:00', sajuMonth: 8 },
  { year: 1958, month: 10, solarTermName: '한로', datetime: '1958-10-09T03:19:00+09:00', sajuMonth: 9 },
  { year: 1958, month: 11, solarTermName: '입동', datetime: '1958-11-08T06:11:00+09:00', sajuMonth: 10 },
  { year: 1958, month: 12, solarTermName: '대설', datetime: '1958-12-07T22:49:00+09:00', sajuMonth: 11 },

  // 1959년
  { year: 1959, month: 1, solarTermName: '소한', datetime: '1959-01-06T09:58:00+09:00', sajuMonth: 12 },
  { year: 1959, month: 2, solarTermName: '입춘', datetime: '1959-02-04T21:42:00+09:00', sajuMonth: 1 },
  { year: 1959, month: 3, solarTermName: '경칩', datetime: '1959-03-06T15:56:00+09:00', sajuMonth: 2 },
  { year: 1959, month: 4, solarTermName: '청명', datetime: '1959-04-05T21:03:00+09:00', sajuMonth: 3 },
  { year: 1959, month: 5, solarTermName: '입하', datetime: '1959-05-06T14:38:00+09:00', sajuMonth: 4 },
  { year: 1959, month: 6, solarTermName: '망종', datetime: '1959-06-06T19:00:00+09:00', sajuMonth: 5 },
  { year: 1959, month: 7, solarTermName: '소서', datetime: '1959-07-08T05:19:00+09:00', sajuMonth: 6 },
  { year: 1959, month: 8, solarTermName: '입추', datetime: '1959-08-08T15:04:00+09:00', sajuMonth: 7 },
  { year: 1959, month: 9, solarTermName: '백로', datetime: '1959-09-08T17:47:00+09:00', sajuMonth: 8 },
  { year: 1959, month: 10, solarTermName: '한로', datetime: '1959-10-09T09:09:00+09:00', sajuMonth: 9 },
  { year: 1959, month: 11, solarTermName: '입동', datetime: '1959-11-08T12:02:00+09:00', sajuMonth: 10 },
  { year: 1959, month: 12, solarTermName: '대설', datetime: '1959-12-08T04:37:00+09:00', sajuMonth: 11 },

  // 1960년
  { year: 1960, month: 1, solarTermName: '소한', datetime: '1960-01-06T15:42:00+09:00', sajuMonth: 12 },
  { year: 1960, month: 2, solarTermName: '입춘', datetime: '1960-02-05T03:23:00+09:00', sajuMonth: 1 },
  { year: 1960, month: 3, solarTermName: '경칩', datetime: '1960-03-05T21:36:00+09:00', sajuMonth: 2 },
  { year: 1960, month: 4, solarTermName: '청명', datetime: '1960-04-05T02:43:00+09:00', sajuMonth: 3 },
  { year: 1960, month: 5, solarTermName: '입하', datetime: '1960-05-05T20:22:00+09:00', sajuMonth: 4 },
  { year: 1960, month: 6, solarTermName: '망종', datetime: '1960-06-06T00:48:00+09:00', sajuMonth: 5 },
  { year: 1960, month: 7, solarTermName: '소서', datetime: '1960-07-07T11:12:00+09:00', sajuMonth: 6 },
  { year: 1960, month: 8, solarTermName: '입추', datetime: '1960-08-07T20:59:00+09:00', sajuMonth: 7 },
  { year: 1960, month: 9, solarTermName: '백로', datetime: '1960-09-07T23:45:00+09:00', sajuMonth: 8 },
  { year: 1960, month: 10, solarTermName: '한로', datetime: '1960-10-08T15:08:00+09:00', sajuMonth: 9 },
  { year: 1960, month: 11, solarTermName: '입동', datetime: '1960-11-07T18:02:00+09:00', sajuMonth: 10 },
  { year: 1960, month: 12, solarTermName: '대설', datetime: '1960-12-07T10:37:00+09:00', sajuMonth: 11 },

  // 1961년
  { year: 1961, month: 1, solarTermName: '소한', datetime: '1961-01-05T21:42:00+09:00', sajuMonth: 12 },
  { year: 1961, month: 2, solarTermName: '입춘', datetime: '1961-02-04T09:22:00+09:00', sajuMonth: 1 },
  { year: 1961, month: 3, solarTermName: '경칩', datetime: '1961-03-06T03:34:00+09:00', sajuMonth: 2 },
  { year: 1961, month: 4, solarTermName: '청명', datetime: '1961-04-05T08:42:00+09:00', sajuMonth: 3 },
  { year: 1961, month: 5, solarTermName: '입하', datetime: '1961-05-06T02:21:00+09:00', sajuMonth: 4 },
  { year: 1961, month: 6, solarTermName: '망종', datetime: '1961-06-06T06:46:00+09:00', sajuMonth: 5 },
  { year: 1961, month: 7, solarTermName: '소서', datetime: '1961-07-07T17:06:00+09:00', sajuMonth: 6 },
  { year: 1961, month: 8, solarTermName: '입추', datetime: '1961-08-08T02:48:00+09:00', sajuMonth: 7 },
  { year: 1961, month: 9, solarTermName: '백로', datetime: '1961-09-08T05:29:00+09:00', sajuMonth: 8 },
  { year: 1961, month: 10, solarTermName: '한로', datetime: '1961-10-08T20:50:00+09:00', sajuMonth: 9 },
  { year: 1961, month: 11, solarTermName: '입동', datetime: '1961-11-07T23:46:00+09:00', sajuMonth: 10 },
  { year: 1961, month: 12, solarTermName: '대설', datetime: '1961-12-07T16:25:00+09:00', sajuMonth: 11 },

  // 1962년
  { year: 1962, month: 1, solarTermName: '소한', datetime: '1962-01-06T03:34:00+09:00', sajuMonth: 12 },
  { year: 1962, month: 2, solarTermName: '입춘', datetime: '1962-02-04T15:17:00+09:00', sajuMonth: 1 },
  { year: 1962, month: 3, solarTermName: '경칩', datetime: '1962-03-06T09:29:00+09:00', sajuMonth: 2 },
  { year: 1962, month: 4, solarTermName: '청명', datetime: '1962-04-05T14:34:00+09:00', sajuMonth: 3 },
  { year: 1962, month: 5, solarTermName: '입하', datetime: '1962-05-06T08:09:00+09:00', sajuMonth: 4 },
  { year: 1962, month: 6, solarTermName: '망종', datetime: '1962-06-06T12:31:00+09:00', sajuMonth: 5 },
  { year: 1962, month: 7, solarTermName: '소서', datetime: '1962-07-07T22:51:00+09:00', sajuMonth: 6 },
  { year: 1962, month: 8, solarTermName: '입추', datetime: '1962-08-08T08:33:00+09:00', sajuMonth: 7 },
  { year: 1962, month: 9, solarTermName: '백로', datetime: '1962-09-08T11:15:00+09:00', sajuMonth: 8 },
  { year: 1962, month: 10, solarTermName: '한로', datetime: '1962-10-09T02:37:00+09:00', sajuMonth: 9 },
  { year: 1962, month: 11, solarTermName: '입동', datetime: '1962-11-08T05:34:00+09:00', sajuMonth: 10 },
  { year: 1962, month: 12, solarTermName: '대설', datetime: '1962-12-07T22:16:00+09:00', sajuMonth: 11 },

  // 1963년
  { year: 1963, month: 1, solarTermName: '소한', datetime: '1963-01-06T09:26:00+09:00', sajuMonth: 12 },
  { year: 1963, month: 2, solarTermName: '입춘', datetime: '1963-02-04T21:07:00+09:00', sajuMonth: 1 },
  { year: 1963, month: 3, solarTermName: '경칩', datetime: '1963-03-06T15:17:00+09:00', sajuMonth: 2 },
  { year: 1963, month: 4, solarTermName: '청명', datetime: '1963-04-05T20:18:00+09:00', sajuMonth: 3 },
  { year: 1963, month: 5, solarTermName: '입하', datetime: '1963-05-06T13:51:00+09:00', sajuMonth: 4 },
  { year: 1963, month: 6, solarTermName: '망종', datetime: '1963-06-06T18:14:00+09:00', sajuMonth: 5 },
  { year: 1963, month: 7, solarTermName: '소서', datetime: '1963-07-08T04:37:00+09:00', sajuMonth: 6 },
  { year: 1963, month: 8, solarTermName: '입추', datetime: '1963-08-08T14:25:00+09:00', sajuMonth: 7 },
  { year: 1963, month: 9, solarTermName: '백로', datetime: '1963-09-08T17:11:00+09:00', sajuMonth: 8 },
  { year: 1963, month: 10, solarTermName: '한로', datetime: '1963-10-09T08:36:00+09:00', sajuMonth: 9 },
  { year: 1963, month: 11, solarTermName: '입동', datetime: '1963-11-08T11:32:00+09:00', sajuMonth: 10 },
  { year: 1963, month: 12, solarTermName: '대설', datetime: '1963-12-08T04:12:00+09:00', sajuMonth: 11 },

  // 1964년
  { year: 1964, month: 1, solarTermName: '소한', datetime: '1964-01-06T15:22:00+09:00', sajuMonth: 12 },
  { year: 1964, month: 2, solarTermName: '입춘', datetime: '1964-02-05T03:04:00+09:00', sajuMonth: 1 },
  { year: 1964, month: 3, solarTermName: '경칩', datetime: '1964-03-05T21:15:00+09:00', sajuMonth: 2 },
  { year: 1964, month: 4, solarTermName: '청명', datetime: '1964-04-05T02:18:00+09:00', sajuMonth: 3 },
  { year: 1964, month: 5, solarTermName: '입하', datetime: '1964-05-05T19:51:00+09:00', sajuMonth: 4 },
  { year: 1964, month: 6, solarTermName: '망종', datetime: '1964-06-06T00:11:00+09:00', sajuMonth: 5 },
  { year: 1964, month: 7, solarTermName: '소서', datetime: '1964-07-07T10:32:00+09:00', sajuMonth: 6 },
  { year: 1964, month: 8, solarTermName: '입추', datetime: '1964-08-07T20:16:00+09:00', sajuMonth: 7 },
  { year: 1964, month: 9, solarTermName: '백로', datetime: '1964-09-07T22:59:00+09:00', sajuMonth: 8 },
  { year: 1964, month: 10, solarTermName: '한로', datetime: '1964-10-08T14:21:00+09:00', sajuMonth: 9 },
  { year: 1964, month: 11, solarTermName: '입동', datetime: '1964-11-07T17:15:00+09:00', sajuMonth: 10 },
  { year: 1964, month: 12, solarTermName: '대설', datetime: '1964-12-07T09:53:00+09:00', sajuMonth: 11 },

  // 1965년
  { year: 1965, month: 1, solarTermName: '소한', datetime: '1965-01-05T21:01:00+09:00', sajuMonth: 12 },
  { year: 1965, month: 2, solarTermName: '입춘', datetime: '1965-02-04T08:46:00+09:00', sajuMonth: 1 },
  { year: 1965, month: 3, solarTermName: '경칩', datetime: '1965-03-06T03:00:00+09:00', sajuMonth: 2 },
  { year: 1965, month: 4, solarTermName: '청명', datetime: '1965-04-05T08:06:00+09:00', sajuMonth: 3 },
  { year: 1965, month: 5, solarTermName: '입하', datetime: '1965-05-06T01:41:00+09:00', sajuMonth: 4 },
  { year: 1965, month: 6, solarTermName: '망종', datetime: '1965-06-06T06:02:00+09:00', sajuMonth: 5 },
  { year: 1965, month: 7, solarTermName: '소서', datetime: '1965-07-07T16:21:00+09:00', sajuMonth: 6 },
  { year: 1965, month: 8, solarTermName: '입추', datetime: '1965-08-08T02:04:00+09:00', sajuMonth: 7 },
  { year: 1965, month: 9, solarTermName: '백로', datetime: '1965-09-08T04:47:00+09:00', sajuMonth: 8 },
  { year: 1965, month: 10, solarTermName: '한로', datetime: '1965-10-08T20:11:00+09:00', sajuMonth: 9 },
  { year: 1965, month: 11, solarTermName: '입동', datetime: '1965-11-07T23:06:00+09:00', sajuMonth: 10 },
  { year: 1965, month: 12, solarTermName: '대설', datetime: '1965-12-07T15:45:00+09:00', sajuMonth: 11 },

  // 1966년
  { year: 1966, month: 1, solarTermName: '소한', datetime: '1966-01-06T02:54:00+09:00', sajuMonth: 12 },
  { year: 1966, month: 2, solarTermName: '입춘', datetime: '1966-02-04T14:37:00+09:00', sajuMonth: 1 },
  { year: 1966, month: 3, solarTermName: '경칩', datetime: '1966-03-06T08:51:00+09:00', sajuMonth: 2 },
  { year: 1966, month: 4, solarTermName: '청명', datetime: '1966-04-05T13:56:00+09:00', sajuMonth: 3 },
  { year: 1966, month: 5, solarTermName: '입하', datetime: '1966-05-06T07:30:00+09:00', sajuMonth: 4 },
  { year: 1966, month: 6, solarTermName: '망종', datetime: '1966-06-06T11:49:00+09:00', sajuMonth: 5 },
  { year: 1966, month: 7, solarTermName: '소서', datetime: '1966-07-07T22:06:00+09:00', sajuMonth: 6 },
  { year: 1966, month: 8, solarTermName: '입추', datetime: '1966-08-08T07:48:00+09:00', sajuMonth: 7 },
  { year: 1966, month: 9, solarTermName: '백로', datetime: '1966-09-08T10:32:00+09:00', sajuMonth: 8 },
  { year: 1966, month: 10, solarTermName: '한로', datetime: '1966-10-09T01:56:00+09:00', sajuMonth: 9 },
  { year: 1966, month: 11, solarTermName: '입동', datetime: '1966-11-08T04:55:00+09:00', sajuMonth: 10 },
  { year: 1966, month: 12, solarTermName: '대설', datetime: '1966-12-07T21:37:00+09:00', sajuMonth: 11 },

  // 1967년
  { year: 1967, month: 1, solarTermName: '소한', datetime: '1967-01-06T08:48:00+09:00', sajuMonth: 12 },
  { year: 1967, month: 2, solarTermName: '입춘', datetime: '1967-02-04T20:30:00+09:00', sajuMonth: 1 },
  { year: 1967, month: 3, solarTermName: '경칩', datetime: '1967-03-06T14:41:00+09:00', sajuMonth: 2 },
  { year: 1967, month: 4, solarTermName: '청명', datetime: '1967-04-05T19:44:00+09:00', sajuMonth: 3 },
  { year: 1967, month: 5, solarTermName: '입하', datetime: '1967-05-06T13:17:00+09:00', sajuMonth: 4 },
  { year: 1967, month: 6, solarTermName: '망종', datetime: '1967-06-06T17:36:00+09:00', sajuMonth: 5 },
  { year: 1967, month: 7, solarTermName: '소서', datetime: '1967-07-08T03:53:00+09:00', sajuMonth: 6 },
  { year: 1967, month: 8, solarTermName: '입추', datetime: '1967-08-08T13:34:00+09:00', sajuMonth: 7 },
  { year: 1967, month: 9, solarTermName: '백로', datetime: '1967-09-08T16:17:00+09:00', sajuMonth: 8 },
  { year: 1967, month: 10, solarTermName: '한로', datetime: '1967-10-09T07:41:00+09:00', sajuMonth: 9 },
  { year: 1967, month: 11, solarTermName: '입동', datetime: '1967-11-08T10:37:00+09:00', sajuMonth: 10 },
  { year: 1967, month: 12, solarTermName: '대설', datetime: '1967-12-08T03:17:00+09:00', sajuMonth: 11 },

  // 1968년
  { year: 1968, month: 1, solarTermName: '소한', datetime: '1968-01-06T14:26:00+09:00', sajuMonth: 12 },
  { year: 1968, month: 2, solarTermName: '입춘', datetime: '1968-02-05T02:07:00+09:00', sajuMonth: 1 },
  { year: 1968, month: 3, solarTermName: '경칩', datetime: '1968-03-05T20:17:00+09:00', sajuMonth: 2 },
  { year: 1968, month: 4, solarTermName: '청명', datetime: '1968-04-05T01:20:00+09:00', sajuMonth: 3 },
  { year: 1968, month: 5, solarTermName: '입하', datetime: '1968-05-05T18:55:00+09:00', sajuMonth: 4 },
  { year: 1968, month: 6, solarTermName: '망종', datetime: '1968-06-05T23:19:00+09:00', sajuMonth: 5 },
  { year: 1968, month: 7, solarTermName: '소서', datetime: '1968-07-07T09:41:00+09:00', sajuMonth: 6 },
  { year: 1968, month: 8, solarTermName: '입추', datetime: '1968-08-07T19:27:00+09:00', sajuMonth: 7 },
  { year: 1968, month: 9, solarTermName: '백로', datetime: '1968-09-07T22:11:00+09:00', sajuMonth: 8 },
  { year: 1968, month: 10, solarTermName: '한로', datetime: '1968-10-08T13:34:00+09:00', sajuMonth: 9 },
  { year: 1968, month: 11, solarTermName: '입동', datetime: '1968-11-07T16:29:00+09:00', sajuMonth: 10 },
  { year: 1968, month: 12, solarTermName: '대설', datetime: '1968-12-07T09:08:00+09:00', sajuMonth: 11 },

  // 1969년
  { year: 1969, month: 1, solarTermName: '소한', datetime: '1969-01-05T20:16:00+09:00', sajuMonth: 12 },
  { year: 1969, month: 2, solarTermName: '입춘', datetime: '1969-02-04T07:58:00+09:00', sajuMonth: 1 },
  { year: 1969, month: 3, solarTermName: '경칩', datetime: '1969-03-06T02:10:00+09:00', sajuMonth: 2 },
  { year: 1969, month: 4, solarTermName: '청명', datetime: '1969-04-05T07:14:00+09:00', sajuMonth: 3 },
  { year: 1969, month: 5, solarTermName: '입하', datetime: '1969-05-06T00:49:00+09:00', sajuMonth: 4 },
  { year: 1969, month: 6, solarTermName: '망종', datetime: '1969-06-06T05:11:00+09:00', sajuMonth: 5 },
  { year: 1969, month: 7, solarTermName: '소서', datetime: '1969-07-07T15:31:00+09:00', sajuMonth: 6 },
  { year: 1969, month: 8, solarTermName: '입추', datetime: '1969-08-08T01:14:00+09:00', sajuMonth: 7 },
  { year: 1969, month: 9, solarTermName: '백로', datetime: '1969-09-08T03:55:00+09:00', sajuMonth: 8 },
  { year: 1969, month: 10, solarTermName: '한로', datetime: '1969-10-08T19:16:00+09:00', sajuMonth: 9 },
  { year: 1969, month: 11, solarTermName: '입동', datetime: '1969-11-07T22:11:00+09:00', sajuMonth: 10 },
  { year: 1969, month: 12, solarTermName: '대설', datetime: '1969-12-07T14:51:00+09:00', sajuMonth: 11 },

  // 1970년
  { year: 1970, month: 1, solarTermName: '소한', datetime: '1970-01-06T02:01:00+09:00', sajuMonth: 12 },
  { year: 1970, month: 2, solarTermName: '입춘', datetime: '1970-02-04T13:45:00+09:00', sajuMonth: 1 },
  { year: 1970, month: 3, solarTermName: '경칩', datetime: '1970-03-06T07:58:00+09:00', sajuMonth: 2 },
  { year: 1970, month: 4, solarTermName: '청명', datetime: '1970-04-05T13:01:00+09:00', sajuMonth: 3 },
  { year: 1970, month: 5, solarTermName: '입하', datetime: '1970-05-06T06:33:00+09:00', sajuMonth: 4 },
  { year: 1970, month: 6, solarTermName: '망종', datetime: '1970-06-06T10:52:00+09:00', sajuMonth: 5 },
  { year: 1970, month: 7, solarTermName: '소서', datetime: '1970-07-07T21:10:00+09:00', sajuMonth: 6 },
  { year: 1970, month: 8, solarTermName: '입추', datetime: '1970-08-08T06:54:00+09:00', sajuMonth: 7 },
  { year: 1970, month: 9, solarTermName: '백로', datetime: '1970-09-08T09:37:00+09:00', sajuMonth: 8 },
  { year: 1970, month: 10, solarTermName: '한로', datetime: '1970-10-09T01:01:00+09:00', sajuMonth: 9 },
  { year: 1970, month: 11, solarTermName: '입동', datetime: '1970-11-08T03:57:00+09:00', sajuMonth: 10 },
  { year: 1970, month: 12, solarTermName: '대설', datetime: '1970-12-07T20:37:00+09:00', sajuMonth: 11 },

  // 1971년
  { year: 1971, month: 1, solarTermName: '소한', datetime: '1971-01-06T07:45:00+09:00', sajuMonth: 12 },
  { year: 1971, month: 2, solarTermName: '입춘', datetime: '1971-02-04T19:25:00+09:00', sajuMonth: 1 },
  { year: 1971, month: 3, solarTermName: '경칩', datetime: '1971-03-06T13:34:00+09:00', sajuMonth: 2 },
  { year: 1971, month: 4, solarTermName: '청명', datetime: '1971-04-05T18:36:00+09:00', sajuMonth: 3 },
  { year: 1971, month: 5, solarTermName: '입하', datetime: '1971-05-06T12:08:00+09:00', sajuMonth: 4 },
  { year: 1971, month: 6, solarTermName: '망종', datetime: '1971-06-06T16:28:00+09:00', sajuMonth: 5 },
  { year: 1971, month: 7, solarTermName: '소서', datetime: '1971-07-08T02:51:00+09:00', sajuMonth: 6 },
  { year: 1971, month: 8, solarTermName: '입추', datetime: '1971-08-08T12:40:00+09:00', sajuMonth: 7 },
  { year: 1971, month: 9, solarTermName: '백로', datetime: '1971-09-08T15:30:00+09:00', sajuMonth: 8 },
  { year: 1971, month: 10, solarTermName: '한로', datetime: '1971-10-09T06:58:00+09:00', sajuMonth: 9 },
  { year: 1971, month: 11, solarTermName: '입동', datetime: '1971-11-08T09:56:00+09:00', sajuMonth: 10 },
  { year: 1971, month: 12, solarTermName: '대설', datetime: '1971-12-08T02:35:00+09:00', sajuMonth: 11 },

  // 1972년
  { year: 1972, month: 1, solarTermName: '소한', datetime: '1972-01-06T13:41:00+09:00', sajuMonth: 12 },
  { year: 1972, month: 2, solarTermName: '입춘', datetime: '1972-02-05T01:20:00+09:00', sajuMonth: 1 },
  { year: 1972, month: 3, solarTermName: '경칩', datetime: '1972-03-05T19:28:00+09:00', sajuMonth: 2 },
  { year: 1972, month: 4, solarTermName: '청명', datetime: '1972-04-05T00:28:00+09:00', sajuMonth: 3 },
  { year: 1972, month: 5, solarTermName: '입하', datetime: '1972-05-05T18:01:00+09:00', sajuMonth: 4 },
  { year: 1972, month: 6, solarTermName: '망종', datetime: '1972-06-05T22:21:00+09:00', sajuMonth: 5 },
  { year: 1972, month: 7, solarTermName: '소서', datetime: '1972-07-07T08:42:00+09:00', sajuMonth: 6 },
  { year: 1972, month: 8, solarTermName: '입추', datetime: '1972-08-07T18:28:00+09:00', sajuMonth: 7 },
  { year: 1972, month: 9, solarTermName: '백로', datetime: '1972-09-07T21:15:00+09:00', sajuMonth: 8 },
  { year: 1972, month: 10, solarTermName: '한로', datetime: '1972-10-08T12:41:00+09:00', sajuMonth: 9 },
  { year: 1972, month: 11, solarTermName: '입동', datetime: '1972-11-07T15:39:00+09:00', sajuMonth: 10 },
  { year: 1972, month: 12, solarTermName: '대설', datetime: '1972-12-07T08:18:00+09:00', sajuMonth: 11 },

  // 1973년
  { year: 1973, month: 1, solarTermName: '소한', datetime: '1973-01-05T19:25:00+09:00', sajuMonth: 12 },
  { year: 1973, month: 2, solarTermName: '입춘', datetime: '1973-02-04T07:04:00+09:00', sajuMonth: 1 },
  { year: 1973, month: 3, solarTermName: '경칩', datetime: '1973-03-06T01:12:00+09:00', sajuMonth: 2 },
  { year: 1973, month: 4, solarTermName: '청명', datetime: '1973-04-05T06:13:00+09:00', sajuMonth: 3 },
  { year: 1973, month: 5, solarTermName: '입하', datetime: '1973-05-05T23:46:00+09:00', sajuMonth: 4 },
  { year: 1973, month: 6, solarTermName: '망종', datetime: '1973-06-06T04:06:00+09:00', sajuMonth: 5 },
  { year: 1973, month: 7, solarTermName: '소서', datetime: '1973-07-07T14:27:00+09:00', sajuMonth: 6 },
  { year: 1973, month: 8, solarTermName: '입추', datetime: '1973-08-08T00:12:00+09:00', sajuMonth: 7 },
  { year: 1973, month: 9, solarTermName: '백로', datetime: '1973-09-08T02:59:00+09:00', sajuMonth: 8 },
  { year: 1973, month: 10, solarTermName: '한로', datetime: '1973-10-08T18:27:00+09:00', sajuMonth: 9 },
  { year: 1973, month: 11, solarTermName: '입동', datetime: '1973-11-07T21:27:00+09:00', sajuMonth: 10 },
  { year: 1973, month: 12, solarTermName: '대설', datetime: '1973-12-07T14:10:00+09:00', sajuMonth: 11 },

  // 1974년
  { year: 1974, month: 1, solarTermName: '소한', datetime: '1974-01-06T01:19:00+09:00', sajuMonth: 12 },
  { year: 1974, month: 2, solarTermName: '입춘', datetime: '1974-02-04T13:00:00+09:00', sajuMonth: 1 },
  { year: 1974, month: 3, solarTermName: '경칩', datetime: '1974-03-06T07:07:00+09:00', sajuMonth: 2 },
  { year: 1974, month: 4, solarTermName: '청명', datetime: '1974-04-05T12:05:00+09:00', sajuMonth: 3 },
  { year: 1974, month: 5, solarTermName: '입하', datetime: '1974-05-06T05:33:00+09:00', sajuMonth: 4 },
  { year: 1974, month: 6, solarTermName: '망종', datetime: '1974-06-06T09:51:00+09:00', sajuMonth: 5 },
  { year: 1974, month: 7, solarTermName: '소서', datetime: '1974-07-07T20:11:00+09:00', sajuMonth: 6 },
  { year: 1974, month: 8, solarTermName: '입추', datetime: '1974-08-08T05:57:00+09:00', sajuMonth: 7 },
  { year: 1974, month: 9, solarTermName: '백로', datetime: '1974-09-08T08:45:00+09:00', sajuMonth: 8 },
  { year: 1974, month: 10, solarTermName: '한로', datetime: '1974-10-09T00:14:00+09:00', sajuMonth: 9 },
  { year: 1974, month: 11, solarTermName: '입동', datetime: '1974-11-08T03:17:00+09:00', sajuMonth: 10 },
  { year: 1974, month: 12, solarTermName: '대설', datetime: '1974-12-07T20:04:00+09:00', sajuMonth: 11 },

  // 1975년
  { year: 1975, month: 1, solarTermName: '소한', datetime: '1975-01-06T07:17:00+09:00', sajuMonth: 12 },
  { year: 1975, month: 2, solarTermName: '입춘', datetime: '1975-02-04T18:59:00+09:00', sajuMonth: 1 },
  { year: 1975, month: 3, solarTermName: '경칩', datetime: '1975-03-06T13:05:00+09:00', sajuMonth: 2 },
  { year: 1975, month: 4, solarTermName: '청명', datetime: '1975-04-05T18:01:00+09:00', sajuMonth: 3 },
  { year: 1975, month: 5, solarTermName: '입하', datetime: '1975-05-06T11:27:00+09:00', sajuMonth: 4 },
  { year: 1975, month: 6, solarTermName: '망종', datetime: '1975-06-06T15:42:00+09:00', sajuMonth: 5 },
  { year: 1975, month: 7, solarTermName: '소서', datetime: '1975-07-08T01:59:00+09:00', sajuMonth: 6 },
  { year: 1975, month: 8, solarTermName: '입추', datetime: '1975-08-08T11:44:00+09:00', sajuMonth: 7 },
  { year: 1975, month: 9, solarTermName: '백로', datetime: '1975-09-08T14:33:00+09:00', sajuMonth: 8 },
  { year: 1975, month: 10, solarTermName: '한로', datetime: '1975-10-09T06:02:00+09:00', sajuMonth: 9 },
  { year: 1975, month: 11, solarTermName: '입동', datetime: '1975-11-08T09:02:00+09:00', sajuMonth: 10 },
  { year: 1975, month: 12, solarTermName: '대설', datetime: '1975-12-08T01:46:00+09:00', sajuMonth: 11 },

  // 1976년
  { year: 1976, month: 1, solarTermName: '소한', datetime: '1976-01-06T12:57:00+09:00', sajuMonth: 12 },
  { year: 1976, month: 2, solarTermName: '입춘', datetime: '1976-02-05T00:39:00+09:00', sajuMonth: 1 },
  { year: 1976, month: 3, solarTermName: '경칩', datetime: '1976-03-05T18:48:00+09:00', sajuMonth: 2 },
  { year: 1976, month: 4, solarTermName: '청명', datetime: '1976-04-04T23:46:00+09:00', sajuMonth: 3 },
  { year: 1976, month: 5, solarTermName: '입하', datetime: '1976-05-05T17:14:00+09:00', sajuMonth: 4 },
  { year: 1976, month: 6, solarTermName: '망종', datetime: '1976-06-05T21:31:00+09:00', sajuMonth: 5 },
  { year: 1976, month: 7, solarTermName: '소서', datetime: '1976-07-07T07:50:00+09:00', sajuMonth: 6 },
  { year: 1976, month: 8, solarTermName: '입추', datetime: '1976-08-07T17:38:00+09:00', sajuMonth: 7 },
  { year: 1976, month: 9, solarTermName: '백로', datetime: '1976-09-07T20:28:00+09:00', sajuMonth: 8 },
  { year: 1976, month: 10, solarTermName: '한로', datetime: '1976-10-08T11:58:00+09:00', sajuMonth: 9 },
  { year: 1976, month: 11, solarTermName: '입동', datetime: '1976-11-07T14:58:00+09:00', sajuMonth: 10 },
  { year: 1976, month: 12, solarTermName: '대설', datetime: '1976-12-07T07:40:00+09:00', sajuMonth: 11 },

  // 1977년
  { year: 1977, month: 1, solarTermName: '소한', datetime: '1977-01-05T18:51:00+09:00', sajuMonth: 12 },
  { year: 1977, month: 2, solarTermName: '입춘', datetime: '1977-02-04T06:33:00+09:00', sajuMonth: 1 },
  { year: 1977, month: 3, solarTermName: '경칩', datetime: '1977-03-06T00:44:00+09:00', sajuMonth: 2 },
  { year: 1977, month: 4, solarTermName: '청명', datetime: '1977-04-05T05:45:00+09:00', sajuMonth: 3 },
  { year: 1977, month: 5, solarTermName: '입하', datetime: '1977-05-05T23:16:00+09:00', sajuMonth: 4 },
  { year: 1977, month: 6, solarTermName: '망종', datetime: '1977-06-06T03:32:00+09:00', sajuMonth: 5 },
  { year: 1977, month: 7, solarTermName: '소서', datetime: '1977-07-07T13:47:00+09:00', sajuMonth: 6 },
  { year: 1977, month: 8, solarTermName: '입추', datetime: '1977-08-07T23:30:00+09:00', sajuMonth: 7 },
  { year: 1977, month: 9, solarTermName: '백로', datetime: '1977-09-08T02:15:00+09:00', sajuMonth: 8 },
  { year: 1977, month: 10, solarTermName: '한로', datetime: '1977-10-08T17:43:00+09:00', sajuMonth: 9 },
  { year: 1977, month: 11, solarTermName: '입동', datetime: '1977-11-07T20:45:00+09:00', sajuMonth: 10 },
  { year: 1977, month: 12, solarTermName: '대설', datetime: '1977-12-07T13:30:00+09:00', sajuMonth: 11 },

  // 1978년
  { year: 1978, month: 1, solarTermName: '소한', datetime: '1978-01-06T00:43:00+09:00', sajuMonth: 12 },
  { year: 1978, month: 2, solarTermName: '입춘', datetime: '1978-02-04T12:26:00+09:00', sajuMonth: 1 },
  { year: 1978, month: 3, solarTermName: '경칩', datetime: '1978-03-06T06:38:00+09:00', sajuMonth: 2 },
  { year: 1978, month: 4, solarTermName: '청명', datetime: '1978-04-05T11:39:00+09:00', sajuMonth: 3 },
  { year: 1978, month: 5, solarTermName: '입하', datetime: '1978-05-06T05:08:00+09:00', sajuMonth: 4 },
  { year: 1978, month: 6, solarTermName: '망종', datetime: '1978-06-06T09:23:00+09:00', sajuMonth: 5 },
  { year: 1978, month: 7, solarTermName: '소서', datetime: '1978-07-07T19:36:00+09:00', sajuMonth: 6 },
  { year: 1978, month: 8, solarTermName: '입추', datetime: '1978-08-08T05:17:00+09:00', sajuMonth: 7 },
  { year: 1978, month: 9, solarTermName: '백로', datetime: '1978-09-08T08:02:00+09:00', sajuMonth: 8 },
  { year: 1978, month: 10, solarTermName: '한로', datetime: '1978-10-08T23:30:00+09:00', sajuMonth: 9 },
  { year: 1978, month: 11, solarTermName: '입동', datetime: '1978-11-08T02:34:00+09:00', sajuMonth: 10 },
  { year: 1978, month: 12, solarTermName: '대설', datetime: '1978-12-07T19:20:00+09:00', sajuMonth: 11 },

  // 1979년
  { year: 1979, month: 1, solarTermName: '소한', datetime: '1979-01-06T06:31:00+09:00', sajuMonth: 12 },
  { year: 1979, month: 2, solarTermName: '입춘', datetime: '1979-02-04T18:12:00+09:00', sajuMonth: 1 },
  { year: 1979, month: 3, solarTermName: '경칩', datetime: '1979-03-06T12:19:00+09:00', sajuMonth: 2 },
  { year: 1979, month: 4, solarTermName: '청명', datetime: '1979-04-05T17:17:00+09:00', sajuMonth: 3 },
  { year: 1979, month: 5, solarTermName: '입하', datetime: '1979-05-06T10:47:00+09:00', sajuMonth: 4 },
  { year: 1979, month: 6, solarTermName: '망종', datetime: '1979-06-06T15:05:00+09:00', sajuMonth: 5 },
  { year: 1979, month: 7, solarTermName: '소서', datetime: '1979-07-08T01:24:00+09:00', sajuMonth: 6 },
  { year: 1979, month: 8, solarTermName: '입추', datetime: '1979-08-08T11:10:00+09:00', sajuMonth: 7 },
  { year: 1979, month: 9, solarTermName: '백로', datetime: '1979-09-08T13:59:00+09:00', sajuMonth: 8 },
  { year: 1979, month: 10, solarTermName: '한로', datetime: '1979-10-09T05:30:00+09:00', sajuMonth: 9 },
  { year: 1979, month: 11, solarTermName: '입동', datetime: '1979-11-08T08:32:00+09:00', sajuMonth: 10 },
  { year: 1979, month: 12, solarTermName: '대설', datetime: '1979-12-08T01:17:00+09:00', sajuMonth: 11 },

  // 1980년
  { year: 1980, month: 1, solarTermName: '소한', datetime: '1980-01-06T12:28:00+09:00', sajuMonth: 12 },
  { year: 1980, month: 2, solarTermName: '입춘', datetime: '1980-02-05T00:09:00+09:00', sajuMonth: 1 },
  { year: 1980, month: 3, solarTermName: '경칩', datetime: '1980-03-05T18:16:00+09:00', sajuMonth: 2 },
  { year: 1980, month: 4, solarTermName: '청명', datetime: '1980-04-04T23:14:00+09:00', sajuMonth: 3 },
  { year: 1980, month: 5, solarTermName: '입하', datetime: '1980-05-05T16:44:00+09:00', sajuMonth: 4 },
  { year: 1980, month: 6, solarTermName: '망종', datetime: '1980-06-05T21:03:00+09:00', sajuMonth: 5 },
  { year: 1980, month: 7, solarTermName: '소서', datetime: '1980-07-07T07:23:00+09:00', sajuMonth: 6 },
  { year: 1980, month: 8, solarTermName: '입추', datetime: '1980-08-07T17:08:00+09:00', sajuMonth: 7 },
  { year: 1980, month: 9, solarTermName: '백로', datetime: '1980-09-07T19:53:00+09:00', sajuMonth: 8 },
  { year: 1980, month: 10, solarTermName: '한로', datetime: '1980-10-08T11:19:00+09:00', sajuMonth: 9 },
  { year: 1980, month: 11, solarTermName: '입동', datetime: '1980-11-07T14:18:00+09:00', sajuMonth: 10 },
  { year: 1980, month: 12, solarTermName: '대설', datetime: '1980-12-07T07:01:00+09:00', sajuMonth: 11 },

  // 1981년
  { year: 1981, month: 1, solarTermName: '소한', datetime: '1981-01-05T18:12:00+09:00', sajuMonth: 12 },
  { year: 1981, month: 2, solarTermName: '입춘', datetime: '1981-02-04T05:55:00+09:00', sajuMonth: 1 },
  { year: 1981, month: 3, solarTermName: '경칩', datetime: '1981-03-06T00:05:00+09:00', sajuMonth: 2 },
  { year: 1981, month: 4, solarTermName: '청명', datetime: '1981-04-05T05:05:00+09:00', sajuMonth: 3 },
  { year: 1981, month: 5, solarTermName: '입하', datetime: '1981-05-05T22:34:00+09:00', sajuMonth: 4 },
  { year: 1981, month: 6, solarTermName: '망종', datetime: '1981-06-06T02:52:00+09:00', sajuMonth: 5 },
  { year: 1981, month: 7, solarTermName: '소서', datetime: '1981-07-07T13:11:00+09:00', sajuMonth: 6 },
  { year: 1981, month: 8, solarTermName: '입추', datetime: '1981-08-07T22:57:00+09:00', sajuMonth: 7 },
  { year: 1981, month: 9, solarTermName: '백로', datetime: '1981-09-08T01:43:00+09:00', sajuMonth: 8 },
  { year: 1981, month: 10, solarTermName: '한로', datetime: '1981-10-08T17:09:00+09:00', sajuMonth: 9 },
  { year: 1981, month: 11, solarTermName: '입동', datetime: '1981-11-07T20:08:00+09:00', sajuMonth: 10 },
  { year: 1981, month: 12, solarTermName: '대설', datetime: '1981-12-07T12:51:00+09:00', sajuMonth: 11 },

  // 1982년
  { year: 1982, month: 1, solarTermName: '소한', datetime: '1982-01-06T00:02:00+09:00', sajuMonth: 12 },
  { year: 1982, month: 2, solarTermName: '입춘', datetime: '1982-02-04T11:45:00+09:00', sajuMonth: 1 },
  { year: 1982, month: 3, solarTermName: '경칩', datetime: '1982-03-06T05:54:00+09:00', sajuMonth: 2 },
  { year: 1982, month: 4, solarTermName: '청명', datetime: '1982-04-05T10:52:00+09:00', sajuMonth: 3 },
  { year: 1982, month: 5, solarTermName: '입하', datetime: '1982-05-06T04:19:00+09:00', sajuMonth: 4 },
  { year: 1982, month: 6, solarTermName: '망종', datetime: '1982-06-06T08:35:00+09:00', sajuMonth: 5 },
  { year: 1982, month: 7, solarTermName: '소서', datetime: '1982-07-07T18:54:00+09:00', sajuMonth: 6 },
  { year: 1982, month: 8, solarTermName: '입추', datetime: '1982-08-08T04:41:00+09:00', sajuMonth: 7 },
  { year: 1982, month: 9, solarTermName: '백로', datetime: '1982-09-08T07:31:00+09:00', sajuMonth: 8 },
  { year: 1982, month: 10, solarTermName: '한로', datetime: '1982-10-08T23:02:00+09:00', sajuMonth: 9 },
  { year: 1982, month: 11, solarTermName: '입동', datetime: '1982-11-08T02:04:00+09:00', sajuMonth: 10 },
  { year: 1982, month: 12, solarTermName: '대설', datetime: '1982-12-07T18:48:00+09:00', sajuMonth: 11 },

  // 1983년
  { year: 1983, month: 1, solarTermName: '소한', datetime: '1983-01-06T05:58:00+09:00', sajuMonth: 12 },
  { year: 1983, month: 2, solarTermName: '입춘', datetime: '1983-02-04T17:39:00+09:00', sajuMonth: 1 },
  { year: 1983, month: 3, solarTermName: '경칩', datetime: '1983-03-06T11:47:00+09:00', sajuMonth: 2 },
  { year: 1983, month: 4, solarTermName: '청명', datetime: '1983-04-05T16:44:00+09:00', sajuMonth: 3 },
  { year: 1983, month: 5, solarTermName: '입하', datetime: '1983-05-06T10:10:00+09:00', sajuMonth: 4 },
  { year: 1983, month: 6, solarTermName: '망종', datetime: '1983-06-06T14:25:00+09:00', sajuMonth: 5 },
  { year: 1983, month: 7, solarTermName: '소서', datetime: '1983-07-08T00:43:00+09:00', sajuMonth: 6 },
  { year: 1983, month: 8, solarTermName: '입추', datetime: '1983-08-08T10:29:00+09:00', sajuMonth: 7 },
  { year: 1983, month: 9, solarTermName: '백로', datetime: '1983-09-08T13:20:00+09:00', sajuMonth: 8 },
  { year: 1983, month: 10, solarTermName: '한로', datetime: '1983-10-09T04:51:00+09:00', sajuMonth: 9 },
  { year: 1983, month: 11, solarTermName: '입동', datetime: '1983-11-08T07:52:00+09:00', sajuMonth: 10 },
  { year: 1983, month: 12, solarTermName: '대설', datetime: '1983-12-08T00:33:00+09:00', sajuMonth: 11 },

  // 1984년
  { year: 1984, month: 1, solarTermName: '소한', datetime: '1984-01-06T11:40:00+09:00', sajuMonth: 12 },
  { year: 1984, month: 2, solarTermName: '입춘', datetime: '1984-02-04T23:18:00+09:00', sajuMonth: 1 },
  { year: 1984, month: 3, solarTermName: '경칩', datetime: '1984-03-05T17:24:00+09:00', sajuMonth: 2 },
  { year: 1984, month: 4, solarTermName: '청명', datetime: '1984-04-04T22:22:00+09:00', sajuMonth: 3 },
  { year: 1984, month: 5, solarTermName: '입하', datetime: '1984-05-05T15:50:00+09:00', sajuMonth: 4 },
  { year: 1984, month: 6, solarTermName: '망종', datetime: '1984-06-05T20:08:00+09:00', sajuMonth: 5 },
  { year: 1984, month: 7, solarTermName: '소서', datetime: '1984-07-07T06:29:00+09:00', sajuMonth: 6 },
  { year: 1984, month: 8, solarTermName: '입추', datetime: '1984-08-07T16:17:00+09:00', sajuMonth: 7 },
  { year: 1984, month: 9, solarTermName: '백로', datetime: '1984-09-07T19:09:00+09:00', sajuMonth: 8 },
  { year: 1984, month: 10, solarTermName: '한로', datetime: '1984-10-08T10:42:00+09:00', sajuMonth: 9 },
  { year: 1984, month: 11, solarTermName: '입동', datetime: '1984-11-07T13:45:00+09:00', sajuMonth: 10 },
  { year: 1984, month: 12, solarTermName: '대설', datetime: '1984-12-07T06:28:00+09:00', sajuMonth: 11 },

  // 1985년
  { year: 1985, month: 1, solarTermName: '소한', datetime: '1985-01-05T17:35:00+09:00', sajuMonth: 12 },
  { year: 1985, month: 2, solarTermName: '입춘', datetime: '1985-02-04T05:11:00+09:00', sajuMonth: 1 },
  { year: 1985, month: 3, solarTermName: '경칩', datetime: '1985-03-05T23:16:00+09:00', sajuMonth: 2 },
  { year: 1985, month: 4, solarTermName: '청명', datetime: '1985-04-05T04:13:00+09:00', sajuMonth: 3 },
  { year: 1985, month: 5, solarTermName: '입하', datetime: '1985-05-05T21:42:00+09:00', sajuMonth: 4 },
  { year: 1985, month: 6, solarTermName: '망종', datetime: '1985-06-06T01:59:00+09:00', sajuMonth: 5 },
  { year: 1985, month: 7, solarTermName: '소서', datetime: '1985-07-07T12:18:00+09:00', sajuMonth: 6 },
  { year: 1985, month: 8, solarTermName: '입추', datetime: '1985-08-07T22:04:00+09:00', sajuMonth: 7 },
  { year: 1985, month: 9, solarTermName: '백로', datetime: '1985-09-08T00:53:00+09:00', sajuMonth: 8 },
  { year: 1985, month: 10, solarTermName: '한로', datetime: '1985-10-08T16:24:00+09:00', sajuMonth: 9 },
  { year: 1985, month: 11, solarTermName: '입동', datetime: '1985-11-07T19:29:00+09:00', sajuMonth: 10 },
  { year: 1985, month: 12, solarTermName: '대설', datetime: '1985-12-07T12:16:00+09:00', sajuMonth: 11 },

  // 1986년
  { year: 1986, month: 1, solarTermName: '소한', datetime: '1986-01-05T23:28:00+09:00', sajuMonth: 12 },
  { year: 1986, month: 2, solarTermName: '입춘', datetime: '1986-02-04T11:07:00+09:00', sajuMonth: 1 },
  { year: 1986, month: 3, solarTermName: '경칩', datetime: '1986-03-06T05:12:00+09:00', sajuMonth: 2 },
  { year: 1986, month: 4, solarTermName: '청명', datetime: '1986-04-05T10:06:00+09:00', sajuMonth: 3 },
  { year: 1986, month: 5, solarTermName: '입하', datetime: '1986-05-06T03:30:00+09:00', sajuMonth: 4 },
  { year: 1986, month: 6, solarTermName: '망종', datetime: '1986-06-06T07:44:00+09:00', sajuMonth: 5 },
  { year: 1986, month: 7, solarTermName: '소서', datetime: '1986-07-07T18:00:00+09:00', sajuMonth: 6 },
  { year: 1986, month: 8, solarTermName: '입추', datetime: '1986-08-08T03:45:00+09:00', sajuMonth: 7 },
  { year: 1986, month: 9, solarTermName: '백로', datetime: '1986-09-08T06:34:00+09:00', sajuMonth: 8 },
  { year: 1986, month: 10, solarTermName: '한로', datetime: '1986-10-08T22:06:00+09:00', sajuMonth: 9 },
  { year: 1986, month: 11, solarTermName: '입동', datetime: '1986-11-08T01:12:00+09:00', sajuMonth: 10 },
  { year: 1986, month: 12, solarTermName: '대설', datetime: '1986-12-07T18:00:00+09:00', sajuMonth: 11 },

  // 1987년
  { year: 1987, month: 1, solarTermName: '소한', datetime: '1987-01-06T05:13:00+09:00', sajuMonth: 12 },
  { year: 1987, month: 2, solarTermName: '입춘', datetime: '1987-02-04T16:51:00+09:00', sajuMonth: 1 },
  { year: 1987, month: 3, solarTermName: '경칩', datetime: '1987-03-06T10:53:00+09:00', sajuMonth: 2 },
  { year: 1987, month: 4, solarTermName: '청명', datetime: '1987-04-05T15:44:00+09:00', sajuMonth: 3 },
  { year: 1987, month: 5, solarTermName: '입하', datetime: '1987-05-06T09:05:00+09:00', sajuMonth: 4 },
  { year: 1987, month: 6, solarTermName: '망종', datetime: '1987-06-06T13:18:00+09:00', sajuMonth: 5 },
  { year: 1987, month: 7, solarTermName: '소서', datetime: '1987-07-07T23:38:00+09:00', sajuMonth: 6 },
  { year: 1987, month: 8, solarTermName: '입추', datetime: '1987-08-08T09:29:00+09:00', sajuMonth: 7 },
  { year: 1987, month: 9, solarTermName: '백로', datetime: '1987-09-08T12:24:00+09:00', sajuMonth: 8 },
  { year: 1987, month: 10, solarTermName: '한로', datetime: '1987-10-09T03:59:00+09:00', sajuMonth: 9 },
  { year: 1987, month: 11, solarTermName: '입동', datetime: '1987-11-08T07:05:00+09:00', sajuMonth: 10 },
  { year: 1987, month: 12, solarTermName: '대설', datetime: '1987-12-07T23:52:00+09:00', sajuMonth: 11 },

  // 1988년
  { year: 1988, month: 1, solarTermName: '소한', datetime: '1988-01-06T11:03:00+09:00', sajuMonth: 12 },
  { year: 1988, month: 2, solarTermName: '입춘', datetime: '1988-02-04T22:42:00+09:00', sajuMonth: 1 },
  { year: 1988, month: 3, solarTermName: '경칩', datetime: '1988-03-05T16:46:00+09:00', sajuMonth: 2 },
  { year: 1988, month: 4, solarTermName: '청명', datetime: '1988-04-04T21:39:00+09:00', sajuMonth: 3 },
  { year: 1988, month: 5, solarTermName: '입하', datetime: '1988-05-05T15:01:00+09:00', sajuMonth: 4 },
  { year: 1988, month: 6, solarTermName: '망종', datetime: '1988-06-05T19:14:00+09:00', sajuMonth: 5 },
  { year: 1988, month: 7, solarTermName: '소서', datetime: '1988-07-07T05:32:00+09:00', sajuMonth: 6 },
  { year: 1988, month: 8, solarTermName: '입추', datetime: '1988-08-07T15:20:00+09:00', sajuMonth: 7 },
  { year: 1988, month: 9, solarTermName: '백로', datetime: '1988-09-07T18:11:00+09:00', sajuMonth: 8 },
  { year: 1988, month: 10, solarTermName: '한로', datetime: '1988-10-08T09:44:00+09:00', sajuMonth: 9 },
  { year: 1988, month: 11, solarTermName: '입동', datetime: '1988-11-07T12:48:00+09:00', sajuMonth: 10 },
  { year: 1988, month: 12, solarTermName: '대설', datetime: '1988-12-07T05:34:00+09:00', sajuMonth: 11 },

  // 1989년
  { year: 1989, month: 1, solarTermName: '소한', datetime: '1989-01-05T16:45:00+09:00', sajuMonth: 12 },
  { year: 1989, month: 2, solarTermName: '입춘', datetime: '1989-02-04T04:27:00+09:00', sajuMonth: 1 },
  { year: 1989, month: 3, solarTermName: '경칩', datetime: '1989-03-05T22:34:00+09:00', sajuMonth: 2 },
  { year: 1989, month: 4, solarTermName: '청명', datetime: '1989-04-05T03:29:00+09:00', sajuMonth: 3 },
  { year: 1989, month: 5, solarTermName: '입하', datetime: '1989-05-05T20:53:00+09:00', sajuMonth: 4 },
  { year: 1989, month: 6, solarTermName: '망종', datetime: '1989-06-06T01:05:00+09:00', sajuMonth: 5 },
  { year: 1989, month: 7, solarTermName: '소서', datetime: '1989-07-07T11:19:00+09:00', sajuMonth: 6 },
  { year: 1989, month: 8, solarTermName: '입추', datetime: '1989-08-07T21:03:00+09:00', sajuMonth: 7 },
  { year: 1989, month: 9, solarTermName: '백로', datetime: '1989-09-07T23:53:00+09:00', sajuMonth: 8 },
  { year: 1989, month: 10, solarTermName: '한로', datetime: '1989-10-08T15:27:00+09:00', sajuMonth: 9 },
  { year: 1989, month: 11, solarTermName: '입동', datetime: '1989-11-07T18:33:00+09:00', sajuMonth: 10 },
  { year: 1989, month: 12, solarTermName: '대설', datetime: '1989-12-07T11:20:00+09:00', sajuMonth: 11 },

  // 1990년
  { year: 1990, month: 1, solarTermName: '소한', datetime: '1990-01-05T22:33:00+09:00', sajuMonth: 12 },
  { year: 1990, month: 2, solarTermName: '입춘', datetime: '1990-02-04T10:14:00+09:00', sajuMonth: 1 },
  { year: 1990, month: 3, solarTermName: '경칩', datetime: '1990-03-06T04:19:00+09:00', sajuMonth: 2 },
  { year: 1990, month: 4, solarTermName: '청명', datetime: '1990-04-05T09:12:00+09:00', sajuMonth: 3 },
  { year: 1990, month: 5, solarTermName: '입하', datetime: '1990-05-06T02:35:00+09:00', sajuMonth: 4 },
  { year: 1990, month: 6, solarTermName: '망종', datetime: '1990-06-06T06:46:00+09:00', sajuMonth: 5 },
  { year: 1990, month: 7, solarTermName: '소서', datetime: '1990-07-07T17:00:00+09:00', sajuMonth: 6 },
  { year: 1990, month: 8, solarTermName: '입추', datetime: '1990-08-08T02:45:00+09:00', sajuMonth: 7 },
  { year: 1990, month: 9, solarTermName: '백로', datetime: '1990-09-08T05:37:00+09:00', sajuMonth: 8 },
  { year: 1990, month: 10, solarTermName: '한로', datetime: '1990-10-08T21:13:00+09:00', sajuMonth: 9 },
  { year: 1990, month: 11, solarTermName: '입동', datetime: '1990-11-08T00:23:00+09:00', sajuMonth: 10 },
  { year: 1990, month: 12, solarTermName: '대설', datetime: '1990-12-07T17:14:00+09:00', sajuMonth: 11 },

  // 1991년
  { year: 1991, month: 1, solarTermName: '소한', datetime: '1991-01-06T04:28:00+09:00', sajuMonth: 12 },
  { year: 1991, month: 2, solarTermName: '입춘', datetime: '1991-02-04T16:08:00+09:00', sajuMonth: 1 },
  { year: 1991, month: 3, solarTermName: '경칩', datetime: '1991-03-06T10:12:00+09:00', sajuMonth: 2 },
  { year: 1991, month: 4, solarTermName: '청명', datetime: '1991-04-05T15:04:00+09:00', sajuMonth: 3 },
  { year: 1991, month: 5, solarTermName: '입하', datetime: '1991-05-06T08:26:00+09:00', sajuMonth: 4 },
  { year: 1991, month: 6, solarTermName: '망종', datetime: '1991-06-06T12:38:00+09:00', sajuMonth: 5 },
  { year: 1991, month: 7, solarTermName: '소서', datetime: '1991-07-07T22:52:00+09:00', sajuMonth: 6 },
  { year: 1991, month: 8, solarTermName: '입추', datetime: '1991-08-08T08:37:00+09:00', sajuMonth: 7 },
  { year: 1991, month: 9, solarTermName: '백로', datetime: '1991-09-08T11:27:00+09:00', sajuMonth: 8 },
  { year: 1991, month: 10, solarTermName: '한로', datetime: '1991-10-09T03:01:00+09:00', sajuMonth: 9 },
  { year: 1991, month: 11, solarTermName: '입동', datetime: '1991-11-08T06:07:00+09:00', sajuMonth: 10 },
  { year: 1991, month: 12, solarTermName: '대설', datetime: '1991-12-07T22:56:00+09:00', sajuMonth: 11 },

  // 1992년
  { year: 1992, month: 1, solarTermName: '소한', datetime: '1992-01-06T10:08:00+09:00', sajuMonth: 12 },
  { year: 1992, month: 2, solarTermName: '입춘', datetime: '1992-02-04T21:48:00+09:00', sajuMonth: 1 },
  { year: 1992, month: 3, solarTermName: '경칩', datetime: '1992-03-05T15:52:00+09:00', sajuMonth: 2 },
  { year: 1992, month: 4, solarTermName: '청명', datetime: '1992-04-04T20:45:00+09:00', sajuMonth: 3 },
  { year: 1992, month: 5, solarTermName: '입하', datetime: '1992-05-05T14:08:00+09:00', sajuMonth: 4 },
  { year: 1992, month: 6, solarTermName: '망종', datetime: '1992-06-05T18:22:00+09:00', sajuMonth: 5 },
  { year: 1992, month: 7, solarTermName: '소서', datetime: '1992-07-07T04:40:00+09:00', sajuMonth: 6 },
  { year: 1992, month: 8, solarTermName: '입추', datetime: '1992-08-07T14:27:00+09:00', sajuMonth: 7 },
  { year: 1992, month: 9, solarTermName: '백로', datetime: '1992-09-07T17:18:00+09:00', sajuMonth: 8 },
  { year: 1992, month: 10, solarTermName: '한로', datetime: '1992-10-08T08:51:00+09:00', sajuMonth: 9 },
  { year: 1992, month: 11, solarTermName: '입동', datetime: '1992-11-07T11:57:00+09:00', sajuMonth: 10 },
  { year: 1992, month: 12, solarTermName: '대설', datetime: '1992-12-07T04:44:00+09:00', sajuMonth: 11 },

  // 1993년
  { year: 1993, month: 1, solarTermName: '소한', datetime: '1993-01-05T15:56:00+09:00', sajuMonth: 12 },
  { year: 1993, month: 2, solarTermName: '입춘', datetime: '1993-02-04T03:37:00+09:00', sajuMonth: 1 },
  { year: 1993, month: 3, solarTermName: '경칩', datetime: '1993-03-05T21:42:00+09:00', sajuMonth: 2 },
  { year: 1993, month: 4, solarTermName: '청명', datetime: '1993-04-05T02:37:00+09:00', sajuMonth: 3 },
  { year: 1993, month: 5, solarTermName: '입하', datetime: '1993-05-05T20:01:00+09:00', sajuMonth: 4 },
  { year: 1993, month: 6, solarTermName: '망종', datetime: '1993-06-06T00:15:00+09:00', sajuMonth: 5 },
  { year: 1993, month: 7, solarTermName: '소서', datetime: '1993-07-07T10:32:00+09:00', sajuMonth: 6 },
  { year: 1993, month: 8, solarTermName: '입추', datetime: '1993-08-07T20:17:00+09:00', sajuMonth: 7 },
  { year: 1993, month: 9, solarTermName: '백로', datetime: '1993-09-07T23:07:00+09:00', sajuMonth: 8 },
  { year: 1993, month: 10, solarTermName: '한로', datetime: '1993-10-08T14:40:00+09:00', sajuMonth: 9 },
  { year: 1993, month: 11, solarTermName: '입동', datetime: '1993-11-07T17:45:00+09:00', sajuMonth: 10 },
  { year: 1993, month: 12, solarTermName: '대설', datetime: '1993-12-07T10:33:00+09:00', sajuMonth: 11 },

  // 1994년
  { year: 1994, month: 1, solarTermName: '소한', datetime: '1994-01-05T21:48:00+09:00', sajuMonth: 12 },
  { year: 1994, month: 2, solarTermName: '입춘', datetime: '1994-02-04T09:30:00+09:00', sajuMonth: 1 },
  { year: 1994, month: 3, solarTermName: '경칩', datetime: '1994-03-06T03:37:00+09:00', sajuMonth: 2 },
  { year: 1994, month: 4, solarTermName: '청명', datetime: '1994-04-05T08:31:00+09:00', sajuMonth: 3 },
  { year: 1994, month: 5, solarTermName: '입하', datetime: '1994-05-06T01:54:00+09:00', sajuMonth: 4 },
  { year: 1994, month: 6, solarTermName: '망종', datetime: '1994-06-06T06:04:00+09:00', sajuMonth: 5 },
  { year: 1994, month: 7, solarTermName: '소서', datetime: '1994-07-07T16:19:00+09:00', sajuMonth: 6 },
  { year: 1994, month: 8, solarTermName: '입추', datetime: '1994-08-08T02:04:00+09:00', sajuMonth: 7 },
  { year: 1994, month: 9, solarTermName: '백로', datetime: '1994-09-08T04:55:00+09:00', sajuMonth: 8 },
  { year: 1994, month: 10, solarTermName: '한로', datetime: '1994-10-08T20:29:00+09:00', sajuMonth: 9 },
  { year: 1994, month: 11, solarTermName: '입동', datetime: '1994-11-07T23:35:00+09:00', sajuMonth: 10 },
  { year: 1994, month: 12, solarTermName: '대설', datetime: '1994-12-07T16:22:00+09:00', sajuMonth: 11 },

  // 1995년
  { year: 1995, month: 1, solarTermName: '소한', datetime: '1995-01-06T03:34:00+09:00', sajuMonth: 12 },
  { year: 1995, month: 2, solarTermName: '입춘', datetime: '1995-02-04T15:12:00+09:00', sajuMonth: 1 },
  { year: 1995, month: 3, solarTermName: '경칩', datetime: '1995-03-06T09:16:00+09:00', sajuMonth: 2 },
  { year: 1995, month: 4, solarTermName: '청명', datetime: '1995-04-05T14:08:00+09:00', sajuMonth: 3 },
  { year: 1995, month: 5, solarTermName: '입하', datetime: '1995-05-06T07:30:00+09:00', sajuMonth: 4 },
  { year: 1995, month: 6, solarTermName: '망종', datetime: '1995-06-06T11:42:00+09:00', sajuMonth: 5 },
  { year: 1995, month: 7, solarTermName: '소서', datetime: '1995-07-07T22:01:00+09:00', sajuMonth: 6 },
  { year: 1995, month: 8, solarTermName: '입추', datetime: '1995-08-08T07:51:00+09:00', sajuMonth: 7 },
  { year: 1995, month: 9, solarTermName: '백로', datetime: '1995-09-08T10:48:00+09:00', sajuMonth: 8 },
  { year: 1995, month: 10, solarTermName: '한로', datetime: '1995-10-09T02:27:00+09:00', sajuMonth: 9 },
  { year: 1995, month: 11, solarTermName: '입동', datetime: '1995-11-08T05:35:00+09:00', sajuMonth: 10 },
  { year: 1995, month: 12, solarTermName: '대설', datetime: '1995-12-07T22:22:00+09:00', sajuMonth: 11 },

  // 1996년
  { year: 1996, month: 1, solarTermName: '소한', datetime: '1996-01-06T09:31:00+09:00', sajuMonth: 12 },
  { year: 1996, month: 2, solarTermName: '입춘', datetime: '1996-02-04T21:07:00+09:00', sajuMonth: 1 },
  { year: 1996, month: 3, solarTermName: '경칩', datetime: '1996-03-05T15:09:00+09:00', sajuMonth: 2 },
  { year: 1996, month: 4, solarTermName: '청명', datetime: '1996-04-04T20:02:00+09:00', sajuMonth: 3 },
  { year: 1996, month: 5, solarTermName: '입하', datetime: '1996-05-05T13:26:00+09:00', sajuMonth: 4 },
  { year: 1996, month: 6, solarTermName: '망종', datetime: '1996-06-05T17:40:00+09:00', sajuMonth: 5 },
  { year: 1996, month: 7, solarTermName: '소서', datetime: '1996-07-07T04:00:00+09:00', sajuMonth: 6 },
  { year: 1996, month: 8, solarTermName: '입추', datetime: '1996-08-07T13:48:00+09:00', sajuMonth: 7 },
  { year: 1996, month: 9, solarTermName: '백로', datetime: '1996-09-07T16:42:00+09:00', sajuMonth: 8 },
  { year: 1996, month: 10, solarTermName: '한로', datetime: '1996-10-08T08:18:00+09:00', sajuMonth: 9 },
  { year: 1996, month: 11, solarTermName: '입동', datetime: '1996-11-07T11:26:00+09:00', sajuMonth: 10 },
  { year: 1996, month: 12, solarTermName: '대설', datetime: '1996-12-07T04:14:00+09:00', sajuMonth: 11 },

  // 1997년
  { year: 1997, month: 1, solarTermName: '소한', datetime: '1997-01-05T15:24:00+09:00', sajuMonth: 12 },
  { year: 1997, month: 2, solarTermName: '입춘', datetime: '1997-02-04T03:01:00+09:00', sajuMonth: 1 },
  { year: 1997, month: 3, solarTermName: '경칩', datetime: '1997-03-05T21:04:00+09:00', sajuMonth: 2 },
  { year: 1997, month: 4, solarTermName: '청명', datetime: '1997-04-05T01:56:00+09:00', sajuMonth: 3 },
  { year: 1997, month: 5, solarTermName: '입하', datetime: '1997-05-05T19:19:00+09:00', sajuMonth: 4 },
  { year: 1997, month: 6, solarTermName: '망종', datetime: '1997-06-05T23:32:00+09:00', sajuMonth: 5 },
  { year: 1997, month: 7, solarTermName: '소서', datetime: '1997-07-07T09:49:00+09:00', sajuMonth: 6 },
  { year: 1997, month: 8, solarTermName: '입추', datetime: '1997-08-07T19:36:00+09:00', sajuMonth: 7 },
  { year: 1997, month: 9, solarTermName: '백로', datetime: '1997-09-07T22:28:00+09:00', sajuMonth: 8 },
  { year: 1997, month: 10, solarTermName: '한로', datetime: '1997-10-08T14:05:00+09:00', sajuMonth: 9 },
  { year: 1997, month: 11, solarTermName: '입동', datetime: '1997-11-07T17:14:00+09:00', sajuMonth: 10 },
  { year: 1997, month: 12, solarTermName: '대설', datetime: '1997-12-07T10:04:00+09:00', sajuMonth: 11 },

  // 1998년
  { year: 1998, month: 1, solarTermName: '소한', datetime: '1998-01-05T21:18:00+09:00', sajuMonth: 12 },
  { year: 1998, month: 2, solarTermName: '입춘', datetime: '1998-02-04T08:56:00+09:00', sajuMonth: 1 },
  { year: 1998, month: 3, solarTermName: '경칩', datetime: '1998-03-06T02:57:00+09:00', sajuMonth: 2 },
  { year: 1998, month: 4, solarTermName: '청명', datetime: '1998-04-05T07:44:00+09:00', sajuMonth: 3 },
  { year: 1998, month: 5, solarTermName: '입하', datetime: '1998-05-06T01:03:00+09:00', sajuMonth: 4 },
  { year: 1998, month: 6, solarTermName: '망종', datetime: '1998-06-06T05:13:00+09:00', sajuMonth: 5 },
  { year: 1998, month: 7, solarTermName: '소서', datetime: '1998-07-07T15:30:00+09:00', sajuMonth: 6 },
  { year: 1998, month: 8, solarTermName: '입추', datetime: '1998-08-08T01:19:00+09:00', sajuMonth: 7 },
  { year: 1998, month: 9, solarTermName: '백로', datetime: '1998-09-08T04:15:00+09:00', sajuMonth: 8 },
  { year: 1998, month: 10, solarTermName: '한로', datetime: '1998-10-08T19:55:00+09:00', sajuMonth: 9 },
  { year: 1998, month: 11, solarTermName: '입동', datetime: '1998-11-07T23:08:00+09:00', sajuMonth: 10 },
  { year: 1998, month: 12, solarTermName: '대설', datetime: '1998-12-07T16:01:00+09:00', sajuMonth: 11 },

  // 1999년
  { year: 1999, month: 1, solarTermName: '소한', datetime: '1999-01-06T03:17:00+09:00', sajuMonth: 12 },
  { year: 1999, month: 2, solarTermName: '입춘', datetime: '1999-02-04T14:57:00+09:00', sajuMonth: 1 },
  { year: 1999, month: 3, solarTermName: '경칩', datetime: '1999-03-06T08:57:00+09:00', sajuMonth: 2 },
  { year: 1999, month: 4, solarTermName: '청명', datetime: '1999-04-05T13:44:00+09:00', sajuMonth: 3 },
  { year: 1999, month: 5, solarTermName: '입하', datetime: '1999-05-06T07:01:00+09:00', sajuMonth: 4 },
  { year: 1999, month: 6, solarTermName: '망종', datetime: '1999-06-06T11:09:00+09:00', sajuMonth: 5 },
  { year: 1999, month: 7, solarTermName: '소서', datetime: '1999-07-07T21:24:00+09:00', sajuMonth: 6 },
  { year: 1999, month: 8, solarTermName: '입추', datetime: '1999-08-08T07:14:00+09:00', sajuMonth: 7 },
  { year: 1999, month: 9, solarTermName: '백로', datetime: '1999-09-08T10:09:00+09:00', sajuMonth: 8 },
  { year: 1999, month: 10, solarTermName: '한로', datetime: '1999-10-09T01:48:00+09:00', sajuMonth: 9 },
  { year: 1999, month: 11, solarTermName: '입동', datetime: '1999-11-08T04:57:00+09:00', sajuMonth: 10 },
  { year: 1999, month: 12, solarTermName: '대설', datetime: '1999-12-07T21:47:00+09:00', sajuMonth: 11 },

  // 2000년
  { year: 2000, month: 1, solarTermName: '소한', datetime: '2000-01-06T09:00:00+09:00', sajuMonth: 12 },
  { year: 2000, month: 2, solarTermName: '입춘', datetime: '2000-02-04T20:40:00+09:00', sajuMonth: 1 },
  { year: 2000, month: 3, solarTermName: '경칩', datetime: '2000-03-05T14:42:00+09:00', sajuMonth: 2 },
  { year: 2000, month: 4, solarTermName: '청명', datetime: '2000-04-04T19:31:00+09:00', sajuMonth: 3 },
  { year: 2000, month: 5, solarTermName: '입하', datetime: '2000-05-05T12:50:00+09:00', sajuMonth: 4 },
  { year: 2000, month: 6, solarTermName: '망종', datetime: '2000-06-05T16:58:00+09:00', sajuMonth: 5 },
  { year: 2000, month: 7, solarTermName: '소서', datetime: '2000-07-07T03:13:00+09:00', sajuMonth: 6 },
  { year: 2000, month: 8, solarTermName: '입추', datetime: '2000-08-07T13:02:00+09:00', sajuMonth: 7 },
  { year: 2000, month: 9, solarTermName: '백로', datetime: '2000-09-07T15:59:00+09:00', sajuMonth: 8 },
  { year: 2000, month: 10, solarTermName: '한로', datetime: '2000-10-08T07:38:00+09:00', sajuMonth: 9 },
  { year: 2000, month: 11, solarTermName: '입동', datetime: '2000-11-07T10:48:00+09:00', sajuMonth: 10 },
  { year: 2000, month: 12, solarTermName: '대설', datetime: '2000-12-07T03:37:00+09:00', sajuMonth: 11 },

  // 2001년
  { year: 2001, month: 1, solarTermName: '소한', datetime: '2001-01-05T14:49:00+09:00', sajuMonth: 12 },
  { year: 2001, month: 2, solarTermName: '입춘', datetime: '2001-02-04T02:28:00+09:00', sajuMonth: 1 },
  { year: 2001, month: 3, solarTermName: '경칩', datetime: '2001-03-05T20:32:00+09:00', sajuMonth: 2 },
  { year: 2001, month: 4, solarTermName: '청명', datetime: '2001-04-05T01:24:00+09:00', sajuMonth: 3 },
  { year: 2001, month: 5, solarTermName: '입하', datetime: '2001-05-05T18:44:00+09:00', sajuMonth: 4 },
  { year: 2001, month: 6, solarTermName: '망종', datetime: '2001-06-05T22:53:00+09:00', sajuMonth: 5 },
  { year: 2001, month: 7, solarTermName: '소서', datetime: '2001-07-07T09:06:00+09:00', sajuMonth: 6 },
  { year: 2001, month: 8, solarTermName: '입추', datetime: '2001-08-07T18:52:00+09:00', sajuMonth: 7 },
  { year: 2001, month: 9, solarTermName: '백로', datetime: '2001-09-07T21:46:00+09:00', sajuMonth: 8 },
  { year: 2001, month: 10, solarTermName: '한로', datetime: '2001-10-08T13:25:00+09:00', sajuMonth: 9 },
  { year: 2001, month: 11, solarTermName: '입동', datetime: '2001-11-07T16:36:00+09:00', sajuMonth: 10 },
  { year: 2001, month: 12, solarTermName: '대설', datetime: '2001-12-07T09:28:00+09:00', sajuMonth: 11 },

  // 2002년
  { year: 2002, month: 1, solarTermName: '소한', datetime: '2002-01-05T20:43:00+09:00', sajuMonth: 12 },
  { year: 2002, month: 2, solarTermName: '입춘', datetime: '2002-02-04T08:24:00+09:00', sajuMonth: 1 },
  { year: 2002, month: 3, solarTermName: '경칩', datetime: '2002-03-06T02:27:00+09:00', sajuMonth: 2 },
  { year: 2002, month: 4, solarTermName: '청명', datetime: '2002-04-05T07:18:00+09:00', sajuMonth: 3 },
  { year: 2002, month: 5, solarTermName: '입하', datetime: '2002-05-06T00:37:00+09:00', sajuMonth: 4 },
  { year: 2002, month: 6, solarTermName: '망종', datetime: '2002-06-06T04:44:00+09:00', sajuMonth: 5 },
  { year: 2002, month: 7, solarTermName: '소서', datetime: '2002-07-07T14:56:00+09:00', sajuMonth: 6 },
  { year: 2002, month: 8, solarTermName: '입추', datetime: '2002-08-08T00:39:00+09:00', sajuMonth: 7 },
  { year: 2002, month: 9, solarTermName: '백로', datetime: '2002-09-08T03:31:00+09:00', sajuMonth: 8 },
  { year: 2002, month: 10, solarTermName: '한로', datetime: '2002-10-08T19:09:00+09:00', sajuMonth: 9 },
  { year: 2002, month: 11, solarTermName: '입동', datetime: '2002-11-07T22:21:00+09:00', sajuMonth: 10 },
  { year: 2002, month: 12, solarTermName: '대설', datetime: '2002-12-07T15:14:00+09:00', sajuMonth: 11 },

  // 2003년
  { year: 2003, month: 1, solarTermName: '소한', datetime: '2003-01-06T02:27:00+09:00', sajuMonth: 12 },
  { year: 2003, month: 2, solarTermName: '입춘', datetime: '2003-02-04T14:05:00+09:00', sajuMonth: 1 },
  { year: 2003, month: 3, solarTermName: '경칩', datetime: '2003-03-06T08:04:00+09:00', sajuMonth: 2 },
  { year: 2003, month: 4, solarTermName: '청명', datetime: '2003-04-05T12:52:00+09:00', sajuMonth: 3 },
  { year: 2003, month: 5, solarTermName: '입하', datetime: '2003-05-06T06:10:00+09:00', sajuMonth: 4 },
  { year: 2003, month: 6, solarTermName: '망종', datetime: '2003-06-06T10:19:00+09:00', sajuMonth: 5 },
  { year: 2003, month: 7, solarTermName: '소서', datetime: '2003-07-07T20:35:00+09:00', sajuMonth: 6 },
  { year: 2003, month: 8, solarTermName: '입추', datetime: '2003-08-08T06:24:00+09:00', sajuMonth: 7 },
  { year: 2003, month: 9, solarTermName: '백로', datetime: '2003-09-08T09:20:00+09:00', sajuMonth: 8 },
  { year: 2003, month: 10, solarTermName: '한로', datetime: '2003-10-09T01:00:00+09:00', sajuMonth: 9 },
  { year: 2003, month: 11, solarTermName: '입동', datetime: '2003-11-08T04:13:00+09:00', sajuMonth: 10 },
  { year: 2003, month: 12, solarTermName: '대설', datetime: '2003-12-07T21:05:00+09:00', sajuMonth: 11 },

  // 2004년
  { year: 2004, month: 1, solarTermName: '소한', datetime: '2004-01-06T08:18:00+09:00', sajuMonth: 12 },
  { year: 2004, month: 2, solarTermName: '입춘', datetime: '2004-02-04T19:56:00+09:00', sajuMonth: 1 },
  { year: 2004, month: 3, solarTermName: '경칩', datetime: '2004-03-05T13:55:00+09:00', sajuMonth: 2 },
  { year: 2004, month: 4, solarTermName: '청명', datetime: '2004-04-04T18:43:00+09:00', sajuMonth: 3 },
  { year: 2004, month: 5, solarTermName: '입하', datetime: '2004-05-05T12:02:00+09:00', sajuMonth: 4 },
  { year: 2004, month: 6, solarTermName: '망종', datetime: '2004-06-05T16:13:00+09:00', sajuMonth: 5 },
  { year: 2004, month: 7, solarTermName: '소서', datetime: '2004-07-07T02:31:00+09:00', sajuMonth: 6 },
  { year: 2004, month: 8, solarTermName: '입추', datetime: '2004-08-07T12:19:00+09:00', sajuMonth: 7 },
  { year: 2004, month: 9, solarTermName: '백로', datetime: '2004-09-07T15:12:00+09:00', sajuMonth: 8 },
  { year: 2004, month: 10, solarTermName: '한로', datetime: '2004-10-08T06:49:00+09:00', sajuMonth: 9 },
  { year: 2004, month: 11, solarTermName: '입동', datetime: '2004-11-07T09:58:00+09:00', sajuMonth: 10 },
  { year: 2004, month: 12, solarTermName: '대설', datetime: '2004-12-07T02:48:00+09:00', sajuMonth: 11 },

  // 2005년
  { year: 2005, month: 1, solarTermName: '소한', datetime: '2005-01-05T14:02:00+09:00', sajuMonth: 12 },
  { year: 2005, month: 2, solarTermName: '입춘', datetime: '2005-02-04T01:43:00+09:00', sajuMonth: 1 },
  { year: 2005, month: 3, solarTermName: '경칩', datetime: '2005-03-05T19:45:00+09:00', sajuMonth: 2 },
  { year: 2005, month: 4, solarTermName: '청명', datetime: '2005-04-05T00:34:00+09:00', sajuMonth: 3 },
  { year: 2005, month: 5, solarTermName: '입하', datetime: '2005-05-05T17:52:00+09:00', sajuMonth: 4 },
  { year: 2005, month: 6, solarTermName: '망종', datetime: '2005-06-05T22:01:00+09:00', sajuMonth: 5 },
  { year: 2005, month: 7, solarTermName: '소서', datetime: '2005-07-07T08:16:00+09:00', sajuMonth: 6 },
  { year: 2005, month: 8, solarTermName: '입추', datetime: '2005-08-07T18:03:00+09:00', sajuMonth: 7 },
  { year: 2005, month: 9, solarTermName: '백로', datetime: '2005-09-07T20:56:00+09:00', sajuMonth: 8 },
  { year: 2005, month: 10, solarTermName: '한로', datetime: '2005-10-08T12:33:00+09:00', sajuMonth: 9 },
  { year: 2005, month: 11, solarTermName: '입동', datetime: '2005-11-07T15:42:00+09:00', sajuMonth: 10 },
  { year: 2005, month: 12, solarTermName: '대설', datetime: '2005-12-07T08:32:00+09:00', sajuMonth: 11 },

  // 2006년
  { year: 2006, month: 1, solarTermName: '소한', datetime: '2006-01-05T19:46:00+09:00', sajuMonth: 12 },
  { year: 2006, month: 2, solarTermName: '입춘', datetime: '2006-02-04T07:27:00+09:00', sajuMonth: 1 },
  { year: 2006, month: 3, solarTermName: '경칩', datetime: '2006-03-06T01:28:00+09:00', sajuMonth: 2 },
  { year: 2006, month: 4, solarTermName: '청명', datetime: '2006-04-05T06:15:00+09:00', sajuMonth: 3 },
  { year: 2006, month: 5, solarTermName: '입하', datetime: '2006-05-05T23:30:00+09:00', sajuMonth: 4 },
  { year: 2006, month: 6, solarTermName: '망종', datetime: '2006-06-06T03:36:00+09:00', sajuMonth: 5 },
  { year: 2006, month: 7, solarTermName: '소서', datetime: '2006-07-07T13:51:00+09:00', sajuMonth: 6 },
  { year: 2006, month: 8, solarTermName: '입추', datetime: '2006-08-07T23:40:00+09:00', sajuMonth: 7 },
  { year: 2006, month: 9, solarTermName: '백로', datetime: '2006-09-08T02:39:00+09:00', sajuMonth: 8 },
  { year: 2006, month: 10, solarTermName: '한로', datetime: '2006-10-08T18:21:00+09:00', sajuMonth: 9 },
  { year: 2006, month: 11, solarTermName: '입동', datetime: '2006-11-07T21:34:00+09:00', sajuMonth: 10 },
  { year: 2006, month: 12, solarTermName: '대설', datetime: '2006-12-07T14:26:00+09:00', sajuMonth: 11 },

  // 2007년
  { year: 2007, month: 1, solarTermName: '소한', datetime: '2007-01-06T01:40:00+09:00', sajuMonth: 12 },
  { year: 2007, month: 2, solarTermName: '입춘', datetime: '2007-02-04T13:18:00+09:00', sajuMonth: 1 },
  { year: 2007, month: 3, solarTermName: '경칩', datetime: '2007-03-06T07:17:00+09:00', sajuMonth: 2 },
  { year: 2007, month: 4, solarTermName: '청명', datetime: '2007-04-05T12:04:00+09:00', sajuMonth: 3 },
  { year: 2007, month: 5, solarTermName: '입하', datetime: '2007-05-06T05:20:00+09:00', sajuMonth: 4 },
  { year: 2007, month: 6, solarTermName: '망종', datetime: '2007-06-06T09:27:00+09:00', sajuMonth: 5 },
  { year: 2007, month: 7, solarTermName: '소서', datetime: '2007-07-07T19:41:00+09:00', sajuMonth: 6 },
  { year: 2007, month: 8, solarTermName: '입추', datetime: '2007-08-08T05:31:00+09:00', sajuMonth: 7 },
  { year: 2007, month: 9, solarTermName: '백로', datetime: '2007-09-08T08:29:00+09:00', sajuMonth: 8 },
  { year: 2007, month: 10, solarTermName: '한로', datetime: '2007-10-09T00:11:00+09:00', sajuMonth: 9 },
  { year: 2007, month: 11, solarTermName: '입동', datetime: '2007-11-08T03:24:00+09:00', sajuMonth: 10 },
  { year: 2007, month: 12, solarTermName: '대설', datetime: '2007-12-07T20:14:00+09:00', sajuMonth: 11 },

  // 2008년
  { year: 2008, month: 1, solarTermName: '소한', datetime: '2008-01-06T07:24:00+09:00', sajuMonth: 12 },
  { year: 2008, month: 2, solarTermName: '입춘', datetime: '2008-02-04T19:00:00+09:00', sajuMonth: 1 },
  { year: 2008, month: 3, solarTermName: '경칩', datetime: '2008-03-05T12:58:00+09:00', sajuMonth: 2 },
  { year: 2008, month: 4, solarTermName: '청명', datetime: '2008-04-04T17:45:00+09:00', sajuMonth: 3 },
  { year: 2008, month: 5, solarTermName: '입하', datetime: '2008-05-05T11:03:00+09:00', sajuMonth: 4 },
  { year: 2008, month: 6, solarTermName: '망종', datetime: '2008-06-05T15:11:00+09:00', sajuMonth: 5 },
  { year: 2008, month: 7, solarTermName: '소서', datetime: '2008-07-07T01:26:00+09:00', sajuMonth: 6 },
  { year: 2008, month: 8, solarTermName: '입추', datetime: '2008-08-07T11:16:00+09:00', sajuMonth: 7 },
  { year: 2008, month: 9, solarTermName: '백로', datetime: '2008-09-07T14:14:00+09:00', sajuMonth: 8 },
  { year: 2008, month: 10, solarTermName: '한로', datetime: '2008-10-08T05:56:00+09:00', sajuMonth: 9 },
  { year: 2008, month: 11, solarTermName: '입동', datetime: '2008-11-07T09:10:00+09:00', sajuMonth: 10 },
  { year: 2008, month: 12, solarTermName: '대설', datetime: '2008-12-07T02:02:00+09:00', sajuMonth: 11 },

  // 2009년
  { year: 2009, month: 1, solarTermName: '소한', datetime: '2009-01-05T13:14:00+09:00', sajuMonth: 12 },
  { year: 2009, month: 2, solarTermName: '입춘', datetime: '2009-02-04T00:49:00+09:00', sajuMonth: 1 },
  { year: 2009, month: 3, solarTermName: '경칩', datetime: '2009-03-05T18:47:00+09:00', sajuMonth: 2 },
  { year: 2009, month: 4, solarTermName: '청명', datetime: '2009-04-04T23:33:00+09:00', sajuMonth: 3 },
  { year: 2009, month: 5, solarTermName: '입하', datetime: '2009-05-05T16:50:00+09:00', sajuMonth: 4 },
  { year: 2009, month: 6, solarTermName: '망종', datetime: '2009-06-05T20:59:00+09:00', sajuMonth: 5 },
  { year: 2009, month: 7, solarTermName: '소서', datetime: '2009-07-07T07:13:00+09:00', sajuMonth: 6 },
  { year: 2009, month: 8, solarTermName: '입추', datetime: '2009-08-07T17:01:00+09:00', sajuMonth: 7 },
  { year: 2009, month: 9, solarTermName: '백로', datetime: '2009-09-07T19:57:00+09:00', sajuMonth: 8 },
  { year: 2009, month: 10, solarTermName: '한로', datetime: '2009-10-08T11:40:00+09:00', sajuMonth: 9 },
  { year: 2009, month: 11, solarTermName: '입동', datetime: '2009-11-07T14:56:00+09:00', sajuMonth: 10 },
  { year: 2009, month: 12, solarTermName: '대설', datetime: '2009-12-07T07:52:00+09:00', sajuMonth: 11 },

  // 2010년
  { year: 2010, month: 1, solarTermName: '소한', datetime: '2010-01-05T19:08:00+09:00', sajuMonth: 12 },
  { year: 2010, month: 2, solarTermName: '입춘', datetime: '2010-02-04T06:47:00+09:00', sajuMonth: 1 },
  { year: 2010, month: 3, solarTermName: '경칩', datetime: '2010-03-06T00:46:00+09:00', sajuMonth: 2 },
  { year: 2010, month: 4, solarTermName: '청명', datetime: '2010-04-05T05:30:00+09:00', sajuMonth: 3 },
  { year: 2010, month: 5, solarTermName: '입하', datetime: '2010-05-05T22:44:00+09:00', sajuMonth: 4 },
  { year: 2010, month: 6, solarTermName: '망종', datetime: '2010-06-06T02:49:00+09:00', sajuMonth: 5 },
  { year: 2010, month: 7, solarTermName: '소서', datetime: '2010-07-07T13:02:00+09:00', sajuMonth: 6 },
  { year: 2010, month: 8, solarTermName: '입추', datetime: '2010-08-07T22:49:00+09:00', sajuMonth: 7 },
  { year: 2010, month: 9, solarTermName: '백로', datetime: '2010-09-08T01:44:00+09:00', sajuMonth: 8 },
  { year: 2010, month: 10, solarTermName: '한로', datetime: '2010-10-08T17:26:00+09:00', sajuMonth: 9 },
  { year: 2010, month: 11, solarTermName: '입동', datetime: '2010-11-07T20:42:00+09:00', sajuMonth: 10 },
  { year: 2010, month: 12, solarTermName: '대설', datetime: '2010-12-07T13:38:00+09:00', sajuMonth: 11 },

  // 2011년
  { year: 2011, month: 1, solarTermName: '소한', datetime: '2011-01-06T00:54:00+09:00', sajuMonth: 12 },
  { year: 2011, month: 2, solarTermName: '입춘', datetime: '2011-02-04T12:32:00+09:00', sajuMonth: 1 },
  { year: 2011, month: 3, solarTermName: '경칩', datetime: '2011-03-06T06:29:00+09:00', sajuMonth: 2 },
  { year: 2011, month: 4, solarTermName: '청명', datetime: '2011-04-05T11:11:00+09:00', sajuMonth: 3 },
  { year: 2011, month: 5, solarTermName: '입하', datetime: '2011-05-06T04:23:00+09:00', sajuMonth: 4 },
  { year: 2011, month: 6, solarTermName: '망종', datetime: '2011-06-06T08:27:00+09:00', sajuMonth: 5 },
  { year: 2011, month: 7, solarTermName: '소서', datetime: '2011-07-07T18:42:00+09:00', sajuMonth: 6 },
  { year: 2011, month: 8, solarTermName: '입추', datetime: '2011-08-08T04:33:00+09:00', sajuMonth: 7 },
  { year: 2011, month: 9, solarTermName: '백로', datetime: '2011-09-08T07:34:00+09:00', sajuMonth: 8 },
  { year: 2011, month: 10, solarTermName: '한로', datetime: '2011-10-08T23:19:00+09:00', sajuMonth: 9 },
  { year: 2011, month: 11, solarTermName: '입동', datetime: '2011-11-08T02:34:00+09:00', sajuMonth: 10 },
  { year: 2011, month: 12, solarTermName: '대설', datetime: '2011-12-07T19:29:00+09:00', sajuMonth: 11 },

  // 2012년
  { year: 2012, month: 1, solarTermName: '소한', datetime: '2012-01-06T06:43:00+09:00', sajuMonth: 12 },
  { year: 2012, month: 2, solarTermName: '입춘', datetime: '2012-02-04T18:22:00+09:00', sajuMonth: 1 },
  { year: 2012, month: 3, solarTermName: '경칩', datetime: '2012-03-05T12:21:00+09:00', sajuMonth: 2 },
  { year: 2012, month: 4, solarTermName: '청명', datetime: '2012-04-04T17:05:00+09:00', sajuMonth: 3 },
  { year: 2012, month: 5, solarTermName: '입하', datetime: '2012-05-05T10:19:00+09:00', sajuMonth: 4 },
  { year: 2012, month: 6, solarTermName: '망종', datetime: '2012-06-05T14:25:00+09:00', sajuMonth: 5 },
  { year: 2012, month: 7, solarTermName: '소서', datetime: '2012-07-07T00:40:00+09:00', sajuMonth: 6 },
  { year: 2012, month: 8, solarTermName: '입추', datetime: '2012-08-07T10:30:00+09:00', sajuMonth: 7 },
  { year: 2012, month: 9, solarTermName: '백로', datetime: '2012-09-07T13:29:00+09:00', sajuMonth: 8 },
  { year: 2012, month: 10, solarTermName: '한로', datetime: '2012-10-08T05:11:00+09:00', sajuMonth: 9 },
  { year: 2012, month: 11, solarTermName: '입동', datetime: '2012-11-07T08:25:00+09:00', sajuMonth: 10 },
  { year: 2012, month: 12, solarTermName: '대설', datetime: '2012-12-07T01:18:00+09:00', sajuMonth: 11 },

  // 2013년
  { year: 2013, month: 1, solarTermName: '소한', datetime: '2013-01-05T12:33:00+09:00', sajuMonth: 12 },
  { year: 2013, month: 2, solarTermName: '입춘', datetime: '2013-02-04T00:13:00+09:00', sajuMonth: 1 },
  { year: 2013, month: 3, solarTermName: '경칩', datetime: '2013-03-05T18:14:00+09:00', sajuMonth: 2 },
  { year: 2013, month: 4, solarTermName: '청명', datetime: '2013-04-04T23:02:00+09:00', sajuMonth: 3 },
  { year: 2013, month: 5, solarTermName: '입하', datetime: '2013-05-05T16:18:00+09:00', sajuMonth: 4 },
  { year: 2013, month: 6, solarTermName: '망종', datetime: '2013-06-05T20:23:00+09:00', sajuMonth: 5 },
  { year: 2013, month: 7, solarTermName: '소서', datetime: '2013-07-07T06:34:00+09:00', sajuMonth: 6 },
  { year: 2013, month: 8, solarTermName: '입추', datetime: '2013-08-07T16:20:00+09:00', sajuMonth: 7 },
  { year: 2013, month: 9, solarTermName: '백로', datetime: '2013-09-07T19:16:00+09:00', sajuMonth: 8 },
  { year: 2013, month: 10, solarTermName: '한로', datetime: '2013-10-08T10:58:00+09:00', sajuMonth: 9 },
  { year: 2013, month: 11, solarTermName: '입동', datetime: '2013-11-07T14:13:00+09:00', sajuMonth: 10 },
  { year: 2013, month: 12, solarTermName: '대설', datetime: '2013-12-07T07:08:00+09:00', sajuMonth: 11 },

  // 2014년
  { year: 2014, month: 1, solarTermName: '소한', datetime: '2014-01-05T18:24:00+09:00', sajuMonth: 12 },
  { year: 2014, month: 2, solarTermName: '입춘', datetime: '2014-02-04T06:03:00+09:00', sajuMonth: 1 },
  { year: 2014, month: 3, solarTermName: '경칩', datetime: '2014-03-06T00:02:00+09:00', sajuMonth: 2 },
  { year: 2014, month: 4, solarTermName: '청명', datetime: '2014-04-05T04:46:00+09:00', sajuMonth: 3 },
  { year: 2014, month: 5, solarTermName: '입하', datetime: '2014-05-05T21:59:00+09:00', sajuMonth: 4 },
  { year: 2014, month: 6, solarTermName: '망종', datetime: '2014-06-06T02:03:00+09:00', sajuMonth: 5 },
  { year: 2014, month: 7, solarTermName: '소서', datetime: '2014-07-07T12:14:00+09:00', sajuMonth: 6 },
  { year: 2014, month: 8, solarTermName: '입추', datetime: '2014-08-07T22:02:00+09:00', sajuMonth: 7 },
  { year: 2014, month: 9, solarTermName: '백로', datetime: '2014-09-08T01:01:00+09:00', sajuMonth: 8 },
  { year: 2014, month: 10, solarTermName: '한로', datetime: '2014-10-08T16:47:00+09:00', sajuMonth: 9 },
  { year: 2014, month: 11, solarTermName: '입동', datetime: '2014-11-07T20:06:00+09:00', sajuMonth: 10 },
  { year: 2014, month: 12, solarTermName: '대설', datetime: '2014-12-07T13:04:00+09:00', sajuMonth: 11 },

  // 2015년
  { year: 2015, month: 1, solarTermName: '소한', datetime: '2015-01-06T00:20:00+09:00', sajuMonth: 12 },
  { year: 2015, month: 2, solarTermName: '입춘', datetime: '2015-02-04T11:58:00+09:00', sajuMonth: 1 },
  { year: 2015, month: 3, solarTermName: '경칩', datetime: '2015-03-06T05:55:00+09:00', sajuMonth: 2 },
  { year: 2015, month: 4, solarTermName: '청명', datetime: '2015-04-05T10:39:00+09:00', sajuMonth: 3 },
  { year: 2015, month: 5, solarTermName: '입하', datetime: '2015-05-06T03:52:00+09:00', sajuMonth: 4 },
  { year: 2015, month: 6, solarTermName: '망종', datetime: '2015-06-06T07:58:00+09:00', sajuMonth: 5 },
  { year: 2015, month: 7, solarTermName: '소서', datetime: '2015-07-07T18:12:00+09:00', sajuMonth: 6 },
  { year: 2015, month: 8, solarTermName: '입추', datetime: '2015-08-08T04:01:00+09:00', sajuMonth: 7 },
  { year: 2015, month: 9, solarTermName: '백로', datetime: '2015-09-08T06:59:00+09:00', sajuMonth: 8 },
  { year: 2015, month: 10, solarTermName: '한로', datetime: '2015-10-08T22:42:00+09:00', sajuMonth: 9 },
  { year: 2015, month: 11, solarTermName: '입동', datetime: '2015-11-08T01:58:00+09:00', sajuMonth: 10 },
  { year: 2015, month: 12, solarTermName: '대설', datetime: '2015-12-07T18:53:00+09:00', sajuMonth: 11 },

  // 2016년
  { year: 2016, month: 1, solarTermName: '소한', datetime: '2016-01-06T06:08:00+09:00', sajuMonth: 12 },
  { year: 2016, month: 2, solarTermName: '입춘', datetime: '2016-02-04T17:46:00+09:00', sajuMonth: 1 },
  { year: 2016, month: 3, solarTermName: '경칩', datetime: '2016-03-05T11:43:00+09:00', sajuMonth: 2 },
  { year: 2016, month: 4, solarTermName: '청명', datetime: '2016-04-04T16:27:00+09:00', sajuMonth: 3 },
  { year: 2016, month: 5, solarTermName: '입하', datetime: '2016-05-05T09:41:00+09:00', sajuMonth: 4 },
  { year: 2016, month: 6, solarTermName: '망종', datetime: '2016-06-05T13:48:00+09:00', sajuMonth: 5 },
  { year: 2016, month: 7, solarTermName: '소서', datetime: '2016-07-07T00:03:00+09:00', sajuMonth: 6 },
  { year: 2016, month: 8, solarTermName: '입추', datetime: '2016-08-07T09:53:00+09:00', sajuMonth: 7 },
  { year: 2016, month: 9, solarTermName: '백로', datetime: '2016-09-07T12:51:00+09:00', sajuMonth: 8 },
  { year: 2016, month: 10, solarTermName: '한로', datetime: '2016-10-08T04:33:00+09:00', sajuMonth: 9 },
  { year: 2016, month: 11, solarTermName: '입동', datetime: '2016-11-07T07:47:00+09:00', sajuMonth: 10 },
  { year: 2016, month: 12, solarTermName: '대설', datetime: '2016-12-07T00:41:00+09:00', sajuMonth: 11 },

  // 2017년
  { year: 2017, month: 1, solarTermName: '소한', datetime: '2017-01-05T11:55:00+09:00', sajuMonth: 12 },
  { year: 2017, month: 2, solarTermName: '입춘', datetime: '2017-02-03T23:34:00+09:00', sajuMonth: 1 },
  { year: 2017, month: 3, solarTermName: '경칩', datetime: '2017-03-05T17:32:00+09:00', sajuMonth: 2 },
  { year: 2017, month: 4, solarTermName: '청명', datetime: '2017-04-04T22:17:00+09:00', sajuMonth: 3 },
  { year: 2017, month: 5, solarTermName: '입하', datetime: '2017-05-05T15:31:00+09:00', sajuMonth: 4 },
  { year: 2017, month: 6, solarTermName: '망종', datetime: '2017-06-05T19:36:00+09:00', sajuMonth: 5 },
  { year: 2017, month: 7, solarTermName: '소서', datetime: '2017-07-07T05:50:00+09:00', sajuMonth: 6 },
  { year: 2017, month: 8, solarTermName: '입추', datetime: '2017-08-07T15:40:00+09:00', sajuMonth: 7 },
  { year: 2017, month: 9, solarTermName: '백로', datetime: '2017-09-07T18:38:00+09:00', sajuMonth: 8 },
  { year: 2017, month: 10, solarTermName: '한로', datetime: '2017-10-08T10:22:00+09:00', sajuMonth: 9 },
  { year: 2017, month: 11, solarTermName: '입동', datetime: '2017-11-07T13:37:00+09:00', sajuMonth: 10 },
  { year: 2017, month: 12, solarTermName: '대설', datetime: '2017-12-07T06:32:00+09:00', sajuMonth: 11 },

  // 2018년
  { year: 2018, month: 1, solarTermName: '소한', datetime: '2018-01-05T17:48:00+09:00', sajuMonth: 12 },
  { year: 2018, month: 2, solarTermName: '입춘', datetime: '2018-02-04T05:28:00+09:00', sajuMonth: 1 },
  { year: 2018, month: 3, solarTermName: '경칩', datetime: '2018-03-05T23:28:00+09:00', sajuMonth: 2 },
  { year: 2018, month: 4, solarTermName: '청명', datetime: '2018-04-05T04:12:00+09:00', sajuMonth: 3 },
  { year: 2018, month: 5, solarTermName: '입하', datetime: '2018-05-05T21:25:00+09:00', sajuMonth: 4 },
  { year: 2018, month: 6, solarTermName: '망종', datetime: '2018-06-06T01:29:00+09:00', sajuMonth: 5 },
  { year: 2018, month: 7, solarTermName: '소서', datetime: '2018-07-07T11:41:00+09:00', sajuMonth: 6 },
  { year: 2018, month: 8, solarTermName: '입추', datetime: '2018-08-07T21:30:00+09:00', sajuMonth: 7 },
  { year: 2018, month: 9, solarTermName: '백로', datetime: '2018-09-08T00:29:00+09:00', sajuMonth: 8 },
  { year: 2018, month: 10, solarTermName: '한로', datetime: '2018-10-08T16:14:00+09:00', sajuMonth: 9 },
  { year: 2018, month: 11, solarTermName: '입동', datetime: '2018-11-07T19:31:00+09:00', sajuMonth: 10 },
  { year: 2018, month: 12, solarTermName: '대설', datetime: '2018-12-07T12:25:00+09:00', sajuMonth: 11 },

  // 2019년
  { year: 2019, month: 1, solarTermName: '소한', datetime: '2019-01-05T23:38:00+09:00', sajuMonth: 12 },
  { year: 2019, month: 2, solarTermName: '입춘', datetime: '2019-02-04T11:14:00+09:00', sajuMonth: 1 },
  { year: 2019, month: 3, solarTermName: '경칩', datetime: '2019-03-06T05:09:00+09:00', sajuMonth: 2 },
  { year: 2019, month: 4, solarTermName: '청명', datetime: '2019-04-05T09:51:00+09:00', sajuMonth: 3 },
  { year: 2019, month: 5, solarTermName: '입하', datetime: '2019-05-06T03:02:00+09:00', sajuMonth: 4 },
  { year: 2019, month: 6, solarTermName: '망종', datetime: '2019-06-06T07:06:00+09:00', sajuMonth: 5 },
  { year: 2019, month: 7, solarTermName: '소서', datetime: '2019-07-07T17:20:00+09:00', sajuMonth: 6 },
  { year: 2019, month: 8, solarTermName: '입추', datetime: '2019-08-08T03:13:00+09:00', sajuMonth: 7 },
  { year: 2019, month: 9, solarTermName: '백로', datetime: '2019-09-08T06:16:00+09:00', sajuMonth: 8 },
  { year: 2019, month: 10, solarTermName: '한로', datetime: '2019-10-08T22:05:00+09:00', sajuMonth: 9 },
  { year: 2019, month: 11, solarTermName: '입동', datetime: '2019-11-08T01:24:00+09:00', sajuMonth: 10 },
  { year: 2019, month: 12, solarTermName: '대설', datetime: '2019-12-07T18:18:00+09:00', sajuMonth: 11 },

  // 2020년
  { year: 2020, month: 1, solarTermName: '소한', datetime: '2020-01-06T05:30:00+09:00', sajuMonth: 12 },
  { year: 2020, month: 2, solarTermName: '입춘', datetime: '2020-02-04T17:03:00+09:00', sajuMonth: 1 },
  { year: 2020, month: 3, solarTermName: '경칩', datetime: '2020-03-05T10:56:00+09:00', sajuMonth: 2 },
  { year: 2020, month: 4, solarTermName: '청명', datetime: '2020-04-04T15:38:00+09:00', sajuMonth: 3 },
  { year: 2020, month: 5, solarTermName: '입하', datetime: '2020-05-05T08:51:00+09:00', sajuMonth: 4 },
  { year: 2020, month: 6, solarTermName: '망종', datetime: '2020-06-05T12:58:00+09:00', sajuMonth: 5 },
  { year: 2020, month: 7, solarTermName: '소서', datetime: '2020-07-06T23:14:00+09:00', sajuMonth: 6 },
  { year: 2020, month: 8, solarTermName: '입추', datetime: '2020-08-07T09:06:00+09:00', sajuMonth: 7 },
  { year: 2020, month: 9, solarTermName: '백로', datetime: '2020-09-07T12:08:00+09:00', sajuMonth: 8 },
  { year: 2020, month: 10, solarTermName: '한로', datetime: '2020-10-08T03:55:00+09:00', sajuMonth: 9 },
  { year: 2020, month: 11, solarTermName: '입동', datetime: '2020-11-07T07:13:00+09:00', sajuMonth: 10 },
  { year: 2020, month: 12, solarTermName: '대설', datetime: '2020-12-07T00:09:00+09:00', sajuMonth: 11 },

  // 2021년
  { year: 2021, month: 1, solarTermName: '소한', datetime: '2021-01-05T11:23:00+09:00', sajuMonth: 12 },
  { year: 2021, month: 2, solarTermName: '입춘', datetime: '2021-02-03T22:58:00+09:00', sajuMonth: 1 },
  { year: 2021, month: 3, solarTermName: '경칩', datetime: '2021-03-05T16:53:00+09:00', sajuMonth: 2 },
  { year: 2021, month: 4, solarTermName: '청명', datetime: '2021-04-04T21:35:00+09:00', sajuMonth: 3 },
  { year: 2021, month: 5, solarTermName: '입하', datetime: '2021-05-05T14:47:00+09:00', sajuMonth: 4 },
  { year: 2021, month: 6, solarTermName: '망종', datetime: '2021-06-05T18:52:00+09:00', sajuMonth: 5 },
  { year: 2021, month: 7, solarTermName: '소서', datetime: '2021-07-07T05:05:00+09:00', sajuMonth: 6 },
  { year: 2021, month: 8, solarTermName: '입추', datetime: '2021-08-07T14:53:00+09:00', sajuMonth: 7 },
  { year: 2021, month: 9, solarTermName: '백로', datetime: '2021-09-07T17:52:00+09:00', sajuMonth: 8 },
  { year: 2021, month: 10, solarTermName: '한로', datetime: '2021-10-08T09:39:00+09:00', sajuMonth: 9 },
  { year: 2021, month: 11, solarTermName: '입동', datetime: '2021-11-07T12:58:00+09:00', sajuMonth: 10 },
  { year: 2021, month: 12, solarTermName: '대설', datetime: '2021-12-07T05:57:00+09:00', sajuMonth: 11 },

  // 2022년
  { year: 2022, month: 1, solarTermName: '소한', datetime: '2022-01-05T17:14:00+09:00', sajuMonth: 12 },
  { year: 2022, month: 2, solarTermName: '입춘', datetime: '2022-02-04T04:50:00+09:00', sajuMonth: 1 },
  { year: 2022, month: 3, solarTermName: '경칩', datetime: '2022-03-05T22:43:00+09:00', sajuMonth: 2 },
  { year: 2022, month: 4, solarTermName: '청명', datetime: '2022-04-05T03:20:00+09:00', sajuMonth: 3 },
  { year: 2022, month: 5, solarTermName: '입하', datetime: '2022-05-05T20:25:00+09:00', sajuMonth: 4 },
  { year: 2022, month: 6, solarTermName: '망종', datetime: '2022-06-06T00:25:00+09:00', sajuMonth: 5 },
  { year: 2022, month: 7, solarTermName: '소서', datetime: '2022-07-07T10:38:00+09:00', sajuMonth: 6 },
  { year: 2022, month: 8, solarTermName: '입추', datetime: '2022-08-07T20:29:00+09:00', sajuMonth: 7 },
  { year: 2022, month: 9, solarTermName: '백로', datetime: '2022-09-07T23:32:00+09:00', sajuMonth: 8 },
  { year: 2022, month: 10, solarTermName: '한로', datetime: '2022-10-08T15:22:00+09:00', sajuMonth: 9 },
  { year: 2022, month: 11, solarTermName: '입동', datetime: '2022-11-07T18:45:00+09:00', sajuMonth: 10 },
  { year: 2022, month: 12, solarTermName: '대설', datetime: '2022-12-07T11:46:00+09:00', sajuMonth: 11 },

  // 2023년
  { year: 2023, month: 1, solarTermName: '소한', datetime: '2023-01-05T23:04:00+09:00', sajuMonth: 12 },
  { year: 2023, month: 2, solarTermName: '입춘', datetime: '2023-02-04T10:42:00+09:00', sajuMonth: 1 },
  { year: 2023, month: 3, solarTermName: '경칩', datetime: '2023-03-06T04:36:00+09:00', sajuMonth: 2 },
  { year: 2023, month: 4, solarTermName: '청명', datetime: '2023-04-05T09:13:00+09:00', sajuMonth: 3 },
  { year: 2023, month: 5, solarTermName: '입하', datetime: '2023-05-06T02:18:00+09:00', sajuMonth: 4 },
  { year: 2023, month: 6, solarTermName: '망종', datetime: '2023-06-06T06:18:00+09:00', sajuMonth: 5 },
  { year: 2023, month: 7, solarTermName: '소서', datetime: '2023-07-07T16:30:00+09:00', sajuMonth: 6 },
  { year: 2023, month: 8, solarTermName: '입추', datetime: '2023-08-08T02:22:00+09:00', sajuMonth: 7 },
  { year: 2023, month: 9, solarTermName: '백로', datetime: '2023-09-08T05:26:00+09:00', sajuMonth: 8 },
  { year: 2023, month: 10, solarTermName: '한로', datetime: '2023-10-08T21:15:00+09:00', sajuMonth: 9 },
  { year: 2023, month: 11, solarTermName: '입동', datetime: '2023-11-08T00:35:00+09:00', sajuMonth: 10 },
  { year: 2023, month: 12, solarTermName: '대설', datetime: '2023-12-07T17:32:00+09:00', sajuMonth: 11 },

  // 2024년
  { year: 2024, month: 1, solarTermName: '소한', datetime: '2024-01-06T04:49:00+09:00', sajuMonth: 12 },
  { year: 2024, month: 2, solarTermName: '입춘', datetime: '2024-02-04T16:27:00+09:00', sajuMonth: 1 },
  { year: 2024, month: 3, solarTermName: '경칩', datetime: '2024-03-05T10:22:00+09:00', sajuMonth: 2 },
  { year: 2024, month: 4, solarTermName: '청명', datetime: '2024-04-04T15:02:00+09:00', sajuMonth: 3 },
  { year: 2024, month: 5, solarTermName: '입하', datetime: '2024-05-05T08:10:00+09:00', sajuMonth: 4 },
  { year: 2024, month: 6, solarTermName: '망종', datetime: '2024-06-05T12:09:00+09:00', sajuMonth: 5 },
  { year: 2024, month: 7, solarTermName: '소서', datetime: '2024-07-06T22:20:00+09:00', sajuMonth: 6 },
  { year: 2024, month: 8, solarTermName: '입추', datetime: '2024-08-07T08:09:00+09:00', sajuMonth: 7 },
  { year: 2024, month: 9, solarTermName: '백로', datetime: '2024-09-07T11:11:00+09:00', sajuMonth: 8 },
  { year: 2024, month: 10, solarTermName: '한로', datetime: '2024-10-08T02:59:00+09:00', sajuMonth: 9 },
  { year: 2024, month: 11, solarTermName: '입동', datetime: '2024-11-07T06:20:00+09:00', sajuMonth: 10 },
  { year: 2024, month: 12, solarTermName: '대설', datetime: '2024-12-06T23:17:00+09:00', sajuMonth: 11 },

  // 2025년
  { year: 2025, month: 1, solarTermName: '소한', datetime: '2025-01-05T10:32:00+09:00', sajuMonth: 12 },
  { year: 2025, month: 2, solarTermName: '입춘', datetime: '2025-02-03T22:10:00+09:00', sajuMonth: 1 },
  { year: 2025, month: 3, solarTermName: '경칩', datetime: '2025-03-05T16:07:00+09:00', sajuMonth: 2 },
  { year: 2025, month: 4, solarTermName: '청명', datetime: '2025-04-04T20:48:00+09:00', sajuMonth: 3 },
  { year: 2025, month: 5, solarTermName: '입하', datetime: '2025-05-05T13:57:00+09:00', sajuMonth: 4 },
  { year: 2025, month: 6, solarTermName: '망종', datetime: '2025-06-05T17:56:00+09:00', sajuMonth: 5 },
  { year: 2025, month: 7, solarTermName: '소서', datetime: '2025-07-07T04:04:00+09:00', sajuMonth: 6 },
  { year: 2025, month: 8, solarTermName: '입추', datetime: '2025-08-07T13:51:00+09:00', sajuMonth: 7 },
  { year: 2025, month: 9, solarTermName: '백로', datetime: '2025-09-07T16:51:00+09:00', sajuMonth: 8 },
  { year: 2025, month: 10, solarTermName: '한로', datetime: '2025-10-08T08:41:00+09:00', sajuMonth: 9 },
  { year: 2025, month: 11, solarTermName: '입동', datetime: '2025-11-07T12:04:00+09:00', sajuMonth: 10 },
  { year: 2025, month: 12, solarTermName: '대설', datetime: '2025-12-07T05:04:00+09:00', sajuMonth: 11 },

  // 2026년
  { year: 2026, month: 1, solarTermName: '소한', datetime: '2026-01-05T16:23:00+09:00', sajuMonth: 12 },
  { year: 2026, month: 2, solarTermName: '입춘', datetime: '2026-02-04T04:02:00+09:00', sajuMonth: 1 },
  { year: 2026, month: 3, solarTermName: '경칩', datetime: '2026-03-05T21:59:00+09:00', sajuMonth: 2 },
  { year: 2026, month: 4, solarTermName: '청명', datetime: '2026-04-05T02:40:00+09:00', sajuMonth: 3 },
  { year: 2026, month: 5, solarTermName: '입하', datetime: '2026-05-05T19:48:00+09:00', sajuMonth: 4 },
  { year: 2026, month: 6, solarTermName: '망종', datetime: '2026-06-05T23:48:00+09:00', sajuMonth: 5 },
  { year: 2026, month: 7, solarTermName: '소서', datetime: '2026-07-07T09:56:00+09:00', sajuMonth: 6 },
  { year: 2026, month: 8, solarTermName: '입추', datetime: '2026-08-07T19:42:00+09:00', sajuMonth: 7 },
  { year: 2026, month: 9, solarTermName: '백로', datetime: '2026-09-07T22:41:00+09:00', sajuMonth: 8 },
  { year: 2026, month: 10, solarTermName: '한로', datetime: '2026-10-08T14:29:00+09:00', sajuMonth: 9 },
  { year: 2026, month: 11, solarTermName: '입동', datetime: '2026-11-07T17:52:00+09:00', sajuMonth: 10 },
  { year: 2026, month: 12, solarTermName: '대설', datetime: '2026-12-07T10:52:00+09:00', sajuMonth: 11 },

  // 2027년
  { year: 2027, month: 1, solarTermName: '소한', datetime: '2027-01-05T22:09:00+09:00', sajuMonth: 12 },
  { year: 2027, month: 2, solarTermName: '입춘', datetime: '2027-02-04T09:46:00+09:00', sajuMonth: 1 },
  { year: 2027, month: 3, solarTermName: '경칩', datetime: '2027-03-06T03:39:00+09:00', sajuMonth: 2 },
  { year: 2027, month: 4, solarTermName: '청명', datetime: '2027-04-05T08:17:00+09:00', sajuMonth: 3 },
  { year: 2027, month: 5, solarTermName: '입하', datetime: '2027-05-06T01:25:00+09:00', sajuMonth: 4 },
  { year: 2027, month: 6, solarTermName: '망종', datetime: '2027-06-06T05:25:00+09:00', sajuMonth: 5 },
  { year: 2027, month: 7, solarTermName: '소서', datetime: '2027-07-07T15:37:00+09:00', sajuMonth: 6 },
  { year: 2027, month: 8, solarTermName: '입추', datetime: '2027-08-08T01:26:00+09:00', sajuMonth: 7 },
  { year: 2027, month: 9, solarTermName: '백로', datetime: '2027-09-08T04:28:00+09:00', sajuMonth: 8 },
  { year: 2027, month: 10, solarTermName: '한로', datetime: '2027-10-08T20:17:00+09:00', sajuMonth: 9 },
  { year: 2027, month: 11, solarTermName: '입동', datetime: '2027-11-07T23:38:00+09:00', sajuMonth: 10 },
  { year: 2027, month: 12, solarTermName: '대설', datetime: '2027-12-07T16:37:00+09:00', sajuMonth: 11 },

  // 2028년
  { year: 2028, month: 1, solarTermName: '소한', datetime: '2028-01-06T03:54:00+09:00', sajuMonth: 12 },
  { year: 2028, month: 2, solarTermName: '입춘', datetime: '2028-02-04T15:31:00+09:00', sajuMonth: 1 },
  { year: 2028, month: 3, solarTermName: '경칩', datetime: '2028-03-05T09:24:00+09:00', sajuMonth: 2 },
  { year: 2028, month: 4, solarTermName: '청명', datetime: '2028-04-04T14:03:00+09:00', sajuMonth: 3 },
  { year: 2028, month: 5, solarTermName: '입하', datetime: '2028-05-05T07:12:00+09:00', sajuMonth: 4 },
  { year: 2028, month: 6, solarTermName: '망종', datetime: '2028-06-05T11:16:00+09:00', sajuMonth: 5 },
  { year: 2028, month: 7, solarTermName: '소서', datetime: '2028-07-06T21:30:00+09:00', sajuMonth: 6 },
  { year: 2028, month: 8, solarTermName: '입추', datetime: '2028-08-07T07:21:00+09:00', sajuMonth: 7 },
  { year: 2028, month: 9, solarTermName: '백로', datetime: '2028-09-07T10:22:00+09:00', sajuMonth: 8 },
  { year: 2028, month: 10, solarTermName: '한로', datetime: '2028-10-08T02:08:00+09:00', sajuMonth: 9 },
  { year: 2028, month: 11, solarTermName: '입동', datetime: '2028-11-07T05:27:00+09:00', sajuMonth: 10 },
  { year: 2028, month: 12, solarTermName: '대설', datetime: '2028-12-06T22:24:00+09:00', sajuMonth: 11 },

  // 2029년
  { year: 2029, month: 1, solarTermName: '소한', datetime: '2029-01-05T09:41:00+09:00', sajuMonth: 12 },
  { year: 2029, month: 2, solarTermName: '입춘', datetime: '2029-02-03T21:20:00+09:00', sajuMonth: 1 },
  { year: 2029, month: 3, solarTermName: '경칩', datetime: '2029-03-05T15:17:00+09:00', sajuMonth: 2 },
  { year: 2029, month: 4, solarTermName: '청명', datetime: '2029-04-04T19:58:00+09:00', sajuMonth: 3 },
  { year: 2029, month: 5, solarTermName: '입하', datetime: '2029-05-05T13:07:00+09:00', sajuMonth: 4 },
  { year: 2029, month: 6, solarTermName: '망종', datetime: '2029-06-05T17:09:00+09:00', sajuMonth: 5 },
  { year: 2029, month: 7, solarTermName: '소서', datetime: '2029-07-07T03:22:00+09:00', sajuMonth: 6 },
  { year: 2029, month: 8, solarTermName: '입추', datetime: '2029-08-07T13:11:00+09:00', sajuMonth: 7 },
  { year: 2029, month: 9, solarTermName: '백로', datetime: '2029-09-07T16:11:00+09:00', sajuMonth: 8 },
  { year: 2029, month: 10, solarTermName: '한로', datetime: '2029-10-08T07:58:00+09:00', sajuMonth: 9 },
  { year: 2029, month: 11, solarTermName: '입동', datetime: '2029-11-07T11:16:00+09:00', sajuMonth: 10 },
  { year: 2029, month: 12, solarTermName: '대설', datetime: '2029-12-07T04:13:00+09:00', sajuMonth: 11 },

  // 2030년
  { year: 2030, month: 1, solarTermName: '소한', datetime: '2030-01-05T15:30:00+09:00', sajuMonth: 12 },
  { year: 2030, month: 2, solarTermName: '입춘', datetime: '2030-02-04T03:08:00+09:00', sajuMonth: 1 },
  { year: 2030, month: 3, solarTermName: '경칩', datetime: '2030-03-05T21:03:00+09:00', sajuMonth: 2 },
  { year: 2030, month: 4, solarTermName: '청명', datetime: '2030-04-05T01:41:00+09:00', sajuMonth: 3 },
  { year: 2030, month: 5, solarTermName: '입하', datetime: '2030-05-05T18:46:00+09:00', sajuMonth: 4 },
  { year: 2030, month: 6, solarTermName: '망종', datetime: '2030-06-05T22:44:00+09:00', sajuMonth: 5 },
  { year: 2030, month: 7, solarTermName: '소서', datetime: '2030-07-07T08:55:00+09:00', sajuMonth: 6 },
  { year: 2030, month: 8, solarTermName: '입추', datetime: '2030-08-07T18:47:00+09:00', sajuMonth: 7 },
  { year: 2030, month: 9, solarTermName: '백로', datetime: '2030-09-07T21:52:00+09:00', sajuMonth: 8 },
  { year: 2030, month: 10, solarTermName: '한로', datetime: '2030-10-08T13:45:00+09:00', sajuMonth: 9 },
  { year: 2030, month: 11, solarTermName: '입동', datetime: '2030-11-07T17:08:00+09:00', sajuMonth: 10 },
  { year: 2030, month: 12, solarTermName: '대설', datetime: '2030-12-07T10:07:00+09:00', sajuMonth: 11 },

  // 2031년
  { year: 2031, month: 1, solarTermName: '소한', datetime: '2031-01-05T21:23:00+09:00', sajuMonth: 12 },
  { year: 2031, month: 2, solarTermName: '입춘', datetime: '2031-02-04T08:58:00+09:00', sajuMonth: 1 },
  { year: 2031, month: 3, solarTermName: '경칩', datetime: '2031-03-06T02:51:00+09:00', sajuMonth: 2 },
  { year: 2031, month: 4, solarTermName: '청명', datetime: '2031-04-05T07:28:00+09:00', sajuMonth: 3 },
  { year: 2031, month: 5, solarTermName: '입하', datetime: '2031-05-06T00:35:00+09:00', sajuMonth: 4 },
  { year: 2031, month: 6, solarTermName: '망종', datetime: '2031-06-06T04:35:00+09:00', sajuMonth: 5 },
  { year: 2031, month: 7, solarTermName: '소서', datetime: '2031-07-07T14:48:00+09:00', sajuMonth: 6 },
  { year: 2031, month: 8, solarTermName: '입추', datetime: '2031-08-08T00:42:00+09:00', sajuMonth: 7 },
  { year: 2031, month: 9, solarTermName: '백로', datetime: '2031-09-08T03:50:00+09:00', sajuMonth: 8 },
  { year: 2031, month: 10, solarTermName: '한로', datetime: '2031-10-08T19:42:00+09:00', sajuMonth: 9 },
  { year: 2031, month: 11, solarTermName: '입동', datetime: '2031-11-07T23:05:00+09:00', sajuMonth: 10 },
  { year: 2031, month: 12, solarTermName: '대설', datetime: '2031-12-07T16:02:00+09:00', sajuMonth: 11 },

  // 2032년
  { year: 2032, month: 1, solarTermName: '소한', datetime: '2032-01-06T03:16:00+09:00', sajuMonth: 12 },
  { year: 2032, month: 2, solarTermName: '입춘', datetime: '2032-02-04T14:48:00+09:00', sajuMonth: 1 },
  { year: 2032, month: 3, solarTermName: '경칩', datetime: '2032-03-05T08:40:00+09:00', sajuMonth: 2 },
  { year: 2032, month: 4, solarTermName: '청명', datetime: '2032-04-04T13:17:00+09:00', sajuMonth: 3 },
  { year: 2032, month: 5, solarTermName: '입하', datetime: '2032-05-05T06:25:00+09:00', sajuMonth: 4 },
  { year: 2032, month: 6, solarTermName: '망종', datetime: '2032-06-05T10:27:00+09:00', sajuMonth: 5 },
  { year: 2032, month: 7, solarTermName: '소서', datetime: '2032-07-06T20:40:00+09:00', sajuMonth: 6 },
  { year: 2032, month: 8, solarTermName: '입추', datetime: '2032-08-07T06:32:00+09:00', sajuMonth: 7 },
  { year: 2032, month: 9, solarTermName: '백로', datetime: '2032-09-07T09:37:00+09:00', sajuMonth: 8 },
  { year: 2032, month: 10, solarTermName: '한로', datetime: '2032-10-08T01:30:00+09:00', sajuMonth: 9 },
  { year: 2032, month: 11, solarTermName: '입동', datetime: '2032-11-07T04:54:00+09:00', sajuMonth: 10 },
  { year: 2032, month: 12, solarTermName: '대설', datetime: '2032-12-06T21:53:00+09:00', sajuMonth: 11 },

  // 2033년
  { year: 2033, month: 1, solarTermName: '소한', datetime: '2033-01-05T09:08:00+09:00', sajuMonth: 12 },
  { year: 2033, month: 2, solarTermName: '입춘', datetime: '2033-02-03T20:41:00+09:00', sajuMonth: 1 },
  { year: 2033, month: 3, solarTermName: '경칩', datetime: '2033-03-05T14:32:00+09:00', sajuMonth: 2 },
  { year: 2033, month: 4, solarTermName: '청명', datetime: '2033-04-04T19:08:00+09:00', sajuMonth: 3 },
  { year: 2033, month: 5, solarTermName: '입하', datetime: '2033-05-05T12:13:00+09:00', sajuMonth: 4 },
  { year: 2033, month: 6, solarTermName: '망종', datetime: '2033-06-05T16:13:00+09:00', sajuMonth: 5 },
  { year: 2033, month: 7, solarTermName: '소서', datetime: '2033-07-07T02:24:00+09:00', sajuMonth: 6 },
  { year: 2033, month: 8, solarTermName: '입추', datetime: '2033-08-07T12:15:00+09:00', sajuMonth: 7 },
  { year: 2033, month: 9, solarTermName: '백로', datetime: '2033-09-07T15:20:00+09:00', sajuMonth: 8 },
  { year: 2033, month: 10, solarTermName: '한로', datetime: '2033-10-08T07:13:00+09:00', sajuMonth: 9 },
  { year: 2033, month: 11, solarTermName: '입동', datetime: '2033-11-07T10:41:00+09:00', sajuMonth: 10 },
  { year: 2033, month: 12, solarTermName: '대설', datetime: '2033-12-07T03:44:00+09:00', sajuMonth: 11 },

  // 2034년
  { year: 2034, month: 1, solarTermName: '소한', datetime: '2034-01-05T15:04:00+09:00', sajuMonth: 12 },
  { year: 2034, month: 2, solarTermName: '입춘', datetime: '2034-02-04T02:41:00+09:00', sajuMonth: 1 },
  { year: 2034, month: 3, solarTermName: '경칩', datetime: '2034-03-05T20:32:00+09:00', sajuMonth: 2 },
  { year: 2034, month: 4, solarTermName: '청명', datetime: '2034-04-05T01:06:00+09:00', sajuMonth: 3 },
  { year: 2034, month: 5, solarTermName: '입하', datetime: '2034-05-05T18:09:00+09:00', sajuMonth: 4 },
  { year: 2034, month: 6, solarTermName: '망종', datetime: '2034-06-05T22:06:00+09:00', sajuMonth: 5 },
  { year: 2034, month: 7, solarTermName: '소서', datetime: '2034-07-07T08:17:00+09:00', sajuMonth: 6 },
  { year: 2034, month: 8, solarTermName: '입추', datetime: '2034-08-07T18:09:00+09:00', sajuMonth: 7 },
  { year: 2034, month: 9, solarTermName: '백로', datetime: '2034-09-07T21:13:00+09:00', sajuMonth: 8 },
  { year: 2034, month: 10, solarTermName: '한로', datetime: '2034-10-08T13:07:00+09:00', sajuMonth: 9 },
  { year: 2034, month: 11, solarTermName: '입동', datetime: '2034-11-07T16:33:00+09:00', sajuMonth: 10 },
  { year: 2034, month: 12, solarTermName: '대설', datetime: '2034-12-07T09:36:00+09:00', sajuMonth: 11 },

  // 2035년
  { year: 2035, month: 1, solarTermName: '소한', datetime: '2035-01-05T20:55:00+09:00', sajuMonth: 12 },
  { year: 2035, month: 2, solarTermName: '입춘', datetime: '2035-02-04T08:31:00+09:00', sajuMonth: 1 },
  { year: 2035, month: 3, solarTermName: '경칩', datetime: '2035-03-06T02:21:00+09:00', sajuMonth: 2 },
  { year: 2035, month: 4, solarTermName: '청명', datetime: '2035-04-05T06:53:00+09:00', sajuMonth: 3 },
  { year: 2035, month: 5, solarTermName: '입하', datetime: '2035-05-05T23:54:00+09:00', sajuMonth: 4 },
  { year: 2035, month: 6, solarTermName: '망종', datetime: '2035-06-06T03:50:00+09:00', sajuMonth: 5 },
  { year: 2035, month: 7, solarTermName: '소서', datetime: '2035-07-07T14:01:00+09:00', sajuMonth: 6 },
  { year: 2035, month: 8, solarTermName: '입추', datetime: '2035-08-07T23:54:00+09:00', sajuMonth: 7 },
  { year: 2035, month: 9, solarTermName: '백로', datetime: '2035-09-08T03:02:00+09:00', sajuMonth: 8 },
  { year: 2035, month: 10, solarTermName: '한로', datetime: '2035-10-08T18:57:00+09:00', sajuMonth: 9 },
  { year: 2035, month: 11, solarTermName: '입동', datetime: '2035-11-07T22:23:00+09:00', sajuMonth: 10 },
  { year: 2035, month: 12, solarTermName: '대설', datetime: '2035-12-07T15:25:00+09:00', sajuMonth: 11 },

  // 2036년
  { year: 2036, month: 1, solarTermName: '소한', datetime: '2036-01-06T02:43:00+09:00', sajuMonth: 12 },
  { year: 2036, month: 2, solarTermName: '입춘', datetime: '2036-02-04T14:19:00+09:00', sajuMonth: 1 },
  { year: 2036, month: 3, solarTermName: '경칩', datetime: '2036-03-05T08:11:00+09:00', sajuMonth: 2 },
  { year: 2036, month: 4, solarTermName: '청명', datetime: '2036-04-04T12:46:00+09:00', sajuMonth: 3 },
  { year: 2036, month: 5, solarTermName: '입하', datetime: '2036-05-05T05:49:00+09:00', sajuMonth: 4 },
  { year: 2036, month: 6, solarTermName: '망종', datetime: '2036-06-05T09:47:00+09:00', sajuMonth: 5 },
  { year: 2036, month: 7, solarTermName: '소서', datetime: '2036-07-06T19:57:00+09:00', sajuMonth: 6 },
  { year: 2036, month: 8, solarTermName: '입추', datetime: '2036-08-07T05:48:00+09:00', sajuMonth: 7 },
  { year: 2036, month: 9, solarTermName: '백로', datetime: '2036-09-07T08:55:00+09:00', sajuMonth: 8 },
  { year: 2036, month: 10, solarTermName: '한로', datetime: '2036-10-08T00:49:00+09:00', sajuMonth: 9 },
  { year: 2036, month: 11, solarTermName: '입동', datetime: '2036-11-07T04:14:00+09:00', sajuMonth: 10 },
  { year: 2036, month: 12, solarTermName: '대설', datetime: '2036-12-06T21:16:00+09:00', sajuMonth: 11 },

  // 2037년
  { year: 2037, month: 1, solarTermName: '소한', datetime: '2037-01-05T08:34:00+09:00', sajuMonth: 12 },
  { year: 2037, month: 2, solarTermName: '입춘', datetime: '2037-02-03T20:11:00+09:00', sajuMonth: 1 },
  { year: 2037, month: 3, solarTermName: '경칩', datetime: '2037-03-05T14:06:00+09:00', sajuMonth: 2 },
  { year: 2037, month: 4, solarTermName: '청명', datetime: '2037-04-04T18:44:00+09:00', sajuMonth: 3 },
  { year: 2037, month: 5, solarTermName: '입하', datetime: '2037-05-05T11:49:00+09:00', sajuMonth: 4 },
  { year: 2037, month: 6, solarTermName: '망종', datetime: '2037-06-05T15:46:00+09:00', sajuMonth: 5 },
  { year: 2037, month: 7, solarTermName: '소서', datetime: '2037-07-07T01:55:00+09:00', sajuMonth: 6 },
  { year: 2037, month: 8, solarTermName: '입추', datetime: '2037-08-07T11:43:00+09:00', sajuMonth: 7 },
  { year: 2037, month: 9, solarTermName: '백로', datetime: '2037-09-07T14:45:00+09:00', sajuMonth: 8 },
  { year: 2037, month: 10, solarTermName: '한로', datetime: '2037-10-08T06:37:00+09:00', sajuMonth: 9 },
  { year: 2037, month: 11, solarTermName: '입동', datetime: '2037-11-07T10:04:00+09:00', sajuMonth: 10 },
  { year: 2037, month: 12, solarTermName: '대설', datetime: '2037-12-07T03:07:00+09:00', sajuMonth: 11 },

  // 2038년
  { year: 2038, month: 1, solarTermName: '소한', datetime: '2038-01-05T14:26:00+09:00', sajuMonth: 12 },
  { year: 2038, month: 2, solarTermName: '입춘', datetime: '2038-02-04T02:03:00+09:00', sajuMonth: 1 },
  { year: 2038, month: 3, solarTermName: '경칩', datetime: '2038-03-05T19:55:00+09:00', sajuMonth: 2 },
  { year: 2038, month: 4, solarTermName: '청명', datetime: '2038-04-05T00:29:00+09:00', sajuMonth: 3 },
  { year: 2038, month: 5, solarTermName: '입하', datetime: '2038-05-05T17:31:00+09:00', sajuMonth: 4 },
  { year: 2038, month: 6, solarTermName: '망종', datetime: '2038-06-05T21:25:00+09:00', sajuMonth: 5 },
  { year: 2038, month: 7, solarTermName: '소서', datetime: '2038-07-07T07:32:00+09:00', sajuMonth: 6 },
  { year: 2038, month: 8, solarTermName: '입추', datetime: '2038-08-07T17:21:00+09:00', sajuMonth: 7 },
  { year: 2038, month: 9, solarTermName: '백로', datetime: '2038-09-07T20:26:00+09:00', sajuMonth: 8 },
  { year: 2038, month: 10, solarTermName: '한로', datetime: '2038-10-08T12:21:00+09:00', sajuMonth: 9 },
  { year: 2038, month: 11, solarTermName: '입동', datetime: '2038-11-07T15:50:00+09:00', sajuMonth: 10 },
  { year: 2038, month: 12, solarTermName: '대설', datetime: '2038-12-07T08:56:00+09:00', sajuMonth: 11 },

  // 2039년
  { year: 2039, month: 1, solarTermName: '소한', datetime: '2039-01-05T20:16:00+09:00', sajuMonth: 12 },
  { year: 2039, month: 2, solarTermName: '입춘', datetime: '2039-02-04T07:52:00+09:00', sajuMonth: 1 },
  { year: 2039, month: 3, solarTermName: '경칩', datetime: '2039-03-06T01:43:00+09:00', sajuMonth: 2 },
  { year: 2039, month: 4, solarTermName: '청명', datetime: '2039-04-05T06:15:00+09:00', sajuMonth: 3 },
  { year: 2039, month: 5, solarTermName: '입하', datetime: '2039-05-05T23:18:00+09:00', sajuMonth: 4 },
  { year: 2039, month: 6, solarTermName: '망종', datetime: '2039-06-06T03:15:00+09:00', sajuMonth: 5 },
  { year: 2039, month: 7, solarTermName: '소서', datetime: '2039-07-07T13:26:00+09:00', sajuMonth: 6 },
  { year: 2039, month: 8, solarTermName: '입추', datetime: '2039-08-07T23:18:00+09:00', sajuMonth: 7 },
  { year: 2039, month: 9, solarTermName: '백로', datetime: '2039-09-08T02:24:00+09:00', sajuMonth: 8 },
  { year: 2039, month: 10, solarTermName: '한로', datetime: '2039-10-08T18:17:00+09:00', sajuMonth: 9 },
  { year: 2039, month: 11, solarTermName: '입동', datetime: '2039-11-07T21:42:00+09:00', sajuMonth: 10 },
  { year: 2039, month: 12, solarTermName: '대설', datetime: '2039-12-07T14:45:00+09:00', sajuMonth: 11 },

  // 2040년
  { year: 2040, month: 1, solarTermName: '소한', datetime: '2040-01-06T02:03:00+09:00', sajuMonth: 12 },
  { year: 2040, month: 2, solarTermName: '입춘', datetime: '2040-02-04T13:39:00+09:00', sajuMonth: 1 },
  { year: 2040, month: 3, solarTermName: '경칩', datetime: '2040-03-05T07:31:00+09:00', sajuMonth: 2 },
  { year: 2040, month: 4, solarTermName: '청명', datetime: '2040-04-04T12:05:00+09:00', sajuMonth: 3 },
  { year: 2040, month: 5, solarTermName: '입하', datetime: '2040-05-05T05:09:00+09:00', sajuMonth: 4 },
  { year: 2040, month: 6, solarTermName: '망종', datetime: '2040-06-05T09:08:00+09:00', sajuMonth: 5 },
  { year: 2040, month: 7, solarTermName: '소서', datetime: '2040-07-06T19:19:00+09:00', sajuMonth: 6 },
  { year: 2040, month: 8, solarTermName: '입추', datetime: '2040-08-07T05:10:00+09:00', sajuMonth: 7 },
  { year: 2040, month: 9, solarTermName: '백로', datetime: '2040-09-07T08:14:00+09:00', sajuMonth: 8 },
  { year: 2040, month: 10, solarTermName: '한로', datetime: '2040-10-08T00:05:00+09:00', sajuMonth: 9 },
  { year: 2040, month: 11, solarTermName: '입동', datetime: '2040-11-07T03:29:00+09:00', sajuMonth: 10 },
  { year: 2040, month: 12, solarTermName: '대설', datetime: '2040-12-06T20:30:00+09:00', sajuMonth: 11 },

  // 2041년
  { year: 2041, month: 1, solarTermName: '소한', datetime: '2041-01-05T07:48:00+09:00', sajuMonth: 12 },
  { year: 2041, month: 2, solarTermName: '입춘', datetime: '2041-02-03T19:25:00+09:00', sajuMonth: 1 },
  { year: 2041, month: 3, solarTermName: '경칩', datetime: '2041-03-05T13:17:00+09:00', sajuMonth: 2 },
  { year: 2041, month: 4, solarTermName: '청명', datetime: '2041-04-04T17:52:00+09:00', sajuMonth: 3 },
  { year: 2041, month: 5, solarTermName: '입하', datetime: '2041-05-05T10:54:00+09:00', sajuMonth: 4 },
  { year: 2041, month: 6, solarTermName: '망종', datetime: '2041-06-05T14:49:00+09:00', sajuMonth: 5 },
  { year: 2041, month: 7, solarTermName: '소서', datetime: '2041-07-07T00:58:00+09:00', sajuMonth: 6 },
  { year: 2041, month: 8, solarTermName: '입추', datetime: '2041-08-07T10:48:00+09:00', sajuMonth: 7 },
  { year: 2041, month: 9, solarTermName: '백로', datetime: '2041-09-07T13:53:00+09:00', sajuMonth: 8 },
  { year: 2041, month: 10, solarTermName: '한로', datetime: '2041-10-08T05:47:00+09:00', sajuMonth: 9 },
  { year: 2041, month: 11, solarTermName: '입동', datetime: '2041-11-07T09:13:00+09:00', sajuMonth: 10 },
  { year: 2041, month: 12, solarTermName: '대설', datetime: '2041-12-07T02:15:00+09:00', sajuMonth: 11 },

  // 2042년
  { year: 2042, month: 1, solarTermName: '소한', datetime: '2042-01-05T13:35:00+09:00', sajuMonth: 12 },
  { year: 2042, month: 2, solarTermName: '입춘', datetime: '2042-02-04T01:12:00+09:00', sajuMonth: 1 },
  { year: 2042, month: 3, solarTermName: '경칩', datetime: '2042-03-05T19:05:00+09:00', sajuMonth: 2 },
  { year: 2042, month: 4, solarTermName: '청명', datetime: '2042-04-04T23:40:00+09:00', sajuMonth: 3 },
  { year: 2042, month: 5, solarTermName: '입하', datetime: '2042-05-05T16:42:00+09:00', sajuMonth: 4 },
  { year: 2042, month: 6, solarTermName: '망종', datetime: '2042-06-05T20:38:00+09:00', sajuMonth: 5 },
  { year: 2042, month: 7, solarTermName: '소서', datetime: '2042-07-07T06:47:00+09:00', sajuMonth: 6 },
  { year: 2042, month: 8, solarTermName: '입추', datetime: '2042-08-07T16:38:00+09:00', sajuMonth: 7 },
  { year: 2042, month: 9, solarTermName: '백로', datetime: '2042-09-07T19:45:00+09:00', sajuMonth: 8 },
  { year: 2042, month: 10, solarTermName: '한로', datetime: '2042-10-08T11:40:00+09:00', sajuMonth: 9 },
  { year: 2042, month: 11, solarTermName: '입동', datetime: '2042-11-07T15:07:00+09:00', sajuMonth: 10 },
  { year: 2042, month: 12, solarTermName: '대설', datetime: '2042-12-07T08:09:00+09:00', sajuMonth: 11 },

  // 2043년
  { year: 2043, month: 1, solarTermName: '소한', datetime: '2043-01-05T19:25:00+09:00', sajuMonth: 12 },
  { year: 2043, month: 2, solarTermName: '입춘', datetime: '2043-02-04T06:58:00+09:00', sajuMonth: 1 },
  { year: 2043, month: 3, solarTermName: '경칩', datetime: '2043-03-06T00:47:00+09:00', sajuMonth: 2 },
  { year: 2043, month: 4, solarTermName: '청명', datetime: '2043-04-05T05:20:00+09:00', sajuMonth: 3 },
  { year: 2043, month: 5, solarTermName: '입하', datetime: '2043-05-05T22:22:00+09:00', sajuMonth: 4 },
  { year: 2043, month: 6, solarTermName: '망종', datetime: '2043-06-06T02:18:00+09:00', sajuMonth: 5 },
  { year: 2043, month: 7, solarTermName: '소서', datetime: '2043-07-07T12:27:00+09:00', sajuMonth: 6 },
  { year: 2043, month: 8, solarTermName: '입추', datetime: '2043-08-07T22:20:00+09:00', sajuMonth: 7 },
  { year: 2043, month: 9, solarTermName: '백로', datetime: '2043-09-08T01:30:00+09:00', sajuMonth: 8 },
  { year: 2043, month: 10, solarTermName: '한로', datetime: '2043-10-08T17:27:00+09:00', sajuMonth: 9 },
  { year: 2043, month: 11, solarTermName: '입동', datetime: '2043-11-07T20:55:00+09:00', sajuMonth: 10 },
  { year: 2043, month: 12, solarTermName: '대설', datetime: '2043-12-07T13:57:00+09:00', sajuMonth: 11 },

  // 2044년
  { year: 2044, month: 1, solarTermName: '소한', datetime: '2044-01-06T01:12:00+09:00', sajuMonth: 12 },
  { year: 2044, month: 2, solarTermName: '입춘', datetime: '2044-02-04T12:44:00+09:00', sajuMonth: 1 },
  { year: 2044, month: 3, solarTermName: '경칩', datetime: '2044-03-05T06:31:00+09:00', sajuMonth: 2 },
  { year: 2044, month: 4, solarTermName: '청명', datetime: '2044-04-04T11:03:00+09:00', sajuMonth: 3 },
  { year: 2044, month: 5, solarTermName: '입하', datetime: '2044-05-05T04:05:00+09:00', sajuMonth: 4 },
  { year: 2044, month: 6, solarTermName: '망종', datetime: '2044-06-05T08:04:00+09:00', sajuMonth: 5 },
  { year: 2044, month: 7, solarTermName: '소서', datetime: '2044-07-06T18:15:00+09:00', sajuMonth: 6 },
  { year: 2044, month: 8, solarTermName: '입추', datetime: '2044-08-07T04:08:00+09:00', sajuMonth: 7 },
  { year: 2044, month: 9, solarTermName: '백로', datetime: '2044-09-07T07:16:00+09:00', sajuMonth: 8 },
  { year: 2044, month: 10, solarTermName: '한로', datetime: '2044-10-07T23:13:00+09:00', sajuMonth: 9 },
  { year: 2044, month: 11, solarTermName: '입동', datetime: '2044-11-07T02:42:00+09:00', sajuMonth: 10 },
  { year: 2044, month: 12, solarTermName: '대설', datetime: '2044-12-06T19:45:00+09:00', sajuMonth: 11 },

  // 2045년
  { year: 2045, month: 1, solarTermName: '소한', datetime: '2045-01-05T07:02:00+09:00', sajuMonth: 12 },
  { year: 2045, month: 2, solarTermName: '입춘', datetime: '2045-02-03T18:36:00+09:00', sajuMonth: 1 },
  { year: 2045, month: 3, solarTermName: '경칩', datetime: '2045-03-05T12:25:00+09:00', sajuMonth: 2 },
  { year: 2045, month: 4, solarTermName: '청명', datetime: '2045-04-04T16:57:00+09:00', sajuMonth: 3 },
  { year: 2045, month: 5, solarTermName: '입하', datetime: '2045-05-05T09:59:00+09:00', sajuMonth: 4 },
  { year: 2045, month: 6, solarTermName: '망종', datetime: '2045-06-05T13:57:00+09:00', sajuMonth: 5 },
  { year: 2045, month: 7, solarTermName: '소서', datetime: '2045-07-07T00:08:00+09:00', sajuMonth: 6 },
  { year: 2045, month: 8, solarTermName: '입추', datetime: '2045-08-07T09:59:00+09:00', sajuMonth: 7 },
  { year: 2045, month: 9, solarTermName: '백로', datetime: '2045-09-07T13:05:00+09:00', sajuMonth: 8 },
  { year: 2045, month: 10, solarTermName: '한로', datetime: '2045-10-08T05:00:00+09:00', sajuMonth: 9 },
  { year: 2045, month: 11, solarTermName: '입동', datetime: '2045-11-07T08:29:00+09:00', sajuMonth: 10 },
  { year: 2045, month: 12, solarTermName: '대설', datetime: '2045-12-07T01:35:00+09:00', sajuMonth: 11 },

  // 2046년
  { year: 2046, month: 1, solarTermName: '소한', datetime: '2046-01-05T12:56:00+09:00', sajuMonth: 12 },
  { year: 2046, month: 2, solarTermName: '입춘', datetime: '2046-02-04T00:31:00+09:00', sajuMonth: 1 },
  { year: 2046, month: 3, solarTermName: '경칩', datetime: '2046-03-05T18:17:00+09:00', sajuMonth: 2 },
  { year: 2046, month: 4, solarTermName: '청명', datetime: '2046-04-04T22:45:00+09:00', sajuMonth: 3 },
  { year: 2046, month: 5, solarTermName: '입하', datetime: '2046-05-05T15:40:00+09:00', sajuMonth: 4 },
  { year: 2046, month: 6, solarTermName: '망종', datetime: '2046-06-05T19:32:00+09:00', sajuMonth: 5 },
  { year: 2046, month: 7, solarTermName: '소서', datetime: '2046-07-07T05:40:00+09:00', sajuMonth: 6 },
  { year: 2046, month: 8, solarTermName: '입추', datetime: '2046-08-07T15:33:00+09:00', sajuMonth: 7 },
  { year: 2046, month: 9, solarTermName: '백로', datetime: '2046-09-07T18:43:00+09:00', sajuMonth: 8 },
  { year: 2046, month: 10, solarTermName: '한로', datetime: '2046-10-08T10:42:00+09:00', sajuMonth: 9 },
  { year: 2046, month: 11, solarTermName: '입동', datetime: '2046-11-07T14:14:00+09:00', sajuMonth: 10 },
  { year: 2046, month: 12, solarTermName: '대설', datetime: '2046-12-07T07:21:00+09:00', sajuMonth: 11 },

  // 2047년
  { year: 2047, month: 1, solarTermName: '소한', datetime: '2047-01-05T18:42:00+09:00', sajuMonth: 12 },
  { year: 2047, month: 2, solarTermName: '입춘', datetime: '2047-02-04T06:18:00+09:00', sajuMonth: 1 },
  { year: 2047, month: 3, solarTermName: '경칩', datetime: '2047-03-06T00:05:00+09:00', sajuMonth: 2 },
  { year: 2047, month: 4, solarTermName: '청명', datetime: '2047-04-05T04:32:00+09:00', sajuMonth: 3 },
  { year: 2047, month: 5, solarTermName: '입하', datetime: '2047-05-05T21:28:00+09:00', sajuMonth: 4 },
  { year: 2047, month: 6, solarTermName: '망종', datetime: '2047-06-06T01:20:00+09:00', sajuMonth: 5 },
  { year: 2047, month: 7, solarTermName: '소서', datetime: '2047-07-07T11:30:00+09:00', sajuMonth: 6 },
  { year: 2047, month: 8, solarTermName: '입추', datetime: '2047-08-07T21:25:00+09:00', sajuMonth: 7 },
  { year: 2047, month: 9, solarTermName: '백로', datetime: '2047-09-08T00:38:00+09:00', sajuMonth: 8 },
  { year: 2047, month: 10, solarTermName: '한로', datetime: '2047-10-08T16:37:00+09:00', sajuMonth: 9 },
  { year: 2047, month: 11, solarTermName: '입동', datetime: '2047-11-07T20:07:00+09:00', sajuMonth: 10 },
  { year: 2047, month: 12, solarTermName: '대설', datetime: '2047-12-07T13:11:00+09:00', sajuMonth: 11 },

  // 2048년
  { year: 2048, month: 1, solarTermName: '소한', datetime: '2048-01-06T00:29:00+09:00', sajuMonth: 12 },
  { year: 2048, month: 2, solarTermName: '입춘', datetime: '2048-02-04T12:04:00+09:00', sajuMonth: 1 },
  { year: 2048, month: 3, solarTermName: '경칩', datetime: '2048-03-05T05:54:00+09:00', sajuMonth: 2 },
  { year: 2048, month: 4, solarTermName: '청명', datetime: '2048-04-04T10:25:00+09:00', sajuMonth: 3 },
  { year: 2048, month: 5, solarTermName: '입하', datetime: '2048-05-05T03:24:00+09:00', sajuMonth: 4 },
  { year: 2048, month: 6, solarTermName: '망종', datetime: '2048-06-05T07:18:00+09:00', sajuMonth: 5 },
  { year: 2048, month: 7, solarTermName: '소서', datetime: '2048-07-06T17:26:00+09:00', sajuMonth: 6 },
  { year: 2048, month: 8, solarTermName: '입추', datetime: '2048-08-07T03:18:00+09:00', sajuMonth: 7 },
  { year: 2048, month: 9, solarTermName: '백로', datetime: '2048-09-07T06:28:00+09:00', sajuMonth: 8 },
  { year: 2048, month: 10, solarTermName: '한로', datetime: '2048-10-07T22:26:00+09:00', sajuMonth: 9 },
  { year: 2048, month: 11, solarTermName: '입동', datetime: '2048-11-07T01:56:00+09:00', sajuMonth: 10 },
  { year: 2048, month: 12, solarTermName: '대설', datetime: '2048-12-06T19:00:00+09:00', sajuMonth: 11 },

  // 2049년
  { year: 2049, month: 1, solarTermName: '소한', datetime: '2049-01-05T06:18:00+09:00', sajuMonth: 12 },
  { year: 2049, month: 2, solarTermName: '입춘', datetime: '2049-02-03T17:53:00+09:00', sajuMonth: 1 },
  { year: 2049, month: 3, solarTermName: '경칩', datetime: '2049-03-05T11:43:00+09:00', sajuMonth: 2 },
  { year: 2049, month: 4, solarTermName: '청명', datetime: '2049-04-04T16:14:00+09:00', sajuMonth: 3 },
  { year: 2049, month: 5, solarTermName: '입하', datetime: '2049-05-05T09:12:00+09:00', sajuMonth: 4 },
  { year: 2049, month: 6, solarTermName: '망종', datetime: '2049-06-05T13:03:00+09:00', sajuMonth: 5 },
  { year: 2049, month: 7, solarTermName: '소서', datetime: '2049-07-06T23:08:00+09:00', sajuMonth: 6 },
  { year: 2049, month: 8, solarTermName: '입추', datetime: '2049-08-07T08:58:00+09:00', sajuMonth: 7 },
  { year: 2049, month: 9, solarTermName: '백로', datetime: '2049-09-07T12:05:00+09:00', sajuMonth: 8 },
  { year: 2049, month: 10, solarTermName: '한로', datetime: '2049-10-08T04:05:00+09:00', sajuMonth: 9 },
  { year: 2049, month: 11, solarTermName: '입동', datetime: '2049-11-07T07:38:00+09:00', sajuMonth: 10 },
  { year: 2049, month: 12, solarTermName: '대설', datetime: '2049-12-07T00:46:00+09:00', sajuMonth: 11 },

  // 2050년
  { year: 2050, month: 1, solarTermName: '소한', datetime: '2050-01-05T12:08:00+09:00', sajuMonth: 12 },
  { year: 2050, month: 2, solarTermName: '입춘', datetime: '2050-02-03T23:43:00+09:00', sajuMonth: 1 },
  { year: 2050, month: 3, solarTermName: '경칩', datetime: '2050-03-05T17:32:00+09:00', sajuMonth: 2 },
  { year: 2050, month: 4, solarTermName: '청명', datetime: '2050-04-04T22:03:00+09:00', sajuMonth: 3 },
  { year: 2050, month: 5, solarTermName: '입하', datetime: '2050-05-05T15:02:00+09:00', sajuMonth: 4 },
  { year: 2050, month: 6, solarTermName: '망종', datetime: '2050-06-05T18:54:00+09:00', sajuMonth: 5 },
  { year: 2050, month: 7, solarTermName: '소서', datetime: '2050-07-07T05:02:00+09:00', sajuMonth: 6 },
  { year: 2050, month: 8, solarTermName: '입추', datetime: '2050-08-07T14:52:00+09:00', sajuMonth: 7 },
  { year: 2050, month: 9, solarTermName: '백로', datetime: '2050-09-07T18:00:00+09:00', sajuMonth: 8 },
  { year: 2050, month: 10, solarTermName: '한로', datetime: '2050-10-08T10:00:00+09:00', sajuMonth: 9 },
  { year: 2050, month: 11, solarTermName: '입동', datetime: '2050-11-07T13:33:00+09:00', sajuMonth: 10 },
  { year: 2050, month: 12, solarTermName: '대설', datetime: '2050-12-07T06:41:00+09:00', sajuMonth: 11 },

];

/**
 * 특정 연월의 절입일 조회
 */
export function getJeolipInfo(year: number, month: number): JeolipInfo | null {
  return JEOLIP_DATA.find(j => j.year === year && j.month === month) || null;
}

/**
 * 주어진 날짜+시간이 절입 시각 이전인지 확인
 * @param datetimeString ISO 형식 또는 YYYY-MM-DD (시간 없으면 00:00 KST)
 * @param jeolipDatetime 절입 시각 (ISO 형식)
 * @returns true면 절입 시각 이전
 */
export function isBeforeJeolip(datetimeString: string, jeolipDatetime: string): boolean {
  let targetDate: Date;
  if (datetimeString.includes('T')) {
    targetDate = new Date(datetimeString);
  } else {
    // 날짜만 있으면 KST 00:00으로 처리
    targetDate = new Date(datetimeString + 'T00:00:00+09:00');
  }
  const jeolipDate = new Date(jeolipDatetime);
  return targetDate < jeolipDate;
}

/**
 * 주어진 날짜+시간의 실제 사주력 연도와 월 계산
 * @param dateString YYYY-MM-DD 형식
 * @param timeString HH:mm 형식 (선택, 절입일 당일 정확한 판단에 필요)
 * @returns { year: 사주력 연도, month: 사주력 월 (1-12, 인월=1) }
 */
export function getSajuYearMonth(dateString: string, timeString?: string): { year: number; month: number } {
  const [yearNum, monthNum, dayNum] = dateString.split('-').map(Number);
  const year = yearNum;
  const month = monthNum;

  // 비교용 datetime 문자열 생성 (KST)
  const datetimeStr = timeString
    ? `${dateString}T${timeString}:00+09:00`
    : `${dateString}T00:00:00+09:00`;

  // 해당 월의 절입일 조회
  const jeolip = getJeolipInfo(year, month);

  let sajuMonth: number;

  if (!jeolip) {
    // 데이터가 없으면 간이 계산 (절입일 ≈ 매월 4-8일)
    const estimatedJeolipDay = month === 2 ? 4 : (month <= 7 ? 5 : 7);

    if (dayNum < estimatedJeolipDay) {
      if (month === 1) {
        sajuMonth = 11; // 소한 이전 → 자월
      } else if (month === 2) {
        sajuMonth = 12; // 입춘 이전 → 축월
      } else {
        sajuMonth = SOLAR_TERM_TO_SAJU_MONTH[MONTH_TO_SOLAR_TERM[month - 1]];
      }
    } else {
      sajuMonth = SOLAR_TERM_TO_SAJU_MONTH[MONTH_TO_SOLAR_TERM[month]];
    }
  } else if (isBeforeJeolip(datetimeStr, jeolip.datetime)) {
    // 절입 시각 이전 → 전월의 사주월
    if (month === 1) {
      sajuMonth = 11; // 소한 이전 → 자월(대설)
    } else if (month === 2) {
      sajuMonth = 12; // 입춘 이전 → 축월(소한)
    } else {
      const prevMonth = month - 1;
      const prevJeolip = getJeolipInfo(year, prevMonth);
      sajuMonth = prevJeolip ? prevJeolip.sajuMonth : SOLAR_TERM_TO_SAJU_MONTH[MONTH_TO_SOLAR_TERM[prevMonth]];
    }
  } else {
    sajuMonth = jeolip.sajuMonth;
  }

  // 사주력 연도 결정: 입춘 기준
  // 입춘 이전이면 전년도
  const ipchun = getJeolipInfo(year, 2); // 2월 입춘
  let sajuYear: number;

  if (ipchun && isBeforeJeolip(datetimeStr, ipchun.datetime)) {
    sajuYear = year - 1;
  } else if (!ipchun) {
    // 입춘 데이터 없으면 2월 4일로 추정
    if (month < 2 || (month === 2 && dayNum < 4)) {
      sajuYear = year - 1;
    } else {
      sajuYear = year;
    }
  } else {
    sajuYear = year;
  }

  return { year: sajuYear, month: sajuMonth };
}
