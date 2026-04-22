/**
 * 프로덕션 /api/ai 스모크 테스트 — 10개 카테고리 실제 AI 호출
 *  - 각 프롬프트를 실제 POST 해서 200 OK + 본문 충분한지 검증
 *  - 병렬 실행으로 전체 소요 시간 단축
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
  SYSTEM_PROMPT,
} from '../src/constants/prompts';
import type { SajuResult } from '../src/utils/sajuCalculator';

const PROD = 'https://saju-hazel.vercel.app';

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
  interactions: [{ type: '충', description: '사해충' } as any],
  sinSals: [
    { name: '천을귀인', type: 'good' } as any,
    { name: '도화살', type: 'neutral' } as any,
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

interface Case {
  label: string;
  prompt: string;
  tokens: number;
}

const cases: Case[] = [
  { label: '1. 애정운',         prompt: generateLoveShortPrompt(mockSaju),        tokens: 1500 },
  { label: '2. 재물운',         prompt: generateWealthShortPrompt(mockSaju),      tokens: 1500 },
  { label: '3. 직업·진로운',     prompt: generateCareerShortPrompt(mockSaju),      tokens: 1500 },
  { label: '4. 건강운',         prompt: generateHealthShortPrompt(mockSaju),      tokens: 1300 },
  { label: '5. 학업·시험운',    prompt: generateStudyShortPrompt(mockSaju),       tokens: 1300 },
  { label: '6. 귀인운',         prompt: generatePeopleShortPrompt(mockSaju),      tokens: 1500 },
  { label: '7. 자녀·출산운',    prompt: generateChildrenShortPrompt(mockSaju),    tokens: 1300 },
  { label: '8. 성격 심층 분석', prompt: generatePersonalityShortPrompt(mockSaju), tokens: 1800 },
  { label: '9. 이름 풀이',      prompt: generateNameFortunePrompt(mockSaju, {
      koreanName: '허진우',
      koreanInitialsElements: ['土','金','土'],
      hanjaName: undefined, hanjaElements: undefined,
    }), tokens: 1300 },
  { label: '10. 꿈 해몽',       prompt: generateDreamInterpretationPrompt(
      mockSaju,
      '큰 구렁이가 몸을 감았는데 따뜻했고, 그 뒤 맑은 물에서 헤엄치고 있었어요. 돌아가신 할머니가 웃으며 떡을 건네주셨어요.'
    ), tokens: 1500 },
];

async function run(c: Case) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${PROD}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: c.prompt,
        maxTokens: c.tokens,
        systemPrompt: SYSTEM_PROMPT,
      }),
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { label: c.label, ok: false, elapsed, len: 0,
               err: `HTTP ${res.status} — ${data?.error || ''}`, content: '' };
    }
    const content = (data.content || '').trim();
    const len = content.length;
    const tooShort = len < 200;

    return {
      label: c.label,
      ok: !tooShort,
      elapsed, len,
      err: tooShort ? `응답 짧음 (${len}자)` : '',
      content,
    };
  } catch (e: any) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    return { label: c.label, ok: false, elapsed, len: 0, err: e.message || String(e), content: '' };
  }
}

(async () => {
  console.log('═'.repeat(70));
  console.log(` 프로덕션 스모크 테스트 — ${PROD}`);
  console.log('═'.repeat(70));
  console.log(` 총 ${cases.length}건 병렬 호출 중...\n`);

  // 10건 병렬 — 클로드/Gemini 동시성 감당 가능
  const results = await Promise.all(cases.map(run));

  for (const r of results) {
    const st = r.ok ? '✓ PASS' : '✗ FAIL';
    console.log(`${st}  ${r.label.padEnd(22)}  ${r.elapsed}s  ${r.len}자  ${r.err}`);
    if (r.ok) {
      const preview = r.content.slice(0, 160).replace(/\n/g, ' / ');
      console.log(`        PREVIEW: ${preview}...`);
    }
  }

  const failed = results.filter(r => !r.ok).length;
  console.log('\n' + (failed === 0 ? '🟢 전부 통과' : `🔴 ${failed}개 실패`));
  process.exit(failed === 0 ? 0 : 1);
})();
