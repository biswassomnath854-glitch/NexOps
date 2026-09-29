import { useState, useEffect, useMemo } from 'react'
import {
  Save,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
  UserPlus,
  RefreshCw,
  MessageSquare,
  Clock,
  Info,
} from 'lucide-react'
import { notificationsApi } from '@/api/endpoints/notifications'
import { PREFERENCE_FIELDS, NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

/* ─── Enterprise Category Grouping of the 8 Backend Fields ─── */
const PREFERENCE_CATEGORIES = [
  {
    id: 'assignments',
    title: 'Task Assignments & Ownership',
    description: 'Notifications regarding your direct task responsibilities and delegational transfers.',
    icon: UserPlus,
    color: '#635BFF',
    keys: ['taskAssigned', 'taskReassigned'],
  },
  {
    id: 'workflow',
    title: 'Workflow & Status Updates',
    description: 'Notifications when tasks progress through state transitions or reach completion.',
    icon: RefreshCw,
    color: '#2563EB',
    keys: ['taskStatusChanged', 'taskCompleted'],
  },
  {
    id: 'collaboration',
    title: 'Collaboration & Discussions',
    description: 'Alerts when team members comment on your tasks or directly mention your profile.',
    icon: MessageSquare,
    color: '#64748B',
    keys: ['taskCommented', 'taskMentioned'],
  },
  {
    id: 'deadlines',
    title: 'Deadlines & Operational Urgency',
    description: 'Time-sensitive warnings when delivery milestones approach or deadlines elapse.',
    icon: Clock,
    color: '#D97706',
    keys: ['taskDueSoon', 'taskOverdue'],
  },
]

/**
 * Enterprise accessible Toggle Switch.
 */
function ToggleSwitch({ id, checked, onChange, disabled, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('text-xs font-semibold uppercase tracking-wider', checked ? 'text-[#635BFF]' : 'text-slate-400')}>
        {checked ? 'Enabled' : 'Disabled'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={id}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-[#635BFF]' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

/**
 * NotificationPreferences — Enterprise settings management for notification triggers.
 */
export function NotificationPreferences() {
  const [prefs, setPrefs] = useState(null)
  const [dirtyPrefs, setDirtyPrefs] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 4500)
  }

  // ── Load preferences ──────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    async function loadPrefs() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await notificationsApi.getPreferences()
        if (isMounted) {
          const data = res?.data || res
          setPrefs(data)
          setDirtyPrefs(data)
        }
      } catch (err) {
        if (isMounted) {
          const status = err?.status
          if (status === 401 || status === 403) {
            setError('You do not have permission to view notification preferences.')
          } else {
            setError(err?.message || 'Failed to load preferences.')
          }
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadPrefs()
    return () => { isMounted = false }
  }, [])

  // ── Toggle handler ────────────────────────────────────────────────────────
  const handleToggle = (key, value) => {
    setDirtyPrefs((prev) => ({ ...prev, [key]: value }))
  }

  // ── Save changes ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!dirtyPrefs) return
    setIsSaving(true)
    setError(null)
    try {
      const updates = {}
      PREFERENCE_FIELDS.forEach(({ key }) => {
        if (dirtyPrefs[key] !== undefined) {
          updates[key] = dirtyPrefs[key]
        }
      })
      const res = await notificationsApi.updatePreferences(updates)
      const saved = res?.data || res
      setPrefs(saved)
      setDirtyPrefs(saved)
      showFeedback('Notification preferences updated successfully.')
    } catch (err) {
      const status = err?.status
      if (status === 401 || status === 403) {
        showFeedback('You do not have permission to update preferences.', 'error')
      } else {
        showFeedback(err?.message || 'Failed to save preferences.', 'error')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // ── Reset to defaults ─────────────────────────────────────────────────────
  const handleReset = async () => {
    setIsResetting(true)
    setError(null)
    try {
      const res = await notificationsApi.resetPreferences()
      const reset = res?.data || res
      setPrefs(reset)
      setDirtyPrefs(reset)
      showFeedback('Preferences have been restored to corporate defaults.')
    } catch (err) {
      showFeedback(err?.message || 'Failed to reset preferences.', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  const isDirty = useMemo(() => {
    if (!prefs || !dirtyPrefs) return false
    return PREFERENCE_FIELDS.some(({ key }) => prefs[key] !== dirtyPrefs[key])
  }, [prefs, dirtyPrefs])

  const enabledCount = useMemo(() => {
    if (!dirtyPrefs) return 0
    return PREFERENCE_FIELDS.filter(({ key }) => dirtyPrefs[key]).length
  }, [dirtyPrefs])

  // Lookup map for fast access
  const fieldLookup = useMemo(() => {
    const map = {}
    PREFERENCE_FIELDS.forEach((f) => {
      map[f.key] = f
    })
    return map
  }, [])

  // ── Loading Skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
              <div className="space-y-1 flex-1">
                <div className="h-4 bg-slate-200 rounded w-48" />
                <div className="h-3 bg-slate-100 rounded w-80" />
              </div>
            </div>
            <div className="space-y-3 pt-3">
              <div className="h-14 bg-slate-50 rounded-lg" />
              <div className="h-14 bg-slate-50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error && !dirtyPrefs) {
    return (
      <Card className="border-slate-200/80">
        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center mb-3.5 shadow-2xs">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 mb-1">
            Failed to Load Preferences
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Feedback Toast Banner ── */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold animate-in slide-in-from-top-2 shadow-2xs',
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          )}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* ── Summary & Control Ribbon ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Notification Trigger Management
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize automated notification delivery for your workspace activities
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Badge variant={enabledCount > 0 ? 'primary' : 'neutral'} size="md">
            {enabledCount} of {PREFERENCE_FIELDS.length} Active
          </Badge>
          {isDirty && (
            <Badge variant="warning" size="md" dot>
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* ── Categorized Enterprise Sections ── */}
      <div className="space-y-5">
        {PREFERENCE_CATEGORIES.map((category) => {
          const CategoryIcon = category.icon

          return (
            <Card key={category.id} className="border-slate-200/80 shadow-2xs overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${category.color}14` }}
                  >
                    <CategoryIcon className="w-4 h-4" style={{ color: category.color }} />
                  </div>
                  <span>{category.title}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  {category.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-slate-100">
                {category.keys.map((key) => {
                  const field = fieldLookup[key]
                  if (!field) return null
                  const isEnabled = dirtyPrefs ? dirtyPrefs[key] : false
                  const meta = NOTIFICATION_TYPE_META[field.type]

                  return (
                    <div
                      key={key}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 transition-colors',
                        isEnabled ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/30 hover:bg-slate-50/70'
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={cn(
                            'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-2xs',
                            isEnabled ? meta?.dotColor || 'bg-[#635BFF]' : 'bg-slate-300'
                          )}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <label
                            htmlFor={`pref-${key}`}
                            className={cn(
                              'text-sm font-semibold cursor-pointer block',
                              isEnabled ? 'text-slate-900' : 'text-slate-600'
                            )}
                          >
                            {field.label}
                          </label>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {field.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <ToggleSwitch
                          id={`pref-${key}`}
                          label={field.label}
                          checked={isEnabled}
                          onChange={(val) => handleToggle(key, val)}
                          disabled={isSaving || isResetting}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── Save / Reset Actions Card Footer ── */}
      <Card className="border-slate-200/80 shadow-2xs">
        <div className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            isLoading={isResetting}
            disabled={isSaving}
            leftIcon={RotateCw}
            className="text-slate-500 hover:text-slate-800 text-xs w-full sm:w-auto"
          >
            Reset to Corporate Defaults
          </Button>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isDirty && (
              <span className="text-xs font-semibold text-amber-600">
                You have unsaved changes
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!isDirty || isResetting}
              leftIcon={Save}
              className="text-xs w-full sm:w-auto"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Operational Info Panel ── */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5 flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-[#635BFF] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-indigo-900">
            About Enterprise Notification Configuration
          </p>
          <p className="text-indigo-700/80">
            Changes apply immediately to all upcoming workspace events. Existing notifications in your inbox remain intact.
            When a category is disabled, automated notices for those activities are bypassed.
          </p>
        </div>
      </div>
    </div>
  )
}
