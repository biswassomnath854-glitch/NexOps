import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi } from '@/api/endpoints/projects'
import { organizationsApi } from '@/api/endpoints/organizations'
import { usersApi } from '@/api/endpoints/users'
import { workstreamsApi } from '@/api/endpoints/workstreams'
import { projectDocumentsApi } from '@/api/endpoints/projectDocuments'
import { projectHealthApi } from '@/api/endpoints/projectHealth'
import { tasksApi } from '@/api/endpoints/tasks'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import {
  ProjectDetails,
  ProjectForm,
  MemberSelector,
} from '@/components/projects'
import { ProjectApprovalSection } from '@/components/projects/ProjectApprovalSection'
import { WorkstreamList } from '@/components/workstreams/WorkstreamList'
import { ProjectDocumentList } from '@/components/documents/ProjectDocumentList'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskForm } from '@/components/tasks/TaskForm'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  XCircle,
  X,
  FolderKanban,
  Layers,
  CheckSquare,
  FileText,
  Activity,
  Plus,
  Info,
  ShieldCheck,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'workstreams', label: 'Workstreams', icon: Layers },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'documents', label: 'Documents & Deliverables', icon: FileText },
  { id: 'health', label: 'Project Health', icon: Activity },
]

export function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [workstreams, setWorkstreams] = useState([])
  const [documents, setDocuments] = useState([])
  const [projectHealth, setProjectHealth] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskFilters, setTaskFilters] = useState({ page: 1, limit: 25 })
  const [organizations, setOrganizations] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Role Permissions
  const isManagement = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD].includes(
    currentUser?.role
  )
  const isAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser?.role)
  const isViewer = currentUser?.role === ROLES.VIEWER

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  const loadProjectData = useCallback(async () => {
    if (!projectId) return

    try {
      const [projRes, membersRes, wsRes, docsRes, healthRes, tasksRes] = await Promise.all([
        projectsApi.getProjectById(projectId),
        projectsApi.getMembers(projectId).catch(() => ({ data: { projectMembers: [] } })),
        workstreamsApi.getProjectWorkstreams(projectId).catch(() => ({ data: { workstreams: [] } })),
        projectDocumentsApi.getProjectDocuments(projectId).catch(() => ({ data: { documents: [] } })),
        projectHealthApi.getProjectHealth(projectId).catch(() => ({ data: null })),
        projectsApi.getProjectTasks(projectId, taskFilters).catch(() => ({ data: { tasks: [] } })),
      ])

      const projData = projRes?.data?.project || projRes?.project || null
      const memberList = membersRes?.data?.projectMembers || membersRes?.projectMembers || []
      const wsList = wsRes?.data?.workstreams || wsRes?.workstreams || []
      const docsList = docsRes?.data?.documents || docsRes?.documents || []
      const healthData = healthRes?.data || healthRes || null
      const taskList = tasksRes?.data?.tasks || tasksRes?.tasks || []

      setProject(projData)
      setMembers(memberList)
      setWorkstreams(wsList)
      setDocuments(docsList)
      setProjectHealth(healthData)
      setTasks(Array.isArray(taskList) ? taskList : [])
      setError(null)

      // Fetch orgs & users for management modals in background
      if (isManagement) {
        organizationsApi
          .getOrganizations()
          .then((res) => setOrganizations(res?.data?.organizations || res?.organizations || []))
          .catch(() => {})
        usersApi
          .getUsers()
          .then((res) => setAvailableUsers(res?.data?.users || res?.users || []))
          .catch(() => {})
      }
    } catch (err) {
      console.error('Failed to load project details:', err)
      setError(err?.response?.data?.message || err?.message || 'Unable to retrieve project details.')
    }
  }, [projectId, isManagement, taskFilters])

  useEffect(() => {
    let ignore = false
    async function init() {
      await loadProjectData()
      if (!ignore) setIsLoading(false)
    }
    init()
    return () => {
      ignore = true
    }
  }, [loadProjectData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadProjectData()
    setIsRefreshing(false)
  }

  // Edit Project
  const handleUpdateProject = async (formData) => {
    setIsActionLoading(true)
    try {
      await projectsApi.updateProject(projectId, formData)
      showFeedback('Project workspace details updated.')
      setIsEditOpen(false)
      await loadProjectData()
    } finally {
      setIsActionLoading(false)
    }
  }

  // Change Status
  const handleStatusChange = async () => {
    if (!project) return
    setIsActionLoading(true)

    const nextStatus =
      project.status === 'ACTIVE'
        ? 'ON_HOLD'
        : project.status === 'PLANNING'
        ? 'ACTIVE'
        : 'ACTIVE'

    try {
      await projectsApi.updateProjectStatus(projectId, { status: nextStatus })
      showFeedback(`Project status updated to ${nextStatus}.`)
      setStatusModalOpen(false)
      await loadProjectData()
    } catch (err) {
      console.error('Status update error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to update project status.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  // Add Project Member
  const handleAddMember = async (memberData) => {
    setIsActionLoading(true)
    try {
      await projectsApi.addMember(projectId, memberData)
      showFeedback('Team member assigned to project.')
      setIsAddMemberOpen(false)
      await loadProjectData()
    } finally {
      setIsActionLoading(false)
    }
  }

  // Update Member Role
  const handleUpdateMemberRole = async (userId, newRole) => {
    try {
      await projectsApi.updateMember(projectId, userId, { role: newRole })
      showFeedback('Member project role updated.')
      await loadProjectData()
    } catch (err) {
      console.error('Update member role error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to update member role.',
        'error'
      )
    }
  }

  // Remove Member
  const handleRemoveMember = async () => {
    if (!removeMemberTarget) return
    setIsActionLoading(true)
    const userId = removeMemberTarget.userId || removeMemberTarget.user?.id

    try {
      await projectsApi.removeMember(projectId, userId)
      showFeedback('Team member removed from project.')
      setRemoveMemberTarget(null)
      await loadProjectData()
    } catch (err) {
      console.error('Remove member error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to remove member.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  // Create Task
  const handleCreateTask = async (taskPayload) => {
    try {
      await tasksApi.createTask({
        ...taskPayload,
        projectId: Number(projectId),
      })
      showFeedback('Task created successfully.')
      setIsCreateTaskOpen(false)
      await loadProjectData()
    } catch (err) {
      console.error('Create task error:', err)
      throw err
    }
  }

  if (error && !project) {
    return (
      <div className="py-12 animate-in fade-in duration-200">
        <ErrorState
          title="Project Workspace Unavailable"
          message={error}
          onRetry={loadProjectData}
          retryLabel="Retry Connection"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-7xl mx-auto pb-12">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.PROJECTS)}
          className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Directory</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-slate-700"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-150 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/5 text-current"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      ) : project ? (
        <>
          {/* Navigation Workspace Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex items-center gap-2 overflow-x-auto">
              {[
                ...TABS,
                ...(isManagement
                  ? [{ id: 'approval', label: 'Client Portal & Approval', icon: ShieldCheck }]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                let countBadge = null
                if (tab.id === 'workstreams') countBadge = workstreams.length
                if (tab.id === 'documents') countBadge = documents.length
                if (tab.id === 'tasks') countBadge = tasks.length

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600 bg-white font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {countBadge !== null && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {countBadge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <ProjectDetails
              project={project}
              members={members}
              onEdit={isAdmin ? () => setIsEditOpen(true) : null}
              onChangeStatus={isAdmin ? () => setStatusModalOpen(true) : null}
              onOpenAddMember={isManagement ? () => setIsAddMemberOpen(true) : null}
              onUpdateMemberRole={isManagement ? handleUpdateMemberRole : null}
              onRemoveMember={isManagement ? (m) => setRemoveMemberTarget(m) : null}
            />
          )}

          {/* TAB 2: Workstreams */}
          {activeTab === 'workstreams' && (
            <WorkstreamList
              projectId={projectId}
              workstreams={workstreams}
              availableMembers={members}
              isManagement={isManagement}
              isViewer={isViewer}
              onWorkstreamsChange={loadProjectData}
              onSelectWorkstreamTasks={(wsId) => {
                setTaskFilters((prev) => ({ ...prev, workstreamId: wsId, page: 1 }))
                setActiveTab('tasks')
              }}
            />
          )}

          {/* TAB 3: Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Project Tasks ({tasks.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tasks associated with this project and scoped to workstreams
                  </p>
                </div>

                {!isViewer && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateTaskOpen(true)}
                    leftIcon={Plus}
                    className="text-xs font-semibold shadow-xs"
                  >
                    Create Task
                  </Button>
                )}
              </div>

              {/* Task Filters */}
              <TaskFilters
                filters={taskFilters}
                onChange={setTaskFilters}
                members={members}
                workstreams={workstreams}
              />

              {/* Task List */}
              {tasks.length === 0 ? (
                <Card className="text-center p-10 border-dashed border-slate-200 bg-slate-50/50">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No tasks in this view</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                    Try adjusting your status or workstream filters, or create a new task.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => navigate(ROUTES.TASK_DETAILS(task.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Documents & Deliverables */}
          {activeTab === 'documents' && (
            <ProjectDocumentList
              projectId={projectId}
              documents={documents}
              currentUser={currentUser}
              isManagement={isManagement}
              isViewer={isViewer}
              onDocumentsChange={loadProjectData}
            />
          )}

          {/* TAB 5: Health */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Project Operational Health
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time trajectory, blocker resolution, and squad execution velocity
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigate(ROUTES.PROJECT_HEALTH)}
                  className="text-xs"
                >
                  View All Projects Health
                </Button>
              </div>

              {projectHealth ? (
                <div className="space-y-6">
                  {/* Top KPI row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500">Progress</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {projectHealth.progress}%
                        </span>
                        <span className="text-xs text-slate-400">completed</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${projectHealth.progress}%` }}
                        />
                      </div>
                    </Card>

                    <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500">Tasks Resolved</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {projectHealth.tasks?.completed || 0}
                        </span>
                        <span className="text-xs text-slate-400">
                          of {projectHealth.tasks?.total || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {projectHealth.tasks?.inProgress || 0} in active progress
                      </p>
                    </Card>

                    <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500">Blocked Items</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span
                          className={`text-2xl font-bold ${
                            (projectHealth.tasks?.blocked || 0) > 0 ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {projectHealth.tasks?.blocked || 0}
                        </span>
                        <span className="text-xs text-slate-400">tasks</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        {(projectHealth.tasks?.blocked || 0) > 0
                          ? 'Action required by squad leads'
                          : 'Zero blocked tasks'}
                      </p>
                    </Card>

                    <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
                      <span className="text-xs font-semibold text-slate-500">Unassigned Work</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {projectHealth.tasks?.unassigned || 0}
                        </span>
                        <span className="text-xs text-slate-400">tasks</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Pending assignee or workstream allocation
                      </p>
                    </Card>
                  </div>

                  {/* Blocked Tasks & Unassigned Tasks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Blocked */}
                    <Card className="border-slate-200/90 shadow-2xs p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Blocked Work ({projectHealth.blockedTasks?.length || 0})
                        </h4>
                      </div>
                      {(!projectHealth.blockedTasks || projectHealth.blockedTasks.length === 0) ? (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          No blocked tasks reported in this workspace.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {projectHealth.blockedTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => navigate(ROUTES.TASK_DETAILS(t.id))}
                              className="py-2 flex items-center justify-between cursor-pointer hover:text-indigo-600 text-xs"
                            >
                              <span className="font-semibold truncate mr-2">{t.title}</span>
                              <Badge variant="danger" size="sm">{t.priority}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Unassigned */}
                    <Card className="border-slate-200/90 shadow-2xs p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Unassigned Tasks ({projectHealth.unassignedTasks?.length || 0})
                        </h4>
                      </div>
                      {(!projectHealth.unassignedTasks || projectHealth.unassignedTasks.length === 0) ? (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          All tasks have owners and workstreams assigned.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {projectHealth.unassignedTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => navigate(ROUTES.TASK_DETAILS(t.id))}
                              className="py-2 flex items-center justify-between cursor-pointer hover:text-indigo-600 text-xs"
                            >
                              <span className="font-semibold truncate mr-2">{t.title}</span>
                              <Badge variant="warning" size="sm">{t.priority}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  Project health statistics will appear as work progresses.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Client Portal & Approval */}
          {activeTab === 'approval' && isManagement && (
            <ProjectApprovalSection
              projectId={projectId}
              isManagement={isManagement}
              isAdmin={isAdmin}
              onUpdate={loadProjectData}
            />
          )}
        </>
      ) : (
        <Card className="p-12 text-center border-slate-200/80 bg-white">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FolderKanban className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-800">Project Not Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            The requested project workspace identifier does not exist or has been permanently removed.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(ROUTES.PROJECTS)}
            className="mt-5 text-xs"
          >
            Return to Projects Directory
          </Button>
        </Card>
      )}

      {/* Edit Modal */}
      <ProjectForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateProject}
        initialData={project}
        organizations={organizations}
        isLoading={isActionLoading}
      />

      {/* Assign Member Modal */}
      <MemberSelector
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        project={project}
        availableUsers={availableUsers}
        existingMembers={members}
        onAddMember={handleAddMember}
        isLoading={isActionLoading}
      />

      {/* Create Task Modal */}
      <TaskForm
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={handleCreateTask}
        project={project}
        members={members}
        workstreams={workstreams}
        isLoading={isActionLoading}
      />

      {/* Status Change Modal */}
      {statusModalOpen && (
        <ConfirmationModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          onConfirm={handleStatusChange}
          title="Update Project Status"
          message={`Are you sure you want to change the operational status of project "${project?.name}"?`}
          confirmText="Update Status"
          tone="primary"
          isLoading={isActionLoading}
        />
      )}

      {/* Remove Member Confirmation Modal */}
      {removeMemberTarget && (
        <ConfirmationModal
          isOpen={Boolean(removeMemberTarget)}
          onClose={() => setRemoveMemberTarget(null)}
          onConfirm={handleRemoveMember}
          title="Remove Member from Project"
          message={`Are you sure you want to remove ${
            removeMemberTarget.user?.firstName || 'this member'
          } from this project workspace?`}
          confirmText="Remove Member"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
