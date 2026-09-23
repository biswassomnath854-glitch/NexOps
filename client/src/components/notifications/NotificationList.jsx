import { Bell, Loader2, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NotificationItem } from './NotificationItem'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/constants/routes'
import { NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { cn } from '@/utils/cn'

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  ...Object.entries(NOTIFICATION_TYPE_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
]

const READ_FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'false', label: 'Unread' },
  { value: 'true', label: 'Read' },
]

/**
 * NotificationList — paginated list of notifications with filter controls.
 *
 * Props:
 *   notifications  — array of notification objects
 *   pagination     — { page, limit, total, totalPages }
 *   isLoading      — boolean
 *   error          — string | null
 *   unreadCount    — number
 *   filters        — { isRead, type }
 *   onFiltersChange — (newFilters) => void
 *   onPageChange    — (page) => void
 *   onPageSizeChange— (limit) => void
 *   onMarkAsRead   — (id) => void
 *   onMarkAllAsRead — () => void
 *   onDelete       — (id) => void
 *   onRetry        — () => void
 */
export function NotificationList({
  notifications = [],
  pagination,
  isLoading,
  error,
  unreadCount = 0,
  filters = {},
  onFiltersChange,
  onPageChange,
  onPageSizeChange,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRetry,
}) {
  const handleReadFilterChange = (e) => {
    onFiltersChange?.({ ...filters, isRead: e.target.value || undefined, page: 1 })
  }

  const handleTypeFilterChange = (e) => {
    onFiltersChange?.({ ...filters, type: e.target.value || undefined, page: 1 })
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <Card className="border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Read filter */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Status
              </label>
              <select
                value={filters.isRead ?? ''}
                onChange={handleReadFilterChange}
                className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {READ_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Type
              </label>
              <select
                value={filters.type ?? ''}
                onChange={handleTypeFilterChange}
                className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              >
                {TYPE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </Card>

      {/* ── List body ────────────────────────────────────────────────────── */}
      <Card className="border-slate-200/80 overflow-hidden">
        {/* Loading skeleton */}
        {isLoading && notifications.length === 0 && (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-full" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Failed to load notifications</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
            {onRetry && (
              <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">All caught up</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {filters.isRead === 'false'
                ? 'No unread notifications.'
                : filters.type
                ? 'No notifications for this type.'
                : 'No notifications yet.'}
            </p>
          </div>
        )}

        {/* Notification rows */}
        {!error && notifications.length > 0 && (
          <div
            role="list"
            className={cn('divide-y divide-slate-100/80', isLoading && 'opacity-60 pointer-events-none')}
          >
            {isLoading && (
              <div className="flex items-center gap-2 px-5 py-2 bg-indigo-50/50 border-b border-indigo-100/60">
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                <span className="text-xs text-indigo-600">Refreshing…</span>
              </div>
            )}
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!error && pagination && pagination.total > 0 && (
          <Pagination
            totalItems={pagination.total}
            currentPage={pagination.page}
            pageSize={pagination.limit}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </Card>

      {/* Link to preferences */}
      <div className="text-center">
        <Link
          to={ROUTES.NOTIFICATION_PREFERENCES}
          className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
        >
          Manage notification preferences →
        </Link>
      </div>
    </div>
  )
}
