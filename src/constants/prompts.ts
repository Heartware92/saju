/**
 * GPT 프롬프트 최적화 버전
 * 엽전 크레딧 시스템에 맞춘 무료/유료 구분
 */

import { SajuResult, TEN_GODS_MAP, type SeWoon, type DaeWoon } from '../utils/sajuCalculator';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../engine/gyeokguk';
import { getDayPillarTraits } from './gapjaTraits';
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
 * 시스템 프롬프트 — 출력 포맷·톤·금지 규칙을 엄격하게 고정
 *
 * 중요: 프론트는 응답을 그대로 <pre> 로 렌더한다. 따라서 AI가 Markdown을 쓰면
 * 독자 눈에 그대로 "## ", "### ", "**" 같은 기호가 보여 AI 티가 폭발한다.
 * 다음 규칙은 모든 하위 프롬프트에 상속되므로 절대 어기지 말 것.
 */
export const SYSTEM_PROMPT = `당신은 정통 사주명리·자미두수·타로에 능통한 전문가입니다.
아래 출력 원칙을 절대 어기지 말고 모든 답변에 적용하세요.

[전문성과 쉬운 어투의 균형]
- 십성(十星)·격국(格局)·용신(用神)·대운·세운·화록·공망 같은 전문 용어는 그대로 사용합니다.
- 단, 첫 등장 시 괄호로 짧은 쉬운 말 풀이를 붙이거나("정관격(책임·질서를 중심에 둔 사주)") 문장 뒤에 "즉, ~" 식 한 줄 풀이를 덧붙여, 사주에 문외한인 독자도 막힘없이 읽게 합니다.
- 결론·조언은 반드시 **일상 속 구체 장면·시간대·행동**으로 내려앉혀야 합니다. 추상적 격언은 금지.

[출력 포맷 — 절대 규칙]
- Markdown 문법 절대 금지: #, ##, ###, ####, *, **, ***, \`, > 를 출력에 사용하지 마세요.
- 섹션 제목은 반드시 "1. 제목", "2. 제목" 식 **plain 한글 번호 + 마침표 + 공백 + 제목** 한 줄로 씁니다.
  예: "1. 사주 총론"   ("### 1. 사주 총론" 금지)
- 불릿은 "- " 또는 "· " 만 허용합니다. "* " "** " 금지.
- 강조가 필요하면 「」 〔〕 『』 같은 한글 괄호를 쓰세요. 별표·밑줄 금지.
- 이모지·이모티콘·특수 기호(✨🌙☀️🔮⭐️✓✔️→⇒⚠️🙏💫 등) 전부 금지. "결론:" 같은 평문 레이블만 사용합니다.
- AI임을 드러내는 문구("AI로서 분석해 보면", "제공된 데이터에 따르면") 금지.

[톤]
- "~합니다/~입니다" 체와 "~해요/~이에요" 체를 섞지 말고, 한 답변 안에서 한 쪽으로 통일하세요 (기본값: ~합니다 체).
- "운이 좋다/나쁘다" 같은 이분법 대신 "어떤 조건에서 어떤 결과가 유리/불리한지"로 쪼개어 서술합니다.
- "~일 수도 있습니다" "혹시" 같은 흐린 표현은 답변 전체에서 2회를 넘기지 마세요. 근거가 있으면 단정적으로 씁니다.

이 규칙은 이후 모든 섹션 지시보다 우선합니다.`;

/**
 * 무료 기본 해석 프롬프트 (0엽전)
 * - 만세력 + 간단한 종합 운세 (200-300자)
 */
export const generateBasicPrompt = (result: SajuResult): string => {
  const { pillars, elementPercent, isStrong, gender, yongSinElement, yongSin, hourUnknown } = result;
  const gyeokguk = determineGyeokguk(result);
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));

  // 시간 미상 시 시주 라인 제거 — 삼주추명(三柱推命) 규칙
  const hourLine = hourUnknown
    ? `시주: 미상 (삼주추명 · 三柱推命)`
    : `시주: ${pillars.hour.gan}${pillars.hour.zhi}`;

  const hourUnknownConstraint = hourUnknown
    ? `\n\n⚠️ 출생 시간 미상이므로 시주(時柱)를 제외한 삼주추명(三柱推命)으로 해석하세요.
- 자녀운·말년운·시간대별 상세 조언은 제외하거나 "시간 정보가 있으면 더 정확" 정도로만 간단히 언급할 것.
- 성격·재물운·애정운 등은 일주 중심 + 월주 보조로 충실히 해석할 것.`
    : '';

  return `사주 원국:
년주: ${pillars.year.gan}${pillars.year.zhi}
월주: ${pillars.month.gan}${pillars.month.zhi}
일주: ${pillars.day.gan}${pillars.day.zhi}
${hourLine}

오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
신강신약: ${isStrong ? '신강' : '신약'}
용신: ${yongSinElement}(${yongSin})
격국: ${gyeokguk.name}${gyeokguk.nameHanja ? `(${gyeokguk.nameHanja})` : ''}
십성 분포: ${sipseong}
성별: ${gender === 'male' ? '남성' : '여성'}${hourUnknownConstraint}

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

  // 대운: 각 칸에 간지·오행·십성·12운성·나이구간까지 실어 보냄 → AI가 실제 해석을 쓸 재료를 확보
  const daeWoonStr = daeWoon
    .filter(d => d.gan && d.zhi) // lunar-javascript의 첫 엔트리(pre-daewoon)는 빈값이라 제외
    .slice(0, 8)
    .map(d =>
      `${d.startAge}~${d.endAge}세 ${d.gan}${d.zhi}(${d.ganElement}${d.zhiElement}·${d.tenGod}·${d.twelveStage})`
    ).join(' | ');

  // 현재 대운(나이로 판정) — AI가 "지금 대운"을 놓치지 않도록 명시
  const ageNow = new Date().getFullYear() - new Date(result.solarDate).getFullYear();
  const currentDaeWoon = daeWoon.find(d => d.gan && d.zhi && ageNow >= d.startAge && ageNow <= d.endAge);
  const currentDaeWoonStr = currentDaeWoon
    ? `${currentDaeWoon.startAge}~${currentDaeWoon.endAge}세 ${currentDaeWoon.gan}${currentDaeWoon.zhi}(${currentDaeWoon.ganElement}${currentDaeWoon.zhiElement}·${currentDaeWoon.tenGod}·${currentDaeWoon.twelveStage})`
    : '아직 대운이 시작되지 않음';

  const currentYear = new Date().getFullYear();
  const recentSeWoon = seWoon
    .filter(s => s.year >= currentYear && s.year <= currentYear + 2)
    .map(s =>
      `${s.year}년 ${s.gan}${s.zhi}(${s.ganElement}${s.zhiElement}·${s.tenGod}·${s.twelveStage}·${s.animal}띠 해)`
    )
    .join(' | ');

  const gyeokguk = determineGyeokguk(result);
  const gyeokgukStatus = analyzeGyeokgukStatus(result, gyeokguk);
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));
  const hourUnknown = result.hourUnknown;

  // 시간 미상 시 시주 표기를 "미상"으로 대체 — 삼주추명(三柱推命)
  const pillarLine = hourUnknown
    ? `년: ${pillars.year.gan}${pillars.year.zhi} 월: ${pillars.month.gan}${pillars.month.zhi} 일: ${pillars.day.gan}${pillars.day.zhi} 시: 미상(三柱推命)`
    : `년: ${pillars.year.gan}${pillars.year.zhi} 월: ${pillars.month.gan}${pillars.month.zhi} 일: ${pillars.day.gan}${pillars.day.zhi} 시: ${pillars.hour.gan}${pillars.hour.zhi}`;

  const hourUnknownConstraint = hourUnknown
    ? `\n⚠️ 출생 시간 미상 — 삼주추명(三柱推命) 원칙 적용:
- 시주(時柱)가 없으므로 "자녀궁(子女宮)" 자체를 기준으로 한 자녀운 상세 예측은 제외할 것.
- 말년운(노년기 시주 영향), 하루 시간대별 조언은 제외하거나 "시주 정보 필요" 수준으로만 짧게 안내할 것.
- 대신 연·월·일주 + 대운으로 본 인생 전반의 흐름, 성격, 재물, 애정, 직업, 건강은 충실히 해석할 것.
- 시주 미상이 분석의 치명적 결함은 아님을 독자에게 담백하게 상기시키되, 과도한 사족은 달지 말 것.`
    : '';

  return `사주 원국:
