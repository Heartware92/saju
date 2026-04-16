/**
 * 토정비결 무료 풀이 합성기
 * - gwae-table 의 구조적 엔트리를 받아 세부 서사를 결정론적으로 생성
 * - AI 없이 완전한 길이의 독립 풀이 문장 생산
 */

import type { TojeongResult } from '../tojeong';
import { getGwaeEntry, type GwaeEntry, type GwaeGrade } from './gwae-table';

export interface TojeongReading {
  entry: GwaeEntry;
  title: string;
  headline: string;
  grade: GwaeGrade;
  paragraphs: string[];    // 총평 문단들
  monthly: { month: number; keyword: string; text: string }[];
  advice: string[];
  warnings: string[];
}

const DIRECTION_FOR_ELEMENT: Record<string, string> = {
  '목': '동쪽', '화': '남쪽', '토': '중앙', '금': '서쪽', '수': '북쪽',
};

const COLOR_FOR_ELEMENT: Record<string, string> = {
  '목': '초록·연두', '화': '빨강·주황', '토': '노랑·베이지', '금': '흰색·은색', '수': '파랑·검정',
};

function gradeTone(grade: GwaeGrade): string {
  return {
    '대길': '활짝 열리는',
    '길': '순풍이 부는',
    '중길': '차분히 흐르는',
    '평': '담담한',
    '중흉': '신중히 돌아갈',
    '흉': '몸을 낮출',
    '대흉': '크게 물러서야 할',
  }[grade];
}

function buildMonthlyText(month: number, keyword: string, grade: GwaeGrade): string {
  const base = keyword;
  const phrasing: Record<number, string[]> = {
    1: ['한 해의 시작은 ', '정월에는 '],
    2: ['이월의 기운은 ', '겨울 끝자락에 '],
    3: ['봄기운이 오며 ', '삼월에는 '],
    4: ['꽃이 필 무렵 ', '사월에는 '],
    5: ['오월의 기운은 ', '여름을 맞으며 '],
    6: ['반년의 중간 ', '유월에는 '],
    7: ['여름 정점에 ', '칠월에는 '],
    8: ['팔월의 기운은 ', '무더위 끝에 '],
    9: ['가을 초입에 ', '구월에는 '],
    10: ['시월에는 ', '결실의 때에 '],
    11: ['동짓달의 기운은 ', '겨울 초입에 '],
    12: ['한 해를 마무리하는 ', '동지에는 '],
  };
  const prefix = phrasing[month]?.[month % 2] ?? `${month}월에는 `;
  const positive = grade === '대길' || grade === '길' || grade === '중길';
  const tail = positive
    ? '흐름을 타고 나아가기에 좋은 때입니다.'
    : grade === '평'
    ? '큰 굴곡은 없으나 평소 리듬을 유지하세요.'
    : '무리한 결정을 피하고 내실을 다지세요.';
  return `${prefix}${base}의 기운이 돈다. ${tail}`;
}

export function buildTojeongReading(result: TojeongResult): TojeongReading {
  const entry = getGwaeEntry(result.upper, result.middle, result.lower);
  const tone = gradeTone(entry.grade);
  const title = `${result.targetYear}년 ${entry.grade} — ${entry.headline}`;

  const headline =
    entry.grade === '대길' || entry.grade === '길'
      ? `올해는 ${tone} 한 해가 될 기세입니다`
      : entry.grade === '중길' || entry.grade === '평'
      ? `올해는 ${tone} 흐름으로 지나갑니다`
      : `올해는 ${tone} 때 — 몸과 마음을 다스리세요`;

  const upperElement = result.upperGwae.element;
  const lucky = `행운의 방위는 ${DIRECTION_FOR_ELEMENT[upperElement] || '동쪽'}이며, 도움이 되는 색은 ${COLOR_FOR_ELEMENT[upperElement] || '초록'}입니다.`;

  // 문단 3~4개 합성
  const p1 = entry.summary;
  const p2 = `상괘는 ${result.upperGwae.name}(${result.upperGwae.hanja}) — ${result.upperGwae.meaning}. ` +
             `중괘는 ${result.middleGwae.position} — ${result.middleGwae.meaning}. ` +
             `하괘는 ${result.lowerGwae.name} — ${result.lowerGwae.meaning}.`;
  const p3 =
    entry.grade === '대길' || entry.grade === '길'
      ? `전반적으로 기운이 뻗어 나가는 해입니다. 준비한 일을 결행할 수 있으며, 인연과 기회가 스스로 찾아옵니다. 다만 ${entry.keywords[0]}의 흐름이 강해 자신감이 지나쳐 독주하지 않도록 주의하세요.`
      : entry.grade === '중길' || entry.grade === '평'
      ? `큰 돌풍도 벼락도 없이 차분히 흘러가는 해입니다. 작은 성취를 쌓고 인간관계를 정돈하는 데에 좋은 시기이니, 무리하게 확장하기보다 내실을 다지세요.`
      : `올 한 해는 ${entry.keywords[0]}의 기운이 강해 내 뜻대로 풀리지 않는 장면이 많을 수 있습니다. 억지로 밀어붙이면 손해가 크니, 멈춰 서서 주변을 살피고 장기적 관점을 유지하세요.`;
  const p4 = lucky;

  const monthly = entry.monthlyHints.map((hint, i) => ({
    month: i + 1,
    keyword: hint,
    text: buildMonthlyText(i + 1, hint, entry.grade),
  }));

  const advice: string[] = [];
  const warnings: string[] = [];
  if (entry.grade === '대길' || entry.grade === '길') {
    advice.push('중요한 결단·시도·투자는 상반기에 몰아서 진행');
    advice.push('믿을 만한 인연에게 협력 제안 — 결실 가능성 큼');
    advice.push('건강한 습관을 정착시키기에도 좋은 해');
    warnings.push('자만·독주 주의 — 주변 의견 경청');
  } else if (entry.grade === '중길' || entry.grade === '평') {
    advice.push('작은 목표를 설정하고 꾸준히 달성');
    advice.push('가족·지인과의 관계 정돈에 시간 투자');
    advice.push('재정 상태 점검과 절약 습관 형성');
    warnings.push('큰 투자·이직은 신중히 — 근거 없는 결단 금물');
  } else {
    advice.push('몸을 낮추고 공부·정비에 힘쓰기');
    advice.push('지출 축소 및 비상 자금 확보');
    advice.push('건강 검진 — 작은 증상도 조기 대응');
    warnings.push('말·문서 관련 문제 주의');
    warnings.push('낯선 사람과의 금전 거래 금물');
  }

  return {
    entry,
    title,
    headline,
    grade: entry.grade,
    paragraphs: [p1, p2, p3, p4],
    monthly,
    advice,
    warnings,
  };
}
