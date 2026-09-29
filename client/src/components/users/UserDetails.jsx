import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { RoleBadge } from '@/components/common/RoleBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/formatters'
import { Building2, Landmark, Mail, Calendar, Shield, Edit2, Fingerprint, Copy, Check } from 'lucide-react'

export function UserDetails({ isOpen, onClose, user, onEdit, onChangeStatus }) {
  const [copiedField, setCopiedField] = useState(null)

  if (!user) return null

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Team Member'
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile Details"
      description="Administrative overview and security profile of this team member."
      size="md"
    >
      <div className="space-y-5">
        {/* Header / Avatar Row */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="w-13 h-13 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 truncate">{fullName}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono truncate">{user.email}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(user.email, 'email')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Copy email address"
              >
                {copiedField === 'email' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <RoleBadge role={user.role} showIcon />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Organization */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Landmark className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Assigned Organization</span>
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {user.organization?.name || 'Independent / None'}
            </div>
            {user.organization?.industry && (
              <div className="text-slate-400 text-[11px]">Industry: {user.organization.industry}</div>
            )}
          </div>

          {/* Department */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Assigned Department</span>
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {user.department?.name || 'Unassigned'}
            </div>
            {user.department?.code && (
              <div className="text-slate-400 font-mono text-[11px]">Code: {user.department.code}</div>
            )}
          </div>

          {/* Account Created */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Registered On</span>
            </div>
            <div className="font-medium text-slate-700 font-mono">
              {formatDateTime(user.createdAt)}
            </div>
          </div>

          {/* User ID */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                <span>System Identifier</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(user.id, 'uuid')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy User ID"
              >
                {copiedField === 'uuid' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <div className="font-mono text-slate-600 truncate text-[11px]" title={user.id}>
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
            className="flex items-center gap-1.5 text-slate-700 text-xs"
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
              className="flex items-center gap-1.5 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit User
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
