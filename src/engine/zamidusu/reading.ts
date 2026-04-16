/**
 * 자미두수 무료 명반 풀이 합성기
 *
 * iztro 로 계산된 명반과 knowledge.ts 의 별·궁 해설을 결합해
 * AI 없이 완성도 있는 명리 풀이 텍스트를 구성한다.
 */

import type { ZamidusuResult, ZamidusuPalace } from '../zamidusu';
import {
  MAJOR_STARS_META,
  MINOR_STARS_META,
  MUTAGEN_META,
  PALACE_ROLE_META,
} from './knowledge';

export interface StarDetail {
  name: string;
  hanja: string;
  keywords: string[];
  theme: string;
  mutagen?: { name: string; hanja: string; effect: string };
}

export interface PalaceReading {
  index: number;
  name: string;
  role?: string;           // 주관 영역
  ganZhi: string;
  majorStars: StarDetail[];
  minorStars: { name: string; effect: string; category: '6길성' | '4흉성' | '기타' }[];
  summary: string;         // 한 문장 요약
}

export interface ZamidusuReading {
  profileHeadline: string;           // "제왕의 상 · 자미 + 좌보 보좌"
  coreStars: StarDetail[];           // 명궁의 주성
  helperStars: { name: string; effect: string }[];  // 명궁의 6길성
  mutagens: { type: string; star: string; palace: string; effect: string; positive: string; caution: string }[];
  domainSummaries: { palace: string; text: string }[]; // 주요 궁 요약
  advice: string[];
  warnings: string[];
  palaceReadings: PalaceReading[];
}

const KEY_PALACES = ['명궁', '재백궁', '관록궁', '부처궁', '천이궁', '복덕궁'];

function starsToDetails(stars: ZamidusuPalace['majorStars']): StarDetail[] {
  return stars
    .map(s => {
      const meta = MAJOR_STARS_META[s.name];
      if (!meta) return null;
      const mutagen = s.mutagen ? MUTAGEN_META[s.mutagen] : undefined;
      return {
        name: meta.name,
        hanja: meta.hanja,
        keywords: meta.keywords,
        theme: meta.theme,
        mutagen: mutagen
          ? { name: mutagen.name, hanja: mutagen.hanja, effect: mutagen.effect }
          : undefined,
      } as StarDetail;
    })
    .filter((x): x is StarDetail => !!x);
}

function buildPalaceSummary(p: ZamidusuPalace, coreStars: StarDetail[]): string {
  const role = PALACE_ROLE_META[p.name];
  if (coreStars.length === 0) {
    return role
      ? `${p.name}은 공궁이지만 대궁(對宮) 영향을 강하게 받는다. ${role.domain}에서는 대조되는 궁의 기운이 주도권을 쥔다.`
      : '공궁 — 대궁의 영향이 커진다.';
  }
  const names = coreStars.map(s => s.name).join('·');
  const kw = coreStars.flatMap(s => s.keywords).slice(0, 4);
  const mutagenNote = coreStars.find(s => s.mutagen)?.mutagen;
  const mutagenText = mutagenNote ? ` · ${mutagenNote.name}: ${mutagenNote.effect}` : '';
  const domain = role?.domain ?? p.name;
  return `${names}이(가) 좌한 ${p.name}. ${domain}에 ${kw.join('·')}의 기운이 작동한다.${mutagenText}`;
}

export function buildZamidusuReading(chart: ZamidusuResult): ZamidusuReading {
  const myeong = chart.palaces.find(p => p.name === '명궁');
  const coreStars = myeong ? starsToDetails(myeong.majorStars) : [];
  const helperStars = myeong
    ? myeong.minorStars
        .map(s => {
          const m = MINOR_STARS_META[s.name];
          return m && m.category === '6길성' ? { name: m.name, effect: m.effect } : null;
        })
        .filter((x): x is { name: string; effect: string } => !!x)
    : [];

  // 헤드라인 합성
  const coreNames = coreStars.map(s => s.name).join(' · ') || '공궁';
  const helpers = helperStars.map(h => h.name).join(',');
  const profileHeadline = helpers
    ? `명궁에 ${coreNames} 좌한 구조 — 6길성 ${helpers} 보좌`
    : `명궁에 ${coreNames} 좌한 구조`;

  // 사화(mutagen) 전체 수집
  const mutagens: ZamidusuReading['mutagens'] = [];
  chart.palaces.forEach(p => {
    p.majorStars.forEach(s => {
      if (s.mutagen) {
        const m = MUTAGEN_META[s.mutagen];
        if (m) {
          mutagens.push({
            type: s.mutagen,
            star: s.name,
            palace: p.name,
            effect: m.effect,
            positive: m.positive,
            caution: m.caution,
          });
        }
      }
    });
  });

  // 주요 궁 요약
  const domainSummaries = KEY_PALACES.map(name => {
    const p = chart.palaces.find(x => x.name === name);
    if (!p) return null;
    const stars = starsToDetails(p.majorStars);
    return { palace: name, text: buildPalaceSummary(p, stars) };
  }).filter((x): x is { palace: string; text: string } => !!x);

  // 전체 12궁 상세
  const palaceReadings: PalaceReading[] = chart.palaces.map(p => {
    const stars = starsToDetails(p.majorStars);
    const minor: { name: string; effect: string; category: '6길성' | '4흉성' | '기타' }[] = [];
    p.minorStars.forEach(s => {
      const m = MINOR_STARS_META[s.name];
      if (m) minor.push({ name: m.name, effect: m.effect, category: m.category });
    });
    return {
      index: p.index,
      name: p.name,
      role: PALACE_ROLE_META[p.name]?.domain,
      ganZhi: `${p.heavenlyStem}${p.earthlyBranch}`,
      majorStars: stars,
      minorStars: minor,
      summary: buildPalaceSummary(p, stars),
    };
  });

  // 조언·주의
  const advice: string[] = [];
  const warnings: string[] = [];
  const hasSunPolar = coreStars.some(s => s.name === '자미' || s.name === '태양');
  const hasMoney = coreStars.some(s => ['무곡', '천부', '태음'].includes(s.name));
  const hasRebel = coreStars.some(s => ['칠살', '파군', '탐랑'].includes(s.name));
  if (hasSunPolar) advice.push('리더·대표 위치에서 기량을 펼치기 좋음 — 책임 회피 금물');
  if (hasMoney) advice.push('재무·자산 관리 직무에서 특히 빛남 — 부업·투자 공부');
  if (hasRebel) advice.push('개척·창업·변혁 분야 적성 — 조직보다 개인 역량으로 승부');
  if (helperStars.length >= 2) advice.push('귀인·보좌의 복이 있음 — 인맥 관리에 투자');

  mutagens.forEach(m => {
    if (m.type === '화기') warnings.push(`${m.palace}의 화기(${m.star}) — ${m.caution}`);
    if (m.type === '화록' && m.palace === '재백궁') advice.push('재백궁 화록 — 재물운 탁월, 기회 적극 활용');
    if (m.type === '화권' && m.palace === '관록궁') advice.push('관록궁 화권 — 승진·권한 확대의 기운');
  });

  if (warnings.length === 0) warnings.push('특별한 사화기 위협 없음 — 평소의 리듬 유지');
  if (advice.length === 0) advice.push('균형 잡힌 명반 — 여러 분야에서 무난한 성취');

  return {
    profileHeadline,
    coreStars,
    helperStars,
    mutagens,
    domainSummaries,
    advice,
    warnings,
    palaceReadings,
  };
}
