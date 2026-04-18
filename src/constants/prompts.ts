/**
 * GPT 프롬프트 최적화 버전
 * 엽전 크레딧 시스템에 맞춘 무료/유료 구분
 */

import { SajuResult, TEN_GODS_MAP, STEM_ELEMENT, BRANCH_ELEMENT, type SeWoon, type DaeWoon } from '../utils/sajuCalculator';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../engine/gyeokguk';
import { getDayPillarTraits } from './gapjaTraits';
import type { TarotCardInfo } from '../services/api';
import type { TaekilResult, TaekilDay } from '../engine/taekil';

// ── 오행 상생/상극 (프롬프트 유틸용)
const EL_GEN: Record<string, string> = { '목':'화', '화':'토', '토':'금', '금':'수', '수':'목' };
const EL_CON: Record<string, string> = { '목':'토', '화':'금', '토':'수', '금':'목', '수':'화' };

// ── 오행 속성 매핑
const EL_ORGAN: Record<string, string> = {
  '목':'간·담낭', '화':'심장·소장', '토':'비장·위장·췌장', '금':'폐·대장', '수':'신장·방광·생식기'
};
const EL_COLOR: Record<string, string> = {
  '목':'초록·파란', '화':'빨간·주황', '토':'노란·황토', '금':'흰·회색·금색', '수':'검정·진청'
};
const EL_DIR: Record<string, string> = {
  '목':'동쪽', '화':'남쪽', '토':'중앙', '금':'서쪽', '수':'북쪽'
};
const EL_NUM: Record<string, string> = {
  '목':'3·8', '화':'2·7', '토':'5·10', '금':'4·9', '수':'1·6'
};
const EL_SEASON: Record<string, string> = {
  '목':'봄(3~5월)', '화':'여름(6~8월)', '토':'환절기(3·6·9·12월)', '금':'가을(9~11월)', '수':'겨울(12~2월)'
};
const EL_FOOD: Record<string, string> = {
  '목':'신맛(식초·레몬·매실), 녹색 채소, 새싹류',
  '화':'쓴맛(커피·여주·쑥), 붉은 채소·과일, 열성 음식',
  '토':'단맛(고구마·호박·대추), 황색 음식, 뿌리채소',
  '금':'매운맛(생강·고추·마늘), 흰색 음식, 폐 강화 식품',
  '수':'짠맛(미역·다시마·된장), 검은색 음식, 신장 강화 식품'
};
const EL_ENV: Record<string, string> = {
  '목':'숲·공원 산책, 원예, 등산, 글쓰기, 동쪽 방향 자리',
  '화':'밝고 따뜻한 공간, 사교 활동, 남쪽 방향 자리, 조명 밝게',
  '토':'안정된 중심 공간, 명상, 도자기·흙 관련 취미, 중앙 자리',
  '금':'정돈된 공간, 음악(현악·금속악기), 금속 소품, 서쪽 방향 자리',
  '수':'물 근처 환경, 독서, 수영, 북쪽 방향 자리'
};

/** 기둥별 십성 위치 정리 (천간 기준) */
function getSipseongByPillar(result: SajuResult): string {
  const { pillars, hourUnknown } = result;
  const lines = [
    `년간 ${pillars.year.gan}: ${pillars.year.tenGodGan || '일간'} / 년지 ${pillars.year.zhi}: ${pillars.year.tenGodZhi}`,
    `월간 ${pillars.month.gan}: ${pillars.month.tenGodGan} / 월지 ${pillars.month.zhi}: ${pillars.month.tenGodZhi}`,
    `일간 ${pillars.day.gan}: 비견(일간 본인) / 일지 ${pillars.day.zhi}: ${pillars.day.tenGodZhi}`,
    hourUnknown ? '시주: 미상' : `시간 ${pillars.hour.gan}: ${pillars.hour.tenGodGan} / 시지 ${pillars.hour.zhi}: ${pillars.hour.tenGodZhi}`,
  ];
  return lines.join('\n');
}

/** 재고(財庫) 유무 — 辰戌丑未 지지에 재성 지장간이 있는지 */
function checkJaeGo(result: SajuResult): string {
  const { pillars, hourUnknown, dayMaster } = result;
  const dayEl = STEM_ELEMENT[dayMaster] || '';
  const reseongEl = EL_CON[dayEl]; // 일간이 극하는 오행 = 재성 오행
  const goZhis = ['진', '술', '축', '미'];
  const allPillars = [
    { label: '년지', p: pillars.year },
    { label: '월지', p: pillars.month },
    { label: '일지', p: pillars.day },
    ...(!hourUnknown ? [{ label: '시지', p: pillars.hour }] : []),
  ];
  const found: string[] = [];
  allPillars.forEach(({ label, p }) => {
    if (goZhis.includes(p.zhi)) {
      const hasReseong = p.hiddenStems.some(h => STEM_ELEMENT[h] === reseongEl);
      if (hasReseong) found.push(`${label} ${p.zhi}(재고)`);
    }
  });
  return found.length > 0
    ? `있음 — ${found.join(', ')} → 재물 저장·축적 능력 보유`
    : '없음 — 재물이 들어와도 쌓이기 어려운 구조, 현금 흐름형';
}

/** 일지 관련 지지합·충 필터 */
function getDayZhiInteractions(result: SajuResult): string {
  const dayZhi = result.pillars.day.zhi;
  const related = result.interactions.filter(i =>
    i.description.toLowerCase().includes(dayZhi) || i.elements.includes(dayZhi)
  );
  return related.length > 0
    ? related.map(i => `${i.type}: ${i.description}`).join(' / ')
    : '없음';
}

/** 오행 상생 흐름 단절 분석 */
function analyzeElFlow(result: SajuResult): string {
  const els = ['목', '화', '토', '금', '수'];
  const present = new Set<string>();
  const { pillars, hourUnknown } = result;
  [pillars.year, pillars.month, pillars.day, ...(hourUnknown ? [] : [pillars.hour])].forEach(p => {
    present.add(p.ganElement);
    present.add(p.zhiElement);
  });
  const missing = els.filter(e => !present.has(e));
  if (missing.length === 0) return '오행 상생 흐름 완전 연결 — 에너지 순환 원활';
  const broken: string[] = [];
  missing.forEach(m => {
    const prev = els[(els.indexOf(m) - 1 + 5) % 5];
    const next = EL_GEN[m];
    broken.push(`${prev}→${m}(결핍)→${next} 흐름 단절`);
  });
  return broken.join(' / ');
}

// 천간 합 (甲己합→土, 乙庚합→金, 丙辛합→水, 丁壬합→木, 戊癸합→火)
const GAN_COMBINE: Record<string, { partner: string; result: string }> = {
  '갑':{ partner:'기', result:'토' }, '기':{ partner:'갑', result:'토' },
  '을':{ partner:'경', result:'금' }, '경':{ partner:'을', result:'금' },
  '병':{ partner:'신', result:'수' }, '신':{ partner:'병', result:'수' },
  '정':{ partner:'임', result:'목' }, '임':{ partner:'정', result:'목' },
  '무':{ partner:'계', result:'화' }, '계':{ partner:'무', result:'화' },
};
// 천간 충 (甲庚, 乙辛, 丙壬, 丁癸)
const GAN_CLASH: Record<string, string> = {
  '갑':'경', '경':'갑', '을':'신', '신':'을',
  '병':'임', '임':'병', '정':'계', '계':'정',
};

/** 기둥 천간↔지지 오행 관계 한 줄 문자열 */
function pillarRelation(ganEl: string, zhiEl: string): string {
  if (!ganEl || !zhiEl) return '해당없음';
  if (ganEl === zhiEl) return '비화(같은 오행·내부 안정)';
  if (EL_GEN[zhiEl] === ganEl) return `지지→천간 상생(${zhiEl}生${ganEl}·지지가 천간을 키움)`;
  if (EL_GEN[ganEl] === zhiEl) return `천간→지지 상생(${ganEl}生${zhiEl}·천간이 지지를 키움)`;
  if (EL_CON[zhiEl] === ganEl) return `지지가 천간 상극(${zhiEl}克${ganEl}·내부 긴장·억압)`;
  if (EL_CON[ganEl] === zhiEl) return `천간이 지지 상극(${ganEl}克${zhiEl}·천간이 지지를 제어)`;
  return '무관계';
}

/** 사주 4천간 중 특정 오행이 있는 기둥 위치 반환 */
function findElementInGans(result: SajuResult, el: string): string[] {
  const labels: string[] = [];
  const { year, month, day, hour } = result.pillars;
  if (STEM_ELEMENT[year.gan] === el) labels.push('년주 천간');
  if (STEM_ELEMENT[month.gan] === el) labels.push('월주 천간');
  if (STEM_ELEMENT[day.gan] === el) labels.push('일주 천간(일간)');
  if (!result.hourUnknown && STEM_ELEMENT[hour.gan] === el) labels.push('시주 천간');
  if (BRANCH_ELEMENT[year.zhi] === el) labels.push('년주 지지');
  if (BRANCH_ELEMENT[month.zhi] === el) labels.push('월주 지지');
  if (BRANCH_ELEMENT[day.zhi] === el) labels.push('일주 지지');
  if (!result.hourUnknown && BRANCH_ELEMENT[hour.zhi] === el) labels.push('시주 지지');
  return labels;
}

/** 월지 지장간이 사주 천간에 투출(透出)되었는지 확인 */
function checkTouchul(result: SajuResult): string {
  const monthHidden = result.pillars.month.hiddenStems;
  const gans = [
    result.pillars.year.gan,
    result.pillars.month.gan,
    result.pillars.day.gan,
    ...(!result.hourUnknown ? [result.pillars.hour.gan] : []),
  ];
  const found = monthHidden.filter(h => gans.includes(h));
  if (found.length === 0) return '없음 (월지 지장간이 천간에 투출되지 않아 격국 에너지가 내면에 잠재)';
  return `${found.join('·')} 투출 → 격국 에너지가 천간에 드러나 사회적으로 발현됨`;
}

