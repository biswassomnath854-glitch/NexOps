import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/formatters'
import { Building2, Landmark, Users, Calendar, Fingerprint, Edit2, Shield } from 'lucide-react'

export function DepartmentDetailsModal({
  isOpen,
  onClose,
  department,
  onEdit,
  onChangeStatus,
}) {
  if (!department) return null

  const assignedUsers = department.users || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Department Details"
      description="Corporate divisional breakdown, team roster, and status."
      size="lg"
    >
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">{department.name}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
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
          <div className="p-3.5 rounded-lg border border-slate-100 bg-white">
            <p className="text-xs text-slate-600 leading-relaxed">{department.description}</p>
          </div>
        )}

        {/* Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Created:</span>
            <span className="font-mono text-slate-700">{formatDateTime(department.createdAt)}</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">ID:</span>
            <span className="font-mono text-slate-600 truncate" title={department.id}>
              {department.id}
            </span>
          </div>
        </div>

        {/* Team Members Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Assigned Team Members ({assignedUsers.length})
            </h4>
          </div>

          {assignedUsers.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No team members are currently assigned to this department.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-white divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {assignedUsers.map((member) => {
                const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'User'
                const initials = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase() || 'U'

                return (
                  <div
                    key={member.id}
                    className="p-2.5 sm:px-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
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
            className="flex items-center gap-1.5 text-slate-700"
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
              className="flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Department
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
