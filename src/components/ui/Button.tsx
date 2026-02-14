/**
 * 재사용 가능한 버튼 컴포넌트
 * 조선 전통색 테마 적용
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:scale-98 shadow-hanji hover:shadow-hanji-lg',
    secondary: 'bg-secondary text-primary border-2 border-primary/20 hover:bg-secondary/80 hover:border-primary/40',
    accent: 'bg-accent text-white hover:bg-accent-dark active:scale-98 shadow-hanji hover:shadow-hanji-lg',
    outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white active:scale-98',
    ghost: 'bg-transparent text-primary hover:bg-secondary/50'
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyle}
        ${className}
      `}
      style={{
        textShadow: (variant === 'primary' || variant === 'accent') ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">처리 중...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
