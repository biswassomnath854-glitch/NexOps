import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { analyticsApi } from '@/api/endpoints/analytics'
import { ROLES, TASK_PRIORITY } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { PageHeader } from '@/components/common/PageHeader'
import { Pagination } from '@/components/common/Pagination'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Skeleton } from '@/components/feedback/Loading'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import {
  Users,
  RefreshCw,
  Search,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  UserCircle2,
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

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

/* ─── stat card ─── */
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

/* ─── chart tooltip ─── */
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

/* ─── skeleton ─── */
function WorkloadSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

/* ─── role badge color ─── */
function roleBadgeVariant(role) {
  switch (role) {
    case 'SUPER_ADMIN': return 'danger'
    case 'ADMIN': return 'warning'
    case 'MANAGER': return 'primary'
    case 'TEAM_LEAD': return 'info'
    case 'EMPLOYEE': return 'success'
    case 'VIEWER': return 'neutral'
    default: return 'neutral'
  }
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

  /* filters */
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

  if (isLoading) return <WorkloadSkeleton />

  if (error) {
    return (
      <div className="py-12">
        <ErrorState title="Workload Unavailable" message={error} onRetry={handleRetry} retryLabel="Reload Workload" />
      </div>
    )
  }

  const overview = workloadData?.overview || {}
  const users = workloadData?.users || []
  const pagination = workloadData?.pagination || {}
  const scope = workloadData?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  /* chart data — top 8 users by active tasks */
  const chartData = [...users]
    .sort((a, b) => (b.activeTasks || 0) - (a.activeTasks || 0))
    .slice(0, 8)
    .map((u) => ({
      name: `${u.firstName || ''} ${(u.lastName || '').charAt(0) || ''}`.trim(),
      active: u.activeTasks || 0,
      completed: u.completedTasks || 0,
      overdue: u.overdueTasks || 0,
    }))

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <PageHeader
        title="Team Workload"
        description={`${scope === 'ORGANIZATION' ? 'Organization-wide' : 'Personal'} workload distribution and capacity insights.`}
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Workload' },
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

      {/* Scope */}
      <div className="flex items-center gap-2">
        <Badge variant={scope === 'ORGANIZATION' ? 'primary' : 'info'} dot>
          {scope === 'ORGANIZATION' ? 'Organization Scope' : 'Personal Scope'}
        </Badge>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={overview.totalUsers ?? 0} color="#6366f1" />
        <StatCard
          icon={Layers}
          label="Active Tasks"
          value={overview.totalActiveTasks ?? 0}
          color="#f59e0b"
          subtitle={overview.unassignedActiveTasks ? `${overview.unassignedActiveTasks} unassigned` : undefined}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={overview.totalOverdueTasks ?? 0}
          color="#ef4444"
        />
        <StatCard
          icon={UserCircle2}
          label="Active Workload"
          value={overview.usersWithActiveWorkload ?? 0}
          color="#10b981"
          subtitle="Users with assigned work"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Workload Distribution
              </span>
            </CardTitle>
            <CardDescription>Tasks per team member (top 8)</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="active" name="Active" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Workload</CardTitle>
          <CardDescription>{pagination.totalItems ?? users.length} team members</CardDescription>
        </CardHeader>

        <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Input
              placeholder="Search by name or email..."
              leftIcon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={PRIORITY_OPTIONS}
              placeholder=""
            />
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          {users.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Overdue
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Due Soon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(u.firstName?.[0] || '').toUpperCase()}
                          {(u.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge size="sm" variant={roleBadgeVariant(u.role)} dot>
                        {u.role?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-medium text-slate-700">
                      {u.totalTasks ?? 0}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      <span className={u.activeTasks > 0 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                        {u.activeTasks ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      <span className="text-emerald-600">{u.completedTasks ?? 0}</span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      <span className={u.overdueTasks > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                        {u.overdueTasks ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      <span className={u.dueSoonTasks > 0 ? 'text-indigo-600 font-semibold' : 'text-slate-500'}>
                        {u.dueSoonTasks ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="No workload data"
                description={search ? 'No team members match your search criteria.' : 'No workload data available for the current scope.'}
              />
            </div>
          )}
        </CardContent>

        {(pagination.totalPages ?? 0) > 1 && (
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
        )}
      </Card>
    </div>
  )
}
