import { useState, useEffect, useCallback } from 'react'
import { tasksApi } from '@/api/endpoints/tasks'
import { ActivityItem } from './ActivityItem'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { History, RefreshCw, Filter } from 'lucide-react'

const ACTION_OPTIONS = [
  { value: '', label: 'All Activities' },
  { value: 'TASK_CREATED', label: 'Task Created' },
  { value: 'TASK_STATUS_CHANGED', label: 'Status Changes' },
  { value: 'TASK_ASSIGNED', label: 'Assignments' },
  { value: 'TASK_PRIORITY_CHANGED', label: 'Priority Changes' },
  { value: 'TASK_DUE_DATE_CHANGED', label: 'Due Date Changes' },
  { value: 'COMMENT_CREATED', label: 'Comments' },
]

export function ActivityTimeline({ taskId }) {
  const [activities, setActivities] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 })
  const [actionFilter, setActionFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadActivities = useCallback(
    async (page = 1, action = actionFilter) => {
      if (!taskId) return
      setIsLoading(true)
      setError(null)
      try {
        const params = { page, limit: 10 }
        if (action) params.action = action

        const res = await tasksApi.getActivities(taskId, params)
        const data = res?.data || res
        setActivities(data?.activities || [])
        if (data?.pagination) {
          setPagination(data.pagination)
        }
      } catch (err) {
        console.error('Failed to load activities:', err)
        setError(err?.message || 'Failed to load activities.')
      } finally {
        setIsLoading(false)
      }
    },
    [taskId, actionFilter]
  )

  useEffect(() => {
    loadActivities(1, actionFilter)
  }, [loadActivities, actionFilter])

  const handleActionChange = (e) => {
    const nextAction = e.target.value
    setActionFilter(nextAction)
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-slate-900">Activity History</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {pagination.totalItems}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-48">
            <Select
              value={actionFilter}
              onChange={handleActionChange}
              options={ACTION_OPTIONS}
              className="text-xs py-1.5 h-8"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadActivities(pagination.page, actionFilter)}
            disabled={isLoading}
            className="text-xs text-slate-500 hover:text-slate-800 gap-1 h-8 px-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Timeline List */}
      {isLoading && activities.length === 0 ? (
        <div className="space-y-4 pl-4 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="w-40 h-3 bg-slate-200 rounded" />
                <div className="w-64 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity recorded"
          description={
            actionFilter
              ? 'No activity entries match the selected action filter.'
              : 'No activities have been recorded for this task yet.'
          }
        />
      ) : (
        <div className="relative pl-1 pt-1">
          {activities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === activities.length - 1}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.limit}
            onPageChange={(p) => loadActivities(p, actionFilter)}
          />
        </div>
      )}
    </div>
  )
}
