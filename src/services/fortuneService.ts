/**
 * 운세 분석 서비스 (크레딧 시스템 통합)
 */

import { SajuResult } from '../utils/sajuCalculator';
import { archiveSaju, archiveTarot } from './archiveService';
import {
  SYSTEM_PROMPT,
  generateBasicPrompt,
  generateDetailedPrompt,
  generateTodayFortunePrompt,
  generateTarotPrompt,
  generateTodayTarotPrompt,
  generateMonthlyTarotPrompt,
  generateHybridPrompt,
  // [B안] generateLoveFortunePrompt / generateWealthFortunePrompt — 호출처 함수 비활성. 복원 시 같이 풀기.
  // generateLoveFortunePrompt, generateWealthFortunePrompt,
  // [B안] love/wealth/career/health/people Short 프롬프트 비활성. 복원 시 같이 풀기.
  // generateLoveShortPrompt, generateWealthShortPrompt, generateCareerShortPrompt,
  // generateHealthShortPrompt, generatePeopleShortPrompt,
  generateStudyShortPrompt,
  generateChildrenShortPrompt,
  generatePersonalityShortPrompt,
  generateNameFortunePrompt,
  type NameAnalysisInput,
  generateDreamInterpretationPrompt,
  generateTojeongPrompt,
  generateZamidusuPrompt,
  ZAMIDUSU_SECTION_KEYS,
  ZAMIDUSU_SECTION_LABELS,
  type ZamidusuSectionKey,
  generatePeriodDomainsPrompt,
  generateNewyearReportPrompt,
  generateJungtongsajuPrompt,
  generateTaekilAdvicePrompt,
  NEWYEAR_SECTION_KEYS,
  JUNGTONGSAJU_SECTION_KEYS,
  TODAY_SECTION_KEYS,
  type PeriodDomainBrief,
  type NewyearSectionKey,
  type JungtongsajuSectionKey,
  type TodaySectionKey,
  type TodayGanZhi,
} from '../constants/prompts';
import type { TaekilResult } from '../engine/taekil';
import { Solar } from 'lunar-javascript';
import {
  TEN_GODS_MAP,
  BRANCH_HIDDEN_STEMS,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  normalizeGan,
  normalizeZhi,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
} from '../utils/sajuCalculator';
import type { PeriodFortune } from '../engine/periodFortune';
import type { TarotCardInfo } from './api';
import type { TojeongResult } from '../engine/tojeong';
import type { ZamidusuResult } from '../engine/zamidusu';

interface FortuneResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * AI 응답 후처리 — "AI 티 나는" Markdown·이모지 안전망
 *
 * 프론트는 응답을 <pre> 로 렌더하므로, 모델이 SYSTEM_PROMPT 규칙을 어기고
 * `## `, `### `, `**`, 이모지 등을 토해내면 독자 눈에 그대로 보인다.
 * 이 함수는 최종 레이어에서 잔여 마크업을 정리해 자연스러운 한국어만 남긴다.
 *
 * 규칙:
 * - 줄머리의 `#` `##` `###` `####` 헤딩 마커 제거 (뒤에 오는 제목은 보존)
 * - 굵게 표기 `**text**` / `__text__` → `text`
 * - 이탤릭 `*text*` / `_text_` (단, 단독 단어만 — 불릿과 겹치지 않게 보수적 처리)
 * - 인라인 백틱 `` `text` `` → `text`
 * - blockquote 줄머리 `> ` 제거
 * - 흔한 장식 이모지·이모티콘 제거
 * - "AI로서 분석해 보면…" 같은 자기소개 문구 제거
 * - 섹션 머리에 남는 "1. **사주 총론**" 류를 "1. 사주 총론" 으로 정리
 * - 양 끝 공백·중복 개행 정리
 */
const STRIP_EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F000}-\u{1F02F}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}]/gu;

