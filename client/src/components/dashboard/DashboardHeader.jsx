import { RefreshCw, Plus, FolderPlus, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/formatters'

export function DashboardHeader({
  scope = 'ORGANIZATION',
  onRefresh,
  isRefreshing = false,
  onNewTask,
  onNewProject,
}) {
  const { user } = useAuth()

  const todayStr = formatDate(new Date().toISOString(), {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isOrgScope = scope === 'ORGANIZATION'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.firstName || 'Colleague'}
          </h1>
          <Badge
            variant={isOrgScope ? 'primary' : 'neutral'}
            dot
            size="md"
            className="capitalize text-xs font-semibold"
          >
            {isOrgScope ? (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Organization Scope
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Personal Scope
              </span>
            )}
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-slate-500">
          {todayStr} •{' '}
          <span className="font-medium text-slate-700">
            {user?.organization?.name || 'Enterprise Workspace'}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          isLoading={isRefreshing}
          leftIcon={RefreshCw}
          className="text-xs"
        >
          Refresh
        </Button>

        {onNewProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewProject}
            leftIcon={FolderPlus}
            className="text-xs"
          >
            New Project
          </Button>
        )}

        {onNewTask && (
          <Button
            variant="primary"
            size="sm"
            onClick={onNewTask}
            leftIcon={Plus}
            className="text-xs shadow-2xs"
          >
            New Task
          </Button>
        )}
      </div>
    </div>
  )
}
