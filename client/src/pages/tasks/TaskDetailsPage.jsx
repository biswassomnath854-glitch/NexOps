import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tasksApi } from '@/api/endpoints/tasks'
import { projectsApi } from '@/api/endpoints/projects'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { TaskDetails } from '@/components/tasks/TaskDetails'
import { TaskForm } from '@/components/tasks/TaskForm'
import { TaskStatusChangeModal } from '@/components/tasks/TaskStatusChangeModal'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, RotateCw, CheckCircle2 } from 'lucide-react'

const MANAGEMENT_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD]

export function TaskDetailsPage() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // State
  const [task, setTask] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  const isManagement = currentUser?.role && MANAGEMENT_ROLES.includes(currentUser.role)
  const isViewer = currentUser?.role === ROLES.VIEWER

  // Check canEdit: management OR (creator/assignee and not viewer)
  const canEditTask = useCallback(
    (t) => {
      if (!currentUser || !t) return false
      if (isViewer) return false
      if (isManagement) return true
      return t.assignedToId === currentUser.id || t.createdById === currentUser.id
    },
    [currentUser, isManagement, isViewer]
  )

  // Check canDelete: management only
  const canDeleteTask = useCallback(() => {
    return Boolean(isManagement)
  }, [isManagement])

  // Load Task and Project Members
  const loadTaskData = useCallback(async () => {
    if (!taskId) return
    try {
      setError(null)
      const res = await tasksApi.getTaskById(taskId)
      const taskData = res?.data?.task || res?.data || res
      setTask(taskData)

      // Fetch project members if projectId is present
      const projectId = taskData?.projectId || taskData?.project?.id
      if (projectId) {
        try {
          const membersRes = await projectsApi.getMembers(projectId)
          const memberList = membersRes?.data?.projectMembers || membersRes?.projectMembers || []
          setMembers(memberList)
        } catch {
          setMembers([])
        }
      }
    } catch (err) {
      console.error('Failed to load task details:', err)
      setError(err?.message || 'Failed to load task details.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [taskId])

  useEffect(() => {
    setIsLoading(true)
    loadTaskData()
  }, [loadTaskData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadTaskData()
  }

  const handleUpdateTask = async (formData) => {
    setIsActionLoading(true)
    try {
      await tasksApi.updateTask(taskId, formData)
      showFeedback('Task updated successfully.')
      setIsEditOpen(false)
      await loadTaskData()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStatusChange = async ({ status, comment }) => {
    setIsActionLoading(true)
    try {
      await tasksApi.updateTaskStatus(taskId, { status, comment })
      showFeedback(`Status changed to ${status.replace('_', ' ')}.`)
      setIsStatusOpen(false)
      await loadTaskData()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    setIsActionLoading(true)
    try {
      await tasksApi.deleteTask(taskId)
      setIsDeleteOpen(false)
      navigate(ROUTES.TASKS, { replace: true })
    } catch (err) {
      console.error('Failed to delete task:', err)
      showFeedback(err?.message || 'Failed to delete task.', 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 animate-pulse rounded" />
        <div className="h-44 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-72 bg-slate-200 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(ROUTES.TASKS)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Button>
        <ErrorState
          title="Task not found"
          message={error || 'Unable to load task details.'}
          onRetry={loadTaskData}
        />
      </div>
    )
  }

  const canEdit = canEditTask(task)
  const canDelete = canDeleteTask()

  return (
    <div className="space-y-6">
      {/* Top back button & refresh bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-slate-600 hover:text-slate-900 border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 border-slate-200"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          Refresh
        </Button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-150 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Task Details Panel */}
      <TaskDetails
        task={task}
        currentUser={currentUser}
        isManagement={isManagement}
        isViewer={isViewer}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={() => setIsEditOpen(true)}
        onChangeStatus={() => setIsStatusOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      {/* Edit Task Modal */}
      <TaskForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateTask}
        initialData={task}
        project={task?.project}
        members={members}
        isLoading={isActionLoading}
      />

      {/* Status Change Modal */}
      <TaskStatusChangeModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        task={task}
        onSubmit={handleStatusChange}
        isLoading={isActionLoading}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <ConfirmationModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          message={`Are you sure you want to permanently delete "${task?.title}"? This action cannot be undone.`}
          confirmText="Delete Task"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
