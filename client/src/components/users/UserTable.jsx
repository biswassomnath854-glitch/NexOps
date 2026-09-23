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
        aria-label="User actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-lg border border-slate-200/80 py-1.5 z-20 animate-in fade-in zoom-in-95">
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
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden p-6 space-y-4">
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
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <EmptyState
          icon={Users}
          title="No Users Found"
          description="No users match your criteria. You can invite or create new team members."
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User / Contact</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
            const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'

            return (
              <TableRow key={user.id} className="group">
                {/* User avatar + name */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {fullName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                    </div>
                  </div>
                </TableCell>

                {/* Role */}
                <TableCell>
                  <RoleBadge role={user.role} showIcon />
                </TableCell>

                {/* Department */}
                <TableCell>
                  {user.department?.name ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {user.department.name}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Unassigned</span>
                  )}
                </TableCell>

                {/* Organization */}
                <TableCell>
                  <span className="text-xs text-slate-600 font-medium">
                    {user.organization?.name || '—'}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>

                {/* Joined Date */}
                <TableCell>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(user.createdAt)}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell align="right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(user)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-slate-800"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-indigo-600"
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
