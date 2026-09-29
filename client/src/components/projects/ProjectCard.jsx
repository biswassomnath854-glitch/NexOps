import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import {
  FolderKanban,
  Landmark,
  Calendar,
  MoreVertical,
  Eye,
  Edit2,
  Shield,
  Users,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

function ProjectActionMenu({
  project,
  onView,
  onEdit,
  onChangeStatus,
  onManageMembers,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#635BFF]/30"
        aria-label={`Actions for project ${project.name}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white shadow-xl border border-slate-200/90 py-1.5 z-20 animate-in fade-in zoom-in-95 origin-top-right">
          <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              {project.code}
            </p>
            <p className="text-xs font-semibold text-slate-800 truncate">{project.name}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onView?.(project)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Workspace Details</span>
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onEdit(project)
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Configuration</span>
            </button>
          )}

          {onManageMembers && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onManageMembers(project)
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Manage Team Members</span>
            </button>
          )}

          {onChangeStatus && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onChangeStatus(project)
              }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Transition Status</span>
            </button>
          )}

          {onDelete && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onDelete(project)
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Workspace</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function ProjectCard({
  project,
  onView,
  onEdit,
  onChangeStatus,
  onManageMembers,
  onDelete,
}) {
  if (!project) return null

  const orgName = project.organization?.name || 'Primary Organization'
  const hasDates = project.startDate || project.endDate

  // Progress/task data if available in existing data structure
  const hasTaskData = Array.isArray(project.tasks) && project.tasks.length > 0
  const completedTaskCount = hasTaskData
    ? project.tasks.filter((t) => t.status === 'COMPLETED').length
    : null
  const totalTaskCount = hasTaskData ? project.tasks.length : null
  const progressPct =
    typeof project.progress === 'number'
      ? Math.round(project.progress)
      : totalTaskCount && totalTaskCount > 0
      ? Math.round((completedTaskCount / totalTaskCount) * 100)
      : null

  // Member count if provided in data
  const memberCount = Array.isArray(project.members) ? project.members.length : null

  return (
    <Card className="hover:shadow-md hover:border-slate-300/90 transition-all duration-150 flex flex-col justify-between group bg-white border-slate-200/80">
      <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
        <div>
          {/* 1. Header: Project Name & Actions Menu */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3
                onClick={() => onView?.(project)}
                className="text-base font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors cursor-pointer truncate leading-tight"
                title={project.name}
              >
                {project.name}
              </h3>
            </div>

            <ProjectActionMenu
              project={project}
              onView={onView}
              onEdit={onEdit}
              onChangeStatus={onChangeStatus}
              onManageMembers={onManageMembers}
              onDelete={onDelete}
            />
          </div>

          {/* 2. Code & Semantic Status */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 select-none">
              {project.code}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>

          {/* 3. Description Scope */}
          <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed min-h-[34px]">
            {project.description || 'No detailed scope description provided for this project.'}
          </p>

          {/* 4. Progress bar (only when existing data is available) */}
          {progressPct !== null && (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Progress
                </span>
                <span className="font-mono text-slate-500 font-semibold">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* 5. Organization & Timeline Information */}
          <div className="space-y-1.5 mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-2 min-w-0">
              <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-slate-700">{orgName}</span>
            </div>

            {hasDates && (
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {project.startDate ? formatDate(project.startDate) : 'TBD'} —{' '}
                  {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                </span>
              </div>
            )}

            {memberCount !== null && (
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{memberCount} team members assigned</span>
              </div>
            )}
          </div>
        </div>

        {/* 6. Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManageMembers?.(project)}
            className="text-xs text-slate-600 hover:text-slate-900 p-1.5 h-8 flex items-center gap-1.5 font-medium"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onView?.(project)}
            className="text-xs text-slate-800 hover:text-[#635BFF] h-8 flex items-center gap-1.5 font-semibold group/btn"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#635BFF] transition-colors" />
            <span>Workspace</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
