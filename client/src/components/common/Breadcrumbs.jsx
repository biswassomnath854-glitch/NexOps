import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const ROUTE_LABELS = {
  tasks: 'Tasks',
  overdue: 'Overdue Tasks',
  projects: 'Projects',
  workload: 'Workload',
  analytics: 'Analytics',
  notifications: 'Notifications',
  users: 'Users Management',
  organizations: 'Organization',
  departments: 'Departments',
  settings: 'Settings',
  showcase: 'UI Showcase',
  unauthorized: 'Access Restricted',
}

export function Breadcrumbs({ items, className }) {
  const location = useLocation()

  // Generate breadcrumb items automatically if not explicitly provided
  const breadcrumbList =
    items ||
    (() => {
      const pathSegments = location.pathname.split('/').filter(Boolean)

      if (pathSegments.length === 0) {
        return [{ label: 'Workspace Overview', href: ROUTES.DASHBOARD }]
      }

      const list = [{ label: 'Workspace', href: ROUTES.DASHBOARD }]
      let currentPath = ''

      pathSegments.forEach((segment) => {
        currentPath += `/${segment}`
        const label = ROUTE_LABELS[segment.toLowerCase()] || segment.replace(/-/g, ' ')
        list.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          href: currentPath,
        })
      })

      return list
    })()

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-xs font-medium text-slate-500 overflow-x-auto py-1', className)}
    >
      <ol className="flex items-center space-x-1.5 whitespace-nowrap">
        {breadcrumbList.map((crumb, idx) => {
          const isLast = idx === breadcrumbList.length - 1
          const isFirst = idx === 0

          return (
            <li key={crumb.href || crumb.label || idx} className="flex items-center space-x-1.5">
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              )}

              {isLast ? (
                <span className="font-semibold text-slate-800" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  {isFirst && <Home className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{crumb.label}</span>
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
