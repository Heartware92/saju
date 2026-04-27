'use client';

/**
 * 택일 운세 페이지
 * - 카테고리(결혼·이사·개업 등) + 날짜 범위 선택
 * - 캘린더 뷰로 길/흉 날짜 색상 표시
 * - 대표 프로필 기반 자동 계산
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sajuDB } from '../services/supabase';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { useReportCacheStore, sajuKey } from '../store/useReportCacheStore';
import { SUN_COST_BIG, CHARGE_REASONS } from '../constants/creditCosts';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { BackButton } from '../components/ui/BackButton';
import {
  calculateTaekil,
  TAEKIL_CATEGORIES,
  type TaekilCategory,
  type TaekilGrade,
  type TaekilDay,
  type TaekilResult,
} from '../engine/taekil';
import { getTaekilAdvice } from '../services/fortuneService';
import styles from './SajuResultPage.module.css';

const GRADE_COLOR: Record<TaekilGrade, string> = {
  '대길': '#34D399',
  '길': '#86EFAC',
  '평': '#94A3B8',
  '흉': '#F87171',
};

const GRADE_BG: Record<TaekilGrade, string> = {
  '대길': 'rgba(52,211,153,0.2)',
  '길': 'rgba(134,239,172,0.15)',
  '평': 'rgba(148,163,184,0.08)',
  '흉': 'rgba(248,113,113,0.15)',
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function TaekilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams?.get('recordId') ?? null;
  const isArchiveMode = !!recordId;
  const { user } = useUserStore();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();

  useEffect(() => {
    if (user) fetchProfiles();
  }, [user, fetchProfiles]);

  const primary = useMemo(
    () => profiles.find((p) => p.is_primary) ?? null,
    [profiles],
  );

  const saju = useMemo(() => {
    if (!primary) return null;
    return computeSajuFromProfile(primary);
  }, [primary]);

  // 카테고리 선택
  const [category, setCategory] = useState<TaekilCategory>('marriage');

  // 오늘/연도 제한 — 오늘 연도 ~ +5년 범위만 허용
  const today = new Date();
  const todayYear = today.getFullYear();
  const MAX_YEAR = todayYear + 5;
  const MIN_YEAR = todayYear;

  // 연·월 네비게이션 (연 ◀▶, 월은 12개 버튼)
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  // 택일 결과
  const [result, setResult] = useState<TaekilResult | null>(null);
  const [selectedDay, setSelectedDay] = useState<TaekilDay | null>(null);

  // 직원 피드백: 후보 날짜 다중 선택 → Top 3 비교 (그래프/표)
  // single = 캘린더에서 한 날짜 상세, compare = 여러 후보 토글하여 비교
  const [pickMode, setPickMode] = useState<'single' | 'compare'>('single');
  const MAX_CANDIDATES = 7;
  const [candidateDates, setCandidateDates] = useState<string[]>([]);

  // AI 추천 — 자동 호출 X, 날짜 선택 후 수동 버튼 트리거
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 캐시 키 — saju + 연·월 + 카테고리 + (compare 모드면 후보 셋). 같은 조합은 같은 advice를 가짐.
  const taekilCacheKey = useMemo(() => {
    if (!saju) return null;
    const candKey = pickMode === 'compare' && candidateDates.length > 0
      ? `:cmp=${[...candidateDates].sort().join(',')}`
      : '';
    return `${sajuKey(saju)}:${viewYear}-${viewMonth}:${category}${candKey}`;
  }, [saju, viewYear, viewMonth, category, pickMode, candidateDates]);

  // 연/월/카테고리 변경 시 자동으로 캘린더 재계산 + 캐시된 advice 복원
  const compute = useCallback(() => {
    if (!saju) return;
    const start = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`;
    const lastDay = daysInMonth(viewYear, viewMonth);
    const end = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const r = calculateTaekil(saju, category, start, end);
    setResult(r);
    setSelectedDay(null);
    setCandidateDates([]);
    setAiError(null);

    // 정상 응답 캐시 X (수동 트리거 페이지 — 사용자가 버튼 누를 때만 호출).
    // 다음 카테고리/연월 전환 시 이전 advice 비움.
    setAiAdvice(null);
  }, [saju, viewYear, viewMonth, category]);

  useEffect(() => {
    compute();
  }, [compute]);

  // ── 보관함 재생 모드 — recordId 가 있으면 DB 에서 advice 텍스트만 복원 (캘린더 calc 는 그대로 동작) ──
  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    sajuDB.getRecordById(recordId)
      .then((record) => {
        if (cancelled || !record) return;
        const content = record.interpretation_detailed ?? record.interpretation_basic ?? '';
        if (content) setAiAdvice(content);
      })
      .catch((e) => console.error('[archive replay] taekil load failed', e));
    return () => { cancelled = true; };
  }, [recordId]);

  // 연도 네비 (월 단위 X, 연 단위)
  const prevYear = () => {
    if (viewYear > MIN_YEAR) setViewYear(y => y - 1);
  };
  const nextYear = () => {
    if (viewYear < MAX_YEAR) setViewYear(y => y + 1);
  };

  // 후보 날짜 정렬 + 등급 데이터 — 비교 그래프/표용
  const candidateDays = useMemo(() => {
    if (!result || candidateDates.length === 0) return [];
    const map = new Map(result.days.map(d => [d.date, d]));
    return candidateDates
      .map(date => map.get(date))
      .filter((d): d is TaekilDay => !!d)
      .sort((a, b) => b.score - a.score);
  }, [result, candidateDates]);

  const toggleCandidate = (date: string) => {
    setCandidateDates(prev => {
      if (prev.includes(date)) return prev.filter(d => d !== date);
      if (prev.length >= MAX_CANDIDATES) return prev;
      return [...prev, date];
    });
  };

  const clearCandidates = () => setCandidateDates([]);

  // 수동 AI 트리거 — 정상 캐시 X (사용자가 누른다 = 새 풀이). 실패 1분 차단만.
  const handleRequestAI = async () => {
    if (!saju || !result || aiLoading || !taekilCacheKey) return;

    const cached = useReportCacheStore.getState().getReport<string>('taekil', taekilCacheKey);
    if (cached?.error) {
      setAiError(cached.error);
      return;
    }

    // compare 모드는 사용자가 고른 후보만 result.days 로 보내 — Top 3 비교 풀이
    const payload: TaekilResult = pickMode === 'compare' && candidateDays.length >= 2
      ? {
          ...result,
          days: candidateDays,
          bestDays: [...candidateDays].sort((a, b) => b.score - a.score),
        }
      : result;

    setAiError(null);
    setAiLoading(true);
    try {
      const r = await getTaekilAdvice(saju, payload);
      if (!r.success || !r.advice) {
        throw new Error(r.error || '길일 분석을 가져오지 못했어요.');
      }
      setAiAdvice(r.advice);
      const cache = useReportCacheStore.getState();
      if (!cache.isCharged('taekil', taekilCacheKey)) {
        cache.markCharged('taekil', taekilCacheKey);
        useCreditStore.getState()
          .chargeForContent('sun', SUN_COST_BIG, CHARGE_REASONS.taekil)
          .catch(() => {});
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '오류가 발생했어요.';
      setAiError(msg);
      useReportCacheStore.getState().setError('taekil', taekilCacheKey, msg);
    } finally {
      setAiLoading(false);
    }
  };

  // 캘린더 그리드 데이터
  const calendarCells = useMemo(() => {
    if (!result) return [];
    const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
    const total = daysInMonth(viewYear, viewMonth);
    const dayMap = new Map<string, TaekilDay>();
    result.days.forEach(d => dayMap.set(d.date, d));

    const cells: Array<{ day: number; date: string; data: TaekilDay | null } | null> = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      const iso = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, date: iso, data: dayMap.get(iso) ?? null });
    }
    return cells;
  }, [result, viewYear, viewMonth]);

  // 로딩 / 프로필 없음
  if (!primary) {
    const ready = hydrated && lastFetchedAt !== null && !profilesLoading;
    if (!ready) return <div className={styles.loading}>로딩 중...</div>;
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <BackButton />
        </div>
        <div className={styles.section} style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2>대표 프로필이 없어요</h2>
          <p style={{ margin: '16px 0 24px', color: 'var(--text-secondary)' }}>
            택일을 하려면 먼저 생년월일시를 등록해주세요.
          </p>
          <button className={styles.backBtn} onClick={() => router.push('/saju/input')} style={{ margin: '0 auto' }}>
            프로필 등록하기
          </button>
        </div>
      </div>
    );
  }

  if (!saju) return <div className={styles.loading}>로딩 중...</div>;

  const todayIso = toIso(today);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <BackButton />
        <div className={styles.headerCenter}>
          <h1>택일 운세</h1>
          <p className={styles.dateInfo}>
            {primary.name} · 길일을 골라드려요
          </p>
        </div>
      </div>

      <div className={styles.content}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* 카테고리 선택 */}
          <div className={styles.section}>
            <h2>행사 카테고리</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginTop: '10px',
            }}>
              {TAEKIL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '12px',
                    border: category === cat.id
                      ? '2px solid var(--cta-primary)'
                      : '1px solid var(--border-subtle)',
                    background: category === cat.id
                      ? 'rgba(124,92,252,0.15)'
                      : 'var(--space-elevated)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: category === cat.id ? 'var(--cta-primary)' : 'var(--text-primary)',
                  }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {cat.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 보기 모드 — 단일 상세 vs 후보 비교 (직원 피드백: 다중 추천) */}
          <div className={styles.section} style={{ paddingTop: 14, paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 15 }}>날짜 선택 방식</h2>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>
                  {pickMode === 'single'
                    ? '날짜 하나를 골라 상세 풀이를 봐요'
                    : `여러 날짜를 골라 점수·근거를 비교해요 (최대 ${MAX_CANDIDATES}개)`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--space-elevated)', padding: 3, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                {(['single', 'compare'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => {
                      setPickMode(mode);
                      setSelectedDay(null);
                      setCandidateDates([]);
                      setAiAdvice(null);
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: pickMode === mode ? 'var(--cta-primary)' : 'transparent',
                      color: pickMode === mode ? 'white' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {mode === 'single' ? '단일' : '후보 비교'}
                  </button>
                ))}
              </div>
            </div>
            {pickMode === 'compare' && candidateDates.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  선택됨: <strong style={{ color: 'var(--cta-primary)' }}>{candidateDates.length}</strong> / {MAX_CANDIDATES}
                </span>
                <button
                  onClick={clearCandidates}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-tertiary)', textDecoration: 'underline',
                    cursor: 'pointer', fontSize: 12,
                  }}
                >
                  전체 해제
                </button>
              </div>
            )}
          </div>

          {/* 캘린더 */}
          <div className={styles.section}>
            {/* 연도 네비게이션 (오늘 ~ +5년 범위) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <button
                onClick={prevYear}
                disabled={viewYear <= MIN_YEAR}
                style={{
                  background: 'var(--space-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '8px 16px',
                  color: viewYear <= MIN_YEAR ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: viewYear <= MIN_YEAR ? 'not-allowed' : 'pointer',
                  fontSize: '16px', fontWeight: 700,
                  opacity: viewYear <= MIN_YEAR ? 0.4 : 1,
                }}
              >
                ◀
              </button>
              <h2 style={{ margin: 0, fontSize: 20, fontFamily: 'var(--font-serif)' }}>
                {viewYear}년
              </h2>
              <button
                onClick={nextYear}
                disabled={viewYear >= MAX_YEAR}
                style={{
                  background: 'var(--space-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px', padding: '8px 16px',
                  color: viewYear >= MAX_YEAR ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  cursor: viewYear >= MAX_YEAR ? 'not-allowed' : 'pointer',
                  fontSize: '16px', fontWeight: 700,
                  opacity: viewYear >= MAX_YEAR ? 0.4 : 1,
                }}
              >
                ▶
              </button>
            </div>

            {/* 월 선택 12개 버튼 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '4px',
                marginBottom: '14px',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isCurrent = m === viewMonth;
                const isPast = viewYear === todayYear && m < today.getMonth() + 1;
                return (
                  <button
                    key={m}
                    onClick={() => !isPast && setViewMonth(m)}
                    disabled={isPast}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 8,
                      border: isCurrent
                        ? '1.5px solid var(--cta-primary)'
                        : '1px solid var(--border-subtle)',
                      background: isCurrent
                        ? 'rgba(232,164,144,0.18)'
                        : isPast
                        ? 'rgba(20,12,38,0.3)'
                        : 'var(--space-elevated)',
                      color: isCurrent
                        ? 'var(--cta-primary)'
                        : isPast
                        ? 'var(--text-tertiary)'
                        : 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      opacity: isPast ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {m}월
                  </button>
                );
              })}
            </div>

            <p style={{
              fontSize: 11,
              color: 'var(--text-tertiary)',
              textAlign: 'center',
              marginBottom: 10,
              opacity: 0.7,
            }}>
              오늘부터 최대 5년까지 조회 가능해요
            </p>

            {/* 요일 헤더 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px', textAlign: 'center', marginBottom: '4px',
            }}>
              {WEEKDAYS.map((w, i) => (
                <span key={w} style={{
                  fontSize: '12px', fontWeight: 600, padding: '4px 0',
                  color: i === 0 ? '#F87171' : i === 6 ? '#60A5FA' : 'var(--text-tertiary)',
                }}>
                  {w}
                </span>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
            }}>
              {calendarCells.map((cell, i) => {
                if (!cell) return <div key={`empty-${i}`} />;
                const d = cell.data;
                const isToday = cell.date === todayIso;
                const isCompare = pickMode === 'compare';
                const isSingleSel = !isCompare && selectedDay?.date === cell.date;
                const isCandidate = isCompare && candidateDates.includes(cell.date);
                const isSelected = isSingleSel || isCandidate;
                const dow = new Date(cell.date).getDay();
                return (
                  <button
                    key={cell.date}
                    onClick={() => {
                      if (!d) return;
                      if (isCompare) {
                        toggleCandidate(cell.date);
                      } else {
                        setSelectedDay(d);
                      }
                    }}
                    style={{
                      aspectRatio: '1',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--cta-primary)'
                        : isToday ? '1px solid rgba(255,255,255,0.3)'
                        : '1px solid transparent',
                      background: isCandidate
                        ? 'rgba(124,92,252,0.22)'
                        : d ? GRADE_BG[d.grade] : 'transparent',
                      cursor: d ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                      padding: '2px',
                      position: 'relative',
                    }}
                  >
                    {isCandidate && (
                      <span style={{
                        position: 'absolute', top: 2, right: 3,
                        fontSize: 10, fontWeight: 800, color: 'var(--cta-primary)',
                      }}>✓</span>
                    )}
                    <span style={{
                      fontSize: '13px', fontWeight: isToday ? 800 : 600,
                      color: dow === 0 ? '#F87171' : dow === 6 ? '#60A5FA' : 'var(--text-primary)',
                    }}>
                      {cell.day}
                    </span>
                    {d && (
                      <span style={{
                        fontSize: '9px', fontWeight: 700,
                        color: GRADE_COLOR[d.grade],
                        marginTop: '1px',
                      }}>
                        {d.grade}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 범례 */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '16px',
              marginTop: '12px', fontSize: '11px', color: 'var(--text-tertiary)',
            }}>
              {(['대길', '길', '평', '흉'] as TaekilGrade[]).map(g => (
                <span key={g} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: GRADE_COLOR[g], display: 'inline-block',
                  }} />
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* 선택된 날짜 상세 (단일 모드 전용) */}
          {pickMode === 'single' && selectedDay && (
            <motion.div
              key={selectedDay.date}
              className={styles.section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <h2 style={{ margin: 0 }}>{selectedDay.date}</h2>
                <span style={{
                  padding: '3px 10px', borderRadius: '99px',
                  fontSize: '12px', fontWeight: 700,
                  color: GRADE_COLOR[selectedDay.grade],
                  border: `1px solid ${GRADE_COLOR[selectedDay.grade]}`,
                  background: GRADE_BG[selectedDay.grade],
                }}>
                  {selectedDay.grade}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {selectedDay.score}점
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                {selectedDay.lunarLabel}
              </div>

              <div style={{
                display: 'flex', gap: '8px', marginBottom: '12px',
                fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-serif)',
              }}>
                <span style={{ color: GRADE_COLOR[selectedDay.grade] }}>
                  {selectedDay.dayGan}{selectedDay.dayZhi}일
                </span>
              </div>

              <ul style={{
                listStyle: 'none', margin: 0, padding: 0,
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                {selectedDay.reasons.map((r, i) => (
                  <li key={i} style={{
                    fontSize: '13px', color: 'var(--text-secondary)',
                    paddingLeft: '12px', position: 'relative',
                    lineHeight: 1.6,
                  }}>
                    <span style={{
                      position: 'absolute', left: 0, top: '2px',
                      color: 'var(--text-tertiary)', fontSize: '10px',
                    }}>●</span>
                    {r}
                  </li>
                ))}
              </ul>

              {selectedDay.luckyTime && (
                <div style={{
                  marginTop: '12px', padding: '10px 14px',
                  background: 'rgba(52,211,153,0.1)', borderRadius: '10px',
                  border: '1px solid rgba(52,211,153,0.25)',
                  fontSize: '13px', color: '#34D399',
                }}>
                  추천 시간: {selectedDay.luckyTime}
                </div>
              )}
            </motion.div>
          )}

          {/* 후보 비교 — Top 3 + 점수 그래프 + 명리 근거 표 (직원 피드백) */}
          {pickMode === 'compare' && candidateDays.length > 0 && (
            <div className={styles.section}>
              <h2>후보 비교 분석</h2>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                선택한 {candidateDays.length}개 날짜를 점수 순으로 정렬했어요. 상위 3개에 메달이 표시돼요.
              </p>

              {/* Top 3 메달 카드 */}
              {candidateDays.length >= 1 && (
                <div style={{
                  marginTop: 14,
                  display: 'grid',
                  gridTemplateColumns: candidateDays.length === 1 ? '1fr' : candidateDays.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
                  gap: 8,
                }}>
                  {candidateDays.slice(0, 3).map((d, idx) => {
                    const medal = ['🥇', '🥈', '🥉'][idx];
                    const dow = WEEKDAYS[new Date(d.date).getDay()];
                    return (
                      <div key={d.date} style={{
                        padding: '12px 8px',
                        background: idx === 0 ? 'rgba(232,164,144,0.18)' : 'var(--space-elevated)',
                        border: idx === 0 ? '1.5px solid var(--cta-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 22, lineHeight: 1 }}>{medal}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginTop: 6, color: 'var(--text-primary)' }}>
                          {d.date.slice(5).replace('-', '/')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>({dow})</div>
                        <div style={{
                          fontSize: 12, fontWeight: 800, marginTop: 4,
                          color: GRADE_COLOR[d.grade],
                        }}>
                          {d.grade} · {d.score}점
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 점수 그래프 (가로 바) */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
                  점수 그래프
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {candidateDays.map((d) => (
                    <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, width: 56, color: 'var(--text-secondary)', flexShrink: 0 }}>
                        {d.date.slice(5).replace('-', '/')}
                      </span>
                      <div style={{
                        flex: 1, height: 18, borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${d.score}%`, height: '100%',
                          background: GRADE_COLOR[d.grade],
                          opacity: 0.9, borderRadius: 6,
                          transition: 'width 0.4s ease',
                        }} />
                        <span style={{
                          position: 'absolute', right: 6, top: 1,
                          fontSize: 10, fontWeight: 700,
                          color: 'var(--text-primary)',
                          textShadow: '0 0 4px rgba(0,0,0,0.6)',
                        }}>
                          {d.score}
                        </span>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, width: 32, textAlign: 'right',
                        color: GRADE_COLOR[d.grade], flexShrink: 0,
                      }}>
                        {d.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 명리 근거 표 */}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
                  명리 근거 비교
                </div>
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  {candidateDays.map((d, idx) => (
                    <div key={d.date} style={{
                      padding: '10px 12px',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)',
                      background: idx === 0 ? 'rgba(124,92,252,0.08)' : 'transparent',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                          {d.date}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: GRADE_COLOR[d.grade] }}>
                          {d.dayGan}{d.dayZhi} · {d.grade}
                        </span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 14, listStyle: 'disc' }}>
                        {d.reasons.slice(0, 3).map((r, i) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {r}
                          </li>
                        ))}
                      </ul>
                      {d.luckyTime && (
                        <div style={{
                          marginTop: 6, fontSize: 11,
                          color: '#34D399', fontWeight: 600,
                        }}>
                          길시: {d.luckyTime}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 추천 길일 목록 (단일 모드 전용) */}
          {pickMode === 'single' && result && result.bestDays.length > 0 && (
            <div className={styles.section}>
              <h2>이달의 추천 길일</h2>
              <div style={{
                display: 'flex', gap: '8px', overflowX: 'auto',
                paddingBottom: '8px', WebkitOverflowScrolling: 'touch',
              }}>
                {result.bestDays.slice(0, 8).map(d => {
                  const dayNum = parseInt(d.date.split('-')[2]);
                  const dow = WEEKDAYS[new Date(d.date).getDay()];
                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDay(d)}
                      style={{
                        minWidth: '72px', padding: '10px 8px',
                        background: selectedDay?.date === d.date
                          ? 'rgba(124,92,252,0.18)' : 'var(--space-elevated)',
                        border: selectedDay?.date === d.date
                          ? '1px solid var(--cta-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: '12px', textAlign: 'center',
                        cursor: 'pointer', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {dayNum}일
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                        ({dow})
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 700,
                        color: GRADE_COLOR[d.grade],
                      }}>
                        {d.grade} · {d.score}점
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 길일 분석 — 수동 버튼 트리거 */}
          <div className={styles.section} style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ display: 'inline-block', width: 4, height: 20, borderRadius: 2, background: 'var(--cta-primary)' }} />
              <h2 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-serif)' }}>
                {pickMode === 'compare' && candidateDays.length >= 2
                  ? `후보 ${candidateDays.length}개 Top 3 풀이`
                  : selectedDay
                  ? `${selectedDay.date} 길흉 풀이`
                  : '길일 종합 분석'}
              </h2>
            </div>

            {!aiAdvice && !aiLoading && (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
                  {pickMode === 'compare' && candidateDays.length >= 2
                    ? `선택한 ${candidateDays.length}개 후보 중 Top 3 를 명리 근거(십성·12운성·신살)와 함께 추천하고, 피해야 할 후보도 짚어드려요.`
                    : pickMode === 'compare'
                    ? '캘린더에서 비교할 후보 날짜를 2개 이상 선택해 주세요.'
                    : selectedDay
                    ? `${selectedDay.date}(${selectedDay.grade}) 에 ${TAEKIL_CATEGORIES.find(c => c.id === category)?.label} 행사가 적합한지, 주의할 점과 길시까지 풀어드려요.`
                    : `${viewYear}년 ${viewMonth}월의 길일 Top 3와 피해야 할 날, 월별 기운 흐름을 종합 분석해드려요.`}
                </p>
                <button
                  onClick={handleRequestAI}
                  disabled={!result || (pickMode === 'compare' && candidateDays.length < 2)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: 12,
                    background: 'var(--cta-primary)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: (result && (pickMode === 'single' || candidateDays.length >= 2)) ? 'pointer' : 'not-allowed',
                    opacity: (result && (pickMode === 'single' || candidateDays.length >= 2)) ? 1 : 0.5,
                  }}
                >
                  {pickMode === 'compare'
                    ? candidateDays.length >= 2
                      ? `후보 ${candidateDays.length}개 비교 풀이받기`
                      : '후보를 2개 이상 선택해 주세요'
                    : selectedDay ? '이 날의 길흉 풀이받기' : '이 달의 길일 분석받기'}
                </button>
                {aiError && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.35)',
                  }}>
                    <p style={{ fontSize: 13, color: '#F87171', margin: 0, marginBottom: 6 }}>
                      {aiError}
                    </p>
                    <button
                      onClick={handleRequestAI}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 13,
                        color: 'var(--cta-primary)',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      다시 시도
                    </button>
                  </div>
                )}
              </>
            )}

            {aiLoading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '24px 16px',
                gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cta-primary)' }} className="animate-pulse" />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cta-primary)', animationDelay: '0.2s' }} className="animate-pulse" />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cta-primary)', animationDelay: '0.4s' }} className="animate-pulse" />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                  명리 분석 중입니다... (최대 1분)
                </p>
              </div>
            )}

            {aiAdvice && (
              <div style={{
                padding: 16,
                background: 'rgba(20,12,38,0.55)',
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                fontSize: 15,
                color: 'var(--text-secondary)',
                lineHeight: 1.85,
                letterSpacing: '-0.005em',
                whiteSpace: 'pre-line',
              }}>
                {aiAdvice}
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
