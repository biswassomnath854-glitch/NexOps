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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const isOrgScope = scope === 'ORGANIZATION'

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.firstName || 'Colleague'}
          </h1>
          <Badge
            variant={isOrgScope ? 'primary' : 'neutral'}
            dot
            size="md"
            className="capitalize"
          >
            {isOrgScope ? (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Organization Scope
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
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

      <div className="flex items-center gap-2.5 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          isLoading={isRefreshing}
          leftIcon={RefreshCw}
        >
          Refresh
        </Button>

        {onNewProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewProject}
            leftIcon={FolderPlus}
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
          >
            New Task
          </Button>
        )}
      </div>
    </div>
  )
}
