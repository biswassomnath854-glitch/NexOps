import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { Building2, MoreVertical, Eye, Edit2, Shield, Trash2, Users } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

function DepartmentActionMenu({ department, onView, onEdit, onChangeStatus, onDelete }) {
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
        aria-label="Department actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-slate-200/80 py-1.5 z-20 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onView(department)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            View Details
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onEdit(department)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            Edit Department
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onChangeStatus(department)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Toggle Status
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onDelete(department)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            Delete Department
          </button>
        </div>
      )}
    </div>
  )
}

export function DepartmentTable({
  departments = [],
  isLoading = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onChangeStatus,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden p-6 space-y-4">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!departments || departments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <EmptyState
          icon={Building2}
          title="No Departments Found"
          description="Create your first corporate department to organize teams and divisions."
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Team Members</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created Date</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => {
            const memberCount = dept.users?.length || 0

            return (
              <TableRow key={dept.id} className="group">
                {/* Department Name */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/70 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {dept.name}
                      </div>
                      {dept.description && (
                        <div className="text-xs text-slate-400 max-w-xs truncate">
                          {dept.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Code */}
                <TableCell>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                    {dept.code}
                  </span>
                </TableCell>

                {/* Organization */}
                <TableCell>
                  <span className="text-xs text-slate-600 font-medium">
                    {dept.organization?.name || '—'}
                  </span>
                </TableCell>

                {/* Team Members */}
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={dept.status} />
                </TableCell>

                {/* Created Date */}
                <TableCell>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(dept.createdAt)}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(dept)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-slate-800"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(dept)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-indigo-600"
                      title="Edit department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <DepartmentActionMenu
                      department={dept}
                      onView={onView}
                      onEdit={onEdit}
                      onChangeStatus={onChangeStatus}
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
