import { useState, useRef, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import {
  FolderKanban,
  MoreVertical,
  Eye,
  Edit2,
  Shield,
  Users,
  Trash2,
  Landmark,
  Calendar,
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

export function ProjectTable({
  projects = [],
  isLoading = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onChangeStatus,
  onManageMembers,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden p-6 space-y-4 shadow-2xs">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="flex items-center gap-4 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/4 bg-slate-200/80 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-4 w-28 bg-slate-100 rounded hidden md:block" />
            <div className="h-8 w-20 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <EmptyState
          icon={FolderKanban}
          title="No Projects Found"
          description="Create your first project workspace to begin tracking deliverables, rosters, and milestones."
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 border-b border-slate-200/80">
              <TableHead className="font-semibold text-slate-700 py-3">Project Workspace</TableHead>
              <TableHead className="font-semibold text-slate-700 py-3">Organization</TableHead>
              <TableHead className="font-semibold text-slate-700 py-3">Status</TableHead>
              <TableHead className="font-semibold text-slate-700 py-3">Timeline Range</TableHead>
              <TableHead align="right" className="font-semibold text-slate-700 py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((proj) => {
              const orgName = proj.organization?.name || 'Primary Organization'

              return (
                <TableRow
                  key={proj.id}
                  className="group hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-0"
                >
                  {/* Code & Name */}
                  <TableCell className="py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-[#635BFF]/10 group-hover:border-[#635BFF]/30 group-hover:text-[#635BFF] transition-colors mt-0.5">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 select-none">
                            {proj.code}
                          </span>
                          <span
                            onClick={() => onView?.(proj)}
                            className="font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors cursor-pointer text-sm"
                          >
                            {proj.name}
                          </span>
                        </div>
                        {proj.description && (
                          <p className="text-xs text-slate-400 max-w-md truncate mt-0.5 leading-relaxed">
                            {proj.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Organization */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">{orgName}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5">
                    <ProjectStatusBadge status={proj.status} />
                  </TableCell>

                  {/* Timeline Range */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {proj.startDate ? formatDate(proj.startDate) : 'TBD'} —{' '}
                        {proj.endDate ? formatDate(proj.endDate) : 'Ongoing'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" className="py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(proj)}
                        className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="View workspace details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageMembers?.(proj)}
                        className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-[#635BFF] hover:bg-[#635BFF]/10"
                        title="Manage team members"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(proj)}
                        className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-[#635BFF] hover:bg-[#635BFF]/10"
                        title="Edit configuration"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <ProjectActionMenu
                        project={proj}
                        onView={onView}
                        onEdit={onEdit}
                        onChangeStatus={onChangeStatus}
                        onManageMembers={onManageMembers}
                        onDelete={onDelete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
        <Pagination
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[6, 10, 20, 50]}
        />
      </div>
    </div>
  )
}
