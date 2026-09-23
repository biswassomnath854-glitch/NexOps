import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { formatFileSize } from './AttachmentItem'
import {
  UploadCloud,
  File,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]

export function AttachmentUploader({
  onUpload,
  isViewer = false,
  disabled = false,
}) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    if (!file) return 'No file selected.'

    // Size check
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the 10 MB limit (${formatFileSize(file.size)}).`
    }

    // Extension check
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type "${ext}". Allowed types: PDF, Word, Excel, CSV, TXT, PNG, JPEG, WebP.`
    }

    return null
  }

  const handleFileChange = (file) => {
    setError(null)
    const validationMsg = validateFile(file)
    if (validationMsg) {
      setError(validationMsg)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (isViewer || disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileChange(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!isViewer && !disabled && !isUploading) {
      setDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) return
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      await onUpload(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        }
      })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Attachment upload failed:', err)
      setError(err?.message || 'Failed to upload attachment.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveSelected = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (isViewer) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Viewers do not have permission to upload attachments.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileChange(e.target.files[0])
        }}
        disabled={isUploading || disabled}
      />

      {/* Drag & Drop Area */}
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!isUploading && !disabled) fileInputRef.current?.click()
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/60'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
          } ${disabled || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Click to upload <span className="font-normal text-slate-500">or drag and drop</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            PDF, Word, Excel, CSV, Images up to 10 MB
          </p>
        </div>
      ) : (
        /* Selected File Card & Progress */
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <File className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] font-mono text-slate-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {!isUploading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveSelected}
                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
            </div>
          )}

          {/* Upload trigger button */}
          {!isUploading && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                onClick={handleUploadSubmit}
                className="text-xs h-8 px-3 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