/** 천간 합·충 분석 */
function analyzeGanInteractions(result: SajuResult): string {
  const gans = [
    result.pillars.year.gan,
    result.pillars.month.gan,
    result.pillars.day.gan,
    ...(!result.hourUnknown ? [result.pillars.hour.gan] : []),
  ];
  const pillarNames = ['년', '월', '일', '시'];
  const results: string[] = [];

  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const a = gans[i], b = gans[j];
      if (GAN_COMBINE[a]?.partner === b) {
        results.push(`${pillarNames[i]}간 ${a}·${pillarNames[j]}간 ${b} → 천간합(${GAN_COMBINE[a].result}화)`);
      } else if (GAN_CLASH[a] === b) {
        results.push(`${pillarNames[i]}간 ${a}·${pillarNames[j]}간 ${b} → 천간충(상호 제어)`);
      }
    }
  }
  return results.length > 0 ? results.join(' / ') : '없음';
}

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

  const nonDayGans = [result.pillars.year.gan, result.pillars.month.gan];
  if (!result.hourUnknown) nonDayGans.push(result.pillars.hour.gan);
  nonDayGans.forEach(gan => {
    const s = map[gan];
    if (s && counts[s] !== undefined) counts[s] += 1;
  });

  const hiddenStemsArr = [result.pillars.year.hiddenStems, result.pillars.month.hiddenStems, result.pillars.day.hiddenStems];
  if (!result.hourUnknown) hiddenStemsArr.push(result.pillars.hour.hiddenStems);
  hiddenStemsArr.forEach(hidden => {
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

  // daeWoon.startAge/endAge 는 연도(e.g. 2020)임 — 나이 비교 아닌 연도 비교
  const birthYear_detailed = result.solarDate ? new Date(result.solarDate).getFullYear() : 0;
  const currentYear = new Date().getFullYear();
  const ageNow = birthYear_detailed > 0 ? currentYear - birthYear_detailed : 0;

  const fmtDWDetailed = (d: DaeWoon) => {
    const as = birthYear_detailed > 0 ? d.startAge - birthYear_detailed : d.startAge;
    const ae = birthYear_detailed > 0 ? d.endAge - birthYear_detailed : d.endAge;
    return `${d.startAge}~${d.endAge}년(${as}~${ae}세) ${d.gan}${d.zhi}(${d.ganElement}${d.zhiElement}·${d.tenGod}·${d.twelveStage})`;
  };

  // 대운: 각 칸에 간지·오행·십성·12운성·나이구간까지 실어 보냄
  const daeWoonStr = daeWoon
    .filter(d => d.gan && d.zhi)
    .slice(0, 8)
    .map(d => fmtDWDetailed(d))
    .join(' | ');

  // 현재 대운 — startAge/endAge 가 연도이므로 currentYear 로 비교
  const currentDaeWoon = daeWoon.find(d => d.gan && d.zhi && currentYear >= d.startAge && currentYear <= d.endAge);
  const currentDaeWoonStr = currentDaeWoon
    ? fmtDWDetailed(currentDaeWoon)
    : '아직 대운이 시작되지 않음';
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

  // 현재 대운 — startAge/endAge는 연도(e.g.2020)이므로 currentYear로 비교
  const _curYear = new Date().getFullYear();
  const curDW = daeWoon.find(d => d.gan && d.zhi && _curYear >= d.startAge && _curYear <= d.endAge);
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

  const currentYear = new Date().getFullYear();
  const birthYearJT = result.solarDate ? new Date(result.solarDate).getFullYear() : 0;
  const ageNow = birthYearJT > 0 ? currentYear - birthYearJT : 0;

  const fmtDWJT = (d: DaeWoon) => {
    const as = birthYearJT > 0 ? d.startAge - birthYearJT : d.startAge;
    const ae = birthYearJT > 0 ? d.endAge - birthYearJT : d.endAge;
    return `${d.startAge}~${d.endAge}년(${as}~${ae}세) ${d.gan}${d.zhi}(${d.ganElement}${d.zhiElement}·${d.tenGod}·${d.twelveStage})`;
  };

  const daeWoonStr = daeWoon
    .filter(d => d.gan && d.zhi)
    .slice(0, 8)
    .map(d => fmtDWJT(d))
    .join(' | ');

  const currentDaeWoon = daeWoon.find(d => d.gan && d.zhi && currentYear >= d.startAge && currentYear <= d.endAge);
  const currentDaeWoonStr = currentDaeWoon
    ? fmtDWJT(currentDaeWoon)
    : '대운 시작 전';
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

[general] — 340~420자
먼저 격국(${gyeokguk.name})이 이 사람의 삶 전체를 어떤 방향으로 이끄는지 한 문장으로 단정적으로 선언한다. 이어서 ${result.strengthStatus}(신강신약) 판정이 그 격국을 어떻게 증폭하거나 제어하는지 설명하고, 용신(${yongSinElement})이 삶의 어떤 국면에서 결정적 역할을 하는지 구체적 상황(직업 선택·인간관계·건강 등 중 1개)으로 내려앉힌다. 오행 분포 중 가장 두드러지는 특징(결핍 또는 과다)이 일상에서 어떻게 드러나는지 1~2문장 추가.

[daymaster] — 320~400자
일주 ${pillars.day.gan}${pillars.day.zhi}(${dayTraits?.hanja ?? ''})의 고유한 에너지를 "이 일주를 타고난 사람은 ~한 방식으로 세상을 경험한다"는 관점에서 서술한다. DB에 주어진 키워드(${dayTraits?.keywords?.join(', ') ?? ''})를 개별 나열하지 말고 이야기 흐름 속에 녹여 쓴다. 이 일주가 강점을 발휘하는 전형적 장면 1개와 오히려 발목을 잡는 패턴 1개를 각각 구체적 상황으로 묘사. 특수신살(${dayTraits?.sinsal?.join(', ') || '없음'})이 있다면 그 실생활 의미를 1~2문장으로 풀 것.

[element] — 300~380자
오행 분포(목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%)를 단순 수치 나열이 아닌 "어떤 삶의 장면에서 어떻게 느껴지는가"로 풀어 쓴다. 결핍 오행이 없다면 과다 오행의 편향성을 집중 분석. 결핍 오행이 있다면 그것이 야기하는 구체적 생활 패턴 약점 2가지(예: 수 결핍이면 감정 조절 어려움, 쉽게 번아웃됨)를 서술하고, 이를 일상에서 보완할 수 있는 실용 방법 1가지(식습관·환경·행동 중 선택)를 구체적으로 제안.

[character] — 380~460자
일간 ${pillars.day.gan}(${pillars.day.ganElement}) + 격국(${gyeokguk.name}) + 십성 분포 상위 2개를 합산해 타고난 성향을 서술한다. "이 사람이 낯선 환경에서 처음 보이는 모습"과 "친해진 뒤 드러나는 본모습"을 구분해 각각 2~3문장으로 묘사하면 독자가 자신을 확인하는 재미를 느낀다. 강점(타인이 인정하는 것) 2가지와 그림자(자신도 모르게 반복하는 약점) 2가지를 균형 있게 서술. 마지막에 "이 기질이 삶의 어떤 선택에서 반복적으로 나타나는가"를 1문장으로 정리.

[career] — 360~440자
격국(${gyeokguk.name})과 용신(${yongSinElement})을 근거로 적합한 직군 4~5개를 구체적으로(예: "IT 개발 중에서도 백엔드·시스템 설계 분야") 제시. 단순히 직종 이름만 나열하지 말고 "왜 이 격국·용신을 가진 사람에게 이 분야가 맞는가"를 한 문장씩 근거로 달 것. 조직 내 역할(리더형·참모형·독립형 중 선택)과 커리어 성장 패턴(느리게 쌓이다 폭발하는 형 vs 초반 빠른 성장 후 정체 등)을 1~2문장으로. 피해야 할 직군 또는 환경 1~2개와 이유.

[wealth] — 340~420자
재성(편재·정재) 강약과 재고(財庫·월지·일지 등의 재성 지장간 포함 여부)를 근거로 이 사주가 돈을 어떻게 버는 스타일인지 판단. 월급형·사업형·투자형 중 어느 쪽이 유리한지 반드시 근거(십성·격국)를 붙여 단정적으로 서술. 돈을 잘 벌지만 잘 새는 패턴이 있는지, 아니면 느리지만 꾸준히 쌓이는 스타일인지도 서술. 반복적으로 빠지게 되는 금전 함정 1가지(예: 사람 믿다 손해, 충동 투자 등)를 구체적 상황으로 묘사하고 예방법 1문장.

[love] — 340~420자
관성(여성의 경우 배우자 별)·재성(남성의 경우 배우자 별) 강약과 위치(어느 기둥에 있는지)를 바탕으로 이 사람이 연애·결혼에서 무의식적으로 끌리는 상대 유형을 묘사. 단순 "좋은 사람"이 아니라 "어떤 분위기의 사람에게 반응하는가"를 행동·말투·에너지 수준에서 구체적으로 서술. 일주의 12운성이 배우자궁(일지)에 미치는 영향 1~2문장. 유리한 대운 구간(대운표에서 명시)에서 연애·결혼 기회가 어떻게 열리는지. 관계에서 반복되는 갈등 패턴 1개와 개선 포인트.

[health] — 280~340자
약한 오행·충을 받은 오행 기준으로 취약한 장부를 먼저 명시(목=간담, 화=심장·소장, 토=비위·췌장, 금=폐·대장, 수=신장·방광). 이 취약 장부가 스트레스 상황에서 실제로 어떤 증상으로 나타날 수 있는지 1~2가지 구체적 묘사. 일상에서 챙겨야 할 습관 2가지(수면·식습관·운동 유형 중 선택)와 하지 말아야 할 것 1가지. 이 사주 기질이 만드는 건강 리스크(예: 스트레스 폭식, 번아웃 후 폭발적 증상 등) 1가지.

[relation] — 300~380자
비겁(경쟁·동료)·식상(표현·자녀)·관성(권위·배우자·사회) 배치로 본 인맥 형성 스타일을 구체적으로. "이 사람이 처음 만난 자리에서 어떻게 행동하는가"와 "어떤 관계에서 오래 유지되는가"를 분리해 서술. 부모 관계(인성·관성 위치 근거)·자녀 관계(식상 위치 근거)의 특징 각 1문장. 의지하면 좋은 사람 유형 1개와 거리를 두어야 하는 유형 1개를 십성 근거로 제시.

[luck] — 480~580자
현재 대운(${currentDaeWoonStr})을 먼저 선언하고, 그 대운의 간지·오행·십성·12운성이 지금 이 나이대의 일·관계·재물 각각에 구체적으로 어떤 영향을 주는지 4~5문장으로 서술. 단순 "좋다/나쁘다"가 아니라 어떤 조건에서 어떤 결과가 유리/불리한지로 쪼갤 것.
이전 대운과 다음 대운 각 1개를 구체 나이로 꼽아 "과거 대운에서 이월된 미완의 과제" + "다음 대운에서 반드시 준비해야 할 것"을 각각 2~3문장으로.
이후 세운(${recentSeWoon})에서 올해·내년·내후년 각각을 "어떤 십성이 들어오고, 어떤 국면이 열리며, 무엇을 우선해야 하는가" 형식으로 3~4문장씩 균형 있게 서술.

[advice] — 260~320자
용신(${yongSinElement})을 일상에서 보강하는 구체적 방법을 다음 항목으로 정리:
- 색 2개(의류·소품·인테리어에 자주 쓸 것)
- 방향 1개(이사·사무실 배치·좌석 선택 시)
- 유리한 시간대 1구간(중요한 일을 배치하면 좋은 하루 중 구간)
- 식재료 또는 음식 1~2개(오행 보강 기준)
이번 달 안에 당장 실천 가능한 구체 행동 3가지를 불릿(- )으로. 추상적 격언 금지, 오늘·이번 주·이번 달 수준의 행동 단위로.

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
    ? `${currentDaeWoon.startAge}~${currentDaeWoon.endAge}년  ${currentDaeWoon.gan}${currentDaeWoon.zhi}(${currentDaeWoon.ganElement}·${currentDaeWoon.zhiElement})  십성: ${currentDaeWoon.tenGod}  12운성: ${currentDaeWoon.twelveStage}`
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
  const nextDaewoon = daeWoon.slice(0, 5).map(d => `${d.startAge}년 ${d.gan}${d.zhi}(${d.tenGod})`).join(', ');

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
  const upcomingDaewoon = daeWoon.slice(0, 5).map(d => `${d.startAge}년 ${d.gan}${d.zhi}(${d.tenGod})`).join(', ');

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

// ══════════════════════════════════════════════════════
// 택일 운세 AI 추천 프롬프트
// ══════════════════════════════════════════════════════

/**
 * 택일 AI 추천 프롬프트
 * - 엔진이 계산한 길흉 날 목록 → AI가 명리 이유를 담아 추천 내러티브 생성
 * - 짧고 실용적 (350~450자)
 */
export const generateTaekilAdvicePrompt = (
  saju: SajuResult,
  taekil: TaekilResult,
): string => {
  const bestDays = taekil.bestDays.slice(0, 5);
  const worstDays = taekil.days
    .filter(d => d.grade === '흉')
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const formatDay = (d: TaekilDay) =>
    `${d.date}(${d.lunarLabel.split(' ')[2] ?? d.lunarLabel}) ${d.dayGan}${d.dayZhi} ${d.grade}(${d.score}점) — ${d.reasons.slice(0, 2).join(', ')}${d.luckyTime ? ` / 길시: ${d.luckyTime}` : ''}`;

  const bestList = bestDays.length > 0
    ? bestDays.map(formatDay).join('\n')
    : '없음';
  const worstList = worstDays.length > 0
    ? worstDays.map(formatDay).join('\n')
    : '없음';

  const elPct = saju.elementPercent;

  return `[사주 원국]
일간: ${saju.dayMaster}(${saju.dayMasterElement}) / 일주: ${saju.pillars.day.gan}${saju.pillars.day.zhi}
오행: 목${elPct.목}% 화${elPct.화}% 토${elPct.토}% 금${elPct.금}% 수${elPct.수}%
용신: ${saju.yongSinElement} / 기신: ${saju.giSin}

[택일 검색 정보]
카테고리: ${taekil.categoryLabel}
기간: ${taekil.startDate} ~ ${taekil.endDate}

[엔진 계산 — 길일 상위]
${bestList}

[엔진 계산 — 흉일]
${worstList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
1) Markdown 절대 금지. 이모지 금지.
2) 총 350~450자. 짧고 실용적으로.
3) 추천일은 위 엔진 계산 결과(길일)에서만 고를 것. 임의로 다른 날 추천 금지.
4) 명리 이유(십성·12운성·신살 중 1~2개)를 근거로 왜 좋은지 설명.
5) 피해야 할 날도 반드시 언급.
6) 출력은 [taekil_advice] 마커부터 시작. 마커 이전 텍스트 없어야 함.

[taekil_advice]
${taekil.categoryLabel} 택일 추천을 아래 구조로 작성하세요:
- 최고 추천일 1~2개: 날짜 + 명리 이유 1~2문장
- 차선 추천일 1개 (있으면): 날짜 + 한 문장
- 피해야 할 날 1개: 날짜 + 이유 한 문장
- 길시 안내: 추천일 중 길시가 있으면 1문장으로 안내
- 주의사항 1문장: ${taekil.categoryLabel}에 특화된 명리 조언`;
};

// ============================================================
// 섹션별 독립 프롬프트 (A안: 11개 개별 API 호출)
// ============================================================

/**
 * [1/11] 사주 총론 전용 프롬프트
 *
 * 입력 데이터:
 * - 격국 + 성패판정
 * - 신강신약 5단계 + 득령/득지/득세 + 세부 점수(비겁/인성 vs 식상/재/관)
 * - 용신·희신·기신 + 용신 오행 기둥 위치
 * - 오행% + 결핍(0%)·과다 오행
 * - 일간 음양·오행 + 일주 60갑자 특성(키워드·traits·sinsal)
 * - 기둥별 천간↔지지 오행 관계(상생/상극/비화)
 * - 지장간 투출 여부
 * - 공망 기둥
 * - 천간 합·충
 */
export const generateGeneralSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, elementPercent, yongSinElement, yongSin, heeSin, giSin, hourUnknown } = result;
  const gyeokguk = determineGyeokguk(result);
  const gyeokgukStatus = analyzeGyeokgukStatus(result, gyeokguk);
  const dayTraits = getDayPillarTraits(pillars.day.gan, pillars.day.zhi);

  // ── 1. 신강신약 블록
  const strengthBlock = [
    `판정: ${result.strengthStatus} (점수 ${result.strengthScore}/100)`,
    `득령(得令): ${result.deukRyeong ? 'O — 월지가 일간을 생하거나 같은 오행' : 'X — 월지가 일간에 비협조적'}`,
    `득지(得地): ${result.deukJi ? 'O — 일지가 일간을 생하거나 같은 오행' : 'X — 일지가 일간에 비협조적'}`,
    `득세(得勢): ${result.deukSe ? 'O — 비겁·인성 세력이 식상·재성·관성보다 강함' : 'X — 식상·재성·관성 세력이 우세'}`,
    `세부 점수 — 강화(비겁+인성+득령보너스): ${result.strengthDetail.supportTotal} / 약화(식상+재성+관성): ${result.strengthDetail.weakenTotal}`,
  ].join('\n');

  // ── 2. 용신 블록 + 기둥 위치
  const yongsinPositions = findElementInGans(result, yongSinElement);
  const yongsinPosStr = yongsinPositions.length > 0
    ? yongsinPositions.join(', ')
    : '사주 원국 내 없음 — 외부(직업·환경·배우자)에서 용신 기운을 채워야 함';
  const yongsinBlock = [
    `용신: ${yongSinElement}(${yongSin})`,
    `희신: ${heeSin} / 기신: ${giSin}`,
    `용신 기둥 위치: ${yongsinPosStr}`,
  ].join('\n');

  // ── 3. 오행 블록
  const elEntries = Object.entries(elementPercent) as [string, number][];
  const zeroEls = elEntries.filter(([, v]) => v === 0).map(([k]) => k);
  const maxEl = elEntries.reduce((a, b) => a[1] > b[1] ? a : b);
  const elementBlock = [
    `오행 분포: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%`,
    `결핍 오행: ${zeroEls.length > 0 ? zeroEls.join('·') + ' (해당 오행의 삶의 영역이 취약)' : '없음'}`,
    `과다 오행: ${maxEl[0]}(${maxEl[1]}%) — 이 기운이 성격·행동 전반에 편향`,
  ].join('\n');

  // ── 4. 기둥별 천간↔지지 오행 관계
  const pillarRelBlock = [
    `년주 ${pillars.year.gan}(${pillars.year.ganElement})↔${pillars.year.zhi}(${pillars.year.zhiElement}): ${pillarRelation(pillars.year.ganElement, pillars.year.zhiElement)}`,
    `월주 ${pillars.month.gan}(${pillars.month.ganElement})↔${pillars.month.zhi}(${pillars.month.zhiElement}): ${pillarRelation(pillars.month.ganElement, pillars.month.zhiElement)}`,
    `일주 ${pillars.day.gan}(${pillars.day.ganElement})↔${pillars.day.zhi}(${pillars.day.zhiElement}): ${pillarRelation(pillars.day.ganElement, pillars.day.zhiElement)}`,
    hourUnknown ? '시주: 미상' : `시주 ${pillars.hour.gan}(${pillars.hour.ganElement})↔${pillars.hour.zhi}(${pillars.hour.zhiElement}): ${pillarRelation(pillars.hour.ganElement, pillars.hour.zhiElement)}`,
  ].join('\n');

  // ── 5. 공망 기둥
  const kongmangPillars: string[] = [];
  if (pillars.year.isKongmang) kongmangPillars.push('년주(조상·뿌리 영역이 허함)');
  if (pillars.month.isKongmang) kongmangPillars.push('월주(사회·직업 노력이 허사가 되는 경향)');
  if (pillars.day.isKongmang) kongmangPillars.push('일주(배우자궁·자기 자신이 허함)');
  if (!hourUnknown && pillars.hour.isKongmang) kongmangPillars.push('시주(자녀·말년이 허함)');
  const kongmangStr = kongmangPillars.length > 0 ? kongmangPillars.join(' / ') : '없음';

  // ── 6. 천간 합·충
  const ganInteractionStr = analyzeGanInteractions(result);

  // ── 7. 지장간 투출
  const touchulStr = checkTouchul(result);

  // ── 8. 일주 60갑자 특성
  const dayTraitsBlock = dayTraits
    ? [
        `일주: ${dayTraits.name}(${dayTraits.hanja})`,
        `키워드: ${dayTraits.keywords.join(', ')}`,
        `특성: ${dayTraits.traits}`,
        `특수신살: ${dayTraits.sinsal.length > 0 ? dayTraits.sinsal.join(', ') : '없음'}`,
      ].join('\n')
    : `일주: ${pillars.day.gan}${pillars.day.zhi}`;

  // ── 9. 격국
  const gyeokgukBlock = [
    `격국: ${gyeokguk.name}${gyeokguk.nameHanja ? `(${gyeokguk.nameHanja})` : ''} — ${gyeokguk.type}`,
    `성패: ${gyeokgukStatus.isSuccessful ? '성격(成格) — 격국 에너지가 온전히 발휘됨' : '패격(敗格) — 격국이 손상되어 좌절·반전 패턴 반복'}`,
    `성패 근거: ${gyeokgukStatus.analysis}`,
  ].join('\n');

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 사주 총론을 작성하세요.

[절대 규칙]
- Markdown(#·*·**·>·\`) 완전 금지. 이모지 금지.
- 불릿은 "- " 또는 "· " 만 허용.
- AI 자기소개 문구 금지("분석 결과", "데이터에 따르면" 등).
- 아래 모든 수치·판정을 뒤집거나 임의 변경 금지. 해석만 허용.
- 전문 용어 첫 등장 시 괄호로 일상어 병기.
- "~일 수 있습니다" 흐린 표현 전체 2회 이하. 단정적으로 쓸 것.
- 출력은 [general] 마커 한 줄로 시작. 마커 이전 텍스트 없어야 함.
- 분량: 380~460자.

[확정 데이터]

▶ 격국·성패
${gyeokgukBlock}

▶ 신강신약
${strengthBlock}

▶ 용신·희신·기신
${yongsinBlock}

▶ 오행 분포
${elementBlock}

▶ 일간 정보
일간: ${pillars.day.gan}(${pillars.day.ganElement}·${result.dayMasterYinYang})

▶ 일주 60갑자 특성
${dayTraitsBlock}

▶ 기둥별 천간↔지지 오행 관계
${pillarRelBlock}

▶ 지장간 투출
${touchulStr}

▶ 공망
${kongmangStr}

▶ 천간 합·충
${ganInteractionStr}

[작성 지침]
사주 총론은 이 사람의 "삶 전체를 관통하는 하나의 문장"으로 시작해야 합니다.
격국(${gyeokguk.name})의 성패 판정이 삶의 기조를 어떻게 결정하는지 먼저 선언하고,
득령·득지·득세 조합으로 신강한 이유(또는 신약한 이유)가 이 사람의 에너지 운용 방식에
어떻게 드러나는지 구체적으로 연결하세요.
일주 60갑자 특성과 기둥별 천간↔지지 관계에서 발견되는 내·외부의 긴장 또는 조화를
한 가지 메타포나 구체적 장면으로 녹여 쓰세요.
용신(${yongSinElement})이 이 사람에게 어떤 국면에서 결정적 역할을 하는지,
기신(${giSin})이 어떤 식으로 반복적 장애가 되는지 마지막에 1~2문장으로 마무리하세요.

[general]`;
};

// ─────────────────────────────────────────────
// [2/11] 일주 해석
// ─────────────────────────────────────────────
export const generateDaymasterSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, hourUnknown } = result;
  const dayTraits = getDayPillarTraits(pillars.day.gan, pillars.day.zhi);

  const dayTraitsBlock = dayTraits
    ? `일주: ${dayTraits.name}(${dayTraits.hanja})
키워드: ${dayTraits.keywords.join(', ')}
특성: ${dayTraits.traits}
특수신살: ${dayTraits.sinsal.length > 0 ? dayTraits.sinsal.join(', ') : '없음'}`
    : `일주: ${pillars.day.gan}${pillars.day.zhi}`;

  // 일주 내 천간↔지지 관계
  const dayRelation = pillarRelation(pillars.day.ganElement, pillars.day.zhiElement);

  // 일지 관련 지지합·충
  const dayZhiInteraction = getDayZhiInteractions(result);

  // 일간 관련 천간합·충
  const ganInteraction = analyzeGanInteractions(result);

  // 지장간 구성
  const hiddenBlock = [
    `년지 ${pillars.year.zhi} 지장간: ${pillars.year.hiddenStems.join('·') || '없음'}`,
    `월지 ${pillars.month.zhi} 지장간: ${pillars.month.hiddenStems.join('·') || '없음'}`,
    `일지 ${pillars.day.zhi} 지장간: ${pillars.day.hiddenStems.join('·') || '없음'}`,
    hourUnknown ? '시주: 미상' : `시지 ${pillars.hour.zhi} 지장간: ${pillars.hour.hiddenStems.join('·') || '없음'}`,
  ].join('\n');

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 일주 해석을 작성하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- AI 자기소개 문구 금지. 수치·판정 변경 금지.
- 전문 용어 첫 등장 시 괄호로 일상어 병기.
- 흐린 표현 2회 이하. 단정적으로.
- 출력은 [daymaster] 마커 한 줄로 시작. 분량: 340~420자.

[확정 데이터]

▶ 일주 60갑자 특성
${dayTraitsBlock}

▶ 일주 12운성
${pillars.day.twelveStage} — 일주 에너지 상태

▶ 일주 천간↔지지 오행 관계
일간 ${pillars.day.gan}(${pillars.day.ganElement}) ↔ 일지 ${pillars.day.zhi}(${pillars.day.zhiElement}): ${dayRelation}

▶ 일간 음양
${result.dayMasterYinYang}간 — ${result.dayMasterYinYang === '양' ? '적극·외향·주도적' : '유연·내향·수용적'} 성질

▶ 일지 지장간 (배우자궁 내부 에너지)
${pillars.day.zhi} 지장간: ${pillars.day.hiddenStems.join('·') || '없음'}
(지장간 십성: ${pillars.day.hiddenStems.map(h => {
    const map = (TEN_GODS_MAP as Record<string, Record<string, string>>)[result.dayMaster] || {};
    return `${h}=${map[h] || '?'}`;
  }).join('·') || '없음'})

▶ 지장간 전체 구성
${hiddenBlock}

▶ 일지 관련 지지 합·충
${dayZhiInteraction}

▶ 일지 12신살
${pillars.day.sinSal12 || '없음'}

▶ 공망
${pillars.day.isKongmang ? '일주 공망 — 배우자궁·자기 자신이 허(虛)함' : '일주 공망 없음'}

▶ 천간 합·충
${ganInteraction}

[작성 지침]
일주 ${pillars.day.gan}${pillars.day.zhi}(${dayTraits?.hanja ?? ''})가 이 사람에게 어떤 삶의 방식을 부여하는지를
"이 일주를 타고난 사람은 ~한 방식으로 세상을 경험한다"는 관점에서 시작하세요.
일주 12운성(${pillars.day.twelveStage})이 지금 이 일주의 에너지 상태를 어떻게 규정하는지 1~2문장.
일간↔일지 관계(${dayRelation})에서 오는 내부 긴장 또는 조화를 구체적 장면으로 묘사하세요.
60갑자 키워드(${dayTraits?.keywords?.join(', ') ?? ''})는 나열하지 말고 이야기 흐름에 녹여 쓰세요.
특수신살(${dayTraits?.sinsal?.join(', ') || '없음'})이 있다면 실생활 의미로 풀어 1~2문장.

[daymaster]`;
};

// ─────────────────────────────────────────────
// [3/11] 오행 분포
// ─────────────────────────────────────────────
export const generateElementSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, elementPercent, hourUnknown } = result;

  // 기둥별 오행 배치
  const pillarElBlock = [
    `년주: 천간 ${pillars.year.gan}(${pillars.year.ganElement}) / 지지 ${pillars.year.zhi}(${pillars.year.zhiElement})`,
    `월주: 천간 ${pillars.month.gan}(${pillars.month.ganElement}) / 지지 ${pillars.month.zhi}(${pillars.month.zhiElement})`,
    `일주: 천간 ${pillars.day.gan}(${pillars.day.ganElement}) / 지지 ${pillars.day.zhi}(${pillars.day.zhiElement})`,
    hourUnknown ? '시주: 미상' : `시주: 천간 ${pillars.hour.gan}(${pillars.hour.ganElement}) / 지지 ${pillars.hour.zhi}(${pillars.hour.zhiElement})`,
  ].join('\n');

  // 결핍·과다 분석
  const elEntries = Object.entries(elementPercent) as [string, number][];
  const zeroEls = elEntries.filter(([, v]) => v === 0).map(([k]) => k);
  const overEls = elEntries.filter(([, v]) => v >= 35).map(([k, v]) => `${k}(${v}%)`);
  const maxEl = elEntries.reduce((a, b) => a[1] > b[1] ? a : b);

  // 오행 흐름 단절
  const flowAnalysis = analyzeElFlow(result);

  // 지장간 포함 숨은 오행
  const allPillars = [pillars.year, pillars.month, pillars.day, ...(hourUnknown ? [] : [pillars.hour])];
  const hiddenElCount: Record<string, number> = { '목':0, '화':0, '토':0, '금':0, '수':0 };
  allPillars.forEach(p => p.hiddenStems.forEach((h, idx) => {
    const el = STEM_ELEMENT[h];
    if (el && hiddenElCount[el] !== undefined) hiddenElCount[el] += idx === 0 ? 0.5 : 0.25;
  }));
  const hiddenElStr = Object.entries(hiddenElCount)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}+${v}`)
    .join(' ') || '없음';

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 오행 분포를 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치 변경 금지. 흐린 표현 2회 이하.
- 출력은 [element] 마커 한 줄로 시작. 분량: 320~400자.

[확정 데이터]

▶ 오행 분포 (표면 8글자 기준)
목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%
결핍 오행: ${zeroEls.length > 0 ? zeroEls.join('·') : '없음'}
과다 오행: ${overEls.length > 0 ? overEls.join('·') : '없음 (비교적 균형)'}
최다 오행: ${maxEl[0]}(${maxEl[1]}%)

▶ 지장간 숨은 오행 (추가 가중치)
${hiddenElStr}

▶ 기둥별 오행 배치
${pillarElBlock}

▶ 오행 상생 흐름 분석
${flowAnalysis}

▶ 신강신약 (오행 균형 결과)
${result.strengthStatus} — 강화 합계 ${result.strengthDetail.supportTotal} / 약화 합계 ${result.strengthDetail.weakenTotal}

[작성 지침]
오행 분포를 단순 수치 나열이 아닌 "이 에너지 지형이 삶에서 어떻게 느껴지는가"로 풀어 쓰세요.
결핍 오행(${zeroEls.join('·') || '없음'})이 있다면 그 오행이 관장하는 삶의 영역(
목=성장·계획, 화=표현·열정, 토=안정·신뢰, 금=결단·정밀, 수=지혜·감성)에서
구체적으로 어떤 약점·패턴으로 나타나는지 1~2가지 장면으로 묘사하세요.
과다 오행(${maxEl[0]})의 편향이 일상 행동에서 어떻게 드러나는지 1문장.
오행 흐름 단절(${flowAnalysis})이 있다면 에너지가 어디서 막히는지 설명하고,
이를 일상에서 보완할 방법 1가지(식습관·환경·행동)를 구체적으로 제안하세요.

[element]`;
};

