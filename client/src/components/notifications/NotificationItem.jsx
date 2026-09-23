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
} from 'lucide-react'
import { NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

/**
 * Returns the appropriate Lucide icon component for a notification type.
 */
function getNotificationIcon(type) {
  const icons = {
    TASK_ASSIGNED: UserPlus,
    TASK_REASSIGNED: ArrowRightLeft,
    TASK_STATUS_CHANGED: RefreshCw,
    TASK_COMMENTED: MessageSquare,
    TASK_MENTIONED: AtSign,
    TASK_DUE_SOON: Clock,
    TASK_OVERDUE: AlertTriangle,
    TASK_COMPLETED: CheckCircle2,
  }
  return icons[type] || Clock
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
 * Returns null if no valid navigation target exists.
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
 * NotificationItem — renders a single notification row.
 *
 * Props:
 *   notification   — the notification object from the API
 *   onMarkAsRead   — (id) => void  — called when clicking an unread item
 *   onDelete       — (id) => void
 *   compact        — boolean — compact mode for dropdown use
 *   onClick        — optional override click handler (dropdown: close + navigate)
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
  const Icon = getNotificationIcon(notification.type)
  const navTarget = getNavigationTarget(notification)
  const timeLabel = formatRelativeTime(notification.createdAt)

  const handleClick = async () => {
    if (onClick) {
      onClick(notification)
      return
    }
    if (isUnread && onMarkAsRead) {
      try {
        await onMarkAsRead(notification.id)
      } catch {
        // Best-effort — navigate anyway
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
      className={cn(
        'group relative flex items-start gap-3 transition-colors cursor-pointer select-none',
        compact ? 'px-3.5 py-3 hover:bg-slate-50' : 'px-5 py-4 hover:bg-slate-50/70',
        isUnread && 'bg-indigo-50/40 hover:bg-indigo-50/60'
      )}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Notification: ${notification.title}${isUnread ? ' (unread)' : ''}`}
    >
      {/* Type icon */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl shrink-0',
          compact ? 'w-7 h-7 mt-0.5' : 'w-9 h-9 mt-0.5',
          meta.iconBg
        )}
      >
        <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'font-semibold leading-snug truncate',
              compact ? 'text-xs' : 'text-sm',
              isUnread ? 'text-slate-900' : 'text-slate-600'
            )}
          >
            {notification.title}
          </p>
          <span className={cn('text-slate-400 shrink-0 whitespace-nowrap', compact ? 'text-[10px]' : 'text-xs')}>
            {timeLabel}
          </span>
        </div>

        <p
          className={cn(
            'mt-0.5 leading-relaxed',
            compact ? 'text-[11px] text-slate-500 line-clamp-2' : 'text-xs text-slate-500 line-clamp-2'
          )}
        >
          {notification.message}
        </p>

        {/* Actor + task context (full mode) */}
        {!compact && (notification.actor || notification.task || notification.project) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {notification.actor && (
              <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                {notification.actor.firstName} {notification.actor.lastName}
              </span>
            )}
            {notification.task && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full truncate max-w-[160px]">
                {notification.task.title}
              </span>
            )}
            {!notification.task && notification.project && (
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full truncate max-w-[160px]">
                {notification.project.name}
              </span>
            )}
            {navTarget && (
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            )}
          </div>
        )}
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span
          className={cn(
            'rounded-full bg-indigo-500 shrink-0 mt-2',
            compact ? 'w-1.5 h-1.5' : 'w-2 h-2'
          )}
          title="Unread"
        />
      )}

      {/* Actions (visible on hover, full mode only) */}
      {!compact && (
        <div className="absolute right-4 top-3 hidden group-hover:flex items-center gap-1">
          {isUnread && onMarkAsRead && (
            <button
              type="button"
              onClick={handleMarkRead}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Mark as read"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete notification"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
