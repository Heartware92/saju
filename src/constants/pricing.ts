/**
 * 크레딧 패키지 정의
 * 행성 세트: 별 → 지구 → 화성 → 수성 → 금성
 * 크레딧 단위: 해(☀️) = 프리미엄, 달(🌙) = 스탠다드
 */

export interface CreditPackage {
  id: string;
  name: string;
  planet: string;
  icon: string;
  price: number;
  sunCredit: number;
  moonCredit: number;
  bonusSun: number;
  bonusMoon: number;
  description: string;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
}

export const CREDIT_PACKAGES: readonly CreditPackage[] = [
  {
    id: 'star',
    name: '별 세트',
    planet: '⭐',
    icon: '⭐',
    price: 2000,
    sunCredit: 1,
    moonCredit: 2,
    bonusSun: 0,
    bonusMoon: 0,
    description: '가볍게 시작하기',
    features: ['☀️ 해 1개', '🌙 달 2개'],
  },
  {
    id: 'earth',
    name: '지구 세트',
    planet: '🌍',
    icon: '🌍',
    price: 5000,
    sunCredit: 3,
    moonCredit: 5,
    bonusSun: 0,
    bonusMoon: 1,
    description: '기본 분석 여러 번',
    features: ['☀️ 해 3개', '🌙 달 5+1개', '보너스 달 1개'],
    popular: true,
  },
  {
    id: 'mars',
    name: '화성 세트',
    planet: '🔴',
    icon: '🔴',
    price: 10000,
    sunCredit: 7,
    moonCredit: 10,
    bonusSun: 1,
    bonusMoon: 2,
    description: '깊이 있는 운세 탐색',
    features: ['☀️ 해 7+1개', '🌙 달 10+2개', '보너스 해 1 + 달 2'],
  },
  {
    id: 'mercury',
    name: '수성 세트',
    planet: '🪐',
    icon: '🪐',
    price: 20000,
    sunCredit: 15,
    moonCredit: 20,
    bonusSun: 3,
    bonusMoon: 5,
    description: '온 가족 운세 보기',
    features: ['☀️ 해 15+3개', '🌙 달 20+5개', '보너스 해 3 + 달 5'],
    bestValue: true,
  },
  {
    id: 'venus',
    name: '금성 세트',
    planet: '✨',
    icon: '✨',
    price: 50000,
    sunCredit: 40,
    moonCredit: 50,
    bonusSun: 10,
    bonusMoon: 15,
    description: '최대 혜택 프리미엄',
    features: ['☀️ 해 40+10개', '🌙 달 50+15개', '보너스 해 10 + 달 15'],
  },
] as const;

/**
 * 크레딧 소비량 정의
 */
export const CREDIT_COST = {
  // 사주 분석
  basicInterpretation: { type: 'free' as const, amount: 0 },
  detailedInterpretation: { type: 'sun' as const, amount: 2 },
  todayFortune: { type: 'moon' as const, amount: 1 },
  loveFortune: { type: 'sun' as const, amount: 2 },
  wealthFortune: { type: 'sun' as const, amount: 2 },

  // 타로
  tarotReading: { type: 'moon' as const, amount: 1 },      // 질문 타로 (1장)
  todayTarot: { type: 'moon' as const, amount: 1 },        // 오늘의 타로 (1장, 하루 고정)
  monthlyTarot: { type: 'sun' as const, amount: 1 },       // 이달의 타로 (3장 스프레드, 월단위 고정)

  // 하이브리드
  hybridReading: { type: 'sun' as const, amount: 3 },

  // 기타 풀이법
  tojeongReading: { type: 'sun' as const, amount: 2 },     // 토정비결
  zamidusuReading: { type: 'sun' as const, amount: 3 },    // 자미두수

  // 기타
  pdfDownload: { type: 'moon' as const, amount: 1 },
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