${pillarLine}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${isStrong ? '신강' : '신약'}, 용신: ${yongSinElement}(${yongSin})
격국: ${gyeokguk.name}${gyeokguk.nameHanja ? `(${gyeokguk.nameHanja})` : ''} — ${gyeokguk.type}
격국 성패: ${gyeokgukStatus.isSuccessful ? '성격(成格)' : '패격(敗格)'} — ${gyeokgukStatus.analysis}
십성 분포: ${sipseong}
성별: ${gender === 'male' ? '남성' : '여성'}

신살: ${sinSalStr}
합충형파해: ${interactionStr}

현재 나이(계산): ${ageNow}세
현재 대운: ${currentDaeWoonStr}
대운 전체 흐름 (10년 단위, 최대 8개): ${daeWoonStr}
최근·향후 세운(연운, 올해 포함 3년): ${recentSeWoon}${hourUnknownConstraint}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 반드시 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 분량: 2800~3500자. 각 섹션 분량 명시대로 맞출 것.
2) 섹션 헤더(###)는 아래 11개를 **순서·표기 그대로** 유지할 것. 새 섹션을 만들거나 순서를 바꾸지 말 것.
3) 전문 용어(격국·용신·십성·상관견관·신살 등)는 첫 등장 시 괄호 속에 일상어로 풀어쓸 것.
   예: "정관격(바른 관직·책임감의 사주)", "식상(말·표현·자녀의 기운)".
4) 위에 주어진 confirmed facts(격국·용신·신강약·오행%·십성분포·신살·합충·대운·세운)를
   **부정하거나 뒤바꾸지 말 것**. 해석은 허용, 숫자·판정 변경은 금지.
5) "~일 수도 있습니다" "혹시" 같은 흐린 표현은 최소화. 전문가의 단정 + 근거를 붙일 것.
6) 이모지 금지. 불릿 사용은 5번/8번 섹션에 한함.
7) 마지막 섹션은 반드시 긍정적 행동 처방으로 마무리.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[출력 스키마 — 이 순서·제목 그대로]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1. 사주 총론 (280~350자)
- 격국(${gyeokguk.name})의 본질 + 성패 판정이 삶 전반에 어떤 기조를 만드는지
- 일간 ${pillars.day.gan}(${pillars.day.ganElement})의 성향과 월지 뿌리 여부

### 2. 격국·용신 해설 (280~350자)
- 왜 ${gyeokguk.name}인지: 월지·투간·세력으로 설명
- 용신 ${yongSinElement}(${yongSin})이 사주에서 해야 할 역할 + 희신·기신의 보조 논리

### 3. 성격·기질 (250~320자)
- 일간 + 격국 + 주요 십성(십성분포 상위 2개 활용)으로 본 타고난 성향
- 강점과 그림자 각각 2가지 이상

### 4. 직업·적성 (280~350자)
- 격국 기반 적합 직군 3~4개 + 피해야 할 직군 1~2개
- 조직형 vs 프리랜서형 판단, 용신 오행과 어울리는 업계 키워드

### 5. 재물운 (260~330자) — 불릿 허용
- 재성(편재·정재)의 강약과 재고(財庫) 유무로 돈버는 스타일 분석
- 월급형 / 사업형 / 투자형 중 어디가 유리한지 근거 제시
- "피해야 할 돈 함정" 1가지

### 6. 애정·결혼 (260~330자)
- 관성(남자는 자식·사회·여자는 배우자)·재성(남자는 배우자) 축으로 본 관계 패턴
- 이상형 톤 + 결혼 시기의 유리한 대운 구간(대운표에서 해당 구간 명시)
- 갈등이 생길 때 반복되는 패턴 1개

### 7. 건강운 (200~260자)
- 약한 오행·충을 받은 오행 기준 취약 장부(간담·심소장·비위·폐대장·신방광)
- 일상에서 챙겨야 할 식습관·수면 패턴

### 8. 인간관계·사회운 (220~280자) — 불릿 허용
- 비겁·식상·관성 배치로 본 인맥 형성 스타일
- 의지할 만한 사람 유형 1 + 거리를 둬야 할 유형 1

### 9. 대운 흐름 해설 (420~520자)
- 주어진 **현재 대운**(${currentDaeWoonStr})을 먼저 지목하고, 그 간지·오행·십성·12운성이 지금 이 나이대의 일·관계·재물에 어떻게 작용하는지 3~4문장으로 단정적으로 서술
- 이어서 대운 전체 흐름에서 **이전 대운·다음 대운 각 1개**를 구체 나이로 꼽아 "과거에서 이월된 숙제" + "다음 10년의 관문"을 각각 2~3문장으로
- 인생의 변곡점이 될 전환 대운 1개를 "몇 살 ~ 몇 살 구간에 어떤 방향으로 틀어지는가"로 구체 명시
- 용신(${yongSinElement}) 기준으로 유리한 대운과 조심할 대운을 각 1개씩 찍어줄 것

### 10. 올해·내년 세운 포커스 (300~380자)
- 주어진 세운 목록 각 연도의 간지·십성·12운성을 근거로 "올해 / 내년 / 내후년" 각각 3~4문장씩 구체 과제·기회·주의 서술
- 포맷 예: "올해(202X년 XX): 십성 XX가 들어오면서 일간이 XX되는 구간. 구체적으로 어떤 국면이 열린다 — 어떤 행동이 유리/불리"
- 세 해 모두 같은 길이로 균형있게 — 한 해만 길게 쓰지 말 것

### 11. 용신 실천 처방 (220~280자) — 불릿 허용
- 용신 ${yongSinElement}을 보강하는 색(2개), 방향(1개), 숫자(1개), 시간대, 계절, 식재료, 직업 환경
- 구체적 행동 3가지(이번 달 안에 실천 가능한 것)로 마무리

반드시 "### 1. ~ ### 11." 헤더 포맷을 그대로 유지하세요.`;
};

// ── 오늘의 운세 섹션 정의 ──────────────────────────────────
export const TODAY_SECTION_KEYS = [
  'today_energy', 'today_work', 'today_love', 'today_caution', 'today_lucky'
] as const;
export type TodaySectionKey = typeof TODAY_SECTION_KEYS[number];

export const TODAY_SECTION_LABELS: Record<TodaySectionKey, string> = {
  today_energy:   '오늘의 기운',
  today_work:     '일·활동',
  today_love:     '관계·소통',
  today_caution:  '주의할 점',
  today_lucky:    '행운 처방',
};

export interface TodayGanZhi {
  gan: string;
  zhi: string;
  hanja: string;          // e.g. "甲子"
  ganElement: string;
  zhiElement: string;
  tenGodGan: string;      // 일진 천간이 내 일간에 대해 갖는 십성
  tenGodZhi: string;      // 일진 지지 주기신(主氣神)이 내 일간에 대해 갖는 십성
  interactions: string[]; // 일진과 원국 간 합충형파 목록 (짧은 문자열)
}

/**
 * 오늘의 운세 프롬프트 v2
 * - 오늘 일진(日辰) 간지를 핵심 인풋으로 사용
 * - 가볍고 읽기 쉬운 5섹션 [key] 구분자 출력
 */
export const generateTodayFortunePrompt = (
  result: SajuResult,
  todayGz: TodayGanZhi,
  isoDate: string,   // "2026-04-18"
): string => {
  const { pillars, elementPercent, yongSinElement, isStrong, daeWoon } = result;

  // 결핍 오행
  const zeroEls = (Object.entries(elementPercent) as [string, number][])
    .filter(([, v]) => v === 0).map(([k]) => k);
  const missingEl = zeroEls.length > 0 ? `결핍: ${zeroEls.join('·')}` : '';

  // 현재 대운
  const ageNow = new Date().getFullYear() - new Date(result.solarDate).getFullYear();
  const curDW = daeWoon.find(d => d.gan && d.zhi && ageNow >= d.startAge && ageNow <= d.endAge);
  const daeWoonStr = curDW
    ? `${curDW.gan}${curDW.zhi}(${curDW.ganElement}${curDW.zhiElement}·${curDW.tenGod}·${curDW.twelveStage})`
    : '없음';

  const seWoon = result.currentSeWoon;
  const interStr = todayGz.interactions.length > 0 ? todayGz.interactions.join(' / ') : '없음';

  const dateLabel = (() => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  })();

  return `[내 원국]
