'use client';

/**
 * 택일 운세 페이지
 * - 카테고리(결혼·이사·개업 등) + 날짜 범위 선택
 * - 캘린더 뷰로 길/흉 날짜 색상 표시
 * - 대표 프로필 기반 자동 계산
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
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
import { AILoadingBar } from '../components/AILoadingBar';

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
  const [category, setCategory] = useState<TaekilCategory>('general');

  // 월 네비게이션
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);

  // 택일 결과
  const [result, setResult] = useState<TaekilResult | null>(null);
  const [selectedDay, setSelectedDay] = useState<TaekilDay | null>(null);

  // AI 추천
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 월 변경 시 자동 계산
  const compute = useCallback(() => {
    if (!saju) return;
    const start = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`;
    const lastDay = daysInMonth(viewYear, viewMonth);
    const end = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const r = calculateTaekil(saju, category, start, end);
    setResult(r);
    setSelectedDay(null);
    setAiAdvice(null);
  }, [saju, viewYear, viewMonth, category]);

  // 결과 나오면 AI 추천 자동 호출
  useEffect(() => {
    if (!saju || !result || aiAdvice || aiLoading) return;
    let cancelled = false;
    setAiLoading(true);
    getTaekilAdvice(saju, result)
      .then(r => { if (!cancelled && r.success) setAiAdvice(r.advice ?? null); })
      .finally(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [result, saju]);

  useEffect(() => {
    compute();
  }, [compute]);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
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
          <button className={styles.backBtn} onClick={() => router.back()}>← 뒤로</button>
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
        <button className={styles.backBtn} onClick={() => router.back()}>← 뒤로</button>
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

          {/* 캘린더 */}
          <div className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <button onClick={prevMonth} style={{
                background: 'var(--space-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)',
                cursor: 'pointer', fontSize: '16px', fontWeight: 700,
              }}>
                ◀
              </button>
              <h2 style={{ margin: 0 }}>{viewYear}년 {viewMonth}월</h2>
              <button onClick={nextMonth} style={{
                background: 'var(--space-elevated)', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)',
                cursor: 'pointer', fontSize: '16px', fontWeight: 700,
              }}>
                ▶
              </button>
            </div>

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
                const isSelected = selectedDay?.date === cell.date;
                const dow = new Date(cell.date).getDay();
                return (
                  <button
                    key={cell.date}
                    onClick={() => d && setSelectedDay(d)}
                    style={{
                      aspectRatio: '1',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--cta-primary)'
                        : isToday ? '1px solid rgba(255,255,255,0.3)'
                        : '1px solid transparent',
                      background: d ? GRADE_BG[d.grade] : 'transparent',
                      cursor: d ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                      padding: '2px',
                    }}
                  >
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

          {/* 선택된 날짜 상세 */}
          {selectedDay && (
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

          {/* 추천 길일 목록 */}
          {result && result.bestDays.length > 0 && (
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

          {/* AI 추천 내러티브 */}
          {(aiLoading || aiAdvice) && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                fontSize: '13px', fontWeight: 700,
                color: 'var(--text-primary)', marginBottom: '10px',
              }}>
                AI 길일 추천
              </div>
              {aiLoading ? (
                <div style={{ padding: '4px 0' }}>
                  <AILoadingBar
                    inline
                    label="길일 명리 분석중"
                    minLabel="10초"
                    maxLabel="30초"
                    estimatedSeconds={20}
                    messages={['날짜별 오행 기운을 계산하는 중입니다', '원국과의 합충을 분석하는 중입니다', '최적의 길일을 선별하는 중입니다']}
                  />
                </div>
              ) : aiAdvice ? (
                <div style={{
                  padding: '16px',
                  background: 'rgba(20,12,38,0.55)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                }}>
                  {aiAdvice}
                </div>
              ) : null}
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
