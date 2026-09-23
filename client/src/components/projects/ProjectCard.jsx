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
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

function ProjectActionMenu({ project, onView, onEdit, onChangeStatus, onManageMembers, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Project actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white shadow-xl border border-slate-200/80 py-1.5 z-20 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onView(project)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            Project Details
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onEdit(project)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            Edit Project
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onManageMembers(project)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Manage Members
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onChangeStatus(project)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Change Status
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onDelete(project)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            Delete Project
          </button>
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

  const orgName = project.organization?.name || 'Main Organization'
  const hasDates = project.startDate || project.endDate

  return (
    <Card className="hover:shadow-md hover:border-indigo-200 transition-all duration-150 flex flex-col justify-between group">
      <CardContent className="p-5 flex flex-col h-full justify-between">
        <div>
          {/* Top Row: Code & Status & Menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {project.code}
              </span>
              <ProjectStatusBadge status={project.status} />
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

          {/* Project Title & Description */}
          <div className="mt-3">
            <h3
              onClick={() => onView(project)}
              className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer truncate"
              title={project.name}
            >
              {project.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
              {project.description || 'No detailed scope provided for this project.'}
            </p>
          </div>

          {/* Organization Pill */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3.5 pt-3 border-t border-slate-100">
            <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-600">{orgName}</span>
          </div>

          {/* Timeline Dates */}
          {hasDates && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-1.5">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {project.startDate ? formatDate(project.startDate) : 'TBD'} —{' '}
                {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
              </span>
            </div>
          )}
        </div>

        {/* Footer Quick Controls */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManageMembers(project)}
            className="text-xs text-slate-600 hover:text-indigo-600 p-1.5 h-8 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(project)}
            className="text-xs text-slate-700 hover:text-indigo-600 h-8 flex items-center gap-1.5"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Details</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
