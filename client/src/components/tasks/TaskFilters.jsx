import { useState } from 'react'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Button } from '@/components/ui/Button'
import { Search, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useEffect } from 'react'

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
 * Multi-select checkbox pill group for status/priority filters.
 * Sends comma-separated values to match backend query format.
 */
function MultiSelectPills({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(next)
  }

  const displayLabel =
    selected.length === 0
      ? label
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : `${selected.length} selected`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
          selected.length > 0
            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        }`}
      >
        <span className="max-w-[110px] truncate">{displayLabel}</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-20 min-w-[160px] bg-white rounded-xl border border-slate-200 shadow-xl py-1.5">
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 font-medium">{opt.label}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => { onChange([]); setIsOpen(false) }}
                className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
              >
                Clear selection
              </button>
            </>
          )}
        </div>
      )}

      {/* Close on outside click */}
      {isOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

/**
 * TaskFilters — Filter bar for the task list.
 *
 * Props:
 *   filters     — current filter state
 *   onChange    — callback(updatedFilters)
 *   members     — project members for assignee filter
 *   showAdvanced — whether to show due-date range filters
 */
export function TaskFilters({ filters, onChange, members = [], isLoading = false }) {
  const [search, setSearch] = useState(filters.search || '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onChange({ ...filters, search: debouncedSearch, page: 1 })
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

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.assignedTo ||
    filters.deadline ||
    filters.dueDateFrom ||
    filters.dueDateTo

  const clearAll = () => {
    setSearch('')
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
      label: `${m.user?.firstName || m.firstName || ''} ${m.user?.lastName || m.lastName || ''}`.trim(),
    })),
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            disabled={isLoading}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status */}
        <MultiSelectPills
          label="Status"
          options={TASK_STATUS_OPTIONS}
          selected={selectedStatuses}
          onChange={handleStatusChange}
        />

        {/* Priority */}
        <MultiSelectPills
          label="Priority"
          options={TASK_PRIORITY_OPTIONS}
          selected={selectedPriorities}
          onChange={handlePriorityChange}
        />

        {/* Assignee */}
        <div className="min-w-[140px]">
          <select
            value={filters.assignedTo || ''}
            onChange={handleAssigneeChange}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none"
          >
            {memberOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Deadline */}
        <div className="min-w-[140px]">
          <select
            value={filters.deadline || ''}
            onChange={handleDeadlineChange}
            className={`w-full px-3 py-2 rounded-lg border text-xs transition-all appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${
              filters.deadline
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
          >
            {DEADLINE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
            showAdvanced || filters.dueDateFrom || filters.dueDateTo
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Date Range
        </button>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-9 px-3"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced: Due Date Range */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date Range</span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filters.dueDateFrom ? filters.dueDateFrom.slice(0, 10) : ''}
              onChange={handleDueDateFrom}
              className="w-40 py-1.5 text-xs"
            />
            <span className="text-xs text-slate-400 font-medium">to</span>
            <Input
              type="date"
              value={filters.dueDateTo ? filters.dueDateTo.slice(0, 10) : ''}
              onChange={handleDueDateTo}
              className="w-40 py-1.5 text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}
