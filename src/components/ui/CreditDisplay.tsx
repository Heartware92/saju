'use client';

import React from 'react';

interface CreditDisplayProps {
  sunBalance: number;
  moonBalance: number;
  compact?: boolean;
  onClick?: () => void;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  sunBalance,
  moonBalance,
  compact = false,
  onClick,
}) => {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[rgba(36,20,63,0.88)] border border-[rgba(61,41,96,0.35)] cursor-pointer transition-none"
      >
        <span className="flex items-center gap-1">
          <SunIcon size={16} />
          <span className="text-sm font-bold text-sun-core">{sunBalance}</span>
        </span>
        <span className="w-px h-4 bg-white/15" />
        <span className="flex items-center gap-1">
          <MoonIcon size={16} />
          <span className="text-sm font-bold text-moon-core">{moonBalance}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="flex gap-3" onClick={onClick}>
      <div className="flex-1 rounded-xl p-4 bg-[var(--sun-glow)] border border-[rgba(255,215,0,0.2)]">
        <div className="flex items-center gap-2 mb-1">
          <SunIcon size={24} />
          <span className="text-sm text-text-secondary">해</span>
        </div>
        <span className="text-2xl font-bold text-sun-core">{sunBalance}</span>
      </div>
      <div className="flex-1 rounded-xl p-4 bg-[var(--moon-glow)] border border-[rgba(165,180,252,0.2)]">
        <div className="flex items-center gap-2 mb-1">
          <MoonIcon size={24} />
          <span className="text-sm text-text-secondary">달</span>
        </div>
        <span className="text-2xl font-bold text-moon-core">{moonBalance}</span>
      </div>
    </div>
  );
};

export const SunIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="5" fill="url(#sunGrad)" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <line
        key={angle}
        x1="12"
        y1="2"
        x2="12"
        y2="4.5"
        stroke="#FFD700"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${angle} 12 12)`}
      />
    ))}
    <defs>
      <radialGradient id="sunGrad">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFA726" />
      </radialGradient>
    </defs>
  </svg>
);

export const MoonIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      fill="url(#moonGrad)"
      stroke="none"
    />
    <defs>
      <linearGradient id="moonGrad" x1="11" y1="3" x2="21" y2="13">
        <stop offset="0%" stopColor="#A5B4FC" />
        <stop offset="100%" stopColor="#E0E7FF" />
      </linearGradient>
    </defs>
  </svg>
);
