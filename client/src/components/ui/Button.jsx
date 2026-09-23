import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const variants = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-xs active:bg-indigo-800',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400 shadow-xs',
  outline:
    'border border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus-visible:ring-indigo-500',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-xs active:bg-rose-800',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-xs active:bg-emerald-800',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3 py-1.5 text-xs font-medium gap-1.5',
  md: 'px-4 py-2 text-sm font-medium gap-2',
  lg: 'px-5 py-2.5 text-base font-medium gap-2.5',
}

export const Button = forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none',
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : LeftIcon ? (
          <LeftIcon className="w-4 h-4 shrink-0" />
        ) : null}

        <span>{children}</span>

        {!isLoading && RightIcon ? (
          <RightIcon className="w-4 h-4 shrink-0" />
        ) : null}
      </button>
    )
  }
)

Button.displayName = 'Button'
