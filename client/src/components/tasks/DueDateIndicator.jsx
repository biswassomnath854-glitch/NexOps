import { cn } from '@/utils/cn'
import { CalendarDays, AlertTriangle, Clock, Calendar } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

/**
 * DueDateIndicator
 *
 * Renders due date with urgency coloring derived from the backend-computed
 * `deadline` metadata object (isOverdue, isDueToday, isDueSoon, daysUntilDue).
 */
export function DueDateIndicator({ dueDate, deadline, className, compact = false }) {
  if (!dueDate) {
    if (compact) return null
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
        <Calendar className="w-3.5 h-3.5" />
        No due date
      </span>
    )
  }

  const { isOverdue, isDueToday, isDueSoon, daysUntilDue, hasDeadline } = deadline || {}

  let colorClass = 'text-slate-500'
  let bgClass = ''
  let Icon = CalendarDays
  let suffix = ''

  if (isOverdue) {
    colorClass = 'text-rose-600'
    bgClass = 'bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5'
    Icon = AlertTriangle
    suffix =
      daysUntilDue !== null
        ? ` (${Math.abs(daysUntilDue)}d overdue)`
        : ' (Overdue)'
  } else if (isDueToday) {
    colorClass = 'text-amber-700'
    bgClass = 'bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5'
    Icon = Clock
    suffix = ' (Today)'
  } else if (isDueSoon) {
    colorClass = 'text-amber-600'
    bgClass = ''
    Icon = Clock
    suffix = daysUntilDue !== null ? ` (${daysUntilDue}d)` : ''
  } else if (hasDeadline) {
    colorClass = 'text-slate-500'
    bgClass = ''
    Icon = CalendarDays
    suffix = daysUntilDue !== null ? ` (${daysUntilDue}d)` : ''
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        colorClass,
        bgClass,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {!compact && <span>{formatDate(dueDate)}</span>}
      {compact && isOverdue && <span>Overdue</span>}
      {compact && isDueToday && <span>Due Today</span>}
      {compact && isDueSoon && <span>{daysUntilDue}d left</span>}
      {!compact && <span className="opacity-80">{suffix}</span>}
    </span>
  )
}
