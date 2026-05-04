/**
 * Restore Report Modal — 풀이 페이지 진입 시 이전 결과 발견되면 사용자 선택
 *
 * cached.data 가 있으면 자동 silent restore 대신 모달로 명시 선택을 받는다.
 * - 기존 결과 보기 → 캐시 그대로 노출, 추가 차감 X
 * - 새로 풀이 받기 → 캐시 무효화 + API 재호출 (추가 차감 발생)
 */

'use client';

import React from 'react';

interface RestoreReportModalProps {
  open: boolean;
  /** 페이지 이름 — "신년운세", "정통사주" 등. 모달 본문에 자연스럽게 끼워 넣음. */
  title?: string;
  /** 새로 풀이 받기 버튼에 비용 안내 (선택) — 예: "☀️ 100 추가 소모" */
  refreshCostHint?: string;
  onUseCached: () => void;
  onRefresh: () => void;
  onClose?: () => void;
}

export const RestoreReportModal: React.FC<RestoreReportModalProps> = ({
  open,
  title,
  refreshCostHint,
  onUseCached,
  onRefresh,
  onClose,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-[400px] rounded-2xl bg-[rgba(20,12,38,0.96)] border border-[var(--border-subtle)] p-6 text-center shadow-2xl">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <h3 className="text-[17px] font-bold text-text-primary mb-2">
          이전 풀이가 있어요
        </h3>
        <p className="text-[14px] text-text-secondary leading-relaxed mb-5">
          같은 정보로 본 {title ?? '풀이'} 결과가 남아있어요.<br />
          기존 결과를 보시거나 새로 풀이를 받을 수 있어요.
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onUseCached}
            className="block w-full h-12 rounded-lg bg-gradient-to-r from-cta to-cta-active text-white font-bold text-[15px] hover:opacity-90 transition-all"
          >
            기존 결과 보기
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="block w-full h-12 rounded-lg border border-cta/40 text-cta font-semibold text-[15px] hover:bg-cta/10 transition-all"
          >
            새로 풀이 받기
            {refreshCostHint && (
              <span className="block text-[12px] font-normal text-text-tertiary mt-0.5">
                {refreshCostHint}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
