'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lunar } from 'lunar-javascript';
import { calculateSaju, type SajuResult } from '../utils/sajuCalculator';
import { getJungtongsajuReport, type JungtongsajuAIResult } from '../services/fortuneService';
import { JUNGTONGSAJU_SECTION_KEYS, JUNGTONGSAJU_SECTION_LABELS } from '../constants/prompts';
import { useProfileStore } from '../store/useProfileStore';
import { computeSajuFromProfile } from '../utils/profileSaju';
import SajuReport from '../components/saju/SajuReport';
import { AILoadingBar } from '../components/AILoadingBar';

const JUNGTONGSAJU_MESSAGES = [
  '격국과 용신을 계산하는 중입니다',
  '오행 분포와 신강신약을 분석하는 중입니다',
  '대운·세운의 흐름을 읽는 중입니다',
  '십성 분포와 일주 특성을 해석하는 중입니다',
  '재물·직업·건강 운세를 종합하는 중입니다',
  '신살과 합충형파를 검토하는 중입니다',
];

export default function SajuResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();
  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

  const [result, setResult] = useState<SajuResult | null>(null);
  const [report, setReport] = useState<JungtongsajuAIResult | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  // 사주 계산
  useEffect(() => {
    const hasUrlBirth = !!(searchParams?.get('year') && searchParams?.get('month') && searchParams?.get('day'));

    if (hasUrlBirth) {
      const year    = parseInt(searchParams!.get('year')!);
      const month   = parseInt(searchParams!.get('month')!);
      const day     = parseInt(searchParams!.get('day')!);
      const hour    = parseInt(searchParams!.get('hour') || '12');
      const minute  = parseInt(searchParams!.get('minute') || '0');
      const gender  = (searchParams!.get('gender') || 'male') as 'male' | 'female';
      const calendarType = searchParams!.get('calendarType') || 'solar';
      const unknownTime  = searchParams!.get('unknownTime') === 'true';

      let solarYear = year, solarMonth = month, solarDay = day;
      if (calendarType === 'lunar') {
        const lunar = Lunar.fromYmdHms(year, month, day, hour, minute, 0);
        const solar = lunar.getSolar();
        solarYear  = solar.getYear();
        solarMonth = solar.getMonth();
        solarDay   = solar.getDay();
      }

      let finalY = solarYear, finalM = solarMonth, finalD = solarDay;
      let finalH = unknownTime ? 12 : hour;
      let finalMin = unknownTime ? 0 : minute;
      if (!unknownTime) {
        const dt = new Date(solarYear, solarMonth - 1, solarDay, hour, minute);
        const shifted = new Date(dt.getTime() - 30 * 60 * 1000);
        finalY   = shifted.getFullYear();
        finalM   = shifted.getMonth() + 1;
        finalD   = shifted.getDate();
        finalH   = shifted.getHours();
        finalMin = shifted.getMinutes();
      }

      setResult(calculateSaju(finalY, finalM, finalD, finalH, finalMin, gender, unknownTime));
    } else if (primary) {
      setResult(computeSajuFromProfile(primary));
    }
  }, [searchParams, primary]);

  // 결과 생기면 리포트 자동 호출
  useEffect(() => {
    if (!result || report || reportLoading) return;
    let cancelled = false;
    setReportLoading(true);
    getJungtongsajuReport(result)
      .then(r => { if (!cancelled) setReport(r); })
      .finally(() => { if (!cancelled) setReportLoading(false); });
    return () => { cancelled = true; };
  }, [result]);

  // ── 로딩 / 빈 상태 ──────────────────────────────────
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

  // ── 리포트 로딩 중 전체 화면 ──────────────────────────
  if (reportLoading) {
    return (
      <AILoadingBar
        label="정통사주 분석중"
        minLabel="30초"
        maxLabel="1분 30초"
        estimatedSeconds={70}
        messages={JUNGTONGSAJU_MESSAGES}
        topContent={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[30px] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
              {result.pillars.year.gan}{result.pillars.year.zhi}년생
            </div>
            <div className="text-[13px] text-text-tertiary">
              {result.pillars.year.gan}{result.pillars.year.zhi} {result.pillars.month.gan}{result.pillars.month.zhi} {result.pillars.day.gan}{result.pillars.day.zhi}
            </div>
          </motion.div>
        }
      />
    );
  }

  // ── 메인 결과 화면 ────────────────────────────────────
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
          정통사주
        </h1>
        <div className="w-9" />
      </div>

      {/* 시간 미상 배너 */}
      {result.hourUnknown && (
        <div className="mb-3 rounded-xl px-4 py-3 bg-amber-500/10 border border-amber-500/30 text-[12px] text-amber-300 leading-relaxed">
          출생 시간 미상 · 삼주추명(三柱推命) — 연·월·일주 기반으로 분석합니다.
          자녀운·말년운·시간대 조언은 제한적으로 제공됩니다.
        </div>
      )}

      {/* 원국 차트 */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
        <SajuReport result={result} />
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

      {/* 9섹션 카드 */}
      {report?.sections && (
        <div className="space-y-2">
          {JUNGTONGSAJU_SECTION_KEYS.map((key, idx) => {
            const text = report.sections?.[key];
            if (!text) return null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * idx }}
                className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
              >
                <div className="text-[13px] font-bold text-text-primary mb-2">
                  {JUNGTONGSAJU_SECTION_LABELS[key]}
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
