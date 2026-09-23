import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { AlertCircle, FolderKanban } from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low — non-urgent work' },
  { value: 'MEDIUM', label: 'Medium — standard priority' },
  { value: 'HIGH', label: 'High — important, time-sensitive' },
  { value: 'URGENT', label: 'Urgent — critical, immediate action' },
]

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

/**
 * Allowed status transitions (mirrors backend taskService.js validateTaskStatusTransition).
 * We display them as hints — actual enforcement is server-side.
 */
const ALLOWED_TRANSITIONS = {
  TODO: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'],
  IN_PROGRESS: ['TODO', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
  BLOCKED: ['TODO', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['TODO'],
  CANCELLED: ['TODO'],
}

function getStatusOptionsForCurrent(currentStatus) {
  if (!currentStatus) return STATUS_OPTIONS
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || []
  return STATUS_OPTIONS.filter(
    (opt) => opt.value === currentStatus || allowed.includes(opt.value)
  )
}

export function TaskForm(props) {
  if (!props.isOpen) return null
  return <TaskFormModal key={props.initialData?.id || 'new'} {...props} />
}

function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  project = null,
  members = [],
  isLoading = false,
}) {
  const isEditing = Boolean(initialData?.id)

  const [formData, setFormData] = useState(() => ({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'MEDIUM',
    status: initialData?.status || 'TODO',
    assignedTo: initialData?.assignedTo || initialData?.assignee?.id || '',
    dueDate: initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '',
  }))

  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)

  const validate = () => {
    const errs = {}

    const trimmedTitle = formData.title.trim()
    if (!trimmedTitle) {
      errs.title = 'Task title is required.'
    } else if (trimmedTitle.length < 2) {
      errs.title = 'Task title must be at least 2 characters.'
    } else if (trimmedTitle.length > 200) {
      errs.title = 'Task title cannot exceed 200 characters.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
    if (serverError) setServerError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      priority: formData.priority,
      status: formData.status,
      assignedTo: formData.assignedTo || null,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    }

    try {
      await onSubmit(payload)
      onClose()
    } catch (err) {
      const serverErrs = err?.errors || err?.response?.data?.errors
      if (Array.isArray(serverErrs) && serverErrs.length > 0) {
        setServerError(serverErrs.join(' '))
      } else {
        setServerError(
          err?.message ||
            err?.response?.data?.message ||
            'Failed to save task. Please check your inputs.'
        )
      }
    }
  }

  // Members eligible as assignees (backend rejects VIEWER, but show all for UX — server will reject)
  const assigneeOptions = [
    { value: '', label: 'No Assignee (Unassigned)' },
    ...members
      .filter((m) => {
        const role = m.user?.role || m.role
        return role !== 'VIEWER'
      })
      .map((m) => {
        const user = m.user || m
        return {
          value: user.id,
          label: `${user.firstName} ${user.lastName}`.trim() + (m.role ? ` (${m.role})` : ''),
        }
      }),
  ]

  const statusOptionsForForm = isEditing
    ? getStatusOptionsForCurrent(initialData?.status)
    : STATUS_OPTIONS

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task' : 'Create New Task'}
      description={
        isEditing
          ? 'Update task details, priority, assignee, and due date.'
          : 'Add a new task to this project workspace.'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Server error */}
        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{serverError}</div>
          </div>
        )}

        {/* Project context (read-only) */}
        {project && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-indigo-50 border border-indigo-100">
            <FolderKanban className="w-4 h-4 text-indigo-500 shrink-0" />
            <div className="text-xs text-indigo-700 font-medium">
              Project:{' '}
              <span className="font-semibold">{project.name}</span>
              <span className="font-mono ml-1.5 bg-indigo-100 border border-indigo-200 rounded px-1 py-0.5 text-[10px]">
                {project.code}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <Input
          label="Task Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          required
          placeholder="e.g. Implement user authentication flow"
          maxLength={200}
        />

        {/* Priority + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={PRIORITY_OPTIONS}
            required
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptionsForForm}
            required
          />
        </div>

        {/* Assignee */}
        <Select
          label="Assignee"
          name="assignedTo"
          value={formData.assignedTo}
          onChange={handleChange}
          options={assigneeOptions}
          placeholder="Select an assignee (optional)"
        />

        {/* Due Date */}
        <Input
          label="Due Date"
          type="date"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          error={errors.dueDate}
          min={isEditing ? undefined : today}
          helperText={isEditing ? undefined : 'Due date cannot be in the past.'}
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            placeholder="Optional: describe scope, acceptance criteria, or implementation notes..."
            maxLength={5000}
          />
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
