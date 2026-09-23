import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Activity, Clock, CheckCircle2, MessageSquare } from 'lucide-react'
import { formatDateTime, formatRole } from '@/utils/formatters'

const ACTION_ICONS = {
  CREATE: CheckCircle2,
  UPDATE: Clock,
  COMMENT: MessageSquare,
  STATUS: Activity,
  DEFAULT: Activity,
}

export function RecentActivityFeed({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Recent Activity Audit
          </CardTitle>
          <CardDescription>Real-time audit log of team task interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Activity}
            title="No Recent Activity Logged"
            description="Operational activity records will appear here as tasks and projects are updated."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          Recent Activity Audit
        </CardTitle>
        <CardDescription>
          Real-time audit trail of task operations across your workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {activities.map((item) => {
            const userName = item.user
              ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim()
              : 'System User'
            const userInitials = item.user?.firstName
              ? item.user.firstName.charAt(0)
              : 'U'
            const Icon = ACTION_ICONS[item.action] || ACTION_ICONS.DEFAULT

            return (
              <div
                key={item.id}
                className="p-4 sm:px-6 hover:bg-slate-50/60 transition-colors flex items-start gap-3.5"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-2xs">
                  {userInitials}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900">{userName}</span>
                      {item.user?.role && (
                        <Badge variant="neutral" size="sm">
                          {formatRole(item.user.role)}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 inline" />
                    <span>
                      <span className="font-semibold text-slate-800">
                        {item.action ? item.action.replace(/_/g, ' ') : 'Modified task'}
                      </span>
                      {item.details && ` — ${item.details}`}
                    </span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
