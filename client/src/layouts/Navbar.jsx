import { Menu, Search } from 'lucide-react'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { NotificationDropdown } from '@/components/common/NotificationDropdown'
import { UserMenu } from '@/components/common/UserMenu'

export function Navbar({ onOpenMobileSidebar, onOpenSearch }) {
  return (
    <header className="h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-xs sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left side: Hamburger button + Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 mr-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:block min-w-0 flex-1">
          <Breadcrumbs />
        </div>
      </div>

      {/* Center / Search Trigger Button */}
      <div className="flex items-center justify-center flex-1 max-w-sm hidden md:flex">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-400 hover:text-slate-600 transition-all text-xs shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span className="text-slate-500">Quick search tasks, projects...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side: Mobile search trigger + Status + Notifications + User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-4">
        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open global search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* System Health / Status Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          API Connected
        </div>

        {/* Notification Popover Dropdown */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* User Profile Menu */}
        <UserMenu />
      </div>
    </header>
  )
}
