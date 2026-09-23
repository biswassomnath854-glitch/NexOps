import { cn } from '@/utils/cn'
import { User } from 'lucide-react'

function getInitials(firstName, lastName) {
  const f = (firstName || '').charAt(0).toUpperCase()
  const l = (lastName || '').charAt(0).toUpperCase()
  return f + l || '?'
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
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
  const avatarSize = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs'

  if (!assignee) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5',
          textSize,
          'text-slate-400 font-medium',
          className
        )}
      >
        <span
          className={cn(
            'rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 shrink-0',
            avatarSize
          )}
        >
          <User className="w-3 h-3 text-slate-400" />
        </span>
        {showName && <span>Unassigned</span>}
      </span>
    )
  }

  const fullName = `${assignee.firstName} ${assignee.lastName}`.trim()
  const initials = getInitials(assignee.firstName, assignee.lastName)
  const colorClass = colorForName(fullName)

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', textSize, 'text-slate-700 font-medium', className)}
      title={fullName}
    >
      <span
        className={cn(
          'rounded-full flex items-center justify-center font-semibold border border-white shadow-sm shrink-0',
          avatarSize,
          colorClass
        )}
      >
        {initials}
      </span>
      {showName && <span className="truncate max-w-[140px]">{fullName}</span>}
    </span>
  )
}
