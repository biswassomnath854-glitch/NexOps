/**
 * Notification type metadata — icons, colors, labels, and category info.
 * Aligned with the Notification model ENUM values on the backend.
 */

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_REASSIGNED: 'TASK_REASSIGNED',
  TASK_STATUS_CHANGED: 'TASK_STATUS_CHANGED',
  TASK_COMMENTED: 'TASK_COMMENTED',
  TASK_MENTIONED: 'TASK_MENTIONED',
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  TASK_OVERDUE: 'TASK_OVERDUE',
  TASK_COMPLETED: 'TASK_COMPLETED',
}

/**
 * Maps notification types to display metadata for the UI.
 */
export const NOTIFICATION_TYPE_META = {
  TASK_ASSIGNED: {
    label: 'Task Assigned',
    color: 'indigo',
    iconBg: 'bg-indigo-100 text-indigo-600',
    dotColor: 'bg-indigo-500',
    badgeVariant: 'primary',
  },
  TASK_REASSIGNED: {
    label: 'Task Reassigned',
    color: 'violet',
    iconBg: 'bg-violet-100 text-violet-600',
    dotColor: 'bg-violet-500',
    badgeVariant: 'primary',
  },
  TASK_STATUS_CHANGED: {
    label: 'Status Changed',
    color: 'sky',
    iconBg: 'bg-sky-100 text-sky-600',
    dotColor: 'bg-sky-500',
    badgeVariant: 'info',
  },
  TASK_COMMENTED: {
    label: 'Comment Added',
    color: 'slate',
    iconBg: 'bg-slate-100 text-slate-600',
    dotColor: 'bg-slate-500',
    badgeVariant: 'neutral',
  },
  TASK_MENTIONED: {
    label: 'Mentioned',
    color: 'amber',
    iconBg: 'bg-amber-100 text-amber-600',
    dotColor: 'bg-amber-500',
    badgeVariant: 'warning',
  },
  TASK_DUE_SOON: {
    label: 'Due Soon',
    color: 'amber',
    iconBg: 'bg-amber-100 text-amber-700',
    dotColor: 'bg-amber-500',
    badgeVariant: 'warning',
  },
  TASK_OVERDUE: {
    label: 'Overdue',
    color: 'rose',
    iconBg: 'bg-rose-100 text-rose-600',
    dotColor: 'bg-rose-500',
    badgeVariant: 'danger',
  },
  TASK_COMPLETED: {
    label: 'Task Completed',
    color: 'emerald',
    iconBg: 'bg-emerald-100 text-emerald-600',
    dotColor: 'bg-emerald-500',
    badgeVariant: 'success',
  },
}

/**
 * Maps backend camelCase preference field names to notification types.
 * Aligned with NotificationPreference model and notificationPreferenceService.
 */
export const PREFERENCE_FIELDS = [
  {
    key: 'taskAssigned',
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    label: 'Task Assigned',
    description: 'Notify when a task is assigned to you.',
  },
  {
    key: 'taskReassigned',
    type: NOTIFICATION_TYPES.TASK_REASSIGNED,
    label: 'Task Reassigned',
    description: 'Notify when a task is reassigned to you from another member.',
  },
  {
    key: 'taskStatusChanged',
    type: NOTIFICATION_TYPES.TASK_STATUS_CHANGED,
    label: 'Task Status Changed',
    description: 'Notify when the status of your task changes.',
  },
  {
    key: 'taskCommented',
    type: NOTIFICATION_TYPES.TASK_COMMENTED,
    label: 'New Comment',
    description: 'Notify when someone comments on your task.',
  },
  {
    key: 'taskMentioned',
    type: NOTIFICATION_TYPES.TASK_MENTIONED,
    label: 'Mentioned in Task',
    description: 'Notify when you are mentioned in a task or comment.',
  },
  {
    key: 'taskDueSoon',
    type: NOTIFICATION_TYPES.TASK_DUE_SOON,
    label: 'Task Due Soon',
    description: 'Notify when your task deadline is approaching.',
  },
  {
    key: 'taskOverdue',
    type: NOTIFICATION_TYPES.TASK_OVERDUE,
    label: 'Task Overdue',
    description: 'Notify when a task assigned to you has passed its deadline.',
  },
  {
    key: 'taskCompleted',
    type: NOTIFICATION_TYPES.TASK_COMPLETED,
    label: 'Task Completed',
    description: 'Notify when a task you created or are associated with is marked complete.',
  },
]
