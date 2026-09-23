import { Outlet, Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants/routes'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Marketing / Value Prop Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        {/* Subtle decorative background gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link to={ROUTES.LOGIN} className="inline-block">
            <Logo size="lg" className="text-white" />
          </Link>
          <div className="mt-8">
            <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
              Enterprise Task & Workspace Operations
            </span>
            <h1 className="mt-4 text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Coordinate teams, automate workflows, and drive operational excellence.
            </h1>
          </div>
        </div>

        {/* Mid Features */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="flex items-start gap-3.5">
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Hierarchical Workspace Management</p>
              <p className="text-xs text-slate-400">Structured organization, departments, and cross-functional project hubs.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Granular Role-Based Access Control</p>
              <p className="text-xs text-slate-400">Built-in RBAC ensuring enterprise security compliance and data isolation.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-1 rounded-md bg-indigo-500/20 text-indigo-400 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Automated Task Lifecycle & Analytics</p>
              <p className="text-xs text-slate-400">Automatic overdue tracking, workload metrics, and activity audit logging.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} NexOps Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
          </div>
        </div>
      </div>

      {/* Right Form Outlet */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-16 xl:px-24 bg-slate-50/50">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Logo size="lg" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
