/**
 * GPT 프롬프트 최적화 버전
 * 엽전 크레딧 시스템에 맞춘 무료/유료 구분
 */

import { SajuResult, TEN_GODS_MAP } from '../utils/sajuCalculator';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../engine/gyeokguk';
import type { TarotCardInfo } from '../services/api';

/**
 * 십성 분포 계산 (프롬프트용)
 * - 천간(일간 제외) 1.0 가중치 + 지장간 0.5 가중치
 */
function computeSipseongCounts(result: SajuResult): Record<string, number> {
  const dayGan = result.dayMaster;
  const map = TEN_GODS_MAP[dayGan] || {};
  const order = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  const counts: Record<string, number> = {};
  order.forEach(s => { counts[s] = 0; });

  [result.pillars.year.gan, result.pillars.month.gan, result.pillars.hour.gan].forEach(gan => {
    const s = map[gan];
    if (s && counts[s] !== undefined) counts[s] += 1;
  });

  [result.pillars.year.hiddenStems, result.pillars.month.hiddenStems,
   result.pillars.day.hiddenStems, result.pillars.hour.hiddenStems].forEach(hidden => {
    hidden.forEach(gan => {
      const s = map[gan];
      if (s && counts[s] !== undefined) counts[s] += 0.5;
    });
  });

  Object.keys(counts).forEach(k => { counts[k] = Math.round(counts[k] * 2) / 2; });
  return counts;
}

function formatSipseongCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}${v}`)
    .join(' ');
}

/**
 * 시스템 프롬프트 (간결화)
 */
export const SYSTEM_PROMPT = `당신은 정통 사주명리 전문가입니다.
십성(十星), 격국(格局), 용신(用神) 같은 전문 용어는 그대로 사용하되,
괄호 안에 일상어로 쉽게 풀어주거나 해당 문단 끝에 2~3줄로 "쉽게 말하면…" 식의 설명을 덧붙이세요.
핵심만 간결하고 실용적으로 답변하며, 한국어로 작성하고 이모지는 최소화하세요.`;

/**
 * 무료 기본 해석 프롬프트 (0엽전)
 * - 만세력 + 간단한 종합 운세 (200-300자)
 */
export const generateBasicPrompt = (result: SajuResult): string => {
  const { pillars, elementPercent, isStrong, gender, yongSinElement, yongSin } = result;
  const gyeokguk = determineGyeokguk(result);
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));

  return `사주 원국:
년주: ${pillars.year.gan}${pillars.year.zhi}
월주: ${pillars.month.gan}${pillars.month.zhi}
일주: ${pillars.day.gan}${pillars.day.zhi}
시주: ${pillars.hour.gan}${pillars.hour.zhi}

오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
신강신약: ${isStrong ? '신강' : '신약'}
용신: ${yongSinElement}(${yongSin})
격국: ${gyeokguk.name}${gyeokguk.nameHanja ? `(${gyeokguk.nameHanja})` : ''}
십성 분포: ${sipseong}
성별: ${gender === 'male' ? '남성' : '여성'}

위 사주의 핵심 특성과 종합운을 250-350자로 요약하세요.
반드시 격국(${gyeokguk.name})의 본질과 용신(${yongSinElement})의 역할을 한 문장으로 간단히 언급하되,
전문 용어는 괄호나 다음 문장에서 쉬운 말로 풀어주세요.
형식: (1) 성격/격국 한줄, (2) 재물운, (3) 애정운, (4) 조언 — 각 1~2문장.`;
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

  const gyeokguk = determineGyeokguk(result);
  const gyeokgukStatus = analyzeGyeokgukStatus(result, gyeokguk);
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));

  return `사주 원국:
