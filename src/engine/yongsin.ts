/**
 * 용신(用神) 판정 엔진
 *
 * 용신 판정 방법:
 * 1. 억부법(抑扶法): 신강/신약에 따라 억제 또는 보조
 * 2. 조후법(調候法): 계절에 따른 한난조습 조절
 * 3. 통관법(通關法): 대립 오행 사이 중재
 * 4. 병약법(病藥法): 사주의 병을 치료하는 약 찾기
 */

import type { SajuResult } from '../utils/sajuCalculator';
import type { OhangType, YongsinAnalysis, YongsinResult, JiType } from './types';
import { STEM_ELEMENT, BRANCH_ELEMENT } from '../utils/sajuCalculator';

// ============================================
// 오행 관계 정의
// ============================================

// 오행 상생 관계: A가 B를 생함
const OHANG_SANG_SAENG: Record<OhangType, OhangType> = {
  '목': '화',  // 목생화
  '화': '토',  // 화생토
  '토': '금',  // 토생금
  '금': '수',  // 금생수
  '수': '목'   // 수생목
};

// 오행 상극 관계: A가 B를 극함
const OHANG_SANG_GEUK: Record<OhangType, OhangType> = {
  '목': '토',  // 목극토
  '화': '금',  // 화극금
  '토': '수',  // 토극수
  '금': '목',  // 금극목
  '수': '화'   // 수극화
};

// 나를 생하는 오행 (인성)
const OHANG_PARENT: Record<OhangType, OhangType> = {
  '목': '수',
  '화': '목',
  '토': '화',
  '금': '토',
  '수': '금'
};

// 나를 극하는 오행 (관성)
const OHANG_CONTROLLER: Record<OhangType, OhangType> = {
  '목': '금',
  '화': '수',
  '토': '목',
  '금': '화',
  '수': '토'
};

// ============================================
// 계절별 조후 용신 정의
// ============================================

interface JohuDefinition {
  season: '봄' | '여름' | '가을' | '겨울';
  monthBranches: JiType[];
  neededElements: Record<OhangType, OhangType[]>;  // 일간 오행별 필요한 조후 요소
  description: string;
}

const JOHU_DEFINITIONS: JohuDefinition[] = [
  {
    season: '봄',
    monthBranches: ['인', '묘', '진'],
    neededElements: {
      '목': ['화', '수'],  // 봄 목은 따뜻함과 수분 필요
      '화': ['목', '수'],  // 봄 화는 목의 도움, 수의 조절
      '토': ['화', '목'],  // 봄 토는 화의 생함이 필요
      '금': ['토', '화'],  // 봄 금은 토의 생함이 필요
      '수': ['금', '토']   // 봄 수는 금의 원천이 필요
    },
    description: '봄(인묘진월)은 목기가 왕성하여'
  },
  {
    season: '여름',
    monthBranches: ['사', '오', '미'],
    neededElements: {
      '목': ['수', '금'],  // 여름 목은 수분 절실
      '화': ['수', '토'],  // 여름 화는 수로 조절 필요
      '토': ['수', '금'],  // 여름 토는 수분 필요
      '금': ['수', '토'],  // 여름 금은 수의 도움 절실
      '수': ['금', '토']   // 여름 수는 근원(금) 필요
    },
    description: '여름(사오미월)은 화기가 왕성하여'
  },
  {
    season: '가을',
    monthBranches: ['신', '유', '술'],
    neededElements: {
      '목': ['수', '화'],  // 가을 목은 금극을 피해 수 필요
      '화': ['목', '토'],  // 가을 화는 목의 도움 필요
      '토': ['화', '금'],  // 가을 토는 안정적
      '금': ['화', '수'],  // 가을 금은 화로 제련
      '수': ['금', '목']   // 가을 수는 금의 생함 받음
    },
    description: '가을(신유술월)은 금기가 왕성하여'
  },
  {
    season: '겨울',
    monthBranches: ['해', '자', '축'],
    neededElements: {
      '목': ['화', '토'],  // 겨울 목은 화의 따뜻함 필요
      '화': ['목', '토'],  // 겨울 화는 목의 생함 절실
      '토': ['화', '목'],  // 겨울 토는 화의 따뜻함 필요
      '금': ['화', '토'],  // 겨울 금은 화의 제련 필요
      '수': ['화', '토']   // 겨울 수는 화로 해빙 필요
    },
    description: '겨울(해자축월)은 수기가 왕성하여'
  }
];

// ============================================
// 용신 판정 함수들
// ============================================

/**
 * 억부법으로 용신을 판정합니다
 */
