/**
 * 지역 경도 데이터 (시간 보정용)
 *
 * 한국 표준시(KST)는 동경 135도 기준
 * 보정시간(분) = (135 - 지역경도) × 4
 */

export interface LocationInfo {
  name: string;
  latitude: number;
  longitude: number;
  timeOffsetMinutes: number;  // 분 단위 보정값
  category: string;
}

export const LOCATIONS: Record<string, LocationInfo> = {
  // 대한민국 주요 도시
  'seoul': { name: '서울', latitude: 37.5665, longitude: 126.9780, timeOffsetMinutes: -32, category: '대한민국' },
  'busan': { name: '부산', latitude: 35.1796, longitude: 129.0756, timeOffsetMinutes: -24, category: '대한민국' },
  'daegu': { name: '대구', latitude: 35.8714, longitude: 128.6014, timeOffsetMinutes: -26, category: '대한민국' },
  'incheon': { name: '인천', latitude: 37.4563, longitude: 126.7052, timeOffsetMinutes: -33, category: '대한민국' },
  'gwangju': { name: '광주', latitude: 35.1595, longitude: 126.8526, timeOffsetMinutes: -33, category: '대한민국' },
  'daejeon': { name: '대전', latitude: 36.3504, longitude: 127.3845, timeOffsetMinutes: -30, category: '대한민국' },
  'ulsan': { name: '울산', latitude: 35.5384, longitude: 129.3114, timeOffsetMinutes: -23, category: '대한민국' },
  'sejong': { name: '세종', latitude: 36.4875, longitude: 127.2817, timeOffsetMinutes: -31, category: '대한민국' },
  'suwon': { name: '수원', latitude: 37.2636, longitude: 127.0286, timeOffsetMinutes: -32, category: '대한민국' },
  'changwon': { name: '창원', latitude: 35.2279, longitude: 128.6811, timeOffsetMinutes: -25, category: '대한민국' },
  'jeonju': { name: '전주', latitude: 35.8242, longitude: 127.1480, timeOffsetMinutes: -31, category: '대한민국' },
  'cheongju': { name: '청주', latitude: 36.6424, longitude: 127.4890, timeOffsetMinutes: -30, category: '대한민국' },
  'jeju': { name: '제주', latitude: 33.4890, longitude: 126.4983, timeOffsetMinutes: -34, category: '대한민국' },
  'pohang': { name: '포항', latitude: 36.0190, longitude: 129.3435, timeOffsetMinutes: -23, category: '대한민국' },
  'chuncheon': { name: '춘천', latitude: 37.8813, longitude: 127.7300, timeOffsetMinutes: -29, category: '대한민국' },
  'wonju': { name: '원주', latitude: 37.3422, longitude: 127.9202, timeOffsetMinutes: -28, category: '대한민국' },
  'gangneung': { name: '강릉', latitude: 37.7519, longitude: 128.8761, timeOffsetMinutes: -24, category: '대한민국' },
  'yeosu': { name: '여수', latitude: 34.7604, longitude: 127.6622, timeOffsetMinutes: -29, category: '대한민국' },
  'mokpo': { name: '목포', latitude: 34.8118, longitude: 126.3922, timeOffsetMinutes: -34, category: '대한민국' },
  'andong': { name: '안동', latitude: 36.5684, longitude: 128.7294, timeOffsetMinutes: -25, category: '대한민국' },

  // 북한 주요 도시
  'pyongyang': { name: '평양', latitude: 39.0392, longitude: 125.7625, timeOffsetMinutes: -37, category: '북한' },
  'nampo': { name: '남포', latitude: 38.7375, longitude: 125.4078, timeOffsetMinutes: -38, category: '북한' },
  'kaesong': { name: '개성', latitude: 37.9708, longitude: 126.5544, timeOffsetMinutes: -34, category: '북한' },
  'wonsan': { name: '원산', latitude: 39.1533, longitude: 127.4433, timeOffsetMinutes: -30, category: '북한' },
  'hamhung': { name: '함흥', latitude: 39.9181, longitude: 127.5336, timeOffsetMinutes: -30, category: '북한' },
  'chongjin': { name: '청진', latitude: 41.7964, longitude: 129.7758, timeOffsetMinutes: -21, category: '북한' },
  'sinuiju': { name: '신의주', latitude: 40.1006, longitude: 124.3986, timeOffsetMinutes: -42, category: '북한' },

  // 아시아 주요 도시
  'tokyo': { name: '도쿄', latitude: 35.6762, longitude: 139.6503, timeOffsetMinutes: -18, category: '아시아' },
  'osaka': { name: '오사카', latitude: 34.6937, longitude: 135.5023, timeOffsetMinutes: 0, category: '아시아' },
  'beijing': { name: '베이징', latitude: 39.9042, longitude: 116.4074, timeOffsetMinutes: -74, category: '아시아' },
  'shanghai': { name: '상하이', latitude: 31.2304, longitude: 121.4737, timeOffsetMinutes: -54, category: '아시아' },
  'hongkong': { name: '홍콩', latitude: 22.3193, longitude: 114.1694, timeOffsetMinutes: -83, category: '아시아' },
  'taipei': { name: '타이베이', latitude: 25.0330, longitude: 121.5654, timeOffsetMinutes: -54, category: '아시아' },
  'singapore': { name: '싱가포르', latitude: 1.3521, longitude: 103.8198, timeOffsetMinutes: -125, category: '아시아' },
  'bangkok': { name: '방콕', latitude: 13.7563, longitude: 100.5018, timeOffsetMinutes: -138, category: '아시아' },
  'hanoi': { name: '하노이', latitude: 21.0285, longitude: 105.8542, timeOffsetMinutes: -117, category: '아시아' },
  'manila': { name: '마닐라', latitude: 14.5995, longitude: 120.9842, timeOffsetMinutes: -56, category: '아시아' },
  'jakarta': { name: '자카르타', latitude: -6.2088, longitude: 106.8456, timeOffsetMinutes: -113, category: '아시아' },
  'mumbai': { name: '뭄바이', latitude: 19.0760, longitude: 72.8777, timeOffsetMinutes: -249, category: '아시아' },
  'delhi': { name: '델리', latitude: 28.7041, longitude: 77.1025, timeOffsetMinutes: -232, category: '아시아' },

  // 북미 주요 도시 (시차 고려 필요 - 현지 시간 기준)
  'losangeles': { name: '로스앤젤레스', latitude: 34.0522, longitude: -118.2437, timeOffsetMinutes: 1013, category: '북미' },
  'newyork': { name: '뉴욕', latitude: 40.7128, longitude: -74.0060, timeOffsetMinutes: 836, category: '북미' },
  'vancouver': { name: '밴쿠버', latitude: 49.2827, longitude: -123.1207, timeOffsetMinutes: 1033, category: '북미' },
  'toronto': { name: '토론토', latitude: 43.6532, longitude: -79.3832, timeOffsetMinutes: 857, category: '북미' },
  'chicago': { name: '시카고', latitude: 41.8781, longitude: -87.6298, timeOffsetMinutes: 890, category: '북미' },
  'sanfrancisco': { name: '샌프란시스코', latitude: 37.7749, longitude: -122.4194, timeOffsetMinutes: 1030, category: '북미' },
  'seattle': { name: '시애틀', latitude: 47.6062, longitude: -122.3321, timeOffsetMinutes: 1029, category: '북미' },
  'honolulu': { name: '호놀룰루', latitude: 21.3069, longitude: -157.8583, timeOffsetMinutes: 1171, category: '북미' },

  // 유럽 주요 도시
  'london': { name: '런던', latitude: 51.5074, longitude: -0.1278, timeOffsetMinutes: 541, category: '유럽' },
  'paris': { name: '파리', latitude: 48.8566, longitude: 2.3522, timeOffsetMinutes: 531, category: '유럽' },
  'berlin': { name: '베를린', latitude: 52.5200, longitude: 13.4050, timeOffsetMinutes: 486, category: '유럽' },
  'rome': { name: '로마', latitude: 41.9028, longitude: 12.4964, timeOffsetMinutes: 490, category: '유럽' },
  'madrid': { name: '마드리드', latitude: 40.4168, longitude: -3.7038, timeOffsetMinutes: 555, category: '유럽' },
  'amsterdam': { name: '암스테르담', latitude: 52.3676, longitude: 4.9041, timeOffsetMinutes: 520, category: '유럽' },
  'moscow': { name: '모스크바', latitude: 55.7558, longitude: 37.6173, timeOffsetMinutes: 389, category: '유럽' },

  // 오세아니아 주요 도시
  'sydney': { name: '시드니', latitude: -33.8688, longitude: 151.2093, timeOffsetMinutes: -65, category: '오세아니아' },
  'melbourne': { name: '멜버른', latitude: -37.8136, longitude: 144.9631, timeOffsetMinutes: -40, category: '오세아니아' },
  'auckland': { name: '오클랜드', latitude: -36.8485, longitude: 174.7633, timeOffsetMinutes: -159, category: '오세아니아' },
};

/**
 * 지역명(한글)으로 경도 정보 조회
 */
export function getLocationByName(name: string): LocationInfo | null {
  // 먼저 키로 검색
  if (LOCATIONS[name]) {
    return LOCATIONS[name];
  }

  // 한글 이름으로 검색
  const entry = Object.entries(LOCATIONS).find(([_, info]) => info.name === name);
  return entry ? entry[1] : null;
}

/**
 * 경도로 시간 보정값 계산 (분 단위)
 * 한국 표준시(KST)는 동경 135도 기준
 */
export function calculateTimeOffset(longitude: number): number {
  return Math.round((135 - longitude) * 4);
}
