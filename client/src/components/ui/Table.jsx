import { cn } from '@/utils/cn'

export function Table({ children, className, containerClassName, ...props }) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xs',
        containerClassName
      )}
    >
      <table className={cn('w-full text-left text-sm text-slate-600', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className, ...props }) {
  return (
    <thead
      className={cn(
        'border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableBody({ children, className, ...props }) {
  return (
    <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, isClickable = false, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        isClickable ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className, align = 'left', ...props }) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <th
      className={cn(
        'px-5 py-3.5 whitespace-nowrap font-semibold',
        alignments[align] || alignments.left,
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className, align = 'left', ...props }) {
  const alignments = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <td
      className={cn(
        'px-5 py-4 whitespace-nowrap text-slate-700',
        alignments[align] || alignments.left,
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

export function TableEmpty({ colSpan, message = 'No records found.' }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-12 text-center text-sm font-medium text-slate-400"
      >
        {message}
      </td>
    </tr>
  )
}
