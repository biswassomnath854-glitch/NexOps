import { ProjectMemberRoleBadge } from './ProjectMemberRoleBadge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { Users, UserPlus, Trash2, Calendar, Mail } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'VIEWER', label: 'Viewer' },
]

const AVATAR_COLORS = [
  'bg-violet-50 text-violet-700 border-violet-200/80',
  'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  'bg-sky-50 text-sky-700 border-sky-200/80',
  'bg-teal-50 text-teal-700 border-teal-200/80',
  'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  'bg-amber-50 text-amber-700 border-amber-200/80',
]

function getAvatarColor(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

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
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-2xs">
        <div className="h-5 w-40 bg-slate-100 rounded mb-4" />
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-lg border border-slate-100 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200/80" />
              <div className="space-y-1.5">
                <div className="w-32 h-3.5 bg-slate-200/80 rounded" />
                <div className="w-24 h-3 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-24 h-6 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#635BFF]" />
            Project Roster & Assignments
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active workspace team members with defined operational authority.
          </p>
        </div>

        {onOpenAddMember && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddMember}
            disabled={!isProjectActive}
            className="flex items-center gap-1.5 text-xs font-semibold shadow-xs"
            title={!isProjectActive ? 'Project must be ACTIVE to assign members' : undefined}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Assign Member
          </Button>
        )}
      </div>

      {/* Roster list */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-2xs">
          <EmptyState
            icon={Users}
            title="No Members Assigned"
            description="Assign team members to this project to enable collaborative task tracking, ownership, and milestone delivery."
            action={
              onOpenAddMember && isProjectActive ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onOpenAddMember}
                  className="text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Assign First Member
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {members.map((member) => {
            const user = member.user || {}
            const fullName =
              `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Team Member'
            const initials =
              `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
            const avatarColorClass = getAvatarColor(fullName)

            return (
              <div
                key={member.id || user.id}
                className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors group"
              >
                {/* Left: Avatar & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs ${avatarColorClass}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {fullName}
                      </span>
                      {user.department?.name && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 select-none">
                          {user.department.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                      <span>{user.email || 'No email registered'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Role selection & Action */}
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  {onUpdateRole ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={member.role || 'MEMBER'}
                        onChange={(e) => onUpdateRole(user.id || member.userId, e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 hover:border-slate-300 focus:border-[#635BFF] focus:outline-hidden focus:ring-2 focus:ring-[#635BFF]/20 transition-all cursor-pointer"
                        aria-label={`Update role for ${fullName}`}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <ProjectMemberRoleBadge role={member.role} />
                  )}

                  {member.assignedAt && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      <span>Since {formatDate(member.assignedAt)}</span>
                    </span>
                  )}

                  {onRemoveMember && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(member)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500/30"
                      title="Remove member from project"
                      aria-label={`Remove ${fullName} from project`}
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
