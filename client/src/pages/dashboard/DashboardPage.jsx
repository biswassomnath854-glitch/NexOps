import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '@/api/endpoints/analytics'
import { tasksApi } from '@/api/endpoints/tasks'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import {
  DashboardHeader,
  OverviewKpiGrid,
  TaskStatusBreakdown,
  RecentActivityFeed,
  RecentTasksWidget,
  WorkloadSummaryWidget,
  DashboardQuickActions,
  DashboardSkeleton,
} from '@/components/dashboard'

const MANAGEMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
]

const PROJECT_MANAGEMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
]

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [overdueTasks, setOverdueTasks] = useState([])
  const [workloadData, setWorkloadData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const { user } = useAuth()
  const navigate = useNavigate()

  const isManagement =
    user?.role && MANAGEMENT_ROLES.includes(user.role)

  const canCreateProjects =
    user?.role && PROJECT_MANAGEMENT_ROLES.includes(user.role)

  const canCreateTasks =
    user?.role && user.role !== ROLES.VIEWER

  const loadData = useCallback(async () => {
    try {
      const [dashResult, overdueResult, workloadResult] = await Promise.allSettled([
        analyticsApi.getDashboard(),
        tasksApi.getOverdueTasks({ limit: 5 }),
        isManagement ? analyticsApi.getWorkload({ limit: 5 }) : Promise.resolve(null),
      ])

      if (dashResult.status === 'fulfilled') {
        const dashRes = dashResult.value
        const data =
          dashRes?.data?.dashboard ||
          dashRes?.dashboard ||
          dashRes?.data ||
          dashRes

        setDashboardData(data)
        setError(null)
      } else {
        const err = dashResult.reason
        console.error('Failed to load dashboard:', err)
        setError(
          err?.message ||
            'Unable to connect to SB Pvt. Ltd. dashboard service.'
        )
      }

      if (overdueResult.status === 'fulfilled') {
        const overdueRes = overdueResult.value
        const overdueList =
          overdueRes?.data?.tasks ||
          overdueRes?.tasks ||
          overdueRes?.data ||
          []

        setOverdueTasks(overdueList)
      } else {
        setOverdueTasks([])
      }

      if (isManagement && workloadResult.status === 'fulfilled' && workloadResult.value) {
        const workloadRes = workloadResult.value
        const workloadList =
          workloadRes?.data?.workload ||
          workloadRes?.workload ||
          []

        setWorkloadData(workloadList)
      } else {
        setWorkloadData(null)
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)

      setError(
        err.message ||
          'Unable to connect to SB Pvt. Ltd. dashboard service.'
      )
    }
  }, [isManagement])

  const handleRefresh = async () => {
    setIsRefreshing(true)

    await loadData()

    setIsRefreshing(false)
  }

  const handleRetry = async () => {
    setIsLoading(true)

    await loadData()

    setIsLoading(false)
  }

  useEffect(() => {
    let ignore = false

    async function init() {
      await loadData()

      if (!ignore) {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      ignore = true
    }
  }, [loadData])

  // Low-priority idle prefetch of the most likely next route (Tasks) once dashboard is ready
  useEffect(() => {
    if (isLoading || error) return

    const idleCallback =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 1200)

    const cancelIdle =
      typeof window !== 'undefined' && 'cancelIdleCallback' in window
        ? window.cancelIdleCallback
        : clearTimeout

    const handle = idleCallback(() => {
      import('@/pages/tasks/TasksPage')
    })

    return () => {
      cancelIdle(handle)
    }
  }, [isLoading, error])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="py-12">
        <ErrorState
          title="Dashboard Service Unavailable"
          message={error}
          onRetry={handleRetry}
          retryLabel="Reload Dashboard"
        />
      </div>
    )
  }

  const overview = dashboardData?.overview
  const taskStatistics = dashboardData?.taskStatistics
  const projectStatistics = dashboardData?.projectStatistics
  const recentActivities = dashboardData?.recentActivities || []

  const scope =
    dashboardData?.scope ||
    (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  const overdueCount = taskStatistics?.deadlines?.overdue || 0
  const blockedCount = taskStatistics?.byStatus?.BLOCKED || 0
  const dueTodayCount = taskStatistics?.deadlines?.dueToday || 0
  const dueSoonCount = taskStatistics?.deadlines?.dueSoon || 0
  const hasAttentionItems = overdueCount > 0 || blockedCount > 0 || dueTodayCount > 0

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header with greeting, scope, and role-aware quick controls */}
      <DashboardHeader
        scope={scope}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onNewTask={
          canCreateTasks
            ? () => navigate(ROUTES.TASKS)
            : undefined
        }
        onNewProject={
          canCreateProjects
            ? () => navigate(ROUTES.PROJECTS)
            : undefined
        }
      />

      {/* 2. Primary KPI Cards Grid */}
      <OverviewKpiGrid
        overview={overview}
        taskStatistics={taskStatistics}
      />

      {/* 3. Operational Attention Strip — Answers "What needs attention right now?" */}
      {hasAttentionItems ? (
        <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200/90 bg-amber-50/40 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/80 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-bold text-slate-900">
                  Immediate Operational Attention
                </h3>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  — Active items requiring lead review
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {overdueCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.OVERDUE_TASKS)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-100/90 text-rose-800 border border-rose-200 text-xs font-semibold hover:bg-rose-200/70 transition-colors cursor-pointer"
                  >
                    <AlertOctagon className="w-3 h-3 text-rose-600" />
                    <span>{overdueCount} Overdue</span>
                  </button>
                )}
                {blockedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.TASKS)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100/90 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-200/70 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{blockedCount} Blocked</span>
                  </button>
                )}
                {dueTodayCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.TASKS)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{dueTodayCount} Due Today</span>
                  </button>
                )}
                {dueSoonCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-xs font-medium">
                    <span>{dueSoonCount} Due in 3 Days</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center">
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigate(ROUTES.OVERDUE_TASKS)}
              rightIcon={ArrowRight}
              className="text-xs bg-white border-amber-300 hover:bg-amber-50 text-slate-800"
            >
              Review Escalations
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-3 px-4 rounded-xl border border-emerald-200/90 bg-emerald-50/40 shadow-2xs flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-800">
              Operational Delivery on Schedule
            </span>
            <span className="text-slate-500 hidden sm:inline">
              • Zero overdue SLA breaches, zero blocked tasks across active sprints.
            </span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded">
            All Systems Nominal
          </span>
        </div>
      )}

      {/* 4. Task Status Pipeline, Priority, and Deadline breakdown */}
      <TaskStatusBreakdown
        taskStatistics={taskStatistics}
        projectStatistics={projectStatistics}
      />

      {/* 5. Actionable Tasks Widget & Workload Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={
            isManagement
              ? 'lg:col-span-2'
              : 'lg:col-span-3'
          }
        >
          <RecentTasksWidget tasks={overdueTasks} />
        </div>

        {isManagement && (
          <div className="lg:col-span-1">
            <WorkloadSummaryWidget
              overview={overview}
              workloadData={workloadData}
            />
          </div>
        )}
      </div>

      {/* 6. Recent Activity Audit Trail */}
      <RecentActivityFeed activities={recentActivities} />

      {/* 7. Dashboard Quick Actions Shortcuts */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Quick Workspaces
        </p>

        <DashboardQuickActions />
      </div>
    </div>
  )
}