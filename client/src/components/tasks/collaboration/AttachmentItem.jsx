import { useState } from 'react'
import { formatDateTime } from '@/utils/formatters'
import { TaskAssignee } from '../TaskAssignee'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileIcon(mimeType = '', filename = '') {
  const mime = mimeType.toLowerCase()
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  if (mime.includes('pdf') || ext === 'pdf') {
    return { Icon: FileText, color: 'text-rose-600 bg-rose-50 border-rose-200' }
  }
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return { Icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
  }
  if (
    mime.includes('word') ||
    mime.includes('document') ||
    ['doc', 'docx'].includes(ext)
  ) {
    return { Icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' }
  }
  if (
    mime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
  ) {
    return { Icon: FileImage, color: 'text-purple-600 bg-purple-50 border-purple-200' }
  }
  if (
    mime.includes('text') ||
    ['txt', 'log', 'json'].includes(ext)
  ) {
    return { Icon: FileCode, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  }
  return { Icon: File, color: 'text-slate-600 bg-slate-50 border-slate-200' }
}

export function AttachmentItem({
  attachment,
  canDelete = false,
  onDownload,
  onDelete,
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!attachment) return null

  const { Icon, color } = getFileIcon(attachment.mimeType, attachment.originalName)

  const handleDownloadClick = async () => {
    setIsDownloading(true)
    try {
      await onDownload(attachment)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(attachment.id)
      setIsDeleteModalOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all group shadow-xs">
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
        {/* File Type Icon */}
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${color}`}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* File Details */}
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-semibold text-slate-900 truncate"
            title={attachment.originalName}
          >
            {attachment.originalName}
          </p>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
            <span className="font-mono text-slate-500">
              {formatFileSize(attachment.fileSize)}
            </span>
            <span>•</span>
            <span>{formatDateTime(attachment.createdAt)}</span>
            {attachment.uploader && (
              <>
                <span>•</span>
                <span className="text-slate-600 font-medium">
                  {attachment.uploader.firstName} {attachment.uploader.lastName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadClick}
          disabled={isDownloading}
          className="h-8 px-2.5 text-xs text-slate-600 hover:text-indigo-600 gap-1"
          title="Download file"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Download</span>
        </Button>

        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete attachment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Attachment"
          message={`Are you sure you want to delete "${attachment.originalName}"? This file will be permanently removed.`}
          confirmText="Delete Attachment"
          tone="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
