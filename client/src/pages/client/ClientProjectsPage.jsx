import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  FileCheck,
  Calendar,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { clientApi } from '@/api/endpoints/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'

export function ClientProjectsPage() {
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await clientApi.getProjects()
      setProjects(response.data?.projects || [])
    } catch (err) {
      console.error('Failed to fetch client projects:', err)
      setError(
        err.message || 'Unable to load your approved projects. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects
    const q = searchQuery.toLowerCase().trim()
    return projects.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [projects, searchQuery])

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <FolderKanban className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Approved Client Projects
              </h1>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl">
              Access verified project scopes, approved deliverables, and final
              documentation for all initiatives completed and published by SB Pvt. Ltd.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              disabled={isLoading}
              className="text-slate-700"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {projects.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name or code..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <span className="text-xs text-slate-500">
                Found {filteredProjects.length} of {projects.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-white border border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-16 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState
          title="Failed to Load Projects"
          message={error}
          onRetry={fetchProjects}
        />
      )}

      {/* Empty State: No Projects In Entire Org */}
      {!isLoading && !error && projects.length === 0 && (
        <Card className="bg-white border-dashed border-2 border-slate-200 text-center py-16 px-4">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              No Approved Projects Available
            </h2>
            <p className="text-sm text-slate-500">
              Your organization currently has no published projects. Once our team
              completes work and final administrative approval is granted, verified
              deliverables will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty State: Search Query Mismatch */}
      {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
        <Card className="bg-white border border-slate-200 text-center py-12 px-4 rounded-2xl">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No Matching Projects Found
            </h3>
            <p className="text-xs text-slate-500">
              No approved projects matched your search for &ldquo;{searchQuery}&rdquo;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs mt-2"
            >
              Clear Search Query
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="bg-white border border-slate-200/90 rounded-2xl hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
            >
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-xs font-semibold px-2 py-0.5"
                    >
                      {project.code}
                    </Badge>
                    <Badge
                      variant="success"
                      className="text-[11px] font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Approved &amp; Published
                    </Badge>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </h2>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {project.description ||
                      'No formal project description provided for this approved scope.'}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {project.publishedAt
                          ? `Published ${formatDate(project.publishedAt)}`
                          : 'Approved'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-medium text-slate-700">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{project.approvedDeliverablesCount || 0} Deliverables</span>
                    </div>
                  </div>

                  <Link
                    to={ROUTES.CLIENT_PROJECT_DETAILS(project.id)}
                    className="block"
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs group-hover:shadow transition-all"
                    >
                      View Project Deliverables
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
