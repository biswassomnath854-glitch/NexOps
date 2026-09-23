import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

const PROJECT_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning (Setup phase)' },
  { value: 'ACTIVE', label: 'Active (In progress)' },
  { value: 'ON_HOLD', label: 'On Hold (Paused)' },
  { value: 'COMPLETED', label: 'Completed (Delivered)' },
  { value: 'CANCELLED', label: 'Cancelled (Terminated)' },
]

export function ProjectForm(props) {
  if (!props.isOpen) return null
  return <ProjectFormModal key={props.initialData?.id || 'new'} {...props} />
}

function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  organizations = [],
  isLoading = false,
}) {
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState(() => ({
    organizationId:
      initialData?.organizationId ||
      initialData?.organization?.id ||
      organizations[0]?.id ||
      '',
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    startDate: initialData?.startDate ? initialData.startDate.slice(0, 10) : '',
    endDate: initialData?.endDate ? initialData.endDate.slice(0, 10) : '',
    status: initialData?.status || 'PLANNING',
  }))

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const validate = () => {
    const errs = {}

    if (!formData.organizationId) {
      errs.organizationId = 'Organization assignment is required.'
    }

    if (!formData.name.trim()) {
      errs.name = 'Project name is required.'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Project name must be at least 2 characters.'
    } else if (formData.name.trim().length > 150) {
      errs.name = 'Project name cannot exceed 150 characters.'
    }

    const trimmedCode = formData.code.trim().toUpperCase()
    if (!trimmedCode) {
      errs.code = 'Project code is required.'
    } else if (trimmedCode.length < 2) {
      errs.code = 'Project code must be at least 2 characters.'
    } else if (trimmedCode.length > 30) {
      errs.code = 'Project code cannot exceed 30 characters.'
    } else if (!/^[A-Z0-9_-]+$/.test(trimmedCode)) {
      errs.code = 'Code can only contain uppercase letters, numbers, underscores, and hyphens.'
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        errs.endDate = 'End date cannot be earlier than start date.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextVal = name === 'code' ? value.toUpperCase() : value
    setFormData((prev) => ({ ...prev, [name]: nextVal }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    const payload = {
      organizationId: formData.organizationId,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || null,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      status: formData.status,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error('Project form submission error:', err)
      const errCode = err.response?.data?.code
      if (errCode === 'PROJECT_CODE_ALREADY_EXISTS') {
        setServerError('A project with this code already exists in this organization.')
      } else {
        setServerError(
          err.response?.data?.message ||
            err.response?.data?.errors?.map((e) => e.message || e).join(', ') ||
            err.message ||
            'Failed to save project. Please check inputs and role permissions.'
        )
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project Workspace' : 'Create New Project'}
      description={
        isEditing
          ? 'Modify project milestone timelines, scope description, and lifecycle status.'
          : 'Establish a new cross-functional project workspace with a unique code.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{serverError}</div>
          </div>
        )}

        {/* Organization */}
        <Select
          label="Corporate Organization"
          name="organizationId"
          value={formData.organizationId}
          onChange={handleChange}
          error={errors.organizationId}
          options={organizations.map((org) => ({
            value: org.id,
            label: org.name,
          }))}
          required
        />

        {/* Project Name & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Project Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="e.g. Next-Gen Enterprise Portal"
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Project Code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={errors.code}
              required
              placeholder="NEX-CORE"
              maxLength={30}
            />
          </div>
        </div>

        {/* Status */}
        <Select
          label="Lifecycle Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={PROJECT_STATUS_OPTIONS}
          required
        />

        {/* Timeline Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Start Date"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
          />
          <Input
            label="Target End Date"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Project Scope & Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            placeholder="High-level objectives, deliverables, and team responsibilities..."
            maxLength={2000}
          />
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
