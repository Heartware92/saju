/**
 * 해석 템플릿 매칭 엔진
 *
 * 격국, 용신, 신강/신약 등의 정보를 기반으로
 * 카테고리별 해석 텍스트를 생성합니다.
 */

import type { GyeokgukResult, YongsinAnalysis, OhangType, InterpretationCategory } from './types';

// ============================================
// 해석 템플릿 정의
// ============================================

interface InterpretationTemplate {
  id: string;
  category: InterpretationCategory;
  conditions: {
    gyeokguk?: string[];        // 격국 ID 목록
    isStrong?: boolean;         // 신강/신약
    yongsinElement?: OhangType[];  // 용신 오행
    dayElement?: OhangType[];   // 일간 오행
  };
  template: string;
  priority: number;
}

// 성격 해석 템플릿
const PERSONALITY_TEMPLATES: InterpretationTemplate[] = [
  // 정관격
  {
    id: 'personality_jeonggwan_strong',
    category: 'personality',
    conditions: { gyeokguk: ['jeonggwan'], isStrong: true },
    template: '정관격 신강 사주로, 리더십과 책임감이 뛰어납니다. 원칙을 중시하고 사회적 규범 안에서 능력을 발휘합니다. 다만 고집이 세고 융통성이 부족할 수 있으니 타인의 의견에도 귀 기울이세요.',
    priority: 100
  },
  {
    id: 'personality_jeonggwan_weak',
    category: 'personality',
    conditions: { gyeokguk: ['jeonggwan'], isStrong: false },
    template: '정관격 신약 사주로, 성실하고 책임감 있는 성품입니다. 다소 소심하거나 눈치를 보는 경향이 있을 수 있으나, 신뢰받는 사람으로 성장할 잠재력이 큽니다. 자신감을 키우는 것이 중요합니다.',
    priority: 100
  },

  // 편관격
  {
    id: 'personality_pyeongwan_strong',
    category: 'personality',
    conditions: { gyeokguk: ['pyeongwan'], isStrong: true },
    template: '편관격 신강 사주로, 강한 추진력과 카리스마를 지녔습니다. 어떤 어려움도 돌파하는 용기가 있으나, 과격하거나 독단적이 될 수 있습니다. 부드러움과 협력의 자세가 필요합니다.',
    priority: 100
  },
  {
    id: 'personality_pyeongwan_weak',
    category: 'personality',
    conditions: { gyeokguk: ['pyeongwan'], isStrong: false },
    template: '편관격 신약 사주로, 내면에 강한 승부욕과 야망이 있습니다. 외부 압박에 스트레스를 받기 쉬우나, 역경을 통해 크게 성장할 수 있는 사주입니다. 멘탈 관리가 중요합니다.',
    priority: 100
  },

  // 정인격
  {
    id: 'personality_jeongin',
    category: 'personality',
    conditions: { gyeokguk: ['jeongin'] },
    template: '정인격 사주로, 학구적이고 지적인 성향입니다. 깊은 사고력과 배움에 대한 열정이 있으며, 인자하고 포용력 있는 성품입니다. 학문, 교육, 연구 분야에서 능력을 발휘할 수 있습니다.',
    priority: 90
  },

  // 편인격
  {
    id: 'personality_pyeongin',
    category: 'personality',
    conditions: { gyeokguk: ['pyeongin'] },
    template: '편인격 사주로, 독특하고 창의적인 사고를 가졌습니다. 남들과 다른 시각으로 세상을 바라보며, 예술적 감각이 뛰어납니다. 다소 고독하거나 이해받지 못한다는 느낌을 받을 수 있으나, 그 특별함이 곧 재능입니다.',
    priority: 90
  },

  // 식신격
  {
    id: 'personality_siksin',
    category: 'personality',
    conditions: { gyeokguk: ['siksin'] },
    template: '식신격 사주로, 온화하고 낙천적인 성품입니다. 표현력이 뛰어나고 사람들에게 편안함을 줍니다. 음식, 예술, 서비스 분야에 재능이 있으며, 여유롭게 자신의 능력을 발휘할 때 빛납니다.',
    priority: 90
  },

  // 상관격
  {
    id: 'personality_sanggwan',
    category: 'personality',
    conditions: { gyeokguk: ['sanggwan'] },
    template: '상관격 사주로, 총명하고 언변이 뛰어납니다. 비판적 사고와 창의력이 있어 새로운 것을 창조하는 능력이 있습니다. 다만 기존 권위에 도전하는 성향이 있어 갈등을 빚을 수 있으니 표현에 신중함이 필요합니다.',
    priority: 90
  },

  // 정재격
  {
    id: 'personality_jeongjae',
    category: 'personality',
    conditions: { gyeokguk: ['jeongjae'] },
    template: '정재격 사주로, 성실하고 계획적인 성향입니다. 안정을 추구하며 꾸준히 재물을 모으는 능력이 있습니다. 신중하고 현실적이나, 때로는 과감한 도전도 필요합니다.',
    priority: 90
  },

  // 편재격
  {
    id: 'personality_pyeonjae',
    category: 'personality',
    conditions: { gyeokguk: ['pyeonjae'] },
    template: '편재격 사주로, 사교적이고 활동적인 성격입니다. 융통성이 있고 사업 감각이 뛰어납니다. 돈의 흐름을 잘 읽으며, 다양한 분야에서 기회를 포착합니다. 다만 지출 관리에 신경 써야 합니다.',
    priority: 90
  },

  // 건록격
  {
    id: 'personality_geonrok',
    category: 'personality',
    conditions: { gyeokguk: ['geonrok'] },
    template: '건록격 사주로, 자립심과 자존심이 강합니다. 누구의 도움 없이도 스스로 일어서는 능력이 있으며, 독립적으로 일할 때 진가를 발휘합니다. 고집이 셀 수 있으나 그것이 곧 추진력입니다.',
    priority: 90
  },

  // 양인격
  {
    id: 'personality_yangin',
    category: 'personality',
    conditions: { gyeokguk: ['yangin'] },
    template: '양인격 사주로, 강인한 의지와 결단력을 지녔습니다. 도전적인 상황에서 빛을 발하며, 두려움 없이 앞으로 나아갑니다. 날카로운 면이 있어 주변을 다치게 할 수 있으니 부드러움을 갖추면 좋습니다.',
    priority: 90
  },

  // 기본 (매칭되는 것 없을 때)
  {
    id: 'personality_default',
    category: 'personality',
    conditions: {},
    template: '다양한 기질이 조화된 사주입니다. 상황에 따라 유연하게 대처할 수 있는 능력이 있으며, 여러 분야에서 가능성을 발휘할 수 있습니다.',
    priority: 1
  }
];

