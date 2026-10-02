import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/forms/Input'
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
} from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

const DEADLINE_OPTIONS = [
  { value: '', label: 'All Deadlines' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'DUE_TODAY', label: 'Due Today' },
  { value: 'DUE_SOON', label: 'Due Soon (≤3d)' },
  { value: 'UPCOMING', label: 'Upcoming (>3d)' },
]

/**
 * Dropdown checkbox multi-select for Status and Priority
 */
function FilterDropdown({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(next)
  }

  const hasSelection = selected.length > 0
  const displayLabel =
    selected.length === 0
      ? label
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : `${label} (${selected.length})`

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          hasSelection
            ? 'bg-[#635BFF]/10 border-[#635BFF]/30 text-[#5148E5] font-semibold'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0 opacity-60" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-30 min-w-[170px] bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Filter by {label}
          </div>
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#635BFF] focus:ring-[#635BFF]/20 cursor-pointer"
              />
              <span className="text-xs text-slate-700">{opt.label}</span>
            </label>
          ))}
          {hasSelection && (
            <div className="pt-1 mt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onChange([])
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
              >
                Clear {label} filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * TaskFilters — High-density workspace toolbar for task search & filters.
 */
export function TaskFilters({
  filters,
  onChange,
  members = [],
  workstreams = [],
  isLoading = false,
}) {
  const [search, setSearch] = useState(filters.search || '')
  const [showAdvancedDate, setShowAdvancedDate] = useState(
    Boolean(filters.dueDateFrom || filters.dueDateTo)
  )
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  useEffect(() => {
    if (debouncedSearch !== (filters.search || '')) {
      onChange({ ...filters, search: debouncedSearch || undefined, page: 1 })
    }
  }, [debouncedSearch]) // eslint-disable-line

  const handleStatusChange = (values) => {
    onChange({ ...filters, status: values.join(',') || undefined, page: 1 })
  }

  const handlePriorityChange = (values) => {
    onChange({ ...filters, priority: values.join(',') || undefined, page: 1 })
  }

  const handleAssigneeChange = (e) => {
    onChange({ ...filters, assignedTo: e.target.value || undefined, page: 1 })
  }

  const handleWorkstreamChange = (e) => {
    onChange({ ...filters, workstreamId: e.target.value || undefined, page: 1 })
  }

  const handleDeadlineChange = (e) => {
    onChange({ ...filters, deadline: e.target.value || undefined, page: 1 })
  }

  const handleDueDateFrom = (e) => {
    onChange({ ...filters, dueDateFrom: e.target.value || undefined, page: 1 })
  }

  const handleDueDateTo = (e) => {
    onChange({ ...filters, dueDateTo: e.target.value || undefined, page: 1 })
  }

  const selectedStatuses = filters.status ? filters.status.split(',').filter(Boolean) : []
  const selectedPriorities = filters.priority ? filters.priority.split(',').filter(Boolean) : []

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (selectedStatuses.length > 0 ? 1 : 0) +
    (selectedPriorities.length > 0 ? 1 : 0) +
    (filters.assignedTo ? 1 : 0) +
    (filters.workstreamId ? 1 : 0) +
    (filters.deadline ? 1 : 0) +
    (filters.dueDateFrom || filters.dueDateTo ? 1 : 0)

  const clearAll = () => {
    setSearch('')
    setShowAdvancedDate(false)
    onChange({
      page: 1,
      limit: filters.limit || 10,
    })
  }

  const memberOptions = [
    { value: '', label: 'All Assignees' },
    { value: 'unassigned', label: 'Unassigned' },
    ...members.map((m) => ({
      value: m.user?.id || m.id || m.userId,
      label: `${m.user?.firstName || m.firstName || ''} ${m.user?.lastName || m.lastName || ''}`.trim() || 'Member',
    })),
  ]

  const selectedAssigneeName = memberOptions.find((o) => o.value === filters.assignedTo)?.label
  const selectedWorkstreamName =
    filters.workstreamId === 'unassigned'
      ? 'Unassigned Workstream'
      : workstreams.find((w) => String(w.id) === String(filters.workstreamId))?.name

  return (
    <div className="space-y-2.5">
      {/* Main Workspace Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all"
            disabled={isLoading}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex sm:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              activeFiltersCount > 0
                ? 'bg-[#635BFF]/10 text-[#5148E5] border-[#635BFF]/30'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#635BFF] text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop Filter Controls */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {/* Status Multi-Select */}
          <FilterDropdown
            label="Status"
            options={TASK_STATUS_OPTIONS}
            selected={selectedStatuses}
            onChange={handleStatusChange}
          />

          {/* Priority Multi-Select */}
          <FilterDropdown
            label="Priority"
            options={TASK_PRIORITY_OPTIONS}
            selected={selectedPriorities}
            onChange={handlePriorityChange}
          />

          {/* Assignee Filter */}
          <div className="relative">
            <select
              value={filters.assignedTo || ''}
              onChange={handleAssigneeChange}
              className={`pl-3 pr-7 py-1.5 rounded-lg border text-xs font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 ${
                filters.assignedTo
                  ? 'bg-[#635BFF]/10 border-[#635BFF]/30 text-[#5148E5] font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {memberOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Workstream Filter */}
          {workstreams && workstreams.length > 0 && (
            <div className="relative">
              <select
                value={filters.workstreamId || ''}
                onChange={handleWorkstreamChange}
                className={`pl-3 pr-7 py-1.5 rounded-lg border text-xs font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 ${
                  filters.workstreamId
                    ? 'bg-[#635BFF]/10 border-[#635BFF]/30 text-[#5148E5] font-semibold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="">All Workstreams</option>
                <option value="unassigned">Unassigned Workstream</option>
                {workstreams.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Deadline Filter */}
          <div className="relative">
            <select
              value={filters.deadline || ''}
              onChange={handleDeadlineChange}
              className={`pl-3 pr-7 py-1.5 rounded-lg border text-xs font-medium appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 ${
                filters.deadline
                  ? 'bg-[#635BFF]/10 border-[#635BFF]/30 text-[#5148E5] font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {DEADLINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Date Range Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedDate((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              showAdvancedDate || filters.dueDateFrom || filters.dueDateTo
                ? 'bg-[#635BFF]/10 border-[#635BFF]/30 text-[#5148E5] font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Dates</span>
          </button>

          {/* Clear All Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="sm:hidden p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Filter Parameters</span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {TASK_STATUS_OPTIONS.map((opt) => {
                  const isChecked = selectedStatuses.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = isChecked
                          ? selectedStatuses.filter((s) => s !== opt.value)
                          : [...selectedStatuses, opt.value]
                        handleStatusChange(next)
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        isChecked
                          ? 'bg-[#635BFF] text-white border-[#635BFF]'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
              <div className="flex flex-wrap gap-1.5">
                {TASK_PRIORITY_OPTIONS.map((opt) => {
                  const isChecked = selectedPriorities.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        const next = isChecked
                          ? selectedPriorities.filter((p) => p !== opt.value)
                          : [...selectedPriorities, opt.value]
                        handlePriorityChange(next)
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        isChecked
                          ? 'bg-[#635BFF] text-white border-[#635BFF]'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Assignee</label>
              <select
                value={filters.assignedTo || ''}
                onChange={handleAssigneeChange}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              >
                {memberOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {workstreams && workstreams.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Workstream</label>
                <select
                  value={filters.workstreamId || ''}
                  onChange={handleWorkstreamChange}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
                >
                  <option value="">All Workstreams</option>
                  <option value="unassigned">Unassigned Workstream</option>
                  {workstreams.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Deadline Urgency</label>
              <select
                value={filters.deadline || ''}
                onChange={handleDeadlineChange}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700"
              >
                {DEADLINE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Due Date Range Row */}
      {showAdvancedDate && (
        <div className="flex flex-wrap items-center gap-2.5 pt-2 pb-1 border-t border-slate-100 text-xs animate-in fade-in slide-in-from-top-1">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Due Date Window:
          </span>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={filters.dueDateFrom ? filters.dueDateFrom.slice(0, 10) : ''}
              onChange={handleDueDateFrom}
              className="w-36 py-1 text-xs"
              placeholder="Start date"
            />
            <span className="text-slate-400 text-xs font-medium">to</span>
            <Input
              type="date"
              value={filters.dueDateTo ? filters.dueDateTo.slice(0, 10) : ''}
              onChange={handleDueDateTo}
              className="w-36 py-1 text-xs"
              placeholder="End date"
            />
          </div>
          {(filters.dueDateFrom || filters.dueDateTo) && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, dueDateFrom: undefined, dueDateTo: undefined, page: 1 })}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-1.5"
            >
              Clear dates
            </button>
          )}
        </div>
      )}

      {/* Active Filter Chips Row */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Active Filters:
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs">
              <span>Search: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedStatuses.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs">
              <span>
                Status: {selectedStatuses.map((s) => TASK_STATUS_OPTIONS.find((o) => o.value === s)?.label || s).join(', ')}
              </span>
              <button
                type="button"
                onClick={() => handleStatusChange([])}
                className="text-indigo-400 hover:text-indigo-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedPriorities.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <span>
                Priority: {selectedPriorities.map((p) => TASK_PRIORITY_OPTIONS.find((o) => o.value === p)?.label || p).join(', ')}
              </span>
              <button
                type="button"
                onClick={() => handlePriorityChange([])}
                className="text-amber-500 hover:text-amber-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.assignedTo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs">
              <span>Assignee: {selectedAssigneeName || filters.assignedTo}</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, assignedTo: undefined, page: 1 })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.workstreamId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs">
              <span>Workstream: {selectedWorkstreamName || filters.workstreamId}</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, workstreamId: undefined, page: 1 })}
                className="text-indigo-400 hover:text-indigo-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.deadline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs">
              <span>
                Deadline: {DEADLINE_OPTIONS.find((o) => o.value === filters.deadline)?.label || filters.deadline}
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, deadline: undefined, page: 1 })}
                className="text-sky-400 hover:text-sky-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.dueDateFrom || filters.dueDateTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs">
              <span>
                Range: {filters.dueDateFrom || 'Start'} to {filters.dueDateTo || 'End'}
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, dueDateFrom: undefined, dueDateTo: undefined, page: 1 })}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 ml-1 underline cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
