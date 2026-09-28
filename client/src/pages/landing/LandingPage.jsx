import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SBLogo } from '@/components/common/SBLogo'
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  AlertOctagon,
  FolderKanban,
  CheckSquare,
  Shield,
  Eye,
  Calendar,
  Sparkles,
  Menu,
  X,
  Lock,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth()
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
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo (Clean & Distinct) */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <SBLogo size="md" />
          </Link>

          {/* Desktop Navigation Links — Short, Professional SaaS style */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#preview" className="hover:text-slate-900 transition-colors">
              Product
            </a>
            <a href="#philosophy" className="hover:text-slate-900 transition-colors">
              Philosophy
            </a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">
              Capabilities
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              Security & RBAC
            </a>
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
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-xs font-semibold text-slate-700 hover:text-[#635BFF] transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF]"
              >
                Product Preview
              </a>
              <a
                href="#philosophy"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF]"
              >
                Philosophy
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF]"
              >
                Capabilities
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF]"
              >
                Security & RBAC
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to={ROUTES.DASHBOARD} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full justify-center">
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
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-600 text-xs font-semibold mb-6 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
            Enterprise Operations Command Center
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            See the work.{' '}
            <span className="text-[#635BFF]">Know who owns it.</span>
            <br />
            Move it forward.
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SB Pvt. Ltd. gives teams one operational view of projects, tasks, workload,
            deadlines, and activity — so important work doesn't disappear between
            people, tools, and deadlines.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="primary" size="lg" rightIcon={ArrowRight} className="shadow-sm">
                  Go to Command Center
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="lg" rightIcon={ArrowRight} className="shadow-sm">
                    Get Started
                  </Button>
                </Link>
                <a href="#preview">
                  <Button variant="secondary" size="lg">
                    Explore SB Pvt. Ltd.
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Micro trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Real-time SLA Monitoring
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#635BFF]" />
              Role-Based Access Control
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600" />
              Multi-Tenant Architecture
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE PRODUCT PREVIEW
          ───────────────────────────────────────────────────────────── */}
      <section id="preview" className="py-12 bg-white border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-2">
              Product Overview
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              One operational surface for all team execution
            </p>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-xl overflow-hidden">
            {/* Window Chrome Header */}
            <div className="h-11 px-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[11px] font-mono text-slate-400">
                  sbpvtltd.corp/overview
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'workload', label: 'Workload' },
                  { id: 'audit', label: 'Audit Trail' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      previewTab === tab.id
                        ? 'bg-[#635BFF] text-white shadow-2xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Viewport */}
            <div className="p-6 sm:p-8">
              {/* TAB 1: OVERVIEW */}
              {previewTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Active Projects
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">12</p>
                      <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                        100% On Schedule
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Task Completion
                      </p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">87.4%</p>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full w-[87%]" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        In Flight Tasks
                      </p>
                      <p className="text-2xl font-bold text-[#635BFF] mt-1">48</p>
                      <span className="text-[11px] text-slate-500 mt-1 inline-block">
                        Distributed across 6 squads
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Overdue Alerts
                      </p>
                      <p className="text-2xl font-bold text-rose-600 mt-1">2</p>
                      <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-block">
                        Escalated to Team Leads
                      </span>
                    </div>
                  </div>

                  {/* Status Pipeline Preview */}
                  <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3">
                      <span>Delivery Pipeline Health</span>
                      <span className="text-slate-400 font-mono">146 Total Sprint Items</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-slate-500 text-[11px]">Backlog</p>
                        <p className="text-base font-bold text-slate-800 mt-0.5">34</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#635BFF]/10 border border-[#635BFF]/20">
                        <p className="text-[#5148E5] text-[11px] font-semibold">In Progress</p>
                        <p className="text-base font-bold text-[#635BFF] mt-0.5">48</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-amber-700 text-[11px]">In Review</p>
                        <p className="text-base font-bold text-amber-800 mt-0.5">18</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        <p className="text-emerald-700 text-[11px] font-semibold">Done</p>
                        <p className="text-base font-bold text-emerald-800 mt-0.5">46</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS */}
              {previewTab === 'tasks' && (
                <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs animate-in fade-in duration-150">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Sprint Deliverables</span>
                    <span className="text-[11px] font-mono text-slate-400">Live API Data Schema</span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {[
                      {
                        title: 'Migrate OAuth refresh token rotation',
                        code: 'NX-104',
                        status: 'IN_PROGRESS',
                        priority: 'URGENT',
                        owner: 'Sarah Lin',
                        due: 'Today',
                      },
                      {
                        title: 'Implement department audit log filter',
                        code: 'NX-98',
                        status: 'TODO',
                        priority: 'HIGH',
                        owner: 'David Vance',
                        due: 'In 2 days',
                      },
                      {
                        title: 'Production database index optimization',
                        code: 'NX-89',
                        status: 'COMPLETED',
                        priority: 'MEDIUM',
                        owner: 'Elena Rostova',
                        due: 'Resolved',
                      },
                    ].map((row) => (
                      <div key={row.code} className="p-3.5 flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {row.code}
                            </span>
                            <span className="font-semibold text-slate-900 truncate">
                              {row.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Assigned to {row.owner} • Due {row.due}
                          </p>
                        </div>
                        <Badge
                          variant={row.status === 'COMPLETED' ? 'success' : 'primary'}
                          size="sm"
                        >
                          {row.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: WORKLOAD */}
              {previewTab === 'workload' && (
                <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-2xs space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">Headcount Capacity Distribution</span>
                    <span className="text-emerald-600 font-semibold">100% Assigned</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Sarah Lin', role: 'Team Lead', tasks: 6, max: 8, pct: '75%' },
                      { name: 'Elena Rostova', role: 'Senior Engineer', tasks: 7, max: 8, pct: '88%' },
                      { name: 'David Vance', role: 'Product Ops', tasks: 4, max: 8, pct: '50%' },
                    ].map((m) => (
                      <div key={m.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">
                            {m.name} <span className="text-slate-400 font-normal">({m.role})</span>
                          </span>
                          <span className="font-mono text-slate-500 font-semibold">
                            {m.tasks}/{m.max} tasks
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#635BFF] rounded-full" style={{ width: m.pct }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT TRAIL */}
              {previewTab === 'audit' && (
                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs animate-in fade-in duration-150">
                  <p className="text-xs font-semibold text-slate-900 mb-3">System Audit Log</p>
                  <div className="space-y-2 text-xs font-mono text-slate-600">
                    <div className="p-2 rounded bg-slate-50 flex items-center justify-between">
                      <span>[14:22:10] TASK_STATUS_CHANGED → Sarah Lin marked NX-104 as IN_PROGRESS</span>
                      <span className="text-slate-400 text-[10px]">Just now</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 flex items-center justify-between">
                      <span>[13:05:40] TASK_ASSIGNED → Elena Rostova assigned to NX-89</span>
                      <span className="text-slate-400 text-[10px]">1h ago</span>
                    </div>
                    <div className="p-2 rounded bg-slate-50 flex items-center justify-between">
                      <span>[11:15:02] PROJECT_MILESTONE_UPDATED → Sprint 12 target locked</span>
                      <span className="text-slate-400 text-[10px]">3h ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. EDITORIAL PHILOSOPHY
          "Work doesn't break because teams stop working..."
          ───────────────────────────────────────────────────────────── */}
      <section id="philosophy" className="py-20 md:py-28 bg-[#F8FAFC] scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Punchy Product Statement */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#635BFF]">
                The SB Pvt. Ltd. Philosophy
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Work doesn't break because teams stop working.
                <br />
                <span className="text-[#635BFF]">It breaks when nobody can see the whole picture.</span>
              </h2>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Teams rarely lose velocity because members are idle. Work gets lost because
                ownership becomes fuzzy, deadlines slip silently past calendar boundaries, and critical
                decisions vanish in conversational threads.
              </p>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                SB Pvt. Ltd. unifies tasks, owners, deadlines, and real capacity into one single operational
                surface — giving leadership and individual contributors identical ground truth.
              </p>
            </div>

            {/* Right: The 5-Step Visual Delivery Chain */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  The Operational Delivery Chain
                </p>

                {[
                  { step: '01', title: 'Task', desc: 'Clear atomic unit of work with defined scope and specifications', color: 'border-indigo-200 bg-indigo-50/50' },
                  { step: '02', title: 'Owner', desc: 'One accountable engineer or manager — no ambiguity', color: 'border-slate-200 bg-slate-50/50' },
                  { step: '03', title: 'Deadline', desc: 'Hard delivery timestamp with automated SLA breach warnings', color: 'border-amber-200 bg-amber-50/50' },
                  { step: '04', title: 'Status', desc: 'Real-time pipeline state: Todo → In Progress → Review → Done', color: 'border-sky-200 bg-sky-50/50' },
                  { step: '05', title: 'Outcome', desc: 'Predictable ship dates, complete audit logs, zero surprises', color: 'border-emerald-200 bg-emerald-50/50' },
                ].map((item, idx, arr) => (
                  <div key={item.step}>
                    <div className={`p-3.5 rounded-xl border ${item.color} flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="flex justify-center py-1 text-slate-300">
                        <div className="w-px h-3 bg-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CORE CAPABILITIES (3 Focused Pillars, not 10 repetitive cards)
          ───────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 bg-white border-t border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-2">
              Core Capabilities
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for speed, visibility, and control
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:border-[#635BFF]/30 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Task & Milestone Tracking
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fast filtering by assignee, priority, status, and project code. Automated
                  urgency badges keep upcoming deadlines visible before they breach SLA.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-[#635BFF] flex items-center gap-1">
                <span>Direct SLA alerts</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:border-[#635BFF]/30 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Team Workload Intelligence
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time capacity distribution shows who is overloaded and who has bandwidth.
                  Rebalance tasks across team members with live analytics.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <span>Balanced allocation</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:border-[#635BFF]/30 hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Multi-Tenant RBAC & Audit
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Strict multi-tenancy ensures cross-organization isolation. Six granular
                  roles ensure employees, managers, and viewers see only authorized data.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-sky-600 flex items-center gap-1">
                <span>Enterprise compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. SECURITY & RBAC GOVERNANCE
          ───────────────────────────────────────────────────────────── */}
      <section id="security" className="py-20 bg-[#F8FAFC] border-t border-slate-200/80 scroll-mt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-2">
              Enterprise Governance
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Rigorous authorization built in from day one
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Lock className="w-4 h-4 text-[#635BFF]" />
                  JWT & Token Rotation
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dual-token architecture with sliding refresh rotation, blacklisting on logout, and HTTP-only protections.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Users className="w-4 h-4 text-emerald-600" />
                  6 Explicit Roles
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Super Admin, Admin, Manager, Team Lead, Employee, and Viewer roles verified at both the API and UI layers.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  Tenant Data Isolation
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every query is strictly scoped by organization ID. Cross-tenant leakage is prevented by database cascades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FINAL CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to bring operational clarity to your team?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Deploy SB Pvt. Ltd. across your squads, track deliverables, balance team workload,
            and keep execution moving forward.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                  Open Workspace
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                    Get Started Free
                  </Button>
                </Link>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="outline" size="lg" className="border-slate-700 text-white hover:bg-slate-800">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER
          ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-500 text-xs py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SBLogo size="sm" variant="light" />
          </div>

          <p className="text-slate-500">
            © {new Date().getFullYear()} SB Pvt. Ltd. All rights reserved. Built for modern operational teams.
          </p>

          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <a href="#preview" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#philosophy" className="hover:text-white transition-colors">
              Philosophy
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security
            </a>
            <Link to={ROUTES.LOGIN} className="hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
