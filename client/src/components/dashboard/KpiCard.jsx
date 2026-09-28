import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

const colorStyles = {
  indigo: {
    iconBg: 'bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/15',
    border: 'border-slate-200/90 hover:border-[#635BFF]/40',
    progress: 'bg-[#635BFF]',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    border: 'border-slate-200/90 hover:border-emerald-300',
    progress: 'bg-emerald-600',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    border: 'border-slate-200/90 hover:border-amber-300',
    progress: 'bg-amber-500',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    border: 'border-slate-200/90 hover:border-rose-300',
    progress: 'bg-rose-600',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
    border: 'border-slate-200/90 hover:border-sky-300',
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
        'transition-all duration-150 rounded-xl bg-white shadow-2xs',
        styles.border,
        onClick && 'cursor-pointer hover:shadow-xs active:scale-[0.99]',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-4.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              {title}
            </p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 leading-none pt-0.5">
              {value}
            </h3>
          </div>

          {Icon && (
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs',
                styles.iconBg
              )}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
          )}
        </div>

        {/* Progress Bar (Optional) */}
        {typeof progress === 'number' && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
              <span>Sprint Progress</span>
              <span className="font-mono">{progress}%</span>
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
          <div className="mt-3 pt-2.5 border-t border-slate-100/90 flex items-center justify-between gap-2 text-xs text-slate-500">
            {subtitle && <span className="truncate text-[11px] text-slate-500">{subtitle}</span>}
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
