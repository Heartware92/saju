/**
 * GPT 프롬프트 최적화 버전
 * 엽전 크레딧 시스템에 맞춘 무료/유료 구분
 */

import { SajuResult, TEN_GODS_MAP, STEM_ELEMENT, BRANCH_ELEMENT, normalizeGan, normalizeZhi, type SeWoon, type DaeWoon } from '../utils/sajuCalculator';
import { Solar } from 'lunar-javascript';
import { determineGyeokguk, analyzeGyeokgukStatus } from '../engine/gyeokguk';
import { getDayPillarTraits } from './gapjaTraits';
import type { TarotCardInfo } from '../services/api';
import type { TaekilResult, TaekilDay } from '../engine/taekil';
import {
  matchDreamSymbols,
  buildMatchedSymbolsBlock,
  DREAM_FRAMEWORK,
  REVERSE_DREAM_NOTES,
  DREAM_TYPE_CHECKLIST,
  CONTEXT_RULES,
  EMOTION_RULES,
} from './dreamSymbols';

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

[용신·희신·기신 표기 규칙 — 절대 준수]
- 용신·희신·기신을 본문에서 언급할 때 십성명(편재·정재·식신·상관·편관·정관·편인·정인·비견·겁재)만 단독으로 쓰지 마세요.
- 반드시 **오행 + 구체 천간**을 먼저 쓰고 십성은 괄호로 병기합니다.
  · 좋음: "용신인 화(병화·정화), 즉 편재가 들어오는 시기에는…"
  · 좋음: "기신 수(임수·계수)가 강해지면 — 십성으로는 편인·정인 — …"
  · 금지: "편재가 들어오는 시기에는…" (십성만 단독)
- 오행 → 천간 매핑: 목=갑목·을목 / 화=병화·정화 / 토=무토·기토 / 금=경금·신금 / 수=임수·계수.
- 같은 풀이 안에서 오행+천간 표기는 첫 등장 시 한 번만 풀고 이후엔 짧게 줄여 써도 됩니다(예: "병화의 시기").

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

// ============================================================
// 은유 지식베이스 — 모든 프롬프트에서 재사용
// ============================================================

/**
 * 은유 지식베이스 (Metaphor Knowledge Base)
 *
 * 모든 AI 해설 프롬프트가 공유해야 할 은유 어휘 사전.
 * 명리 개념을 자연·우주·계절 이미지로 번역해 독자가 "느낄 수 있는" 언어로 만든다.
 *
 * 적용처: 정통사주·신년운세·오늘의 운세·지정일·택일·토정비결·자미두수·궁합·상담소
 */
export const METAPHOR_KB = `[은유 지식베이스 — 반드시 활용]
아래 은유를 적극 활용해 명리 개념을 독자가 느낄 수 있는 언어로 번역합니다.

달·해·별·하늘 (핵심 명리 개념):
- 사주 원국 = 태어나는 순간 하늘에 새겨진 별자리 지도.
- 일간(본인) = 밤하늘의 별. 어떤 별인지가 사주의 핵심.
- 격국 = 내 별의 성격. 어떤 방식으로 빛을 발하는가를 결정합니다.
- 십성 = 내 별 주변을 도는 행성들. 각자 다른 역할로 균형을 맞춥니다.
- 신강 = 보름달. 빛이 꽉 차 주변을 환히 비춥니다.
- 신약 = 초승달. 아직 차오르지 않았지만 빛은 이미 있습니다.
- 중강 = 반달. 빛과 그림자가 공존하는 균형의 단계.
- 용신 = 북극성. 흐린 밤에도 사라지지 않는 방향의 기준별.
- 희신 = 안개 낀 날 희미하게 비치는 등불. 용신을 옆에서 돕는 간접 빛.
- 기신 = 달빛에 눌려 다른 별이 안 보이는 상태. 흐름을 막는 에너지.
- 구신 = 기신을 더욱 강하게 만드는 어둠. 최대한 거리를 둬야 합니다.
- 대운 = 달의 차고 기움. 10년 단위로 바뀌는 하늘의 계절.
- 세운 = 하루치 햇빛. 1년 단위로 하늘이 보내는 에너지 파동. 대운이라는 계절 안에서의 날씨.

빛과 어둠 (기운·상태):
- 내면의 열정 = 지평선 아래 숨어있다 터지는 새벽빛.
- 과다 오행 = 한 방향에서만 내리쬐는 햇빛. 반대편엔 짙은 그림자.
- 결핍 오행 = 구름에 가린 달. 없는 게 아니라 보이지 않는 것.
- 전환점·기회 = 황혼. 낮도 밤도 아닌, 하늘이 색을 바꾸는 순간.
- 잠재력 = 땅속 깊이 잠든 씨앗. 아직 보이지 않지만 이미 자라고 있습니다.
- 위기 = 일식. 달이 해를 가리는 순간, 빛이 잠시 사라집니다.
- 회복 = 구름 뒤에서 다시 나오는 달. 사라진 것이 아니었습니다.

사계절·하늘 (오행 직결):
- 목(木) = 봄 새벽 첫 햇살. 봄비. 성장을 재촉하는 집요한 힘.
- 화(火) = 한낮 정오의 태양. 내면에서 뿜어나오는 열정.
- 토(土) = 환절기 구름. 하늘과 땅 사이 중심을 잡습니다.
- 금(金) = 서리 내린 새벽. 차갑지만 선명합니다. 가을 달빛.
- 수(水) = 겨울 밤하늘 은하수. 고요하지만 무한히 깊습니다.

십성(十星) — 내 별 주변의 행성들:
- 비견(比肩) = 나란히 빛나는 쌍둥이 별. 경쟁하면서도 서로를 밝혀줍니다.
- 겁재(劫財) = 내 빛을 빼앗으려는 그림자 별. 충동적이지만 에너지 자체는 강렬합니다.
- 식신(食神) = 아침 햇살이 정원을 천천히 물들이는 풍요. 나눌수록 더 빛납니다.
- 상관(傷官) = 프리즘을 통과한 빛. 기존 색을 일곱 가지로 쪼개는 창의와 반항의 에너지.
- 편재(偏財) = 혜성. 예측 불가한 궤도, 강렬하고 자유로운 에너지.
- 정재(正財) = 달이 꾸준히 차오르는 과정. 느리지만 확실하게 쌓이는 빛의 축적.
- 편관(偏官) = 번개. 한순간 하늘을 가르는 강렬한 권위와 압박.
- 정관(正官) = 등대. 폭풍 속에서도 흔들리지 않고 방향을 알려주는 안정된 빛.
- 편인(偏印) = 홀로 먼 곳에서 빛나는 별. 가까이 다가가기 어렵지만 그만큼 독보적입니다.
- 정인(正印) = 보름달이 고요히 대지를 비추는 것. 넓은 범위를 지키는 지혜의 빛.

격국(格局) — 내 별의 성격:
- 식신격 = 새벽 정원에 번지는 햇살. 풍요와 여유가 자연스럽게 흘러들어옵니다.
- 상관격 = 프리즘을 통과한 빛. 기존 틀을 깨고 새로운 색을 만들어냅니다.
- 편재격 = 혜성의 궤도. 예측 불가하지만 지나간 자리에 선명한 흔적을 남깁니다.
- 정재격 = 달이 차오르는 과정. 차근차근 쌓아가는 것이 이 사주의 힘입니다.
- 편관격 = 번개를 품은 먹구름. 한 방향으로 집중되는 강력한 에너지.
- 정관격 = 등대. 사회 질서 안에서 흔들리지 않는 방향의 별.
- 편인격 = 가장 멀리, 홀로 빛나는 별. 독창성과 통찰이 강점이지만 고독하기도 합니다.
- 정인격 = 보름달. 지혜의 빛이 주변을 고요하게 감쌉니다.
- 건록격·양인격 = 보름달 두 개가 뜬 밤. 에너지가 넘치지만 방향을 잡아야 합니다.

합충형파해 — 별들의 관계:
- 합(合) = 두 별이 가까워져 빛이 섞이는 것. 성질이 변하며 새로운 색이 만들어집니다.
- 충(冲) = 두 별이 정반대에서 정면으로 마주 보는 것. 강한 충돌이지만 때론 필요한 자극.
- 형(刑) = 별들이 서로를 불편한 각도로 비추는 것. 크고 작은 마찰과 긴장이 생깁니다.
- 파(破) = 별의 궤도에 균열이 생기는 것. 관계나 계획이 예상치 못하게 흔들립니다.
- 해(害) = 별빛이 방해물에 가려지는 것. 보이지 않는 곳에서 걸림돌이 생깁니다.

12운성 — 별의 생애 단계:
- 장생(長生) = 막 떠오르는 초승달. 새로운 에너지의 시작.
- 목욕(沐浴) = 강물에 반사된 흔들리는 별빛. 아름답지만 아직 불안정합니다.
- 관대(冠帶) = 별이 제 자리를 찾아가는 과정. 성장과 준비의 시간.
- 건록(建祿) = 하늘 정중앙에 뜬 별. 가장 안정적이고 빛나는 위치.
- 제왕(帝旺) = 보름달이 가장 높이 뜬 순간. 에너지가 극대화됩니다.
- 쇠(衰) = 보름달이 지기 시작하는 순간. 안정 속 점진적 변화가 시작됩니다.
- 병(病) = 구름에 반쯤 가린 달. 에너지가 서서히 소모됩니다.
- 사(死) = 별이 지평선 아래로 지는 것. 한 사이클의 마무리.
- 묘(墓) = 땅 아래 잠든 씨앗. 겉은 고요하지만 안에 힘이 응축됩니다.
- 절(絶) = 별과 별 사이의 칠흑. 완전한 전환 직전의 비어있음.
- 태(胎) = 우주 깊은 곳의 성운. 새 별이 태어나기 직전의 원초적 에너지.
- 양(養) = 별이 형태를 갖춰가는 과정. 잠재력이 천천히 키워지는 시간.

신살 — 특별한 별빛:
- 천을귀인(天乙貴人) = 흐린 밤에도 유독 밝게 빛나는 행운의 별. 위기에서 귀인이 나타납니다.
- 문창귀인(文昌貴人) = 지식과 글의 별. 학문과 창작에서 특별한 빛을 발합니다.
- 도화살(桃花殺) = 꽃이 만개한 봄밤의 달빛. 사람을 끌어당기는 매력적 에너지.
- 역마살(驛馬殺) = 별똥별. 한 곳에 머물지 않고 끊임없이 이동하는 에너지.
- 공망(空亡) = 별자리가 비어있는 자리. 기대했던 빛이 오지 않는 공간. 물욕을 내려놓을수록 오히려 빛납니다.
- 원진(怨嗔) = 영원히 마주치지 않는 두 별. 안 만나면 그립고, 만나면 불편합니다.
- 백호살(白虎殺) = 번개가 친 직후의 하늘. 강렬하고 예측 불가한 에너지.
- 귀문관살(鬼門關殺) = 달도 없는 칠흑 같은 밤. 예민한 직관이 깨어나는 시간.
- 장성살(將星殺) = 밤하늘을 이끄는 가장 밝은 별. 리더십과 독립성의 상징.
- 반안살(攀鞍殺) = 고생 끝에 안장 위에 오른 별. 역경 후에 안정을 찾아가는 별.
- 양인살(羊刃殺) = 칼날처럼 예리한 별. 강한 승부욕과 결단력이 빛나지만, 그 날이 자신을 향하면 수술·사고로 연결됩니다.
- 괴강살(魁罡殺) = 하늘을 혼자 지배하는 북두칠성. 강렬한 카리스마와 리더십, 타협을 모르는 결단력이 특징입니다.
- 화개살(華蓋殺) = 홀로 빛나는 외로운 별. 종교·학문·예술의 재능이 뛰어나지만 군중보다 고독한 탐구를 선호합니다.
- 홍염살(紅艶殺) = 붉은 노을빛을 품은 별. 강렬한 이성 매력으로 사람을 끌어당기며, 연애와 결혼에 큰 영향을 줍니다.
- 현침살(懸針殺) = 바늘처럼 날카롭게 빛나는 별. 예리한 지성과 분석력, 섬세한 감수성이 강점이며 의료·법률·기술 분야에 유리합니다.
- 겁살(劫殺) = 갑자기 구름이 달을 가리는 것. 예상치 못한 재물 손실이나 도난 기운이 있어 방심 금물.
- 망신살(亡身殺) = 별빛이 엉뚱한 방향으로 흩어지는 것. 실수나 구설로 체면을 잃기 쉬운 기운, 언행 신중이 최선.
- 재살(災殺) = 하늘에서 갑자기 내리치는 번개. 갑작스러운 사고·재난의 기운이 있어 안전 주의가 필요합니다.
- 천살(天殺) = 높은 하늘에서 내려오는 차가운 서리. 하늘의 뜻에 저항하기 어려운 기운으로, 순리를 따르는 것이 상책.
- 월살(月殺) = 달빛이 방해를 받아 어두워지는 것. 시작한 일에 장애가 생기기 쉬운 기운, 새 사업·이사에 주의.
- 육해살(六害殺) = 두 별이 서로의 빛을 갉아먹는 것. 주변의 보이지 않는 방해나 시기를 주의해야 합니다.

전왕법(專旺法) — 흐름을 따라가는 용신:
- 전왕 = 한 방향의 물살이 너무 강해 막으면 터집니다. 흐름을 따라가는 것이 용신.
- 종강격(從强格): 극신강(85점↑) + 비겁·인성 65%↑ → 일간 오행 자체가 용신. 억부와 반대.
- 종아격(從兒格): 극신약(15점↓) + 식상 오행 65%↑ → 식상을 따라감. 재능·창의 방향으로 설명.
- 종재격(從財格): 극신약 + 재성 오행 65%↑ → 재성을 따라감. 돈과 현실에 순응하는 삶.
- 종살격(從殺格): 극신약 + 관살 오행 65%↑ → 관살을 따라감. 조직·권위에 순응하며 오히려 성공.
- ★전왕 표시가 있을 때: 반드시 전왕 맥락으로 해석. "억누르면 오히려 역효과" 관점 유지.
- 서술 팁: "거대한 강물을 막을 수 없을 때, 그 흐름을 타는 것이 지혜" 같은 은유 활용.

간여지동(干與支同) — 순수한 기둥의 빛:
- 간여지동 = 하늘(천간)과 땅(지지)이 같은 오행으로 물든 기둥. 에너지가 한 방향으로 순수하게 집중됩니다.
- 일주 간여지동(갑인·을묘·병오·경신·신유·임자·계해 등): 의지·고집·독립심 극대화. 자기 방식을 끝까지 밀어붙이는 힘.
- 월주 간여지동: 직업·사회 영역에서 전문성을 한 길로 고집하는 장인 기질.
- 년주 간여지동: 조상·가문의 오행 에너지가 순수하고 강하게 전해짐.
- 장점: 외부 합충에 흔들리기 어려운 순수성. 단점: 융통성 부족, 타협·조율이 어렵습니다.
- 서술 팁: "이 기둥에서 천간과 지지가 같은 빛으로 물들어" 같은 표현으로 자연스럽게 녹임.

병존(竝存)·삼존(三存) — 집중된 별빛의 과잉:
- 병존 = 같은 별이 두 개. 해당 십성 에너지가 2배로 증폭됩니다.
- 삼존 = 같은 별이 세 개. 원국 전체를 압도하는 에너지. 격국 판단 최우선 요소.
- 비견 병존: 경쟁심·독립심 과잉 → 동업·형제 갈등, 공동 재산 주의.
- 겁재 병존: 재물 유출 구조 → 의리형이나 과소비, 타인에게 퍼주는 경향.
- 식신 병존: 재능·향락·식복 풍부 → 집중력 분산, 너무 많은 것에 손댐.
- 상관 병존: 표현 욕구 극대화 → 직선 발언으로 갈등, 반골 기질 강함.
- 편재 병존: 여러 곳에 투자·지출 → 투기 주의, 돈이 크게 들어왔다 크게 나감.
- 정재 병존: 축재 욕구 강함 → 지나친 안전 추구로 기회 놓침.
- 편관 병존: 권력 압박·공격성 강화 → 구설·충돌, 독불장군 경향.
- 정관 병존: 원칙·책임 과잉 → 융통성 부족, 완벽주의.
- 편인 병존: 학문·예술 심취 → 고독·편향, 세상과 거리 둠.
- 정인 병존: 명예·공부 집착 → 의존성·수동성, 타인 평가에 민감.
- 서술 팁: 병존·삼존이 있으면 해당 십성 특성을 극단적으로 증폭해 서술. "같은 별이 두 개 떠오른 밤" 등 은유 활용.

지장간(支藏干) 3주기신(三柱氣神) 해석 규칙:
- 지장간 배열 순서: [정기(본기), 중기, 여기] — 왼쪽이 가장 강한 기운.
- 정기(본기): 해당 지지가 가진 핵심 에너지. 격국 판정의 기준이 되며 무게 약 50%. "가장 밝게 빛나는 별"로 서술.
- 중기: 정기를 보좌하는 2차 에너지. 무게 약 30%. "정기의 그림자 속에서 때를 기다리는 별"로 서술.
- 여기: 이전 절기에서 넘어온 잔여 에너지. 무게 약 20%. "물러가는 계절이 남긴 마지막 빛"으로 서술.
- 서술 팁: "인(寅)의 지장간 갑·병·무 중 갑(정기)이 이 기둥의 중심 에너지이며" 처럼 정기를 명시하고 나머지는 부연. 단, 월지 지장간이 천간에 투출(透出)된 경우 그 투출간이 격국의 핵심이 됨.`;

/**
 * 은유 제목 작성 규칙 — 모든 섹션·단락의 첫 줄에 은유 제목을 붙이는 공통 규칙.
 * 긴 정통사주 같은 다단락 출력에 적합. 상담소/오늘운세 같은 짧은 형식엔 간소화해서 쓸 것.
 */
export const METAPHOR_TITLE_RULE = `[제목 작성 기술]
각 섹션 첫 줄에 은유 제목을 씁니다.
형식: 대비되는 두 이미지를 쉼표로 연결 (「」 기호 없이 평문)
예: "서리 내린 새벽, 그 아래 피어나는 봄꽃" / "겨울 밤 은하수, 그 속에 숨은 여름 태양"
제목 은유를 본문 첫 문장·중간·마지막에 재등장시켜 회수합니다.`;

/**
 * 짧은 답변용 은유 가이드 — 상담소·오늘의 운세 등 500~900자 분량 프롬프트에 삽입.
 */
export const METAPHOR_SHORT_GUIDE = `[은유 활용]
명리 개념을 달·별·계절·빛 은유로 번역해 느낌으로 전달합니다.
예: 신강=보름달 / 신약=초승달 / 용신=북극성 / 기신=달빛에 눌린 별
사계절: 목=봄 햇살 / 화=정오 태양 / 토=환절기 구름 / 금=서리 새벽 / 수=겨울 은하수
답변 어딘가에 자연 이미지 1~2개를 녹여 독자의 감각에 와닿게 하세요.`;

// ── 간여지동·병존·삼존 포매터
const PILLAR_LABEL_KO: Record<string, string> = { year: '년주', month: '월주', day: '일주', hour: '시주' };

function formatGanYeojidong(result: SajuResult): string {
  const list = result.ganYeojidong;
  if (!list || list.length === 0) return '없음';
  return list.map(g => `${PILLAR_LABEL_KO[g.pillar]} ${g.gan}${g.zhi}(${g.element}오행 천지동일)`).join(' / ');
}

