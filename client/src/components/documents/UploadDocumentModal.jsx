import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Textarea } from '@/components/forms/Textarea'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { projectDocumentsApi } from '@/api/endpoints/projectDocuments'
import { UploadCloud, FileText, Paperclip, X } from 'lucide-react'

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp'

export function UploadDocumentModal({ isOpen, onClose, projectId, onSuccess }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('REQUIREMENT')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Document title is required.')
      return
    }
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('category', category)
      if (description.trim()) {
        formData.append('description', description.trim())
      }
      formData.append('file', file)

      await projectDocumentsApi.uploadDocument(projectId, formData)
      setTitle('')
      setCategory('REQUIREMENT')
      setDescription('')
      setFile(null)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Document upload error:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to upload document.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isUploading) onClose()
      }}
      title="Upload Project Document & Deliverables"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Upload Error">
            {error}
          </Alert>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Title <span className="text-rose-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Architecture Blueprint v1.0, Sprint 4 Deliverable"
            required
            className="text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Document Category
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-medium"
          >
            <option value="REQUIREMENT">REQUIREMENT — Product & business requirements</option>
            <option value="SPECIFICATION">SPECIFICATION — Technical specifications & APIs</option>
            <option value="DELIVERABLE">DELIVERABLE — Completed project milestone deliverable</option>
            <option value="REPORT">REPORT — Performance or audit report</option>
            <option value="DESIGN">DESIGN — Wireframes, assets, UI specs</option>
            <option value="REFERENCE">REFERENCE — General documentation & references</option>
            <option value="OTHER">OTHER — Miscellaneous project file</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select File <span className="text-rose-500">*</span>
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-800">
              {file ? file.name : 'Click to select project document'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG, WEBP (Max 25MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Notes (Optional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Add context, version information, or instructions for the team..."
            className="text-xs"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isUploading}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isUploading || !file}
            isLoading={isUploading}
            leftIcon={FileText}
            className="text-xs"
          >
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  )
}
