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
간여지동: ${formatGanYeojidong(result)} / 병존·삼존: ${formatByeongjOn(result)}
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

${METAPHOR_SHORT_GUIDE}

[today_energy] — 90~130자
오늘 일진(${todayGz.gan}${todayGz.zhi})이 내 일간(${pillars.day.gan})에 미치는 십성(${todayGz.tenGodGan}) 에너지를 단정적으로. 오늘 기운의 핵심 성질(상승·소모·충돌·화합 중)과 어떤 상황에서 유리·불리한지 각 1개 구체적으로. 오늘 하루 키워드 1개로 마무리.

[today_work] — 160~210자
일진 기운을 바탕으로 집중이 잘 되는 업무 유형과 막히는 유형을 구체적으로. 오늘 하면 좋은 행동 1개(회의·기획·제출·연락·협상·계약 중 1가지 + 구체적 이유). 피해야 할 행동 1개(구체 상황 + 이유). 오늘 가장 생산적인 시간대 1구간.

[today_love] — 130~170자
오늘 일진 십성(${todayGz.tenGodGan}) 기준으로 잘 통하는 관계 유형과 마찰이 생기기 쉬운 관계 유형 각 1개. 조심할 말투·상황 1가지(구체 예시 포함). 연인·가족·동료 중 오늘 특히 신경 써야 할 관계 1가지와 실천할 행동 1가지.

[today_caution] — 110~150자
오늘 합충(${interStr})에서 생기는 실수 유발 상황 1가지를 구체적 장면으로. 특히 조심해야 할 시간대·감정 상태·물리적 환경 중 1개 선택해 구체화. 이미 벌어졌을 때 대처 방법 1문장.

[today_lucky] — 130~180자
용신(${yongSinElement}) 기운을 오늘 하루 극대화하는 맞춤 처방.
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
용신: ${yongSinElement}(${yongSin})  희신: ${result.heeSin}  기신: ${result.giSin}${result.strengthScore >= 85 || result.strengthScore <= 15 ? `  ★전왕법 적용(점수 ${result.strengthScore}) — 억부 역전 주의` : ''}
격국: ${gyeokguk.name} (판정 근거: ${gyeokguk.reason})
십성 분포: ${sipseong}
신살·길성: ${sinSalStr}
합충형파해: ${interactionStr}
간여지동: ${formatGanYeojidong(result)}
병존·삼존: ${formatByeongjOn(result)}
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

[luck] — 540~640자
작성 순서:
첫 줄: 은유 제목 (현재 대운의 기회와 과제를 달의 차고 기움·계절 전환으로 대비. 예: "반달이 보름달로 차오르는 계절, 아직 남은 그림자" / "황혼이 지나면 열리는 별밤, 지금은 색을 바꾸는 하늘")
빈 줄
본문: 제목 은유로 시작해 현재 대운(${currentDaeWoonStr})을 선언. 그 대운의 간지·오행·십성·12운성이 일·관계·재물 각각에 구체적으로 어떤 영향을 주는지 4~5문장 서술. 어떤 조건에서 유리/불리한지로 쪼갤 것. 이전 대운에서 이월된 미완의 과제 + 다음 대운에서 반드시 준비해야 할 것 각각 2~3문장. 세운(${recentSeWoon})에서 올해·내년·내후년 각각 "어떤 십성이 들어오고, 어떤 국면이 열리며, 무엇을 우선해야 하는가" 형식으로 3~4문장씩. 마지막 문장에서 제목 은유 회수.

[advice] — 구조화 포맷 필수 (파싱에 사용됩니다)
반드시 아래 순서와 형식을 정확히 지킵니다.

첫 줄: 은유 제목 (용신 오행의 개운 방향을 자연 이미지로. 예: "북극성이 가리키는 동쪽, 봄 햇살이 기다리는 곳" / "서리를 녹이는 것은 불꽃이 아니라 봄비")
빈 줄
시간대: (하루 중 유리한 1구간, 예: 오전 6시~9시)
음식: (용신 ${yongSinElement} 오행 보강 식재료 2개, 쉼표로 구분, 예: 부추, 시금치)
빈 줄
(본문 2~3문장: 제목 은유로 시작해 용신 ${yongSinElement} 보강의 의미와 일상 적용을 서술)
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