function formatByeongjOn(result: SajuResult): string {
  const list = result.byeongjOn;
  if (!list || list.length === 0) return '없음';
  return list.map(b =>
    `${b.gan}(${b.element}) ${b.count}개·${b.positions.join('·')} [${b.isSamjon ? '삼존' : '병존'}]`
  ).join(' / ');
}

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
격국: ${gyeokguk.name}${gyeokguk.nameHanja ? `(${gyeokguk.nameHanja})` : ''} — ${gyeokguk.type} (판정 근거: ${gyeokguk.reason})
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
1) 총 분량: 3300~4150자 (12개 섹션 — interaction 추가, luck 확장). 각 섹션 분량 명시대로 맞출 것.
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

  // 직원 피드백: 대운·세운·월운·일운 4개 층 모두 반영 — 월운(月運) 추가
  const [_y, _m, _d] = isoDate.split('-').map(Number);

  // 대운/세운은 isoDate 의 연도 기준으로 동적 선택
  // (이전엔 항상 new Date().getFullYear() 사용 → /saju/date 에서 다른 해 선택 시 어긋남)
  const pickedYear = _y;
  const curDW = daeWoon.find(d => d.gan && d.zhi && pickedYear >= d.startAge && pickedYear <= d.endAge);
  const daeWoonStr = curDW
    ? `${curDW.gan}${curDW.zhi}(${curDW.ganElement}${curDW.zhiElement}·${curDW.tenGod}·${curDW.twelveStage})`
    : '없음';

  const seWoon = result.seWoon.find(s => s.year === pickedYear) ?? result.currentSeWoon;
  const interStr = todayGz.interactions.length > 0 ? todayGz.interactions.join(' / ') : '없음';
  const monthSolar = Solar.fromYmd(_y, _m, _d);
  const monthLunar = monthSolar.getLunar();
  const monthGzStr = monthLunar.getMonthInGanZhi();   // "庚辰" 같은 한자 간지
  const _mGan = normalizeGan(monthGzStr[0]);
  const _mZhi = normalizeZhi(monthGzStr[1]);
  const _mTenGod = TEN_GODS_MAP[result.dayMaster]?.[_mGan] ?? '';
  const _mGanEl = STEM_ELEMENT[_mGan] ?? '';
  const _mZhiEl = BRANCH_ELEMENT[_mZhi] ?? '';
  const monthRunStr = `${_mGan}${_mZhi}(${_mGanEl}${_mZhiEl}${_mTenGod ? `·${_mTenGod}` : ''})`;

  const dateLabel = (() => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  })();

  return `[내 원국]
일간: ${pillars.day.gan}(${pillars.day.ganElement}) / 일주: ${pillars.day.gan}${pillars.day.zhi}
오행: 목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}% ${missingEl}
용신: ${yongSinElement} / ${isStrong ? '신강' : '신약'}
간여지동: ${formatGanYeojidong(result)} / 병존·삼존: ${formatByeongjOn(result)}

[운기 4개 층 — 모두 본문에서 활용]
대운(10년): ${daeWoonStr}
세운(올해): ${seWoon.gan}${seWoon.zhi}(${seWoon.ganElement}${seWoon.zhiElement}·${seWoon.tenGod})
월운(이번 달): ${monthRunStr}
일운(오늘 일진): ${todayGz.gan}${todayGz.zhi}(${todayGz.hanja}) — ${todayGz.ganElement}·${todayGz.zhiElement} / 천간 십성 ${todayGz.tenGodGan} / 지지 십성 ${todayGz.tenGodZhi}
일진×원국 합충: ${interStr}

[오늘 날짜] ${dateLabel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 절대 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1) Markdown 절대 금지. 이모지 전부 금지.
2) 각 섹션 분량 지침 준수. 총 700~900자 (4개 층 모두 다루므로 분량 확장).
3) ★ 핵심 — 본문 전체에서 「대운·세운·월운·일진」 4개 층의 영향을 모두 활용해야 한다.
   · today_energy: 4개 층이 어떻게 겹쳐 오늘의 기운을 만드는지 명시
   · today_work / today_love: 일진 + 월운(이번 달 흐름) 조합
   · today_caution: 일진 합충 + 세운/대운과의 충돌 신호
   · today_lucky: 용신 기운 + 오늘에 맞춘 처방
4) 오늘 하루에만 적용되는 구체 조언. "장기적으로는~" 일반론 금지.
5) 일진 십성·합충이 주는 영향을 근거로 제시. 근거 없는 단순 격려 금지.
6) 금지 표현: "운이 좋은 날" "모든 일이 잘 풀립니다" "대형 사고" — 구체 상황+이유로 대체.
7) 출력은 [today_energy] 마커부터 시작. 마커 이전 텍스트 없어야 함.
8) 아래 5개 마커를 정확히 사용. 마커는 줄 처음에 단독으로 위치.

${METAPHOR_SHORT_GUIDE}

[은유 제목 규칙 — 각 섹션 공통]
- 각 섹션은 [key] 마커 바로 다음 줄(빈 줄 없이)에 **은유 제목 1줄**을 먼저 씁니다.
- 제목 형식: 대비되는 두 자연 이미지를 쉼표로 연결 (「」 괄호 금지, 평문).
  예: "안개 낀 새벽, 천천히 떠오르는 해" / "갈라진 구름 사이 빛나는 별"
- 제목 다음 빈 줄 없이 바로 본문 시작.
- 본문 첫 문장·마지막 문장에 제목 은유를 자연스럽게 재등장시켜 회수.

[today_energy] — 130~180자 (은유 제목 별도, 본문 분량만)
첫 줄: 은유 제목 (오늘 기운의 핵심 성질을 자연 이미지 대비로)
본문: 「대운(${daeWoonStr.split('(')[0]}) → 세운(${seWoon.gan}${seWoon.zhi}) → 월운(${_mGan}${_mZhi}) → 일진(${todayGz.gan}${todayGz.zhi})」 4개 층이 겹쳐 만드는 오늘의 기운을 1~2문장으로 단정적으로 짚는다. 그 다음 오늘 어떤 상황에서 유리·불리한지 각 1개 구체적으로. 오늘 하루 키워드 1개로 마무리.

[today_work] — 180~240자
첫 줄: 은유 제목 (일·집중의 결을 자연 이미지 대비로)
본문: 일진(${todayGz.gan}${todayGz.zhi}) + 월운(${_mGan}${_mZhi}) 조합이 오늘의 업무에 어떻게 작용하는지 1문장. 집중이 잘 되는 업무 유형과 막히는 유형을 구체적으로. 오늘 하면 좋은 행동 1개(회의·기획·제출·연락·협상·계약 중 + 구체적 이유). 피해야 할 행동 1개(구체 상황 + 이유). 오늘 가장 생산적인 시간대 1구간.

[today_love] — 130~170자
첫 줄: 은유 제목 (관계 온도·흐름을 자연 이미지 대비로)
본문: 오늘 일진 십성(${todayGz.tenGodGan}) 기준으로 잘 통하는 관계 유형과 마찰이 생기기 쉬운 관계 유형 각 1개. 조심할 말투·상황 1가지(구체 예시 포함). 연인·가족·동료 중 오늘 특히 신경 써야 할 관계 1가지와 실천할 행동 1가지.

[today_caution] — 110~150자
첫 줄: 은유 제목 (오늘의 함정·빈틈을 자연 이미지로)
본문: 오늘 합충(${interStr})에서 생기는 실수 유발 상황 1가지를 구체적 장면으로. 특히 조심해야 할 시간대·감정 상태·물리적 환경 중 1개 선택해 구체화. 이미 벌어졌을 때 대처 방법 1문장.

[today_lucky] — 130~180자
첫 줄: 은유 제목 (오늘의 개운 방향을 자연 이미지로)
본문: 용신(${yongSinElement}) 기운을 오늘 하루 극대화하는 맞춤 처방.
색상·방위·숫자·시간대는 UI에 이미 표시되므로 중복 서술 금지.
아래 3가지를 구체적으로:
- 오늘 특히 효과적인 보강 음식·음료 1가지 (맛·색·효능 설명)
- 오늘 기운을 높이는 구체적 행동 1가지 (언제·어떻게·어디서 구체적으로)
- 오늘 피해야 할 환경·감정·상황 1가지 (이유 포함)

출력은 [today_energy] 마커부터 시작. 마커 이전 텍스트 없어야 함.`;
};

/**
 * 정통사주 종합 리포트 프롬프트
 * - 원국 전체 분석: 격국·용신·성격·직업·재물·애정·건강·인간관계·대운·처방
 * - 12개 섹션, [key] 구분자 출력 (interaction = 합·충·형·파·해)
 */
export const JUNGTONGSAJU_SECTION_KEYS = [
  'general', 'daymaster', 'element', 'interaction', 'character', 'career', 'wealth', 'love', 'health', 'relation', 'luck', 'advice'
] as const;
export type JungtongsajuSectionKey = typeof JUNGTONGSAJU_SECTION_KEYS[number];

export const JUNGTONGSAJU_SECTION_LABELS: Record<JungtongsajuSectionKey, string> = {
  general:     '사주 총론',
  daymaster:   '일주 해석',
  element:     '오행 분포',
  interaction: '합·충·형·파·해',
  character:   '성격·기질',
  career:      '직업·적성',
  wealth:      '재물운',
  love:        '애정·결혼운',
  health:      '건강운',
  relation:    '인간관계·가족',
  luck:        '대운·세운 흐름',
  advice:      '용신 처방',
};

/** 오행 → "ㅇㅇ·ㅇㅇ" 천간 텍스트 (프롬프트에서 ${...} 보간용) */
const ELEMENT_TO_STEMS_TEXT: Record<string, string> = {
  '목': '갑목·을목', '화': '병화·정화', '토': '무토·기토',
  '금': '경금·신금', '수': '임수·계수',
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

  const validDaeWoons = daeWoon.filter(d => d.gan && d.zhi);
  const currentDaeWoonIdx = validDaeWoons.findIndex(d => currentYear >= d.startAge && currentYear <= d.endAge);
  const currentDaeWoon = currentDaeWoonIdx >= 0 ? validDaeWoons[currentDaeWoonIdx] : undefined;
  const currentDaeWoonStr = currentDaeWoon ? fmtDWJT(currentDaeWoon) : '대운 시작 전';
  // 직원 피드백: 과거·현재·미래 대운 흐름 입체적 노출 — [luck] 섹션 본문에 활용
  const prevDaeWoon = currentDaeWoonIdx > 0 ? validDaeWoons[currentDaeWoonIdx - 1] : undefined;
  const nextDaeWoon = currentDaeWoonIdx >= 0 && currentDaeWoonIdx + 1 < validDaeWoons.length
    ? validDaeWoons[currentDaeWoonIdx + 1]
    : undefined;
  const nextNextDaeWoon = currentDaeWoonIdx >= 0 && currentDaeWoonIdx + 2 < validDaeWoons.length
    ? validDaeWoons[currentDaeWoonIdx + 2]
    : undefined;
  const prevDaeWoonStr = prevDaeWoon ? fmtDWJT(prevDaeWoon) : '없음(현재가 첫 대운)';
  const nextDaeWoonStr = nextDaeWoon ? fmtDWJT(nextDaeWoon) : '없음(데이터 범위 끝)';
  const nextNextDaeWoonStr = nextNextDaeWoon ? fmtDWJT(nextNextDaeWoon) : '없음';
  // 향후 5년 세운 (올해 포함) — 작성 지침에서 한 줄씩 짚도록
  const recentSeWoon = seWoon
    .filter(s => s.year >= currentYear && s.year <= currentYear + 4)
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
용신: ${yongSinElement}(${yongSin})  희신: ${result.heeSin}  기신: ${result.giSin}${result.strengthScore >= 85 || result.strengthScore <= 15 ? `  ★전왕법 적용(점수 ${result.strengthScore}) — 억부 역전 주의` : ''}
격국: ${gyeokguk.name} (판정 근거: ${gyeokguk.reason})
십성 분포: ${sipseong}
신살·길성: ${sinSalStr}
합충형파해: ${interactionStr}
간여지동: ${formatGanYeojidong(result)}
병존·삼존: ${formatByeongjOn(result)}
성별: ${gender === 'male' ? '남성' : '여성'}
현재 나이(계산): ${ageNow}세
이전 대운(과거): ${prevDaeWoonStr}
현재 대운: ${currentDaeWoonStr}
다음 대운(미래): ${nextDaeWoonStr}
차차기 대운(미래): ${nextNextDaeWoonStr}
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
9) 아래 12개 마커를 정확히 사용. 마커는 줄 처음에 단독으로 위치.

${METAPHOR_KB}

${METAPHOR_TITLE_RULE}

[섹션 지침]

[general] — 540~650자
작성 순서:
첫 줄: 은유 제목 (위 제목 기술 참고, 「」 없이 평문으로)
빈 줄
본문:
1단락: 제목 은유를 풀어 격국(${gyeokguk.name})이 이 사람의 삶을 어떤 방향으로 이끄는지 단정적으로 선언. 은유로 시작해 명리 근거로 착지.
2단락: 격국이 빛나는 구체 일상 장면 1개 (직업 선택 순간 / 아이디어가 터지는 순간 / 위기에서 빛나는 순간 중 선택).
3단락: ${result.strengthStatus}(신강신약)이 에너지를 증폭·제어하는 방식. 반달·보름달·초승달 은유 활용.
4단락: 용신(${yongSinElement})이 인간관계·직업·건강 중 1개 국면에서 구체 장면으로 작용하는 방식.
5단락: 오행 특징(결핍: ${zeroElements.join('·') || '없음'} / 과다: ${maxEl[0]} ${maxEl[1]}%) → 실행력·사고패턴에 미치는 영향 1~2문장.
마지막 문장: 제목 은유 회수하여 압축.
540자 미만이면 장면 묘사를 더 구체적으로 늘려서 반드시 채울 것.

[daymaster] — 380~460자
작성 순서:
첫 줄: 은유 제목 (일주 ${pillars.day.gan}${pillars.day.zhi}의 양면 — 겉으로 드러나는 기질과 내면의 본모습을 대비하는 이미지 두 개, 쉼표로 연결)
빈 줄
본문: 제목 은유로 시작해 일주 ${pillars.day.gan}${pillars.day.zhi}(${dayTraits?.hanja ?? ''})의 고유한 에너지를 "이 일주를 타고난 사람은 ~한 방식으로 세상을 경험한다"는 관점에서 서술. DB에 주어진 키워드(${dayTraits?.keywords?.join(', ') ?? ''})를 개별 나열하지 말고 이야기 흐름 속에 녹여 쓴다. 이 일주가 강점을 발휘하는 전형적 장면 1개와 오히려 발목을 잡는 패턴 1개를 각각 구체적 상황으로 묘사. 특수신살(${dayTraits?.sinsal?.join(', ') || '없음'})이 있다면 그 실생활 의미를 1~2문장으로 풀 것. 마지막 문장에서 제목 은유를 회수해 일주의 핵심을 압축.

[element] — 360~440자
작성 순서:
첫 줄: 은유 제목 (오행 과다·결핍을 빛과 그림자·계절 이미지로 대비. 예: "한쪽에서만 쏟아지는 햇살, 반대편의 짙은 그늘" / "구름에 가린 봄비, 그래도 땅 아래 뿌리는 자란다")
빈 줄
본문: 제목 은유로 시작해 오행 분포(목${elementPercent.목}% 화${elementPercent.화}% 토${elementPercent.토}% 금${elementPercent.금}% 수${elementPercent.수}%)를 "어떤 삶의 장면에서 어떻게 느껴지는가"로 풀어 쓴다. 사계절·하늘 은유(목=봄 새벽 햇살, 화=정오 태양, 토=환절기 구름, 금=서리 새벽, 수=겨울 은하수)를 활용해 각 오행의 질감을 묘사. 결핍 오행(${zeroElements.join('·') || '없음'})이 야기하는 구체적 생활 패턴 약점 2가지와 일상에서 보완할 실용 방법 1가지. 과다 오행(${maxEl[0]} ${maxEl[1]}%)의 편향성이 실제로 드러나는 장면 1개. 마지막 문장에서 제목 은유 회수.

[interaction] — 360~440자
작성 순서:
첫 줄: 은유 제목 (지지 사이의 합/충/형/파/해 관계를 자연 현상이나 인간관계 구도로 비유. 예: "두 별자리가 손을 맞잡는 자리, 한쪽에서 부딪히는 별똥별" / "물과 불이 한 그릇에 담긴 균형, 갑작스레 쏟아지는 순간")
빈 줄
본문 작성 지침:
- 입력 데이터의 "합충형파해: ${interactionStr}" 필드에 나오는 모든 관계를 빠짐없이 본문에서 한 번 이상 명시한다(예: "월지 ${pillars.month.zhi}와 일지 ${pillars.day.zhi}의 인사형(寅巳刑)은…"). 빈 칸 없으면 "특별한 충돌·결합 없이 안정적 구조"라고 단정.
- 합(三合·六合): 어떤 에너지가 결합해 어떤 강점을 만드는지 + 그 결합이 인생에서 발현되는 장면 1개.
- 충(沖): 어떤 두 기둥이 부딪히고 그 충돌이 일상에서 어떤 갈등 패턴으로 나타나는지 + 충을 완화하는 행동 1가지.
- 형(刑): 자형·삼형·상형 중 어떤 유형인지 명시 + 그 형이 만드는 내적 긴장이나 외부 사건의 결.
- 파(破)·해(害): 미묘한 마찰 패턴이 어떤 관계에서 반복적으로 등장하는지.
- 본문 전체에서 "합/충/형/파/해" 한자어를 그대로 쓰되 처음 등장 시 괄호로 쉬운 말 병기(예: "충(서로 부딪힘)").
- 마지막 문장에서 제목 은유 회수.

[character] — 440~520자
작성 순서:
첫 줄: 은유 제목 (낯선 자리에서의 모습과 가까워진 뒤 본모습을 대비하는 이미지. 예: "서리 내린 새벽의 고요함, 정오가 되면 터지는 열기" / "흐린 날의 반달, 맑은 밤엔 보름달")
빈 줄
본문: 제목 은유로 시작해 일간 ${pillars.day.gan}(${pillars.day.ganElement}) + 격국(${gyeokguk.name}) + 십성 분포 상위 2개를 합산한 타고난 성향 서술. "이 사람이 낯선 환경에서 처음 보이는 모습"과 "친해진 뒤 드러나는 본모습"을 구분해 각각 2~3문장 묘사. 강점(타인이 인정하는 것) 2가지와 그림자(자신도 모르게 반복하는 약점) 2가지를 균형 있게 서술. "이 기질이 삶의 어떤 선택에서 반복적으로 나타나는가" 1문장 정리. 마지막 문장에서 제목 은유 회수.

[career] — 420~500자
작성 순서:
첫 줄: 은유 제목 (타고난 적성의 빛나는 면과 맞지 않는 환경의 대비. 예: "북극성이 이끄는 항로, 역풍이 부는 방향" / "봄 새벽 햇살이 닿는 토양, 그늘 속에선 말라버리는 씨앗")
빈 줄
본문: 제목 은유로 시작해 격국(${gyeokguk.name})과 용신(${yongSinElement})을 근거로 적합한 직군 4~5개를 구체적으로(예: "IT 개발 중에서도 백엔드·시스템 설계 분야") 제시. "왜 이 격국·용신을 가진 사람에게 이 분야가 맞는가"를 한 문장씩 근거로 달 것. 조직 내 역할(리더형·참모형·독립형 중 선택)과 커리어 성장 패턴 1~2문장. 피해야 할 직군 또는 환경 1~2개와 이유. 마지막 문장에서 제목 은유 회수.

[wealth] — 400~480자
작성 순서:
첫 줄: 은유 제목 (재물이 모이는 방식과 새는 패턴을 빛·물·계절로 대비. 예: "혜성처럼 들어오는 돈, 모래 위 물처럼 새는 돈" / "꾸준히 차오르는 달빛, 한순간 흘러넘치는 만조")
빈 줄
본문: 제목 은유로 시작해 재성(편재·정재) 강약과 재고 포함 여부를 근거로 이 사주가 돈을 어떻게 버는 스타일인지 판단. 월급형·사업형·투자형 중 어느 쪽이 유리한지 근거와 함께 단정적으로 서술. 돈이 잘 새는 패턴 또는 꾸준히 쌓이는 스타일인지 서술. 반복적으로 빠지게 되는 금전 함정 1가지를 구체적 상황으로 묘사하고 예방법 1문장. 마지막 문장에서 제목 은유 회수.

[love] — 400~480자
작성 순서:
첫 줄: 은유 제목 (끌리는 상대의 온도·에너지와 관계에서 반복되는 패턴을 대비. 예: "정오의 태양에 이끌리는 겨울 별, 그러나 녹아버릴까 두렵다" / "봄비에 피어나는 꽃, 가을 서리에 흔들리는 잎")
빈 줄
본문: 제목 은유로 시작해 관성(여성)·재성(남성) 강약과 위치를 바탕으로 무의식적으로 끌리는 상대 유형 묘사. "어떤 분위기의 사람에게 반응하는가"를 행동·말투·에너지 수준에서 구체적으로 서술. 일지 12운성이 배우자궁에 미치는 영향 1~2문장. 유리한 대운 구간에서 연애·결혼 기회가 열리는 방식. 관계에서 반복되는 갈등 패턴 1개와 개선 포인트. 마지막 문장에서 제목 은유 회수.

[health] — 340~420자
작성 순서:
첫 줄: 은유 제목 (강한 오행과 취약한 오행을 계절·빛으로 대비. 예: "금(金)의 냉기가 지배하는 몸, 화(火)의 온기가 필요한 곳" / "과다한 햇빛에 타들어가는 잎, 물이 닿으면 살아납니다")
빈 줄
본문: 제목 은유로 시작해 약한 오행·충을 받은 오행 기준으로 취약한 장부 먼저 명시(목=간담, 화=심장·소장, 토=비위·췌장, 금=폐·대장, 수=신장·방광). 그 취약 장부가 스트레스 상황에서 실제로 나타나는 증상 1~2가지 구체적 묘사. 일상에서 챙겨야 할 습관 2가지와 하지 말아야 할 것 1가지. 이 사주 기질이 만드는 건강 리스크 1가지. 마지막 문장에서 제목 은유 회수.

[relation] — 360~440자
작성 순서:
첫 줄: 은유 제목 (넓은 인맥과 깊은 관계, 또는 귀인과 멀리해야 할 유형을 대비. 예: "별자리처럼 넓게 펼쳐진 인맥, 북극성 같은 단 한 사람" / "밝은 낮에 스치는 인연, 흐린 밤에 빛나는 귀인")
빈 줄
본문: 제목 은유로 시작해 비겁·식상·관성 배치로 본 인맥 형성 스타일 구체적으로. "처음 만난 자리에서 어떻게 행동하는가"와 "어떤 관계에서 오래 유지되는가"를 분리해 서술. 부모 관계(인성·관성 근거)·자녀 관계(식상 근거) 특징 각 1문장. 의지하면 좋은 사람 유형 1개와 거리를 두어야 하는 유형 1개를 십성 근거로 제시. 마지막 문장에서 제목 은유 회수.

[luck] — 720~880자 (대운 흐름 전체를 입체적으로 다루므로 분량 확장)
작성 순서:
첫 줄: 은유 제목 (대운 흐름의 과거·현재·미래를 달의 차고 기움·계절 전환으로 대비. 예: "황혼이 지나면 열리는 별밤, 지금은 색을 바꾸는 하늘" / "반달에서 보름달로, 그리고 다시 그믐으로 향하는 길")
빈 줄
본문은 아래 4단락 구조를 반드시 지킨다:

[1단락 — 과거 대운 회고] 100~150자
이전 대운 (${prevDaeWoonStr})이 어떤 시기였는지 한 문장으로 요약하고, 그 시기에 형성된 기반·해결되지 못한 과제 한 가지를 단정적으로 짚는다. 첫 대운이라 이전 대운이 없으면 "대운 시작 전 청소년기는 사주 원국이 그대로 발현되던 잠재기"라고 처리한다.

[2단락 — 현재 대운 본론] 320~400자
제목 은유로 시작해 현재 대운(${currentDaeWoonStr})을 선언. 그 대운의 간지·오행·십성·12운성이 일·관계·재물 각각에 구체적으로 어떤 영향을 주는지 4~5문장으로 서술. 어떤 조건에서 유리/불리한지 쪼갤 것. 향후 5년 세운(${recentSeWoon})에서 5개 연도 각각을 한 줄씩 "YYYY년 OO(간지·십성)은 ~한 흐름이 들어와 ~을 우선해야 한다" 형식으로 짚는다 (5줄 모두 필수).

[3단락 — 미래 대운 예고] 200~250자
다음 대운(${nextDaeWoonStr})이 시작되면 어떤 국면이 열리는지 2~3문장으로 명시 + 그 대운에서 가장 중요한 준비 한 가지를 지금부터 무엇으로 시작해야 하는지 1문장. 차차기 대운(${nextNextDaeWoonStr})까지 데이터가 있으면 "그 다음 대운에선 ~한 흐름이 이어진다"고 한 줄로 예고. 데이터 끝이면 "그 너머는 본 사주 데이터 범위 밖"이라고 명시.

[4단락 — 마무리] 50자 내외
제목 은유 회수 + "대운은 10년 단위로 바뀌는 하늘의 계절"임을 한 줄로 정리.

[advice] — 구조화 포맷 필수 (파싱에 사용됩니다)
반드시 아래 순서와 형식을 정확히 지킵니다.

첫 줄: 은유 제목 (용신 오행의 개운 방향을 자연 이미지로. 예: "북극성이 가리키는 동쪽, 봄 햇살이 기다리는 곳" / "서리를 녹이는 것은 불꽃이 아니라 봄비")
빈 줄
시간대: (하루 중 유리한 1구간, 예: 오전 6시~9시)
음식: (용신 ${yongSinElement} 오행 보강 식재료 2개, 쉼표로 구분, 예: 부추, 시금치)
빈 줄
(본문 2~3문장: 제목 은유로 시작해 용신 ${yongSinElement} 보강의 의미와 일상 적용을 서술.
 ★ 본문 안에서 용신을 인용할 때는 반드시 「${yongSinElement}」 + 그 오행의 두 천간(목=갑목·을목, 화=병화·정화, 토=무토·기토, 금=경금·신금, 수=임수·계수) 을 우선 표기하고 십성(${yongSin})은 괄호로만 병기합니다. 예: "용신인 ${yongSinElement}(${ELEMENT_TO_STEMS_TEXT[yongSinElement] ?? '해당 천간'}), 즉 ${yongSin}이 들어오는 시기에는…")
