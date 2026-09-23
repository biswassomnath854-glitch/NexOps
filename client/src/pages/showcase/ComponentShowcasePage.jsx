import { useState } from 'react'
import {
  Sparkles,
  Plus,
  Search,
  Mail,
  ExternalLink,
  Database,
} from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/forms/Input'
import { Select } from '@/components/forms/Select'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table'
import { Spinner, Skeleton } from '@/components/feedback/Loading'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { API_CONFIG } from '@/constants/api'
import { ROUTES } from '@/constants/routes'

export function ComponentShowcasePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalSize, setModalSize] = useState('md')
  const [buttonLoading, setButtonLoading] = useState(false)
  const [showErrorState, setShowErrorState] = useState(false)
  const [showEmptyTable, setShowEmptyTable] = useState(false)

  // Interactive Form Inputs State
  const [demoInput, setDemoInput] = useState('Production workspace query')
  const [inputError, setInputError] = useState('')
  const [demoSelect, setDemoSelect] = useState('MEDIUM')

  const sampleCorporateRecords = [
    {
      id: 'TASK-101',
      title: 'Configure automated notification scheduler',
      assignee: 'Alex Chen',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: 'Oct 28, 2026',
    },
    {
      id: 'TASK-102',
      title: 'Audit RBAC middleware permissions',
      assignee: 'Sarah Miller',
      priority: 'URGENT',
      status: 'TODO',
      dueDate: 'Nov 02, 2026',
    },
    {
      id: 'TASK-103',
      title: 'Database connection pool optimization',
      assignee: 'David Kim',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: 'Oct 15, 2026',
    },
  ]

  const priorityBadges = {
    LOW: <Badge variant="neutral" dot size="sm">Low</Badge>,
    MEDIUM: <Badge variant="info" dot size="sm">Medium</Badge>,
    HIGH: <Badge variant="warning" dot size="sm">High</Badge>,
    URGENT: <Badge variant="danger" dot size="sm">Urgent</Badge>,
  }

  const statusBadges = {
    TODO: <Badge variant="neutral">Todo</Badge>,
    IN_PROGRESS: <Badge variant="primary">In Progress</Badge>,
    COMPLETED: <Badge variant="success">Completed</Badge>,
    BLOCKED: <Badge variant="danger">Blocked</Badge>,
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Foundation Design System & Component Showcase"
        description="Division 01 interactive library showcasing reusable components, design tokens, responsive typography, and configured Axios API client."
        breadcrumbs={[
          { label: 'Workspace', href: ROUTES.DASHBOARD },
          { label: 'UI Showcase' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setButtonLoading(!buttonLoading)}
            >
              Toggle Loading ({buttonLoading ? 'ON' : 'OFF'})
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Sparkles}
              onClick={() => {
                setModalSize('md')
                setIsModalOpen(true)
              }}
            >
              Open Modal Dialog
            </Button>
          </div>
        }
      />

      {/* Architecture & Environment Diagnostics Banner */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-violet-50/40">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  NexOps API Client Foundation Active
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Base URL:{' '}
                  <code className="font-mono px-1.5 py-0.5 rounded bg-slate-200/70 text-indigo-700 text-xs font-semibold">
                    {API_CONFIG.BASE_URL}
                  </code>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" dot size="md">
                Axios Interceptors Active
              </Badge>
              <Badge variant="primary" dot size="md">
                Tailwind v4 Configured
              </Badge>
              <Badge variant="neutral" size="md">
                React 19 Compatible
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 1: Buttons */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-900">1. Reusable Buttons</h2>
          <p className="text-xs text-slate-500">
            Semantic variants, sizes, icon slots, loading spinners, and disabled states.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Button Variants & States</CardTitle>
            <CardDescription>Interactive buttons styled with corporate SaaS aesthetics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Color Variants
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" isLoading={buttonLoading}>Primary Action</Button>
                <Button variant="secondary" isLoading={buttonLoading}>Secondary</Button>
                <Button variant="outline" isLoading={buttonLoading}>Outline</Button>
                <Button variant="ghost" isLoading={buttonLoading}>Ghost</Button>
                <Button variant="danger" isLoading={buttonLoading}>Danger</Button>
                <Button variant="success" isLoading={buttonLoading}>Success</Button>
                <Button variant="primary" disabled>Disabled State</Button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Button Sizes & Icons
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs" leftIcon={Plus}>Extra Small</Button>
                <Button size="sm" leftIcon={Mail}>Small Button</Button>
                <Button size="md" rightIcon={ExternalLink}>Medium Default</Button>
                <Button size="lg" leftIcon={Sparkles}>Large Button</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 2: Form Controls */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-900">2. Form Controls (Input & Select)</h2>
          <p className="text-xs text-slate-500">
            Floating labels, error validations, start/end icons, and select dropdowns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Input Fields</CardTitle>
              <CardDescription>Standardized text fields with validation states.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Workspace Task Title"
                placeholder="e.g. Implement OAuth2 Refresh Strategy"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                helperText="Provide a descriptive title for this corporate task."
                required
              />

              <Input
                label="Search Keywords"
                placeholder="Search across all projects..."
                leftIcon={Search}
              />

              <div>
                <Input
                  label="Field with Validation Error"
                  placeholder="Enter required token"
                  value={inputError}
                  onChange={(e) => setInputError(e.target.value)}
                  error={inputError ? '' : 'This field is required by enterprise compliance.'}
                  helperText="Type anything to clear the validation error."
                  required
                />
              </div>

              <Input
                label="Disabled Input"
                placeholder="Read-only organization ID"
                value="ORG-UUID-8492-9182"
                disabled
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Dropdowns</CardTitle>
              <CardDescription>Stylized native select components with indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Task Priority"
                value={demoSelect}
                onChange={(e) => setDemoSelect(e.target.value)}
                options={[
                  { label: 'Low Priority', value: 'LOW' },
                  { label: 'Medium Priority', value: 'MEDIUM' },
                  { label: 'High Priority', value: 'HIGH' },
                  { label: 'Urgent Critical', value: 'URGENT' },
                ]}
                helperText="Priorities dictate automation alert urgency."
                required
              />

              <Select
                label="Department Assignment"
                options={[
                  { label: 'Engineering & Infrastructure', value: 'eng' },
                  { label: 'Product Operations', value: 'prod' },
                  { label: 'Quality Assurance', value: 'qa' },
                  { label: 'Security & Compliance', value: 'sec' },
                ]}
              />

              <Select
                label="Select with Error State"
                error="Please select an active department"
                options={[{ label: 'None Selected', value: '' }]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: Badges & Status Indicators */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-bold text-slate-900">3. Status Badges & Pills</h2>
          <p className="text-xs text-slate-500">
            Semantic color schemes for status, roles, and priority indicators.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Standard Badges
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="neutral">Neutral Slate</Badge>
                <Badge variant="primary">Primary Indigo</Badge>
                <Badge variant="success">Active Success</Badge>
                <Badge variant="warning">Warning Pending</Badge>
                <Badge variant="danger">Blocked / Danger</Badge>
                <Badge variant="info">Info Notice</Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Dot Status Badges
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="neutral" dot>Offline</Badge>
                <Badge variant="primary" dot>Synchronizing</Badge>
                <Badge variant="success" dot>Operational</Badge>
                <Badge variant="warning" dot>High Load</Badge>
                <Badge variant="danger" dot>Incident Reported</Badge>
                <Badge variant="info" dot>Maintenance</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: Corporate Data Table */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">4. Corporate Data Table</h2>
            <p className="text-xs text-slate-500">
              Clean tabular structure with header, hover rows, and empty fallback state.
            </p>
          </div>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowEmptyTable(!showEmptyTable)}
          >
            {showEmptyTable ? 'Show Data Rows' : 'Show Empty Table State'}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Identifier</TableHead>
              <TableHead>Title & Overview</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showEmptyTable ? (
              <TableEmpty colSpan={7} message="No corporate tasks currently assigned to this view." />
            ) : (
              sampleCorporateRecords.map((task) => (
                <TableRow key={task.id} isClickable>
                  <TableCell>
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {task.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {task.assignee.charAt(0)}
                      </div>
                      <span className="text-xs">{task.assignee}</span>
                    </div>
                  </TableCell>
                  <TableCell>{priorityBadges[task.priority]}</TableCell>
                  <TableCell>{statusBadges[task.status]}</TableCell>
                  <TableCell className="text-xs text-slate-500">{task.dueDate}</TableCell>
                  <TableCell align="right">
                    <Button variant="ghost" size="xs">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* SECTION 5: Feedback Components (Loading, EmptyState, ErrorState) */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">5. Feedback & State Handlers</h2>
            <p className="text-xs text-slate-500">
              Loading spinners, shimmering skeletons, empty state illustrations, and error fallbacks.
            </p>
          </div>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setShowErrorState(!showErrorState)}
          >
            {showErrorState ? 'Show Empty State' : 'Show Error State'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skeletons & Spinners */}
          <Card>
            <CardHeader>
              <CardTitle>Spinners & Skeleton Loaders</CardTitle>
              <CardDescription>Smooth placeholders for asynchronous operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Spinner Sizes
                </p>
                <div className="flex items-center gap-6">
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                  <Spinner size="xl" />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Skeleton Placeholders
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empty / Error State */}
          <Card>
            <CardHeader>
              <CardTitle>Empty & Error State Handlers</CardTitle>
              <CardDescription>Clear feedback when data is empty or failures occur.</CardDescription>
            </CardHeader>
            <CardContent>
              {showErrorState ? (
                <ErrorState
                  title="Failed to Synchronize Task Board"
                  message="The NexOps server returned a 503 Service Unavailable response while attempting to query the task stream."
                  onRetry={() => setShowErrorState(false)}
                  retryLabel="Retry Synchronization"
                />
              ) : (
                <EmptyState
                  title="No Projects in Current Workspace"
                  description="Your organization has not created any project spaces yet. Begin by initializing your first project repository."
                  action={
                    <Button variant="primary" size="sm" leftIcon={Plus}>
                      Create Initial Project
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 6: Interactive Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size={modalSize}
        title="Corporate Confirmation Dialog"
        description="Verify this administrative action before committing changes to the enterprise ledger."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                alert('Modal action executed successfully!')
                setIsModalOpen(false)
              }}
            >
              Confirm Action
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            This reusable Modal component supports backdrop blur, keyboard ESC dismissal,
            outside-click dismissal, custom sizes (<code className="font-mono text-xs">sm</code>,{' '}
            <code className="font-mono text-xs">md</code>,{' '}
            <code className="font-mono text-xs">lg</code>,{' '}
            <code className="font-mono text-xs">xl</code>), and flexible body/footer slots.
          </p>
          <div className="flex gap-2">
            <Button size="xs" variant="outline" onClick={() => setModalSize('sm')}>
              Small
            </Button>
            <Button size="xs" variant="outline" onClick={() => setModalSize('md')}>
              Medium
            </Button>
            <Button size="xs" variant="outline" onClick={() => setModalSize('lg')}>
              Large
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
