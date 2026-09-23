import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskAssignee } from './TaskAssignee'
import { DueDateIndicator } from './DueDateIndicator'
import { Pagination } from '@/components/common/Pagination'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'
import {
  ClipboardList,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
} from 'lucide-react'

function TaskActionMenu({ task, canEdit, canDelete, onView, onEdit, onChangeStatus, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Task actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white shadow-xl border border-slate-200/80 py-1.5 z-20 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => { setIsOpen(false); onView(task) }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            View Details
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => { setIsOpen(false); onEdit(task) }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                Edit Task
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); onChangeStatus(task) }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                Change Status
              </button>
            </>
          )}

          {canDelete && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => { setIsOpen(false); onDelete(task) }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Delete Task
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Skeleton row for loading state */
function TaskSkeletonRow() {
  return (
    <TableRow>
      <TableCell><div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" /></TableCell>
      <TableCell><div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-28 bg-slate-100 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
      <TableCell><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></TableCell>
      <TableCell align="right"><div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse ml-auto" /></TableCell>
    </TableRow>
  )
}

/**
 * TaskTable — Full task list with pagination and action menus.
 *
 * canEdit   — true if current user can edit tasks (management or creator/assignee, non-viewer)
 * canDelete — true if current user is management
 */
export function TaskTable({
  tasks = [],
  isLoading = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onView,
  onEdit,
  onChangeStatus,
  onDelete,
  canEdit = false,
  canDelete = false,
}) {
  const navigate = useNavigate()

  const handleView = (task) => {
    if (onView) {
      onView(task)
    } else {
      navigate(ROUTES.TASK_DETAILS(task.id))
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => <TaskSkeletonRow key={i} />)}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <EmptyState
          icon={ClipboardList}
          title="No Tasks Found"
          description="No tasks match your current filters. Try adjusting search criteria or create a new task."
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="group">
              {/* Title + description */}
              <TableCell>
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors"
                  >
                    <ClipboardList className="w-3.5 h-3.5 text-indigo-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleView(task)}
                      className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-left text-sm leading-snug truncate block max-w-[280px]"
                    >
                      {task.title}
                    </button>
                    {task.description && (
                      <p className="text-xs text-slate-400 truncate max-w-[280px] mt-0.5">
                        {task.description}
                      </p>
                    )}
                    {task.project && (
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5">
                        {task.project.code}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Status */}
              <TableCell>
                <TaskStatusBadge status={task.status} />
              </TableCell>

              {/* Priority */}
              <TableCell>
                <TaskPriorityBadge priority={task.priority} />
              </TableCell>

              {/* Assignee */}
              <TableCell>
                <TaskAssignee assignee={task.assignee} size="sm" />
              </TableCell>

              {/* Due Date */}
              <TableCell>
                <DueDateIndicator
                  dueDate={task.dueDate}
                  deadline={task.deadline}
                />
              </TableCell>

              {/* Created */}
              <TableCell>
                <span className="text-xs text-slate-400 font-mono">{formatDate(task.createdAt)}</span>
              </TableCell>

              {/* Actions */}
              <TableCell align="right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(task)}
                    className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-slate-800"
                    title="View task"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(task)}
                      className="hidden sm:inline-flex p-1.5 h-8 text-slate-500 hover:text-indigo-600"
                      title="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <TaskActionMenu
                    task={task}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onView={handleView}
                    onEdit={onEdit}
                    onChangeStatus={onChangeStatus}
                    onDelete={onDelete}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
