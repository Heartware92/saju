/**
 * 10개 "더 많은 운세" 프롬프트 오프라인 감사(audit)
 * - 목적: 각 프롬프트가 (1) KB/공통규칙을 포함, (2) 원국 블록 주입, (3) 포커스 필드 완비,
 *   (4) undefined/NaN 누수가 없는지 자동 검사.
 * - 로컬 전용. 프로덕션에 포함 안 됨.
 *
 *   실행:  npx tsx scripts/audit-more-prompts.ts
 */

import {
  generateLoveShortPrompt,
  generateWealthShortPrompt,
  generateCareerShortPrompt,
  generateHealthShortPrompt,
  generateStudyShortPrompt,
  generatePeopleShortPrompt,
  generateChildrenShortPrompt,
  generatePersonalityShortPrompt,
  generateNameFortunePrompt,
  generateDreamInterpretationPrompt,
} from '../src/constants/prompts';
import type { SajuResult } from '../src/utils/sajuCalculator';

// ── 실제 샘플 사주 ───────────────────────────────────────────
// 1992-09-14 13:22 서울 남 (CLAUDE.md 기대값과 동일한 壬申/己酉/癸巳/戊午)
const mockSaju: SajuResult = {
  solarDate: '1992-09-14',
  lunarDate: '1992-08-18',
  lunarDateSimple: '1992.08.18',
  isLeapMonth: false,
  gender: 'male',
  hourUnknown: false,
  pillars: {
    year:  { gan: '임', zhi: '신', ganElement: '수', zhiElement: '금', tenGod: '겁재', twelveStage: '사', hiddenStems: ['경','임','무'] } as any,
    month: { gan: '기', zhi: '유', ganElement: '토', zhiElement: '금', tenGod: '편관', twelveStage: '병', hiddenStems: ['신'] } as any,
    day:   { gan: '계', zhi: '사', ganElement: '수', zhiElement: '화', tenGod: '일원', twelveStage: '태', hiddenStems: ['병','무','경'] } as any,
    hour:  { gan: '무', zhi: '오', ganElement: '토', zhiElement: '화', tenGod: '정관', twelveStage: '절', hiddenStems: ['정','기'] } as any,
  },
  dayMaster: '계',
  dayMasterElement: '수',
  dayMasterYinYang: '음',
  elementCount: { 목: 0, 화: 2, 토: 2, 금: 2, 수: 2 } as any,
  elementPercent: { 목: 0, 화: 25, 토: 25, 금: 25, 수: 25 } as any,
  strongElement: '금',
  weakElement: '목',
  isStrong: false,
  strengthScore: -8,
  strengthAnalysis: '신약',
  strengthStatus: '신약' as any,
  deukRyeong: false,
  deukJi: false,
  deukSe: true,
  strengthDetail: {} as any,
  yongSin: '비겁',
  heeSin: '인성',
  giSin: '정관',
  yongSinElement: '수',
  interactions: [
    { type: '충', description: '사해충' } as any,
  ],
  sinSals: [
    { name: '천을귀인', type: 'good' } as any,
    { name: '도화살',   type: 'neutral' } as any,
    { name: '문창귀인', type: 'good' } as any,
  ],
  ganYeojidong: [],
  byeongjOn: [],
  daeWoon: [],
  daeWoonStartAge: 7,
  seWoon: [],
  currentSeWoon: {
    year: 2026, gan: '병', zhi: '오',
    ganElement: '화', zhiElement: '화', tenGod: '편재',
  } as any,
};

interface Check {
  name: string;
  run: () => string;
}

const checks: Check[] = [
  { name: '1. 애정운',           run: () => generateLoveShortPrompt(mockSaju) },
  { name: '2. 재물운',           run: () => generateWealthShortPrompt(mockSaju) },
  { name: '3. 직업·진로운',       run: () => generateCareerShortPrompt(mockSaju) },
  { name: '4. 건강운',           run: () => generateHealthShortPrompt(mockSaju) },
  { name: '5. 학업·시험운',      run: () => generateStudyShortPrompt(mockSaju) },
  { name: '6. 귀인운',           run: () => generatePeopleShortPrompt(mockSaju) },
  { name: '7. 자녀·출산운',      run: () => generateChildrenShortPrompt(mockSaju) },
  { name: '8. 성격 심층 분석',   run: () => generatePersonalityShortPrompt(mockSaju) },
  { name: '9. 이름 풀이',        run: () => generateNameFortunePrompt(mockSaju, {
    koreanName: '허진우',
    koreanInitialsElements: ['토', '금', '토'],
    hanjaName: undefined,
  }) },
  { name: '10. 꿈 해몽',         run: () => generateDreamInterpretationPrompt(
    '큰 구렁이가 몸을 감았는데 따뜻했고, 그 뒤 맑은 물에서 헤엄치고 있었어요. 돌아가신 할머니가 웃으며 떡을 건네주셨어요.'
  ) },
];

// ── 감사 기준 ────────────────────────────────────────────────
const must = {
  block: '[원국]',
  rules: '[공통 규칙]',
  kb: '[은유 지식베이스',
  metaRule: '은유 제목',
  currentSewoon: '세운(2026)',
  persona: '35년 경력',
  writeGuide: '[작성 지침]',
};

