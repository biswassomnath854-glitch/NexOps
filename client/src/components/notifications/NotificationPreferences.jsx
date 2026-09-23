import { useState, useEffect } from 'react'
import {
  Bell,
  Save,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Shield,
} from 'lucide-react'
import { notificationsApi } from '@/api/endpoints/notifications'
import { PREFERENCE_FIELDS, NOTIFICATION_TYPE_META } from '@/constants/notifications'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

/**
 * Toggle switch sub-component.
 */
function ToggleSwitch({ id, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

/**
 * NotificationPreferences — loads, edits, and saves notification preferences.
 *
 * Aligns precisely with the backend NotificationPreference model fields:
 *   taskAssigned, taskReassigned, taskStatusChanged, taskCommented,
 *   taskMentioned, taskDueSoon, taskOverdue, taskCompleted
 *
 * Uses PATCH /notification-preferences to update individual fields.
 */
export function NotificationPreferences() {
  const [prefs, setPrefs] = useState(null)
  const [dirtyPrefs, setDirtyPrefs] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null) // { type: 'success'|'error', message }

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
          // Backend returns preferences directly in data (not nested)
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
      // Only send modified preference fields (exclude id, timestamps, etc.)
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
      showFeedback('Notification preferences saved successfully.')
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
      showFeedback('Preferences reset to defaults.')
    } catch (err) {
      showFeedback(err?.message || 'Failed to reset preferences.', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  const isDirty =
    prefs &&
    dirtyPrefs &&
    PREFERENCE_FIELDS.some(({ key }) => prefs[key] !== dirtyPrefs[key])

  const enabledCount = dirtyPrefs
    ? PREFERENCE_FIELDS.filter(({ key }) => dirtyPrefs[key]).length
    : 0

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card className="border-slate-200/80">
        <CardContent className="py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Loading preferences…</p>
        </CardContent>
      </Card>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !dirtyPrefs) {
    return (
      <Card className="border-slate-200/80">
        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Failed to Load Preferences</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Feedback toast ───────────────────────────────────────────────── */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium animate-in slide-in-from-top-2',
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

      {/* ── Preferences card ─────────────────────────────────────────────── */}
      <Card className="border-slate-200/80">
        <CardHeader
          action={
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">
                {enabledCount} of {PREFERENCE_FIELDS.length} enabled
              </span>
            </div>
          }
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100/80">
            {PREFERENCE_FIELDS.map(({ key, label, description, type }) => {
              const meta = NOTIFICATION_TYPE_META[type]
              const isEnabled = dirtyPrefs ? dirtyPrefs[key] : false

              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between gap-4 px-6 py-4 transition-colors',
                    isEnabled ? 'hover:bg-indigo-50/20' : 'hover:bg-slate-50/60 opacity-75'
                  )}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Type color dot */}
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        isEnabled ? meta.dotColor : 'bg-slate-200'
                      )}
                    />
                    <div className="min-w-0">
                      <label
                        htmlFor={`pref-${key}`}
                        className={cn(
                          'text-sm font-semibold cursor-pointer',
                          isEnabled ? 'text-slate-900' : 'text-slate-400'
                        )}
                      >
                        {label}
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    id={`pref-${key}`}
                    checked={isEnabled}
                    onChange={(val) => handleToggle(key, val)}
                    disabled={isSaving || isResetting}
                  />
                </div>
              )
            })}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            isLoading={isResetting}
            disabled={isSaving}
            leftIcon={RotateCw}
            className="text-slate-500"
          >
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-2.5">
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!isDirty || isResetting}
              leftIcon={Save}
            >
              Save Preferences
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* ── Info panel ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
        <p className="text-xs text-indigo-700 font-semibold mb-1">About notification preferences</p>
        <p className="text-xs text-indigo-600/80 leading-relaxed">
          Changes apply immediately to new notifications. Existing notifications in your inbox are not affected.
          Disabling a type prevents those notifications from being created for your account.
        </p>
      </div>
    </div>
  )
}
