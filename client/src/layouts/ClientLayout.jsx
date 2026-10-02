import { Suspense } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { LogOut, FolderKanban, ShieldCheck } from 'lucide-react'
import { SBLogo } from '@/components/common/SBLogo'
import { RouteLoadingFallback } from '@/components/common/RouteLoadingFallback'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

export function ClientLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Skip-to-content accessible link */}
      <a
        href="#client-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Client Header */}
      <header className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand + Client Portal Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to={ROUTES.CLIENT_PROJECTS}
            className="flex items-center gap-2"
            title="SB Pvt. Ltd. Client Portal"
          >
            <SBLogo size={28} />
          </Link>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <Badge
            variant="outline"
            className="bg-indigo-50/80 text-indigo-700 border-indigo-200 text-xs font-semibold px-2.5 py-0.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Client Portal
          </Badge>
        </div>

        {/* Center / Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Client Portal Navigation">
          <Link
            to={ROUTES.CLIENT_PROJECTS}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-indigo-600" />
            Approved Projects
          </Link>
        </nav>

        {/* Right: Client User Info & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              {user?.email}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
            title="Log out of Client Portal"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="client-main-content"
        className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8"
      >
        <Suspense fallback={<RouteLoadingFallback fullPage message="Loading client portal..." />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Client Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} SB Pvt. Ltd. Client Portal. All rights reserved.</p>
      </footer>
    </div>
  )
}