빈 줄
이번 달 실천:
- (구체 행동 1 — 오늘·이번 주 단위, 추상 격언 금지)
- (구체 행동 2)
- (구체 행동 3)

마지막 문장에서 제목 은유를 회수합니다.
색·방향은 별도 UI로 표시되므로 본문에서 언급하지 않아도 됩니다.

출력은 [general] 마커부터 시작. 마커 이전 텍스트 없어야 함.`;
};

/**
 * 기간 운세 영역별 상세 (신년/오늘/지정일 공통)
 * - 사주 원국 + 대상 기간 간지 + 엔진이 계산한 도메인 점수를 프롬프트에 주입
 * - 5개 영역(재물·직업·애정·건강·학업)에 대해 각 7문장 분석 생성 (직원 피드백)
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
1) 위 5개 영역 각각에 대해 정확히 7문장 설명을 작성합니다.
   (직원 피드백: 지정일 운세 콘텐츠 깊이 부족 — 5문장 → 7문장 확장)
2) 각 영역 설명은 다음 구조로:
   - 1문장: 대상 기간 간지(${opts.targetGanZhi})와 일간(${pillars.day.gan})의 십성·용신 관계 — 현재 기운의 자리
   - 2문장: 이 기운이 해당 영역에서 구체적으로 어떻게 드러나는지 (구체 장면)
   - 3문장: 유리한 시간대 또는 조건 1가지 명시 (오전/오후/저녁 + 어떤 행동)
   - 4문장: 함께 있으면 도움 되는 사람 유형 또는 환경 1가지
   - 5문장: 조심할 함정 (구체적 상황/실수)
   - 6문장: 실천 가능한 구체 행동 1가지 (오늘 안 시작 가능)
   - 7문장: 이 날의 핵심을 한 줄로 압축 (격언 X, 단정형)
3) 점수가 높으면 낙관, 낮으면 비관으로 단순화하지 말고, 어떤 조건에서 유리/불리한지로 쪼개 서술합니다.
4) 일상 장면으로 내려앉혀 서술 (회의·연락·구매·식사·운동 등). 추상적 격언 금지.
5) 출력 형식은 반드시 아래 델리미터를 사용합니다. 다른 머리말·설명·요약 금지.

${METAPHOR_SHORT_GUIDE}

[wealth]
(재물 7문장 — 위 1~7문장 구조 준수)

[career]
(직업 7문장 — 위 1~7문장 구조 준수)

[love]
(애정 7문장 — 위 1~7문장 구조 준수)

[health]
(건강 7문장 — 위 1~7문장 구조 준수)

[study]
(학업 7문장 — 위 1~7문장 구조 준수)`;
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
  // 직원 피드백: 상단 시각 카드("연간 행운 처방")와 라벨 통일 — 역할 = 텍스트 추천
  lucky: '행운 처방',
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
  const sipseongCounts = computeSipseongCounts(result);
  const sipseong = formatSipseongCounts(sipseongCounts);
  // 직원 피드백: 사주에 없는 십성(예: 편관 0개)이 본문에 등장하는 오류 방지.
  // 0개 십성 목록을 명시 + 작성 규칙에서 해당 십성 사용 금지 강제.
  const ALL_SIPSEONG = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'] as const;
  const missingSipseongList = ALL_SIPSEONG.filter(s => (sipseongCounts[s] ?? 0) === 0);
  const missingSipseongStr = missingSipseongList.length > 0 ? missingSipseongList.join(', ') : '없음(모든 십성이 1개 이상 분포)';
  // 세운으로 들어오는 십성은 별도 — 본문에서 "올해 들어오는 ~십성"으로만 사용 가능
  const seWoonTenGod = seWoon.tenGod;

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
격국: ${gyeokguk.name} (판정 근거: ${gyeokguk.reason})
십성 분포: ${sipseong}
★ 원국에 0개인 십성: ${missingSipseongStr}
   → 본문에서 이 십성을 "사주에 ~십성이 강하다/있다"고 서술하면 절대 안 됨.
   → 단 세운 천간 십성(${seWoonTenGod})은 "올해 ~이 들어온다"로 사용 허용.
간여지동: ${formatGanYeojidong(result)} / 병존·삼존: ${formatByeongjOn(result)}
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
10) ★ 데이터 무결성 — 위 "원국에 0개인 십성" 목록의 십성을 본문에서 "사주에 있다/강하다/약하다" 형태로 서술 절대 금지.
    예시 금지: "당신 사주의 편관이 강해…" / "정관이 부족한 사주라…"
    (단 세운으로 들어오는 ${seWoonTenGod}는 "올해 ${seWoonTenGod}(쉬운말)이 들어와…"로 사용 가능)
11) [lucky] 섹션은 색상·방위·숫자·시간대를 본문에 절대 적지 말 것. 별도 시각 카드(LuckyVisualCard)에 이미 표시되므로 텍스트 중복 금지.

${METAPHOR_KB}

${METAPHOR_TITLE_RULE}

[섹션별 지침]

[general]
${year}년 전체 기조 — 320~430자
첫 줄: 이 해 전체를 관통하는 은유적 제목(7~12자) 1줄.
세운 ${seWoon.gan}${seWoon.zhi}이 일간 ${pillars.day.gan}에 ${seWoon.tenGod}으로 작용하는 구체적 의미 1단락. 대운 흐름과 겹쳐 어떤 국면(도약기·축적기·전환기·수성기)인지 명확히 판정. 이 해에 가장 도드라지는 축(재물·직장·관계·건강) 중 2가지를 선정해 왜 그런지 설명. 올 한 해 핵심 주제 문장 1개로 마무리.

[wealth]
재물운 — 280~360자
첫 줄: 재물운을 상징하는 은유적 제목(7~12자) 1줄.
세운 십성(${seWoon.tenGod})과 용신(${yongSinElement})의 관계로 수입이 들어오는 경로·시기 1단락. 지출 위험 구간과 조심할 금전 결정 1가지 구체적으로. 재테크 방향 1가지(주식·부동산·저축·사업 중 어떤 방향이 유리한지). 엔진 점수 ${wealthDomain?.score ?? '?'}점(${wealthDomain?.grade ?? '?'}) 방향성 유지.

[career]
직장·사업운 — 280~360자
첫 줄: 커리어 기운을 상징하는 은유적 제목(7~12자) 1줄.
직장인과 사업자를 구분해 각각 1~2문장씩 풀이. 세운과 원국의 관성·재성 관계로 승진·이직·계약·파트너십 중 유리한 것 명시. 결정 내리기 좋은 월 1~2개 구체 명시 (월별 흐름 참고). 조심할 직장 내 함정 1가지.

[love]
연애·결혼운 — 280~360자
첫 줄: 인연·관계 기운을 상징하는 은유적 제목(7~12자) 1줄.
기혼자와 미혼자를 구분해 각각 핵심 기운 1단락씩. 이 해 가장 좋은 인연 시기를 월별 흐름 참고해 구체 월로 명시. 관계 갈등이 생기기 쉬운 패턴 1가지와 해소 방향. 사랑·결혼 결정을 내리기 좋은 조건 1가지.

[health]
건강운 — 220~290자
첫 줄: 건강 기운을 상징하는 은유적 제목(7~12자) 1줄.
오행 분포와 세운 오행으로 취약 장부 판단 (구체 장부명 명시). 이 해 특히 주의할 건강 위험 계절·시기 1개. 일상에서 챙겨야 할 구체 습관 2가지 (음식·운동·수면·환경 중). "이 해의 건강 함정" — 가장 조심해야 할 생활 패턴 1가지.

[relation]
인간관계운 — 220~290자
첫 줄: 인간관계 기운을 상징하는 은유적 제목(7~12자) 1줄.
비겁·식상·관성 배치로 본 ${year}년 인간관계 전반적 기운. 의지할 관계 유형 1가지 (구체적 직업·성격 유형). 멀리해야 할 관계 유형 1가지 (왜 그런지 이유 포함). 이 해 특별히 도움이 되는 인연 특징 1가지.

[monthly]
월별 흐름 — 총 720~900자, 각 월 60~75자(3~4문장)
1월부터 12월까지 순서대로. 위 월별 등급·키워드를 근거로 각 월의 핵심 기운을 충실히 서술.
각 월에 다음 4가지를 모두 포함:
1) 그 달 핵심 기운 (1문장 — 등급·키워드 풀이)
2) 들어오는 십성 또는 오행이 일상에서 어떻게 나타나는지 (1~2문장 — 직장/관계/재물 중 하나의 구체 장면)
3) 우선해야 할 행동 1개 (1문장 — 시작·결정·휴식·관망 중 어느 하나)
4) 조심할 함정 또는 놓치기 쉬운 것 (선택, 등급에 따라 강도 조절)
포맷 예시:
"1월(중길·축적): 새해 시작은 정관이 들어와 직장에서 안정된 흐름이 열린다.
 작년 미뤄둔 정리부터 차근히 마무리하면 신뢰가 쌓인다.
 큰 결정보다는 다음 달 도약을 위한 기반 다지기에 집중할 것."

[lucky]
행운 처방 — 280~360자, 텍스트 본문만 (시각 카드는 별도 컴포넌트로 자동 표시됨)
첫 줄: ${year}년을 관통하는 행운 테마를 은유적 제목(7~12자) 1줄.
빈 줄 후 본문 — 용신(${yongSinElement}) 기준 불릿(- ) 형식, 색상·방위·숫자·시간대 언급 절대 금지:
- 보강 음식 2가지 (구체적 식재료·요리명 + 왜 도움이 되는지 한 마디)
- 추천 향기·아로마 1가지 (언제 사용하면 좋은지)
- ${year}년 개운 활동 2가지 (용신 오행 원소와 연결된 구체 취미·습관)
- 보석·소품 1가지 (어떻게 활용하면 좋은지)
- 이 해 특히 길한 계절·달 (이유 1문장)

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

// 자미두수 결과 섹션 키 — 결과 페이지에서 파싱해 카드별 렌더
export const ZAMIDUSU_SECTION_KEYS = [
  'overview',     // 명반 첫 인상 (은유 헤드라인 + 명주·신주·오행국 요약)
  'core',         // 명궁·신궁 핵심 (주인공별)
  'relations',    // 부처·자녀·형제·노복·부모 (5개 관계궁 묶음)
  'wealth',       // 재백·관록·전택 (3개 재물·일 묶음)
  'body_mind',    // 질액·복덕·천이 (3개 몸·마음·이동 묶음)
  'mutagen',      // 사화
  'daehan',       // 대한 흐름
  'advice',       // 마지막 조언
] as const;
export type ZamidusuSectionKey = typeof ZAMIDUSU_SECTION_KEYS[number];

export const ZAMIDUSU_SECTION_LABELS: Record<ZamidusuSectionKey, string> = {
  overview:  '첫 인상',
  core:      '주인공 별',
  relations: '관계 하늘',
  wealth:    '재물·일의 하늘',
  body_mind: '몸과 마음의 하늘',
  mutagen:   '사화 — 별의 변주',
  daehan:    '대한 — 10년 리듬',
  advice:    '별이 건네는 조언',
};

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

  return `당신은 자미두수(紫微斗數) 전문가입니다. 아래 명반을 바탕으로 ${z.gender === '남' ? '한 남성' : '한 여성'}의 인생 별자리를 읽어줍니다.

[의뢰인 명반 기본 정보]
양력 생년월일: ${z.solarDate} ${z.timeRange}(${z.time}) / 음력: ${z.lunarDate} / 간지: ${z.chineseDate}
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
[자미두수 전용 은유 — 반드시 활용]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

자미두수는 **하늘의 별자리 지도**로 인생을 읽는 법입니다. 다음 은유를 자연스럽게 본문에 녹여 쓰세요:
- 명반(命盤) = 태어날 때 하늘에 새겨진 나만의 별자리 지도
- 12궁(十二宮) = 인생이라는 집의 12개 방 — 각 방마다 다른 영역을 주관
- 주성(主星) = 각 방의 주인공 별. 그 방의 성격을 결정
- 보좌성(輔星) = 주인공 옆에서 돕는 별 (좌보·우필 등)
- 자미(紫微) = 황제별 — 왕좌에 앉은 사람
- 천기(天機) = 지혜의 별 — 참모·책사
- 무곡(武曲) = 장수별 — 결단과 재물
- 염정(廉貞)·탐랑(貪狼) = 매혹과 욕망의 별
- 거문(巨門) = 말의 별 — 칼이 되기도 약이 되기도
- 천부(天府) = 창고별 — 쌓고 지키는 힘
- 태음(太陰) = 달의 별 — 고요한 저축
- 칠살(七殺)·파군(破軍) = 선봉별 — 개척과 변혁
- 명궁 = 나 자신이 앉은 왕좌의 방
- 신궁 = 나의 또 다른 페르소나가 머무는 방
- 사화(四化) = 별의 변주 — 같은 별이 4가지 다른 노래를 부름
  · 화록(化祿) = 복과 재물이 흐르는 문 열림
  · 화권(化權) = 권세의 지팡이를 쥔 순간
  · 화과(化科) = 이름이 하늘에 새겨지는 순간
  · 화기(化忌) = 별이 가려지는 일식의 순간 — 경계 필요
- 대한(大限) = 10년마다 바뀌는 내 인생 무대 조명

${METAPHOR_SHORT_GUIDE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙 — 절대 준수]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1) **Markdown 절대 금지**: #, ##, ###, **, \`\`, > 같은 기호 전부 금지. 본문은 평서문 문장으로만.
2) **이모지 금지**.
3) **AI 티 제거**: "AI로서", "분석 결과", "제공된 데이터에 따르면", "자미두수 AI가" 같은 표현 절대 금지. 35년 경력 도사가 직접 말하듯이 쓰세요.
4) **반드시 제공된 별 해설과 궁 역할을 근거로만 풀이할 것**. 위 목록에 없는 별 이름·사화를 창작하지 말 것.
5) **각 섹션은 첫 줄에 은유 제목을 쓰세요** (대비되는 두 이미지를 쉼표로 연결. 「」 기호 없이 평문. 예: "황제의 별이 왕좌에 앉은 하늘, 그러나 보좌가 부족한 밤"). 본문은 제목 은유로 시작해 명리 근거로 착지.
6) **전문 용어**(주성·사화·대한 등) 첫 등장 시 괄호로 쉬운 말 병기.
7) **출력 형식**: 아래 8개 섹션을 [key] 델리미터로 구분. 각 섹션은 "[key]" 줄 뒤 빈 줄 없이 바로 본문 시작. 마커 이전 텍스트는 없어야 함.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[섹션 지침]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(직원 피드백: 자미두수 풀이 깊이 부족 → 각 섹션 분량 확장 + 명리 근거 구체화 + 일상 장면 강화)

[overview] — 명반 첫 인상 (360~460자)
첫 줄: 은유 제목 (예: "${z.soul}과 ${z.body}가 만난 밤하늘, 그리고 ${z.fiveElementsClass}으로 흐르는 강물" 같은 느낌)
본문: 명주(${z.soul})·신주(${z.body})·오행국(${z.fiveElementsClass})을 풀이. 명주는 인생의 주제곡, 신주는 숨은 페르소나, 오행국은 별들이 배치된 무대.
다음을 모두 포함:
- 명주가 어떤 운명적 과제를 부여하는지 1문장
- 신주가 어떤 숨은 페르소나·재능을 가져오는지 1문장
- 오행국이 어떤 시간 흐름(빠른 발현 vs 만성장)을 만드는지 1문장
- 세 요소가 충돌하는지 조화하는지 분명히 선언
- 마지막 문장에서 제목 은유 회수

[core] — 명궁·신궁 핵심 (480~600자)
첫 줄: 은유 제목 (명궁에 좌한 주성의 성격을 대비 이미지로. 예: "왕좌에 앉은 별, 홀로 빛나는 고독")
본문: 명궁에 좌한 주성들(이름·한자 병기)과 보좌성의 조합이 만드는 기본 성향을 풀이.
다음을 모두 포함:
- 명궁 주성의 키워드 2개를 일상 장면 3개로 묘사 (회의 / 연애 / 위기 대처 등)
- 보좌성이 주성을 어떻게 보강·약화시키는지
- 신궁이 명궁과 같은 위치인지 다른 위치인지에 따라 삶이 어떻게 이중 축으로 움직이는지
- 명궁 사화가 있다면 그 별의 성격이 어떻게 변주되는지 (없으면 "명궁 사화는 없다"고 한 줄)
- 명궁 좌한 주성의 강점 1개와 함정 1개를 명시
- 마지막 문장에 제목 은유 회수

[relations] — 관계 영역 (450~560자)
첫 줄: 은유 제목 (관계의 깊이·갈등 양상을 자연 이미지 대비로)
본문: 부처궁(배우자)·자녀궁·형제궁·노복궁·부모궁 다섯 개 방을 순서대로 풀이.
각 궁마다 다음을 한 문장씩 포함 (총 5개 미니 단락):
- 부처궁: 어떤 별이 앉았고, 끌리는 이성 성향은 어떤 모습인지
- 자녀궁: 자녀와의 관계 패턴, 자녀 복의 유형
- 형제궁: 형제·자매와의 거리감, 평생 동행 가능성
- 노복궁: 친구·후배·부하 복, 누가 도와주는지
- 부모궁: 부모와의 인연 깊이, 효도·갈등 분기점
마지막에 갈등 가능 포인트 1개와 관계 복의 유형 1개를 종합 한 문장으로 정리.

[wealth] — 재물·일의 하늘 (420~520자)
첫 줄: 은유 제목 (재물이 흐르는 방식·커리어의 모양을 자연 이미지 대비로)
본문: 재백궁(돈 흐름)·관록궁(직업)·전택궁(부동산) 세 개 방을 순서대로 풀이.
다음을 모두 포함:
- 재백궁: 수입 스타일을 "꾸준히 쌓이는 달빛 같은 돈" vs "혜성처럼 들어왔다 빠지는 돈" 식의 이미지로 1문장 + 어떤 별이 그렇게 만드는지 1문장
- 관록궁: 적합 직군 2~3개를 별의 성격에 근거해 제시 + 승진·이직 흐름의 모양
- 전택궁: 부동산·자산 축적 패턴 + 첫 집·큰 자산 마련 시기 단서
- 주의할 재물 함정 1개 (별·사화 근거 명시)
- 권할 재물 행동 1개 (저축·투자·분산 중 1)

[body_mind] — 몸·마음·이동 (380~480자)
첫 줄: 은유 제목 (약한 곳·회복 방식을 자연 이미지 대비로)
본문: 질액궁(건강)·복덕궁(정신·취미)·천이궁(이동·해외)을 묶어 풀이.
다음을 모두 포함:
- 질액궁: 취약한 장부(목=간담/화=심장/토=비위/금=폐/수=신장) 1~2개 + 어느 계절·시기에 무리하면 위험한지
- 복덕궁: 스트레스 쌓이는 방식 + 회복에 좋은 취미·환경 1가지
- 천이궁: 해외·출장·이사·이민의 길흉 + 어느 방향이 유리한지
- 정신 건강 신호 1개와 대응법 1개
- 마음에 쉼이 필요한 순간 묘사 1문장

[mutagen] — 사화의 변주 (340~440자)
첫 줄: 은유 제목 (별이 다른 노래를 부르는 이미지)
본문: 화록·화권·화과·화기 각각이 어느 궁에서 작동하는지, 인생에서 어떻게 드러나는지.
다음을 모두 포함:
- 화록: 어느 궁에서 어떤 복·재물이 흐르는지 (없으면 "이 명반에는 화록이 없다" 한 줄)
- 화권: 어느 영역에서 권세·주도권을 쥐게 되는지
- 화과: 어느 영역에서 명예·인정을 받는지
- **화기는 반드시 주의 신호로 강조** + 어느 궁이 막히는지 + 대응법 1개
- 4개 사화의 균형이 인생에 어떤 톤을 주는지 마지막 1문장
- 마지막 문장 은유 회수

[daehan] — 대한 10년 리듬 (320~420자)
첫 줄: 은유 제목 (무대 조명이 바뀌는 이미지)
본문: 10년 단위로 주인공 궁이 바뀌는 흐름.
다음을 모두 포함:
- 주요 전환점 3개를 나이로 명시(예: "28~37세에 접어드는 재백궁 대한")
- 각 전환점에서 어떤 별·궁이 활성화되어 무엇을 결단해야 하는지 (3개 모두 1문장씩)
- 현재 대한의 주제 1문장
- 가장 빛날 대한 1개와 가장 신중해야 할 대한 1개를 짚어 마무리

[advice] — 별이 건네는 조언 (280~360자)
첫 줄: 은유 제목 (나아갈 방향을 자연 이미지로)
본문 3문장으로 핵심 메시지 — 이 명반의 사람은 어떻게 살면 빛나고 어떤 함정을 조심해야 하는지.
마지막에 "- " 불릿 4줄로 실천 조언 4가지:
- 구체적 행동 1개 (오늘 시작 가능)
- 길한 색 1개 (왜 그 색인지 별 근거)
- 길한 방향 1개 (왜 그 방향인지)
- 가장 좋은 시기 1개 (몇 살 또는 어느 계절)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

출력은 [overview] 마커부터 시작. 마커 이전에 어떤 텍스트도 없어야 함.
총 8개 섹션, 약 3300~4000자. (직원 피드백 반영 — 깊이 강화)`;
};

/**
 * 토정비결 프롬프트 (2엽전)
 * - 상/중/하 괘 메타 + 괘번호 기반 1년 총운 + 12개월 월운
 * - 144괘 테이블(gwae-table.ts)에서 결정론적 길흉등급·총평·월별키워드를 주입
 *   AI는 이 고정된 틀을 벗어난 길흉을 창작하지 않는다
 */
import type { TojeongResult } from '../engine/tojeong';
import { getGwaeEntry } from '../engine/tojeong/gwae-table';

const ZHI_KO = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const ZHI_ANIMAL = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const GAN_ELEMENT_MAP: Record<string, string> = { '갑':'목','을':'목','병':'화','정':'화','무':'토','기':'토','경':'금','신':'금','임':'수','계':'수' };
const ZHI_ELEMENT_MAP: Record<string, string> = { '자':'수','축':'토','인':'목','묘':'목','진':'토','사':'화','오':'화','미':'토','신':'금','유':'금','술':'토','해':'수' };

function getBirthZhi(solarYear: number): string {
  const idx = ((solarYear - 1900) % 12 + 12) % 12;
  return ZHI_KO[idx];
}