년: ${pillars.year.gan}${pillars.year.zhi} 월: ${pillars.month.gan}${pillars.month.zhi} 일: ${pillars.day.gan}${pillars.day.zhi} 시: ${pillars.hour.gan}${pillars.hour.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${isStrong ? '신강' : '신약'}, 용신: ${yongSinElement}(${yongSin})
격국: ${gyeokguk.name}${gyeokguk.nameHanja ? `(${gyeokguk.nameHanja})` : ''} — ${gyeokguk.type}
격국 성패: ${gyeokgukStatus.isSuccessful ? '성격(成格)' : '패격(敗格)'} — ${gyeokgukStatus.analysis}
십성 분포: ${sipseong}
성별: ${gender === 'male' ? '남성' : '여성'}

신살: ${sinSalStr}
합충형파해: ${interactionStr}

대운 흐름: ${daeWoonStr}
최근 세운: ${recentSeWoon}

위 정보를 바탕으로 아래 항목을 각 200-300자씩 분석하세요 (총 1700-2200자).
반드시 전문 용어(격국·용신·십성·상관견관 등)는 첫 등장 시 한 번은 괄호 속에 일상어로 풀어 쓰세요.
예: "정관격(바른 관직과 책임감의 사주)"

1. 종합운 - 타고난 성격과 삶의 방향 (격국 특성 반영)
2. 격국·용신 해설 - 왜 이 격국인지, 용신 ${yongSinElement}은 어떤 역할을 하는지 쉽게 설명
3. 재물운 - 재복과 경제적 능력 (재성의 강약 해석)
4. 애정운 - 연애와 결혼운 (관성/재성 관점)
5. 건강운 - 주의할 신체 부위
6. 직업운 - 격국 기반 적성과 커리어 조언
7. 현재 운세 - 대운/세운 기반 현황
8. 조언 - 용신을 활용하는 색·방향·시기 등 실천 가능한 조언

각 항목을 "### 제목" 형식으로 명확히 구분하여 작성하세요.`;
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
 * 자미두수 프롬프트 (3엽전)
 * - 12궁 + 14주성 + 명궁/신궁/오행국 + 사화 기반 종합 해석
 * - 불변 지식(주성/보좌성/사화/궁 의미)은 knowledge.ts에서 뽑아 주입
 *   AI는 "무슨 별이 무슨 뜻인지"를 창작하지 않고, 주입된 해설만 엮어 서술한다
 */
import type { ZamidusuResult } from '../engine/zamidusu';
import { collectKnowledge } from '../engine/zamidusu/knowledge';
export const generateZamidusuPrompt = (z: ZamidusuResult): string => {
  const palaceSummary = z.palaces.map((p) => {
    const majors = p.majorStars.map((s) => {
      const mut = s.mutagen ? `·${s.mutagen}` : '';
      const br = s.brightness ? `(${s.brightness})` : '';
      return `${s.name}${br}${mut}`;
    }).join(' ');
    const minors = p.minorStars.slice(0, 4).map((s) => s.name).join(' ');
    return `${p.name}[${p.heavenlyStem}${p.earthlyBranch}${p.isBodyPalace ? '·신궁' : ''}] 주성: ${majors || '(공궁)'}${minors ? ` 보조: ${minors}` : ''}`;
  }).join('\n');

  // 명반에 실제 등장한 별만 뽑아 해설 주입
  const knowledge = collectKnowledge(z);

  const majorDesc = knowledge.majorStars.map(({ palace, meta, mutagen }) => {
    const mut = mutagen ? ` [${mutagen.name}(${mutagen.hanja}): ${mutagen.effect} (+)${mutagen.positive} (-)${mutagen.caution}]` : '';
    return `- ${palace}의 ${meta.name}(${meta.hanja}): ${meta.theme} | 키워드: ${meta.keywords.join(', ')} | 강점: ${meta.strength} | 약점: ${meta.weakness}${mut}`;
  }).join('\n') || '(명반에 14주성 해설 데이터 없음)';

  const minorDesc = knowledge.minorStars.map(({ palace, meta }) => {
    return `- ${palace}의 ${meta.name}(${meta.hanja}) [${meta.category}]: ${meta.effect}`;
  }).join('\n') || '(보좌성 없음)';

  const palaceRoleDesc = knowledge.palaceRoles.map((r) => {
    return `- ${r.name}: ${r.domain} — ${r.focus}`;
  }).join('\n');

  return `자미두수 명반
성별: ${z.gender}
양력 생년월일: ${z.solarDate} ${z.timeRange}(${z.time})
음력: ${z.lunarDate}
간지: ${z.chineseDate}
띠: ${z.zodiac} / 별자리: ${z.sign}

명주(命主): ${z.soul}  |  신주(身主): ${z.body}  |  오행국: ${z.fiveElementsClass}
명궁 지지: ${z.soulBranch}  |  신궁 지지: ${z.bodyBranch}

[12궁 명반]
${palaceSummary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[불변 지식 — 반드시 아래 해설만 근거로 사용할 것]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▣ 14주성 해설 (이 명반에 실제 등장한 별)
${majorDesc}

▣ 보좌성 해설 (이 명반에 실제 등장한 별)
${minorDesc}

▣ 12궁 역할
${palaceRoleDesc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
1) 반드시 위에 제공된 별 해설과 궁 역할을 근거로만 풀이할 것.
2) 제공되지 않은 별·사화·해설을 창작하지 말 것 (예: 위 목록에 없는 별 이름을 꺼내지 말 것).
3) 각 별의 키워드·강점·약점·테마를 문장으로 자연스럽게 엮되, 원문 해설의 핵심 의미에서 이탈하지 말 것.
4) 사화(화록/화권/화과/화기)는 해당 별에 부여된 경우에만 언급, 없는 궁에 사화를 상상해 넣지 말 것.
5) 전문 용어는 첫 등장 시 괄호나 다음 문장에서 쉬운 말로 풀어쓸 것.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 규칙과 근거 해설을 바탕으로 아래 구조로 풀이하세요 (총 2000-2500자).

