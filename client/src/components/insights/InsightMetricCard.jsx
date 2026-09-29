import { cn } from '@/utils/cn'

/**
 * Standardized operational metric card for Workload and Analytics insights.
 * Displays numerical values, status indicators, and contextual metadata.
 */
export function InsightMetricCard({
  icon: Icon,
  label,
  value,
  color = '#635BFF',
  subtitle,
  badge,
  className,
  valueClassName,
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-all duration-150',
        className
      )}
    >
      {Icon && (
        <div
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-150"
          style={{ backgroundColor: `${color}14` }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
            {label}
          </p>
          {badge}
        </div>
        <p
          className={cn(
            'text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums mt-1 font-mono',
            valueClassName
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