function getZhiRelation(zhi1: string, zhi2: string): string {
  if (zhi1 === zhi2) return `비화(比和) — 띠해와 올해가 같은 지지(${zhi1}), 자신의 기운이 강화됨`;
  const CHUNG = [['자','오'],['축','미'],['인','신'],['묘','유'],['진','술'],['사','해']];
  if (CHUNG.some(p => (p[0]===zhi1&&p[1]===zhi2)||(p[1]===zhi1&&p[0]===zhi2))) return `상충(相冲) — 생년 지지(${zhi1})와 세운 지지(${zhi2})가 충돌, 변동·충격 주의`;
  const HAP = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']];
  if (HAP.some(p => (p[0]===zhi1&&p[1]===zhi2)||(p[1]===zhi1&&p[0]===zhi2))) return `육합(六合) — 생년 지지(${zhi1})와 세운 지지(${zhi2})가 합, 협력·인연 길함`;
  const SAMHAP3 = [['신','자','진'],['인','오','술'],['사','유','축'],['해','묘','미']];
  for (const g of SAMHAP3) {
    if (g.includes(zhi1) && g.includes(zhi2)) return `삼합(三合)군 — 생년(${zhi1})·세운(${zhi2}) 같은 삼합 그룹, 기운이 융성하게 어울림`;
  }
  return `평(平) — 생년 지지(${zhi1})와 세운 지지(${zhi2}) 사이 특별한 충·합 없음`;
}

