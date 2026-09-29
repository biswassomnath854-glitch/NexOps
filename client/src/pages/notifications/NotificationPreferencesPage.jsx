import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

/**
 * NotificationPreferencesPage — Settings page at /notifications/preferences.
 */
export function NotificationPreferencesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Notification Preferences"
        description="Configure which workspace events trigger automated notifications for your account."
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
          { label: 'Preferences' },
        ]}
        actions={
          <Link to={ROUTES.NOTIFICATIONS}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={ArrowLeft}
              className="text-xs"
            >
              Back to Notifications
            </Button>
          </Link>
        }
      />

      <NotificationPreferences />
    </div>
  )
}
