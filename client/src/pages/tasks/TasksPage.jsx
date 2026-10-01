import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { tasksApi } from '@/api/endpoints/tasks'
import { projectsApi } from '@/api/endpoints/projects'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import {
  TaskTable,
  TaskFilters,
  TaskForm,
  TaskStatusChangeModal,
} from '@/components/tasks'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/forms/Select'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Plus,
  RotateCw,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react'

const MANAGEMENT_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.TEAM_LEAD,
]

const DEFAULT_FILTERS = {
  page: 1,
  limit: 10,
  search: undefined,
  status: undefined,
  priority: undefined,
  assignedTo: undefined,
  createdBy: undefined,
  deadline: undefined,
  dueDateFrom: undefined,
  dueDateTo: undefined,
}

export function TasksPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const isManagement =
    currentUser?.role && MANAGEMENT_ROLES.includes(currentUser.role)

  const isAdmin =
    currentUser?.role && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser.role)

  const isViewer = currentUser?.role === ROLES.VIEWER

  // Data state
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [tasks, setTasks] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  })
  const [members, setMembers] = useState([])

  // UI state
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  // Load projects available to the authenticated user.
  //
  // Admin roles have access to the full project-management endpoint.
  // Other roles (Manager, Team Lead, Employee, Viewer) use the accessible-project
  // endpoint which safely scopes to their accessible projects without 403 errors.
  const loadProjects = useCallback(async () => {
    if (!currentUser?.role) return

    setIsProjectsLoading(true)
    setError(null)

    try {
      const res = isAdmin
        ? await projectsApi.getProjects().catch(() => projectsApi.getAccessibleProjects())
        : await projectsApi.getAccessibleProjects()

      const list = res?.data?.projects || res?.projects || []

      setProjects(list)

      if (list.length > 0) {
        setSelectedProjectId((currentSelectedId) => {
          const stillAvailable = list.some(
            (project) => project.id === currentSelectedId
          )

          return stillAvailable ? currentSelectedId : list[0].id
        })
      } else {
        setSelectedProjectId('')
        setTasks([])
        setMembers([])
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
      setProjects([])
      setSelectedProjectId('')
      setTasks([])
      setMembers([])
      setError('Failed to load projects. ' + (err?.message || ''))
    } finally {
      setIsProjectsLoading(false)
    }
  }, [currentUser?.role, isAdmin])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // Track active request ID to ignore stale responses from superseded requests
  const taskRequestIdRef = useRef(0)

  // Load project members only for admin users.
  //
  // The project-members endpoint is intentionally restricted to
  // SUPER_ADMIN/ADMIN on the backend, so non-admin users must not call it.
  useEffect(() => {
    if (!selectedProjectId || !isAdmin) {
      setMembers([])
      return
    }

    let isCurrent = true
    projectsApi
      .getMembers(selectedProjectId)
      .then((res) => {
        if (!isCurrent) return
        const list = res?.data?.projectMembers || res?.projectMembers || []
        setMembers(list)
      })
      .catch((err) => {
        if (!isCurrent) return
        console.error('Failed to load project members:', err)
        setMembers([])
      })

    return () => {
      isCurrent = false
    }
  }, [selectedProjectId, isAdmin])

  // Load tasks with race condition protection
  const loadTasks = useCallback(
    async (projectId, queryFilters) => {
      if (!projectId) return

      const currentId = ++taskRequestIdRef.current
      setIsLoading(true)
      setError(null)

      try {
        // Clean undefined/empty values before sending
        const params = Object.fromEntries(
          Object.entries(queryFilters).filter(
            ([, v]) => v !== undefined && v !== null && v !== ''
          )
        )

        const res = await tasksApi.getProjectTasks(projectId, params)
        if (currentId !== taskRequestIdRef.current) return // Superseeded by newer project/filter request

        const data = res?.data || res

        setTasks(data?.tasks || [])
        setPagination(
          data?.pagination || {
            page: 1,
            limit: 10,
            totalItems: 0,
            totalPages: 0,
          }
        )
      } catch (err) {
        if (currentId !== taskRequestIdRef.current) return
        console.error('Failed to load tasks:', err)

        const msg = err?.message || 'Failed to load tasks.'

        setError(msg)
        setTasks([])
      } finally {
        if (currentId === taskRequestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (selectedProjectId) {
      loadTasks(selectedProjectId, filters)
    }
  }, [selectedProjectId, filters, loadTasks])

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }))
  }

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value)
    setFilters(DEFAULT_FILTERS)
    setTasks([])
  }

  const handleRefresh = async () => {
    if (error && projects.length === 0) {
      await loadProjects()
      return
    }

    await loadTasks(selectedProjectId, filters)
  }

  // View task
  const handleViewTask = (task) => {
    navigate(ROUTES.TASK_DETAILS(task.id))
  }

  // Create task
  const handleCreateTask = async (formData) => {
    setIsActionLoading(true)

    try {
      await tasksApi.createProjectTask(selectedProjectId, formData)
      showFeedback('Task created successfully.')
      await loadTasks(selectedProjectId, filters)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Edit task
  const handleUpdateTask = async (formData) => {
    if (!editTarget) return

    setIsActionLoading(true)

    try {
      await tasksApi.updateTask(editTarget.id, formData)
      showFeedback('Task updated successfully.')
      await loadTasks(selectedProjectId, filters)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Change status
  const handleStatusChange = async (newStatus) => {
    if (!statusTarget) return

    setIsActionLoading(true)

    try {
      await tasksApi.updateTaskStatus(statusTarget.id, { status: newStatus })

      showFeedback(`Task status updated to ${newStatus.replace('_', ' ')}.`)

      setStatusTarget(null)

      await loadTasks(selectedProjectId, filters)
    } finally {
      setIsActionLoading(false)
    }
  }

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteTarget) return

    setIsActionLoading(true)

    try {
      await tasksApi.deleteTask(deleteTarget.id)

      showFeedback('Task deleted.')

      setDeleteTarget(null)

      await loadTasks(selectedProjectId, filters)
    } catch (err) {
      showFeedback(err?.message || 'Failed to delete task.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  // Determine per-task authorization
  const canEditTask = (task) => {
    if (isViewer) return false

    if (isManagement) return true

    return (
      task.createdBy === currentUser?.id ||
      task.assignedTo === currentUser?.id
    )
  }

  const canDeleteTask = () => isManagement

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  )

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: `${project.name} (${project.code})`,
  }))

  if (error && !isLoading && tasks.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Task Management"
          description="Manage project tasks, assignments, and delivery timelines."
        />

        <ErrorState
          title="Unable to Load Tasks"
          message={error}
          onRetry={handleRefresh}
          retryLabel="Retry"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Task Management"
        description="Sprint tracking, task prioritization, assignments, and status pipelines."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isLoading && !isProjectsLoading}
              className="flex items-center gap-1.5 text-xs"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh
            </Button>

            {!isViewer && selectedProjectId && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            )}
          </div>
        }
      />

      {/* Feedback toast */}
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

      {/* Project context bar */}
      <Card className="border-slate-200/90 shadow-2xs">
        <CardContent className="p-4 sm:p-4.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 border border-[#635BFF]/20 flex items-center justify-center shrink-0 shadow-2xs">
                <FolderKanban className="w-4.5 h-4.5 text-[#635BFF]" />
              </div>

              <div className="min-w-0">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Active Project Workspace
                </label>

                {isProjectsLoading ? (
                  <div className="h-9 bg-slate-100 rounded-lg animate-pulse w-56" />
                ) : projects.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No accessible projects found.
                  </p>
                ) : (
                  <Select
                    value={selectedProjectId}
                    onChange={handleProjectChange}
                    options={projectOptions}
                    className="min-w-[220px] sm:min-w-[260px] text-xs font-semibold"
                  />
                )}
              </div>
            </div>

            {selectedProject && (
              <div className="flex items-center gap-2.5 sm:gap-4 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                    {selectedProject.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Sprint Total:</span>
                  <span className="font-bold text-[#635BFF] bg-[#635BFF]/10 border border-[#635BFF]/20 px-2 py-0.5 rounded-md text-[11px] font-mono">
                    {pagination.totalItems} {pagination.totalItems === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters Toolbar Card */}
      {selectedProjectId && (
        <Card className="border-slate-200/90 shadow-2xs">
          <CardContent className="p-3.5 sm:p-4">
            <TaskFilters
              filters={filters}
              onChange={handleFiltersChange}
              members={members}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Task table */}
      {selectedProjectId ? (
        <TaskTable
          tasks={tasks}
          isLoading={isLoading}
          totalItems={pagination.totalItems}
          currentPage={pagination.page}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onView={handleViewTask}
          onEdit={(task) => setEditTarget(task)}
          onChangeStatus={(task) => setStatusTarget(task)}
          onDelete={(task) => setDeleteTarget(task)}
          canEdit={canEditTask}
          canDelete={canDeleteTask()}
        />
      ) : (
        !isProjectsLoading && (
          <Card className="border-slate-200/90 shadow-2xs">
            <CardContent className="py-16 text-center">
              <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />

              <p className="text-sm font-bold text-slate-700">
                Select a Project Workspace
              </p>

              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Choose a project context from the selector above to monitor sprint deliverables and task status.
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Create Task Modal */}
      <TaskForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateTask}
        project={selectedProject}
        members={members}
        isLoading={isActionLoading}
      />

      {/* Edit Task Modal */}
      <TaskForm
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdateTask}
        initialData={editTarget}
        project={selectedProject}
        members={members}
        isLoading={isActionLoading}
      />

      {/* Status Change Modal */}
      <TaskStatusChangeModal
        isOpen={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        task={statusTarget}
        onSubmit={handleStatusChange}
        isLoading={isActionLoading}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
          confirmText="Delete Task"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}