export const generateTojeongPrompt = (tj: TojeongResult): string => {
  const { targetYear, age, upperGwae, middleGwae, lowerGwae, gwaeNumber, formula } = tj;
  const entry = getGwaeEntry(tj.upper, tj.middle, tj.lower);
  const monthlyList = entry.monthlyHints
    .map((kw, i) => `  · ${i + 1}월: ${kw}`)
    .join('\n');

  // 세운 오행
  const yearGanZhi = tj.yearGanZhi.ganZhi;
  const yearGan = yearGanZhi[0] ?? '';
  const yearZhi = yearGanZhi[1] ?? '';
  const seunGanElement = GAN_ELEMENT_MAP[yearGan] ?? '목';
  const seunZhiElement = ZHI_ELEMENT_MAP[yearZhi] ?? '토';

  // 생년 지지 × 세운 지지
  const birthZhi = getBirthZhi(tj.birthSolar.year);
  const birthZhiIdx = ZHI_KO.indexOf(birthZhi);
  const birthAnimal = birthZhiIdx >= 0 ? ZHI_ANIMAL[birthZhiIdx] : '';
  const zhiRelation = getZhiRelation(birthZhi, yearZhi);

  // 원문 한문 괘사
  const hanjaSaBlock = entry.hanjaSa
    ? `▣ 원문 괘사 (卦辭)
  표제: ${entry.hanjaSa.title}
  ${entry.hanjaSa.lines.join(' / ')}
  뜻: ${entry.hanjaSa.translation}`
    : '';

  return `토정비결 풀이 요청
대상 해: ${targetYear}년 (${tj.yearGanZhi.ganZhi}년)
세는 나이: ${age}세
음력 생년월일: ${tj.birthLunar.year}년 ${tj.birthLunar.month}월 ${tj.birthLunar.day}일${tj.birthLunar.isLeap ? ' (윤달)' : ''}
생년 지지(띠): ${birthZhi}(${birthAnimal})
올해 세운 오행: 천간 ${yearGan}(${seunGanElement}) · 지지 ${yearZhi}(${seunZhiElement})
생년 띠 × 세운 지지 관계: ${zhiRelation}

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
${hanjaSaBlock ? `\n${hanjaSaBlock}` : ''}
▣ 12개월 기운 흐름 (월별 키워드 — 이 틀 안에서 확장)
${monthlyList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
1) 위에 확정된 등급(${entry.grade})과 총평의 방향성을 반드시 유지. 길흉을 임의로 바꾸지 말 것.
2) 월별 운은 위 12개 월별 키워드를 기반으로만 확장할 것. 해당 월의 톤을 뒤집지 말 것.
3) 제공된 상괘·중괘·하괘 의미에서 벗어난 상징을 새로 만들지 말 것.
4) 전통 토정 어법의 시(詩)적 개운 문구 1~2줄은 허용하나, 실제 길흉 판단은 위 등급을 벗어나지 말 것.
5) 원문 괘사(표제·한문 구절)의 상징과 뜻을 풀이 서두에 자연스럽게 녹여낼 것.
6) 생년 띠(${birthZhi})와 올해 세운(${yearGanZhi}) 지지 관계(${zhiRelation})를 총운·분야별 운세에 반드시 1회 이상 언급할 것.
7) 올해 세운 오행(천간 ${seunGanElement}·지지 ${seunZhiElement})이 개인 운세에 미치는 영향을 구체적으로 서술할 것.

${METAPHOR_SHORT_GUIDE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

위 정보를 바탕으로 ${targetYear}년 토정비결 풀이를 다음 구조로 작성하세요 (총 2900~3500자).
(직원 피드백: 분야별 운세를 4개 별도 섹션으로 세분화하여 재물·애정·건강·직장학업 각각이 독립 섹션이 되도록 구성)

반드시 전통 토정비결 어법(예: "용이 여의주를 얻은 격", "나무에 꽃이 피는 상")으로 시(詩)적인 개운 문구 1~2줄을 먼저 제시한 뒤, 현대인도 이해하기 쉽게 풀어 설명하세요.

1. 올해의 총운 (220~280자)
- 상중하괘 조합의 상징을 엮어 한 해의 큰 흐름 (등급: ${entry.grade})
- 핵심 메시지와 경계할 점, 이 한 해의 결이 어떤 감각인지

2. 괘의 의미 (180~240자)
- 왜 이 괘가 나왔는지 상징 해석
- 상괘(${upperGwae.name})·중괘(${middleGwae.position})·하괘(${lowerGwae.name})의 조화와 긴장

3. 월별 운세 (1월~12월, 각 월 3~4문장·약 90~130자)
- 각 월의 키워드(위 월별 키워드 고정)를 근거로 1문장 풀이
- 그 달에 해야 할 일 1가지 + 조심할 일 1가지를 반드시 포함
- 포맷: "N월 — [월별 키워드]" 이어서 본문 (예: "1월 — 준비")
- 정월부터 12월까지 빠짐없이 12개 소섹션으로 작성

4. 재물운 (160~210자)
- 들어오는 시기·새는 시기를 분기로 구분 (상반기/하반기 또는 봄·여름·가을·겨울)
- 본업 수입 vs 부수입의 흐름
- 재테크 방향 1개 (저축 강화·분산투자·신중 보류 등)
- 큰 지출 시 주의해야 할 달 1개 명시

5. 애정·가정운 (160~210자)
- 미혼: 인연 들어오는 흐름과 이상형 단서
- 기혼: 부부·자녀·부모 중 이달 테마와 주의 장면
- 관계 회복·갈등 분기점 시기 1개
- 가정 안에서 권할 행동 1가지

6. 건강운 (140~190자)
- 취약 장부 또는 신체 부위 (오장육부·오행 기준)
- 유의할 계절·환절기와 그 이유
- 권장 운동·식습관 1가지
- 정신 건강·스트레스 관리 한마디

7. 직장·학업운 (160~210자)
- 직장: 승진·이직·평가·인간관계 중 유리한 흐름 1개와 시기
- 학업·시험: 합격운·집중력·자격증 운
- 조심할 덫 1개 (구설·실수·과로 등)
- 협력자 또는 조력자가 누구인지 (선배·후배·이성·동료 등)

8. 개운 조언 (160~220자) — 불릿 5개
- 올해의 길한 방향 1개
- 길한 색 2개
- 행운 숫자·요일 각 1개
- 이달 안에 실천할 개운 행동 2개

섹션 제목은 위 번호(1. 2. 3. 4. 5. 6. 7. 8.) 형식 그대로 유지하고, 월별 소섹션은 12개를 모두 작성하세요. Markdown # 헤더는 절대 사용하지 마세요.`;
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
 * - 일반: 350~450자 / 출산 택일: 500~650자 (산모·태아 안전 강조)
 * - 후보 비교 모드: days.length <= 7 이면 사용자가 직접 고른 후보 셋으로 간주, Top 3 비교 풀이로 분기
 *   (직원 피드백: 다중 날짜 입력 → 점수 기반 Top 3 + 명리 근거)
 */
export const generateTaekilAdvicePrompt = (
  saju: SajuResult,
  taekil: TaekilResult,
): string => {
  const isBirth = taekil.category === 'birth';
  // 후보 비교 모드 감지: 한 달치(28~31일) 가 아닌 소량(2~7개) 의 days 가 들어오면 후보 비교 모드
  const isCompareMode = taekil.days.length >= 2 && taekil.days.length <= 7;
  const bestDays = isCompareMode
    ? [...taekil.days].sort((a, b) => b.score - a.score)
    : taekil.bestDays.slice(0, isBirth ? 3 : 5);
  const worstDays = isCompareMode
    ? [...taekil.days].sort((a, b) => a.score - b.score).slice(0, Math.min(2, taekil.days.length - 1))
    : taekil.days
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
  const gyeokguk = determineGyeokguk(saju);

  // 출산 택일 전용 인풋 블록
  const birthBlock = isBirth ? `
[출산 택일 명리 분석 인풋]
산모 일주: ${saju.pillars.day.gan}${saju.pillars.day.zhi} / 일간 오행: ${saju.dayMasterElement}
격국: ${gyeokguk.name}(${gyeokguk.traits?.slice(0, 3).join('·') || ''})
신강신약: ${saju.strengthStatus} / 용신: ${saju.yongSinElement}(${saju.yongSin}) / 기신: ${saju.giSin}
식신 강도: ${computeSipseongCounts(saju)['식신']?.toFixed(1) || '0'} (자녀·출산 에너지)
편인 강도: ${computeSipseongCounts(saju)['편인']?.toFixed(1) || '0'} (식신 극하는 기운 — 높을수록 출산일 신중 선택)
일지 지지: ${saju.pillars.day.zhi} / 오행: ${saju.pillars.day.zhiElement}
` : '';

  const birthRules = isBirth ? `
[출산 택일 전용 규칙]
- 산모 일간 기준 식신(食神)이 강한 날 = 아이 에너지가 살아있는 날. 우선 추천.
- 편인(偏印)이 식신을 克하는 날 = 모자(母子) 에너지 충돌. 반드시 피할 날로 언급.
- 12운성 사(死)·절(絶)일 = 생명 기운 약함. 강력 기피.
- 12운성 장생(長生)·제왕(帝旺)·건록(建祿)일 = 생명력이 넘치는 날. 적극 추천.
- 편관(七殺)일 = 산모·태아 모두 부담. 반드시 경고.
- 공망일 = 허한 날. 출산 기피.
- 추천 날짜는 반드시 위 엔진 계산 길일 목록에서만 선택. 임의 추천 금지.
- 마지막에 면책 문구 1문장 필수: "이 분석은 명리학적 참고 자료이며, 최종 출산 날짜는 담당 의사와 상의해 결정해 주세요."
` : '';

  return `[사주 원국 — 산모]
일간: ${saju.dayMaster}(${saju.dayMasterElement}) / 일주: ${saju.pillars.day.gan}${saju.pillars.day.zhi}
오행: 목${elPct.목}% 화${elPct.화}% 토${elPct.토}% 금${elPct.금}% 수${elPct.수}%
신강신약: ${saju.strengthStatus} / 용신: ${saju.yongSinElement} / 기신: ${saju.giSin}
${birthBlock}
[택일 검색 정보]
카테고리: ${taekil.categoryLabel}
기간: ${taekil.startDate} ~ ${taekil.endDate}

[엔진 계산 — ${isCompareMode ? '사용자가 직접 고른 후보' : '길일 상위'}]
${bestList}

[엔진 계산 — ${isCompareMode ? '후보 중 하위' : '흉일'}]
${worstList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[작성 규칙]
1) Markdown 절대 금지. 이모지 금지.
2) 총 ${isCompareMode ? '450~600' : isBirth ? '500~650' : '350~450'}자. 짧고 실용적으로.
3) 추천일은 위 엔진 계산 결과(${isCompareMode ? '사용자 후보 셋' : '길일'})에서만 고를 것. 임의로 다른 날 추천 금지.
4) 명리 이유(십성·12운성·신살·합충형 중 1~2개)를 근거로 왜 좋은지 설명.
5) ${isCompareMode ? '피해야 할 후보(점수 낮은 후보) 1개를 반드시 짚고, 다른 후보 대비 어떤 점이 약한지 비교 서술' : '피해야 할 날도 반드시 언급'}.
6) 출력은 [taekil_advice] 마커부터 시작. 마커 이전 텍스트 없어야 함.
${birthRules}
${METAPHOR_SHORT_GUIDE}

[taekil_advice]
${isCompareMode
  ? `사용자가 직접 고른 ${taekil.days.length}개 후보 중 ${taekil.categoryLabel} 에 가장 적합한 날을 비교 추천하세요. 구조:
- 1순위 후보 1개: 날짜 + 명리 근거 2문장 (왜 가장 좋은지, 어떤 십성/12운성이 작용하는지) + 길시 1문장
- 2순위 후보 1개: 날짜 + 1순위 대비 강점·약점 비교 1~2문장
- 3순위 후보 1개 (후보 3개 이상일 때만): 날짜 + 한 문장
- 피해야 할 후보 1개: 날짜 + 어떤 충·형·기신 때문에 약한지 한 문장
- ${taekil.categoryLabel} 행사 주의사항 1문장${isBirth ? '\n- 면책 문구 (마지막 줄): 명리학적 참고 자료이며, 최종 날짜는 담당 의사와 상의해 결정해 주세요.' : ''}`
  : `${taekil.categoryLabel} 택일 추천을 아래 구조로 작성하세요:
- 최고 추천일 1~2개: 날짜 + 명리 이유 1~2문장
- 차선 추천일 1개 (있으면): 날짜 + 한 문장
- 피해야 할 날 1개: 날짜 + 이유 한 문장
- 길시 안내: 추천일 중 길시가 있으면 1문장으로 안내
- 주의사항 1문장: ${taekil.categoryLabel}에 특화된 명리 조언${isBirth ? '\n- 면책 문구 (반드시 마지막 줄에): 명리학적 참고 자료이며, 최종 날짜는 담당 의사와 상의해 결정해 주세요.' : ''}`}`;
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
  const gyeokguk = determineGyeokguk(result);
  const gyeokgukTraits = gyeokguk.traits && gyeokguk.traits.length > 0
    ? gyeokguk.traits.slice(0, 4).join('·')
    : '';

  // 기둥별 십성 (일간 제외)
  const sipseongByPillar = [
    `년간 ${p.year.gan}:${p.year.tenGodGan || '일간'} 년지 ${p.year.zhi}:${p.year.tenGodZhi}`,
    `월간 ${p.month.gan}:${p.month.tenGodGan} 월지 ${p.month.zhi}:${p.month.tenGodZhi}`,
    `일지 ${p.day.zhi}:${p.day.tenGodZhi}`,
    result.hourUnknown ? '시주:미상' : `시간 ${p.hour.gan}:${p.hour.tenGodGan} 시지 ${p.hour.zhi}:${p.hour.tenGodZhi}`,
  ].join(' / ');

  // 공망 기둥
  const kongmangList: string[] = [];
  const kongmangPillars: { label: string; p: typeof p.year }[] = [
    { label: '년주', p: p.year }, { label: '월주', p: p.month }, { label: '일주', p: p.day },
    ...(!result.hourUnknown ? [{ label: '시주', p: p.hour }] : []),
  ];
  kongmangPillars.forEach(({ label, p: pl }) => {
    if ((pl as typeof p.year & { isKongmang?: boolean }).isKongmang) kongmangList.push(label);
  });
  const kongmangStr = kongmangList.length > 0 ? kongmangList.join('·') : '없음';

  // 신살 요약
  const sinSalGood = result.sinSals.filter(s => s.type === 'good').map(s => s.name).join('·') || '없음';
  const sinSalBad = result.sinSals.filter(s => s.type === 'bad').map(s => s.name).join('·') || '없음';

  // 신강신약 세부
  const sd = (result as typeof result & { strengthDetail?: { bijeopScore?: number; inseongScore?: number } }).strengthDetail;
  const sdStr = sd
    ? ` (비겁점${(sd.bijeopScore ?? 0).toFixed(1)} 인성점${(sd.inseongScore ?? 0).toFixed(1)})`
    : '';

  const lines = [
    `이름: ${name}`,
    `일주: ${p.day.gan}${p.day.zhi}(${p.day.ganElement}·${result.dayMasterYinYang}간) / 12운성: ${p.day.twelveStage}`,
    `오행: 목${result.elementPercent.목}% 화${result.elementPercent.화}% 토${result.elementPercent.토}% 금${result.elementPercent.금}% 수${result.elementPercent.수}%`,
    `신강신약: ${result.strengthStatus}${sdStr} / 용신: ${result.yongSinElement}(${result.yongSin}) / 기신: ${result.giSin}`,
    `격국: ${gyeokguk.name}${gyeokgukTraits ? `(${gyeokgukTraits})` : ''}`,
    `기둥별 십성: ${sipseongByPillar}`,
    `일지 합·충: ${result.interactions.filter(i => i.description.includes(p.day.zhi)).map(i => `${i.type}:${i.description}`).join(' / ') || '없음'}`,
    `간여지동: ${formatGanYeojidong(result)} / 병존·삼존: ${formatByeongjOn(result)}`,
    `공망: ${kongmangStr}`,
    `신살(길): ${sinSalGood} / 신살(흉): ${sinSalBad}`,
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

/** 사주 4기둥 지지 목록 추출 */
function getAllPillarZhis(result: SajuResult): { label: string; zhi: string }[] {
  const p = result.pillars;
  const list: { label: string; zhi: string }[] = [
    { label: '년지', zhi: p.year.zhi },
    { label: '월지', zhi: p.month.zhi },
    { label: '일지', zhi: p.day.zhi },
  ];
  if (!result.hourUnknown) list.push({ label: '시지', zhi: p.hour.zhi });
  return list;
}

/** 두 사람 간 지지 합·충·형·삼합 교차 분석 */
function buildCrossJiziInteractions(
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string {
  const myZhis = getAllPillarZhis(me);
  const otherZhis = getAllPillarZhis(other);
  const LIUHE: [string, string, string][] = [
    ['자','축','토화'], ['인','해','목화'], ['묘','술','화화'],
    ['진','유','금화'], ['사','신','수화'], ['오','미','화화'],
  ];
  const CHONG: [string, string][] = [
    ['자','오'], ['축','미'], ['인','신'], ['묘','유'], ['진','술'], ['사','해']
  ];
  const SANHE: [string[], string][] = [
    [['인','오','술'], '화국(열정·추진력)'], [['신','자','진'], '수국(지혜·유연성)'],
    [['사','유','축'], '금국(의지·결단력)'], [['해','묘','미'], '목국(성장·창의력)'],
  ];
  const results: string[] = [];

  for (const mz of myZhis) {
    for (const oz of otherZhis) {
      for (const [a, b, res] of LIUHE) {
        if ((mz.zhi === a && oz.zhi === b) || (mz.zhi === b && oz.zhi === a)) {
          results.push(`${myName} ${mz.label}(${mz.zhi}) × ${otherName} ${oz.label}(${oz.zhi}) 지지합(${a}${b}합·${res}) — 자연스러운 인연`);
        }
      }
      for (const [a, b] of CHONG) {
        if ((mz.zhi === a && oz.zhi === b) || (mz.zhi === b && oz.zhi === a)) {
          results.push(`${myName} ${mz.label}(${mz.zhi}) × ${otherName} ${oz.label}(${oz.zhi}) 지지충(${mz.zhi}${oz.zhi}충) — 마찰·변화 에너지`);
        }
      }
    }
  }

  const allMy = myZhis.map(z => z.zhi);
  const allOther = otherZhis.map(z => z.zhi);

  // 자묘형(무례지형) cross-person
  if ((allMy.includes('자') && allOther.includes('묘')) || (allMy.includes('묘') && allOther.includes('자'))) {
    results.push('두 사람 합산 자묘형(무례지형) 성립 — 감정 표현 방식 충돌, 언행 주의');
  }
  // 인사신(무은지형) cross-person — 3지 중 2지가 두 사람 사이에 걸쳐있을 때
  {
    const INHA = ['인','사','신'];
    const myHas = INHA.filter(z => allMy.includes(z));
    const otherHas = INHA.filter(z => allOther.includes(z));
    if (myHas.length > 0 && otherHas.length > 0 && myHas.some(z => !otherHas.includes(z))) {
      results.push(`두 사람 합산 인사신 무은지형(${[...myHas, ...otherHas].join('·')}) 성립 — 은혜를 모른다는 형, 기대·보상 어긋남 주의`);
    }
  }
  // 축술미(지세지형) cross-person
  {
    const JISE = ['축','술','미'];
    const myHas = JISE.filter(z => allMy.includes(z));
    const otherHas = JISE.filter(z => allOther.includes(z));
    if (myHas.length > 0 && otherHas.length > 0 && myHas.some(z => !otherHas.includes(z))) {
      results.push(`두 사람 합산 축술미 지세지형(${[...myHas, ...otherHas].join('·')}) 성립 — 자존심 충돌·고집 부딪힘 주의`);
    }
  }

  for (const [members, label] of SANHE) {
    const combined = [...allMy, ...allOther];
    const matched = members.filter(m => combined.includes(m));
    if (matched.length >= 2 && members.some(m => allMy.includes(m)) && members.some(m => allOther.includes(m))) {
      results.push(`${matched.join('·')} ${label} 반합/삼합 — 함께할 때 강력한 시너지`);
    }
  }

  return results.length > 0 ? results.join('\n') : '두 사람 간 특기할 지지 합·충·형 없음';
}

/** 두 사람 주요 십성 분포 비교 */
function buildGunghapSipseong(
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string {
  const myCounts = computeSipseongCounts(me);
  const otherCounts = computeSipseongCounts(other);
  const keys = ['정재','편재','정관','편관','정인','편인','식신','상관','비견','겁재'];
  const fmt = (counts: Record<string, number>) =>
    keys.filter(k => (counts[k] || 0) > 0)
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
      .slice(0, 4).map(k => `${k}(${counts[k].toFixed(1)})`)
      .join(' > ');
  return `${myName} 십성: ${fmt(myCounts) || '없음'}\n${otherName} 십성: ${fmt(otherCounts) || '없음'}`;
}

/** 두 사람 오행 분포 비교 및 상보 관계 */
function buildOhaengCompare(
  me: SajuResult, other: SajuResult,
  myName: string, otherName: string
): string {
  const els = ['목','화','토','금','수'] as const;
  const myRow = els.map(e => `${e}${me.elementPercent[e]}%`).join(' ');
  const otherRow = els.map(e => `${e}${other.elementPercent[e]}%`).join(' ');
  const comps: string[] = [];
  for (const e of els) {
    if (me.elementPercent[e] === 0 && other.elementPercent[e] >= 20)
      comps.push(`${otherName}의 ${e}기운이 ${myName}의 결핍 보충`);
    if (other.elementPercent[e] === 0 && me.elementPercent[e] >= 20)
      comps.push(`${myName}의 ${e}기운이 ${otherName}의 결핍 보충`);
  }
  const complementStr = comps.length > 0 ? comps.join(' / ') : '오행 결핍 상호보완 없음 (독립적 구성)';
  return `${myName}: ${myRow}\n${otherName}: ${otherRow}\n상보관계: ${complementStr}`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const sipseongCompare = buildGunghapSipseong(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);
  const yongSinClash = [
    `${myName} 용신(${me.yongSinElement}) vs ${otherName} 기신(${other.giSin}): ${me.yongSinElement === other.giSin ? '충돌 — 에너지 소진 주의' : '충돌 없음'}`,
    `${otherName} 용신(${other.yongSinElement}) vs ${myName} 기신(${me.giSin}): ${other.yongSinElement === me.giSin ? '충돌 — 에너지 소진 주의' : '충돌 없음'}`,
  ].join('\n');

  return `당신은 사주명리 전문가입니다. 두 사람의 연인 궁합을 아래 7개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 반드시 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,800~2,400자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 두 사람 지지 합·충·형
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 십성 분포 비교
${sipseongCompare}

▶ 배우자성 오행 대응
${mySpouseCheck}

▶ 용신·기신 충돌
${yongSinClash}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 7개 섹션을 순서대로 빠짐없이 작성하세요]

▶ 핵심 요약 (150~200자)
두 일간 오행 관계(${elRel})를 근거로 이 커플의 에너지 구조를 한마디로 선언하세요. 일지 음양합(${eumYangHap})과 배우자성 오행 대응(${mySpouseCheck})으로 인연의 강도를 1~2문장 제시. 이 두 사람의 관계를 가장 잘 표현하는 자연 현상이나 상황으로 비유하세요.

▶ 공명과 끌림 (200~270자)
두 사람이 처음 만났을 때 왜 끌렸는지 명리적 근거 2~3가지로 서술하세요. 지지 합·삼합 결과(${crossInteractions})를 구체적으로 활용해 "어떤 에너지가 둘을 당겼는지" 장면으로 묘사. 일간이 동일하다면 비화(비견) 공명의 양면성(강렬한 동질감 + 내면 경쟁)을 언급하세요.

▶ 오행 상보 관계 (200~260자)
두 사람의 오행 분포를 비교해 서로가 어떻게 채워주는지 서술하세요. 결핍 오행 상보 관계를 실생활 장면("함께 있을 때 ${myName}은 ~해지고, ${otherName}은 ~해진다")으로 묘사. 두 사람이 함께할 때 강해지는 오행과 과잉이 될 수 있는 오행도 언급하세요.

▶ 갈등·마찰 포인트 (200~260자)
두 사람 사이에서 반복될 수 있는 갈등 패턴을 2~3가지 구체 장면으로 묘사하세요. 지지 충·형·용신 기신 충돌 근거를 활용. 단순한 성격 차이가 아닌 "명리 구조가 만드는 필연적 충돌 구조"로 설명하세요. 각 갈등 패턴마다 한 문장 처방을 붙이세요.

▶ 연애 방식과 역학 (200~260자)
십성 분포를 근거로 두 사람의 연애 스타일을 분석하세요. 재성·식신·관성 분포로 "누가 더 표현하고 누가 더 받는지", "사랑을 어떻게 주고받는지" 구체적으로 서술. 연애가 깊어질수록 주의해야 할 반복 패턴 1가지와 관계를 오래 유지하는 핵심 비결 1가지로 마무리.

▶ 서로의 속마음 (160~220자)
${myName}이 ${otherName}에게 말 못 하는 내면 욕구, ${otherName}이 ${myName}에게 진짜 원하는 것을 십성 구조로 분석하세요. 각자의 속마음을 1인칭 화법으로 대변("나는 당신이 ~해줬으면 해"). 상대방이 오해하기 쉬운 행동 패턴 1가지씩 설명하세요.

▶ 개운법·처방 (160~200자)
이 두 사람이 함께 운을 높이는 실용 처방 4가지를 제시하세요: 1) 용신 오행에 맞는 데이트 장소·활동, 2) 함께 있을 때 피해야 할 상황이나 장소, 3) 갈등이 생겼을 때 화해 방법, 4) 이 관계가 가진 가장 아름다운 가능성 한 문장.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 친구 궁합을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,200~1,700자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 비겁 에너지 (동류 공명)
${myName} 비겁: ${myBijeop}개 / ${otherName} 비겁: ${otherBijeop}개
${myBijeop + otherBijeop >= 4 ? '비겁 과다 — 경쟁·질투 주의, 이해관계 충돌 가능' : '비겁 적정 — 균형 잡힌 우정 가능'}

▶ 용신 방향
${me.yongSinElement === other.yongSinElement ? '동일 용신 — 같은 방향으로 함께 성장 가능' : '다른 용신 — 서로 다른 강점으로 보완 우정 가능'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 이 우정의 에너지 구조 (180~240자)
일간 오행 관계(${elRel})를 근거로 두 사람이 함께 있을 때의 에너지 흐름을 묘사하세요. "누가 활력을 주고 누가 안정을 주는지", "이 두 사람이 오래 친구로 지내는 명리적 이유"를 서술. 지지 합 결과(${crossInteractions})가 있다면 이 우정의 특별한 연결 고리로 활용하세요.

▶ 서로에게 어떤 친구인가 (200~260자)
십성 분포를 근거로 ${myName}이 ${otherName}에게 어떤 유형의 친구인지, ${otherName}이 ${myName}에게 어떤 존재인지 분석하세요. 오행 보완 관계(${complementStr})를 실생활 장면으로 묘사("위기 상황에서 어떻게 서로를 돕는지", "취미·관심사를 어떻게 공유하는지").

▶ 갈등과 마찰 포인트 (200~260자)
비겁 에너지와 지지 충 구조를 근거로 두 사람 사이에서 반복될 수 있는 갈등 패턴 2가지를 구체적으로 묘사하세요. 경쟁·질투·가치관 충돌 중 이 두 사람에게 해당하는 것을 명리 근거로 설명. 각 패턴마다 처방 1문장.

▶ 함께 성장하는 방법 (160~220자)
두 사람이 함께할 때 시너지가 나는 분야와 활동을 서술하세요. 서로의 용신 방향이 같다면 함께 성장하는 방향을, 다르다면 각자의 강점이 서로를 어떻게 보완하는지 제시. 우정이 더 깊어지는 핵심 비결 2가지.

▶ 오래가는 우정을 위한 처방 (140~180자)
이 두 사람의 우정이 오래 유지되려면 조심해야 할 상황·행동 2가지와, 함께 하면 운이 오르는 활동·장소(용신 오행 기반) 2가지를 제시하세요. 마지막은 이 우정이 가진 가장 큰 가치 한 문장.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 가족 궁합(${relation})을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,200~1,600자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 관계 유형: ${relation}

▶ 일간 오행 관계 (세대 흐름)
${generationFlow}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 인성 분포
${parentChildAnalysis}

▶ 신강신약
${myName}: ${me.strengthStatus} / ${otherName}: ${other.strengthStatus}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 이 가족 관계의 명리 구조 (180~240자)
${relation} 관계에서 오행 세대 흐름(${generationFlow})이 어떤 가족 역학을 만드는지 서술하세요. 지지 합 결과(${crossInteractions})가 있다면 이 가족 관계의 특별한 연결 고리로 활용. "이 두 사람이 한 가족인 명리적 이유"를 따뜻하게 풀어내세요.

▶ 각자의 역할과 에너지 (180~240자)
신강신약 조합을 근거로 두 사람의 에너지 역할("누가 이끌고 누가 따르는지", "누가 더 보호하고 누가 더 의지하는지")을 ${relation} 상황에 맞게 묘사하세요. 인성 분포(${parentChildAnalysis})로 돌봄 에너지의 방향도 분석하세요.

▶ 갈등과 오해 패턴 (180~240자)
이 가족 관계에서 반복될 수 있는 갈등 패턴 2가지를 구체 장면으로 묘사하세요. "세대 차이"나 "기대의 차이"가 명리 구조상 어떻게 생겨나는지 설명. 충 관계(${crossInteractions})가 있다면 갈등의 명리적 근거로 활용. 각 패턴마다 처방 1문장.

▶ 서로에게 주는 선물 (160~210자)
이 가족 관계에서 두 사람이 서로에게 자연스럽게 주는 것을 오행 보완 구조로 서술하세요. "윗세대가 아랫세대에게, 또는 아랫세대가 윗세대에게 채워주는 것"을 구체적으로 묘사. 이 가족 관계가 가진 가장 아름다운 측면을 부각하세요.

▶ 관계를 더 깊게 하는 처방 (140~180자)
이 가족 관계를 더 따뜻하게 유지하기 위한 실용 처방 3가지: 1) 함께하면 좋은 활동, 2) 갈등이 생겼을 때 화해 방법, 3) 이 관계가 앞으로 더 강해지는 시기나 계기.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 직장동료 궁합을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,200~1,600자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 업무 스타일
${myName}: 관성 ${myGwan}개·식상 ${mySiksang}개 → ${workStyleA}
${otherName}: 관성 ${otherGwan}개·식상 ${otherSiksang}개 → ${workStyleB}
조합: ${complementRoles}

▶ 신강신약 (주도권)
${myName}: ${me.strengthStatus} / ${otherName}: ${other.strengthStatus}

▶ 용신·기신 충돌
${me.yongSinElement === other.giSin ? `${myName} 용신이 ${otherName} 기신 — 장기 협업 시 에너지 소진 주의` : '용신·기신 충돌 없음 — 에너지 상충 없음'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 업무 에너지 구조 (180~240자)
일간 오행 관계(${elRel})를 근거로 두 사람이 함께 일할 때의 에너지 흐름을 묘사하세요. "누가 방향을 잡고 누가 실행하는지", "업무 현장에서 어떤 역학이 작동하는지" 구체적으로 서술. 지지 합 결과(${crossInteractions})가 있다면 이 관계의 시너지 근거로 활용.

▶ 각자의 업무 스타일과 시너지 (200~260자)
업무 스타일 분석(${workStyleA} + ${workStyleB})을 근거로 두 사람이 프로젝트에서 어떻게 역할 분담하는지 서술하세요. 서로의 강점이 만나는 장면("이런 상황에서 두 사람은 최고의 팀이 된다")을 2가지 묘사. 함께하면 더 빠르게 성과를 내는 분야를 명시하세요.

▶ 갈등·마찰 포인트 (200~260자)
업무 현장에서 반복될 수 있는 갈등 패턴 2~3가지를 구체 장면으로 묘사하세요. 회의·의사결정·마감·평가 상황에서 충돌할 수 있는 지점을 명리 근거로 설명. 갈등이 생겼을 때 빠르게 해소하는 처방 1가지씩.

▶ 협업 극대화 전략 (160~220자)
두 사람이 함께 일할 때 최대 시너지를 내는 업무 분담 방식을 제시하세요. "이 사람은 이런 일을, 저 사람은 저런 일을"처럼 구체적 역할 제안. 함께 피해야 할 업무 상황과 서로를 지치지 않게 하는 소통 방법도 포함.

▶ 직장 관계 처방 (130~170자)
이 두 사람이 좋은 동료 관계를 유지하기 위한 실용 처방 3가지: 1) 회의·협업 시 지켜야 할 원칙, 2) 서로의 에너지를 살리는 업무 방식, 3) 이 파트너십이 가진 가장 큰 직업적 가치.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);
  const sipseongCompare = buildGunghapSipseong(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 ${relationLabel} 관계 궁합을 아래 4개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 재미·흥미 위주 관계라면 가볍고 유쾌한 톤으로 서술 가능.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,000~1,400자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 십성 분포 비교
${sipseongCompare}

▶ 용신·기신 에너지
${myName} 용신(${me.yongSinElement}) vs ${otherName} 기신(${other.giSin}): ${me.yongSinElement === other.giSin ? '충돌 주의' : '충돌 없음'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 4개 섹션을 순서대로 작성하세요]

▶ 이 관계의 에너지 구조 (180~240자)
일간 오행 관계(${elRel})를 근거로 두 사람이 ${relationLabel}로서 함께할 때의 에너지 흐름을 묘사하세요. 지지 합 결과(${crossInteractions})가 있다면 이 관계의 특별한 연결 고리로 활용. "두 사람이 함께 있을 때 어떤 시너지가 나는지" 구체적으로 서술하세요.

▶ 서로가 주고받는 것 (200~260자)
오행 분포 비교와 십성 분포(${sipseongCompare})를 근거로 두 사람이 이 관계에서 자연스럽게 주고받는 에너지를 서술하세요. "${myName}이 ${otherName}에게 주는 것"과 "${otherName}이 ${myName}에게 주는 것"을 각각 구체적으로 묘사. 함께 있을 때 더 강해지는 것과 주의해야 할 에너지 과잉도 언급하세요.

▶ 마찰과 주의 포인트 (160~220자)
지지 충·용신 기신 충돌 구조를 근거로 이 관계에서 마찰이 생길 수 있는 포인트 2가지를 서술하세요. 각 마찰 포인트마다 간단한 처방 1문장. 재미 관계라면 유쾌하게 서술 가능.

▶ 이 관계를 더 좋게 만드는 처방 (130~170자)
두 사람이 더 즐겁고 풍요로운 ${relationLabel} 관계를 유지하기 위한 처방 3가지: 1) 함께하면 좋은 활동, 2) 피해야 할 상황, 3) 이 관계가 가진 가장 유쾌한 가능성 한 문장.

`;
};

// ─────────────────────────────────────────────
// 역할 컨텍스트 삽입 헬퍼
// ─────────────────────────────────────────────
/**
 * 직원 피드백: "관계 입력 기능이 실제 해석에 반영되지 않는 것 같다"
 * → 역할 정보를 단순 명시만 하지 않고, 본문에서 명시적으로 호명·활용하도록 강제 룰 추가.
 */
export function injectRoleContext(
  prompt: string,
  myName: string, myRole: string,
  otherName: string, otherRole: string
): string {
  if (!myRole.trim() && !otherRole.trim()) return prompt;
  const block = `\n▶ 두 사람의 역할 (이 역할 맥락을 반영하여 분석)
${myName}: ${myRole.trim() || '미지정'} / ${otherName}: ${otherRole.trim() || '미지정'}

[역할 활용 강제 규칙]
- 본문 첫 단락 또는 핵심 요약 섹션에서 두 사람의 역할(${myRole.trim() || '미지정'} / ${otherRole.trim() || '미지정'})을 반드시 한 번 이상 명시 인용한다.
- 갈등·마찰 섹션, 처방·개운 섹션에서 역할 차이가 어떻게 작용하는지 구체 장면으로 짚는다.
- 역할이 "미지정"이면 그 사람에 대한 역할 언급은 생략하되, 미지정 자체를 "역할이 정해지지 않은 관계"로 해석에 반영한다.

`;
  // 모든 gunghap 프롬프트는 '[작성 지침 — ...]' 또는 '[작성 지침]' 둘 중 하나로 시작.
  // 부분 일치(라인 시작) 로 찾아 그 라인 직전에 block 삽입 — 14개 프롬프트 모두 호환.
  // (이전 정확 일치 replace 는 '[작성 지침 — ...]' 형태와 매치 실패하여 한 번도 작동하지 않았음 — 회귀 fix)
  const lines = prompt.split('\n');
  const insertIdx = lines.findIndex((ln) => ln.startsWith('[작성 지침'));
  if (insertIdx === -1) {
    // fallback — 매치 실패 시 프롬프트 끝에 추가 (전혀 안 들어가는 것보단 낫다)
    return prompt + block;
  }
  lines.splice(insertIdx, 0, block);
  return lines.join('\n');
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 썸 관계 궁합을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,400~1,900자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 초기 끌림 분석
${attractionCheck}

▶ 관계 발전 가능성
${developmentCheck}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 이 설렘의 정체 (200~260자)
일지 음양합(${eumYangHap})과 끌림 분석(${attractionCheck})으로 두 사람 사이 설렘의 명리적 근거를 서술하세요. "왜 이 사람이 유독 신경 쓰이는지" 오행·지지합 구조로 설명. 이 끌림이 단순한 호기심인지, 명리적으로 의미 있는 인연인지 판단하세요.

▶ 상대방이 나를 보는 시선 (220~280자)
상대방의 십성 분포로 ${myName}이 ${otherName}에게 어떻게 보이는지, ${otherName}이 ${myName}에게 어떻게 보이는지 분석하세요. 재성·관성으로 "상대가 나를 이성으로 인식하는지" 판단. 상대방이 마음이 열릴 때 보이는 행동 신호 2가지를 구체적으로 제시하세요.

▶ 연애로 발전할 가능성 (220~280자)
관계 발전 가능성(${developmentCheck})과 지지 합충 구조(${crossInteractions})를 근거로 썸이 연애로 이어질 명리적 근거와 장애물을 서술하세요. "이 관계가 연애로 발전하려면 무엇이 필요한지" 구체적으로 제시. 발전 가능성 높음/보통/낮음을 명확히 판정하세요.

▶ 썸 단계의 주의사항 (180~240자)
이 두 사람의 오행·충 구조에서 썸이 끝나버리는 전형적 패턴을 2가지 서술하세요. "이런 행동을 하면 상대가 멀어진다"는 형식으로 구체적으로 묘사. 반대로 "이렇게 하면 상대 마음이 열린다"는 처방도 각각 1가지씩 제시하세요.

▶ 고백 타이밍과 개운법 (160~200자)
현재 사주 구조에서 고백하기 좋은 상황과 피해야 할 타이밍을 서술하세요. 두 사람이 함께하면 좋은 데이트 장소나 활동(용신 오행 기반), 상대의 마음을 여는 구체적 행동 처방 2가지로 마무리.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const sipseongCompare = buildGunghapSipseong(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  // 자녀 궁합 (식신/상관 여성, 관성 남성)
  const myCounts2 = computeSipseongCounts(me);
  const otherCounts2 = computeSipseongCounts(other);
  const childStar = (() => {
    const female = me.gender === 'female' ? me : other;
    const femaleName = me.gender === 'female' ? myName : otherName;
    const male = me.gender === 'male' ? me : other;
    const maleName = me.gender === 'male' ? myName : otherName;
    const fCounts = computeSipseongCounts(female);
    const mCounts = computeSipseongCounts(male);
    const fSiksang = (fCounts['식신'] || 0) + (fCounts['상관'] || 0);
    const mGwan = (mCounts['정관'] || 0) + (mCounts['편관'] || 0);
    return `${femaleName} 식상(자녀성): ${fSiksang.toFixed(1)}개 / ${maleName} 관성(자녀성): ${mGwan.toFixed(1)}개`;
  })();

  return `당신은 사주명리 전문가입니다. 두 사람의 배우자 궁합을 아래 8개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 2,000~2,600자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 두 사람 지지 합·충·형
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 십성 분포 비교
${sipseongCompare}

▶ 가정 내 역할 분담
${householdRole}

▶ 경제 궁합
${myName} 재성: ${myJaeseong}개 / ${otherName} 재성: ${otherJaeseong}개 → ${financeCheck}

▶ 자녀 궁합
${childStar}

▶ 용신·기신 충돌
${myName} 용신(${me.yongSinElement}) vs ${otherName} 기신(${other.giSin}): ${me.yongSinElement === other.giSin ? '충돌 — 장기 에너지 소진 주의' : '충돌 없음'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 8개 섹션을 순서대로 빠짐없이 작성하세요]

▶ 핵심 요약 (150~200자)
두 일간 오행 관계(${elRel})와 일지 음양합(${eumYangHap})으로 이 부부의 관계 구조를 한마디로 선언하세요. "이 두 사람은 ~한 부부다"로 시작. 함께 사는 삶의 전체적 색깔을 1~2문장으로 제시.

▶ 공명과 유대 (180~240자)
지지 합·삼합(${crossInteractions})과 일간 관계를 근거로 두 사람이 처음 끌렸던 이유, 오랫동안 함께할 수 있는 명리적 근거를 서술하세요. "이 두 사람 사이에 작동하는 보이지 않는 끈"이 무엇인지 구체적으로 묘사.

▶ 오행 상보 관계 (180~240자)
두 사람의 오행 분포 비교를 근거로 결혼 생활에서 서로가 어떻게 보완하는지 서술하세요. 어느 쪽이 어떤 에너지를 제공하고 받는지, 함께할 때 더 강해지는 오행이 무엇인지 실생활 장면으로 묘사.

▶ 갈등·마찰 포인트 (200~260자)
결혼 생활에서 반복되는 갈등 패턴 2~3가지를 구체 장면으로 묘사하세요. 지지 충·형·용신 기신 충돌 근거 활용. "왜 이 갈등이 반복되는지" 명리 구조로 설명하고, 각 갈등마다 실용적 처방 1문장씩.

▶ 가정 역할과 생활 방식 (200~260자)
가정 내 역할 분담(${householdRole})을 근거로 두 사람의 일상 속 역할 구조를 서술하세요. 의사결정 방식, 가사 분담, 갈등 해결 방식에서 각자의 스타일을 십성 분포로 분석. 서로의 차이를 조율하는 핵심 비결 1가지.

▶ 경제·자산 궁합 (180~230자)
재성 분포(${financeCheck})를 근거로 두 사람의 돈에 대한 태도, 소비·저축 방식을 서술하세요. 재산 관리에서 충돌할 수 있는 포인트와 함께 자산을 쌓는 최적의 방식을 1~2문장으로 제시.

▶ 자녀와 가족 관계 (160~220자)
자녀성(식상·관성) 분포(${childStar})로 자녀 관계를 분석하세요. 자녀를 키우는 방식에서 두 사람의 차이와 시너지를 서술. 양가 가족과의 관계에서 주의해야 할 점도 1문장 포함.

▶ 개운법·처방 (160~200자)
이 부부가 함께 행복하게 오래 사는 실용 처방 4가지: 1) 함께하면 운이 오르는 활동·장소, 2) 가정에서 용신 오행 활용법, 3) 반복 갈등 예방을 위한 생활 습관, 4) 이 두 사람이 함께일 때 가장 빛나는 순간.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 ${label} 관계 궁합을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,400~1,900자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 이별 에너지 분석
${conflictCore}

▶ 재결합 인력
${reconnectCheck}

▶ 기신 충돌
${myName} 기신(${me.giSin}) vs ${otherName} 일간(${otherEl}): ${me.giSin === otherEl ? '직접 충돌 — 반복 마찰 패턴' : '직접 충돌 없음'}
${otherName} 기신(${other.giSin}) vs ${myName} 일간(${myEl}): ${other.giSin === myEl ? '직접 충돌 — 반복 마찰 패턴' : '직접 충돌 없음'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 왜 헤어졌는가 (220~280자)
이별 에너지 분석(${conflictCore})과 기신 충돌 구조를 근거로 두 사람이 결국 헤어진 명리적 이유를 서술하세요. "단순한 감정 문제가 아닌 사주 구조가 만들어낸 필연적 패턴"으로 설명. 관계 중 반복됐을 갈등 패턴 2가지를 구체 장면으로 묘사하세요.

▶ 그때 서로에게 어떤 존재였나 (200~260자)
이 관계가 지속됐을 때 두 사람이 서로에게 주었던 것과 빼앗았던 것을 오행·십성 구조로 분석하세요. "이 관계에서 좋았던 점"과 "결국 소진됐던 에너지" 모두 솔직하게 서술. 지지 합 구조(${crossInteractions})가 있다면 "그럼에도 계속 당겼던 이유"로 활용.

▶ 재결합 가능성 (200~260자)
재결합 인력(${reconnectCheck})을 솔직하게 평가하세요. 재결합할 경우 반드시 반복될 갈등 패턴 2가지를 제시. "재결합이 의미 있는 경우"와 "재결합이 또 다른 상처가 될 경우"를 명리 구조로 구분해 서술하세요. 감정이 아닌 사주로 판단하게 해주세요.

▶ 이 관계에서 배운 것 (160~220자)
이 이별이 ${myName}의 사주에 어떤 성장의 계기가 됐는지 분석하세요. "이 관계를 통해 강해진 것", "아직 채워야 할 결핍"을 오행·용신 구조로 설명. 다음 인연에서 반복하지 않아야 할 패턴 1가지를 명확히 제시하세요.

▶ 감정 정리와 개운법 (150~200자)
지금 이 감정을 잘 정리하기 위한 실용 처방 3가지: 1) 용신 오행 기반의 회복 활동, 2) 피해야 할 상황이나 생각 패턴, 3) 다음 인연을 위해 지금 준비해야 할 것. 마지막은 응원의 한 문장으로 마무리하세요.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 사업 파트너 궁합을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,400~1,900자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 역할 분담 구조
${roleDiv}

▶ 금전 궁합
${myName} 재성: ${myJae}개 / ${otherName} 재성: ${otherJae}개 → ${financeRisk}

▶ 신뢰 에너지
${trustCheck}

▶ 신강신약 (의사결정)
${myName}: ${me.strengthStatus}(${me.isStrong ? '주도 성향' : '협력 성향'}) / ${otherName}: ${other.strengthStatus}(${other.isStrong ? '주도 성향' : '협력 성향'})
${me.isStrong && other.isStrong ? '두 사람 모두 신강 — 주도권 충돌 위험, 의사결정 룰 명문화 필요' : ''}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 파트너십의 에너지 구조 (180~240자)
일간 오행 관계(${elRel})와 역할 분담 구조(${roleDiv})를 근거로 두 사람이 함께 사업할 때의 에너지 흐름을 서술하세요. "누가 방향을 잡고 누가 실행하는지", "어떤 분야에서 시너지가 나는지" 구체적으로 묘사. 지지 합(${crossInteractions})이 있다면 파트너십의 강점으로 활용.

▶ 최대 시너지 영역 (200~260자)
두 사람의 십성 분포와 오행 구조를 근거로 함께 사업할 때 가장 강점이 나오는 분야와 상황을 2~3가지 서술하세요. "이런 프로젝트는 두 사람이 환상의 파트너다"라는 구체적 업무 시나리오로 묘사. 각자의 강점이 합쳐졌을 때 어떤 결과가 나오는지 설명.

▶ 파트너십의 위험 신호 (200~260자)
이 두 사람이 사업에서 충돌할 수 있는 패턴 2~3가지를 구체 장면으로 묘사하세요. 금전 관리·의사결정·권한 배분에서 명리 구조상 충돌 포인트를 설명. 특히 신강신약 조합에서 주도권 갈등이 어떻게 나타나는지, 미리 방지하는 방법 1가지씩.

▶ 금전과 신뢰 (160~220자)
금전 궁합(${financeRisk})과 신뢰 에너지(${trustCheck})를 근거로 공동 자금 운용에서 주의해야 할 점을 서술하세요. 돈 문제가 파트너십을 망치는 전형적 패턴과 이를 예방하는 계약·약속의 형식 1가지를 구체적으로 제시.

▶ 사업 파트너십 처방 (140~180자)
이 파트너십이 성공하는 조건 3가지: 1) 서로의 역할을 명확히 하는 방법, 2) 위기 상황에서 관계를 지키는 원칙, 3) 이 두 사람이 함께라면 가장 잘 해낼 수 있는 사업 분야. 마지막은 이 파트너십의 가능성을 한 문장으로.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const sipseongCompare = buildGunghapSipseong(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. ${myName}이 ${otherName}에게 마음이 있는 짝사랑 상황의 궁합을 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,400~1,900자.

[${myName} 사주 — 마음을 가진 사람]
${buildPersonBlock(me, myName)}

[${otherName} 사주 — 마음을 받는 사람]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 십성 분포 비교
${sipseongCompare}

▶ 끌림의 명리 구조
${crushBasis}

▶ 상대방의 시선
${reciprocalCheck}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 왜 이 사람에게 끌리는가 (200~260자)
끌림의 명리 구조(${crushBasis})를 근거로 ${myName}이 ${otherName}에게 마음이 생긴 명리적 이유를 서술하세요. "단순한 외모나 상황이 아닌, 사주 에너지가 끌어당기는 구조"로 설명. 일지 음양합(${eumYangHap})과 지지 합(${crossInteractions}) 결과를 활용해 "두 사람 사이에 흐르는 보이지 않는 인력"을 묘사하세요.

▶ 상대방 눈에 나는 어떻게 보이는가 (200~260자)
상호 인식 가능성(${reciprocalCheck})을 근거로 ${otherName}이 ${myName}을 어떻게 바라보는지 솔직하게 분석하세요. 십성 분포 비교(${sipseongCompare})를 활용해 "상대방 사주에서 나는 어떤 오행·십성으로 인식되는지" 분석. 상대방이 호감을 느낄 때 보이는 행동 신호 2가지를 구체적으로 제시하세요.

▶ 마음이 이어질 가능성 (220~280자)
오행 분포 비교와 지지 합충 구조를 근거로 이 감정이 서로의 인연으로 발전할 가능성을 분석하세요. 높음·보통·낮음을 명확히 판정하고 명리적 근거를 제시. 장애가 되는 구조(충·기신 충돌)와 가능성을 높이는 구조(합·용신 충족)를 모두 솔직하게 서술하세요.

▶ 이런 행동은 멀어지게 한다 (180~240자)
${myName}의 오행·십성 구조에서 ${otherName}을 멀어지게 하는 행동 패턴 2가지를 구체적으로 묘사하세요. "사주에서 이 사람이 무의식적으로 하게 되는 행동 중 상대가 불편해할 것"을 분석. 반대로 "${otherName}의 마음을 여는 구체적 접근법" 2가지도 제시하세요.

▶ 고백 타이밍과 처방 (160~200자)
두 사람의 사주 구조에서 고백하기 좋은 상황의 조건과 피해야 할 타이밍을 서술하세요. 용신 오행 기반으로 함께하면 좋은 장소·활동 2가지를 추천. 마지막은 ${myName}에게 보내는 응원의 한 문장으로 마무리.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const sipseongCompare = buildGunghapSipseong(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 소울메이트 관계를 아래 6개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,600~2,200자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 일지 음양합
${eumYangHap}

▶ 두 사람 지지 합·충·삼합
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 십성 분포 비교
${sipseongCompare}

▶ 소울메이트 명리 지표
${evidenceStr}

▶ 오행 보완 구조
${myName} 결핍: ${myMissing.join('·') || '없음'} / ${otherName} 결핍: ${otherMissing.join('·') || '없음'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 6개 섹션을 순서대로 작성하세요]

▶ 이 인연의 명리적 정체 (200~260자)
소울메이트 명리 지표(${evidenceStr})를 근거로 두 사람이 왜 서로를 "설명할 수 없이 통하는 사람"으로 느끼는지 서술하세요. 일간 오행 관계(${elRel})와 일지 음양합(${eumYangHap})으로 "이 인연의 명리적 정체"를 한마디로 선언. "두 사람은 ~한 인연이다"로 시작하세요.

▶ 영혼의 공명 — 왜 통하는가 (220~280자)
지지 합·삼합 결과(${crossInteractions})를 근거로 두 사람 사이에 흐르는 보이지 않는 연결을 묘사하세요. 일간이 동일하다면 비화(비견)의 공명 구조를, 다르다면 상생·상극에서 나오는 당김의 에너지를 설명. 십성 분포 비교(${sipseongCompare})에서 "서로가 서로를 어떤 존재로 인식하는지"도 분석하세요.

▶ 서로가 서로를 완성하는 구조 (200~260자)
오행 분포 비교와 결핍 오행 상보 관계를 근거로 두 사람이 어떻게 서로를 완성하는지 서술하세요. "${myName}이 ${otherName}에게 주는 것"과 "${otherName}이 ${myName}에게 주는 것"을 각각 구체적으로 묘사. 함께할 때 두 사람이 개인으로서 더 온전해지는 이유를 설명하세요.

▶ 소울메이트도 겪는 갈등 (180~240자)
이 두 사람 사이에 생길 수 있는 갈등 패턴을 지지 충·형·용신 충돌 구조로 서술하세요. "소울메이트라도 사주 구조상 반복되는 오해나 충돌 패턴"을 2가지 구체적으로 묘사. 단, 단점 지적 후 "이 갈등도 결국 두 사람을 더 깊게 연결한다"는 관점의 처방으로 마무리하세요.

▶ 이 인연에서 각자가 성장하는 것 (160~220자)
이 소울메이트 관계를 통해 ${myName}이 성장하는 것과 ${otherName}이 성장하는 것을 분석하세요. "이 인연이 단순한 편안함이 아닌 서로를 더 나은 존재로 만드는 이유"를 오행·십성 구조로 설명하세요.

▶ 이 인연을 지키는 처방 (150~200자)
소울메이트 관계가 오래 유지되려면 두 사람이 지켜야 할 것 3가지: 1) 지지 합·충 구조에서 나오는 핵심 조언, 2) 용신 오행 기반 함께하기 좋은 활동, 3) 이 인연이 가진 가장 아름다운 가능성 한 문장.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);

  return `당신은 사주명리 전문가입니다. 두 사람의 라이벌 관계를 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,300~1,800자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 라이벌 역학 구조
${rivalDynamic}

▶ 에너지 균형
${growthSynergy}
비겁: ${myName} ${myBijeop}개 / ${otherName} ${otherBijeop}개

▶ 성장·소진 여부
${winLoseCheck}

▶ 의지력·지속력 (관성)
${myName} 관성: ${myGwan}개 / ${otherName} 관성: ${otherGwan}개
${myGwan + otherGwan >= 4 ? '관성 강함 — 지는 것을 참지 못하는 기질, 과도한 경쟁 소진 주의' : '관성 적정 — 과정 중심 경쟁 가능'}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 이 라이벌 관계의 정체 (180~240자)
라이벌 역학 구조(${rivalDynamic})를 근거로 두 사람의 경쟁이 어떤 종류인지 한마디로 선언하세요. "이 두 사람은 ~한 방식으로 서로를 자극하는 라이벌이다"로 시작. 일간 오행 관계(${elRel})가 경쟁 방식에 어떤 영향을 미치는지 서술하세요.

▶ 서로가 서로에게 주는 자극 (200~260자)
오행 분포 비교와 지지 합충(${crossInteractions})을 근거로 두 사람이 경쟁하면서 어떻게 서로를 성장시키는지 서술하세요. 에너지 균형(${growthSynergy})으로 "대등한 라이벌인지, 한쪽이 더 강한 라이벌인지" 분석. 경쟁 중에 의도치 않게 서로를 돕게 되는 구조가 있다면 구체적으로 설명하세요.

▶ 라이벌 관계의 그림자 (180~240자)
성장·소진 여부(${winLoseCheck})와 비겁·관성 과다 여부를 근거로 이 경쟁이 어떻게 독이 될 수 있는지 서술하세요. "경쟁심이 지나쳐 서로를 소진시키는 패턴", "이기려는 욕구가 오히려 발목을 잡는 상황"을 2가지 구체 장면으로 묘사. 각 패턴마다 자기 보호 처방 1문장.

▶ 라이벌을 활용해 성장하는 전략 (180~240자)
이 라이벌 관계에서 ${myName}이 최대 성장을 이끌어내는 전략 2~3가지를 제시하세요. "상대방의 이런 점에서 자극을 받아라", "이런 분야에서만 경쟁하고 이런 분야는 협력으로 전환하라"는 식의 구체적 조언. 라이벌을 적이 아닌 거울로 활용하는 방법을 서술하세요.

▶ 이 경쟁의 최종 가치 (130~180자)
이 라이벌 관계가 장기적으로 두 사람에게 주는 가장 큰 가치를 서술하세요. 경쟁을 통해 각자가 더 강해지는 부분, 이 관계가 끝나도 남는 것, 그리고 이 라이벌이 결국 좋은 동료가 될 가능성을 한 문장으로 마무리.

`;
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

  const crossInteractions = buildCrossJiziInteractions(me, other, myName, otherName);
  const ohaengCompare = buildOhaengCompare(me, other, myName, otherName);
  const sipseongCompare = buildGunghapSipseong(me, other, myName, otherName);
  const energyFlow = me.isStrong && !other.isStrong
    ? `${myName}(신강)이 ${otherName}(신약)을 이끄는 구조 — 자연스러운 멘토(${myName}) 에너지`
    : !me.isStrong && other.isStrong
    ? `${otherName}(신강)이 ${myName}(신약)을 이끄는 구조 — ${otherName}이 멘토 역할 자연스러움`
    : '비슷한 신강신약 — 수평적 성장 파트너십, 서로 다른 분야에서 번갈아 이끔';

  return `당신은 사주명리 전문가입니다. 두 사람의 멘토·멘티 관계를 아래 5개 섹션으로 풀이하세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 수치·판정 변경 금지. 흐린 표현 2회 이하.
- 각 섹션 본문에 달·별·계절·자연 이미지를 활용한 은유 표현 1문장 포함.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것. 총 분량: 1,300~1,800자.

[${myName} 사주]
${buildPersonBlock(me, myName)}

[${otherName} 사주]
${buildPersonBlock(other, otherName)}

▶ 일간 오행 관계
${elRel}

▶ 두 사람 지지 합·충
${crossInteractions}

▶ 오행 분포 비교
${ohaengCompare}

▶ 십성 분포 비교
${sipseongCompare}

▶ 멘토·멘티 오행 구조
${mentorStructure}

▶ 지식 전달·학습 역량
${transmissionCheck}

▶ 창의·영감 교류
${creativityCheck}

▶ 에너지 흐름 (신강신약)
${energyFlow}

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 5개 섹션을 순서대로 작성하세요]

▶ 이 성장 관계의 명리 구조 (180~240자)
멘토·멘티 오행 구조(${mentorStructure})와 에너지 흐름(${energyFlow})을 근거로 두 사람의 성장 관계가 어떤 방향으로 흐르는지 서술하세요. "누가 가르치고 누가 배우는지", 또는 "서로가 서로의 어떤 부분을 이끄는지"를 명확히 선언하세요. 일간 오행 관계(${elRel})가 이 배움의 관계에 어떤 색을 입히는지도 묘사하세요.

▶ 배움의 방식과 시너지 (200~260자)
지식 전달 역량(${transmissionCheck})과 창의·영감 교류(${creativityCheck})를 근거로 두 사람이 가장 효과적으로 배우고 가르치는 방식을 서술하세요. "이론 전달인지, 경험 공유인지, 아이디어 교환인지"를 십성 분포로 분석. 두 사람이 함께할 때 가장 빠르게 성장하는 분야와 방법론 2가지를 구체적으로 제시하세요.

▶ 멘토십의 그림자 (180~240자)
이 성장 관계에서 생길 수 있는 갈등 패턴 2가지를 구체적으로 묘사하세요. "멘토의 과한 개입이 멘티의 식신(창의성)을 억압하는 구조", "멘티가 멘토를 넘어설 때 생기는 역학 변화" 등 명리 구조로 설명. 갈등이 생겼을 때 관계를 회복하는 방법 1가지씩 제시하세요.

▶ 각자에게 주는 성장 (160~220자)
이 관계에서 ${myName}이 얻는 것과 ${otherName}이 얻는 것을 각각 분석하세요. "배우는 것"만이 아니라 "가르치면서 성장하는 것"도 포함. 오행 상보 관계와 십성 구조를 근거로 이 멘토십이 두 사람의 인생에 어떤 영향을 미치는지 서술하세요.

▶ 멘토십을 오래 지속하는 처방 (140~180자)
이 성장 관계가 오래 유지되는 3가지 조건: 1) 역할 경계를 지키는 방법, 2) 서로의 에너지를 살리는 소통 방식, 3) 멘티가 멘토를 넘어섰을 때 더 좋은 파트너가 되는 방법. 마지막은 이 관계가 가진 가장 아름다운 가능성 한 문장.

`;
};

// ─────────────────────────────────────────────
// 반려동물 궁합 — 특화 프롬프트 (사주는 주인만 실제 데이터, 동물은 상징 기운 매핑)
// 재미 카테고리이지만 타당성 확보: 주인 사주 해석 기반 + 동물 종별 상징 기운으로 "같이 사는 케미"를 풀어낸다
// ─────────────────────────────────────────────

export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'hamster' | 'bird' | 'turtle' | 'fish' | 'other';

/** 동물 종별 상징 기운 매핑 — 명리학적 강제는 아니며, 전통 상징·민담·현대 정서 혼합 */
export const PET_SPECIES_VIBE: Record<PetSpecies, {
  label: string;
  emoji: string;
  elements: string[];   // 상징 오행 (1~2개)
  keywords: string[];   // 기운 키워드 3개
  note: string;         // 이 종이 주인에게 주는 에너지 한 줄
}> = {
  dog:     { label: '강아지', emoji: '🐶', elements: ['화','토'], keywords: ['활발','충성','따뜻함'],     note: '무조건적인 애정과 매일의 활력을 주는 작은 태양' },
  cat:     { label: '고양이', emoji: '🐱', elements: ['금','수'], keywords: ['독립','신비','우아'],       note: '고요한 거리감 속에 숨은 깊은 신뢰의 별' },
  rabbit:  { label: '토끼',   emoji: '🐰', elements: ['목','수'], keywords: ['섬세','조심','생명력'],    note: '조용한 봄기운을 품은 작은 달빛' },
  hamster: { label: '햄스터', emoji: '🐹', elements: ['화','목'], keywords: ['빠름','호기심','귀여움'], note: '작지만 빛나는 에너지가 하루를 간지럽히는 별똥별' },
  bird:    { label: '새',     emoji: '🐦', elements: ['화','금'], keywords: ['자유','영감','경쾌'],     note: '창공의 바람처럼 일상에 영감과 노래를 실어주는 존재' },
  turtle:  { label: '거북이', emoji: '🐢', elements: ['수','토'], keywords: ['장수','묵묵함','안정'],   note: '조용한 강물처럼 흐르며 함께 나이 들어가는 동반자' },
  fish:    { label: '물고기', emoji: '🐟', elements: ['수'],     keywords: ['흐름','고요','정화'],     note: '말없는 물의 기운으로 마음을 씻어주는 고요한 벗' },
  other:   { label: '기타',   emoji: '🐾', elements: ['토'],     keywords: ['든든함','고유함','특별함'], note: '세상에 하나뿐인 고유한 기운을 가진 특별한 존재' },
};

/** UI용 성격 키워드 선택지 */
export const PET_PERSONALITY_OPTIONS: string[] = [
  '활발한', '조용한', '장난꾸러기', '겁이 많음', '애교가 많음',
  '독립적', '먹보', '귀염둥이', '호기심 많음', '까다로움',
];

export interface PetInput {
  name: string;
  species: PetSpecies;
  gender: 'male' | 'female' | 'unknown';
  personalityKeywords: string[]; // 0~3개
  birthDate?: string;   // YYYY-MM-DD (선택)
  adoptionDate?: string; // YYYY-MM-DD (선택)
}

/**
 * 반려동물 궁합 프롬프트.
 * - 주인 사주는 실제 명리 데이터(buildPersonBlock 재사용)
 * - 반려동물 쪽은 종별 상징 기운 + 성격 키워드로 주입
 * - 출력 분량 700~900자 (다른 궁합보다 짧게, 가볍게)
 * - 첫 줄 은유 제목 / 섹션 4개 / 마지막 재미 해석 안내
 */
export const generatePetGunghapPrompt = (
  owner: SajuResult,
  ownerName: string,
  pet: PetInput,
): string => {
  const vibe = PET_SPECIES_VIBE[pet.species];
  const speciesLine = `${vibe.label} ${vibe.emoji} · 상징 기운: ${vibe.elements.join('·')}오행 (${vibe.keywords.join('·')})`;
  const genderLine = pet.gender === 'male' ? '수컷' : pet.gender === 'female' ? '암컷' : '성별 모름';
  const personalityLine = pet.personalityKeywords.length > 0
    ? pet.personalityKeywords.join('·')
    : '특별히 표시된 키워드 없음';
  const adoptionLine = pet.adoptionDate
    ? `함께한 날: ${pet.adoptionDate} — 이 시기의 기운이 두 존재의 첫 연결을 상징합니다.`
    : '함께한 날 정보 없음 — 언제 만났든 지금의 인연이 의미 있습니다.';
  const birthLine = pet.birthDate
    ? `${pet.name}의 생일: ${pet.birthDate}`
    : `${pet.name}의 정확한 생일은 모름 (반려동물의 생시는 대부분 불명이라 자연스러운 일입니다)`;

  return `당신은 사주명리 전문가이자 반려동물 라이프스타일 컨설턴트입니다.
주인의 사주와 반려동물의 상징 기운을 엮어 두 존재의 '같이 사는 케미'를 따뜻하고 재미있게 풀어주세요.

[절대 규칙]
- Markdown·이모지 금지. 섹션 제목은 "▶ 제목" 형식으로만.
- 주인(${ownerName})의 사주 데이터는 실제 명리 기반으로 해석. 반려동물(${pet.name})의 기운은 종별 상징 매핑이며, "정통 사주가 아닌 재미 해석"임을 본문 1~2곳에 자연스럽게 녹일 것.
- 출력은 첫 줄에 관계를 상징하는 은유 제목(7~14자)으로 시작. 대괄호·섹션 태그·식별자는 절대 출력하지 말 것.
- 각 섹션 본문에 달·별·계절·자연 이미지 은유 1문장 이상 포함.
- 친근한 말투 허용: "우리 ${pet.name}", "${pet.name}이(가) ~해줘요" 같은 따뜻한 호칭 사용.
- 총 분량: 700~900자. 재미 카테고리이므로 과하게 심각하거나 장황하지 않게.
- 예언·경고 어조 금지. 주인-반려동물의 일상 케미·케어 포인트에 집중.

[주인 ${ownerName} 사주]
${buildPersonBlock(owner, ownerName)}

[반려동물 ${pet.name} 정보]
${speciesLine}
성별: ${genderLine}
성격 키워드: ${personalityLine}
종의 상징 메시지: ${vibe.note}
${birthLine}
${adoptionLine}

${METAPHOR_SHORT_GUIDE}
${METAPHOR_TITLE_RULE}

[작성 지침 — 아래 4개 섹션을 순서대로 작성하세요]

▶ 우리 ${pet.name}이(가) 당신에게 주는 에너지 (200~260자)
주인(${ownerName})의 일간 오행과 ${pet.name}의 상징 기운(${vibe.elements.join('·')})이 만나 어떤 일상의 균형을 만드는지 풀어주세요. 주인의 부족한 오행을 ${pet.name}이 채워준다면 구체적으로. 주인의 신강신약과 ${pet.name}의 ${vibe.keywords[0]}·${vibe.keywords[1]} 기운이 어떻게 서로를 보완하는지 일상 장면 1개로 묘사. 성격 키워드(${personalityLine})가 있다면 그중 1개를 근거로 활용.

▶ 당신이 ${pet.name}에게 맞춰주면 좋은 부분 (180~240자)
주인의 기질(격국·신강신약 기반)로 봤을 때 ${pet.name}에게 혹시 놓치기 쉬운 부분이 뭔지, 그리고 ${vibe.label} 종 특성상 ${pet.name}이 원하는 케어 포인트가 무엇인지 연결해서 풀어주세요. 일상에서 실천할 수 있는 구체 제안 2가지 포함 (예: 놀이 방식, 공간 배치, 교감 시간대).

▶ 함께할 때 빛나는 시간대와 활동 (150~200자)
주인의 용신 오행을 근거로 ${pet.name}과 함께하면 좋은 시간대(오전/오후/저녁 중)와 활동(산책·실내놀이·간식·조용한 시간 등)을 구체적으로 추천. ${vibe.label}의 기본 리듬도 고려해 현실적으로.

▶ 이 관계가 더 깊어지는 개운 팁 (120~160자)
이 관계를 통해 주인이 얻는 정서적·운기적 선물을 한 문장으로. 이어서 관계를 오래 따뜻하게 유지하는 실용 팁 2가지 (예: 사진·기록 남기기, 함께하는 기념일 챙기기, 주기적 건강 체크). 마지막 줄에 "반려동물 궁합은 주인의 사주와 동물 상징 기운으로 엮은 재미 해석이에요" 같은 한 줄을 자연스럽게 녹여 마무리.

`;
};

// ============================================================
// 상담소 — 챗봇 시스템 프롬프트
// ============================================================

export interface ConsultationStatus {
  relationshipStatus?: string;  // 연애상태 (솔로/연애중/결혼/기타)
  job?: string;                 // 직업/일
}

/**
 * SajuResult + Profile + Status를 종합해 상담소 시스템 프롬프트 생성.
 * 사용자의 질문에 대해 사주 데이터 기반으로 친근하고 구체적인 해설을 생성하도록 유도.
 */
function getTenGodForMonth(dayGan: string, targetGan: string): string {
  const map = (TEN_GODS_MAP as Record<string, Record<string, string>>)[dayGan] || {};
  return map[targetGan] || '';
}

// 월지(사주력 월 → 지지)
const _MONTH_BRANCH_MAP: Record<number, string> = {
  1: '인', 2: '묘', 3: '진', 4: '사', 5: '오', 6: '미',
  7: '신', 8: '유', 9: '술', 10: '해', 11: '자', 12: '축',
};

// 오호전환: 연간 → 인월의 천간 (비등간 동일 그룹)
const _WUHO: Record<string, Record<number, string>> = {
  '갑': { 1: '병', 2: '정', 3: '무', 4: '기', 5: '경', 6: '신', 7: '임', 8: '계', 9: '갑', 10: '을', 11: '병', 12: '정' },
  '기': { 1: '병', 2: '정', 3: '무', 4: '기', 5: '경', 6: '신', 7: '임', 8: '계', 9: '갑', 10: '을', 11: '병', 12: '정' },
  '을': { 1: '무', 2: '기', 3: '경', 4: '신', 5: '임', 6: '계', 7: '갑', 8: '을', 9: '병', 10: '정', 11: '무', 12: '기' },
  '경': { 1: '무', 2: '기', 3: '경', 4: '신', 5: '임', 6: '계', 7: '갑', 8: '을', 9: '병', 10: '정', 11: '무', 12: '기' },
  '병': { 1: '경', 2: '신', 3: '임', 4: '계', 5: '갑', 6: '을', 7: '병', 8: '정', 9: '무', 10: '기', 11: '경', 12: '신' },
  '신': { 1: '경', 2: '신', 3: '임', 4: '계', 5: '갑', 6: '을', 7: '병', 8: '정', 9: '무', 10: '기', 11: '경', 12: '신' },
  '정': { 1: '임', 2: '계', 3: '갑', 4: '을', 5: '병', 6: '정', 7: '무', 8: '기', 9: '경', 10: '신', 11: '임', 12: '계' },
  '임': { 1: '임', 2: '계', 3: '갑', 4: '을', 5: '병', 6: '정', 7: '무', 8: '기', 9: '경', 10: '신', 11: '임', 12: '계' },
  '무': { 1: '갑', 2: '을', 3: '병', 4: '정', 5: '무', 6: '기', 7: '경', 8: '신', 9: '임', 10: '계', 11: '갑', 12: '을' },
  '계': { 1: '갑', 2: '을', 3: '병', 4: '정', 5: '무', 6: '기', 7: '경', 8: '신', 9: '임', 10: '계', 11: '갑', 12: '을' },
};

/**
 * 월운 문자열 생성 — 절기 기반으로 정확하게 12개월 나열.
 * 현재 세운(연간) 천간을 WUHO에 넣어 각 사주력 월(인월=1 ~ 축월=12)의 월간을 계산.
 * AI가 "몇 월"을 말할 때 절기 경계를 명시하도록 절기 명·시작일도 함께 제공.
 */
function buildMonthUnsStr(saju: SajuResult, seWoon: SeWoon | undefined): string {
  if (!seWoon?.gan) return '월운 데이터 없음';
  const yearGan = seWoon.gan;
  const year = seWoon.year;

  // JEOLIP_DATA를 런타임에 require하지 않기 위해 직접 임포트된 값을 사용해야 하지만
  // 이 파일은 SajuResult만 다루므로, 간략화: 절기 시작월 대응표(양력월→사주력월)만 사용.
  // 사주력 월 1(인월) = 양력 2월 입춘~3월 경칩 전 … 사주력 월 12(축월) = 양력 1월 소한~2월 입춘 전.
  const SAJU_MONTH_RANGE: Record<number, string> = {
    1: '2월 초순(입춘)~3월 초순(경칩)',
    2: '3월 초순(경칩)~4월 초순(청명)',
    3: '4월 초순(청명)~5월 초순(입하)',
    4: '5월 초순(입하)~6월 초순(망종)',
    5: '6월 초순(망종)~7월 초순(소서)',
    6: '7월 초순(소서)~8월 초순(입추)',
    7: '8월 초순(입추)~9월 초순(백로)',
    8: '9월 초순(백로)~10월 초순(한로)',
    9: '10월 초순(한로)~11월 초순(입동)',
    10: '11월 초순(입동)~12월 초순(대설)',
    11: '12월 초순(대설)~1월 초순(소한)',
    12: '1월 초순(소한)~2월 초순(입춘)',
  };

  const lines: string[] = [];
  for (let sajuMonth = 1; sajuMonth <= 12; sajuMonth++) {
    const gan = _WUHO[yearGan]?.[sajuMonth] || '?';
    const zhi = _MONTH_BRANCH_MAP[sajuMonth];
    const tenGod = getTenGodForMonth(saju.dayMaster, gan);
    lines.push(`${gan}${zhi}(${tenGod}) — ${SAJU_MONTH_RANGE[sajuMonth]}`);
  }
  return `${year}년 월운 (절기 기준):\n${lines.join('\n')}`;
}

export function buildConsultationSystemPrompt(
  saju: SajuResult,
  profile: { name: string; birth_date: string; gender: 'male' | 'female'; calendar_type: 'solar' | 'lunar' },
  status: ConsultationStatus,
): string {
  const p = saju.pillars;
  const sipseongStr = formatSipseongCounts(computeSipseongCounts(saju));
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().getMonth() + 1;

  // 대운 — startAge/endAge는 연도(year)이므로 currentYear로 비교
  const _now = new Date();
  const _birth = new Date(profile.birth_date);
  let currentAge = _now.getFullYear() - _birth.getFullYear();
  const _md = _now.getMonth() - _birth.getMonth();
  if (_md < 0 || (_md === 0 && _now.getDate() < _birth.getDate())) currentAge--;
  const currentYear_consult = _now.getFullYear();
  const birthYear_consult = _birth.getFullYear();
  const currentDaeWoon = saju.daeWoon.find(d => currentYear_consult >= d.startAge && currentYear_consult <= d.endAge);
  const daeWoonStr = currentDaeWoon
    ? `${currentDaeWoon.gan}${currentDaeWoon.zhi} (${currentDaeWoon.startAge}~${currentDaeWoon.endAge}년, ${currentDaeWoon.startAge - birthYear_consult}~${currentDaeWoon.endAge - birthYear_consult}세, 현재 · ${currentDaeWoon.tenGod})`
    : saju.daeWoon.length === 0
    ? '대운 데이터 없음 (시간미상 프로필)'
    : `대운 전 상태 (첫 대운은 ${saju.daeWoonStartAge}세부터 시작)`;

  // 세운 (안전 가드)
  const seWoon = saju.currentSeWoon;
  const seWoonStr = seWoon
    ? `${seWoon.year}년 ${seWoon.gan}${seWoon.zhi}년 (${seWoon.tenGod}, ${seWoon.animal}띠 해)`
    : '세운 데이터 없음';

  // 월운 — 절기 기반으로 정확히 계산 (JEOLIP_DATA + 오호전환)
  const monthStr = buildMonthUnsStr(saju, seWoon);

  // 신살 (type별 그룹핑 — 길신/흉신 구분해서 제공)
  const goodSins = saju.sinSals.filter(s => s.type === 'good').map(s => s.name);
  const badSins = saju.sinSals.filter(s => s.type === 'bad').map(s => s.name);
  const neutralSins = saju.sinSals.filter(s => s.type === 'neutral').map(s => s.name);
  const sinSalLines: string[] = [];
  if (goodSins.length > 0) sinSalLines.push(`길신: ${goodSins.join(', ')}`);
  if (badSins.length > 0) sinSalLines.push(`흉신: ${badSins.join(', ')}`);
  if (neutralSins.length > 0) sinSalLines.push(`중립: ${neutralSins.join(', ')}`);
  const sinSalStr = sinSalLines.length > 0 ? sinSalLines.join(' / ') : '특별 신살 없음';

  // 합·충·형
  const interactionStr = saju.interactions.length > 0
    ? saju.interactions.map(i => `${i.type}: ${i.description}`).join(' / ')
    : '뚜렷한 합충 없음';

  return `당신은 35년 경력의 노련한 사주명리 상담가입니다. ${profile.name}님의 개인 상담소에 방문한 AI 도사로서, 아래 사주 데이터를 바탕으로 질문에 친근하면서도 명리학적으로 정확한 답변을 제공합니다.

[의뢰인 기본 정보]
이름: ${profile.name}
성별: ${profile.gender === 'male' ? '남성' : '여성'}
생년월일: ${profile.birth_date} (${profile.calendar_type === 'solar' ? '양력' : '음력'})
나이: ${currentAge}세
현재 연애상태: ${status.relationshipStatus || '미입력'}
직업/일: ${status.job || '미입력'}
오늘 날짜: ${today} (${currentMonth}월)

[사주 원국 4주]
연주: ${p.year.gan}${p.year.zhi} (${p.year.ganElement}·${p.year.zhiElement}) / 지장간: ${p.year.hiddenStems.join(',')}
월주: ${p.month.gan}${p.month.zhi} (${p.month.ganElement}·${p.month.zhiElement}) / 지장간: ${p.month.hiddenStems.join(',')}
일주: ${p.day.gan}${p.day.zhi} (일간: ${saju.dayMaster} ${saju.dayMasterElement}·${saju.dayMasterYinYang}간) / 지장간: ${p.day.hiddenStems.join(',')}
시주: ${saju.hourUnknown ? '시간미상' : `${p.hour.gan}${p.hour.zhi} (${p.hour.ganElement}·${p.hour.zhiElement}) / 지장간: ${p.hour.hiddenStems.join(',')}`}

[오행 분포]
목 ${saju.elementPercent.목}% / 화 ${saju.elementPercent.화}% / 토 ${saju.elementPercent.토}% / 금 ${saju.elementPercent.금}% / 수 ${saju.elementPercent.수}%
강한 오행: ${saju.strongElement} / 약한 오행: ${saju.weakElement}

[십성 분포]
${sipseongStr}

[신강·신약]
${saju.strengthStatus} (점수 ${saju.strengthScore}): ${saju.strengthAnalysis}
득령: ${saju.deukRyeong ? 'O' : 'X'} / 득지: ${saju.deukJi ? 'O' : 'X'} / 득세: ${saju.deukSe ? 'O' : 'X'}

[격국]
${determineGyeokguk(saju).name}

[용신·희신·기신]
용신: ${saju.yongSin}(${saju.yongSinElement}) — 보충해야 할 핵심 기운
희신: ${saju.heeSin} — 돕는 기운
기신: ${saju.giSin} — 피해야 할 기운

[신살]
${sinSalStr}

[원국 내 합·충·형]
${interactionStr}

[간여지동 / 병존]
${saju.ganYeojidong.length > 0 ? saju.ganYeojidong.map(g => {
  const pMap: Record<string, string> = { year: '연', month: '월', day: '일', hour: '시' };
  return `${pMap[g.pillar] || g.pillar}주 ${g.gan}${g.zhi}(${g.element})`;
}).join(' / ') : '없음'}

[현재 대운]
${daeWoonStr}

[올해 세운]
${seWoonStr}

[이번 해 월운]
${monthStr}

━━━━━━━━━━━━━━━━━━━━━━━━
[답변 작성 규칙 — 절대 준수]

1. **길이**: 500~800자. 너무 짧으면 성의 없어 보이고(사용자가 "에게?"라고 느낌), 너무 길면 읽기 부담. 4~6단락.

2. **구조** (순서대로):
   - 공감 훅 1~2줄 (이름 호명 + 질문 상황 공감)
   - 핵심 결론 1줄 (두괄식)
   - 명리 근거 (원국·세운·십성 구체 인용)
   - 시기 예측 (월운 기반으로 "몇 월에 어떻다")
   - 개운법 1~2가지 (용신 ${saju.yongSinElement} 기반, 색·방향·행동)
   - 따뜻한 마무리 1줄

3. **말투**: 친근한 구어체 ("~시죠", "~예요", "~해보세요"). 반말·욕설 금지.

4. **개인화**:
   - 이름("${profile.name}님")을 자연스럽게 2~3회 호명
   - 연애상태·직업 정보가 있으면 해당 주제에서 자연스럽게 반영
   - 막연한 답변 금지. "좋습니다" 대신 "7월에 상관 기운이 들어와 표현력이 강해집니다" 식 구체성

5. **명리 인용 방식**:
   - 원국 글자("일지 ${p.day.zhi}") 또는 십성("정재") 직접 인용
   - 용신·기신 활용해서 "이 기운이 부족해서 이런 현상이 생깁니다" 설명
   - 신살은 관련될 때만 1~2개 언급

6. **개운법**:
   - 용신 오행 ${saju.yongSinElement}에 맞는 색·방향·행동 1가지
   - 질문 주제에 맞는 추가 처방 1가지
   - "${saju.yongSinElement === '목' ? '초록색·동쪽·식물' : saju.yongSinElement === '화' ? '붉은색·남쪽·채광' : saju.yongSinElement === '토' ? '노란색·중앙·흙' : saju.yongSinElement === '금' ? '흰색·서쪽·금속' : '검정색·북쪽·물'}"을 기본 공식으로 활용

7. **금지**:
   - Markdown 기호(##, **, -, > 등) 절대 사용 금지. 일반 문장·단락으로만.
   - 이모지 금지.
   - "AI로서", "챗봇으로서" 같은 자기 정체성 언급 금지.
   - "자세한 건 전문가와 상담" 같은 책임 회피 문구 금지.

8. **시기 질문 ("언제?")**: 반드시 위 "이번 해 월운" 데이터를 근거로 구체적 월을 제시하세요. 양력 월로 표현하되, 위 데이터의 절기 범위(예: "2월 초순~3월 초순")를 보고 실제 해당 기간을 정확히 말하세요. "곧", "조만간" 같은 모호한 표현 금지.

9. **대화 연속성**: 이전 대화 내용이 있으면 참고해서 일관된 페르소나 유지.

${METAPHOR_SHORT_GUIDE}
`;
}

// ============================================================
// 더 많은 운세 — 9개 카테고리별 짧은 형식 프롬프트
// (달 크레딧 1개 소모, 400~700자 본문, 핵심만 집중)
// ============================================================

/** 공통 원국 블록 — 더 많은 운세 프롬프트 재사용 */
function buildMoreFortuneBlock(result: SajuResult): string {
  const p = result.pillars;
  const sipseong = formatSipseongCounts(computeSipseongCounts(result));
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().getMonth() + 1;

  const now = new Date();
  const birth = new Date(result.solarDate);
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }

  const sinSalStr = result.sinSals.length > 0
    ? result.sinSals.map(s => `${s.name}(${s.type === 'good' ? '길' : s.type === 'bad' ? '흉' : '중'})`).join(' · ')
    : '특별 신살 없음';

  return `[원국]
연주 ${p.year.gan}${p.year.zhi} / 월주 ${p.month.gan}${p.month.zhi} / 일주 ${p.day.gan}${p.day.zhi} / 시주 ${result.hourUnknown ? '시간미상' : `${p.hour.gan}${p.hour.zhi}`}
일간: ${result.dayMaster} ${result.dayMasterElement}(${result.dayMasterYinYang}간)
오행: 목${result.elementPercent.목}% 화${result.elementPercent.화}% 토${result.elementPercent.토}% 금${result.elementPercent.금}% 수${result.elementPercent.수}%
강한 오행: ${result.strongElement} / 약한 오행: ${result.weakElement}
신강신약: ${result.strengthStatus}(${result.strengthScore})
십성: ${sipseong}
용신: ${result.yongSin}(${result.yongSinElement}) / 기신: ${result.giSin}
신살: ${sinSalStr}
세운(${result.currentSeWoon?.year}): ${result.currentSeWoon?.gan}${result.currentSeWoon?.zhi} (${result.currentSeWoon?.tenGod})
성별: ${result.gender === 'male' ? '남' : '여'} / 나이: ${age}세 / 오늘: ${today} (${currentMonth}월)`;
}

const MORE_COMMON_RULES = `[공통 규칙]
1) Markdown(#, ##, **, \`\`, >) 절대 금지. 이모지 금지. AI 티("AI로서", "분석 결과") 금지.
2) 위 원국 데이터 근거로만 풀이. 없는 데이터 창작 금지.
3) 구어체 "~합니다/~예요". 단정적 톤. "~일 수도 있습니다" 흐린 표현 답변 전체 2회 이하.
4) 첫 줄에 은유 제목 1줄 (대비되는 두 자연 이미지, 쉼표 연결). 본문에서 회수.
5) 시기 질문에는 반드시 구체적 월(양력)을 제시. "곧·조만간" 금지.
6) 마지막에 "- " 불릿 2~3개로 실천 조언.