일간: ${pillars.day.gan}(${pillars.day.ganElement}) / 일주: ${pillars.day.gan}${pillars.day.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}% ${missingEl}
용신: ${yongSinElement} / ${isStrong ? '신강' : '신약'}
현재 대운: ${daeWoonStr}
올해 세운: ${seWoon.gan}${seWoon.zhi}(${seWoon.ganElement}${seWoon.zhiElement}·${seWoon.tenGod})

[오늘 일진 — 핵심 인풋]
날짜: ${dateLabel}
일진: ${todayGz.gan}${todayGz.zhi}(${todayGz.hanja}) — ${todayGz.ganElement}·${todayGz.zhiElement}
일진 천간의 십성: ${todayGz.tenGodGan} / 일진 지지의 십성: ${todayGz.tenGodZhi}
일진×원국 합충: ${interStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 절대 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) Markdown 절대 금지. 이모지 전부 금지.
2) 각 섹션 분량 지침 준수. 총 550~700자.
3) 오늘 하루에만 적용되는 구체 조언. "장기적으로는~" 일반론 금지.
4) 일진 십성·합충이 주는 영향을 근거로 제시. 근거 없는 단순 격려 금지.
5) 금지 표현: "운이 좋은 날" "모든 일이 잘 풀립니다" "대형 사고" — 구체 상황+이유로 대체.
6) 출력은 [today_energy] 마커부터 시작. 마커 이전 텍스트 없어야 함.
7) 아래 5개 마커를 정확히 사용. 마커는 줄 처음에 단독으로 위치.

[today_energy] — 70~100자
오늘 일진(${todayGz.gan}${todayGz.zhi})이 내 일간(${pillars.day.gan})에 미치는 십성(${todayGz.tenGodGan}) 에너지로 오늘 하루의 기운을 단정적으로 한 문단. 어떤 상황에서 유리/불리한지 핵심 1개 포함.

[today_work] — 140~180자
일진 기운을 바탕으로 집중이 잘 되는 업무 유형과 막히는 유형을 구체적으로. 오늘 하면 좋은 행동 1개(회의·기획·제출·연락 등)와 피해야 할 행동 1개.

[today_love] — 120~160자
오늘 잘 통하는 관계 유형(일진 십성 기준). 조심할 말투나 상황 1가지. 연인·가족·동료 중 관계가 부드러워지는 유형 1개 짧게.

[today_caution] — 100~130자
오늘 사주 배치상(일진×원국 합충: ${interStr}) 실수 유발 상황 1가지. 시간대·감정·환경 중 1개로 구체화. 대처 방법 1문장.

[today_lucky] — 80~100자
용신(${yongSinElement}) 기운을 채우는 오늘의 행운 요소를 짧게: 색 1개, 시간대 1구간, 숫자 1개, 식재료 또는 음식 1개.

출력은 [today_energy] 마커부터 시작. 마커 이전 텍스트 없어야 함.`;
};

/**
 * 정통사주 종합 리포트 프롬프트
 * - 원국 전체 분석: 격국·용신·성격·직업·재물·애정·건강·인간관계·대운·처방
 * - 9개 섹션, [key] 구분자 출력
 */
export const JUNGTONGSAJU_SECTION_KEYS = [
  'general', 'daymaster', 'element', 'character', 'career', 'wealth', 'love', 'health', 'relation', 'luck', 'advice'
] as const;
export type JungtongsajuSectionKey = typeof JUNGTONGSAJU_SECTION_KEYS[number];

export const JUNGTONGSAJU_SECTION_LABELS: Record<JungtongsajuSectionKey, string> = {
  general:   '사주 총론',
  daymaster: '일주 해석',
  element:   '오행 분포',
  character: '성격·기질',
  career:    '직업·적성',
  wealth:    '재물운',
  love:      '애정·결혼운',
  health:    '건강운',
  relation:  '인간관계·가족',
  luck:      '대운·세운 흐름',
  advice:    '용신 처방',
};

export const generateJungtongsajuPrompt = (result: SajuResult): string => {
  const { pillars, elementPercent, isStrong, yongSinElement, yongSin, sinSals, interactions, daeWoon, seWoon, gender, hourUnknown } = result;
  const gyeokguk = determineGyeokguk(result);
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));

  // ── 60갑자 일주 특성 (DB 조회)
  const dayTraits = getDayPillarTraits(pillars.day.gan, pillars.day.zhi);
  const dayTraitsBlock = dayTraits
    ? `[일주 60갑자 특성 — DB 조회값, 검증된 데이터]
일주: ${dayTraits.name}(${dayTraits.hanja})
키워드: ${dayTraits.keywords.join(', ')}
특성: ${dayTraits.traits}
특수신살: ${dayTraits.sinsal.length > 0 ? dayTraits.sinsal.join(', ') : '없음'}`
    : '';

  // ── 기둥별 상세 (12운성·지장간·12신살·공망)
  const formatPillar = (label: string, p: typeof pillars.year, isMissing = false) => {
    if (isMissing) return `${label}: 미상(삼주추명)`;
    const kong = p.isKongmang ? '·공망' : '';
    const hidden = p.hiddenStems.length > 0 ? `지장간(${p.hiddenStems.join(',')})` : '';
    const sinsal12 = p.sinSal12 ? `12신살(${p.sinSal12})` : '';
    const parts = [
      `${p.gan}(${p.ganElement}·${p.tenGodGan})`,
      `${p.zhi}(${p.zhiElement}·${p.tenGodZhi})`,
      `12운성(${p.twelveStage})${kong}`,
      hidden,
      sinsal12,
    ].filter(Boolean);
    return `${label}: ${parts.join(' / ')}`;
  };

  const pillarDetailBlock = [
    formatPillar('년주', pillars.year),
    formatPillar('월주', pillars.month),
    formatPillar('일주', pillars.day),
    hourUnknown ? formatPillar('시주', pillars.hour, true) : formatPillar('시주', pillars.hour),
  ].join('\n');

  // ── 신강신약 5단계 + 득령득지득세
  const strengthBlock = `신강신약: ${result.strengthStatus}(점수 ${result.strengthScore}) — 득령(${result.deukRyeong ? 'O' : 'X'}) 득지(${result.deukJi ? 'O' : 'X'}) 득세(${result.deukSe ? 'O' : 'X'})`;

  // ── 오행 부족·과다 분석
  const elementEntries = Object.entries(elementPercent) as [string, number][];
  const zeroElements = elementEntries.filter(([, v]) => v === 0).map(([k]) => k);
  const maxEl = elementEntries.reduce((a, b) => a[1] > b[1] ? a : b);
  const elementNoteBlock = [
    zeroElements.length > 0 ? `결핍 오행: ${zeroElements.join('·')}` : '결핍 오행: 없음',
    `과다 오행: ${maxEl[0]}(${maxEl[1]}%)`,
  ].join(' / ');

  const sinSalStr = sinSals.length > 0 ? sinSals.map(s => `${s.name}(${s.type === 'good' ? '길' : s.type === 'bad' ? '흉' : '중'})`).join(' ') : '없음';
  const interactionStr = interactions.length > 0 ? interactions.map(i => `${i.type}: ${i.description}`).join(' / ') : '없음';

  const daeWoonStr = daeWoon
    .filter(d => d.gan && d.zhi)
    .slice(0, 8)
    .map(d => `${d.startAge}~${d.endAge}세 ${d.gan}${d.zhi}(${d.ganElement}${d.zhiElement}·${d.tenGod}·${d.twelveStage})`)
    .join(' | ');

  const ageNow = new Date().getFullYear() - new Date(result.solarDate).getFullYear();
  const currentDaeWoon = daeWoon.find(d => d.gan && d.zhi && ageNow >= d.startAge && ageNow <= d.endAge);
  const currentDaeWoonStr = currentDaeWoon
    ? `${currentDaeWoon.startAge}~${currentDaeWoon.endAge}세 ${currentDaeWoon.gan}${currentDaeWoon.zhi}(${currentDaeWoon.ganElement}${currentDaeWoon.zhiElement}·${currentDaeWoon.tenGod}·${currentDaeWoon.twelveStage})`
    : '대운 시작 전';

  const currentYear = new Date().getFullYear();
  const recentSeWoon = seWoon
    .filter(s => s.year >= currentYear && s.year <= currentYear + 2)
    .map(s => `${s.year}년 ${s.gan}${s.zhi}(${s.ganElement}${s.zhiElement}·${s.tenGod}·${s.twelveStage})`)
    .join(' | ');

  const hourNote = hourUnknown
    ? '\n출생 시간 미상 — 삼주추명 원칙: 자녀궁·말년·시간대별 상세는 간략히만 처리.'
    : '';

  return `[사주 원국 — 기둥별 상세]
