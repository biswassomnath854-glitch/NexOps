import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { formatRole } from '@/utils/formatters'

export function UnauthorizedPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center border-rose-200/60 shadow-lg">
        <CardContent className="p-8 sm:p-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100/80 border border-rose-200 flex items-center justify-center text-rose-600 mb-6 shadow-xs">
            <ShieldX className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
            Access Restricted (403)
          </span>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Unauthorized Access
          </h1>

          <p className="text-sm text-slate-600 max-w-sm mb-6 leading-relaxed">
            Your current account role or status does not have authorization to access this
            organization resource.
          </p>

          {user && (
            <div className="w-full p-4 mb-6 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Signed In As:</span>
                <span className="text-slate-900 font-semibold">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Assigned Role:</span>
                <span className="text-slate-900 font-semibold">
                  {formatRole(user.role)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Account Status:</span>
                <span
                  className={
                    user.status === 'ACTIVE'
                      ? 'text-emerald-600 font-semibold'
                      : 'text-rose-600 font-semibold'
                  }
                >
                  {user.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <Button
              variant="primary"
              fullWidth
              leftIcon={ArrowLeft}
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="secondary"
              fullWidth
              leftIcon={LogOut}
              onClick={handleSignOut}
            >
              Sign In Different User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
