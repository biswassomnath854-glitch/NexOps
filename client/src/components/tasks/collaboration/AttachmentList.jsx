import { useState, useEffect, useCallback } from 'react'
import { tasksApi } from '@/api/endpoints/tasks'
import { AttachmentItem } from './AttachmentItem'
import { AttachmentUploader } from './AttachmentUploader'
import { Pagination } from '@/components/common/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { Paperclip, Plus, RefreshCw, X } from 'lucide-react'

export function AttachmentList({
  taskId,
  currentUser,
  isManagement = false,
  isViewer = false,
  canUpdate = true,
}) {
  const [attachments, setAttachments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const loadAttachments = useCallback(
    async (page = 1) => {
      if (!taskId) return
      setIsLoading(true)
      setError(null)
      try {
        const res = await tasksApi.getAttachments(taskId, { page, limit: 10 })
        const data = res?.data || res
        setAttachments(data?.attachments || [])
        if (data?.pagination) {
          setPagination(data.pagination)
        }
      } catch (err) {
        console.error('Failed to load attachments:', err)
        setError(err?.message || 'Failed to load attachments.')
      } finally {
        setIsLoading(false)
      }
    },
    [taskId]
  )

  useEffect(() => {
    loadAttachments(1)
  }, [loadAttachments])

  const showSuccess = (msg) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3500)
  }

  const handleUpload = async (formData, onProgress) => {
    try {
      await tasksApi.uploadAttachment(taskId, formData, {
        onUploadProgress: onProgress,
      })
      showSuccess('File uploaded successfully.')
      setShowUploader(false)
      await loadAttachments(1)
    } catch (err) {
      throw err
    }
  }

  const handleDownload = async (attachment) => {
    try {
      await tasksApi.downloadAttachment(
        taskId,
        attachment.id,
        attachment.originalName
      )
    } catch (err) {
      console.error('Download failed:', err)
      setError(err?.message || 'Failed to download attachment.')
    }
  }

  const handleDelete = async (attachmentId) => {
    await tasksApi.deleteAttachment(taskId, attachmentId)
    showSuccess('Attachment deleted successfully.')
    const nextItemCount = attachments.length - 1
    const targetPage = nextItemCount === 0 && pagination.page > 1 ? pagination.page - 1 : pagination.page
    await loadAttachments(targetPage)
  }

  return (
    <div className="space-y-4">
      {/* Header with count, upload button, and refresh */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-bold text-slate-900">Attachments</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {pagination.totalItems}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadAttachments(pagination.page)}
            disabled={isLoading}
            className="text-xs text-slate-500 hover:text-slate-800 gap-1 h-8 px-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {!isViewer && canUpdate && (
            <Button
              size="sm"
              variant={showUploader ? 'outline' : 'primary'}
              onClick={() => setShowUploader(!showUploader)}
              className="text-xs h-8 px-3 gap-1.5"
            >
              {showUploader ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in duration-150">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 animate-in fade-in duration-150">
          {error}
        </div>
      )}

      {/* Uploader Section */}
      {showUploader && (
        <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <AttachmentUploader
            onUpload={handleUpload}
            isViewer={isViewer}
            disabled={!canUpdate}
          />
        </div>
      )}

      {/* Attachments List */}
      {isLoading && attachments.length === 0 ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No attachments yet"
          description={
            !isViewer && canUpdate
              ? 'Upload project documentation, specifications, or reference images for this task.'
              : 'No files have been attached to this task.'
          }
        />
      ) : (
        <div className="space-y-2.5">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              canDelete={!isViewer && canUpdate}
              onDownload={handleDownload}
              onDelete={handleDelete}
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
            onPageChange={(p) => loadAttachments(p)}
          />
        </div>
      )}
    </div>
  )
}
