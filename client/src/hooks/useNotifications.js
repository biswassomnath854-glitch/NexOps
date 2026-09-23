import { useState, useEffect, useCallback, useRef } from 'react'
import { notificationsApi } from '@/api/endpoints/notifications'

const POLL_INTERVAL_MS = 60_000 // 1 minute

/**
 * useNotifications — shared hook for notification state.
 *
 * Fetches unread count on mount and polls every 60 seconds.
 * Exposes helpers to refresh, mark-as-read, mark-all-as-read, and delete.
 */
export function useNotifications({ autoFetch = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // ── Fetch unread count ────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      if (isMountedRef.current) {
        setUnreadCount(res?.data?.unreadCount ?? 0)
      }
    } catch {
      // Silently fail — badge count is non-critical
    }
  }, [])

  // ── Fetch paginated notifications ─────────────────────────────────────────
  const fetchNotifications = useCallback(async (params = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.getNotifications(params)
      if (isMountedRef.current) {
        const data = res?.data || {}
        setNotifications(data.notifications || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
        // Unread count is authoritative only from fetchUnreadCount() which uses the dedicated
        // /notifications/count endpoint. Do not override it from paginated list data, since
        // the list may be filtered and pagination.total would reflect filtered results.
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to load notifications.')
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // ── Mark one as read ──────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      throw err
    }
  }, [])

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      throw err
    }
  }, [])

  // ── Delete notification ───────────────────────────────────────────────────
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationsApi.deleteNotification(notificationId)
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === notificationId)
        if (removed && !removed.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1))
        }
        return prev.filter((n) => n.id !== notificationId)
      })
    } catch (err) {
      throw err
    }
  }, [])

  // ── Auto-mount + polling ──────────────────────────────────────────────────
  useEffect(() => {
    if (!autoFetch) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [autoFetch, fetchUnreadCount])

  return {
    unreadCount,
    setUnreadCount,
    notifications,
    setNotifications,
    pagination,
    isLoading,
    error,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
