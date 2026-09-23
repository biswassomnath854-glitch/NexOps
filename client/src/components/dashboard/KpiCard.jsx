import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

const colorStyles = {
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600',
    border: 'border-slate-200/80 hover:border-indigo-200',
    progress: 'bg-indigo-600',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-slate-200/80 hover:border-emerald-200',
    progress: 'bg-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-slate-200/80 hover:border-amber-200',
    progress: 'bg-amber-500',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600',
    border: 'border-slate-200/80 hover:border-rose-200',
    progress: 'bg-rose-600',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-600',
    border: 'border-slate-200/80 hover:border-sky-200',
    progress: 'bg-sky-500',
  },
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  color = 'indigo',
  progress,
  className,
  onClick,
}) {
  const styles = colorStyles[color] || colorStyles.indigo

  return (
    <Card
      className={cn(
        'transition-all duration-150',
        styles.border,
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.99]',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              {title}
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </h3>
          </div>

          {Icon && (
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
                styles.iconBg
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Progress Bar (Optional) */}
        {typeof progress === 'number' && (
          <div className="mt-3.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300', styles.progress)}
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtitle / Badge */}
        {(subtitle || badgeText) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between gap-2 text-xs text-slate-500">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {badgeText && (
              <Badge variant={badgeVariant} size="sm" dot>
                {badgeText}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
