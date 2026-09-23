import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { analyticsApi } from '@/api/endpoints/analytics'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Loading'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/forms/Select'
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Target,
  FolderOpen,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

/* ─── colour constants ─── */
const STATUS_COLORS = {
  TODO: '#6366f1',
  IN_PROGRESS: '#f59e0b',
  BLOCKED: '#ef4444',
  COMPLETED: '#10b981',
  CANCELLED: '#94a3b8',
}

const PRIORITY_COLORS = {
  LOW: '#6ee7b7',
  MEDIUM: '#fbbf24',
  HIGH: '#f97316',
  URGENT: '#ef4444',
}

const DEADLINE_COLORS = {
  overdue: '#ef4444',
  dueToday: '#f59e0b',
  dueSoon: '#6366f1',
  withoutDeadline: '#94a3b8',
}

/* ─── tiny stat card ─── */
function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow hover:shadow-sm">
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ─── donut center label ─── */
function DonutCenterLabel({ value }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
      <tspan x="50%" dy="-0.3em" className="fill-slate-900 text-xl font-bold">
        {value}%
      </tspan>
      <tspan x="50%" dy="1.4em" className="fill-slate-500 text-xs">
        Completed
      </tspan>
    </text>
  )
}

/* ─── custom tooltip ─── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      {label && <p className="font-semibold text-slate-800 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-slate-600">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <strong className="text-slate-900">{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* ─── skeleton grid ─── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

/* ─── format status label ─── */
function formatLabel(str) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS PAGE
   ═══════════════════════════════════════════════════════════════ */
