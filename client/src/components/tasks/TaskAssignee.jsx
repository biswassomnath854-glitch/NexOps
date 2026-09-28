import { cn } from '@/utils/cn'
import { User } from 'lucide-react'

function getInitials(firstName, lastName) {
  const f = (firstName || '').charAt(0).toUpperCase()
  const l = (lastName || '').charAt(0).toUpperCase()
  return f + l || '?'
}

const AVATAR_COLORS = [
  'bg-violet-50 text-violet-700 border-violet-200/80',
  'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  'bg-sky-50 text-sky-700 border-sky-200/80',
  'bg-teal-50 text-teal-700 border-teal-200/80',
  'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'bg-amber-50 text-amber-700 border-amber-200/80',
]

function colorForName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * TaskAssignee — compact assignee display with avatar initials.
 * Falls back to "Unassigned" when no assignee is set.
 */
export function TaskAssignee({ assignee, size = 'md', showName = true, className }) {
  const avatarSize = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-[11px]'
  const textSize = 'text-xs'

  if (!assignee) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          textSize,
          'text-slate-400 font-normal select-none',
          className
        )}
      >
        <span
          className={cn(
            'rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 shrink-0 shadow-2xs',
            avatarSize
          )}
        >
          <User className="w-3 h-3 text-slate-400" />
        </span>
        {showName && <span>Unassigned</span>}
      </span>
    )
  }

  const fullName = `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || 'Team Member'
  const initials = getInitials(assignee.firstName, assignee.lastName)
  const colorClass = colorForName(fullName)

  return (
    <span
      className={cn('inline-flex items-center gap-2', textSize, 'text-slate-800 font-medium', className)}
      title={fullName}
    >
      <span
        className={cn(
          'rounded-full flex items-center justify-center font-bold border shrink-0 shadow-2xs select-none',
          avatarSize,
          colorClass
        )}
      >
        {initials}
      </span>
      {showName && <span className="truncate max-w-[150px] leading-tight">{fullName}</span>}
    </span>
  )
}
