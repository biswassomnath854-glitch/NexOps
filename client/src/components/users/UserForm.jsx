import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { ROLES, USER_STATUS } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import { AlertCircle } from 'lucide-react'

export function UserForm(props) {
  if (!props.isOpen) return null
  return <UserFormModal key={props.initialData?.id || 'new'} {...props} />
}

function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  organizations = [],
  departments = [],
  isLoading = false,
}) {
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState(() => ({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || ROLES.EMPLOYEE,
    status: initialData?.status || USER_STATUS.ACTIVE,
    organizationId: initialData?.organizationId || initialData?.organization?.id || organizations[0]?.id || '',
    departmentId: initialData?.departmentId || initialData?.department?.id || '',
  }))

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const validate = () => {
    const errs = {}
    if (!formData.firstName.trim()) {
      errs.firstName = 'First name is required.'
    } else if (formData.firstName.trim().length < 2) {
      errs.firstName = 'First name must be at least 2 characters.'
    }

    if (!formData.lastName.trim()) {
      errs.lastName = 'Last name is required.'
    } else if (formData.lastName.trim().length < 2) {
      errs.lastName = 'Last name must be at least 2 characters.'
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address.'
    }

    if (!isEditing) {
      if (!formData.password) {
        errs.password = 'Password is required for new users.'
      } else if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters long.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      // If organization changed, reset departmentId if it doesn't belong to the new org
      if (name === 'organizationId') {
        next.departmentId = ''
      }
      return next
    })
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    if (!validate()) return

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      status: formData.status,
    }

    if (formData.organizationId) {
      payload.organizationId = formData.organizationId
    } else {
      payload.organizationId = null
    }

    if (formData.departmentId) {
      payload.departmentId = formData.departmentId
    } else {
      payload.departmentId = null
    }

    if (!isEditing && formData.password) {
      payload.password = formData.password
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      console.error('User submission error:', err)
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.errors?.join(', ') ||
          err.message ||
          'Failed to save user. Please check inputs and permissions.'
      )
    }
  }

  // Filter available departments by selected organization (if set)
  const availableDepartments = formData.organizationId
    ? departments.filter(
        (dept) => !dept.organizationId || dept.organizationId === formData.organizationId
      )
    : departments

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Team Member' : 'Add New Team Member'}
      description={
        isEditing
          ? 'Update user contact information, corporate role, and departmental assignment.'
          : 'Create a new user account with role permissions and organization allocation.'
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

        {/* Names Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            required
            placeholder="e.g. Sarah"
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            required
            placeholder="e.g. Jenkins"
          />
        </div>

        {/* Email & Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Corporate Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            placeholder="sarah.jenkins@nexops.internal"
          />
          {!isEditing ? (
            <Input
              label="Temporary Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              placeholder="Minimum 8 characters"
            />
          ) : (
            <div className="flex flex-col justify-end">
              <span className="text-xs text-slate-400 pb-2">
                Passwords cannot be directly overwritten here for security reasons.
              </span>
            </div>
          )}
        </div>

        {/* Role & Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Role & Access Level"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={Object.values(ROLES).map((role) => ({
              value: role,
              label: formatRole(role),
            }))}
            required
          />

          <Select
            label="Account Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: USER_STATUS.ACTIVE, label: 'Active' },
              { value: USER_STATUS.INACTIVE, label: 'Inactive' },
              { value: USER_STATUS.SUSPENDED, label: 'Suspended' },
            ]}
            required
          />
        </div>

        {/* Organization & Department Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Organization"
            name="organizationId"
            value={formData.organizationId}
            onChange={handleChange}
            options={[
              { value: '', label: 'None / Standalone' },
              ...organizations.map((org) => ({
                value: org.id,
                label: org.name,
              })),
            ]}
          />

          <Select
            label="Department"
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            options={[
              { value: '', label: 'Unassigned Department' },
              ...availableDepartments.map((dept) => ({
                value: dept.id,
                label: dept.name + (dept.code ? ` (${dept.code})` : ''),
              })),
            ]}
          />
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