${METAPHOR_KB}
${METAPHOR_TITLE_RULE}`;

// ─────────────────────────────────────────────
// 1. 애정운 (짧은 버전)
// ─────────────────────────────────────────────
export const generateLoveShortPrompt = (result: SajuResult): string => {
  const p = result.pillars;
  const jaeseongEl = EL_CON[result.dayMasterElement] || ''; // 재성 오행
  const gwanseongEl = Object.entries(EL_CON).find(([, v]) => v === result.dayMasterElement)?.[0] || ''; // 관성 오행

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 애정운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[애정 관련 포커스]
- 일지(배우자궁): ${p.day.zhi}
- ${result.gender === 'male' ? `재성 오행(=이성 에너지): ${jaeseongEl}` : `관성 오행(=이성 에너지): ${gwanseongEl}`}
- 도화·홍염·원진 신살 여부: ${result.sinSals.filter(s => ['도화살', '홍염살', '원진살'].includes(s.name)).map(s => s.name).join(', ') || '특별 신살 없음'}

${MORE_COMMON_RULES}

[작성 지침] 400~550자 내외
1단락 — 공감 한 줄 + 핵심 결론(연애 에너지 강/약)
2단락 — 일지 ${p.day.zhi} 배우자궁과 ${result.gender === 'male' ? `재성(${jaeseongEl})` : `관성(${gwanseongEl})`} 분포로 본 "내가 끌리는 상대 유형"
3단락 — 올해 세운 기준 연애·만남이 활성화되는 달 1~2개 (월운 근거)
4단락 — 관계에서 반복되는 패턴 1개 + "- " 불릿 2~3개 실천 조언`;
};

