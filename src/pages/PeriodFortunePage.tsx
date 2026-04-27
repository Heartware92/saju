'use client';

/**
 * 기간 운세 공통 결과 페이지
 * - scope: 'year' | 'day' | 'date'
 *   · year  → /saju/newyear?year=2026
 *   · day   → /saju/today
 *   · date  → /saju/date?date=YYYY-MM-DD  (+ 달력 피커)
 *
 * 사주 원국은 URL query 또는 대표 프로필에서 가져와 계산한다.
 */

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProfileStore } from '../store/useProfileStore';
import { useUserStore } from '../store/useUserStore';
import { useCreditStore } from '../store/useCreditStore';
import { useReportCacheStore, sajuKey } from '../store/useReportCacheStore';
import { sajuDB } from '../services/supabase';
import { parseNewyearReport } from '../services/fortuneService';
import { SUN_COST_BIG, CHARGE_REASONS } from '../constants/creditCosts';
import { computeSajuFromProfile } from '../utils/profileSaju';
import { calculateSaju } from '../utils/sajuCalculator';
import { calculatePeriodFortune, type FortuneScope, type FortuneGrade, type PeriodFortune } from '../engine/periodFortune';
import { getPeriodDomainsDescription, getNewyearReport, type NewyearReportAIResult } from '../services/fortuneService';
import { NEWYEAR_SECTION_KEYS, NEWYEAR_SECTION_LABELS } from '../constants/prompts';
import { AILoadingBar } from '../components/AILoadingBar';
import { LuckyVisualCard, ELEMENT_LUCKY } from '../components/saju/LuckyVisualCard';
import { TermChip } from '../components/ui/TermChip';

const NEWYEAR_MESSAGES = [
  '세운과 원국의 합충을 분석하는 중입니다',
  '재물·직업·애정 기운을 읽는 중입니다',
  '월별 흐름과 대운 맥락을 종합하는 중입니다',
  '신년 전체 운세를 정리하는 중입니다',
];

const GRADE_COLOR: Record<FortuneGrade, string> = {
  '대길': '#34D399',
  '길': '#86EFAC',
  '중길': '#FBBF24',
  '평': '#CBD5E1',
  '중흉': '#FB923C',
  '흉': '#F87171',
};

function ScoreRing({ score, grade }: { score: number; grade: FortuneGrade }) {
  const c = GRADE_COLOR[grade];
  const r = 48, C = 2 * Math.PI * r;
  const offset = C * (1 - score / 100);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke={c} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="middle"
            fontSize="28" fontWeight="bold" fill="white">{score}</text>
      <text x="60" y="82" textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill="rgba(255,255,255,0.6)">점 · {grade}</text>
    </svg>
  );
}

function DomainBar({ label, score, grade }: { label: string; score: number; grade: FortuneGrade }) {
  const c = GRADE_COLOR[grade];
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 shrink-0 text-[14px] font-semibold text-text-secondary whitespace-nowrap">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: c }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="w-8 text-right text-[14px] font-bold" style={{ color: c }}>{score}</div>
    </div>
  );
}

function CalendarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [] as (number | null)[];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (d: number) => {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return iso === value;
  };

  const pick = (d: number) => {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    onChange(iso);
  };

  return (
    <div className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-lg text-text-secondary hover:bg-white/5"
        >‹</button>
        <span className="text-[16px] font-bold text-text-primary">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-lg text-text-secondary hover:bg-white/5"
        >›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[13px] text-text-tertiary mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => d && pick(d)}
            className={`aspect-square rounded-lg text-[14px] font-medium
              ${!d ? 'opacity-0' : ''}
              ${d && isSelected(d) ? 'bg-cta text-white' : 'text-text-primary hover:bg-white/5'}`}
          >
            {d ?? ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PeriodFortunePage({ scope }: { scope: FortuneScope | 'date' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams?.get('recordId') ?? null;
  const isArchiveMode = !!recordId;
  const { user } = useUserStore();
  const { profiles, fetchProfiles, hydrated, loading: profilesLoading, lastFetchedAt } = useProfileStore();

  useEffect(() => { if (user) fetchProfiles(); }, [user, fetchProfiles]);

  const primary = useMemo(() => profiles.find(p => p.is_primary) ?? null, [profiles]);

  const today = new Date().toISOString().slice(0, 10);
  const initialDate = searchParams?.get('date') || today;
  const [pickedDate, setPickedDate] = useState(initialDate);

  const targetYear = (() => {
    const y = searchParams?.get('year');
    if (y) return parseInt(y, 10);
    return new Date().getFullYear();
  })();

  // 계산 — URL에 간지 원국이 들어오면 그것 사용, 아니면 대표 프로필
  const saju = useMemo(() => {
    // URL 쿼리로 birth 정보가 들어왔을 경우
    const q = searchParams;
    if (q?.get('year') && q?.get('month') && q?.get('day')) {
      try {
        return calculateSaju(
          parseInt(q.get('year')!, 10),
          parseInt(q.get('month')!, 10),
          parseInt(q.get('day')!, 10),
          parseInt(q.get('hour') || '12', 10),
          parseInt(q.get('minute') || '0', 10),
          (q.get('gender') || 'male') as 'male' | 'female',
          q.get('unknownTime') === 'true',
        );
      } catch {
        return null;
      }
    }
    return primary ? computeSajuFromProfile(primary) : null;
  }, [searchParams, primary, scope]);

  const fortune: PeriodFortune | null = useMemo(() => {
    if (!saju) return null;
    const realScope: FortuneScope = scope === 'date' ? 'day' : scope;
    try {
      return calculatePeriodFortune(saju, {
        scope: realScope,
        date: scope === 'day' ? today : scope === 'date' ? pickedDate : undefined,
        year: scope === 'year' ? targetYear : undefined,
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [saju, scope, pickedDate, today, targetYear]);

  const pageTitle =
    scope === 'year' ? `${targetYear} 신년운세`
    : scope === 'day' ? '오늘의 운세'
    : '지정일 운세';

  // 영역별 AI 상세 설명 (5문장)
  const [domainAI, setDomainAI] = useState<Partial<Record<'wealth' | 'career' | 'love' | 'health' | 'study', string>>>({});
  const [domainAILoading, setDomainAILoading] = useState(false);

  // 신년운세 종합 리포트 (scope='year'에서만 사용)
  const [newyearReport, setNewyearReport] = useState<NewyearReportAIResult | null>(null);
  const [newyearReportLoading, setNewyearReportLoading] = useState(false);
  const chargeForContent = useCreditStore(s => s.chargeForContent);

  // ── 보관함 재생 모드 — recordId 가 있으면 DB에서 풀이 복원, AI 호출 skip ──
  // (scope='year'·newyear 만 archive 저장됨. day/date 는 도메인 chunk 라 archive 미대상)
  useEffect(() => {
    if (!recordId || scope !== 'year') return;
    let cancelled = false;
    setNewyearReportLoading(true);
    sajuDB.getRecordById(recordId)
      .then((record) => {
        if (cancelled || !record) return;
        const content = record.interpretation_detailed ?? record.interpretation_basic ?? '';
        const sections = parseNewyearReport(content);
        setNewyearReport(
          Object.keys(sections).length > 0
            ? { success: true, sections }
            : { success: true, rawText: content },
        );
      })
      .catch((e) => {
        console.error('[archive replay] newyear load failed', e);
        if (!cancelled) setNewyearReport({ success: false, error: '보관된 풀이를 불러오지 못했어요.' });
      })
      .finally(() => { if (!cancelled) setNewyearReportLoading(false); });
    return () => { cancelled = true; };
  }, [recordId, scope]);

  // 기간/대상 바뀔 때마다 초기화 + AI 호출 — 캐시 우선
  // 보관함 재생 모드에선 절대 AI 호출 금지
  useEffect(() => {
    if (isArchiveMode) return;
    if (!saju || !fortune) return;
    let cancelled = false;
    const sk = sajuKey(saju);

    // scope=year: 신년운세 종합 리포트 호출 (도메인 상세는 패스)
    // 정상 응답 캐시 X (홈 진입 = 새 풀이). 실패만 1분 negative cache.
    if (scope === 'year') {
      const cacheKey = `${sk}:${targetYear}`;
      const cached = useReportCacheStore.getState().getReport<NewyearReportAIResult>('newyear', cacheKey);
      if (cached?.error) {
        setNewyearReport({ success: false, error: cached.error });
        setNewyearReportLoading(false);
        return;
      }

      setNewyearReport(null);
      setNewyearReportLoading(true);
      getNewyearReport(saju, fortune, targetYear)
        .then(r => {
          if (cancelled) return;
          setNewyearReport(r);
          const cache = useReportCacheStore.getState();
          if (r.success) {
            if (!cache.isCharged('newyear', cacheKey)) {
              cache.markCharged('newyear', cacheKey);
              chargeForContent('sun', SUN_COST_BIG, CHARGE_REASONS.newyear).catch(() => {});
            }
          } else if (r.error) {
            cache.setError('newyear', cacheKey, r.error);
          }
        })
        .catch((err: any) => {
          if (cancelled) return;
          useReportCacheStore.getState().setError('newyear', cacheKey, err?.message || '오류가 발생했어요.');
        })
        .finally(() => { if (!cancelled) setNewyearReportLoading(false); });
      return () => { cancelled = true; };
    }

    // scope=day/date: 영역별 5문장 상세 — 정상 캐시 X, 실패만 1분 차단
    const kind = scope === 'day' ? 'period_day' : 'period_date';
    const targetDate = scope === 'day' ? today : pickedDate;
    const cacheKey = `${sk}:${targetDate}`;
    const cached = useReportCacheStore.getState().getReport<Partial<Record<'wealth' | 'career' | 'love' | 'health' | 'study', string>>>(kind, cacheKey);
    if (cached?.error) {
      // 도메인 AI 실패는 페이지 자체 에러 state 가 없어 console 만 남김 — 1분간 자동 재호출 차단
      console.warn('[period] cached error', cached.error);
      setDomainAI({});
      setDomainAILoading(false);
      return;
    }

    setDomainAI({});
    setDomainAILoading(true);

    const scopeLabel =
      scope === 'day' ? `오늘(${today})`
      : `${pickedDate} 지정일`;

    const domainsBrief = fortune.domains
      .filter(d => d.key !== 'overall')
      .map(d => ({
        key: d.key as 'wealth' | 'career' | 'love' | 'health' | 'study',
        label: d.label,
        score: d.score,
        grade: d.grade,
      }));

    getPeriodDomainsDescription(saju, {
      scopeLabel,
      targetGanZhi: fortune.targetGanZhi.ganZhi,
      overallHeadline: fortune.headline,
      domains: domainsBrief,
    })
      .then(r => {
        if (cancelled) return;
        const cache = useReportCacheStore.getState();
        if (r.success && r.descriptions) {
          setDomainAI(r.descriptions);
          const reason = scope === 'day' ? CHARGE_REASONS.today : CHARGE_REASONS.date;
          if (!cache.isCharged(kind, cacheKey)) {
            cache.markCharged(kind, cacheKey);
            chargeForContent('sun', SUN_COST_BIG, reason).catch(() => {});
          }
        } else if (r.error) {
          cache.setError(kind, cacheKey, r.error);
        }
      })
      .catch((err: any) => {
        if (cancelled) return;
        useReportCacheStore.getState().setError(kind, cacheKey, err?.message || '오류가 발생했어요.');
      })
      .finally(() => {
        if (!cancelled) setDomainAILoading(false);
      });

    return () => { cancelled = true; };
  }, [saju, fortune, scope, pickedDate, targetYear, today, chargeForContent, isArchiveMode]);

  if (!primary && !searchParams?.get('year')) {
    const profileStoreReady = hydrated && lastFetchedAt !== null && !profilesLoading;
    if (!profileStoreReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="text-text-secondary mb-4">대표 프로필이 없어요</p>
        <button
          onClick={() => router.push('/saju/input')}
          className="px-5 py-2.5 rounded-xl bg-cta text-white text-sm font-semibold"
        >
          생년월일 입력
        </button>
      </div>
    );
  }

  if (!saju || !fortune) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 신년운세: 리포트 응답 오기 전까지 전체 로딩 화면
  if (scope === 'year' && newyearReportLoading) {
    return (
      <AILoadingBar
        label={`${targetYear}년 신년운세 풀이중`}
        minLabel="20초"
        maxLabel="1분"
        estimatedSeconds={40}
        messages={NEWYEAR_MESSAGES}
        topContent={
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="text-[32px] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
              {fortune.targetGanZhi.ganZhi}년
            </div>
          </motion.div>
        }
      />
    );
  }

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
          aria-label="뒤로"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
          {pageTitle}
        </h1>
        <div className="w-9" />
      </div>

      {/* 지정일 — 달력 */}
      {scope === 'date' && (
        <div className="mb-4">
          <CalendarPicker value={pickedDate} onChange={setPickedDate} />
        </div>
      )}

      {/* 요약 카드 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 mb-3 bg-[rgba(20,12,38,0.6)] border border-[var(--border-subtle)]"
      >
        <div className="flex items-center gap-4">
          <ScoreRing score={fortune.overallScore} grade={fortune.overallGrade} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-text-tertiary mb-1">{fortune.lunarLabel}</div>
            <div className="text-[16px] font-bold text-text-primary leading-snug mb-1.5 break-keep">
              {fortune.headline}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <TermChip term={fortune.targetGanZhi.ganZhi} />
              <TermChip term={fortune.targetGanZhi.tenGodGan} />
              <TermChip term={fortune.overallGrade} asGrade />
            </div>
          </div>
        </div>
        <p className="text-[15px] text-text-secondary mt-3 leading-relaxed break-keep">
          {fortune.summary}
        </p>
      </motion.section>

      {/* 영역별 점수 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
      >
        <div className="text-[15px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">영역별 운세</div>
        <div className="space-y-2.5">
          {fortune.domains.filter(d => d.key !== 'overall').map(d => (
            <DomainBar key={d.key} label={d.label} score={d.score} grade={d.grade} />
          ))}
        </div>
      </motion.section>

      {/* 영역별 상세 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-2 mb-3"
      >
        {fortune.domains.filter(d => d.key !== 'overall').map(d => {
          const aiText = domainAI[d.key as 'wealth' | 'career' | 'love' | 'health' | 'study'];
          return (
            <div
              key={d.key}
              className="rounded-xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[15px] font-bold text-text-primary">{d.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold" style={{ color: GRADE_COLOR[d.grade] }}>{d.score}점</span>
                  <TermChip term={d.grade} asGrade />
                </div>
              </div>
              {aiText ? (
                <p className="text-[14px] text-text-secondary leading-relaxed mb-2 whitespace-pre-line">{aiText}</p>
              ) : domainAILoading ? (
                <div className="mb-2 space-y-1.5">
                  <div className="h-2 rounded bg-white/5 animate-pulse" />
                  <div className="h-2 rounded bg-white/5 animate-pulse w-[90%]" />
                  <div className="h-2 rounded bg-white/5 animate-pulse w-[75%]" />
                  <div className="h-2 rounded bg-white/5 animate-pulse w-[85%]" />
                  <div className="h-2 rounded bg-white/5 animate-pulse w-[60%]" />
                </div>
              ) : (
                <p className="text-[14px] text-text-secondary leading-relaxed mb-2">{d.summary}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {d.tips.map((t, i) => (
                  <span
                    key={i}
                    className="text-[13px] px-2 py-1 rounded-md border"
                    style={{ borderColor: `${GRADE_COLOR[d.grade]}55`, color: GRADE_COLOR[d.grade], backgroundColor: `${GRADE_COLOR[d.grade]}12` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </motion.section>

      {/* 행운 메타 — 비주얼 카드 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
      >
        <div className="text-[15px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">
          {scope === 'year' ? '연간 행운 처방' : '오늘의 행운'}
        </div>
        {(() => {
          const luckyEl = saju.yongSinElement ?? '목';
          const el = ELEMENT_LUCKY[luckyEl] ?? ELEMENT_LUCKY['목'];
          return (
            <LuckyVisualCard
              colors={fortune.luckyColors.length >= 2 ? fortune.luckyColors : el.colors}
              colorCss={fortune.luckyColors.length >= 2 ? undefined : el.colorCss}
              numbers={fortune.luckyNumbers.length > 0 ? fortune.luckyNumbers : el.numbers}
              direction={fortune.luckyDirection || el.direction}
              timeSlot={fortune.luckyTime || el.timeSlot}
              gem={el.gem}
              activity={el.activity}
            />
          );
        })()}
      </motion.section>

      {/* 상호작용 */}
      {fortune.interactions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
        >
          <div className="text-[15px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">원국과의 상호작용</div>
          <div className="space-y-2">
            {fortune.interactions.map((it, i) => {
              const color = it.nature === 'good' ? '#34D399' : it.nature === 'bad' ? '#F87171' : '#FBBF24';
              return (
                <div key={i} className="rounded-lg p-2.5 border" style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[14px] font-bold" style={{ color }}>{it.kind}</span>
                    <span className="text-[13px] text-text-tertiary">{it.between}</span>
                  </div>
                  <div className="text-[14px] text-text-secondary">{it.description}</div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* 주의점 */}
      {fortune.cautions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
        >
          <div className="text-[15px] font-semibold text-text-secondary mb-2 px-1 uppercase tracking-wider">주의점</div>
          <ul className="space-y-1">
            {fortune.cautions.map((c, i) => (
              <li key={i} className="text-[14px] text-text-secondary flex gap-2">
                <span className="text-[#F87171]">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* 월별 흐름 (신년운세 전용) */}
      {fortune.monthlyFlow && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
        >
          <div className="text-[15px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">월별 흐름 (12개월)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {fortune.monthlyFlow.map(m => (
              <div
                key={m.month}
                className="rounded-lg p-2 border flex flex-col items-center gap-0.5"
                style={{ borderColor: `${GRADE_COLOR[m.grade]}55`, backgroundColor: `${GRADE_COLOR[m.grade]}10` }}
              >
                <span className="text-[13px] text-text-tertiary">{m.month}월</span>
                <span className="text-[14px] font-bold" style={{ color: GRADE_COLOR[m.grade] }}>{m.grade}</span>
                <span className="text-[12px] text-text-secondary">{m.keyword}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 신년운세 종합 리포트 (scope=year 전용 — 로딩 완료 후 표시) */}
      {scope === 'year' && !newyearReportLoading && newyearReport && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-3"
        >
          <div className="text-[15px] font-semibold text-text-secondary mb-2 px-1 uppercase tracking-wider">
            {targetYear}년 종합 리포트
          </div>

          {newyearReport.error && (
            <div className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
              <p className="text-[14px] text-text-secondary">{newyearReport.error}</p>
            </div>
          )}

          {newyearReport.rawText && (
            <div className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
              <p className="text-[15px] text-text-secondary leading-relaxed whitespace-pre-line">
                {newyearReport.rawText}
              </p>
            </div>
          )}

          {newyearReport.sections && (
            <div className="space-y-2">
              {NEWYEAR_SECTION_KEYS.map((key, idx) => {
                const text = newyearReport.sections?.[key];
                if (!text) return null;
                const isLucky = key === 'lucky';
                const luckyEl = saju.yongSinElement ?? '목';
                const el = ELEMENT_LUCKY[luckyEl] ?? ELEMENT_LUCKY['목'];

                // 첫 줄 = 은유 제목, 나머지 = 본문 — 정통사주와 동일 포맷
                const lines = text.trim().split('\n');
                const metaphorTitle = lines[0]?.trim() ?? '';
                const bodyText = lines.slice(1).join('\n').trim();

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * idx }}
                    className="rounded-2xl p-5 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
                  >
                    {/* 섹션 라벨 — 상단에 크게 강조 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block w-1 h-5 rounded-full bg-cta" />
                      <div
                        className="text-[17px] font-bold text-text-primary tracking-tight break-keep"
                        style={{ fontFamily: 'var(--font-serif)' }}
                      >
                        {NEWYEAR_SECTION_LABELS[key]}
                      </div>
                    </div>

                    {/* 은유 제목 — 라벨 아래, 서브 톤 */}
                    <div
                      className="text-[17px] font-medium leading-snug text-cta/90 mb-4 pl-3 break-keep"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {metaphorTitle}
                    </div>

                    {isLucky ? (
                      <LuckyVisualCard
                        colors={el.colors}
                        colorCss={el.colorCss}
                        numbers={el.numbers}
                        direction={el.direction}
                        timeSlot={el.timeSlot}
                        gem={el.gem}
                        activity={el.activity}
                        extraText={bodyText}
                      />
                    ) : (
                      <p className="text-[15px] text-text-secondary leading-relaxed whitespace-pre-line break-keep">
                        {bodyText}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      )}
    </motion.div>
  );
}
