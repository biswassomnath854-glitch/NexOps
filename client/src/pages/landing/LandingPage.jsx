import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  Briefcase,
  Bell,
  LogIn,
  UserPlus,
  LogOut,
  ChevronRight,
  Menu,
  X,
  AlertOctagon,
  FolderKanban,
  CheckSquare,
  ArrowUpRight,
  Shield,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [previewTab, setPreviewTab] = useState('overview')

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] selection:bg-[#635BFF] selection:text-white font-sans antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/90 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#635BFF] text-white flex items-center justify-center shadow-xs group-hover:bg-[#5148E5] transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Nex<span className="text-[#635BFF]">Ops</span>
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 border-l border-slate-200 pl-1.5 uppercase tracking-wider font-mono">
                Command Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#preview" className="hover:text-slate-900 transition-colors">
              Command Center
            </a>
            <a href="#editorial" className="hover:text-slate-900 transition-colors">
              The Operational Problem
            </a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">
              Core Capabilities
            </a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">
              Workflow Engine
            </a>
            <a href="#governance" className="hover:text-slate-900 transition-colors">
              RBAC & Governance
            </a>
            <Link to={ROUTES.SHOWCASE} className="text-slate-400 hover:text-slate-700 transition-colors">
              Design System
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Signed in as{' '}
                  <strong className="text-slate-800 font-semibold">
                    {user?.firstName || 'Colleague'}
                  </strong>
                </span>
                <Link to={ROUTES.DASHBOARD}>
                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                    Open Workspace
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-rose-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm" leftIcon={LogIn}>
                    Sign In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Command Center
              </a>
              <a
                href="#editorial"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                The Operational Problem
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Core Capabilities
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                Workflow Engine
              </a>
              <a
                href="#governance"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50"
              >
                RBAC & Governance
              </a>
              <Link
                to={ROUTES.SHOWCASE}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50"
              >
                Design System
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link to={ROUTES.DASHBOARD} className="w-full">
                    <Button variant="primary" size="md" fullWidth rightIcon={ArrowRight}>
                      Open Workspace
                    </Button>
                  </Link>
                  <Button
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={handleLogout}
                    leftIcon={LogOut}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to={ROUTES.LOGIN} className="w-full">
                    <Button variant="secondary" size="md" fullWidth leftIcon={LogIn}>
                      Sign In
                    </Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} className="w-full">
                    <Button variant="primary" size="md" fullWidth rightIcon={ArrowRight}>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#635BFF]" />
            Enterprise Operations Command Center
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-medium">Multi-Tenant RBAC</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            See the work.{' '}
            <span className="text-[#635BFF]">Know who owns it.</span>{' '}
            Move it forward.
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            NexOps gives teams one operational view of projects, tasks, workload, deadlines, and
            activity — so important work doesn't disappear between people, tools, and deadlines.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER}>
              <Button
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                className="w-full sm:w-auto shadow-sm shadow-[#635BFF]/20"
              >
                {isAuthenticated ? 'Go to Command Center' : 'Get Started'}
              </Button>
            </Link>

            <a href="#preview">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore NexOps
              </Button>
            </a>
          </div>

          {/* Operational Signal Strip */}
          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Visibility
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">Single Pane View</p>
              <p className="text-xs text-slate-500 mt-0.5">Tasks, deadlines & projects united</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Ownership
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">Strict Accountability</p>
              <p className="text-xs text-slate-500 mt-0.5">Every ticket has a clear owner</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Execution
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">SLA Protection</p>
              <p className="text-xs text-slate-500 mt-0.5">Automated overdue notifications</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Governance
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">Multi-Tenant RBAC</p>
              <p className="text-xs text-slate-500 mt-0.5">6 fine-grained role tiers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE PRODUCT PREVIEW
          ───────────────────────────────────────────────────────────── */}
      <section id="preview" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="primary" dot size="md">
            Product Walkthrough
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-3">
            The Operational Command Center in Action
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Switch between views to see how NexOps consolidates team capacity, project milestones,
            and task pipelines without context switching.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-center gap-1 p-1 bg-slate-200/70 rounded-xl max-w-md mx-auto mb-6">
          <button
            type="button"
            onClick={() => setPreviewTab('overview')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              previewTab === 'overview'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('tasks')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              previewTab === 'tasks'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Task Board
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('workload')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              previewTab === 'workload'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Team Workload
          </button>
          <button
            type="button"
            onClick={() => setPreviewTab('audit')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              previewTab === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>

        {/* Live-styled Product Frame */}
        <div className="rounded-2xl border border-slate-300/80 bg-white shadow-xl overflow-hidden transition-all">
          {/* Mock Window Top Bar */}
          <div className="px-4 py-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="ml-3 text-xs font-mono text-slate-400 select-none">
                nexops.workspace.local / {previewTab}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Active
              </span>
            </div>
          </div>

          {/* Frame Content Body */}
          <div className="p-6 bg-slate-50/60 min-h-[420px]">
            {previewTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 Mini KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Projects
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">12</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">4 active workspaces</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Task Completion
                    </p>
                    <p className="text-2xl font-extrabold text-[#635BFF] mt-1">78.4%</p>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                      <div className="h-full bg-[#635BFF] w-[78%]" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      In-Progress Tasks
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1">19</p>
                    <p className="text-xs text-sky-600 font-medium mt-1">Sprint commitments</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Overdue Tasks
                    </p>
                    <p className="text-2xl font-extrabold text-rose-600 mt-1">2</p>
                    <p className="text-xs text-rose-600 font-medium mt-1">Requires intervention</p>
                  </div>
                </div>

                {/* Pipeline & Priority Bars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Task Status Pipelines
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                          <span>In Progress (14)</span>
                          <span className="font-mono text-slate-400">48%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#635BFF] w-[48%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                          <span>Completed (10)</span>
                          <span className="font-mono text-slate-400">34%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[34%]" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                          <span>Blocked (2)</span>
                          <span className="font-mono text-slate-400">7%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-rose-500 w-[7%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Deadline Urgency Monitors
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-800">
                        <span className="text-[10px] uppercase font-bold text-rose-500 block">
                          Overdue
                        </span>
                        <span className="text-lg font-extrabold text-rose-700">2 tasks</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-800">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block">
                          Due Today
                        </span>
                        <span className="text-lg font-extrabold text-amber-700">3 tasks</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-800">
                        <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                          Due in 3 Days
                        </span>
                        <span className="text-lg font-extrabold text-indigo-700">7 tasks</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          No Deadline
                        </span>
                        <span className="text-lg font-extrabold text-slate-700">5 tasks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'tasks' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[#635BFF]" />
                    <span className="text-xs font-bold text-slate-900">Sprint Backlog — Core Infrastructure</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Showing 4 of 29 items</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <div>
                        <p className="font-semibold text-slate-900">Implement refresh token hash rotation & UUID jti</p>
                        <p className="text-slate-400 text-[11px]">PROJECT-CORE • Auth & Security</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-medium">Urgent</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">In Progress</span>
                      <span className="text-slate-500 font-mono text-[11px]">Due Today</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <div>
                        <p className="font-semibold text-slate-900">Audit multi-tenancy organization query scopes</p>
                        <p className="text-slate-400 text-[11px]">PROJECT-CORE • Tenancy Architecture</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">High</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">Completed</span>
                      <span className="text-slate-500 font-mono text-[11px]">Oct 12</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <div>
                        <p className="font-semibold text-slate-900">Optimize task index foreign key cascade constraints</p>
                        <p className="text-slate-400 text-[11px]">PROJECT-DB • MySQL 8 Engine</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-medium">Medium</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">To Do</span>
                      <span className="text-slate-500 font-mono text-[11px]">Oct 15</span>
                    </div>
                  </div>
                  <div className="p-3.5 flex items-center justify-between hover:bg-slate-50/80">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-900">Design unified editorial article component</p>
                        <p className="text-slate-400 text-[11px]">PROJECT-UI • Brand Experience</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">Low</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">In Progress</span>
                      <span className="text-slate-500 font-mono text-[11px]">Oct 18</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'workload' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Team Allocation Map</h4>
                    <p className="text-xs text-slate-500">Real-time task commitments across department personnel</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-[#635BFF] border border-indigo-100">
                    8 Registered Members
                  </span>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-44">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-[#635BFF] font-bold text-[10px] flex items-center justify-center">N</div>
                      <span className="font-semibold text-slate-800">NexOps Admin</span>
                    </div>
                    <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#635BFF] w-[70%]" />
                    </div>
                    <span className="font-mono text-slate-600 font-medium">7 Active / 1 Overdue</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-44">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">S</div>
                      <span className="font-semibold text-slate-800">Sarah Chen</span>
                    </div>
                    <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[45%]" />
                    </div>
                    <span className="font-mono text-slate-600 font-medium">4 Active / 0 Overdue</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-44">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center">M</div>
                      <span className="font-semibold text-slate-800">Marcus Vance</span>
                    </div>
                    <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[85%]" />
                    </div>
                    <span className="font-mono text-slate-600 font-medium">9 Active / 1 Overdue</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 w-44">
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center">E</div>
                      <span className="font-semibold text-slate-800">Elena Rostova</span>
                    </div>
                    <div className="flex-1 mx-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 w-[30%]" />
                    </div>
                    <span className="font-mono text-slate-600 font-medium">3 Active / 0 Overdue</span>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'audit' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#635BFF]" />
                    <span className="text-xs font-bold text-slate-900">Immutable Audit Stream</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Real-time event capture</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-800"><strong className="font-semibold">NexOps Admin</strong> transitioned status from <span className="font-mono text-[11px] bg-slate-200 px-1 rounded">TODO</span> to <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-1 rounded">COMPLETED</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Task #482 • 2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70">
                    <Clock className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-800"><strong className="font-semibold">Sarah Chen</strong> uploaded technical attachment <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-1 rounded">schema_v2.sql</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Task #480 • 14 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50/70">
                    <AlertOctagon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-800"><strong className="font-semibold">System Scheduler</strong> dispatched automated due-soon notification</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Automated Event • 1 hour ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. UNIQUE EDITORIAL PRODUCT ARTICLE
          ───────────────────────────────────────────────────────────── */}
      <section id="editorial" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: The Editorial Story */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="primary" dot size="md">
                Product Philosophy
              </Badge>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Work doesn't break because teams stop working.{' '}
                <span className="text-[#635BFF]">
                  It breaks when nobody can see the whole picture.
                </span>
              </h2>

              <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  Teams rarely drop the ball out of negligence or lack of effort. People are busy
                  all day long — pushing commits, replying to threads, updating tickets.
                </p>
                <p>
                  Yet initiatives still slip. Not because effort stopped, but because:{' '}
                  <strong className="text-slate-900 font-semibold">
                    ownership becomes vague, deadlines become invisible, and managers lose a single
                    operational view across people and projects.
                  </strong>
                </p>
                <p>
                  Important updates drown in chat channels. One person thinks a dependency is done;
                  another doesn't know it's blocked. By the time leadership asks{' '}
                  <em>“What's the status of this milestone?”</em>, two weeks have already evaporated.
                </p>
              </div>

              {/* The NexOps Answer */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  The NexOps Synthesis
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-normal">
                  Instead of disconnected tools, NexOps binds eight critical signals into one live record:{' '}
                  <strong className="text-slate-900 font-semibold">
                    Tasks, Projects, People, Deadlines, Workload, Activity, Notifications, and Analytics.
                  </strong>
                </p>
              </div>
            </div>

            {/* Right Column: Visual Operational Chain Metaphor */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-[#0F172A] p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    The Delivery Chain
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Zero Ambiguity
                  </span>
                </div>

                {/* Vertical Stepper: TASK -> OWNER -> DEADLINE -> STATUS -> OUTCOME */}
                <div className="space-y-3 font-mono text-xs">
                  {/* Step 1: TASK */}
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-indigo-400 font-bold block">1. Task</span>
                      <span className="font-semibold text-slate-100">Specific Work Unit</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">#T-104</span>
                  </div>

                  <div className="flex justify-center text-slate-600 text-xs">↓</div>

                  {/* Step 2: OWNER */}
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-indigo-400 font-bold block">2. Single Owner</span>
                      <span className="font-semibold text-slate-100">Assigned Member</span>
                    </div>
                    <span className="text-indigo-400 text-[11px]">RBAC Bound</span>
                  </div>

                  <div className="flex justify-center text-slate-600 text-xs">↓</div>

                  {/* Step 3: DEADLINE */}
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-indigo-400 font-bold block">3. Deadline</span>
                      <span className="font-semibold text-slate-100">Firm Delivery Date</span>
                    </div>
                    <span className="text-amber-400 text-[11px]">Automated Alerts</span>
                  </div>

                  <div className="flex justify-center text-slate-600 text-xs">↓</div>

                  {/* Step 4: STATUS */}
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-indigo-400 font-bold block">4. Live Status</span>
                      <span className="font-semibold text-slate-100">Todo → Progress → Done</span>
                    </div>
                    <span className="text-sky-400 text-[11px]">Audit Tracked</span>
                  </div>

                  <div className="flex justify-center text-slate-600 text-xs">↓</div>

                  {/* Step 5: OUTCOME */}
                  <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-emerald-400 font-bold block">5. Outcome</span>
                      <span className="font-bold text-white">Shipped On Time</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CORE NEXOPS CAPABILITIES
          ───────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="neutral" size="md">
            Operational Capabilities
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-3">
            Engineered for Precision & Accountability
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Every feature in NexOps exists to give your team clear ownership, accurate timelines,
            and reliable execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#635BFF] flex items-center justify-center font-bold">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Project Hubs & Milestone Trajectory</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Organize strategic initiatives into distinct corporate projects with unique project
              codes, scope parameters, milestone start and end dates, and member rosters.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Task Ownership & Collaboration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every task has an explicit priority, lifecycle status, deadline, and assignee. Built-in
              threaded discussion comments and file attachment uploads keep context connected.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Automated SLA & Deadline Protection</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Background schedulers monitor pending tasks against active delivery dates, dispatching
              automated due-soon reminders and overdue alerts to assignees and leadership.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Team Capacity & Workload Balancing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Identify where tasks are accumulating before bottlenecks occur. See member allocation
              ratios, overdue ticket burdens, and open capacity across departments.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Operational Analytics & Trends</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Evaluate task completion velocity, status distributions, and milestone progress curves
              with structured data visualizations built for management reviews.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Comprehensive Audit Trail</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every status modification, assignee reassignment, and milestone change is permanently
              recorded with user attribution and timestamp in the audit log.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. WORKFLOW PIPELINE
          ───────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-20 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <Badge variant="primary" dot size="md">
              End-to-End Workflow
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-3">
              How Work Flows Through NexOps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              From strategic corporate project setup down to granular task verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-bold text-[#635BFF]">01. INITIATION</span>
              <h4 className="text-sm font-bold text-slate-900">Define Project Workspace</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Establish the project with unique code, delivery timeline, and add team members with
                role-specific permissions.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-bold text-[#635BFF]">02. DELEGATION</span>
              <h4 className="text-sm font-bold text-slate-900">Assign Tasks & Deadlines</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Break milestones into discrete actionable tickets. Set priorities, due dates, and
                assign to specific team members.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-bold text-[#635BFF]">03. BALANCING</span>
              <h4 className="text-sm font-bold text-slate-900">Monitor Workload & SLAs</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check team allocation maps to balance workloads. Automated schedulers warn of looming
                due dates and overdue items.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-bold text-[#635BFF]">04. COMPLETION</span>
              <h4 className="text-sm font-bold text-slate-900">Review Audit & Velocity</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verify deliverable completions with real-time audit logs and review velocity metrics
                for operational continuous improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. RBAC & GOVERNANCE SECTION
          ───────────────────────────────────────────────────────────── */}
      <section id="governance" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <Badge variant="neutral" dot size="md">
              Enterprise Security
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Role-Based Access Control Built Into Every Interaction
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              NexOps enforces multi-tenant organization boundaries at the database and API levels.
              Six defined organizational tiers prevent unauthorized data visibility or privilege
              escalation.
            </p>
            <div className="pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button variant="outline" size="sm" rightIcon={ArrowRight}>
                  Set Up Organization Access
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#635BFF]" />
                    <span>SUPER_ADMIN & ADMIN</span>
                  </div>
                  <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                    Full organizational governance: create departments, manage user directory, configure
                    corporate policies, and manage projects.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MANAGER & TEAM_LEAD</span>
                  </div>
                  <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                    Management oversight: create project tasks, review team workload capacity, access
                    analytics dashboards, and track overdue items.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>EMPLOYEE</span>
                  </div>
                  <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                    Active contributor: browse assigned projects, update task statuses, participate in
                    discussions, and attach deliverable files.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>VIEWER</span>
                  </div>
                  <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                    Read-only stakeholder: inspect project timelines, milestone status, and audit feeds
                    without modification privileges.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FINAL CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to bring operational clarity to your team?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Eliminate dropped balls and ambiguous ownership. Sign up your organization today or
            sign into your existing workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.REGISTER}>
              <Button
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                className="w-full sm:w-auto shadow-md"
              >
                {isAuthenticated ? 'Open Command Center' : 'Create Free Account'}
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to={ROUTES.LOGIN}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white"
                >
                  Sign In to Workspace
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#635BFF] text-white flex items-center justify-center text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">NexOps</span>
            <span className="text-slate-400">© 2026 NexOps Enterprise. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#preview" className="hover:text-slate-900 transition-colors">
              Command Center
            </a>
            <a href="#editorial" className="hover:text-slate-900 transition-colors">
              Philosophy
            </a>
            <a href="#governance" className="hover:text-slate-900 transition-colors">
              Governance
            </a>
            <Link to={ROUTES.SHOWCASE} className="hover:text-slate-900 transition-colors">
              UI System Lab
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
