import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/utils/cn'

const variants = {
  info: {
    bg: 'bg-sky-50 border-sky-200 text-sky-800',
    icon: Info,
    iconColor: 'text-sky-500',
  },
  success: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  danger: {
    bg: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: AlertCircle,
    iconColor: 'text-rose-500',
  },
}

export function Alert({ variant = 'info', title, children, className }) {
  const config = variants[variant] || variants.info
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150',
        config.bg,
        className
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-0.5 leading-snug">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
