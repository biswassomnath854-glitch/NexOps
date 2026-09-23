import { cn } from '@/utils/cn'

const STATUS_CONFIG = {
  TODO: {
    label: 'To Do',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-400',
  },
}

export function TaskStatusBadge({ status, size = 'md', className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.TODO

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium select-none',
        config.className,
        sizeClass,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
