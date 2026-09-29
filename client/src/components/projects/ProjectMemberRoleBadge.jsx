import { Badge } from '@/components/ui/Badge'
import { Crown, Shield, User, Eye } from 'lucide-react'
import { cn } from '@/utils/cn'

const ROLE_CONFIGS = {
  PROJECT_MANAGER: {
    label: 'Project Manager',
    variant: 'primary',
    icon: Crown,
  },
  TEAM_LEAD: {
    label: 'Team Lead',
    variant: 'info',
    icon: Shield,
  },
  MEMBER: {
    label: 'Member',
    variant: 'neutral',
    icon: User,
  },
  VIEWER: {
    label: 'Viewer',
    variant: 'neutral',
    icon: Eye,
  },
}

export function ProjectMemberRoleBadge({ role, size = 'sm', showIcon = true, className = '' }) {
  const normalizedRole = (role || 'MEMBER').toUpperCase()
  const config = ROLE_CONFIGS[normalizedRole] || {
    label: role || 'Member',
    variant: 'neutral',
    icon: User,
  }
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn('font-semibold inline-flex items-center gap-1.5 shadow-2xs select-none tracking-tight', className)}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{config.label}</span>
    </Badge>
  )
}
