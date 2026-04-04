'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-semibold text-text-secondary mb-2 tracking-wide uppercase">
            {label}
            {props.required && <span className="text-fire ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-space-mid
            border border-[var(--border-default)] rounded-xl
            text-text-primary font-medium
            placeholder:text-text-tertiary
            transition-all duration-200
            focus:outline-none focus:border-cta focus:shadow-[0_0_0_3px_rgba(124,92,252,0.25)]
            hover:border-[var(--border-strong)]
            disabled:opacity-40 disabled:cursor-not-allowed
            ${error ? 'border-error focus:shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : ''}
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-error font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-semibold text-text-secondary mb-2 tracking-wide uppercase">
            {label}
            {props.required && <span className="text-fire ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-space-mid
            border border-[var(--border-default)] rounded-xl
            text-text-primary
            placeholder:text-text-tertiary
            transition-all duration-200
            focus:outline-none focus:border-cta focus:shadow-[0_0_0_3px_rgba(124,92,252,0.25)]
            hover:border-[var(--border-strong)]
            disabled:opacity-40 disabled:cursor-not-allowed
            resize-none
            ${error ? 'border-error focus:shadow-[0_0_0_3px_rgba(244,63,94,0.25)]' : ''}
            ${className}
          `}
          {...props}
        />

        {error && (
          <p className="mt-1.5 text-sm text-error font-medium">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-xs text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
