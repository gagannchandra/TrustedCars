import { forwardRef, useId } from 'react';
import { cn } from '../utils/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-bold text-slate-700 mb-2">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "w-full border rounded-xl px-4 py-3.5 text-base outline-none transition-all shadow-sm",
            error
              ? "border-error focus:border-error focus:ring-4 focus:ring-error/10 bg-error/5"
              : "border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 bg-white hover:border-slate-300",
            className
          )}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-error text-xs font-bold mt-1.5 flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
