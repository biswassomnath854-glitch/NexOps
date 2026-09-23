import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Clock,
  AlertOctagon,
  Calendar,
  Layers,
  Circle,
  ShieldAlert,
} from 'lucide-react'

export function TaskStatusBreakdown({ taskStatistics, projectStatistics }) {
  const byStatus = taskStatistics?.byStatus || {}
  const byPriority = taskStatistics?.byPriority || {}
  const deadlines = taskStatistics?.deadlines || {}
  const projectsByStatus = projectStatistics?.byStatus || {}

  const totalTasks = Object.values(byStatus).reduce((a, b) => a + Number(b), 0)

  const statusConfig = [
    { key: 'TODO', label: 'To Do', count: byStatus.TODO || 0, color: 'bg-slate-400', badge: 'neutral' },
    { key: 'IN_PROGRESS', label: 'In Progress', count: byStatus.IN_PROGRESS || 0, color: 'bg-indigo-600', badge: 'primary' },
    { key: 'BLOCKED', label: 'Blocked', count: byStatus.BLOCKED || 0, color: 'bg-rose-600', badge: 'danger' },
    { key: 'COMPLETED', label: 'Completed', count: byStatus.COMPLETED || 0, color: 'bg-emerald-600', badge: 'success' },
    { key: 'CANCELLED', label: 'Cancelled', count: byStatus.CANCELLED || 0, color: 'bg-slate-300', badge: 'neutral' },
  ]

  const priorityConfig = [
    { key: 'LOW', label: 'Low', count: byPriority.LOW || 0, color: 'bg-slate-300', badge: 'neutral' },
    { key: 'MEDIUM', label: 'Medium', count: byPriority.MEDIUM || 0, color: 'bg-sky-500', badge: 'info' },
    { key: 'HIGH', label: 'High', count: byPriority.HIGH || 0, color: 'bg-amber-500', badge: 'warning' },
    { key: 'URGENT', label: 'Urgent', count: byPriority.URGENT || 0, color: 'bg-rose-600', badge: 'danger' },
  ]

  const deadlineConfig = [
    { key: 'overdue', label: 'Overdue', count: deadlines.overdue || 0, icon: AlertOctagon, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { key: 'dueToday', label: 'Due Today', count: deadlines.dueToday || 0, icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'dueSoon', label: 'Due in 3 Days', count: deadlines.dueSoon || 0, icon: Calendar, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { key: 'withoutDeadline', label: 'No Deadline', count: deadlines.withoutDeadline || 0, icon: Circle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Status Pipeline Breakdown */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Task Status Pipelines
          </CardTitle>
          <CardDescription>
            Live status distribution across {totalTasks} active tasks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusConfig.map((item) => {
            const percentage = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0
            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="text-slate-400 font-mono">({item.count})</span>
                  </div>
                  <Badge variant={item.badge} size="sm">
                    {percentage}%
                  </Badge>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${item.color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 2. Priority & Project Status */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            Priority Distribution
          </CardTitle>
          <CardDescription>
            Allocation of task priorities and project milestones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Task Priorities
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {priorityConfig.map((item) => (
              <div
                key={item.key}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  <Badge variant={item.badge} size="sm" dot />
                </div>
                <p className="text-xl font-bold text-slate-900 mt-2">{item.count}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Project States
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active: {projectsByStatus.ACTIVE || 0}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                Planning: {projectsByStatus.PLANNING || 0}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                On Hold: {projectsByStatus.ON_HOLD || 0}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                Done: {projectsByStatus.COMPLETED || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Deadline Urgency Monitors */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Deadline Urgency Monitors
          </CardTitle>
          <CardDescription>
            Automated milestone and delivery target schedule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {deadlineConfig.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-3 rounded-xl border ${item.color} transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/80 shadow-2xs shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{item.label}</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Active Sprint Items</p>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono">{item.count}</span>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
