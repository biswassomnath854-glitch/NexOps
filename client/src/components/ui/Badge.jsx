import { cn } from '@/utils/cn'

const badgeVariants = {
  neutral: 'bg-slate-100/80 text-slate-700 border-slate-200/90',
  primary: 'bg-[#635BFF]/10 text-[#5148E5] border-[#635BFF]/20',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/90',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/90',
  info: 'bg-blue-50 text-blue-700 border-blue-200/90',
}

const dotColors = {
  neutral: 'bg-slate-400',
  primary: 'bg-[#635BFF]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-blue-500',
}

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs font-medium',
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium select-none',
        badgeVariants[variant] || badgeVariants.neutral,
        badgeSizes[size] || badgeSizes.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant] || dotColors.neutral
          )}
        />
      )}
      {children}
    </span>
  )
}
