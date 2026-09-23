import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  className,
}) {
  return (
    <div className={cn('mb-8 space-y-3', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center text-xs font-medium text-slate-500 space-x-1.5" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1
            return (
              <div key={crumb.label || idx} className="flex items-center space-x-1.5">
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                {crumb.href && !isLast ? (
                  <Link
                    to={crumb.href}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast ? 'text-slate-800 font-semibold' : '')}>
                    {crumb.label}
                  </span>
                )}
              </div>
            )
          })}
        </nav>
      )}

      {/* Main Title and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
