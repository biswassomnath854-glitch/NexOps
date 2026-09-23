import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { ProjectMemberRoleBadge } from './ProjectMemberRoleBadge'
import { AlertCircle, UserPlus, Info } from 'lucide-react'

const PROJECT_MEMBER_ROLES = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager (Lead / Coordinator)' },
  { value: 'TEAM_LEAD', label: 'Team Lead (Sprint / Technical Lead)' },
  { value: 'MEMBER', label: 'Member (Core Contributor)' },
  { value: 'VIEWER', label: 'Viewer (Read-only Observer)' },
]

export function MemberSelector({
  isOpen,
  onClose,
  project,
  availableUsers = [],
  existingMembers = [],
  onAddMember,
  isLoading = false,
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const isProjectActive = project?.status === 'ACTIVE'
  const existingUserIds = new Set(existingMembers.map((m) => m.userId || m.user?.id))

  // Filter eligible candidate users: active users in same organization who are not already members
  const candidateUsers = availableUsers.filter((user) => {
    if (user.status !== 'ACTIVE') return false
    if (existingUserIds.has(user.id)) return false
    if (project?.organizationId && user.organizationId && user.organizationId !== project.organizationId) {
      return false
    }
    return true
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!selectedUserId) {
      setError('Please select a team member to assign.')
      return
    }

    if (!isProjectActive) {
      setError('Members can only be assigned to ACTIVE projects.')
      return
    }

    try {
      await onAddMember({
        userId: selectedUserId,
        role: selectedRole,
      })
      setSelectedUserId('')
      setSelectedRole('MEMBER')
      onClose()
    } catch (err) {
      console.error('Add member error:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to assign user to project.'
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Team Member"
      description={`Add a team member to project ${project?.code || ''} with defined access permissions.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {!isProjectActive && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Project is not Active:</strong> Under NexOps governance rules, members can
              only be assigned while the project status is set to <strong>ACTIVE</strong>.
            </div>
          </div>
        )}

        {/* User Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Team Member ({candidateUsers.length} available)
          </label>
          {candidateUsers.length === 0 ? (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 text-center">
              All active organization members are already assigned to this project.
            </div>
          ) : (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              required
            >
              <option value="">Select an active team member...</option>
              {candidateUsers.map((user) => {
                const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
                const dept = user.department?.name ? ` — ${user.department.name}` : ''
                return (
                  <option key={user.id} value={user.id}>
                    {name} ({user.email}){dept}
                  </option>
                )
              })}
            </select>
          )}
        </div>

        {/* Role Selection */}
        <Select
          label="Project Assignment Role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          options={PROJECT_MEMBER_ROLES}
          required
        />

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
          <span className="text-xs text-slate-500">Selected Level:</span>
          <ProjectMemberRoleBadge role={selectedRole} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={!isProjectActive || candidateUsers.length === 0}
            isLoading={isLoading}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Member
          </Button>
        </div>
      </form>
    </Modal>
  )
}
