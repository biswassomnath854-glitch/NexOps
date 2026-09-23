import { ProjectMemberRoleBadge } from './ProjectMemberRoleBadge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { Users, UserPlus, Trash2 } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
]

export function ProjectMembers({
  members = [],
  isLoading = false,
  onOpenAddMember,
  onUpdateRole,
  onRemoveMember,
  isProjectActive = true,
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200" />
              <div className="space-y-1.5">
                <div className="w-32 h-3.5 bg-slate-200 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-20 h-6 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Project Roster & Assignments ({members.length})
          </h3>
          <p className="text-xs text-slate-500">
            Assigned team members with workspace project roles.
          </p>
        </div>

        {onOpenAddMember && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddMember}
            disabled={!isProjectActive}
            className="flex items-center gap-1.5 text-xs font-semibold"
            title={!isProjectActive ? 'Project must be ACTIVE to assign members' : undefined}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </Button>
        )}
      </div>

      {/* Roster list */}
      {members.length === 0 ? (
        <div className="p-8 rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={Users}
            title="No Members Assigned"
            description="Assign team members to this project to enable collaborative task tracking and milestone delivery."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-xs">
          {members.map((member) => {
            const user = member.user || {}
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Team Member'
            const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'

            return (
              <div
                key={member.id || user.id}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {fullName}
                      </span>
                      {user.department?.name && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {user.department.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Right: Role selection & Action */}
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  {onUpdateRole ? (
                    <select
                      value={member.role || 'MEMBER'}
                      onChange={(e) => onUpdateRole(user.id || member.userId, e.target.value)}
                      className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ProjectMemberRoleBadge role={member.role} />
                  )}

                  {member.assignedAt && (
                    <span className="hidden md:inline-block text-[11px] text-slate-400 font-mono">
                      Since {formatDate(member.assignedAt)}
                    </span>
                  )}

                  {onRemoveMember && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove member from project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
