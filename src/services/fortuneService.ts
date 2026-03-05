/**
 * 운세 분석 서비스 (크레딧 시스템 통합)
 */

import axios from 'axios';
import { OPENAI_API_KEY } from '../constants/secrets';
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
  generateHybridPrompt,
  generateLoveFortunePrompt,
  generateWealthFortunePrompt
} from '../constants/prompts';
import type { TarotCardInfo } from './api';

const API_URL = 'https://api.openai.com/v1/chat/completions';

interface FortuneResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * GPT API 호출 헬퍼
 */
const callGPT = async (userPrompt: string, maxTokens: number = 1000): Promise<string> => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('GPT API Error:', error);
    if (error.response?.status === 401) {
      throw new Error('API Key가 유효하지 않습니다.');
    }
    throw new Error('분석을 가져오는데 실패했습니다.');
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
    const success = await useCreditStore.getState().consumeCredit(2, '사주 상세 해석');
    if (!success) {
      return { success: false, error: '엽전이 부족합니다' };
    }

    const prompt = generateDetailedPrompt(result);
    const content = await callGPT(prompt, 3000);

    // 기록 저장
    const user = await auth.getCurrentUser();
    if (user) {
      await sajuDB.saveRecord({
        user_id: user.id,
        birth_date: new Date(result.solarDate).toISOString(),
        birth_place: undefined,
        gender: result.gender,
        result_data: result as any,
        interpretation_detailed: content,
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
    const success = await useCreditStore.getState().consumeCredit(1, '오늘의 운세');
    if (!success) {
      return { success: false, error: '엽전이 부족합니다' };
    }

    const prompt = generateTodayFortunePrompt(result);
    const content = await callGPT(prompt, 1200);

    // 기록 저장
    const user = await auth.getCurrentUser();
    if (user) {
      await sajuDB.saveRecord({
        user_id: user.id,
        birth_date: new Date(result.solarDate).toISOString(),
        birth_place: undefined,
        gender: result.gender,
        result_data: result as any,
        interpretation_basic: content,
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
    const success = await useCreditStore.getState().consumeCredit(2, '애정운 분석');
    if (!success) {
      return { success: false, error: '엽전이 부족합니다' };
    }

    const prompt = generateLoveFortunePrompt(result);
    const content = await callGPT(prompt, 1500);

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
    const success = await useCreditStore.getState().consumeCredit(2, '재물운 분석');
    if (!success) {
      return { success: false, error: '엽전이 부족합니다' };
    }

    const prompt = generateWealthFortunePrompt(result);
    const content = await callGPT(prompt, 1500);

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
    const success = await useCreditStore.getState().consumeCredit(1, '타로 리딩');
    if (!success) {
      return { success: false, error: '엽전이 부족합니다' };
    }

    const prompt = generateTarotPrompt(card, question);
    const content = await callGPT(prompt, 800);

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
    const success = await useCreditStore.getState().consumeCredit(3, '사주×타로 하이브리드');
    if (!success) {
      return { success: false, error: '엽전이 부족합니다' };
    }

    const prompt = generateHybridPrompt(sajuResult, tarotCard, question);
    const content = await callGPT(prompt, 1800);

    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
