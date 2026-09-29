import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

/**
 * Section wrapper for operational insights modules.
 */
export function InsightSection({
  icon: Icon,
  iconColor = '#635BFF',
  title,
  description,
  badge,
  action,
  children,
  className,
  contentClassName,
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        action={
          (badge || action) && (
            <div className="flex items-center gap-2">
              {badge}
              {action}
            </div>
          )
        }
      >
        <CardTitle className="flex items-center gap-2.5">
          {Icon && (
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${iconColor}14` }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </span>
          )}
          <span className="text-slate-900 font-semibold">{title}</span>
        </CardTitle>
        {description && (
          <CardDescription className="text-slate-500 text-xs">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn('p-5 sm:p-6', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
