import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { WorkstreamModal } from './WorkstreamModal'
import { WorkstreamMembersModal } from './WorkstreamMembersModal'
import {
  Layers,
  Plus,
  Users,
  Edit2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

export function WorkstreamList({
  projectId,
  workstreams = [],
  availableMembers = [],
  isManagement = false,
  isViewer = false,
  onWorkstreamsChange,
  onSelectWorkstreamTasks,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWorkstream, setEditingWorkstream] = useState(null)
  const [membersModalWorkstream, setMembersModalWorkstream] = useState(null)

  const handleCreate = () => {
    setEditingWorkstream(null)
    setModalOpen(true)
  }

  const handleEdit = (ws) => {
    setEditingWorkstream(ws)
    setModalOpen(true)
  }

  const handleManageMembers = (ws) => {
    setMembersModalWorkstream(ws)
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Project Workstreams ({workstreams.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Functional teams and work areas dividing project execution
          </p>
        </div>

        {isManagement && !isViewer && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            leftIcon={Plus}
            className="text-xs font-semibold shadow-xs"
          >
            Create Workstream
          </Button>
        )}
      </div>

      {/* Grid of Workstreams */}
      {workstreams.length === 0 ? (
        <Card className="text-center p-10 border-dashed border-slate-200 bg-slate-50/50">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No workstreams yet</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
            Divide this project into functional workstreams such as UI/UX, Frontend, Backend, or QA.
          </p>
          {isManagement && !isViewer && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleCreate}
              leftIcon={Plus}
              className="mt-4 text-xs"
            >
              Add First Workstream
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workstreams.map((ws) => {
            const metrics = ws.metrics || {
              total: 0,
              completed: 0,
              inProgress: 0,
              blocked: 0,
              completionPercentage: 0,
            }
            const membersCount = ws.membersCount || ws.members?.length || 0

            return (
              <Card
                key={ws.id}
                className="border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Top line: Name, Code & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {ws.name}
                          </h4>
                          {ws.code && (
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                              {ws.code}
                            </span>
                          )}
                        </div>
                        {ws.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {ws.description}
                          </p>
                        )}
                      </div>

                      <Badge
                        variant={ws.status === 'COMPLETED' ? 'success' : ws.status === 'ARCHIVED' ? 'neutral' : 'primary'}
                        size="sm"
                      >
                        {ws.status}
                      </Badge>
                    </div>

                    {/* Lead & Member Summary */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate">
                        Lead:{' '}
                        {ws.lead ? (
                          <strong className="text-slate-800 font-semibold">
                            {ws.lead.firstName} {ws.lead.lastName}
                          </strong>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleManageMembers(ws)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        <Users className="w-3 h-3" />
                        <span>{membersCount} {membersCount === 1 ? 'member' : 'members'}</span>
                      </button>
                    </div>

                    {/* Progress Bar & Task Counts */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-semibold text-slate-800">
                          {metrics.completed} / {metrics.total} ({metrics.completionPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${metrics.completionPercentage}%` }}
                        />
                      </div>

                      {metrics.blocked > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-rose-600 font-semibold pt-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{metrics.blocked} task(s) currently blocked</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {onSelectWorkstreamTasks ? (
                      <button
                        type="button"
                        onClick={() => onSelectWorkstreamTasks(ws.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>View Tasks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div />
                    )}

                    {isManagement && !isViewer && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleEdit(ws)}
                          className="text-xs text-slate-500 hover:text-slate-800 p-1"
                          title="Edit workstream"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Workstream Modal Dialog */}
      <WorkstreamModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        workstream={editingWorkstream}
        availableMembers={availableMembers}
        onSuccess={onWorkstreamsChange}
      />

      {/* Workstream Members Modal */}
      {membersModalWorkstream && (
        <WorkstreamMembersModal
          isOpen={Boolean(membersModalWorkstream)}
          onClose={() => setMembersModalWorkstream(null)}
          workstream={membersModalWorkstream}
          availableProjectMembers={availableMembers}
          isManagement={isManagement}
          onSuccess={onWorkstreamsChange}
        />
      )}
    </div>
  )
}
