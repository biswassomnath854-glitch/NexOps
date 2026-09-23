import { cn } from '@/utils/cn'

const badgeVariants = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
}

const dotColors = {
  neutral: 'bg-slate-400',
  primary: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
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
