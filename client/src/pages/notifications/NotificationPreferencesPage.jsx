import { Bell, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

/**
 * NotificationPreferencesPage — the preferences page at /notifications/preferences.
 *
 * Wraps the NotificationPreferences component in the app's standard page layout.
 */
export function NotificationPreferencesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Notification Preferences"
        description="Control which events trigger notifications for your account."
        breadcrumbs={[
          { label: 'Home', href: ROUTES.DASHBOARD },
          { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
          { label: 'Preferences' },
        ]}
        actions={
          <Link to={ROUTES.NOTIFICATIONS}>
            <Button variant="ghost" size="sm" leftIcon={ArrowLeft} className="text-slate-500 text-xs">
              Back to Notifications
            </Button>
          </Link>
        }
      />

      <NotificationPreferences />
    </div>
  )
}
