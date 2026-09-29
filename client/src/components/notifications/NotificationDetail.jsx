import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  ArrowRightLeft,
  MessageSquare,
  AtSign,
  Clock,
  FolderKanban,
  Check,
} from 'lucide-react'
import { notificationsApi } from '@/api/endpoints/notifications'
import { NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { cn } from '@/utils/cn'
import { formatDateTime } from '@/utils/formatters'

const ICONS = {
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
 * NotificationDetail — full view for a single notification record.
 */
export function NotificationDetail({ notificationId, onDeleted }) {
  const navigate = useNavigate()
  const [notification, setNotification] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await notificationsApi.getNotificationById(notificationId)
        if (isMounted) {
          const n = res?.data?.notification || res?.data || res
          setNotification(n)
          // Auto-mark as read when detail is viewed
          if (n && !n.isRead) {
            try {
              await notificationsApi.markAsRead(notificationId)
              if (isMounted) {
                setNotification((prev) => ({ ...prev, isRead: true, readAt: new Date().toISOString() }))
              }
            } catch {
              // Best-effort
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load notification.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (notificationId) load()
    return () => { isMounted = false }
  }, [notificationId])

  const handleMarkRead = async () => {
    if (!notification || notification.isRead) return
    setIsMarkingRead(true)
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotification((prev) => ({ ...prev, isRead: true, readAt: new Date().toISOString() }))
    } catch {
      // Best-effort
    } finally {
      setIsMarkingRead(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await notificationsApi.deleteNotification(notificationId)
      setDeleteConfirmOpen(false)
      onDeleted?.()
    } catch (err) {
      setError(err?.message || 'Failed to delete notification.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleNavigateToTarget = () => {
    if (!notification) return
    if (notification.taskId) {
      navigate(ROUTES.TASK_DETAILS(notification.taskId))
    } else if (notification.projectId) {
      navigate(ROUTES.PROJECT_DETAILS(notification.projectId))
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="border-slate-200/80">
        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading notification details…</p>
        </CardContent>
      </Card>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card className="border-slate-200/80">
        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">Unable to Load Notification</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!notification) return null

  const meta = NOTIFICATION_TYPE_META[notification.type] || NOTIFICATION_TYPE_META.TASK_ASSIGNED
  const IconComponent = ICONS[notification.type] || Clock
  const hasNavTarget = Boolean(notification.taskId || notification.projectId)

  return (
    <>
      <div className="space-y-4">
        {/* ── Header card ── */}
        <Card className="border-slate-200/80 shadow-2xs overflow-hidden">
          <div
            className={cn(
              'h-1.5 w-full',
              notification.type === 'TASK_OVERDUE'
                ? 'bg-rose-500'
                : notification.type === 'TASK_COMPLETED'
                ? 'bg-emerald-500'
                : notification.type === 'TASK_DUE_SOON'
                ? 'bg-amber-500'
                : 'bg-[#635BFF]'
            )}
          />
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs',
                  meta.iconBg
                )}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge variant={meta.badgeVariant} size="sm">
                    {meta.label}
                  </Badge>
                  {notification.isRead ? (
                    <Badge variant="success" size="sm" dot>
                      Read
                    </Badge>
                  ) : (
                    <Badge variant="primary" size="sm" dot>
                      Unread
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {notification.title}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {notification.message}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-4 text-xs text-slate-400 font-mono">
                  <span>
                    <span className="font-sans font-medium text-slate-500">Received:</span>{' '}
                    {formatDateTime(notification.createdAt)}
                  </span>
                  {notification.isRead && notification.readAt && (
                    <span>
                      <span className="font-sans font-medium text-slate-500">Read:</span>{' '}
                      {formatDateTime(notification.readAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkRead}
                    isLoading={isMarkingRead}
                    leftIcon={Check}
                    className="text-xs"
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Actor Context ── */}
        {notification.actor && (
          <Card className="border-slate-200/80 shadow-2xs">
            <CardContent className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Triggered By
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#635BFF] to-[#5148E5] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {notification.actor.firstName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {notification.actor.firstName} {notification.actor.lastName}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{notification.actor.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Related Object Context ── */}
        {(notification.task || notification.project) && (
          <Card className="border-slate-200/80 shadow-2xs">
            <CardContent className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Related Workspace Object
              </p>
              <div className="space-y-3">
                {notification.task && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Task</p>
                      <p className="text-sm font-semibold text-slate-900">{notification.task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                          {notification.task.status?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono uppercase">
                          {notification.task.priority}
                        </span>
                      </div>
                    </div>
                    {hasNavTarget && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigateToTarget}
                        rightIcon={ExternalLink}
                        className="text-xs shrink-0"
                      >
                        Open Task
                      </Button>
                    )}
                  </div>
                )}

                {notification.project && (
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Project</p>
                      <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-emerald-600" />
                        <span>{notification.project.name}</span>
                        {notification.project.code && (
                          <span className="text-xs text-slate-400 font-mono">
                            [{notification.project.code}]
                          </span>
                        )}
                      </p>
                    </div>
                    {!notification.task && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNavigateToTarget}
                        rightIcon={ExternalLink}
                        className="text-xs shrink-0"
                      >
                        Open Project
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            leftIcon={ArrowLeft}
            className="text-slate-500"
          >
            Back to Notifications
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to permanently delete this notification? This action cannot be undone."
        confirmText="Delete"
        tone="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
