import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { tasksApi } from '@/api/endpoints/tasks'
import { projectsApi } from '@/api/endpoints/projects'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'
import { Pagination } from '@/components/common/Pagination'
import { ErrorState } from '@/components/feedback/ErrorState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge'
import { TaskAssignee } from '@/components/tasks/TaskAssignee'
import {
  AlertOctagon,
  Flame,
  Search,
  RotateCw,
  Clock,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Users,
  Filter,
  X,
  Calendar,
} from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

function getDaysOverdue(task) {
  if (typeof task.overdue?.daysOverdue === 'number') {
    return task.overdue.daysOverdue
  }
  if (task.dueDate) {
    const diff = Math.ceil((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(diff, 1)
  }
  return null
}

function getOverdueBadgeConfig(days, priority) {
  if (days === null) {
    return {
      label: 'Overdue',
      className: 'bg-rose-50 text-rose-700 border-rose-200/90 font-semibold',
    }
  }
  const label = days === 1 ? '1 day overdue' : `${days} days overdue`

  if (priority === 'URGENT' || days >= 7) {
    return {
      label,
      className: 'bg-rose-50 text-rose-700 border-rose-200/90 font-semibold',
    }
  }
  if (priority === 'HIGH' || days >= 3) {
    return {
      label,
      className: 'bg-amber-50 text-amber-800 border-amber-200/90 font-medium',
    }
  }
  return {
    label,
    className: 'bg-orange-50 text-orange-700 border-orange-200/90 font-medium',
  }
}

/* ─── Skeleton Loading State ─── */
function OverdueSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200/80 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-24 bg-slate-200/80 rounded-lg" />
      </div>

      {/* KPI Ribbon skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl border border-slate-200/80" />
        ))}
      </div>

      {/* Filter toolbar skeleton */}
      <div className="h-14 bg-slate-100 rounded-xl border border-slate-200/80" />

      {/* Table rows skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-slate-100/70 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   OVERDUE TASKS PAGE (OPERATIONAL ATTENTION CENTER)
   ═══════════════════════════════════════════════════════════════ */
export function OverdueTasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  /* Filters */
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('')
  const [projectId, setProjectId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const requestIdRef = useRef(0)

  const debouncedSearch = useDebounce(search, 350)

  const isManagement =
    user?.role &&
    [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD].includes(user.role)

  /* Load projects for filtering */
  useEffect(() => {
    let ignore = false
    async function loadProjects() {
      try {
        const res = isManagement
          ? await projectsApi.getProjects().catch(() => projectsApi.getAccessibleProjects())
          : await projectsApi.getAccessibleProjects().catch(() => null)
        const list = res?.data?.projects || res?.projects || []
        if (!ignore && Array.isArray(list)) {
          setProjects(list)
        }
      } catch {
        if (!ignore) setProjects([])
      }
    }
    if (user?.role) {
      loadProjects()
    }
    return () => {
      ignore = true
    }
  }, [user?.role, isManagement])

  /* Main Overdue API Call */
  const loadOverdue = useCallback(async () => {
    const currentId = ++requestIdRef.current
    try {
      const params = { page, limit: pageSize }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (priority) params.priority = priority
      if (projectId) params.projectId = projectId

      const res = await tasksApi.getOverdueTasks(params)
      if (currentId !== requestIdRef.current) return // Superseeded by newer request

      const result = res?.data || res
      setData(result)
      setError(null)
    } catch (err) {
      if (currentId !== requestIdRef.current) return
      console.error('Overdue tasks load failed:', err)
      setError(err.message || 'Unable to load overdue tasks.')
    }
  }, [page, pageSize, debouncedSearch, priority, projectId])

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
    return () => {
      ignore = true
    }
  }, [loadOverdue])

  const tasks = useMemo(() => data?.tasks || [], [data?.tasks])
  const pagination = data?.pagination || {}
  const scope = data?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  /* Merge loaded projects with any projects present in overdue tasks */
  const projectFilterOptions = useMemo(() => {
    const map = new Map()
    projects.forEach((p) => {
      if (p.id) map.set(p.id, { value: p.id, label: `${p.name} (${p.code})` })
    })
    tasks.forEach((t) => {
      if (t.project?.id && !map.has(t.project.id)) {
        map.set(t.project.id, {
          value: t.project.id,
          label: `${t.project.name} (${t.project.code || 'PRJ'})`,
        })
      }
    })
    return [{ value: '', label: 'All Projects' }, ...Array.from(map.values())]
  }, [projects, tasks])

  /* Attention Summary Metrics */
  const totalOverdue = pagination.totalItems ?? tasks.length
  const urgentCount = tasks.filter((t) => t.priority === 'URGENT').length
  const highCount = tasks.filter((t) => t.priority === 'HIGH').length
  const criticalAttentionCount = urgentCount + highCount

  const uniqueProjectNames = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.project?.name).filter(Boolean)))
  }, [tasks])

  const uniqueAssigneeNames = useMemo(() => {
    return Array.from(
      new Set(
        tasks
          .map((t) => (t.assignee ? `${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim() : null))
          .filter(Boolean)
      )
    )
  }, [tasks])

  const unassignedCount = tasks.filter((t) => !t.assignee).length

  const hasActiveFilters = Boolean(search.trim() || priority || projectId)
  const activeFilterCount = (search.trim() ? 1 : 0) + (priority ? 1 : 0) + (projectId ? 1 : 0)

  const handleResetFilters = () => {
    setSearch('')
    setPriority('')
    setProjectId('')
    setPage(1)
  }

  if (isLoading) return <OverdueSkeleton />

  if (error && !tasks.length) {
    return (
      <div className="py-12 animate-in fade-in duration-200">
        <ErrorState
          title="Unable to Load Overdue Tasks"
          message={error}
          onRetry={handleRetry}
          retryLabel="Reload Overdue Tasks"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Overdue Tasks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/90 select-none">
              {totalOverdue} overdue
            </span>
            <Badge variant={scope === 'ORGANIZATION' ? 'primary' : 'info'} dot size="sm">
              {scope === 'ORGANIZATION' ? 'Organization Scope' : 'Personal Scope'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tasks that have passed their due date and require attention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-700"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* 2. Operational Attention Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-rose-200/70 bg-rose-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs font-medium">
            <span>Total Overdue</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-950 mt-1">{totalOverdue}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5 truncate">
            {scope === 'ORGANIZATION' ? 'Across organization' : 'Assigned / created by you'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>Critical Priority</span>
            <Flame className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-950 mt-1">{criticalAttentionCount}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5 truncate">
            {urgentCount} urgent, {highCount} high priority
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#635BFF]/20 bg-[#635BFF]/5 shadow-2xs">
          <div className="flex items-center justify-between text-[#5148E5] text-xs font-medium">
            <span>Impacted Projects</span>
            <FolderKanban className="w-3.5 h-3.5 text-[#635BFF]" />
          </div>
          <div className="text-xl font-bold text-[#37309A] mt-1">{uniqueProjectNames.length}</div>
          <div className="text-[11px] text-[#5148E5]/80 mt-0.5 truncate">
            {uniqueProjectNames.length === 1 ? '1 active project' : `${uniqueProjectNames.length} active projects`}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Impacted Members</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{uniqueAssigneeNames.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {unassignedCount > 0 ? `${unassignedCount} unassigned` : 'All assigned'}
          </div>
        </div>
      </div>

      {/* 3. Operational Filter Toolbar */}
      <Card className="border-slate-200/80 bg-white shadow-2xs">
        <CardContent className="p-3.5">
          <div className="flex flex-col gap-3">
            {/* Desktop / Tablet Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                {/* Search */}
                <div className="relative">
                  <Input
                    placeholder="Search overdue tasks..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    leftIcon={Search}
                    className="py-1.5 text-xs pr-8"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('')
                        setPage(1)
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <Select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value)
                      setPage(1)
                    }}
                    options={PRIORITY_OPTIONS}
                    className="py-1.5 text-xs"
                  />
                </div>

                {/* Project */}
                <div>
                  <Select
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value)
                      setPage(1)
                    }}
                    options={projectFilterOptions}
                    className="py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs text-slate-500 hover:text-slate-800 h-8 px-2 font-medium"
                  >
                    Clear Filters
                  </Button>
                )}

                {/* Mobile Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="sm:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-xs"
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#635BFF] text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Expandable Filter Panel */}
            {showMobileFilters && (
              <div className="sm:hidden pt-3 border-t border-slate-100 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
                  <Select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value)
                      setPage(1)
                    }}
                    options={PRIORITY_OPTIONS}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Project</label>
                  <Select
                    value={projectId}
                    onChange={(e) => {
                      setProjectId(e.target.value)
                      setPage(1)
                    }}
                    options={projectFilterOptions}
                    className="text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Overdue Task Workspace (Table on Desktop, Cards on Mobile) */}
      <Card className="border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Attention Queue</span>
            </CardTitle>
            <span className="text-xs font-mono font-medium text-slate-400">
              Showing {tasks.length} of {totalOverdue}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {tasks.length > 0 ? (
            <div>
              {/* DESKTOP TABLE VIEW (High Information Density) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-semibold">
                      <th className="py-3 px-5">Task Details</th>
                      <th className="py-3 px-4">Overdue Duration</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Project</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tasks.map((task) => {
                      const days = getDaysOverdue(task)
                      const badge = getOverdueBadgeConfig(days, task.priority)

                      return (
                        <tr
                          key={task.id}
                          onClick={() => navigate(ROUTES.TASK_DETAILS(task.id))}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          {/* Task */}
                          <td className="py-3.5 px-5 max-w-[260px]">
                            <div className="flex items-center gap-2">
                              {task.code && (
                                <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 select-none shrink-0">
                                  {task.code}
                                </span>
                              )}
                              <span className="font-semibold text-slate-900 group-hover:text-[#635BFF] transition-colors truncate">
                                {task.title}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </td>

                          {/* Overdue Duration */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs shadow-2xs select-none ${badge.className}`}
                            >
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <TaskPriorityBadge priority={task.priority} size="sm" />
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <TaskStatusBadge status={task.status} size="sm" />
                          </td>

                          {/* Assignee */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <TaskAssignee assignee={task.assignee} size="sm" />
                          </td>

                          {/* Project */}
                          <td className="py-3.5 px-4 max-w-[160px]">
                            {task.project ? (
                              <div className="truncate">
                                <span className="font-medium text-slate-800 truncate block">
                                  {task.project.name}
                                </span>
                                {task.project.code && (
                                  <span className="font-mono text-[10px] text-slate-400">
                                    {task.project.code}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Due Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                            {formatDate(task.dueDate)}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 text-slate-400 group-hover:text-[#635BFF] transition-colors font-medium">
                              <span className="hidden lg:inline text-[11px]">View</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE / TABLET STACKED LIST VIEW */}
              <div className="md:hidden divide-y divide-slate-100">
                {tasks.map((task) => {
                  const days = getDaysOverdue(task)
                  const badge = getOverdueBadgeConfig(days, task.priority)

                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(ROUTES.TASK_DETAILS(task.id))}
                      className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-3"
                    >
                      {/* 1. Task Title & Code */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {task.code && (
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {task.code}
                            </span>
                          )}
                          <h4 className="font-semibold text-slate-900 text-xs">
                            {task.title}
                          </h4>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* 2. Overdue duration badge */}
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] shadow-2xs select-none ${badge.className}`}
                        >
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* 3. Priority & Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <TaskPriorityBadge priority={task.priority} size="sm" />
                        <TaskStatusBadge status={task.status} size="sm" />
                      </div>

                      {/* 4. Assignee */}
                      <div>
                        <TaskAssignee assignee={task.assignee} size="sm" />
                      </div>

                      {/* 5. Project */}
                      {task.project && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{task.project.name}</span>
                          {task.project.code && (
                            <span className="font-mono text-[10px] text-slate-400">
                              ({task.project.code})
                            </span>
                          )}
                        </div>
                      )}

                      {/* 6. Due Date & 7. Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Due {formatDate(task.dueDate)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[#635BFF] font-semibold">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={CheckCircle2}
                title={hasActiveFilters ? 'No matching overdue tasks' : 'Nothing overdue'}
                description={
                  hasActiveFilters
                    ? 'No overdue tasks match your current filter criteria.'
                    : 'All tracked deadlines are currently on schedule.'
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="secondary" size="sm" onClick={handleResetFilters} className="text-xs">
                      Clear Active Filters
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(ROUTES.TASKS)}
                      className="text-xs"
                    >
                      View All Tasks Workspace
                    </Button>
                  )
                }
              />
            </div>
          )}
        </CardContent>

        {/* 5. Pagination */}
        {(pagination.totalPages ?? 0) > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            <Pagination
              totalItems={pagination.totalItems}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
