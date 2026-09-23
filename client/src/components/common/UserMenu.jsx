import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LogOut,
  Settings,
  Bell,
  Sparkles,
  ChevronDown,
  Building,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { formatRole } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    setIsOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  const initials = user?.firstName
    ? `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}`
    : 'U'

  const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Corporate User'

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        className={cn(
          'flex items-center gap-2.5 p-1 rounded-full sm:rounded-lg transition-all',
          'hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30',
          isOpen && 'bg-slate-100 ring-2 ring-indigo-500/20'
        )}
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
            {fullName}
          </p>
          <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">
            {formatRole(user?.role || 'MEMBER')}
          </p>
        </div>

        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 transition-transform duration-150 hidden sm:block',
            isOpen && 'rotate-180 text-slate-700'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-200/80 py-2 z-50',
            'transform transition-all duration-150 animate-in fade-in zoom-in-95'
          )}
        >
          {/* Header Profile Summary */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {fullName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || 'user@nexops.internal'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="primary" dot size="sm">
                {formatRole(user?.role || 'MEMBER')}
              </Badge>
              <Badge variant="success" size="sm">
                {user?.status || 'ACTIVE'}
              </Badge>
            </div>

            {user?.organization?.name && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{user.organization.name}</span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="px-2 py-1.5">
            <Link
              to={ROUTES.NOTIFICATIONS}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Notifications & Alerts</span>
            </Link>

            <Link
              to={ROUTES.SETTINGS}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Workspace Settings</span>
            </Link>

            <Link
              to={ROUTES.SHOWCASE}
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Component Showcase</span>
            </Link>
          </div>

          {/* Sign Out Action */}
          <div className="px-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSignOut}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
