/**
 * 타로 리딩 합성기 — 78장 덱 기반, AI 없이 결정론적 풀이
 *
 * 뽑힌 카드(정/역)들로부터 맥락별(전반·애정·직업·재물·건강·조언) 해석과
 * 종합 서사를 구성한다.
 */

import { TAROT_DECK, type TarotCard, type TarotElement } from './deck';

export type TarotSpread = 'single' | 'three' | 'question';

export interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  position?: string;  // '오늘' / '상순' / '중순' / '하순' / '질문'
}

export interface TarotContextBlock {
  label: string;        // '전반'
  icon: string;         // '✦'
  text: string;         // 종합 해석 문장
  cardLines: string[];  // 카드별 한 줄 풀이
}

export interface TarotReading {
  spread: TarotSpread;
  headline: string;
  subhead: string;
  drawnCards: DrawnCard[];
  contexts: TarotContextBlock[];
  synthesis: string[];   // 종합 서사 문단
  advice: string[];
  keywords: string[];    // 전체 카드의 주요 키워드 합
}

const ELEMENT_LABEL: Record<TarotElement, string> = {
  Fire: '불(열정·행동)',
  Water: '물(감정·직관)',
  Air: '바람(사고·소통)',
  Earth: '흙(물질·안정)',
  Spirit: '영(초월·변환)',
};

function getMeaning(drawn: DrawnCard) {
  return drawn.isReversed ? drawn.card.reversed : drawn.card.upright;
}

function orientLabel(drawn: DrawnCard) {
  return drawn.isReversed ? '역' : '정';
}

function cardLine(drawn: DrawnCard, key: keyof ReturnType<typeof getMeaning>): string {
  const m = getMeaning(drawn);
  const pos = drawn.position ? `[${drawn.position}] ` : '';
  return `${pos}${drawn.card.nameKr}(${orientLabel(drawn)}) — ${m[key]}`;
}

function summarize(drawn: DrawnCard[], key: keyof ReturnType<typeof getMeaning>): string {
  if (drawn.length === 1) {
    return getMeaning(drawn[0])[key];
  }
  // 3장 이상: 가장 강한 톤을 기준으로 종합
  const reversedCount = drawn.filter(d => d.isReversed).length;
  const leadText = getMeaning(drawn[0])[key];
  if (reversedCount >= Math.ceil(drawn.length / 2)) {
    return `${leadText} 다만 역방향이 우세해 제약이 따르므로, 속도를 조절하고 순리를 따르세요.`;
  }
  return `${leadText} 전체 흐름이 긍정적이니 전반적으로 확장의 기운을 탈 수 있습니다.`;
}

function buildSynthesis(drawn: DrawnCard[], spread: TarotSpread): string[] {
  const paragraphs: string[] = [];

  // 1문단 — 카드 구성 요약
  const cardList = drawn
    .map(d => `${d.position ? d.position + ' ' : ''}${d.card.nameKr}(${orientLabel(d)})`)
    .join(' · ');
  paragraphs.push(`뽑힌 카드는 ${cardList} 입니다.`);

  // 2문단 — 원소 분포
  const elementCount = new Map<TarotElement, number>();
  drawn.forEach(d => {
    elementCount.set(d.card.element, (elementCount.get(d.card.element) ?? 0) + 1);
  });
  const elemTexts = Array.from(elementCount.entries())
    .map(([e, c]) => `${ELEMENT_LABEL[e]}×${c}`)
    .join(', ');
  paragraphs.push(`원소 구성은 ${elemTexts}. 이 기운이 이번 리딩의 배경색을 결정합니다.`);

  // 3문단 — 정/역 균형
  const reversedCount = drawn.filter(d => d.isReversed).length;
  const uprightCount = drawn.length - reversedCount;
  if (reversedCount === 0) {
    paragraphs.push(`모든 카드가 정방향 — 기운이 원활하게 흐르는 국면입니다. 준비된 것을 행동으로 옮기기 좋은 시점이니 결단을 미루지 마세요.`);
  } else if (uprightCount === 0) {
    paragraphs.push(`모든 카드가 역방향 — 외부에서 들어오는 압력이 강합니다. 정면 돌파보다 잠시 물러서 내면을 다지는 편이 유리합니다.`);
  } else {
    paragraphs.push(`정방향 ${uprightCount}장 · 역방향 ${reversedCount}장 — 전진과 정비가 섞인 교차 국면입니다. 어느 쪽이 자기 상황에 맞는지 냉정히 가려서 움직이세요.`);
  }

  // 4문단 — 스프레드별 서사
  if (spread === 'three' && drawn.length === 3) {
    const [a, b, c] = drawn;
    paragraphs.push(
      `흐름으로 읽으면 ${a.position ?? '초반'}의 ${a.card.nameKr}에서 시작해 ${b.position ?? '중반'}의 ${b.card.nameKr}을(를) 거쳐 ${c.position ?? '후반'}의 ${c.card.nameKr}으로 수렴합니다. ` +
      `${getMeaning(a).overall.split('.')[0]}에서 출발해, ${getMeaning(c).advice}`
    );
  } else if (spread === 'single' || spread === 'question') {
    const d = drawn[0];
    const m = getMeaning(d);
    paragraphs.push(`이 한 장이 전하는 핵심은 분명합니다. ${m.overall} ${m.advice}`);
  }

  return paragraphs;
}