// ─────────────────────────────────────────────
// [4/11] 성격·기질
// ─────────────────────────────────────────────
export const generateCharacterSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, elementPercent, hourUnknown } = result;
  const gyeokguk = determineGyeokguk(result);
  const dayTraits = getDayPillarTraits(pillars.day.gan, pillars.day.zhi);
  const sipseong = getSipseongByPillar(result);

  // 십성 분포 상위 2개
  const counts = computeSipseongCounts(result);
  const top2 = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, v]) => `${k}(${v})`).join('·');

  // 합·충 전체
  const interactionStr = result.interactions.length > 0
    ? result.interactions.map(i => `${i.type}: ${i.description}`).join(' / ')
    : '없음';

  // 기둥별 관계 요약
  const pillarRelBlock = [
    `년주 ${pillars.year.gan}↔${pillars.year.zhi}: ${pillarRelation(pillars.year.ganElement, pillars.year.zhiElement)}`,
    `월주 ${pillars.month.gan}↔${pillars.month.zhi}: ${pillarRelation(pillars.month.ganElement, pillars.month.zhiElement)}`,
    `일주 ${pillars.day.gan}↔${pillars.day.zhi}: ${pillarRelation(pillars.day.ganElement, pillars.day.zhiElement)}`,
    hourUnknown ? '시주: 미상' : `시주 ${pillars.hour.gan}↔${pillars.hour.zhi}: ${pillarRelation(pillars.hour.ganElement, pillars.hour.zhiElement)}`,
  ].join('\n');

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 성격·기질을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [character] 마커 한 줄로 시작. 분량: 380~460자.

