import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  AlertOctagon,
  Users2,
  BarChart3,
  Bell,
  Users,
  Building2,
  Landmark,
  Settings,
  Sparkles,
  LogOut,
  X,
  Shield,
  Briefcase,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import { cn } from '@/utils/cn'

const navigationSections = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard, end: true },
      { name: 'Tasks', to: ROUTES.TASKS, icon: CheckSquare },
      {
        name: 'Overdue Tasks',
        to: ROUTES.OVERDUE_TASKS,
        icon: AlertOctagon,
        badge: 'Alert',
        badgeVariant: 'danger',
      },
      { name: 'Project Hubs', to: ROUTES.PROJECTS, icon: FolderKanban },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      {
        name: 'Team Workload',
        to: ROUTES.WORKLOAD,
        icon: Users2,
        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD],
      },
      {
        name: 'Analytics',
        to: ROUTES.ANALYTICS,
        icon: BarChart3,
        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD],
      },
      { name: 'Notifications', to: ROUTES.NOTIFICATIONS, icon: Bell },
    ],
  },
  {
    title: 'Administration',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    items: [
      {
        name: 'Users Directory',
        to: ROUTES.USERS,
        icon: Users,
        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      },
      {
        name: 'Departments',
        to: ROUTES.DEPARTMENTS,
        icon: Building2,
        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      },
      {
        name: 'Organization',
        to: ROUTES.ORGANIZATIONS,
        icon: Landmark,
        allowedRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      },
    ],
  },
  {
    title: 'Platform',
    items: [
      { name: 'Workspace Settings', to: ROUTES.SETTINGS, icon: Settings },
      {
        name: 'UI Showcase',
        to: ROUTES.SHOWCASE,
        icon: Sparkles,
        badge: 'Div 01',
        badgeVariant: 'primary',
      },
    ],
  },
]

export function MobileNav({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const userRole = user?.role || ROLES.MEMBER

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className="relative w-full max-w-xs bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200"
      >
        {/* Drawer Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <Logo size="md" className="text-white" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Pill */}
        <div className="px-4 py-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-800">
            <div className="w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.organization?.name || 'Acme Global Corp'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">Enterprise Plan</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Mobile navigation">
          {navigationSections.map((section) => {
            if (section.allowedRoles && !section.allowedRoles.includes(userRole)) {
              return null
            }

            const visibleItems = section.items.filter(
              (item) => !item.allowedRoles || item.allowedRoles.includes(userRole)
            )

            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>

                {visibleItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || 'primary'}
                          size="sm"
                          className="text-[10px] py-0 px-1.5"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.firstName ? user.firstName.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Corporate User'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="text-[10px] text-slate-400 truncate">
                  {formatRole(user?.role || ROLES.MEMBER)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
