import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

export const Textarea = forwardRef(
  ({ label, error, helperText, className, rows = 3, ...props }, ref) => {
    return (
      <div className="w-full text-left space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={cn(
            'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
        {helperText && !error && <p className="text-[11px] text-slate-400">{helperText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
