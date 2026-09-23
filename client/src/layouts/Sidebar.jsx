import { useState, useEffect } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  LogOut,
} from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { ROLES } from '@/constants/roles'
import { formatRole } from '@/utils/formatters'
import { storage } from '@/utils/storage'
import { cn } from '@/utils/cn'

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'

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

export function Sidebar({ className }) {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    Boolean(storage.get(SIDEBAR_COLLAPSED_KEY, false))
  )
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    storage.set(SIDEBAR_COLLAPSED_KEY, isCollapsed)
  }, [isCollapsed])

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const userRole = user?.role || ROLES.MEMBER

  return (
    <aside
      className={cn(
        'h-screen bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-200 z-30 select-none',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Brand Header & Toggle */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <NavLink
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-2 overflow-hidden"
          title="NexOps Enterprise"
        >
          <Logo size="md" showText={!isCollapsed} className="text-white" />
        </NavLink>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Organization Badge (Expanded only) */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="w-7 h-7 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {user?.organization?.name || 'Acme Global Corp'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">Enterprise Operations</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Main navigation">
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
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
              )}

              {visibleItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70',
                        isCollapsed && 'justify-center px-0'
                      )
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                    {!isCollapsed && item.badge && (
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
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60',
            isCollapsed && 'justify-center p-1.5'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {user?.firstName ? user.firstName.charAt(0) : 'U'}
          </div>

          {!isCollapsed && (
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
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
