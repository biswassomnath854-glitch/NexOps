import { useNavigate } from 'react-router-dom'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskAssignee } from './TaskAssignee'
import { DueDateIndicator } from './DueDateIndicator'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'
import { Eye, Edit2, Trash2, FolderKanban } from 'lucide-react'

/**
 * TaskCard — Card-style task display for grid or compact views.
 */
export function TaskCard({ task, canEdit = false, canDelete = false, onEdit, onDelete, onView }) {
  const navigate = useNavigate()

  const handleView = () => {
    if (onView) onView(task)
    else navigate(ROUTES.TASK_DETAILS(task.id))
  }

  return (
    <div className="group bg-white border border-slate-200/80 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TaskStatusBadge status={task.status} size="sm" />
          <TaskPriorityBadge priority={task.priority} size="sm" showIcon />
        </div>
        {task.deadline?.isOverdue && (
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 shrink-0">
            OVERDUE
          </span>
        )}
      </div>

      {/* Title */}
      <button
        type="button"
        onClick={handleView}
        className="text-left font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2 text-sm"
      >
        {task.title}
      </button>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Project */}
      {task.project && (
        <div className="flex items-center gap-1.5">
          <FolderKanban className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">{task.project.name}</span>
          <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded px-1 py-0.5">
            {task.project.code}
          </span>
        </div>
      )}

      {/* Assignee + Due date */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <TaskAssignee assignee={task.assignee} size="sm" />
        <DueDateIndicator dueDate={task.dueDate} deadline={task.deadline} compact />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleView}
          className="text-xs h-7 px-2.5 text-slate-500 hover:text-indigo-600"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          View
        </Button>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(task)}
            className="text-xs h-7 px-2.5 text-slate-500 hover:text-indigo-600"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(task)}
            className="text-xs h-7 px-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
