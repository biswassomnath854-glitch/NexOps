import { cn } from '@/utils/cn'
import { ArrowDown, ArrowUp, Minus, Flame } from 'lucide-react'

const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    Icon: ArrowDown,
    iconClass: 'text-sky-500',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    Icon: Minus,
    iconClass: 'text-slate-500',
  },
  HIGH: {
    label: 'High',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    Icon: ArrowUp,
    iconClass: 'text-amber-500',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    Icon: Flame,
    iconClass: 'text-rose-500',
  },
}

export function TaskPriorityBadge({ priority, size = 'md', showIcon = true, className }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM
  const Icon = config.Icon

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium select-none',
        config.className,
        sizeClass,
        className
      )}
    >
      {showIcon && <Icon className={cn('w-3 h-3 shrink-0', config.iconClass)} />}
      {config.label}
    </span>
  )
}

export { PRIORITY_CONFIG }
