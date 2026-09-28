import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskAssignee } from './TaskAssignee'
import { DueDateIndicator } from './DueDateIndicator'
import { CommentList } from './collaboration/CommentList'
import { ActivityTimeline } from './collaboration/ActivityTimeline'
import { AttachmentList } from './collaboration/AttachmentList'
import { formatDateTime } from '@/utils/formatters'
import {
  Edit2,
  Trash2,
  ShieldCheck,
  FolderKanban,
  User,
  Calendar,
  CheckCircle2,
  Info,
  Clock,
  Hash,
  MessageSquare,
  History,
  Paperclip,
  FileText,
} from 'lucide-react'

function SpecificationRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/90 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-xs text-slate-800 leading-normal">{children}</div>
      </div>
    </div>
  )
}

/**
 * TaskDetails — Operational Work Record layout.
 *
 * Displays a unified header, an always-accessible description and collaboration hub
 * on the left, and a persistent operational metadata sidebar on the right.
 */
export function TaskDetails({
  task,
  currentUser,
  isManagement = false,
  isViewer = false,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onChangeStatus,
}) {
  const [activeTab, setActiveTab] = useState('comments')

  if (!task) return null

  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'

  const TABS = [
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'activity', label: 'Activity Timeline', icon: History },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Primary Work Record Header Card */}
      <Card className="border-slate-200/90 shadow-2xs">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Project Context & Code */}
              {task.project && (
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#5148E5] font-semibold">
                    <FolderKanban className="w-3.5 h-3.5 text-[#635BFF]" />
                    <span>{task.project.name}</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5">
                    {task.project.code}
                  </span>
                </div>
              )}

              {/* Task Title */}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                {task.title}
              </h1>

              {/* Status, Priority, and Due Date badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} showIcon />

                {task.deadline?.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-0.5 shadow-2xs">
                    Overdue
                  </span>
                )}

                {task.deadline?.isDueToday && !task.deadline?.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 shadow-2xs">
                    Due Today
                  </span>
                )}
              </div>
            </div>

            {/* Top Action Affordances */}
            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onChangeStatus}
                    className="flex items-center gap-1.5 text-xs h-8 px-3"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#635BFF]" />
                    <span>Change Status</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="flex items-center gap-1.5 text-xs h-8 px-3"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-xs h-8 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Description & Collaboration Hub */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description Card */}
          <Card className="border-slate-200/90 shadow-2xs">
            <CardContent className="p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <FileText className="w-4 h-4 text-[#635BFF]" />
                <span>Description & Deliverable Scope</span>
              </div>

              {task.description ? (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-w-prose">
                  {task.description}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No additional description provided for this deliverable.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Collaboration Tabs Hub */}
          <Card className="border-slate-200/90 shadow-2xs">
            <div className="border-b border-slate-200/80 px-4 sm:px-6 pt-3 bg-slate-50/50">
              <div className="flex items-center gap-1 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'border-[#635BFF] text-[#635BFF] bg-white rounded-t-lg shadow-2xs'
                          : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#635BFF]' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <CardContent className="p-5 sm:p-6">
              {/* Tab 1: Comments */}
              {activeTab === 'comments' && (
                <div className="animate-in fade-in duration-150">
                  <CommentList
                    taskId={task.id}
                    currentUser={currentUser}
                    isManagement={isManagement}
                    isViewer={isViewer}
                  />
                </div>
              )}

              {/* Tab 2: Activity Timeline */}
              {activeTab === 'activity' && (
                <div className="animate-in fade-in duration-150">
                  <ActivityTimeline taskId={task.id} />
                </div>
              )}

              {/* Tab 3: Attachments */}
              {activeTab === 'attachments' && (
                <div className="animate-in fade-in duration-150">
                  <AttachmentList
                    taskId={task.id}
                    currentUser={currentUser}
                    isManagement={isManagement}
                    isViewer={isViewer}
                    canUpdate={canEdit}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Persistent Operational Metadata Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-slate-200/90 shadow-2xs">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#635BFF]" />
                Operational Metadata
              </h3>

              <div className="divide-y divide-slate-100 text-xs">
                {/* Assignee */}
                <SpecificationRow icon={User} label="Primary Owner">
                  <TaskAssignee assignee={task.assignee} />
                </SpecificationRow>

                {/* Target Due Date */}
                <SpecificationRow icon={Calendar} label="Target Deadline">
                  {task.dueDate ? (
                    <DueDateIndicator dueDate={task.dueDate} deadline={task.deadline} />
                  ) : (
                    <span className="text-slate-400">No deadline set</span>
                  )}
                </SpecificationRow>

                {/* Project */}
                {task.project && (
                  <SpecificationRow icon={FolderKanban} label="Project Context">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">{task.project.name}</span>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5">
                        {task.project.code}
                      </span>
                    </div>
                  </SpecificationRow>
                )}

                {/* Created By */}
                <SpecificationRow icon={User} label="Created By">
                  <TaskAssignee assignee={task.creator} />
                </SpecificationRow>

                {/* Created At */}
                <SpecificationRow icon={Clock} label="Creation Date">
                  <span className="text-slate-600 font-mono text-[11px]">
                    {formatDateTime(task.createdAt)}
                  </span>
                </SpecificationRow>

                {/* Last Updated */}
                <SpecificationRow icon={Clock} label="Last Activity">
                  <span className="text-slate-600 font-mono text-[11px]">
                    {formatDateTime(task.updatedAt)}
                  </span>
                </SpecificationRow>

                {/* Completion Timestamp */}
                {isCompleted && task.completedAt && (
                  <SpecificationRow icon={CheckCircle2} label="Resolution Time">
                    <span className="text-emerald-700 font-semibold font-mono text-[11px]">
                      {formatDateTime(task.completedAt)}
                    </span>
                  </SpecificationRow>
                )}

                {/* Cancelled Indicator */}
                {isCancelled && (
                  <SpecificationRow icon={Info} label="State Notice">
                    <span className="text-slate-500 font-medium">Deliverable cancelled</span>
                  </SpecificationRow>
                )}

                {/* Task ID identifier */}
                <SpecificationRow icon={Hash} label="Technical Reference">
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {task.id}
                  </span>
                </SpecificationRow>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