${METAPHOR_SHORT_GUIDE}

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
격국: ${gyeokguk.name} (판정 근거: ${gyeokguk.reason})
십성 분포: ${sipseong}
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
월별 흐름 — 총 400~500자, 각 월 2~3문장
1월부터 12월까지 순서대로. 위 월별 등급·키워드를 근거로 각 월의 핵심 기운 서술.
포맷 예시: "1월(중길·축적): 새해 시작은..."

[lucky]
행운 처방 — 240~320자
첫 줄: ${year}년을 관통하는 행운 테마를 은유적 제목(7~12자) 1줄로 시작.
이어서 용신(${yongSinElement}) 기준 불릿(- ) 형식으로:
- 보강 음식 2가지 (구체적 식재료·요리명, 왜 도움이 되는지 한 마디)
- 추천 향기·아로마 1가지 (언제 사용하면 좋은지)
- ${year}년 개운 활동 2가지 (용신 오행 원소와 연결된 구체 취미·습관)
- 보석·소품 1가지 (어떻게 활용하면 좋은지)
- 이 해 특히 길한 계절·달 (이유 1문장)
색상·방위·숫자·시간대는 UI에 표시되므로 중복 서술 금지.

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

[overview] — 명반 첫 인상 (280~360자)
첫 줄: 은유 제목 (예: "${z.soul}과 ${z.body}가 만난 밤하늘, 그리고 ${z.fiveElementsClass}으로 흐르는 강물" 같은 느낌)
본문: 명주(${z.soul})·신주(${z.body})·오행국(${z.fiveElementsClass})을 풀이. 명주는 인생의 주제곡, 신주는 숨은 페르소나, 오행국은 별들이 배치된 무대. 세 요소가 엮여서 어떤 인생 톤이 그려지는지 단정적으로 선언. 마지막 문장에서 제목 은유 회수.

[core] — 명궁·신궁 핵심 (360~460자)
첫 줄: 은유 제목 (명궁에 좌한 주성의 성격을 대비 이미지로. 예: "왕좌에 앉은 별, 홀로 빛나는 고독")
본문: 명궁에 좌한 주성들(이름·한자 병기)과 보좌성의 조합이 만드는 기본 성향을 구체적 일상 장면 2개로 묘사. 신궁이 명궁과 같은 위치인지 다른 위치인지에 따라 삶이 어떻게 이중 축으로 움직이는지. 명궁 사화가 있다면 그 별의 성격이 어떻게 변주되는지. 마지막 문장에 제목 은유 회수.

[relations] — 관계 영역 (320~400자)
첫 줄: 은유 제목 (관계의 깊이·갈등 양상을 자연 이미지 대비로)
본문: 부처궁(배우자)·자녀궁·형제궁·노복궁·부모궁 다섯 개 방의 주성·사화를 근거로 관계 영역을 풀이. 각 궁에 어떤 별이 앉았는지 2~3개 언급하고, "배우자는 어떤 성향에 끌리는가", "가족 관계에서 반복되는 패턴", "친구·동료 복은 어떤지"를 구체적으로. 갈등 가능 포인트 1개와 관계 복의 유형 1개.

[wealth] — 재물·일의 하늘 (300~380자)
첫 줄: 은유 제목 (재물이 흐르는 방식·커리어의 모양을 자연 이미지 대비로)
본문: 재백궁(돈 흐름)·관록궁(직업)·전택궁(부동산) 세 개 방의 주성·사화를 근거로 수입 스타일, 적합 직군, 자산 축적 패턴을 풀이. "꾸준히 쌓이는 달빛 같은 돈" vs "혜성처럼 들어왔다 빠지는 돈"처럼 이미지화. 주의할 재물 함정 1개.

