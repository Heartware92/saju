/**
 * 엽전 크레딧 패키지 정의
 * 조선시대 계급 컨셉: 평민 → 중인 → 양반 → 판서
 */

export interface CreditPackage {
  id: string;
  name: string;
  rank: string;          // 한자 표기
  icon: string;
  price: number;
  baseCredit: number;
  bonusCredit: number;
  totalCredit: number;
  description: string;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  {
    id: 'pyeongmin',
    name: '평민',
    rank: '庶民',
    icon: '🪙',
    price: 990,
    baseCredit: 1,
    bonusCredit: 0,
    totalCredit: 1,
    description: '기본 사주 풀이 1회',
    features: ['만세력 확인', '기본 AI 해석']
  },
  {
    id: 'jungin',
    name: '중인',
    rank: '中人',
    icon: '🪙🪙',
    price: 2970,
    baseCredit: 3,
    bonusCredit: 1,
    totalCredit: 4,
    description: '기본 풀이 3회 + 보너스 1엽전',
    features: ['만세력 확인', '기본 AI 해석', '+1 보너스 엽전'],
    popular: true
  },
  {
    id: 'yangban',
    name: '양반',
    rank: '兩班',
    icon: '🪙🪙🪙',
    price: 4900,
    baseCredit: 5,
    bonusCredit: 2,
    totalCredit: 7,
    description: '기본 풀이 5회 + 보너스 2엽전',
    features: ['만세력 확인', '기본 AI 해석', '+2 보너스 엽전']
  },
  {
    id: 'panseo',
    name: '판서',
    rank: '判書',
    icon: '💰',
    price: 9900,
    baseCredit: 10,
    bonusCredit: 5,
    totalCredit: 15,
    description: '기본 풀이 10회 + 보너스 5엽전',
    features: ['만세력 확인', '기본 AI 해석', '+5 보너스 엽전', '최고 가성비'],
    bestValue: true
  }
] as const;

/**
 * 크레딧 소비량 정의
 */
export const CREDIT_COST = {
  // 사주 분석
  basicInterpretation: 0,      // 무료 (만세력 + 간단 AI 요약)
  detailedInterpretation: 2,   // 상세 해석 (대운/세운 + 신살 + 상세 AI)
  todayFortune: 1,              // 오늘의 운세
  loveFortune: 2,               // 애정운 특화 분석
  wealthFortune: 2,             // 재물운 특화 분석

  // 타로 분석
  tarotReading: 1,              // 타로 단독 리딩

  // 하이브리드
  hybridReading: 3,             // 사주 × 타로 하이브리드

  // 기타
  pdfDownload: 1                // PDF 다운로드
} as const;

/**
 * 크레딧 사용 사유 텍스트
 */
export const CREDIT_USAGE_REASON = {
  detailedInterpretation: '사주 상세 해석',
  todayFortune: '오늘의 운세',
  loveFortune: '애정운 분석',
  wealthFortune: '재물운 분석',
  tarotReading: '타로 리딩',
  hybridReading: '사주 × 타로 하이브리드 분석',
  pdfDownload: 'PDF 다운로드'
} as const;

/**
 * 패키지 ID로 패키지 정보 조회
 */
export const getPackageById = (id: string): CreditPackage | undefined => {
  return CREDIT_PACKAGES.find(pkg => pkg.id === id);
};

/**
 * 가격으로 패키지 정보 조회
 */
export const getPackageByPrice = (price: number): CreditPackage | undefined => {
  return CREDIT_PACKAGES.find(pkg => pkg.price === price);
};
