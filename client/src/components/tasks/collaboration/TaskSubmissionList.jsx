import { useState, useEffect, useCallback } from 'react'
import { taskSubmissionsApi } from '@/api/endpoints/taskSubmissions'
import { tasksApi } from '@/api/endpoints/tasks'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { formatDateTime } from '@/utils/formatters'
import {
  UploadCloud,
  Paperclip,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
} from 'lucide-react'

export function TaskSubmissionList({ taskId, isManagement = false, isViewer = false, onSubmissionsChange }) {
  const [submissions, setSubmissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    submissionId: null,
    status: null,
  })
  const [reviewNote, setReviewNote] = useState('')
  const [reviewError, setReviewError] = useState(null)

  const loadSubmissions = useCallback(async () => {
    if (!taskId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await taskSubmissionsApi.getTaskSubmissions(taskId)
      const items = res?.data?.submissions || res?.submissions || []
      setSubmissions(items)
      if (onSubmissionsChange) onSubmissionsChange(items)
    } catch (err) {
      console.error('Failed to load submissions:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to load task submissions.')
    } finally {
      setIsLoading(false)
    }
  }, [taskId, onSubmissionsChange])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const openReviewModal = (submissionId, status) => {
    setReviewModal({ isOpen: true, submissionId, status })
    setReviewNote('')
    setReviewError(null)
  }

  const handleReviewSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!reviewModal.submissionId || !reviewModal.status) return
    setActionLoadingId(reviewModal.submissionId)
    setReviewError(null)
    try {
      await taskSubmissionsApi.reviewSubmission(reviewModal.submissionId, {
        status: reviewModal.status,
        reviewNote: reviewNote.trim() || undefined,
      })
      setReviewModal({ isOpen: false, submissionId: null, status: null })
      setReviewNote('')
      await loadSubmissions()
    } catch (err) {
      console.error('Review error:', err)
      setReviewError(err?.response?.data?.message || err?.message || 'Failed to submit review.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDownload = async (attachment) => {
    try {
      await tasksApi.downloadAttachment(taskId, attachment.id, attachment.originalName)
    } catch (err) {
      console.error('Failed to download submission attachment:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <div className="text-xs text-rose-600 p-4 bg-rose-50 rounded-xl">{error}</div>
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-700">No work submitted yet</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Work submissions and deliverable files will be recorded here for lead review.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub, index) => {
        const submissionNumber = submissions.length - index
        const isApproved = sub.status === 'APPROVED'
        const isRevisionRequired = sub.status === 'REVISION_REQUIRED'

        return (
          <div
            key={sub.id}
            className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-3"
          >
            {/* Header: Submitter, Submission #, Status */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  {sub.submitter?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Submission #{submissionNumber}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      by {sub.submitter?.firstName} {sub.submitter?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(sub.submittedAt || sub.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={isApproved ? 'success' : isRevisionRequired ? 'warning' : 'primary'}
                  size="sm"
                >
                  {sub.status}
                </Badge>
              </div>
            </div>

            {/* Note */}
            {sub.note && (
              <p className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {sub.note}
              </p>
            )}

            {/* Attached Deliverables */}
            {sub.attachments && sub.attachments.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Deliverable Files ({sub.attachments.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sub.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {att.originalName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(att)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors ml-2"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Feedback / Decision Details */}
            {sub.reviewedAt && (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  isApproved
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                    : isRevisionRequired
                    ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap font-semibold text-[11px] mb-1">
                  <span className="flex items-center gap-1.5">
                    {isApproved ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>
                      {isApproved ? 'Approved' : 'Revision Requested'} by{' '}
                      {sub.reviewer?.firstName} {sub.reviewer?.lastName}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatDateTime(sub.reviewedAt)}
                  </span>
                </div>
                {sub.reviewNote ? (
                  <p className="text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                    {sub.reviewNote}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No additional review notes provided.</p>
                )}
              </div>
            )}

            {/* Management Review Actions */}
            {isManagement && !isViewer && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={actionLoadingId === sub.id}
                  onClick={() => openReviewModal(sub.id, 'REVISION_REQUIRED')}
                  leftIcon={AlertCircle}
                  className="text-xs text-amber-700 hover:bg-amber-50 cursor-pointer"
                >
                  Request Revision
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  disabled={actionLoadingId === sub.id}
                  onClick={() => openReviewModal(sub.id, 'APPROVED')}
                  leftIcon={CheckCircle}
                  className="text-xs cursor-pointer"
                >
                  Approve Deliverable
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {/* Review Submission Modal Dialog */}
      <Modal
        isOpen={reviewModal.isOpen}
        onClose={() => {
          if (!actionLoadingId) setReviewModal({ isOpen: false, submissionId: null, status: null })
        }}
        title={
          reviewModal.status === 'APPROVED'
            ? 'Approve Work Submission'
            : 'Request Work Revision'
        }
        maxWidth="sm"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          {reviewError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {reviewError}
            </div>
          )}

          <p className="text-xs text-slate-600">
            {reviewModal.status === 'APPROVED'
              ? 'Approve this submission as meeting project requirements and deliverables.'
              : 'Specify the changes or corrections needed by the assignee before this deliverable can be accepted.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Notes & Feedback {reviewModal.status === 'REVISION_REQUIRED' ? '(Recommended)' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={
                reviewModal.status === 'APPROVED'
                  ? 'Great work, deliverables meet requirements...'
                  : 'Please revise section 3 and attach the updated CSV document...'
              }
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setReviewModal({ isOpen: false, submissionId: null, status: null })}
              disabled={Boolean(actionLoadingId)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewModal.status === 'APPROVED' ? 'primary' : 'warning'}
              size="xs"
              isLoading={Boolean(actionLoadingId)}
              className="text-xs font-semibold"
            >
              {reviewModal.status === 'APPROVED' ? 'Confirm Approval' : 'Send Revision Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
