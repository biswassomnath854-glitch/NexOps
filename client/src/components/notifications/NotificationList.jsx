import { useMemo } from 'react'
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  RotateCw,
  Calendar,
  X,
} from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/forms/Select'
import { NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { cn } from '@/utils/cn'

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Event Types' },
  ...Object.entries(NOTIFICATION_TYPE_META).map(([value, meta]) => ({
    value,
    label: meta.label,
  })),
]

const READ_STATUS_TABS = [
  { id: '', label: 'All Activity' },
  { id: 'false', label: 'Unread' },
  { id: 'true', label: 'Read' },
]

/**
 * Groups an array of notifications into chronological buckets:
 * - "Today"
 * - "Yesterday"
 * - "Earlier"
 * Based strictly on actual notification.createdAt timestamps.
 */
function groupNotificationsByTime(notifications = []) {
  if (!notifications.length) return []

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000

  const groups = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  }

  notifications.forEach((item) => {
    if (!item.createdAt) {
      groups.Earlier.push(item)
      return
    }
    const itemTime = new Date(item.createdAt).getTime()
    if (isNaN(itemTime)) {
      groups.Earlier.push(item)
      return
    }

    if (itemTime >= todayStart) {
      groups.Today.push(item)
    } else if (itemTime >= yesterdayStart) {
      groups.Yesterday.push(item)
    } else {
      groups.Earlier.push(item)
    }
  })

  return [
    { title: 'Today', items: groups.Today },
    { title: 'Yesterday', items: groups.Yesterday },
    { title: 'Earlier', items: groups.Earlier },
  ].filter((group) => group.items.length > 0)
}

/**
 * NotificationList — Paginated, time-grouped operational activity feed.
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
  const timeGroups = useMemo(
    () => groupNotificationsByTime(notifications),
    [notifications]
  )

  const activeStatusFilter = filters.isRead ?? ''
  const activeTypeFilter = filters.type ?? ''
  const hasActiveFilters = Boolean(activeStatusFilter !== '' || activeTypeFilter !== '')

  const handleStatusTabClick = (tabId) => {
    onFiltersChange?.({
      ...filters,
      isRead: tabId === '' ? undefined : tabId,
      page: 1,
    })
  }

  const handleTypeSelectChange = (e) => {
    onFiltersChange?.({
      ...filters,
      type: e.target.value || undefined,
      page: 1,
    })
  }

  const handleResetFilters = () => {
    onFiltersChange?.({
      ...filters,
      isRead: undefined,
      type: undefined,
      page: 1,
    })
  }

  return (
    <div className="space-y-5">
      {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
      <Card className="border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:px-5 sm:py-3.5 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl self-start sm:self-auto">
            {READ_STATUS_TABS.map((tab) => {
              const isActive = activeStatusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleStatusTabClick(tab.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 select-none flex items-center gap-1.5',
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'false' && unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#635BFF] text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Type Filter & Quick Actions */}
          <div className="flex items-center gap-3">
            <div className="w-full sm:w-52">
              <Select
                value={activeTypeFilter}
                onChange={handleTypeSelectChange}
                options={TYPE_FILTER_OPTIONS}
                placeholder=""
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={X}
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 shrink-0"
              >
                Reset
              </Button>
            )}

            {unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onMarkAllAsRead}
                leftIcon={CheckCheck}
                className="text-xs shrink-0 text-[#635BFF] hover:text-[#5148E5]"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Main Activity Feed Container ───────────────────────────────────── */}
      <Card className="border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Loading Skeleton */}
        {isLoading && notifications.length === 0 && (
          <div className="divide-y divide-slate-100 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-4 p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-3 bg-slate-100 rounded-md w-16" />
                  </div>
                  <div className="h-3 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-5 bg-slate-100 rounded-md w-1/4 mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mb-3.5 shadow-2xs">
              <Bell className="w-6 h-6 text-rose-500" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">
              Unable to load notifications
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-5 leading-relaxed">
              {error}
            </p>
            {onRetry && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={RotateCw}
                onClick={onRetry}
              >
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-center mb-3.5 shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-[#635BFF]" />
            </div>
            <h4 className="text-base font-semibold text-slate-900 mb-1">
              {hasActiveFilters ? 'No matching notifications' : "You're all caught up"}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
              {hasActiveFilters
                ? 'No notifications match your current filter selections. Try selecting another status or event category.'
                : 'New activity will appear here when tasks are assigned, updated, or require your attention.'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Grouped Notification Feed */}
        {!error && notifications.length > 0 && (
          <div className={cn('divide-y divide-slate-100', isLoading && 'opacity-60 pointer-events-none')}>
            {timeGroups.map((group) => (
              <div key={group.title} className="space-y-0">
                {/* Group Time Header */}
                <div className="sticky top-0 z-10 px-5 py-2.5 bg-slate-50/90 backdrop-blur-xs border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {group.title}
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>

                {/* Items in this group */}
                <div role="list" className="divide-y divide-slate-100/80">
                  {group.items.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!error && pagination && pagination.total > 0 && (
          <div className="border-t border-slate-100">
            <Pagination
              totalItems={pagination.total}
              currentPage={pagination.page}
              pageSize={pagination.limit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