// ─────────────────────────────────────────────
// 2. 재물운 (짧은 버전)
// ─────────────────────────────────────────────
export const generateWealthShortPrompt = (result: SajuResult): string => {
  const counts = computeSipseongCounts(result);
  const jaeTotal = (counts['정재'] || 0) + (counts['편재'] || 0);
  const siksangTotal = (counts['식신'] || 0) + (counts['상관'] || 0);

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 재물운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[재물 관련 포커스]
- 재성 합계: ${jaeTotal}개 (정재 ${counts['정재'] || 0} / 편재 ${counts['편재'] || 0})
- 식상(재물 생성): ${siksangTotal}개
- 재고(辰戌丑未): ${['진','술','축','미'].filter(z => [result.pillars.year.zhi, result.pillars.month.zhi, result.pillars.day.zhi, result.pillars.hour.zhi].includes(z)).join('·') || '없음'}

${MORE_COMMON_RULES}

[작성 지침] 400~550자 내외
1단락 — 공감 한 줄 + 재물 에너지 한 줄 결론
2단락 — 재성 구조로 본 돈 버는 스타일(월급형·사업형·투자형 중 선택) + 근거
3단락 — 올해 세운 기준 돈이 들어오는 달 / 새는 달 각 1개씩 월운 근거 포함
4단락 — 반복되는 금전 함정 1개 + "- " 불릿 2~3개 실천 조언`;
};

// ─────────────────────────────────────────────
// 3. 직업·진로운
// ─────────────────────────────────────────────
export const generateCareerShortPrompt = (result: SajuResult): string => {
  const counts = computeSipseongCounts(result);
  const gwan = (counts['정관'] || 0) + (counts['편관'] || 0);
  const siksang = (counts['식신'] || 0) + (counts['상관'] || 0);
  const inseong = (counts['정인'] || 0) + (counts['편인'] || 0);
  const gyeokguk = determineGyeokguk(result).name;

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 직업·진로운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[직업 관련 포커스]
- 격국: ${gyeokguk}
- 관성(조직·권위): ${gwan}개 / 식상(창의·기술): ${siksang}개 / 인성(학문·전문성): ${inseong}개
- 일지 12운성: ${result.pillars.day.twelveStage || '—'}

${MORE_COMMON_RULES}

[작성 지침] 400~550자 내외
1단락 — 결론: 조직형인지 독립형인지 + 가장 잘 맞는 직군 2~3개 구체 제시
2단락 — 격국(${gyeokguk})과 관성·식상 비율로 본 적성 근거
3단락 — 이직·승진·창업 중 올해 유리한 행동 + 월운 기반 타이밍 1개
4단락 — 피해야 할 환경 1개 + "- " 불릿 2~3개 실천 조언`;
};

