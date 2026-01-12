import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-white/70"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5
            bg-surface border border-border rounded-lg
            text-white placeholder:text-white/30
            transition-default focus-ring
            hover:border-border-focus
            focus:border-profit/50
            ${error ? 'border-loss focus:border-loss' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-sm text-loss">{error}</span>
        )}
        {hint && !error && (
          <span className="text-sm text-white/40">{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
