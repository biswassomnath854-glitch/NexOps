import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  Layers,
  FileText,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  UserX,
  ArrowUpRight,
  RefreshCw,
  AlertOctagon,
  Users,
} from 'lucide-react'
import { projectHealthApi } from '@/api/endpoints/projectHealth'
import { projectsApi } from '@/api/endpoints/projects'
import { tasksApi } from '@/api/endpoints/tasks'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants/roles'
import { formatDate } from '@/utils/formatters'

export function ProjectHealthPage() {
  const { projectId: routeProjectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [projectsList, setProjectsList] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || '')
  const [healthData, setHealthData] = useState(null)
  const [allProjectsSummary, setAllProjectsSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assigningTaskId, setAssigningTaskId] = useState(null)

  const isManagement = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD].includes(
    user?.role
  )

  // 1. Fetch available projects for dropdown
  useEffect(() => {
    let isMounted = true
    async function loadProjects() {
      try {
        const res = await projectsApi.getAccessibleProjects()
        const items = res?.data?.projects || res?.projects || []
        if (isMounted) {
          setProjectsList(items)
          if (!selectedProjectId && items.length > 0) {
            setSelectedProjectId(String(items[0].id))
          }
        }
      } catch (err) {
        console.error('Failed to load projects for health page:', err)
      }
    }
    loadProjects()
    return () => {
      isMounted = false
    }
  }, [selectedProjectId])

  // 2. Fetch Health Data for selected project or portfolio
  const fetchHealth = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (selectedProjectId) {
        const res = await projectHealthApi.getProjectHealth(selectedProjectId)
        setHealthData(res?.data || res)
      } else {
        const res = await projectHealthApi.getAllProjectsHealth()
        setAllProjectsSummary(res?.data || res)
      }
    } catch (err) {
      console.error('Project Health fetch error:', err)
      setError(err?.response?.data?.message || err?.message || 'Unable to load project health data.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const handleQuickAssign = async (taskId) => {
    if (!user?.id || !isManagement) return
    try {
      setAssigningTaskId(taskId)
      await tasksApi.updateTask(taskId, { assignedTo: user.id })
      await fetchHealth()
    } catch (err) {
      console.error('Failed to quick-assign task:', err)
    } finally {
      setAssigningTaskId(null)
    }
  }

  const getTrajectoryBadge = (trajectory) => {
    switch (trajectory) {
      case 'ON_TRACK':
        return <Badge variant="success" size="sm">On Track</Badge>
      case 'AT_RISK':
        return <Badge variant="warning" size="sm">At Risk</Badge>
      case 'CRITICAL':
        return <Badge variant="danger" size="sm">Critical Attention</Badge>
      default:
        return <Badge variant="neutral" size="sm">Healthy</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Project Health & Operational Intelligence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                SB Pvt. Ltd. • Real-time project trajectory, workstream performance, and blocker management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {projectsList.length > 0 && (
            <div className="w-64">
              <Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs font-medium"
              >
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code || 'PRJ'})
                  </option>
                ))}
              </Select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={isLoading}
            leftIcon={RefreshCw}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Health Data Error">
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : !healthData && !allProjectsSummary ? (
        <Card className="text-center p-12">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900">No Project Health Data</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Project health data will appear as work progresses and workstreams are assigned.
          </p>
        </Card>
      ) : healthData ? (
        <>
          {/* Top KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Overall Progress */}
            <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Overall Progress</span>
                {getTrajectoryBadge(healthData.trajectory)}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{healthData.progress}%</span>
                <span className="text-xs text-slate-400">completion</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${healthData.progress}%` }}
                />
              </div>
            </Card>

            {/* 2. Tasks Progress */}
            <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Task Velocity</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{healthData.tasks?.completed || 0}</span>
                <span className="text-xs text-slate-400">of {healthData.tasks?.total || 0} resolved</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {healthData.tasks?.inProgress || 0} active in sprint pipeline
              </p>
            </Card>

            {/* 3. Blocked Work */}
            <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Blocked Items</span>
                <AlertOctagon className={`w-4 h-4 ${(healthData.tasks?.blocked || 0) > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${(healthData.tasks?.blocked || 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {healthData.tasks?.blocked || 0}
                </span>
                <span className="text-xs text-slate-400">tasks halted</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {(healthData.tasks?.blocked || 0) > 0 ? 'Requires lead escalation' : 'No blockers reported'}
              </p>
            </Card>

            {/* 4. Unassigned Tasks */}
            <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Unassigned Tasks</span>
                <UserX className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{healthData.tasks?.unassigned || 0}</span>
                <span className="text-xs text-slate-400">pending owner</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {(healthData.tasks?.unassigned || 0) > 0 ? 'Awaiting squad allocation' : 'All tasks allocated'}
              </p>
            </Card>

            {/* 5. Workstreams & Deliverables */}
            <Card className="p-4 bg-white border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Workstreams</span>
                <Layers className="w-4 h-4 text-sky-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{healthData.workstreams?.length || 0}</span>
                <span className="text-xs text-slate-400">functional areas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {healthData.recentDeliverables?.length || 0} deliverables logged
              </p>
            </Card>
          </div>

          {/* Workstream Summary Table */}
          <Card className="border-slate-200/90 shadow-2xs">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Workstreams & Squad Performance
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Functional breakdown of active workstreams, assigned leads, and delivery velocity
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => navigate(ROUTES.PROJECT_DETAILS(selectedProjectId))}
                rightIcon={ChevronRight}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Open Project Workspace
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {(!healthData.workstreams || healthData.workstreams.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No workstreams defined yet for this project.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Workstream</th>
                        <th className="py-2.5 px-4">Lead</th>
                        <th className="py-2.5 px-4">Members</th>
                        <th className="py-2.5 px-4">Tasks</th>
                        <th className="py-2.5 px-4">Blocked</th>
                        <th className="py-2.5 px-4">Progress</th>
                        <th className="py-2.5 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {healthData.workstreams.map((ws) => (
                        <tr key={ws.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            <div>{ws.name}</div>
                            {ws.code && (
                              <span className="text-[10px] text-slate-400 font-mono">{ws.code}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {ws.lead ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                                  {ws.lead.firstName?.[0] || 'U'}
                                </span>
                                {ws.lead.firstName} {ws.lead.lastName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {ws.membersCount || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">
                            {ws.metrics?.completed || 0} / {ws.metrics?.total || 0}
                          </td>
                          <td className="py-3 px-4">
                            {(ws.metrics?.blocked || 0) > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                {ws.metrics.blocked} blocked
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 w-48">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-1.5 rounded-full"
                                  style={{ width: `${ws.metrics?.completionPercentage || 0}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-slate-700 w-8 text-right">
                                {ws.metrics?.completionPercentage || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge
                              variant={ws.status === 'COMPLETED' ? 'success' : ws.status === 'ARCHIVED' ? 'neutral' : 'primary'}
                              size="sm"
                            >
                              {ws.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked Work & Unassigned Work (Side-by-Side) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blocked Tasks */}
            <Card className="border-slate-200/90 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Blocked Workstreams & Tasks
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tasks marked as blocked requiring dependency resolution
                  </p>
                </div>
                <Badge variant={healthData.blockedTasks?.length > 0 ? 'danger' : 'neutral'} size="sm">
                  {healthData.blockedTasks?.length || 0} Blocked
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {(!healthData.blockedTasks || healthData.blockedTasks.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No blocked work reported. All sprints are running smoothly.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {healthData.blockedTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => navigate(ROUTES.TASK_DETAILS(t.id))}
                        className="p-3 px-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate hover:text-indigo-600">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span>{t.workstream?.name || 'General Project'}</span>
                            <span>•</span>
                            <span>
                              {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={t.priority === 'URGENT' ? 'danger' : 'warning'} size="sm">
                            {t.priority}
                          </Badge>
                          <ArrowUpRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unassigned Work */}
            <Card className="border-slate-200/90 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserX className="w-4 h-4 text-amber-600" />
                    Unassigned Tasks
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tasks requiring assignee and team scoping
                  </p>
                </div>
                <Badge variant={healthData.unassignedTasks?.length > 0 ? 'warning' : 'neutral'} size="sm">
                  {healthData.unassignedTasks?.length || 0} Pending
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {(!healthData.unassignedTasks || healthData.unassignedTasks.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No unassigned work. All tasks have active owners.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {healthData.unassignedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 px-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => navigate(ROUTES.TASK_DETAILS(t.id))}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <p className="text-xs font-semibold text-slate-900 truncate hover:text-indigo-600">
                            {t.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span>Status: {t.status}</span>
                            <span>•</span>
                            <span>Priority: {t.priority}</span>
                          </div>
                        </div>
                        {isManagement && (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={assigningTaskId === t.id}
                            onClick={() => handleQuickAssign(t.id)}
                            className="text-xs shrink-0"
                          >
                            {assigningTaskId === t.id ? 'Claiming...' : 'Claim Task'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Deliverables & Work Submissions Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Deliverables / Documents */}
            <Card className="border-slate-200/90 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Recent Project Deliverables & Specs
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest requirements, architecture specifications, and project assets
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {(!healthData.recentDeliverables || healthData.recentDeliverables.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No project documents or deliverables uploaded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {healthData.recentDeliverables.map((doc) => (
                      <div key={doc.id} className="p-3 px-4 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {doc.originalName} • {doc.category} • Uploaded by {doc.uploader?.firstName} {doc.uploader?.lastName}
                          </p>
                        </div>
                        <Badge variant="neutral" size="sm">
                          {formatDate(doc.createdAt)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card className="border-slate-200/90 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  Recent Work Submissions
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Employee deliverables submitted for lead review and sign-off
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {(!healthData.recentSubmissions || healthData.recentSubmissions.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No task submissions received yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {healthData.recentSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => navigate(ROUTES.TASK_DETAILS(sub.taskId))}
                        className="p-3 px-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate hover:text-indigo-600">
                            {sub.task?.title || `Task #${sub.taskId}`}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            By {sub.submitter?.firstName} {sub.submitter?.lastName} • {sub.note || 'No notes'}
                          </p>
                        </div>
                        <Badge
                          variant={sub.status === 'APPROVED' ? 'success' : sub.status === 'REVISION_REQUIRED' ? 'warning' : 'primary'}
                          size="sm"
                        >
                          {sub.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
