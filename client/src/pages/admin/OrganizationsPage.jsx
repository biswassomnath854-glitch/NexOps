import { useState, useEffect, useCallback } from 'react'
import { organizationsApi } from '@/api/endpoints/organizations'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import { OrganizationDetails, OrganizationForm } from '@/components/organizations'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { RotateCw, CheckCircle2, ShieldAlert, Landmark } from 'lucide-react'

export function OrganizationsPage() {
  const { user: currentUser } = useAuth()

  const [organizations, setOrganizations] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [statusModalOrg, setStatusModalOrg] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Check admin authorization
  const isAuthorized =
    currentUser?.role && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUser.role)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  const loadData = useCallback(async () => {
    if (!isAuthorized) return

    try {
      const res = await organizationsApi.getOrganizations()
      const orgList = res?.data?.organizations || res?.organizations || []
      setOrganizations(orgList)
      // Pick first or keep currently selected
      if (orgList.length > 0) {
        setSelectedOrg((prev) => {
          if (!prev) return orgList[0]
          return orgList.find((o) => o.id === prev.id) || orgList[0]
        })
      }
      setError(null)
    } catch (err) {
      console.error('Failed to load organizations:', err)
      setError(err.message || 'Unable to retrieve organization profile.')
    }
  }, [isAuthorized])

  useEffect(() => {
    let ignore = false
    async function init() {
      if (isAuthorized) {
        await loadData()
      }
      if (!ignore) {
        setIsLoading(false)
      }
    }
    init()
    return () => {
      ignore = true
    }
  }, [loadData, isAuthorized])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const handleUpdateOrganization = async (formData) => {
    if (!selectedOrg) return
    setIsActionLoading(true)

    try {
      await organizationsApi.updateOrganization(selectedOrg.id, formData)
      showFeedback(`Organization "${formData.name}" profile updated.`)
      await loadData()
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!statusModalOrg) return
    setIsActionLoading(true)

    const nextStatus = statusModalOrg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      await organizationsApi.updateOrganizationStatus(statusModalOrg.id, { status: nextStatus })
      showFeedback(`Organization status changed to ${nextStatus}.`)
      setStatusModalOrg(null)
      await loadData()
    } catch (err) {
      console.error('Organization status update error:', err)
      showFeedback(
        err.response?.data?.message || err.message || 'Failed to update organization status.',
        'error'
      )
    } finally {
      setIsActionLoading(false)
    }
  }

  // Graceful 403 Forbidden Screen
  if (!isAuthorized) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <Card className="border-rose-200">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Administrator Access Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Organization parameters, multi-tenant billing, and workspace status are restricted to
              organization Administrators. Your current role is{' '}
              <strong className="text-slate-800 font-semibold">
                {formatRole(currentUser?.role)}
              </strong>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !organizations.length) {
    return (
      <div className="py-12">
        <ErrorState
          title="Unable to Load Organization Profile"
          message={error}
          onRetry={loadData}
          retryLabel="Retry Connection"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Organization Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              Enterprise Profile
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Corporate identification, custom domain slugs, multi-tenant policies, and operational
            status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {organizations.length > 1 && (
            <select
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const found = organizations.find((o) => o.id === e.target.value)
                if (found) setSelectedOrg(found)
              }}
              className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. Main Content */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-24 bg-slate-100 rounded-xl" />
          </div>
        </div>
      ) : selectedOrg ? (
        <OrganizationDetails
          organization={selectedOrg}
          onEdit={() => setIsEditOpen(true)}
          onChangeStatus={(org) => setStatusModalOrg(org)}
        />
      ) : (
        <Card className="p-12 text-center">
          <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No Organization Record Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no organization entities linked to this system.
          </p>
        </Card>
      )}

      {/* 3. Edit Organization Modal */}
      <OrganizationForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateOrganization}
        initialData={selectedOrg}
        isLoading={isActionLoading}
      />

      {/* 4. Change Status Modal */}
      {statusModalOrg && (
        <ConfirmationModal
          isOpen={Boolean(statusModalOrg)}
          onClose={() => setStatusModalOrg(null)}
          onConfirm={handleStatusToggle}
          title={`${
            statusModalOrg.status === 'ACTIVE' ? 'Suspend / Deactivate' : 'Activate'
          } Workspace`}
          message={`Are you sure you want to change the operating status of ${statusModalOrg.name} to ${
            statusModalOrg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmText={statusModalOrg.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          tone={statusModalOrg.status === 'ACTIVE' ? 'warning' : 'primary'}
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
