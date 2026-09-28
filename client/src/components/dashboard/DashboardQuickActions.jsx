import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import {
  CheckSquare,
  FolderKanban,
  AlertOctagon,
  Users2,
  ArrowRight,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const actions = [
  {
    title: 'Task Pipelines',
    desc: 'Sprint backlogs, owner assignments, and status boards.',
    href: ROUTES.TASKS,
    icon: CheckSquare,
    color: 'text-[#635BFF] bg-[#635BFF]/10 border border-[#635BFF]/15',
  },
  {
    title: 'Project Hubs',
    desc: 'Milestones, deliverable schedules, and squad rosters.',
    href: ROUTES.PROJECTS,
    icon: FolderKanban,
    color: 'text-sky-600 bg-sky-50 border border-sky-100',
  },
  {
    title: 'Overdue Escalations',
    desc: 'Monitor SLA breaches and automated alert notifications.',
    href: ROUTES.OVERDUE_TASKS,
    icon: AlertOctagon,
    color: 'text-rose-600 bg-rose-50 border border-rose-100',
  },
  {
    title: 'Workload & Analytics',
    desc: 'Team capacity distribution, allocations, and velocity.',
    href: ROUTES.WORKLOAD,
    icon: Users2,
    color: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
  },
]

export function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {actions.map((act) => {
        const Icon = act.icon
        return (
          <Link key={act.title} to={act.href} className="group block">
            <Card className="h-full border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all shadow-2xs">
              <CardContent className="p-3.5 flex flex-col justify-between h-full space-y-3">
                <div className="space-y-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 shadow-2xs ${act.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {act.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100/90 flex items-center justify-between text-[11px] font-semibold text-[#635BFF]">
                  <span>Open workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
