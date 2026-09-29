import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/formatters'
import { Building2, Landmark, Users, Calendar, Fingerprint, Edit2, Shield, Copy, Check } from 'lucide-react'

export function DepartmentDetailsModal({
  isOpen,
  onClose,
  department,
  onEdit,
  onChangeStatus,
}) {
  const [copiedUuid, setCopiedUuid] = useState(false)

  if (!department) return null

  const assignedUsers = department.users || []

  const copyUuid = () => {
    if (!department.id) return
    navigator.clipboard?.writeText(department.id)
    setCopiedUuid(true)
    setTimeout(() => setCopiedUuid(false), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Details"
      description="Corporate divisional breakdown, team roster, and status."
      size="lg"
    >
      <div className="space-y-5">
        {/* Header summary */}
        <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#635BFF] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{department.name}</h3>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold border border-slate-300/60">
                  {department.code}
                </span>
                <StatusBadge status={department.status} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <Landmark className="w-3.5 h-3.5 text-slate-400" />
                <span>{department.organization?.name || 'Primary Organization'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {department.description && (
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Scope & Responsibilities
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{department.description}</p>
          </div>
        )}

        {/* Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center gap-2 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Created:</span>
            <span className="font-mono text-slate-700">{formatDateTime(department.createdAt)}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Fingerprint className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-500 shrink-0">ID:</span>
              <span className="font-mono text-slate-600 truncate text-[11px]" title={department.id}>
                {department.id}
              </span>
            </div>
            <button
              type="button"
              onClick={copyUuid}
              className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              title="Copy ID"
            >
              {copiedUuid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Team Members Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#635BFF]" />
              Assigned Team Members ({assignedUsers.length})
            </h4>
          </div>

          {assignedUsers.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400 bg-slate-50/50">
              No team members are currently assigned to this department.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-white divide-y divide-slate-100 max-h-56 overflow-y-auto shadow-2xs">
              {assignedUsers.map((member) => {
                const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'User'
                const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'U'

                return (
                  <div
                    key={member.id}
                    className="p-2.5 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-[10px] shrink-0 border border-[#635BFF]/20">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{name}</div>
                        <div className="text-slate-400 font-mono text-[11px] truncate">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <RoleBadge role={member.role} size="sm" />
                      <StatusBadge status={member.status} size="sm" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose()
              onChangeStatus?.(department)
            }}
            className="flex items-center gap-1.5 text-slate-700 text-xs"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Toggle Status
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose()
                onEdit?.(department)
              }}
              className="flex items-center gap-1.5 text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Department
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
