import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, ShieldAlert, Send } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { clientApi } from '@/api/endpoints/client'

export function ClientFeedbackModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  document,
  type = 'accept', // 'accept' | 'revision'
}) {
  const [notes, setNotes] = useState('')
  const [clientSignedName, setClientSignedName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notesError, setNotesError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNotes('')
      setClientSignedName('')
      setErrorMessage('')
      setNotesError('')
    }
  }, [isOpen, type])

  const validate = () => {
    if (type === 'revision') {
      const trimmed = notes.trim()
      if (!trimmed) {
        setNotesError('Feedback notes are required when requesting revisions.')
        return false
      }
      if (trimmed.length < 10) {
        setNotesError('Please provide at least 10 characters detailing the requested changes.')
        return false
      }
    }
    setNotesError('')
    return true
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setErrorMessage('')

    if (!validate()) return

    setIsLoading(true)
    try {
      if (type === 'accept') {
        await clientApi.acceptDeliverable(projectId, document.id, {
          notes: notes.trim() || undefined,
          clientSignedName: clientSignedName.trim() || undefined,
        })
      } else {
        await clientApi.requestRevision(projectId, document.id, {
          notes: notes.trim(),
          clientSignedName: clientSignedName.trim() || undefined,
        })
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Feedback submission error:', err)
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to submit feedback. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const isAccept = type === 'accept'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAccept ? 'Accept Deliverable' : 'Request Deliverable Revision'}
      description={
        document
          ? `For deliverable: "${document.title || document.originalName}"`
          : undefined
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-800 text-xs"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {isAccept ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-start gap-3 text-emerald-900 text-xs leading-relaxed">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-950 mb-0.5">
                Official Deliverable Acceptance
              </p>
              <p>
                By accepting, you confirm that this deliverable satisfies contract requirements
                and specifications for your project.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/70 flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950 mb-0.5">
                Revision & Corrections Request
              </p>
              <p>
                Please specify the revisions, corrections, or adjustments required by your team.
                The SB Pvt. Ltd. project team will be notified to review and address your notes.
              </p>
            </div>
          </div>
        )}

        {/* Notes / Reason field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <label htmlFor="feedback-notes">
              {isAccept ? 'Acceptance Comments (Optional)' : 'Revision Notes *'}
            </label>
            <span className="text-[11px] text-slate-400 font-normal">
              {notes.length} / 2000 chars
            </span>
          </div>

          <textarea
            id="feedback-notes"
            rows={4}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              if (notesError) setNotesError('')
              if (errorMessage) setErrorMessage('')
            }}
            placeholder={
              isAccept
                ? 'Add any final remarks or approval comments...'
                : 'Detail the exact revisions, missing specifications, or corrections needed (minimum 10 characters)...'
            }
            className={`w-full rounded-xl border p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
              notesError
                ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/20'
                : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500'
            }`}
            maxLength={2000}
            disabled={isLoading}
          />

          {notesError && (
            <p className="text-xs text-rose-600 font-medium">{notesError}</p>
          )}
        </div>

        {/* Optional Sign-off Name */}
        <div>
          <Input
            label="Client Sign-off Name (Optional)"
            type="text"
            placeholder="e.g. Jane Doe, VP of Technology"
            value={clientSignedName}
            onChange={(e) => setClientSignedName(e.target.value)}
            disabled={isLoading}
            maxLength={150}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Optional electronic sign-off name for administrative verification.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant={isAccept ? 'success' : 'primary'}
            size="sm"
            isLoading={isLoading}
            className={
              isAccept
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }
          >
            {isAccept ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Confirm Acceptance
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1.5" />
                Submit Revision Request
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
