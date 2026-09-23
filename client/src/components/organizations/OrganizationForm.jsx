import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { AlertCircle } from 'lucide-react'

export function OrganizationForm(props) {
  if (!props.isOpen) return null
  return <OrganizationFormModal key={props.initialData?.id || 'new'} {...props} />
}

function OrganizationFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    industry: initialData?.industry || '',
    description: initialData?.description || '',
    status: initialData?.status || 'ACTIVE',
  }))

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const validate = () => {
    const errs = {}

    if (!formData.name.trim()) {
      errs.name = 'Organization name is required.'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Organization name must be at least 2 characters.'
    } else if (formData.name.trim().length > 150) {
      errs.name = 'Organization name must not exceed 150 characters.'
    }

    const trimmedSlug = formData.slug.trim().toLowerCase()
    if (!trimmedSlug) {
      errs.slug = 'Organization slug is required.'
    } else if (trimmedSlug.length < 2) {
      errs.slug = 'Slug must be at least 2 characters.'
    } else if (trimmedSlug.length > 160) {
      errs.slug = 'Slug must not exceed 160 characters.'
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
      errs.slug = 'Slug can contain only lowercase letters, numbers, and hyphens (e.g. nexops-corp).'
    }

    if (formData.industry && formData.industry.length > 100) {
      errs.industry = 'Industry must not exceed 100 characters.'
    }

    if (formData.description && formData.description.length > 5000) {
      errs.description = 'Description must not exceed 5000 characters.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let nextVal = value
    if (name === 'slug') {
      nextVal = value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    }
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
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase(),
      industry: formData.industry.trim() || null,
      description: formData.description.trim() || null,
      status: formData.status,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error('Organization update error:', err)
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.errors?.join(', ') ||
          err.message ||
          'Failed to update organization profile.'
      )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Organization Profile' : 'Create Organization'}
      description="Update corporate identification, custom domain slug, and operational status."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{serverError}</div>
          </div>
        )}

        {/* Organization Name */}
        <Input
          label="Corporate Legal Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="e.g. NexOps Technologies Inc."
        />

        {/* Slug & Industry Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Domain Slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            error={errors.slug}
            required
            placeholder="nexops-corp"
          />

          <Input
            label="Industry Sector"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            error={errors.industry}
            placeholder="e.g. Enterprise Software"
          />
        </div>

        {/* Operating Status */}
        <Select
          label="Operational Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ]}
          required
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Enterprise Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            placeholder="Brief corporate summary and operational mandates..."
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
            {isEditing ? 'Save Changes' : 'Create Organization'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