${pillarDetailBlock}

일간: ${pillars.day.gan}(${pillars.day.ganElement}·${result.dayMasterYinYang})
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${elementNoteBlock}
${strengthBlock}
용신: ${yongSinElement}(${yongSin})  희신: ${result.heeSin}  기신: ${result.giSin}
격국: ${gyeokguk.name}
십성 분포: ${sipseong}
신살·길성: ${sinSalStr}
합충형파해: ${interactionStr}
성별: ${gender === 'male' ? '남성' : '여성'}
현재 나이(계산): ${ageNow}세
현재 대운: ${currentDaeWoonStr}
대운 전체(최대 8개): ${daeWoonStr}
최근·향후 세운(3년): ${recentSeWoon}${hourNote}

${dayTraitsBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 절대 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) Markdown 절대 금지. 별표(**), 헤딩(#), 이모지 전부 금지.
2) 불릿은 "- " 또는 "· " 형식만 허용.
3) AI 자기소개 문구("분석 결과", "데이터에 따르면") 금지.
4) 위에 주어진 모든 수치(격국·용신·신강약·오행%·십성·신살·합충·대운·세운·12운성·지장간)를 뒤집거나 임의 변경 금지.
5) 전문 용어 첫 등장 시 괄호로 쉬운 말 병기.
6) "~일 수 있습니다" 흐린 표현은 전체 답변에서 2회 이하. 단정적 어투 유지.
7) 각 섹션 첫 문장에서 결론 먼저, 근거를 이어붙이는 방식.
8) 출력은 [general] 마커부터 시작. 마커 이전 텍스트 없어야 함.
9) 아래 11개 마커를 정확히 사용. 마커는 줄 처음에 단독으로 위치.

[섹션 지침]

[general] — 280~360자
격국(${gyeokguk.name})의 본질 + 용신(${yongSinElement}) 역할 + ${result.strengthStatus}(신강신약)이 삶 전반에 만드는 기조. 오행 분포의 가장 두드러진 특징(결핍/과다) 1개 포함.

[daymaster] — 260~340자
일주 ${pillars.day.gan}${pillars.day.zhi}(${dayTraits?.hanja ?? ''})의 60갑자 특성 해석. DB에 주어진 키워드와 특성을 바탕으로 이 일주가 삶에서 만들어내는 고유한 에너지와 패턴을 서술. 특수신살이 있다면 그 의미를 일상 언어로 풀어서 1~2문장 추가.

[element] — 240~300자
오행 분포(목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%) 분석. 결핍 오행이 야기하는 구체적 생활 패턴 약점 2가지. 과다 오행이 만드는 강점 1가지. 결핍 오행을 일상에서 보완하는 방법 1가지 실용 제안.

[character] — 300~380자
일간 ${pillars.day.gan}(${pillars.day.ganElement}) + 격국 + 십성 분포 상위 2개로 본 타고난 성향. 강점 2가지와 그림자(약점) 2가지를 균형 있게 서술.

[career] — 280~350자
격국 기반 적합 직군 3~4개. 피해야 할 직군 1~2개. 조직형·프리랜서 판단. 용신 오행과 연관된 업계 키워드.

[wealth] — 260~330자
재성(편재·정재) 강약 + 일지 재성 여부로 본 돈 버는 스타일. 월급형·사업형·투자형 중 근거 포함해 판단. 피해야 할 금전 함정 1가지.

[love] — 260~330자
관성(여성의 배우자)·재성(남성의 배우자) 기준으로 이상형 톤과 관계 패턴. 일주 12운성이 배우자궁에 미치는 영향. 유리한 대운 구간 명시. 반복되는 갈등 패턴 1개.

[health] — 200~260자
약한 오행·충을 받은 오행 기준 취약 장부. 일상 챙겨야 할 습관 2가지. 이 사주의 건강 함정 1가지.

[relation] — 240~300자
비겁·식상·관성 배치로 본 인맥 형성 스타일. 부모·형제·자녀 관계의 특성 간략히. 의지할 사람 유형 1개·거리 둘 유형 1개.

[luck] — 380~460자
현재 대운(${currentDaeWoonStr})의 십성·오행·12운성이 지금 이 나이대에 어떻게 작용하는지 3~4문장. 전환 대운 1개를 "몇 살~몇 살 구간에 어떤 방향" 으로 명시. 최근 세운 각 연도 3~4문장씩 구체 서술.

[advice] — 200~260자
용신(${yongSinElement}) 보강 방법: 색(2개)·방향(1개)·숫자(1개)·시간대·계절·식재료. 이번 달 안에 실천 가능한 구체 행동 3가지를 불릿(- )으로.

출력은 [general] 마커부터 시작. 마커 이전 텍스트 없어야 함.`;
};

/**
 * 기간 운세 영역별 상세 (신년/오늘/지정일 공통)
 * - 사주 원국 + 대상 기간 간지 + 엔진이 계산한 도메인 점수를 프롬프트에 주입
 * - 5개 영역(재물·직업·애정·건강·학업)에 대해 각 5문장 분석 생성
 * - 응답은 [key] 델리미터로 구분되어 프론트에서 파싱
 */
export interface PeriodDomainBrief {
  key: 'wealth' | 'career' | 'love' | 'health' | 'study';
  label: string;
  score: number;
  grade: string;
}

export const generatePeriodDomainsPrompt = (
  result: SajuResult,
  opts: {
    scopeLabel: string;       // "2026년 신년운세" / "오늘(2026-04-16)" / "2026-05-03 지정일"
    targetGanZhi: string;     // "을사" / "경오" 등
    overallHeadline: string;  // 엔진이 만든 한줄 총평
    domains: PeriodDomainBrief[];
  }
): string => {
  const { pillars, elementPercent, yongSinElement, isStrong } = result;
  const domainList = opts.domains
    .map(d => `- ${d.label}(${d.key}): ${d.score}점 · ${d.grade}`)
    .join('\n');

  return `[내 사주 원국]
일주: ${pillars.day.gan}${pillars.day.zhi} (${pillars.day.ganElement}일간)
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
${isStrong ? '신강' : '신약'} · 용신: ${yongSinElement}

[분석 대상]
기간: ${opts.scopeLabel}
간지: ${opts.targetGanZhi}
총평: ${opts.overallHeadline}

[엔진이 산출한 영역별 점수]
${domainList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 위 5개 영역 각각에 대해 정확히 5문장 설명을 작성합니다.
2) 각 영역 설명은 다음 구조로:
   - 1문장: 현재 기운이 어떤 자리에 놓였는지(간지·용신·십성 근거)
   - 2문장: 이 기운이 해당 영역에서 구체적으로 어떻게 드러나는지
   - 3문장: 유리한 조건(시간대/상대/행동 중 하나 이상 명시)
   - 4문장: 조심할 함정 (구체적 상황/실수)
   - 5문장: 실천 가능한 구체 행동 하나
3) 점수가 높으면 낙관, 낮으면 비관으로 단순화하지 말고, 어떤 조건에서 유리/불리한지로 쪼개 서술합니다.
4) 일상 장면으로 내려앉혀 서술 (회의·연락·구매·식사·운동 등). 추상적 격언 금지.
5) 출력 형식은 반드시 아래 델리미터를 사용합니다. 다른 머리말·설명·요약 금지.

[wealth]
(재물 5문장)

[career]
(직업 5문장)

[love]
(애정 5문장)

[health]
(건강 5문장)

