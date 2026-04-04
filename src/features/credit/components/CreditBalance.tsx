/**
 * 크레딧 잔액 표시 위젯 - 코스믹 테마
 */

'use client';

import React from 'react';
import { useCreditStore } from '../../../store/useCreditStore';
import { useRouter } from 'next/navigation';

interface CreditBalanceProps {
  showAddButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  showAddButton = true,
  size = 'md'
}) => {
  const { sunBalance, moonBalance } = useCreditStore();
  const router = useRouter();

  const sizeConfig = {
    sm: { text: '0.85rem', padding: '0.3rem 0.6rem', gap: '0.35rem' },
    md: { text: '0.95rem', padding: '0.4rem 0.8rem', gap: '0.4rem' },
    lg: { text: '1.15rem', padding: '0.5rem 1rem', gap: '0.5rem' }
  };
  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center rounded-lg bg-space-elevated/60 border border-[var(--border-subtle)]"
        style={{ gap: config.gap, padding: config.padding }}
      >
        <span style={{ fontSize: config.text }}>☀️</span>
        <span className="font-bold text-sun-core" style={{ fontSize: config.text }}>
          {sunBalance}
        </span>
      </div>
      <div
        className="flex items-center rounded-lg bg-space-elevated/60 border border-[var(--border-subtle)]"
        style={{ gap: config.gap, padding: config.padding }}
      >
        <span style={{ fontSize: config.text }}>🌙</span>
        <span className="font-bold text-moon-halo" style={{ fontSize: config.text }}>
          {moonBalance}
        </span>
      </div>

      {showAddButton && (
        <button
          onClick={() => router.push('/credit')}
          className="rounded-lg bg-cta/10 border border-cta/30 text-cta font-semibold text-sm hover:bg-cta/20 transition-colors whitespace-nowrap"
          style={{ padding: config.padding, fontSize: config.text }}
        >
          충전
        </button>
      )}
    </div>
  );
};

/**
 * 크레딧 필요 알림 (인라인)
 */
interface CreditRequiredProps {
  amount: number;
  creditType: 'sun' | 'moon';
  description?: string;
}

export const CreditRequired: React.FC<CreditRequiredProps> = ({
  amount,
  creditType,
  description
}) => {
  const icon = creditType === 'sun' ? '☀️' : '🌙';
  const label = creditType === 'sun' ? '해' : '달';
  const colorClass = creditType === 'sun' ? 'text-sun-core' : 'text-moon-halo';

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-space-elevated/60 border border-[var(--border-subtle)] rounded-full">
      <span>{icon}</span>
      <span className={`font-bold ${colorClass}`}>{amount} {label}</span>
      {description && (
        <span className="text-sm text-text-secondary">· {description}</span>
      )}
    </div>
  );
};