// 직업/재능 해석 템플릿
const CAREER_TEMPLATES: InterpretationTemplate[] = [
  {
    id: 'career_jeonggwan',
    category: 'career',
    conditions: { gyeokguk: ['jeonggwan'] },
    template: '조직 내에서 능력을 발휘하는 타입입니다. 공무원, 대기업, 공공기관에서 안정적으로 승진하며 성장할 수 있습니다. 법률, 행정, 교육 분야도 적성에 맞습니다.',
    priority: 90
  },
  {
    id: 'career_pyeongwan',
    category: 'career',
    conditions: { gyeokguk: ['pyeongwan'] },
    template: '경쟁이 치열한 분야에서 두각을 나타냅니다. 군, 경찰, 스포츠, 외과의학 등 결단력이 필요한 직종에 적합합니다. 사업가로서의 기질도 있습니다.',
    priority: 90
  },
  {
    id: 'career_jeongin',
    category: 'career',
    conditions: { gyeokguk: ['jeongin'] },
    template: '학문과 연구에 재능이 있습니다. 교수, 연구원, 의사, 변호사 등 전문직에서 성공할 수 있습니다. 후학을 양성하는 교육 분야도 좋습니다.',
    priority: 90
  },
  {
    id: 'career_pyeongin',
    category: 'career',
    conditions: { gyeokguk: ['pyeongin'] },
    template: '독창적인 분야에서 능력을 발휘합니다. 예술, 발명, 철학, 종교, 심리상담 등 비범한 재능이 필요한 분야에 적합합니다. 프리랜서나 1인 기업도 좋습니다.',
    priority: 90
  },
  {
    id: 'career_siksin',
    category: 'career',
    conditions: { gyeokguk: ['siksin'] },
    template: '사람을 대하고 표현하는 분야에 재능이 있습니다. 요식업, 서비스업, 교육, 예술, 콘텐츠 창작 등에서 성공할 수 있습니다. 안정된 환경에서 창의력을 발휘하세요.',
    priority: 90
  },
  {
    id: 'career_sanggwan',
    category: 'career',
    conditions: { gyeokguk: ['sanggwan'] },
    template: '언어와 표현력이 뛰어나 언론, 방송, 법조계, 평론, 컨설팅에 적합합니다. 창작 활동이나 연예 분야에서도 두각을 나타낼 수 있습니다. 기존의 틀을 깨는 혁신적인 분야도 좋습니다.',
    priority: 90
  },
  {
    id: 'career_jeongjae',
    category: 'career',
    conditions: { gyeokguk: ['jeongjae'] },
    template: '재무, 회계, 금융 분야에 적성이 있습니다. 꼼꼼하고 계획적인 성향으로 은행, 보험, 세무 관련 직종에서 신뢰를 얻습니다. 부동산, 자산관리 분야도 좋습니다.',
    priority: 90
  },
  {
    id: 'career_pyeonjae',
    category: 'career',
    conditions: { gyeokguk: ['pyeonjae'] },
    template: '사업 감각이 뛰어나 자영업, 무역, 유통, 영업 분야에서 성공할 수 있습니다. 투자나 벤처에도 재능이 있습니다. 사람을 다루는 능력으로 중개업도 적합합니다.',
    priority: 90
  },
  {
    id: 'career_geonrok',
    category: 'career',
    conditions: { gyeokguk: ['geonrok'] },
    template: '독립적으로 일할 때 최고의 능력을 발휘합니다. 자영업, 프리랜서, 전문직, 1인 기업가로 성공할 가능성이 높습니다. 조직에서는 자율성이 보장되는 직책이 좋습니다.',
    priority: 90
  },
  {
    id: 'career_yangin',
    category: 'career',
    conditions: { gyeokguk: ['yangin'] },
    template: '도전적이고 경쟁적인 분야에서 두각을 나타냅니다. 군인, 외과의사, 운동선수, 경호원 등 강인함이 필요한 직종에 적합합니다. 위기 상황에서 진가를 발휘합니다.',
    priority: 90
  },
  {
    id: 'career_default',
    category: 'career',
    conditions: {},
    template: '다양한 분야에서 가능성이 있는 사주입니다. 자신의 흥미와 적성을 찾아 집중하면 어떤 분야에서든 성공할 수 있습니다.',
    priority: 1
  }
];

