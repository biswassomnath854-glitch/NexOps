import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  FileCheck,
  ShieldCheck,
  HardDrive,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { clientApi } from '@/api/endpoints/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ClientFeedbackModal } from '@/components/client/ClientFeedbackModal'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function ClientProjectDetailsPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingDocId, setDownloadingDocId] = useState(null)
  const [feedbackMap, setFeedbackMap] = useState({})
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: 'accept',
    document: null,
  })

  const fetchData = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)

    try {
      const [projectRes, docsRes] = await Promise.all([
        clientApi.getProjectById(projectId),
        clientApi.getDocuments(projectId),
      ])

      const docs = docsRes.data?.documents || []
      setProject(projectRes.data?.project || null)
      setDocuments(docs)

      // Fetch feedback status for deliverables
      const feedbackEntries = await Promise.all(
        docs.map(async (doc) => {
          try {
            const fbRes = await clientApi.getDeliverableFeedback(projectId, doc.id)
            return [doc.id, fbRes.data?.data || fbRes.data || { currentStatus: 'PENDING_REVIEW' }]
          } catch (_) {
            return [doc.id, { currentStatus: 'PENDING_REVIEW' }]
          }
        })
      )
      setFeedbackMap(Object.fromEntries(feedbackEntries))
    } catch (err) {
      console.error('Failed to fetch client project details:', err)
      setError(
        err.message || 'Unable to retrieve project details. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDownload = async (doc) => {
    try {
      setDownloadingDocId(doc.id)
      const response = await clientApi.downloadDocument(projectId, doc.id)

      // Create download link from blob
      const blob = new Blob([response.data], {
        type: doc.mimeType || 'application/octet-stream',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.originalName || `${doc.title}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Document download failed:', err)
      alert('Failed to download document. Please try again.')
    } finally {
      setDownloadingDocId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-36 bg-white rounded-2xl border border-slate-200" />
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          to={ROUTES.CLIENT_PROJECTS}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Approved Projects
        </Link>
        <ErrorState
          title="Project Not Accessible"
          message={error || 'Project not found.'}
          onRetry={fetchData}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div>
        <Link
          to={ROUTES.CLIENT_PROJECTS}
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Approved Projects
        </Link>
      </div>

      {/* Project Header Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-xs font-semibold px-2.5 py-0.5"
              >
                {project.code}
              </Badge>
              <Badge
                variant="success"
                className="text-xs font-semibold flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Officially Published
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="text-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Project Scope & Description */}
        <div className="prose prose-slate max-w-none text-sm text-slate-700 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 leading-relaxed">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Approved Project Scope & Overview
          </h2>
          <p className="whitespace-pre-line">
            {project.description ||
              'This project has been completed and verified according to contract specifications.'}
          </p>
        </div>

        {/* Project Metadata Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="text-slate-500 font-medium">Timeline</p>
              <p className="font-semibold text-slate-900">
                {project.startDate ? formatDate(project.startDate) : 'N/A'} &mdash;{' '}
                {project.endDate ? formatDate(project.endDate) : 'Completed'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="text-slate-500 font-medium">Publication Date</p>
              <p className="font-semibold text-slate-900">
                {project.publishedAt ? formatDate(project.publishedAt) : 'Approved'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-slate-500 font-medium">Approved Deliverables</p>
              <p className="font-semibold text-slate-900">
                {documents.length} verified item{documents.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Documents & Deliverables Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Verified Deliverables & Final Documentation
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {documents.length} document{documents.length === 1 ? '' : 's'} available
          </span>
        </div>

        {documents.length === 0 ? (
          <Card className="bg-white border border-slate-200 text-center py-12 px-4 rounded-2xl">
            <CardContent className="space-y-3 max-w-sm mx-auto">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                No Documents Published Yet
              </h3>
              <p className="text-xs text-slate-500">
                All deliverables for this project are currently undergoing final administrative
                verification and will be made available for download shortly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                        {doc.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold uppercase tracking-wider shrink-0"
                      >
                        {doc.category || 'DELIVERABLE'}
                      </Badge>
                    </div>

                    {doc.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={doc.originalName}>
                        <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{doc.originalName}</span>
                      </div>
                      <span className="font-mono text-slate-600 shrink-0">
                        {formatFileSize(doc.fileSize)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Approved {doc.approvedForClientAt ? formatDate(doc.approvedForClientAt) : ''}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={downloadingDocId === doc.id}
                        onClick={() => handleDownload(doc)}
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 text-xs h-8 px-3 font-semibold"
                        aria-label={`Download ${doc.title}`}
                      >
                        <Download
                          className={`w-3.5 h-3.5 mr-1.5 ${
                            downloadingDocId === doc.id ? 'animate-bounce' : ''
                          }`}
                        />
                        {downloadingDocId === doc.id ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>

                    {/* Client Feedback Section */}
                    {(() => {
                      const fb = feedbackMap[doc.id] || { currentStatus: 'PENDING_REVIEW' }
                      const isAccepted = fb.currentStatus === 'ACCEPTED'
                      const isRevision = fb.currentStatus === 'REVISION_REQUESTED'

                      return (
                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              Client Review:
                            </span>

                            {isAccepted ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Accepted
                              </Badge>
                            ) : isRevision ? (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Revision Requested
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-600 border-slate-200 text-[11px] font-semibold"
                              >
                                Pending Review
                              </Badge>
                            )}
                          </div>

                          {fb.latestFeedback?.notes && (
                            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                                Your Feedback Notes:
                              </p>
                              <p className="line-clamp-2 leading-relaxed italic">
                                &ldquo;{fb.latestFeedback.notes}&rdquo;
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setFeedbackModal({
                                  isOpen: true,
                                  type: 'revision',
                                  document: doc,
                                })
                              }
                              className="text-xs h-7 px-2.5 border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200"
                            >
                              Request Revision
                            </Button>

                            {!isAccepted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setFeedbackModal({
                                    isOpen: true,
                                    type: 'accept',
                                    document: doc,
                                  })
                                }
                                className="text-xs h-7 px-2.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                Accept
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Client Feedback Action Modal */}
      {feedbackModal.document && (
        <ClientFeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() =>
            setFeedbackModal((prev) => ({ ...prev, isOpen: false, document: null }))
          }
          onSuccess={fetchData}
          projectId={projectId}
          document={feedbackModal.document}
          type={feedbackModal.type}
        />
      )}
    </div>
  )
}
