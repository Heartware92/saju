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

  const sizeStyles = {
    sm: {
      container: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'text-base'
    },
    md: {
      container: 'px-4 py-2',
      text: 'text-base',
      icon: 'text-lg'
    },
    lg: {
      container: 'px-5 py-3',
      text: 'text-lg',
      icon: 'text-xl'
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 잔액 표시 - 곳간 스타일 */}
      <div
        className={`
          relative flex items-center gap-2
          bg-gradient-to-br from-secondary via-[#F5E6D3] to-[#EDD5B8]
          border-2 border-primary/30
          rounded-lg shadow-hanji
          ${sizeStyles[size].container}
          hover:shadow-hanji-lg transition-shadow duration-300
        `}
        style={{
          background: 'linear-gradient(135deg, #F5E6D3 0%, #EDD5B8 50%, #F5E6D3 100%)',
          boxShadow: '0 2px 8px rgba(139, 69, 19, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
        }}
      >
        {/* 곳간 아이콘 */}
        <div className="relative">
          <span className={`${sizeStyles[size].icon} drop-shadow-sm`}>🏛️</span>
          <span
            className="absolute -top-1 -right-1 text-[10px]"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            🪙
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className={`font-black text-primary ${sizeStyles[size].text}`}
                style={{ textShadow: '0 1px 2px rgba(139, 69, 19, 0.2)' }}>
            {balance}
          </span>
          <span className={`text-primary/70 font-bold ${sizeStyles[size === 'sm' ? 'sm' : 'md'].text}`}>
            엽전
          </span>
        </div>
      </div>

      {/* 충전 버튼 - 곳간 입구 느낌 */}
      {showAddButton && (
        <button
          onClick={() => navigate('/credit')}
          className="
            relative px-3 py-2
            bg-gradient-to-br from-accent via-[#D4A574] to-accent
            hover:from-accent-dark hover:via-[#C09560] hover:to-accent-dark
            text-white font-bold
            rounded-lg
            transition-all duration-300
            shadow-md hover:shadow-lg
            transform hover:scale-105
            border border-accent-dark/30
          "
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
          aria-label="엽전 충전"
        >
          <span className="text-sm whitespace-nowrap">곳간 충전</span>
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
      <span className="text-lg">🪙</span>
      <span className="font-bold text-accent">{amount} 엽전</span>
      {description && (
        <span className="text-sm text-text-secondary">· {description}</span>
      )}
    </div>
  );
};
