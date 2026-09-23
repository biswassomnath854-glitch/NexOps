import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TaskStatusBadge } from './TaskStatusBadge'
import { AlertCircle } from 'lucide-react'

/**
 * Status transition map — mirrors backend taskService.js.
 * Frontend shows only valid transitions so the user can't make
 * invalid choices, but the server is the authority.
 */
const ALLOWED_TRANSITIONS = {
  TODO: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'],
  IN_PROGRESS: ['TODO', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
  BLOCKED: ['TODO', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['TODO'],
  CANCELLED: ['TODO'],
}

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/**
 * TaskStatusChangeModal — purpose-built modal for changing task status
 * with the valid transition options prominently displayed.
 */
export function TaskStatusChangeModal({
  isOpen,
  onClose,
  task,
  onSubmit,
  isLoading = false,
}) {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [serverError, setServerError] = useState(null)

  if (!isOpen || !task) return null

  const currentStatus = task.status
  const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || []

  const handleSubmit = async () => {
    if (!selectedStatus) return
    setServerError(null)
    try {
      await onSubmit(selectedStatus)
      onClose()
    } catch (err) {
      setServerError(
        err?.message ||
          err?.response?.data?.message ||
          'Failed to update task status.'
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="Change Task Status">
      <div className="space-y-4">
        {serverError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="text-xs text-slate-500 leading-relaxed">
          Current status:{' '}
          <TaskStatusBadge status={currentStatus} size="sm" className="ml-1" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Change to
          </p>
          {allowedNext.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No valid transitions available from this status.</p>
          ) : (
            allowedNext.map((status) => (
              <label
                key={status}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedStatus === status
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="taskStatus"
                  value={status}
                  checked={selectedStatus === status}
                  onChange={() => setSelectedStatus(status)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <TaskStatusBadge status={status} size="sm" />
                <span className="text-xs text-slate-600 font-medium flex-1">
                  {STATUS_LABELS[status]}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!selectedStatus || isLoading}
          >
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  )
}
