import { useState, useEffect, useCallback } from 'react'
import { tasksApi } from '@/api/endpoints/tasks'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { MessageSquare, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function CommentList({
  taskId,
  currentUser,
  isManagement = false,
  isViewer = false,
}) {
  const [comments, setComments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const loadComments = useCallback(
    async (page = 1) => {
      if (!taskId) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await tasksApi.getComments(taskId, { page, limit: 10 })
        const data = res?.data || res
        setComments(data?.comments || [])
        if (data?.pagination) {
          setPagination(data.pagination)
        }
      } catch (err) {
        console.error('Failed to load comments:', err)
        setError(err?.message || 'Failed to load comments.')
      } finally {
        setIsLoading(false)
      }
    },
    [taskId]
  )

  useEffect(() => {
    loadComments(1)
  }, [loadComments])

  const handleCreateComment = async (content) => {
    setIsSubmitting(true)
    try {
      await tasksApi.addComment(taskId, { content })
      await loadComments(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateComment = async (commentId, content) => {
    await tasksApi.updateComment(taskId, commentId, { content })
    await loadComments(pagination.page)
  }

  const handleDeleteComment = async (commentId) => {
    await tasksApi.deleteComment(taskId, commentId)
    // If last item on page and page > 1, go to prev page
    const nextItemCount = comments.length - 1
    const targetPage = nextItemCount === 0 && pagination.page > 1 ? pagination.page - 1 : pagination.page
    await loadComments(targetPage)
  }

  return (
    <div className="space-y-5">
      {/* New Comment Box */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Add Comment
          </h4>
        </div>
        <CommentForm
          onSubmit={handleCreateComment}
          isLoading={isSubmitting}
          isViewer={isViewer}
        />
      </div>

      {/* Header with count & refresh */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">
            Comments
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {pagination.totalItems}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => loadComments(pagination.page)}
          disabled={isLoading}
          className="text-xs text-slate-500 hover:text-slate-800 gap-1.5 h-7 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Comments List */}
      {isLoading && comments.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 animate-pulse space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200" />
                <div className="w-28 h-3.5 bg-slate-200 rounded" />
              </div>
              <div className="w-full h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Start the discussion by posting the first comment on this task."
        />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUser?.id}
              isManagement={isManagement}
              isViewer={isViewer}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.limit}
            onPageChange={(p) => loadComments(p)}
          />
        </div>
      )}
    </div>
  )
}
