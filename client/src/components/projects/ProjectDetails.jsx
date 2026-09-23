import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { ProjectMembers } from './ProjectMembers'
import { projectsApi } from '@/api/endpoints/projects'
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
  const [tasks, setTasks] = useState([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(true)

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

  return (
    <div className="space-y-6">
      {/* 1. Hero Card */}
      <Card className="border-indigo-100/60 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                <FolderKanban className="w-8 h-8" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {project.name}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                    {project.code}
                  </span>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Landmark className="w-3.5 h-3.5 text-slate-400" />
                    {orgName}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {project.startDate ? formatDate(project.startDate) : 'TBD'} —{' '}
                    {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Created {formatDateTime(project.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeStatus(project)}
                className="flex items-center gap-1.5 text-xs text-slate-700"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Change Status
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEdit(project)}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Project
              </Button>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed max-w-3xl">
              {project.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Task Velocity & Deliverable Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Project Task Health & Velocity
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {completedTasks} / {totalTasks} Completed ({completionPct}%)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>

          {isLoadingTasks ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>To Do</span>
                </div>
                <div className="text-xl font-bold text-slate-900 mt-1">{todoTasks}</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100/60">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>In Progress</span>
                </div>
                <div className="text-xl font-bold text-blue-900 mt-1">{inProgressTasks}</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100/60">
                <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                  <span>Blocked</span>
                </div>
                <div className="text-xl font-bold text-amber-900 mt-1">{blockedTasks}</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Completed</span>
                </div>
                <div className="text-xl font-bold text-emerald-900 mt-1">{completedTasks}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Project Team Members */}
      <ProjectMembers
        members={members}
        onOpenAddMember={onOpenAddMember}
        onUpdateRole={onUpdateMemberRole}
        onRemoveMember={onRemoveMember}
        isProjectActive={isProjectActive}
      />

      {/* 4. Metadata Footer */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>Project UUID:</span>
          <span className="font-mono text-slate-600">{project.id}</span>
        </div>
        <div>Organization ID: {project.organizationId}</div>
      </div>
    </div>
  )
}
