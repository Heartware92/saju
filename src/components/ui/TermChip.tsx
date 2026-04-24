'use client';

import { useState } from 'react';
import { resolveTerm, GRADE_COLOR } from '../../constants/termDictionary';
import { Modal } from './Modal';

interface Props {
  term: string;
  /** 등급(대길·중길·흉 등) — 색상 자동 적용. 생략하면 사전 카테고리 기반으로 판단. */
  asGrade?: boolean;
  className?: string;
}

/**
 * 사주 용어 칩 — 클릭 시 설명 모달을 띄운다.
 * - 사전에 없는 용어는 클릭 불가한 일반 칩으로 렌더
 * - 등급(grade) 카테고리는 GRADE_COLOR 자동 적용
 * - 모달은 기존 Modal 컴포넌트 재사용 (모바일=바텀시트, 데스크톱=중앙 모달)
 */
export function TermChip({ term, asGrade, className = '' }: Props) {
  const entry = resolveTerm(term);
  const [open, setOpen] = useState(false);

  const treatAsGrade = asGrade ?? entry?.category === 'grade';
  const gradeColor = treatAsGrade ? GRADE_COLOR[term] : undefined;

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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={chipClass}
        style={chipStyle}
        aria-label={`${term} 설명 보기`}
      >
        <span>{term}</span>
        <span className="text-[10px] opacity-60" aria-hidden="true">ⓘ</span>
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} size="sm" title={entry.term}>
        <div className="space-y-3">
          <div
            className="text-[15px] font-semibold break-keep"
            style={{ color: gradeColor ?? 'var(--cta)' }}
          >
            {entry.short}
          </div>
          <div className="text-[14px] text-text-secondary leading-relaxed break-keep">
            {entry.description}
          </div>
        </div>
      </Modal>
    </>
  );
}
