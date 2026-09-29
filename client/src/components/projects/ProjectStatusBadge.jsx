import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

const STATUS_CONFIGS = {
  PLANNING: {
    label: 'Planning',
    variant: 'info',
    dot: true,
  },
  ACTIVE: {
    label: 'Active',
    variant: 'success',
    dot: true,
  },
  ON_HOLD: {
    label: 'On Hold',
    variant: 'warning',
    dot: true,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'primary',
    dot: true,
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'neutral',
    dot: false,
  },
}

export function ProjectStatusBadge({ status, size = 'sm', className = '' }) {
  const normalizedStatus = (status || 'PLANNING').toUpperCase()
  const config = STATUS_CONFIGS[normalizedStatus] || {
    label: status || 'Unknown',
    variant: 'neutral',
    dot: false,
  }

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={config.dot}
      className={cn('font-semibold shadow-2xs select-none tracking-tight', className)}
    >
      {config.label}
    </Badge>
  )
}
