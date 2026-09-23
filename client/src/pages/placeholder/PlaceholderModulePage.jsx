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
          <Link to={ROUTES.SHOWCASE}>
            <Button variant="secondary" size="sm" leftIcon={Sparkles}>
              View Component Showcase
            </Button>
          </Link>
        }
      />

      <Card className="border-dashed border-slate-300 bg-white/70">
        <CardContent className="p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
            <Construction className="w-7 h-7" />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Badge variant="primary" dot size="md">
              {category}
            </Badge>
            <Badge variant="neutral" size="md">
              Frontend Division 01 Foundation Active
            </Badge>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-2">
            {title} Architecture Ready
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            The routing structure, API client endpoints, layout system, and design tokens
            for this module are fully configured. Functional data views and interactions
            will be wired in Division 02.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={ROUTES.SHOWCASE}>
              <Button variant="primary" size="md" rightIcon={ArrowRight}>
                Explore Division 01 Component Showcase
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
