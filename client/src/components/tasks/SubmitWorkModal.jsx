import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/forms/Textarea'
import { Alert } from '@/components/ui/Alert'
import { taskSubmissionsApi } from '@/api/endpoints/taskSubmissions'
import { UploadCloud, Paperclip, X, FileText } from 'lucide-react'

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp'

export function SubmitWorkModal({ isOpen, onClose, taskId, onSubmissionSuccess }) {
  const [note, setNote] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selected].slice(0, 10))
    }
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('note', note.trim())
      files.forEach((file) => {
        formData.append('files', file)
      })

      await taskSubmissionsApi.submitWork(taskId, formData)
      setNote('')
      setFiles([])
      if (onSubmissionSuccess) onSubmissionSuccess()
      onClose()
    } catch (err) {
      console.error('Task submission error:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to submit work.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      title="Submit Completed Work & Deliverables"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Submission Error">
            {error}
          </Alert>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Work Summary & Notes
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Explain what was completed, key highlights, or testing notes..."
            className="text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Deliverable Attachments
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-800">
              Click to select deliverable files
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, WEBP (Max 10 files, 25MB each)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate font-medium text-slate-700">{file.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={FileText}
            className="text-xs"
          >
            Submit Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  )
}
