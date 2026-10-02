import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { workstreamsApi } from '@/api/endpoints/workstreams'
import { UserPlus, Trash2 } from 'lucide-react'

export function WorkstreamMembersModal({
  isOpen,
  onClose,
  workstream,
  availableProjectMembers = [],
  isManagement = false,
  onSuccess,
}) {
  const [members, setMembers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [memberRole, setMemberRole] = useState('MEMBER')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMembers = useCallback(async () => {
    if (!workstream?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await workstreamsApi.getMembers(workstream.id)
      const items = res?.data?.members || res?.members || []
      setMembers(items)
    } catch (err) {
      console.error('Failed to load workstream members:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to load members.')
    } finally {
      setIsLoading(false)
    }
  }, [workstream?.id])

  useEffect(() => {
    if (isOpen) {
      loadMembers()
      setSelectedUserId('')
    }
  }, [isOpen, loadMembers])

  // Filter project members who are not yet in this workstream
  const existingUserIds = new Set(members.map((m) => m.userId || m.user?.id))
  const eligibleUsers = availableProjectMembers.filter((pm) => {
    const u = pm.user || pm
    return !existingUserIds.has(u.id)
  })

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!selectedUserId) return
    setActionLoading(true)
    setError(null)

    try {
      await workstreamsApi.addMember(workstream.id, {
        userId: Number(selectedUserId),
        role: memberRole,
      })
      setSelectedUserId('')
      await loadMembers()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Add workstream member error:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to add member.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    setActionLoading(true)
    setError(null)
    try {
      await workstreamsApi.removeMember(workstream.id, userId)
      await loadMembers()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Remove workstream member error:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to remove member.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Squad Members — ${workstream?.name || 'Workstream'}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="danger" title="Error">
            {error}
          </Alert>
        )}

        {/* Add Member Form (Management Only) */}
        {isManagement && (
          <form
            onSubmit={handleAddMember}
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
          >
            <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              Add Member to Workstream
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="text-xs"
                >
                  <option value="">Select project member...</option>
                  {eligibleUsers.map((pm) => {
                    const u = pm.user || pm
                    return (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.role})
                      </option>
                    )
                  })}
                </Select>
              </div>
              <div className="w-36">
                <Select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="text-xs"
                >
                  <option value="MEMBER">Member</option>
                  <option value="LEAD">Lead</option>
                  <option value="CONTRIBUTOR">Contributor</option>
                </Select>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!selectedUserId || actionLoading}
                isLoading={actionLoading}
                className="text-xs shrink-0"
              >
                Add
              </Button>
            </div>
            {eligibleUsers.length === 0 && (
              <p className="text-[11px] text-slate-400 italic">
                All assigned project members are currently members of this workstream.
              </p>
            )}
          </form>
        )}

        {/* Current Members List */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Current Members ({members.length})
          </p>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No members assigned to this workstream yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {members.map((m) => {
                const u = m.user || {}
                const isLead = workstream?.leadUserId === u.id || m.role === 'LEAD'
                return (
                  <div
                    key={m.id || u.id}
                    className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {u.firstName?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                      {isLead && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                          Lead
                        </span>
                      )}
                    </div>

                    {isManagement && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(u.id)}
                        disabled={actionLoading}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove member from workstream"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}
