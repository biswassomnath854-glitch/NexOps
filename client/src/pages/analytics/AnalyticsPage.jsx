import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { analyticsApi } from '@/api/endpoints/analytics'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { PageHeader } from '@/components/common/PageHeader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/forms/Select'
import {
  InsightMetricCard,
  DistributionBar,
  InsightSection,
  InsightEmptyState,
} from '@/components/insights'
import {
  BarChart3,
  RotateCw,
  Target,
  FolderOpen,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  X,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'

/* ─── Semantic Design System Colors ─── */
const STATUS_META = {
  TODO: { label: 'To Do', color: '#94A3B8' },
  IN_PROGRESS: { label: 'In Progress', color: '#635BFF' },
  BLOCKED: { label: 'Blocked', color: '#DC2626' },
  COMPLETED: { label: 'Completed', color: '#16A34A' },
  CANCELLED: { label: 'Cancelled', color: '#CBD5E1' },
}

const PRIORITY_META = {
  LOW: { label: 'Low', color: '#38BDF8' },
  MEDIUM: { label: 'Medium', color: '#64748B' },
  HIGH: { label: 'High', color: '#D97706' },
  URGENT: { label: 'Urgent', color: '#DC2626' },
}

/* ─── Tooltip matching SB Pvt. Ltd. design language ─── */
function AnalyticsChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 shadow-lg text-xs">
      {label && <p className="font-semibold text-slate-900 pb-1 mb-1.5 border-b border-slate-100">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill || entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <strong className="text-slate-900 font-mono tabular-nums">{entry.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Skeleton Loading State ─── */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-48 bg-slate-200/80 rounded-lg" />
      </div>

      {/* KPI Ribbon skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-slate-200/80 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-14 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Distribution grids skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-xl border border-slate-200/80 bg-white p-6" />
        <div className="h-80 rounded-xl border border-slate-200/80 bg-white p-6" />
      </div>

      {/* Project analytics skeleton */}
      <div className="h-96 rounded-xl border border-slate-200/80 bg-white p-6" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS PAGE
   ═══════════════════════════════════════════════════════════════ */
export function AnalyticsPage() {
  const { user } = useAuth()
  const [taskAnalytics, setTaskAnalytics] = useState(null)
  const [projectAnalytics, setProjectAnalytics] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const isManagement =
    user?.role &&
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD].includes(user.role)

  const loadAnalytics = useCallback(async () => {
    try {
      const taskParams = selectedProjectId ? { projectId: selectedProjectId } : undefined
      const [taskRes, projectRes] = await Promise.all([
        analyticsApi.getTaskAnalytics(taskParams),
        analyticsApi.getProjectAnalytics(),
      ])
      setTaskAnalytics(taskRes?.data?.analytics || taskRes?.analytics || taskRes?.data || taskRes)
      setProjectAnalytics(projectRes?.data || projectRes)
      setError(null)
    } catch (err) {
      console.error('Analytics load failed:', err)
      setError(err.message || 'Unable to load analytics data.')
    }
  }, [selectedProjectId])

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

  const handleResetProjectFilter = () => {
    setSelectedProjectId('')
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

  if (isLoading) return <AnalyticsSkeleton />

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Analytics Unavailable"
          message={error}
          onRetry={handleRetry}
          retryLabel="Reload Analytics"
        />
      </div>
    )
  }

  /* ─── Extract Real Data Structures ─── */
  const overview = taskAnalytics?.overview || {}
  const byStatus = taskAnalytics?.byStatus || {}
  const byPriority = taskAnalytics?.byPriority || {}
  const deadlines = taskAnalytics?.deadlines || {}
  const scope = taskAnalytics?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  const projOverview = projectAnalytics?.overview || {}
  const projects = projectAnalytics?.projects || []

  /* Dropdown project filter options */
  const projectOptions = [
    { value: '', label: 'All Organization Projects' },
    ...projects.map((p) => ({
      value: p.projectId,
      label: `${p.name} ${p.code ? `(${p.code})` : ''}`,
    })),
  ]

  const activeProjectObj = projects.find((p) => p.projectId === selectedProjectId)

  /* ─── Task Status Segments ─── */
  const totalTasks = overview.total ?? 0
  const statusSegments = [
    { key: 'TODO', label: 'To Do', value: byStatus.TODO || 0, color: STATUS_META.TODO.color },
    { key: 'IN_PROGRESS', label: 'In Progress', value: byStatus.IN_PROGRESS || 0, color: STATUS_META.IN_PROGRESS.color },
    { key: 'BLOCKED', label: 'Blocked', value: byStatus.BLOCKED || 0, color: STATUS_META.BLOCKED.color },
    { key: 'COMPLETED', label: 'Completed', value: byStatus.COMPLETED || 0, color: STATUS_META.COMPLETED.color },
    { key: 'CANCELLED', label: 'Cancelled', value: byStatus.CANCELLED || 0, color: STATUS_META.CANCELLED.color },
  ]

  /* ─── Priority Segments ─── */
  const prioritySegments = [
    { key: 'LOW', label: 'Low', value: byPriority.LOW || 0, color: PRIORITY_META.LOW.color },
    { key: 'MEDIUM', label: 'Medium', value: byPriority.MEDIUM || 0, color: PRIORITY_META.MEDIUM.color },
    { key: 'HIGH', label: 'High', value: byPriority.HIGH || 0, color: PRIORITY_META.HIGH.color },
    { key: 'URGENT', label: 'Urgent', value: byPriority.URGENT || 0, color: PRIORITY_META.URGENT.color },
  ]

  /* ─── Priority Chart Data ─── */
  const priorityChartData = [
    { name: 'Low', value: byPriority.LOW || 0, fill: PRIORITY_META.LOW.color },
    { name: 'Medium', value: byPriority.MEDIUM || 0, fill: PRIORITY_META.MEDIUM.color },
    { name: 'High', value: byPriority.HIGH || 0, fill: PRIORITY_META.HIGH.color },
    { name: 'Urgent', value: byPriority.URGENT || 0, fill: PRIORITY_META.URGENT.color },
  ]

  /* ─── Project Task Completion Chart Data (top 8 by task count) ─── */
  const projectCompletionData = [...projects]
    .sort((a, b) => (b.totalTasks || 0) - (a.totalTasks || 0))
    .slice(0, 8)
    .map((p) => ({
      name: p.code || p.name?.substring(0, 14) || 'Project',
      fullName: p.name,
      completed: p.completedTasks || 0,
      incomplete: p.incompleteTasks || 0,
      total: p.totalTasks || 0,
      pct: p.completionPercentage || 0,
    }))

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header ── */}
      <PageHeader
        title="Analytics"
        description={
          scope === 'ORGANIZATION'
            ? 'Operational intelligence summarizing performance across tasks, completion ratios, priority distribution, and project milestones.'
            : 'Personal performance summary tracking your assigned tasks, completion progress, and project involvement.'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Analytics' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={scope === 'ORGANIZATION' ? 'primary' : 'info'} dot>
              {scope === 'ORGANIZATION' ? 'Organization Scope' : 'Personal Scope'}
            </Badge>
            {projects.length > 0 && (
              <div className="w-56 sm:w-64">
                <Select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  options={projectOptions}
                  placeholder=""
                />
              </div>
            )}
            {selectedProjectId && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={X}
                onClick={handleResetProjectFilter}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear Project
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={RotateCw}
              onClick={handleRefresh}
              isLoading={isRefreshing}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Active Project Filter Context Notice */}
      {activeProjectObj && (
        <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-900">
            <FolderOpen className="w-4 h-4 text-[#635BFF] shrink-0" />
            <span>
              Filtered to project:{' '}
              <strong className="font-semibold text-slate-900">{activeProjectObj.name}</strong>{' '}
              {activeProjectObj.code && <span className="font-mono text-slate-500">[{activeProjectObj.code}]</span>}
            </span>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleResetProjectFilter}
            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
          >
            Show All Projects
          </Button>
        </div>
      )}

      {/* ── Top-Level Operational Metrics Ribbon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightMetricCard
          icon={Layers}
          label="Total Tasks"
          value={totalTasks}
          color="#635BFF"
          subtitle={`${overview.incomplete ?? 0} incomplete tasks remaining`}
        />
        <InsightMetricCard
          icon={CheckCircle2}
          label="Completed"
          value={overview.completed ?? 0}
          color="#16A34A"
          subtitle={`${overview.completionPercentage ?? 0}% overall completion rate`}
        />
        <InsightMetricCard
          icon={Target}
          label="Completion Rate"
          value={`${overview.completionPercentage ?? 0}%`}
          color="#2563EB"
          subtitle={`Calculated across ${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`}
          badge={
            (overview.completionPercentage ?? 0) >= 50 ? (
              <Badge variant="success" size="sm">
                On Target
              </Badge>
            ) : undefined
          }
        />
        <InsightMetricCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={deadlines.overdue ?? 0}
          color="#DC2626"
          subtitle={
            deadlines.dueToday
              ? `${deadlines.dueToday} due today, ${deadlines.dueSoon ?? 0} due soon`
              : `${deadlines.dueSoon ?? 0} due in next 3 days`
          }
          badge={
            (deadlines.overdue ?? 0) > 0 ? (
              <Badge variant="danger" size="sm" dot>
                Needs Action
              </Badge>
            ) : undefined
          }
        />
      </div>

      {/* ── Task Status & Priority Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution Section */}
        <InsightSection
          icon={Layers}
          iconColor="#635BFF"
          title="Task Status Distribution"
          description="Proportional breakdown across workflow phases"
          badge={
            <Badge variant="neutral" size="sm">
              {totalTasks} Total
            </Badge>
          }
        >
          {totalTasks > 0 ? (
            <div className="space-y-6">
              {/* Proportional Segment Bar */}
              <div className="space-y-2">
                <DistributionBar
                  segments={statusSegments}
                  total={totalTasks}
                  showLegend={true}
                  height="h-4"
                />
              </div>

              {/* Status Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                {statusSegments.map((seg) => {
                  const pct = totalTasks > 0 ? ((seg.value / totalTasks) * 100).toFixed(1) : '0'
                  return (
                    <div
                      key={seg.key}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-xs font-medium text-slate-600 truncate">{seg.label}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                          {seg.value}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <InsightEmptyState
              icon={Layers}
              title="No tasks recorded"
              description="Status analytics will populate as tasks are created in this scope."
            />
          )}
        </InsightSection>

        {/* Priority Distribution Section */}
        <InsightSection
          icon={BarChart3}
          iconColor="#D97706"
          title="Priority Breakdown"
          description="Task volume categorized by operational priority level"
        >
          {totalTasks > 0 ? (
            <div className="space-y-6">
              {/* Proportional Priority Bar */}
              <DistributionBar
                segments={prioritySegments}
                total={totalTasks}
                showLegend={true}
                height="h-4"
              />

              {/* Priority Bar Chart */}
              <div className="min-h-[175px] pt-1 border-t border-slate-100">
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={priorityChartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <Tooltip content={<AnalyticsChartTooltip />} />
                    <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                      {priorityChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <InsightEmptyState
              icon={BarChart3}
              title="No priority data"
              description="Task priorities will appear here as tasks are assigned."
            />
          )}
        </InsightSection>
      </div>

      {/* ── Deadlines & Milestone Urgency Ribbon ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#635BFF]" />
            Deadline & Schedule Integrity
          </CardTitle>
          <CardDescription>
            Active task deadlines tracking proximity and immediate operational urgency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Overdue */}
            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 tabular-nums">
                {deadlines.overdue ?? 0}
              </span>
              <span className="text-xs font-semibold text-rose-900 mt-1">Overdue</span>
              <span className="text-[11px] text-rose-700/80 mt-0.5">Past due date</span>
            </div>

            {/* Due Today */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 tabular-nums">
                {deadlines.dueToday ?? 0}
              </span>
              <span className="text-xs font-semibold text-amber-900 mt-1">Due Today</span>
              <span className="text-[11px] text-amber-700/80 mt-0.5">Expires by end of day</span>
            </div>

            {/* Due Soon */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#635BFF] tabular-nums">
                {deadlines.dueSoon ?? 0}
              </span>
              <span className="text-xs font-semibold text-indigo-900 mt-1">Due Soon</span>
              <span className="text-[11px] text-indigo-700/80 mt-0.5">Next 72 hours</span>
            </div>

            {/* Without Deadline */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-700 tabular-nums">
                {deadlines.withoutDeadline ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-800 mt-1">No Due Date</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Open scheduled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Project Analytics Section ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#635BFF]" />
              Project Portfolio Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-project operational performance, active initiatives, and completion ratios
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            {projOverview.totalProjects ?? projects.length} Projects in Scope
          </Badge>
        </div>

        {/* Project KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <InsightMetricCard
            icon={FolderOpen}
            label="Total Projects"
            value={projOverview.totalProjects ?? projects.length}
            color="#635BFF"
            subtitle={`${projOverview.activeProjects ?? 0} currently active`}
          />
          <InsightMetricCard
            icon={CheckCircle2}
            label="Completed Projects"
            value={projOverview.completedProjects ?? 0}
            color="#16A34A"
            subtitle={
              (projOverview.completedProjects ?? 0) > 0
                ? 'Delivered initiatives'
                : 'All initiatives active/in-progress'
            }
          />
          <InsightMetricCard
            icon={Layers}
            label="Total Project Tasks"
            value={projOverview.totalTasks ?? 0}
            color="#2563EB"
            subtitle={`${projOverview.completedTasks ?? 0} tasks completed`}
          />
          <InsightMetricCard
            icon={Target}
            label="Task Completion"
            value={`${projOverview.completionPercentage ?? 0}%`}
            color="#D97706"
            subtitle={`${projOverview.completedTasks ?? 0} / ${projOverview.totalTasks ?? 0} completed`}
          />
        </div>

        {/* Project Completion Chart */}
        {projectCompletionData.length > 0 && (
          <InsightSection
            icon={BarChart3}
            iconColor="#16A34A"
            title="Task Completion by Project"
            description="Comparison of completed vs incomplete tasks for top active projects"
            badge={
              <Badge variant="neutral" size="sm">
                Top {projectCompletionData.length} Projects
              </Badge>
            }
          >
            <div className="min-h-[290px] pt-2">
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={projectCompletionData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip content={<AnalyticsChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingBottom: 16 }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed Tasks"
                    fill="#16A34A"
                    radius={[4, 4, 0, 0]}
                    stackId="proj"
                  />
                  <Bar
                    dataKey="incomplete"
                    name="Incomplete Tasks"
                    fill="#CBD5E1"
                    radius={[4, 4, 0, 0]}
                    stackId="proj"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </InsightSection>
        )}

        {/* Project Breakdown Table */}
        {projects.length > 0 && (
          <Card>
            <CardHeader
              action={
                <Badge variant="neutral" size="sm">
                  {projects.length} Total
                </Badge>
              }
            >
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-[#635BFF]" />
                Project Directory Breakdown
              </CardTitle>
              <CardDescription>
                Detailed progress tracking and task deliverables across all registered projects
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th scope="col" className="px-6 py-3.5">
                      Project
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Total Tasks
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Incomplete
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right min-w-[160px]">
                      Completion Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projects.map((p) => {
                    const pct = Number(p.completionPercentage ?? 0)
                    const isSelected = p.projectId === selectedProjectId

                    return (
                      <tr
                        key={p.projectId}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isSelected ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {/* Name & Code */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 truncate">
                              {p.name}
                            </span>
                            {p.code && (
                              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                                {p.code}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <Badge
                            size="sm"
                            variant={
                              p.status === 'ACTIVE'
                                ? 'success'
                                : p.status === 'COMPLETED'
                                ? 'primary'
                                : p.status === 'ON_HOLD'
                                ? 'warning'
                                : p.status === 'PLANNING'
                                ? 'info'
                                : p.status === 'CANCELLED'
                                ? 'danger'
                                : 'neutral'
                            }
                            dot
                          >
                            {p.status?.replace(/_/g, ' ')}
                          </Badge>
                        </td>

                        {/* Total Tasks */}
                        <td className="px-6 py-3.5 text-right font-mono text-slate-700 tabular-nums">
                          {p.totalTasks ?? 0}
                        </td>

                        {/* Completed Tasks */}
                        <td className="px-6 py-3.5 text-right font-mono text-emerald-600 font-semibold tabular-nums">
                          {p.completedTasks ?? 0}
                        </td>

                        {/* Incomplete Tasks */}
                        <td className="px-6 py-3.5 text-right font-mono text-slate-500 tabular-nums">
                          {p.incompleteTasks ?? 0}
                        </td>

                        {/* Completion Rate with Meter */}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    pct >= 75
                                      ? '#16A34A'
                                      : pct >= 40
                                      ? '#D97706'
                                      : '#635BFF',
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono text-slate-800 tabular-nums w-12 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
