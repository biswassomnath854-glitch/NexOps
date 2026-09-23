import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Settings,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { notificationsApi } from '@/api/endpoints/notifications'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const DROPDOWN_PAGE_SIZE = 8
const POLL_INTERVAL_MS = 60_000

/**
 * NotificationBell — the bell icon button with animated unread badge.
 */
export function NotificationBell({ unreadCount, isOpen, onClick }) {
  return (
    <button
      type="button"
      id="notification-bell-btn"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      className={cn(
        'relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
        isOpen && 'bg-slate-100 text-slate-900'
      )}
    >
      <Bell className="w-5 h-5" />

      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1 right-1 flex items-center justify-center',
            unreadCount > 9 ? 'min-w-[16px] h-4 rounded-full px-1 -top-0.5 -right-0.5' : 'h-2 w-2'
          )}
        >
          {unreadCount > 9 ? (
            <span className="relative inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold ring-2 ring-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-2 ring-white" />
            </>
          )}
        </span>
      )}
    </button>
  )
}

/**
 * NotificationDropdown — the popover panel shown when the bell is clicked.
 *
 * Fetches recent notifications from the API, supports:
 *   - unread count badge on bell
 *   - mark individual notification as read (on click)
 *   - mark all as read
 *   - navigate to notification center
 *   - navigate to preferences
 *
 * Pulls live data from the backend; does NOT rely on mock state.
 */
export function NotificationDropdown() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const menuRef = useRef(null)

  // ── Fetch unread count (polling) ──────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      setUnreadCount(res?.data?.unreadCount ?? 0)
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // ── Fetch notifications when dropdown opens ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    async function fetchDropdownItems() {
      setIsLoading(true)
      try {
        const res = await notificationsApi.getNotifications({ limit: DROPDOWN_PAGE_SIZE, page: 1 })
        if (isMounted) {
          const items = res?.data?.notifications || []
          setNotifications(items)
          const unread = items.filter((n) => !n.isRead).length
          setUnreadCount((prev) => {
            // Use the fresh server count if available
            return res?.data?.pagination ? prev : unread
          })
        }
      } catch {
        // Gracefully fall through — keep stale state if any
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchDropdownItems()
    return () => { isMounted = false }
  }, [isOpen])

  // ── Close on outside click or Escape ─────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // ── Mark individual as read ───────────────────────────────────────────────
  const handleItemClick = async (notification) => {
    setIsOpen(false)
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id)
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // Best-effort
      }
    }
    // Navigate if there's a related task or project
    if (notification.taskId) {
      navigate(ROUTES.TASK_DETAILS(notification.taskId))
    } else if (notification.projectId) {
      navigate(ROUTES.PROJECT_DETAILS(notification.projectId))
    } else {
      navigate(ROUTES.NOTIFICATIONS)
    }
  }

  // ── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true)
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // Best-effort fallback
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <NotificationBell
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      />

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            'absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200/80 z-50 overflow-hidden',
            'animate-in fade-in zoom-in-95 duration-150'
          )}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <Badge variant="danger" size="sm" className="px-1.5 py-0 text-[10px]">
                  {unreadCount} new
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* ── List ───────────────────────────────────────────────────── */}
          <div className="max-h-[360px] overflow-y-auto">
            {/* Loading skeleton */}
            {isLoading && notifications.length === 0 && (
              <div className="divide-y divide-slate-100">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-3.5 py-3 animate-pulse">
                    <div className="w-7 h-7 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                      <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Refresh overlay */}
            {isLoading && notifications.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/60 border-b border-indigo-100/60">
                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                <span className="text-[11px] text-indigo-600">Refreshing…</span>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400 font-medium">You're all caught up</p>
                <p className="text-[11px] text-slate-300 mt-0.5">No notifications to show</p>
              </div>
            )}

            {/* Items */}
            {notifications.length > 0 && (
              <div
                role="list"
                className={cn('divide-y divide-slate-100', isLoading && 'opacity-60')}
              >
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    compact
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <Link
              to={ROUTES.NOTIFICATIONS}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
              to={ROUTES.NOTIFICATION_PREFERENCES}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              title="Notification preferences"
            >
              <Settings className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
