import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function ErrorState({
  icon: Icon = AlertTriangle,
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading this content.',
  onRetry,
  retryLabel = 'Try Again',
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-rose-200/60 bg-rose-50/30',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-xs mb-4">
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold text-slate-900 mb-1">{title}</h4>
      <p className="text-sm text-slate-600 max-w-md mb-6">{message}</p>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