[확정 데이터]

▶ 일간 정보
일간: ${pillars.day.gan}(${pillars.day.ganElement}·${result.dayMasterYinYang})
일주 특성: ${dayTraits?.traits ?? ''}
키워드: ${dayTraits?.keywords?.join(', ') ?? ''}

▶ 격국
${gyeokguk.name} — ${gyeokguk.type}

▶ 신강신약
${result.strengthStatus} — 득령(${result.deukRyeong ? 'O' : 'X'}) 득지(${result.deukJi ? 'O' : 'X'}) 득세(${result.deukSe ? 'O' : 'X'})

▶ 기둥별 십성 위치
${sipseong}

▶ 십성 분포 상위 2개
${top2}

▶ 오행 과·부족
목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%

▶ 기둥별 천간↔지지 관계
${pillarRelBlock}

▶ 합·충·형·파·해
${interactionStr}

▶ 천간 합·충
${analyzeGanInteractions(result)}

▶ 신살
${result.sinSals.length > 0 ? result.sinSals.map(s => `${s.name}(${s.type === 'good' ? '길' : s.type === 'bad' ? '흉' : '중'})`).join(' ') : '없음'}

[작성 지침]
"처음 만났을 때 보이는 모습"과 "친해진 뒤 드러나는 본모습"을 구분해 각각 2~3문장씩 서술하세요.
일간(${pillars.day.gan}·${pillars.day.ganElement})과 격국(${gyeokguk.name}) + 십성 상위 2개(${top2})를 근거로
타고난 강점 2가지·반복되는 그림자 2가지를 균형 있게 묘사하세요.
기둥별 천간↔지지 관계에서 가장 눈에 띄는 긴장·조화를 성격 서술에 하나의 메타포로 녹여 쓰세요.
마지막 문장: "이 기질이 삶의 선택에서 어떻게 반복되는가" 1문장으로 정리.

[character]`;
};

// ─────────────────────────────────────────────
// [5/11] 직업·적성
// ─────────────────────────────────────────────
export const generateCareerSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, yongSinElement, yongSin, hourUnknown } = result;
  const gyeokguk = determineGyeokguk(result);
  const sipseong = getSipseongByPillar(result);

  // 용신 기둥 위치
  const yongsinPos = findElementInGans(result, yongSinElement);
  const yongsinPosStr = yongsinPos.length > 0 ? yongsinPos.join(', ') : '원국 내 없음 — 외부 환경에서 채워야';

  // 조직형 vs 독립형
  const orgType = result.isStrong
    ? '독립·프리랜서형 유리 (신강 → 자기 주도 에너지 강)'
    : '조직·협업형 유리 (신약 → 외부 지원받을 때 최대 발휘)';

  // 관성·식상·인성 위치 집중 분석
  const counts = computeSipseongCounts(result);
  const gwanseong = (counts['편관'] || 0) + (counts['정관'] || 0);
  const siksang = (counts['식신'] || 0) + (counts['상관'] || 0);
  const inseong = (counts['편인'] || 0) + (counts['정인'] || 0);

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 직업·적성을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [career] 마커 한 줄로 시작. 분량: 360~440자.

[확정 데이터]

▶ 격국
${gyeokguk.name}(${gyeokguk.type}) — 격국 특성: ${gyeokguk.traits.slice(0, 2).join(', ')}
격국 추천 직군: ${gyeokguk.careers.slice(0, 4).join(', ')}

▶ 용신
${yongSinElement}(${yongSin}) / 기둥 위치: ${yongsinPosStr}

▶ 신강신약 + 근무 형태
${result.strengthStatus} → ${orgType}

▶ 기둥별 십성 위치 (직업 핵심 십성 집중)
${sipseong}
관성 합계: ${gwanseong} / 식상 합계: ${siksang} / 인성 합계: ${inseong}

▶ 오행 결핍 (직업 제한 요소)
${Object.entries(result.elementPercent).filter(([, v]) => v === 0).map(([k]) => `${k}=0% → 해당 오행 직군 불리`).join(' / ') || '결핍 없음'}

▶ 천간 합·충 (직업 변화 요인)
${analyzeGanInteractions(result)}

▶ 시주 정보 (말년·커리어 후반)
${hourUnknown ? '미상' : `시간 ${pillars.hour.gan}(${pillars.hour.tenGodGan}) / 시지 ${pillars.hour.zhi}(${pillars.hour.tenGodZhi})`}

[작성 지침]
격국(${gyeokguk.name})과 용신(${yongSinElement})을 근거로 적합한 직군 4~5개를 구체적으로 제시하세요.
단순 직종 나열 금지 — 각 직군마다 "왜 이 격국·용신이 이 분야에 맞는가" 한 문장씩 근거를 다세요.
조직 내 역할(리더형·참모형·독립형)과 커리어 성장 패턴을 1~2문장으로 서술하세요.
피해야 할 직군 1~2개와 그 이유(결핍 오행 또는 기신 기준)를 명시하세요.
용신 오행(${yongSinElement})이 원국에 없다면 "어떤 환경에서 일해야 용신 기운을 채울 수 있는가"로 마무리.

[career]`;
};

// ─────────────────────────────────────────────
// [6/11] 재물운
// ─────────────────────────────────────────────
export const generateWealthSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, yongSinElement, giSin, hourUnknown } = result;

  // 재성 위치 (편재·정재)
  const allPillars = [
    { label: '년간', gan: pillars.year.gan, god: pillars.year.tenGodGan },
    { label: '년지', gan: pillars.year.zhi, god: pillars.year.tenGodZhi },
    { label: '월간', gan: pillars.month.gan, god: pillars.month.tenGodGan },
    { label: '월지', gan: pillars.month.zhi, god: pillars.month.tenGodZhi },
    { label: '일지', gan: pillars.day.zhi, god: pillars.day.tenGodZhi },
    ...(!hourUnknown ? [
      { label: '시간', gan: pillars.hour.gan, god: pillars.hour.tenGodGan },
      { label: '시지', gan: pillars.hour.zhi, god: pillars.hour.tenGodZhi },
    ] : []),
  ];
  const reseongPillars = allPillars.filter(p => p.god === '편재' || p.god === '정재');
  const reseongStr = reseongPillars.length > 0
    ? reseongPillars.map(p => `${p.label} ${p.gan}(${p.god})`).join(' · ')
    : '재성 없음 — 재물 인연이 약하거나 배우자 통해 재물 유입';

  // 재고
  const jaegoStr = checkJaeGo(result);

  // 신강신약 → 재물 스타일
  const wealthStyle = result.isStrong
    ? '적극적 재물 창출형 — 신강하여 재성을 직접 다루는 힘이 강함'
    : '의존·협력 재물형 — 신약하여 파트너·조직을 통한 재물 유입이 유리';

  // 천간합 재물 영향
  const ganInteraction = analyzeGanInteractions(result);

  // 지지합 재물 영향
  const reseongInteractions = result.interactions.filter(i =>
    reseongPillars.some(p => i.description.includes(p.gan))
  );

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 재물운을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [wealth] 마커 한 줄로 시작. 분량: 340~420자.

[확정 데이터]

▶ 재성 위치 (편재·정재)
${reseongStr}

▶ 재고(財庫) 유무
${jaegoStr}

▶ 신강신약 → 재물 운용 스타일
${wealthStyle}

▶ 신강신약 세부
${result.strengthStatus}(점수 ${result.strengthScore}) / 득령(${result.deukRyeong ? 'O' : 'X'}) 득지(${result.deukJi ? 'O' : 'X'}) 득세(${result.deukSe ? 'O' : 'X'})

▶ 용신·기신
용신: ${yongSinElement} / 기신: ${giSin}
용신 기둥 위치: ${findElementInGans(result, yongSinElement).join(', ') || '원국 내 없음'}

▶ 천간 합·충 (재물 변동 요인)
${ganInteraction}

▶ 재성 관련 지지 합·충
${reseongInteractions.length > 0 ? reseongInteractions.map(i => `${i.type}: ${i.description}`).join(' / ') : '없음'}

▶ 오행 분포
목${result.elementPercent.목}% 화${result.elementPercent.화}% 토${result.elementPercent.토}% 금${result.elementPercent.금}% 수${result.elementPercent.수}%

[작성 지침]
재성(편재·정재)의 위치(${reseongStr})와 강약을 근거로 돈 버는 스타일을 먼저 단정적으로 선언하세요.
월급형·사업형·투자형 중 어느 쪽이 유리한지 반드시 근거(십성·격국·신강신약)를 붙여 명시하세요.
재고(${jaegoStr.split('—')[0].trim()}) 여부로 재물 축적 능력을 1문장으로 서술하세요.
기신(${giSin}) 오행이 재물에 어떤 손재 패턴을 반복적으로 만드는지 구체적 상황 1가지로 묘사하고 예방법 1문장.
천간합이 있다면 그것이 재물 유입 또는 손실과 어떻게 연결되는지 언급하세요.

[wealth]`;
};

// ─────────────────────────────────────────────
// [7/11] 애정·결혼운
// ─────────────────────────────────────────────
export const generateLoveSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, gender, daeWoon, hourUnknown } = result;

  // 성별에 따라 배우자성 구분
  const spouseGod = gender === 'male' ? ['편재', '정재'] : ['편관', '정관'];
  const spouseLabel = gender === 'male' ? '재성(배우자)' : '관성(배우자)';

  const allPositions = [
    { label: '년간', god: pillars.year.tenGodGan, gan: pillars.year.gan },
    { label: '년지', god: pillars.year.tenGodZhi, gan: pillars.year.zhi },
    { label: '월간', god: pillars.month.tenGodGan, gan: pillars.month.gan },
    { label: '월지', god: pillars.month.tenGodZhi, gan: pillars.month.zhi },
    { label: '일지', god: pillars.day.tenGodZhi, gan: pillars.day.zhi },
    ...(!hourUnknown ? [
      { label: '시간', god: pillars.hour.tenGodGan, gan: pillars.hour.gan },
      { label: '시지', god: pillars.hour.tenGodZhi, gan: pillars.hour.zhi },
    ] : []),
  ];
  const spousePillars = allPositions.filter(p => spouseGod.includes(p.god));
  const spouseStr = spousePillars.length > 0
    ? spousePillars.map(p => `${p.label} ${p.gan}(${p.god})`).join(' · ')
    : `${spouseLabel} 없음 — 배우자 인연 약하거나 늦은 결혼 경향`;

  // 도화살 위치
  const dowhaSinsal = result.sinSals.filter(s => s.name.includes('도화'));
  const dowhaStr = dowhaSinsal.length > 0
    ? dowhaSinsal.map(s => s.name).join(', ')
    : '없음';

  // 식상 (애정 표현력)
  const counts = computeSipseongCounts(result);
  const siksangTotal = (counts['식신'] || 0) + (counts['상관'] || 0);

  // 유리한 대운 구간 (배우자성 오행 대운)
  const spouseEl = gender === 'male'
    ? EL_CON[STEM_ELEMENT[result.dayMaster] || ''] // 재성 오행
    : Object.entries(EL_CON).find(([, v]) => v === (STEM_ELEMENT[result.dayMaster] || ''))?.[0] || ''; // 관성 오행

  const loveBirthYear = result.solarDate ? new Date(result.solarDate).getFullYear() : 0;
  const favorableDaeWoon = daeWoon
    .filter(d => d.gan && d.zhi && (d.ganElement === spouseEl || d.zhiElement === spouseEl))
    .slice(0, 2)
    .map(d => {
      const as = loveBirthYear > 0 ? d.startAge - loveBirthYear : d.startAge;
      const ae = loveBirthYear > 0 ? d.endAge - loveBirthYear : d.endAge;
      return `${d.startAge}~${d.endAge}년(${as}~${ae}세) ${d.gan}${d.zhi}`;
    })
    .join(', ') || '대운표에서 해당 구간 미발견';

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 애정·결혼운을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [love] 마커 한 줄로 시작. 분량: 340~420자.

[확정 데이터]

▶ 성별
${gender === 'male' ? '남성' : '여성'} — ${spouseLabel} 기준 분석

▶ 배우자성 위치
${spouseStr}

▶ 일지 (배우자궁)
${pillars.day.zhi}(${pillars.day.zhiElement}) / 십성: ${pillars.day.tenGodZhi} / 12운성: ${pillars.day.twelveStage}
일지 지장간: ${pillars.day.hiddenStems.join('·') || '없음'}
일지 관련 합·충: ${getDayZhiInteractions(result)}

▶ 도화살 (이성 매력)
${dowhaStr}

▶ 식상 합계 (애정 표현력)
${siksangTotal > 0 ? `식상 ${siksangTotal}개 — 감정 표현 가능` : '식상 없음 — 감정 표현 서툴고 로맨틱 어필 약함'}

▶ 천간합 (애정 관계 변동)
${analyzeGanInteractions(result)}

▶ 유리한 대운 구간 (배우자성 오행 강화 시기)
${favorableDaeWoon}

▶ 합·충 전체
${result.interactions.length > 0 ? result.interactions.map(i => `${i.type}: ${i.description}`).join(' / ') : '없음'}

[작성 지침]
${spouseLabel}의 위치(${spouseStr})를 근거로 이 사람이 무의식적으로 끌리는 상대 유형을
"어떤 분위기·말투·에너지의 사람에게 반응하는가"로 구체적으로 묘사하세요.
일지 12운성(${pillars.day.twelveStage})이 배우자궁에 미치는 영향 1~2문장.
유리한 대운 구간(${favorableDaeWoon})을 언급하며 연애·결혼 기회가 어떻게 열리는지 서술하세요.
식상(${siksangTotal > 0 ? '있음' : '없음'})과 도화살(${dowhaStr}) 기준으로 사랑 표현 방식을 묘사하세요.
관계에서 반복되는 갈등 패턴 1개와 개선 포인트를 마지막에 제시하세요.

[love]`;
};

