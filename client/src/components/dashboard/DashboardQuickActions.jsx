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
    title: 'Task Management',
    desc: 'Organize backlog, assign teammates, and update sprint pipelines.',
    href: ROUTES.TASKS,
    icon: CheckSquare,
    color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
  },
  {
    title: 'Project Hubs',
    desc: 'Review milestones, resource rosters, and delivery dates.',
    href: ROUTES.PROJECTS,
    icon: FolderKanban,
    color: 'text-sky-600 bg-sky-50 hover:bg-sky-100',
  },
  {
    title: 'Overdue Escalations',
    desc: 'Monitor SLA breaches and automated task alerts.',
    href: ROUTES.OVERDUE_TASKS,
    icon: AlertOctagon,
    color: 'text-rose-600 bg-rose-50 hover:bg-rose-100',
  },
  {
    title: 'Workload & Analytics',
    desc: 'Analyze team capacity distribution and velocity charts.',
    href: ROUTES.WORKLOAD,
    icon: Users2,
    color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100',
  },
]

export function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon
        return (
          <Link key={act.title} to={act.href} className="group block">
            <Card className="h-full border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${act.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {act.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                  <span>Open workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
