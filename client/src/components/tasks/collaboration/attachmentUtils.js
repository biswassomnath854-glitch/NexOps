import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
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
