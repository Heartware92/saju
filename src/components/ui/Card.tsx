'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glow?: 'none' | 'sun' | 'moon' | 'cta' | 'wood' | 'fire' | 'earth' | 'metal' | 'water';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'md',
  glow = 'none',
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const glowStyles: Record<string, string> = {
    none: '',
    sun: 'border-[rgba(255,215,0,0.3)] shadow-[0_0_20px_rgba(255,215,0,0.15)]',
    moon: 'border-[rgba(165,180,252,0.3)] shadow-[0_0_15px_rgba(165,180,252,0.12)]',
    cta: 'border-[rgba(124,92,252,0.3)] shadow-[0_0_15px_rgba(124,92,252,0.15)]',
    wood: 'border-[rgba(52,211,153,0.3)]',
    fire: 'border-[rgba(244,63,94,0.3)]',
    earth: 'border-[rgba(245,158,11,0.3)]',
    metal: 'border-[rgba(203,213,225,0.3)]',
    water: 'border-[rgba(59,130,246,0.3)]',
  };

  const hoverClass = hover
    ? 'hover:-translate-y-1 hover:bg-[rgba(31,37,68,0.7)] hover:border-[var(--border-strong)] cursor-pointer'
    : '';

  return (
    <div
      className={`
        glass rounded-2xl transition-all duration-300
        ${paddings[padding]}
        ${glowStyles[glow]}
        ${hoverClass}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CreditPackageCardProps {
  children: React.ReactNode;
  className?: string;
  type?: 'sun' | 'moon';
  popular?: boolean;
  bestValue?: boolean;
  onClick?: () => void;
}

export const CreditPackageCard: React.FC<CreditPackageCardProps> = ({
  children,
  className = '',
  type = 'sun',
  popular = false,
  bestValue = false,
  onClick,
}) => {
  return (
    <div className="relative">
      {(popular || bestValue) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className={`
            px-4 py-1 rounded-full text-sm font-bold
            ${popular ? 'bg-gradient-to-r from-cta to-purple-500 text-white' : ''}
            ${bestValue ? 'bg-gradient-to-r from-sun-flare to-sun-core text-space-void' : ''}
          `}>
            {popular && '인기'}
            {bestValue && '최고 가성비'}
          </div>
        </div>
      )}
      <Card
        className={className}
        glow={type}
        hover
        onClick={onClick}
      >
        {children}
      </Card>
    </div>
  );
};
