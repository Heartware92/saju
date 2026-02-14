/**
 * 엽전 아이콘 컴포넌트
 * 실제 이미지 준비 전까지 CSS로 스타일링한 이모지 사용
 */

import React from 'react';

interface YeopjeonIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'bronze' | 'silver' | 'gold';
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const YeopjeonIcon: React.FC<YeopjeonIconProps> = ({
  size = 'md',
  variant = 'bronze',
  count = 1,
  className = '',
  style
}) => {
  const sizeStyles = {
    sm: 'text-base',      // 16px
    md: 'text-2xl',       // 24px
    lg: 'text-4xl',       // 36px
    xl: 'text-6xl'        // 60px
  };

  const variantStyles = {
    bronze: 'filter-none',
    silver: 'filter brightness-125 contrast-110',
    gold: 'filter brightness-150 saturate-150'
  };

  // 실제 이미지 경로 (이미지 준비 시 활성화)
  const imagePath = `/images/coins/yeopjeon-${variant}.png`;
  const useImage = false; // 이미지 준비되면 true로 변경

  if (useImage) {
    return (
      <img
        src={imagePath}
        alt={`${count} 엽전`}
        className={`inline-block ${sizeStyles[size]} ${className}`}
        onError={(e) => {
          // 이미지 로드 실패 시 이모지로 대체
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement?.classList.add('fallback-emoji');
        }}
      />
    );
  }

  // 임시: 스타일링된 이모지
  return (
    <span
      className={`
        inline-block
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      style={{
        filter: variant === 'gold'
          ? 'drop-shadow(0 0 8px rgba(212, 165, 116, 0.8))'
          : undefined,
        ...style
      }}
    >
      {count === 1 ? '🪙' : `🪙×${count}`}
    </span>
  );
};

/**
 * 엽전 스택 (여러 개 겹쳐진 모습)
 */
export const YeopjeonStack: React.FC<{ count: number; size?: 'sm' | 'md' | 'lg' }> = ({
  count,
  size = 'md'
}) => {
  const displayCount = Math.min(count, 3); // 최대 3개까지 표시

  return (
    <div className="relative inline-block">
      {Array.from({ length: displayCount }).map((_, i) => (
        <YeopjeonIcon
          key={i}
          size={size}
          variant={count >= 10 ? 'gold' : count >= 5 ? 'silver' : 'bronze'}
          className="absolute"
          style={{
            left: `${i * 8}px`,
            top: `${i * 4}px`,
            zIndex: displayCount - i
          }}
        />
      ))}
      {count > 3 && (
        <span className="ml-8 text-sm font-bold text-accent">
          +{count - 3}
        </span>
      )}
    </div>
  );
};
