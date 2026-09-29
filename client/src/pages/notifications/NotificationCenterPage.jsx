import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, RotateCw, Settings } from 'lucide-react'
import { NotificationList } from '@/components/notifications/NotificationList'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { notificationsApi } from '@/api/endpoints/notifications'
import { ROUTES } from '@/constants/routes'

const DEFAULT_FILTERS = {
  page: 1,
  limit: 20,
  isRead: undefined,
  type: undefined,
}

/**
 * NotificationCenterPage — Full Operational Activity Center at /notifications.
 */
export function NotificationCenterPage() {
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4000)
  }

  // ── Load unread count ─────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      setUnreadCount(res?.data?.unreadCount ?? 0)
    } catch {
      // Non-critical
    }
  }, [])

  // ── Load notifications ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (queryFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = Object.fromEntries(
        Object.entries(queryFilters).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      const res = await notificationsApi.getNotifications(params)
      const data = res?.data || {}
      setNotifications(data.notifications || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch (err) {
      const status = err?.status
      if (status === 401 || status === 403) {
        setError('You do not have permission to view notifications.')
      } else {
        setError(err?.message || 'Failed to load notifications.')
      }
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(filters)
  }, [filters, fetchNotifications])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFiltersChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }))
  }

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      showFeedback(err?.message || 'Failed to mark as read.', 'error')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
      showFeedback('All notifications marked as read.')
    } catch (err) {
      showFeedback(err?.message || 'Failed to mark all as read.', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationsApi.deleteNotification(id)
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id)
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      showFeedback('Notification deleted.')
    } catch (err) {
      showFeedback(err?.message || 'Failed to delete notification.', 'error')
    }
  }

  const handleRetry = () => {
    fetchNotifications(filters)
    fetchUnreadCount()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Operational Page Header ── */}
      <PageHeader
        title="Notifications"
        description="Stay informed about changes, assignments, deadlines, and activity across your workspace."
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Notifications' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {unreadCount > 0 ? (
              <Badge variant="primary" size="md" dot>
                {unreadCount} Unread {unreadCount === 1 ? 'Notice' : 'Notices'}
              </Badge>
            ) : (
              <Badge variant="neutral" size="md">
                Inbox Caught Up
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              isLoading={isLoading}
              leftIcon={RotateCw}
              className="text-xs"
            >
              Refresh
            </Button>

            <Link to={ROUTES.NOTIFICATION_PREFERENCES}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Settings}
                className="text-xs"
              >
                Preferences
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Feedback Notification Toast ── */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold animate-in slide-in-from-top-2 shadow-2xs ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0" />
          {feedback.message}
        </div>
      )}

      {/* ── Paginated Activity Feed ── */}
      <NotificationList
        notifications={notifications}
        pagination={pagination}
        isLoading={isLoading}
        error={error}
        unreadCount={unreadCount}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onRetry={handleRetry}
      />
    </div>
  )
}
