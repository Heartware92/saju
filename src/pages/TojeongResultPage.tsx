'use client';

/**
 * 토정비결 결과 페이지 (전체 무료 · 결정론적 풀이)
 * URL: /saju/tojeong?year=1990&month=1&day=1&calendarType=solar&...&targetYear=2026
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { calculateTojeong, type TojeongResult } from '../engine/tojeong';
import { buildTojeongReading, type TojeongReading } from '../engine/tojeong/reading';
import type { GwaeGrade } from '../engine/tojeong/gwae-table';

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

  const { tojeong, reading } = useMemo(() => {
    if (!searchParams) return { tojeong: null, reading: null };
    const year = parseInt(searchParams.get('year') || '1990');
    const month = parseInt(searchParams.get('month') || '1');
    const day = parseInt(searchParams.get('day') || '1');
    const calendarType = (searchParams.get('calendarType') || 'solar') as 'solar' | 'lunar';
    const targetYear = parseInt(searchParams.get('targetYear') || String(new Date().getFullYear()));
    try {
      const t = calculateTojeong(year, month, day, calendarType, targetYear);
      const r = buildTojeongReading(t);
      return { tojeong: t, reading: r };
    } catch {
      return { tojeong: null, reading: null };
    }
  }, [searchParams]);

  if (!tojeong || !reading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cta border-t-transparent rounded-full animate-spin" />
      </div>
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

      <p className="text-center text-[12px] text-text-tertiary mb-3">
        세는 나이 {tojeong.age}세 · {tojeong.yearGanZhi.ganZhi}년
      </p>

      {/* 괘 번호 */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-6 mb-3 text-center"
        style={{ backgroundColor: `${gradeColor}12`, border: `1px solid ${gradeColor}55` }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">올해의 괘</div>
        <div className="text-5xl font-bold mb-2" style={{ color: gradeColor, fontFamily: 'var(--font-serif)' }}>
          {tojeong.gwaeNumber}
        </div>
        <div className="text-[14px] font-semibold mb-1" style={{ color: gradeColor }}>{reading.grade}</div>
        <div className="text-[13px] text-text-secondary">{reading.headline}</div>
      </motion.section>

      {/* 괘 구성 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">괘 풀이</div>

        <div className="space-y-2">
          <div className="rounded-lg p-3 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-text-tertiary">상괘</span>
              <span className="text-2xl">{tojeong.upperGwae.symbol}</span>
              <span className="text-[13px] font-bold text-text-primary">
                {tojeong.upperGwae.name}({tojeong.upperGwae.hanja})
              </span>
              <span className="text-[11px] text-text-tertiary">· {tojeong.upperGwae.element}</span>
            </div>
            <div className="text-[12px] text-text-secondary">{tojeong.upperGwae.meaning}</div>
            <div className="text-[10px] text-text-tertiary mt-1">{tojeong.formula.upper}</div>
          </div>

          <div className="rounded-lg p-3 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-text-tertiary">중괘</span>
              <span className="text-[13px] font-bold text-text-primary">{tojeong.middleGwae.position}</span>
            </div>
            <div className="text-[12px] text-text-secondary">{tojeong.middleGwae.meaning}</div>
            <div className="text-[10px] text-text-tertiary mt-1">{tojeong.formula.middle}</div>
          </div>

          <div className="rounded-lg p-3 bg-white/5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-text-tertiary">하괘</span>
              <span className="text-[13px] font-bold text-text-primary">{tojeong.lowerGwae.name}</span>
            </div>
            <div className="text-[12px] text-text-secondary">{tojeong.lowerGwae.meaning}</div>
            <div className="text-[10px] text-text-tertiary mt-1">{tojeong.formula.lower}</div>
          </div>
        </div>
      </section>

      {/* 키워드 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">키워드</div>
        <div className="flex flex-wrap gap-1.5">
          {reading.entry.keywords.map((k, i) => (
            <span
              key={i}
              className="text-[12px] px-2.5 py-1 rounded-md border"
              style={{ borderColor: `${gradeColor}55`, color: gradeColor, backgroundColor: `${gradeColor}12` }}
            >
              {k}
            </span>
          ))}
        </div>
      </section>

      {/* 총평 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">올해 총평</div>
        <div className="space-y-3">
          {reading.paragraphs.map((p, i) => (
            <p key={i} className="text-[13px] text-text-secondary leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      {/* 월별 흐름 */}
      <section className="rounded-2xl p-4 mb-3 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
        <div className="text-[13px] font-semibold text-text-secondary mb-3 uppercase tracking-wider">월별 흐름</div>
        <div className="space-y-1.5">
          {reading.monthly.map(m => (
            <div key={m.month} className="rounded-lg p-2.5 bg-white/5 flex gap-3">
              <div className="w-10 shrink-0 text-center">
                <div className="text-[13px] font-bold text-text-primary">{m.month}월</div>
                <div className="text-[10px] text-text-tertiary mt-0.5">{m.keyword.split('·')[0]}</div>
              </div>
              <div className="flex-1 text-[12px] text-text-secondary leading-relaxed">
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 조언·주의 */}
      <div className="grid grid-cols-1 gap-3">
        <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <div className="text-[13px] font-semibold mb-2" style={{ color: '#34D399' }}>올해의 조언</div>
          <ul className="space-y-1.5">
            {reading.advice.map((a, i) => (
              <li key={i} className="text-[12px] text-text-secondary flex gap-2">
                <span style={{ color: '#34D399' }}>✓</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl p-4 bg-[rgba(20,12,38,0.55)] border border-[var(--border-subtle)]">
          <div className="text-[13px] font-semibold mb-2" style={{ color: '#F87171' }}>주의할 점</div>
          <ul className="space-y-1.5">
            {reading.warnings.map((w, i) => (
              <li key={i} className="text-[12px] text-text-secondary flex gap-2">
                <span style={{ color: '#F87171' }}>!</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </motion.div>
  );
}
