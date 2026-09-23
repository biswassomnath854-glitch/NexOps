import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Send, AlertCircle, Loader2 } from 'lucide-react'

const MAX_COMMENT_LENGTH = 5000

export function CommentForm({
  onSubmit,
  isLoading = false,
  isViewer = false,
  placeholder = 'Write a comment or update...',
  initialValue = '',
  onCancel,
  isEdit = false,
}) {
  const [content, setContent] = useState(initialValue)
  const [validationError, setValidationError] = useState('')

  const charCount = content.trim().length
  const isOverLimit = charCount > MAX_COMMENT_LENGTH

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = content.trim()

    if (!trimmed) {
      setValidationError('Comment content is required.')
      return
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setValidationError(`Comment must not exceed ${MAX_COMMENT_LENGTH} characters.`)
      return
    }

    setValidationError('')
    try {
      await onSubmit(trimmed)
      if (!isEdit) {
        setContent('')
      }
    } catch (err) {
      setValidationError(err?.message || 'Failed to submit comment.')
    }
  }

  if (isViewer) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Viewers do not have permission to post comments on tasks.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          rows={isEdit ? 3 : 3}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (validationError) setValidationError('')
          }}
          disabled={isLoading}
          placeholder={placeholder}
          className={`w-full text-sm rounded-xl border p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none shadow-sm disabled:bg-slate-50 disabled:cursor-not-allowed ${
            isOverLimit || validationError ? 'border-rose-300' : 'border-slate-200 hover:border-slate-300'
          }`}
        />
      </div>

      {validationError && (
        <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {validationError}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span
          className={`text-[11px] font-mono ${
            isOverLimit ? 'text-rose-600 font-bold' : charCount > 4500 ? 'text-amber-600' : 'text-slate-400'
          }`}
        >
          {charCount} / {MAX_COMMENT_LENGTH}
        </span>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={onCancel}
              className="text-xs h-8 px-3"
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !content.trim() || isOverLimit}
            className="text-xs h-8 px-3 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{isEdit ? 'Saving...' : 'Posting...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>{isEdit ? 'Save Changes' : 'Post Comment'}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
