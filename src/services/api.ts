import axios from 'axios';
import { SajuResult } from '../utils/sajuCalculator';

const API_URL = 'https://api.openai.com/v1/chat/completions';

export const fetchSajuAnalysis = async (prompt: string, apiKey: string) => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `당신은 30년 경력의 정통 사주명리학 전문가입니다.
동양 철학과 현대 심리학을 결합하여 깊이 있으면서도 따뜻한 상담을 제공합니다.
말투는 존경받는 도사님처럼 신비롭고 따뜻하게, 하지만 현대인이 이해하기 쉽게 풀어서 설명합니다.
답변은 한국어로 작성하며, 이모지를 적절히 사용하여 가독성을 높입니다.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.75,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      throw new Error('API Key가 유효하지 않습니다.');
    }
    throw new Error('사주 분석을 가져오는데 실패했습니다.');
  }
};

export const generateSajuPrompt = (
  result: SajuResult,
  categoryId: string = 'traditional',
  _targetDateStr?: string
) => {
  const { pillars, daeWoon, seWoon, gender, solarDate } = result;

  const wonGukStr = `
년주: ${pillars.year.gan}${pillars.year.zhi} (${pillars.year.ganElement}${pillars.year.zhiElement}) - 십성: ${pillars.year.tenGodGan}/${pillars.year.tenGodZhi} - 12운성: ${pillars.year.twelveStage}
월주: ${pillars.month.gan}${pillars.month.zhi} (${pillars.month.ganElement}${pillars.month.zhiElement}) - 십성: ${pillars.month.tenGodGan}/${pillars.month.tenGodZhi} - 12운성: ${pillars.month.twelveStage}
일주: ${pillars.day.gan}${pillars.day.zhi} (${pillars.day.ganElement}${pillars.day.zhiElement}) - 본원(일간) - 12운성: ${pillars.day.twelveStage}
시주: ${pillars.hour.gan}${pillars.hour.zhi} (${pillars.hour.ganElement}${pillars.hour.zhiElement}) - 십성: ${pillars.hour.tenGodGan}/${pillars.hour.tenGodZhi} - 12운성: ${pillars.hour.twelveStage}`;

  const jiJangGanStr = `
년지 지장간: ${pillars.year.hiddenStems.join(', ')}
월지 지장간: ${pillars.month.hiddenStems.join(', ')}
일지 지장간: ${pillars.day.hiddenStems.join(', ')}
시지 지장간: ${pillars.hour.hiddenStems.join(', ')}`;

  const elementStr = `목(${result.elementPercent.목}%) 화(${result.elementPercent.화}%) 토(${result.elementPercent.토}%) 금(${result.elementPercent.금}%) 수(${result.elementPercent.수}%)`;
  const strengthStr = `${result.isStrong ? '신강' : '신약'} (${result.strengthScore}점) - ${result.strengthAnalysis}`;
  const yongSinStr = `용신: ${result.yongSinElement}(${result.yongSin}), 희신: ${result.heeSin}, 기신: ${result.giSin}`;

  const sinSalStr = result.sinSals.length > 0
    ? result.sinSals.map(s => `${s.name}: ${s.description}`).join('\n')
    : '특별한 신살 없음';

  const interactionStr = result.interactions.length > 0
    ? result.interactions.map(i => `${i.type}: ${i.description}`).join('\n')
    : '특별한 합충형파해 없음';

  const daeWoonStr = daeWoon.slice(0, 8).map(d =>
    `${d.startAge}~${d.endAge}년: ${d.gan}${d.zhi}(${d.tenGod}, ${d.twelveStage})`
  ).join(' → ');

  const seWoonStr = seWoon.slice(0, 3).map(s =>
    `${s.year}년(${s.animal}): ${s.gan}${s.zhi}(${s.tenGod}, ${s.twelveStage})`
  ).join(', ');

  let focusRequest = "";
  switch (categoryId) {
    case 'today':
      focusRequest = `📌 분석 주제: **오늘의 운세**
- 오늘 날짜: ${new Date().toLocaleDateString('ko-KR')}
- 오늘의 일진과 사주 원국의 상호작용을 분석해주세요.`;
      break;
    case 'love':
      focusRequest = `📌 분석 주제: **애정운/연애운 상세 분석**
- 일주(${pillars.day.gan}${pillars.day.zhi})를 기반으로 타고난 연애 성향을 분석해주세요.`;
      break;
    case 'wealth':
      focusRequest = `📌 분석 주제: **재물운/금전운 상세 분석**
- 재성의 위치와 상태로 타고난 재복을 분석해주세요.`;
      break;
    default:
      focusRequest = `📌 분석 주제: **정통 사주 종합 풀이**
- 일주(${pillars.day.gan}${pillars.day.zhi})를 중심으로 성격과 기질을 깊이 분석해주세요.
- 타고난 재능과 적성 직업을 구체적으로 제안해주세요.`;
      break;
  }

  return `
