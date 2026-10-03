import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  User,
  X,
} from 'lucide-react'
import { projectsApi } from '@/api/endpoints/projects'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/formatters'

const ACTION_CONFIG = {
  CLIENT_PROJECT_VIEWED: {
    label: 'Project Viewed',
    icon: Eye,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  CLIENT_DOCUMENT_VIEWED: {
    label: 'Document Viewed',
    icon: FileText,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  CLIENT_DOCUMENT_DOWNLOADED: {
    label: 'Document Downloaded',
    icon: Download,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  CLIENT_DELIVERABLE_VIEWED: {
    label: 'Deliverable Viewed',
    icon: Eye,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  CLIENT_DELIVERABLE_ACCEPTED: {
    label: 'Deliverable Accepted',
    icon: CheckCircle2,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CLIENT_REVISION_REQUESTED: {
    label: 'Revision Requested',
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
}

export function ClientAuditViewer({ projectId, projectName = null }) {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [selectedAction, setSelectedAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const params = {
        page,
        limit: 10,
      }
      if (selectedAction) params.action = selectedAction
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const res = await projectsApi.getClientAuditLogs(projectId, params)
      const data = res.data?.data || res.data || {}
      setLogs(data.items || [])
      setPagination(
        data.pagination || {
          page,
          limit: 10,
          total: (data.items || []).length,
          totalPages: Math.ceil(((data.items || []).length || 1) / 10),
        }
      )
    } catch (err) {
      console.error('Failed to load client audit logs:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to retrieve client audit records.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId, page, selectedAction, startDate, endDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleActionChange = (e) => {
    setSelectedAction(e.target.value)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSelectedAction('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasActiveFilters = Boolean(selectedAction || startDate || endDate)

  const renderSafeMetadata = (metadata) => {
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return null
    }

    // Filter out unsafe/internal properties (tokens, passwords, secrets, full headers)
    const unsafeKeys = ['token', 'password', 'secret', 'auth', 'cookie', 'authorization']
    const safeEntries = Object.entries(metadata).filter(
      ([key]) => !unsafeKeys.some((u) => key.toLowerCase().includes(u))
    )

    if (safeEntries.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
        {safeEntries.map(([key, val]) => {
          const displayVal =
            typeof val === 'object' ? JSON.stringify(val) : String(val)
          return (
            <span
              key={key}
              className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
            >
              <strong className="font-semibold text-slate-700 mr-1">{key}:</strong>
              <span className="truncate max-w-[150px]" title={displayVal}>
                {displayVal}
              </span>
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="border border-slate-200 shadow-xs overflow-hidden">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Client Portal Activity Audit Log
              <Badge variant="outline" className="text-[10px] font-mono text-slate-600 font-normal">
                {pagination.total} records
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500">
              Immutable internal audit trail of client stakeholder interactions for {projectName || 'this project'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={fetchLogs}
            disabled={isLoading}
            className="text-xs text-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      {/* Filter Toolbar */}
      <div className="bg-white border-b border-slate-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Action Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              Filter by Action:
            </label>
            <select
              value={selectedAction}
              onChange={handleActionChange}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="">All Client Actions</option>
              {Object.entries(ACTION_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter: Start */}
          <div className="sm:w-40">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              From Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-none bg-white text-slate-800"
            />
          </div>

          {/* Date Filter: End */}
          <div className="sm:w-40">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              To Date:
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-none bg-white text-slate-800"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div className="sm:self-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:bg-rose-50 h-8 px-2.5"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-0">
        {isLoading && logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Loading audit records...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50/50">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-1">
            <Clock className="w-6 h-6 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No Client Audit Events Found</p>
            <p className="text-[11px] text-slate-400">
              {hasActiveFilters
                ? 'No activity matches your active filter criteria. Try resetting filters.'
                : 'As client stakeholders view projects, download deliverables, or submit reviews, activity will be recorded here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Client Stakeholder</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Target Context</th>
                  <th className="py-2.5 px-4">Details &amp; Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    icon: Shield,
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                  }
                  const ActionIcon = actionCfg.icon

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                        <span className="font-medium text-slate-800">
                          {formatDate(log.createdAt)}
                        </span>
                        {log.createdAt && (
                          <span className="block text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        )}
                      </td>

                      {/* Client Stakeholder */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          {log.clientUser?.name || 'Client Stakeholder'}
                        </p>
                        <p className="text-[11px] text-slate-500 pl-4.5">
                          {log.clientUser?.email || 'External Account'}
                        </p>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${actionCfg.color} text-[10px] font-semibold flex items-center gap-1 w-fit`}
                        >
                          <ActionIcon className="w-3 h-3 shrink-0" />
                          {actionCfg.label}
                        </Badge>
                      </td>

                      {/* Target Context */}
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {log.documentId ? (
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-700">
                            <FileText className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate max-w-[120px]" title={log.documentId}>
                              doc:{log.documentId.slice(0, 8)}...
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Project Workspace</span>
                        )}
                      </td>

                      {/* Details & Safe Metadata */}
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {renderSafeMetadata(log.metadata) || (
                          <span className="text-slate-400 italic">Standard event</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="bg-slate-50/70 border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing{' '}
              <strong className="text-slate-700">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{' '}
              of <strong className="text-slate-700">{pagination.total}</strong> records
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>

              <span className="text-slate-600 font-semibold px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className="text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