// 재물운 해석 템플릿
const WEALTH_TEMPLATES: InterpretationTemplate[] = [
  {
    id: 'wealth_strong_siksin',
    category: 'wealth',
    conditions: { isStrong: true, yongsinElement: ['화'] },
    template: '신강 사주에 식상 용신으로 재물 창출 능력이 뛰어납니다. 자신의 재능을 활용해 돈을 벌 수 있으며, 특히 창작, 기술, 서비스 분야에서 수익을 올릴 수 있습니다.',
    priority: 80
  },
  {
    id: 'wealth_jeongjae',
    category: 'wealth',
    conditions: { gyeokguk: ['jeongjae'] },
    template: '꾸준히 재물을 모으는 타입입니다. 급격한 부보다는 안정적인 저축과 투자로 자산을 형성합니다. 무리한 투기는 피하고 정공법으로 가세요.',
    priority: 90
  },
  {
    id: 'wealth_pyeonjae',
    category: 'wealth',
    conditions: { gyeokguk: ['pyeonjae'] },
    template: '돈이 들어오고 나가는 흐름이 큰 타입입니다. 사업이나 투자로 큰돈을 벌 수 있으나, 지출도 클 수 있습니다. 재물 관리에 신경 쓰고, 과도한 투기는 자제하세요.',
    priority: 90
  },
  {
    id: 'wealth_default',
    category: 'wealth',
    conditions: {},
    template: '재물운은 노력에 비례합니다. 용신 오행을 활용하고, 기신 오행은 피하면 재물 흐름이 좋아집니다. 과욕을 부리지 않으면 안정적인 재물 운이 따릅니다.',
    priority: 1
  }
];

