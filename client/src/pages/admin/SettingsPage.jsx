import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { RoleBadge } from '@/components/common/RoleBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { formatDateTime, formatRole } from '@/utils/formatters'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import {
  User,
  Building2,
  Bell,
  Shield,
  Mail,
  Fingerprint,
  Calendar,
  Lock,
  Landmark,
  Key,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

const TABS = [
  { id: 'account', label: 'Account & Identity', icon: User, description: 'Personal credentials and profile' },
  { id: 'workspace', label: 'Workspace & Organization', icon: Building2, description: 'Organization scope and isolation' },
  { id: 'notifications', label: 'Notification Preferences', icon: Bell, description: 'Event triggers and alerts' },
  { id: 'security', label: 'Security & Access Control', icon: Shield, description: 'RBAC permissions and session policies' },
]

export function SettingsPage() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [copiedField, setCopiedField] = useState(null)

  const copyToClipboard = (text, fieldName) => {
    if (!text) return
    navigator.clipboard?.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const isAdmin =
    currentUser?.role && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser.role)

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Team Member'
  const initials = `${currentUser?.firstName?.[0] || ''}${currentUser?.lastName?.[0] || ''}`.toUpperCase() || 'U'

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings Console
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#635BFF]/10 text-[#5148E5] border border-[#635BFF]/20">
            Enterprise Control
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account identity, workspace parameters, notification rules, and security privileges.
        </p>
      </div>

      {/* 2. Main Settings Console Layout: Left Nav + Right Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Settings Navigation */}
        <div className="lg:w-64 shrink-0 space-y-1">
          <div className="bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-2xs space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${
                    isActive
                      ? 'bg-[#635BFF] text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{tab.label}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Quick Context Card */}
          <div className="hidden lg:block p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Active Authority</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <RoleBadge role={currentUser?.role} size="sm" showIcon />
              <StatusBadge status={currentUser?.status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Permissions are governed by corporate role-based access control.
            </p>
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 min-w-0">
          {/* TAB 1: Account & Identity */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Profile Card */}
              <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-sm">Account Identity</CardTitle>
                  <CardDescription className="text-xs">
                    Your authenticated credentials and organizational affiliation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Identity Row */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{fullName}</h3>
                        <RoleBadge role={currentUser?.role} showIcon />
                        <StatusBadge status={currentUser?.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{currentUser?.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentUser?.email, 'email')}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy email"
                        >
                          {copiedField === 'email' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Landmark className="w-3.5 h-3.5 text-[#635BFF]" />
                        <span>Corporate Organization</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {currentUser?.organization?.name || 'Standalone Workspace'}
                      </div>
                      {currentUser?.organization?.slug && (
                        <div className="font-mono text-slate-400 text-[11px]">
                          /{currentUser.organization.slug}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-[#635BFF]" />
                        <span>Assigned Department</span>
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {currentUser?.department?.name || 'Unassigned Department'}
                      </div>
                      {currentUser?.department?.code && (
                        <div className="font-mono text-slate-400 text-[11px]">
                          Code: {currentUser.department.code}
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Account Created</span>
                      </div>
                      <div className="font-medium text-slate-700 font-mono">
                        {formatDateTime(currentUser?.createdAt)}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                          <span>User UUID</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentUser?.id, 'uuid')}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                          title="Copy UUID"
                        >
                          {copiedField === 'uuid' ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-slate-600 truncate text-[11px]" title={currentUser?.id}>
                        {currentUser?.id || '—'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Session & Security Notice */}
              <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#635BFF]" />
                    Session & Authentication Status
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current authorization context for this browser session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span className="font-semibold text-slate-900">Authenticated via Dual-Token JWT</span>
                      </div>
                      <p className="text-slate-500">
                        Automatic token renewal is active. Session is secured with Bearer authentication.
                      </p>
                    </div>
                    <Badge variant="success" size="md">
                      Active Session
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: Workspace & Organization */}
          {activeTab === 'workspace' && (
            <div className="space-y-6 animate-in fade-in">
              <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Corporate Workspace Profile</CardTitle>
                      <CardDescription className="text-xs">
                        Enterprise organizational boundary and tenancy isolation.
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <Link to={ROUTES.ORGANIZATIONS}>
                        <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                          Manage Organizations
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                      <Landmark className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">
                          {currentUser?.organization?.name || 'SB Pvt. Ltd.'}
                        </h3>
                        {currentUser?.organization?.slug && (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#635BFF]/10 text-[#5148E5] font-semibold border border-[#635BFF]/20">
                            /{currentUser.organization.slug}
                          </span>
                        )}
                        <StatusBadge status={currentUser?.organization?.status || 'ACTIVE'} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Industry: {currentUser?.organization?.industry || 'Enterprise Software & Operations'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                      <div className="text-slate-400 font-medium">Tenancy Model</div>
                      <div className="font-semibold text-slate-900 text-sm">Multi-Tenant Isolated</div>
                      <div className="text-slate-500 text-[11px]">Strict organization-level data boundary enforced.</div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                      <div className="text-slate-400 font-medium">Divisional Management</div>
                      <div className="font-semibold text-slate-900 text-sm">Departments Enabled</div>
                      <div className="text-slate-500 text-[11px]">
                        {isAdmin ? (
                          <Link to={ROUTES.DEPARTMENTS} className="text-[#635BFF] hover:underline font-medium inline-flex items-center gap-1">
                            Configure Departments <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          'Corporate department segmentation active.'
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Notifications Preferences */}
          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-in fade-in">
              <NotificationPreferences />
            </div>
          )}

          {/* TAB 4: Security & Access Control */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Role Authority Card */}
              <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#635BFF]" />
                    Role-Based Access Control (RBAC)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Authorized privileges assigned to your current role.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <RoleBadge role={currentUser?.role} size="md" showIcon />
                    <span className="text-xs text-slate-500 font-medium">
                      Authority Level: {formatRole(currentUser?.role)}
                    </span>
                  </div>

                  {/* Capability Matrix */}
                  <div className="rounded-xl border border-slate-200/80 divide-y divide-slate-100 text-xs overflow-hidden">
                    <div className="p-3 bg-slate-50/70 font-semibold text-slate-700 flex items-center justify-between">
                      <span>Administrative Capability</span>
                      <span>Authorized Status</span>
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">User Directory & Team Accounts</div>
                        <div className="text-[11px] text-slate-400">Create, edit, suspend, and allocate user accounts</div>
                      </div>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Restricted (Admin only)</span>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">Corporate Departments & Divisions</div>
                        <div className="text-[11px] text-slate-400">Structure business units and assign divisional codes</div>
                      </div>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Restricted (Admin only)</span>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">Organization Governance & Slugs</div>
                        <div className="text-[11px] text-slate-400">Configure corporate legal profile, slug, and status</div>
                      </div>
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Restricted (Admin only)</span>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">Projects & Operational Lifecycles</div>
                        <div className="text-[11px] text-slate-400">Create, update, and manage project workflows</div>
                      </div>
                      {[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(currentUser?.role) ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Read / Assigned Scope</span>
                      )}
                    </div>

                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">Tasks & Deliverables</div>
                        <div className="text-[11px] text-slate-400">Create, assign, update, and review deliverables</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Authorized
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password & Security Policy */}
              <Card className="border-slate-200/80 shadow-2xs">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#635BFF]" />
                    Corporate Security Policies
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Baseline security parameters enforced across SB Pvt. Ltd.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>
                    • <strong>Password Standard:</strong> Minimum 8 characters enforced on account creation.
                  </p>
                  <p>
                    • <strong>Multi-Tenancy Isolation:</strong> All database queries strictly bound by Organization ID.
                  </p>
                  <p>
                    • <strong>Token Security:</strong> Signed HMAC-SHA256 JWT tokens with rotating refresh cycles.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
