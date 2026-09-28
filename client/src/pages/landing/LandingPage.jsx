import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SBLogo } from '@/components/common/SBLogo'
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  CheckSquare,
  Lock,
  Building2,
  Menu,
  X,
  Layers,
  AlertTriangle,
  Sparkles,
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
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <SBLogo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#preview" className="hover:text-slate-900 transition-colors">
              Product Overview
            </a>
            <a href="#philosophy" className="hover:text-slate-900 transition-colors">
              Philosophy
            </a>
            <a href="#capabilities" className="hover:text-slate-900 transition-colors">
              Capabilities
            </a>
            <a href="#governance" className="hover:text-slate-900 transition-colors">
              Enterprise Governance
            </a>
          </nav>

          {/* Right Header Actions */}
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
                  className="text-xs font-semibold text-slate-700 hover:text-[#635BFF] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100/60"
                >
                  Sign In
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                    Get Started Free
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
                className="py-1.5 hover:text-[#635BFF] transition-colors"
              >
                Product Overview
              </a>
              <a
                href="#philosophy"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF] transition-colors"
              >
                Philosophy
              </a>
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF] transition-colors"
              >
                Capabilities
              </a>
              <a
                href="#governance"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#635BFF] transition-colors"
              >
                Enterprise Governance
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to={ROUTES.DASHBOARD} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full justify-center">
                    Open Workspace
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
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION — Confident, Restrained, Editorial Scale
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Category Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#635BFF]" />
            <span>Enterprise Operations & SLA Command</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">SB Pvt. Ltd. Core Platform</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-[-0.03em] text-slate-950 leading-[1.14] max-w-4xl mx-auto">
            See the work.{' '}
            <span className="text-[#635BFF]">Know who owns it.</span>
            <br className="hidden sm:inline" />
            {' '}Move it forward.
          </h1>

          {/* Supporting Copy */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            SB Pvt. Ltd. unifies projects, task ownership, deadlines, and squad capacity into one
            shared operational surface — eliminating delivery blind spots before they become crises.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="primary" size="lg" rightIcon={ArrowRight} className="shadow-xs hover:shadow-sm">
                  Open Workspace Command Center
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="lg" rightIcon={ArrowRight} className="shadow-xs hover:shadow-sm">
                    Get Started Free
                  </Button>
                </Link>
                <a href="#preview">
                  <Button variant="secondary" size="lg">
                    Explore Architecture
                  </Button>
                </a>
              </>
            )}
          </div>

          {/* Trust & Architectural Proof Points */}
          <div className="mt-12 pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Automated SLA Breach Tracking
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#635BFF] shrink-0" />
              6-Tier Granular RBAC
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
              Strict Multi-Tenant Isolation
            </span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-700 shrink-0" />
              Full Event Audit Trail
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. PRODUCT PREVIEW — Realistic Application Shell
          ───────────────────────────────────────────────────────────── */}
      <section id="preview" className="py-12 bg-white border-y border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-1">
                Live Interface Preview
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                One coherent workspace for squad execution
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              sbpvtltd.corp / command-center
            </p>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-xl overflow-hidden transition-all">
            {/* Window Chrome Header */}
            <div className="h-12 px-4 bg-slate-900 flex items-center justify-between border-b border-slate-800 text-slate-300">
              {/* Window Controls + Address */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/80 text-[11px] font-mono text-slate-400 border border-slate-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>https://app.sbpvtltd.com/workspace/sprint-24</span>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/50">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'tasks', label: 'Tasks Pipeline' },
                  { id: 'workload', label: 'Capacity' },
                  { id: 'audit', label: 'Audit Stream' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      previewTab === tab.id
                        ? 'bg-[#635BFF] text-white font-semibold shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Workspace Viewport */}
            <div className="p-5 sm:p-7">
              {/* TAB 1: OVERVIEW */}
              {previewTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top 4 KPI Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Active Projects
                      </p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2xl font-extrabold text-slate-900">12</span>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          100% On Track
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">6 enterprise squads</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Sprint Completion
                      </p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2xl font-extrabold text-slate-900">87.4%</span>
                        <span className="text-[11px] font-mono text-slate-500">128/146</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full w-[87%]" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        In Flight Deliverables
                      </p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2xl font-extrabold text-[#635BFF]">48</span>
                        <span className="text-[11px] font-semibold text-[#5148E5] bg-[#635BFF]/10 px-2 py-0.5 rounded-md border border-[#635BFF]/20">
                          Active Sprint
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Zero unassigned items</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        SLA Escalations
                      </p>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-2xl font-extrabold text-rose-600">2</span>
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Lead Escalated
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Resolution in progress</p>
                    </div>
                  </div>

                  {/* Pipeline Health + Actionable Sprint Tasks */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Status Pipeline Health */}
                    <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#635BFF]" />
                            Pipeline Distribution
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">Sprint 24</span>
                        </div>
                        <div className="space-y-2.5">
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                              <span className="text-slate-600">In Progress</span>
                              <span className="font-mono text-slate-800 font-semibold">48 items (33%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-[#635BFF] rounded-full w-[33%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                              <span className="text-slate-600">In Review</span>
                              <span className="font-mono text-slate-800 font-semibold">18 items (12%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full w-[12%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                              <span className="text-slate-600">Completed</span>
                              <span className="font-mono text-slate-800 font-semibold">62 items (43%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full w-[43%]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1 font-medium">
                              <span className="text-slate-600">Backlog</span>
                              <span className="font-mono text-slate-800 font-semibold">18 items (12%)</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-slate-400 rounded-full w-[12%]" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Total 146 sprint units</span>
                        <span className="text-emerald-600 font-semibold">Delivery pace: +14%</span>
                      </div>
                    </div>

                    {/* Critical In-Flight Items */}
                    <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-3">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-[#635BFF]" />
                          Operational Attention Items
                        </span>
                        <span className="text-[11px] text-slate-400">Owner Assigned</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          {
                            code: 'SB-104',
                            title: 'Implement OAuth sliding refresh rotation',
                            owner: 'Sarah Lin',
                            role: 'Security Lead',
                            sla: 'Due in 3 hours',
                            slaType: 'warning',
                            status: 'IN_PROGRESS',
                          },
                          {
                            code: 'SB-98',
                            title: 'Organization audit trail partitioning',
                            owner: 'David Vance',
                            role: 'Backend Ops',
                            sla: 'Due tomorrow',
                            slaType: 'neutral',
                            status: 'IN_REVIEW',
                          },
                          {
                            code: 'SB-89',
                            title: 'Database connection pool optimization',
                            owner: 'Elena Rostova',
                            role: 'Database Arch',
                            sla: 'Resolved today',
                            slaType: 'success',
                            status: 'COMPLETED',
                          },
                        ].map((item) => (
                          <div
                            key={item.code}
                            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                                {item.code}
                              </span>
                              <div className="truncate">
                                <p className="font-semibold text-slate-900 truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.owner} • {item.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  item.slaType === 'warning'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : item.slaType === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.sla}
                              </span>
                              <Badge
                                variant={
                                  item.status === 'COMPLETED'
                                    ? 'success'
                                    : item.status === 'IN_REVIEW'
                                    ? 'warning'
                                    : 'primary'
                                }
                                size="sm"
                              >
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TASKS PIPELINE */}
              {previewTab === 'tasks' && (
                <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#635BFF]" />
                      Sprint Tasks Execution Registry
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Filter: All Active ({'48'} in flight)
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {[
                      {
                        code: 'SB-104',
                        title: 'Migrate OAuth refresh token rotation to Redis store',
                        owner: 'Sarah Lin',
                        priority: 'URGENT',
                        priorityVariant: 'danger',
                        status: 'IN_PROGRESS',
                        statusVariant: 'primary',
                        sla: 'Today (3h rem)',
                      },
                      {
                        code: 'SB-98',
                        title: 'Department audit log cascade filter by organization',
                        owner: 'David Vance',
                        priority: 'HIGH',
                        priorityVariant: 'warning',
                        status: 'TODO',
                        statusVariant: 'neutral',
                        sla: 'In 2 days',
                      },
                      {
                        code: 'SB-95',
                        title: 'Workload capacity allocation recalculator hook',
                        owner: 'Marcus Reed',
                        priority: 'MEDIUM',
                        priorityVariant: 'info',
                        status: 'IN_PROGRESS',
                        statusVariant: 'primary',
                        sla: 'In 3 days',
                      },
                      {
                        code: 'SB-89',
                        title: 'Production MySQL foreign key index verification',
                        owner: 'Elena Rostova',
                        priority: 'HIGH',
                        priorityVariant: 'warning',
                        status: 'COMPLETED',
                        statusVariant: 'success',
                        sla: 'Resolved',
                      },
                    ].map((row) => (
                      <div
                        key={row.code}
                        className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
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
                            Assigned to <strong className="text-slate-700">{row.owner}</strong> • Target: {row.sla}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={row.priorityVariant} size="sm" dot>
                            {row.priority}
                          </Badge>
                          <Badge variant={row.statusVariant} size="sm">
                            {row.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: WORKLOAD CAPACITY */}
              {previewTab === 'workload' && (
                <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#635BFF]" />
                        Squad Headcount & Capacity Distribution
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Live task load mapped against weekly capacity limits.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Optimal Squad Load
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        name: 'Sarah Lin',
                        role: 'Team Lead',
                        tasks: 6,
                        max: 8,
                        pct: 75,
                        status: 'Balanced',
                        color: 'bg-[#635BFF]',
                      },
                      {
                        name: 'Elena Rostova',
                        role: 'Senior Engineer',
                        tasks: 7,
                        max: 8,
                        pct: 88,
                        status: 'Near Limit',
                        color: 'bg-amber-500',
                      },
                      {
                        name: 'David Vance',
                        role: 'Product Operations',
                        tasks: 4,
                        max: 8,
                        pct: 50,
                        status: 'Bandwidth Available',
                        color: 'bg-emerald-600',
                      },
                      {
                        name: 'Marcus Reed',
                        role: 'Systems Engineer',
                        tasks: 5,
                        max: 8,
                        pct: 62,
                        status: 'Balanced',
                        color: 'bg-[#635BFF]',
                      },
                    ].map((m) => (
                      <div
                        key={m.name}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900">{m.name}</span>
                            <span className="text-slate-400 font-normal ml-1.5">({m.role})</span>
                          </div>
                          <span className="font-mono text-slate-600 font-semibold">
                            {m.tasks}/{m.max} tasks
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                          <div
                            className={`h-full ${m.color} rounded-full`}
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{m.pct}% allocation</span>
                          <span className="font-medium text-slate-700">{m.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIT STREAM */}
              {previewTab === 'audit' && (
                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#635BFF]" />
                      Real-time Organization Audit Trail
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Strict Organization Scoped</span>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    {[
                      {
                        time: '14:22:10',
                        action: 'TASK_STATUS_CHANGED',
                        actor: 'Sarah Lin',
                        detail: 'marked SB-104 as IN_PROGRESS',
                        badge: 'primary',
                      },
                      {
                        time: '13:05:40',
                        action: 'TASK_ASSIGNED',
                        actor: 'Elena Rostova',
                        detail: 'assigned Marcus Reed to SB-95',
                        badge: 'info',
                      },
                      {
                        time: '11:15:02',
                        action: 'PROJECT_MILESTONE_UPDATED',
                        actor: 'System Automation',
                        detail: 'Sprint 24 delivery target locked',
                        badge: 'success',
                      },
                      {
                        time: '09:40:18',
                        action: 'SLA_BREACH_WARNING',
                        actor: 'SLA Monitor Engine',
                        detail: 'SB-104 deadline approaching in 3 hours',
                        badge: 'warning',
                      },
                    ].map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-slate-400 text-[11px] shrink-0">[{entry.time}]</span>
                          <Badge variant={entry.badge} size="sm">
                            {entry.action}
                          </Badge>
                          <span className="text-slate-700 truncate font-sans text-xs">
                            <strong className="text-slate-900">{entry.actor}</strong> {entry.detail}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">Logged</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Footer Disclaimer */}
            <div className="px-5 py-2.5 bg-slate-100/70 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
                Interactive demonstration of the SB Pvt. Ltd. operations platform
              </span>
              <span className="font-mono text-slate-400">v2.4 Enterprise</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. UNIQUE EDITORIAL SECTION — Philosophy & Delivery Chain
          "Work doesn't break because teams stop working.
          It breaks when nobody can see the whole picture."
          ───────────────────────────────────────────────────────────── */}
      <section id="philosophy" className="py-20 md:py-28 bg-[#F8FAFC] scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Editorial Essay */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#635BFF]">
                <span>01</span>
                <span>/</span>
                <span>THE OPERATIONAL THESIS</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-[1.2]">
                Work doesn't break because teams stop working.
                <span className="text-[#635BFF] block mt-1.5">
                  It breaks when nobody can see the whole picture.
                </span>
              </h2>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Engineering and operations teams rarely suffer because individuals lack competence or drive.
                Delivery breaks down when ownership becomes fuzzy, deadlines silently slide past calendar
                boundaries, and critical operational decisions dissolve into disconnected conversational threads.
              </p>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                SB Pvt. Ltd. eliminates the information asymmetry between leadership and contributors.
                By connecting atomic work units to single responsible owners and real-time SLA monitors,
                everyone in your organization sees identical, unvarnished ground truth.
              </p>

              {/* Editorial Pull Quote */}
              <div className="p-5 rounded-xl bg-white border-l-4 border-l-[#635BFF] border-slate-200/90 shadow-2xs">
                <p className="text-xs sm:text-sm font-medium text-slate-800 italic leading-relaxed">
                  "When ownership is explicit and milestones are observable, teams don't need status meetings
                  to discover if they are going to ship on time."
                </p>
                <p className="text-[11px] font-semibold text-slate-500 mt-2">
                  — The SB Pvt. Ltd. Operating Principle
                </p>
              </div>
            </div>

            {/* Right Column: The 5-Step Operational Delivery Chain */}
            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    The Delivery Chain
                  </span>
                  <span className="text-[11px] font-mono text-[#635BFF] font-semibold">
                    Sequential Accountability
                  </span>
                </div>

                <div className="space-y-3 relative">
                  {[
                    {
                      step: '01',
                      phase: 'WORK',
                      sub: 'The Atomic Unit',
                      desc: 'Explicit tasks with defined specifications, acceptance criteria, and project alignment.',
                      badge: 'Scope Defined',
                      color: 'bg-indigo-50/70 border-indigo-200 text-indigo-900',
                      badgeColor: 'primary',
                    },
                    {
                      step: '02',
                      phase: 'OWNERSHIP',
                      sub: 'Single Point of Contact',
                      desc: 'Exactly one assigned engineer or lead — zero shared ambiguity or bystander effect.',
                      badge: 'Accountable',
                      color: 'bg-slate-50/70 border-slate-200 text-slate-900',
                      badgeColor: 'neutral',
                    },
                    {
                      step: '03',
                      phase: 'DEADLINE',
                      sub: 'Time Boundary',
                      desc: 'Hard completion timestamps backed by automated proactive SLA warning notifications.',
                      badge: 'SLA Guarded',
                      color: 'bg-amber-50/70 border-amber-200 text-amber-900',
                      badgeColor: 'warning',
                    },
                    {
                      step: '04',
                      phase: 'STATUS',
                      sub: 'Pipeline State',
                      desc: 'Real-time progression through Todo, In Progress, Review, and Completed stages.',
                      badge: 'Transparent',
                      color: 'bg-sky-50/70 border-sky-200 text-sky-900',
                      badgeColor: 'info',
                    },
                    {
                      step: '05',
                      phase: 'OUTCOME',
                      sub: 'Predictable Delivery',
                      desc: 'Verifiable sprint deliverables, audit logs, and operational velocity without surprises.',
                      badge: 'Shipped',
                      color: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
                      badgeColor: 'success',
                    },
                  ].map((item, idx, arr) => (
                    <div key={item.step}>
                      <div className={`p-4 rounded-xl border ${item.color} transition-all`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200/90 text-slate-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {item.step}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold tracking-tight text-slate-900">
                                  {item.phase}
                                </h4>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  • {item.sub}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <Badge variant={item.badgeColor} size="sm">
                            {item.badge}
                          </Badge>
                        </div>
                      </div>

                      {/* Directional Connector */}
                      {idx < arr.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <div className="w-px h-3 bg-slate-300" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. SECTION VARIETY — Core Capabilities (Asymmetric Layout)
          ───────────────────────────────────────────────────────────── */}
      <section id="capabilities" className="py-20 bg-white border-t border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-2">
              Capabilities Architecture
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Engineered for velocity, transparency, and control
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every feature is built around the single goal of predictable enterprise delivery.
            </p>
          </div>

          <div className="space-y-6">
            {/* Major Featured Capability (Full-Width Split) */}
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-2xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Real-Time SLA Engine & Deadline Intelligence
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                      Tasks don't just have static dates. The SB Pvt. Ltd. platform monitors active deliverable
                      timelines continuously, issuing tiered warnings before deadlines expire and automatically
                      notifying responsible leads when items require intervention.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Automated 3-day and same-day delivery warnings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Explicit lead escalation path for blocked tasks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Dedicated Overdue Task command center with batch resolution</span>
                    </li>
                  </ul>
                </div>

                {/* Visual Representation of SLA Warning Card */}
                <div className="lg:col-span-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Automated SLA Monitoring Event
                      </span>
                      <span className="font-mono text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                        Action Required
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-amber-800">
                          TASK-204 • HIGH PRIORITY
                        </span>
                        <span className="text-[11px] font-semibold text-amber-800">Due in 4 hours</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900">
                        Finalize SOC2 compliance audit log exports
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Assigned to: <strong className="text-slate-800">David Vance</strong> • Escalated to Squad Lead
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Proactive notification sent via workspace scheduler</span>
                      <span className="text-emerald-600 font-semibold">Zero data lost</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Split Feature Blocks (Two Asymmetrical Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature A: Capacity & Workload */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:border-[#635BFF]/30 hover:shadow-xs transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Team Capacity & Workload Balance
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Prevent individual burnout before it manifests as missed ship dates. Real-time capacity
                      meters show squad distribution across ongoing projects, letting managers rebalance
                      assignments before sprint kickoff.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    Live headcount allocation
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">Sprint-level visibility</span>
                </div>
              </div>

              {/* Feature B: Governance & RBAC */}
              <div className="p-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between hover:border-[#635BFF]/30 hover:shadow-xs transition-all">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold border border-sky-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Enterprise Multi-Tenancy & RBAC
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Strict tenant boundary enforcement guarantees zero cross-organization data leakage.
                      Six granular role tiers ensure employees, managers, team leads, and external viewers
                      access only their authorized project domains.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-600 flex items-center gap-1">
                    Tenant-scoped boundaries
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">6 granular roles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. ENTERPRISE GOVERNANCE SPECIFICATIONS
          Horizontal Structured Grid (No Repetitive Cards)
          ───────────────────────────────────────────────────────────── */}
      <section id="governance" className="py-20 bg-[#F8FAFC] border-t border-slate-200/80 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-2">
              Architectural Rigor
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise security verified at every architectural boundary
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Built on industry standards for identity, session lifecycle, and multi-tenant isolation.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-6 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  JWT & Sliding Rotation
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dual-token architecture with sliding refresh rotation, blacklisting on logout, and HTTP-only protections.
                </p>
              </div>

              <div className="p-6 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  6-Tier Role Matrix
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Super Admin, Admin, Manager, Team Lead, Employee, and Viewer roles verified at both the API and UI boundaries.
                </p>
              </div>

              <div className="p-6 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Tenant Data Isolation
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every query is strictly scoped by organization ID. Cross-tenant leakage is prevented by database cascades.
                </p>
              </div>

              <div className="p-6 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Full Audit Logging
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  All task transitions, assignments, and project milestones generate immutable audit records with user attribution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FINAL CALL TO ACTION
          ───────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Bring operational clarity to your enterprise squads
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Deploy SB Pvt. Ltd. across your teams, eliminate delivery blind spots,
            and keep critical engineering execution moving forward.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD}>
                <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                  Open Workspace Command Center
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
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-700 text-white hover:bg-slate-800"
                  >
                    Sign In to Account
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
      <footer className="bg-slate-950 text-slate-500 text-xs py-10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <SBLogo size="sm" variant="light" />
          </div>

          <p className="text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} SB Pvt. Ltd. All rights reserved. Enterprise task and operations platform.
          </p>

          <div className="flex items-center gap-6 text-slate-400 font-medium">
            <a href="#preview" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#philosophy" className="hover:text-white transition-colors">
              Philosophy
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#governance" className="hover:text-white transition-colors">
              Governance
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
