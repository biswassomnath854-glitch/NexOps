import { cn } from '@/utils/cn'

/**
 * RouteLoadingFallback
 *
 * Compact, branded loading fallback conforming to the SB Pvt. Ltd. design system.
 * Used during route transitions when dynamic code chunks are loaded via React.lazy().
 */
export function RouteLoadingFallback({ fullPage = false, message = 'Loading workspace...' }) {
  if (fullPage) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 p-6"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#635BFF] animate-spin" />
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            {message}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full min-h-[360px] flex flex-col items-center justify-center p-8 text-slate-600"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
        <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-[#635BFF] animate-spin" />
        <span className="text-xs font-medium text-slate-600">
          {message}
        </span>
      </div>
    </div>
  )
}
