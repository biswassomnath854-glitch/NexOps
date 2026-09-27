import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BarChart3,
  Users,
  Clock,
  Zap,
  LayoutDashboard,
  CheckCircle2,
  Activity,
  Briefcase,
  Bell,
  TrendingUp,
  LogIn,
  UserPlus,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  Menu,
  X,
  Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

export function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('kanban')

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background Ambient Glow Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-indigo-600/25 via-violet-600/20 to-sky-500/10 blur-[130px] rounded-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[750px] -right-40 w-[600px] h-[500px] bg-gradient-to-br from-pink-600/10 via-purple-600/15 to-transparent blur-[140px] rounded-full"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[1600px] -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-700/15 via-blue-600/10 to-transparent blur-[150px] rounded-full"
      />

      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090D16]/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Nex<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Ops</span>
              </span>
              <span className="text-[10px] tracking-wider text-slate-400 uppercase font-mono font-medium -mt-1">
                Enterprise Operations
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">
              Platform Capabilities
            </a>
            <a href="#preview" className="hover:text-indigo-400 transition-colors">
              Interactive Preview
            </a>
            <a href="#workflow" className="hover:text-indigo-400 transition-colors">
              Operations Workflow
            </a>
            <a href="#security" className="hover:text-indigo-400 transition-colors">
              RBAC & Governance
            </a>
            <Link to={ROUTES.SHOWCASE} className="hover:text-indigo-400 transition-colors text-slate-400">
              UI System Lab
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-white">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'Logged In'}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">
                    {user?.role || 'Active Session'}
                  </span>
                </div>
                <Link
                  to={ROUTES.DASHBOARD}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 ring-1 ring-white/20 transition-all hover:scale-[1.02]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to={ROUTES.LOGIN}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/25 ring-1 ring-white/20 transition-all hover:scale-[1.02]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#090D16]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
            >
              Platform Capabilities
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
            >
              Interactive Preview
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
            >
              Operations Workflow
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800"
            >
              RBAC & Governance
            </a>
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                  >
                    Open Workspace Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-center py-2 rounded-xl text-xs text-rose-400 hover:bg-slate-800"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-center py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    className="text-center py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md text-xs font-medium text-indigo-300 shadow-inner mb-8 hover:border-indigo-400/50 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>NexOps 2.0 • Next-Gen Task & Workload Operations</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="text-slate-400 font-normal">Enterprise Ready</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
          Orchestrate Enterprise Workflows with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Precision & Velocity
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal">
          Unify cross-department sprint pipelines, live capacity telemetry, milestone urgency tracking, and multi-tenant role governance in one high-performance operational workspace.
        </p>

        {/* Hero CTA Action Group */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          {isAuthenticated ? (
            <Link
              to={ROUTES.DASHBOARD}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 ring-1 ring-white/20 transition-all hover:scale-105 group"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Enter Workspace Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                to={ROUTES.REGISTER}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 ring-1 ring-white/20 transition-all hover:scale-105 group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>Sign In to Workspace</span>
              </Link>
            </>
          )}

          <Link
            to={ROUTES.SHOWCASE}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Live UI Showcase</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Live Metrics Trust Bar */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">99.98%</span>
            <span className="text-xs text-slate-400 mt-1 font-medium">SLA Delivery Reliability</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-indigo-400 tracking-tight">4.2x</span>
            <span className="text-xs text-slate-400 mt-1 font-medium">Task Resolution Velocity</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">0 Overload</span>
            <span className="text-xs text-slate-400 mt-1 font-medium">Team Burnout Prevention</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-violet-400 tracking-tight">6 Tiers</span>
            <span className="text-xs text-slate-400 mt-1 font-medium">Hierarchical RBAC Governance</span>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE HERO PLATFORM PREVIEW */}
      <section id="preview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl shadow-indigo-950/60 p-2 sm:p-4 backdrop-blur-xl ring-1 ring-white/10">
          {/* Window Controls Header */}
          <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
                nexops-workspace.internal • Live Telemetry Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-emerald-400 font-medium">API Connected: 5000</span>
            </div>
          </div>

          {/* Interactive Mock Workspace View */}
          <div className="p-4 sm:p-6 bg-[#0B0F19]/90 rounded-xl mt-3 space-y-6">
            {/* Top Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Sprint Completion</span>
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white">88.4%</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3" /> +14.2% vs last cycle
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Capacity Index</span>
                  <Users className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-2xl font-bold text-white">Balanced</div>
                <div className="text-[11px] text-slate-400 mt-1">24 active team members</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Overdue Tasks</span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">0 Critical</div>
                <div className="text-[11px] text-slate-400 mt-1">SLA milestones compliant</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Active Projects</span>
                  <Briefcase className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-2xl font-bold text-white">6 Enterprise Hubs</div>
                <div className="text-[11px] text-slate-400 mt-1">Across 3 departments</div>
              </div>
            </div>

            {/* Simulated Live Kanban Board */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Sprint Pipeline
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">
                    Live Sync
                  </span>
                </div>
                <div className="text-xs text-slate-400">Showing automated milestone distribution</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: In Progress */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 pb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> In Progress
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">2</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono text-indigo-400">TASK-104</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-300">
                        High Priority
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200">
                      Optimize Sequelize query indexing for task metrics
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Due in 2 days
                      </span>
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] text-white flex items-center justify-center font-bold">
                        JD
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono text-indigo-400">TASK-108</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300">
                        Medium
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200">
                      Implement real-time notification socket listener
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Due in 4 days
                      </span>
                      <div className="w-5 h-5 rounded-full bg-violet-600 text-[10px] text-white flex items-center justify-center font-bold">
                        SB
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Review / Staging */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-purple-300 pb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" /> Review & Staging
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">1</span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono text-purple-400">TASK-099</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300">
                        Normal
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-200">
                      Workload balance distribution telemetry chart
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-emerald-400 text-[10px] font-medium">Passed Audit</span>
                      <div className="w-5 h-5 rounded-full bg-pink-600 text-[10px] text-white flex items-center justify-center font-bold">
                        AM
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300 pb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed (SLA Met)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 font-bold">
                      12
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-emerald-900/30 bg-emerald-950/10 hover:border-emerald-800/40 transition-colors">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-mono text-emerald-400">TASK-092</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xs font-medium text-slate-300 line-through">
                      Multi-tier RBAC authorization policy middleware
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">Shipped to production</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE PLATFORM PILLARS */}
      <section id="features" className="py-20 border-t border-slate-800/80 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
            Platform Capabilities
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for High-Consequence Operations
          </p>
          <p className="mt-4 text-slate-400 text-base">
            Everything your engineering and operations teams need to coordinate tasks, balance capacity, and ensure zero SLA breaches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 transition-all hover:scale-[1.01] group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Task Pipelines</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Transition tasks effortlessly from planning to production with automated priority classification, subtask dependency tracking, and CSV/PDF report generation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-violet-500/40 transition-all hover:scale-[1.01] group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Workload & Capacity Telemetry</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time workload index telemetry prevents individual burnout. Balance sprint capacity across department members and identify bottlenecked workflows instantly.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-rose-500/40 transition-all hover:scale-[1.01] group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Proactive SLA Urgency Monitors</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated triggers evaluate deadline urgency and overdue items, firing critical alerts before delivery milestones slip out of compliance.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-emerald-500/40 transition-all hover:scale-[1.01] group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Enterprise RBAC & Organizations</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Multi-tiered permissions for Super Admin, Admin, Manager, Team Lead, Employee, and Viewer roles. Segment access cleanly across organizations and departments.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-sky-500/40 transition-all hover:scale-[1.01] group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Executive Analytics & Velocity</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Gain deep visibility with sprint burndown charts, departmental throughput rates, task completion velocity, and audit-grade performance records.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-amber-500/40 transition-all hover:scale-[1.01] group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Granular Notification Center</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unified notification hub with granular user preference toggles for mentions, assignments, deadline alerts, and system-wide broadcast updates.
            </p>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW STEPS */}
      <section id="workflow" className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 font-mono">
              Operational Flow
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              From Initialization to Continuous Delivery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative">
              <div className="text-3xl font-extrabold font-mono text-indigo-500/40 mb-3">01</div>
              <h3 className="text-lg font-bold text-white mb-2">Structure Hierarchy</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Set up organizations, establish departments, and enroll members with tailored security roles to establish your access boundary.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative">
              <div className="text-3xl font-extrabold font-mono text-purple-500/40 mb-3">02</div>
              <h3 className="text-lg font-bold text-white mb-2">Orchestrate Pipelines</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create project hubs, assign milestone deadlines, break work into executable tasks, and balance team workloads with live capacity telemetry.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 relative">
              <div className="text-3xl font-extrabold font-mono text-emerald-500/40 mb-3">03</div>
              <h3 className="text-lg font-bold text-white mb-2">Deliver with Certainty</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Monitor live sprint velocity, mitigate overdue risks proactively, and leverage executive analytics to refine your team’s delivery cadence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION FOOTER BANNER */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full"
          />

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Ready to Accelerate Your Operational Velocity?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join enterprise operations and engineering teams orchestrating mission-critical workflows on NexOps.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to={ROUTES.DASHBOARD}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Workspace Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.REGISTER}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>Start Free Workspace Pilot</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={ROUTES.LOGIN}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#070A11] py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-300">NexOps Platform</span>
            <span className="text-slate-600">|</span>
            <span>Enterprise Task & Workload Operations</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to={ROUTES.HOME} className="hover:text-slate-300 transition-colors">
              Home
            </Link>
            <Link to={ROUTES.DASHBOARD} className="hover:text-slate-300 transition-colors">
              Workspace
            </Link>
            <Link to={ROUTES.SHOWCASE} className="hover:text-slate-300 transition-colors">
              Design Lab
            </Link>
            <Link to={ROUTES.LOGIN} className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-400">All Systems Operational</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-slate-900 text-center text-slate-600">
          © {new Date().getFullYear()} NexOps Enterprise. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