// 애정운 해석 템플릿
const LOVE_TEMPLATES: InterpretationTemplate[] = [
  {
    id: 'love_jeonggwan',
    category: 'love',
    conditions: { gyeokguk: ['jeonggwan'] },
    template: '안정적이고 책임감 있는 연애를 추구합니다. 진지한 만남을 선호하며, 결혼에 대한 의지가 강합니다. 파트너에게 신뢰감을 주는 타입입니다.',
    priority: 90
  },
  {
    id: 'love_pyeonjae',
    category: 'love',
    conditions: { gyeokguk: ['pyeonjae'] },
    template: '다양한 이성 인연이 많은 편입니다. 매력적이고 사교적이어서 쉽게 호감을 사지만, 한 사람에게 집중하기 어려울 수 있습니다. 진정한 인연을 구분하는 안목이 필요합니다.',
    priority: 90
  },
  {
    id: 'love_sanggwan',
    category: 'love',
    conditions: { gyeokguk: ['sanggwan'] },
    template: '자유로운 연애관을 가지고 있습니다. 구속받는 것을 싫어하며, 자신을 이해해주는 파트너가 필요합니다. 언어적 표현이 풍부하여 로맨틱한 연애를 즐깁니다.',
    priority: 90
  },
  {
    id: 'love_default',
    category: 'love',
    conditions: {},
    template: '연애와 결혼에서 진심을 다하는 것이 중요합니다. 용신 오행에 해당하는 사람과의 인연이 좋으며, 서로를 보완해주는 관계가 행복을 가져옵니다.',
    priority: 1
  }
];

// 건강운 해석 템플릿
const HEALTH_TEMPLATES: InterpretationTemplate[] = [
  {
    id: 'health_wood_weak',
    category: 'health',
    conditions: { dayElement: ['목'], isStrong: false },
    template: '간, 담, 눈, 근육 계통에 주의가 필요합니다. 스트레스 관리와 충분한 휴식이 중요하며, 숲이나 자연에서 기를 보충하면 좋습니다.',
    priority: 80
  },
  {
    id: 'health_fire_weak',
    category: 'health',
    conditions: { dayElement: ['화'], isStrong: false },
    template: '심장, 소장, 혈액순환에 주의가 필요합니다. 규칙적인 운동과 따뜻한 음식이 도움이 됩니다. 과로와 감정 기복을 조심하세요.',
    priority: 80
  },
  {
    id: 'health_earth_weak',
    category: 'health',
    conditions: { dayElement: ['토'], isStrong: false },
    template: '소화기관, 위장, 비장에 주의가 필요합니다. 식습관 관리가 중요하며, 과식과 폭식을 피하세요. 규칙적인 식사가 건강의 기본입니다.',
    priority: 80
  },
  {
    id: 'health_metal_weak',
    category: 'health',
    conditions: { dayElement: ['금'], isStrong: false },
    template: '폐, 대장, 피부, 호흡기에 주의가 필요합니다. 깨끗한 공기와 환경이 중요하며, 호흡 운동이나 명상이 도움이 됩니다.',
    priority: 80
  },
  {
    id: 'health_water_weak',
    category: 'health',
    conditions: { dayElement: ['수'], isStrong: false },
    template: '신장, 방광, 생식기, 귀에 주의가 필요합니다. 충분한 수분 섭취와 보온이 중요합니다. 과로를 피하고 휴식을 충분히 취하세요.',
    priority: 80
  },
  {
    id: 'health_yangin',
    category: 'health',
    conditions: { gyeokguk: ['yangin'] },
    template: '양인격은 사고나 수술수에 주의가 필요합니다. 위험한 활동 시 안전에 유의하고, 정기적인 건강검진을 권장합니다. 분노 조절도 건강에 영향을 줍니다.',
    priority: 85
  },
  {
    id: 'health_default',
    category: 'health',
    conditions: {},
    template: '전반적으로 건강한 사주입니다. 기신 오행에 해당하는 장기에 주의하고, 용신 오행을 보충하면 건강을 유지할 수 있습니다. 규칙적인 생활습관이 중요합니다.',
    priority: 1
  }
];

