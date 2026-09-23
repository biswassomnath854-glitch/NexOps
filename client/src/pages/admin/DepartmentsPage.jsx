import { useState, useEffect, useCallback, useMemo } from 'react'
import { departmentsApi } from '@/api/endpoints/departments'
import { organizationsApi } from '@/api/endpoints/organizations'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import {
  DepartmentTable,
  DepartmentForm,
  DepartmentDetailsModal,
} from '@/components/departments'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Plus,
  Search,
  RotateCw,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'

export function DepartmentsPage() {
  const { user: currentUser } = useAuth()

  // State
  const [departments, setDepartments] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [orgFilter, setOrgFilter] = useState('ALL')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialData, setFormInitialData] = useState(null)
  const [viewingDept, setViewingDept] = useState(null)
  const [statusModalDept, setStatusModalDept] = useState(null)
  const [deleteModalDept, setDeleteModalDept] = useState(null)
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
      const [deptRes, orgRes] = await Promise.all([
        departmentsApi.getDepartments(),
        organizationsApi.getOrganizations().catch(() => ({ data: { organizations: [] } })),
      ])

      const deptList = deptRes?.data?.departments || deptRes?.departments || []
      const orgList = orgRes?.data?.organizations || orgRes?.organizations || []

      setDepartments(deptList)
      setOrganizations(orgList)
      setError(null)
    } catch (err) {
      console.error('Failed to load departments:', err)
      setError(err.message || 'Unable to retrieve departments from server.')
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

  // Filtered departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const name = (dept.name || '').toLowerCase()
        const code = (dept.code || '').toLowerCase()
        if (!name.includes(query) && !code.includes(query)) {
          return false
        }
      }

      if (statusFilter !== 'ALL' && dept.status !== statusFilter) {
        return false
      }

      if (orgFilter !== 'ALL') {
        const deptOrgId = dept.organizationId || dept.organization?.id
        if (deptOrgId !== orgFilter) {
          return false
        }
      }

      return true
    })
  }, [departments, searchQuery, statusFilter, orgFilter])

  // Paginated slice
  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDepartments.slice(start, start + pageSize)
  }, [filteredDepartments, currentPage, pageSize])

  // CRUD Actions
  const handleCreateOrUpdateDept = async (formData) => {
    setIsActionLoading(true)
    try {
      if (formInitialData?.id) {
        await departmentsApi.updateDepartment(formInitialData.id, formData)
        showFeedback(`Department "${formData.name}" updated successfully.`)
      } else {
        await departmentsApi.createDepartment(formData)
        showFeedback(`Department "${formData.name}" created successfully.`)
      }
      await loadData()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!statusModalDept) return
    setIsActionLoading(true)

    const nextStatus = statusModalDept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      await departmentsApi.updateDepartmentStatus(statusModalDept.id, { status: nextStatus })
      showFeedback(`Department status updated to ${nextStatus}.`)
      setStatusModalDept(null)
      await loadData()
    } catch (err) {
      console.error('Department status update error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to update department status.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!deleteModalDept) return
    setIsActionLoading(true)
    try {
      await departmentsApi.deleteDepartment(deleteModalDept.id)
      showFeedback('Department deleted successfully.')
      setDeleteModalDept(null)
      await loadData()
    } catch (err) {
      console.error('Department delete error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to delete department.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  // Graceful 403 Forbidden Screen
  if (!isAuthorized) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <Card className="border-rose-200">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Department structures and divisional management are restricted to organization
              Administrators. Your current role is{' '}
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

  if (error && !departments.length) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to Load Departments"
          message={error}
          onRetry={loadData}
          retryLabel="Retry Connection"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Corporate Departments & Divisions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {departments.length} {departments.length === 1 ? 'division' : 'divisions'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize teams, assign operational codes, and structure business units.
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
            <Plus className="w-4 h-4" />
            Create Department
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
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

      {/* 2. Search & Filter Bar */}
      <Card className="border-slate-200/80 bg-slate-50/50">
        <CardContent className="p-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Input
                placeholder="Search department name or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                leftIcon={Search}
                className="py-1.5 text-xs"
              />
            </div>

            <div>
              <Select
                value={orgFilter}
                onChange={(e) => {
                  setOrgFilter(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'ALL', label: 'All Organizations' },
                  ...organizations.map((org) => ({
                    value: org.id,
                    label: org.name,
                  })),
                ]}
                className="py-1.5 text-xs"
              />
            </div>

            <div>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Only' },
                  { value: 'INACTIVE', label: 'Inactive Only' },
                ]}
                className="py-1.5 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Department Table */}
      <DepartmentTable
        departments={paginatedDepartments}
        isLoading={isLoading}
        totalItems={filteredDepartments.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onView={(d) => setViewingDept(d)}
        onEdit={(d) => {
          setFormInitialData(d)
          setIsFormOpen(true)
        }}
        onChangeStatus={(d) => setStatusModalDept(d)}
        onDelete={(d) => setDeleteModalDept(d)}
      />

      {/* 4. Create/Edit Department Modal */}
      <DepartmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setFormInitialData(null)
        }}
        onSubmit={handleCreateOrUpdateDept}
        initialData={formInitialData}
        organizations={organizations}
        isLoading={isActionLoading}
      />

      {/* 5. Department Details Modal */}
      <DepartmentDetailsModal
        isOpen={Boolean(viewingDept)}
        onClose={() => setViewingDept(null)}
        department={viewingDept}
        onEdit={(d) => {
          setViewingDept(null)
          setFormInitialData(d)
          setIsFormOpen(true)
        }}
        onChangeStatus={(d) => {
          setViewingDept(null)
          setStatusModalDept(d)
        }}
      />

      {/* 6. Toggle Status Modal */}
      {statusModalDept && (
        <ConfirmationModal
          isOpen={Boolean(statusModalDept)}
          onClose={() => setStatusModalDept(null)}
          onConfirm={handleStatusToggle}
          title={`${
            statusModalDept.status === 'ACTIVE' ? 'Deactivate' : 'Activate'
          } Department`}
          message={`Are you sure you want to change the status of ${statusModalDept.name} to ${
            statusModalDept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmText={statusModalDept.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          tone={statusModalDept.status === 'ACTIVE' ? 'warning' : 'primary'}
          isLoading={isActionLoading}
        />
      )}

      {/* 7. Delete Department Modal */}
      {deleteModalDept && (
        <ConfirmationModal
          isOpen={Boolean(deleteModalDept)}
          onClose={() => setDeleteModalDept(null)}
          onConfirm={handleDeleteDepartment}
          title="Delete Department"
          message={`Are you sure you want to permanently delete "${deleteModalDept.name}" (${deleteModalDept.code})? Any assigned team members will become unassigned.`}
          confirmText="Delete Department"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
