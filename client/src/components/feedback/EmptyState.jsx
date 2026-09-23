import { Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'Get started by creating your first record in this workspace.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/50',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-xs mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>

      {action && <div>{action}</div>}
    </div>
  )
}