### 명반 개요 (4~5줄)
- 명주·신주·오행국의 의미를 한 문장씩 풀어 설명
- 명궁의 주성 조합으로 본 기본 성향

### 핵심 12궁 풀이 (각 2~3문장)
1. 명궁 - 기본 성향과 인생 방향
2. 부처궁 - 배우자/연애
3. 재백궁 - 재물 흐름
4. 관록궁 - 직업/사회적 성취
5. 전택궁 - 부동산·자산
6. 복덕궁 - 정신세계와 복
7. 부모궁 - 부모·윗사람 인연
8. 천이궁 - 이동·외부 활동

### 사화(四化) 분석
- 명반에 나타난 록(祿)·권(權)·과(科)·기(忌) 위치로 본 중요한 흐름
- 해당 궁이 인생에서 갖는 의미 (위 불변 지식의 사화 해설 범위 안에서만)

### 대한(大限) 흐름
- 10년 단위 대한의 주요 전환점 제시 (현재~이후 20~30년)

### 종합 조언
- 명반이 말하는 핵심 메시지 1문단
- 실천 가능한 조언 3가지

반드시 "###" 헤더를 그대로 유지하세요.`;
};

/**
 * 토정비결 프롬프트 (2엽전)
 * - 상/중/하 괘 메타 + 괘번호 기반 1년 총운 + 12개월 월운
 * - 144괘 테이블(gwae-table.ts)에서 결정론적 길흉등급·총평·월별키워드를 주입
 *   AI는 이 고정된 틀을 벗어난 길흉을 창작하지 않는다
 */
import type { TojeongResult } from '../engine/tojeong';
import { getGwaeEntry } from '../engine/tojeong/gwae-table';
export const generateTojeongPrompt = (tj: TojeongResult): string => {
  const { targetYear, age, upperGwae, middleGwae, lowerGwae, gwaeNumber, formula } = tj;
  const entry = getGwaeEntry(tj.upper, tj.middle, tj.lower);
  const monthlyList = entry.monthlyHints
    .map((kw, i) => `  · ${i + 1}월: ${kw}`)
    .join('\n');

  return `토정비결 풀이 요청
