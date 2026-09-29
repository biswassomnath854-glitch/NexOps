import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { RoleBadge } from '@/components/common/RoleBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { Users, MoreVertical, Eye, Edit2, Shield, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

function UserActionMenu({ user, onView, onEdit, onChangeStatus, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
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
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
        aria-label="User actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-slate-200/80 py-1.5 z-30 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onView(user)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            View Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onEdit(user)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            Edit User
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onChangeStatus(user)
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
              onDelete(user)
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            Delete User
          </button>
        </div>
      )}
    </div>
  )
}

export function UserTable({
  users = [],
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
  onResetFilters,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden p-6 space-y-4 shadow-2xs">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="flex items-center gap-4 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-slate-100 rounded-full" />
            <div className="h-6 w-16 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
        <EmptyState
          icon={Users}
          title="No Users Found"
          description="No user records match your current search and filter criteria."
          action={
            onResetFilters && (
              <Button variant="outline" size="sm" onClick={onResetFilters} className="text-xs">
                Clear Filters
              </Button>
            )
          }
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
              <TableHead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                User / Contact
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                Role
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                Department
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                Organization
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                Joined
              </TableHead>
              <TableHead align="right" className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {users.map((user) => {
              const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
              const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'

              return (
                <TableRow key={user.id} className="group hover:bg-slate-50/75 transition-colors">
                  {/* User avatar + name */}
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#635BFF]/10 border border-[#635BFF]/20 text-[#635BFF] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-[#635BFF] transition-colors truncate">
                          {fullName}
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="py-3">
                    <RoleBadge role={user.role} showIcon />
                  </TableCell>

                  {/* Department */}
                  <TableCell className="py-3">
                    {user.department?.name ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100/80 text-slate-700 border border-slate-200/80">
                        <span>{user.department.name}</span>
                        {user.department.code && (
                          <span className="text-[10px] font-mono text-slate-400">({user.department.code})</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </TableCell>

                  {/* Organization */}
                  <TableCell className="py-3">
                    <span className="text-xs text-slate-600 font-medium">
                      {user.organization?.name || '—'}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    <StatusBadge status={user.status} />
                  </TableCell>

                  {/* Joined Date */}
                  <TableCell className="py-3">
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDate(user.createdAt)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(user)}
                        className="hidden sm:inline-flex p-1.5 h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="hidden sm:inline-flex p-1.5 h-7 w-7 text-slate-400 hover:text-[#635BFF] hover:bg-[#635BFF]/10"
                        title="Edit user"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <UserActionMenu
                        user={user}
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
      </div>

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
