import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  RefreshCw,
  ArrowRightLeft,
  MessageSquare,
  AtSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronRight,
  FolderKanban,
  Check,
} from 'lucide-react'
import { NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { ROUTES } from '@/constants/routes'
import { formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'

/* ─── Static icon mapping to avoid dynamic component creation during render ─── */
const NOTIFICATION_ICONS = {
  TASK_ASSIGNED: UserPlus,
  TASK_REASSIGNED: ArrowRightLeft,
  TASK_STATUS_CHANGED: RefreshCw,
  TASK_COMMENTED: MessageSquare,
  TASK_MENTIONED: AtSign,
  TASK_DUE_SOON: Clock,
  TASK_OVERDUE: AlertTriangle,
  TASK_COMPLETED: CheckCircle2,
}

/**
 * Formats a UTC date string into a human-readable relative/absolute label.
 */
function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: diffDay > 365 ? 'numeric' : undefined,
  }).format(date)
}

/**
 * Derives a navigation path from notification metadata.
 */
function getNavigationTarget(notification) {
  if (notification.taskId) {
    return ROUTES.TASK_DETAILS(notification.taskId)
  }
  if (notification.projectId) {
    return ROUTES.PROJECT_DETAILS(notification.projectId)
  }
  return null
}

/**
 * NotificationItem — operational notification row.
 *
 * Provides clear information hierarchy:
 * 1. Event icon with semantic SB color
 * 2. Title & message
 * 3. Related context (actor, task status, project code)
 * 4. Timestamp
 * 5. Distinct unread indicators (accent border, badge, dot, bold typography)
 * 6. Action affordances (mark as read, delete, navigate)
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  compact = false,
  onClick,
}) {
  const navigate = useNavigate()
  const isUnread = !notification.isRead
  const meta = NOTIFICATION_TYPE_META[notification.type] || NOTIFICATION_TYPE_META.TASK_ASSIGNED
  const IconComponent = NOTIFICATION_ICONS[notification.type] || Clock
  const navTarget = getNavigationTarget(notification)
  const relativeTime = formatRelativeTime(notification.createdAt)
  const absoluteTime = notification.createdAt ? formatDateTime(notification.createdAt) : ''

  const handleClick = async () => {
    if (onClick) {
      onClick(notification)
      return
    }
    if (isUnread && onMarkAsRead) {
      try {
        await onMarkAsRead(notification.id)
      } catch {
        // Best-effort
      }
    }
    if (navTarget) {
      navigate(navTarget)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete?.(notification.id)
  }

  const handleMarkRead = (e) => {
    e.stopPropagation()
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Notification: ${notification.title}${isUnread ? ' (unread)' : ''}`}
      className={cn(
        'group relative flex items-start transition-all duration-150 cursor-pointer select-none border-b border-slate-100 last:border-b-0',
        compact ? 'gap-3 px-4 py-3' : 'gap-4 px-5 py-4',
        isUnread
          ? 'bg-[#635BFF]/[0.03] border-l-4 border-l-[#635BFF] hover:bg-[#635BFF]/[0.06]'
          : 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent'
      )}
    >
      {/* ── 1. Event Category Icon ── */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl shrink-0 transition-transform duration-150 group-hover:scale-105',
          compact ? 'w-8 h-8 mt-0.5' : 'w-10 h-10 mt-0.5',
          meta.iconBg
        )}
        aria-hidden="true"
      >
        <IconComponent className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
      </div>

      {/* ── 2. Content & Context ── */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h4
              className={cn(
                'leading-snug truncate tracking-tight',
                compact ? 'text-xs' : 'text-sm',
                isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
              )}
              title={notification.title}
            >
              {notification.title}
            </h4>
            {isUnread && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-[#635BFF]/10 text-[#5148E5] shrink-0">
                New
              </span>
            )}
          </div>

          <span
            className={cn(
              'text-slate-400 shrink-0 whitespace-nowrap font-mono',
              compact ? 'text-[10px]' : 'text-xs'
            )}
            title={absoluteTime}
          >
            {relativeTime}
          </span>
        </div>

        <p
          className={cn(
            'mt-1 leading-relaxed',
            compact
              ? 'text-[11px] text-slate-500 line-clamp-2'
              : 'text-xs text-slate-600 line-clamp-2'
          )}
        >
          {notification.message}
        </p>

        {/* Operational Context Badges (Actor, Task, Project) */}
        {!compact && (notification.actor || notification.task || notification.project) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
            {notification.actor && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {notification.actor.firstName} {notification.actor.lastName}
              </span>
            )}
            {notification.task && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md truncate max-w-[220px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
                <span className="truncate">{notification.task.title}</span>
                {notification.task.status && (
                  <span className="text-[10px] uppercase font-mono text-indigo-500">
                    [{notification.task.status.replace(/_/g, ' ')}]
                  </span>
                )}
              </span>
            )}
            {notification.project && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                <FolderKanban className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">{notification.project.name}</span>
                {notification.project.code && (
                  <span className="font-mono text-[10px] text-emerald-600">
                    ({notification.project.code})
                  </span>
                )}
              </span>
            )}
            {navTarget && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-indigo-600 transition-colors ml-auto">
                <ExternalLink className="w-3 h-3" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 3. Unread Status Dot ── */}
      {isUnread && (
        <span
          className={cn(
            'rounded-full bg-[#635BFF] shrink-0 mt-2.5 shadow-xs ring-2 ring-white',
            compact ? 'w-2 h-2' : 'w-2.5 h-2.5'
          )}
          title="Unread notification"
          aria-hidden="true"
        />
      )}

      {/* ── 4. Quick Action Buttons (visible on hover) ── */}
      {!compact && (
        <div className="absolute right-4 top-3 hidden group-hover:flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-200/80 shadow-xs">
          {isUnread && onMarkAsRead && (
            <button
              type="button"
              onClick={handleMarkRead}
              className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Mark as read"
              aria-label="Mark as read"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete notification"
              aria-label="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {navTarget && (
            <button
              type="button"
              onClick={handleClick}
              className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Open related item"
              aria-label="Open related item"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
