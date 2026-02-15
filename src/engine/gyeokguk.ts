/**
 * 격국(格局) 판정 엔진
 *
 * 내격 10격:
 * - 정관격, 편관격, 정인격, 편인격
 * - 정재격, 편재격, 식신격, 상관격
 * - 건록격, 양인격
 */

import type { SajuResult } from '../utils/sajuCalculator';
import type { GyeokgukResult, SipseongType, GanType, JiType } from './types';
import {
  STEM_ELEMENT,
  BRANCH_HIDDEN_STEMS,
  TEN_GODS_MAP,
  EARTHLY_BRANCHES
} from '../utils/sajuCalculator';

// ============================================
// 지장간 정기(본기) 매핑
// ============================================

const BRANCH_MAIN_STEM: Record<string, string> = {
  '자': '계', '축': '기', '인': '갑', '묘': '을',
  '진': '무', '사': '병', '오': '정', '미': '기',
  '신': '경', '유': '신', '술': '무', '해': '임'
};

// ============================================
// 건록지/양인지 매핑
// ============================================

const GEONROK_MAP: Record<GanType, JiType> = {
  '갑': '인', '을': '묘', '병': '사', '정': '오',
  '무': '사', '기': '오', '경': '신', '신': '유',
  '임': '해', '계': '자'
};

const YANGIN_MAP: Record<GanType, JiType> = {
  '갑': '묘', '을': '인', '병': '오', '정': '사',
  '무': '오', '기': '사', '경': '유', '신': '신',
  '임': '자', '계': '해'
};

// ============================================
// 격국 정의
// ============================================

interface GyeokgukDefinition {
  id: string;
  name: string;
  nameHanja: string;
  type: '내격' | '외격';
  priority: number;
  sipseong?: SipseongType;      // 십성격의 경우
  specialType?: 'geonrok' | 'yangin';  // 특수격의 경우
  traits: string[];
  careers: string[];
  description: string;
}

const GYEOKGUK_DEFINITIONS: GyeokgukDefinition[] = [
  // 십성격 (8격)
  {
    id: 'jeonggwan',
    name: '정관격',
    nameHanja: '正官格',
    type: '내격',
    priority: 100,
    sipseong: '정관',
    traits: ['책임감', '정직함', '규율 중시', '명예 추구', '보수적', '원칙주의'],
    careers: ['공무원', '대기업 관리직', '법조인', '교육자', '공공기관'],
    description: '정관이 월령에서 투출하여 격을 이룬 경우. 바른 관직, 명예와 책임을 상징합니다.'
  },
  {
    id: 'pyeongwan',
    name: '편관격',
    nameHanja: '偏官格',
    type: '내격',
    priority: 100,
    sipseong: '편관',
    traits: ['추진력', '결단력', '카리스마', '승부욕', '독립심', '권위적'],
    careers: ['군인', '경찰', '외과의사', '사업가', '운동선수', 'CEO'],
    description: '편관(칠살)이 월령에서 투출하여 격을 이룬 경우. 권력과 도전을 상징합니다.'
  },
  {
    id: 'jeongin',
    name: '정인격',
    nameHanja: '正印格',
    type: '내격',
    priority: 100,
    sipseong: '정인',
    traits: ['학구적', '인자함', '품위', '전통 중시', '안정 추구', '배려심'],
    careers: ['학자', '교수', '연구원', '의사', '종교인', '교사'],
    description: '정인이 월령에서 투출하여 격을 이룬 경우. 학문과 인덕을 상징합니다.'
  },
  {
    id: 'pyeongin',
    name: '편인격',
    nameHanja: '偏印格',
    type: '내격',
    priority: 100,
    sipseong: '편인',
    traits: ['창의적', '비범함', '독창성', '예민함', '고독', '탐구심'],
    careers: ['예술가', '발명가', '철학자', '역술인', '프리랜서', '연구직'],
    description: '편인이 월령에서 투출하여 격을 이룬 경우. 특별한 재능과 고독을 상징합니다.'
  },
  {
    id: 'jeongjae',
    name: '정재격',
    nameHanja: '正財格',
    type: '내격',
    priority: 100,
    sipseong: '정재',
    traits: ['성실함', '절약', '안정 추구', '현실적', '계획적', '신중함'],
    careers: ['회계사', '은행원', '재무관리', '부동산', '자영업', '공인중개사'],
    description: '정재가 월령에서 투출하여 격을 이룬 경우. 정당한 재물과 안정을 상징합니다.'
  },
  {
    id: 'pyeonjae',
    name: '편재격',
    nameHanja: '偏財格',
    type: '내격',
    priority: 100,
    sipseong: '편재',
    traits: ['사교적', '융통성', '모험심', '대범함', '낙천적', '활동적'],
    careers: ['사업가', '투자자', '영업직', '무역업', '유통업', '벤처'],
    description: '편재가 월령에서 투출하여 격을 이룬 경우. 유동적 재물과 사교를 상징합니다.'
  },
  {
    id: 'siksin',
    name: '식신격',
    nameHanja: '食神格',
    type: '내격',
    priority: 100,
    sipseong: '식신',
    traits: ['온화함', '낙천적', '표현력', '예술성', '여유', '미식가'],
    careers: ['요리사', '예술가', '교사', '상담사', '서비스업', '콘텐츠 크리에이터'],
    description: '식신이 월령에서 투출하여 격을 이룬 경우. 재능 발휘와 풍요를 상징합니다.'
  },
  {
    id: 'sanggwan',
    name: '상관격',
    nameHanja: '傷官格',
    type: '내격',
    priority: 100,
    sipseong: '상관',
    traits: ['총명함', '언변', '비판적', '자유분방', '재능', '반항심'],
    careers: ['변호사', '언론인', '연예인', '작가', '컨설턴트', '평론가'],
    description: '상관이 월령에서 투출하여 격을 이룬 경우. 재능과 표현을 상징합니다.'
  },

  // 특수격 (2격)
  {
    id: 'geonrok',
    name: '건록격',
    nameHanja: '建祿格',
    type: '내격',
    priority: 90,
    specialType: 'geonrok',
    traits: ['자립심', '독립적', '주관 강함', '리더십', '고집', '자존심'],
    careers: ['자영업', '프리랜서', '전문직', '독립사업', '1인 기업'],
    description: '월지가 일간의 건록지인 경우. 자립과 독립을 상징합니다.'
  },
  {
    id: 'yangin',
    name: '양인격',
    nameHanja: '羊刃格',
    type: '내격',
    priority: 90,
    specialType: 'yangin',
    traits: ['강인함', '결단력', '과감함', '투쟁심', '극단적', '승부욕'],
    careers: ['군인', '외과의사', '운동선수', '경호원', '도전적 직업'],
    description: '월지가 일간의 양인지(제왕지)인 경우. 강한 기운과 결단을 상징합니다.'
  }
];

