import { TaskAssignee } from '../TaskAssignee'
import { formatDateTime } from '@/utils/formatters'
import {
  PlusCircle,
  FileEdit,
  UserCheck,
  Users,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
} from 'lucide-react'

const ACTION_CONFIG = {
  TASK_CREATED: {
    label: 'created this task',
    Icon: PlusCircle,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  TASK_UPDATED: {
    label: 'updated task details',
    Icon: FileEdit,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  TASK_ASSIGNED: {
    label: 'assigned this task',
    Icon: UserCheck,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  TASK_REASSIGNED: {
    label: 'reassigned this task',
    Icon: Users,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  TASK_STATUS_CHANGED: {
    label: 'changed status',
    Icon: ShieldCheck,
    color: 'text-violet-600 bg-violet-50 border-violet-200',
  },
  TASK_PRIORITY_CHANGED: {
    label: 'changed priority',
    Icon: AlertTriangle,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  TASK_DUE_DATE_CHANGED: {
    label: 'updated due date',
    Icon: Calendar,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  TASK_COMPLETED: {
    label: 'marked task completed',
    Icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  TASK_CANCELLED: {
    label: 'cancelled task',
    Icon: XCircle,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  COMMENT_CREATED: {
    label: 'added a comment',
    Icon: MessageSquare,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
  COMMENT_UPDATED: {
    label: 'edited a comment',
    Icon: MessageSquare,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  },
  COMMENT_DELETED: {
    label: 'deleted a comment',
    Icon: MessageSquare,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
}

export function ActivityItem({ activity, isLast = false }) {
  if (!activity) return null

  const config = ACTION_CONFIG[activity.action] || {
    label: activity.action.replace(/_/g, ' ').toLowerCase(),
    Icon: Clock,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
  }
  const Icon = config.Icon

  const userName = activity.user
    ? `${activity.user.firstName} ${activity.user.lastName}`.trim()
    : 'System'

  return (
    <div className="relative flex items-start gap-3.5 group">
      {/* Timeline vertical connector line */}
      {!isLast && (
        <span
          className="absolute left-4 top-8 -bottom-3 w-0.5 bg-slate-200 group-last:hidden"
          aria-hidden="true"
        />
      )}

      {/* Action Icon Badge */}
      <div
        className={`relative z-10 w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-xs ${config.color}`}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5 pb-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold text-slate-900">{userName}</span>
          <span className="text-slate-500">{config.label}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {formatDateTime(activity.createdAt)}
          </span>
        </div>

        {/* Detailed description if different from action label */}
        {activity.description && (
          <p className="text-xs text-slate-600 mt-1 bg-slate-50/70 border border-slate-100 rounded-lg p-2 leading-relaxed">
            {activity.description}
          </p>
        )}

        {/* Metadata display if available */}
        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {activity.metadata.from && activity.metadata.to && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">
                <span className="text-slate-400">{activity.metadata.from}</span>
                <span>→</span>
                <span className="font-semibold text-indigo-600">{activity.metadata.to}</span>
              </span>
            )}
            {activity.metadata.priority && (
              <span className="inline-flex text-[11px] font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-600">
                Priority: <strong className="ml-1 text-slate-800">{activity.metadata.priority}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