// ─────────────────────────────────────────────
// 4. 건강운
// ─────────────────────────────────────────────
export const generateHealthShortPrompt = (result: SajuResult): string => {
  const organ: Record<string, string> = {
    '목': '간·담(쓸개)', '화': '심장·소장', '토': '비장·위장·췌장',
    '금': '폐·대장', '수': '신장·방광',
  };
  // 지지 → 장부 매핑 (전통 한의학 경락 기준)
  const BRANCH_ORGAN: Record<string, string> = {
    '자': '신장·방광', '축': '비장', '인': '간·담', '묘': '간·담', '진': '비장·위',
    '사': '심장·소장', '오': '심장·소장', '미': '비장', '신': '폐·대장',
    '유': '폐·대장', '술': '위장·비장', '해': '신장·방광',
  };
  const parseOrganImpact = (desc: string): string => {
    const zhis = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
    const found = zhis.filter(z => desc.includes(z));
    if (found.length === 0) return '';
    return ' → ' + found.map(z => `${z}(${BRANCH_ORGAN[z]})`).join(' vs ');
  };
  const weakOrgan = organ[result.weakElement] || '';
  const strongOrgan = organ[result.strongElement] || '';
  // 충·형 구조를 장부 충돌까지 풀어서 제공 (예: "사해충 → 사(심장·소장) vs 해(신장·방광)")
  const chungHyeongDetail = result.interactions
    .filter(i => ['충', '형'].includes(i.type))
    .map(i => `${i.description}${parseOrganImpact(i.description)}`)
    .join(' / ') || '없음';
  // 건강 관련 주의 신살 (혈광/급성)
  const healthRiskKeys = ['백호','양인','겁살','재살','원진','급각','탕화'];
  const healthRisk = result.sinSals
    .filter(s => healthRiskKeys.some(k => s.name.includes(k)))
    .map(s => `${s.name}(${s.type === 'good' ? '길' : s.type === 'bad' ? '흉' : '중'})`)
    .join(' · ') || '없음';

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 건강운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[건강 관련 포커스]
- 약한 오행 ${result.weakElement}(${result.elementPercent[result.weakElement as keyof typeof result.elementPercent]}%) → 취약 장부: ${weakOrgan}
- 강한 오행 ${result.strongElement}(${result.elementPercent[result.strongElement as keyof typeof result.elementPercent]}%) → 과열 장부: ${strongOrgan}
- 주요 충·형(장부 충돌): ${chungHyeongDetail}
- 건강 주의 신살(혈광·급성·돌발): ${healthRisk}
- 올해 세운 오행: ${result.currentSeWoon?.ganElement}·${result.currentSeWoon?.zhiElement}

${MORE_COMMON_RULES}

[작성 지침] 380~520자 내외
1단락 — 결론: 타고난 체질 한 줄 + 올해 특히 주의할 장부 1개 (충·형 장부 충돌 있으면 그걸 우선 지목)
2단락 — 약한 오행(${result.weakElement})이 만드는 증상 2개 구체적 (피로·두통·소화 등 일상 감각으로 묘사)
3단락 — 충·형 장부 충돌 또는 주의 신살이 있으면 그것이 일으킬 수 있는 급성 증상·돌발 상황 1개 구체적으로. 없으면 "특별한 혈광 위험은 없다"고 단정
4단락 — 올해 세운이 건강에 미치는 영향 + 주의할 달 1개
마지막 — "- " 불릿 3개로 실천 습관(피할 음식/추천 음식/생활 리듬)`;
};

// ─────────────────────────────────────────────
// 5. 학업·시험운
// ─────────────────────────────────────────────
export const generateStudyShortPrompt = (result: SajuResult): string => {
  const counts = computeSipseongCounts(result);
  const inseong = (counts['정인'] || 0) + (counts['편인'] || 0);
  const siksang = (counts['식신'] || 0) + (counts['상관'] || 0);
  const hasMunchang = result.sinSals.some(s => s.name.includes('문창') || s.name.includes('학당') || s.name.includes('문곡'));

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 학업·시험운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[학업 관련 포커스]
- 인성(공부 흡수력): ${inseong}개
- 식상(표현·면접·논술): ${siksang}개
- 학업 신살: ${hasMunchang ? '문창·학당·문곡귀인 성립' : '없음'}
- 올해 세운 십성: ${result.currentSeWoon?.tenGod}

${MORE_COMMON_RULES}

[작성 지침] 350~480자 내외
1단락 — 결론: 공부 체질 / 암기형 vs 사고형 / 타고난 학업 유형
2단락 — 인성·식상 비율로 본 시험·면접·자격 중 강한 분야
3단락 — 올해 세운에서 인성·식상이 강해지는 달(월운 근거) → 시험·발표 유리 시기 1~2개
4단락 — "- " 불릿 3개로 공부 전략(시간대·환경·과목 배치)`;
};

// ─────────────────────────────────────────────
// 6. 인간관계·귀인운
// ─────────────────────────────────────────────
export const generatePeopleShortPrompt = (result: SajuResult): string => {
  const counts = computeSipseongCounts(result);
  const bigyeop = (counts['비견'] || 0) + (counts['겁재'] || 0);
  const inseong = (counts['정인'] || 0) + (counts['편인'] || 0);
  const hasCheonEul = result.sinSals.some(s => s.name.includes('천을귀인'));
  const hasGongmang = result.sinSals.some(s => s.name.includes('공망'));
  // 관계 주의 신살 — 배신·갈등·고독·극단성
  const relationRiskMap: Record<string, string> = {
    '백호': '배신·칼부림형 갈등',
    '괴강': '극단적 성격·군림',
    '원진': '미움이 쌓이는 관계',
    '양인': '동업·재물 갈등 칼',
    '고신': '인연 박한 자리(남)',
    '과숙': '인연 박한 자리(여)',
    '격각': '가까워도 멀어지는 관계',
    '상문': '장례·이별 관련',
    '조객': '조문·거리감',
  };
  const relationRisk = result.sinSals
    .map(s => {
      const key = Object.keys(relationRiskMap).find(k => s.name.includes(k));
      return key ? `${s.name}(${relationRiskMap[key]})` : null;
    })
    .filter((x): x is string => x !== null)
    .join(' · ') || '없음';
  // 배우자궁 안정성 — 일지(배우자궁) 충·형·공망
  const dayZhi = result.pillars.day.zhi;
  const spouseTension = result.interactions
    .filter(i => ['충', '형', '파', '해'].includes(i.type) && i.description.includes(dayZhi))
    .map(i => `${i.type}(${i.description})`)
    .join(' / ') || '안정';

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 인간관계·귀인운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[관계 관련 포커스]
- 비겁(동료·경쟁자): ${bigyeop}개
- 인성(윗사람·멘토): ${inseong}개
- 천을귀인 성립(결정적 조력자): ${hasCheonEul ? '예' : '아니오'}
- 공망 여부: ${hasGongmang ? '있음(인연 박한 자리)' : '없음'}
- 경계 신살(배신·갈등·고독): ${relationRisk}
- 배우자궁(일지 ${dayZhi}) 안정성: ${spouseTension}

${MORE_COMMON_RULES}

[작성 지침] 430~580자 내외
1단락 — 결론: 넓은 인맥형 vs 좁고 깊은 우정형
2단락 — 비겁·인성 배치로 본 올해 나를 돕는 사람 유형(연령·성별·관계 구체적으로). 천을귀인 성립 시 그 귀인의 특성을 꼭 묘사
3단락 — **경계 신살이 있으면** 그 신살 원인으로 **구체적 관계 유형 1~2가지**(동업자·연인·가족 등) 명확히 지목. 없으면 "치명적 악연 흐름은 없다"고 단정. 올해 세운 기준 갈등 유발 가능한 달 1개
${spouseTension !== '안정' ? '4단락 — 배우자궁이 흔들리는 구조라 동거·결혼·동업 같은 "장기 관계"에서 갈라짐·반복 이별이 일어나기 쉬움을 직설적으로 묘사' : ''}
마지막 — "- " 불릿 2~3개로 관계 개선 실천 조언 (경계할 유형·거리 둘 타이밍·의지할 사람 포함)`;
};

// ─────────────────────────────────────────────
// 7. 자녀·출산운
// ─────────────────────────────────────────────
export const generateChildrenShortPrompt = (result: SajuResult): string => {
  const counts = computeSipseongCounts(result);
  const jaNyeoStar = result.gender === 'male'
    ? (counts['정관'] || 0) + (counts['편관'] || 0)
    : (counts['식신'] || 0) + (counts['상관'] || 0);
  const siSpot = result.hourUnknown
    ? '시간미상 — 자녀궁 해석 제한'
    : `시주 ${result.pillars.hour.gan}${result.pillars.hour.zhi}`;

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 자녀·출산운을 짧고 명확하게 풀어주세요.

${buildMoreFortuneBlock(result)}

[자녀 관련 포커스]
- 성별 기준 자녀성: ${result.gender === 'male' ? '관성' : '식상'} ${jaNyeoStar}개
- 자녀궁(시주): ${siSpot}
- 올해 세운: ${result.currentSeWoon?.gan}${result.currentSeWoon?.zhi}

${MORE_COMMON_RULES}

[작성 지침] 350~480자 내외 (시간미상이면 자녀궁 언급 최소화)
1단락 — 결론: 자녀복 경향(다자·소자·만득 중 하나)
2단락 — 자녀성 분포로 본 자녀 기질 힌트(활동적·차분·예술적 등)
3단락 — 올해 세운이 자녀성에 어떤 영향을 주는지 + 출산·임신에 유리한 시기 월 1개(월운 근거)
4단락 — "- " 불릿 2개로 자녀 양육 시 유념할 점`;
};

// ─────────────────────────────────────────────
// 8. 성격 심층 분석
// ─────────────────────────────────────────────
export const generatePersonalityShortPrompt = (result: SajuResult): string => {
  const p = result.pillars;
  const gyeokguk = determineGyeokguk(result).name;
  const ganYeojidong = formatGanYeojidong(result);
  const byeongjOn = formatByeongjOn(result);

  return `당신은 35년 경력의 사주명리 전문가입니다. 아래 사람의 타고난 성격을 깊이 있게 풀어주세요.

${buildMoreFortuneBlock(result)}

[성격 포커스]
- 일주: ${p.day.gan}${p.day.zhi} (${p.day.ganElement}일간·${result.dayMasterYinYang})
- 격국: ${gyeokguk}
- 신강신약: ${result.strengthStatus}
- 간여지동: ${ganYeojidong}
- 병존·삼존: ${byeongjOn}

${MORE_COMMON_RULES}

[작성 지침] 500~700자 내외 — 성격은 핵심이니 약간 더 김
1단락 — 은유 제목 + 일주 ${p.day.gan}${p.day.zhi}의 핵심 기질 1줄
2단락 — 격국(${gyeokguk})과 신강신약(${result.strengthStatus})이 만드는 행동 패턴 + 강점 2개 구체적 상황 묘사
3단락 — 숨은 그림자 2개 — 간여지동·병존이 있다면 그 편향성을 꼭 언급
4단락 — 스트레스 받을 때 나타나는 패턴 1개
5단락 — "- " 불릿 3개로 자기관리 조언(내가 빛나는 환경 / 피해야 할 환경 / 관계에서 유의점)`;
};

// ─────────────────────────────────────────────
// 9. 이름 풀이 — 음령오행 + (선택) 한자 자원오행
//   두 경로 모두 동일한 품질을 보장:
//   (a) 한글만 입력 → 음령오행 + 수리오행(획수)로 완결 풀이
//   (b) 한글 + 한자 → 음령 + 자원(부수) + 수리 3축 교차 분석
// ─────────────────────────────────────────────
export interface NameAnalysisInput {
  koreanName: string;       // 필수 — 한글 이름
  koreanInitialsElements: string[];  // 초성별 오행 계산 결과 (예: ['土','金','土'])
  hanjaName?: string;       // 선택 — 한자 이름 (있으면 LLM이 부수 기반 자원오행 판정)
}

export const generateNameFortunePrompt = (
  result: SajuResult,
  nameInput: NameAnalysisInput,
): string => {
  const { koreanName, koreanInitialsElements, hanjaName } = nameInput;

  // 음령오행 분포 카운트
  const countEls = (els: string[]) => {
    const c: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    els.forEach(e => { if (c[e] !== undefined) c[e]++; });
    return c;
  };
  const eumRyeong = countEls(koreanInitialsElements);

  // 용신·기신 오행
  const yongSinEl = result.yongSinElement;
  const EL_GEN_: Record<string, string> = { '목': '화', '화': '토', '토': '금', '금': '수', '수': '목' };
  const EL_CON_: Record<string, string> = { '목': '토', '화': '금', '토': '수', '금': '목', '수': '화' };
  const EL_PAR_: Record<string, string> = { '목': '수', '화': '목', '토': '화', '금': '토', '수': '금' };
  const EL_BY_:  Record<string, string> = { '목': '금', '화': '수', '토': '목', '금': '화', '수': '토' };
  const giSinElement = (() => {
    const g = result.giSin || '';
    const dayEl = result.dayMasterElement;
    if (g.includes('식신') || g.includes('상관')) return EL_GEN_[dayEl];
    if (g.includes('편재') || g.includes('정재')) return EL_CON_[dayEl];
    if (g.includes('편관') || g.includes('정관')) return EL_BY_[dayEl];
    if (g.includes('편인') || g.includes('정인')) return EL_PAR_[dayEl];
    if (g.includes('비견') || g.includes('겁재')) return dayEl;
    return '';
  })();

  const yongSinInEum = koreanInitialsElements.includes(yongSinEl);
  const giSinInEum = !!giSinElement && koreanInitialsElements.includes(giSinElement);

  // 자원오행 판정 규칙 — 부수(部首) 기반 전통 성명학 기준
  // GPT에게 결정적 규칙을 주입해 같은 한자를 매번 동일하게 판정하도록 고정
  const HANJA_RULE_BLOCK = `[자원오행 판정 규칙 — 부수(部首) 기반 전통 성명학]
각 한자의 부수를 식별하고 아래 표로 오행 결정. 창작·추가 규칙 금지.
- 木(목): 木·艸(艹)·竹·禾·米·麻·韭·生·青·香
- 火(화): 火(灬)·日·光·赤·心(忄)·馬·鳥·隹·羽·文·立
- 土(토): 土·山·阝(阜)·宀·穴·田·辶·里·黃·石 일부·玉(일부 금속광물 제외)
- 金(금): 金·刀(刂)·戈·斤·矢·言·皿·車·辛·玉(보석/광물로 볼 때)·石(광석)
- 水(수): 水(氵)·冫·雨·魚·舟·龍·酉·血·耳·月(肉)·雲
부수가 애매하거나 회의문자일 때는 **한자 본의(本義)** 로 판정하고, 판정 근거를 괄호에 명시.`;

  // 한자 블록 — 입력 있을 때만. GPT가 판정 결과를 출력에 명시하도록 강제
  const hanjaBlock = hanjaName
    ? `한자 이름: ${hanjaName}
→ 각 한자별 **부수·자원오행을 먼저 판정**한 뒤 풀이 시작. 판정 결과는 본문 맨 앞 "자원오행 판정" 라인에 반드시 기재.`
    : '한자 이름 미입력 — 음령오행(한글 초성) 기반으로만 분석.';

  return `당신은 35년 경력의 사주명리·성명학 전문가입니다. 아래 사람의 이름이 사주와 어떻게 어울리는지 풀어주세요.

${buildMoreFortuneBlock(result)}

[이름 분석]
한글 이름: ${koreanName}
초성 음령오행: ${koreanInitialsElements.join(' · ') || '(분석 불가 — 한글 아님)'} (분포 목${eumRyeong.목} 화${eumRyeong.화} 토${eumRyeong.토} 금${eumRyeong.금} 수${eumRyeong.수})
${hanjaBlock}

[사주와 이름 조화 — 음령오행 기준]
- 용신(${yongSinEl})이 한글 이름에 ${yongSinInEum ? '있음 — 음령이 용신 보강' : '없음'}
- 기신(${result.giSin}${giSinElement ? `·${giSinElement}` : ''})이 한글 이름에 ${giSinInEum ? '있음 — 음령에 주의 필요' : '없음'}
※ 한자 이름이 있는 경우 자원오행 기준의 용신·기신 일치 여부도 당신이 직접 판정해 풀이에 반영할 것.

${hanjaName ? HANJA_RULE_BLOCK + '\n' : ''}
${MORE_COMMON_RULES}

[작성 지침] ${hanjaName ? '420~580자' : '380~500자'} 내외. 각 단락은 빈 줄로 구분.
${hanjaName ? `**첫 줄(필수)**: \`자원오행 판정\` 라인 — 예시 형식: \`자원오행 판정: 許=金(言부,말씀) · 珍=金(玉부,보석) · 宇=土(宀부,집)\`
` : ''}1단락 — 은유 제목 + 결론 한 줄: 이름이 사주를 돕는가·중립인가·거스르는가 (단정적으로)
2단락 — 한글 음령오행 분포가 사주(용신 ${yongSinEl}·기신 ${result.giSin}·신강신약 ${result.strengthStatus})와 어떻게 맞물리는지 구체 묘사
${hanjaName ? `3단락 — 자원오행(부수 기반)이 음령과 조화를 이루는지, 사주의 약한 오행을 어떻게 보강하는지 구체 분석
4단락 — 음령·자원 교차 평가: 둘 다 용신 보강이면 "좋은 이름", 상충하면 이유 설명. 개명 권장 여부 단정` : '3단락 — 음령 분포만으로 사주 보완이 충분한지, 부족하다면 한자 선택·필명·자주 쓰는 색 등 보완책 제안. 개명 권장 여부 단정'}
마지막 — "- " 불릿 3개로 실천 조언 (필명·SNS ID·자주 쓰는 색·호칭 등 이름 대안 보완)

[금지] 자원오행 판정 규칙에 없는 부수 오행을 창작하지 말 것. 한자가 입력되지 않았으면 자원오행을 임의로 지어내지 말 것.`;
};

// ─────────────────────────────────────────────
// 10. 꿈 해몽 — 사주 무관. 전통 해몽 KB + 맥락 + 감정만으로 해석
// ─────────────────────────────────────────────
function buildContextRulesBlock(): string {
  const lines = CONTEXT_RULES.map(r => `- ${r.action}: ${r.strengthNote}`);
  return `[맥락 규칙 — 같은 상징도 "어떻게 등장했는가"로 의미가 달라진다]\n${lines.join('\n')}`;
}

function buildEmotionRulesBlock(): string {
  const lines = EMOTION_RULES.map(r => `- ${r.emotion} (${r.modifier}): ${r.note}`);
  return `[감정 규칙 — 꿈속 감정이 최종 길흉을 가른다]\n${lines.join('\n')}`;
}

/**
 * 꿈 해몽 프롬프트.
 * 사주 원국·세운과 무관. 순수 꿈 내용만으로 해석한다.
 *
 * @param dreamText 사용자의 꿈 서술(선명 모드 원문 또는 흐릿 모드에서 구조화 → 자연어로 합성된 텍스트)
 */
export const generateDreamInterpretationPrompt = (dreamText: string): string => {
  const trimmed = (dreamText || '').trim().slice(0, 1000);
  const matches = matchDreamSymbols(trimmed, 6);
  const symbolsBlock = buildMatchedSymbolsBlock(matches);
  const reverseNotes = REVERSE_DREAM_NOTES.map((n, i) => `${i + 1}. ${n}`).join('\n');

  return `당신은 35년 경력의 한국 전통 꿈해몽 전문가입니다. 주공해몽·한국 민속 해몽 전통과 현대 심리 해석을 결합해 아래 꿈을 풀어주세요. (사주·생년월일은 사용하지 않습니다. 꿈 자체만으로 해석합니다.)

[사용자가 꾼 꿈]
${trimmed || '(내용 미입력)'}

${symbolsBlock}

${DREAM_TYPE_CHECKLIST}

${buildContextRulesBlock()}

${buildEmotionRulesBlock()}

[역몽(逆夢) 규칙 — 반드시 먼저 점검]
${reverseNotes}

${DREAM_FRAMEWORK}

[출력 규칙]
- Markdown(#, ##, **, \`\`, >) 절대 금지. 이모지 금지. AI 티 나는 표현 금지("AI로서", "분석 결과는" 등).
- 구어체 "~합니다/~예요". 단정적 톤. "~일 수도 있습니다" 흐린 표현 2회 이하.
- 첫 줄에 은유 제목 1줄(대비되는 두 자연 이미지, 쉼표 연결). 본문에서 한 번 회수.
- 마지막에 "- " 불릿 3개로 실천 조언.

[작성 지침] 500~700자 내외
1단락 — 은유 제목 + 꿈 종류 판정 1문장 ("체크리스트 중 N개 부합해 태몽 가능성 높음" 식 근거 포함) + 전체 인상 1줄(길몽/흉몽/혼재 단정)
2단락 — 매칭된 상징 2~3개를 구체적으로 인용. 사용자가 적은 장면을 그대로 한 번 되짚기.
3단락 — 맥락 가중("보았다 vs 품었다") + 감정 가중(감정이 상징을 뒤집는지)으로 해석이 어떻게 조정되는지 설명.
4단락 — 꿈이 가리키는 현실의 구체적 국면(재물/관계/건강/일/자신) 단정적으로 1가지 지목.
마지막 — "- " 불릿 3개로 실천 조언: (1) 앞으로 1주~1달간 해야 할 일 1개, (2) 피해야 할 행동 1개, (3) 길몽이면 활용법·흉몽이면 액막이 조언 1개.

[중요]
- 상징 매칭이 없다면 단정적 해석을 피하고 "꿈 조각과 감정"을 토대로 보수적으로 풀이.
- 역몽 규칙을 반드시 먼저 점검. 피·죽음·불·똥은 길몽 가능성을 1순위로 검토.
- 감정이 상징과 반대 방향이면 "감정이 우선"이라는 전통 원칙대로 감정 쪽으로 해석.
- 꿈 내용이 짧거나 불명확하면 마지막에 "기억나는 게 더 있다면 추가해 다시 물어보시면 더 정확합니다"로 안내.`;
};
