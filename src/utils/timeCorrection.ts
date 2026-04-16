/**
 * 도시 좌표 데이터 — 출생지 선택 및 표시에 사용
 *
 * 주의: 이 프로젝트는 진태양시(경도/EOT) 보정을 적용하지 않는다.
 * 시장 표준(점신/천을귀인 등 대중 앱) 과 일치시키기 위한 정책 결정.
 */

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

  // 도 (좌표는 도청 소재지 기준)
  'gyeonggi': { lat: 37.2752, lng: 127.0094, name: '경기도', category: '대한민국' },
  'gangwon': { lat: 37.8813, lng: 127.7298, name: '강원도', category: '대한민국' },
  'chungbuk': { lat: 36.6357, lng: 127.4912, name: '충청북도', category: '대한민국' },
  'chungnam': { lat: 36.6588, lng: 126.6728, name: '충청남도', category: '대한민국' },
  'jeonbuk': { lat: 35.8203, lng: 127.1088, name: '전라북도', category: '대한민국' },
  'jeonnam': { lat: 34.8161, lng: 126.4630, name: '전라남도', category: '대한민국' },
  'gyeongbuk': { lat: 36.5760, lng: 128.5056, name: '경상북도', category: '대한민국' },
  'gyeongnam': { lat: 35.2380, lng: 128.6924, name: '경상남도', category: '대한민국' },
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