[study]
(학업 5문장)`;
};

/**
 * 신년운세 종합 리포트 프롬프트
 * - 원국 + 세운 + 대운 + 월별흐름 + 도메인 점수를 통합해 8개 섹션 내러티브 생성
 * - AI 티 없는 자연스러운 한국어 서술, 마크다운·이모지 금지
 */

export const NEWYEAR_SECTION_KEYS = ['general', 'wealth', 'career', 'love', 'health', 'relation', 'monthly', 'lucky'] as const;
export type NewyearSectionKey = typeof NEWYEAR_SECTION_KEYS[number];

export const NEWYEAR_SECTION_LABELS: Record<NewyearSectionKey, string> = {
  general: '총운',
  wealth: '재물운',
  career: '직장·사업운',
  love: '연애·결혼운',
  health: '건강운',
  relation: '인간관계운',
  monthly: '월별 흐름',
  lucky: '행운 포인트',
};

export const generateNewyearReportPrompt = (
  result: SajuResult,
  opts: {
    year: number;
    seWoon: SeWoon;
    currentDaeWoon: DaeWoon | null;
    monthlyFlow: { month: number; grade: string; keyword: string }[];
    domains: { key: string; label: string; score: number; grade: string }[];
    overallScore: number;
    overallGrade: string;
  }
): string => {
  const { pillars, elementPercent, isStrong, yongSinElement, yongSin, hourUnknown, gender, dayMasterYinYang } = result;
  const { year, seWoon, currentDaeWoon, monthlyFlow, domains, overallScore, overallGrade } = opts;
  const gyeokguk = determineGyeokguk(result);
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));

  const pillarLine = hourUnknown
    ? `년주: ${pillars.year.gan}${pillars.year.zhi}  월주: ${pillars.month.gan}${pillars.month.zhi}  일주: ${pillars.day.gan}${pillars.day.zhi}  시주: 미상`
    : `년주: ${pillars.year.gan}${pillars.year.zhi}  월주: ${pillars.month.gan}${pillars.month.zhi}  일주: ${pillars.day.gan}${pillars.day.zhi}  시주: ${pillars.hour.gan}${pillars.hour.zhi}`;

  const daeWoonLine = currentDaeWoon
    ? `${currentDaeWoon.startAge}~${currentDaeWoon.endAge}세  ${currentDaeWoon.gan}${currentDaeWoon.zhi}(${currentDaeWoon.ganElement}·${currentDaeWoon.zhiElement})  십성: ${currentDaeWoon.tenGod}  12운성: ${currentDaeWoon.twelveStage}`
    : '아직 대운 시작 전';

  const monthlyLine = monthlyFlow
    .map(m => `${m.month}월: ${m.grade}(${m.keyword})`)
    .join(' / ');

  const domainLine = domains
    .filter(d => d.key !== 'overall')
    .map(d => `${d.label} ${d.score}점·${d.grade}`)
    .join(' / ');

  const wealthDomain = domains.find(d => d.key === 'wealth');
  const hourNote = hourUnknown
    ? '\n출생 시간 미상 — 시주(時柱) 관련 자녀운·말년운·시간대 해석은 간략히 처리.'
    : '';

  return `[내 사주 원국]
${pillarLine}
일간: ${pillars.day.gan}(${pillars.day.ganElement} · ${dayMasterYinYang})
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
신강신약: ${isStrong ? '신강' : '신약'}
용신: ${yongSinElement}(${yongSin})  희신: ${result.heeSin}  기신: ${result.giSin}
격국: ${gyeokguk.name}
십성 분포: ${sipseong}
성별: ${gender === 'male' ? '남성' : '여성'}${hourNote}

[${year}년 세운 — ${seWoon.gan}${seWoon.zhi}(${seWoon.animal}년)]
세운 천간: ${seWoon.gan}(${seWoon.ganElement}) — 일간 ${pillars.day.gan} 기준 십성: ${seWoon.tenGod}
세운 지지: ${seWoon.zhi}(${seWoon.zhiElement})
세운 12운성: ${seWoon.twelveStage}

[현재 대운]
${daeWoonLine}

[엔진 계산 점수 — 이 방향성 유지 필수]
총운: ${overallScore}점·${overallGrade}
${domainLine}

[${year}년 월별 흐름]
${monthlyLine}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 절대 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) Markdown 절대 금지. 별표(**), 헤딩(#), 이모지 전부 금지.
2) 불릿은 "- " 또는 "· " 형식만 허용.
3) AI임을 드러내는 문구("분석 결과", "데이터에 따르면", "제가 보기에") 금지.
4) 위 엔진 점수의 길흉 방향성을 뒤집지 말 것. 해석은 허용, 등급 변경은 금지.
5) 각 섹션 첫 문장에서 결론을 먼저 말하고 근거를 이어붙이는 방식.
6) 전문 용어(십성·격국·용신·대운 등)는 첫 등장 시 괄호로 쉬운 말 병기.
7) "~일 수 있습니다" "혹시" 같은 흐린 표현은 전체 답변에서 2회 이하. 단정적 어투 유지.
8) 출력은 [general] 마커부터 시작. 마커 이전에 어떤 텍스트도 없어야 함.
9) 아래 8개 마커를 정확히 사용. 마커는 줄 처음에 단독으로 위치. 마커 뒤 바로 내용 시작.

[섹션별 지침]

[general]
${year}년 전체 기조 — 300~400자
세운 ${seWoon.gan}${seWoon.zhi}이 일간 ${pillars.day.gan}에 어떤 십성(${seWoon.tenGod})으로 작용하는지, 대운과 겹쳐 어떤 국면이 열리는지 1단락. 이 해에 특히 어떤 축(재물·직장·관계·건강)이 도드라지는가를 2단락으로.

[wealth]
재물운 — 250~330자
세운 십신(${seWoon.tenGod})과 용신(${yongSinElement})의 관계로 수입·지출 방향 풀이. 조심할 금전 결정 한 가지. 엔진 점수 ${wealthDomain?.score ?? '?'}점(${wealthDomain?.grade ?? '?'}) 방향성 유지.

[career]
직장·사업운 — 250~330자
직장인·사업자에게 공통으로 해당되는 커리어 기운. 세운과 원국의 관성·재성 관계로 승진·계약·파트너십 기운 풀이. 결정 내리기 좋은 시기 명시.

[love]
연애·결혼운 — 250~330자
관성·재성 기준으로 인연·관계 기운 풀이. 이 해 가장 좋은 인연 시기를 월별 흐름 참고해 명시. 관계 갈등 패턴과 해소 방향.

[health]
건강운 — 200~270자
오행 분포와 세운 오행으로 취약 장부 판단. 일상에서 챙겨야 할 구체 습관 2가지. "이 해의 건강 함정" 한 가지.

[relation]
인간관계운 — 200~270자
비겁·식상·관성 배치로 본 ${year}년 인간관계 기운. 의지할 관계 유형 한 가지. 멀리해야 할 관계 유형 한 가지.

[monthly]
월별 흐름 — 총 400~500자, 각 월 2~3문장
1월부터 12월까지 순서대로. 위 월별 등급·키워드를 근거로 각 월의 핵심 기운 서술.
포맷 예시: "1월(중길·축적): 새해 시작은..."

[lucky]
행운 포인트 — 150~200자
용신(${yongSinElement}) 기준 불릿(- ) 형식으로:
- 행운색 2가지
- 행운 방위 1가지
- 행운 숫자 2개
- 에너지 가장 좋은 시간대
- ${year}년에 어울리는 환경·공간 키워드

출력은 [general] 마커부터 시작. 마커 이전에 어떤 텍스트도 없어야 함.`;
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

위 규칙과 근거 해설을 바탕으로 아래 구조로 풀이하세요 (총 3200~4000자).

### 명반 개요 (260~320자)
- 명주(命主)·신주(身主)·오행국의 의미를 한 문장씩 풀어 설명
- 명궁의 주성 조합으로 본 기본 성향 — 키워드 3개로 요약
- 신궁이 명궁과 같은 위치인지, 다른 궁인지에 따른 삶의 이중 축 설명

### 12궁 전문 풀이 (각 궁 3~4문장 · 140~200자)
아래 **12개 궁 전부**를 소섹션으로 만들고, "### [궁 이름]" 헤더로 구분하세요.
각 궁 소섹션은 (1) 해당 궁에 좌한 주성·사화의 의미, (2) 인생에서 어떻게 작동하는지, (3) 유의점 1개 순서로.

1. 명궁(命宮) — 기본 성향과 인생 대기조
2. 형제궁(兄弟宮) — 형제·친밀한 동료 인연
3. 부처궁(夫妻宮) — 배우자·주요 연애 관계
4. 자녀궁(子女宮) — 자녀·후배·창작의 결실
5. 재백궁(財帛宮) — 유동 재물·돈 흐름
6. 질액궁(疾厄宮) — 건강·약한 장부
7. 천이궁(遷移宮) — 이동·해외·외부 활동
8. 노복궁(奴僕宮) — 부하·후배·친구 인연
9. 관록궁(官祿宮) — 직업·사회적 성취
10. 전택궁(田宅宮) — 부동산·집안 자산
11. 복덕궁(福德宮) — 정신·내면·복록
12. 부모궁(父母宮) — 부모·윗사람·가문 배경

### 사화(四化) 심층 분석 (260~320자)
- 화록(化祿)·화권(化權)·화과(化科)·화기(化忌) 각각이 어느 궁에 떨어졌고 인생에서 어떤 축으로 작용하는지
- 특히 화기가 떨어진 궁은 반드시 "주의 신호"로 한 문장 덧붙일 것

### 대한(大限) 흐름 (260~320자)
- 10년 단위 대한의 주요 전환점 3개를 나이로 명시
- 각 전환점에서 활성화되는 궁과 그 의미

### 궁합·인맥 섹션 (180~240자)
- 부처궁·노복궁·형제궁 조합으로 본 인간관계 전반의 톤
- 내게 힘이 되는 인연 유형 1개

### 종합 조언 (220~280자) — 마지막 3줄은 불릿
- 명반이 말하는 핵심 메시지 1문단
- 실천 가능한 조언 3가지를 불릿으로

반드시 "###" 헤더를 그대로 유지하고, 12궁 소섹션은 **12개 모두** 작성하세요.`;
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

