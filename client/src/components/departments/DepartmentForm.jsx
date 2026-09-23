import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

export function DepartmentForm(props) {
  if (!props.isOpen) return null
  return <DepartmentFormModal key={props.initialData?.id || 'new'} {...props} />
}

function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  organizations = [],
  isLoading = false,
}) {
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState(() => ({
    organizationId: initialData?.organizationId || initialData?.organization?.id || organizations[0]?.id || '',
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || '',
    status: initialData?.status || 'ACTIVE',
  }))

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const validate = () => {
    const errs = {}

    if (!formData.organizationId) {
      errs.organizationId = 'Organization selection is required.'
    }

    if (!formData.name.trim()) {
      errs.name = 'Department name is required.'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Department name must be at least 2 characters.'
    } else if (formData.name.trim().length > 100) {
      errs.name = 'Department name must not exceed 100 characters.'
    }

    const trimmedCode = formData.code.trim().toUpperCase()
    if (!trimmedCode) {
      errs.code = 'Department code is required.'
    } else if (trimmedCode.length < 2) {
      errs.code = 'Department code must be at least 2 characters.'
    } else if (trimmedCode.length > 30) {
      errs.code = 'Department code must not exceed 30 characters.'
    } else if (!/^[A-Z0-9_-]+$/.test(trimmedCode)) {
      errs.code = 'Code may only contain uppercase letters, numbers, underscores, and hyphens.'
    }

    if (formData.description && formData.description.length > 5000) {
      errs.description = 'Description must not exceed 5000 characters.'
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
      status: formData.status,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error('Department submission error:', err)
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.errors?.join(', ') ||
          err.message ||
          'Failed to save department. Please verify inputs.'
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Department' : 'Create Department'}
      description={
        isEditing
          ? 'Modify department identity, corporate code, and operating status.'
          : 'Define a new organizational division with a unique department code.'
      }
      size="md"
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

        {/* Department Name & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Department Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              placeholder="e.g. Engineering & Platform"
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              label="Code (Alphanumeric)"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={errors.code}
              required
              placeholder="ENG"
              maxLength={30}
            />
          </div>
        </div>

        {/* Status */}
        <Select
          label="Operating Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={[
            { value: 'ACTIVE', label: 'Active (Operational)' },
            { value: 'INACTIVE', label: 'Inactive (Disabled)' },
          ]}
          required
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description & Scope
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            placeholder="Brief overview of the responsibilities and domain of this department..."
            maxLength={5000}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-rose-500 font-medium">{errors.description}</p>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
