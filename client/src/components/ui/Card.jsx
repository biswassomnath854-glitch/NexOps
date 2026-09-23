import { cn } from '@/utils/cn'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow duration-150',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, action, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-slate-100',
        className
      )}
      {...props}
    >
      <div className="space-y-0.5">{children}</div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  )
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-xs text-slate-500', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-6 text-sm text-slate-600', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-b-xl border-t border-slate-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
