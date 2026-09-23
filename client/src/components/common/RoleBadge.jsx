import { Badge } from '@/components/ui/Badge'
import { ROLES } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import { ShieldAlert, ShieldCheck, UserCheck, Users, User, Eye } from 'lucide-react'

const ROLE_CONFIGS = {
  [ROLES.SUPER_ADMIN]: {
    variant: 'danger',
    icon: ShieldAlert,
  },
  [ROLES.ADMIN]: {
    variant: 'primary',
    icon: ShieldCheck,
  },
  [ROLES.MANAGER]: {
    variant: 'info',
    icon: UserCheck,
  },
  [ROLES.TEAM_LEAD]: {
    variant: 'warning',
    icon: Users,
  },
  [ROLES.EMPLOYEE]: {
    variant: 'neutral',
    icon: User,
  },
  [ROLES.VIEWER]: {
    variant: 'neutral',
    icon: Eye,
  },
}

export function RoleBadge({ role, size = 'sm', showIcon = false, className = '' }) {
  const config = ROLE_CONFIGS[role] || { variant: 'neutral', icon: User }
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={`font-semibold inline-flex items-center gap-1.5 ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{formatRole(role)}</span>
    </Badge>
  )
}
