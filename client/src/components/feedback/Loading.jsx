import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Animated Spinner for inline or section loading.
 */
export function Spinner({ size = 'md', className, ...props }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  return (
    <Loader2
      className={cn('animate-spin text-indigo-600', sizes[size] || sizes.md, className)}
      {...props}
    />
  )
}

/**
 * Shimmering skeleton placeholder for cards, lines, or avatars.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  )
}

/**
 * Full page or full container centered loading overlay.
 */
export function FullPageLoader({ message = 'Loading NexOps workspace...' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 gap-4">
      <Spinner size="lg" />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  )
}