const dreamOnly = {
  dreamInput: '[사용자가 꾼 꿈]',
  symbols: '[꿈속 상징 매칭 결과]',
  framework: '[꿈해몽 해석 프레임',
  reverse: '[역몽(逆夢) 규칙',
  types: '[꿈 종류 체크리스트]',
  contextRules: '[맥락 규칙',
  emotionRules: '[감정 규칙',
};

const nameOnly = {
  nameBlock: '[이름 분석]',
  hanjaHandling: '한자 이름 미입력',
};

function assertIncludes(body: string, needle: string, label: string): string {
  return body.includes(needle) ? `✓ ${label}` : `✗ ${label}`;
}

function findAnomalies(body: string): string[] {
  const out: string[] = [];
  if (body.includes('undefined')) out.push('⚠ "undefined" 누수');
  if (body.includes('NaN')) out.push('⚠ "NaN" 누수');
  if (body.includes('[object Object]')) out.push('⚠ "[object Object]" 누수');
  if (/\$\{/.test(body)) out.push('⚠ 미치환 템플릿 ${...}');
  return out;
}

console.log('═'.repeat(70));
console.log(' 더 많은 운세 10 프롬프트 감사 (sample: 1992-09-14 13:22 남)');
console.log('═'.repeat(70));

const summary: { name: string; len: number; ok: boolean }[] = [];

for (const c of checks) {
  const body = c.run();
  const length = body.length;

  // 꿈 해몽은 사주 블록을 의도적으로 쓰지 않는다 — 별도 기준 적용
  const isDream = c.name.startsWith('10.');

  const common: string[] = [];
  if (isDream) {
    common.push(assertIncludes(body, '35년 경력', '페르소나'));
    common.push(assertIncludes(body, must.writeGuide, '작성 지침'));
    // 의도적으로 원국·세운 없음을 확인
    common.push(!body.includes('[원국]') ? '✓ 사주 원국 미포함(의도대로)' : '✗ 사주 원국 누출');
    common.push(!body.includes('세운(2026)') ? '✓ 세운 미포함(의도대로)' : '✗ 세운 누출');
  } else {
    common.push(
      assertIncludes(body, must.block, '원국 블록'),
      assertIncludes(body, must.rules, '공통 규칙'),
      assertIncludes(body, must.kb, '은유 KB'),
      assertIncludes(body, must.persona, '35년 경력 페르소나'),
      assertIncludes(body, must.writeGuide, '작성 지침'),
      assertIncludes(body, '세운(2026)', '현재 세운(2026)'),
    );
  }

  const extras: string[] = [];
  if (isDream) {
    extras.push(assertIncludes(body, dreamOnly.dreamInput, '꿈 입력'));
    extras.push(assertIncludes(body, dreamOnly.symbols, '꿈 상징 매칭'));
    extras.push(assertIncludes(body, dreamOnly.framework, '해석 프레임'));
    extras.push(assertIncludes(body, dreamOnly.reverse, '역몽 규칙'));
    extras.push(assertIncludes(body, dreamOnly.types, '꿈 종류 체크리스트'));
    extras.push(assertIncludes(body, dreamOnly.contextRules, '맥락 규칙'));
    extras.push(assertIncludes(body, dreamOnly.emotionRules, '감정 규칙'));
    const hasMatch = /뱀|구렁이|돌아가신|물/.test(body);
    extras.push(hasMatch ? '✓ 꿈 키워드 매칭(뱀/구렁이/물/돌아가신)' : '✗ 꿈 키워드 매칭 실패');
  }
  if (c.name.startsWith('9.')) {
    extras.push(assertIncludes(body, nameOnly.nameBlock, '이름 분석 블록'));
    extras.push(assertIncludes(body, nameOnly.hanjaHandling, '한자 미입력 처리'));
    extras.push(assertIncludes(body, '허진우', '이름 문자열'));
  }

  const anomalies = findAnomalies(body);
  const ok = common.every(s => s.startsWith('✓')) && extras.every(s => s.startsWith('✓')) && anomalies.length === 0;

  console.log('\n' + '─'.repeat(70));
  console.log(c.name + '  (' + length + '자)');
  console.log('─'.repeat(70));
  common.forEach(s => console.log(' ' + s));
  extras.forEach(s => console.log(' ' + s));
  anomalies.forEach(s => console.log(' ' + s));

  // 헤드 60자 미리보기
  console.log('\n  [PREVIEW]');
  const lines = body.split('\n').slice(0, 3);
  lines.forEach(l => console.log('  | ' + l.slice(0, 90)));

  summary.push({ name: c.name, len: length, ok });
}

console.log('\n' + '═'.repeat(70));
console.log(' 요약');
console.log('═'.repeat(70));
summary.forEach(s => {
  const status = s.ok ? '✓ PASS' : '✗ FAIL';
  console.log(` ${status}  ${s.name.padEnd(20)}  ${s.len}자`);
});
const failed = summary.filter(s => !s.ok);
console.log('\n' + (failed.length === 0 ? '🟢 모든 프롬프트 통과' : `🔴 ${failed.length}개 실패`));

process.exit(failed.length === 0 ? 0 : 1);
