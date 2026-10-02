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
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Task actions menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white shadow-xl border border-slate-200/90 py-1 z-30 animate-in fade-in zoom-in-95">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onView(task)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>View Details</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onEdit(task)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Task</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onChangeStatus(task)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Status</span>
              </button>
            </>
          )}

          {canDelete && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onDelete(task)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Task</span>
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
      <TableCell className="py-3 px-4">
        <div className="space-y-1.5">
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse" />
        </div>
      </TableCell>
      <TableCell className="py-3 px-4"><div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse" /></TableCell>
      <TableCell className="py-3 px-4"><div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" /></TableCell>
      <TableCell className="py-3 px-4"><div className="h-5 w-28 bg-slate-100 rounded animate-pulse" /></TableCell>
      <TableCell className="py-3 px-4"><div className="h-4 w-24 bg-slate-100 rounded animate-pulse" /></TableCell>
      <TableCell className="py-3 px-4"><div className="h-4 w-16 bg-slate-100 rounded animate-pulse" /></TableCell>
      <TableCell align="right" className="py-3 px-4"><div className="h-7 w-7 bg-slate-100 rounded-lg animate-pulse ml-auto" /></TableCell>
    </TableRow>
  )
}

/**
 * TaskTable — Professional operational table with pagination, hierarchy, and actions.
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

  const resolveCanEdit = (task) => {
    if (typeof canEdit === 'function') {
      return canEdit(task)
    }
    return Boolean(canEdit)
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Task
              </TableHead>
              <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Priority
              </TableHead>
              <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Assignee
              </TableHead>
              <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Target Deadline
              </TableHead>
              <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead align="right" className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TaskSkeletonRow key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-2xs">
        <EmptyState
          icon={ClipboardList}
          title="No Tasks Found"
          description="No tasks match your current criteria. Try adjusting filters or create a new task."
        />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Task
            </TableHead>
            <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </TableHead>
            <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Priority
            </TableHead>
            <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Assignee
            </TableHead>
            <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Target Deadline
            </TableHead>
            <TableHead className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Created
            </TableHead>
            <TableHead align="right" className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const userCanEdit = resolveCanEdit(task)

            return (
              <TableRow
                key={task.id}
                className="group hover:bg-slate-50/70 transition-colors"
              >
                {/* Task Title & Project Code */}
                <TableCell className="py-3 px-4">
                  <div className="min-w-0 max-w-xs sm:max-w-md">
                    <div className="flex items-center gap-2">
                      {task.project && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {task.project.code}
                        </span>
                      )}
                      {task.workstream && (
                        <span className="font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
                          {task.workstream.name}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleView(task)}
                        className="font-semibold text-slate-900 group-hover:text-[#635BFF] transition-colors text-left text-xs sm:text-sm leading-snug truncate block cursor-pointer"
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5 font-normal">
                        {task.description}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell className="py-3 px-4">
                  <TaskStatusBadge status={task.status} size="sm" />
                </TableCell>

                {/* Priority */}
                <TableCell className="py-3 px-4">
                  <TaskPriorityBadge priority={task.priority} size="sm" showIcon />
                </TableCell>

                {/* Assignee */}
                <TableCell className="py-3 px-4">
                  <TaskAssignee assignee={task.assignee} size="sm" />
                </TableCell>

                {/* Due Date */}
                <TableCell className="py-3 px-4">
                  <DueDateIndicator
                    dueDate={task.dueDate}
                    deadline={task.deadline}
                  />
                </TableCell>

                {/* Created */}
                <TableCell className="py-3 px-4">
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDate(task.createdAt)}
                  </span>
                </TableCell>

                {/* Actions */}
                <TableCell align="right" className="py-3 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleView(task)}
                      className="hidden sm:inline-flex h-7 px-2 text-slate-500 hover:text-slate-900 text-xs"
                      title="View task details"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>View</span>
                    </Button>

                    {userCanEdit && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEdit(task)}
                        className="hidden sm:inline-flex h-7 px-2 text-slate-500 hover:text-[#635BFF] text-xs"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <TaskActionMenu
                      task={task}
                      canEdit={userCanEdit}
                      canDelete={canDelete}
                      onView={handleView}
                      onEdit={onEdit}
                      onChangeStatus={onChangeStatus}
                      onDelete={onDelete}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
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
