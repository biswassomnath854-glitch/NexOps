import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { analyticsApi } from '@/api/endpoints/analytics'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { RoleBadge } from '@/components/common/RoleBadge'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import {
  InsightMetricCard,
  DistributionBar,
  InsightSection,
  InsightEmptyState,
} from '@/components/insights'
import {
  Users,
  RotateCw,
  Search,
  BarChart3,
  AlertTriangle,
  Layers,
  UserCheck,
  TrendingUp,
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
} from 'recharts'

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

const CHART_LEGEND_WRAPPER_STYLE = { fontSize: 12, paddingBottom: 16 }
const EMPTY_ARRAY = []
const EMPTY_OBJECT = {}

/* ─── Chart tooltip with clean SB design language ─── */
const WorkloadChartTooltip = memo(function WorkloadChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 shadow-lg text-xs">
      {label && <p className="font-semibold text-slate-900 pb-1 mb-1.5 border-b border-slate-100">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <strong className="text-slate-900 font-mono tabular-nums">{entry.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
})

/* ─── Isolated Memoized Workload Allocation Chart ─── */
const WorkloadAllocationChart = memo(function WorkloadAllocationChart({
  data,
  reducedMotion,
}) {
  return (
    <div className="min-h-[290px] min-w-0 w-full pt-2">
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={data} barCategoryGap="25%">
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
          <Tooltip content={<WorkloadChartTooltip />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            iconSize={8}
            wrapperStyle={CHART_LEGEND_WRAPPER_STYLE}
          />
          <Bar
            dataKey="active"
            name="Active Tasks"
            fill="#635BFF"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!reducedMotion}
            animationDuration={400}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="completed"
            name="Completed Tasks"
            fill="#16A34A"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!reducedMotion}
            animationDuration={400}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="overdue"
            name="Overdue Tasks"
            fill="#DC2626"
            radius={[4, 4, 0, 0]}
            isAnimationActive={!reducedMotion}
            animationDuration={400}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})

/* ─── Memoized Member Workload Table Row ─── */
const WorkloadMemberRow = memo(function WorkloadMemberRow({ user: u }) {
  const initials = `${(u.firstName?.[0] || '').toUpperCase()}${(u.lastName?.[0] || '').toUpperCase()}` || 'M'
  const activeCount = u.activeTasks ?? 0
  const overdueCount = u.overdueTasks ?? 0
  const dueSoonCount = u.dueSoonTasks ?? 0
  const completedCount = u.completedTasks ?? 0
  const totalCount = u.totalTasks ?? 0

  /* Segments for mini distribution meter */
  const statusSegments = useMemo(() => [
    { label: 'To Do', value: u.byStatus?.TODO || 0, color: '#94A3B8' },
    { label: 'In Progress', value: u.byStatus?.IN_PROGRESS || 0, color: '#635BFF' },
    { label: 'Blocked', value: u.byStatus?.BLOCKED || 0, color: '#DC2626' },
    { label: 'Completed', value: u.byStatus?.COMPLETED || 0, color: '#16A34A' },
  ], [u.byStatus?.TODO, u.byStatus?.IN_PROGRESS, u.byStatus?.BLOCKED, u.byStatus?.COMPLETED])

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      {/* Member Info */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#635BFF] to-[#5148E5] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {u.firstName} {u.lastName}
            </p>
            <p className="text-xs text-slate-400 truncate font-mono">
              {u.email}
            </p>
          </div>
        </div>
      </td>

      {/* Role Badge */}
      <td className="px-6 py-3.5 whitespace-nowrap">
        <RoleBadge role={u.role} size="sm" />
      </td>

      {/* Total Tasks */}
      <td className="px-6 py-3.5 text-right font-mono font-medium text-slate-700 tabular-nums">
        {totalCount}
      </td>

      {/* Active Tasks */}
      <td className="px-6 py-3.5 text-right tabular-nums">
        <span
          className={
            activeCount > 0
              ? 'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-[#635BFF]/10 text-[#5148E5]'
              : 'text-slate-400 font-mono text-xs'
          }
        >
          {activeCount}
        </span>
      </td>

      {/* Completed Tasks */}
      <td className="px-6 py-3.5 text-right font-mono tabular-nums">
        <span className={completedCount > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
          {completedCount}
        </span>
      </td>

      {/* Overdue Tasks */}
      <td className="px-6 py-3.5 text-right font-mono tabular-nums">
        <span
          className={
            overdueCount > 0
              ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full text-xs border border-rose-200/80'
              : 'text-slate-400'
          }
        >
          {overdueCount}
        </span>
      </td>

      {/* Due Soon Tasks */}
      <td className="px-6 py-3.5 text-right font-mono tabular-nums">
        <span
          className={
            dueSoonCount > 0
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-400'
          }
        >
          {dueSoonCount}
        </span>
      </td>

      {/* Status Distribution Mini Meter */}
      <td className="px-6 py-3.5 text-center">
        {totalCount > 0 ? (
          <DistributionBar
            segments={statusSegments}
            total={totalCount}
            showLegend={false}
            height="h-2"
            className="w-32 mx-auto"
          />
        ) : (
          <span className="text-xs text-slate-400">No tasks</span>
        )}
      </td>
    </tr>
  )
})

/* ─── Workload Page Skeleton ─── */
function WorkloadSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-24 bg-slate-200/80 rounded-lg" />
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

      {/* Chart skeleton */}
      <div className="h-84 rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-3.5 w-64 bg-slate-100 rounded" />
        <div className="h-56 bg-slate-50 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100/70 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WORKLOAD PAGE
   ═══════════════════════════════════════════════════════════════ */
export function WorkloadPage() {
  const { user } = useAuth()
  const [workloadData, setWorkloadData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  /* Filters */
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const isManagement =
    user?.role &&
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD].includes(user.role)

  const loadWorkload = useCallback(async () => {
    try {
      const params = { page, limit: pageSize }
      if (search.trim()) params.search = search.trim()
      if (priority) params.priority = priority

      const res = await analyticsApi.getWorkload(params)
      const data = res?.data?.workload || res?.workload || res?.data || res
      setWorkloadData(data)
      setError(null)
    } catch (err) {
      console.error('Workload load failed:', err)
      setError(err.message || 'Unable to load workload data.')
    }
  }, [page, pageSize, search, priority])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadWorkload()
    setIsRefreshing(false)
  }

  const handleRetry = async () => {
    setIsLoading(true)
    setError(null)
    await loadWorkload()
    setIsLoading(false)
  }

  const handleResetFilters = () => {
    setSearch('')
    setPriority('')
    setPage(1)
  }

  useEffect(() => {
    let ignore = false
    async function init() {
      await loadWorkload()
      if (!ignore) setIsLoading(false)
    }
    init()
    return () => { ignore = true }
  }, [loadWorkload])

  /* Reset page on filter change */
  useEffect(() => {
    setPage(1)
  }, [search, priority])

  const prefersReducedMotion = usePrefersReducedMotion()
  const overview = workloadData?.overview || EMPTY_OBJECT
  const users = workloadData?.users || EMPTY_ARRAY
  const pagination = workloadData?.pagination || EMPTY_OBJECT
  const scope = workloadData?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  /* Assigned active tasks across organization */
  const totalActiveTasks = overview.totalActiveTasks ?? 0
  const unassignedTasks = overview.unassignedActiveTasks ?? 0

  /* Top 8 members ranked by active tasks for visualization */
  const chartData = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.activeTasks || 0) - (a.activeTasks || 0))
      .slice(0, 8)
      .map((u) => {
        const first = u.firstName || ''
        const last = u.lastName || ''
        const shortName = `${first} ${last ? last.charAt(0) + '.' : ''}`.trim() || u.email?.split('@')[0] || 'Member'
        return {
          name: shortName,
          fullName: `${first} ${last}`.trim() || u.email,
          active: u.activeTasks || 0,
          completed: u.completedTasks || 0,
          overdue: u.overdueTasks || 0,
          total: u.totalTasks || 0,
        }
      })
  }, [users])

  /* Calculate max active tasks among top members for relative bar comparison */
  const maxActiveTasks = useMemo(() => {
    return Math.max(1, ...users.map((u) => u.activeTasks || 0))
  }, [users])

  const topConcentrationMembers = useMemo(() => {
    return chartData.slice(0, 5)
  }, [chartData])

  const hasActiveFilters = Boolean(search.trim() || priority)

  if (isLoading) return <WorkloadSkeleton />

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Workload Unavailable"
          message={error}
          onRetry={handleRetry}
          retryLabel="Reload Workload"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ── Page Header ── */}
      <PageHeader
        title="Workload"
        description={
          scope === 'ORGANIZATION'
            ? 'Monitor team capacity, distribution of active responsibilities, and identify workload concentration across your organization.'
            : 'Track your assigned responsibilities, personal task commitments, and active workload distribution.'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Workload' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={scope === 'ORGANIZATION' ? 'primary' : 'info'} dot>
              {scope === 'ORGANIZATION' ? 'Organization Scope' : 'Personal Scope'}
            </Badge>
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

      {/* ── Summary KPI Ribbon ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightMetricCard
          icon={Users}
          label={scope === 'ORGANIZATION' ? 'Total Members' : 'Profile Scope'}
          value={overview.totalUsers ?? users.length}
          color="#635BFF"
          subtitle={
            scope === 'ORGANIZATION'
              ? `${overview.usersWithActiveWorkload ?? 0} with assigned work`
              : 'Assigned to your profile'
          }
        />
        <InsightMetricCard
          icon={Layers}
          label="Active Workload"
          value={totalActiveTasks}
          color="#2563EB"
          subtitle={
            unassignedTasks > 0
              ? `${unassignedTasks} unassigned active ${unassignedTasks === 1 ? 'task' : 'tasks'}`
              : 'All active tasks assigned'
          }
          badge={
            unassignedTasks > 0 ? (
              <Badge variant="warning" size="sm">
                {unassignedTasks} unassigned
              </Badge>
            ) : undefined
          }
        />
        <InsightMetricCard
          icon={UserCheck}
          label="Active Contributors"
          value={overview.usersWithActiveWorkload ?? 0}
          color="#16A34A"
          subtitle={
            overview.totalUsers > 0
              ? `${Math.round(((overview.usersWithActiveWorkload ?? 0) / overview.totalUsers) * 100)}% of members active`
              : 'Members with active tasks'
          }
        />
        <InsightMetricCard
          icon={AlertTriangle}
          label="Overdue Attention"
          value={overview.totalOverdueTasks ?? 0}
          color="#DC2626"
          subtitle={
            (overview.totalOverdueTasks ?? 0) > 0
              ? 'Requires operational follow-up'
              : 'No overdue tasks in scope'
          }
          badge={
            (overview.totalOverdueTasks ?? 0) > 0 ? (
              <Badge variant="danger" size="sm" dot>
                Attention
              </Badge>
            ) : undefined
          }
        />
      </div>

      {/* ── Workload Visualization Section ── */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart (2 cols) */}
          <div className="lg:col-span-2">
            <InsightSection
              icon={BarChart3}
              iconColor="#635BFF"
              title="Workload Allocation by Member"
              description="Active, completed, and overdue task breakdown for top contributors"
              badge={
                <Badge variant="neutral" size="sm">
                  Top {chartData.length} Members
                </Badge>
              }
            >
              <WorkloadAllocationChart
                data={chartData}
                reducedMotion={prefersReducedMotion}
              />
            </InsightSection>
          </div>

          {/* Ranked Workload Distribution Meter (1 col) */}
          <div className="lg:col-span-1">
            <InsightSection
              icon={TrendingUp}
              iconColor="#2563EB"
              title="Workload Concentration"
              description="Relative active workload distribution"
            >
              <div className="space-y-4">
                {topConcentrationMembers.map((member, idx) => {
                  const relativePct = Math.round((member.active / maxActiveTasks) * 100)
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate" title={member.fullName}>
                          {member.fullName}
                        </span>
                        <span className="font-mono text-slate-600 font-medium shrink-0">
                          {member.active} {member.active === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className="h-full rounded-full bg-[#635BFF] transition-all duration-500"
                          style={{ width: `${relativePct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{member.completed} completed</span>
                        {member.overdue > 0 ? (
                          <span className="text-rose-600 font-medium">{member.overdue} overdue</span>
                        ) : (
                          <span>0 overdue</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {unassignedTasks > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-medium text-amber-900">Unassigned Workload</span>
                      </div>
                      <span className="font-mono font-bold text-amber-900">
                        {unassignedTasks} {unassignedTasks === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </InsightSection>
          </div>
        </div>
      )}

      {/* ── Member Workload Table & Filtering ── */}
      <Card>
        <CardHeader
          action={
            <Badge variant="neutral" size="sm">
              {pagination.totalItems ?? users.length} {pagination.totalItems === 1 ? 'Member' : 'Members'}
            </Badge>
          }
        >
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#635BFF]" />
            Member Workload Directory
          </CardTitle>
          <CardDescription>
            Detailed task counts, activity distribution, and deadline statuses per team member
          </CardDescription>
        </CardHeader>

        {/* Filter Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name or email..."
                leftIcon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={PRIORITY_OPTIONS}
                placeholder=""
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={X}
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 self-start sm:self-auto"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Directory Table */}
        <CardContent className="p-0 overflow-x-auto">
          {users.length > 0 ? (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3.5">
                    Team Member
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Total Tasks
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Active
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Completed
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Overdue
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Due Soon
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center min-w-[140px]">
                    Status Breakdown
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <WorkloadMemberRow key={u.userId} user={u} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <InsightEmptyState
                icon={Users}
                title={hasActiveFilters ? 'No matching members found' : 'No workload data yet'}
                description={
                  hasActiveFilters
                    ? 'No team members match your filter criteria. Try clearing the search or changing the priority filter.'
                    : 'Assigned work will appear here as tasks are distributed across your organization.'
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {(pagination.totalPages ?? 0) > 1 && (
          <div className="border-t border-slate-100">
            <Pagination
              totalItems={pagination.totalItems}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