위 정보를 바탕으로 ${targetYear}년 토정비결 풀이를 다음 구조로 작성하세요 (총 2400~3000자).

반드시 전통 토정비결 어법(예: "용이 여의주를 얻은 격", "나무에 꽃이 피는 상")으로 시(詩)적인 개운 문구 1~2줄을 먼저 제시한 뒤, 현대인도 이해하기 쉽게 풀어 설명하세요.

### 올해의 총운 (220~280자)
- 상중하괘 조합의 상징을 엮어 한 해의 큰 흐름 (등급: ${entry.grade})
- 핵심 메시지와 경계할 점, 이 한 해의 결이 어떤 감각인지

### 괘의 의미 (180~240자)
- 왜 이 괘가 나왔는지 상징 해석
- 상괘(${upperGwae.name})·중괘(${middleGwae.position})·하괘(${lowerGwae.name})의 조화와 긴장

### 월별 운세 (1월~12월, 각 월 3~4문장·약 90~130자)
- 각 월의 **키워드**(위 월별 키워드 고정)를 근거로 1문장 풀이
- 그 달에 해야 할 일 1가지 + 조심할 일 1가지를 반드시 포함
- 포맷: "### N월 — [월별 키워드]" 이어서 본문
- 정월부터 12월까지 **빠짐없이 12개 소섹션**으로 작성

### 분야별 운세 (각 3~4문장)
- **재물운**: 들어오는 시기·새는 시기 구분 + 재테크 방향 1개
- **애정/가정운**: 연애·부부·가족 중 이달 테마 + 주의 장면 1개
- **건강운**: 취약 장부 + 유의할 계절·습관
- **직장/학업운**: 승진·이직·시험·자격 중 유리한 흐름 1개 + 조심할 덫 1개

### 개운 조언 (140~200자) — 불릿 5개
- 올해의 길한 방향 1개
- 길한 색 2개
- 행운 숫자·요일 각 1개
- 이달 안에 실천할 개운 행동 2개

반드시 "###" 헤더를 그대로 유지하고, 월별 소섹션은 **12개를 모두** 작성하세요.`;
};

/**
 * 타로 단독 해석 (질문 타로, 1엽전)
 */
export const generateTarotPrompt = (
  card: TarotCardInfo,
  question?: string
): string => {
  const direction = card.isReversed ? '역방향' : '정방향';

  return `[뽑은 카드]
${card.nameKr} (${card.name}) — ${direction}
속성 오행: ${card.element}
키워드: ${card.keywords.join(', ')}
카드 본의: ${card.meaning}

${question ? `[질문]\n${question}\n` : '[질문]\n(자유 질문 — 카드 자체의 메시지로 풀이)\n'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 750~950자. 아래 5개 섹션 헤더 그대로 유지.
2) ${direction}의 의미를 반드시 중심에 둘 것. 정방향 의미를 역방향에 섞지 말 것.
3) 카드 본의에서 벗어난 상징을 창작하지 말 것. 키워드 바깥 개념은 최소화.
4) "~일 수 있어요"는 2회 이하. 가능하면 단정적으로.
5) 이모지 금지. 현대인이 쓰는 자연스런 한국어 어투(~해요/~이에요).
6) **일상 생활에서 바로 써먹을 수 있는** 구체 장면·대사·시간대·행동으로 예시. 추상어 금지.
   좋은 예: "퇴근 후 30분 산책하며 한 주 복기", "회의에서 반론 꺼내기 전 3초 침묵 두기"
   나쁜 예: "자신을 돌보세요", "긍정적 태도를 가지세요"

### 카드의 현재 메시지 (140~180자)
- ${card.nameKr}(${direction})가 이 순간 보내는 핵심 신호 한 문장 + 그 의미 풀이 2~3문장
- 질문자가 지금 어떤 심리적·상황적 국면에 있는지를 카드로부터 추정하여 한 문장

### 질문에 대한 해석 (180~230자)
- ${question ? '주어진 질문에 카드가 어떻게 답하는지' : '사용자가 마음에 품은 주제에 카드가 어떻게 답하는지'} 구체적으로
- 카드 키워드(${card.keywords.slice(0, 3).join('·')})와 질문을 엮어 분석
- "예/아니오"로 환원 가능한 질문이면 반드시 방향성(Yes/No/조건부)을 명시하고 근거 한 줄

### 일상 속 적용 장면 (180~230자)
- 오늘~이번 주 안에 마주칠 법한 **구체 상황 3개**를 골라, 각 상황에서 이 카드 에너지로 어떻게 반응할지 한 줄씩
- 상황 예시 풀(골라서 변주): "회의/발표/보고", "갈등 대화/사과/거절", "집안일/정리/운동", "새 프로젝트 착수/마감", "친구 약속/가족 연락", "돈 쓸까 말까 순간", "SNS 올리기 전 순간"

### 행동 조언 (150~190자)
- 이번 주 안에 실행 가능한 구체 행동 2가지 — 반드시 **언제·어디서·무엇을** 세트로
- ${direction === '역방향' ? '역방향은 "멈춤·점검·내면 돌아보기" 방향으로' : '정방향은 "나아감·실행·확장" 방향으로'} 프레이밍

### 주의점 (100~130자)
- 카드 의미에 내포된 함정 1개 — 과몰입·성급·회피 중 무엇인지 명시
- 함정에 빠지기 쉬운 **구체 장면 1개**를 예시로 짧게`;
};

/**
 * 오늘의 타로 (달 1엽전)
 * - 하루 1장 고정 (날짜 시드 기반, 같은 날 같은 카드 반환)
 * - 하루를 움직이는 실용형 리포트
 */
export const generateTodayTarotPrompt = (
  card: TarotCardInfo,
  dateStr: string
): string => {
  const direction = card.isReversed ? '역방향' : '정방향';

  return `[오늘 뽑힌 카드]
날짜: ${dateStr}
${card.nameKr} (${card.name}) — ${direction}
속성 오행: ${card.element}
키워드: ${card.keywords.join(', ')}
카드 본의: ${card.meaning}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 반드시 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 1000~1300자. 아래 6개 섹션 헤더·순서 그대로.
2) **오늘 하루**에만 적용되는 조언. "앞으로" "장기적으로" 같은 시야 확장 금지.
3) 카드의 ${direction} 의미에 충실. 반대 방향 뉘앙스를 섞지 말 것.
4) "운이 좋다/나쁘다" 이분법 금지. "어떤 장면에서 어떻게 유리/불리한지"로 쪼갤 것.
5) 섹션 3·4·6은 반드시 불릿 리스트. 나머지는 서술형.
6) 이모지 금지. 신비주의적 수사 최소화. 현대인 어투(~해요/~이에요).
7) **모든 조언은 구체적 생활 장면·시간대·대사·행동과 묶을 것.**
   - 좋은 예: "오전 10~11시 집중 업무 블록에 이 카드 에너지가 가장 쓰인다", "점심 후 동료와의 가벼운 대화에서 먼저 근황을 물어볼 것"
   - 나쁜 예: "집중하세요", "사람들과 잘 지내세요"
8) 추상적 "마음가짐" 충고 금지. "몇 시에 / 어디서 / 누구와 / 무엇을"이 드러나야 함.

### 오늘의 카드 한 줄 (60~90자)
- ${card.nameKr}(${direction})가 이 날에 가져온 기운을 한 문장으로 요약 + 한 문장 풀이

