import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  User,
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  ArrowUpRight,
  Sparkles,
  CheckSquare as TaskIcon,
  AlertCircle,
} from 'lucide-react'
import { searchApi } from '@/api/endpoints/search'
import { useDebounce } from '@/hooks/useDebounce'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

// ── Constants ─────────────────────────────────────────────────────────────────
const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 350
const RESULTS_LIMIT = 8

// Quick-nav items shown when query is empty
const QUICK_ACTIONS = [
  { label: 'Task Management', href: ROUTES.TASKS, icon: CheckSquare, category: 'Operations' },
  { label: 'Project Hubs', href: ROUTES.PROJECTS, icon: FolderKanban, category: 'Operations' },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: AlertCircle, category: 'Operations' },
]

// ── Status / Priority helpers ─────────────────────────────────────────────────
const STATUS_COLORS = {
  TODO: 'bg-slate-200 text-slate-600',
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  BLOCKED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  SUSPENDED: 'bg-rose-100 text-rose-600',
  PLANNING: 'bg-violet-100 text-violet-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
}

const PRIORITY_COLORS = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-rose-600',
}

function StatusPill({ status }) {
  if (!status) return null
  const cls = STATUS_COLORS[status] || 'bg-slate-100 text-slate-500'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

// ── SearchInput ───────────────────────────────────────────────────────────────
/**
 * SearchInput — the text input bar at the top of the search overlay.
 *
 * Props:
 *   value        — string
 *   onChange     — (e) => void
 *   onClear      — () => void
 *   isLoading    — boolean
 *   inputRef     — ref
 *   placeholder  — string
 */
export const SearchInput = forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    isLoading,
    placeholder = 'Search tasks, projects, users…',
  },
  ref
) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/80 bg-white">
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-indigo-500 shrink-0 animate-spin" />
      ) : (
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
      )}

      <input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label="Global search"
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
        ESC
      </kbd>
    </div>
  )
})

// ── SearchResultItem ──────────────────────────────────────────────────────────
/**
 * SearchResultItem — single result row.
 *
 * Props:
 *   icon          — Lucide icon component
 *   iconBg        — Tailwind class string
 *   title         — string
 *   subtitle      — string | null
 *   meta          — React node (badges etc.)
 *   isActive      — boolean (keyboard focus)
 *   onClick       — () => void
 *   resultRef     — ref for scrolling into view
 */
export function SearchResultItem({
  icon: Icon,
  iconBg = 'bg-slate-100 text-slate-500',
  title,
  subtitle,
  meta,
  isActive,
  onClick,
  resultRef,
}) {
  return (
    <button
      ref={resultRef}
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group',
        isActive
          ? 'bg-indigo-50 text-indigo-900'
          : 'text-slate-700 hover:bg-slate-50'
      )}
      role="option"
      aria-selected={isActive}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
          isActive ? 'bg-indigo-100 text-indigo-600' : iconBg
        )}
      >
        <Icon className="w-4 h-4" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate leading-snug">{title}</p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 truncate leading-snug mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Meta (badges) */}
      {meta && <div className="flex items-center gap-1.5 shrink-0">{meta}</div>}

      {/* Navigate arrow */}
      <ArrowUpRight
        className={cn(
          'w-3.5 h-3.5 shrink-0 transition-colors',
          isActive ? 'text-indigo-400' : 'text-slate-300 group-hover:text-slate-400'
        )}
      />
    </button>
  )
}

// ── SearchResultGroup ─────────────────────────────────────────────────────────
/**
 * SearchResultGroup — labeled section with a header and list of items.
 *
 * Props:
 *   label         — string
 *   icon          — Lucide icon
 *   count         — total count from API
 *   children      — SearchResultItem nodes
 *   showMore      — boolean — whether there are more results
 *   onShowMore    — () => void
 */
export function SearchResultGroup({ label, icon: Icon, count, children, showMore, onShowMore }) {
  return (
    <div className="mb-1.5">
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {count > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full font-semibold">
              {count}
            </span>
          )}
        </div>
        {showMore && onShowMore && (
          <button
            type="button"
            onClick={onShowMore}
            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            See all
          </button>
        )}
      </div>
      <div role="listbox" className="space-y-0.5 px-1">
        {children}
      </div>
    </div>
  )
}

