'use client';

/**
 * 더 많은 운세 — 공통 페이지 컴포넌트
 * 9개 카테고리를 단일 페이지에서 처리:
 *  1. 소개 카드(긴 설명)
 *  2. 대표 프로필 요약
 *  3. 풀이 보기 버튼 (달 크레딧 1 소모)
 *  4. 버튼 클릭 시 로딩 → 결과 표시
 *
 * 이름 풀이는 name 입력 폼이 추가로 노출됨.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { useReportCacheStore, sajuKey } from '../store/useReportCacheStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import {
  MORE_FORTUNE_CONFIGS,
  MOON_COST_PER_FORTUNE,
  isLegacyMoreCategory,
  LEGACY_MORE_LABELS,
  type LegacyMoreCategory,
  type MoreFortuneId,
} from '../constants/moreFortunes';
import {
  // [B안] love/wealth/career/health/people 비활성 — 메인 8 중복. 복원 시 import 같이 풀기.
  // getLoveShort, getWealthShort, getCareerShort, getHealthShort, getPeopleShort,
  getStudyShort,
  getChildrenShort,
  getPersonalityShort,
  getNameFortune,
  getDreamInterpretation,
} from '../services/fortuneService';
import { sajuDB } from '../services/supabase';
import { findRecentArchive, type ArchiveCategory } from '../services/archiveService';
import { RestoreReportModal } from '../components/RestoreReportModal';
import { FortuneProfileSelect } from '../components/FortuneProfileSelect';
import { MOON_COST_PER_FORTUNE as MOON_COST_SELECT } from '../constants/moreFortunes';
import { analyzeKoreanName } from '../utils/nameEumRyeong';
import { AILoadingBar } from '../components/AILoadingBar';
import { DreamInputPanel } from '../components/dream/DreamInputPanel';
import { BackButton } from '../components/ui/BackButton';
import { useLoadingGuard } from '../hooks/useLoadingGuard';
import styles from './SajuResultPage.module.css';

interface Props {
  /** 카테고리 id. /saju/more/[category] 동적 라우트에서 주입된다. */
  category?: MoreFortuneId;
}

// [B안] love/wealth/career/health/people 메시지는 주석 보존. 복원 시 함께 풀기.
const LOADING_MESSAGES: Record<MoreFortuneId, string[]> = {
  // love:        ['일지 배우자궁을 살피는 중입니다', '재성·관성 배치를 읽는 중입니다', '올해 연애운 월별 흐름 분석 중입니다'],
  // wealth:      ['재성·재고를 확인하는 중입니다', '식상 흐름으로 재물 구조 분석 중입니다', '올해 돈의 흐름을 짚는 중입니다'],
  // career:      ['격국과 관성·식상을 분석 중입니다', '적합한 직군을 도출하는 중입니다', '올해 커리어 시기 살피는 중입니다'],
  // health:      ['약한 오행과 취약 장부를 보는 중입니다', '충·형 구조를 확인하는 중입니다', '올해 주의할 달을 짚는 중입니다'],
  // people:      ['천을귀인과 인성을 살피는 중입니다', '비겁 배치로 관계 스타일 분석 중입니다', '올해 도움될 사람 유형 도출 중입니다'],
  study:       ['인성·문창귀인 확인 중입니다', '식상으로 표현력 분석 중입니다', '유리한 시험 시기 찾는 중입니다'],
  children:    ['자녀성과 자녀궁을 확인 중입니다', '식상·관성 흐름 분석 중입니다', '출산 유리한 시기 짚는 중입니다'],
  personality: ['일주 60갑자 특성 확인 중입니다', '격국·신강신약 종합 중입니다', '간여지동과 신살 분석 중입니다'],
  name:        ['초성 오행을 계산 중입니다', '사주 용신과 이름 오행 비교 중입니다', '이름이 주는 기운을 분석 중입니다'],
  dream:       ['전통 꿈해몽 사전을 찾는 중입니다', '꿈속 상징과 사주 오행을 맞춰보는 중입니다', '올해 세운과 꿈의 연결점을 짚는 중입니다'],
};

