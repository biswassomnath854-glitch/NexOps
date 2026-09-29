import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { ProjectMembers } from './ProjectMembers'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge'
import { TaskAssignee } from '@/components/tasks/TaskAssignee'
import { DueDateIndicator } from '@/components/tasks/DueDateIndicator'
import { EmptyState } from '@/components/feedback/EmptyState'
import { projectsApi } from '@/api/endpoints/projects'
import { ROUTES } from '@/constants/routes'
import { formatDate, formatDateTime } from '@/utils/formatters'
import {
  FolderKanban,
  Landmark,
  Calendar,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Edit2,
  Shield,
  Fingerprint,
  Search,
  CheckSquare,
  ArrowRight,
  Info,
} from 'lucide-react'

export function ProjectDetails({
  project,
  members = [],
  onEdit,
  onChangeStatus,
  onOpenAddMember,
  onUpdateMemberRole,
  onRemoveMember,
}) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

  // Task filter & search
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL')
  const [taskSearch, setTaskSearch] = useState('')

  useEffect(() => {
    let ignore = false
    async function fetchTasks() {
      if (!project?.id) {
        setIsLoadingTasks(false)
        return
      }
      try {
        const res = await projectsApi.getProjectTasks(project.id)
        if (!ignore) {
          const taskList = res?.data?.tasks || res?.tasks || res?.data || []
          setTasks(Array.isArray(taskList) ? taskList : [])
        }
      } catch {
        if (!ignore) setTasks([])
      } finally {
        if (!ignore) setIsLoadingTasks(false)
      }
    }

    fetchTasks()
    return () => {
      ignore = true
    }
  }, [project])

  if (!project) return null

  // Calculate task summary statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length
  const todoTasks = tasks.filter((t) => t.status === 'TODO').length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const isProjectActive = project.status === 'ACTIVE'
  const orgName = project.organization?.name || 'Primary Organization'

  // Filter tasks based on active tab and search
  const filteredTasks = tasks.filter((t) => {
    if (taskStatusFilter !== 'ALL' && t.status !== taskStatusFilter) {
      return false
    }
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase().trim()
      const title = (t.title || '').toLowerCase()
      const code = (t.code || '').toLowerCase()
      if (!title.includes(q) && !code.includes(q)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* 1. Header: Project Identity & Primary Workspace Controls */}
      <Card className="border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#635BFF]/10 border border-[#635BFF]/20 text-[#635BFF] flex items-center justify-center font-black text-2xl shadow-2xs shrink-0 mt-0.5">
                <FolderKanban className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {project.name}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200/90 select-none">
                    {project.code}
                  </span>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2.5 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    {orgName}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {project.startDate ? formatDate(project.startDate) : 'TBD'} —{' '}
                    {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px] hidden sm:inline-block">
                    Created {formatDateTime(project.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
              {onChangeStatus && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onChangeStatus(project)}
                  className="flex items-center gap-1.5 text-xs text-slate-700"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Change Status</span>
                </Button>
              )}

              {onEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onEdit(project)}
                  className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Project</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Overview / Scope narrative */}
      <Card className="border-slate-200/80 bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
            <Info className="w-4 h-4 text-[#635BFF]" />
            Project Scope & Operational Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Scope Description
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {project.description ||
                  'No detailed scope description has been provided for this project workspace.'}
              </p>
            </div>

            <div className="space-y-3 lg:border-l lg:border-slate-100 lg:pl-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Organization</span>
                <span className="font-medium text-slate-800">{orgName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Target Timeline</span>
                <span className="font-mono text-slate-700">
                  {project.startDate ? formatDate(project.startDate) : 'Not specified'} to{' '}
                  {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Current Status</span>
                <div className="mt-1">
                  <ProjectStatusBadge status={project.status} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Progress & Task Health Section */}
      <Card className="border-slate-200/80 bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Project Task Health & Velocity
            </CardTitle>
            <div className="text-xs font-mono font-semibold text-slate-500">
              {completedTasks} of {totalTasks} tasks completed ({completionPct}%)
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Progress Bar */}
          <div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Metric Cards */}
          {isLoadingTasks ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100/80 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    To Do
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Queue</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">{todoTasks}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-sky-700 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    In Progress
                  </span>
                  <span className="text-[11px] font-mono text-sky-600">Active</span>
                </div>
                <div className="text-xl font-bold text-sky-950 mt-1">{inProgressTasks}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                    Blocked
                  </span>
                  <span className="text-[11px] font-mono text-amber-600">At Risk</span>
                </div>
                <div className="text-xl font-bold text-amber-950 mt-1">{blockedTasks}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Completed
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600">Done</span>
                </div>
                <div className="text-xl font-bold text-emerald-950 mt-1">{completedTasks}</div>
              </div>
            </div>
          )}

          {/* Task Worklist Filter Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'ALL', label: 'All Tasks', count: totalTasks },
                { id: 'TODO', label: 'To Do', count: todoTasks },
                { id: 'IN_PROGRESS', label: 'In Progress', count: inProgressTasks },
                { id: 'BLOCKED', label: 'Blocked', count: blockedTasks },
                { id: 'COMPLETED', label: 'Completed', count: completedTasks },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTaskStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                    taskStatusFilter === tab.id
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono rounded-full px-1.5 py-0.2 ${
                      taskStatusFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Task Search within project */}
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search project tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                leftIcon={Search}
                className="py-1 text-xs"
              />
            </div>
          </div>

          {/* Project Tasks Table */}
          {isLoadingTasks ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100/80 rounded-xl" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 text-center">
              <EmptyState
                icon={CheckSquare}
                title={
                  tasks.length === 0 ? 'No Tasks in this Project' : 'No Matching Tasks Found'
                }
                description={
                  tasks.length === 0
                    ? 'No deliverables or tasks have been assigned to this project workspace yet.'
                    : 'No tasks in this project match your active status or search filters.'
                }
                action={
                  tasks.length === 0 ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(ROUTES.TASKS)}
                      className="text-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                      Create Task in Tasks Workspace
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(ROUTES.TASK_DETAILS(task.id))}
                  className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer group"
                >
                  {/* Left: Task Code & Title */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 select-none shrink-0">
                      {task.code || task.id?.slice(0, 8)}
                    </span>
                    <span className="font-semibold text-slate-900 group-hover:text-[#635BFF] transition-colors text-xs truncate">
                      {task.title}
                    </span>
                  </div>

                  {/* Right: Badges, Assignee, Due Date, Action */}
                  <div className="flex items-center gap-3 flex-wrap shrink-0 self-end sm:self-auto">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <TaskPriorityBadge priority={task.priority} size="sm" />

                    <div className="hidden md:block">
                      <TaskAssignee assignee={task.assignee} size="sm" />
                    </div>

                    <div className="hidden lg:block">
                      <DueDateIndicator
                        dueDate={task.dueDate}
                        deadline={task.deadline}
                        compact
                      />
                    </div>

                    <div className="text-slate-400 group-hover:text-[#635BFF] group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Project Team Members */}
      <ProjectMembers
        members={members}
        onOpenAddMember={onOpenAddMember}
        onUpdateRole={onUpdateMemberRole}
        onRemoveMember={onRemoveMember}
        isProjectActive={isProjectActive}
      />

      {/* 5. Governance & Technical Metadata Footer */}
      <Card className="border-slate-200/80 bg-slate-50/50 shadow-2xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap">
            <Fingerprint className="w-4 h-4 text-slate-400" />
            <span>Project UUID:</span>
            <span className="font-mono text-slate-700 select-all">{project.id}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>Org: {project.organizationId}</span>
            <span>Updated: {formatDate(project.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