// ── SearchResults ─────────────────────────────────────────────────────────────
/**
 * SearchResults — renders categorized users / projects / tasks results.
 *
 * Props:
 *   results          — { users, projects, tasks } from API
 *   query            — string (for no-results display)
 *   activeIndex      — number (keyboard nav)
 *   flatItems        — array (all clickable items, for index mapping)
 *   onSelect         — (item) => void
 *   itemRefs         — array of refs
 */
export function SearchResults({
  results,
  query,
  activeIndex,
  flatItems,
  onSelect,
  itemRefs,
}) {
  const { users, projects, tasks } = results

  const totalCount =
    (users?.pagination?.totalItems || 0) +
    (projects?.pagination?.totalItems || 0) +
    (tasks?.pagination?.totalItems || 0)

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
          <Search className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No results for "{query}"</p>
        <p className="text-xs text-slate-400 mt-1">
          Try a different keyword or check your spelling.
        </p>
      </div>
    )
  }

  // We track a global item index across all groups for keyboard nav
  let itemIndex = 0

  return (
    <div>
      {/* ── Users ────────────────────────────────────────────────────── */}
      {users?.users?.length > 0 && (
        <SearchResultGroup
          label="Users"
          icon={User}
          count={users.pagination.totalItems}
          showMore={users.pagination.totalItems > users.users.length}
        >
          {users.users.map((user) => {
            const idx = itemIndex++
            return (
              <SearchResultItem
                key={user.id}
                resultRef={itemRefs[idx]}
                icon={User}
                iconBg="bg-indigo-50 text-indigo-500"
                title={`${user.firstName} ${user.lastName}`}
                subtitle={user.email}
                meta={<StatusPill status={user.status} />}
                isActive={activeIndex === idx}
                onClick={() => onSelect({ type: 'user', item: user })}
              />
            )
          })}
        </SearchResultGroup>
      )}

      {/* ── Projects ─────────────────────────────────────────────────── */}
      {projects?.projects?.length > 0 && (
        <SearchResultGroup
          label="Projects"
          icon={FolderKanban}
          count={projects.pagination.totalItems}
          showMore={projects.pagination.totalItems > projects.projects.length}
        >
          {projects.projects.map((project) => {
            const idx = itemIndex++
            return (
              <SearchResultItem
                key={project.id}
                resultRef={itemRefs[idx]}
                icon={FolderKanban}
                iconBg="bg-violet-50 text-violet-500"
                title={project.name}
                subtitle={project.code ? `${project.code} · ${project.description || ''}`.trim().replace(/·\s*$/, '') : project.description || ''}
                meta={<StatusPill status={project.status} />}
                isActive={activeIndex === idx}
                onClick={() => onSelect({ type: 'project', item: project })}
              />
            )
          })}
        </SearchResultGroup>
      )}

      {/* ── Tasks ────────────────────────────────────────────────────── */}
      {tasks?.tasks?.length > 0 && (
        <SearchResultGroup
          label="Tasks"
          icon={TaskIcon}
          count={tasks.pagination.totalItems}
          showMore={tasks.pagination.totalItems > tasks.tasks.length}
        >
          {tasks.tasks.map((task) => {
            const idx = itemIndex++
            const priorityColor = PRIORITY_COLORS[task.priority] || ''
            return (
              <SearchResultItem
                key={task.id}
                resultRef={itemRefs[idx]}
                icon={
                  task.status === 'COMPLETED'
                    ? CheckCircle2
                    : task.status === 'BLOCKED'
                    ? AlertTriangle
                    : task.status === 'IN_PROGRESS'
                    ? Clock
                    : TaskIcon
                }
                iconBg={
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-500'
                    : task.status === 'BLOCKED'
                    ? 'bg-rose-50 text-rose-500'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-sky-50 text-sky-500'
                    : 'bg-amber-50 text-amber-500'
                }
                title={task.title}
                subtitle={
                  task.project
                    ? `${task.project.name} · ${task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}`
                    : task.assignee
                    ? `${task.assignee.firstName} ${task.assignee.lastName}`
                    : ''
                }
                meta={
                  <div className="flex items-center gap-1.5">
                    {task.priority && (
                      <span className={`text-[10px] font-bold ${priorityColor}`}>
                        {task.priority}
                      </span>
                    )}
                    <StatusPill status={task.status} />
                  </div>
                }
                isActive={activeIndex === idx}
                onClick={() => onSelect({ type: 'task', item: task })}
              />
            )
          })}
        </SearchResultGroup>
      )}
    </div>
  )
}

