import { cn } from '@/utils/cn'
import { CalendarDays, AlertTriangle, Clock, Calendar } from 'lucide-react'
import { formatDate } from '@/utils/formatters'

/**
 * DueDateIndicator
 *
 * Renders due date with semantic urgency coloring derived from the backend-computed
 * `deadline` metadata object (isOverdue, isDueToday, isDueSoon, daysUntilDue).
 */
export function DueDateIndicator({ dueDate, deadline, className, compact = false }) {
  if (!dueDate) {
    if (compact) return null
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-normal select-none">
        <Calendar className="w-3.5 h-3.5 text-slate-300" />
        <span>No due date</span>
      </span>
    )
  }

  const { isOverdue, isDueToday, isDueSoon, daysUntilDue, hasDeadline } = deadline || {}

  let colorClass = 'text-slate-600'
  let bgClass = ''
  let Icon = CalendarDays
  let suffix = ''

  if (isOverdue) {
    colorClass = 'text-rose-700'
    bgClass = 'bg-rose-50 border border-rose-200/90 rounded-md px-2 py-0.5 shadow-2xs font-semibold'
    Icon = AlertTriangle
    suffix =
      daysUntilDue !== null
        ? ` (${Math.abs(daysUntilDue)}d overdue)`
        : ' (Overdue)'
  } else if (isDueToday) {
    colorClass = 'text-amber-800'
    bgClass = 'bg-amber-50 border border-amber-200/90 rounded-md px-2 py-0.5 shadow-2xs font-semibold'
    Icon = Clock
    suffix = ' (Today)'
  } else if (isDueSoon) {
    colorClass = 'text-amber-700 font-medium'
    bgClass = ''
    Icon = Clock
    suffix = daysUntilDue !== null ? ` (${daysUntilDue}d)` : ''
  } else if (hasDeadline) {
    colorClass = 'text-slate-600 font-medium'
    bgClass = ''
    Icon = CalendarDays
    suffix = daysUntilDue !== null ? ` (${daysUntilDue}d)` : ''
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs transition-colors select-none',
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
      {!compact && <span className="opacity-80 text-[11px] font-mono">{suffix}</span>}
    </span>
  )
}