// ─────────────────────────────────────────────
// [8/11] 건강운
// ─────────────────────────────────────────────
export const generateHealthSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, elementPercent, giSin, hourUnknown } = result;

  // 결핍 오행 → 취약 장부
  const elEntries = Object.entries(elementPercent) as [string, number][];
  const weakEls = elEntries.filter(([, v]) => v <= 10).map(([k]) => k);
  const weakOrganStr = weakEls.length > 0
    ? weakEls.map(el => `${el}(결핍) → ${EL_ORGAN[el]} 취약`).join(' / ')
    : '뚜렷한 결핍 없음';

  // 충 받는 기둥 → 장부 약화
  const chungInteractions = result.interactions.filter(i => i.type === '충');
  const chungOrganStr = chungInteractions.length > 0
    ? chungInteractions.map(i => {
        const els = i.elements.map(e => BRANCH_ELEMENT[e] || STEM_ELEMENT[e] || e);
        return `${i.description} → ${els.map(el => EL_ORGAN[el] || el).join('·')} 주의`;
      }).join(' / ')
    : '지지충 없음';

  // 기둥별 12운성 (사·절·병 기둥)
  const stageWarning = [
    { label: '년주', stage: pillars.year.twelveStage },
    { label: '월주', stage: pillars.month.twelveStage },
    { label: '일주', stage: pillars.day.twelveStage },
    ...(!hourUnknown ? [{ label: '시주', stage: pillars.hour.twelveStage }] : []),
  ].filter(p => ['사', '절', '병', '묘'].includes(p.stage))
    .map(p => `${p.label} 12운성 ${p.stage} → 해당 시기 건강 주의`)
    .join(' / ') || '사·절·병 기둥 없음 — 건강 에너지 비교적 안정';

  // 기신 오행 → 건강 리스크
  const gisinOrgan = EL_ORGAN[giSin] || '';

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 건강운을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [health] 마커 한 줄로 시작. 분량: 300~370자.

[확정 데이터]

▶ 결핍 오행 → 취약 장부
${weakOrganStr}
(오행-장부: 목=간·담낭 / 화=심장·소장 / 토=비장·위장·췌장 / 금=폐·대장 / 수=신장·방광)

▶ 충 받는 오행 → 장부 약화
${chungOrganStr}

▶ 기둥별 12운성 건강 경고
${stageWarning}

▶ 기신(${giSin}) → 건강 리스크
기신 오행 ${giSin} → 관련 장부: ${gisinOrgan}
기신이 강해지는 계절·환경에서 이 장부 집중 관리 필요

▶ 신강신약
${result.strengthStatus} → ${result.isStrong ? '기운이 넘쳐 과로·번아웃 주의' : '기운 부족 → 면역력 관리, 과한 지출 주의'}

▶ 오행 분포
목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%

[작성 지침]
취약 장부(${weakOrganStr.split('→').slice(-1)[0]?.trim() || '없음'})를 먼저 명시하고,
스트레스 상황에서 그 장부가 실제로 어떤 증상으로 나타날 수 있는지 1~2가지 구체적으로 묘사하세요.
일상에서 챙겨야 할 습관 2가지(수면·식습관·운동 유형 중)와 하지 말아야 할 것 1가지를 제시하세요.
이 사주 기질이 만드는 건강 리스크(예: 신강 → 과로 번아웃, 신약 → 만성 피로) 1가지로 마무리하세요.

[health]`;
};

// ─────────────────────────────────────────────
// [9/11] 인간관계·가족
// ─────────────────────────────────────────────
export const generateRelationSectionPrompt = (result: SajuResult, name: string): string => {
  const { pillars, gender, yongSinElement, giSin, hourUnknown } = result;

  // 십성별 위치 전체
  const sipseong = getSipseongByPillar(result);

  // 인성(모친) 위치
  const allPos = [
    { label: '년간', god: pillars.year.tenGodGan, gan: pillars.year.gan },
    { label: '년지', god: pillars.year.tenGodZhi, gan: pillars.year.zhi },
    { label: '월간', god: pillars.month.tenGodGan, gan: pillars.month.gan },
    { label: '월지', god: pillars.month.tenGodZhi, gan: pillars.month.zhi },
    { label: '일지', god: pillars.day.tenGodZhi, gan: pillars.day.zhi },
    ...(!hourUnknown ? [
      { label: '시간', god: pillars.hour.tenGodGan, gan: pillars.hour.gan },
      { label: '시지', god: pillars.hour.tenGodZhi, gan: pillars.hour.zhi },
    ] : []),
  ];
  const inseongPos = allPos.filter(p => p.god === '정인' || p.god === '편인');
  const bijeopPos = allPos.filter(p => p.god === '비견' || p.god === '겁재');
  const siksangPos = allPos.filter(p => p.god === '식신' || p.god === '상관');
  const gwanseongPos = allPos.filter(p => p.god === '정관' || p.god === '편관');

  const inseongStr = inseongPos.length > 0
    ? inseongPos.map(p => `${p.label} ${p.gan}(${p.god})`).join(' · ')
    : '인성 없음 — 모친 인연 약하거나 독립적 성장';

  const bijeopStr = bijeopPos.length > 0
    ? bijeopPos.map(p => `${p.label} ${p.gan}(${p.god})`).join(' · ')
    : '비겁 약함 — 형제·경쟁자 인연 적음';

  // 자녀성 (남성=관성, 여성=식상)
  const childGod = gender === 'male' ? gwanseongPos : siksangPos;
  const childStr = childGod.length > 0
    ? childGod.map(p => `${p.label} ${p.gan}(${p.god})`).join(' · ')
    : '자녀성 약함 — 자녀 인연 적거나 늦음';

  // 용신 귀인 오행
  const yongsinEl = yongSinElement;

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 인간관계·가족운을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [relation] 마커 한 줄로 시작. 분량: 320~400자.

[확정 데이터]

▶ 기둥별 십성 전체
${sipseong}

▶ 인성 위치 (모친·학습)
${inseongStr}
${inseongPos.length >= 2 ? '→ 인성 과다: 모친 과보호·의존 패턴, 지식 집착 경향' : ''}

▶ 비겁 위치 (형제·경쟁자·동료)
${bijeopStr}

▶ 자녀성 위치 (${gender === 'male' ? '남성: 관성=자녀' : '여성: 식상=자녀'})
${childStr}

▶ 용신 귀인 오행
${yongsinEl} 기운 강한 사람이 귀인 — ${EL_DIR[yongsinEl]} 방향, ${yongsinEl} 오행 해당 띠(
목=인묘, 화=사오, 토=진술축미, 금=신유, 수=자해)

▶ 기신 주의 오행
${giSin} 기운 강한 사람 주의 — 겉은 친해도 에너지 소진 관계

▶ 합·충 (인간관계 변동)
${result.interactions.length > 0 ? result.interactions.map(i => `${i.type}: ${i.description}`).join(' / ') : '없음'}

▶ 신살 (인간관계)
${result.sinSals.length > 0 ? result.sinSals.map(s => s.name).join(', ') : '없음'}

[작성 지침]
비겁·식상·관성 배치로 본 인맥 형성 스타일을 "처음 만난 자리 행동"과 "오래 유지되는 관계 특징"으로 나눠 서술하세요.
인성(모친) 위치로 부모와의 관계 패턴 1문장, 자녀성으로 자녀 관계 특징 1문장을 각각 넣으세요.
용신(${yongsinEl}) 오행 귀인 유형과 기신(${giSin}) 오행 주의 인물 유형을 구체적으로(직업·성향·에너지) 제시하세요.
마지막에 이 사람이 가장 오래 지속하는 관계 유형과 이유를 1문장으로 정리하세요.

[relation]`;
};

