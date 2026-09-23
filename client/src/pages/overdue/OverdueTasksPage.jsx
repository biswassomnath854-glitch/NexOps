import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { tasksApi } from '@/api/endpoints/tasks'
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
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  CalendarX2,
  CheckCircle2,
  Flame,
} from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

/* ─── helpers ─── */
function formatLabel(str) {
  return (str || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function priorityBadgeVariant(priority) {
  switch (priority) {
    case 'URGENT': return 'danger'
    case 'HIGH': return 'warning'
    case 'MEDIUM': return 'info'
    case 'LOW': return 'success'
    default: return 'neutral'
  }
}

function statusBadgeVariant(status) {
  switch (status) {
    case 'TODO': return 'primary'
    case 'IN_PROGRESS': return 'warning'
    case 'BLOCKED': return 'danger'
    case 'COMPLETED': return 'success'
    case 'CANCELLED': return 'neutral'
    default: return 'neutral'
  }
}

function daysOverdueLabel(days) {
  if (!days || days <= 0) return 'Today'
  if (days === 1) return '1 day'
  return `${days} days`
}

function daysOverdueColor(days) {
  if (days >= 7) return 'text-rose-600'
  if (days >= 3) return 'text-amber-600'
  return 'text-orange-500'
}

/* ─── skeleton ─── */
function OverdueSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   OVERDUE TASKS PAGE
   ═══════════════════════════════════════════════════════════════ */
export function OverdueTasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
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

  const loadOverdue = useCallback(async () => {
    try {
      const params = { page, limit: pageSize }
      if (search.trim()) params.search = search.trim()
      if (priority) params.priority = priority

      const res = await tasksApi.getOverdueTasks(params)
      const result = res?.data || res
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Overdue tasks load failed:', err)
      setError(err.message || 'Unable to load overdue tasks.')
    }
  }, [page, pageSize, search, priority])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadOverdue()
    setIsRefreshing(false)
  }

  const handleRetry = async () => {
    setIsLoading(true)
    setError(null)
    await loadOverdue()
    setIsLoading(false)
  }

  useEffect(() => {
    let ignore = false
    async function init() {
      await loadOverdue()
      if (!ignore) setIsLoading(false)
    }
    init()
    return () => { ignore = true }
  }, [loadOverdue])

  useEffect(() => {
    setPage(1)
  }, [search, priority])

  if (isLoading) return <OverdueSkeleton />

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Overdue Tasks Unavailable"
          message={error}
          onRetry={handleRetry}
          retryLabel="Reload Overdue Tasks"
        />
      </div>
    )
  }

  const tasks = data?.tasks || []
  const pagination = data?.pagination || {}
  const scope = data?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <PageHeader
        title="Overdue Tasks"
        description="Tasks that have passed their due date and still require action."
        breadcrumbs={[
          { label: 'Dashboard', href: ROUTES.DASHBOARD },
          { label: 'Tasks', href: ROUTES.TASKS },
          { label: 'Overdue' },
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
        <Badge variant="danger" dot>
          {pagination.totalItems ?? tasks.length} overdue
        </Badge>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <CalendarX2 className="w-4 h-4 text-rose-500" />
              Overdue Task List
            </span>
          </CardTitle>
          <CardDescription>{pagination.totalItems ?? tasks.length} tasks past due date</CardDescription>
        </CardHeader>

        {/* Filter bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search tasks..."
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
          {tasks.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Overdue
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {/* Action */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const daysOverdue = task.overdue?.daysOverdue || 0

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                      onClick={() => navigate(ROUTES.TASK_DETAILS(task.id))}
                    >
                      <td className="px-6 py-3 max-w-[240px]">
                        <p className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {task.description.substring(0, 60)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {task.project ? (
                          <div>
                            <p className="text-slate-700 text-xs font-medium">{task.project.name}</p>
                            {task.project.code && (
                              <p className="text-[10px] text-slate-400 font-mono">{task.project.code}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <Badge size="sm" variant={priorityBadgeVariant(task.priority)} dot>
                          {formatLabel(task.priority)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Badge size="sm" variant={statusBadgeVariant(task.status)} dot>
                          {formatLabel(task.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {(task.assignee.firstName?.[0] || '').toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-700">
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(task.dueDate)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${daysOverdueColor(daysOverdue)}`}>
                          <Flame className="w-3.5 h-3.5" />
                          {daysOverdueLabel(daysOverdue)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={CheckCircle2}
                title="No overdue tasks"
                description={
                  search || priority
                    ? 'No overdue tasks match your current filters.'
                    : 'All tasks are on track. Great work!'
                }
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