// ============================================
// 격국 판정 함수
// ============================================

/**
 * 월지 지장간의 십성을 구합니다
 */
function getMonthHiddenStemsSipseong(dayGan: string, monthBranch: string): SipseongType[] {
  const hiddenStems = BRANCH_HIDDEN_STEMS[monthBranch] || [];
  const tenGodMap = TEN_GODS_MAP[dayGan];

  if (!tenGodMap) return [];

  return hiddenStems.map(stem => tenGodMap[stem] as SipseongType);
}

/**
 * 월지 정기(본기)의 십성을 구합니다
 */
function getMonthMainStemSipseong(dayGan: string, monthBranch: string): SipseongType | null {
  const mainStem = BRANCH_MAIN_STEM[monthBranch];
  if (!mainStem) return null;

  const tenGodMap = TEN_GODS_MAP[dayGan];
  if (!tenGodMap) return null;

  return tenGodMap[mainStem] as SipseongType;
}

/**
 * 천간에 특정 십성이 투출했는지 확인합니다
 */
function isSipseongInHeavenlyStems(
  dayGan: string,
  saju: SajuResult,
  targetSipseong: SipseongType
): boolean {
  const tenGodMap = TEN_GODS_MAP[dayGan];
  if (!tenGodMap) return false;

  const stems = [
    saju.pillars.year.gan,
    saju.pillars.month.gan,
    saju.pillars.hour.gan
  ];

  return stems.some(stem => tenGodMap[stem] === targetSipseong);
}

/**
 * 월지 지장간에서 천간으로 투출한 십성을 찾습니다
 */
function findTouchuledSipseong(dayGan: string, saju: SajuResult): SipseongType | null {
  const monthBranch = saju.pillars.month.zhi;
  const hiddenStems = BRANCH_HIDDEN_STEMS[monthBranch] || [];
  const tenGodMap = TEN_GODS_MAP[dayGan];

  if (!tenGodMap) return null;

  // 천간들 (일간 제외)
  const heavenlyStems = [
    saju.pillars.year.gan,
    saju.pillars.month.gan,
    saju.pillars.hour.gan
  ];

  // 지장간 중 천간에 투출한 것 찾기 (정기 우선)
  for (const hiddenStem of hiddenStems) {
    if (heavenlyStems.includes(hiddenStem)) {
      const sipseong = tenGodMap[hiddenStem] as SipseongType;
      // 비견, 겁재는 격국 형성 안 함
      if (sipseong !== '비견' && sipseong !== '겁재') {
        return sipseong;
      }
    }
  }

  return null;
}

/**
 * 격국을 판정합니다
 */
