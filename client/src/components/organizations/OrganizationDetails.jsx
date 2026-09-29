import { useState } from 'react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RoleBadge } from '@/components/common/RoleBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/formatters'
import {
  Landmark,
  Building2,
  Users,
  Briefcase,
  Globe,
  Calendar,
  Shield,
  Edit2,
  Fingerprint,
  Copy,
  Check,
} from 'lucide-react'

export function OrganizationDetails({ organization, onEdit, onChangeStatus }) {
  const [copiedUuid, setCopiedUuid] = useState(false)

  if (!organization) return null

  const users = organization.users || []
  const departments = organization.departments || []

  const copyUuid = () => {
    if (!organization.id) return
    navigator.clipboard?.writeText(organization.id)
    setCopiedUuid(true)
    setTimeout(() => setCopiedUuid(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* 1. Primary Organization Hero Card */}
      <Card className="border-slate-200/80 bg-white shadow-2xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-black text-2xl shadow-xs shrink-0">
                <Landmark className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {organization.name}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#635BFF]/10 text-[#5148E5] font-semibold border border-[#635BFF]/20">
                    /{organization.slug}
                  </span>
                  <StatusBadge status={organization.status} />
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                  {organization.industry && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {organization.industry}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Multi-Tenant Workspace
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Est. {formatDateTime(organization.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeStatus(organization)}
                className="flex items-center gap-1.5 text-xs text-slate-700"
              >
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Change Status
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEdit(organization)}
                className="flex items-center gap-1.5 text-xs font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Description */}
          {organization.description && (
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed max-w-3xl">
              {organization.description}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Key Operational Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{users.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Enrolled Team Members</div>
          </div>
        </div>

        {/* Total Departments */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{departments.length}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Corporate Departments</div>
          </div>
        </div>

        {/* System Identifier */}
        <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Workspace UUID</span>
              <button
                type="button"
                onClick={copyUuid}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy Workspace UUID"
              >
                {copiedUuid ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-xs font-mono font-semibold text-slate-800 truncate mt-0.5" title={organization.id}>
              {organization.id}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Departmental & Team Roster Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments List */}
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#635BFF]" />
              Organizational Departments ({departments.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Divisions established within this enterprise workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {departments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No departments defined yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{dept.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{dept.code}</div>
                    </div>
                    <StatusBadge status={dept.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Members List */}
        <Card className="border-slate-200/80 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Enterprise Members ({users.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Team members attached to this organization account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No members attached to this organization.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {users.map((user) => {
                  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
                  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'

                  return (
                    <div
                      key={user.id}
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-[10px] shrink-0 border border-[#635BFF]/20">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{name}</div>
                          <div className="text-slate-400 font-mono text-[11px] truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <RoleBadge role={user.role} size="sm" />
                        <StatusBadge status={user.status} size="sm" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