// 모든 템플릿 합치기
const ALL_TEMPLATES: InterpretationTemplate[] = [
  ...PERSONALITY_TEMPLATES,
  ...CAREER_TEMPLATES,
  ...WEALTH_TEMPLATES,
  ...LOVE_TEMPLATES,
  ...HEALTH_TEMPLATES
];

// ============================================
// 템플릿 매칭 함수
// ============================================

interface MatchingContext {
  gyeokguk: GyeokgukResult;
  yongsin: YongsinAnalysis;
  isStrong: boolean;
  dayElement: OhangType;
}

/**
 * 조건에 맞는 템플릿을 찾습니다
 */
function matchTemplate(
  category: InterpretationCategory,
  context: MatchingContext
): InterpretationTemplate {
  const categoryTemplates = ALL_TEMPLATES.filter(t => t.category === category);

  // 조건 매칭 점수 계산
  const scored = categoryTemplates.map(template => {
    let score = template.priority;

    // 격국 조건 체크
    if (template.conditions.gyeokguk) {
      if (template.conditions.gyeokguk.includes(context.gyeokguk.id)) {
        score += 50;
      } else {
        score -= 100;  // 격국이 맞지 않으면 대폭 감점
      }
    }

    // 신강/신약 조건 체크
    if (template.conditions.isStrong !== undefined) {
      if (template.conditions.isStrong === context.isStrong) {
        score += 30;
      } else {
        score -= 50;
      }
    }

    // 용신 오행 조건 체크
    if (template.conditions.yongsinElement) {
      if (template.conditions.yongsinElement.includes(context.yongsin.primary.yongsin)) {
        score += 20;
      }
    }

    // 일간 오행 조건 체크
    if (template.conditions.dayElement) {
      if (template.conditions.dayElement.includes(context.dayElement)) {
        score += 20;
      } else {
        score -= 30;
      }
    }

    return { template, score };
  });

  // 점수 순으로 정렬하여 최고점 반환
  scored.sort((a, b) => b.score - a.score);

  return scored[0].template;
}

/**
 * 모든 카테고리의 해석을 생성합니다
 */
export function generateInterpretations(
  gyeokguk: GyeokgukResult,
  yongsin: YongsinAnalysis,
  isStrong: boolean,
  dayElement: OhangType
): Record<InterpretationCategory, string> {
  const context: MatchingContext = {
    gyeokguk,
    yongsin,
    isStrong,
    dayElement
  };

  const categories: InterpretationCategory[] = [
    'personality', 'career', 'wealth', 'love', 'health'
  ];

  const result: Record<string, string> = {};

  for (const category of categories) {
    const template = matchTemplate(category, context);
    result[category] = template.template;
  }

  return result as Record<InterpretationCategory, string>;
}

/**
 * 특정 카테고리의 해석을 생성합니다
 */
export function generateCategoryInterpretation(
  category: InterpretationCategory,
  gyeokguk: GyeokgukResult,
  yongsin: YongsinAnalysis,
  isStrong: boolean,
  dayElement: OhangType
): string {
  const context: MatchingContext = {
    gyeokguk,
    yongsin,
    isStrong,
    dayElement
  };

  const template = matchTemplate(category, context);
  return template.template;
}

// 템플릿 내보내기 (확장용)
export { ALL_TEMPLATES };
