'use client';

/**
 * 토정비결 결과 페이지 (전체 무료 · 결정론적 풀이)
 * URL: /saju/tojeong?year=1990&month=1&day=1&calendarType=solar&...&targetYear=2026
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { calculateTojeong, type TojeongResult } from '../engine/tojeong';
import { buildTojeongReading, type TojeongReading } from '../engine/tojeong/reading';
import type { GwaeGrade } from '../engine/tojeong/gwae-table';
import { useProfileStore } from '../store/useProfileStore';
import { useCreditStore } from '../store/useCreditStore';
import { useReportCacheStore } from '../store/useReportCacheStore';
import { getTojeongReading } from '../services/fortuneService';
import { AILoadingBar } from '../components/AILoadingBar';
import { SUN_COST_BIG, CHARGE_REASONS } from '../constants/creditCosts';

const TOJEONG_MESSAGES = [
  '괘의 상징을 풀어 쓰는 중입니다',
  '12개월의 흐름을 정리하는 중입니다',
  '총운의 방향을 잡는 중입니다',
];

const GRADE_COLOR: Record<GwaeGrade, string> = {
  '대길': '#34D399',
  '길': '#86EFAC',
  '중길': '#FBBF24',
  '평': '#CBD5E1',
  '중흉': '#FB923C',
  '흉': '#F87171',
  '대흉': '#EF4444',
};

export default function TojeongResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);
  const chargeForContent = useCreditStore(s => s.chargeForContent);

  // AI 내러티브 — 진입 즉시 자동 호출
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const { tojeong, reading, cacheKey } = useMemo(() => {
    const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));
    let year: number, month: number, day: number, calendarType: 'solar' | 'lunar';
    const targetYear = parseInt(searchParams?.get('targetYear') || String(new Date().getFullYear()));

    if (hasUrlBirth) {
      year = parseInt(searchParams!.get('year')!);
      month = parseInt(searchParams!.get('month')!);
      day = parseInt(searchParams!.get('day')!);
      calendarType = (searchParams!.get('calendarType') || 'solar') as 'solar' | 'lunar';
    } else if (primary) {
      const [y, m, d] = primary.birth_date.split('-').map(Number);
      year = y; month = m; day = d;
      calendarType = primary.calendar_type;
    } else {
      return { tojeong: null, reading: null, cacheKey: null };
    }

    try {
      const t = calculateTojeong(year, month, day, calendarType, targetYear);
      const r = buildTojeongReading(t);
      const key = `${calendarType}_${year}-${month}-${day}_${targetYear}`;
      return { tojeong: t, reading: r, cacheKey: key };
    } catch {
      return { tojeong: null, reading: null, cacheKey: null };
    }
  }, [searchParams, primary]);

  // 심층 풀이 — 캐시 우선, 미스 시에만 호출 (45초 타임아웃)
  const aiStartedRef = useRef(false);
  useEffect(() => {
    if (!tojeong || !cacheKey) return;

    // 캐시 우선: 정상 → 즉시 표시 / 실패 캐시 → 1분 재호출 차단
    const cached = useReportCacheStore.getState().getReport<string>('tojeong', cacheKey);
    if (cached?.data) {
      setAiContent(cached.data);
      setAiLoading(false);
      return;
    }
    if (cached?.error) {
      setAiError(cached.error);
      setAiLoading(false);
      return;
    }

    if (aiStartedRef.current) return;
    aiStartedRef.current = true;

    let cancelled = false;
    setAiLoading(true);

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      const timeoutMsg = '응답이 너무 오래 걸려요. 아래 괘 풀이는 정상이니 확인해주세요.';
      setAiError(timeoutMsg);
      setAiLoading(false);
      useReportCacheStore.getState().setError('tojeong', cacheKey, timeoutMsg);
    }, 45_000);

    getTojeongReading(tojeong)
      .then(r => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        const cache = useReportCacheStore.getState();
        if (!r.success || !r.content) {
          const msg = r.error || '심층 풀이를 가져오지 못했어요.';
          setAiError(msg);
          cache.setError('tojeong', cacheKey, msg);
        } else {
          setAiContent(r.content);
          cache.setReport('tojeong', cacheKey, r.content);
          if (!cache.isCharged('tojeong', cacheKey)) {
            cache.markCharged('tojeong', cacheKey);
            chargeForContent('sun', SUN_COST_BIG, CHARGE_REASONS.tojeong).catch(() => {});
          }
        }
        setAiLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        const msg = err?.message || '오류가 발생했어요.';
        setAiError(msg);
        setAiLoading(false);
        useReportCacheStore.getState().setError('tojeong', cacheKey, msg);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [tojeong, cacheKey]);

  const retryAI = () => {
    if (!tojeong || !cacheKey) return;
    // 재시도는 사용자 명시적 동작 — negative cache 도 함께 무효화
    useReportCacheStore.getState().invalidate('tojeong', cacheKey);
    aiStartedRef.current = true;
    setAiContent(null);
    setAiError(null);
    setAiLoading(true);
    getTojeongReading(tojeong)
      .then(r => {
        const cache = useReportCacheStore.getState();
        if (!r.success || !r.content) {
          const msg = r.error || '심층 풀이를 가져오지 못했어요.';
          setAiError(msg);
          cache.setError('tojeong', cacheKey, msg);
        } else {
          setAiContent(r.content);
          cache.setReport('tojeong', cacheKey, r.content);
          if (!cache.isCharged('tojeong', cacheKey)) {
            cache.markCharged('tojeong', cacheKey);
            chargeForContent('sun', SUN_COST_BIG, CHARGE_REASONS.tojeong).catch(() => {});
          }
        }
        setAiLoading(false);
      })
      .catch(err => {
        const msg = err?.message || '오류가 발생했어요.';
        setAiError(msg);
        setAiLoading(false);
        useReportCacheStore.getState().setError('tojeong', cacheKey, msg);
      });
  };

  if (!tojeong || !reading) {
    const hasUrlBirth = !!searchParams?.get('year');
    const profileStoreReady = hydrated && lastFetchedAt !== null && !profilesLoading;
    if (!hasUrlBirth && !profileStoreReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (!primary && !hasUrlBirth) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[17px] font-semibold text-text-primary mb-2">대표 프로필이 없어요</p>
          <p className="text-[15px] text-text-secondary mb-4">프로필을 등록하면 토정비결을 볼 수 있어요</p>
          <button
            onClick={() => router.push('/saju/input')}
            className="px-4 py-2 rounded-lg bg-cta text-white text-[15px] font-semibold"
          >
            프로필 등록하기
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── AI 풀이 로딩 — 풀스크린 ──
  if (aiLoading) {
    return (
      <AILoadingBar
        label="토정비결 풀이중"
        minLabel="10초"
        maxLabel="40초"
        estimatedSeconds={20}
        messages={TOJEONG_MESSAGES}
        topContent={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[32px] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
              {tojeong.gwaeNumber}괘
            </div>
            <div className="text-[15px] text-text-tertiary">
              {tojeong.targetYear}년 · {reading.grade}
            </div>
          </motion.div>
        }
      />
    );
  }

  const gradeColor = GRADE_COLOR[reading.grade];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 pt-4 pb-10"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          {tojeong.targetYear}년 토정비결
        </h1>
        <div className="w-9" />
      </div>

      <p className="text-center text-[14px] text-text-tertiary mb-3">
        세는 나이 {tojeong.age}세 · {tojeong.yearGanZhi.ganZhi}년
      </p>

      {/* 괘 번호 */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-6 mb-3 text-center"
        style={{ backgroundColor: `${gradeColor}12`, border: `1px solid ${gradeColor}55` }}
      >
        <div className="text-[13px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">올해의 괘</div>
        <div className="text-5xl font-bold mb-2" style={{ color: gradeColor, fontFamily: 'var(--font-serif)' }}>
          {tojeong.gwaeNumber}
        </div>
        <div className="text-[16px] font-semibold mb-1" style={{ color: gradeColor }}>{reading.grade}</div>
        <div className="text-[15px] text-text-secondary">{reading.headline}</div>
      </motion.section>

      {/* 괘 구성 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">괘 풀이</div>

        <div className="space-y-2">
          <div className="rounded-lg p-3 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-text-tertiary">상괘</span>
              <span className="text-2xl">{tojeong.upperGwae.symbol}</span>
              <span className="text-[15px] font-bold text-text-primary">
                {tojeong.upperGwae.name}({tojeong.upperGwae.hanja})
              </span>
              <span className="text-[13px] text-text-tertiary">· {tojeong.upperGwae.element}</span>
            </div>
            <div className="text-[14px] text-text-secondary">{tojeong.upperGwae.meaning}</div>
          </div>

          <div className="rounded-lg p-3 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-text-tertiary">중괘</span>
              <span className="text-[15px] font-bold text-text-primary">{tojeong.middleGwae.position}</span>
            </div>
            <div className="text-[14px] text-text-secondary">{tojeong.middleGwae.meaning}</div>
          </div>

          <div className="rounded-lg p-3 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] font-bold text-text-tertiary">하괘</span>
              <span className="text-[15px] font-bold text-text-primary">{tojeong.lowerGwae.name}</span>
            </div>
            <div className="text-[14px] text-text-secondary">{tojeong.lowerGwae.meaning}</div>
          </div>
        </div>
      </section>

      {/* 키워드 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[15px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">키워드</div>
        <div className="flex flex-wrap gap-1.5">
          {reading.entry.keywords.map((k, i) => (
            <span
              key={i}
              className="text-[14px] px-2.5 py-1 rounded-md border"
              style={{ borderColor: `${gradeColor}55`, color: gradeColor, backgroundColor: `${gradeColor}12` }}
            >
              {k}
            </span>
          ))}
        </div>
      </section>

      {/* 원문 한문 괘사 */}
      {reading.entry.hanjaSa && (
        <section className="rounded-2xl p-4 mb-3 text-center" style={{ backgroundColor: `${gradeColor}08`, border: `1px solid ${gradeColor}33` }}>
          <div className="text-[12px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">괘사 (卦辭)</div>
          <div className="text-[22px] font-bold mb-3 tracking-[0.15em]" style={{ fontFamily: 'var(--font-serif)', color: gradeColor }}>
            {reading.entry.hanjaSa.title}
          </div>
          <div className="space-y-1 mb-3">
            {reading.entry.hanjaSa.lines.map((line, i) => (
              <div key={i} className="text-[16px] tracking-[0.1em] text-text-secondary" style={{ fontFamily: 'var(--font-serif)' }}>
                {line}
              </div>
            ))}
          </div>
          <div className="text-[14px] text-text-tertiary leading-relaxed border-t border-white/10 pt-3 mt-3">
            {reading.entry.hanjaSa.translation}
          </div>
        </section>
      )}

      {/* 총평 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">올해 총평</div>
        <div className="space-y-3">
          {reading.paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] text-text-secondary leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      {/* 월별 흐름 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[15px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">월별 흐름</div>
        <div className="space-y-1.5">
          {reading.monthly.map(m => (
            <div key={m.month} className="rounded-lg p-2.5 bg-white/5 flex gap-3">
              <div className="w-10 shrink-0 text-center">
                <div className="text-[15px] font-bold text-text-primary">{m.month}월</div>
                <div className="text-[12px] text-text-tertiary mt-0.5">{m.keyword.split('·')[0]}</div>
              </div>
              <div className="flex-1 text-[14px] text-text-secondary leading-relaxed">
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 조언·주의 */}
      <div className="grid grid-cols-1 gap-3">
        <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <div className="text-[15px] font-semibold mb-2" style={{ color: '#34D399' }}>올해의 조언</div>
          <ul className="space-y-1.5">
            {reading.advice.map((a, i) => (
              <li key={i} className="text-[14px] text-text-secondary flex gap-2">
                <span style={{ color: '#34D399' }}>✓</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <div className="text-[15px] font-semibold mb-2" style={{ color: '#F87171' }}>주의할 점</div>
          <ul className="space-y-1.5">
            {reading.warnings.map((w, i) => (
              <li key={i} className="text-[14px] text-text-secondary flex gap-2">
                <span style={{ color: '#F87171' }}>!</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 심층 풀이 — 자동 호출 결과 표시 */}
      {(aiContent || aiError) && (
        <section className="mt-3 rounded-2xl p-5 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-1 h-5 rounded-full bg-cta" />
            <div
              className="text-[17px] font-bold text-text-primary tracking-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              심층 풀이
            </div>
          </div>

          {aiError && !aiContent && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-[14px] text-red-400 mb-2">{aiError}</p>
              <button
                onClick={retryAI}
                className="text-[14px] text-cta font-semibold underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {aiContent && (
            <p className="text-[15px] text-text-secondary leading-[1.85] whitespace-pre-line tracking-[-0.005em]">
              {aiContent}
            </p>
          )}
        </section>
      )}
    </motion.div>
  );
}