// ── GlobalSearchModal ─────────────────────────────────────────────────────────
/**
 * GlobalSearch / GlobalSearchModal — full-featured command palette.
 *
 * Features:
 *   - Debounced search (350ms) with min 2-char query
 *   - Categorized results: Users, Projects, Tasks (from real API)
 *   - Keyboard navigation (↑/↓/Enter/Escape)
 *   - Loading, empty, error states
 *   - Quick-nav shortcuts when query is empty
 *   - Navigates to correct detail page on select
 *   - Respects backend access control (shows only what API returns)
 */
export function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null = not yet searched
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_MS)

  // Build flat item list for keyboard navigation
  const flatItems = results
    ? [
        ...(results.users?.users || []).map((u) => ({ type: 'user', item: u })),
        ...(results.projects?.projects || []).map((p) => ({ type: 'project', item: p })),
        ...(results.tasks?.tasks || []).map((t) => ({ type: 'task', item: t })),
      ]
    : []

  // Build quick-action flat list (only shown when query is empty)
  const quickItems = QUICK_ACTIONS

  // Total keyboard-navigable count
  const navCount = query.trim().length >= MIN_QUERY_LENGTH
    ? flatItems.length
    : quickItems.length

  // Item refs for scrolling into view
  const itemRefs = useRef([])
  useEffect(() => {
    itemRefs.current = Array.from({ length: Math.max(navCount, 20) }, () => ({ current: null }))
  }, [navCount])

  // ── Auto-focus on open ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    } else {
      // Reset state on close
      setQuery('')
      setResults(null)
      setError(null)
      setActiveIndex(-1)
    }
  }, [isOpen])

  // ── Search effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = debouncedQuery
    if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)
    setActiveIndex(-1)

    searchApi
      .globalSearch(trimmed, { limit: RESULTS_LIMIT })
      .then((res) => {
        if (!isMounted) return
        const data = res?.data || {}
        setResults({
          users: data.users || { users: [], pagination: { totalItems: 0 } },
          projects: data.projects || { projects: [], pagination: { totalItems: 0 } },
          tasks: data.tasks || { tasks: [], pagination: { totalItems: 0 } },
        })
      })
      .catch((err) => {
        if (!isMounted) return
        const status = err?.status
        if (status === 401 || status === 403) {
          setError('You must be signed in to search.')
        } else if (status >= 500) {
          setError('Search service is temporarily unavailable.')
        } else {
          setError(err?.message || 'Search failed. Please try again.')
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [debouncedQuery])

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      if (navCount === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev < navCount - 1 ? prev + 1 : 0
          itemRefs.current[next]?.current?.scrollIntoView({ block: 'nearest' })
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => {
          const next = prev > 0 ? prev - 1 : navCount - 1
          itemRefs.current[next]?.current?.scrollIntoView({ block: 'nearest' })
          return next
        })
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        const isSearchMode = query.trim().length >= MIN_QUERY_LENGTH
        if (isSearchMode && flatItems[activeIndex]) {
          handleSelect(flatItems[activeIndex])
        } else if (!isSearchMode && quickItems[activeIndex]) {
          handleQuickAction(quickItems[activeIndex].href)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeIndex, navCount, flatItems, quickItems, query, handleClose])

  // ── Navigate on select ────────────────────────────────────────────────────
  const handleSelect = ({ type, item }) => {
    handleClose()
    if (type === 'user') {
      navigate(ROUTES.USERS)
    } else if (type === 'project') {
      navigate(ROUTES.PROJECT_DETAILS(item.id))
    } else if (type === 'task') {
      navigate(ROUTES.TASK_DETAILS(item.id))
    }
  }

  const handleQuickAction = (href) => {
    handleClose()
    navigate(href)
  }

  if (!isOpen) return null

  const isQueryShort = query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH
  const showQuickNav = query.trim().length === 0
  const showResults = !showQuickNav && !isQueryShort && results !== null

  const hasAnyResults =
    results &&
    ((results.users?.users?.length || 0) +
      (results.projects?.projects?.length || 0) +
      (results.tasks?.tasks?.length || 0)) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4">
      {/* ── Backdrop ───────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* ── Dialog ─────────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className={cn(
          'relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden z-10',
          'animate-in zoom-in-95 fade-in duration-150'
        )}
      >
        {/* Search input bar */}
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
          }}
          onClear={() => {
            setQuery('')
            setResults(null)
            setError(null)
            setActiveIndex(-1)
            inputRef.current?.focus()
          }}
          isLoading={isLoading}
          placeholder="Search tasks, projects, users…"
        />

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="max-h-[480px] overflow-y-auto overscroll-contain"
        >
          {/* ── Quick navigation (empty query) ──────────────────────────── */}
          {showQuickNav && (
            <div className="p-2">
              <p className="px-3 pt-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Navigation
              </p>
              <div className="space-y-0.5">
                {quickItems.map((action, idx) => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.href}
                      ref={(el) => { if (itemRefs.current[idx]) itemRefs.current[idx].current = el }}
                      type="button"
                      onClick={() => handleQuickAction(action.href)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left group',
                        activeIndex === idx
                          ? 'bg-indigo-50 text-indigo-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0',
                            activeIndex === idx
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{action.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{action.category}</span>
                    </button>
                  )
                })}
              </div>

              {/* Hint */}
              <div className="mt-3 mx-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100/60 px-3 py-2.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <p className="text-[11px] text-indigo-600">
                  Type at least <strong>2 characters</strong> to search across users, projects, and tasks.
                </p>
              </div>
            </div>
          )}

          {/* ── Too-short query hint ─────────────────────────────────────── */}
          {isQueryShort && (
            <div className="py-10 flex flex-col items-center text-center">
              <Search className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-xs text-slate-400">
                Keep typing… ({MIN_QUERY_LENGTH - query.trim().length} more character{MIN_QUERY_LENGTH - query.trim().length !== 1 ? 's' : ''} needed)
              </p>
            </div>
          )}

          {/* ── Loading skeleton ─────────────────────────────────────────── */}
          {isLoading && !results && (
            <div className="p-3 space-y-2">
              {[User, FolderKanban, TaskIcon].map((Icon, gi) => (
                <div key={gi} className="mb-3">
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                    <div className="w-20 h-3 bg-slate-100 rounded-full animate-pulse" />
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-100 rounded-full w-2/3" />
                        <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ── Error state ──────────────────────────────────────────────── */}
          {error && !isLoading && (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Search failed</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
            </div>
          )}

          {/* ── Results ──────────────────────────────────────────────────── */}
          {showResults && !isLoading && !error && (
            <div
              className={cn('p-2 transition-opacity', isLoading && 'opacity-50 pointer-events-none')}
            >
              {hasAnyResults ? (
                <SearchResults
                  results={results}
                  query={query.trim()}
                  activeIndex={activeIndex}
                  flatItems={flatItems}
                  onSelect={handleSelect}
                  itemRefs={itemRefs.current}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
                    <Search className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No results for "{query.trim()}"</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try a different keyword or check your spelling.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono shadow-xs">↑</kbd>
              <kbd className="px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono shadow-xs">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono shadow-xs">↵</kbd>
              select
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3 h-3" />
            <span>NexOps Global Search</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Named alias for explicit import
export { GlobalSearchModal as GlobalSearch }
