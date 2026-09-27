import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Construction } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ROUTES } from '@/constants/routes'

export function PlaceholderModulePage({
  title = 'Module Overview',
  description = 'Corporate operations module for NexOps workspace.',
  category = 'Division 02 Module',
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          { label: 'Workspace', href: ROUTES.DASHBOARD },
          { label: title },
        ]}
        actions={
          <Link to={ROUTES.NOTIFICATION_PREFERENCES}>
            <Button variant="secondary" size="sm">
              Notification Preferences
            </Button>
          </Link>
        }
      />

      <Card className="border border-slate-200/80 bg-white">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-[#635BFF]/10 border border-[#635BFF]/20 flex items-center justify-center text-[#635BFF] mb-4 shadow-xs">
            <Construction className="w-7 h-7" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge variant="primary" dot size="md">
              {category}
            </Badge>
            <Badge variant="neutral" size="md">
              Enterprise Configuration Active
            </Badge>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-2">
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Enterprise security policies, organization profiles, and account controls are active.
            To manage alerts and events, visit your notification preferences.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={ROUTES.NOTIFICATION_PREFERENCES}>
              <Button variant="primary" size="md" rightIcon={ArrowRight}>
                Manage Notification Preferences
              </Button>
            </Link>
            <Link to={ROUTES.DASHBOARD}>
              <Button variant="secondary" size="md">
                Return to Command Center
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
