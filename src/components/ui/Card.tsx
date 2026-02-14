/**
 * 한지 스타일 카드 컴포넌트
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'md'
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const hoverStyles = hover
    ? 'hover:shadow-hanji-lg hover:-translate-y-1 cursor-pointer'
    : '';

  const clickableStyles = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`
        card-hanji
        rounded-xl
        transition-all
        duration-300
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${clickableStyles}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

/**
 * 엽전 패키지 전용 카드 (조선 전통 스타일)
 */
interface YeopjeonCardProps {
  children: React.ReactNode;
  className?: string;
  popular?: boolean;
  bestValue?: boolean;
  onClick?: () => void;
}

export const YeopjeonCard: React.FC<YeopjeonCardProps> = ({
  children,
  className = '',
  popular = false,
  bestValue = false,
  onClick
}) => {
  return (
    <div className="relative">
      {/* 인기/추천 배지 */}
      {(popular || bestValue) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-accent text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
            {popular && '인기'}
            {bestValue && '최고 가성비'}
          </div>
        </div>
      )}

      <Card
        className={`
          border-2
          ${popular ? 'border-accent' : 'border-border'}
          ${bestValue ? 'border-accent-dark' : ''}
          ${className}
        `}
        hover
        onClick={onClick}
      >
        {children}
      </Card>
    </div>
  );
};
