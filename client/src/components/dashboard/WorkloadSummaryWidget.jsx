import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Users2, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export function WorkloadSummaryWidget({ overview, workloadData }) {
  const totalUsers = overview?.users?.total ?? 0
  const activeUsers = overview?.users?.active ?? 0
  const totalTasks = overview?.tasks?.total ?? 0

  const items = workloadData?.workload || workloadData || []

  return (
    <Card>
      <CardHeader
        action={
          <Link to={ROUTES.WORKLOAD}>
            <Button variant="ghost" size="xs" rightIcon={ArrowRight}>
              Full Workload Map
            </Button>
          </Link>
        }
      >
        <CardTitle className="flex items-center gap-2">
          <Users2 className="w-4 h-4 text-indigo-600" />
          Team Workload Capacity
        </CardTitle>
        <CardDescription>
          Operational headcount distribution across {totalProjectsDesc(overview)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Team</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{totalUsers}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Members</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{activeUsers}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Tasks</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">{totalTasks}</p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Member Allocation
            </p>
            {items.slice(0, 4).map((member, idx) => (
              <div
                key={member.id || idx}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                    {member.name ? member.name.charAt(0) : 'M'}
                  </div>
                  <span className="font-medium text-slate-700">{member.name || `Member ${idx + 1}`}</span>
                </div>
                <Badge variant="primary" size="sm">
                  {member.taskCount || 0} tasks
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-2">
            Workload distribution is balanced across all registered department personnel.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function totalProjectsDesc(overview) {
  const count = overview?.projects?.total || 0
  return `${count} active projects`
}
