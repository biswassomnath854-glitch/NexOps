import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

export function InsightEmptyState({
  icon: Icon = Inbox,
  iconColor = '#635BFF',
  title = 'No data available',
  description = 'Data insights will populate as activities and tasks progress in this workspace.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 sm:p-14 text-center rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50',
        className
      )}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xs mb-3.5"
        style={{ backgroundColor: `${iconColor}12` }}
      >
        <Icon className="w-6 h-6" style={{ color: iconColor }} />
      </div>
      <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}
