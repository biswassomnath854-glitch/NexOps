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
    TODO: <Badge variant="neutral">To Do</Badge>,
    IN_PROGRESS: <Badge variant="primary">In Progress</Badge>,
    COMPLETED: <Badge variant="success">Completed</Badge>,
    BLOCKED: <Badge variant="danger">Blocked</Badge>,
    CANCELLED: <Badge variant="neutral">Cancelled</Badge>,
  }

  return (
    <Card>
      <CardHeader
        action={
          <Link to={ROUTES.TASKS}>
            <Button variant="ghost" size="xs" rightIcon={ArrowRight}>
              View All Tasks
            </Button>
          </Link>
        }
      >
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600" />
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
              <TableHead>Task Title</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead align="right">Actions</TableHead>
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

                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'

                return (
                  <TableRow key={task.id} isClickable>
                    <TableCell className="font-semibold text-slate-900 max-w-xs truncate">
                      {task.title}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {assigneeName}
                    </TableCell>
                    <TableCell>
                      {priorityBadges[task.priority] || <Badge variant="neutral">{task.priority}</Badge>}
                    </TableCell>
                    <TableCell>
                      {statusBadges[task.status] || <Badge variant="neutral">{task.status}</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        {isOverdue && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <Link to={ROUTES.TASKS}>
                        <Button variant="ghost" size="xs">
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