### 오늘 잘 풀리는 영역 (200~260자)
- 카드 키워드(${card.keywords.slice(0, 3).join('·')})와 오늘의 흐름을 엮어 **구체 장면 3개** 제시 — 각 장면에 "언제·무엇을·왜"가 들어가야 함
- 활용 가능한 장면 풀(여기서 골라 변주): "오전 업무 블록(9~11시) 집중", "회의에서 반론 꺼내기", "점심 시간 산책/대화", "오후 나른한 구간의 정리 작업", "퇴근 후 30분 개인 시간 활용", "저녁 약속/가족 대화", "미뤄둔 연락 한 건"

### 오늘 주의할 함정 (150~200자) — 불릿 4개
- 카드에 담긴 그림자(${direction === '역방향' ? '역방향의 경고' : '정방향의 과잉'})를 근거로
- "~하지 말 것" 형식으로 구체 행동 4개 — 각 1~2줄. 반드시 **어떤 순간에 그 행동이 튀어나오는지**를 함께 적을 것 (예: "피곤이 몰려오는 3시 30분경, 충동구매 앱 열지 말 것")

### 관계·소통 포인트 (180~240자)
- 오늘 이 카드 에너지와 맞는 **대화 톤과 말문 예시** — 한 문장 정도 실제 사용 가능한 워딩 포함
- 연락하면 좋은 사람 유형 1 + 거리를 둘 상황 1 (상황은 구체적으로: "상사가 즉답을 요구하는 순간" 식)
- 오늘 오고갈 메시지·SNS에서 조심할 표현 1개

### 오늘의 시간대 포인트 (140~180자) — 불릿 4개
- "오전(9~12시)": 이 시간대에 이 카드 기운이 어떻게 작용하는지 한 줄 + 권장 행동 1
- "점심·오후 초(12~15시)": 같은 포맷
- "오후·저녁(15~19시)": 같은 포맷
- "밤(19시 이후)": 같은 포맷

### 하루를 빛낼 작은 의식 (170~220자) — 불릿 4개
- 행운의 색 1개 (어디에 활용할지까지 — 옷/소품/배경화면 등)
- 유리한 시간대 1구간 (해당 시간에 뭘 할지)
- 오행 ${card.element}의 기운을 살리는 구체 음식·음료 1개
- 잠들기 전 1분짜리 마무리 행동 1개`;
};

/**
 * 이달의 타로 (해 2엽전)
 * - 3장 스프레드: 상순(1~10일) / 중순(11~20일) / 하순(21~말일)
 * - 월단위 전략형 리포트
 */
export const generateMonthlyTarotPrompt = (
  cards: {
    early: TarotCardInfo;   // 상순
    middle: TarotCardInfo;  // 중순
    late: TarotCardInfo;    // 하순
  },
  monthStr: string
): string => {
  const fmt = (c: TarotCardInfo, label: string) => {
    const dir = c.isReversed ? '역방향' : '정방향';
    return `- ${label}: ${c.nameKr}(${c.name}) · ${dir} · 오행 ${c.element} · 키워드 ${c.keywords.slice(0, 3).join('·')} · 본의 "${c.meaning}"`;
  };

  return `[이달 뽑힌 3장 스프레드]
대상 월: ${monthStr}
${fmt(cards.early, '상순(1~10일)')}
${fmt(cards.middle, '중순(11~20일)')}
${fmt(cards.late, '하순(21~말일)')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 반드시 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 1800~2200자. 아래 7개 섹션 헤더·순서 그대로.
2) 세 장의 **순차적 흐름**을 반드시 이야기로 엮을 것 — "상순이 이래서 중순이 이렇게, 그래서 하순이 이렇게 마무리된다".
3) 세 카드의 **방향(정/역)** 조합 의미를 한 번은 명시적으로 짚을 것.
4) 각 카드의 본의/키워드에서 벗어난 상징을 창작하지 말 것.
5) 이달 안에 실행 가능한 행동만. "향후 몇 년" 같은 장기 관점 금지.
6) 이모지 금지. 서술형 본문 + 섹션 5·7만 불릿 허용.
7) **모든 조언은 일상 속 구체 장면으로 내려앉을 것.** "이번 주 수요일 저녁 운동 루틴 점검", "월말 카드값 들어오기 전 쇼핑 앱 삭제" 같은 눈높이.
   추상어("성장", "균형", "긍정적")만으로 문장을 끝내지 말 것 — 반드시 구체 행동과 짝지을 것.
8) 각 순(상·중·하) 섹션에는 반드시 **그 10일 동안 마주칠 장면 2개 + 실행 행동 2개**를 넣을 것.

### 이달의 전체 테마 (220~280자)
- 3장의 조합이 그리는 큰 그림 한 문장 + 해석 2~3문장
- 정/역 방향 비율(3장 중 정방향 N장·역방향 M장)이 만드는 전체 톤 한 문장
- 이달 안에 반복될 "한 문장 질문"(나 자신에게 계속 묻게 될 질문) 1개를 제시

### 상순(1~10일) — ${cards.early.nameKr}(${cards.early.isReversed ? '역' : '정'}방향) (240~310자)
- 이 시기의 에너지와 첫 열흘 동안 해야 할 핵심 과제 1개 (근거 포함)
- 구체 장면 2개 (예: "첫 주 월요일 아침 회의에서 방향 잡기", "주말 이전 마감 1개 끝내기")
- 실행 행동 2개 — 언제·무엇을·왜를 붙여서

### 중순(11~20일) — ${cards.middle.nameKr}(${cards.middle.isReversed ? '역' : '정'}방향) (240~310자)
- 상순의 흐름이 이달 중간에 어떻게 변주되는지
- 전환 국면이 필요한지 유지 국면인지 판단 + 구체 장면 2개
- 실행 행동 2개 (상순과 겹치지 않는 방향성으로)

### 하순(21~말일) — ${cards.late.nameKr}(${cards.late.isReversed ? '역' : '정'}방향) (240~310자)
- 이달을 어떻게 닫을 것인가 — 수확·정리·준비 중 무엇인지
- 구체 장면 2개 + 다음 달로 넘기기 전 해둘 일 2개
- 월말 회고할 때 스스로에게 체크할 질문 1개

### 이달의 주력 과제 (180~230자) — 불릿 3개
- 세 카드의 합의에서 도출된 "이달 안에 반드시 해낼 것" 3가지
- 각 항목: 목표 + 왜 필요한지 + 구체 체크 기준 한 줄 (예: "월말까지 이력서 1장 마감 → 금요일 저녁 30분씩 3회")

### 피해야 할 함정 (180~230자)
- 역방향이 있다면 그 카드가 경고하는 지점 중심으로 구체 장면 2개
- 정방향만이라면 과잉이 될 수 있는 지점 2개 — 언제 그 과잉이 터지는지 함께
- 각 함정에 "이럴 때 잠시 멈춰야 할 신호" 1개 포함

### 이달의 실천 의식 (200~260자) — 불릿 5개
- 행운 색 1개 (활용처: 옷/포인트/노트 등)
- 이달의 숫자 1개 + 어디에 사용할지 (저축 목표/반복 루틴 횟수 등)
- 힘을 보태는 요일 1개 + 그 요일에 할 한 가지
- 피해야 할 요일 1개 + 그 요일에 금지할 한 가지
- 세 카드의 오행(${cards.early.element}·${cards.middle.element}·${cards.late.element})을 고려하여 부족한 기운을 채우는 한 달 짜리 "반복 루틴" 1개 (예: "매일 아침 7시 5분 스트레칭", "주 2회 수요일/일요일 저녁 책 30분")`;
};

/**
 * 사주 × 타로 하이브리드 (3엽전)
 */
export const generateHybridPrompt = (
  sajuResult: SajuResult,
  tarotCard: TarotCardInfo,
  question?: string
): string => {
  const { pillars, elementPercent, yongSinElement, yongSin, isStrong } = sajuResult;
  const direction = tarotCard.isReversed ? '역방향' : '정방향';
  // Air→木, Water→水, Fire→火, Earth→土, Spirit→金
  const tarotSajuElement: Record<string, string> = {
    Fire: '화', Water: '수', Air: '목', Earth: '토', Spirit: '금'
  };
  const cardElementInSaju = tarotSajuElement[tarotCard.element];

  return `[내 사주]
일주: ${pillars.day.gan}${pillars.day.zhi} (${pillars.day.ganElement}일간) · ${isStrong ? '신강' : '신약'}
오행 분포: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
용신: ${yongSinElement}(${yongSin})

