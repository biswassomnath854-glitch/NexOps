import { Modal } from '@/components/ui/Modal'
import { RoleBadge } from '@/components/common/RoleBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/formatters'
import { Building2, Landmark, Mail, Calendar, Shield, Edit2, Fingerprint } from 'lucide-react'

export function UserDetails({ isOpen, onClose, user, onEdit, onChangeStatus }) {
  if (!user) return null

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Team Member'
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile Details"
      description="Administrative overview and security profile of this team member."
      size="md"
    >
      <div className="space-y-6">
        {/* Header / Avatar Row */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 truncate">{fullName}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <RoleBadge role={user.role} showIcon />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Organization */}
          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Landmark className="w-3.5 h-3.5" />
              <span>Assigned Organization</span>
            </div>
            <div className="font-semibold text-slate-800 text-sm">
              {user.organization?.name || 'Independent / None'}
            </div>
            {user.organization?.industry && (
              <div className="text-slate-400">Industry: {user.organization.industry}</div>
            )}
          </div>

          {/* Department */}
          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>Assigned Department</span>
            </div>
            <div className="font-semibold text-slate-800 text-sm">
              {user.department?.name || 'Unassigned'}
            </div>
            {user.department?.code && (
              <div className="text-slate-400 font-mono">Code: {user.department.code}</div>
            )}
          </div>

          {/* Account Created */}
          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Registered On</span>
            </div>
            <div className="font-medium text-slate-700 font-mono">
              {formatDateTime(user.createdAt)}
            </div>
          </div>

          {/* User ID */}
          <div className="p-3 rounded-lg border border-slate-100 bg-white space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>System Identifier (UUID)</span>
            </div>
            <div className="font-mono text-slate-500 truncate" title={user.id}>
              {user.id}
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              onChangeStatus?.(user)
            }}
            className="flex items-center gap-1.5 text-slate-700"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Change Status
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose()
                onEdit?.(user)
              }}
              className="flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit User
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
