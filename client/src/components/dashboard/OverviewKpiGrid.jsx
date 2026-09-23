import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertOctagon,
} from 'lucide-react'
import { KpiCard } from './KpiCard'
import { ROUTES } from '@/constants/routes'

export function OverviewKpiGrid({ overview, taskStatistics }) {
  const navigate = useNavigate()

  const totalProjects = overview?.projects?.total ?? 0
  const activeProjects = overview?.projects?.active ?? 0

  const totalTasks = overview?.tasks?.total ?? 0
  const completedTasks = overview?.tasks?.completed ?? 0
  const completionPercentage = overview?.tasks?.completionPercentage ?? 0

  const inProgressTasks = taskStatistics?.byStatus?.IN_PROGRESS ?? 0
  const blockedTasks = taskStatistics?.byStatus?.BLOCKED ?? 0
  const overdueTasks = taskStatistics?.deadlines?.overdue ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Projects KPI */}
      <KpiCard
        title="Total Projects"
        value={totalProjects}
        subtitle={`${activeProjects} active project workspaces`}
        badgeText={activeProjects > 0 ? 'Active' : 'Planning'}
        badgeVariant={activeProjects > 0 ? 'success' : 'neutral'}
        icon={FolderKanban}
        color="indigo"
        onClick={() => navigate(ROUTES.PROJECTS)}
      />

      {/* 2. Overall Task Completion */}
      <KpiCard
        title="Task Completion"
        value={`${completionPercentage}%`}
        subtitle={`${completedTasks} of ${totalTasks} tasks resolved`}
        progress={completionPercentage}
        icon={CheckCircle2}
        color="emerald"
        onClick={() => navigate(ROUTES.TASKS)}
      />

      {/* 3. In-Progress Pipeline */}
      <KpiCard
        title="In-Progress Tasks"
        value={inProgressTasks}
        subtitle={`${completedTasks} completed to date`}
        badgeText="Active Sprint"
        badgeVariant="primary"
        icon={Clock}
        color="sky"
        onClick={() => navigate(ROUTES.TASKS)}
      />

      {/* 4. Overdue Escalations */}
      <KpiCard
        title="Overdue Tasks"
        value={overdueTasks}
        subtitle={`${blockedTasks} blocked items requiring attention`}
        badgeText={overdueTasks > 0 ? 'Action Required' : 'On Track'}
        badgeVariant={overdueTasks > 0 ? 'danger' : 'success'}
        icon={AlertOctagon}
        color={overdueTasks > 0 ? 'rose' : 'emerald'}
        onClick={() => navigate(ROUTES.OVERDUE_TASKS)}
      />
    </div>
  )
}
