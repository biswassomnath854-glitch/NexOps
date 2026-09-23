import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '@/api/endpoints/analytics'
import { tasksApi } from '@/api/endpoints/tasks'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { ErrorState } from '@/components/feedback/ErrorState'
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

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null)
  const [overdueTasks, setOverdueTasks] = useState([])
  const [workloadData, setWorkloadData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const { user } = useAuth()
  const navigate = useNavigate()

  const isManagement = user?.role && [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.TEAM_LEAD,
  ].includes(user.role)

  const loadData = useCallback(async () => {
    try {
      const dashRes = await analyticsApi.getDashboard()
      const data = dashRes?.data?.dashboard || dashRes?.dashboard || dashRes?.data || dashRes
      setDashboardData(data)
      setError(null)

      try {
        const overdueRes = await tasksApi.getOverdueTasks({ limit: 5 })
        const overdueList = overdueRes?.data?.tasks || overdueRes?.tasks || overdueRes?.data || []
        setOverdueTasks(overdueList)
      } catch {
        setOverdueTasks([])
      }

      if (isManagement) {
        try {
          const workloadRes = await analyticsApi.getWorkload({ limit: 5 })
          const workloadList = workloadRes?.data?.workload || workloadRes?.workload || []
          setWorkloadData(workloadList)
        } catch {
          setWorkloadData(null)
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError(err.message || 'Unable to connect to NexOps dashboard service.')
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
  const scope = dashboardData?.scope || (isManagement ? 'ORGANIZATION' : 'PERSONAL')

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. Header with greeting, scope, and quick controls */}
      <DashboardHeader
        scope={scope}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onNewTask={() => navigate(ROUTES.TASKS)}
        onNewProject={() => navigate(ROUTES.PROJECTS)}
      />

      {/* 2. Primary KPI Cards Grid */}
      <OverviewKpiGrid
        overview={overview}
        taskStatistics={taskStatistics}
      />

      {/* 3. Task Status Pipeline, Priority, and Deadline breakdown */}
      <TaskStatusBreakdown
        taskStatistics={taskStatistics}
        projectStatistics={projectStatistics}
      />

      {/* 4. Actionable Tasks Widget & Workload Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={isManagement ? 'lg:col-span-2' : 'lg:col-span-3'}>
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

      {/* 5. Recent Activity Audit Trail */}
      <RecentActivityFeed activities={recentActivities} />

      {/* 6. Dashboard Quick Actions Shortcuts */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Quick Workspaces
        </p>
        <DashboardQuickActions />
      </div>
    </div>
  )
}