대상 해: ${targetYear}년 (${tj.yearGanZhi.ganZhi}년)
세는 나이: ${age}세
음력 생년월일: ${tj.birthLunar.year}년 ${tj.birthLunar.month}월 ${tj.birthLunar.day}일${tj.birthLunar.isLeap ? ' (윤달)' : ''}

계산된 괘: ${gwaeNumber} (상괘 ${tj.upper} · 중괘 ${tj.middle} · 하괘 ${tj.lower})

상괘 ${upperGwae.num} ${upperGwae.name}(${upperGwae.hanja}) ${upperGwae.symbol}
  · 상징: ${upperGwae.meaning}
  · 오행: ${upperGwae.element}
  · ${formula.upper}

중괘 ${middleGwae.num} ${middleGwae.position}
  · 의미: ${middleGwae.meaning}
  · ${formula.middle}

하괘 ${lowerGwae.num} ${lowerGwae.name}
  · 의미: ${lowerGwae.meaning}
  · ${formula.lower}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[확정된 길흉 — 반드시 아래 등급·키워드·총평의 범위 안에서 풀이]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▣ 괘 등급: ${entry.grade}
▣ 한줄 표제: ${entry.headline}
▣ 핵심 키워드: ${entry.keywords.join(', ')}
▣ 고정 총평(한 해의 틀):
${entry.summary}

▣ 12개월 기운 흐름 (월별 키워드 — 이 틀 안에서 확장)
${monthlyList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
1) 위에 확정된 등급(${entry.grade})과 총평의 방향성을 반드시 유지. 길흉을 임의로 바꾸지 말 것.
2) 월별 운은 위 12개 월별 키워드를 기반으로만 확장할 것. 해당 월의 톤을 뒤집지 말 것.
3) 제공된 상괘·중괘·하괘 의미에서 벗어난 상징을 새로 만들지 말 것.
4) 전통 토정 어법의 시(詩)적 개운 문구 1~2줄은 허용하나, 실제 길흉 판단은 위 등급을 벗어나지 말 것.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 정보를 바탕으로 ${targetYear}년 토정비결 풀이를 다음 구조로 작성하세요 (총 1800-2300자).

반드시 전통 토정비결 어법(예: "용이 여의주를 얻은 격", "나무에 꽃이 피는 상")으로 시(詩)적인 개운 문구 1~2줄을 먼저 제시한 뒤, 현대인도 이해하기 쉽게 풀어 설명하세요.

### 올해의 총운 (4~5줄)
- 상중하괘 조합의 상징을 엮어 한 해의 큰 흐름 제시 (등급: ${entry.grade})
- 핵심 메시지와 경계할 점

### 괘의 의미 (3~4줄)
- 왜 이 괘가 나왔는지 상징 해석
- 상괘(${upperGwae.name})·중괘(${middleGwae.position})·하괘(${lowerGwae.name})의 조화

### 월별 운세 (1월~12월, 각 월 2문장 — 위 월별 키워드에 충실)
- 정월: ...
- 2월: ...
- 3월: ...
- 4월: ...
- 5월: ...
- 6월: ...
- 7월: ...
- 8월: ...
- 9월: ...
- 10월: ...
- 11월: ...
- 12월: ...

### 분야별 운세
- 재물운 (2~3문장)
- 애정/가정운 (2~3문장)
- 건강운 (2~3문장)
- 직장/학업운 (2~3문장)

### 개운 조언
- 올해의 길한 방향, 색, 숫자, 시기
- 실천 가능한 구체 행동 2~3가지

반드시 "###" 헤더를 그대로 유지하세요.`;
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
