/**
 * 운세 분석 서비스 (크레딧 시스템 통합)
 */

import { SajuResult } from '../utils/sajuCalculator';
import { useCreditStore } from '../store/useCreditStore';
import { sajuDB } from './supabase';
import { auth } from './supabase';
import {
  SYSTEM_PROMPT,
  generateBasicPrompt,
  generateDetailedPrompt,
  generateTodayFortunePrompt,
  generateTarotPrompt,
  generateTodayTarotPrompt,
  generateMonthlyTarotPrompt,
  generateHybridPrompt,
  generateLoveFortunePrompt,
  generateWealthFortunePrompt,
  generateTojeongPrompt,
  generateZamidusuPrompt
} from '../constants/prompts';
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
const callGPT = async (userPrompt: string, maxTokens: number = 1000): Promise<string> => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: userPrompt, maxTokens, systemPrompt: SYSTEM_PROMPT }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '분석을 가져오는데 실패했습니다.');
  }

  return sanitizeAIOutput(data.content);
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
    const content = await callGPT(prompt, 500);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 상세 해석 (2엽전)
 * - 대운/세운 + 신살 + 종합 상세 분석
 */
export const getDetailedInterpretation = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    // 크레딧 소비
    const success = await useCreditStore.getState().consumeCredit('sun', 2, '사주 상세 해석');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }

    const prompt = generateDetailedPrompt(result);
    // 2800~3500자 본문 → 넉넉히 5500 토큰
    const content = await callGPT(prompt, 5500);

    // 기록 저장
    const user = await auth.getCurrentUser();
    if (user) {
      await sajuDB.saveRecord({
        user_id: user.id,
        birth_date: new Date(result.solarDate).toISOString(),
        birth_place: undefined,
        gender: result.gender,
        calendar_type: 'solar',
        category: 'traditional',
        result_data: result as any,
        interpretation_detailed: content,
        credit_type: 'sun',
        credit_used: 2,
        is_detailed: true
      });
    }

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 오늘의 운세 (1엽전)
 */
export const getTodayFortune = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    // 크레딧 소비
    const success = await useCreditStore.getState().consumeCredit('moon', 1, '오늘의 운세');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }

    const prompt = generateTodayFortunePrompt(result);
    const content = await callGPT(prompt, 1600);

    // 기록 저장
    const user = await auth.getCurrentUser();
    if (user) {
      await sajuDB.saveRecord({
        user_id: user.id,
        birth_date: new Date(result.solarDate).toISOString(),
        birth_place: undefined,
        gender: result.gender,
        calendar_type: 'solar',
        category: 'today',
        result_data: result as any,
        interpretation_basic: content,
        credit_type: 'moon',
        credit_used: 1,
        is_detailed: false
      });
    }

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 애정운 특화 분석 (2엽전)
 */
export const getLoveFortune = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('sun', 2, '애정운 분석');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }

    const prompt = generateLoveFortunePrompt(result);
    // 1400~1800자 → 약 3000 토큰
    const content = await callGPT(prompt, 3200);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 재물운 특화 분석 (2엽전)
 */
export const getWealthFortune = async (
  result: SajuResult
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('sun', 2, '재물운 분석');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }

    const prompt = generateWealthFortunePrompt(result);
    const content = await callGPT(prompt, 3200);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 오늘의 타로 (달 1엽전) — 하루 1장 고정
 * card는 UI에서 날짜 시드로 뽑아 전달.
 */
export const getTodayTarotReading = async (
  card: TarotCardInfo,
  dateStr: string
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('moon', 1, '오늘의 타로');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }
    const prompt = generateTodayTarotPrompt(card, dateStr);
    // 650~850자 → 약 1800 토큰
    const content = await callGPT(prompt, 1800);
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 이달의 타로 (해 1엽전) — 3장 스프레드 (상/중/하순)
 */
export const getMonthlyTarotReading = async (
  cards: { early: TarotCardInfo; middle: TarotCardInfo; late: TarotCardInfo },
  monthStr: string
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('sun', 1, '이달의 타로');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }
    const prompt = generateMonthlyTarotPrompt(cards, monthStr);
    // 1300~1700자 → 약 3000 토큰
    const content = await callGPT(prompt, 3200);
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 타로 단독 해석 (1엽전)
 */
export const getTarotReading = async (
  card: TarotCardInfo,
  question?: string
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('moon', 1, '타로 리딩');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }

    const prompt = generateTarotPrompt(card, question);
    // 500~700자 → 약 1400 토큰
    const content = await callGPT(prompt, 1500);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 토정비결 (☀️2)
 */
export const getTojeongReading = async (
  tj: TojeongResult
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('sun', 2, '토정비결');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }
    const prompt = generateTojeongPrompt(tj);
    // 2400~3000자 → 약 5000 토큰
    const content = await callGPT(prompt, 5200);
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 자미두수 (☀️3)
 */
export const getZamidusuReading = async (
  z: ZamidusuResult
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('sun', 3, '자미두수');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }
    const prompt = generateZamidusuPrompt(z);
    // 3200~4000자 → 약 6500 토큰
    const content = await callGPT(prompt, 6800);
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * 사주 × 타로 하이브리드 (3엽전)
 */
export const getHybridReading = async (
  sajuResult: SajuResult,
  tarotCard: TarotCardInfo,
  question?: string
): Promise<FortuneResponse> => {
  try {
    const success = await useCreditStore.getState().consumeCredit('sun', 3, '사주×타로 하이브리드');
    if (!success) {
      return { success: false, error: '크레딧이 부족합니다' };
    }

    const prompt = generateHybridPrompt(sajuResult, tarotCard, question);
    // 1200~1600자 → 약 2800 토큰
    const content = await callGPT(prompt, 3000);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