function determineYongsinByEokbu(
  dayElement: OhangType,
  isStrong: boolean,
  strengthScore: number
): YongsinResult {
  if (isStrong) {
    // 신강 사주: 설기(내가 생하는 것) 또는 극하는 것이 용신
    const sikSang = OHANG_SANG_SAENG[dayElement];  // 식상 (내가 생함)
    const jaeSung = OHANG_SANG_SAENG[sikSang];      // 재성 (식상이 생함)
    const gwanSung = OHANG_CONTROLLER[dayElement]; // 관성 (나를 극함)

    // 신강 정도에 따라 용신 결정
    if (strengthScore >= 70) {
      // 매우 신강: 관성으로 억제
      return {
        yongsin: gwanSung,
        heeSin: sikSang,
        giSin: OHANG_PARENT[dayElement],  // 인성은 기신
        guSin: dayElement,  // 비겁도 기신
        method: '억부',
        reason: `신강 사주(${strengthScore}점)로 ${gwanSung}(관성)이 일간을 적절히 제어합니다.`
      };
    } else {
      // 보통 신강: 식상으로 설기
      return {
        yongsin: sikSang,
        heeSin: jaeSung,
        giSin: OHANG_PARENT[dayElement],
        guSin: dayElement,
        method: '억부',
        reason: `신강 사주(${strengthScore}점)로 ${sikSang}(식상)이 기운을 발산시킵니다.`
      };
    }
  } else {
    // 신약 사주: 인성(나를 생함) 또는 비겁(같은 오행)이 용신
    const inSung = OHANG_PARENT[dayElement];  // 인성 (나를 생함)
    const biGyeop = dayElement;               // 비겁 (같은 오행)
    const gwanSung = OHANG_CONTROLLER[dayElement]; // 관성 (나를 극함)

    if (strengthScore <= 35) {
      // 매우 신약: 인성이 용신
      return {
        yongsin: inSung,
        heeSin: biGyeop,
        giSin: gwanSung,
        guSin: OHANG_SANG_SAENG[dayElement],  // 식상은 구신
        method: '억부',
        reason: `신약 사주(${strengthScore}점)로 ${inSung}(인성)이 일간을 생하여 보호합니다.`
      };
    } else {
      // 보통 신약: 비겁과 인성 모두 용신
      return {
        yongsin: biGyeop,
        heeSin: inSung,
        giSin: gwanSung,
        guSin: OHANG_SANG_GEUK[dayElement],
        method: '억부',
        reason: `신약 사주(${strengthScore}점)로 ${biGyeop}(비겁)이 일간을 돕습니다.`
      };
    }
  }
}

/**
 * 조후법으로 용신을 판정합니다
 */
function determineYongsinByJohu(
  dayElement: OhangType,
  monthBranch: JiType
): YongsinResult | null {
  // 월지에 해당하는 계절 찾기
  const johuDef = JOHU_DEFINITIONS.find(j =>
    j.monthBranches.includes(monthBranch)
  );

  if (!johuDef) return null;

  const neededElements = johuDef.neededElements[dayElement];
  if (!neededElements || neededElements.length === 0) return null;

  const primaryJohu = neededElements[0];
  const secondaryJohu = neededElements[1] || neededElements[0];

  return {
    yongsin: primaryJohu,
    heeSin: secondaryJohu,
    giSin: johuDef.season === '여름' ? '화' :
           johuDef.season === '겨울' ? '수' :
           johuDef.season === '봄' ? '목' : '금',
    guSin: OHANG_SANG_GEUK[primaryJohu],
    method: '조후',
    reason: `${johuDef.description} ${primaryJohu}(으)로 조절이 필요합니다.`
  };
}

/**
 * 통관법으로 용신을 판정합니다
 * (사주에 상극하는 두 오행이 대립할 때)
 */
function determineYongsinByTonggwan(
  elementCount: Record<OhangType, number>
): YongsinResult | null {
  const elements = Object.entries(elementCount) as [OhangType, number][];
  const sorted = elements.sort((a, b) => b[1] - a[1]);

  // 가장 강한 두 오행이 상극 관계인지 확인
  const [first, second] = sorted;
  const firstEl = first[0];
  const secondEl = second[0];

  // 상극 관계 확인
  if (OHANG_SANG_GEUK[firstEl] !== secondEl &&
      OHANG_SANG_GEUK[secondEl] !== firstEl) {
    return null;  // 상극 관계가 아님
  }

  // 두 오행 사이에서 중재하는 오행 찾기
  // A극B 관계에서: A가 생하는 오행 or B를 생하는 오행
  let mediator: OhangType | null = null;

  // 첫 번째 오행이 두 번째를 극하는 경우
  if (OHANG_SANG_GEUK[firstEl] === secondEl) {
    // 첫 번째가 생하고 두 번째를 생하는 오행 = 첫 번째가 생하는 것
    mediator = OHANG_SANG_SAENG[firstEl];
  } else {
    // 두 번째가 첫 번째를 극하는 경우
    mediator = OHANG_SANG_SAENG[secondEl];
  }

  if (!mediator) return null;

  return {
    yongsin: mediator,
    heeSin: OHANG_SANG_SAENG[mediator],
    giSin: OHANG_SANG_GEUK[mediator],
    guSin: firstEl,  // 가장 강한 오행은 구신
    method: '통관',
    reason: `${firstEl}과 ${secondEl}이 대립하여 ${mediator}(으)로 통관(중재)합니다.`
  };
}

