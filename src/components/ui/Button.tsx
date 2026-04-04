'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'sun' | 'moon' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-br from-cta to-purple-500 text-text-primary glow-cta hover:glow-cta-lg hover:-translate-y-0.5',
    secondary: 'bg-space-surface border border-[var(--border-default)] text-text-primary hover:bg-space-elevated hover:border-[var(--border-strong)]',
    ghost: 'bg-transparent text-cta-secondary hover:bg-[rgba(124,92,252,0.08)]',
    sun: 'bg-gradient-to-br from-sun-flare to-sun-core text-text-inverse font-bold glow-sun hover:-translate-y-0.5',
    moon: 'bg-gradient-to-br from-moon-shadow to-moon-core text-text-inverse font-bold glow-moon hover:-translate-y-0.5',
    outline: 'bg-transparent border border-[var(--border-default)] text-text-primary hover:border-cta hover:text-cta',
  };

  const sizes: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-2.5 text-base min-h-[44px]',
    lg: 'px-8 py-3.5 text-lg min-h-[52px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>처리 중...</span>
        </div>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
