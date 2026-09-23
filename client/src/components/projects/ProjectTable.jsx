import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { ProjectStatusBadge } from './ProjectStatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { FolderKanban, MoreVertical, Eye, Edit2, Shield, Users, Trash2 } from 'lucide-react'
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
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <EmptyState
          icon={FolderKanban}
          title="No Projects Found"
          description="Create your first project workspace to begin tracking deliverables and milestones."
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Code & Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timeline Range</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((proj) => {
            const orgName = proj.organization?.name || 'Main Organization'

            return (
              <TableRow key={proj.id} className="group">
                {/* Code & Name */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {proj.code}
                        </span>
                        <span
                          onClick={() => onView(proj)}
                          className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {proj.name}
                        </span>
                      </div>
                      {proj.description && (
                        <div className="text-xs text-slate-400 max-w-sm truncate mt-0.5">
                          {proj.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Organization */}
                <TableCell>
                  <span className="text-xs text-slate-600 font-medium">{orgName}</span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <ProjectStatusBadge status={proj.status} />
                </TableCell>

                {/* Timeline Range */}
                <TableCell>
                  <span className="text-xs text-slate-500 font-mono">
                    {proj.startDate ? formatDate(proj.startDate) : 'TBD'} —{' '}
                    {proj.endDate ? formatDate(proj.endDate) : 'Ongoing'}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(proj)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-slate-800"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManageMembers(proj)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-indigo-600"
                      title="Manage members"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(proj)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-indigo-600"
                      title="Edit project"
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

      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