// ─────────────────────────────────────────────
// [10/11] 대운·세운 흐름
// ─────────────────────────────────────────────
export const generateDaeunSectionPrompt = (result: SajuResult, name: string): string => {
  const { daeWoon, seWoon, yongSinElement, giSin } = result;

  // daeWoon.startAge/endAge 는 실제 "연도"(e.g. 2020)를 담고 있음 — 필드명 주의
  const birthYear = result.solarDate ? new Date(result.solarDate).getFullYear() : 0;
  const currentYear = new Date().getFullYear();
  const ageNow = birthYear > 0 ? currentYear - birthYear : 0;

  // 나이 표시 헬퍼: startAge(연도) → "2020~2029년(28~37세)"
  const fmtDW = (d: DaeWoon) => {
    const ageStart = birthYear > 0 ? d.startAge - birthYear : d.startAge;
    const ageEnd = birthYear > 0 ? d.endAge - birthYear : d.endAge;
    return `${d.startAge}~${d.endAge}년(${ageStart}~${ageEnd}세) ${d.gan}${d.zhi}(${d.ganElement}${d.zhiElement}·${d.tenGod}·${d.twelveStage})`;
  };
  const fmtDWShort = (d: DaeWoon) => {
    const ageStart = birthYear > 0 ? d.startAge - birthYear : d.startAge;
    const ageEnd = birthYear > 0 ? d.endAge - birthYear : d.endAge;
    return `${d.startAge}~${d.endAge}년(${ageStart}~${ageEnd}세) ${d.gan}${d.zhi}`;
  };

  // 현재 대운: startAge/endAge는 연도이므로 currentYear와 비교
  const currentDW = daeWoon.find(d => d.gan && d.zhi && currentYear >= d.startAge && currentYear <= d.endAge);
  const currentDWStr = currentDW ? fmtDW(currentDW) : '대운 시작 전';

  // 이전 대운
  const prevDW = currentDW
    ? daeWoon.find(d => d.gan && d.zhi && d.endAge === currentDW.startAge - 1)
    : null;
  const prevDWStr = prevDW ? fmtDW(prevDW) : '없음(초년 대운 이전)';

  // 다음 대운
  const nextDW = currentDW
    ? daeWoon.find(d => d.gan && d.zhi && d.startAge === currentDW.endAge + 1)
    : daeWoon.find(d => d.gan && d.zhi);
  const nextDWStr = nextDW ? fmtDW(nextDW) : '없음';

  // 대운 전체
  const daeWoonAll = daeWoon
    .filter(d => d.gan && d.zhi)
    .slice(0, 8)
    .map(d => fmtDW(d))
    .join(' | ');

  // 용신 유리·기신 불리 대운
  const favorDW = daeWoon
    .filter(d => d.gan && d.zhi && (d.ganElement === yongSinElement || d.zhiElement === yongSinElement))
    .slice(0, 1)
    .map(d => fmtDWShort(d))
    .join('') || '해당 구간 없음';
  const badDW = daeWoon
    .filter(d => d.gan && d.zhi && (d.ganElement === giSin || d.zhiElement === giSin))
    .slice(0, 1)
    .map(d => fmtDWShort(d))
    .join('') || '해당 구간 없음';
  const recentSW = seWoon
    .filter(s => s.year >= currentYear && s.year <= currentYear + 2)
    .map(s => `${s.year}년 ${s.gan}${s.zhi}(${s.ganElement}${s.zhiElement}·${s.tenGod}·${s.twelveStage})`)
    .join(' | ');

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 대운·세운 흐름을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [daeun] 마커 한 줄로 시작. 분량: 440~540자.

[확정 데이터]

▶ 현재 나이
${ageNow}세

▶ 현재 대운 (가장 중요)
${currentDWStr}

▶ 이전 대운 (과거에서 이월된 숙제)
${prevDWStr}

▶ 다음 대운 (다가올 관문)
${nextDWStr}

▶ 대운 전체 흐름 (8개)
${daeWoonAll}

▶ 용신(${yongSinElement}) 유리 대운
${favorDW}

▶ 기신(${giSin}) 조심 대운
${badDW}

▶ 세운 (올해~내후년)
${recentSW}

▶ 용신·기신
용신: ${yongSinElement} / 기신: ${giSin}

[작성 지침]
현재 대운(${currentDWStr})을 먼저 지목하고, 그 간지·오행·십성·12운성이
지금 이 나이대의 일·관계·재물에 어떻게 작용하는지 3~4문장으로 단정적으로 서술하세요.
이전 대운에서 이월된 숙제와 다음 대운의 관문을 각각 2~3문장으로 서술하세요.
세운 3년(올해·내년·내후년)을 각각 균형 있게 서술하세요 — 한 해만 길게 쓰지 마세요.
포맷 예: "올해(XXXX년 XX): 십성 XX가 들어오면서 ~ 국면. 구체적으로 어떤 행동이 유리/불리."
용신(${yongSinElement}) 유리 대운과 기신(${giSin}) 조심 대운을 각 1개씩 짚어주세요.

[daeun]`;
};

// ─────────────────────────────────────────────
// [11/11] 용신 처방
// ─────────────────────────────────────────────
export const generateAdviceSectionPrompt = (result: SajuResult, name: string): string => {
  const { yongSinElement, yongSin, heeSin, giSin } = result;

  const yongsinPos = findElementInGans(result, yongSinElement);
  const heeSinPos = findElementInGans(result, heeSin);

  return `당신은 사주명리 전문가입니다. 아래 확정 데이터를 바탕으로 "${name}" 님의 용신 처방을 작성하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [advice] 마커 한 줄로 시작. 분량: 260~340자.

[확정 데이터]

▶ 용신
${yongSinElement}(${yongSin}) / 원국 기둥 위치: ${yongsinPos.length > 0 ? yongsinPos.join(', ') : '없음 — 외부에서 채워야'}

▶ 희신
${heeSin} / 원국 기둥 위치: ${heeSinPos.length > 0 ? heeSinPos.join(', ') : '없음'}

▶ 기신
${giSin} — 회피 오행

▶ 용신(${yongSinElement}) 속성 처방
색상: ${EL_COLOR[yongSinElement]}
방위: ${EL_DIR[yongSinElement]}
숫자: ${EL_NUM[yongSinElement]}
계절: ${EL_SEASON[yongSinElement]}
식재료: ${EL_FOOD[yongSinElement]}
환경·취미: ${EL_ENV[yongSinElement]}

▶ 희신(${heeSin}) 방위
${EL_DIR[heeSin]} 방향 활용 권장

▶ 기신(${giSin}) 회피
색상: ${EL_COLOR[giSin]} 과다 피하기
방위: ${EL_DIR[giSin]} 방향 주의

[작성 지침]
용신(${yongSinElement})을 보강하는 색·방향·숫자·계절·식재료·직업환경을 항목별로 자연스럽게 문장에 녹여 쓰세요.
나열식 금지 — "용신 ${yongSinElement}의 기운은 ~에서 가장 잘 충전되며, ~이 삶에 활력을 줍니다" 흐름으로.
기신(${giSin}) 오행이 왜 독이 되는지 1문장 이유 설명 후 구체적 회피법 1문장.
마지막에 이번 달 안에 실천 가능한 구체 행동 3가지를 "- " 형식으로 제시하세요.

[advice]`;
};

// ============================================================
// 궁합 (관계별 독립 프롬프트)
// ============================================================

export type GunghapCategory =
  | 'secret_crush' // 짝사랑
  | 'som'          // 썸남/썸녀
  | 'lover'        // 연인
  | 'spouse'       // 배우자
  | 'ex_lover'     // 전여친/전남친
  | 'ex_spouse'    // 전남편/전아내
  | 'soulmate'     // 소울메이트
  | 'rival'        // 라이벌
  | 'friend'       // 친구
  | 'mentor'       // 멘토·멘티
  | 'parent_child' // 부모와 자녀
  | 'sibling'      // 형제/자매
  | 'work'         // 직장 동료
  | 'business'     // 사업 파트너
  | 'idol_fan'     // 아이돌과 팬
  | 'pet'          // 나와 반려동물
  | 'custom';      // 직접 입력

/** 두 사람 사주 공통 요약 블록 생성 */
function buildPersonBlock(result: SajuResult, name: string): string {
  const p = result.pillars;
  const lines = [
    `이름: ${name}`,
    `일주: ${p.day.gan}${p.day.zhi}(${p.day.ganElement}·${result.dayMasterYinYang}간) / 12운성: ${p.day.twelveStage}`,
    `오행: 목${result.elementPercent.목}% 화${result.elementPercent.화}% 토${result.elementPercent.토}% 금${result.elementPercent.금}% 수${result.elementPercent.수}%`,
    `신강신약: ${result.strengthStatus} / 용신: ${result.yongSinElement}(${result.yongSin}) / 기신: ${result.giSin}`,
    `격국: ${determineGyeokguk(result).name} / ${result.strengthStatus}`,
    `일지 합·충: ${result.interactions.filter(i => i.description.includes(p.day.zhi)).map(i => `${i.type}:${i.description}`).join(' / ') || '없음'}`,
  ];
  return lines.join('\n');
}

/** 두 일간 사이 오행 관계 */
function twoPersonElRelation(elA: string, elB: string): string {
  if (elA === elB) return '비화(같은 오행 — 공명·경쟁 공존)';
  if (EL_GEN[elA] === elB) return `A→B 상생(${elA}生${elB} — A가 B를 키움)`;
  if (EL_GEN[elB] === elA) return `B→A 상생(${elB}生${elA} — B가 A를 키움)`;
  if (EL_CON[elA] === elB) return `A→B 상극(${elA}克${elB} — A가 B를 제어·부담)`;
  if (EL_CON[elB] === elA) return `B→A 상극(${elB}克${elA} — B가 A를 제어·부담)`;
  return '무관계';
}

/** 일지 음양합 여부 (子丑·寅亥·卯戌·辰酉·巳申·午未) */
function checkEumYangHap(zhiA: string, zhiB: string): string {
  const pairs: [string, string][] = [
    ['자','축'], ['인','해'], ['묘','술'], ['진','유'], ['사','신'], ['오','미']
  ];
  const found = pairs.find(([a, b]) => (zhiA === a && zhiB === b) || (zhiA === b && zhiB === a));
  return found ? `일지 음양합(${found[0]}·${found[1]}) — 자연스럽게 당기는 인연` : '없음';
}

// ─────────────────────────────────────────────
// 연인·배우자 궁합
// ─────────────────────────────────────────────
export const generateLoverGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);
  const eumYangHap = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi);

  // 내가 상대 배우자성에 해당하는지 (남성 기준: 상대 여성의 관성=나 / 여성 기준: 상대 남성의 재성=나)
  const mySpouseCheck = (() => {
    if (other.gender === 'female') {
      // 상대(여) 관성 오행 = 상대 일간을 극하는 오행
      const otherGuanEl = Object.entries(EL_CON).find(([, v]) => v === other.pillars.day.ganElement)?.[0] || '';
      return myEl === otherGuanEl ? `${myName}의 오행(${myEl})이 ${otherName}의 관성 오행 — 배우자 인연 강함` : `배우자성 오행 불일치(관성 ${otherGuanEl} vs ${myName} ${myEl})`;
    } else {
      const otherJaeEl = EL_CON[other.pillars.day.ganElement] || '';
      return myEl === otherJaeEl ? `${myName}의 오행(${myEl})이 ${otherName}의 재성 오행 — 배우자 인연 강함` : `배우자성 오행 불일치(재성 ${otherJaeEl} vs ${myName} ${myEl})`;
    }
  })();

  return `당신은 사주명리 전문가입니다. 두 사람의 연인·배우자 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [lover_gunghap] 마커 한 줄로 시작. 분량: 440~540자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 배우자성 오행 대응
${mySpouseCheck}

▶ 두 사람 용신·기신 충돌 여부
${myName} 용신(${me.yongSinElement}) vs ${otherName} 기신(${other.giSin}): ${me.yongSinElement === other.giSin ? '충돌 — 에너지 소진 위험' : '충돌 없음'}
${otherName} 용신(${other.yongSinElement}) vs ${myName} 기신(${me.giSin}): ${other.yongSinElement === me.giSin ? '충돌 — 에너지 소진 위험' : '충돌 없음'}

[작성 지침]
두 일간 오행 관계(${elRel})에서 연애 역학 구조(누가 리드하고 누가 지지하는지)를 먼저 선언하세요.
일지 음양합(${eumYangHap})과 배우자성 오행 대응을 근거로 인연의 강도를 1~2문장으로 서술하세요.
두 사람의 용신·기신 충돌이 실제 연애에서 어떤 갈등 패턴으로 나타날지 구체 장면 1가지로 묘사하세요.
오행 보완 관계에서 서로에게 어떤 성장을 주는지 1문장, 주의해야 할 반복 패턴 1문장으로 마무리하세요.

[lover_gunghap]`;
};

// ─────────────────────────────────────────────
// 친구 궁합
// ─────────────────────────────────────────────
export const generateFriendGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  // 비겁 개수 (동류 에너지 공명 여부)
  const myBijeop = (computeSipseongCounts(me)['비견'] || 0) + (computeSipseongCounts(me)['겁재'] || 0);
  const otherBijeop = (computeSipseongCounts(other)['비견'] || 0) + (computeSipseongCounts(other)['겁재'] || 0);

  // 오행 보완 (결핍 오행 상호 충족)
  const myMissing = Object.entries(me.elementPercent).filter(([, v]) => v === 0).map(([k]) => k);
  const complement = myMissing.filter(el => other.elementPercent[el as keyof typeof other.elementPercent] > 20);
  const complementStr = complement.length > 0
    ? `${myName}의 결핍 오행(${complement.join('·')})을 ${otherName}이 채워줌 — 보완 관계`
    : '오행 결핍 상호보완 없음';

  return `당신은 사주명리 전문가입니다. 두 사람의 친구 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [friend_gunghap] 마커 한 줄로 시작. 분량: 380~460자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 비겁 에너지 (동류 공명)
${myName} 비겁: ${myBijeop}개 / ${otherName} 비겁: ${otherBijeop}개
${myBijeop + otherBijeop >= 4 ? '비겁 과다 — 경쟁·질투 주의, 이해관계 충돌 가능' : '비겁 적정 — 균형 잡힌 관계'}

▶ 오행 보완
${complementStr}

▶ 용신·기신 에너지
${myName} 용신: ${me.yongSinElement} / ${otherName} 용신: ${other.yongSinElement}
${me.yongSinElement === other.yongSinElement ? '동일 용신 — 같은 방향으로 함께 성장 가능' : '다른 용신 — 서로 다른 강점으로 보완 관계 형성 가능'}

[작성 지침]
일간 오행 관계(${elRel})를 근거로 두 사람이 함께 있을 때의 에너지 흐름을 "누가 활력을 주고 누가 안정을 주는지"로 묘사하세요.
오행 보완 관계를 실제 우정에서 어떻게 나타나는지(공부·취미·위기 상황에서 어떻게 도움이 되는지) 1~2가지 장면으로 서술하세요.
비겁 에너지 분석으로 경쟁 vs 협력의 밸런스를 1문장으로 짚고, 우정이 오래 유지되려면 무엇을 조심해야 하는지 마무리하세요.

[friend_gunghap]`;
};

// ─────────────────────────────────────────────
// 가족(부모자식) 궁합
// ─────────────────────────────────────────────
export const generateFamilyGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string,
  relation: string // '부모-자녀', '형제자매', '조부모-손자'
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  // 년주(조상·뿌리) 연결
  const yearRel = twoPersonElRelation(me.pillars.year.ganElement, other.pillars.year.ganElement);

  // 부모자식 관계에서의 십성 분석
  // 부모 입장: 자녀 = 남자는 관성, 여자는 식상
  // 자녀 입장: 부모 = 인성
  const parentChildAnalysis = (() => {
    const myCounts = computeSipseongCounts(me);
    const otherCounts = computeSipseongCounts(other);
    const myInseong = (myCounts['정인'] || 0) + (myCounts['편인'] || 0);
    const otherInseong = (otherCounts['정인'] || 0) + (otherCounts['편인'] || 0);
    return `${myName} 인성: ${myInseong}개 / ${otherName} 인성: ${otherInseong}개`;
  })();

  // 오행 세대 흐름
  const generationFlow = EL_GEN[myEl] === otherEl
    ? `${myEl}→${otherEl} 상생 흐름 — 윗 세대가 아랫 세대 에너지를 기름`
    : EL_GEN[otherEl] === myEl
    ? `${otherEl}→${myEl} 상생 흐름 — 아랫 세대 오행이 윗 세대를 보완`
    : elRel;

  return `당신은 사주명리 전문가입니다. 두 사람의 가족 궁합(${relation})을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [family_gunghap] 마커 한 줄로 시작. 분량: 380~460자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 관계 유형: ${relation}

▶ 일간 오행 관계 (세대 흐름)
${generationFlow}

▶ 년주 오행 연결 (뿌리·조상 기운)
${yearRel}

▶ 인성 분포 (양육·돌봄 에너지)
${parentChildAnalysis}

▶ 신강신약 상호작용
${myName}: ${me.strengthStatus} / ${otherName}: ${other.strengthStatus}
${me.isStrong && other.isStrong ? '두 사람 모두 신강 — 독립적, 주도권 갈등 주의' : !me.isStrong && !other.isStrong ? '두 사람 모두 신약 — 상호 의존, 외부 지원 중요' : '신강·신약 조합 — 한쪽이 리드·다른쪽이 지지하는 구조'}

[작성 지침]
${relation} 관계에서 오행 세대 흐름(${generationFlow})이 가족 역학에 어떤 구조를 만드는지 먼저 서술하세요.
신강·신약 조합에서 두 사람의 에너지 역할(누가 이끌고 누가 따르는지)을 가족 상황에 맞게 묘사하세요.
갈등이 생기는 구체 패턴 1가지와 관계를 강화하는 행동 처방 1가지로 마무리하세요.

[family_gunghap]`;
};

// ─────────────────────────────────────────────
// 직장동료 궁합
// ─────────────────────────────────────────────
export const generateWorkGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  // 관성·식상 비교 (업무 스타일)
  const myCounts = computeSipseongCounts(me);
  const otherCounts = computeSipseongCounts(other);
  const myGwan = (myCounts['정관'] || 0) + (myCounts['편관'] || 0);
  const otherGwan = (otherCounts['정관'] || 0) + (otherCounts['편관'] || 0);
  const mySiksang = (myCounts['식신'] || 0) + (myCounts['상관'] || 0);
  const otherSiksang = (otherCounts['식신'] || 0) + (otherCounts['상관'] || 0);

  const workStyleA = myGwan >= 2 ? '규칙·체계 중심형' : mySiksang >= 2 ? '아이디어·표현 주도형' : '유연 협력형';
  const workStyleB = otherGwan >= 2 ? '규칙·체계 중심형' : otherSiksang >= 2 ? '아이디어·표현 주도형' : '유연 협력형';

  // 격국 보완 (업무 역할 분담)
  const complementRoles = workStyleA === workStyleB
    ? '동일 스타일 — 같은 업무 방식, 협업 부드럽지만 맹점 공유'
    : `${workStyleA} + ${workStyleB} 조합 — 역할 분담 명확, 서로 보완 가능`;

  return `당신은 사주명리 전문가입니다. 두 사람의 직장동료 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [work_gunghap] 마커 한 줄로 시작. 분량: 380~460자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계 (업무 에너지)
${elRel}

▶ 업무 스타일
${myName}: 관성 ${myGwan}개·식상 ${mySiksang}개 → ${workStyleA}
${otherName}: 관성 ${otherGwan}개·식상 ${otherSiksang}개 → ${workStyleB}
조합: ${complementRoles}

▶ 신강신약 (업무 주도권)
${myName}: ${me.strengthStatus}(${me.isStrong ? '주도·독립 성향' : '협력·지원 성향'})
${otherName}: ${other.strengthStatus}(${other.isStrong ? '주도·독립 성향' : '협력·지원 성향'})

▶ 용신·기신 에너지 충돌
${me.yongSinElement === other.giSin ? `${myName} 용신이 ${otherName} 기신 — 업무 협력 시 에너지 소진 주의` : `용신·기신 충돌 없음 — 에너지 방해 적음`}

[작성 지침]
업무 스타일(${workStyleA} + ${workStyleB}) 조합이 프로젝트에서 어떻게 작동하는지 먼저 서술하세요.
일간 오행 관계(${elRel})가 회의·의사결정·갈등 상황에서 어떻게 나타나는지 구체 장면 1가지로 묘사하세요.
두 사람이 최대 시너지를 내는 업무 분담 방식 1가지와 주의해야 할 상황 1가지로 마무리하세요.

[work_gunghap]`;
};

// ─────────────────────────────────────────────
// 범용 인간관계 궁합
// ─────────────────────────────────────────────
export const generateGeneralGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string,
  relationLabel: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);
  const eumYangHap = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi);

  return `당신은 사주명리 전문가입니다. 두 사람의 인간관계 궁합(${relationLabel})을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [general_gunghap] 마커 한 줄로 시작. 분량: 360~440자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합·충
${eumYangHap}
일지 충: ${me.interactions.filter(i => i.type === '충' && i.description.includes(me.pillars.day.zhi)).length > 0 && other.interactions.filter(i => i.type === '충' && i.description.includes(other.pillars.day.zhi)).length > 0 ? '양쪽 일지에 충 — 내부 긴장 상태에서 만남, 상호 영향 큼' : '없음'}

▶ 용신·기신 에너지
${myName} 용신(${me.yongSinElement}) + ${otherName} 오행: 나에게 ${Object.entries(me.elementPercent).some(([k]) => k === other.pillars.day.ganElement && other.elementPercent[k as keyof typeof other.elementPercent] > 0) ? '도움' : '영향 미미'}
${other.yongSinElement === me.giSin ? `${otherName}의 용신이 ${myName}에게 기신 — 장기 관계 에너지 주의` : '에너지 충돌 없음'}

[작성 지침]
${relationLabel} 관계에서 두 오행(${myEl}·${otherEl}) 관계(${elRel})가 일상적 상호작용에 어떤 패턴을 만드는지 먼저 서술하세요.
서로에게 자연스럽게 끌리는 이유와 마찰이 생기는 이유를 각 1문장씩 제시하세요.
이 관계를 오래 유지하기 위한 핵심 조언 2가지로 마무리하세요.

[general_gunghap]`;
};

// ─────────────────────────────────────────────
// 역할 컨텍스트 삽입 헬퍼
// ─────────────────────────────────────────────
export function injectRoleContext(
  prompt: string,
  myName: string, myRole: string,
  otherName: string, otherRole: string
): string {
  if (!myRole.trim() && !otherRole.trim()) return prompt;
  const block = `\n▶ 두 사람의 역할 (이 역할 맥락을 반영하여 분석)\n${myName}: ${myRole.trim() || '미지정'} / ${otherName}: ${otherRole.trim() || '미지정'}\n`;
  return prompt.replace('[작성 지침]', block + '[작성 지침]');
}

// ─────────────────────────────────────────────
// 썸남/썸녀 궁합
// ─────────────────────────────────────────────
export const generateSomGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);
  const eumYangHap = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi);

  const attractionCheck = (() => {
    const male = me.gender === 'male' ? me : other;
    const female = me.gender === 'male' ? other : me;
    const maleName = me.gender === 'male' ? myName : otherName;
    const femaleName = me.gender === 'male' ? otherName : myName;
    const maleJaeEl = EL_CON[male.pillars.day.ganElement] || '';
    return maleJaeEl === female.pillars.day.ganElement
      ? `${maleName}의 재성 오행(${maleJaeEl})이 ${femaleName}의 일간 — 본능적 끌림 강함`
      : `재성 오행 불일치(재성 ${maleJaeEl} vs ${femaleName} ${female.pillars.day.ganElement}) — 감성으로 연결되는 인연`;
  })();

  const developmentCheck = me.yongSinElement === otherEl
    ? `${otherName}의 일간(${otherEl})이 ${myName}의 용신 — 만날수록 에너지 충전, 발전 가능성 높음`
    : other.yongSinElement === myEl
    ? `${myName}의 일간(${myEl})이 ${otherName}의 용신 — 상대도 나를 필요로 하는 관계`
    : '용신 직접 충족 없음 — 감정의 기복과 설렘의 지속성 점검 필요';

  return `당신은 사주명리 전문가입니다. 두 사람의 썸 관계 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [som_gunghap] 마커 한 줄로 시작. 분량: 420~520자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합 (본능적 당김)
${eumYangHap}

▶ 초기 끌림 분석
${attractionCheck}

▶ 관계 발전 가능성
${developmentCheck}

[작성 지침]
일지 음양합(${eumYangHap})과 초기 끌림 분석(${attractionCheck})으로 두 사람 사이 설렘의 명리적 근거를 먼저 서술하세요.
관계 발전 가능성(${developmentCheck})을 근거로 이 감정이 연애로 이어질 가능성을 1~2문장으로 서술하세요.
썸 단계에서 서로 조심해야 할 행동 패턴 1가지와 관계를 더 발전시킬 핵심 조언 1가지로 마무리하세요.

[som_gunghap]`;
};

// ─────────────────────────────────────────────
// 배우자 궁합
// ─────────────────────────────────────────────
export const generateSpouseGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);
  const eumYangHap = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi);

  const householdRole = me.isStrong && !other.isStrong
    ? `${myName}(신강) 주도 + ${otherName}(신약) 지지 — 의사결정 역할 명확`
    : !me.isStrong && other.isStrong
    ? `${otherName}(신강) 주도 + ${myName}(신약) 지지 — 역할 분담 자연스러움`
    : me.isStrong && other.isStrong
    ? '두 사람 모두 신강 — 주도권 마찰 주의, 각자 영역 분담 필요'
    : '두 사람 모두 신약 — 상호 의존 깊음, 외부 지원 함께 구하는 구조';

  const myCounts = computeSipseongCounts(me);
  const otherCounts = computeSipseongCounts(other);
  const myJaeseong = (myCounts['정재'] || 0) + (myCounts['편재'] || 0);
  const otherJaeseong = (otherCounts['정재'] || 0) + (otherCounts['편재'] || 0);
  const financeCheck = myJaeseong + otherJaeseong >= 4
    ? '두 사람 재성 합산 4개 이상 — 재물 집착 주의, 소비 방식 합의 필요'
    : myJaeseong + otherJaeseong === 0
    ? '재성 희박 — 경제 관리 의식적으로 체계화 필요'
    : '재성 균형 — 현실적 경제 감각을 공유하는 가정 꾸리기 가능';

  return `당신은 사주명리 전문가입니다. 두 사람의 배우자 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [spouse_gunghap] 마커 한 줄로 시작. 분량: 460~560자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합 (장기 안정감)
${eumYangHap}

▶ 가정 내 역할 분담
${householdRole}

▶ 경제 궁합
${myName} 재성: ${myJaeseong}개 / ${otherName} 재성: ${otherJaeseong}개 → ${financeCheck}

▶ 배우자성 오행 대응
${myName} 용신(${me.yongSinElement}) vs ${otherName} 기신(${other.giSin}): ${me.yongSinElement === other.giSin ? '충돌 — 장기 관계에서 에너지 소진 패턴 점검 필요' : '충돌 없음'}

[작성 지침]
가정 내 역할 분담(${householdRole})을 근거로 두 사람이 함께 사는 생활의 기본 구조를 먼저 서술하세요.
일지 음양합(${eumYangHap})과 오행 관계(${elRel})로 장기 동반자로서의 안정감과 긴장감을 1~2문장으로 서술하세요.
경제 궁합(${financeCheck})을 실제 가정 상황과 연결해 서술하고, 백년해로를 위한 핵심 처방 1가지로 마무리하세요.

[spouse_gunghap]`;
};

// ─────────────────────────────────────────────
// 전 연인·전 배우자 궁합
// ─────────────────────────────────────────────
export const generateExRelationGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string,
  label: string // '전여친/전남친' | '전남편/전아내'
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  const conflictCore = me.giSin === otherEl
    ? `${myName}에게 ${otherName}의 일간(${otherEl})은 기신 — 함께할수록 에너지 소진, 이별 구조 설명 가능`
    : other.giSin === myEl
    ? `${otherName}에게 ${myName}의 일간(${myEl})은 기신 — 상대방도 갈등 에너지 축적`
    : me.yongSinElement === otherEl
    ? `${otherName}의 일간(${otherEl})이 ${myName}의 용신 — 단기 끌림은 강했으나 지속 구조 불안정`
    : `명시적 기신 충돌 없음 — 오행 생극 외 다른 갈등 원인(합충·신살)에서 원인 찾기`;

  const reconnectCheck = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi) !== '없음'
    ? `일지 음양합 성립 — 감정적 재결합 인력 잔재, 재회 후 같은 패턴 반복 주의`
    : `일지 음양합 없음 — 재결합보다 각자 새 출발이 에너지 효율적`;

  return `당신은 사주명리 전문가입니다. 두 사람의 ${label} 관계 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [ex_gunghap] 마커 한 줄로 시작. 분량: 420~520자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 이별 에너지 분석 (갈등의 명리 구조)
${conflictCore}

▶ 재결합 인력 여부
${reconnectCheck}

▶ 두 사람 기신 충돌
${myName} 기신(${me.giSin}) vs ${otherName} 일간(${otherEl}): ${me.giSin === otherEl ? '직접 충돌 — 반복 마찰 패턴' : '직접 충돌 없음'}
${otherName} 기신(${other.giSin}) vs ${myName} 일간(${myEl}): ${other.giSin === myEl ? '직접 충돌 — 반복 마찰 패턴' : '직접 충돌 없음'}

[작성 지침]
이별 에너지 분석(${conflictCore})을 근거로 두 사람이 왜 헤어지게 됐는지 명리적 구조를 먼저 서술하세요.
재결합 인력(${reconnectCheck})을 솔직하게 평가하고 재회할 경우 반복될 갈등 패턴 1가지를 서술하세요.
감정 정리를 돕는 실용 조언 1가지로 마무리하세요.

[ex_gunghap]`;
};

// ─────────────────────────────────────────────
// 사업 파트너 궁합
// ─────────────────────────────────────────────
export const generateBusinessGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  const myCounts = computeSipseongCounts(me);
  const otherCounts = computeSipseongCounts(other);
  const myJae = (myCounts['정재'] || 0) + (myCounts['편재'] || 0);
  const otherJae = (otherCounts['정재'] || 0) + (otherCounts['편재'] || 0);
  const myGwan = (myCounts['정관'] || 0) + (myCounts['편관'] || 0);
  const otherGwan = (otherCounts['정관'] || 0) + (otherCounts['편관'] || 0);
  const mySiksang = (myCounts['식신'] || 0) + (myCounts['상관'] || 0);
  const otherSiksang = (otherCounts['식신'] || 0) + (otherCounts['상관'] || 0);

  const roleDiv = (() => {
    const myRole = mySiksang >= 2 ? '아이디어·기획 주도' : myGwan >= 2 ? '실행·관리 주도' : '유연 조율형';
    const otherRole = otherSiksang >= 2 ? '아이디어·기획 주도' : otherGwan >= 2 ? '실행·관리 주도' : '유연 조율형';
    return myRole === otherRole
      ? `두 사람 모두 ${myRole} — 같은 방향 강점, 맹점 공유 주의`
      : `${myName}: ${myRole} / ${otherName}: ${otherRole} — 역할 분담 명확, 시너지 가능`;
  })();

  const financeRisk = myJae + otherJae >= 5
    ? '재성 과다 — 단기 수익 집착, 장기 투자 소홀 경계'
    : myJae + otherJae === 0
    ? '재성 결핍 — 돈 관리 외부 전문가 위임 구조 필요'
    : `재성 합산 ${myJae + otherJae}개 — 현실 감각 갖춘 파트너십`;

  const trustCheck = me.yongSinElement === other.yongSinElement
    ? '같은 용신 — 사업 방향성 일치, 신뢰 기반 탄탄'
    : me.yongSinElement === other.giSin || other.yongSinElement === me.giSin
    ? '용신·기신 충돌 — 의사결정 갈등 시 에너지 소진 위험'
    : '용신 방향 다름 — 서로 다른 강점으로 보완, 정기 소통 중요';

  return `당신은 사주명리 전문가입니다. 두 사람의 사업 파트너 궁합을 해석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [business_gunghap] 마커 한 줄로 시작. 분량: 420~520자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계 (사업 에너지)
${elRel}

▶ 역할 분담 구조
${roleDiv}

▶ 금전 궁합
${myName} 재성: ${myJae}개 / ${otherName} 재성: ${otherJae}개 → ${financeRisk}

▶ 신뢰 에너지 (용신 방향성)
${trustCheck}

▶ 신강신약 (의사결정 주도권)
${myName}: ${me.strengthStatus}(${me.isStrong ? '독립적·주도 성향' : '협력·지원 성향'})
${otherName}: ${other.strengthStatus}(${other.isStrong ? '독립적·주도 성향' : '협력·지원 성향'})
${me.isStrong && other.isStrong ? '두 사람 모두 신강 — 주도권 충돌 위험, 의사결정 룰 명문화 필요' : ''}

[작성 지침]
역할 분담 구조(${roleDiv})를 근거로 두 사람의 사업 파트너십 강점을 먼저 서술하세요.
금전 궁합(${financeRisk})을 근거로 공동 자금 운용의 리스크와 장점을 1~2문장으로 서술하세요.
사업이 잘 풀리는 조건 1가지와 파트너십 붕괴를 막는 핵심 조언 1가지로 마무리하세요.

[business_gunghap]`;
};

// ─────────────────────────────────────────────
// 짝사랑 궁합
// ─────────────────────────────────────────────
export const generateSecretCrushGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);
  const eumYangHap = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi);

  // 나 → 상대방 끌림의 명리 근거
  const crushBasis = (() => {
    if (me.yongSinElement === otherEl) return `${otherName}의 일간(${otherEl})이 나의 용신 — 상대방이 내 에너지를 채워주는 구조, 끌림의 근거 강함`;
    if (EL_CON[me.pillars.day.ganElement] === otherEl) return `상대방 일간(${otherEl})이 나의 재성·관성 오행 — 이성적 끌림 오행 구조 성립`;
    return `직접 용신 충족 없음 — 오행 분위기나 신살에서 끌림 원인 찾기`;
  })();

  // 상대방이 나에게 마음이 생길 가능성
  const reciprocalCheck = (() => {
    if (other.yongSinElement === myEl) return `${myName}의 일간(${myEl})이 ${otherName}의 용신 — 상대방도 내게 에너지 보충 느낌, 상호 인식 가능성 있음`;
    if (EL_CON[other.pillars.day.ganElement] === myEl) return `${myName}의 오행이 ${otherName}의 재성·관성 — 상대방 눈에 매력적으로 보일 구조`;
    return `${otherName} 입장에서 나는 용신·배우자성 오행 아님 — 자연 발생보다 적극 어필이 필요한 구조`;
  })();

  return `당신은 사주명리 전문가입니다. 짝사랑 상황의 궁합을 해석하세요. ${myName}이 ${otherName}에게 마음이 있습니다.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [secret_crush_gunghap] 마커 한 줄로 시작. 분량: 420~520자.

[${myName} 사주 (마음을 가진 사람)]
${buildPersonBlock(me, myName)}

[${otherName} 사주 (마음을 받는 사람)]
${buildPersonBlock(other, otherName)}

▶ 끌림의 명리 구조
${crushBasis}

▶ 상호 인식 가능성
${reciprocalCheck}

▶ 일지 음양합 (본능적 당김)
${eumYangHap}

▶ 오행 관계
${elRel}

[작성 지침]
끌림의 명리 구조(${crushBasis})를 근거로 ${myName}이 왜 ${otherName}에게 마음이 생겼는지 설명하세요.
상호 인식 가능성(${reciprocalCheck})을 솔직하게 평가하고, ${otherName}이 ${myName}을 어떻게 바라보는지 사주 시각으로 묘사하세요.
고백 타이밍과 접근 방식에 대한 구체 조언 1~2가지로 마무리하세요.

[secret_crush_gunghap]`;
};

// ─────────────────────────────────────────────
// 소울메이트 궁합
// ─────────────────────────────────────────────
export const generateSoulmateGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);
  const eumYangHap = checkEumYangHap(me.pillars.day.zhi, other.pillars.day.zhi);

  const myMissing = Object.entries(me.elementPercent).filter(([, v]) => v === 0).map(([k]) => k);
  const otherMissing = Object.entries(other.elementPercent).filter(([, v]) => v === 0).map(([k]) => k);
  const complementEl = myMissing.filter(el => other.elementPercent[el as keyof typeof other.elementPercent] > 20);
  const complementElOther = otherMissing.filter(el => me.elementPercent[el as keyof typeof me.elementPercent] > 20);

  const soulmateEvidence = [
    eumYangHap !== '없음' ? `일지 음양합(${eumYangHap}) 성립` : null,
    me.yongSinElement === otherEl ? `${otherName}의 일간이 ${myName}의 용신` : null,
    other.yongSinElement === myEl ? `${myName}의 일간이 ${otherName}의 용신` : null,
    complementEl.length > 0 ? `${myName}의 결핍 오행(${complementEl.join('·')})을 ${otherName}이 보충` : null,
    complementElOther.length > 0 ? `${otherName}의 결핍 오행(${complementElOther.join('·')})을 ${myName}이 보충` : null,
  ].filter(Boolean);

  const evidenceStr = soulmateEvidence.length > 0
    ? soulmateEvidence.join(' / ')
    : '명시적 소울메이트 지표 없음 — 에너지 결핍 아닌 성장형 인연';

  return `당신은 사주명리 전문가입니다. 두 사람이 소울메이트인지 사주로 분석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [soulmate_gunghap] 마커 한 줄로 시작. 분량: 440~540자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 소울메이트 근거 지표
${evidenceStr}

▶ 일지 음양합
${eumYangHap}

▶ 오행 보완 구조
${myName} 결핍 오행: ${myMissing.join('·') || '없음'} / ${otherName} 결핍 오행: ${otherMissing.join('·') || '없음'}
${complementEl.length > 0 ? `상호 보완: ${myName}의 결핍(${complementEl.join('·')})을 ${otherName}이 채워줌` : '오행 결핍 상호보완 없음'}

▶ 오행 관계 (영혼의 공명)
${elRel}

[작성 지침]
소울메이트 근거 지표(${evidenceStr})를 토대로 두 사람이 왜 서로 "뭔지 모르게 통하는" 느낌인지 명리로 설명하세요.
오행 보완 구조로 두 사람이 서로에게 어떤 완성을 주는지 구체적으로 서술하세요.
이 인연이 소울메이트로 지속되려면 무엇을 지켜야 하는지 핵심 조언 2가지로 마무리하세요.

[soulmate_gunghap]`;
};

// ─────────────────────────────────────────────
// 라이벌 궁합
// ─────────────────────────────────────────────
export const generateRivalGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  const myCounts = computeSipseongCounts(me);
  const otherCounts = computeSipseongCounts(other);
  const myBijeop = (myCounts['비견'] || 0) + (myCounts['겁재'] || 0);
  const otherBijeop = (otherCounts['비견'] || 0) + (otherCounts['겁재'] || 0);
  const myGwan = (myCounts['정관'] || 0) + (myCounts['편관'] || 0);
  const otherGwan = (otherCounts['정관'] || 0) + (otherCounts['편관'] || 0);

  const rivalDynamic = myEl === otherEl
    ? '일간 동일 — 같은 기질과 방식, 서로를 거울처럼 자극하는 정통 라이벌'
    : EL_CON[myEl] === otherEl || EL_CON[otherEl] === myEl
    ? '일간 오행 상극 — 서로의 방식이 충돌하며 마찰에서 성장 에너지 생성'
    : '일간 상생 구조 — 경쟁 중에도 의도치 않게 서로를 키워주는 라이벌';

  const growthSynergy = me.strengthStatus === other.strengthStatus
    ? `두 사람 모두 ${me.strengthStatus} — 대등한 에너지, 진정한 라이벌 구도`
    : `${myName}(${me.strengthStatus}) vs ${otherName}(${other.strengthStatus}) — 강약 차이가 동기부여 격차로 이어질 수 있음`;

  const winLoseCheck = me.yongSinElement === otherEl
    ? `${otherName}의 기운이 ${myName}의 용신 — 라이벌이지만 상대가 나를 성장시키는 구조`
    : other.yongSinElement === myEl
    ? `${myName}의 기운이 ${otherName}의 용신 — 내가 상대를 자극해 성장시키는 구조`
    : me.giSin === otherEl
    ? `${otherName}의 오행이 ${myName}의 기신 — 이 라이벌 관계는 에너지를 소진시킬 수 있음, 건강한 거리 유지 필요`
    : '서로 직접적인 용신·기신 충돌 없음 — 건강한 경쟁 관계 가능';

  return `당신은 사주명리 전문가입니다. 두 사람의 라이벌 관계를 사주로 분석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [rival_gunghap] 마커 한 줄로 시작. 분량: 420~520자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 라이벌 역학 구조
${rivalDynamic}

▶ 에너지 균형
${growthSynergy}
비겁: ${myName} ${myBijeop}개 / ${otherName} ${otherBijeop}개 (비겁 과다 시 경쟁심 과열 위험)

▶ 성장·소진 여부
${winLoseCheck}

▶ 의지력·지속력 (관성)
${myName} 관성: ${myGwan}개 / ${otherName} 관성: ${otherGwan}개
${myGwan + otherGwan >= 4 ? '관성 강함 — 지는 것을 참지 못하는 기질, 과도한 경쟁으로 소진 주의' : '관성 적정 — 승패에 덜 집착, 과정 중심 경쟁 가능'}

[작성 지침]
라이벌 역학 구조(${rivalDynamic})로 두 사람이 어떤 방식으로 서로를 자극하는지 먼저 서술하세요.
성장·소진 여부(${winLoseCheck})를 근거로 이 라이벌 관계가 나에게 득인지 실인지 평가하세요.
상대를 라이벌로 활용해 최대 성장을 이끌어내는 전략 2가지로 마무리하세요.

[rival_gunghap]`;
};

// ─────────────────────────────────────────────
// 멘토·멘티 궁합
// ─────────────────────────────────────────────
export const generateMentorGunghapPrompt = (
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string => {
  const myEl = me.pillars.day.ganElement;
  const otherEl = other.pillars.day.ganElement;
  const elRel = twoPersonElRelation(myEl, otherEl);

  const myCounts = computeSipseongCounts(me);
  const otherCounts = computeSipseongCounts(other);
  const myInseong = (myCounts['정인'] || 0) + (myCounts['편인'] || 0);
  const otherInseong = (otherCounts['정인'] || 0) + (otherCounts['편인'] || 0);
  const mySiksang = (myCounts['식신'] || 0) + (myCounts['상관'] || 0);
  const otherSiksang = (otherCounts['식신'] || 0) + (otherCounts['상관'] || 0);

  const mentorStructure = (() => {
    if (EL_GEN[myEl] === otherEl) return `${myName}의 오행(${myEl})이 ${otherName}의 오행(${otherEl})을 생성 — 자연스러운 멘토(${myName}) → 멘티(${otherName}) 구조`;
    if (EL_GEN[otherEl] === myEl) return `${otherName}의 오행(${otherEl})이 ${myName}의 오행(${myEl})을 생성 — ${otherName}이 멘토, ${myName}이 배우는 구조`;
    return `오행 생성 구조 없음 — 역할 기반이 아닌 가치 공유형 멘토십`;
  })();

  const transmissionCheck = myInseong >= 2
    ? `${myName} 인성 ${myInseong}개 — 깊은 지식 전달 능력, 멘토 역할 적합`
    : otherInseong >= 2
    ? `${otherName} 인성 ${otherInseong}개 — 배움을 빠르게 흡수하는 구조`
    : '인성 적음 — 지식 전달보다 경험 공유 방식의 멘토십이 효과적';

  const creativityCheck = mySiksang + otherSiksang >= 3
    ? `식상 합산 ${mySiksang + otherSiksang}개 — 창의적 교류·아이디어 교환 활발, 서로 영감 주는 관계`
    : '식상 적음 — 실용·체계 중심 멘토십이 효과적';

  return `당신은 사주명리 전문가입니다. 두 사람의 멘토·멘티 관계를 사주로 분석하세요.

[절대 규칙]
- Markdown·이모지 금지. 불릿은 "- " 또는 "· " 만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 출력은 [mentor_gunghap] 마커 한 줄로 시작. 분량: 420~520자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 멘토·멘티 오행 구조
${mentorStructure}

▶ 지식 전달 역량
${transmissionCheck}

▶ 창의·영감 교류
${creativityCheck}

▶ 오행 관계
${elRel}

▶ 신강신약 (에너지 흐름)
${myName}: ${me.strengthStatus} / ${otherName}: ${other.strengthStatus}
${me.isStrong && !other.isStrong ? `${myName}(신강)이 ${otherName}(신약)을 이끄는 구조 — 자연스러운 멘토십 에너지` : !me.isStrong && other.isStrong ? `${otherName}(신강)이 ${myName}(신약)을 지지하는 구조` : '비슷한 신강신약 — 수평적 성장 파트너십'}

[작성 지침]
멘토·멘티 오행 구조(${mentorStructure})로 두 사람의 성장 관계가 어떤 방향으로 흐르는지 먼저 서술하세요.
지식 전달 역량과 창의·영감 교류를 근거로 어떤 방식의 배움이 가장 효과적인지 서술하세요.
멘토십 관계를 오래 유지하려면 두 사람이 각각 무엇을 조심해야 하는지 1가지씩 제시하세요.

[mentor_gunghap]`;
};
