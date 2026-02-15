/**
 * 크레딧 잔액 표시 위젯
 */

import React from 'react';
import { useCreditStore } from '../../../store/useCreditStore';
import { useNavigate } from 'react-router-dom';

interface CreditBalanceProps {
  showAddButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CreditBalance: React.FC<CreditBalanceProps> = ({
  showAddButton = true,
  size = 'md'
}) => {
  const { balance } = useCreditStore();
  const navigate = useNavigate();

  const sizeConfig = {
    sm: { coin: 20, text: '0.95rem', padding: '0.4rem 0.75rem', gap: '0.4rem' },
    md: { coin: 24, text: '1rem', padding: '0.5rem 1rem', gap: '0.5rem' },
    lg: { coin: 32, text: '1.25rem', padding: '0.6rem 1.25rem', gap: '0.6rem' }
  };

  const config = sizeConfig[size];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* 잔액 표시 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: config.gap,
          padding: config.padding,
          background: 'linear-gradient(135deg, #F5E6D3 0%, #E8D4B8 100%)',
          borderRadius: '0.5rem',
          border: '1.5px solid rgba(139, 69, 19, 0.2)'
        }}
      >
        <img
          src="/coin.png"
          alt="엽전"
          style={{ width: config.coin, height: config.coin }}
        />
        <span style={{ fontSize: config.text, fontWeight: '700', color: '#8B4513' }}>
          {balance}엽전
        </span>
      </div>

      {/* 충전 버튼 */}
      {showAddButton && (
        <button
          onClick={() => navigate('/credit')}
          style={{
            padding: config.padding,
            fontSize: config.text,
            fontWeight: '600',
            color: '#8B4513',
            background: 'linear-gradient(135deg, #E8D4B8 0%, #DEC5A5 100%)',
            border: '1.5px solid rgba(139, 69, 19, 0.25)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          충전하기
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
  description?: string;
}

export const CreditRequired: React.FC<CreditRequiredProps> = ({
  amount,
  description
}) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full">
      <img src="/coin.png" alt="엽전" style={{ width: 20, height: 20 }} />
      <span className="font-bold text-accent">{amount} 엽전</span>
      {description && (
        <span className="text-sm text-text-secondary">· {description}</span>
      )}
    </div>
  );
};
