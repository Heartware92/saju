/**
 * GPT 프롬프트 최적화 버전
 * 엽전 크레딧 시스템에 맞춘 무료/유료 구분
 */

import { SajuResult } from '../utils/sajuCalculator';
import type { TarotCardInfo } from '../services/api';

/**
 * 시스템 프롬프트 (간결화)
 */
export const SYSTEM_PROMPT = `당신은 정통 사주명리 전문가입니다.
핵심만 간결하게, 실용적으로 답변하세요.
한국어로 작성하며 이모지는 최소화하세요.`;

/**
 * 무료 기본 해석 프롬프트 (0엽전)
 * - 만세력 + 간단한 종합 운세 (200-300자)
 */
export const generateBasicPrompt = (result: SajuResult): string => {
  const { pillars, elementPercent, isStrong, gender } = result;

  return `사주 원국:
년주: ${pillars.year.gan}${pillars.year.zhi}
월주: ${pillars.month.gan}${pillars.month.zhi}
일주: ${pillars.day.gan}${pillars.day.zhi}
시주: ${pillars.hour.gan}${pillars.hour.zhi}

오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
신강신약: ${isStrong ? '신강' : '신약'}
성별: ${gender === 'male' ? '남성' : '여성'}

위 사주의 핵심 특성과 종합운을 200-300자로 요약하세요.
형식: 성격, 재물운, 애정운 각 1-2문장.`;
};

/**
 * 상세 해석 프롬프트 (2엽전)
 * - 대운/세운 + 신살 + 상세 분석 (1500-2000자)
 */
export const generateDetailedPrompt = (result: SajuResult): string => {
  const {
    pillars,
    elementPercent,
    isStrong,
    yongSinElement,
    yongSin,
    sinSals,
    interactions,
    daeWoon,
    seWoon,
    gender
  } = result;

  const sinSalStr = sinSals.length > 0
    ? sinSals.map(s => `${s.name}: ${s.description}`).join(', ')
    : '없음';

  const interactionStr = interactions.length > 0
    ? interactions.map(i => `${i.type}: ${i.description}`).join(', ')
    : '없음';

  const daeWoonStr = daeWoon.slice(0, 8).map(d =>
    `${d.startAge}세: ${d.gan}${d.zhi}`
  ).join(', ');

  const currentYear = new Date().getFullYear();
  const recentSeWoon = seWoon
    .filter(s => s.year >= currentYear && s.year <= currentYear + 2)
    .map(s => `${s.year}년: ${s.gan}${s.zhi}`)
    .join(', ');

  return `사주 원국:
년: ${pillars.year.gan}${pillars.year.zhi} 월: ${pillars.month.gan}${pillars.month.zhi} 일: ${pillars.day.gan}${pillars.day.zhi} 시: ${pillars.hour.gan}${pillars.hour.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${isStrong ? '신강' : '신약'}, 용신: ${yongSinElement}(${yongSin})
성별: ${gender === 'male' ? '남성' : '여성'}

신살: ${sinSalStr}
합충형파해: ${interactionStr}

대운 흐름: ${daeWoonStr}
최근 세운: ${recentSeWoon}

위 정보를 바탕으로 아래 항목을 각 200-300자씩 분석하세요 (총 1500-2000자):

1. 종합운 - 타고난 성격과 삶의 방향
2. 재물운 - 재복과 경제적 능력
3. 애정운 - 연애와 결혼운
4. 건강운 - 주의할 신체 부위
5. 직업운 - 적성과 커리어 조언
6. 현재 운세 - 대운/세운 기반 현황
7. 조언 - 실천 가능한 구체적 조언

각 항목을 명확히 구분하여 작성하세요.`;
};

/**
 * 오늘의 운세 프롬프트 (1엽전)
 * - 오늘 날짜 기준 일진 분석 (500-700자)
 */
export const generateTodayFortunePrompt = (result: SajuResult): string => {
  const today = new Date();
  const todayStr = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const { pillars, elementPercent, yongSinElement } = result;

  return `사주 일주: ${pillars.day.gan}${pillars.day.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
용신: ${yongSinElement}

오늘 날짜: ${todayStr}

위 사주와 오늘 일진의 상호작용을 분석하여 500-700자로 작성하세요.

포함 내용:
1. 오늘의 전체 운세 (종합운)
2. 오늘 특히 좋은 점
3. 오늘 주의할 점
4. 오늘의 행운 색상/방향/시간

실용적이고 구체적으로 작성하세요.`;
};

/**
 * 타로 단독 해석 (1엽전)
 */
export const generateTarotPrompt = (
  card: TarotCardInfo,
  question?: string
): string => {
  const direction = card.isReversed ? '역방향' : '정방향';

  return `타로 카드: ${card.nameKr} (${card.name})
방향: ${direction}
키워드: ${card.keywords.join(', ')}

${question ? `질문: ${question}\n` : ''}

위 카드의 의미를 300-400자로 해석하세요.
포함 내용:
1. 카드의 핵심 메시지
2. 현재 상황 해석
3. 앞으로의 조언

따뜻하고 실용적으로 작성하세요.`;
};

/**
 * 사주 × 타로 하이브리드 (3엽전)
 */
export const generateHybridPrompt = (
  sajuResult: SajuResult,
  tarotCard: TarotCardInfo,
  question?: string
): string => {
  const { pillars, elementPercent, yongSinElement, isStrong } = sajuResult;
  const direction = tarotCard.isReversed ? '역방향' : '정방향';

  return `사주 일주: ${pillars.day.gan}${pillars.day.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${isStrong ? '신강' : '신약'}, 용신: ${yongSinElement}

타로: ${tarotCard.nameKr} (${direction})
키워드: ${tarotCard.keywords.join(', ')}

${question ? `질문: ${question}\n` : ''}

사주와 타로를 결합하여 800-1000자로 분석하세요.

포함 내용:
1. 사주와 타로의 조화 분석
2. 통합 운세 메시지
3. 구체적 행동 조언
4. 오행 보완 방법

실용적이고 구체적으로 작성하세요.`;
};

/**
 * 연애운 특화 분석 (2엽전)
 */
export const generateLoveFortunePrompt = (result: SajuResult): string => {
  const { pillars, gender, elementPercent, yongSinElement } = result;

  return `사주 일주: ${pillars.day.gan}${pillars.day.zhi}
성별: ${gender === 'male' ? '남성' : '여성'}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
용신: ${yongSinElement}

위 사주의 애정운/연애운을 700-900자로 분석하세요.

포함 내용:
1. 타고난 연애 성향과 스타일
2. 이상형과 궁합이 좋은 타입
3. 연애/결혼 시기 및 흐름
4. 연애 성공을 위한 조언

구체적이고 실용적으로 작성하세요.`;
};

/**
 * 재물운 특화 분석 (2엽전)
 */
export const generateWealthFortunePrompt = (result: SajuResult): string => {
  const { pillars, elementPercent, yongSinElement, isStrong } = result;

  return `사주 일주: ${pillars.day.gan}${pillars.day.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${isStrong ? '신강' : '신약'}, 용신: ${yongSinElement}

위 사주의 재물운/금전운을 700-900자로 분석하세요.

포함 내용:
1. 타고난 재복과 재물 획득 능력
2. 돈을 버는 방식 (근로소득 vs 투자 등)
3. 재물운이 좋은 시기
4. 재테크 및 투자 조언

구체적이고 실용적으로 작성하세요.`;
};