export function AnalyticsPage() {
  const { user } = useAuth()
  const [taskAnalytics, setTaskAnalytics] = useState(null)
  const [projectAnalytics, setProjectAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const isManagement =
    user?.role &&
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD].includes(user.role)

  const loadAnalytics = useCallback(async () => {
    try {
      const [taskRes, projectRes] = await Promise.all([
        analyticsApi.getTaskAnalytics(),
        analyticsApi.getProjectAnalytics(),
      ])
      setTaskAnalytics(taskRes?.data?.analytics || taskRes?.analytics || taskRes?.data || taskRes)
      setProjectAnalytics(projectRes?.data || projectRes)
      setError(null)
    } catch (err) {
      console.error('Analytics load failed:', err)
      setError(err.message || 'Unable to load analytics data.')
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAnalytics()
    setIsRefreshing(false)
  }

  const handleRetry = async () => {
    setIsLoading(true)
    setError(null)
    await loadAnalytics()
    setIsLoading(false)
  }

  useEffect(() => {
    let ignore = false
    async function init() {
      await loadAnalytics()
      if (!ignore) setIsLoading(false)
    }
    init()
    return () => { ignore = true }
  }, [loadAnalytics])

  /* Loading */
  if (isLoading) return <AnalyticsSkeleton />

  /* Error */
  if (error) {
    return (
      <div className="py-12">
        <ErrorState title="Analytics Unavailable" message={error} onRetry={handleRetry} retryLabel="Reload Analytics" />
      </div>
    )
  }

  /* ── data extraction ── */
  const overview = taskAnalytics?.overview || {}
  const byStatus = taskAnalytics?.byStatus || {}
  const byPriority = taskAnalytics?.byPriority || {}
  const deadlines = taskAnalytics?.deadlines || {}
  const scope = taskAnalytics?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  const projOverview = projectAnalytics?.overview || {}
  const projByStatus = projectAnalytics?.byStatus || {}
  const projTaskStats = projectAnalytics?.taskStatistics || {}
  const projects = projectAnalytics?.projects || []

  /* chart data */
  const statusData = Object.entries(byStatus).map(([name, value]) => ({
    name: formatLabel(name),
    value,
    fill: STATUS_COLORS[name] || '#94a3b8',
  }))

  const priorityData = Object.entries(byPriority).map(([name, value]) => ({
    name: formatLabel(name),
    value,
    fill: PRIORITY_COLORS[name] || '#94a3b8',
  }))

  const deadlineData = [
    { name: 'Overdue', value: deadlines.overdue || 0, fill: DEADLINE_COLORS.overdue },
    { name: 'Due Today', value: deadlines.dueToday || 0, fill: DEADLINE_COLORS.dueToday },
    { name: 'Due Soon', value: deadlines.dueSoon || 0, fill: DEADLINE_COLORS.dueSoon },
    { name: 'No Deadline', value: deadlines.withoutDeadline || 0, fill: DEADLINE_COLORS.withoutDeadline },
  ]

  const projectStatusData = Object.entries(projByStatus).map(([name, value]) => ({
    name: formatLabel(name),
    value,
    fill: STATUS_COLORS[name] || '#94a3b8',
  }))

  const projectCompletionData = projects
    .slice(0, 10)
    .map((p) => ({
      name: p.code || p.name?.substring(0, 12),
      completed: p.completedTasks || 0,
      incomplete: p.incompleteTasks || 0,
      total: p.totalTasks || 0,
    }))

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <PageHeader
        title="Analytics"
        description={`${scope === 'ORGANIZATION' ? 'Organization-wide' : 'Personal'} task and project insights.`}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Analytics' },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RefreshCw}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh
          </Button>
        }
      />

      {/* Scope badge */}
      <div className="flex items-center gap-2">
        <Badge variant={scope === 'ORGANIZATION' ? 'primary' : 'info'} dot>
          {scope === 'ORGANIZATION' ? 'Organization Scope' : 'Personal Scope'}
        </Badge>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Tasks" value={overview.total ?? 0} color="#6366f1" />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={overview.completed ?? 0}
          color="#10b981"
          subtitle={`${overview.completionPercentage ?? 0}% completion rate`}
        />
        <StatCard icon={Clock} label="Incomplete" value={overview.incomplete ?? 0} color="#f59e0b" />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={deadlines.overdue ?? 0}
          color="#ef4444"
          subtitle={deadlines.dueToday ? `${deadlines.dueToday} due today` : undefined}
        />
      </div>

      {/* ── Status & Priority Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Task Status Distribution
              </span>
            </CardTitle>
            <CardDescription>Breakdown of tasks by current status</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[280px]">
            {overview.total > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <text x="50%" y="47%" textAnchor="middle" dominantBaseline="central">
                    <tspan className="fill-slate-900 text-xl font-bold">
                      {overview.completionPercentage ?? 0}%
                    </tspan>
                  </text>
                  <text x="50%" y="55%" textAnchor="middle" dominantBaseline="central">
                    <tspan className="fill-slate-500 text-[11px]">Completed</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={PieChartIcon}
                title="No tasks yet"
                description="Create tasks to see status analytics."
              />
            )}
          </CardContent>
        </Card>

        {/* Priority Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Priority Distribution
              </span>
            </CardTitle>
            <CardDescription>Task counts by priority level</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[280px]">
            {overview.total > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priorityData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No priority data"
                description="Task priorities will appear as tasks are created."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Deadline Stats ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Deadline Overview
            </span>
          </CardTitle>
          <CardDescription>Active task deadline distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {deadlineData.map((d) => (
              <div
                key={d.name}
                className="flex flex-col items-center p-4 rounded-xl border border-slate-100 bg-slate-50/40"
              >
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: d.fill }}
                >
                  {d.value}
                </span>
                <span className="text-xs font-medium text-slate-500 mt-1">{d.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Project Analytics Section ── */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-indigo-500" />
          Project Analytics
        </h2>

        {/* Project KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderOpen} label="Total Projects" value={projOverview.totalProjects ?? 0} color="#6366f1" />
          <StatCard icon={TrendingUp} label="Active" value={projOverview.activeProjects ?? 0} color="#10b981" />
          <StatCard icon={CheckCircle2} label="Completed" value={projOverview.completedProjects ?? 0} color="#059669" />
          <StatCard
            icon={Target}
            label="Task Completion"
            value={`${projOverview.completionPercentage ?? 0}%`}
            color="#f59e0b"
            subtitle={`${projOverview.completedTasks ?? 0} / ${projOverview.totalTasks ?? 0} tasks`}
          />
        </div>

        {/* Project Completion Bar Chart */}
        {projectCompletionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Task Completion by Project
                </span>
              </CardTitle>
              <CardDescription>Top projects by task count</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectCompletionData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="incomplete" name="Incomplete" fill="#e2e8f0" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Projects Table */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Breakdown</CardTitle>
              <CardDescription>{projects.length} projects in scope</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Completion
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <tr key={p.projectId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">
                        <div>
                          <span>{p.name}</span>
                          {p.code && (
                            <span className="ml-2 text-xs text-slate-400 font-mono">{p.code}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          size="sm"
                          variant={
                            p.status === 'ACTIVE'
                              ? 'success'
                              : p.status === 'COMPLETED'
                              ? 'primary'
                              : p.status === 'ON_HOLD'
                              ? 'warning'
                              : p.status === 'CANCELLED'
                              ? 'danger'
                              : 'neutral'
                          }
                          dot
                        >
                          {formatLabel(p.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-600">{p.totalTasks}</td>
                      <td className="px-6 py-3 text-right tabular-nums text-slate-600">{p.completedTasks}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${p.completionPercentage}%`,
                                backgroundColor: p.completionPercentage >= 75 ? '#10b981' : p.completionPercentage >= 40 ? '#f59e0b' : '#6366f1',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-700 tabular-nums w-10 text-right">
                            {p.completionPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