[뽑은 타로]
${tarotCard.nameKr}(${tarotCard.name}) — ${direction}
타로 오행: ${tarotCard.element} → 사주 오행 ${cardElementInSaju}
키워드: ${tarotCard.keywords.join(', ')}

${question ? `[질문]\n${question}\n` : '[질문]\n(자유 질문)\n'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 1200~1600자. 아래 6개 섹션 헤더 그대로.
2) 타로 오행(${cardElementInSaju})과 내 용신(${yongSinElement})의 관계를 반드시 한 번 명시.
   - 같은 오행 → 기운 강화 / 상생 → 보완 / 상극 → 경고 중 어디인지.
3) 사주 확정 사실(격국·용신·신강약)과 모순되지 않게.
4) 이모지 금지. 신비주의 수사 최소화.

### 1. 사주와 타로의 교차점 (200~260자)
- 타로 ${cardElementInSaju}와 내 용신 ${yongSinElement}의 관계 해석
- 사주 오행 분포가 이 카드의 기운을 받아들이기에 부족한지/넘치는지

### 2. 카드가 전하는 오늘의 상황 (200~260자)
- ${tarotCard.nameKr}(${direction})가 사용자 인생의 어느 지점을 비추고 있는지
- 사주 구조 위에서 이 카드가 강조하는 주제

### 3. 질문에 대한 통합 답 (220~280자)
- 사주 근거 + 타로 메시지를 엮어 답
- 지금 움직이기 좋은지 / 멈출 때인지 판단

### 4. 행동 처방 (180~230자) — 불릿 3개
- 이번 주 실행 1개
- 이달 안 실행 1개
- 올해 안 실행 1개

### 5. 오행 보완 (160~210자)
- 용신 ${yongSinElement}을 기르는 생활 속 보완책 2개
- 타로 오행 ${cardElementInSaju}이 과잉될 경우 눌러줄 보완책 1개

### 6. 마무리 메시지 (120~160자)
- 한 줄 핵심 + 독자를 북돋우는 단정적 문장으로 마무리`;
};

/**
 * 애정운 특화 분석 (2엽전) — 타이트 + 상세
 */
export const generateLoveFortunePrompt = (result: SajuResult): string => {
  const { pillars, gender, elementPercent, yongSinElement, yongSin, isStrong, daeWoon } = result;
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));
  const nextDaewoon = daeWoon.slice(0, 5).map(d => `${d.startAge}세 ${d.gan}${d.zhi}(${d.tenGod})`).join(', ');

  return `[내 사주 — 애정 분석용 추출]
일주: ${pillars.day.gan}${pillars.day.zhi} (${pillars.day.ganElement}일간)
성별: ${gender === 'male' ? '남성' : '여성'}  · ${isStrong ? '신강' : '신약'} · 용신: ${yongSinElement}(${yongSin})
오행 분포: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
십성 분포: ${sipseong}
배우자궁(일지): ${pillars.day.zhi} (${pillars.day.zhiElement})
향후 대운 5개: ${nextDaewoon}

[관계성 규칙]
- 남자: 재성(편재·정재)=여자·배우자, 관성=사회·자식
- 여자: 관성(편관·정관)=남자·배우자, 식상=자식·표현
- 일지(배우자궁)의 합·충 여부가 결혼운의 기반

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 1400~1800자. 아래 7개 섹션 헤더 그대로.
2) 성별에 맞는 관계성 규칙을 반드시 적용.
3) 막연한 "좋은 사람 만날 것"류 금지. 어떤 유형·왜·언제·어떻게를 구체화.
4) 이모지 금지. 불릿은 섹션 5·7에만.

### 1. 타고난 연애 성향 (220~280자)
- 일간·배우자궁·십성 배치로 본 핵심 기질
- 연애 시 드러나는 매력 2개와 약점 2개

### 2. 이상형·잘 맞는 타입 (200~260자)
- 상대 사주 유형 2개(어떤 일간·오행·성향인지 구체적으로)
- 심리적으로 끌리는 모습 + 장기 안정에 필요한 모습 구분

### 3. 조심할 타입·관계 패턴 (180~230자)
- 배우자궁의 충/형을 근거로 반복될 수 있는 갈등 패턴 1~2개
- "첫눈에 반하지만 빠르게 식는" 같은 관계 신호

### 4. 결혼 시기·유리한 구간 (200~260자)
- 향후 대운 목록에서 혼인에 유리한 대운 1~2개 집어 나이 구간 명시
- 세운에서 결혼 촉진 지지(배우자궁과 합·삼합) 관점 간단 설명

### 5. 연애 단계별 전략 (180~230자) — 불릿 3개
- 초반(썸~연애 초): 1줄
- 중반(연애 안정기): 1줄
- 장기(결혼·동거 준비): 1줄

### 6. 감정 성장 포인트 (180~230자)
- 나 자신이 관계에서 키워야 할 내면의 힘 1개
- 상대에게 표현해야 할 사랑 언어(${gender === 'male' ? '남성' : '여성'} 관점) 1개

### 7. 애정 개운 처방 (140~190자) — 불릿 4개
- 용신 오행(${yongSinElement})을 살리는 데이트 색/장소 2개
- 행운 요일·시간대 1
- 관계를 막는 사주 함정을 피할 행동 1
- 이달 안에 해볼 애정 의식 1`;
};

/**
 * 재물운 특화 분석 (2엽전) — 타이트 + 상세
 */
export const generateWealthFortunePrompt = (result: SajuResult): string => {
  const { pillars, elementPercent, yongSinElement, yongSin, isStrong, daeWoon } = result;
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));
  const upcomingDaewoon = daeWoon.slice(0, 5).map(d => `${d.startAge}세 ${d.gan}${d.zhi}(${d.tenGod})`).join(', ');

  return `[내 사주 — 재물 분석용 추출]
일주: ${pillars.day.gan}${pillars.day.zhi} (${pillars.day.ganElement}일간) · ${isStrong ? '신강' : '신약'}
오행 분포: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
용신: ${yongSinElement}(${yongSin})
십성 분포: ${sipseong}
향후 대운: ${upcomingDaewoon}

[재물 규칙 요약]
- 편재(偏財)=사업·투자·유동재, 정재(正財)=월급·안정재
- 식상(식신·상관)=돈 버는 도구(재능·기술)
- 재성이 너무 많으면 신약일 때 재다신약(재물 무게에 눌림)
- 신강일 땐 재성이 힘 있어야 재복 구현

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) 총 1400~1800자. 아래 7개 섹션 헤더 그대로.
2) 재성·식상·비겁 구조로 근거를 매번 짚을 것.
3) "부자가 됩니다"류 단정 금지 — "어떤 조건에서 어떤 규모로"로 쪼갤 것.
4) 이모지 금지. 불릿은 섹션 5·7에만.

### 1. 타고난 재복 유형 (220~280자)
- 편재형 / 정재형 / 식상생재형 / 재고형 중 이 사주는 어디에 속하는지 판정 + 근거
- 신강·신약 맥락에서 재성이 얼마나 힘을 쓸 수 있는지

### 2. 돈 버는 스타일 (220~280자)
- 월급형 / 사업형 / 투자형 / 전문기술형 중 유리·불리 순위
- 내가 돈을 끌어오는 방식 2가지 + 누수 패턴 1가지

### 3. 재물 대운의 흐름 (200~260자)
- 위 대운 목록에서 재운 상승 구간·침체 구간을 나이로 명시
- 앞으로 10~20년 내 핵심 재테크 결정 시점

### 4. 올해·내년 재물 포커스 (180~230자)
- 최근 세운의 오행이 재성과 어떻게 반응하는지
- 집중할 것 1개 / 지연할 것 1개 / 손대지 말 것 1개

### 5. 재테크 전략 (180~230자) — 불릿 3개
- 적합한 자산군 2개(부동산·주식·채권·사업 등 중)
- 피해야 할 자산군 1개 — 이유 포함

### 6. 돈 함정·리스크 (160~210자)
- 사주에 내재된 재물 리스크 1~2개(재다신약 / 비겁탈재 / 상관견관 등 해당 시)
- 평생 반복되는 재정 실수 1개 + 교정 방향

### 7. 재물 개운 처방 (140~190자) — 불릿 4개
- 용신(${yongSinElement}) 기운의 돈 관련 색 1
- 행운 방향 1 · 금고·지갑 보관법 1
- 이번 달 실천 가능한 저축·투자 습관 1`;
};
