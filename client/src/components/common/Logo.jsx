import { Layers } from 'lucide-react'
import { cn } from '@/utils/cn'

export function Logo({ size = 'md', showText = true, className }) {
  const sizes = {
    sm: { icon: 'w-6 h-6 p-1', text: 'text-base' },
    md: { icon: 'w-8 h-8 p-1.5', text: 'text-xl' },
    lg: { icon: 'w-10 h-10 p-2', text: 'text-2xl' },
  }

  const currentSize = sizes[size] || sizes.md

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none font-bold tracking-tight', className)}>
      <div
        className={cn(
          'rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0',
          currentSize.icon
        )}
      >
        <Layers className="w-full h-full" />
      </div>

      {showText && (
        <span className={cn('text-slate-900 font-extrabold flex items-center', currentSize.text)}>
          Nex<span className="text-indigo-600">Ops</span>
        </span>
      )}
    </div>
  )
}
