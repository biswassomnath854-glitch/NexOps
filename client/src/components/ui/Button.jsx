import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const variants = {
  primary:
    'bg-[#635BFF] text-white hover:bg-[#5148E5] focus-visible:ring-[#635BFF]/40 shadow-xs active:bg-[#4238BE]',
  secondary:
    'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400 shadow-2xs',
  outline:
    'border border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF]/5 focus-visible:ring-[#635BFF]/30',
  ghost:
    'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-slate-300',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/40 shadow-xs active:bg-rose-800',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40 shadow-xs active:bg-emerald-800',
}

const sizes = {
  xs: 'px-2.5 py-1 text-xs font-medium gap-1.5 rounded-md',
  sm: 'px-3 py-1.5 text-xs font-semibold gap-1.5 rounded-lg',
  md: 'px-3.5 py-2 text-sm font-semibold gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm font-semibold gap-2.5 rounded-lg',
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