export const sanitizeAIOutput = (raw: string): string => {
  if (!raw) return '';
  let text = raw;

  // 1) 코드펜스 블록 전체 제거 (삼중 백틱으로 둘러싼 영역) — 드물지만 방어
  text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '').trim());

  // 2) 줄머리 헤딩 마커 제거 (#, ##, ###, ####, #####, ######)
  text = text.replace(/^\s*#{1,6}\s+/gm, '');

  // 3) 줄머리 blockquote 마커 제거
  text = text.replace(/^\s*>\s+/gm, '');

  // 4) 볼드/이탤릭 마크 제거 (내용은 보존)
  //    - ** ** / __ __ (볼드)
  text = text.replace(/\*\*(.+?)\*\*/g, '$1');
  text = text.replace(/__(.+?)__/g, '$1');
  //    - * * / _ _ (이탤릭) — 줄머리 "* " 불릿은 보존하고 인라인만 제거
  text = text.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1$2');
  text = text.replace(/(^|[^_])_(?!\s)([^_\n]+?)_(?!_)/g, '$1$2');

  // 5) 인라인 백틱 제거
  text = text.replace(/`([^`\n]+?)`/g, '$1');

  // 6) 줄머리 불릿 마커 `* ` → `- ` (plain 불릿 통일)
  text = text.replace(/^\s*\*\s+/gm, '- ');

  // 7) 이모지·장식 기호 제거
  text = text.replace(STRIP_EMOJI_REGEX, '');

  // 8) AI 자기소개 문구 제거
  text = text.replace(/^\s*(?:AI로서|인공지능으로서|챗봇으로서|저는 AI)[^\n]*\n?/gm, '');
  text = text.replace(/제공된 (?:데이터|정보)에 (?:따르면|근거하여)[^,.\n]*[,.]?/g, '');

  // 9) 중복 공백·개행 정리
  text = text.replace(/[ \t]+\n/g, '\n');           // 줄 끝 공백
  text = text.replace(/\n{3,}/g, '\n\n');           // 3개 이상 연속 개행 → 2개
  text = text.replace(/^[ \t]+/gm, (m) => m.replace(/\t/g, '  ')); // 들여쓰기 탭 → 공백 2개

  return text.trim();
};

/**
 * GPT API 호출 헬퍼 (서버 API Route 경유)
 * - 응답을 sanitize 하여 마크다운·이모지 잔해 제거
 */
// Vercel 서버 maxDuration=60초와 맞춤. 55초 지나면 클라이언트가 abort.
const AI_CLIENT_TIMEOUT_MS = 55_000;

/**
 * truncation 사유 에러 — UI 가 메시지 그대로 노출해 사용자가 재시도하도록 유도.
 * 잘린 응답을 캐시에 저장하면 재진입 시도 같은 잘린 결과만 반복되므로,
 * truncated 일 때는 에러로 throw 해 caller 의 catch 분기로 빠뜨려야 한다.
 */
const TRUNCATED_MESSAGE = '응답이 길어서 일부 잘렸어요. 잠시 후 다시 시도해주세요.';
const TOO_SHORT_MESSAGE = '풀이 결과가 비정상적으로 짧아요. 잠시 후 다시 시도해주세요.';

/**
 * AI 응답이 비정상적으로 짧을 때 거르는 안전망. AI가 "I cannot..." 같은 거부 메시지를
 * 짧게 반환하거나, 구조화 응답이 깨져서 빈 본문에 가까운 텍스트만 올 때 캐시·차감을 막는다.
 * - 기본 최소 길이 = maxTokens × 0.15 자 (보수적). 호출자가 minContentLength 로 덮어쓸 수 있음.
 */
const callGPT = async (
  userPrompt: string,
  maxTokens: number = 1000,
  minContentLength?: number,
): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, maxTokens, systemPrompt: SYSTEM_PROMPT }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '분석을 가져오는데 실패했습니다.');
    }
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.');
    }
    if (data.truncated === true) {
      // 부분 응답이라도 디버깅용으로 콘솔에는 남긴다 — 운영에서 maxTokens 조정 근거 확보
      console.warn('[AI] truncated response — bump maxTokens', { len: data.content.length, maxTokens });
      throw new Error(TRUNCATED_MESSAGE);
    }
    const sanitized = sanitizeAIOutput(data.content);
    const minLen = minContentLength ?? Math.max(80, Math.floor(maxTokens * 0.15));
    if (sanitized.length < minLen) {
      console.warn('[AI] too-short response — likely refusal/garbage', { len: sanitized.length, minLen, snippet: sanitized.slice(0, 80) });
      throw new Error(TOO_SHORT_MESSAGE);
    }
    return sanitized;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('응답이 너무 오래 걸려요. 잠시 후 다시 시도해주세요.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * 무료 기본 해석 (0엽전)
 * - 만세력 확인 + 간단한 종합 운세
 */
export const getBasicInterpretation = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    const prompt = generateBasicPrompt(result);
    const content = await callGPT(prompt, 1500);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * SajuResult → archiveSaju 의 sourceBirth 형태로 변환.
 * 보관함 저장 시 birth_profiles 와 자동 매칭(profile_id, profile_name 채움)에 사용.
 *
 * 주의: result.solarDate 는 항상 양력 변환된 값이라, 원본 입력이 음력인 프로필은
 * birth_profiles.birth_date(음력 원본) 와 매칭이 안 될 수 있음. 그 경우 매칭 실패 →
 * 대표 프로필 fallback (archiveService 내부) 으로 떨어진다. 정확 매칭이 필요하면
 * 호출 페이지가 BirthProfile.id 를 직접 넘기는 방식으로 향후 확장.
 */
const sourceBirthFromSaju = (result: SajuResult) => ({
  birth_date: result.solarDate,
  gender: result.gender,
  calendar_type: 'solar' as const,
});

/**
 * 상세 해석 (무료 공개)
 * - 대운/세운 + 신살 + 종합 상세 분석
 */
export const getDetailedInterpretation = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    const prompt = generateDetailedPrompt(result);
    // 2800~3500자 본문 → 넉넉히 5500 토큰
    const content = await callGPT(prompt, 5500);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'traditional', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'sun', isDetailed: true });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 오늘의 운세 (전체 무료 — 추후 크레딧 정책 결정 시 재도입)
 */
export const getTodayFortune = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    const isoDate = new Date().toISOString().slice(0, 10);
    const todayGz = calcTodayGanZhi(result, isoDate);
    const prompt = generateTodayFortunePrompt(result, todayGz, isoDate);
    const content = await callGPT(prompt, 1600);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'today', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', isDetailed: false });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * [B안 — 호출처 없음 + 카테고리 비활성으로 동시 정리]
 * getLoveFortune / getWealthFortune 은 정통사주 무료 분석으로 정의됐지만 실제 호출처가 없어
 * 죽은 코드 상태. 이대로 살려두면 향후 누군가 호출 시 archive 카테고리 'love'/'wealth' 로
 * 적재되어 비활성된 보관함 라우트로 떨어짐 → 사용자 좌초.
 * 함수 정의 자체를 주석 보존. 복원 필요 시 카테고리도 'traditional' 로 정정 후 살릴 것.
 */
// export const getLoveFortune = async (
//   result: SajuResult
// ): Promise<FortuneResponse> => {
//   try {
//     const prompt = generateLoveFortunePrompt(result);
//     // 본문 1,400~1,800자 × 한국어 토큰 비율 → 4,500 안전치
//     const content = await callGPT(prompt, 4500);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'love', resultData: result as unknown as Record<string, unknown>, interpretation: content, isDetailed: true });
//     return { success: true, content };
//   } catch (error: any) {
//     return { success: false, error: error.message };
//   }
// };

// export const getWealthFortune = async (
//   result: SajuResult
// ): Promise<FortuneResponse> => {
//   try {
//     const prompt = generateWealthFortunePrompt(result);
//     // 본문 1,400~1,800자 — 4,500 안전치
//     const content = await callGPT(prompt, 4500);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'wealth', resultData: result as unknown as Record<string, unknown>, interpretation: content, isDetailed: true });
//     return { success: true, content };
//   } catch (error: any) {
//     return { success: false, error: error.message };
//   }
// };

/**
 * 오늘의 타로 (전체 무료) — 하루 1장 고정
 * card는 UI에서 날짜 시드로 뽑아 전달.
 */
export const getTodayTarotReading = async (
  card: TarotCardInfo,
  dateStr: string
): Promise<FortuneResponse> => {
  try {
    const prompt = generateTodayTarotPrompt(card, dateStr);
    // 본문 1,000~1,300자 — 3,000 안전치
    const content = await callGPT(prompt, 3000);
    archiveTarot({ spreadType: 'today', cards: { card, dateStr } as unknown as Record<string, unknown>, interpretation: content });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 이달의 타로 (전체 무료) — 3장 스프레드 (상/중/하순)
 */
export const getMonthlyTarotReading = async (
  cards: { early: TarotCardInfo; middle: TarotCardInfo; late: TarotCardInfo },
  monthStr: string
): Promise<FortuneResponse> => {
  try {
    const prompt = generateMonthlyTarotPrompt(cards, monthStr);
    // 본문 1,800~2,200자 — 5,000 안전치
    const content = await callGPT(prompt, 5000);
    archiveTarot({ spreadType: 'monthly-3card', cards: { ...cards, monthStr } as unknown as Record<string, unknown>, interpretation: content });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 타로 단독 해석 (전체 무료)
 */
export const getTarotReading = async (
  card: TarotCardInfo,
  question?: string
): Promise<FortuneResponse> => {
  try {
    const prompt = generateTarotPrompt(card, question);
    // 본문 750~950자 — 2,500 안전치
    const content = await callGPT(prompt, 2500);
    archiveTarot({ spreadType: 'single', cards: { card } as unknown as Record<string, unknown>, question, interpretation: content });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 토정비결 (전체 무료)
 */
export const getTojeongReading = async (
  tj: TojeongResult
): Promise<FortuneResponse> => {
  try {
    const prompt = generateTojeongPrompt(tj);
    // 프롬프트 명세: 총 2,900~3,500자 (8섹션 — 분야별 4개로 세분화). 한국어 토큰 비율 고려해 7,500.
    // (직원 피드백: 분야별 운세 세분화 — 5섹션 → 8섹션으로 확장됨)
    const content = await callGPT(prompt, 7500);
    archiveSaju({ category: 'tojeong', engineResult: tj as unknown as Record<string, unknown>, interpretation: content, isDetailed: true });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 자미두수 (전체 무료) — 섹션 델리미터 파싱까지
 */
export interface ZamidusuAIResult {
  success: boolean;
  /** 원본 AI 전문 (fallback 또는 디버깅) */
  content?: string;
  /** 섹션별 본문 — key는 ZAMIDUSU_SECTION_KEYS 중 하나 */
  sections?: Partial<Record<ZamidusuSectionKey, string>>;
  error?: string;
}

const ZAMIDUSU_KEYS: ZamidusuSectionKey[] = [
  'overview', 'core', 'relations', 'wealth', 'body_mind', 'mutagen', 'daehan', 'advice',
];

export function parseZamidusuSections(raw: string): Partial<Record<ZamidusuSectionKey, string>> {
  const out: Partial<Record<ZamidusuSectionKey, string>> = {};
  const re = /^\s*\[(overview|core|relations|wealth|body_mind|mutagen|daehan|advice)\]\s*$/m;
  const parts = raw.split(re);
  // parts: ['', 'overview', '본문...', 'core', '본문...', ...]
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i] as ZamidusuSectionKey;
    const body = (parts[i + 1] ?? '').trim();
    if (ZAMIDUSU_KEYS.includes(key) && body) {
      out[key] = body;
    }
  }
  return out;
}

export const getZamidusuReading = async (
  z: ZamidusuResult
): Promise<ZamidusuAIResult> => {
  try {
    const prompt = generateZamidusuPrompt(z);
    // 프롬프트 명세: 총 3,300~4,000자 (8섹션 — 직원 피드백 반영 깊이 강화). 한국어 토큰 비율 고려해 9,000.
    const content = await callGPT(prompt, 9000);
    const sections = parseZamidusuSections(content);
    archiveSaju({ category: 'zamidusu', engineResult: z as unknown as Record<string, unknown>, interpretation: content, isDetailed: true });
    return { success: true, content, sections };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 기간 운세 영역별 상세 (무료)
 * - 엔진이 계산한 도메인 점수/등급을 근거로 각 영역 5문장 분석 생성
 * - 응답은 [key] 델리미터로 구분된 블록. 파싱 실패 시 전체 원문을 error 로 반환.
 */
const DOMAIN_KEYS: PeriodDomainBrief['key'][] = ['wealth', 'career', 'love', 'health', 'study'];

export interface PeriodDomainsAIResult {
  success: boolean;
  descriptions?: Partial<Record<PeriodDomainBrief['key'], string>>;
  error?: string;
}

const parsePeriodDomains = (raw: string): Partial<Record<PeriodDomainBrief['key'], string>> => {
  const out: Partial<Record<PeriodDomainBrief['key'], string>> = {};
  // [key] 헤더로 구간 분할 — 줄머리·공백 허용
  const re = /^\s*\[(wealth|career|love|health|study)\]\s*$/m;
  const parts = raw.split(/^\s*\[(wealth|career|love|health|study)\]\s*$/m);
  // split 결과: [서문?, key1, body1, key2, body2, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i] as PeriodDomainBrief['key'];
    const body = (parts[i + 1] || '').trim();
    if (body) out[key] = body;
  }
  // fallback — 한 블록도 못 찾으면 키별 검색
  if (Object.keys(out).length === 0 && re.test(raw)) {
    for (const k of DOMAIN_KEYS) {
      const m = raw.match(new RegExp(`\\[${k}\\]\\s*([\\s\\S]*?)(?=\\n\\s*\\[(?:wealth|career|love|health|study)\\]|$)`));
      if (m && m[1].trim()) out[k] = m[1].trim();
    }
  }
  return out;
};

export const getPeriodDomainsDescription = async (
  result: SajuResult,
  opts: {
    scopeLabel: string;
    targetGanZhi: string;
    overallHeadline: string;
    domains: PeriodDomainBrief[];
  }
): Promise<PeriodDomainsAIResult> => {
  try {
    const prompt = generatePeriodDomainsPrompt(result, opts);
    // 5영역 × 5문장 (각 200~300자) ≈ 1,500자. 한국어 토큰 비율 보수적 4,500.
    const content = await callGPT(prompt, 4500);
    const descriptions = parsePeriodDomains(content);

    if (Object.keys(descriptions).length === 0) {
      return { success: false, error: '영역별 설명 파싱 실패' };
    }
    return { success: true, descriptions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 정통사주 종합 리포트 (원국 기반 9섹션 분석)
 */
export interface AdviceMeta {
  title: string;
  timeSlot: string;
  foods: string[];
  body: string;
  actions: string[];
}

export function parseAdviceMeta(text: string): AdviceMeta {
  const lines = text.split('\n').map(l => l.trim());
  let title = '';
  let timeSlot = '';
  let foods: string[] = [];
  const bodyLines: string[] = [];
  const actions: string[] = [];
  let metaParsed = false;
  let inActions = false;

  for (const line of lines) {
    if (!line) continue;

    if (!title) { title = line; continue; }

    if (!metaParsed && line.startsWith('시간대:')) {
      timeSlot = line.replace('시간대:', '').trim();
      continue;
    }
    if (!metaParsed && line.startsWith('음식:')) {
      foods = line.replace('음식:', '').trim().split(/[,，·]/).map(f => f.trim()).filter(Boolean);
      metaParsed = true;
      continue;
    }

    if (line === '이번 달 실천:' || line.startsWith('이번 달 실천')) {
      inActions = true;
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('· ')) {
      actions.push(line.slice(2).trim());
      continue;
    }

    if (!inActions) {
      bodyLines.push(line);
    }
  }

  return { title, timeSlot, foods, body: bodyLines.join('\n').trim(), actions };
}

export interface JungtongsajuAIResult {
  success: boolean;
  sections?: Partial<Record<JungtongsajuSectionKey, string>>;
  rawText?: string;
  error?: string;
  adviceMeta?: AdviceMeta;
}

export const parseJungtongsaju = (raw: string): Partial<Record<JungtongsajuSectionKey, string>> => {
  const out: Partial<Record<JungtongsajuSectionKey, string>> = {};
  const keysPattern = JUNGTONGSAJU_SECTION_KEYS.join('|');
  const parts = raw.split(new RegExp(`^\\s*\\[(${keysPattern})\\]\\s*$`, 'm'));
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i] as JungtongsajuSectionKey;
    const body = (parts[i + 1] || '').trim();
    if (body) out[key] = body;
  }
  return out;
};

export const getJungtongsajuReport = async (result: SajuResult): Promise<JungtongsajuAIResult> => {
  try {
    const prompt = generateJungtongsajuPrompt(result);
    // 프롬프트 명세: 총 2,800~3,500자 (11섹션). 한국어 토큰 비율 고려해 8,000.
    const content = await callGPT(prompt, 8000);
    const sections = parseJungtongsaju(content);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'traditional', resultData: result as unknown as Record<string, unknown>, interpretation: content, isDetailed: true });

    if (Object.keys(sections).length === 0) {
      return { success: true, rawText: content };
    }
    const adviceMeta = sections.advice ? parseAdviceMeta(sections.advice) : undefined;
    return { success: true, sections, adviceMeta };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ── 오늘의 운세 ──────────────────────────────────────────────

export interface TodayFortuneAIResult {
  success: boolean;
  sections?: Partial<Record<TodaySectionKey, string>>;
  rawText?: string;
  error?: string;
  todayGz?: TodayGanZhi;
  isoDate?: string;
}

/** 한자 매핑 */
const GAN_HANJA: Record<string, string> = {
  갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸'
};
const ZHI_HANJA: Record<string, string> = {
  자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳', 오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥'
};

/** 오늘 일진(日辰) 간지 계산 + 원국과의 합충 분석 */
function calcTodayGanZhi(result: SajuResult, isoDate: string): TodayGanZhi {
  const [y, m, d] = isoDate.split('-').map(Number);
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const dayGz = lunar.getDayInGanZhi();

  const todayGan = normalizeGan(dayGz[0]);
  const todayZhi = normalizeZhi(dayGz[1]);
  const dayMaster = result.dayMaster;
  const map = TEN_GODS_MAP[dayMaster] || {};

  const ganElement = STEM_ELEMENT[todayGan] || '';
  const zhiElement = BRANCH_ELEMENT[todayZhi] || '';
  const tenGodGan = map[todayGan] || '';
  const mainHidden = BRANCH_HIDDEN_STEMS[todayZhi]?.[0] || '';
  const tenGodZhi = mainHidden ? (map[mainHidden] || '') : '';

  // 원국 지지들과의 합충 간단 분석
  const origZhis = [
    result.pillars.year.zhi,
    result.pillars.month.zhi,
    result.pillars.day.zhi,
    ...(result.hourUnknown ? [] : [result.pillars.hour.zhi]),
  ];
  const interactions: string[] = [];
  const todayIdx = EARTHLY_BRANCHES.indexOf(todayZhi);
  origZhis.forEach(oz => {
    const oIdx = EARTHLY_BRANCHES.indexOf(oz);
    if (oIdx < 0 || todayIdx < 0) return;
    const diff = Math.abs(todayIdx - oIdx);
    const minDiff = Math.min(diff, 12 - diff);
    if (minDiff === 6) interactions.push(`일진${todayZhi}×${oz} 충(沖)`);
    else if (minDiff === 0) interactions.push(`일진${todayZhi}×${oz} 동(同)`);
    // 육합 쌍: 자축, 인해, 묘술, 진유, 사신, 오미
    const hexCombos: [string, string][] = [['자','축'],['인','해'],['묘','술'],['진','유'],['사','신'],['오','미']];
    hexCombos.forEach(([a, b]) => {
      if ((todayZhi === a && oz === b) || (todayZhi === b && oz === a))
        interactions.push(`일진${todayZhi}×${oz} 합(合)`);
    });
  });

  return {
    gan: todayGan,
    zhi: todayZhi,
    hanja: `${GAN_HANJA[todayGan] ?? todayGan}${ZHI_HANJA[todayZhi] ?? todayZhi}`,
    ganElement,
    zhiElement,
    tenGodGan,
    tenGodZhi,
    interactions,
  };
}

export const parseTodayFortune = (raw: string): Partial<Record<TodaySectionKey, string>> => {
  const out: Partial<Record<TodaySectionKey, string>> = {};
  const keysPattern = TODAY_SECTION_KEYS.join('|');
  const parts = raw.split(new RegExp(`^\\s*\\[(${keysPattern})\\]\\s*$`, 'm'));
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i] as TodaySectionKey;
    const body = (parts[i + 1] || '').trim();
    if (body) out[key] = body;
  }
  return out;
};

export const getTodayFortuneReport = async (
  result: SajuResult,
  isoDate?: string,
): Promise<TodayFortuneAIResult> => {
  try {
    const date = isoDate ?? new Date().toISOString().slice(0, 10);
    const todayGz = calcTodayGanZhi(result, date);
    const prompt = generateTodayFortunePrompt(result, todayGz, date);
    // 5섹션 × 평균 120자 ≈ 600자 → 2000 토큰으로 충분
    const content = await callGPT(prompt, 2000);
    const sections = parseTodayFortune(content);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'today', resultData: result as unknown as Record<string, unknown>, engineResult: { todayGz, isoDate: date }, interpretation: content });

    if (Object.keys(sections).length === 0) {
      return { success: true, rawText: content, todayGz, isoDate: date };
    }
    return { success: true, sections, todayGz, isoDate: date };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ── 택일 AI 추천 ─────────────────────────────────────────────

export interface TaekilAdviceResult {
  success: boolean;
  advice?: string;
  error?: string;
}

export const getTaekilAdvice = async (
  saju: SajuResult,
  taekil: TaekilResult,
): Promise<TaekilAdviceResult> => {
  try {
    const prompt = generateTaekilAdvicePrompt(saju, taekil);
    // 일반 350~450자 / 출산 500~650자 / 후보 비교 450~600자 — 안전치 2,500
    const raw = await callGPT(prompt, 2500);
    // [taekil_advice] 마커 제거하고 본문만 추출
    const match = raw.match(/\[taekil_advice\]\s*([\s\S]+)/);
    const advice = match ? match[1].trim() : raw.trim();
    archiveSaju({ sourceBirth: sourceBirthFromSaju(saju), category: 'taekil', resultData: saju as unknown as Record<string, unknown>, engineResult: taekil as unknown as Record<string, unknown>, interpretation: advice });
    return { success: true, advice };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 신년운세 종합 리포트 (연도별 8섹션 내러티브)
 * - 원국 + 해당 연도 세운/대운/월별흐름을 통합해 자연스러운 한국어 리포트 생성
 */

export interface NewyearReportAIResult {
  success: boolean;
  sections?: Partial<Record<NewyearSectionKey, string>>;
  rawText?: string;
  error?: string;
}

export const parseNewyearReport = (raw: string): Partial<Record<NewyearSectionKey, string>> => {
  const out: Partial<Record<NewyearSectionKey, string>> = {};
  const keysPattern = NEWYEAR_SECTION_KEYS.join('|');
  const parts = raw.split(new RegExp(`^\\s*\\[(${keysPattern})\\]\\s*$`, 'm'));
  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i] as NewyearSectionKey;
    const body = (parts[i + 1] || '').trim();
    if (body) out[key] = body;
  }
  return out;
};

export const getNewyearReport = async (
  result: SajuResult,
  fortune: PeriodFortune,
  year: number,
): Promise<NewyearReportAIResult> => {
  try {
    const seWoon = result.seWoon.find(s => s.year === year);
    if (!seWoon) throw new Error(`${year}년 세운 데이터가 없습니다.`);

    const currentDaeWoon = result.daeWoon.find(
      d => d.gan && d.zhi && year >= d.startAge && year <= d.endAge
    ) ?? null;

    const domains = fortune.domains.map(d => ({
      key: d.key,
      label: d.label,
      score: d.score,
      grade: d.grade as string,
    }));

    const prompt = generateNewyearReportPrompt(result, {
      year,
      seWoon,
      currentDaeWoon,
      monthlyFlow: fortune.monthlyFlow ?? [],
      domains,
      overallScore: fortune.overallScore,
      overallGrade: fortune.overallGrade as string,
    });

    // 프롬프트 명세: 총 2,500~3,200자 (8섹션). 한국어 토큰 비율 고려해 7,000.
    const content = await callGPT(prompt, 7000);
    const sections = parseNewyearReport(content);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'newyear', resultData: result as unknown as Record<string, unknown>, engineResult: { year, seWoon, currentDaeWoon } as unknown as Record<string, unknown>, interpretation: content, isDetailed: true });

    if (Object.keys(sections).length === 0) {
      // 파싱 실패 시 원문 반환 — UI에서 단일 텍스트로 표시
      return { success: true, rawText: content };
    }
    return { success: true, sections };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 사주 × 타로 하이브리드 (3엽전)
 *
 * @param mode TarotPage 의 currentMode — 보관함 spread_type 결정
 * @param allDrawnCards (선택) 모드에서 뽑은 전체 카드 배열. 이달의 타로(3장) 등에서 모두 저장하기 위해.
 *                     미전달 시 tarotCard 단일만 저장 (단일 카드 모드 호환).
 */
export const getHybridReading = async (
  sajuResult: SajuResult,
  tarotCard: TarotCardInfo,
  question?: string,
  mode?: 'today' | 'monthly' | 'question',
  allDrawnCards?: TarotCardInfo[],
): Promise<FortuneResponse> => {
  try {
    const prompt = generateHybridPrompt(sajuResult, tarotCard, question);
    // 프롬프트 명세: 총 1,200~1,600자 (6섹션). 한국어 토큰 비율 고려해 4,000.
    const content = await callGPT(prompt, 4000);
    // 사주+타로 하이브리드는 saju_records · tarot_records 양쪽에 기록 (유저가 어느 탭에서 찾든 보이도록)
    archiveSaju({ sourceBirth: sourceBirthFromSaju(sajuResult), category: 'gunghap', resultData: sajuResult as unknown as Record<string, unknown>, engineResult: { tarotCard, question } as unknown as Record<string, unknown>, interpretation: content });
    // mode 별 spread_type — 보관함에서 "오늘의 타로" / "이달의 타로" / "질문 타로" 구분 표시
    const spreadType = mode === 'today' ? 'today'
      : mode === 'monthly' ? 'monthly'
      : mode === 'question' ? 'question'
      : 'hybrid-saju';
    // cards 페이로드 — 재생용 전체 정보 저장 (mode/cards 배열/단일카드/질문)
    const cardsPayload: Record<string, unknown> = {
      mode: spreadType,
      cards: allDrawnCards ?? [tarotCard],
      // 호환 — 이전 단일 키
      card: tarotCard,
    };
    archiveTarot({ spreadType, cards: cardsPayload, question, interpretation: content });
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================================
// 더 많은 운세 — 카테고리 서비스 함수
// (모두 달 크레딧 1개 소모, 짧은 형식)
//
// [B안 — 2026-04-27] 메인 8 (신년/정통사주/지정일/자미두수)과 중복되던 5종 비활성:
//   getLoveShort, getWealthShort, getCareerShort, getHealthShort, getPeopleShort
// 비활성 함수는 주석으로 보존 — 비즈니스 결정 변경 시 빠르게 복원.
// MoreFortunePage.handleRead 의 switch 도 해당 case 들 동시 정리됨.
// ============================================================

// 더많은운세 short — 프롬프트 명세 350~700자 → 한국어 토큰 비율 보수적 2.5x로 잡아 2,000 일괄.
// 개별 분량 차이는 작아 LRU 비용 영향 미미, 잘림 방지가 우선.

// [비활성 — B안] 신년운세 연애·결혼운, 정통사주 애정·결혼운, 궁합 카테고리와 중복.
// export const getLoveShort = async (result: SajuResult): Promise<FortuneResponse> => {
//   try {
//     const content = await callGPT(generateLoveShortPrompt(result), 2000);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'love', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
//     return { success: true, content };
//   } catch (e: any) { return { success: false, error: e.message }; }
// };

// [비활성 — B안] 신년운세 재물운, 정통사주 재물운, 자미두수 재물·일의 하늘과 중복.
// export const getWealthShort = async (result: SajuResult): Promise<FortuneResponse> => {
//   try {
//     const content = await callGPT(generateWealthShortPrompt(result), 2000);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'wealth', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
//     return { success: true, content };
//   } catch (e: any) { return { success: false, error: e.message }; }
// };

// [비활성 — B안] 신년운세 직장·사업운, 정통사주 직업·적성과 중복.
// export const getCareerShort = async (result: SajuResult): Promise<FortuneResponse> => {
//   try {
//     const content = await callGPT(generateCareerShortPrompt(result), 2000);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'career', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
//     return { success: true, content };
//   } catch (e: any) { return { success: false, error: e.message }; }
// };

// [비활성 — B안] 신년운세 건강운, 정통사주 건강운, 자미두수 몸과 마음의 하늘과 중복.
// export const getHealthShort = async (result: SajuResult): Promise<FortuneResponse> => {
//   try {
//     const content = await callGPT(generateHealthShortPrompt(result), 2000);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'health', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
//     return { success: true, content };
//   } catch (e: any) { return { success: false, error: e.message }; }
// };

export const getStudyShort = async (result: SajuResult): Promise<FortuneResponse> => {
  try {
    const content = await callGPT(generateStudyShortPrompt(result), 2000);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'study', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
    return { success: true, content };
  } catch (e: any) { return { success: false, error: e.message }; }
};

// [비활성 — B안] 신년운세 인간관계운, 정통사주 인간관계·가족, 자미두수 관계 하늘과 중복.
// export const getPeopleShort = async (result: SajuResult): Promise<FortuneResponse> => {
//   try {
//     const content = await callGPT(generatePeopleShortPrompt(result), 2000);
//     archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'people', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
//     return { success: true, content };
//   } catch (e: any) { return { success: false, error: e.message }; }
// };

export const getChildrenShort = async (result: SajuResult): Promise<FortuneResponse> => {
  try {
    const content = await callGPT(generateChildrenShortPrompt(result), 2000);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'children', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
    return { success: true, content };
  } catch (e: any) { return { success: false, error: e.message }; }
};

export const getPersonalityShort = async (result: SajuResult): Promise<FortuneResponse> => {
  try {
    // 명세 500~700자 — 가장 길어서 2,500
    const content = await callGPT(generatePersonalityShortPrompt(result), 2500);
    archiveSaju({ sourceBirth: sourceBirthFromSaju(result), category: 'personality', resultData: result as unknown as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
    return { success: true, content };
  } catch (e: any) { return { success: false, error: e.message }; }
};

export const getNameFortune = async (
  result: SajuResult,
  nameInput: NameAnalysisInput,
): Promise<FortuneResponse> => {
  try {
    // 명세: 한글만 380~500자 / 한자 포함 420~580자. 한국어 토큰 비율 보수적으로 적용.
    const maxTokens = nameInput.hanjaName ? 2500 : 2000;
    const content = await callGPT(generateNameFortunePrompt(result, nameInput), maxTokens);
    archiveSaju({
      sourceBirth: sourceBirthFromSaju(result),
      category: 'name',
      resultData: result as unknown as Record<string, unknown>,
      engineResult: { koreanName: nameInput.koreanName, hanjaName: nameInput.hanjaName } as Record<string, unknown>,
      interpretation: content,
      creditType: 'moon',
      creditUsed: 1,
    });
    return { success: true, content };
  } catch (e: any) { return { success: false, error: e.message }; }
};

/**
 * 꿈 해몽 — 사주 무관, 꿈 내용만으로 해석.
 * dreamText는 선명 모드의 원문 또는 흐릿 모드에서 구조화 입력을 composeDreamTextFromStructured로 합성한 텍스트.
 */
export const getDreamInterpretation = async (
  dreamText: string,
): Promise<FortuneResponse> => {
  try {
    if (!dreamText || dreamText.trim().length < 5) {
      return { success: false, error: '꿈 내용을 조금 더 적어주세요. (등장물·행동·감정 중 하나만이라도 있으면 좋아요)' };
    }
    // 명세 500~700자 — 안전치 2,500
    const content = await callGPT(generateDreamInterpretationPrompt(dreamText), 2500);
    // 꿈 해몽은 사주 원국 무관하지만 유저가 본인의 풀이 기록으로 조회할 수 있게 대표 프로필에 붙여 저장
    archiveSaju({ category: 'dream', engineResult: { dreamText } as Record<string, unknown>, interpretation: content, creditType: 'moon', creditUsed: 1 });
    return { success: true, content };
  } catch (e: any) { return { success: false, error: e.message }; }
};
