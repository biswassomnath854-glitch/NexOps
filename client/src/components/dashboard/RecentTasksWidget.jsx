import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CheckSquare, AlertOctagon, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { formatDate } from '@/utils/formatters'

export function RecentTasksWidget({ tasks = [], title = 'High Priority & Overdue Tasks' }) {
  const priorityBadges = {
    LOW: <Badge variant="neutral" dot size="sm">Low</Badge>,
    MEDIUM: <Badge variant="info" dot size="sm">Medium</Badge>,
    HIGH: <Badge variant="warning" dot size="sm">High</Badge>,
    URGENT: <Badge variant="danger" dot size="sm">Urgent</Badge>,
  }

  const statusBadges = {
    TODO: <Badge variant="neutral" size="sm">To Do</Badge>,
    IN_PROGRESS: <Badge variant="primary" size="sm">In Progress</Badge>,
    COMPLETED: <Badge variant="success" size="sm">Completed</Badge>,
    BLOCKED: <Badge variant="danger" size="sm">Blocked</Badge>,
    CANCELLED: <Badge variant="neutral" size="sm">Cancelled</Badge>,
  }

  return (
    <Card className="shadow-2xs">
      <CardHeader
        action={
          <Link to={ROUTES.TASKS}>
            <Button variant="ghost" size="xs" rightIcon={ArrowRight} className="text-xs">
              View All Tasks
            </Button>
          </Link>
        }
      >
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-[#635BFF]" />
          {title}
        </CardTitle>
        <CardDescription>
          Actionable sprint items requiring review or delivery.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Table containerClassName="border-0 shadow-none rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead className="py-2.5 px-3.5 sm:px-4 text-[11px] font-semibold text-slate-500">
                Task Title
              </TableHead>
              <TableHead className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold text-slate-500">
                Assignee
              </TableHead>
              <TableHead className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold text-slate-500">
                Priority
              </TableHead>
              <TableHead className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold text-slate-500">
                Status
              </TableHead>
              <TableHead className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold text-slate-500">
                Target Deadline
              </TableHead>
              <TableHead align="right" className="py-2.5 px-3 sm:px-4 text-[11px] font-semibold text-slate-500">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message="No overdue or pending critical tasks found. Workspace is up to date!"
              />
            ) : (
              tasks.slice(0, 5).map((task) => {
                const assigneeName = task.assigneeUser
                  ? `${task.assigneeUser.firstName || ''} ${task.assigneeUser.lastName || ''}`.trim()
                  : task.assignedTo
                  ? 'Assigned Member'
                  : 'Unassigned'

                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  task.status !== 'COMPLETED'

                return (
                  <TableRow
                    key={task.id}
                    isClickable
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <TableCell className="py-2.5 px-3.5 sm:px-4 font-medium text-slate-900 max-w-[200px] sm:max-w-xs truncate text-xs">
                      <span title={task.title}>{task.title}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 sm:px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {assigneeName.charAt(0) || 'U'}
                        </span>
                        <span className="truncate">{assigneeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 sm:px-4">
                      {priorityBadges[task.priority] || (
                        <Badge variant="neutral" size="sm">{task.priority}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 sm:px-4">
                      {statusBadges[task.status] || (
                        <Badge variant="neutral" size="sm">{task.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 px-3 sm:px-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        {isOverdue && (
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span
                          className={
                            isOverdue
                              ? 'text-rose-700 font-semibold'
                              : 'text-slate-500 font-medium'
                          }
                        >
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="right" className="py-2.5 px-3 sm:px-4">
                      <Link to={task.id ? ROUTES.TASK_DETAILS(task.id) : ROUTES.TASKS}>
                        <Button variant="ghost" size="xs" className="h-7 px-2.5 text-xs">
                          Open
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
