import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectsApi } from '@/api/endpoints/projects'
import { organizationsApi } from '@/api/endpoints/organizations'
import { usersApi } from '@/api/endpoints/users'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { formatRole } from '@/utils/formatters'
import {
  ProjectDetails,
  ProjectForm,
  MemberSelector,
} from '@/components/projects'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { ArrowLeft, RotateCw, CheckCircle2, ShieldAlert } from 'lucide-react'

export function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // State
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Check admin authorization
  const isAuthorized =
    currentUser?.role && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser.role)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  const loadProjectData = useCallback(async () => {
    if (!isAuthorized || !projectId) return

    try {
      const [projRes, membersRes, orgsRes, usersRes] = await Promise.all([
        projectsApi.getProjectById(projectId),
        projectsApi.getMembers(projectId).catch(() => ({ data: { projectMembers: [] } })),
        organizationsApi.getOrganizations().catch(() => ({ data: { organizations: [] } })),
        usersApi.getUsers().catch(() => ({ data: { users: [] } })),
      ])

      const projData = projRes?.data?.project || projRes?.project || null
      const memberList = membersRes?.data?.projectMembers || membersRes?.projectMembers || []
      const orgList = orgsRes?.data?.organizations || orgsRes?.organizations || []
      const userList = usersRes?.data?.users || usersRes?.users || []

      setProject(projData)
      setMembers(memberList)
      setOrganizations(orgList)
      setAvailableUsers(userList)
      setError(null)
    } catch (err) {
      console.error('Failed to load project details:', err)
      setError(err.message || 'Unable to retrieve project details from server.')
    }
  }, [isAuthorized, projectId])

  useEffect(() => {
    let ignore = false
    async function init() {
      if (isAuthorized) {
        await loadProjectData()
      }
      if (!ignore) {
        setIsLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [loadProjectData, isAuthorized])

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

  // Add Member
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
              Viewing project administration and milestone controls requires an Administrator
              account. Your current role is{' '}
              <strong className="text-slate-800 font-semibold">
                {formatRole(currentUser?.role)}
              </strong>
              .
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="mt-6 text-xs"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="py-12">
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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.PROJECTS)}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Directory</span>
        </Button>

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

      {/* Main Details Presentation */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      ) : project ? (
        <ProjectDetails
          project={project}
          members={members}
          onEdit={() => setIsEditOpen(true)}
          onChangeStatus={() => setStatusModalOpen(true)}
          onOpenAddMember={() => setIsAddMemberOpen(true)}
          onUpdateMemberRole={handleUpdateMemberRole}
          onRemoveMember={(m) => setRemoveMemberTarget(m)}
        />
      ) : (
        <Card className="p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">Project Not Found</p>
          <p className="text-xs text-slate-400 mt-1">
            The requested project identifier does not exist or has been removed.
          </p>
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

      {/* Status Change Modal */}
      {statusModalOpen && (
        <ConfirmationModal
          isOpen={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          onConfirm={handleStatusChange}
          title="Update Project Status"
          message={`Are you sure you want to change the status of project "${project?.name}"?`}
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
          } from this project?`}
          confirmText="Remove Member"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
