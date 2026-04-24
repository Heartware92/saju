'use client';

import { useState, useRef, useEffect } from 'react';
import { resolveTerm, GRADE_COLOR } from '../../constants/termDictionary';

interface Props {
  term: string;
  /** 등급(대길·중길·흉 등) — 색상 자동 적용. 생략하면 사전 카테고리 기반으로 판단. */
  asGrade?: boolean;
  className?: string;
}

export function TermChip({ term, asGrade, className = '' }: Props) {
  const entry = resolveTerm(term);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 등급 카테고리거나 명시적으로 asGrade면 색상 적용
  const treatAsGrade = asGrade ?? entry?.category === 'grade';
  const gradeColor = treatAsGrade ? GRADE_COLOR[term] : undefined;

  // 사전에 없는 용어 — 클릭 가능 표시 없이 평범한 칩
  if (!entry) {
    return (
      <span
        className={`text-[13px] px-2 py-0.5 rounded-md bg-white/5 text-text-secondary break-keep ${className}`}
      >
        {term}
      </span>
    );
  }

  const chipStyle = gradeColor
    ? { backgroundColor: `${gradeColor}22`, color: gradeColor }
    : undefined;

  const chipClass = gradeColor
    ? `text-[13px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity break-keep ${className}`
    : `text-[13px] px-2 py-0.5 rounded-md bg-white/5 text-text-secondary inline-flex items-center gap-1 cursor-pointer hover:bg-white/10 transition-colors break-keep ${className}`;

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={chipClass}
        style={chipStyle}
        aria-expanded={open}
        aria-label={`${term} 설명 보기`}
      >
        <span>{term}</span>
        <span className="text-[10px] opacity-60" aria-hidden="true">ⓘ</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute z-50 top-full mt-1.5 left-0 w-64 max-w-[calc(100vw-2rem)] rounded-xl p-3 bg-[rgba(20,12,38,0.98)] border border-white/10 shadow-2xl backdrop-blur-sm"
        >
          <div className="text-[13px] font-bold text-text-primary mb-0.5 break-keep">
            {entry.term}
          </div>
          <div className="text-[12px] text-cta mb-1.5 break-keep">
            {entry.short}
          </div>
          <div className="text-[12px] text-text-secondary leading-relaxed break-keep">
            {entry.description}
          </div>
        </div>
      )}
    </div>
  );
}