export function determineGyeokguk(saju: SajuResult): GyeokgukResult {
  const dayGan = saju.dayMaster;
  const monthBranch = saju.pillars.month.zhi;

  // 1. 건록격 체크
  if (GEONROK_MAP[dayGan as GanType] === monthBranch) {
    const def = GYEOKGUK_DEFINITIONS.find(g => g.id === 'geonrok')!;
    return {
      id: def.id,
      name: def.name,
      nameHanja: def.nameHanja,
      type: def.type,
      description: def.description,
      traits: def.traits,
      careers: def.careers,
      confidence: 0.95,
      reason: `월지 ${monthBranch}이(가) 일간 ${dayGan}의 건록지입니다.`
    };
  }

  // 2. 양인격 체크
  if (YANGIN_MAP[dayGan as GanType] === monthBranch) {
    const def = GYEOKGUK_DEFINITIONS.find(g => g.id === 'yangin')!;
    return {
      id: def.id,
      name: def.name,
      nameHanja: def.nameHanja,
      type: def.type,
      description: def.description,
      traits: def.traits,
      careers: def.careers,
      confidence: 0.95,
      reason: `월지 ${monthBranch}이(가) 일간 ${dayGan}의 양인지입니다.`
    };
  }

  // 3. 십성격 체크 - 월지 지장간에서 천간 투출 확인
  const touchuledSipseong = findTouchuledSipseong(dayGan, saju);

  if (touchuledSipseong) {
    const def = GYEOKGUK_DEFINITIONS.find(g => g.sipseong === touchuledSipseong);
    if (def) {
      return {
        id: def.id,
        name: def.name,
        nameHanja: def.nameHanja,
        type: def.type,
        description: def.description,
        traits: def.traits,
        careers: def.careers,
        confidence: 0.9,
        reason: `월지 ${monthBranch}의 지장간 중 ${touchuledSipseong}이 천간에 투출했습니다.`
      };
    }
  }

  // 4. 투출 없을 시 월지 정기 기준
  const mainStemSipseong = getMonthMainStemSipseong(dayGan, monthBranch);
  if (mainStemSipseong && mainStemSipseong !== '비견' && mainStemSipseong !== '겁재') {
    const def = GYEOKGUK_DEFINITIONS.find(g => g.sipseong === mainStemSipseong);
    if (def) {
      return {
        id: def.id,
        name: def.name,
        nameHanja: def.nameHanja,
        type: def.type,
        description: def.description,
        traits: def.traits,
        careers: def.careers,
        confidence: 0.75,
        reason: `월지 ${monthBranch}의 정기(본기) ${BRANCH_MAIN_STEM[monthBranch]}이(가) ${mainStemSipseong}에 해당합니다. (투출 없음)`
      };
    }
  }

  // 5. 기본값 - 격국 불명확
  return {
    id: 'unknown',
    name: '잡격',
    type: '외격',
    description: '뚜렷한 격국을 형성하지 않는 사주입니다.',
    traits: ['다재다능', '유연함', '적응력'],
    careers: ['다양한 분야 가능'],
    confidence: 0.5,
    reason: '월지에서 뚜렷한 격국을 판정하기 어렵습니다.'
  };
}

/**
 * 격국의 성패(成敗)를 분석합니다
 * - 성격(成格): 격국이 온전히 이루어진 상태
 * - 패격(敗格): 격국이 손상된 상태
 */
export function analyzeGyeokgukStatus(
  saju: SajuResult,
  gyeokguk: GyeokgukResult
): { isSuccessful: boolean; analysis: string } {
  const dayGan = saju.dayMaster;

  // 정관격 성패 분석
  if (gyeokguk.id === 'jeonggwan') {
    // 상관이 있으면 패격 (상관견관)
    const hasSanggwan = Object.values(saju.pillars).some(
      p => TEN_GODS_MAP[dayGan]?.[p.gan] === '상관'
    );

    if (hasSanggwan) {
      return {
        isSuccessful: false,
        analysis: '상관이 정관을 손상시키는 상관견관(傷官見官) 구조입니다. 직장에서의 갈등이나 권위와의 충돌에 주의가 필요합니다.'
      };
    }

    return {
      isSuccessful: true,
      analysis: '정관이 손상 없이 온전하여 성격(成格)입니다. 관직과 명예운이 좋습니다.'
    };
  }

  // 식신격 성패 분석
  if (gyeokguk.id === 'siksin') {
    // 편인이 있으면 패격 (효신탈식)
    const hasPyeonin = Object.values(saju.pillars).some(
      p => TEN_GODS_MAP[dayGan]?.[p.gan] === '편인'
    );

    if (hasPyeonin) {
      return {
        isSuccessful: false,
        analysis: '편인이 식신을 빼앗는 효신탈식(梟神奪食) 구조입니다. 재능 발휘에 장애가 있을 수 있습니다.'
      };
    }

    return {
      isSuccessful: true,
      analysis: '식신이 온전하여 성격(成格)입니다. 재능을 통한 발복이 기대됩니다.'
    };
  }

  // 기본값
  return {
    isSuccessful: true,
    analysis: `${gyeokguk.name}이 크게 손상되지 않아 격국의 본래 성질을 발휘할 수 있습니다.`
  };
}

// 격국 정의 내보내기 (외부에서 참조용)
export { GYEOKGUK_DEFINITIONS };
