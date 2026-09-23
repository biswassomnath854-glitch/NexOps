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
import { formatDate, formatDateTime } from '@/utils/formatters'
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
  LayoutDashboard,
} from 'lucide-react'

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

/**
 * TaskDetails — Full read-only detail view of a task.
 * Shows all fields, creator, assignee, project, deadline metadata, completion info,
 * and integrated collaboration features (Comments, Activity timeline, and Attachments).
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
  const [activeTab, setActiveTab] = useState('overview')

  if (!task) return null

  const isCompleted = task.status === 'COMPLETED'
  const isCancelled = task.status === 'CANCELLED'

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'activity', label: 'Activity', icon: History },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header card */}
      <Card className="border-slate-200/80">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Project context */}
              {task.project && (
                <div className="flex items-center gap-1.5 mb-2">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs text-indigo-600 font-semibold">{task.project.name}</span>
                  <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded px-1.5 py-0.5">
                    {task.project.code}
                  </span>
                </div>
              )}

              <h1 className="text-xl font-bold text-slate-900 leading-snug">
                {task.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                {task.deadline?.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1">
                    Overdue
                  </span>
                )}
                {task.deadline?.isDueToday && !task.deadline?.isOverdue && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                    Due Today
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onChangeStatus}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Change Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-150">
          {/* Metadata card */}
          <Card className="border-slate-200/80">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Task Details
              </h3>

              <div className="divide-y divide-slate-100">
                <DetailRow icon={Hash} label="Task ID">
                  <span className="font-mono text-xs text-slate-500">{task.id}</span>
                </DetailRow>

                <DetailRow icon={User} label="Assignee">
                  <TaskAssignee assignee={task.assignee} />
                </DetailRow>

                <DetailRow icon={User} label="Created By">
                  <TaskAssignee assignee={task.creator} />
                </DetailRow>

                <DetailRow icon={Calendar} label="Due Date">
                  {task.dueDate ? (
                    <DueDateIndicator dueDate={task.dueDate} deadline={task.deadline} />
                  ) : (
                    <span className="text-xs text-slate-400">No due date set</span>
                  )}
                </DetailRow>

                <DetailRow icon={Clock} label="Created At">
                  <span className="text-xs text-slate-600">{formatDateTime(task.createdAt)}</span>
                </DetailRow>

                <DetailRow icon={Clock} label="Last Updated">
                  <span className="text-xs text-slate-600">{formatDateTime(task.updatedAt)}</span>
                </DetailRow>
              </div>
            </CardContent>
          </Card>

          {/* Completion / deadline info card */}
          <Card className="border-slate-200/80">
            <CardContent className="p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completion & Deadline
              </h3>

              <div className="divide-y divide-slate-100">
                {isCompleted && task.completedAt && (
                  <DetailRow icon={CheckCircle2} label="Completed At">
                    <span className="text-xs text-emerald-600 font-semibold">{formatDateTime(task.completedAt)}</span>
                  </DetailRow>
                )}

                {isCancelled && (
                  <DetailRow icon={Info} label="Status">
                    <span className="text-xs text-slate-500">This task has been cancelled.</span>
                  </DetailRow>
                )}

                {!isCompleted && !isCancelled && task.deadline && (
                  <DetailRow icon={Calendar} label="Deadline Status">
                    {task.deadline.isOverdue ? (
                      <span className="text-xs font-semibold text-rose-600">
                        Overdue by {Math.abs(task.deadline.daysUntilDue)}d
                      </span>
                    ) : task.deadline.isDueToday ? (
                      <span className="text-xs font-semibold text-amber-700">Due today</span>
                    ) : task.deadline.isDueSoon ? (
                      <span className="text-xs font-semibold text-amber-600">
                        Due in {task.deadline.daysUntilDue} day(s)
                      </span>
                    ) : task.deadline.daysUntilDue !== null ? (
                      <span className="text-xs text-slate-600">
                        {task.deadline.daysUntilDue} days remaining
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </DetailRow>
                )}

                {!task.dueDate && (
                  <div className="py-6 text-center">
                    <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No deadline has been set for this task.</p>
                  </div>
                )}

                {/* Project info */}
                {task.project && (
                  <DetailRow icon={FolderKanban} label="Project">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-700 font-semibold">{task.project.name}</span>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded px-1 py-0.5">
                        {task.project.code}
                      </span>
                    </div>
                  </DetailRow>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comments Tab Panel */}
      {activeTab === 'comments' && (
        <Card className="border-slate-200/80">
          <CardContent className="p-6">
            <CommentList
              taskId={task.id}
              currentUser={currentUser}
              isManagement={isManagement}
              isViewer={isViewer}
            />
          </CardContent>
        </Card>
      )}

      {/* Activity Tab Panel */}
      {activeTab === 'activity' && (
        <Card className="border-slate-200/80">
          <CardContent className="p-6">
            <ActivityTimeline taskId={task.id} />
          </CardContent>
        </Card>
      )}

      {/* Attachments Tab Panel */}
      {activeTab === 'attachments' && (
        <Card className="border-slate-200/80">
          <CardContent className="p-6">
            <AttachmentList
              taskId={task.id}
              currentUser={currentUser}
              isManagement={isManagement}
              isViewer={isViewer}
              canUpdate={canEdit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
