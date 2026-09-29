import { useState, useEffect, useCallback, useMemo } from 'react'
import { usersApi } from '@/api/endpoints/users'
import { organizationsApi } from '@/api/endpoints/organizations'
import { departmentsApi } from '@/api/endpoints/departments'
import { useAuth } from '@/hooks/useAuth'
import { ROLES, USER_STATUS } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import { UserTable, UserForm, UserDetails } from '@/components/users'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Card, CardContent } from '@/components/ui/Card'
import {
  UserPlus,
  Search,
  RotateCw,
  CheckCircle2,
  ShieldAlert,
  Users,
  ShieldCheck,
  UserX,
  X,
  Building2,
} from 'lucide-react'

export function UsersPage() {
  const { user: currentUser } = useAuth()

  // State
  const [users, setUsers] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialData, setFormInitialData] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [statusModalUser, setStatusModalUser] = useState(null)
  const [deleteModalUser, setDeleteModalUser] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Check admin authorization
  const isAuthorized =
    currentUser?.role && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser.role)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  const loadData = useCallback(async () => {
    if (!isAuthorized) return

    try {
      const [usersRes, orgsRes, deptsRes] = await Promise.all([
        usersApi.getUsers(),
        organizationsApi.getOrganizations().catch(() => ({ data: { organizations: [] } })),
        departmentsApi.getDepartments().catch(() => ({ data: { departments: [] } })),
      ])

      const userList = usersRes?.data?.users || usersRes?.users || []
      const orgList = orgsRes?.data?.organizations || orgsRes?.organizations || []
      const deptList = deptsRes?.data?.departments || deptsRes?.departments || []

      setUsers(userList)
      setOrganizations(orgList)
      setDepartments(deptList)
      setError(null)
    } catch (err) {
      console.error('Failed to load user directory:', err)
      setError(err.message || 'Unable to retrieve user directory from server.')
    }
  }, [isAuthorized])

  useEffect(() => {
    let ignore = false
    async function init() {
      if (isAuthorized) {
        await loadData()
      }
      if (!ignore) {
        setIsLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [loadData, isAuthorized])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  // Filtered and searched users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
        const email = (u.email || '').toLowerCase()
        if (!fullName.includes(query) && !email.includes(query)) {
          return false
        }
      }

      // Role
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false
      }

      // Status
      if (statusFilter !== 'ALL' && u.status !== statusFilter) {
        return false
      }

      // Department
      if (departmentFilter !== 'ALL') {
        const userDeptId = u.departmentId || u.department?.id
        if (userDeptId !== departmentFilter) {
          return false
        }
      }

      return true
    })
  }, [users, searchQuery, roleFilter, statusFilter, departmentFilter])

  // Paginated slice
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  // Computed Stats for Administrative Header (only from existing data)
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === USER_STATUS.ACTIVE).length
    const inactive = total - active
    const admins = users.filter((u) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(u.role)).length
    return { total, active, inactive, admins }
  }, [users])

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    roleFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    departmentFilter !== 'ALL'

  const handleResetFilters = () => {
    setSearchQuery('')
    setRoleFilter('ALL')
    setStatusFilter('ALL')
    setDepartmentFilter('ALL')
    setCurrentPage(1)
  }

  // CRUD Handlers
  const handleCreateOrUpdateUser = async (formData) => {
    setIsActionLoading(true)
    try {
      if (formInitialData?.id) {
        await usersApi.updateUser(formInitialData.id, formData)
        showFeedback(`User ${formData.firstName} updated successfully.`)
      } else {
        await usersApi.createUser(formData)
        showFeedback(`User ${formData.firstName} created successfully.`)
      }
      await loadData()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!statusModalUser) return
    setIsActionLoading(true)

    const nextStatus =
      statusModalUser.status === USER_STATUS.ACTIVE
        ? USER_STATUS.INACTIVE
        : USER_STATUS.ACTIVE

    try {
      await usersApi.updateUserStatus(statusModalUser.id, { status: nextStatus })
      showFeedback(`User status changed to ${nextStatus}.`)
      setStatusModalUser(null)
      await loadData()
    } catch (err) {
      console.error('Status update error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to update user status.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return
    setIsActionLoading(true)
    try {
      await usersApi.deleteUser(deleteModalUser.id)
      showFeedback('User account removed successfully.')
      setDeleteModalUser(null)
      await loadData()
    } catch (err) {
      console.error('User delete error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to delete user account.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  // Graceful 403 Forbidden Screen for unauthorized roles
  if (!isAuthorized) {
    return (
      <div className="py-16 max-w-lg mx-auto px-4">
        <Card className="border-rose-200/80 shadow-xs">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              The User Directory and Identity Management modules are restricted to
              organization Administrators. Your current role is{' '}
              <strong className="text-slate-800 font-semibold">
                {formatRole(currentUser?.role)}
              </strong>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !users.length) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to Load User Directory"
          message={error}
          onRetry={loadData}
          retryLabel="Retry Connection"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Administrative Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Users
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#635BFF]/10 text-[#5148E5] border border-[#635BFF]/20">
              {users.length} {users.length === 1 ? 'member' : 'members'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage people, roles, departments, and workspace access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setFormInitialData(null)
              setIsFormOpen(true)
            }}
            className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* 2. Operational Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 leading-tight">{stats.total}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Accounts</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 leading-tight">{stats.active}</div>
            <div className="text-[11px] text-slate-500 font-medium">Active Members</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 leading-tight">{stats.inactive}</div>
            <div className="text-[11px] text-slate-500 font-medium">Inactive / Suspended</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 leading-tight">{departments.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Departments</div>
          </div>
        </div>
      </div>

      {/* Feedback Toast / Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <Card className="border-slate-200/80 bg-slate-50/60 shadow-2xs">
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-1 lg:col-span-1 relative">
              <Input
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                leftIcon={Search}
                className="py-1.5 text-xs bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'ALL', label: 'All Roles' },
                  ...Object.values(ROLES).map((r) => ({
                    value: r,
                    label: formatRole(r),
                  })),
                ]}
                className="py-1.5 text-xs bg-white"
              />
            </div>

            {/* Department Filter */}
            <div>
              <Select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'ALL', label: 'All Departments' },
                  ...departments.map((d) => ({
                    value: d.id,
                    label: d.name + (d.code ? ` (${d.code})` : ''),
                  })),
                ]}
                className="py-1.5 text-xs bg-white"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: USER_STATUS.ACTIVE, label: 'Active Only' },
                  { value: USER_STATUS.INACTIVE, label: 'Inactive Only' },
                  { value: USER_STATUS.SUSPENDED, label: 'Suspended Only' },
                ]}
                className="py-1.5 text-xs bg-white"
              />
            </div>
          </div>

          {/* Active Filter Indicators & Reset Action */}
          {hasActiveFilters && (
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing <strong className="text-slate-800">{filteredUsers.length}</strong> of{' '}
                <strong className="text-slate-800">{users.length}</strong> team members
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[#635BFF] hover:text-[#5148E5] font-semibold flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Reset filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. User Table */}
      <UserTable
        users={paginatedUsers}
        isLoading={isLoading}
        totalItems={filteredUsers.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onView={(u) => setViewingUser(u)}
        onEdit={(u) => {
          setFormInitialData(u)
          setIsFormOpen(true)
        }}
        onChangeStatus={(u) => setStatusModalUser(u)}
        onDelete={(u) => setDeleteModalUser(u)}
        onResetFilters={hasActiveFilters ? handleResetFilters : undefined}
      />

      {/* 5. User Create / Edit Form Modal */}
      <UserForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setFormInitialData(null)
        }}
        onSubmit={handleCreateOrUpdateUser}
        initialData={formInitialData}
        organizations={organizations}
        departments={departments}
        isLoading={isActionLoading}
      />

      {/* 6. User Details Modal */}
      <UserDetails
        isOpen={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        onEdit={(u) => {
          setViewingUser(null)
          setFormInitialData(u)
          setIsFormOpen(true)
        }}
        onChangeStatus={(u) => {
          setViewingUser(null)
          setStatusModalUser(u)
        }}
      />

      {/* 7. Change Status Confirmation Modal */}
      {statusModalUser && (
        <ConfirmationModal
          isOpen={Boolean(statusModalUser)}
          onClose={() => setStatusModalUser(null)}
          onConfirm={handleStatusToggle}
          title={`${
            statusModalUser.status === USER_STATUS.ACTIVE ? 'Deactivate' : 'Activate'
          } Account`}
          message={`Are you sure you want to change ${statusModalUser.firstName || 'this user'}'s account status to ${
            statusModalUser.status === USER_STATUS.ACTIVE ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmText={statusModalUser.status === USER_STATUS.ACTIVE ? 'Deactivate' : 'Activate'}
          tone={statusModalUser.status === USER_STATUS.ACTIVE ? 'warning' : 'primary'}
          isLoading={isActionLoading}
        />
      )}

      {/* 8. Delete User Confirmation Modal */}
      {deleteModalUser && (
        <ConfirmationModal
          isOpen={Boolean(deleteModalUser)}
          onClose={() => setDeleteModalUser(null)}
          onConfirm={handleDeleteUser}
          title="Delete User Account"
          message={`Are you sure you want to permanently remove ${
            deleteModalUser.firstName || 'this user'
          } (${deleteModalUser.email})? This action cannot be undone.`}
          confirmText="Delete Account"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
