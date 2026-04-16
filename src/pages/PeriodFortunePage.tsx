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
import { computeSajuFromProfile } from '../utils/profileSaju';
import { calculateSaju } from '../utils/sajuCalculator';
import { calculatePeriodFortune, type FortuneScope, type FortuneGrade, type PeriodFortune } from '../engine/periodFortune';

const GRADE_COLOR: Record<FortuneGrade, string> = {
  '대길': '#34D399',
  '길': '#86EFAC',
  '중길': '#FBBF24',
  '평': '#CBD5E1',
  '중흉': '#FB923C',
  '흉': '#F87171',
};

function GradeBadge({ grade }: { grade: FortuneGrade }) {
  const c = GRADE_COLOR[grade];
  return (
    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: `${c}22`, color: c }}>
      {grade}
    </span>
  );
}

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
      <div className="w-14 text-[12px] font-semibold text-text-secondary">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: c }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="w-8 text-right text-[12px] font-bold" style={{ color: c }}>{score}</div>
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
        <span className="text-[14px] font-bold text-text-primary">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-lg text-text-secondary hover:bg-white/5"
        >›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-tertiary mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={!d}
            onClick={() => d && pick(d)}
            className={`aspect-square rounded-lg text-[12px] font-medium
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
  const { user } = useUserStore();
  const { profiles, fetchProfiles } = useProfileStore();

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

  if (!primary && !searchParams?.get('year')) {
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
            <div className="text-[12px] text-text-tertiary mb-1">{fortune.lunarLabel}</div>
            <div className="text-[16px] font-bold text-text-primary leading-snug mb-1.5">
              {fortune.headline}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-text-secondary">
                {fortune.targetGanZhi.ganZhi}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-text-secondary">
                {fortune.targetGanZhi.tenGodGan}
              </span>
              <GradeBadge grade={fortune.overallGrade} />
            </div>
          </div>
        </div>
        <p className="text-[13px] text-text-secondary mt-3 leading-relaxed">
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
        <div className="text-[13px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">영역별 운세</div>
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
        {fortune.domains.filter(d => d.key !== 'overall').map(d => (
          <div
            key={d.key}
            className="rounded-xl p-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-bold text-text-primary">{d.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold" style={{ color: GRADE_COLOR[d.grade] }}>{d.score}점</span>
                <GradeBadge grade={d.grade} />
              </div>
            </div>
            <p className="text-[12px] text-text-secondary leading-relaxed mb-2">{d.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {d.tips.map((t, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-1 rounded-md border"
                  style={{ borderColor: `${GRADE_COLOR[d.grade]}55`, color: GRADE_COLOR[d.grade], backgroundColor: `${GRADE_COLOR[d.grade]}12` }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </motion.section>

      {/* 행운 메타 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
      >
        <div className="text-[13px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">오늘의 행운</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5 bg-white/5">
            <div className="text-[11px] text-text-tertiary mb-0.5">색상</div>
            <div className="text-[13px] font-semibold text-text-primary">{fortune.luckyColors.join(' · ')}</div>
          </div>
          <div className="rounded-lg p-2.5 bg-white/5">
            <div className="text-[11px] text-text-tertiary mb-0.5">숫자</div>
            <div className="text-[13px] font-semibold text-text-primary">{fortune.luckyNumbers.join(' · ')}</div>
          </div>
          <div className="rounded-lg p-2.5 bg-white/5">
            <div className="text-[11px] text-text-tertiary mb-0.5">방위</div>
            <div className="text-[13px] font-semibold text-text-primary">{fortune.luckyDirection}</div>
          </div>
          <div className="rounded-lg p-2.5 bg-white/5">
            <div className="text-[11px] text-text-tertiary mb-0.5">시간대</div>
            <div className="text-[13px] font-semibold text-text-primary">{fortune.luckyTime}</div>
          </div>
        </div>
      </motion.section>

      {/* 상호작용 */}
      {fortune.interactions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]"
        >
          <div className="text-[13px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">원국과의 상호작용</div>
          <div className="space-y-2">
            {fortune.interactions.map((it, i) => {
              const color = it.nature === 'good' ? '#34D399' : it.nature === 'bad' ? '#F87171' : '#FBBF24';
              return (
                <div key={i} className="rounded-lg p-2.5 border" style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] font-bold" style={{ color }}>{it.kind}</span>
                    <span className="text-[11px] text-text-tertiary">{it.between}</span>
                  </div>
                  <div className="text-[12px] text-text-secondary">{it.description}</div>
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
          <div className="text-[13px] font-semibold text-text-secondary mb-2 px-1 uppercase tracking-wider">주의점</div>
          <ul className="space-y-1">
            {fortune.cautions.map((c, i) => (
              <li key={i} className="text-[12px] text-text-secondary flex gap-2">
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
          <div className="text-[13px] font-semibold text-text-secondary mb-3 px-1 uppercase tracking-wider">월별 흐름 (12개월)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {fortune.monthlyFlow.map(m => (
              <div
                key={m.month}
                className="rounded-lg p-2 border flex flex-col items-center gap-0.5"
                style={{ borderColor: `${GRADE_COLOR[m.grade]}55`, backgroundColor: `${GRADE_COLOR[m.grade]}10` }}
              >
                <span className="text-[11px] text-text-tertiary">{m.month}월</span>
                <span className="text-[12px] font-bold" style={{ color: GRADE_COLOR[m.grade] }}>{m.grade}</span>
                <span className="text-[10px] text-text-secondary">{m.keyword}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