/**
 * 오행 분포를 계산합니다
 */
function calculateElementDistribution(saju: SajuResult): Record<OhangType, number> {
  const count: Record<OhangType, number> = {
    '목': 0, '화': 0, '토': 0, '금': 0, '수': 0
  };

  const pillars = [
    saju.pillars.year,
    saju.pillars.month,
    saju.pillars.day,
    saju.pillars.hour
  ];

  pillars.forEach(pillar => {
    const ganEl = STEM_ELEMENT[pillar.gan] as OhangType;
    const zhiEl = BRANCH_ELEMENT[pillar.zhi] as OhangType;

    if (ganEl) count[ganEl] += 1;
    if (zhiEl) count[zhiEl] += 1;
  });

  return count;
}

// ============================================
// 메인 용신 판정 함수
// ============================================

/**
 * 종합 용신 분석을 수행합니다
 */
export function analyzeYongsin(saju: SajuResult): YongsinAnalysis {
  const dayElement = STEM_ELEMENT[saju.dayMaster] as OhangType;
  const monthBranch = saju.pillars.month.zhi as JiType;
  const isStrong = saju.isStrong;
  const strengthScore = saju.strengthScore;

  // 1. 기본 억부법 적용
  const eokbuResult = determineYongsinByEokbu(dayElement, isStrong, strengthScore);

  // 2. 조후법 체크 (계절에 따른 조절 필요성)
  const johuResult = determineYongsinByJohu(dayElement, monthBranch);

  // 3. 통관법 체크 (상극 대립 시)
  const elementDist = calculateElementDistribution(saju);
  const tongResult = determineYongsinByTonggwan(elementDist);

  // 조후법이 필요한 특수 케이스 (극한 계절)
  const isExtremeSeasonCase =
    (['사', '오', '미'].includes(monthBranch) && dayElement === '금') ||  // 여름 금
    (['해', '자', '축'].includes(monthBranch) && dayElement === '화');    // 겨울 화

  // 분석 텍스트 생성
  let analysis = '';

  if (isExtremeSeasonCase && johuResult) {
    // 조후가 우선인 경우
    analysis = `${johuResult.reason} 조후용신이 억부용신보다 우선합니다. ` +
               `일간 ${saju.dayMaster}(${dayElement})은 ${isStrong ? '신강' : '신약'}하며, ` +
               `${johuResult.yongsin}(조후)과 ${eokbuResult.yongsin}(억부)를 함께 고려해야 합니다.`;

    return {
      primary: johuResult,
      secondary: eokbuResult,
      analysis
    };
  }

  // 일반적인 경우: 억부법 중심
  analysis = `${eokbuResult.reason} `;

  if (johuResult) {
    analysis += `또한 ${johuResult.reason} `;
  }

  if (tongResult) {
    analysis += `사주에 ${tongResult.reason} `;
  }

  analysis += `따라서 ${eokbuResult.yongsin}을(를) 용신으로, ` +
              `${eokbuResult.heeSin}을(를) 희신으로 삼습니다.`;

  return {
    primary: eokbuResult,
    secondary: johuResult || undefined,
    analysis
  };
}

/**
 * 용신 오행에 해당하는 색상을 반환합니다
 */
export function getYongsinColor(element: OhangType): string {
  const colors: Record<OhangType, string> = {
    '목': '청색/녹색',
    '화': '적색/주황색',
    '토': '황색/갈색',
    '금': '백색/은색',
    '수': '흑색/남색'
  };
  return colors[element];
}

/**
 * 용신 오행에 해당하는 방위를 반환합니다
 */
export function getYongsinDirection(element: OhangType): string {
  const directions: Record<OhangType, string> = {
    '목': '동쪽',
    '화': '남쪽',
    '토': '중앙',
    '금': '서쪽',
    '수': '북쪽'
  };
  return directions[element];
}

/**
 * 용신 오행에 해당하는 숫자를 반환합니다
 */
export function getYongsinNumber(element: OhangType): string {
  const numbers: Record<OhangType, string> = {
    '목': '3, 8',
    '화': '2, 7',
    '토': '5, 10',
    '금': '4, 9',
    '수': '1, 6'
  };
  return numbers[element];
}
