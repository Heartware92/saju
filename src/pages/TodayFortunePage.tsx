'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { calculateSaju, type SajuResult } from '../utils/sajuCalculator';
import { getTodayFortuneReport, type TodayFortuneAIResult } from '../services/fortuneService';
import { TODAY_SECTION_KEYS, TODAY_SECTION_LABELS } from '../constants/prompts';

export default function TodayFortunePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

  const [result, setResult] = useState<SajuResult | null>(null);
  const [report, setReport] = useState<TodayFortuneAIResult | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // 사주 계산 (URL 파라미터 or 대표 프로필)
  useEffect(() => {
    const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));
    if (hasUrlBirth) {
      const year   = parseInt(searchParams!.get('year')!);
      const month  = parseInt(searchParams!.get('month')!);
      const day    = parseInt(searchParams!.get('day')!);
      const hour   = parseInt(searchParams!.get('hour') || '12');
      const minute = parseInt(searchParams!.get('minute') || '0');
      const gender = (searchParams!.get('gender') || 'male') as 'male' | 'female';
      const unknownTime = searchParams!.get('unknownTime') === 'true';
      setResult(calculateSaju(year, month, day, hour, minute, gender, unknownTime));
    } else if (primary) {
      setResult(computeSajuFromProfile(primary));
    }
  }, [searchParams, primary]);

  // 사주 계산 되면 AI 호출
  useEffect(() => {
    if (!result || report || reportLoading) return;
    let cancelled = false;
    setReportLoading(true);
    getTodayFortuneReport(result)
      .then(r => { if (!cancelled) setReport(r); })
      .finally(() => { if (!cancelled) setReportLoading(false); });
    return () => { cancelled = true; };
  }, [result]);

  // ── 로딩·빈 상태 ───────────────────────────────────────────
  if (!result) {
    const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));
    const profileStoreReady = hydrated && lastFetchedAt !== null && !profilesLoading;

    if (!hasUrlBirth && !profileStoreReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    if (!hasUrlBirth && !primary) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
          <p className="text-text-secondary">대표 프로필이 없어요</p>
          <button
            onClick={() => router.push('/saju/input')}
            className="px-5 py-2.5 rounded-xl bg-cta text-white text-sm font-semibold"
          >
            생년월일 입력
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

  // ── AI 분석중 로딩 스크린 ──────────────────────────────────
  if (reportLoading) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 gap-6">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-center"
        >
          <div
            className="text-[28px] mb-3 tracking-widest"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {result.pillars.day.gan}{result.pillars.day.zhi}일주
          </div>
          <div className="text-[13px] text-text-tertiary mb-4">{dateStr}</div>
          <div className="text-[16px] font-semibold text-text-primary mb-1">
            오늘의 기운 분석중
          </div>
          <div className="text-[12px] text-text-tertiary">
            일진과 원국의 흐름을 읽고 있습니다
          </div>
        </motion.div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cta"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── 일진 표시용 ────────────────────────────────────────────
  const todayGz = report?.todayGz;
  const todayDateStr = (() => {
    const iso = report?.isoDate ?? new Date().toISOString().slice(0, 10);
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  })();

  // ── 메인 결과 화면 ─────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 pt-4 pb-12"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary"
          aria-label="뒤로"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          오늘의 운세
        </h1>
        <div className="w-9" />
      </div>

      {/* 일진 헤더 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl px-5 py-4 mb-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-text-tertiary mb-1">{todayDateStr}</div>
            <div className="text-[13px] font-semibold text-text-secondary">
              내 일주: <span className="text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
                {result.pillars.day.gan}{result.pillars.day.zhi}
              </span>
            </div>
          </div>
          {todayGz && (
            <div className="text-right">
              <div className="text-[11px] text-text-tertiary mb-0.5">오늘 일진</div>
              <div
                className="text-[26px] font-bold text-text-primary leading-none"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {todayGz.hanja}
              </div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {todayGz.ganElement}·{todayGz.zhiElement}
                {todayGz.tenGodGan ? ` · ${todayGz.tenGodGan}` : ''}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 에러 */}
      {report?.error && (
        <div className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <p className="text-[12px] text-text-secondary">{report.error}</p>
        </div>
      )}

      {/* rawText fallback */}
      {report?.rawText && (
        <div className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">
            {report.rawText}
          </p>
        </div>
      )}

      {/* 5섹션 카드 */}
      {report?.sections && (
        <div className="space-y-2">
          {TODAY_SECTION_KEYS.map((key, idx) => {
            const text = report.sections?.[key];
            if (!text) return null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 * idx }}
                className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
              >
                <div className="text-[13px] font-bold text-text-primary mb-2">
                  {TODAY_SECTION_LABELS[key]}
                </div>
                <p className="text-[13px] text-text-secondary leading-relaxed whitespace-pre-line">
                  {text}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
