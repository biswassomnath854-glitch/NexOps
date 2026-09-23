import { useState } from 'react'
import { TaskAssignee } from '../TaskAssignee'
import { CommentForm } from './CommentForm'
import { formatDateTime } from '@/utils/formatters'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { Edit2, Trash2, MoreVertical } from 'lucide-react'

export function CommentItem({
  comment,
  currentUserId,
  isManagement = false,
  isViewer = false,
  onUpdate,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  if (!comment) return null

  const isAuthor = currentUserId && comment.userId === currentUserId
  // Non-viewers who are authors or management users can edit & delete
  const canEdit = !isViewer && (isAuthor || isManagement)
  const canDelete = !isViewer && (isAuthor || isManagement)

  const isEdited =
    comment.updatedAt &&
    comment.createdAt &&
    new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 1000

  const handleSaveEdit = async (newContent) => {
    setIsActionLoading(true)
    try {
      await onUpdate(comment.id, newContent)
      setIsEditing(false)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsActionLoading(true)
    try {
      await onDelete(comment.id)
      setIsDeleteModalOpen(false)
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="group relative p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300/80 transition-all">
      {/* Header: Author + Timestamp + Actions */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskAssignee assignee={comment.user} size="sm" />
          {comment.user?.role && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {comment.user.role.replace(/_/g, ' ')}
            </span>
          )}
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400">
            {formatDateTime(comment.createdAt)}
          </span>
          {isEdited && (
            <span className="text-[11px] text-slate-400 italic">
              (edited)
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (canEdit || canDelete) && (
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                title="Edit comment"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Body / Inline Edit Mode */}
      {isEditing ? (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <CommentForm
            initialValue={comment.content}
            isEdit={true}
            isLoading={isActionLoading}
            onSubmit={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </p>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Comment"
          message="Are you sure you want to delete this comment? This action cannot be undone."
          confirmText="Delete Comment"
          tone="danger"
          isLoading={isActionLoading}
        />
      )}
    </div>
  )
}