export default function MoreFortunePage({ category }: Props) {
  // ── 모든 Hooks는 무조건 상단에 호출 (React Hooks 규칙) ──
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams?.get('profileId') ?? null;
  const recordId = searchParams?.get('recordId') ?? null;
  const isArchiveMode = !!recordId;

  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();
  const { moonBalance, chargeForContent, fetchBalance } = useCreditStore();

  const isValidCategory = !!category && (category in MORE_FORTUNE_CONFIGS);
  const cfg = isValidCategory ? MORE_FORTUNE_CONFIGS[category as MoreFortuneId] : null;
  const isLegacy = !!category && isLegacyMoreCategory(category);

  const needsProfileSelect = !profileId && !isArchiveMode && !cfg?.needsNameInput && !cfg?.needsDreamInput;

  const targetProfile = useMemo(() => {
    if (profileId) return profiles.find(p => p.id === profileId) ?? null;
    if (needsProfileSelect) return null;
    return profiles.find((p) => p.is_primary) ?? profiles[0] ?? null;
  }, [profiles, profileId, needsProfileSelect]);

  const saju = useMemo(() => {
    if (!targetProfile) return null;
    return computeSajuFromProfile(targetProfile);
  }, [targetProfile]);

  // 이름 풀이 전용 state
  const [koreanName, setKoreanName] = useState('');
  const [hanjaName, setHanjaName] = useState('');

  // 꿈 해몽 전용 state — DreamInputPanel에서 onChange로 주입되는 합성 텍스트/유효성
  const [dreamText, setDreamText] = useState('');
  const [dreamValid, setDreamValid] = useState(false);

  // 결과 state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── 로딩 안전장치: 70초 초과 시 강제 해제 ──
  const [loadingTimedOut] = useLoadingGuard(loading, 70_000);
  useEffect(() => {
    if (loadingTimedOut) {
      setLoading(false);
      if (!result) setError('AI 응답이 너무 오래 걸려요. 새로고침 후 다시 시도해주세요.');
    }
  }, [loadingTimedOut, result]);

  const [cacheGate, setCacheGate] = useState<{ kind: 'today' | 'jungtong' | 'zamidusu' | 'tojeong' | 'newyear' | 'period_date' | 'period_day' | 'taekil' | 'gunghap' | 'tarot' | `more:${string}`; key: string; restore: () => void } | null>(null);
  const handleUseCached = () => { cacheGate?.restore(); setCacheGate(null); };
  const handleRefetch = () => { setCacheGate(null); };

  // 보관함 재생 메타 (원본 기록 시각 표시용)
  const [archivedAt, setArchivedAt] = useState<string | null>(null);

  // 잘못된 카테고리 → 홈.
  // 비활성(legacy) 카테고리는 isArchiveMode 일 때만 허용 — 정상 진입(?recordId 없음)이면 홈으로.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isLegacy) {
      if (!isArchiveMode) router.replace('/');
      return;
    }
    if (!isValidCategory) {
      router.replace('/');
    }
  }, [isValidCategory, isLegacy, isArchiveMode, router]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchBalance();
    }
  }, [user, fetchProfiles, fetchBalance]);

  // 이름 풀이: 프로필의 이름을 기본값으로 — 보관함 재생 모드에서는 저장된 값 사용
  useEffect(() => {
    if (isArchiveMode) return;
    if (category === 'name' && targetProfile && !koreanName) {
      setKoreanName(targetProfile.name);
    }
  }, [category, targetProfile, koreanName, isArchiveMode]);

  // ── 보관함 재생 모드 — recordId 쿼리가 있으면 저장된 기록으로 state 복원 ──
  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    sajuDB.getRecordById(recordId)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setError('기록을 불러오지 못했어요. 삭제되었거나 권한이 없는 기록일 수 있어요.');
          return;
        }
        // 저장된 interpretation 을 결과로 바로 주입 (AI 호출 없이)
        const content = record.interpretation_detailed ?? record.interpretation_basic ?? '';
        setResult(content);
        setArchivedAt(record.created_at);
        // 이름 풀이면 저장된 한글/한자 이름 복원 (읽기 전용으로 표시)
        if (record.category === 'name' && record.engine_result) {
          const eng = record.engine_result as { koreanName?: string; hanjaName?: string };
          if (typeof eng.koreanName === 'string') setKoreanName(eng.koreanName);
          if (typeof eng.hanjaName === 'string') setHanjaName(eng.hanjaName);
        }
        // 꿈 해몽이면 저장된 꿈 텍스트 복원
        if (record.category === 'dream' && record.engine_result) {
          const eng = record.engine_result as { dreamText?: string };
          if (typeof eng.dreamText === 'string') setDreamText(eng.dreamText);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('[archive replay] load failed', e);
        setError('보관된 풀이를 불러오는 중 오류가 발생했어요.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [recordId]);

  // ── 보관함 DB 확인 — 이전에 본 풀이가 있으면 모달 표시 ──
  useEffect(() => {
    if (isArchiveMode || !targetProfile || !category) return;
    if (isLegacy) return;
    if (searchParams?.get('fresh') === '1') return;
    let cancelled = false;
    findRecentArchive({
      category: category as ArchiveCategory,
      birth_date: targetProfile.birth_date,
      gender: targetProfile.gender,
      profile_id: targetProfile.id,
    }).then(found => {
      if (cancelled || !found) return;
      setCacheGate({
        kind: `more:${category}` as const,
        key: '',
        restore: () => {
          const params = new URLSearchParams(window.location.search);
          params.set('recordId', found.id);
          router.replace(`${window.location.pathname}?${params.toString()}`);
        },
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [category, targetProfile, isArchiveMode, isLegacy, router]);

  // [B안] cfg 가 없는데 legacy + archive 모드면 보관함 재생 전용 fallback 화면 렌더.
  // 그 외 (legacy + 정상 진입 / 잘못된 카테고리) 는 위 useEffect 가 홈으로 redirect.
  if (!cfg && isLegacy && isArchiveMode) {
    const legacyLabel = LEGACY_MORE_LABELS[category as LegacyMoreCategory];
    return (
      <div className={styles.container}>
        <div className="flex items-center relative mb-4">
          <BackButton className="absolute left-0" />
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>{legacyLabel}</h1>
            <p className="text-xs text-text-tertiary">보관된 풀이</p>
          </div>
        </div>
        <div className={styles.content}>
          <div
            className={styles.section}
            style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.35)' }}
          >
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              이 카테고리는 메인 풀이(신년운세·정통사주·자미두수)와 중복이라 신규 풀이는 종료됐어요.
              아래는 이전에 받으신 풀이 기록입니다.
            </p>
          </div>
          {loading && <p className={styles.loading}>불러오는 중…</p>}
          {error && <p style={{ color: 'var(--fire-core)' }}>{error}</p>}
          {result && (
            <div className={styles.section}>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {result}
              </pre>
              {archivedAt && (
                <p className={styles.dateInfo} style={{ marginTop: 12 }}>
                  저장 시각: {new Date(archivedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 모든 Hooks 이후 guard: 유효하지 않은 카테고리면 렌더 중단
  if (!cfg) return null;

  const canSubmit = useMemo(() => {
    // 꿈 해몽은 사주 원국을 쓰지 않는다 — 프로필 없어도 DreamInputPanel 입력만으로 가능
    if (category === 'dream') return dreamValid;
    if (!saju) return false;
    if (category === 'name') {
      return koreanName.trim().length >= 1;
    }
    return true;
  }, [saju, category, koreanName, dreamValid]);

  // 캐시 키 — 카테고리별로 식별자가 다름
  const buildCacheKey = (): string | null => {
    if (!category) return null;
    if (category === 'dream') {
      const t = dreamText.trim();
      if (!t) return null;
      return `dream:${t}`;
    }
    if (!saju) return null;
    const sk = sajuKey(saju);
    if (category === 'name') {
      return `${sk}:${koreanName.trim()}|${hanjaName.trim()}`;
    }
    return sk;
  };

  // 카테고리/입력 바뀔 때 캐시 silent restore — 탭 이동·새로고침 후 다시 와도 재호출 X
  useEffect(() => {
    if (isArchiveMode) return;
    if (cacheGate) return;
    const cacheKey = buildCacheKey();
    const kindKey = category ? (`more:${category}` as const) : null;
    if (cacheKey && kindKey) {
      const cached = useReportCacheStore.getState().getReport<string>(kindKey, cacheKey);
      if (cached?.data) {
        setResult(cached.data);
        return;
      }
    }
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, saju, koreanName, hanjaName, dreamText, isArchiveMode]);

  const handleRead = async () => {
    // 꿈 해몽은 saju 없이도 실행 가능
    if (category !== 'dream' && !saju) return;
    if (!canSubmit || loading) return;

    // 이름풀이 사전 validation: 한글 이름이 실제 한글인지 로딩 시작 전에 확인
    if (category === 'name') {
      const kor = analyzeKoreanName(koreanName);
      if (kor.elements.length === 0) {
        setError('한글 이름은 반드시 한글로 입력해주세요. 한자는 아래 "한자 이름" 칸에 따로 입력하면 됩니다.');
        return;
      }
    }

    // 캐시 우선 — 같은 입력 재진입 시 silent restore
    const cacheKey = buildCacheKey();
    const kindKey = `more:${category}` as const;
    if (cacheKey) {
      const cached = useReportCacheStore.getState().getReport<string>(kindKey, cacheKey);
      if (cached?.error) {
        setError(cached.error);
        return;
      }
      if (cached?.data) {
        setResult(cached.data);
        return;
      }
    }

    if (moonBalance < MOON_COST_PER_FORTUNE) {
      setError('달 크레딧이 부족해요. 크레딧을 충전해주세요.');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      type FortuneResp = { success: boolean; content?: string; error?: string };
      let resp: FortuneResp = { success: false, error: '알 수 없는 카테고리' };

      if (category === 'dream') {
        resp = await getDreamInterpretation(dreamText.trim(), targetProfile?.id);
      } else {
        // 여기서 saju는 이미 위 가드로 보장됨
        const s = saju!;
        // [B안] love/wealth/career/health/people 비활성. 복원 시 case 같이 풀기.
        // case 'love':   resp = await getLoveShort(s); break;
        // case 'wealth': resp = await getWealthShort(s); break;
        // case 'career': resp = await getCareerShort(s); break;
        // case 'health': resp = await getHealthShort(s); break;
        // case 'people': resp = await getPeopleShort(s); break;
        switch (category) {
          case 'study':       resp = await getStudyShort(s, targetProfile?.id); break;
          case 'children':    resp = await getChildrenShort(s, targetProfile?.id); break;
          case 'personality': resp = await getPersonalityShort(s, targetProfile?.id); break;
          case 'name': {
            const kor = analyzeKoreanName(koreanName);
            resp = await getNameFortune(s, {
              koreanName: koreanName.trim(),
              koreanInitialsElements: kor.elements,
              hanjaName: hanjaName.trim() || undefined,
            }, targetProfile?.id);
            break;
          }
        }
      }

      if (!resp || !resp.success || !resp.content) {
        throw new Error(resp?.error || '풀이 생성에 실패했어요.');
      }

      setResult(resp!.content);

      if (cacheKey) {
        const cache = useReportCacheStore.getState();
        // 정상 응답 캐시 저장 — 재진입 시 silent restore
        cache.setReport(kindKey, cacheKey, resp!.content);
        if (!cache.isCharged(kindKey, cacheKey)) {
          cache.markCharged(kindKey, cacheKey);
          const consumed = await chargeForContent('moon', MOON_COST_PER_FORTUNE, `더많은운세:${cfg.title}`);
          if (!consumed) {
            console.error('크레딧 차감 실패 (응답은 이미 생성됨)');
          }
        }
      }
    } catch (e: any) {
      const msg = e?.message || '오류가 발생했어요.';
      setError(msg);
      // negative cache: 같은 입력 즉시 재시도 차단
      if (cacheKey) {
        useReportCacheStore.getState().setError(kindKey, cacheKey, msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 비로그인 가드
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">{cfg.title} 풀이는 로그인 후 이용 가능해요.</p>
        <Link href={`/login?from=${encodeURIComponent(`/saju/more/${category ?? ''}`)}`} className="text-cta font-semibold underline">로그인하기</Link>
      </div>
    );
  }

  // 프로필 선택 가드 (name/dream 제외)
  if (needsProfileSelect && cfg) {
    return (
      <FortuneProfileSelect
        serviceName={cfg.title}
        archiveCategory={category as ArchiveCategory}
        creditType="moon"
        creditCost={MOON_COST_SELECT}
      />
    );
  }

  // 꿈 해몽은 사주와 무관 — 프로필 없어도 진입 가능.
  if (!isArchiveMode && category !== 'dream' && !targetProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">{cfg.title}을 보려면 대표 프로필이 필요해요.</p>
        <Link href="/saju/input" className="text-cta font-semibold underline">프로필 등록</Link>
      </div>
    );
  }

  if (!isArchiveMode && category !== 'dream' && !saju) {
    return <div className={styles.loading}>사주 계산 중...</div>;
  }

  // 로딩 풀스크린 — 보관함 재생 모드는 짧은 DB 조회라 AI 로딩 연출 대신 간단한 표시
  if (loading && !isArchiveMode) {
    return (
      <AILoadingBar
        label={`${cfg.title} 분석 중`}
        minLabel="5초"
        maxLabel="20초"
        estimatedSeconds={12}
        messages={LOADING_MESSAGES[category as MoreFortuneId]}
        topContent={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[28px] mb-1 font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
              {cfg.title}
            </div>
            <div className="text-[14px] text-text-tertiary">{cfg.shortDesc}</div>
          </motion.div>
        }
      />
    );
  }
  if (loading && isArchiveMode) {
    return <div className={styles.loading}>보관된 풀이를 불러오는 중…</div>;
  }

  return (
    <div className={styles.container}>
      <div className="flex items-center relative mb-4">
        <BackButton className="absolute left-0" />
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>{cfg.title}</h1>
          {isArchiveMode && archivedAt ? (
            <p className="text-xs text-text-tertiary">
              보관함 · {new Date(archivedAt).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          ) : targetProfile ? (
            <p className="text-xs text-text-tertiary">{targetProfile.name} · {targetProfile.birth_date}</p>
          ) : null}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.content}
      >
        {/* 소개 카드 */}
        <div
          className={styles.section}
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(236,72,153,0.06))',
            border: '1px solid rgba(139,92,246,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ display: 'inline-block', width: 4, height: 22, borderRadius: 2, background: 'var(--cta-primary)' }} />
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
                MORE FORTUNE
              </p>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{cfg.title}</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
            {cfg.longDesc}
          </p>
        </div>

        {/* 꿈 해몽 전용 입력 — 선명/흐릿 두 모드. 보관함 재생 모드에서는 저장된 텍스트만 간단 표시 */}
        {category === 'dream' && !isArchiveMode && (
          <div className={styles.section}>
            <h2 style={{ fontSize: 18, marginBottom: 14, fontWeight: 700 }}>꿈 내용 입력</h2>
            <DreamInputPanel
              onTextChange={setDreamText}
              onValidChange={setDreamValid}
            />
          </div>
        )}
        {category === 'dream' && isArchiveMode && dreamText && (
          <div className={styles.section}>
            <h2 style={{ fontSize: 14, marginBottom: 8 }}>당신이 적은 꿈</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
              {dreamText}
            </p>
          </div>
        )}

        {/* 이름 풀이 전용 입력 */}
        {category === 'name' && (
          <div className={styles.section}>
            <h2 style={{ fontSize: 14 }}>이름 입력</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                  한글 이름 {isArchiveMode ? '' : '(필수)'}
                </label>
                <input
                  type="text"
                  value={koreanName}
                  onChange={(e) => setKoreanName(e.target.value)}
                  placeholder="예: 홍길동"
                  maxLength={10}
                  readOnly={isArchiveMode}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    cursor: isArchiveMode ? 'default' : 'text',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>
                  한자 이름 {isArchiveMode ? '' : '(선택)'}
                </label>
                <input
                  type="text"
                  value={hanjaName}
                  onChange={(e) => setHanjaName(e.target.value)}
                  placeholder="예: 洪吉童 (몰라도 됩니다)"
                  maxLength={10}
                  readOnly={isArchiveMode}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    cursor: isArchiveMode ? 'default' : 'text',
                  }}
                />
                {!isArchiveMode && (
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    한자를 모르시면 비워두세요. 한글만 있어도 음령오행으로 완결 분석됩니다.
                    한자를 입력하면 부수 기반 자원오행까지 교차 분석해 더 정밀한 풀이가 나옵니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 풀이 보기 버튼 — 보관함 재생 모드에서는 숨김 (이미 저장된 결과를 아래에 렌더) */}
        {!isArchiveMode && (
          <div className={styles.section} style={{ padding: 0, background: 'none', border: 'none' }}>
            <button
              onClick={handleRead}
              disabled={!canSubmit || loading || moonBalance < MOON_COST_PER_FORTUNE}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, var(--cta-primary), var(--cta-secondary, var(--cta-primary)))',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                cursor: (!canSubmit || loading || moonBalance < MOON_COST_PER_FORTUNE) ? 'not-allowed' : 'pointer',
                opacity: (!canSubmit || loading || moonBalance < MOON_COST_PER_FORTUNE) ? 0.5 : 1,
                boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {cfg.ctaButton} <span style={{ opacity: 0.85, fontSize: 13 }}>🌙 {MOON_COST_PER_FORTUNE}</span>
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 6 }}>
              보유 🌙 {moonBalance} · 1회 {MOON_COST_PER_FORTUNE}개 소모
            </p>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div
            className={styles.section}
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.35)',
            }}
          >
            <p style={{ fontSize: 13, color: '#F87171', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* 결과 */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.section}
            >
              <h2 style={{ fontSize: 17, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 4, height: 20, borderRadius: 2, background: 'var(--cta-primary)' }} />
                {cfg.title} 풀이
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.85,
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {result}
              </p>

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                {isArchiveMode ? (
                  <Link
                    href="/archive"
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      textAlign: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    보관함으로
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setResult(null);
                      setError(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    다시 풀이 받기
                  </button>
                )}
                <Link
                  href="/"
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--cta-primary)',
                    border: 'none',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: 12,
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  홈으로
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <RestoreReportModal
        open={!!cacheGate}
        title={cfg.title}
        onUseCached={handleUseCached}
        onRefresh={handleRefetch}
        onClose={() => setCacheGate(null)}
      />
    </div>
  );
}
