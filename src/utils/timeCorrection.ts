/**
 * 도시 좌표 데이터 — 출생지 선택 및 표시에 사용 (대한민국 17개 시도 한정)
 *
 * 주의: 이 프로젝트는 진태양시(경도/EOT) 보정을 적용하지 않는다.
 * 시장 표준(점신/천을귀인 등 대중 앱) 과 일치시키기 위한 정책 결정.
 *
 * 국외 출생지 옵션은 제거됨 — 한국 표준시(동경 135°) 기준 보정 공식이
 * 해외 현지시각에는 그대로 적용될 수 없어 잘못된 결과를 줬기 때문.
 * 해외 출생자 지원은 추후 현지 표준자오선 데이터 추가 시 재도입.
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
};
