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
} from 'lucide-react'

export function OrganizationDetails({ organization, onEdit, onChangeStatus }) {
  if (!organization) return null

  const users = organization.users || []
  const departments = organization.departments || []

  return (
    <div className="space-y-6">
      {/* 1. Primary Organization Hero Card */}
      <Card className="border-indigo-100/60 bg-gradient-to-br from-white via-slate-50/40 to-indigo-50/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                <Landmark className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    {organization.name}
                  </h1>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
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
                className="flex items-center gap-1.5 text-xs"
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
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{users.length}</div>
              <div className="text-xs text-slate-500 font-medium">Enrolled Team Members</div>
            </div>
          </CardContent>
        </Card>

        {/* Total Departments */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{departments.length}</div>
              <div className="text-xs text-slate-500 font-medium">Corporate Departments</div>
            </div>
          </CardContent>
        </Card>

        {/* System Identifier */}
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-mono font-semibold text-slate-800 truncate" title={organization.id}>
                {organization.id}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Workspace UUID</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Departmental & Team Roster Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Organizational Departments ({departments.length})
            </CardTitle>
            <CardDescription>Divisions established within this enterprise workspace.</CardDescription>
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
                    className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Enterprise Members ({users.length})
            </CardTitle>
            <CardDescription>Team members attached to this organization account.</CardDescription>
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
                      className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
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