function buildAdvice(drawn: DrawnCard[]): string[] {
  const out: string[] = [];
  drawn.forEach(d => {
    const m = getMeaning(d);
    out.push(`${d.position ? d.position + ' ' : ''}${d.card.nameKr}: ${m.advice}`);
  });
  // 전체 공통 조언
  const reversedCount = drawn.filter(d => d.isReversed).length;
  if (reversedCount >= Math.ceil(drawn.length / 2)) {
    out.push('전반적으로 속도를 늦추고, 중요한 결정은 근거를 두 번 확인한 뒤에 실행하세요.');
  } else {
    out.push('흐름이 열려 있을 때 기회를 놓치지 말고, 작은 성취를 빠르게 쌓아 올리세요.');
  }
  return out;
}

function buildHeadline(drawn: DrawnCard[], spread: TarotSpread): { headline: string; subhead: string } {
  const core = drawn[0];
  const m = getMeaning(core);
  const orient = core.isReversed ? '역방향' : '정방향';

  let headline: string;
  if (spread === 'three') {
    const names = drawn.map(d => d.card.nameKr).join(' · ');
    headline = `${names} — 세 장의 서사`;
  } else {
    headline = `${core.card.nameKr} (${orient})`;
  }
  const subhead = m.overall.split('.')[0] + '.';
  return { headline, subhead };
}

export function buildTarotReading(drawn: DrawnCard[], spread: TarotSpread): TarotReading {
  if (drawn.length === 0) throw new Error('buildTarotReading: no cards drawn');

  const { headline, subhead } = buildHeadline(drawn, spread);

  const contexts: TarotContextBlock[] = [
    {
      label: '전반',
      icon: '✦',
      text: summarize(drawn, 'overall'),
      cardLines: drawn.map(d => cardLine(d, 'overall')),
    },
    {
      label: '애정',
      icon: '❤',
      text: summarize(drawn, 'love'),
      cardLines: drawn.map(d => cardLine(d, 'love')),
    },
    {
      label: '직업',
      icon: '⚒',
      text: summarize(drawn, 'career'),
      cardLines: drawn.map(d => cardLine(d, 'career')),
    },
    {
      label: '재물',
      icon: '◈',
      text: summarize(drawn, 'money'),
      cardLines: drawn.map(d => cardLine(d, 'money')),
    },
    {
      label: '건강',
      icon: '✚',
      text: summarize(drawn, 'health'),
      cardLines: drawn.map(d => cardLine(d, 'health')),
    },
  ];

  const synthesis = buildSynthesis(drawn, spread);
  const advice = buildAdvice(drawn);

  const keywords: string[] = [];
  drawn.forEach(d => {
    const k = d.isReversed ? d.card.keywords.reversed : d.card.keywords.upright;
    k.slice(0, 3).forEach(kw => {
      if (!keywords.includes(kw)) keywords.push(kw);
    });
  });

  return {
    spread,
    headline,
    subhead,
    drawnCards: drawn,
    contexts,
    synthesis,
    advice,
    keywords,
  };
}

/**
 * 덱에서 index로 카드 꺼내기 (deckSize 초과 시 mod)
 */
export function cardAt(index: number): TarotCard {
  return TAROT_DECK[index % TAROT_DECK.length];
}