[body_mind] — 몸·마음·이동 (280~340자)
첫 줄: 은유 제목 (약한 곳·회복 방식을 자연 이미지 대비로)
본문: 질액궁(건강)·복덕궁(정신·취미)·천이궁(이동·해외)을 묶어 풀이. 취약한 장부(목=간담/화=심장/토=비위/금=폐/수=신장), 스트레스가 쌓이는 방식, 회복 방법, 해외·출장·이사의 길흉. 마음에 쉼이 필요한 순간 묘사.

[mutagen] — 사화의 변주 (260~340자)
첫 줄: 은유 제목 (별이 다른 노래를 부르는 이미지)
본문: 화록·화권·화과·화기 각각이 어느 궁에서 작동하는지, 인생에서 어떻게 드러나는지. 해당 별이 없으면 "이 명반에는 ~사화가 없다"고만 짧게. 특히 **화기가 있는 궁은 반드시 주의 신호**로 한 문장 덧붙이고 대응법 1개 제시. 마지막 문장 은유 회수.

[daehan] — 대한 10년 리듬 (240~320자)
첫 줄: 은유 제목 (무대 조명이 바뀌는 이미지)
본문: 10년 단위로 주인공 궁이 바뀌는 흐름에서 주요 전환점 2~3개를 나이로 명시(예: "28~37세에 접어드는 재백궁 대한"). 각 전환점에서 어떤 별·궁이 활성화되어 무엇을 결단해야 하는지. 현재 대한의 주제 1문장.

[advice] — 별이 건네는 조언 (220~280자)
첫 줄: 은유 제목 (나아갈 방향을 자연 이미지로)
본문 2문장으로 핵심 메시지 — 이 명반의 사람은 어떻게 살면 빛나고 어떤 함정을 조심해야 하는지.
마지막에 "- " 불릿 3줄로 실천 조언 3가지(구체적 행동·색·방향·시기 1개씩 포함).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

출력은 [overview] 마커부터 시작. 마커 이전에 어떤 텍스트도 없어야 함.
총 8개 섹션, 약 2500~3200자.`;
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

위 정보를 바탕으로 ${targetYear}년 토정비결 풀이를 다음 구조로 작성하세요 (총 2400~3000자).

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

4. 분야별 운세 (각 3~4문장)
- 재물운: 들어오는 시기·새는 시기 구분 + 재테크 방향 1개
- 애정/가정운: 연애·부부·가족 중 이달 테마 + 주의 장면 1개
- 건강운: 취약 장부 + 유의할 계절·습관
- 직장/학업운: 승진·이직·시험·자격 중 유리한 흐름 1개 + 조심할 덫 1개

5. 개운 조언 (140~200자) — 불릿 5개
- 올해의 길한 방향 1개
- 길한 색 2개
- 행운 숫자·요일 각 1개
- 이달 안에 실천할 개운 행동 2개

섹션 제목은 위 번호(1. 2. 3. 4. 5.) 형식 그대로 유지하고, 월별 소섹션은 12개를 모두 작성하세요. Markdown # 헤더는 절대 사용하지 마세요.`;
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

${METAPHOR_SHORT_GUIDE}

[taekil_advice]
${taekil.categoryLabel} 택일 추천을 아래 구조로 작성하세요:
- 최고 추천일 1~2개: 날짜 + 명리 이유 1~2문장
- 차선 추천일 1개 (있으면): 날짜 + 한 문장
- 피해야 할 날 1개: 날짜 + 이유 한 문장
- 길시 안내: 추천일 중 길시가 있으면 1문장으로 안내
- 주의사항 1문장: ${taekil.categoryLabel}에 특화된 명리 조언`;
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
    `간여지동: ${formatGanYeojidong(result)} / 병존·삼존: ${formatByeongjOn(result)}`,
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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

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

${METAPHOR_SHORT_GUIDE}

[작성 지침]
멘토·멘티 오행 구조(${mentorStructure})로 두 사람의 성장 관계가 어떤 방향으로 흐르는지 먼저 서술하세요.
지식 전달 역량과 창의·영감 교류를 근거로 어떤 방식의 배움이 가장 효과적인지 서술하세요.
멘토십 관계를 오래 유지하려면 두 사람이 각각 무엇을 조심해야 하는지 1가지씩 제시하세요.

[mentor_gunghap]`;
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
