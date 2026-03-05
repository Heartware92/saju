/**
 * 입력 폼 컴포넌트
 */

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthStyle}`}>
        {label && (
          <label className="block text-sm font-bold text-primary mb-2">
            {label}
            {props.required && <span className="text-fire ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          className={`
            w-full
            px-4 py-3
            bg-white
            border-2 rounded-lg
            text-text font-medium
            placeholder:text-text-secondary/60 placeholder:font-normal
            transition-all
            duration-200
            focus:outline-none
            focus:ring-2
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${error
              ? 'border-fire focus:ring-fire/30'
              : 'border-primary/20 focus:border-primary focus:ring-primary/30 hover:border-primary/40'
            }
            ${className}
          `}
          style={{
            boxShadow: error
              ? '0 2px 4px rgba(230, 57, 70, 0.1)'
              : '0 2px 4px rgba(139, 69, 19, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-fire font-medium" style={{ wordBreak: 'keep-all' }}>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-xs text-text-secondary font-medium" style={{ wordBreak: 'keep-all' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea 컴포넌트
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <div className={`${widthStyle}`}>
        {label && (
          <label className="block text-sm font-medium text-text mb-2">
            {label}
            {props.required && <span className="text-fire ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={`
            w-full
            px-4 py-2.5
            bg-white
            border rounded-lg
            text-text
            placeholder:text-text-secondary/50
            transition-all
            duration-200
            focus:outline-none
            focus:ring-2
            disabled:opacity-50
            disabled:cursor-not-allowed
            resize-none
            ${error
              ? 'border-fire focus:ring-fire/30'
              : 'border-border focus:border-primary focus:ring-primary/30'
            }
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-fire">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
