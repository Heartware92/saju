'use client';

/**
 * 보관함(Archive) 저장 헬퍼
 *
 * 각 풀이 서비스 함수가 성공한 뒤 호출. 내부에서 다음을 자동 처리:
 *  1. 로그인 여부 확인 — 비로그인 유저는 조용히 skip
 *  2. 대표 birth_profile 자동 조회 — 없으면 조용히 skip
 *  3. saju_records / tarot_records INSERT
 *  4. 모든 실패는 catch → console.error 로 끝내고 호출자에게 예외를 던지지 않음
 *     (저장 실패가 풀이 반환을 막지 않도록 완전 격리)
 *
 * 호출 패턴:
 *   archiveSaju({ category: 'newyear', interpretation: content, ... }).catch(() => {});
 *   .catch는 안전망이지만 이미 내부 try-catch 가 있으므로 보통 불필요.
 */

import { auth, sajuDB, tarotDB, supabase } from './supabase';

export type ArchiveCategory =
  | 'traditional'  // 정통 사주
  | 'basic'        // 무료 기본 해석
  | 'today'        // 오늘의 운세
  | 'newyear'      // 신년운세
  | 'taekil'       // 택일 운세
  | 'tojeong'      // 토정비결
  | 'zamidusu'     // 자미두수
  | 'period'       // 지정일 운세
  | 'gunghap'      // 궁합
  | 'love'         // 더많은운세: 애정운
  | 'wealth'       // 더많은운세: 재물운
  | 'career'       // 더많은운세: 직업·진로운
  | 'health'       // 더많은운세: 건강운
  | 'study'        // 더많은운세: 학업·시험운
  | 'people'       // 더많은운세: 귀인운
  | 'children'     // 더많은운세: 자녀·출산운
  | 'personality'  // 더많은운세: 성격 심층
  | 'name'         // 더많은운세: 이름 풀이
  | 'dream';       // 더많은운세: 꿈 해몽

interface ArchiveSajuParams {
  category: ArchiveCategory;
  resultData?: Record<string, unknown>;
  engineResult?: Record<string, unknown>;
  interpretation?: string;
  question?: string;
  creditType?: 'sun' | 'moon';
  creditUsed?: number;
  isDetailed?: boolean;
}

/**
 * 사주 기반 풀이 기록 저장 (silent).
 * - 프로필이 없어도 기본 정보를 기록에 남기고 싶으면 solarDate/gender를 별도로 넘길 수 있도록
 *   추후 확장. 현재는 "대표 프로필 있어야만 저장" 정책.
 */
export async function archiveSaju(params: ArchiveSajuParams): Promise<void> {
  try {
    const user = await auth.getCurrentUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('birth_profiles')
      .select('birth_date, birth_time, birth_place, gender, calendar_type')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!profile) return;

    const payload = {
      user_id: user.id,
      birth_date: profile.birth_date,
      birth_time: profile.birth_time ?? undefined,
      birth_place: profile.birth_place ?? undefined,
      gender: profile.gender,
      calendar_type: profile.calendar_type ?? 'solar',
      category: params.category,
      result_data: (params.resultData ?? {}) as Record<string, unknown>,
      engine_result: params.engineResult,
      interpretation_detailed: params.interpretation,
      credit_type: params.creditType,
      credit_used: params.creditUsed ?? 0,
      is_detailed: params.isDetailed ?? false,
    };

    // sajuDB.saveRecord는 타입 엄격 — any 캐스팅으로 engine_result 등 옵셔널 컬럼 통과
    // RLS 실패·네트워크 에러는 throw 되지만 바깥 catch 에서 잡힘
    await sajuDB.saveRecord(payload as unknown as Parameters<typeof sajuDB.saveRecord>[0]);
  } catch (err) {
    console.error('[archive] saju save failed', err);
  }
}

interface ArchiveTarotParams {
  spreadType: string;
  cards: Record<string, unknown>;
  question?: string;
  interpretation?: string;
  creditType?: 'sun' | 'moon';
  creditUsed?: number;
}

/** 타로 풀이 기록 저장 (silent). */
export async function archiveTarot(params: ArchiveTarotParams): Promise<void> {
  try {
    const user = await auth.getCurrentUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      spread_type: params.spreadType,
      cards: params.cards,
      question: params.question,
      interpretation: params.interpretation,
      credit_type: params.creditType,
      credit_used: params.creditUsed ?? 0,
    };

    await tarotDB.saveRecord(payload as unknown as Parameters<typeof tarotDB.saveRecord>[0]);
  } catch (err) {
    console.error('[archive] tarot save failed', err);
  }
}
