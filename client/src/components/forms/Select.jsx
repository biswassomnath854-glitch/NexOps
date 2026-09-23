import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export const Select = forwardRef(
  (
    {
      label,
      options = [],
      placeholder = 'Select an option',
      error,
      helperText,
      className,
      id,
      required = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const selectId = id || generatedId

    return (
      <div className="w-full text-left space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-xs">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              'block w-full appearance-none rounded-lg border bg-white px-3.5 py-2 pr-10 text-sm text-slate-900',
              'transition-all duration-150',
              'focus:outline-hidden focus:ring-2 focus:ring-offset-0',
              'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-100',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.length > 0
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {error ? (
          <p id={`${selectId}-error`} className="text-xs text-rose-600 font-medium animate-in fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = 'Select'
