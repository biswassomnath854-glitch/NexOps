import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/feedback/Loading'
import { Users2, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export function WorkloadSummaryWidget({
  overview,
  workloadData,
  isLoading = false,
  error = null,
}) {
  const totalUsers = overview?.users?.total ?? 0
  const activeUsers = overview?.users?.active ?? 0
  const totalTasks = overview?.tasks?.total ?? 0

  const items = Array.isArray(workloadData)
    ? workloadData
    : (workloadData?.users || workloadData?.workload || [])

  return (
    <Card className="shadow-2xs">
      <CardHeader
        action={
          <Link to={ROUTES.WORKLOAD}>
            <Button variant="ghost" size="xs" rightIcon={ArrowRight} className="text-xs">
              Workload Map
            </Button>
          </Link>
        }
      >
        <CardTitle className="flex items-center gap-2">
          <Users2 className="w-4 h-4 text-[#635BFF]" />
          Team Workload Capacity
        </CardTitle>
        <CardDescription>
          Operational headcount distribution across {totalProjectsDesc(overview)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            {/* Metric tiles skeleton */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col items-center">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-6 w-8 mt-1.5" />
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/70 flex flex-col items-center">
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-6 w-8 mt-1.5" />
              </div>
              <div className="p-2.5 rounded-xl bg-[#635BFF]/5 border border-[#635BFF]/15 flex flex-col items-center">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-6 w-8 mt-1.5" />
              </div>
            </div>

            {/* Member allocation list skeleton */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Skeleton className="h-3 w-28 mb-2" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <p className="text-xs text-slate-500 text-center py-4">
            {typeof error === 'string' ? error : 'Unable to load workload capacity.'}
          </p>
        ) : (
          <>
            {/* Metric tiles */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Team</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">{totalUsers}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/70">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5 font-mono">{activeUsers}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#635BFF]/5 border border-[#635BFF]/15">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5148E5]">Assigned</p>
                <p className="text-lg font-bold text-[#635BFF] mt-0.5 font-mono">{totalTasks}</p>
              </div>
            </div>

            {/* Member allocation list */}
            {items.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Member Allocation
                </p>
                {items.slice(0, 4).map((member, idx) => {
                  const displayName =
                    member.name ||
                    (member.firstName
                      ? `${member.firstName} ${member.lastName || ''}`.trim()
                      : `Member ${idx + 1}`)
                  const initial = displayName.charAt(0) || 'M'
                  const taskCount =
                    member.taskCount ?? member.activeTasks ?? member.totalTasks ?? 0

                  return (
                    <div
                      key={member.id || member.userId || idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-[#635BFF]/10 border border-[#635BFF]/20 text-[#635BFF] flex items-center justify-center font-bold text-[10px] shrink-0">
                          {initial}
                        </div>
                        <span className="font-medium text-slate-700 truncate">{displayName}</span>
                      </div>
                      <Badge variant="primary" size="sm">
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                Workload distribution is balanced across all registered department personnel.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function totalProjectsDesc(overview) {
  const count = overview?.projects?.total || 0
  return `${count} active projects`
}
