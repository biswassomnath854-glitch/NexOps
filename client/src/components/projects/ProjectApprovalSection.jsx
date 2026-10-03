import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck,
  Send,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  UserPlus,
  UserMinus,
  RefreshCw,
  Info,
  MessageSquareQuote,
} from 'lucide-react'
import { projectsApi } from '@/api/endpoints/projects'
import { usersApi } from '@/api/endpoints/users'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { formatDate } from '@/utils/formatters'

export function ProjectApprovalSection({
  projectId,
  isManagement,
  isAdmin,
  onUpdate,
}) {
  const [approvalData, setApprovalData] = useState(null)
  const [clientAccesses, setClientAccesses] = useState([])
  const [availableClients, setAvailableClients] = useState([])
  const [clientFeedbacks, setClientFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Modals state
  const [modalType, setModalType] = useState(null) // 'submit' | 'approve' | 'revision' | 'publish' | 'unpublish' | 'grant'
  const [actionNotes, setActionNotes] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [revokeTarget, setRevokeTarget] = useState(null)

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4000)
  }

  const loadData = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      const [approvalRes, accessRes, usersRes, feedbackRes] = await Promise.all([
        projectsApi.getApprovalStatus(projectId).catch(() => ({ data: null })),
        projectsApi.getClientAccess(projectId).catch(() => ({ data: { accesses: [] } })),
        isAdmin
          ? usersApi.getUsers().catch(() => ({ data: { users: [] } }))
          : Promise.resolve({ data: { users: [] } }),
        projectsApi.getClientFeedback(projectId).catch(() => ({ data: { feedbacks: [] } })),
      ])

      setApprovalData(approvalRes.data || null)
      setClientAccesses(accessRes.data?.accesses || [])
      setClientFeedbacks(feedbackRes.data?.feedbacks || [])

      // Filter available users with role CLIENT
      const allUsers = usersRes.data?.users || []
      const clients = allUsers.filter(
        (u) => u.role === 'CLIENT' && u.status === 'ACTIVE'
      )
      setAvailableClients(clients)
    } catch (err) {
      console.error('Failed to load approval status:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, isAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleActionSubmit = async () => {
    setActionLoading(true)
    try {
      if (modalType === 'submit') {
        await projectsApi.submitForApproval(projectId, { notes: actionNotes })
        showToast('Project submitted for client approval.')
      } else if (modalType === 'approve') {
        await projectsApi.approveProject(projectId, { approvalNotes: actionNotes })
        showToast('Project approved for client publication.')
      } else if (modalType === 'revision') {
        if (!actionNotes.trim() || actionNotes.trim().length < 5) {
          showToast('Revision reason must be at least 5 characters.', 'error')
          setActionLoading(false)
          return
        }
        await projectsApi.requestRevision(projectId, { reason: actionNotes })
        showToast('Revision requested. Publication unpublished.')
      } else if (modalType === 'publish') {
        await projectsApi.publishProject(projectId)
        showToast('Project published to Client Portal.')
      } else if (modalType === 'unpublish') {
        await projectsApi.unpublishProject(projectId)
        showToast('Project unpublished from Client Portal.')
      } else if (modalType === 'grant') {
        if (!selectedClientId) {
          showToast('Please select a client account.', 'error')
          setActionLoading(false)
          return
        }
        await projectsApi.grantClientAccess(projectId, {
          clientUserId: selectedClientId,
          notes: actionNotes,
        })
        showToast('Client project access granted.')
        setSelectedClientId('')
      }

      setModalType(null)
      setActionNotes('')
      await loadData()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Approval action error:', err)
      showToast(err.message || 'Action failed. Please try again.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setActionLoading(true)
    try {
      await projectsApi.revokeClientAccess(projectId, revokeTarget.clientUserId)
      showToast('Client access revoked.')
      setRevokeTarget(null)
      await loadData()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Revoke client access error:', err)
      showToast(err.message || 'Failed to revoke access.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const getApprovalBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">APPROVED</Badge>
      case 'READY_FOR_APPROVAL':
        return <Badge variant="primary">READY FOR APPROVAL</Badge>
      case 'REVISION_REQUIRED':
        return <Badge variant="danger">REVISION REQUIRED</Badge>
      default:
        return <Badge variant="neutral">DRAFT</Badge>
    }
  }

  const getPublicationBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" className="bg-emerald-600 text-white">PUBLISHED</Badge>
      default:
        return <Badge variant="neutral">UNPUBLISHED</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
        Loading approval & client portal state...
      </div>
    )
  }

  if (!approvalData) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        No approval information available for this project.
      </div>
    )
  }

  const canSubmit =
    isManagement &&
    (approvalData.approvalStatus === 'DRAFT' ||
      approvalData.approvalStatus === 'REVISION_REQUIRED')

  const canApprove =
    isAdmin && approvalData.approvalStatus === 'READY_FOR_APPROVAL'

  const canRequestRevision =
    isAdmin &&
    (approvalData.approvalStatus === 'READY_FOR_APPROVAL' ||
      approvalData.approvalStatus === 'APPROVED')

  const canPublish =
    isAdmin &&
    approvalData.approvalStatus === 'APPROVED' &&
    approvalData.publicationStatus !== 'PUBLISHED'

  const canUnpublish =
    isAdmin && approvalData.publicationStatus === 'PUBLISHED'

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Status & Controls Card */}
      <Card className="border border-slate-200/90 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Client Portal Approval & Publication Status
              </CardTitle>
              <p className="text-xs text-slate-500">
                Manage administrative sign-off and client visibility rules
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={loadData}
            disabled={actionLoading}
            className="text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Status Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <p className="text-xs font-medium text-slate-500">Approval State</p>
              <div>{getApprovalBadge(approvalData.approvalStatus)}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <p className="text-xs font-medium text-slate-500">Publication State</p>
              <div>{getPublicationBadge(approvalData.publicationStatus)}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
              <p className="text-xs font-medium text-slate-500">Approved By</p>
              <p className="text-xs font-semibold text-slate-900">
                {approvalData.approver
                  ? `${approvalData.approver.firstName} ${approvalData.approver.lastName}`
                  : 'Pending Sign-off'}
              </p>
              {approvalData.approvedAt && (
                <p className="text-[10px] text-slate-400">
                  {formatDate(approvalData.approvedAt)}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1">
              <p className="text-xs font-medium text-slate-500">Published By</p>
              <p className="text-xs font-semibold text-slate-900">
                {approvalData.publisher
                  ? `${approvalData.publisher.firstName} ${approvalData.publisher.lastName}`
                  : 'Not Published'}
              </p>
              {approvalData.publishedAt && (
                <p className="text-[10px] text-slate-400">
                  {formatDate(approvalData.publishedAt)}
                </p>
              )}
            </div>
          </div>

          {/* Notes display */}
          {approvalData.approvalNotes && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Approval / Revision Memo:</p>
                <p className="mt-0.5 text-amber-800">{approvalData.approvalNotes}</p>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
            {canSubmit && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActionNotes('')
                  setModalType('submit')
                }}
                disabled={actionLoading}
                className="text-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit for Approval
              </Button>
            )}

            {canApprove && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActionNotes('')
                  setModalType('approve')
                }}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Approve Project
              </Button>
            )}

            {canRequestRevision && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionNotes('')
                  setModalType('revision')
                }}
                disabled={actionLoading}
                className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                Request Revision
              </Button>
            )}

            {canPublish && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setModalType('publish')}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                Publish to Client Portal
              </Button>
            )}

            {canUnpublish && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalType('unpublish')}
                disabled={actionLoading}
                className="text-slate-700 text-xs font-semibold"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Unpublish Project
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Access Management Card */}
      <Card className="border border-slate-200/90 shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Assigned Client Accounts ({clientAccesses.filter((a) => a.status === 'ACTIVE').length})
            </CardTitle>
            <p className="text-xs text-slate-500">
              External client users granted portal access to this project
            </p>
          </div>

          {isAdmin && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSelectedClientId('')
                setActionNotes('')
                setModalType('grant')
              }}
              className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Assign Client User
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {clientAccesses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No client users have been assigned access to this project yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Client User</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Granted At</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientAccesses.map((access) => {
                    const isActive = access.status === 'ACTIVE'
                    return (
                      <tr key={access.id} className="hover:bg-slate-50/40">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">
                            {access.clientUser?.firstName} {access.clientUser?.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {access.clientUser?.email}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={isActive ? 'success' : 'neutral'}
                            className="text-[10px]"
                          >
                            {access.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {formatDate(access.grantedAt)}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] italic">
                          {access.notes || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin && isActive && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setRevokeTarget(access)}
                              className="text-rose-600 hover:bg-rose-50 text-[11px] h-7 px-2"
                            >
                              <UserMinus className="w-3 h-3 mr-1" />
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

      {/* Client Deliverable Feedback Overview Card */}
      <Card className="border border-slate-200 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-base font-bold text-slate-900">
              Client Deliverable Feedback & Review Status
            </CardTitle>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {clientFeedbacks.length} review submission{clientFeedbacks.length === 1 ? '' : 's'}
          </span>
        </CardHeader>
        <CardContent>
          {clientFeedbacks.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <p className="text-xs text-slate-500 font-medium">
                No client feedback or acceptance submissions recorded yet for this project.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Deliverable</th>
                    <th className="py-2.5 px-3">Client Stakeholder</th>
                    <th className="py-2.5 px-3">Review Status</th>
                    <th className="py-2.5 px-3">Feedback / Notes</th>
                    <th className="py-2.5 px-3 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientFeedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {fb.document?.title || fb.document?.originalName || 'Document'}
                        {fb.document?.category && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {fb.document.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 leading-tight">
                          {fb.client?.name || 'Client User'}
                        </p>
                        <p className="text-[11px] text-slate-500">{fb.client?.email}</p>
                        {fb.clientSignedName && (
                          <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            Signed: {fb.clientSignedName}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {fb.status === 'ACCEPTED' ? (
                          <Badge variant="success" className="text-[10px] font-semibold flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Accepted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-semibold flex items-center gap-1 w-fit bg-amber-50 text-amber-700 border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Revision Requested
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs">
                        {fb.notes ? (
                          <span className="line-clamp-2 italic" title={fb.notes}>
                            &ldquo;{fb.notes}&rdquo;
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500 whitespace-nowrap">
                        {formatDate(fb.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog / Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {modalType === 'submit' && 'Submit Project for Approval'}
              {modalType === 'approve' && 'Approve Project for Client Viewing'}
              {modalType === 'revision' && 'Request Project Revisions'}
              {modalType === 'publish' && 'Publish Project to Client Portal'}
              {modalType === 'unpublish' && 'Unpublish Project'}
              {modalType === 'grant' && 'Assign Client User to Project'}
            </h3>

            {modalType === 'grant' ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Select Client Account:
                </label>
                {availableClients.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No active CLIENT users found in this organization. Create a CLIENT user in Administration &gt; Users first.
                  </p>
                ) : (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Client User --</option>
                    {availableClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email})
                      </option>
                    ))}
                  </select>
                )}

                <label className="text-xs font-semibold text-slate-700 block mt-2">
                  Access Notes (Optional):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="e.g. Primary stakeholder access for Q3 deliverables"
                  rows={2}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ) : modalType === 'revision' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Revision Reason (Required):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Explain required changes before client publication..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  {modalType === 'publish'
                    ? 'Publishing this project will make all client-visible documents and approved scope immediately accessible in the Client Portal.'
                    : modalType === 'unpublish'
                    ? 'Unpublishing will immediately revoke client portal visibility for this project.'
                    : 'Optional administrative notes for this status transition:'}
                </p>
                {(modalType === 'submit' || modalType === 'approve') && (
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Optional administrative memo..."
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:border-indigo-500 focus:outline-none"
                  />
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={actionLoading}
                onClick={() => setModalType(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actionLoading}
                onClick={handleActionSubmit}
                className={
                  modalType === 'revision'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Client Project Access"
        message={`Are you sure you want to revoke project access for ${
          revokeTarget?.clientUser?.email || 'this client'
        }? They will no longer be able to view this project in the Client Portal.`}
        confirmText="Revoke Access"
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  )
}
