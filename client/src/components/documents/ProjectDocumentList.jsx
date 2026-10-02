import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import { projectDocumentsApi } from '@/api/endpoints/projectDocuments'
import { projectsApi } from '@/api/endpoints/projects'
import { UploadDocumentModal } from './UploadDocumentModal'
import { formatDate } from '@/utils/formatters'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Paperclip,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'DELIVERABLE', label: 'Deliverables' },
  { id: 'REQUIREMENT', label: 'Requirements' },
  { id: 'SPECIFICATION', label: 'Specifications' },
  { id: 'REPORT', label: 'Reports' },
  { id: 'DESIGN', label: 'Design' },
  { id: 'REFERENCE', label: 'Reference' },
]

export function ProjectDocumentList({
  projectId,
  documents = [],
  currentUser,
  isManagement = false,
  isViewer = false,
  onDocumentsChange,
}) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [togglingDocId, setTogglingDocId] = useState(null)

  const handleToggleClientVisibility = async (doc) => {
    if (!isManagement) return
    setTogglingDocId(doc.id)
    try {
      await projectsApi.updateDocumentClientVisibility(projectId, doc.id, {
        isClientVisible: !doc.isClientVisible,
      })
      if (onDocumentsChange) onDocumentsChange()
    } catch (err) {
      console.error('Toggle client visibility error:', err)
    } finally {
      setTogglingDocId(null)
    }
  }

  const filteredDocs = documents.filter((doc) => {
    if (activeCategory === 'ALL') return true
    return doc.category === activeCategory
  })

  const handleDownload = async (doc) => {
    try {
      await projectDocumentsApi.downloadDocument(doc.id, doc.originalName)
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await projectDocumentsApi.deleteDocument(deleteTarget.id)
      setDeleteTarget(null)
      if (onDocumentsChange) onDocumentsChange()
    } catch (err) {
      console.error('Delete document error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'DELIVERABLE':
        return <Badge variant="success" size="sm">DELIVERABLE</Badge>
      case 'SPECIFICATION':
        return <Badge variant="primary" size="sm">SPECIFICATION</Badge>
      case 'REQUIREMENT':
        return <Badge variant="warning" size="sm">REQUIREMENT</Badge>
      default:
        return <Badge variant="neutral" size="sm">{cat}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Project Documents & Deliverables ({documents.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Requirements, specs, architectural briefs, and completed milestone deliverables
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={Upload}
            className="text-xs font-semibold shadow-xs"
          >
            Upload Document
          </Button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id
          const count = cat.id === 'ALL'
            ? documents.length
            : documents.filter((d) => d.category === cat.id).length

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Document Table / Empty State */}
      {filteredDocs.length === 0 ? (
        <Card className="text-center p-10 border-dashed border-slate-200 bg-slate-50/50">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No documents found</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
            {activeCategory === 'ALL'
              ? 'No project documents or deliverables have been uploaded yet.'
              : `No documents categorized as ${activeCategory}.`}
          </p>
          {!isViewer && activeCategory === 'ALL' && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => setIsUploadOpen(true)}
              leftIcon={Upload}
              className="mt-4 text-xs"
            >
              Upload First Document
            </Button>
          )}
        </Card>
      ) : (
        <Card className="border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Document / File</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Size</th>
                  <th className="py-2.5 px-4">Client Access</th>
                  <th className="py-2.5 px-4">Uploaded By</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const canDelete =
                    !isViewer && (isManagement || doc.uploadedBy === currentUser?.id)
                  const isToggling = togglingDocId === doc.id

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{doc.title}</p>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>{doc.originalName}</span>
                            </p>
                            {doc.description && (
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getCategoryBadge(doc.category)}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-4">
                        {isManagement ? (
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleClientVisibility(doc)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors cursor-pointer border ${
                              doc.isClientVisible
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={
                              doc.isClientVisible
                                ? 'Client-visible: click to hide from client'
                                : 'Internal only: click to approve for client visibility'
                            }
                          >
                            {isToggling ? (
                              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                            ) : doc.isClientVisible ? (
                              <Eye className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{doc.isClientVisible ? 'Client Visible' : 'Internal Only'}</span>
                          </button>
                        ) : (
                          <Badge
                            variant={doc.isClientVisible ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {doc.isClientVisible ? 'Client Visible' : 'Internal Only'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {doc.uploader ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                              {doc.uploader.firstName?.[0] || 'U'}
                            </span>
                            <span>{doc.uploader.firstName} {doc.uploader.lastName}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setDeleteTarget(doc)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                              title="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projectId={projectId}
        onSuccess={onDocumentsChange}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmationModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Delete Project Document"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This permanently removes the document record and file storage.`}
          confirmText="Delete Document"
          tone="danger"
          isLoading={actionLoading}
        />
      )}
    </div>
  )
}
