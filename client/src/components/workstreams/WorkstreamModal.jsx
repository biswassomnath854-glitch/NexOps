import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Textarea } from '@/components/forms/Textarea'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { workstreamsApi } from '@/api/endpoints/workstreams'
import { Layers } from 'lucide-react'

export function WorkstreamModal({
  isOpen,
  onClose,
  projectId,
  workstream = null,
  availableMembers = [],
  onSuccess,
}) {
  const isEditing = Boolean(workstream)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [leadUserId, setLeadUserId] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (workstream) {
      setName(workstream.name || '')
      setCode(workstream.code || '')
      setDescription(workstream.description || '')
      setLeadUserId(workstream.leadUserId ? String(workstream.leadUserId) : '')
      setStatus(workstream.status || 'ACTIVE')
    } else {
      setName('')
      setCode('')
      setDescription('')
      setLeadUserId('')
      setStatus('ACTIVE')
    }
    setError(null)
  }, [workstream, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Workstream name is required.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase() || undefined,
        description: description.trim() || undefined,
        leadUserId: leadUserId || null,
        status,
      }

      if (isEditing) {
        await workstreamsApi.updateWorkstream(workstream.id, payload)
      } else {
        await workstreamsApi.createWorkstream(projectId, payload)
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      console.error('Workstream save error:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to save workstream.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose()
      }}
      title={isEditing ? 'Edit Project Workstream' : 'Create Project Workstream'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Validation Error">
            {error}
          </Alert>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Workstream Name <span className="text-rose-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frontend Architecture, UI/UX, Backend APIs"
            required
            className="text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workstream Code (Optional)
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. FE, BE, QA"
              maxLength={12}
              className="text-xs font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Workstream Lead
            </label>
            <Select
              value={leadUserId}
              onChange={(e) => setLeadUserId(e.target.value)}
              className="text-xs"
            >
              <option value="">No Lead (Unassigned)</option>
              {availableMembers.map((m) => {
                const u = m.user || m
                return (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.role || 'Member'})
                  </option>
                )
              })}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Operational Status
          </label>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs font-medium"
          >
            <option value="ACTIVE">ACTIVE — In active execution</option>
            <option value="COMPLETED">COMPLETED — Scope delivered</option>
            <option value="ARCHIVED">ARCHIVED — Closed/Inactive</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Scope
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe team objectives, deliverables, and responsibilities..."
            className="text-xs"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isLoading}
            isLoading={isLoading}
            leftIcon={Layers}
            className="text-xs"
          >
            {isEditing ? 'Save Changes' : 'Create Workstream'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
