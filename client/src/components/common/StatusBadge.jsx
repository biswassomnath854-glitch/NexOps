import { Badge } from '@/components/ui/Badge'

const STATUS_CONFIGS = {
  ACTIVE: {
    label: 'Active',
    variant: 'success',
    dot: true,
  },
  INACTIVE: {
    label: 'Inactive',
    variant: 'neutral',
    dot: true,
  },
  SUSPENDED: {
    label: 'Suspended',
    variant: 'danger',
    dot: true,
  },
}

export function StatusBadge({ status, size = 'sm', className = '' }) {
  const normalizedStatus = (status || 'INACTIVE').toUpperCase()
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
      className={`font-medium ${className}`}
    >
      {config.label}
    </Badge>
  )
}