═══════════════════════════════════════
          【 사주명리 분석 의뢰서 】
═══════════════════════════════════════

👤 기본 정보
- 성별: ${gender === 'male' ? '남성(건명)' : '여성(곤명)'}
- 생년월일시: ${solarDate} (양력)
- 음력: ${result.lunarDateSimple}

📜 사주 원국 (만세력)
${wonGukStr}

🔮 지장간 (숨은 기운)
${jiJangGanStr}

⚖️ 오행 분포
${elementStr}
- 가장 강한 오행: ${result.strongElement}
- 가장 약한 오행: ${result.weakElement}

💪 신강/신약 판정
${strengthStr}

🎯 용신/희신/기신
${yongSinStr}

✨ 신살 (神殺)
${sinSalStr}

🔄 합충형파해
${interactionStr}

📈 대운 흐름 (10년 주기)
대운 시작: ${result.daeWoonStartAge}세
${daeWoonStr}

📅 세운 (연운)
${seWoonStr}

═══════════════════════════════════════
${focusRequest}
═══════════════════════════════════════

📝 답변 형식 가이드:
1. **핵심 요약** (3-5줄)
2. **상세 분석**
3. **실천 조언**
`;
};

// 타로 관련 타입 및 함수
export type TarotElement = 'Fire' | 'Water' | 'Air' | 'Earth' | 'Spirit';

export const TAROT_TO_SAJU_ELEMENT: Record<TarotElement, string> = {
  'Fire': '화(火)',
  'Water': '수(水)',
  'Air': '목(木)',
  'Earth': '토(土)',
  'Spirit': '금(金)'
};

export interface TarotCardInfo {
  name: string;
  nameKr: string;
  element: TarotElement;
  isReversed: boolean;
  keywords: string[];
  meaning: string;
}

export const generateTarotPrompt = (
  card: TarotCardInfo,
  question?: string
): string => {
  const sajuElement = TAROT_TO_SAJU_ELEMENT[card.element];
  const cardDirection = card.isReversed ? '역방향' : '정방향';

  return `
역할: 타로와 동양 사주명리학을 통합한 신비로운 운세 마스터.

상황: 사용자가 "${card.name} (${card.nameKr})" 카드를 ${cardDirection}으로 뽑았습니다.

카드 정보:
- 이름: ${card.nameKr} (${card.name})
- 방향: ${cardDirection}
- 오행 속성: ${card.element} (사주 오행: ${sajuElement})
- 키워드: ${card.keywords.join(', ')}
- 의미: ${card.meaning}

${question ? `질문: ${question}\n` : ''}

요청:
1. 카드의 상징과 ${cardDirection} 의미를 신비롭게 설명해주세요.
2. 이 카드의 오행 속성(${sajuElement})이 가진 에너지와 연결하여 해석해주세요.
3. 현재 고민에 대한 따뜻한 조언을 해주세요.
4. 앞으로의 방향과 메시지를 전해주세요.

형식:
- 350자 내외로 작성
- 신비롭지만 따뜻한 말투 (~해요, ~이군요)
- 이모지 적절히 사용
`;
};

export const generateHybridSajuTarotPrompt = (
  sajuResult: SajuResult,
  tarotCard: TarotCardInfo,
  question?: string
): string => {
  const { pillars, elementPercent, isStrong, yongSinElement, yongSin } = sajuResult;
  const tarotSajuElement = TAROT_TO_SAJU_ELEMENT[tarotCard.element];
  const cardDirection = tarotCard.isReversed ? '역방향' : '정방향';

  return `
═══════════════════════════════════════
     【 사주 × 타로 하이브리드 운세 】
═══════════════════════════════════════

🎴 타로 카드 정보
카드: ${tarotCard.nameKr} (${tarotCard.name})
방향: ${cardDirection}
오행 속성: ${tarotCard.element} → ${tarotSajuElement}
키워드: ${tarotCard.keywords.join(', ')}

📜 사주 원국 요약
일주: ${pillars.day.gan}${pillars.day.zhi} (${pillars.day.ganElement}일간)
용신: ${yongSinElement} (${yongSin})
신강/신약: ${isStrong ? '신강' : '신약'}
오행 분포: 목(${elementPercent.목}%) 화(${elementPercent.화}%) 토(${elementPercent.토}%) 금(${elementPercent.금}%) 수(${elementPercent.수}%)

${question ? `❓ 질문: ${question}\n` : ''}

📌 해석 요청:
1. 타로와 사주의 시너지 분석
2. 통합 운세 메시지
3. 맞춤형 조언
4. 오행 보완 조언

📝 답변 형식:
- 신비롭지만 따뜻한 도사님 말투
- 400자 내외
- 이모지 사용
`;
};
