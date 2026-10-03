import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Mail,
  UserPlus,
  Ban,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  FolderGit2,
  RefreshCw,
  Info,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react'
import { clientInvitationsApi } from '@/api/endpoints/clientInvitations'
import { projectsApi } from '@/api/endpoints/projects'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { formatDate } from '@/utils/formatters'

export function ClientInvitationManager({
  projectId = null,
  projectName = null,
  _compact = false,
  onInvitationCreated = null,
}) {
  const [invitations, setInvitations] = useState([])
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)

  // Creation modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Newly created invitation link modal state
  const [createdResult, setCreatedResult] = useState(null)
  const [copied, setCopied] = useState(false)

  // Revoke modal state
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4000)
  }

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = projectId ? { projectId } : {}
      const [invRes, projRes] = await Promise.all([
        clientInvitationsApi.getInvitations(params).catch(() => ({ data: { invitations: [] } })),
        !projectId
          ? projectsApi.getProjects().catch(() => ({ data: { projects: [] } }))
          : Promise.resolve({ data: { projects: [] } }),
      ])

      const list = invRes.data?.invitations || invRes.data?.data?.invitations || []
      setInvitations(list)

      const projList = projRes.data?.projects || projRes.projects || []
      setProjects(projList)
    } catch (err) {
      console.error('Failed to load client invitations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateInvitation = async (e) => {
    e.preventDefault()
    setCreateError('')

    const trimmedEmail = inviteEmail.trim().toLowerCase()
    if (!trimmedEmail) {
      setCreateError('Client email address is required.')
      return
    }

    setIsCreating(true)
    try {
      const payload = {
        email: trimmedEmail,
        projectId: projectId || selectedProjectId || null,
      }

      const res = await clientInvitationsApi.createInvitation(payload)
      const data = res.data?.data || res.data

      setCreatedResult({
        email: trimmedEmail,
        projectName:
          projectName ||
          projects.find((p) => p.id === (projectId || selectedProjectId))?.name ||
          'Organization-level',
        expiresAt: data?.expiresAt || data?.invitation?.expiresAt,
        invitationLink: data?.invitationLink,
      })

      setIsInviteModalOpen(false)
      setInviteEmail('')
      setSelectedProjectId(projectId || '')
      loadData()
      if (onInvitationCreated) onInvitationCreated()
      showToast('Client invitation created successfully.')
    } catch (err) {
      const code = err.response?.data?.code
      let msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to create invitation.'

      if (code === 'INVITATION_CONFLICT') {
        msg = 'An active pending invitation already exists for this email address.'
      } else if (code === 'ACCOUNT_ROLE_CONFLICT') {
        msg = 'A user with this email already exists as an internal workspace member.'
      } else if (code === 'CROSS_ORGANIZATION_ACCOUNT_CONFLICT') {
        msg = 'A client account with this email exists in another organization.'
      }
      setCreateError(msg)
    } finally {
      setIsCreating(false)
    }
  }

  const fallbackCopy = (text) => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      return false
    }
  }

  const handleCopyLink = (link) => {
    if (!link) return
    const markCopied = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(link)
        .then(markCopied)
        .catch(() => {
          fallbackCopy(link)
          markCopied()
        })
    } else {
      fallbackCopy(link)
      markCopied()
    }
  }

  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const emailMatch = (inv.email || '').toLowerCase().includes(q)
        const projMatch = (inv.project?.name || '').toLowerCase().includes(q)
        if (!emailMatch && !projMatch) return false
      }
      return true
    })
  }, [invitations, statusFilter, searchQuery])

  const handleRevokeInvitation = async () => {
    if (!revokeTarget) return
    setIsRevoking(true)
    try {
      await clientInvitationsApi.revokeInvitation(revokeTarget.id)
      showToast(`Invitation for ${revokeTarget.email} revoked.`)
      setRevokeTarget(null)
      loadData()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to revoke invitation.'
      showToast(msg, 'error')
    } finally {
      setIsRevoking(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            <Clock className="w-2.5 h-2.5 mr-1" />
            Pending
          </Badge>
        )
      case 'ACCEPTED':
        return (
          <Badge variant="success" className="text-[10px]">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
            Accepted
          </Badge>
        )
      case 'REVOKED':
        return (
          <Badge variant="neutral" className="text-slate-500 text-[10px]">
            <Ban className="w-2.5 h-2.5 mr-1" />
            Revoked
          </Badge>
        )
      case 'EXPIRED':
        return (
          <Badge variant="neutral" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
            <Clock className="w-2.5 h-2.5 mr-1" />
            Expired
          </Badge>
        )
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Card */}
      <Card className="border border-slate-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Client Invitations ({invitations.length})
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure single-use invitation links for external client onboarding
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={loadData}
              disabled={isLoading}
              className="text-xs text-slate-600"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="primary"
              size="xs"
              onClick={() => {
                setCreateError('')
                setIsInviteModalOpen(true)
              }}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Invite Client
            </Button>
          </div>
        </CardHeader>
        {/* Filter & Search Bar */}
        {invitations.length > 0 && (
          <div className="bg-white border-b border-slate-100 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter invitations by email..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-500 focus:outline-hidden bg-white text-slate-700"
              >
                <option value="ALL">All Statuses ({invitations.length})</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="EXPIRED">Expired</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {isLoading && invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No client invitations found. Use &ldquo;Invite Client&rdquo; to issue an onboarding link.
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No invitations match the search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Client Email</th>
                    {!projectId && <th className="py-2.5 px-4">Project Scope</th>}
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Expires</th>
                    <th className="py-2.5 px-4">Created</th>
                    <th className="py-2.5 px-4">Invited By</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvitations.map((inv) => {
                    const isPending = inv.status === 'PENDING'
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {inv.email}
                        </td>
                        {!projectId && (
                          <td className="py-3 px-4 text-slate-600">
                            {inv.project?.name ? (
                              <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                                <FolderGit2 className="w-3 h-3 text-indigo-500" />
                                {inv.project.name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Organization-wide</span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4">{getStatusBadge(inv.status)}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {formatDate(inv.expiresAt)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {formatDate(inv.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {inv.inviter?.firstName} {inv.inviter?.lastName}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setRevokeTarget(inv)}
                              className="text-rose-600 hover:bg-rose-50 text-[11px] h-7 px-2"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Modal: Create Invitation */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Invite External Client
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate a secure single-use link for client onboarding
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvitation} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {!projectId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Assignment (Optional)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="">Organization-level (No project granted upfront)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    If chosen, the client receives portal access to this project immediately upon onboarding.
                  </p>
                </div>
              )}

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Client role will be assigned automatically. The generated invitation token expires in 72 hours and is single-use.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCreating}
                  className="text-xs font-semibold"
                >
                  Create &amp; Generate Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: New Invitation Link Result */}
      {createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Invitation Created Successfully
                  </h3>
                  <p className="text-xs text-slate-600">
                    Share this secure link with the client
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedResult(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client Email</span>
                  <span className="font-semibold text-slate-800">{createdResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Project Scope</span>
                  <span className="font-semibold text-slate-800">{createdResult.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expires At</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(createdResult.expiresAt)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Single-Use Invitation Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdResult.invitationLink || ''}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-700 select-all"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCopyLink(createdResult.invitationLink)}
                    className="text-xs font-semibold shrink-0 flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Security Note:</strong> This raw link is a one-time credential and cannot be retrieved again after closing this dialog. Send it securely to the client.
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatedResult(null)}
                  className="text-xs font-semibold"
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Confirmation: Revoke Invitation */}
      <ConfirmationModal
        isOpen={Boolean(revokeTarget)}
        title="Revoke Client Invitation"
        message={`Are you sure you want to revoke the invitation for "${revokeTarget?.email}"? The client will no longer be able to onboard using this link.`}
        confirmLabel="Revoke Invitation"
        cancelLabel="Keep Active"
        variant="danger"
        isLoading={isRevoking}
        onConfirm={handleRevokeInvitation}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  )
}
