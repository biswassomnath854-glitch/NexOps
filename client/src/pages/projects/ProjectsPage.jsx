import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsApi } from '@/api/endpoints/projects'
import { organizationsApi } from '@/api/endpoints/organizations'
import { usersApi } from '@/api/endpoints/users'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { formatRole } from '@/utils/formatters'
import {
  ProjectCard,
  ProjectTable,
  ProjectForm,
  MemberSelector,
} from '@/components/projects'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { Pagination } from '@/components/common/Pagination'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Card, CardContent } from '@/components/ui/Card'
import {
  FolderPlus,
  Search,
  RotateCw,
  CheckCircle2,
  ShieldAlert,
  LayoutGrid,
  List,
} from 'lucide-react'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function ProjectsPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  // State
  const [projects, setProjects] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // View Mode & Filters
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [orgFilter, setOrgFilter] = useState('ALL')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialData, setFormInitialData] = useState(null)
  const [statusModalProject, setStatusModalProject] = useState(null)
  const [deleteModalProject, setDeleteModalProject] = useState(null)
  const [memberModalProject, setMemberModalProject] = useState(null)
  const [projectMembers, setProjectMembers] = useState([])
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
      const [projRes, orgRes, usersRes] = await Promise.all([
        projectsApi.getProjects(),
        organizationsApi.getOrganizations().catch(() => ({ data: { organizations: [] } })),
        usersApi.getUsers().catch(() => ({ data: { users: [] } })),
      ])

      const projList = projRes?.data?.projects || projRes?.projects || []
      const orgList = orgRes?.data?.organizations || orgRes?.organizations || []
      const userList = usersRes?.data?.users || usersRes?.users || []

      setProjects(projList)
      setOrganizations(orgList)
      setUsers(userList)
      setError(null)
    } catch (err) {
      console.error('Failed to load projects workspace:', err)
      setError(err.message || 'Unable to retrieve projects from server.')
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

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const name = (proj.name || '').toLowerCase()
        const code = (proj.code || '').toLowerCase()
        if (!name.includes(query) && !code.includes(query)) {
          return false
        }
      }

      if (statusFilter !== 'ALL' && proj.status !== statusFilter) {
        return false
      }

      if (orgFilter !== 'ALL') {
        const projOrgId = proj.organizationId || proj.organization?.id
        if (projOrgId !== orgFilter) {
          return false
        }
      }

      return true
    })
  }, [projects, searchQuery, statusFilter, orgFilter])

  // Paginated slice
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProjects.slice(start, start + pageSize)
  }, [filteredProjects, currentPage, pageSize])

  // CRUD Actions
  const handleCreateOrUpdateProject = async (formData) => {
    setIsActionLoading(true)
    try {
      if (formInitialData?.id) {
        await projectsApi.updateProject(formInitialData.id, formData)
        showFeedback(`Project "${formData.name}" updated successfully.`)
      } else {
        await projectsApi.createProject(formData)
        showFeedback(`Project "${formData.name}" created successfully.`)
      }
      await loadData()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!statusModalProject) return
    setIsActionLoading(true)

    const nextStatus =
      statusModalProject.status === 'ACTIVE'
        ? 'ON_HOLD'
        : statusModalProject.status === 'PLANNING'
        ? 'ACTIVE'
        : 'ACTIVE'

    try {
      await projectsApi.updateProjectStatus(statusModalProject.id, { status: nextStatus })
      showFeedback(`Project status changed to ${nextStatus}.`)
      setStatusModalProject(null)
      await loadData()
    } catch (err) {
      console.error('Project status update error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to update project status.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!deleteModalProject) return
    setIsActionLoading(true)
    try {
      await projectsApi.deleteProject(deleteModalProject.id)
      showFeedback('Project workspace removed successfully.')
      setDeleteModalProject(null)
      await loadData()
    } catch (err) {
      console.error('Project delete error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to delete project.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenManageMembers = async (project) => {
    setMemberModalProject(project)
    try {
      const res = await projectsApi.getMembers(project.id)
      const list = res?.data?.projectMembers || res?.projectMembers || []
      setProjectMembers(list)
    } catch {
      setProjectMembers([])
    }
  }

  const handleAddMember = async (memberData) => {
    if (!memberModalProject) return
    setIsActionLoading(true)
    try {
      await projectsApi.addMember(memberModalProject.id, memberData)
      showFeedback('Team member assigned to project successfully.')
      setMemberModalProject(null)
      await loadData()
    } finally {
      setIsActionLoading(false)
    }
  }

  // Graceful 403 Forbidden Screen for unauthorized roles
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
              Project workspaces, milestone pipelines, and team allocation controls are restricted
              to organization Administrators. Your current role is{' '}
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

  if (error && !projects.length) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to Load Projects"
          message={error}
          onRetry={loadData}
          retryLabel="Retry Connection"
        />
      </div>
    )
  }

  // Calculate project metrics
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length
  const planningCount = projects.filter((p) => p.status === 'PLANNING').length
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Workspaces</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deliverable tracking, milestone management, team rosters, and operational velocity.
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
            <FolderPlus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
          <div className="text-xs font-medium text-slate-500">Total Workspaces</div>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{projects.length}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-emerald-200/60 bg-emerald-50/30">
          <div className="text-xs font-medium text-emerald-700">Active Pipelines</div>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">{activeCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-sky-200/60 bg-sky-50/30">
          <div className="text-xs font-medium text-sky-700">Planning Phase</div>
          <div className="text-xl font-bold text-sky-900 mt-0.5">{planningCount}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-indigo-200/60 bg-indigo-50/30">
          <div className="text-xs font-medium text-indigo-700">Delivered / Done</div>
          <div className="text-xl font-bold text-indigo-900 mt-0.5">{completedCount}</div>
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

      {/* 2. Filters Toolbar */}
      <Card className="border-slate-200/80 bg-slate-50/50">
        <CardContent className="p-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              {/* Search */}
              <div>
                <Input
                  placeholder="Search project name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                  className="py-1.5 text-xs"
                />
              </div>

              {/* Status */}
              <div>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  options={STATUS_FILTERS}
                  className="py-1.5 text-xs"
                />
              </div>

              {/* Organization */}
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
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-white shrink-0 self-end md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setViewMode('grid')
                  setPageSize(9)
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode('table')
                  setPageSize(10)
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-indigo-50 text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Project Display: Grid or Table */}
      {viewMode === 'grid' ? (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="h-52 bg-slate-100 rounded-2xl border border-slate-200" />
              ))}
            </div>
          ) : paginatedProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-700">No Projects Found</p>
              <p className="text-xs text-slate-400 mt-1">
                No projects matched your active search or status filters.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={(p) => navigate(ROUTES.PROJECT_DETAILS(p.id))}
                  onEdit={(p) => {
                    setFormInitialData(p)
                    setIsFormOpen(true)
                  }}
                  onChangeStatus={(p) => setStatusModalProject(p)}
                  onManageMembers={(p) => handleOpenManageMembers(p)}
                  onDelete={(p) => setDeleteModalProject(p)}
                />
              ))}
            </div>
          )}

          <div className="mt-6">
            <Pagination
              totalItems={filteredProjects.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[6, 9, 15, 30]}
            />
          </div>
        </div>
      ) : (
        <ProjectTable
          projects={paginatedProjects}
          isLoading={isLoading}
          totalItems={filteredProjects.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          onView={(p) => navigate(ROUTES.PROJECT_DETAILS(p.id))}
          onEdit={(p) => {
            setFormInitialData(p)
            setIsFormOpen(true)
          }}
          onChangeStatus={(p) => setStatusModalProject(p)}
          onManageMembers={(p) => handleOpenManageMembers(p)}
          onDelete={(p) => setDeleteModalProject(p)}
        />
      )}

      {/* 4. Create / Edit Project Modal */}
      <ProjectForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setFormInitialData(null)
        }}
        onSubmit={handleCreateOrUpdateProject}
        initialData={formInitialData}
        organizations={organizations}
        isLoading={isActionLoading}
      />

      {/* 5. Assign Member Modal */}
      <MemberSelector
        isOpen={Boolean(memberModalProject)}
        onClose={() => setMemberModalProject(null)}
        project={memberModalProject}
        availableUsers={users}
        existingMembers={projectMembers}
        onAddMember={handleAddMember}
        isLoading={isActionLoading}
      />

      {/* 6. Change Status Confirmation Modal */}
      {statusModalProject && (
        <ConfirmationModal
          isOpen={Boolean(statusModalProject)}
          onClose={() => setStatusModalProject(null)}
          onConfirm={handleStatusChange}
          title="Update Project Status"
          message={`Are you sure you want to transition project "${statusModalProject.name}" (${statusModalProject.code}) to the next operational phase?`}
          confirmText="Update Status"
          tone="primary"
          isLoading={isActionLoading}
        />
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteModalProject && (
        <ConfirmationModal
          isOpen={Boolean(deleteModalProject)}
          onClose={() => setDeleteModalProject(null)}
          onConfirm={handleDeleteProject}
          title="Delete Project Workspace"
          message={`Are you sure you want to permanently delete "${deleteModalProject.name}" (${deleteModalProject.code})? All project tasks and member links will be removed.`}
          confirmText="Delete Project"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
