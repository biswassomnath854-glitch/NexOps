import { cn } from '@/utils/cn'
import { ArrowDown, ArrowUp, Minus, AlertCircle } from 'lucide-react'

const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    className: 'bg-slate-100/80 text-slate-600 border-slate-200/80 font-normal',
    Icon: ArrowDown,
    iconClass: 'text-slate-400',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-sky-50 text-sky-700 border-sky-200/90 font-medium',
    Icon: Minus,
    iconClass: 'text-sky-500',
  },
  HIGH: {
    label: 'High',
    className: 'bg-amber-50 text-amber-800 border-amber-200/90 font-medium',
    Icon: ArrowUp,
    iconClass: 'text-amber-600',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-rose-50 text-rose-700 border-rose-200/90 font-semibold',
    Icon: AlertCircle,
    iconClass: 'text-rose-600',
  },
}

export function TaskPriorityBadge({ priority, size = 'md', showIcon = true, className }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM
  const Icon = config.Icon

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border select-none shadow-2xs',
        config.className,
        sizeClass,
        className
      )}
    >
      {showIcon && <Icon className={cn('w-3 h-3 shrink-0', config.iconClass)} />}
      <span>{config.label}</span>
    </span>
  )
}

export { PRIORITY_CONFIG }
